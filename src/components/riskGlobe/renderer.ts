import * as THREE from 'three';
import { land } from './land.js';
import type { GlobeFrame, GlobePalette, GlobeLabel } from './types.js';
const position = (lon: number, lat: number, radius = 1) => {
  const a = (lat * Math.PI) / 180,
    b = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.cos(a) * Math.sin(b),
    radius * Math.sin(a),
    radius * Math.cos(a) * Math.cos(b),
  );
};
/** One event-driven renderer for hero and film. It has no animation loop or clock. */
export function createGlobeRenderer(
  canvas: HTMLCanvasElement,
  palette: GlobePalette,
  lowPower: boolean,
  onLabels: (labels: GlobeLabel[]) => void,
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.995, 48, 32),
    new THREE.MeshBasicMaterial({ color: palette.surface }),
  );
  scene.add(sphere);
  const dots = new THREE.BufferGeometry().setFromPoints(
    land.filter((_, i) => !lowPower || i % 2 === 0).map(([lon, lat]) => position(lon, lat, 1.003)),
  );
  scene.add(
    new THREE.Points(
      dots,
      new THREE.PointsMaterial({ color: palette.land, size: 0.007, sizeAttenuation: true }),
    ),
  );
  for (const lat of [-60, -30, 0, 30, 60]) {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 121 }, (_, i) => position(i * 3 - 180, lat, 1.002)),
    );
    scene.add(
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color: palette.outline, transparent: true, opacity: 0.45 }),
      ),
    );
  }
  const origin = position(-80, 26, 1.22),
    carrier = position(8, 47, 1.22);
  const normal = new THREE.Vector3().crossVectors(origin, carrier).normalize();
  const ringPoint = (angle: number) => origin.clone().applyAxisAngle(normal, angle);
  const span = origin.angleTo(carrier);
  const ringGeometry = new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 181 }, (_, i) => ringPoint((i * Math.PI) / 90)),
  );
  const ring = new THREE.Line(
    ringGeometry,
    new THREE.LineDashedMaterial({ color: palette.outline, dashSize: 0.025, gapSize: 0.025 }),
  );
  ring.computeLineDistances();
  scene.add(ring);
  const pathGeometry = new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 101 }, (_, i) => ringPoint((span * i) / 100)),
  );
  scene.add(new THREE.Line(pathGeometry, new THREE.LineBasicMaterial({ color: palette.text })));
  const packet = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.025),
    new THREE.MeshBasicMaterial({ color: palette.origin }),
  );
  scene.add(packet);
  const nodes = Array.from({ length: 5 }, (_, i) => {
    const point = ringPoint((span * i) / 4);
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.025, 0.004, 8, 24),
      new THREE.MeshBasicMaterial({ color: palette.text }),
    );
    mesh.position.copy(point);
    mesh.lookAt(point.clone().multiplyScalar(2));
    scene.add(mesh);
    return mesh;
  });
  const tiles = new THREE.Group();
  scene.add(tiles);
  for (let i = 0; i < 41; i++) {
    const tile = new THREE.Mesh(
      new THREE.PlaneGeometry(0.023, 0.016),
      new THREE.MeshBasicMaterial({
        color: [9, 17, 30].includes(i) ? palette.origin : palette.provider,
        side: THREE.DoubleSide,
      }),
    );
    tile.position.set(((i % 7) - 3) * 0.029, (Math.floor(i / 7) - 3) * 0.022, 0);
    tiles.add(tile);
  }
  const gates = Array.from({ length: 6 }, (_, i) => {
    const point = ringPoint(span * (0.3 + i * 0.055));
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.003, 8, 32),
      new THREE.MeshBasicMaterial({ color: i === 5 ? palette.origin : palette.provider }),
    );
    mesh.position.copy(point);
    mesh.lookAt(point.clone().multiplyScalar(2));
    scene.add(mesh);
    return mesh;
  });
  const beads = Array.from({ length: 10 }, (_, i) => {
    const automated = [0, 2, 4].includes(i);
    const mesh = new THREE.Mesh(
      automated
        ? new THREE.TorusGeometry(0.013, 0.003, 8, 20)
        : new THREE.SphereGeometry(0.013, 12, 8),
      new THREE.MeshBasicMaterial({ color: automated ? palette.provider : palette.text }),
    );
    mesh.position.copy(ringPoint((span * i) / 9));
    mesh.lookAt(mesh.position.clone().multiplyScalar(2));
    scene.add(mesh);
    return mesh;
  });
  const markerGroup = new THREE.Group();
  scene.add(markerGroup);
  let markerKey = '';
  const disposeObject = (object: THREE.Object3D) =>
    object.traverse((entry) => {
      const mesh = entry as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material)
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) =>
          m.dispose(),
        );
    });
  const update = (frame: GlobeFrame) => {
    const rawProgress = Math.max(0, Math.min(1, frame.progress));
    const p = frame.reducedMotion
      ? Math.min(1, (Math.floor(rawProgress * 7) + 0.999) / 7)
      : rawProgress;
    // Seven segments: hero plus six film shots. Scroll alone selects position.
    const shot = Math.min(6, Math.floor(p * 7));
    const beat = (p * 7) % 1;
    const view = frame.seat === 'underwriter' ? 1 : frame.seat === 'capacity' ? 2 : 0;
    const cameraKeys = [
      [-32, 24, 4.0],
      [-32, 24, 3.8],
      [-66, 29, 2.5],
      [-25, 39, 2.8],
      [-30, 35, 3.7],
      [15, 44, 2.8],
      [-32, 24, 3.9],
    ];
    const a = cameraKeys[shot],
      b = cameraKeys[Math.min(6, shot + 1)];
    const t = frame.reducedMotion ? 1 : beat;
    const lon = a[0] + (b[0] - a[0]) * t + (view === 1 ? 55 : view === 2 ? -25 : 0);
    const lat = a[1] + (b[1] - a[1]) * t + (view === 2 ? 20 : 0);
    camera.position.copy(position(lon, lat, a[2] + (b[2] - a[2]) * t));
    camera.lookAt(0, 0, 0);
    packet.position.copy(ringPoint(span * Math.min(1, p * 1.6)));
    packet.visible = shot < 5;
    tiles.position.copy(ringPoint(span * 0.25));
    tiles.lookAt(camera.position);
    tiles.visible = shot === 2;
    gates.forEach((g) => {
      g.visible = shot === 3;
    });
    beads.forEach((b, i) => {
      b.visible = shot >= 5 && (frame.reducedMotion || i <= beat * 10 || shot === 6);
    });
    nodes.forEach((n, i) => n.scale.setScalar(i === Math.min(4, shot) ? 1.4 : 1));
    const key = JSON.stringify(frame.markers);
    if (key !== markerKey) {
      markerKey = key;
      disposeObject(markerGroup);
      markerGroup.clear();
      for (const marker of frame.markers) {
        const at = position(marker.longitude, marker.latitude, 1.015);
        const mesh = new THREE.Mesh(
          marker.kind === 'provider'
            ? new THREE.OctahedronGeometry(0.017)
            : new THREE.SphereGeometry(0.012, 12, 8),
          new THREE.MeshBasicMaterial({
            color: marker.kind === 'provider' ? palette.provider : palette.origin,
          }),
        );
        mesh.position.copy(at);
        markerGroup.add(mesh);
        if (marker.matched) {
          const from = ringPoint(span * 0.75);
          const mid = from.clone().add(at).normalize().multiplyScalar(1.65);
          const curve = new THREE.QuadraticBezierCurve3(from, mid, at);
          markerGroup.add(
            new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
              new THREE.LineBasicMaterial({ color: palette.provider }),
            ),
          );
        }
      }
    }
    const width = Math.max(1, canvas.clientWidth),
      height = Math.max(1, canvas.clientHeight);
    if (
      canvas.width !== Math.round(width * renderer.getPixelRatio()) ||
      canvas.height !== Math.round(height * renderer.getPixelRatio())
    )
      renderer.setSize(width, height, false);
    camera.position.multiplyScalar(Math.max(1, height / width));
    camera.lookAt(0, 0, 0);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    const labels: GlobeLabel[] = [];
    const candidates = nodes.map((node, i) => ({
      id: `node-${i}`,
      text: ['01 Intake', '02 Structure', '03 Readiness', '04 Match', '05 Bind · by the carrier'][
        i
      ],
      point: node.position.clone().multiplyScalar(1.06),
    }));
    for (const marker of frame.markers)
      candidates.push({
        id: marker.id,
        text: marker.label,
        point: position(marker.longitude, marker.latitude, 1.08),
      });
    for (const candidate of candidates) {
      if (labels.length >= (width < 900 ? 6 : 10)) break;
      if (candidate.point.clone().normalize().dot(camera.position.clone().normalize()) < 0.1)
        continue;
      const projected = candidate.point.clone().project(camera);
      const labelWidth = Math.min(width - 24, Math.max(100, candidate.text.length * 7 + 16));
      const x = Math.max(
        12,
        Math.min(width - labelWidth - 12, ((projected.x + 1) * width) / 2 - labelWidth / 2),
      );
      let y = Math.max(64, Math.min(height - 125, ((1 - projected.y) * height) / 2));
      const overlaps = () =>
        labels.some(
          (label) => Math.abs(label.y - y) < 38 && Math.abs(label.x - x) < labelWidth + 24,
        );
      if (overlaps()) y += 40;
      if (overlaps() || y > height - 125) continue;
      labels.push({ id: candidate.id, text: candidate.text, x, y });
    }
    onLabels(labels);
  };
  return {
    update,
    dispose() {
      disposeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
