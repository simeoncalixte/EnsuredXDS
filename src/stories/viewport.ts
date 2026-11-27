/**
 * Viewport-specific stories (AIN-354).
 *
 * A story whose assertions depend on a media query declares the width it is
 * written for with `storyViewport(width)`. That sets both the Storybook
 * viewport addon default (used in the Storybook UI) and
 * `parameters.xds.viewportWidth` (read by test runners that load
 * `iframe.html` directly, which must open the page at that width).
 *
 * The play function calls `expectStoryViewport(width)` first. If the story is
 * run at any other width it fails with a message naming the width it needs,
 * so it can't pass just because the runner used the wrong width.
 */
export type StoryViewportWidth = 375 | 390 | 768 | 1280 | 1440;

export const storyViewports = {
  xds375: { name: '375 px', styles: { width: '375px', height: '812px' }, type: 'mobile' },
  xds390: { name: '390 px', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  xds768: { name: '768 px', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
  xds1280: { name: '1280 px', styles: { width: '1280px', height: '900px' }, type: 'desktop' },
  xds1440: { name: '1440 px', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
};

export const storyViewport = (width: StoryViewportWidth) => ({
  viewport: { defaultViewport: `xds${width}` },
  xds: { viewportWidth: width },
});

export function expectStoryViewport(width: StoryViewportWidth): void {
  const actual = window.innerWidth;
  if (actual !== width) {
    throw new Error(
      `This story is written for a ${width} px viewport but ran at ${actual} px. ` +
        `Open it at ${width} px (parameters.xds.viewportWidth) for its checks to mean anything.`,
    );
  }
}
