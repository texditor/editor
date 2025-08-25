import Texditor from "@/texditor";
import { HTMLBlockElement } from "@/types/core";
import { OutputBlockItem } from "@/types/output";
import { addClass, make } from "@/utils/dom";
import Sanitizer from "../sanitizer";
import { SanitizerConfig } from "@/types/core/sanitizer";
import { BlockModelConfig, BlockModelInterface } from "@/types/core/models";
import renderIcon from "@/utils/renderIcon";

export default class BlockModel implements BlockModelInterface {
  protected id: string = "";
  protected editor: Texditor;
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
    pasteAlwaysText: false,
    customSave: false,
    normalize: false
  };

  constructor(editor: Texditor) {
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

  getTagName() {
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

  getId() {
    if (!this.id) this.id = this.createId();

    return this.id;
  }

  getElement(): HTMLBlockElement | HTMLElement | null {
    return document.getElementById(this.getId()) || null;
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

  isRawOutput() {
    return this.getConfig("rawOutput");
  }

  isNormalize() {
    return this.getConfig("normalize", false);
  }

  isPasteAlwaysText() {
    return this.getConfig("pasteAlwaysText", false);
  }

  isCustomSave() {
    return this.getConfig("customSave", false);
  }

  isToolbar() {
    return this.getConfig("toolbar", false);
  }

  getTolls(): string[] {
    return this.getConfig("tools", []) as string[];
  }

  getRelatedTypes() {
    return this.getConfig("relatedTypes", []);
  }

  private createId() {
    return this.getType() + "-" + Math.floor(Math.random() * Date.now()).toString();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  merge(index: number): void {}

  focusChild(): HTMLElement | null {
    return null;
  }

  protected onLoad(): void {}

  sanitize() {
    if (this.getConfig("sanitizer", false)) {
      const container = this.sanitizerContainer();

      if (container || Array.isArray(container)) {
        const sanitizerConfig: SanitizerConfig = this.getConfig("sanitizerConfig", {}),
          sanitizer = new Sanitizer(sanitizerConfig);

        if (Array.isArray(container)) {
          container.forEach((el: HTMLElement) => {
            el.innerHTML = sanitizer.sanitize(el.innerHTML);
          });
        } else {
          container.innerHTML = sanitizer.sanitize(container.innerHTML);
        }
      }
    }
  }

  protected sanitizerContainer(): HTMLBlockElement | HTMLElement | HTMLElement[] | null {
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
  protected onCreate(newBlock?: HTMLBlockElement | null) {}

  onRender(): void {}

  save(block: { [key: string]: unknown }) {
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
}
