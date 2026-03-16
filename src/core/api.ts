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
  findDatasetsWithPrefix
} from "@/utils/dom";
import { isEmptyString } from "@/utils/string";
import MainView from "@/views/main";
import { generateRandomString } from "@/utils/common";

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
      query(
        ".tex-block",
        (item: HTMLElement) => {
          const blockNode = item as BlockNode;
          blockNode.blockModel.onRender();
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
   * @param content - Array of block outputs to set
   * @param index - Optional block index to set as active
   */
  setContent(content: BlockOutput[], index: number | null = null): void {
    const { blockManager, parser } = this.editor;
    const container = blockManager.getBlocksContainer();

    if (container) {
      container.innerHTML = "";

      const blocks = parser.parseBlocks(content, true);
      append(container, blocks);

      if (index !== null) blockManager.use(index);

      blockManager.detectEmpty(false);
      blockManager.normalize();
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
            model = el.blockModel;

          if (contentNode) {
            if (model.isCustomSave()) {
              block = model.save(block, el);
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

              if (model.isRawOutput()) {
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
                          type: model.getItemType(),
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
      toolbar
    } = this.editor;
    if (this.rootElement) this.rootElement.innerHTML = "";

    const models = blockManager.getBlockModels();

    models.forEach((modelStruct) => {
      if (modelStruct.model.destroy) modelStruct.model.destroy();
    });

    actions.destroy();
    blockManager.destroy();
    events.destroy();
    extensions.destroy();
    toolbar.destroy();
    historyManager.clear();
  }
}