import { RenderIconContent, RenderIconOptions } from "@/types";


export function renderIcon(
  content: RenderIconContent,
  options?: RenderIconOptions
): string {
  const opt = {
    classes: "",
    width: 24,
    height: 24,
    ...options
  };

  if (typeof content === "string") {
    return (
      "<svg  " +
      (opt.classes ? opt.classes : "") +
      ' xmlns="http://www.w3.org/2000/svg" class="tex-icon"  width="' +
      opt.width +
      '" height="' +
      opt.height +
      '" fill="none" viewBox="0 0 24 24" >' +
      content +
      "</svg>"
    );
  }

  if (typeof content === "object" && content.raw) {
    return content.raw;
  }

  return "";
}
