import Texditor from "@/texditor";
import { HTMLBlockElement } from "@/types/core";
import { queryLength, query, append, findDatasetsWithPrefix } from "@/utils/dom";
import { isEmptyString } from "@/utils/string";
import MainView from "@/views/main";
import { BlockModelInstanceInterface, BlockModelStructure } from "@/types/core/models";
import Paragraph from "@/blocks/paragraph";
import { BlockItemData, OutputBlockItem } from "@/types/output";
import { generateRandomString } from "@/utils/common";

export default class API {
  private editor: Texditor;
  private rootElement?: HTMLElement;
  private blockModels: BlockModelStructure[] = [];
  private uniqueId: string = "";
  private cssNames: { [key: string]: string } = {
    editor: "tex",
    blocks: "tex-blocks",
    block: "tex-block",
    actions: "tex-actions",
    actionsOpen: "tex-actions-open",
    action: "tex-action",
    toolbar: "tex-toolbar",
    toolbarFixed: "tex-toolbar-fixed",
    toolbarContent: "tex-toolbar-content",
    toolbarTools: "tex-toolbar-tools",
    floatingBar: "tex-floating-bar",
    tool: "tex-tool",
    animate: "tex-animate",
    extensions: "tex-extensions",
    extension: "tex-extension"
  };

  constructor(editor: Texditor) {
    this.uniqueId = generateRandomString(12);
    this.editor = editor;
  }

  setRoot(el: HTMLElement): void {
    this.rootElement = el;
  }

  getUniqueId(): string {
    return this.uniqueId;
  }

  getRoot(): HTMLElement | false {
    const root = this.rootElement || false;

    if (!root) throw new Error("The root element of the editor was not found.");

    return root;
  }

  render(): void {
    const editorId = this.editor.config.get("handle", "texditor");

    if (!queryLength("#" + editorId)) throw new Error("The editor's ID was not found.");

    let editorElement = null;
    query("#" + editorId, (el: HTMLElement) => {
      this.setRoot(el);
      append(el, MainView(this.editor));
      editorElement = el;
    });

    if (editorElement) {
      query(
        this.css("block"),
        (item: HTMLElement) => {
          const block = item as HTMLBlockElement;
          block.blockModel.onRender();
        },
        editorElement
      );
    }
  }

  isEmpty(): boolean {
    const blocksContainer = this.editor.blockManager.getContainer(),
      html = blocksContainer?.innerHTML;

    return (
      isEmptyString(blocksContainer?.innerHTML || "") ||
      html == "<br>" ||
      html == "\n" ||
      html == "\r" ||
      html == "\n\n" ||
      html == "\r\n" ||
      !blocksContainer?.childNodes?.length
    );
  }

  setCss(object: { [key: string]: string }) {
    Object.assign(this.cssNames, object);
  }

  css(key: string, dot = true): string {
    return this.cssNames[key] ? (dot ? "." : "") + this.cssNames[key] : "";
  }

  setContent(content: OutputBlockItem[], index: number | null = null): void {
    const { blockManager, parser } = this.editor;
    const container = blockManager.getContainer();

    if (container) {
      container.innerHTML = "";

      const blocks = parser.parseBlocks(content, true);
      append(container, blocks);

      if (index !== null) blockManager.setIndex(index);

      blockManager.detectEmpty(false);
      blockManager.normalize();
    }
  }

  getContent(): OutputBlockItem[] {
    return this.save();
  }

  save(): OutputBlockItem[] {
    const data: OutputBlockItem[] = [];
    const { events, parser, config } = this.editor,
      root = this.getRoot();

    events.trigger("save");

    if (!root) return [];

    query(
      this.css("block"),
      (el: HTMLBlockElement) => {
        events.trigger("saveEach", el);

        if (el.dataset?.type) {
          const extOptions = findDatasetsWithPrefix(el, "options");
          let block: OutputBlockItem = {
            type: el.dataset.type,
            data: [],
            ...extOptions
          };

          if (el.blockModel?.isCustomSave()) {
            const savedBlock = el.blockModel.save(block);
            block = savedBlock as OutputBlockItem;
          } else {
            for (const itemData in el.dataset) {
              if ((config.get("blockParseDataset", []) as string[]).includes(itemData)) {
                block[itemData] = el.dataset[itemData];
              }
            }
            if (el.localName === "textarea") {
              block.data = [el.value];
            } else if (el?.blockModel?.isRawOutput()) {
              block.data = [el.innerText];
            } else {
              const parsedData = parser.htmlToData(el.innerHTML);

              block.data = parsedData.filter(
                (item) => typeof item === "string" || (typeof item === "object" && item !== null)
              ) as BlockItemData;
            }
          }

          if (block.data.length) data.push(block);
        }

        events.trigger("saveEachEnd", el);
      },
      root
    );

    events.trigger("saveEnd");

    return data;
  }

  getModels(): BlockModelStructure[] {
    if (this.blockModels.length > 0) return this.blockModels;

    const blockModels = this.editor.config.get("blockModels", []);

    if (!blockModels) return [];

    if (blockModels.length == 0) {
      blockModels.push(Paragraph);
    }

    (blockModels as BlockModelInstanceInterface[]).forEach((model: BlockModelInstanceInterface) => {
      const md = new model(this.editor);

      this.blockModels.push({
        instance: model,
        model: md,
        type: md.getType(),
        types: [md.getType(), ...md.getRelatedTypes()],
        translation: md.getTranslation(),
        icon: md.getIcon()
      });
    });

    return this.blockModels;
  }

  getRealType(relatedName: string) {
    let type = null;

    (this.getModels() as BlockModelStructure[]).forEach((model: BlockModelStructure) => {
      if (model.types && model.types.includes(relatedName)) {
        type = model.type;
      }
    });

    return type;
  }

  setDisplay(wrap = "", visible: string = "") {
    const root = this.getRoot();

    if (root) query(this.css(wrap), (el: HTMLElement) => (el.style.display = visible), root);
  }

  destroy(): void {
    const { actions, blockManager, events, extensions, historyManager, toolbar } = this.editor;
    if (this.rootElement) this.rootElement.innerHTML = "";

    const models = this.getModels();

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
