import type {
  HTMLBlockElement,
  TexditorInterface,
  OutputBlockItem,
  SanitizerConfig,
  BlockModelConfig,
  BlockModelInterface
} from "@/types";
import {
  addClass,
  append,
  appendText,
  getChildNodes,
  getElementText,
  make,
  query
} from "@/utils/dom";
import Sanitizer from "../sanitizer";
import { renderIcon } from "@/utils/icon";

export default class BlockModel implements BlockModelInterface {
  protected id: string = "";
  protected editor: TexditorInterface;
  protected store: Record<string, unknown> = {};
  private static userConfig: Partial<BlockModelConfig> = {};
  private config: Partial<BlockModelConfig> = {
    autoMerge: true,
    icon: "",
    autoParse: true,
    translationCode: "",
    backspaceRemove: true,
    cssClasses: "",
    toolbar: false,
    tools: [],
    editable: false,
    editableChilds: false,
    isEnterCreate: true,
    rawOutput: false,
    sanitizer: false,
    sanitizerConfig: {},
    tagName: "div",
    textArea: false,
    type: "",
    relatedTypes: [],
    emptyDetect: false,
    customSave: false,
    normalize: false,
    convertible: false
  };

  constructor(editor: TexditorInterface) {
    this.editor = editor;
    this.config = {
      ...this.config,
      ...this.configure(),
      ...(this.constructor as typeof BlockModel).userConfig
    };
    this.onLoad();
    this.sanitize();
  }

  configure() {
    return this.config;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(options?: object | null): HTMLElement | null {
    return null;
  }

  protected make(
    tagName: string,
    callback: CallableFunction
  ): HTMLBlockElement | HTMLElement {
    const classList = this.getConfig("cssClasses", "");
    const classes = (classList ? " " + classList : " tex-" + this.getConfig("type"));

    const blockElement = make('div', (blockElement: HTMLBlockElement) => {
      addClass(blockElement, "tex-block " + classes);

      blockElement.id = this.getId();
      blockElement.dataset.tagName = tagName;
      blockElement.dataset.type = this.getConfig("type");

      const blockContentElement = make(tagName, (content: HTMLElement) => {
        addClass(content, 'tex-block-content');
        if (this.isEmptyDetect()) content.dataset.empty = "true";
        if (this.isEditable()) content.contentEditable = "true";

        if (this.getConfig("placeholder"))
          content.dataset.placeholder = this.getConfig("placeholder");
      })

      append(blockElement, blockContentElement);

      Object.defineProperty(blockElement, "blockModel", {
        value: this,
        writable: true
      });

      callback({ blockContentElement: blockContentElement, blockElement: blockElement });
    })



    return blockElement;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parse(item: OutputBlockItem): HTMLElement | HTMLBlockElement | null {
    return null;
  }

  getTagName(): string {
    return this.getConfig("tagName");
  }

  getType(): string {
    return this.getConfig("type");
  }

  getTranslation(): string {
    return this.editor.i18n.get(this.getTranslationCode(), this.getType());
  }

  getTranslationCode(): string {
    return this.getConfig("translationCode");
  }

  getIcon(width: number = 24, height: number = 24): string {
    return renderIcon(this.getConfig("icon"), {
      width: width,
      height: height
    });
  }

  getId(): string {
    if (!this.id) {
      this.id = this.createId();
      const existingElement = document.getElementById(this.id);

      if (existingElement) {
        this.id = this.createId();
      }
    }

    return this.id;
  }

  getElement(): HTMLBlockElement | HTMLElement | null {
    if (!this.id) {
      return null;
    }

    return document.getElementById(this.id);
  }

  getBlockContentElement(): HTMLElement | null {
    const block = this.getElement();

    if (!block)
      return null;

    let elem = null;
    query(".tex-block-content", (el: HTMLElement) => elem = el, block);

    return elem;
  }

  getConfig(key: string, defaultValue: string): string;
  getConfig<K extends keyof BlockModelConfig>(key: K): BlockModelConfig[K];
  getConfig<K extends keyof BlockModelConfig>(
    key: K,
    defaultValue: BlockModelConfig[K]
  ): BlockModelConfig[K];
  getConfig(key: string, defaultValue: unknown): unknown;
  getConfig(
    key: keyof BlockModelConfig | string,
    defaultValue: unknown = ""
  ): unknown {
    const value = (this.config as Record<string, unknown>)[key];

    if (value !== undefined) {
      return value;
    }

    return defaultValue !== undefined ? defaultValue : "";
  }

  public static setup(config: object) {
    this.userConfig = config;

    return this;
  }

  isEmptyDetect(): boolean {
    return this.getConfig("emptyDetect", false);
  }

  isBackspaceRemove(): boolean {
    return this.getConfig("backspaceRemove");
  }

  isTextArea(): boolean {
    return this.getConfig("textArea");
  }

  isEditable(): boolean {
    return this.getConfig("editable");
  }

  isEditableChilds(): boolean {
    return this.getConfig("editableChilds", false);
  }

  isRawOutput(): boolean {
    return this.getConfig("rawOutput");
  }

  isNormalize(): boolean {
    return this.getConfig("normalize", false);
  }

  isConvertible(): boolean {
    return this.getConfig("convertible", false) as boolean;
  }

  isCustomSave(): boolean {
    return this.getConfig("customSave", false);
  }

  isToolbar(): boolean {
    return this.getConfig("toolbar", false);
  }

  getTolls(): string[] {
    return this.getConfig("tools", []) as string[];
  }

  getRelatedTypes(): string[] {
    return this.getConfig("relatedTypes", []);
  }

  protected createId(): string {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    const randomHex = Array.from(array, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");

    return `${this.getType()}-${randomHex}-${Date.now().toString(36)}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  merge(index: number): void { }

  focusChild(): HTMLElement | null {
    return null;
  }

  protected onLoad(): void { }

  sanitize() {
    if (this.getConfig("sanitizer", false)) {
      const container = this.sanitizerContainer();
      if (container || Array.isArray(container)) {
        const sanitizerConfig: SanitizerConfig = this.getConfig(
          "sanitizerConfig",
          {}
        ),
          sanitizer = new Sanitizer(sanitizerConfig);

        if (Array.isArray(container)) {
          container.forEach((el: HTMLElement) => {
            el.innerHTML = sanitizer.sanitize(el);
          });
        } else {
          container.innerHTML = sanitizer.sanitize(container);
        }
      }
    }
  }

  sanitizerContainer(): HTMLBlockElement | HTMLElement | HTMLElement[] | null {
    return this.getBlockContentElement();
  }

  normalizeContainer(): HTMLBlockElement | HTMLElement | HTMLElement[] | null {
    return this.getBlockContentElement();
  }

  editableChild(
    container?: HTMLElement | null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isCreate: boolean = false
  ): HTMLElement | HTMLElement[] | null {
    return null;
  }

  getItem(
    index: HTMLElement | number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    container: HTMLElement | null = null
  ): HTMLElement | number | null {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setItemIndex(index: number): void { }

  getItemIndex(): number {
    return 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onCreate(newBlockElement?: HTMLBlockElement | null) { }

  onRender(): void { }
  __onRenderComplete__(): void { }

  save(
    block: OutputBlockItem,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    blockElement?: HTMLElement
  ): OutputBlockItem {
    return block;
  }

  afterCreate(newBlockElement?: HTMLBlockElement | null) {
    this.onCreate(newBlockElement);
    this.sanitize();
  }

  setStore(key: string, value: unknown): this {
    this.store[key] = value;

    return this;
  }

  getStore(key: string | null): unknown {
    return key === null ? this.store : this.store[key] || null;
  }

  convert(
    blockElement: HTMLBlockElement,
    newBlockElement: HTMLBlockElement
  ): HTMLBlockElement {
    const sanitizerConfig = this.getConfig("sanitizerConfig", {}),
      isSanitize = Object.keys(sanitizerConfig).length,
      isRaw = this.isRawOutput();

    newBlockElement.innerHTML = "";

    if (isRaw || !isSanitize) {
      appendText(newBlockElement, getElementText(blockElement));
    } else {
      append(newBlockElement, getChildNodes(blockElement));
    }

    return newBlockElement;
  }

  toConvert(
    blockElement: HTMLBlockElement,
    newBlockElement: HTMLBlockElement
  ): [HTMLBlockElement, HTMLBlockElement] {
    return [blockElement, newBlockElement];
  }

  destroy(): void { }
}
