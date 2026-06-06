import type {
  Commands,
  ToolModel as IToolModel,
  ToolModelConfig,
  ToolModelConstructor,
  ToolElement,
  BlockElement,
} from '@/types';
import BaseModel from '../base/base-model';

export default class ToolModel extends BaseModel<ToolElement> implements IToolModel {
  /**
   * Reference to the parent block node that contains this action
   */
  private blockElement?: BlockElement;

  /**
   * Set up global configuration
   * @param config - Partial configuration
   * @returns Model constructor
   */
  public static setup(config: Partial<ToolModelConfig>): ToolModelConstructor {
    return super.setup(config) as ToolModelConstructor;
  }

  /**
   * @see IToolModel.getBlockElement
   */
  getBlockElement(): BlockElement | null {
    return this.blockElement || null;
  }

  /**
   * Parent model configuration
   * @returns Parent model configuration
   */
  protected parentConfig(): Partial<ToolModelConfig> {
    return {
      __modelCode: 'tool',
      tagName: 'div',
      override: true,
    };
  }

  /**
   * @see IToolModel.getTagName
   */
  getTagName(): string {
    return this.getConfig('tagName', '');
  }

  /**
   * Format action wrapper for tool operations
   * @param callback - Callback function that performs the formatting
   */
  private formatAction(callback: CallableFunction) {
    const tagName = this.getTagName();
    const { commands, events, selectionApi, tools } = this.editor;
    selectionApi.applyState();

    if (!this.isOverride()) {
      const allTags = commands.findTags(),
        tags = commands.findTags(this.getTagName());

      if (allTags.length > tags.length) commands.clearAllFormatting();
    } else {
      const allTags = commands.findTags();

      allTags.forEach((tag) => {
        const toolModel = tools.getModelByTagName(tag.localName);
        if (toolModel && !toolModel.isOverride()) {
          commands.removeFormat(toolModel.getTagName());
        }
      });
    }

    callback(tagName, commands, selectionApi);
    selectionApi.applyState();

    const tags = commands.findTags(tagName, true);

    this.onFormat(tags);

    events.change({
      modelCode: this.getModelCode(),
      type: 'format',
      name: this.getName(),
      blockElement: this.getBlockElement(),
    });
  }

  /**
   * @see IToolModel.format
   */
  format(): void {
    this.formatAction((tagName: string, commands: Commands) => {
      commands.format(tagName);
    });
  }

  /**
   * @see IToolModel.forcedFormat
   */
  forcedFormat(): void {
    this.formatAction((tagName: string, commands: Commands) => {
      commands.createFormat(tagName);
    });
  }

  /**
   * @see IToolModel.removeFormat
   */
  removeFormat(): void {
    const { commands, events, selectionApi } = this.editor,
      tagName = this.getTagName();

    selectionApi.applyState();
    commands.removeFormat(tagName);
    selectionApi.applyState();

    events.change({
      modelCode: this.getModelCode(),
      type: 'removeFormat',
      name: this.getName(),
      blockElement: this.getBlockElement(),
    });
  }

  /**
   * @see IToolModel.isOverride
   */
  isOverride(): boolean {
    return this.getConfig('override', true) as boolean;
  }

  /**
   * Hook called after format is applied
   * @param _tags - Array of formatted HTML elements
   */
  protected onFormat(_tags: HTMLElement[]): void {}

  /**
   * Handle click event
   * @param _evt - Custom event with element reference
   */
  protected onClick(_evt: MouseEvent): void {
    this.format();
  }

  /**
   * Check if model element is visible
   * @returns True if model element should be displayed
   */
  isVisible(): boolean {
    const blockElement = this.getBlockElement();

    if (!blockElement) return false;

    const model = blockElement.baseModel;

    if (model) {
      const toolNames = model.getAvailableTools();

      if (!toolNames.length) return true;

      return toolNames.includes(this.getName());
    }

    return true;
  }

  /**
   * Internal method to set the parent block node reference
   * @param blockElement - Block node
   */
  __setBlockElement(blockElement: BlockElement): void {
    this.blockElement = blockElement;
  }
}
