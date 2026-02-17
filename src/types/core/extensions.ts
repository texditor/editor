export interface ExtensionsInterface {
  // Render methods
  render(): HTMLElement | Node;

  // Fixed bar management
  fixedBar(): void;

  // Cleanup method
  destroy(): void;
}
