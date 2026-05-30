import type { RenderIconContent, RenderIconOptions } from '@/types';

/**
 * Renders an SVG icon as an HTML string
 * @param content - SVG path content as string or object with raw SVG string
 * @param options - Optional configuration for icon rendering
 * @param options.classes - Additional CSS classes to apply to the SVG element
 * @param options.width - Width of the icon in pixels (default: 24)
 * @param options.height - Height of the icon in pixels (default: 24)
 * @returns Complete SVG element HTML string or empty string if content is invalid
 */
export function renderIcon(content: RenderIconContent, options?: RenderIconOptions): string {
  const opt = {
    classes: '',
    width: 24,
    height: 24,
    ...options,
  };

  if (typeof content === 'string') {
    return (
      '<svg  ' +
      (opt.classes ? opt.classes : '') +
      ' xmlns="http://www.w3.org/2000/svg" class="tex-icon"  width="' +
      opt.width +
      '" height="' +
      opt.height +
      '" fill="none" viewBox="0 0 24 24" >' +
      content +
      '</svg>'
    );
  }

  if (typeof content === 'object' && content.raw) {
    return content.raw;
  }

  return '';
}
