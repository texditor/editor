interface RenderIconOptions {
  width?: number;
  height?: number;
  classes?: string;
}

export default function renderIcon(content: string, options?: RenderIconOptions) {
  const opt = {
    classes: "",
    width: 24,
    height: 24,
    ...options
  };

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
