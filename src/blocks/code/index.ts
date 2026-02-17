import type {
  BlockModelInterface,
  OutputBlockItem,
  HTMLBlockElement,
  CodeCreateOptions
} from "@/types";
import BlockModel from "@/core/models/block-model";
import { appendText } from "@/utils/dom";
import { IconCode } from "@/icons";
import { decodeHtmlSpecialChars } from "@/utils/common";
import "@/styles/blocks/code.css";

export default class Code extends BlockModel implements BlockModelInterface {
  configure() {
    return {
      autoParse: false,
      tagName: "code",
      translationCode: "code",
      type: "code",
      icon: IconCode,
      cssClasses: "tex-code",
      placeholder: this.editor.i18n.get("codePlaceholder", "Enter your code"),
      editable: true,
      emptyDetect: true,
      sanitizer: false,
      rawOutput: true,
      backspaceRemove: false,
      isEnterCreate: false,
      preformatted: true,
      convertible: true
    };
  }

  create(options?: CodeCreateOptions): HTMLBlockElement | HTMLElement {
    return this.make("pre", (el: HTMLBlockElement) => {
      if (options?.content) appendText(el, options.content);
    });
  }

  parse(item: OutputBlockItem) {
    return this.create({
      content: typeof item.data[0] === "string" ? decodeHtmlSpecialChars(item.data[0]) : ""
    });
  }
}
