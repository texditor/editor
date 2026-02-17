
import type { ToolModelInstanceInterface } from ".";

export interface ToolbarInterface {
    // Tool management methods
    register(action: ToolModelInstanceInterface): void;
    apply(): void;

    // Toolbar visibility methods
    show(fixed?: boolean): void;
    hide(): void;

    // Tool highlighting
    highlightActiveTools(): void;

    // Render and cleanup methods
    render(): void;
    destroy(): void;
}