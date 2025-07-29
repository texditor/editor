import { FileItem, FilesCreateOptions } from "@/types/blocks";
import Files from "../files";
import { addClass, append, attr, make, query } from "@/utils/dom";
import { HTMLBlockElement } from "@/types/core";
import { IconGallery, IconPlay } from "@/icons";
import "@/styles/blocks/galllery.css";
import renderIcon from "@/utils/renderIcon";

export default abstract class Gallery extends Files {
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
        translationCode: "gallery"
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onSaveItem(item: FileItem, el: HTMLElement): FileItem {
    return item;
  }

  protected onListCreate(items: FileItem[], block: HTMLBlockElement | null, options: FilesCreateOptions) {
    if (options?.style && block) {
      block.dataset.optionsStyle = options.style as string;
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
