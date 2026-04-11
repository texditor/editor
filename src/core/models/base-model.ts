import {
  BaseModelConfig,
  BaseModelInterface,
  BaseNode,
  BaseEvent,
  RenderIconContent,
  TexditorInterface,
  ModelConstructor
} from "@/types";

import {
  addClass,
  append,
  attr,
  generateRandomString,
  html,
  make,
  rebind,
  renderIcon
} from "@/utils";

export default class BaseModel<TNode extends BaseNode = BaseNode> implements BaseModelInterface<TNode> {
  /** Global user configuration for all model instances */
  private static userConfig: Partial<BaseModelConfig> = {};

  /** Reference to the editor instance */
  protected editor: TexditorInterface;

  /** DOM node representing the model button */
  private node: TNode;

  /** Model configuration settings */
  private config: BaseModelConfig;

  /** Key-value storage for custom block data */
  protected store: Record<string, unknown> = {};

  /** Unique identifier for event listeners to prevent conflicts with other event handlers */
  private eventId: string = '.actions' + generateRandomString(16);

  /** Modifiable model options */
  private options: Record<string, unknown> = {};

  /**
   * Create a new base model instance
   * @param editor - Editor instance reference
   */
  constructor(editor: TexditorInterface) {
    this.editor = editor;
    this.onConstruct(editor);
    this.config = {
      name: '',
      translation: '',
      icon: '',
      visibleIcon: true,
      iconWidth: 16,
      iconHeight: 16,
      className: '',
      visibleTitle: false,
      __modelCode: "baseModel",
      ...this.parentСonfig(),
      ...this.configure(),
      ...(this.constructor as typeof BaseModel).userConfig
    };
    this.handleClick = this.handleClick.bind(this);
    this.node = this.createNode();
    this.onLoad();
  }

  /**
   * Create model DOM node
   * @returns Created model node
   */
  protected createNode(): TNode {
    const name = this.getName(),
      codeName = this.getModelCode(),
      cssName = this.getClassName();

    return make("div", (el: TNode) => {
      el.id = `tex-${codeName}-${generateRandomString(12)}-${generateRandomString(12)}`;
      const customCss = cssName !== '' ? ' ' + cssName : "",
        namedCss = name.trim() !== '' ? ' tex-' + codeName + "-" + name : '';

      addClass(el, 'tex-' + codeName + namedCss + customCss);
      rebind(el, "click.baseNode", this.handleClick);

      const icon = this.getIcon(),
        visibleIcon = this.isVisibleIcon();

      if (visibleIcon && icon) {
        html(
          el,
          renderIcon(icon, {
            width: this.getIconWidth(),
            height: this.getIconHeight()
          })
        )
      }

      const title = this.getTranslation();

      attr(el, "title", title);

      if (this.isVisibleTitle()) {
        append(
          el,
          make("span", (span: HTMLSpanElement) => {
            addClass(span, 'tex-model-title')
            span.textContent = title
          })
        );
      }

      el.baseModel = this;
      this.parentOnCreateNode(el);
      this.onCreateNode(el);
    }) as TNode;
  }

  /**
 * Returns the unique identifier for this event listener instance
 * @returns The unique event ID string used to identify and manage event listeners
 */
  getEventId(): string {
    return this.eventId;
  }


  /**
   * Hook called after model node creation
   * @param _el - Created model node 
   */
  protected onCreateNode(_el: TNode): void { }

  /**
   * Parent hook called after model node creation
   * @param _el - Created model node 
   */
  protected parentOnCreateNode(_el: TNode): void { }

  /**
   * Get configuration value by key
   * @param key - Configuration key
   * @param defaultValue - Default value
   * @returns Configuration value
   */
  // base-model.ts
  getConfig(key: string, defaultValue: boolean): boolean;
  getConfig(key: string, defaultValue: string): string;
  getConfig(key: string, defaultValue: number): number;
  getConfig<K extends keyof BaseModelConfig>(key: K): BaseModelConfig[K];
  getConfig<K extends keyof BaseModelConfig>(
    key: K,
    defaultValue: BaseModelConfig[K]
  ): BaseModelConfig[K];
  getConfig(key: string, defaultValue: unknown): unknown;
  getConfig(
    key: keyof BaseModelConfig | string,
    defaultValue: unknown = ""
  ): unknown {
    const value = (this.config as Record<string, unknown>)[key as string];

    if (value !== undefined) {
      return value;
    }

    return defaultValue !== undefined ? defaultValue : "";
  }

  /**
   * Get option value by key
   * @param key - Configuration key
   * @param defaultValue - Default value (optional)
   * @returns Configuration value or null if not found
   */
  getOption<T = unknown>(key: string, defaultValue?: T): T | null {
    const value = this.options[key];

    if (key in this.options) {
      return value as T;
    }

    return defaultValue ?? null;
  }

  /**
   * Set single option value
   * @param key - Configuration key
   * @param value - Value to set
   */
  setOption(key: string, value: unknown): void {
    this.options[key] = value;
  }

  /**
   * Set multiple options (merges with existing options)
   * @param options - Object with options to merge
   */
  setOptions(options: Record<string, unknown>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get all options
   * @returns Copy of all options
   */
  getOptions(): Record<string, unknown> {
    return { ...this.options };
  }

  /**
 * Remove single option by key
 * @param key - Configuration key to remove
 * @returns True if option existed and was deleted, false otherwise
 */
  removeOption(key: string): boolean {
    const existed = key in this.options;

    if (existed) {
      delete this.options[key];
    }

    return existed;
  }

  /**
   * Clear all options (resets to empty object)
   */
  clearOptions(): void {
    this.options = {};
  }

  /**
   * Set up global model configuration
   * @param config - Configuration object
   * @returns BaseModel class
   */
  public static setup(config: Partial<BaseModelConfig>): ModelConstructor {
    this.userConfig = config;

    return this;
  }

  /**
   * Get model configuration
   * @returns Partial model configuration
   */
  protected configure(): Partial<BaseModelConfig> {
    return this.config;
  }

  /**
   * Parent model configuration
   * @returns Parent model configuration
   */
  protected parentСonfig(): Partial<BaseModelConfig> {
    return {};
  }

  /**
   * Set the value in the store
   * @param key - Storage key
   * @param value - Value to store
   * @returns Current instance for chaining
   */
  setStore(key: string, value: unknown): this {
    this.store[key] = value;

    return this;
  }

  /**
   * Get the value in the store
   * @param key - Storage key (null for all)
   * @returns Stored value or null
   */
  getStore(key: string | null): unknown {
    return key === null ? this.store : this.store[key] || null;
  }

  /**
   * Hook called when model loads 
   */
  protected onLoad(): void { }

  /**
   * Handle click event
   * @param _evt - Custom event with element reference 
   */
  protected onClick(_evt: BaseEvent): void { }

  /**
  * Parent hook called after model node clicked
  * @param evt - Custom event with element reference
  * @returns void
  */
  protected parentOnClick(evt: BaseEvent): void {
    this.onClick(evt);
  }

  /**
   * Handle click with event binding
   * @param evt - Custom event with element reference 
   */
  private handleClick(evt: BaseEvent): void {
    this.parentOnClick(evt);
  }

  /**
   * Performs initialization of the current class after mounting to the DOM tree
   * @param node - The DOM node that was mounted
   */
  protected onMount(_node: TNode): void { }

  /**
   * Performs initialization of the parent class after mounting to the DOM tree
   * @param node - The DOM node that was mounted
   */
  protected parentOnMount(_node: TNode): void { }

  /**
   * Public wrapper that executes both parent and current class initialization
   * @param node - The DOM node that was mounted
   */
  __onMount(node: TNode): void {
    this.parentOnMount(node);
    this.onMount(node);
  }

  /**
   * Hook called during constructor creation
   * @param editor - Editor instance reference 
   */
  protected onConstruct(_editor: TexditorInterface): void { }

  /**
   * Check if model node is active
   * @returns True if model node is active
   */
  isActive(): boolean {
    return true;
  }

  /**
   * Check if model node is visible
   * @returns True if model node should be displayed
   */
  isVisible(): boolean {
    return true;
  }

  /**
   * Get node ID
   * @returns Unique model identifier string
   */
  getId(): string {
    return this.node.id;
  }

  /**
   * Get model node
   * @returns Model button element
   */
  getNode(): TNode {
    return this.node;
  }

  /**
   * Get model node name
   * @returns Model name string
   */
  getName(): string {
    return this.getConfig('name', '');
  }

  /**
   * Get CSS class name
   * @returns CSS class name string
   */
  getClassName(): string {
    return this.getConfig('className', '');
  }

  /**
   * Get translation key for localization
   * @returns Translated string
   */
  getTranslation(): string {
    const { i18n } = this.editor,
      name = this.getName();

    const translation = this.getConfig('translation', name);
    const translationCode = translation == ''
      ? name
      : translation;

    return i18n.get(translationCode, name);
  }

  /**
   * Get icon content for the model node button
   * @returns Icon content (HTML string, SVG element, or component)
   */
  getIcon(): RenderIconContent {
    return this.getConfig('icon');
  }

  /**
   * Get icon width
   * @returns Icon width in pixels
   */
  getIconWidth(): number {
    return this.getConfig('iconWidth', 16);
  }

  /**
   * Get icon height
   * @returns Icon height in pixels
   */
  getIconHeight(): number {
    return this.getConfig('iconHeight', 16);
  }

  /**
   * Get model code identifier
   * @returns Model code string
   */
  getModelCode(): string {
    return this.getConfig('__modelCode', 'baseModel');
  }

  /**
   * Check if title is always visible
   * @returns True if title should be always visible
   */
  isVisibleTitle(): boolean {
    return this.getConfig('visibleTitle', false);
  }

  /**
   * Check if icon is always visible
   * @returns True if icon should be always visible
   */
  isVisibleIcon(): boolean {
    return this.getConfig('visibleIcon', false);
  }

  /**
   * Destroy instance and clean up resources 
   */
  destroy(): void { }
}