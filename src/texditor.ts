import type {
  BlockManager as IBlockManager,
  Commands as ICommands,
  Config as IConfig,
  SelectionAPI as ISelectionAPI,
  Events as IEvents,
  Tools as ITools,
  I18N as II18N,
  HistoryManager as IHistoryManager,
  Extensions as IExtensions,
  BlockSchema,
  BlockSchemaData,
  ConfigOptions,
  Texditor as ITexditor,
  TexditorRootElement,
} from './types';
import Events from '@/core/events';
import BlockManager from '@/core/block-manager';
import Config from '@/core/config';
import SelectionAPI from '@/core/selection-api';
import Tools from '@/core/tools';
import I18N from '@/core/i18n';
import Commands from '@/core/commands';
import HistoryManager from '@/core/history-manager';
import Extensions from '@/core/extensions';
import MainView from '@/views/main';
import { queryLength, query, append, dataByPrefix, html, isEmptyString, queryList } from 'snappykit';
import { executeMethodIfExists, sanitizeJson } from './utils';
import '@/styles/texditor.css';
import '@/styles/animations.css';
import { mainStore } from './store/mainStore';

export * from './types';
export * from './utils';

export default class Texditor implements ITexditor {
  /** @see ITexditor.config */
  config: IConfig;

  /** @see ITexditor.blockManager */
  blockManager: IBlockManager;

  /** @see ITexditor.selectionApi */
  selectionApi: ISelectionAPI;

  /** @see ITexditor.events */
  events: IEvents;

  /** @see ITexditor.tools */
  tools: ITools;

  /** @see ITexditor.i18n */
  i18n: II18N;

  /** @see ITexditor.commands */
  commands: ICommands;

  /** @see ITexditor.historyManager */
  historyManager: IHistoryManager;

  /** @see ITexditor.extensions */
  extensions: IExtensions;

  /** Root HTML element where the editor is mounted */
  private rootElement?: TexditorRootElement;

  /**
   * Creates a new Texditor instance
   * @param config - Configuration object for the editor instance
   */
  constructor(config: ConfigOptions) {
    this.config = new Config(config);
    this.i18n = new I18N(this);
    this.events = new Events(this);
    this.historyManager = new HistoryManager(this);
    this.blockManager = new BlockManager(this);
    this.selectionApi = new SelectionAPI(this);
    this.tools = new Tools(this);
    this.commands = new Commands(this);
    this.extensions = new Extensions(this);
    this.ready();
  }

  /**
   * Initializes editor when ready
   */
  private ready() {
    this.mount();
    this.historyManager.save();
    executeMethodIfExists(this.extensions, '__apply');

    const readyCallback = this.config.get('onReady', false);

    if (typeof readyCallback === 'function') readyCallback(this);

    this.blockManager.detectEmpty();
    this.blockManager.normalize();
    this.events.refresh();
  }

  /**
   * @see ITexditor.getRoot
   */
  getRoot(): TexditorRootElement | null {
    const root = this.rootElement || null;

    if (!root) throw new Error('The root element of the editor was not found.');

    return root;
  }

  /**
   * @see ITexditor.getBody
   */
  getBody(): HTMLElement | null {
    const root = this.getRoot();

    if (!root) return null;

    const [body] = queryList<HTMLElement>('.tex', root);

    return body || null;
  }

  /**
   * @see ITexditor.isEmpty
   */
  isEmpty(): boolean {
    const { blockManager } = this;
    const count = blockManager.count(),
      model = blockManager.getModel(0);

    if (count === 0) return true;

    return !!(count === 1 && model && model.isEmpty());
  }

  /**
   * @see ITexditor.setContent
   */
  setContent(content: string | BlockSchema[], index: number = 0, focusDelay: number = 0): void {
    const { blockManager, config, events } = this;
    const container = blockManager.getBlocksContainer(),
      defaultData = {
        type: config.get('defaultBlock', 'p'),
        data: [''],
      };

    let data = [defaultData];

    try {
      data =
        typeof content === 'string'
          ? isEmptyString(content)
            ? []
            : JSON.parse(sanitizeJson(content.trim()) || '')
          : content;
    } catch (e) {
      console.warn('The input data is not supported or contains errors when working with JSON', e);
    }

    if (container) {
      html(container, '');

      const blocks = blockManager.parseBlocks(data),
        realIndex = index ? index : 0;

      if (!blocks.length) {
        const defaultBlock = blockManager.parseBlock(defaultData);

        if (!defaultBlock) throw Error('The default block model has not been found.');

        blocks.push(defaultBlock);
      }

      append(container, blocks);
      blockManager.detectEmpty(false);
      blockManager.normalize();
      blocks.forEach((blockElement) => {
        executeMethodIfExists(blockElement.baseModel, '__onMount', [blockElement]);
      });
      events.refresh();

      if (index !== -1) {
        setTimeout(() => {
          blockManager.use(realIndex);
          blockManager.focus(realIndex);
        }, focusDelay || 0);
      }

      events.change({
        type: 'setContent',
        container: container,
        index: realIndex,
      });
    }
  }

  /**
   * @see ITexditor.getContent
   */
  getContent(): BlockSchema[] {
    return this.save();
  }

  /**
   * @see ITexditor.save
   */
  save(): BlockSchema[] {
    const data: BlockSchema[] = [];
    const { blockManager, events } = this,
      root = this.getRoot();

    events.trigger('save');

    if (!root) return [];

    blockManager.getBlocks().forEach((el) => {
      events.trigger('saveEach', { blockElement: el });

      const model = el.baseModel;

      if (model.getName()) {
        const extOptions = dataByPrefix(el, 'options');
        let block: BlockSchema = {
          type: model.getName(),
          data: [],
          ...extOptions,
        };

        const contentElement = blockManager.getContentElement(el);

        if (contentElement && model) {
          if (model.isCustomSave()) {
            block = executeMethodIfExists(model, '__save', [block, el]) as BlockSchema;
          } else {
            if (model.isRaw()) {
              block.data = [contentElement.innerText];
            } else {
              const parsedData = blockManager.htmlToData(html(contentElement));

              if (model.isEditableItems() && model.getItemsLength()) {
                let i = 0;
                const items = model.getItems();

                items.forEach(() => {
                  const itemBody = model.getItemBody(i);
                  if (itemBody) {
                    const parsedData = blockManager.htmlToData(html(itemBody));

                    if (parsedData.length) {
                      const dataObj = {
                        type: model.getItemName(),
                        data: parsedData,
                      };
                      (block.data as object[]).push(dataObj);
                    }
                  }

                  i++;
                });
              } else {
                block.data = parsedData.filter(
                  (item) => typeof item === 'string' || (typeof item === 'object' && item !== null),
                ) as BlockSchemaData;
              }
            }
          }
        }

        if (block.data.length) data.push(block);
      }

      events.trigger('saveEachEnd', { blockElement: el });
    });

    events.trigger('saveEnd');

    return data;
  }

  /**
   * @see ITexditor.destroy
   */
  destroy(): void {
    const { blockManager, events, extensions, historyManager, tools } = this;
    if (this.rootElement) html(this.rootElement, '');

    const editors = mainStore.get('editors');

    mainStore.set(
      'editors',
      editors.filter((editor) => editor != this.rootElement),
    );

    blockManager.destroy();
    events.destroy();
    extensions.destroy();
    tools.destroy();
    historyManager.clear();
  }

  /**
   * Renders the editor in the DOM
   * @throws Error if editor ID is not found
   */
  private mount(): void {
    const { config } = this;
    const editorId = this.config.get('handle', 'texditor');

    if (!queryLength('#' + editorId)) throw new Error("The editor's ID was not found.");

    query('#' + editorId, (el: HTMLElement) => {
      const texditorElement = el as TexditorRootElement;

      if (texditorElement?.texditor) {
        texditorElement.texditor.destroy();
      }

      append(el, MainView(this));

      Object.defineProperty(texditorElement, 'texditor', {
        value: this,
        writable: true,
      });

      this.rootElement = texditorElement;

      const editors = mainStore.get('editors');
      editors.push(this.rootElement);
      mainStore.set('editors', editors);
    });

    if (this.getRoot()) {
      const content = config.get('content', []) as string | BlockSchema[];

      this.setContent(content, config.get('autofocus', true) ? 0 : -1, config.get('autofocusDelay', 10));
    }
  }
}
