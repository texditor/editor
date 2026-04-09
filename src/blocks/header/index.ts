import type { BlockModelConfig, BlockModelInterface } from "@/types";
import BlockModel from "@/core/models/block-model";
import { IconHeader1 } from "@/icons";

export default class Header extends BlockModel implements BlockModelInterface {
  protected configure(): Partial<BlockModelConfig> {
    return {
      name: "h1",
      translation: "header1",
      groupCode: 'header',
      tagName: "h1",
      className: "tex-header",
      autoParse: true,
      icon: IconHeader1,
      placeholder: this.editor.i18n.get(
        "headerPlaceholder",
        "Enter your title"
      ),
      editable: true,
      visibleTools: true,
      tools: ["link", "subscript", "superscript", "clearFormating"],
      enterCreate: true,
      emptyDetect: true,
      normalize: true,
      sanitizer: true,
      convertible: true,
      sanitizerConfig: {
        elements: ["a", "sup", "sub"],
        attributes: {
          a: ["href"]
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
