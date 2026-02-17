import type {
  HTMLBlockElement,
  TexditorInterface,
  OutputBlockItem,
  SanitizerConfig,
  BlockModelConfig,
  BlockModelInterface
} from "@/types";
import { addClass, append, appendText, getChildNodes, getElementText, make } from "@/utils/dom";
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
    preformatted: false,
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

  protected make(tagName: string, callback: CallableFunction): HTMLBlockElement | HTMLElement {
    return make(tagName, (el: HTMLBlockElement) => {
      const classList = this.getConfig("cssClasses", "");
      addClass(el, "tex-block" + (classList ? " " + classList : " tex-" + this.getConfig("type")));

      el.id = this.getId();
      el.dataset.tagName = this.getConfig("tagName");
      el.dataset.type = this.getConfig("type");

      if (this.isEmptyDetect()) el.dataset.empty = "true";

      if (this.isEditable()) el.contentEditable = "true";

      if (this.getConfig("placeholder")) el.dataset.placeholder = this.getConfig("placeholder");

      Object.defineProperty(el, "blockModel", {
        value: this,
        writable: true
      });

      callback(el);
    });
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

  getConfig(key: string, defaultValue: string): string;
  getConfig<K extends keyof BlockModelConfig>(key: K): BlockModelConfig[K];
  getConfig<K extends keyof BlockModelConfig>(key: K, defaultValue: BlockModelConfig[K]): BlockModelConfig[K];
  getConfig(key: string, defaultValue: unknown): unknown;
  getConfig(key: keyof BlockModelConfig | string, defaultValue: unknown = ""): unknown {
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

  isPreformatted(): boolean {
    return this.getConfig("preformatted", false);
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
    const randomHex = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");

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
        const sanitizerConfig: SanitizerConfig = this.getConfig("sanitizerConfig", {}),
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
    return this.getElement();
  }

  normalizeContainer(): HTMLBlockElement | HTMLElement | HTMLElement[] | null {
    return this.getElement();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  editableChild(container?: HTMLElement | null, isCreate: boolean = false): HTMLElement | HTMLElement[] | null {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getItem(index: HTMLElement | number, container: HTMLElement | null = null): HTMLElement | number | null {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setItemIndex(index: number): void { }

  getItemIndex(): number {
    return 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onCreate(newBlock?: HTMLBlockElement | null) { }

  onRender(): void { }
  __onRenderComplete__(): void { }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  save(block: OutputBlockItem, blockElement?: HTMLElement): OutputBlockItem {
    return block;
  }

  afterCreate(newBlock?: HTMLBlockElement | null) {
    this.onCreate(newBlock);
    this.sanitize();
  }

  setStore(key: string, value: unknown): this {
    this.store[key] = value;

    return this;
  }

  getStore(key: string | null): unknown {
    return key === null ? this.store : this.store[key] || null;
  }

  convert(block: HTMLBlockElement, newBlock: HTMLBlockElement): HTMLBlockElement {
    const sanitizerConfig = this.getConfig("sanitizerConfig", {}),
      isSanitize = Object.keys(sanitizerConfig).length,
      isRaw = this.isRawOutput();

    newBlock.innerHTML = "";

    if (isRaw || !isSanitize) {
      appendText(newBlock, getElementText(block));
    } else {
      append(newBlock, getChildNodes(block));
    }

    return newBlock;
  }

  toConvert(block: HTMLBlockElement, newBlock: HTMLBlockElement): [HTMLBlockElement, HTMLBlockElement] {
    return [block, newBlock];
  }

  destroy(): void { }
}
