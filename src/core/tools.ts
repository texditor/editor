import type {
  TexditorInterface,
  ToolsInterface,
  ToolModelConstructor,
  ToolModelInterface,
  ToolElement
} from "@/types";
import {
  addClass,
  append,
  css,
  query,
  queryList,
  removeClass
} from "@/utils/dom";
import { off, rebind } from "@/utils/events";
import { isEmptyString } from "@/utils/string";
import { detectMobileOS, executeMethodIfExists, generateRandomString, getCaretPosition } from "@/utils/common";
import {
  BoldTool,
  ItalicTool,
  InlineCodeTool,
  LinkTool,
  MarkerTool,
  SubscriptTool,
  SuperscriptTool,
  ClearFormattingTool
} from "@/entities/tools";

export default class Tools  {
  /** Reference to the editor instance */
  private editor: TexditorInterface;
  /** Collection of tool models available in the toolbar */
  private tools: ToolModelInterface[] = [];
  /** Unique identifier for event listeners to prevent conflicts */
  private eventId: string = '.tool' + generateRandomString(12);

  /**
   * Create a new tools manager instance
   * @param editor - Editor instance reference
   */
  constructor(editor: TexditorInterface) {
    this.editor = editor;

    this.show = this.show.bind(this);

    const tools = this.editor.config.get(
      "tools",
      []
    ) as ToolModelConstructor[];

    const toolModels = tools.length ? tools : [
      BoldTool,
      ItalicTool,
      InlineCodeTool,
      LinkTool,
      MarkerTool,
      SubscriptTool,
      SuperscriptTool,
      ClearFormattingTool
    ]

    toolModels.forEach((instance: ToolModelConstructor) => {
      this.tools.push(new instance(this.editor));
    });
  }

  /**
   * Show the toolbar at the current selection position
   */
  show(): void {
    const { api, selectionApi } = this.editor;
    const root = api.getRoot(),
      cssName = 'tex-tools';

    if (!root)
      return;

    const [toolsNode] = queryList('.' + cssName, root),
      [toolsListNode] = queryList('.' + cssName + '-list', root),
      [toolsContentElement] = queryList('.' + cssName + '-content', root);

    if (!toolsNode && !toolsListNode && !toolsContentElement)
      return;

    this.getTools().forEach((tool) => {
      const node = tool.getElement();
      append(toolsListNode, node);
      css(node, 'display', tool.isVisible() ? '' : 'none');
      executeMethodIfExists(tool, '__onMount', [node])
    })

    addClass(toolsNode, cssName + "-fixed tex-animate-fadeIn");

    const reposition = () => {
      const rect = selectionApi.getFirstLineBounds(),
        contextMenuRect = getCaretPosition(),
        mobileDevice = detectMobileOS(),
        rootRect = root.getBoundingClientRect();

      if (rect) {
        let toolsLeft = rect.left,
          toolsTop = 0;

        if (rect.left + toolsNode.offsetWidth > rootRect.width + rootRect.left)
          toolsLeft = rect.left - toolsNode.offsetWidth;

        if (toolsLeft < 10) toolsLeft = rootRect.left;

        const isTopNegative = rect.top - +toolsNode.offsetHeight < 10;

        if (
          contextMenuRect?.y &&
          (isTopNegative ||
            (mobileDevice != "other" && contextMenuRect?.y > rect.top))
        ) {
          toolsTop =
            rect.top +
            contextMenuRect.y -
            rect.top +
            rect.height / 2 -
            10;
        } else
          toolsTop =
            rect.top - (toolsNode.clientHeight / 2 + 10) - rect.height;

        css(toolsNode, {
          top: toolsTop,
          left: toolsLeft
        });
      }
    };

    reposition();
    const eid = this.eventId;
    rebind(window, "resize" + eid, () => reposition());
    rebind(window, "scroll" + eid, () => reposition());
  }

  /**
   * Synchronize active state highlighting for tools based on current selection 
   */
  syncHighlight() {
    const { api, selectionApi } = this.editor,
      cssName = ".tex-tool",
      curElement = selectionApi.current()?.element,
      root = api.getRoot();

    if (!root) return;

    query(
      cssName,
      (el: ToolElement) => removeClass(el, "active"),
      root
    );

    if (!curElement) return;

    const tags = selectionApi.findTags(curElement);

    if (tags.length) {
      query(
        cssName,
        (el: ToolElement) => {
          if (el.baseModel) {
            tags.forEach((selected: HTMLElement) => {
              if (
                el.baseModel.getTagName() === selected.localName &&
                !isEmptyString(selected?.textContent || "")
              )
                addClass(el, "active");
            });
          }
        },
        root
      );
    }
  }

  /**
   * Hide the toolbar 
   */
  hide() {
    const root = this.editor.api.getRoot();

    if (root) {
      query(
        '.tex-tools',
        (el: HTMLElement) => {
          removeClass(el, "tex-tools-fixed");
        },
        root
      );
    }
  }

  /**
   * Get all registered tools
   * @returns Array of tool models
   */
  getTools(): ToolModelInterface[] {
    return this.tools;
  }

  /**
   * Destroy tools manager and clean up resources 
   */
  destroy() {
    this.tools.forEach((tool) => tool.destroy());
    const eid = this.eventId;

    off(window, "resize" + eid);
    off(window, "scroll" + eid);
  }
}