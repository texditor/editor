/**
 * Module to compose output JSON preview
 */
interface PreviewModule {
  show: (output: object, holder: HTMLElement) => void;
}

const jsonPreview = (function (module: PreviewModule): PreviewModule {
  module.show = function (output: object, holder: HTMLElement): void {
    let formattedOutput = JSON.stringify(output, null, 4);
    formattedOutput = encodeHTMLEntities(formattedOutput);
    formattedOutput = stylize(formattedOutput);
    holder.innerHTML = formattedOutput;
  };

  function encodeHTMLEntities(string: string): string {
    return string.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function stylize(string: string): string {
    string = string.replace(/"(\w+)"\s?:/g, '"<span class=sc_key>$1</span>" :');
    string = string.replace(
      /"(paragraph|quote|list|header|link|code|image|delimiter|raw|checklist|table|embed|warning)"/g,
      '"<span class=sc_toolname>$1</span>"'
    );
    string = string.replace(/(&lt;[/a-z]+(&gt;)?)/gi, "<span class=sc_tag>$1</span>");
    string = string.replace(/"([^"]+)"/gi, '"<span class=sc_attr>$1</span>"');
    string = string.replace(/\b(true|false|null)\b/gi, "<span class=sc_bool>$1</span>");
    return string;
  }

  return module;
})({} as PreviewModule);

export default jsonPreview;
