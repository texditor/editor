import type {
  BlockModelInterface,
  HeaderCreateOptions,
  BlockNode,
  BlockCreateOptions
} from "@/types";
import BlockModel from "@/core/models/block-model";
import { IconHeader1 } from "@/icons";

export default class Header extends BlockModel implements BlockModelInterface {
  configure() {
    return {
      autoParse: true,
      icon: IconHeader1,
      translationCode: "header1",
      groupCode: 'header',
      tagName: "h1",
      type: "h1",
      placeholder: this.editor.i18n.get(
        "headerPlaceholder",
        "Enter your title"
      ),
      cssClasses: "tex-header",
      editable: true,
      toolbar: true,
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
