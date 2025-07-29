import Texditor from "@/texditor";
import { HTMLBlockElement } from "@/types/core";
import { BlockModelStructure } from "@/types/core/models";
import { BlockItemData, OutputBlockItem } from "@/types/output";
import { appendText, append, attr, make } from "@/utils/dom";
import { isEmptyString } from "@/utils/string";

export default class Parser {
  editor: Texditor;

  constructor(editor: Texditor) {
    this.editor = editor;
  }

  stripFragmentTags(html: string): string {
    return html.replace(
      /<!--StartFragment-->([^<]*(?:<(?!!--(?:Start|End)Fragment-->)[^<]*)*)<!--EndFragment-->/g,
      "$1"
    );
  }

  parseHtml(html: string, isFragment: boolean = false): Element | null {
    const input = isFragment ? this.stripFragmentTags(html) : html,
      parser = new DOMParser(),
      doc = parser.parseFromString(`<parser-rawblock>${input}</parser-rawblock>`, "text/html");

    return doc.querySelector("parser-rawblock");
  }

  htmlToData(html: string): Array<OutputBlockItem | string> {
    const { events } = this.editor;
    events.trigger("htmlToData", html);

    const input = html,
      rawblock = this.parseHtml(input);

    if (!rawblock) {
      return [];
    }

    const nodes: NodeListOf<ChildNode> = rawblock.childNodes;
    const result: Array<OutputBlockItem | string> = [];

    if (nodes.length > 0) {
      if (
        !(
          (nodes.length === 1 && nodes[0]!.nodeType === Node.TEXT_NODE) ||
          (nodes[0]!.nodeType === Node.TEXT_NODE && nodes.length === 2 && nodes[1]!.nodeName === "BR")
        )
      ) {
        Array.from(nodes).forEach((node) => {
          events.trigger("htmlToDataNode", node);

          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;

            events.trigger("htmlToDataTextOutput", text);

            if (text?.trim()) result.push(text);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Добавляем проверку на Element
            const element = node as Element; // Приводим к Element вместо HTMLElement
            const objAttr: Record<string, string> = {};
            let outContent: Array<OutputBlockItem | string> = [node.textContent || ""];

            if (node.childNodes.length) {
              const childNodes = node.childNodes;

              if (!(childNodes.length === 1 && childNodes[0]!.nodeType === Node.TEXT_NODE)) {
                outContent = this.htmlToData(element.innerHTML); // Теперь element точно имеет innerHTML
              }
            }

            const outData: OutputBlockItem = {
              type: node.nodeName.toLowerCase(),
              data: outContent as BlockItemData | []
            };

            if (element.attributes.length) {
              Array.from(element.attributes).forEach(({ name, value }) => {
                objAttr[name] = value;
              });
            }

            if (Object.keys(objAttr).length) {
              outData.attr = objAttr;
            }

            events.trigger("htmlToDataElementOutput", outData);
            result.push(outData);
          }
          // Можно добавить обработку других типов узлов (COMMENT_NODE, etc) если нужно
        });
      } else {
        result.push(html);
      }
    }

    events.trigger("htmlToDataEnd", result);

    return this.emptyFilter(result);
  }

  parseBlocks(data: object[], createDefault: boolean = false): Node[] | [] {
    const { api, config } = this.editor,
      models = api.getModels();

    const blocks = make("div", (el: HTMLBlockElement) => {
      (data as OutputBlockItem[]).forEach((item: OutputBlockItem) => {
        (models as BlockModelStructure[]).forEach((formatedModel: BlockModelStructure) => {
          if (formatedModel.types && formatedModel.types.includes(item.type)) {
            const blockModel = new formatedModel.instance(this.editor);

            let elBlock = null;

            if (blockModel.getConfig("autoParse")) {
              elBlock = blockModel.create();

              if (elBlock) {
                append(elBlock, this.parseChilds(item));
                append(el, elBlock);
              }
            } else {
              if (typeof blockModel?.parse !== "undefined") {
                elBlock = blockModel?.parse(item);

                if (elBlock && elBlock !== null) {
                  append(el, elBlock);
                }
              }
            }

            if (blockModel.afterCreate) blockModel.afterCreate(elBlock as HTMLBlockElement);
          }
        });
      });

      if (el.childNodes.length === 0 && createDefault) {
        (models as BlockModelStructure[]).forEach((formatedModel: BlockModelStructure) => {
          if (formatedModel.types && formatedModel.types.includes(config.get("defaultBlock", "p"))) {
            const blockModel = new formatedModel.instance(this.editor);

            if (blockModel) {
              const elBlock = blockModel.create();

              if (elBlock) append(el, elBlock);
            }

            if (blockModel.afterCreate) blockModel.afterCreate();
          }
        });
      }
    });

    return blocks.childNodes.length ? Array.from(blocks.childNodes) : [];
  }

  parseChilds(block: OutputBlockItem, childRender: boolean = false): Node | Node[] {
    if (block.data !== null && block.data !== undefined && block.type !== undefined) {
      const element = make(block.type);

      if (Array.isArray(block.data)) {
        (block.data as (OutputBlockItem | string)[]).forEach((item: OutputBlockItem | string) => {
          if (typeof item === "string") {
            appendText(element, item);
          } else {
            append(element, this.parseChilds(item, true) as HTMLElement);
          }
        });
      } else if (typeof block.data === "string") appendText(element, block.data);

      if (block?.attr) {
        for (const attrKey in block.attr) {
          if (block.attr[attrKey] !== undefined) {
            attr(element, attrKey, block.attr[attrKey]);
          }
        }
      }

      return childRender ? element : Array.from(element.childNodes);
    } else {
      return Array.from(make("div")?.childNodes);
    }
  }

  private emptyFilter(result: Array<OutputBlockItem | string>): Array<OutputBlockItem | string> {
    const filtered: Array<OutputBlockItem | string> = [];

    result.forEach((item) => {
      if (typeof item === "string") {
        filtered.push(item);
      } else {
        if (item.data && Array.isArray(item.data)) {
          if (item.data.length === 1 && typeof item.data[0] === "string") {
            if (!isEmptyString(item.data[0])) {
              filtered.push(item);
            }
          } else {
            if (item.data.length > 0) filtered.push(item);
          }
        }
      }
    });

    return filtered;
  }
}
