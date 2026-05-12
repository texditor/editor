import type {
  Commands,
  BaseEvent,
  ToolModel as IToolModel,
  ToolModelConfig,
  ToolModelConstructor,
  ToolElement
} from "@/types";
import BaseModel from "../base/base-model";

export default class ToolModel extends BaseModel<ToolElement> implements IToolModel {
  /**
  * Set up global configuration
  * @param config - Partial configuration
  * @returns Model constructor
  */
  public static setup(
    config: Partial<ToolModelConfig>
  ): ToolModelConstructor {
    return super.setup(config) as ToolModelConstructor;
  }

  /**
   * Parent model configuration
   * @returns Parent model configuration
   */
  protected parentConfig(): Partial<ToolModelConfig> {
    return {
      __modelCode: 'tool',
      tagName: "div"
    }
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
    const { commands, events, selectionApi } = this.editor;

    selectionApi.selectCurrent();
    callback(tagName, commands, selectionApi);
    selectionApi.selectCurrent();

    const tags = commands.findTags(tagName, true);

    this.onFormat(tags);

    events.change({
      modelCode: this.getModelCode(),
      type: "format",
      name: this.getName()
    });
  }

  /**
   * @see IToolModel.format
   */
  format(onlyRemove: boolean = false): void {
    this.formatAction((tagName: string, commands: Commands) => {
      if (onlyRemove) commands.removeFormat(tagName);
      else commands.format(tagName);
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
    this.format(true);
  }

  /**
  * @see IToolModel.isSeparate
  */
  isSeparate(): boolean {
    return this.getConfig('separate', false) as boolean;
  }

  /**
   * Hook called after format is applied
   * @param _tags - Array of formatted HTML elements 
   */
  protected onFormat(_tags: HTMLElement[]): void { }

  /**
   * Handle click event
   * @param _evt - Custom event with element reference 
   */
  protected onClick(_evt: BaseEvent): void {
    if (this.isSeparate()) {
      const { selectionApi, commands } = this.editor;

      selectionApi.selectCurrent();

      const allTags = commands.findTags(),
        tags = commands.findTags(this.getTagName());

      if (allTags.length > tags.length)
        commands.clearAllFormatting();
    }

    this.format();
  }
  
  /**
    * Check if model element is visible
    * @returns True if model element should be displayed
    */
  isVisible(): boolean {
    const { blockManager } = this.editor;
    const blockModel = blockManager.getModel();

    if (blockModel) {
      const toolNames = blockModel.getAvailableTools();

      if (!toolNames.length)
        return true;

      return toolNames.includes(this.getName());
    }

    return true;
  }
}