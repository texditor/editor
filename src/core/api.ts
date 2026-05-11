import type {
  APIInterface,
  TexditorInterface,
  BlockSchemaData,
  BlockSchema
} from "@/types";
import {
  queryLength,
  query,
  append,
  findDatasetsWithPrefix,
  html
} from "@/utils/dom";
import MainView from "@/views/main";
import { executeMethodIfExists } from "@/utils/common";
import { isEmptyString, sanitizeJson } from "@/utils";

export default class API implements APIInterface {
  /** Reference to the main editor instance */
  private editor: TexditorInterface;

  /** Root HTML element where the editor is mounted */
  private rootElement?: HTMLElement;

  constructor(editor: TexditorInterface) {
    this.editor = editor;
  }

  /**
   * Gets the root element of the editor
   * @returns Root element or false if not found
   * @throws Error if root element is not found
   */
  getRoot(): HTMLElement | null {
    const root = this.rootElement || null;

    if (!root) throw new Error("The root element of the editor was not found.");

    return root;
  }

  /**
   * Checks if the editor is empty (no content)
   * @returns True if editor is empty
   */
  isEmpty(): boolean {
    const { blockManager } = this.editor;
    const count = blockManager.count(),
      model = blockManager.getModel(0);

    if (count === 0)
      return true;

    return !!(count === 1 && model && model.isEmpty());
  }

  /**
   * Sets the editor content
   * @param content - JSON string or array of block schemas
   * @param index - Optional block index to set as active
   * @param focusDelay - Focus delay
   */
  setContent(
    content: string | BlockSchema[],
    index: number = 0,
    focusDelay: number = 0
  ): void {
    const { blockManager, config, events } = this.editor;
    const container = blockManager.getBlocksContainer(),
      defaultData = {
        type: config.get("defaultBlock", "p"),
        data: [""]
      };

    let data = [defaultData];

    try {
      data = typeof content === "string"
        ? isEmptyString(content)
          ? []
          : JSON.parse(
            sanitizeJson(content.trim()) || ""
          )
        : content;
    } catch (e) {
      console.warn(
        "The input data is not supported or contains errors when working with JSON",
        e
      );
    }

    if (container) {
      html(container, '');

      const blocks = blockManager.parseBlocks(data),
        realIndex = index ? index : 0;

      if (!blocks.length) {
        const defaultBlock = blockManager.parseBlock(defaultData);

        if (!defaultBlock)
          throw Error('The default block model has not been found.');

        blocks.push(defaultBlock);
      }

      append(container, blocks);
      blockManager.detectEmpty(false);
      blockManager.normalize();
      blocks.forEach((blockElement) => {
        executeMethodIfExists(
          blockElement.baseModel,
          '__onMount',
          [blockElement])
      });
      events.refresh();

      if (index !== -1) {
        setTimeout(() => {
          blockManager.use(realIndex);
          blockManager.focus(realIndex);
        }, focusDelay || 0)
      }

      events.change({
        type: "setContent",
        container: container,
        index: realIndex
      })
    }
  }

  /**
   * Gets the current editor content
   * @returns Array of block outputs
   */
  getContent(): BlockSchema[] {
    return this.save();
  }

  /**
   * Saves the current editor state to a serializable format
   * @returns Array of block outputs representing editor content
   */
  save(): BlockSchema[] {
    const data: BlockSchema[] = [];
    const { blockManager, events } = this.editor,
      root = this.getRoot();

    events.triggerEvent("save");

    if (!root) return [];

    blockManager.getBlockNodes().forEach((el) => {
      events.triggerEvent("saveEach", { blockElement: el });

      const model = el.baseModel;

      if (model.getName()) {
        const extOptions = findDatasetsWithPrefix(el, "options");
        let block: BlockSchema = {
          type: model.getName(),
          data: [],
          ...extOptions
        };

        const contentNode = blockManager.getContentNode(el);

        if (contentNode && model) {
          if (model.isCustomSave()) {
            block = executeMethodIfExists(model, '__save', [block, el]) as BlockSchema;
          } else {
            if (model.isRaw()) {
              block.data = [contentNode.innerText];
            } else {
              const parsedData = blockManager.htmlToData(contentNode.innerHTML);

              if (model.isEditableItems() && model.getItemsLength()) {
                let i = 0;
                const items = model.getItems();

                items.forEach(() => {
                  const itemBody = model.getItemBody(i);
                  if (itemBody) {
                    const parsedData = blockManager.htmlToData(itemBody.innerHTML);

                    if (parsedData.length) {
                      const dataObj = {
                        type: model.getItemName(),
                        data: parsedData
                      };
                      (block.data as object[]).push(dataObj)
                    }
                  }

                  i++;
                })
              } else {
                block.data = parsedData.filter(
                  (item) =>
                    typeof item === "string" ||
                    (typeof item === "object" && item !== null)
                ) as BlockSchemaData;
              }
            }
          }
        }

        if (block.data.length) data.push(block);
      }

      events.triggerEvent("saveEachEnd", { blockElement: el });
    });

    events.triggerEvent("saveEnd");

    return data;
  }

  /**
   * Destroys the editor instance and cleans up resources
   */
  destroy(): void {
    const {
      blockManager,
      events,
      extensions,
      historyManager,
      tools
    } = this.editor;
    if (this.rootElement) this.rootElement.innerHTML = "";
    blockManager.destroy();
    events.destroy();
    extensions.destroy();
    tools.destroy();
    historyManager.clear();
  }


  /**
 * Renders the editor in the DOM
 * @throws Error if editor ID is not found
 */
  __mount(): void {
    const { config } = this.editor;
    const editorId = this.editor.config.get("handle", "texditor");

    if (!queryLength("#" + editorId))
      throw new Error("The editor's ID was not found.");

    let editorElement = null;
    query("#" + editorId, (el: HTMLElement) => {
      this.rootElement = el;
      append(el, MainView(this.editor));
      editorElement = el;
    });

    if (editorElement) {
      const initalData = config.get('initalData', []) as string | BlockSchema[];
      this.setContent(
        initalData,
        config.get("autofocus", true) ? 0 : -1,
        config.get('autofocusDelay', 10)
      );
    }
  }
}