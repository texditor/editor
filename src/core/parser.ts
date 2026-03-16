import type {
  BlockNode,
  ParserInterface,
  BlockModelStructure,
  BlockOutputData,
  BlockOutput,
  TexditorInterface
} from "@/types";
import { decodeHtmlSpecialChars } from "@/utils/common";
import { appendText, append, attr, make } from "@/utils/dom";
import { isEmptyString } from "@/utils/string";

export default class Parser implements ParserInterface {
  editor: TexditorInterface;

  constructor(editor: TexditorInterface) {
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
      doc = parser.parseFromString(
        `<parser-rawblock>${input}</parser-rawblock>`,
        "text/html"
      );

    return doc.querySelector("parser-rawblock");
  }

  htmlToData(html: string): Array<BlockOutput | string> {
    const { events } = this.editor;
    events.trigger("htmlToData", { html: html });

    const input = html,
      rawblock = this.parseHtml(input);

    if (!rawblock) {
      return [];
    }

    const nodes: NodeListOf<ChildNode> = rawblock.childNodes;
    const result: Array<BlockOutput | string> = [];

    if (nodes.length > 0) {
      if (
        !(
          (nodes.length === 1 && nodes[0].nodeType === Node.TEXT_NODE) ||
          (nodes[0].nodeType === Node.TEXT_NODE &&
            nodes.length === 2 &&
            nodes[1].nodeName === "BR")
        )
      ) {
        Array.from(nodes).forEach((node) => {
          events.trigger("htmlToDataNode", { node: node });

          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;

            events.trigger("htmlToDataTextOutput", { text: text });

            if (text?.trim()) result.push(text);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const objAttr: Record<string, string> = {};
            let outContent: Array<BlockOutput | string> = [
              node.textContent || ""
            ];

            if (node.childNodes.length) {
              const childNodes = node.childNodes;

              if (
                !(
                  childNodes.length === 1 &&
                  childNodes[0].nodeType === Node.TEXT_NODE
                )
              ) {
                outContent = this.htmlToData(element.innerHTML);
              }
            }

            const outData: BlockOutput = {
              type: node.nodeName.toLowerCase(),
              data: outContent as BlockOutputData | []
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
        });
      } else {
        html = html.replace(/&nbsp;/g, " ");
        result.push(decodeHtmlSpecialChars(html));
      }
    }

    events.trigger("htmlToDataEnd", { data: result });

    return this.emptyFilter(result);
  }

  parseBlocks(
    data: object[],
    createDefault: boolean = false,
    skipDecode: boolean = false
  ): Node[] | [] {
    const { blockManager, config } = this.editor,
      models = blockManager.getBlockModels();

    const blocks = make("div", (node: BlockNode) => {
      (data as BlockOutput[]).forEach((item: BlockOutput) => {
        (models).forEach(
          (formatedModel: BlockModelStructure) => {
            if (
              formatedModel.types &&
              formatedModel.types.includes(item.type)
            ) {
              const blockModel = new formatedModel.instance(this.editor);

              let elBlock = null;

              if (blockModel.getConfig("autoParse")) {
                const isEditableItems = blockModel.isEditableItems();

                if (isEditableItems) {
                  const blockData = (item?.data || []) as BlockOutput[];
                  const tempBlock = make(blockModel.getTagName());

                  if (blockData.length) {
                    blockData.forEach(li => {
                      const nodes = this.parseChilds(li);
                      const tempItem = make(blockModel.getItemTagName());
                      append(tempItem, nodes);
                      append(tempBlock, blockModel.makeItemNode(tempItem.innerHTML));
                    });
                  }

                  elBlock = blockModel.create({
                    content: tempBlock.innerHTML || ''
                  });
                } else
                  elBlock = blockModel.create();

                if (elBlock) {
                  const contentNode = blockManager.getContentNode(elBlock as BlockNode);

                  if (contentNode) {
                    if (!isEditableItems) {
                      const childs = this.parseChilds(item, false, skipDecode);
                      append(contentNode, childs);
                    }

                    append(elBlock, contentNode);
                    append(node, elBlock);
                  }
                }
              } else {
                if (typeof blockModel?.parse !== "undefined") {
                  elBlock = blockModel?.parse(item);
                  if (elBlock && elBlock !== null) {
                    append(node, elBlock);
                  }
                }
              }

              if (blockModel.afterCreate)
                blockModel.afterCreate(elBlock as BlockNode);
            }
          }
        );
      });

      if (node.childNodes.length === 0 && createDefault) {
        (models).forEach(
          (formatedModel: BlockModelStructure) => {
            if (
              formatedModel.types &&
              formatedModel.types.includes(config.get("defaultBlock", "p"))
            ) {
              const blockModel = new formatedModel.instance(this.editor);

              if (blockModel) {
                const elBlock = blockModel.create();
                if (elBlock) append(node, elBlock);

                if (blockModel.afterCreate)
                  blockModel.afterCreate(elBlock as BlockNode);
              }
            }
          }
        );
      }
    });

    return blocks.childNodes.length ? Array.from(blocks.childNodes) : [];
  }

  parseChilds(
    block: BlockOutput,
    childRender: boolean = false,
    skipDecode: boolean = false
  ): Node | Node[] {
    if (
      block.data !== null &&
      block.data !== undefined &&
      block.type !== undefined
    ) {
      const element = make(block.type);

      if (Array.isArray(block.data)) {
        (block.data as (BlockOutput | string)[]).forEach(
          (item: BlockOutput | string) => {
            if (typeof item === "string") {
              appendText(
                element,
                skipDecode ? item : decodeHtmlSpecialChars(item)
              );
            } else {
              append(
                element,
                this.parseChilds(item, true, skipDecode) as HTMLElement
              );
            }
          }
        );
      } else if (typeof block.data === "string") {
        appendText(element, block.data);
      }

      if (block?.attr) {
        for (const attrKey in block.attr) {
          if (block.attr[attrKey] !== undefined) {
            attr(element, attrKey, decodeHtmlSpecialChars(block.attr[attrKey]));
          }
        }
      }

      return childRender ? element : Array.from(element.childNodes);
    } else {
      return Array.from(make("div")?.childNodes);
    }
  }

  private emptyFilter(
    result: Array<BlockOutput | string>
  ): Array<BlockOutput | string> {
    const filtered: Array<BlockOutput | string> = [];

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
