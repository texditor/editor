import type { ToolModelInterface } from "@/types";
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
  make,
  query,
  replaceWithChildren,
  toggleClass
} from "@/utils/dom";
import "@/styles/tools/link.css";
import { off, on } from "@/utils/events";
import { renderIcon } from "@/utils/icon";

export default class LinkTool extends ToolModel implements ToolModelInterface {
  name: string = "link";
  protected tagName: string = "a";
  protected tranlation: string = "link";
  protected icon: string = IconLink;
  private tagsInSelection: HTMLLinkElement[] = [];

  onClick() {
    const tags = this.tagsInSelection;

    if (tags.length) {
      const isBlank = attr(tags[0], "target") === "_blank";
      this.createForm(attr(tags[0], "href") || "", isBlank);
    } else {
      this.createForm();
    }
  }

  onLoad(): void {
    const { commands, events } = this.editor;

    if (!events.exists("onSelectionChangeToolbarShow.link")) {
      events.add("onSelectionChangeToolbarShow.link", () => {
        this.tagsInSelection = commands.findTags(
          this.getTagName()
        ) as HTMLLinkElement[];
      });
    }
  }

  onAfterFormat(tags: HTMLLinkElement[]): void {
    const { api } = this.editor,
      uniqueId = api.getUniqueId(),
      formElement = document.getElementById("form-link-" + uniqueId),
      valElement = document.getElementById(
        "input-link-" + uniqueId
      ) as HTMLInputElement;

    if (formElement && valElement) {
      tags.forEach((link) => {
        if (valElement?.value) attr(link, "href", valElement?.value);

        if (formElement.dataset.targetBlank == "Y")
          attr(link, "target", "_blank");
      });
    }
  }

  private removeForm() {
    const { api } = this.editor,
      root = api.getRoot();

    if (root) {
      api.setDisplay("toolbarContent", "none");
      api.setDisplay("toolbarTools");
      query(".tex-link-form", (el: HTMLElement) => el.remove(), root);
    }
  }

  private createForm(link: string = "", targetBlank: boolean = false) {
    const { api, i18n } = this.editor,
      uniqueId = api.getUniqueId(),
      root = api.getRoot();

    const linkForm = make("div", (el: HTMLElement) => {
      el.id = "form-link-" + uniqueId;
      el.dataset.targetBlank = "N";
      addClass(el, "tex-link-form");
      append(
        el,
        make("div", (btn: HTMLInputElement) => {
          addClass(btn, "tex-link-form-btn tex-link-form-target-btn");

          if (targetBlank) {
            addClass(btn, "tex-active");
            el.dataset.targetBlank = "Y";
          }

          on(btn, "click.link", () => {
            const isBlank = el.dataset.targetBlank == "Y";
            el.dataset.targetBlank = isBlank ? "N" : "Y";
            toggleClass(btn, "tex-active");
          });
          btn.innerHTML = renderIcon(IconNewTab, {
            width: 14,
            height: 14
          });
          btn.title = i18n.get("openInNewTab", "Open in a new tab");
        })
      );

      append(
        el,
        make("input", (input: HTMLInputElement) => {
          attr(input, "type", "text");
          input.id = "input-link-" + uniqueId;
          input.value = link;
          input.placeholder = i18n.get("enterLink", "Enter the link");
          addClass(input, "tex-link-input");
          on(input, "keydown.link", (evt: KeyboardEvent) => {
            if (evt.key == "Enter") {
              evt.preventDefault();
              this.format();
            }
          });
          setTimeout(() => input.focus(), 10);
        })
      );

      append(
        el,
        make("div", (btn: HTMLElement) => {
          addClass(btn, "tex-link-form-btn tex-link-form-del-btn");
          btn.innerHTML = renderIcon(IconTrash, {
            width: 18,
            height: 18
          });
          btn.title = i18n.get("delete", "Delete");
          on(btn, "click.link", () => {
            if (this.tagsInSelection[0])
              replaceWithChildren(this.tagsInSelection[0]);

            document.body.click();
          });
        })
      );

      append(
        el,
        make("div", (btn: HTMLElement) => {
          addClass(btn, "tex-link-form-btn tex-link-form-clean-btn");
          btn.innerHTML = renderIcon(IconClearFormatting, {
            width: 14,
            height: 14
          });
          btn.title = i18n.get("delete", "Delete");
          on(btn, "click.link", () => {
            this.removeFormat();
            document.body?.click();
          });
        })
      );

      append(
        el,
        make("div", (btn: HTMLInputElement) => {
          btn.innerHTML = renderIcon(IconArrowRight, {
            width: 18,
            height: 18
          });
          addClass(btn, "tex-link-form-btn");
          btn.title = i18n.get("done", "Done");
          on(btn, "click.link", () => {
            this.removeFormat();
            this.forcedFormat();
            document.body?.click();
          });
        })
      );
    });

    const content = "toolbarContent";

    api.setDisplay(content, "block");
    api.setDisplay("toolbarTools", "none");

    if (root) {
      query(
        api.css(content),
        (content: HTMLElement) => {
          append(content, linkForm);
        },
        root
      );
    }

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

  destroy() {
    const { api } = this.editor,
      uniqueId = api.getUniqueId();

    off(document, "click.link" + uniqueId);
  }
}
