import type { ToolModelInterface, ToolModelConfig } from "@/types";
import {
  IconArrowRight,
  IconClearFormatting,
  IconLink,
  IconNewTab,
  IconTrash
} from "@/icons";
import ToolModel from "@/core/models/tool-model";
import {
  addClass,
  append,
  attr,
  closest,
  css,
  data,
  html,
  make,
  query,
  replaceWithChildren,
  toggleClass
} from "@/utils/dom";
import "@/styles/tools/link.css";
import { off, on, rebind } from "@/utils/events";
import { renderIcon } from "@/utils/icon";

export default class LinkTool extends ToolModel {
  /**
   * Get tool configuration
   * @returns Partial tool configuration
   */
  protected configure(): Partial<ToolModelConfig> {
    return {
      name: "link",
      tagName: 'a',
      icon: IconLink,
      iconWidth: 16,
      iconHeight: 16
    }
  }

  /**
   * Handle click event on the link tool
   * Opens form for creating or editing a link 
   */
  protected onClick(): void {
    const { selectionApi, commands } = this.editor;
    selectionApi.selectCurrent();
    const [linkTag] = commands.findTags(this.getTagName());

    if (linkTag) {
      const isBlank = attr(linkTag, "target") === "_blank";
      this.createForm(attr(linkTag, "href") || "", isBlank);
    } else {
      this.createForm();
    }
  }

  /**
   * Hook called after format is applied
   * Updates link attributes based on form values
   * @param tags - Array of formatted link elements 
   */
  onFormat(tags: HTMLLinkElement[]): void {
    const uniqueId = this.getEventId(),
      formElement = document.getElementById("form-link-" + uniqueId),
      valElement = document.getElementById(
        "input-link-" + uniqueId
      ) as HTMLInputElement;

    if (formElement && valElement) {
      tags.forEach((link) => {
        if (valElement?.value) attr(link, "href", valElement?.value);

        if (data(formElement, 'targetBlank') == 'Y')
          attr(link, "target", "_blank");
      });
    }
  }

  /**
   * Remove link form from the toolbar 
   */
  private removeForm() {
    const root = this.editor.getRoot();

    if (root) {
      query('.tex-tools-content', (content: HTMLElement) => css(content, 'display', 'none'), root);
      query('.tex-tools-list', (tools: HTMLElement) => css(tools, 'display', ''), root);
      query(".tex-link-form", (el: HTMLElement) => el.remove(), root);
    }
  }

  /**
   * Create link editing form in the toolbar
   * @param link - Initial link URL value
   * @param targetBlank - Whether the link should open in a new tab 
   */
  private createForm(link: string = "", targetBlank: boolean = false) {
    const { commands, selectionApi, i18n } = this.editor,
      uniqueId = this.getEventId(),
      root = this.editor.getRoot();

    const linkForm = make("div", (el: HTMLElement) => {
      el.id = "form-link-" + uniqueId;
      data(el, 'targetBlank', 'N');
      addClass(el, "tex-link-form");

      // Create target blank toggle button
      append(
        el,
        make("div", (btn: HTMLInputElement) => {
          addClass(btn, "tex-link-form-btn tex-link-form-target-btn");

          if (targetBlank) {
            addClass(btn, "tex-active");
            data(el, 'targetBlank', 'Y');
          }

          on(btn, "click.link", () => {
            const isBlank = data(el, 'targetBlank') == "Y";
            data(el, 'targetBlank', isBlank ? "N" : "Y");
            toggleClass(btn, "tex-active");
          });
          html(
            btn,
            renderIcon(IconNewTab, {
              width: 14,
              height: 14
            })
          )

          btn.title = i18n.get("openInNewTab", "Open in a new tab");
        })
      );

      // Create link input field
      append(
        el,
        make("input", (input: HTMLInputElement) => {
          attr(input, "type", "text");
          input.id = "input-link-" + uniqueId;
          input.value = link;
          input.placeholder = i18n.get("enterLink", "Enter the link");
          addClass(input, "tex-link-input");
          rebind(input, "keydown.link", (evt: KeyboardEvent) => {
            if (evt.key == "Enter") {
              evt.preventDefault();
              this.format();
              document.body?.click();
            }
          });
          setTimeout(() => input.focus(), 10);
        })
      );

      // Create delete link button
      append(
        el,
        make("div", (btn: HTMLElement) => {
          addClass(btn, "tex-link-form-btn tex-link-form-del-btn");
          html(
            btn,
            renderIcon(IconTrash, {
              width: 18,
              height: 18
            })
          )
          btn.title = i18n.get("delete", "Delete");
          on(btn, "click.link", () => {
            selectionApi.selectCurrent();
            const [linkTag] = commands.findTags(this.getTagName());

            if (linkTag)
              replaceWithChildren(linkTag);

            document.body.click();
          });
        })
      );

      // Create clear formatting button
      append(
        el,
        make("div", (btn: HTMLElement) => {
          addClass(btn, "tex-link-form-btn tex-link-form-clean-btn");
          html(
            btn,
            renderIcon(IconClearFormatting, {
              width: 14,
              height: 14
            })
          )

          btn.title = i18n.get("delete", "Delete");
          rebind(btn, "click.link", () => {
            this.removeFormat();
            document.body?.click();
          });
        })
      );

      // Create done/submit button
      append(
        el,
        make("div", (btn: HTMLInputElement) => {
          html(
            btn,
            renderIcon(IconArrowRight, {
              width: 18,
              height: 18
            })
          );
          addClass(btn, "tex-link-form-btn");
          btn.title = i18n.get("done", "Done");
          rebind(btn, "click.link", () => {
            this.removeFormat();
            this.forcedFormat();
            document.body?.click();
          });
        })
      );
    });

    const content = "tex-tools-content";

    if (root) {
      query('.' + content, (content: HTMLElement) => css(content, 'display', 'block'), root);
      query('.tex-tools-list', (tools: HTMLElement) => css(tools, 'display', 'none'), root);
      query(
        '.' + content,
        (content: HTMLElement) => {
          append(content, linkForm);
        },
        root
      );
    }

    // Handle click outside to close form
    setTimeout(() => {
      if (root) {
        on(document, "click.link" + uniqueId, (evt: MouseEvent) => {
          query(
            ".tex-link-form",
            (el: HTMLElement) => {
              if (!closest(evt.target, el)) {
                this.removeForm();
                off(document, "click.link" + uniqueId);
              }
            },
            root
          );
        });
      }
    }, 100);
  }

  /**
   * Destroy link tool instance and clean up resources 
   */
  destroy(): void {
    off(document, "click.link" + this.getEventId());
  }
}