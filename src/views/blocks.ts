import type { TexditorInterface } from "@/types";
import { addClass, append, isEmptyString, make, sanitizeJson } from "@/utils";

export default function BlocksView(editor: TexditorInterface): HTMLElement {
  const { blockManager, config, parser } = editor;
  const initalData = config.get("initalData", []);
  const emptyData = [{
    type: config.get("defaultBlock", "p"),
    data: [""]
  }];
  let data = [];

  try {
    data =
      typeof initalData === "string"
        ? isEmptyString(initalData)
          ? []
          : JSON.parse(sanitizeJson(initalData.trim()) || "")
        : initalData;
  } catch (e) {
    console.warn(
      "The input data is not supported or contains errors when working with JSON",
      e
    );
  }

  if (config.get("autofocus", true))
    setTimeout(() => blockManager.focus(0), 10);

  const blocks = parser.parseBlocks(data?.length ? data : emptyData);

  return make("div", (el: HTMLElement) => {
    addClass(el, 'tex-blocks');

    if (blocks.length)
      append(el, blocks);
  });
}
