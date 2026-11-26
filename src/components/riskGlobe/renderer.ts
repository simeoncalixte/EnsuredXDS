import * as THREE from 'three';
import { cameraAt } from './camera.js';
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
  const origin = position(-80.19, 25.76, 1.28),
    carrier = position(8.54, 47.37, 1.28);
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
  const packet = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.045, 0.06),
      new THREE.MeshBasicMaterial({ color: palette.text, side: THREE.DoubleSide }),
    );
    paper.position.set((i - 1.5) * 0.018, (i - 1.5) * 0.008, i * 0.004);
    paper.rotation.z = (i - 1.5) * 0.12;
    packet.add(paper);
  }
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
  const capacityPreview = new THREE.Group();
  scene.add(capacityPreview);
  const fence = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      position(-88, 25, 1.02),
      position(-76, 25, 1.02),
      position(-76, 36, 1.02),
      position(-88, 36, 1.02),
    ]),
    new THREE.LineDashedMaterial({ color: palette.provider, dashSize: 0.02, gapSize: 0.02 }),
  );
  fence.computeLineDistances();
  capacityPreview.add(fence);
  for (let i = 0; i < 12; i++) {
    const sample = new THREE.Mesh(
      new THREE.SphereGeometry(0.01, 10, 8),
      new THREE.MeshBasicMaterial({ color: i < 3 ? palette.provider : palette.outline }),
    );
    sample.position.copy(
      position(
        i < 3 ? -85 + i * 3 : -119 + (i - 3) * 5,
        i < 3 ? 28 + i * 2 : 39 + (i % 3) * 3,
        1.015,
      ),
    );
    capacityPreview.add(sample);
  }
  const markerGroup = new THREE.Group();
  scene.add(markerGroup);
  let markerKey = '';
  const matchArcs: THREE.Line[] = [];
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
    const beat = p === 1 ? 1 : (p * 7) % 1;
    const framing =
      shot === 0
        ? { lon: -32, lat: 24, d: 4, fov: 38, look: [0, 0, 0] }
        : cameraAt(shot, frame.reducedMotion ? 1 : beat, frame.seat);
    camera.position.copy(position(framing.lon, framing.lat, framing.d));
    camera.fov = framing.fov;
    const target = position(framing.look[1], framing.look[0], framing.look[2]);
    camera.lookAt(target);
    const capacity = frame.seat === 'capacity';
    capacityPreview.visible = capacity && shot >= 1;
    markerGroup.visible = !capacity || shot === 0;
    const stageProgress = Math.max(0, Math.min(1, (beat - 0.15) / 0.6));
    packet.visible = shot === 0 || (shot === 2 && beat < 0.48 && frame.seat !== 'underwriter');
    const launch = new THREE.CatmullRomCurve3([
      position(-80.19, 25.76, 1.03),
      origin,
      ringPoint(span * 0.25),
    ]);
    packet.position.copy(shot === 2 ? launch.getPoint(Math.min(1, beat / 0.48)) : origin);
    packet.lookAt(camera.position);
    const isUnderwriter = frame.seat === 'underwriter';
    const unfold = isUnderwriter || shot !== 2 ? 1 : Math.max(0, Math.min(1, (beat - 0.45) / 0.17));
    tiles.visible = (shot === 2 && unfold > 0) || shot === 3;
    tiles.position.copy(
      ringPoint(
        span *
          (shot === 3
            ? 0.24 + stageProgress * 0.36
            : isUnderwriter
              ? 0.3 + 0.68 * stageProgress
              : 0.25),
      ),
    );
    tiles.lookAt(camera.position);
    tiles.children.forEach((child, i) => {
      const tile = child as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
      tile.position.set(
        ((i % 7) - 3) * 0.029 * unfold,
        (Math.floor(i / 7) - 3) * 0.022 * unfold,
        0,
      );
      tile.material.color.set(
        [9, 17, 30].includes(i) && shot === 2 && beat < 0.8 && !isUnderwriter
          ? palette.origin
          : palette.text,
      );
    });
    gates.forEach((g, i) => {
      g.visible = shot === 3 && !isUnderwriter;
      const passed = stageProgress > (i + 1) / 7;
      g.material.color.set(
        passed ? (i === 5 ? palette.origin : palette.provider) : palette.outline,
      );
      g.scale.setScalar(passed ? 1.15 : 1);
    });
    beads.forEach((b, i) => {
      b.visible = shot >= 5 && (frame.reducedMotion || i <= beat * 10 || shot === 6);
    });
    nodes.forEach((n, i) => n.scale.setScalar(i === Math.min(4, shot) ? 1.4 : 1));
    const key = JSON.stringify([shot > 0, frame.markers]);
    if (key !== markerKey) {
      markerKey = key;
      disposeObject(markerGroup);
      markerGroup.clear();
      matchArcs.length = 0;
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
        if (shot > 0 ? ['c', 'd', 'f'].includes(marker.id) : marker.matched) {
          const from = ringPoint(span * 0.75);
          const mid = from.clone().add(at).normalize().multiplyScalar(1.65);
          const curve = new THREE.QuadraticBezierCurve3(from, mid, at);
          const arc = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
            new THREE.LineBasicMaterial({ color: palette.provider, transparent: true }),
          );
          matchArcs.push(arc);
          markerGroup.add(arc);
        }
      }
    }
    matchArcs.forEach((arc, i) => {
      arc.visible = shot === 0 || shot === 6 || (shot === 4 && beat > 0.2 + i * 0.1);
      (arc.material as THREE.LineBasicMaterial).opacity = shot === 4 && beat < 0.7 ? 0.5 : 1;
    });
    if (capacity) {
      packet.visible = false;
      tiles.visible = false;
      gates.forEach((g) => {
        g.visible = false;
      });
      beads.forEach((b) => {
        b.visible = false;
      });
    }
    const width = Math.max(1, canvas.clientWidth),
      height = Math.max(1, canvas.clientHeight);
    if (
      canvas.width !== Math.round(width * renderer.getPixelRatio()) ||
      canvas.height !== Math.round(height * renderer.getPixelRatio())
    )
      renderer.setSize(width, height, false);
    camera.position.multiplyScalar(Math.max(1, height / width));
    camera.lookAt(target);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    const labels: GlobeLabel[] = [];
    const detailObject =
      shot === 2
        ? tiles.position
        : shot === 4
          ? nodes[3].position
          : shot === 5
            ? beads[5].position
            : origin;
    const projectedDetail = detailObject.clone().project(camera);
    const detailAnchor = {
      id: 'detail-anchor',
      text: '',
      x: ((projectedDetail.x + 1) * width) / 2,
      y: ((1 - projectedDetail.y) * height) / 2,
    };
    const cardWidth = Math.min(360, width * 0.48);
    const cardLeft = Math.max(
      12,
      Math.min(
        width - cardWidth - 12,
        detailAnchor.x > width / 2 ? detailAnchor.x - cardWidth - 32 : detailAnchor.x + 32,
      ),
    );
    const cardTop = Math.max(64, Math.min(height * 0.35 - 24, detailAnchor.y - 40));
    const candidates: (Pick<GlobeLabel, 'id' | 'text' | 'kind' | 'targetId' | 'accessibleLabel'> & {
      point: THREE.Vector3;
    })[] = nodes.map((node, i) => ({
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
    const chipText =
      frame.seat === 'capacity'
        ? 'Pending · Institutional capacity preview · Matching unavailable'
        : shot === 2
          ? beat < 0.72
            ? 'PLATFORM · Tue 08:41 ET · Drafted 41 fields; 3 flagged'
            : 'PERSON · Tue 09:12 ET · Broker confirms the source fields'
          : shot === 3
            ? isUnderwriter
              ? beat < 0.55
                ? 'PLATFORM · Tue 10:40 ET · Appetite fits; authority exceeded'
                : 'PERSON · Tue 11:05 ET · Underwriter refers to senior authority'
              : beat < 0.78
                ? 'PLATFORM · Tue 09:30 ET · Wind form outstanding'
                : 'PERSON · Tue 09:34 ET · Broker discloses the gap'
            : shot === 4
              ? isUnderwriter
                ? 'PERSON · Wed 08:10 ET · Carrier D v2 supersedes v1'
                : beat < 0.7
                  ? 'PLATFORM · Tue 09:36 ET · Suggests C, D and F'
                  : 'PERSON · Tue 09:48 ET · Broker sends to C, D and F'
              : shot === 5
                ? 'PERSON · Fri 05:00 ET / 11:00 CET · Carrier D binds approved v2'
                : '';
    if (chipText)
      candidates.unshift({
        id: 'decision-chip',
        text: chipText,
        kind:
          chipText.startsWith('PLATFORM') || chipText.startsWith('Pending') ? 'platform' : 'person',
        point: detailObject.clone().multiplyScalar(1.04),
      });
    if (shot >= 5 && frame.seat !== 'capacity') {
      const recordLabels = beads.flatMap((bead, i) =>
        bead.visible && frame.records?.[i]
          ? [
              {
                id: `record-${i}`,
                text: String(i + 1),
                kind: 'record' as const,
                point: bead.position.clone().multiplyScalar(1.08),
                targetId: frame.records[i].targetId,
                accessibleLabel: `Example record ${i + 1}: ${frame.records[i].label}`,
              },
            ]
          : [],
      );
      candidates.splice(chipText ? 1 : 0, 0, ...recordLabels);
    }
    for (const candidate of candidates) {
      if (labels.length >= (window.innerWidth < 600 ? 6 : 20)) break;
      if (candidate.point.clone().normalize().dot(camera.position.clone().normalize()) < 0.1)
        continue;
      const projected = candidate.point.clone().project(camera);
      const labelWidth =
        candidate.kind === 'record'
          ? 44
          : Math.min(
              width - 24,
              candidate.kind
                ? frame.hasDetail && window.innerWidth >= 1100
                  ? Math.max(
                      100,
                      Math.min(280, Math.max(cardLeft - 36, width - cardLeft - cardWidth - 36)),
                    )
                  : 280
                : 240,
              Math.max(100, candidate.text.length * 7 + 16),
            );
      const labelHeight =
        candidate.kind === 'record'
          ? 44
          : Math.ceil((candidate.text.length * 7) / Math.max(1, labelWidth - 12)) * 19 + 6;
      const anchorX = ((projected.x + 1) * width) / 2;
      const anchorY = ((1 - projected.y) * height) / 2;
      const baseX = Math.max(12, Math.min(width - labelWidth - 12, anchorX - labelWidth / 2));
      const baseY = Math.max(64, Math.min(height - labelHeight - 16, anchorY));
      let x = baseX,
        y = baseY;
      const overlaps = () =>
        labels.some(
          (label) =>
            y < label.y + (label.height ?? 38) + 12 &&
            y + labelHeight + 12 > label.y &&
            x < label.x + (label.width ?? 100) + 24 &&
            x + labelWidth + 24 > label.x,
        );
      const inCard = () =>
        Boolean(
          frame.hasDetail &&
          window.innerWidth >= 1100 &&
          x + labelWidth > cardLeft - 24 &&
          x < cardLeft + cardWidth + 24 &&
          y + labelHeight > cardTop - 24 &&
          y < cardTop + height * 0.65 + 24,
        );
      const offsets =
        candidate.kind === 'record'
          ? [
              [0, 0],
              [0, 60],
              [0, -60],
              [0, 120],
              [0, -120],
              [-68, 60],
              [68, 60],
              [-136, 60],
              [136, 60],
              [-68, 120],
              [68, 120],
              [0, 180],
              [0, -180],
            ]
          : [
              [0, 0],
              [0, labelHeight + 16],
              [0, -labelHeight - 16],
            ];
      let placed = false;
      for (const [dx, dy] of offsets) {
        x = Math.max(12, Math.min(width - labelWidth - 12, baseX + dx));
        y = Math.max(64, Math.min(height - labelHeight - 16, baseY + dy));
        if (inCard() && (candidate.kind === 'platform' || candidate.kind === 'person')) {
          if (cardLeft > labelWidth + 36) x = cardLeft - labelWidth - 24;
          else if (width - cardLeft - cardWidth > labelWidth + 36) x = cardLeft + cardWidth + 24;
          else if (cardTop - labelHeight - 24 >= 12) y = cardTop - labelHeight - 24;
          else y = cardTop + height * 0.65 + 24;
        }
        if (!overlaps() && !inCard() && y + labelHeight <= height - 12) {
          placed = true;
          break;
        }
      }
      if (!placed && candidate.kind === 'record') {
        const slots: { x: number; y: number; distance: number }[] = [];
        for (let sy = 64; sy + 44 <= height - 16; sy += 60)
          for (let sx = 12; sx + 44 <= width - 12; sx += 68)
            slots.push({ x: sx, y: sy, distance: (sx - baseX) ** 2 + (sy - baseY) ** 2 });
        slots.sort((a, b) => a.distance - b.distance);
        for (const slot of slots) {
          x = slot.x;
          y = slot.y;
          if (!overlaps() && !inCard()) {
            placed = true;
            break;
          }
        }
      }
      if (!placed) continue;
      labels.push({
        id: candidate.id,
        text: candidate.text,
        x,
        y,
        anchorX,
        anchorY,
        width: labelWidth,
        height: labelHeight,
        kind: candidate.kind,
        targetId: candidate.targetId,
        accessibleLabel: candidate.accessibleLabel,
      });
    }
    if (frame.hasDetail) labels.push(detailAnchor);
    onLabels(labels);
  };
  return {
    update,
    setPalette(next: GlobePalette) {
      const keys = Object.keys(palette) as (keyof GlobePalette)[];
      const old = keys.map((key) => [key, new THREE.Color(palette[key]).getHex()] as const);
      scene.traverse((object) => {
        const material = (object as THREE.Mesh).material;
        if (!material) return;
        for (const item of Array.isArray(material) ? material : [material]) {
          const colored = item as THREE.MeshBasicMaterial;
          if (!colored.color) continue;
          const token = old.find(([, hex]) => hex === colored.color.getHex())?.[0];
          if (token) colored.color.set(next[token]);
        }
      });
      Object.assign(palette, next);
    },
    dispose() {
      disposeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
