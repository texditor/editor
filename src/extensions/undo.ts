import ExtensionModel from "@/core/models/extension-model";
import { IconUndo } from "@/icons";
import { ExtensionModelInterface } from "@/types/core/models";

export default class Undo extends ExtensionModel implements ExtensionModelInterface {
  name: string = "undo";
  protected icon: string = IconUndo;
  protected translation: string = "undo";
  protected toggleActive: boolean = false;
  protected groupName: string = "history";

  onClick() {
    this.editor.historyManager.undo();
  }

  isActive(): boolean {
    return this.editor.historyManager.canUndo();
  }
}
