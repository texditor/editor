import type { ActionModelInstanceInterface } from ".";

export interface ActionsInterface {
  // Action management methods
  register(action: ActionModelInstanceInterface): void;
  apply(): void;

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