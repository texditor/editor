export interface ExtensionsInterface {
  /**
   * Sets up fixed positioning behavior for extensions bar
   * Attaches scroll, load, and resize event listeners
   * Makes extensions bar sticky when scrolling past editor
   */
  apply(): void;

  /**
   * Destroys the extensions manager
   * Removes all event listeners and cleans up
   * Should be called when editor is being destroyed
   */
  destroy(): void;
}