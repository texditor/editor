import type { ActionModelInstanceInterface, BlockNode } from ".";

export interface ActionsInterface {
  // Action management methods
  register(action: ActionModelInstanceInterface): void;
  create(blockNode: BlockNode): void;

  // Menu methods
  showMenu(items: HTMLElement[], title?: string): void;
  hideMenu(): void;

  // Actions visibility methods
  show(): void;
  hide(): void;

  // Render and reposition methods
  render(): void;

  // Cleanup method
  destroy(): void;
}
