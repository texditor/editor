import type {
  BlockModelInterface,
  ParagraphCreateOptions
} from "@/types";
import BlockModel from "@/core/models/block-model";
import "@/styles/blocks/paragraph.css";
import { IconParagraph } from "@/icons";

export default class Paragraph
  extends BlockModel
  implements BlockModelInterface {
  configure() {
    return {
      icon: IconParagraph,
      autoParse: true,
      translationCode: "paragraph",
      groupCode: "paragraph",
      tagName: "p",
      type: "p",
      placeholder: this.editor.i18n.get(
        "paragraphPlaceholder",
        "Enter your text"
      ),
      editable: true,
      toolbar: true,
      sanitizer: true,
      normalize: true,
      cssClasses: "tex-paragraph",
      emptyDetect: true,
      convertible: true,
      sanitizerConfig: {
        elements: ["b", "a", "i", "s", "u", "sup", "sub", "mark", "code"],
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
    return this.make(
      this.getTagName(),
      ({ contentNode }: { contentNode: HTMLElement }) => {
        if (options?.content) contentNode.innerHTML = options.content;
      }
    );
  }
}
