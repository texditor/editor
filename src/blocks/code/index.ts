import { BlockModelInterface } from "@/types/core/models";
import BlockModel from "@/core/models/block-model";
import { CodeCreateOptions } from "@/types/blocks/code-create-options";
import "@/styles/blocks/code.css";
import { OutputBlockItem } from "@/types/output";
import { HTMLBlockElement } from "@/types/core";
import { appendText } from "@/utils/dom";
import { IconCode } from "@/icons";
import { decodeHtmlSpecialChars } from "@/utils/common";

export default class Code extends BlockModel implements BlockModelInterface {
  configure() {
    return {
      autoParse: false,
      tagName: "code",
      translationCode: "code",
      type: "code",
      shortType: "c",
      icon: IconCode,
      cssClasses: "tex-code",
      placeholder: this.editor.i18n.get("codePlaceholder", "Enter your code"),
      editable: true,
      emptyDetect: true,
      sanitizer: false,
      rawOutput: true,
      backspaceRemove: false,
      isEnterCreate: false,
      pasteAlwaysText: true
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
