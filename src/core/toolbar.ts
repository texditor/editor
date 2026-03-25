import type {
  TexditorInterface,
  ToolbarInterface,
  ToolModelInstanceInterface
} from "@/types";
import {
  addClass,
  append,
  css,
  hasClass,
  query,
  removeClass
} from "@/utils/dom";
import { off, on, rebind } from "@/utils/events";
import { isEmptyString } from "@/utils/string";
import { detectMobileOS, generateRandomString, getCaretPosition } from "@/utils/common";
import {
  BoldTool,
  ItalicTool,
  InlineCodeTool,
  LinkTool,
  MarkerTool,
  SubscriptTool,
  SuperscriptTool,
  ClearFormatingTool
} from "@/tools";
export default class Toolbar implements ToolbarInterface {
  private editor: TexditorInterface;
  private tools: ToolModelInstanceInterface[] = [];
  /** Unique identifier for event listeners to prevent conflicts */
  private eventId: string = '';

  constructor(editor: TexditorInterface) {
    this.editor = editor;
    this.eventId = generateRandomString(12);
    this.show = this.show.bind(this);

    const tools = this.editor.config.get(
      "tools",
      []
    ) as ToolModelInstanceInterface[];
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

  show(fixed: boolean = true) {
    const { api, blockManager, selectionApi } = this.editor,
      root = api.getRoot(),
      model = blockManager.getModel(),
      tools = model?.getTolls();

    if (root) {
      if (!tools) return;

      query(
        ".tex-toolbar",
        (el: HTMLElement) => {
          const toggleTool = (display: string = "") => {
            query(
              ".tex-tool",
              (tool: HTMLElement) => css(tool, 'display', display),
              el
            );
          };

          toggleTool();

          if (tools.length) {
            toggleTool("none");
            tools.forEach((name: string) => {
              query(
                ".tool-name-" + name,
                (tool: HTMLElement) => css(tool, 'display', ''),
                el
              );
            });
          }

          if (fixed) {
            addClass(el, "tex-toolbar-fixed");

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
                  (isTopNegative ||
                    (mobileDevice != "other" && contextMenuRect?.y > rect.top))
                ) {
                  toolbarTop =
                    rect.top +
                    contextMenuRect.y -
                    rect.top +
                    rect.height / 2 -
                    10;
                } else
                  toolbarTop =
                    rect.top - (el.clientHeight / 2 + 10) - rect.height;

                css(el, {
                  top: toolbarTop,
                  left: toolbarLeft
                });
              }
            };

            reposition();
            const eid = '.' + this.eventId;
            rebind(window, "resize" + eid, () => reposition());
            rebind(window, "scroll" + eid, () => reposition());
          }
        },
        root
      );
    }
  }

  highlightActiveTools() {
    const { api, selectionApi } = this.editor,
      cssName = ".tex-tool",
      curElement = selectionApi.current()?.element,
      root = api.getRoot();

    if (!root) return;

    query(
      cssName,
      (el: HTMLElement) => removeClass(el, "active"),
      root
    );

    if (!curElement) return;

    const tags = selectionApi.findTags(curElement);

    if (tags.length) {
      query(
        cssName,
        (el: HTMLElement) => {
          tags.forEach((selected: HTMLElement) => {
            if (
              hasClass(el, "tool-tag-" + selected.localName) &&
              !isEmptyString(selected?.textContent || "")
            )
              addClass(el, "active");
          });
        },
        root
      );
    }
  }

  hide() {
    const root = this.editor.api.getRoot();

    if (root) {
      query(
        '.tex-toolbar',
        (el: HTMLElement) => {
          removeClass(el, "tex-toolbar-fixed");
        },
        root
      );
    }
  }

  register(tool: ToolModelInstanceInterface) {
    this.tools.push(tool);
  }

  apply() {
    const root = this.editor.api.getRoot(),
      cssName = '.tex-toolbar';

    if (root) {
      this.tools.forEach((ToolClass: ToolModelInstanceInterface) => {
        const tool = new ToolClass(this.editor);

        if (tool?.create) {
          const toolElement = tool.create();

          query(
            cssName + " " + cssName + "-tools",
            (el: HTMLElement) => {
              append(el, toolElement);
            },
            root
          );

          if (tool.applyEvents) tool.applyEvents();
        }
      });
    }
  }

  destroy() {
    this.tools.forEach((ToolClass: ToolModelInstanceInterface) => {
      const tool = new ToolClass(this.editor);

      if (tool.destroy) tool.destroy();
    });

    const eid = '.' + this.eventId;

    off(window, "resize" + eid);
    off(window, "scroll" + eid);
  }
}
