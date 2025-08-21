import { FileItem, FilesCreateOptions } from "@/types/blocks";
import Files from "../files";
import { addClass, append, attr, make, prepend, query, removeClass } from "@/utils/dom";
import { HTMLBlockElement } from "@/types/core";
import { IconGallery, IconMultipleGrid, IconPlay, IconSingleGrid, IconSlider } from "@/icons";
import "@/styles/blocks/galllery.css";
import renderIcon from "@/utils/renderIcon";
import { off, on } from "@/utils/events";
import { OutputBlockItem } from "@/types/output";

export default abstract class Gallery extends Files {
  private defaultStyles: string[] = ["grid", "slider", "single"];

  configure() {
    return {
      ...super.configure(),
      ...{
        type: "gallery",
        tagName: "div",
        shortType: "g",
        listCss: "tex-gallery-list",
        cssClasses: "tex-gallery",
        itemCss: "tex-gallery-item",
        sourceWrapCss: "tex-gallery-item-source",
        icon: IconGallery,
        translationCode: "gallery",
        styles: ["grid", "slider", "single"],
        stylesLtr: "right",
        defaultStyle: "single"
      }
    };
  }

  private isStyles() {
    return (this.getConfig("styles", []) as string[]).every((key: string) => this.defaultStyles.includes(key));
  }

  private getDefaultStyle() {
    const defaultStyle = this.getConfig("defaultStyle", []) as string;

    if (!this.defaultStyles.includes(defaultStyle)) return "single";

    return defaultStyle;
  }

  protected onAfterFormCreate(el: HTMLElement, block: HTMLBlockElement, options?: FilesCreateOptions): HTMLElement {
    const { events, i18n } = this.editor,
      styles = this.getConfig("styles", []) as string[],
      defaultStyle = this.getDefaultStyle();

    if (this.isStyles()) {
      const ltr = this.getConfig("stylesLtr", "left");
      const setActveItem = (code: string) => {
        if (styles.includes(code)) {
          query(
            ".tex-gallery-style-item",
            (div: HTMLDivElement) => {
              removeClass(div, "tex-active");
            },
            el
          );
          query(
            ".tex-gallery-style-item-" + code,
            (div: HTMLDivElement) => {
              addClass(div, "tex-active");
            },
            el
          );
        }
      };

      const styleItem = (code: string, icon: string) => {
        return make("div", (item: HTMLDivElement) => {
          addClass(item, "tex-gallery-style-item tex-gallery-style-item-" + code);
          off(item, "click.style");
          on(item, "click.style", () => {
            setActveItem(code);
            block.dataset.optionsStyle = code;

            events.change({
              type: "galleryStyle",
              block: block
            });
          });
          item.innerHTML = renderIcon(icon, {
            width: 16,
            height: 16
          });
          attr(item, "title", i18n.get("appearance", "Appearance") + ": " + i18n.get(code));
        });
      };

      const stylePanel = make("div", (panel: HTMLDivElement) => {
        addClass(panel, "tex-gallery-styles");
        append(
          panel,
          make("div", (div: HTMLDivElement) => {
            addClass(div, "tex-gallery-style-list");
            const items = [];

            if (styles.includes("single")) items.push(styleItem("single", IconSingleGrid));
            if (styles.includes("grid")) items.push(styleItem("grid", IconMultipleGrid));
            if (styles.includes("slider")) items.push(styleItem("slider", IconSlider));

            append(div, items);
          })
        );
      });

      if (this.isStyles() && styles.length) {
        if (ltr === "right") append(el, stylePanel);
        else prepend(el, stylePanel);
        const setStyle = options?.style ? options.style : defaultStyle;
        setActveItem(setStyle as string);
      }
    }
    return el;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onSaveItem(item: FileItem, el: HTMLElement): FileItem {
    if (item.size) delete item.size;

    return item;
  }

  protected onSaveAfter(block: OutputBlockItem, blockElement: HTMLBlockElement): OutputBlockItem {
    const defaultStyle = this.getDefaultStyle();

    if (this.isStyles()) {
      if (blockElement.dataset.optionsStyle) {
        const style = blockElement.dataset.optionsStyle;
        if (style == "single") {
          blockElement.removeAttribute("data-option-style");

          if (block?.style) delete block.style;
        } else block.style = style;
      } else {
        if (defaultStyle && defaultStyle != "single") {
          block.style = defaultStyle;
        }
      }
    } else {
      if (block?.style) delete block.style;
    }

    return block;
  }

  protected onListCreate(items: FileItem[], block: HTMLBlockElement | null, options: FilesCreateOptions) {
    const styles = this.getConfig("styles", []) as string[];

    if (this.isStyles()) {
      if (options?.style && block) {
        const style = options.style as string;

        if (styles.includes(style)) block.dataset.optionsStyle = style;
      }
    }

    this.setRenderCallback(["image/jpeg", "image/png", "image/gif"], (item: FileItem): HTMLElement => {
      return make("img", (img: HTMLImageElement) => {
        img.src = item.url;
      });
    });

    this.setRenderCallback(
      ["video/mp4", "video/webm", "video/ogg", "video/mpeg", "video/quicktime", "video/x-msvideo"],
      (item: FileItem): HTMLElement => {
        const videoContainer = make("div", (vc: HTMLDivElement) => {
          const video = make("video", (video: HTMLVideoElement) => {
              append(
                video,
                make("source", (source: HTMLSourceElement) => {
                  source.src = item.url;
                  attr(source, "type", item.type);
                })
              );
            }),
            playIcon = make("div", (div: HTMLDivElement) => {
              addClass(div, "tex-gallery-item-play");
              div.innerHTML = renderIcon(IconPlay, {
                width: 18,
                height: 18
              });
            });

          append(vc, [video, playIcon]);
        });

        return videoContainer;
      }
    );

    return {
      items: items,
      block: block,
      options: options
    };
  }

  protected renderImage(item: FileItem): HTMLElement {
    return make("img", (img: HTMLImageElement) => {
      img.src = item.url;

      if (item.caption) img.alt = item.caption;
    });
  }

  protected saveImage(el: HTMLElement): FileItem | null {
    const file: FileItem = { url: "", type: el.dataset.type || "" };

    query(
      "img",
      (img: HTMLImageElement) => {
        file.url = img.src;

        if (img.alt) file.caption = img.alt;
      },
      el
    );

    if (!file.url || !file.type) return null;

    return file;
  }
}
