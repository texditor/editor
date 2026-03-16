import type {
  BlockModelInterface,
  ListCreateOptions,
} from "@/types";
import BlockModel from "@/core/models/block-model";
import "@/styles/blocks/list.css";
import { IconList } from "@/icons";

export default class List extends BlockModel implements BlockModelInterface {
  configure() {
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
      toolbar: true,
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

  create(options?: ListCreateOptions): HTMLElement {
    return this.make(
      this.getTagName(),
      ({ contentNode }: { contentNode: HTMLElement }) => {
        let content = options?.content || '';

        if (!content) {
          content = this.makeItemNode('').outerHTML;
        }

        contentNode.innerHTML = content;
      }
    );
  }
}
