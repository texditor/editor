import type {
  BlockManager,
  Config,
  Events,
  SelectionAPI,
  Tools,
  I18N,
  Commands,
  HistoryManager,
  Extensions,
  BlockSchema
} from ".";

export interface TexditorRootElement extends HTMLElement {
  texditor: Texditor;
}

/**
 * Main Texditor editor interface
 * Defines the public API and core component accessors for the editor instance
 */
export interface Texditor {
  /** Editor configuration object containing settings, plugins, and behaviors */
  config: Config;

  /** Manages all editor blocks (creation, deletion, manipulation, ordering) */
  blockManager: BlockManager;

  /** Handles text selection, cursor position, and range management operations */
  selectionApi: SelectionAPI;

  /** Event system for editor lifecycle and user action notifications and subscriptions */
  events: Events;

  /** Tool management system for additional editor functionalities and UI components */
  tools: Tools;

  /** Internationalization system providing multi-language support and translations */
  i18n: I18N;

  /** Command execution system for complex editor operations and batch manipulations */
  commands: Commands;

  /** Undo/redo history manager for state tracking, restoration, and time travel */
  historyManager: HistoryManager;

  /** Extension system for third-party plugins, custom features, and external integrations */
  extensions: Extensions;

  /**
   * Gets the root element of the editor
   * @returns Root element or null if not found
   * @throws Error if root element is not found
   */
  getRoot(): TexditorRootElement | null;

  /**
   * Checks if the editor is empty (no content)
   * @returns True if editor is empty
   */
  isEmpty(): boolean;

  /**
   * Gets the current editor content
   * @returns Array of block outputs
   */
  getContent(): BlockSchema[];

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