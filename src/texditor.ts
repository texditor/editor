import type {
  BlockManager as IBlockManager,
  Commands as ICommands,
  Config as IConfig,
  SelectionAPI as ISelectionAPI,
  Events as IEvents,
  ToolsInterface,
  I18NInterface,
  HistoryManagerInterface,
  ExtensionsInterface,
  BlockSchema,
  BlockSchemaData,
  ConfigOptions,
  TexditorInterface
} from "./types";
import Events from "@/core/events";
import BlockManager from "@/core/block-manager";
import Config from "@/core/config";
import SelectionAPI from "@/core/selection-api";
import Tools from "@/core/tools";
import I18N from "@/core/i18n";
import Commands from "@/core/commands";
import HistoryManager from "@/core/history-manager";
import Extensions from "@/core/extensions";
import MainView from "@/views/main";
import {
  queryLength,
  query,
  append,
  findDatasetsWithPrefix,
  html
} from "@/utils/dom";
import { executeMethodIfExists } from "./utils";
import { isEmptyString, sanitizeJson } from "@/utils";
import "@/styles/tex.css";
import "@/styles/animations.css";

export * from "./types";
export * from "./utils";

export default class Texditor implements TexditorInterface {
  /** Editor configuration object */
  config: IConfig;

  /** Manages all editor blocks (creation, deletion, manipulation) */
  blockManager: IBlockManager;

  /** Handles text selection, cursor position, and range management */
  selectionApi: ISelectionAPI;

  /** Event system for editor lifecycle and user action notifications */
  events: IEvents;

  /** Tool management system for additional editor functionalities */
  tools: ToolsInterface;

  /** Internationalization system for multi-language support */
  i18n: I18NInterface;

  /** Command execution system for complex editor operations */
  commands: ICommands;

  /** Undo/redo history manager for state tracking and restoration */
  historyManager: HistoryManagerInterface;

  /** Extension system for third-party plugins and custom features */
  extensions: ExtensionsInterface;

  /** Root HTML element where the editor is mounted */
  private rootElement?: HTMLElement;

  /**
   * Creates a new Texditor instance
   * @param config - Configuration object for the editor instance
   */
  constructor(config: ConfigOptions) {
    this.config = new Config(config);
    this.i18n = new I18N(this);
    this.events = new Events(this);
    this.historyManager = new HistoryManager(this);
    this.blockManager = new BlockManager(this);
    this.selectionApi = new SelectionAPI(this);
    this.tools = new Tools(this);
    this.commands = new Commands(this);
    this.extensions = new Extensions(this);
    this.ready();
  }

  /**
   * Initializes editor when ready
   */
  private ready() {
    setTimeout(() => {
      executeMethodIfExists(this, '__mount');
      this.historyManager.save();
      this.extensions.apply();

      const readyCallback = this.config.get("onReady", false);

      if (typeof readyCallback === "function")
        readyCallback(this);

      this.blockManager.detectEmpty();
      this.blockManager.normalize();
      this.events.refresh();
    }, 10);
  }

  /**
   * Gets the root element of the editor
   * @see TexditorInterface#getRoot
   */
  getRoot(): HTMLElement | null {
    const root = this.rootElement || null;

    if (!root) throw new Error("The root element of the editor was not found.");

    return root;
  }

  /**
   * Checks if the editor is empty (no content)
   * @see TexditorInterface#isEmpty
   */
  isEmpty(): boolean {
    const { blockManager } = this;
    const count = blockManager.count(),
      model = blockManager.getModel(0);

    if (count === 0)
      return true;

    return !!(count === 1 && model && model.isEmpty());
  }

  /**
   * Sets the editor content
   * @see TexditorInterface#setContent
   */
  setContent(
    content: string | BlockSchema[],
    index: number = 0,
    focusDelay: number = 0
  ): void {
    const { blockManager, config, events } = this;
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
   * @see TexditorInterface#getContent
   */
  getContent(): BlockSchema[] {
    return this.save();
  }

  /**
   * Saves the current editor state to a serializable format
   * Triggers 'save', 'saveEach', 'saveEachEnd', and 'saveEnd' events
   * @see TexditorInterface#save
   */
  save(): BlockSchema[] {
    const data: BlockSchema[] = [];
    const { blockManager, events } = this,
      root = this.getRoot();

    events.triggerEvent("save");

    if (!root) return [];

    blockManager.getBlockElements().forEach((el) => {
      events.triggerEvent("saveEach", { blockElement: el });

      const model = el.baseModel;

      if (model.getName()) {
        const extOptions = findDatasetsWithPrefix(el, "options");
        let block: BlockSchema = {
          type: model.getName(),
          data: [],
          ...extOptions
        };

        const contentElement = blockManager.getContentElement(el);

        if (contentElement && model) {
          if (model.isCustomSave()) {
            block = executeMethodIfExists(model, '__save', [block, el]) as BlockSchema;
          } else {
            if (model.isRaw()) {
              block.data = [contentElement.innerText];
            } else {
              const parsedData = blockManager.htmlToData(html(contentElement));

              if (model.isEditableItems() && model.getItemsLength()) {
                let i = 0;
                const items = model.getItems();

                items.forEach(() => {
                  const itemBody = model.getItemBody(i);
                  if (itemBody) {
                    const parsedData = blockManager.htmlToData(html(itemBody));

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
   * Completely destroys the editor instance
   * Cleans up all event listeners, removes DOM elements,
   * and destroys all sub-components (actions, blocks, tools, etc.)
   * @see TexditorInterface#destroy
   */
  destroy(): void {
    const {
      blockManager,
      events,
      extensions,
      historyManager,
      tools
    } = this;
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
    const { config } = this;
    const editorId = this.config.get("handle", "texditor");

    if (!queryLength("#" + editorId))
      throw new Error("The editor's ID was not found.");

    let editorElement = null;
    query("#" + editorId, (el: HTMLElement) => {
      this.rootElement = el;
      append(el, MainView(this));
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