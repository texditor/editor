import type {
  FileActionModelConfig,
  FileActionModelInterface,
  FileActionNode
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
      blockNode = this.getBlockNode();

    const model = blockNode?.baseModel;

    if (blockNode && model) {
      const itemNode = this.getItemNode();

      if (itemNode) {
        const contentNode = model.getContentNode(),
          index = model.getItemIndex(itemNode)

        events.change({
          modelCode: this.getModelCode(),
          type: "download",
          contentNode: contentNode,
          blockNode: blockNode,
          item: itemNode,
          index: index,
        });
      }
    }
  }

  protected onMount(node: FileActionNode): void {
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
