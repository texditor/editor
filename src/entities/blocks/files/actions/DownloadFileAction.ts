import type {
  FileActionModelConfig,
  FileActionModelInterface,
  FileActionElement
} from "@/types";
import { IconDownload } from "@/icons";
import FileActionModel from "@/core/models/file-action-model";
import { attr } from "@/utils";

export default class DownloadFileAction extends FileActionModel implements FileActionModelInterface {
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
      const itemNode = this.getItemNode();

      if (itemNode) {
        const contentElement = model.getContentElement(),
          index = model.getItemIndex(itemNode)

        events.change({
          modelCode: this.getModelCode(),
          type: "download",
          contentElement: contentElement,
          blockElement: blockElement,
          item: itemNode,
          index: index,
        });
      }
    }
  }

  protected onMount(node: FileActionElement): void {
    const itemNode = this.getItemNode();

    if (itemNode) {
      const url = itemNode.fileUrl;
      const name = itemNode.fileName || "";

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
