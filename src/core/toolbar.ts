import Texditor from "@/texditor";
import { addClass, append, css, hasClass, query, removeClass } from "@/utils/dom";
import { on } from "@/utils/events";
import { ToolModelInterface } from "@/types/core/models";
import { ToolModelInstanceInterface } from "@/types/core/models";
import BoldTool from "@/tools/bold";
import ClearFormatingTool from "@/tools/clear-formating";
import ItalicTool from "@/tools/italic";
import { isEmptyString } from "@/utils/string";
import LinkTool from "@/tools/link";
import { detectMobileOS, generateRandomString, getCaretPosition } from "@/utils/common";
import SuperscriptTool from "@/tools/superscript";
import SubscriptTool from "@/tools/subscript";
export default class Toolbar {
  private editor: Texditor;
  private tools: ToolModelInterface[] = [];

  constructor(editor: Texditor) {
    this.editor = editor;
    this.show = this.show.bind(this);

    // Register default tools
    const toolModels = this.editor.config.get("toolModels", []) as object[];
    if (toolModels.length) {
      (toolModels as ToolModelInterface[]).forEach((toolModel: ToolModelInterface) => {
        this.register(toolModel);
      });
    } else {
      this.register(BoldTool);
      this.register(ItalicTool);
      this.register(LinkTool);
      this.register(SubscriptTool);
      this.register(SuperscriptTool);
      this.register(ClearFormatingTool);
    }
  }

  render() {
    const { events } = this.editor;

    events.trigger("toolbar:render");
    this.hide();
    events.trigger("toolbar:render:end");
  }

  getTools(): ToolModelInterface[] {
    return this.tools;
  }

  show(fixed: boolean = true) {
    const { api, blockManager, config, selectionApi } = this.editor,
      root = api.getRoot(),
      model = blockManager.getModel(),
      tools = model?.getTolls();

    if (root) {
      if (!tools) return;

      const editorId = root.id || config.get("handle", generateRandomString(12));

      query(
        api.css("toolbar"),
        (el: HTMLElement) => {
          const toggleTool = (display: string = "") => {
            query(api.css("tool"), (tool: HTMLElement) => (tool.style.display = display), el);
          };

          toggleTool();

          if (tools.length) {
            toggleTool("none");
            tools.forEach((name: string) => {
              query(".tool-name-" + name, (tool: HTMLElement) => (tool.style.display = ""), el);
            });
          }

          if (fixed) {
            addClass(el, api.css("toolbarFixed", false));

            const reposition = () => {
              const rect = selectionApi.getFirstLineBounds(),
                contextMenuRect = getCaretPosition(),
                mobileDevice = detectMobileOS(),
                rootRect = root.getBoundingClientRect();

              if (rect) {
                let toolbarLeft = rect.left,
                  toolbarTop = 0;

                if (rect.left + el.offsetWidth > rootRect.width + rootRect.left)
                  toolbarLeft = rect.left - el.offsetWidth;

                if (toolbarLeft < 10) toolbarLeft = rootRect.left;

                const isTopNegative = rect.top - +el.offsetHeight < 10;

                if (
                  contextMenuRect?.y &&
                  (isTopNegative || (mobileDevice != "other" && contextMenuRect?.y > rect.top))
                ) {
                  toolbarTop = rect.top + contextMenuRect.y - rect.top + rect.height / 2 - 10;
                } else toolbarTop = rect.top - (el.clientHeight / 2 + 10) - rect.height;

                css(el, {
                  top: toolbarTop,
                  left: toolbarLeft
                });
              }
            };

            reposition();
            on(window, "resize." + editorId, () => reposition());
            on(window, "scroll." + editorId, () => reposition());
          }
        },
        root
      );
    }
  }

  highlightActiveTools() {
    const { api, selectionApi } = this.editor,
      cssName = api.css("tool"),
      curElement = selectionApi.current()?.element;

    query(cssName, (el: HTMLElement) => removeClass(el, "active"));

    if (!curElement) return;

    const tags = selectionApi.findTags(curElement);

    if (tags.length) {
      query(cssName, (el: HTMLElement) => {
        tags.forEach((selected: HTMLElement) => {
          if (hasClass(el, "tool-tag-" + selected.localName) && !isEmptyString(selected?.textContent || ""))
            addClass(el, "active");
        });
      });
    }
  }

  hide() {
    const { api } = this.editor,
      root = api.getRoot(),
      cssName = api.css("toolbar");

    if (root) {
      query(
        cssName,
        (el: HTMLElement) => {
          removeClass(el, api.css("toolbarFixed", false));
        },
        root
      );
    }
  }

  register(action: ToolModelInterface) {
    this.tools.push(action);
  }

  apply() {
    const { api } = this.editor,
      root = api.getRoot(),
      cssName = api.css("toolbar");

    if (root) {
      const tools = this.tools as ToolModelInstanceInterface[];

      tools.forEach((actionConstructor: ToolModelInstanceInterface) => {
        const action = new actionConstructor(this.editor);

        if (action?.create) {
          const actionElement = action.create();

          query(
            cssName + " " + cssName + "-tools",
            (el: HTMLElement) => {
              append(el, actionElement);
            },
            root
          );

          if (action?.applyEvents) action.applyEvents();
        }
      });
    }
  }
}
