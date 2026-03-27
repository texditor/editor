import type {
  FileItem,
  TexditorEvent,
  BlockNode,
  BlockOutput,
  FilesFormCreateParams,
  FilesListCreateParams
} from "@/types";
import Files from "../files";
import {
  addClass,
  append,
  attr,
  html,
  make,
  prepend,
  query,
  removeClass
} from "@/utils/dom";
import {
  IconGallery,
  IconMultipleGrid,
  IconPlay,
  IconSingleGrid,
  IconSlider
} from "@/icons";
import "@/styles/blocks/galllery.css";
import { renderIcon } from "@/utils/icon";
import { rebind } from "@/utils/events";
import "@/styles/core/ui/slider.css";
import Slider from "@/core/ui/slider";

export default class Gallery extends Files {
  private defaultStyles: string[] = ["grid", "slider", "single"];
  private slider?: Slider;

  configure() {
    return {
      ...super.configure(),
      ...{
        type: "gallery",
        tagName: "div",
        groupCode: 'gallery',
        listCss: "tex-gallery-list",
        cssClasses: "tex-gallery",
        icon: IconGallery,
        translationCode: "gallery",
        styles: ["grid", "slider", "single"],
        stylesLtr: "right",
        defaultStyle: "single",
        renderImage: false,
        sliderInfinite: true,
        imageMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/avif",
          "image/bmp"
        ],
        videoMimeTypes: [
          "video/mp4",
          "video/webm",
          "video/ogg",
          "video/mpeg",
          "video/quicktime",
          "video/x-msvideo"
        ]
      }
    };
  }

  private isStyles() {
    const styles = this.getConfig("styles", []) as string[];

    return (styles).every((key: string) =>
      this.defaultStyles.includes(key)
    );
  }

  private getDefaultStyle() {
    const defaultStyle = this.getConfig("defaultStyle", []) as string;

    if (!this.defaultStyles.includes(defaultStyle)) return "single";

    return defaultStyle;
  }

  protected onFormCreate({ el, blockNode, options }: FilesFormCreateParams): HTMLElement {
    const { blockManager, events, i18n } = this.editor,
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
          addClass(
            item,
            "tex-gallery-style-item tex-gallery-style-item-" + code
          );
          rebind(item, "click.style", () => {
            setActveItem(code);
            blockNode.dataset.optionsStyle = code;
            this.destroySlider();
            events.change({
              type: "galleryStyle",
              index: blockManager.getIndex(),
              blockNode: blockNode,
              contentNode: this.getContentNode(),
            });
            this.initSlider(code === "slider");
          });
          html(
            item,
            renderIcon(icon, {
              width: 16,
              height: 16
            })
          )
          attr(
            item,
            "title",
            i18n.get("appearance", "Appearance") + ": " + i18n.get(code)
          );
        });
      };

      const stylePanel = make("div", (panel: HTMLDivElement) => {
        addClass(panel, "tex-gallery-styles");
        append(
          panel,
          make("div", (div: HTMLDivElement) => {
            addClass(div, "tex-gallery-style-list");
            const items = [];

            if (styles.includes("single"))
              items.push(styleItem("single", IconSingleGrid));
            if (styles.includes("grid"))
              items.push(styleItem("grid", IconMultipleGrid));
            if (styles.includes("slider"))
              items.push(styleItem("slider", IconSlider));

            append(div, items);
          })
        );
      });

      if (this.isStyles() && styles.length) {
        const ltrClass =
          ltr === "right" ? "tex-gallery-right" : "tex-gallery-left";

        if (ltr === "right") append(el, stylePanel);
        else prepend(el, stylePanel);

        removeClass(el, "tex-gallery-right");
        removeClass(el, "tex-gallery-left");
        addClass(el, ltrClass);

        const setStyle = options?.style ? options.style : defaultStyle;
        setActveItem(setStyle as string);
      }
    }
    return el;
  }

  protected onSaveItem(
    item: FileItem,
    _el: HTMLElement
  ): FileItem {
    if (item.size) delete item.size;

    return item;
  }

  protected onSaveAfter(
    block: BlockOutput,
    blockNode: BlockNode
  ): BlockOutput {
    const defaultStyle = this.getDefaultStyle();

    if (this.isStyles()) {
      if (blockNode.dataset.optionsStyle) {
        const style = blockNode.dataset.optionsStyle;
        if (style == "single") {
          blockNode.removeAttribute("data-option-style");

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

  protected initSlider(
    isSlider: boolean = false,
    onChange?: (index: number) => void
  ) {
    const { events } = this.editor;
    const node = this.getBlockNode();
    const isSliderBlock = node?.dataset?.optionsStyle === "slider" || isSlider;

    if (node && isSliderBlock) {
      query(
        ".tex-files-list-container",
        (cnt: HTMLDivElement) => {
          this.slider = new Slider(cnt, {
            infinite: this.getConfig("sliderInfinite", true) as boolean,
            onChange: onChange
          });
        },
        node
      );
      events.add("onChange.fileAction", (evt: TexditorEvent) => {
        if (evt?.isFileAction) {
          const lastIndex = evt.index || 0;

          this.destroySlider();
          this.initSlider(true, onChange);
          this.slider?.goToSlide(lastIndex);
        }
      });
    }
  }

  private destroySlider() {
    const { events } = this.editor;
    this.slider?.destroy();
    events.remove("onChange", "fileActionSlider");
  }

  onRender(): void {
    this.initSlider();
  }

  protected onListCreate({
    items,
    blockNode,
    contentElement,
    options
  }: FilesListCreateParams) {
    const styles = this.getConfig("styles", []) as string[];

    if (this.isStyles()) {
      if (options?.style && blockNode) {
        const style = options.style as string;

        if (styles.includes(style)) blockNode.dataset.optionsStyle = style;
      }
    }

    this.setRenderCallback(
      this.getConfig("imageMimeTypes", []) as string[],
      (item: FileItem): HTMLElement => {
        return make("img", (img: HTMLImageElement) => {
          img.src = item.url;
        });
      }
    );

    this.setRenderCallback(
      this.getConfig("videoMimeTypes", []) as string[],
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
      blockNode: blockNode,
      contentElement: contentElement,
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
