import type {
  APIInterface,
  BlockNode,
  TexditorInterface,
  BlockOutputData,
  BlockOutput
} from "@/types";
import {
  queryLength,
  query,
  append,
  findDatasetsWithPrefix,
  html
} from "@/utils/dom";
import MainView from "@/views/main";
import { executeMethodIfExists, generateRandomString } from "@/utils/common";
import { isEmptyString, sanitizeJson } from "@/utils";


export default class API implements APIInterface {
  /** Reference to the main editor instance */
  private editor: TexditorInterface;

  /** Root HTML element where the editor is mounted */
  private rootElement?: HTMLElement;

  /** Unique identifier for this editor instance */
  private uniqueId: string = "";

  constructor(editor: TexditorInterface) {
    this.uniqueId = generateRandomString(12);
    this.editor = editor;
  }

  /**
   * Sets the root element where the editor will be mounted
   * @param el - HTML element to set as root
   */
  setRoot(el: HTMLElement): void {
    this.rootElement = el;
  }

  /**
   * Gets the unique identifier
   * @returns Unique ID string
   */
  getUniqueId(): string {
    return this.uniqueId;
  }

  /**
   * Gets the root element of the editor
   * @returns Root element or false if not found
   * @throws Error if root element is not found
   */
  getRoot(): HTMLElement | false {
    const root = this.rootElement || false;

    if (!root) throw new Error("The root element of the editor was not found.");

    return root;
  }

  /**
   * Renders the editor in the DOM
   * @throws Error if editor ID is not found
   */
  render(): void {
    const { blockManager, config } = this.editor;
    const editorId = this.editor.config.get("handle", "texditor");

    if (!queryLength("#" + editorId))
      throw new Error("The editor's ID was not found.");

    let editorElement = null;
    query("#" + editorId, (el: HTMLElement) => {
      this.setRoot(el);
      append(el, MainView(this.editor));
      editorElement = el;
    });

    if (editorElement) {
      const initalData = config.get('initalData', []) as string | BlockOutput[];
      this.setContent(
        initalData,
        config.get("autofocus", true) ? 0 : -1,
        config.get('autofocusDelay', 10)
      );

      blockManager.refreshVirtualSelection();

      query(
        ".tex-block",
        (item: BlockNode) => {
          executeMethodIfExists(item.baseModel, '__onRender');
        },
        editorElement
      );
    }
  }

  /**
   * Checks if the editor is empty (no content)
   * @returns True if editor is empty
   */
  isEmpty(): boolean {
    return this.editor.blockManager.count() === 0;
  }

  /**
   * Sets the editor content
   * @param content - A JSON string or an array of block output data
   * @param index - Optional block index to set as active
   * @param focusDelay - Focus delay
   */
  setContent(
    content: string | BlockOutput[],
    index: number = 0,
    focusDelay: number = 0
  ): void {
    const { blockManager, config, events, parser } = this.editor;
    const container = blockManager.getBlocksContainer();

    let data = [{
      type: config.get("defaultBlock", "p"),
      data: [""]
    }];;

    try {
      data = typeof content === "string"
        ? isEmptyString(content)
          ? []
          : JSON.parse(sanitizeJson(content.trim()) || "")
        : content;
    } catch (e) {
      console.warn(
        "The input data is not supported or contains errors when working with JSON",
        e
      );
    }

    if (container) {
      html(container, '');

      const blocks = parser.parseBlocks(data, true),
        realIndex = index ? index : 0;

      append(container, blocks);
      blockManager.detectEmpty(false);
      blockManager.normalize();
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
  getContent(): BlockOutput[] {
    return this.save();
  }

  /**
   * Saves the current editor state to a serializable format
   * @returns Array of block outputs representing editor content
   */
  save(): BlockOutput[] {
    const data: BlockOutput[] = [];
    const { blockManager, events, parser, config } = this.editor,
      root = this.getRoot();

    events.trigger("save");

    if (!root) return [];

    query(
      ".tex-block",
      (el: BlockNode) => {
        events.trigger("saveEach", { blockNode: el });

        if (el.dataset?.type) {
          const extOptions = findDatasetsWithPrefix(el, "options");
          let block: BlockOutput = {
            type: el.dataset.type,
            data: [],
            ...extOptions
          };

          const contentNode = blockManager.getContentNode(el),
            model = el.baseModel;

          if (contentNode && model) {
            if (model.isCustomSave()) {
              block = executeMethodIfExists(model, '__save', [block, el]) as BlockOutput;
            } else {
              for (const itemData in el.dataset) {
                if (
                  (config.get("blockParseDataset", []) as string[]).includes(
                    itemData
                  )
                ) {
                  block[itemData] = el.dataset[itemData];
                }
              }

              if (model.isRaw()) {
                block.data = [contentNode.innerText];
              } else {
                const parsedData = parser.htmlToData(contentNode.innerHTML);

                if (model.isEditableItems() && model.getItemsLength()) {
                  let i = 0;
                  const items = model.getItems();

                  items.forEach(() => {
                    const itemBody = model.getItemBody(i);
                    if (itemBody) {
                      const parsedData = parser.htmlToData(itemBody.innerHTML);

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
                  ) as BlockOutputData;
                }
              }
            }
          }

          if (block.data.length) data.push(block);
        }

        events.trigger("saveEachEnd", { blockNode: el });
      },
      root
    );

    events.trigger("saveEnd");

    return data;
  }

  /**
   * Destroys the editor instance and cleans up resources
   */
  destroy(): void {
    const {
      actions,
      blockManager,
      events,
      extensions,
      historyManager,
      tools
    } = this.editor;
    if (this.rootElement) this.rootElement.innerHTML = "";
    actions.destroy();
    blockManager.destroy();
    events.destroy();
    extensions.destroy();
    tools.destroy();
    historyManager.clear();
  }
}