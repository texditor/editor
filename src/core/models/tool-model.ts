import Texditor from "@/texditor";
import { generateRandomString } from "@/utils/common";
import { addClass, attr, make } from "@/utils/dom";
import { on } from "@/utils/events";
import renderIcon from "@/utils/renderIcon";
import Commands from "../commands";
import { ToolModelInterface } from "@/types/core/models";

export default class ToolModel implements ToolModelInterface {
  name: string = "";
  protected tagName: string = "";
  protected translation?: string;
  protected editor: Texditor;
  protected icon: string = "";
  protected detectActive: boolean = true;
  private randomId: string = generateRandomString(10);

  constructor(editor: Texditor) {
    this.editor = editor;
    this.onLoad();

    const { events } = this.editor;

    events.add("toolbar:render:end", () => {
      const element = this.getElement();

      if (element) {
        element.style.display = !this.isVisible() ? "none" : "";
      }
    });
  }

  onLoad(): void {}

  formatAction(callback: CallableFunction) {
    const tagName = this.getTagName(),
      { commands, events, selectionApi } = this.editor;

    selectionApi.selectCurrent();
    callback(tagName, commands, selectionApi);
    selectionApi.selectCurrent();
    this.onAfterFormat(commands.findTags(tagName, true));
    events.change({
      type: "format",
      name: this.getName()
    });
  }

  format(onlyRemove: boolean = false): void {
    this.formatAction((tagName: string, commands: Commands) => {
      if (onlyRemove) commands.removeFormat(tagName);
      else commands.format(tagName);
    });
  }

  forcedFormat(): void {
    this.formatAction((tagName: string, commands: Commands) => {
      commands.createFormat(tagName);
    });
  }

  removeFormat(): void {
    this.format(true);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClick(evt: Event) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAfterFormat(tags: HTMLElement[]): void {}

  handleClick(evt: Event): void {
    const { events } = this.editor;

    this.onClick(evt);

    events.change({
      type: "toolClick",
      name: this.getName()
    });

    events.refresh();
  }

  getId(): string {
    return this.editor.api.css("tool", false) + "-" + this.getName() + "-" + this.randomId;
  }

  getElement(): HTMLElement | null {
    return document.getElementById(this.getId());
  }

  getName(): string {
    return this.name;
  }

  getTagName(): string {
    return this.tagName;
  }

  create() {
    const { api, i18n } = this.editor,
      cssName = api.css("tool", false);

    return make("div", (el: HTMLElement) => {
      addClass(
        el,
        cssName +
          " tool-tag-" +
          this.getTagName() +
          " " +
          "tool-name-" +
          this.getName() +
          " " +
          cssName +
          "-" +
          this.getName()
      );

      attr(el, "title", i18n.get(this.translation || this.getName()));

      el.id = this.getId();

      if (this.icon) {
        el.innerHTML = renderIcon(this.icon, {
          width: 16,
          height: 16
        });
      } else {
        el.innerHTML = this.getName();
      }
    });
  }

  applyEvents() {
    const element = this.getElement();

    this.handleClick = this.handleClick.bind(this);

    if (element) on(element, "click.tm", this.handleClick);
  }

  isVisible() {
    return true;
  }

  destroy(): void {}
}
