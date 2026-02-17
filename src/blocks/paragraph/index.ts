import type {
  BlockModelInterface,
  ParagraphCreateOptions,
  HTMLBlockElement
} from "@/types";
import BlockModel from "@/core/models/block-model";
import "@/styles/blocks/paragraph.css";
import { IconParagraph } from "@/icons";

export default class Paragraph extends BlockModel implements BlockModelInterface {
  configure() {
    return {
      icon: IconParagraph,
      autoParse: true,
      translationCode: "paragraph",
      tagName: "p",
      type: "p",
      placeholder: this.editor.i18n.get("paragraphPlaceholder", "Enter your text"),
      editable: true,
      toolbar: true,
      sanitizer: true,
      normalize: true,
      cssClasses: "tex-paragraph",
      emptyDetect: true,
      convertible: true,
      sanitizerConfig: {
        elements: ["b", "a", "i", "s", "u", "sup", "sub"],
        attributes: {
          a: ["href", "target"]
        },
        protocols: {
          a: {
            href: ["https", "ftp", "http", "mailto"]
          }
        }
      }
    };
  }

  create(options?: ParagraphCreateOptions): HTMLElement {
    return this.make("div", (el: HTMLBlockElement) => {
      if (options?.content) el.innerHTML = options.content;
    });
  }
}
