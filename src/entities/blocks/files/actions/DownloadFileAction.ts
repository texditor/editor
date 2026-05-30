import type {
  FileActionModelConfig,
  FileActionElement
} from "@/types";
import { IconDownload } from "@/icons";
import FileActionModel from "@/core/models/file-action-model";
import { attr } from "snappykit";

export default class DownloadFileAction extends FileActionModel {
  protected configure(): Partial<FileActionModelConfig> {
    return {
      name: 'download',
      icon: IconDownload,
      elementTagName: 'a',
      translation: 'downloadFile',
    }
  }

  protected onClick(): void {
    const { events } = this.editor,
      blockElement = this.getBlockElement();

    const model = blockElement?.baseModel;

    if (blockElement && model) {
      const itemElement = this.getItemElement();

      if (itemElement) {
        const contentElement = model.getContentElement(),
          index = model.getItemIndex(itemElement)

        events.change({
          modelCode: this.getModelCode(),
          type: "download",
          contentElement: contentElement,
          blockElement: blockElement,
          item: itemElement,
          index: index,
        });
      }
    }
  }

  /**
   * Hook called after mounting to the DOM
   * @param _el - The mounted DOM element
   */
  protected onMount(node: FileActionElement): void {
    const itemElement = this.getItemElement();

    if (itemElement) {
      const url = itemElement.fileUrl;
      const name = itemElement.fileName || "";

      if (url) {
        attr(node, {
          href: url,
          target: '_blank',
          download: name || url.split("/").pop() || ""
        })
      }
    }
  }
}
