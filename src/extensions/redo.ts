import type { RenderIconContent, ExtensionModelInterface } from "@/types";
import ExtensionModel from "@/core/models/extension-model";
import { IconRedo } from "@/icons";

export default class Redo
  extends ExtensionModel
  implements ExtensionModelInterface
{
  name: string = "redo";
  protected icon: RenderIconContent = IconRedo;
  protected translation: string = "redo";
  protected toggleActive: boolean = false;
  protected groupName: string = "history";

  onClick() {
    this.editor.historyManager.redo();
  }

  isActive(): boolean {
    return this.editor.historyManager.canRedo();
  }
}
