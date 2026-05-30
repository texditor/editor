import type {
  Texditor,
  ToolModelConstructor,
  ToolModel,
  ToolElement,
  Tools as ITools
} from "@/types";

import {
  addClass,
  append,
  css,
  query,
  queryList,
  removeClass,
  off,
  rebind,
  isEmptyString,
  randString
} from "snappykit";

import {
  detectMobileOS,
  executeMethodIfExists,
  getCaretPosition
} from "@/utils/common";

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

export default class Tools implements ITools {
  /** Reference to the editor instance */
  private editor: Texditor;
  /** Collection of tool models available in the toolbar */
  private tools: ToolModel[] = [];
  /** Unique identifier for event listeners to prevent conflicts */
  private eventId: string = '.tool' + randString(12);

  /**
   * Create a new tools manager instance
   * @param editor - Editor instance reference
   */
  constructor(editor: Texditor) {
    this.editor = editor;

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

  /** @see ITools.show */
  show(): void {
    const { blockManager, selectionApi } = this.editor;
    const root = this.editor.getRoot(),
      cssName = 'tex-tools',
      blockElement = blockManager.getBlock();

    if (!root || !blockElement)
      return;

    const [toolsNode] = queryList<HTMLElement>('.' + cssName, root),
      [toolsListNode] = queryList<HTMLElement>('.' + cssName + '-list', root),
      [toolsContentElement] = queryList<HTMLElement>('.' + cssName + '-content', root);

    if (!toolsNode && !toolsListNode && !toolsContentElement)
      return;

    this.getTools().forEach((tool) => {
      executeMethodIfExists(tool, '__setBlockElement', [blockElement]);
      const node = tool.getElement();
      append(toolsListNode, node);

      if (!tool.isVisible())
        node.remove();

      executeMethodIfExists(tool, '__onMount', [node])
    })

    addClass(toolsNode, cssName + "-fixed tex-animate-fadeIn");

    const reposition = () => {
      const rect = selectionApi.getFirstLineBounds(),
        contextMenuRect = getCaretPosition(),
        mobileDevice = detectMobileOS(),
        rootRect = root.getBoundingClientRect();

      if (rect) {
        let toolsLeft = rect.left;
        let toolsTop = 0;

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
            rect.height / 2;
        } else
          toolsTop =
            rect.top - (toolsNode.clientHeight) - rect.height / 2;

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

  /** @see ITools.hide */
  hide(): void {
    const root = this.editor.getRoot();

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

  /** @see ITools.syncHighlight */
  syncHighlight(): void {
    const { selectionApi } = this.editor,
      cssName = ".tex-tool",
      curElement = selectionApi.getState()?.element,
      root = this.editor.getRoot();

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

  /** @see ITools.getTools */
  getTools(): ToolModel[] {
    return this.tools;
  }

  /** @see ITools.getModelByTagName */
  getModelByTagName(tagName: string): ToolModel | null {
    let model = null;
    this.getTools().forEach((tool) => {
      if (tool.getTagName() === tagName) {
        model = tool;
      }
    })

    return model;
  }

  /** @see ITools.destroy */
  destroy() {
    this.tools.forEach((tool) => tool.destroy());
    const eid = this.eventId;

    off(window, "resize" + eid);
    off(window, "scroll" + eid);
  }
}