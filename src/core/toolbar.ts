import Texditor from "@/texditor";
import { addClass, append, css, hasClass, query, removeClass } from "@/utils/dom";
import { off, on } from "@/utils/events";
import { ToolModelInstanceInterface } from "@/types/core/models";
import { isEmptyString } from "@/utils/string";
import { detectMobileOS, getCaretPosition } from "@/utils/common";
import { BoldTool, ItalicTool, InlineCodeTool, LinkTool, MarkerTool, SubscriptTool, SuperscriptTool, ClearFormatingTool } from "@/tools";
export default class Toolbar {
  private editor: Texditor;
  private tools: ToolModelInstanceInterface[] = [];

  constructor(editor: Texditor) {
    this.editor = editor;
    this.show = this.show.bind(this);

    const tools = this.editor.config.get("tools", []) as ToolModelInstanceInterface[];
    if (tools.length) {
      tools.forEach((toolModel: ToolModelInstanceInterface) => {
        this.register(toolModel);
      });
    } else {
      // Register default tools
      this.register(BoldTool);
      this.register(ItalicTool);
      this.register(LinkTool);
      this.register(SubscriptTool);
      this.register(SuperscriptTool);
      this.register(MarkerTool);
      this.register(InlineCodeTool);
      this.register(ClearFormatingTool);
    }
  }

  render() {
    const { events } = this.editor;

    events.trigger("toolbar:render");
    this.hide();
    events.trigger("toolbar:render:end");
  }

  show(fixed: boolean = true) {
    const { api, blockManager, selectionApi } = this.editor,
      root = api.getRoot(),
      model = blockManager.getModel(),
      tools = model?.getTolls(),
      uniqueId = api.getUniqueId();

    if (root) {
      if (!tools) return;

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
            on(window, "resize." + uniqueId, () => reposition());
            on(window, "scroll." + uniqueId, () => reposition());
          }
        },
        root
      );
    }
  }

  highlightActiveTools() {
    const { api, selectionApi } = this.editor,
      cssName = api.css("tool"),
      curElement = selectionApi.current()?.element,
      root = api.getRoot();

    if (!root) return;

    query(cssName, (el: HTMLElement) => removeClass(el, "active"), root);

    if (!curElement) return;

    const tags = selectionApi.findTags(curElement);

    if (tags.length) {
      query(
        cssName,
        (el: HTMLElement) => {
          tags.forEach((selected: HTMLElement) => {
            if (hasClass(el, "tool-tag-" + selected.localName) && !isEmptyString(selected?.textContent || ""))
              addClass(el, "active");
          });
        },
        root
      );
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

  register(action: ToolModelInstanceInterface) {
    this.tools.push(action);
  }

  apply() {
    const { api } = this.editor,
      root = api.getRoot(),
      cssName = api.css("toolbar");

    if (root) {
      this.tools.forEach((ToolClass: ToolModelInstanceInterface) => {
        const action = new ToolClass(this.editor);

        if (action?.create) {
          const actionElement = action.create();

          query(
            cssName + " " + cssName + "-tools",
            (el: HTMLElement) => {
              append(el, actionElement);
            },
            root
          );

          if (action.applyEvents) action.applyEvents();
        }
      });
    }
  }

  destroy() {
    const { api } = this.editor,
      uniqueId = api.getUniqueId();
    this.tools.forEach((ToolClass: ToolModelInstanceInterface) => {
      const action = new ToolClass(this.editor);

      if (action.destroy) action.destroy();
    });

    off(window, "resize." + uniqueId);
    off(window, "scroll." + uniqueId);
  }
}
