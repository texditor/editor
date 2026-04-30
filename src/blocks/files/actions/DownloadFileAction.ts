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
      nodeTagName: 'a',
      translation: 'downloadFile',
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
