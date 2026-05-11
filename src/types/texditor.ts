import type {
  BlockManagerInterface,
  ConfigInterface,
  EventsInterface,
  SelectionAPIInterface,
  ToolsInterface,
  APIInterface,
  I18NInterface,
  CommandsInterface,
  HistoryManagerInterface,
  ExtensionsInterface,
  BlockSchema
} from ".";

/**
 * Main Texditor editor interface
 * Defines the public API and core component accessors for the editor instance
 */
export interface TexditorInterface {
  /** Editor configuration object containing settings, plugins, and behaviors */
  config: ConfigInterface;

  /** Manages all editor blocks (creation, deletion, manipulation, ordering) */
  blockManager: BlockManagerInterface;

  /** Handles text selection, cursor position, and range management operations */
  selectionApi: SelectionAPIInterface;

  /** Public API for external editor interaction (save, load, destroy, content manipulation) */
  api: APIInterface;

  /** Event system for editor lifecycle and user action notifications and subscriptions */
  events: EventsInterface;

  /** Tool management system for additional editor functionalities and UI components */
  tools: ToolsInterface;

  /** Internationalization system providing multi-language support and translations */
  i18n: I18NInterface;

  /** Command execution system for complex editor operations and batch manipulations */
  commands: CommandsInterface;

  /** Undo/redo history manager for state tracking, restoration, and time travel */
  historyManager: HistoryManagerInterface;

  /** Extension system for third-party plugins, custom features, and external integrations */
  extensions: ExtensionsInterface;

  /**
   * Saves the current editor state to a serializable format
   * @returns Array of block output objects ready for storage or transmission
   */
  save(): BlockSchema[] | [];

  /**
  * Sets the editor content
  * @param content - JSON string or array of block schemas
  * @param index - Optional block index to set as active (default: 0)
  * @param focusDelay - Focus delay in milliseconds (default: 0)
  */
  setContent(content: string | BlockSchema[], index?: number, focusDelay?: number): void;

  /**
   * Completely destroys the editor instance
   * Cleans up all resources, event listeners, and DOM elements
   */
  destroy(): void;
}