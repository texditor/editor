import type { BlockModelConfig, BlockModelInterface } from "@/types";
import BlockModel from "@/core/models/block-model";
import "@/styles/blocks/paragraph.css";
import { IconParagraph } from "@/icons";

export default class Paragraph
  extends BlockModel
   {
  protected configure(): Partial<BlockModelConfig> {
    return {
      name: "p",
      icon: IconParagraph,
      autoParse: true,
      translation: "paragraph",
      groupCode: "paragraph",
      tagName: "p",
      placeholder: this.editor.i18n.get(
        "paragraphPlaceholder",
        "Enter your text"
      ),
      editable: true,
      visibleTools: true,
      sanitizer: true,
      normalize: true,
      className: "tex-paragraph",
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
}
