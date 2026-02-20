import type {
  APIInterface,
  HTMLBlockElement,
  TexditorInterface,
  BlockItemData,
  OutputBlockItem
} from "@/types";
import {
  queryLength,
  query,
  append,
  findDatasetsWithPrefix
} from "@/utils/dom";
import { isEmptyString } from "@/utils/string";
import MainView from "@/views/main";
import { generateRandomString } from "@/utils/common";

export default class API implements APIInterface {
  private editor: TexditorInterface;
  private rootElement?: HTMLElement;
  private uniqueId: string = "";

  constructor(editor: TexditorInterface) {
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

    if (!queryLength("#" + editorId))
      throw new Error("The editor's ID was not found.");

    let editorElement = null;
    query("#" + editorId, (el: HTMLElement) => {
      this.setRoot(el);
      append(el, MainView(this.editor));
      editorElement = el;
    });

    if (editorElement) {
      query(
        ".tex-block",
        (item: HTMLElement) => {
          const blockElement = item as HTMLBlockElement;
          blockElement.blockModel.onRender();
          blockElement.blockModel.__onRenderComplete__();
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
    const { blockManager, events, parser, config } = this.editor,
      root = this.getRoot();

    events.trigger("save");

    if (!root) return [];

    query(
      ".tex-block",
      (el: HTMLBlockElement) => {
        events.trigger("saveEach", { blockElement: el });

        if (el.dataset?.type) {
          const extOptions = findDatasetsWithPrefix(el, "options");
          let block: OutputBlockItem = {
            type: el.dataset.type,
            data: [],
            ...extOptions
          };

          const blockContent = blockManager.getBlockContentElement(el);

          if (blockContent) {
            if (el.blockModel?.isCustomSave()) {
              block = el.blockModel.save(block, el);
            } else {
              for (const itemData in el.dataset) {
                if (
                  (config.get("blockParseDataset", []) as string[]).includes(
                    itemData
                  )
                ) {
                  block[itemData] = el.dataset[itemData];
                }
              }
              if (el.localName === "textarea") {
                block.data = [(blockContent as HTMLTextAreaElement).value];
              } else if (el?.blockModel?.isRawOutput()) {
                block.data = [blockContent.innerText];
              } else {
                const parsedData = parser.htmlToData(blockContent.innerHTML);

                block.data = parsedData.filter(
                  (item) =>
                    typeof item === "string" ||
                    (typeof item === "object" && item !== null)
                ) as BlockItemData;
              }
            }
          }


          if (block.data.length) data.push(block);
        }

        events.trigger("saveEachEnd", { blockElement: el });
      },
      root
    );

    events.trigger("saveEnd");

    return data;
  }

  setDisplay(name: string = "", visible: string = "") {
    const root = this.getRoot();

    if (root)
      query(
        "." + name,
        (el: HTMLElement) => (el.style.display = visible),
        root
      );
  }

  destroy(): void {
    const {
      actions,
      blockManager,
      events,
      extensions,
      historyManager,
      toolbar
    } = this.editor;
    if (this.rootElement) this.rootElement.innerHTML = "";

    const models = blockManager.getBlockModels();

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
