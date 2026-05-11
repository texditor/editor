import type {
  BlockManagerInterface,
  CommandsInterface,
  ConfigInterface,
  TexditorInterface,
  SelectionAPIInterface,
  APIInterface,
  EventsInterface,
  ToolsInterface,
  I18NInterface,
  HistoryManagerInterface,
  ExtensionsInterface,
  ConfigStoreInterface,
  BlockSchema
} from "./types";
import Events from "@/core/events";
import BlockManager from "@/core/block-manager";
import Config from "@/core/config";
import SelectionAPI from "@/core/selection-api";
import Tools from "@/core/tools";
import I18N from "@/core/i18n";
import API from "@/core/api";
import Commands from "@/core/commands";
import HistoryManager from "@/core/history-manager";
import Extensions from "@/core/extensions";
import "@/styles/tex.css";
import "@/styles/animations.css";

export * from "./types";
export * from "./utils";

export default class Texditor implements TexditorInterface {
  /** Editor configuration object containing settings, plugins, and behaviors */
  config: ConfigInterface;

  /** Manages all editor blocks (creation, deletion, manipulation) */
  blockManager: BlockManagerInterface;

  /** Handles text selection, cursor position, and range management */
  selectionApi: SelectionAPIInterface;

  /** Public API for external editor interaction (save, load, destroy) */
  api: APIInterface;

  /** Event system for editor lifecycle and user action notifications */
  events: EventsInterface;

  /** Tool management system for additional editor functionalities */
  tools: ToolsInterface;

  /** Internationalization system for multi-language support */
  i18n: I18NInterface;

  /** Command execution system for complex editor operations */
  commands: CommandsInterface;

  /** Undo/redo history manager for state tracking and restoration */
  historyManager: HistoryManagerInterface;

  /** Extension system for third-party plugins and custom features */
  extensions: ExtensionsInterface;

  /**
   * Creates a new Texditor instance
   * @param config - Configuration object for the editor instance
   */
  constructor(config: ConfigStoreInterface) {
    this.config = new Config(config);
    this.i18n = new I18N(this);
    this.api = new API(this);
    this.events = new Events(this);
    this.historyManager = new HistoryManager(this);
    this.blockManager = new BlockManager(this);
    this.selectionApi = new SelectionAPI(this);
    this.tools = new Tools(this);
    this.commands = new Commands(this);
    this.extensions = new Extensions(this);
    this.events.ready();
  }

  /**
   * Saves the current editor state to a serializable format
   * Triggers 'save', 'saveEach', 'saveEachEnd', and 'saveEnd' events
   * @returns Array of block output objects ready for storage or transmission
   */
  save(): BlockSchema[] {
    return this.api.save();
  }

  /**
   * Sets the editor content
   * @param content - JSON string or array of block schemas
   * @param index - Optional block index to set as active (default: 0)
   * @param focusDelay - Focus delay in milliseconds (default: 0)
   */
  setContent(
    content: string | BlockSchema[],
    index: number = 0,
    focusDelay: number = 0
  ): void {
    this.api.setContent(
      content,
      index,
      focusDelay
    );
  }

  /**
   * Completely destroys the editor instance
   * Cleans up all event listeners, removes DOM elements,
   * and destroys all sub-components (actions, blocks, tools, etc.)
   */
  destroy(): void {
    this.api.destroy();
  }
}