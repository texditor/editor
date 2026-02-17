import { IconDownload } from "@/icons";
import type { FileActionModelInterface, RenderIconContent } from "@/types";
import FileActionModel from "@/core/models/file-action-model";

export default class DownloadFileAction extends FileActionModel implements FileActionModelInterface {
  name: string = "download";
  protected icon: RenderIconContent = IconDownload;
  protected tagName: string = 'a'
  protected translation: string = "downloadFile";
  protected defaultTitle: string = "Download file";

  onCreate(el: HTMLLinkElement): HTMLElement {
    const currentItem = this.getItem();

    if (currentItem) {
      const url = currentItem?.dataset?.url;
      const name = currentItem?.fileName || ''

      if (url) {
        el.setAttribute('download', name || url.split('/').pop() || '');
        el.setAttribute('href', url);
        el.setAttribute('target', '_blank');
      }
    }

    return el;
  }
}
