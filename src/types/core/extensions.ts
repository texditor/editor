import { ExtensionModel } from "./models";

export interface Extensions {
  /**
   * Gets all registered extension models.
   * @returns array of extension models.
   */
  getExtensions(): ExtensionModel[];

  /**
   * Refreshes the extensions UI.
   */
  refresh(): void;

  /**
   * Destroys the extensions manager.
   * Removes all event listeners and cleans up.
   * Should be called when editor is being destroyed.
   */
  destroy(): void;
}