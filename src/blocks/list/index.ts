import type { BlockModelConfig, BlockModelInterface } from "@/types";
import BlockModel from "@/core/models/block-model";
import "@/styles/blocks/list.css";
import { IconList } from "@/icons";

export default class List extends BlockModel implements BlockModelInterface {
  protected configure(): Partial<BlockModelConfig> {
    return {
      autoParse: true,
      autoMerge: true,
      translationCode: "list",
      groupCode: "list",
      tagName: "ul",
      type: "ul",
      itemTagName: 'li',
      itemType: 'li',
      itemClassName: "tex-list-item",
      itemBodyClassName: "tex-list-item-body",
      icon: IconList,
      editable: false,
      editableItems: true,
      visibleTools: true,
      sanitizer: true,
      normalize: true,
      convertible: true,
      cssClasses: "tex-list",
      sortableItems: true,
      sanitizerConfig: {
        elements: [
          "b",
          "a",
          "i",
          "s",
          "u",
          "sup",
          "sub",
          "mark",
          "code"
        ],
        attributes: {
          a: ["href", "target"]
        },
        protocols: {
          a: {
            href: [
              "https",
              "ftp",
              "http",
              "mailto"
            ]
          }
        }
      }
    };
  }
}
