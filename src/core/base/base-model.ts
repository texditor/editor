import {
  BaseModelConfig,
  BaseElement,
  RenderIconContent,
  Texditor,
  ModelConstructor,
  BaseModel as IBaseModel,
} from '@/types';

import { addClass, append, attr, html, make, rebind, randString, toKebabCase, isEmptyString } from 'snappykit';

import { renderIcon } from '@/utils';
import EventManager from './event-manager';

/**
 * Base model class providing core functionality, event management and lifecycle hooks
 */
export default class BaseModel<TElement extends BaseElement = BaseElement> extends EventManager implements IBaseModel {
  /** Global user configuration for all model instances */
  private static userConfig: Partial<BaseModelConfig> = {};

  /** Reference to the editor instance */
  protected editor: Texditor;

  /** DOM element representing the model button */
  private element: TElement;

  /** Model configuration settings */
  private config: BaseModelConfig;

  /** Key-value storage for custom block data */
  protected store: Record<string, unknown> = {};

  /** Unique identifier for event listeners to prevent conflicts with other event handlers */
  private eventId: string = '.actions' + randString(16);

  /** Modifiable model options */
  private options: Record<string, unknown> = {};

  /**
   * Create a new base model instance
   * @param editor - Editor instance reference
   */
  constructor(editor: Texditor) {
    super();
    this.editor = editor;
    this.onConstruct(editor);

    this.config = {
      name: '',
      elementTagName: 'div',
      translation: '',
      icon: '',
      visibleIcon: true,
      iconWidth: 16,
      iconHeight: 16,
      className: '',
      visibleTitle: false,
      attributeTitle: true,
      __modelCode: 'baseModel',
      ...this.parentConfig(),
      ...this.configure(),
      ...(this.constructor as typeof BaseModel).userConfig,
    };

    this.element = this.createElement();
    this.onLoad();

    this.trigger('onLoad', {
      type: 'onLoad',
      modelCode: this.getModelCode(),
      config: this.config,
    });

    const childDestroy = this.destroy;

    this.destroy = () => {
      this.originalDestroy();
      childDestroy.call(this);
    };
  }

  /**
   * Create model DOM element
   * @returns Created model element
   */
  protected createElement(): TElement {
    const name = this.getName(),
      codeName = this.getModelCode(),
      cssName = this.getClassName();

    return make(this.getElementTagName(), (el: TElement) => {
      el.id = `tex-${codeName}-${randString(12)}-${randString(12)}`;

      const rootCssName = this.getRootClassName();
      const classes = [rootCssName, rootCssName + '-' + name];

      if (!isEmptyString(cssName)) classes.push(cssName);

      addClass(el, classes);
      rebind<MouseEvent>(el, 'click.baseElement', (evt) => this.handleClick(evt));

      const icon = this.getIcon(),
        visibleIcon = this.isVisibleIcon();

      if (visibleIcon && icon) {
        html(
          el,
          renderIcon(icon, {
            width: this.getIconWidth(),
            height: this.getIconHeight(),
          }),
        );
      }

      const title = this.getTranslation();

      if (this.isAttributeTitle()) attr(el, 'title', title);

      if (this.isVisibleTitle()) {
        append(
          el,
          make('span', (span: HTMLSpanElement) => {
            addClass(span, 'tex-model-title');
            span.textContent = title;
          }),
        );
      }

      el.baseModel = this;
      this.element = el;
      this.parentOnCreateElement(el);
      this.onCreateElement(el);
      this.trigger('onCreateElement', {
        type: 'onCreateElement',
        modelCode: this.getModelCode(),
        element: el,
      });
    }) as TElement;
  }

  /** @see IBaseModel.getEventId */
  getEventId(): string {
    return this.eventId;
  }

  /**
   * Hook called after model element creation
   * @param _el - Created model element
   */
  protected onCreateElement(_el: TElement): void { }

  /**
   * Parent hook called after model element creation
   * @param _el - Created model element
   */
  protected parentOnCreateElement(_el: TElement): void { }

  /** @see IBaseModel.getConfig */
  getConfig(key: string, defaultValue: boolean): boolean;
  getConfig(key: string, defaultValue: string): string;
  getConfig(key: string, defaultValue: number): number;
  getConfig<K extends keyof BaseModelConfig>(key: K): BaseModelConfig[K];
  getConfig<K extends keyof BaseModelConfig>(key: K, defaultValue: BaseModelConfig[K]): BaseModelConfig[K];
  getConfig(key: string, defaultValue: unknown): unknown;
  getConfig(key: keyof BaseModelConfig | string, defaultValue: unknown = ''): unknown {
    const value = (this.config as Record<string, unknown>)[key as string];

    if (value !== undefined) {
      return value;
    }

    return defaultValue !== undefined ? defaultValue : '';
  }

  /** @see IBaseModel.getOption */
  getOption<T = unknown>(key: string, defaultValue?: T): T | null {
    const value = this.options[key];

    if (key in this.options) {
      return value as T;
    }

    return defaultValue ?? null;
  }

  /** @see IBaseModel.setOption */
  setOption(key: string, value: unknown): void {
    this.options[key] = value;
  }

  /** @see IBaseModel.setOptions */
  setOptions(options: Record<string, unknown>): void {
    this.options = { ...this.options, ...options };
  }

  /** @see IBaseModel.getOptions */
  getOptions(): Record<string, unknown> {
    return { ...this.options };
  }

  /** @see IBaseModel.removeOption */
  removeOption(key: string): boolean {
    const existed = key in this.options;

    if (existed) {
      delete this.options[key];
    }

    return existed;
  }

  /** @see IBaseModel.clearOptions */
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
  protected parentConfig(): Partial<BaseModelConfig> {
    return {};
  }

  /** @see IBaseModel.setStore */
  setStore(key: string, value: unknown): this {
    this.store[key] = value;

    return this;
  }

  /** @see IBaseModel.getStore */
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
  protected onClick(_evt: MouseEvent): void { }

  /**
   * Parent hook called after model element clicked
   * @param evt - Custom event with element reference
   * @returns void
   */
  protected parentOnClick(evt: MouseEvent): void {
    this.onClick(evt);
  }

  /**
   * Handle click with event binding
   * @param evt - Custom event with element reference
   */
  private handleClick(evt: MouseEvent): void {
    this.parentOnClick(evt);

    this.trigger('onClick', {
      type: 'onClick',
      modelCode: this.getModelCode(),
      domEvent: evt,
    });
  }

  /**
   * Hook called after mounting to the DOM
   * @param _el - The mounted DOM element
   */
  protected onMount(_el: TElement): void { }

  /**
   * Parent hook called after mounting to the DOM
   * @param _el - The mounted DOM element
   */
  protected parentOnMount(_el: TElement): void { }

  /** @see IBaseModel.__onMount */
  __onMount(el: TElement): void {
    this.parentOnMount(el);
    this.onMount(el);

    this.trigger('onMount', {
      type: 'onMount',
      modelCode: this.getModelCode(),
      element: el,
    });
  }

  /**
   * Hook called during constructor creation
   * @param editor - Editor instance reference
   */
  protected onConstruct(_editor: Texditor): void { }

  /** @see IBaseModel.isActive */
  isActive(): boolean {
    return true;
  }

  /** @see IBaseModel.isVisible */
  isVisible(): boolean {
    return true;
  }

  /** @see IBaseModel.getId */
  getId(): string {
    return this.element.id;
  }

  /** @see IBaseModel.getElement */
  getElement(): TElement {
    return this.element;
  }

  /** @see IBaseModel.getName */
  getName(): string {
    return this.getConfig('name', '');
  }

  /** @see IBaseModel.getElementTagName */
  getElementTagName(): string {
    return this.getConfig('elementTagName', 'div');
  }

  /** @see IBaseModel.getClassName */
  getClassName(): string {
    return this.getConfig('className', '');
  }

  /** @see IBaseModel.getRootClassName */
  getRootClassName(): string {
    return 'tex-' + toKebabCase(this.getModelCode());
  }

  /** @see IBaseModel.getTranslation */
  getTranslation(): string {
    const { i18n } = this.editor,
      name = this.getName();

    const translation = this.getConfig('translation');
    const translationCode = translation ? translation : name;

    return i18n.get(translationCode, name);
  }

  /** @see IBaseModel.getIcon */
  getIcon(): RenderIconContent {
    return this.getConfig('icon');
  }

  /** @see IBaseModel.getIconWidth */
  getIconWidth(): number {
    return this.getConfig('iconWidth', 16);
  }

  /** @see IBaseModel.getIconHeight */
  getIconHeight(): number {
    return this.getConfig('iconHeight', 16);
  }

  /** @see IBaseModel.getModelCode */
  getModelCode(): string {
    return this.getConfig('__modelCode', 'baseModel');
  }

  /** @see IBaseModel.isVisibleTitle */
  isVisibleTitle(): boolean {
    return this.getConfig('visibleTitle', false);
  }

  /** @see IBaseModel.isAttributeTitle */
  isAttributeTitle(): boolean {
    return this.getConfig('attributeTitle', false);
  }

  /** @see IBaseModel.isVisibleIcon */
  isVisibleIcon(): boolean {
    return this.getConfig('visibleIcon', false);
  }

  /** @see IBaseModel.destroy */
  destroy(): void { }

  /**
   * Parent hook called before the element is destroyed
   */
  protected parentDestroy(): void { }

  /** Internal destroy routine: cleans up parent, then fires the destroy event. */
  private originalDestroy(): void {
    this.parentDestroy();
    this.trigger('destroy', {
      type: 'destroy',
      modelCode: this.getModelCode(),
    });
  }
}
