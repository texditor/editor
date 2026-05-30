import type {
  BlockSchema,
  BlockElement,
  BlockModelConfig,
  BlockCreateSchema,
  CodeLanguages as ICodeLanguages,
} from '@/types';
import {
  addClass,
  append,
  attr,
  closest,
  css,
  data,
  getText,
  html,
  make,
  prepend,
  query,
  isEmptyString,
  off,
  on,
  val,
  lower,
} from 'snappykit';
import { IconArrowDown, IconCode, IconCornerUpRight } from '@/icons';
import { renderIcon } from '@/utils';
import BlockModel from '@/core/models/block-model';
import CodeLanguages from './languages';
import '@/styles/blocks/code.css';

export default class Code extends BlockModel {
  /**
   * Configure block model
   * @returns Partial configuration object
   */
  protected configure(): Partial<BlockModelConfig> {
    return {
      name: 'code',
      tagName: 'pre',
      translation: 'code',
      groupCode: 'code',
      className: 'tex-code',
      autoParse: false,
      autoMerge: true,
      icon: IconCode,
      placeholder: this.editor.i18n.get('codePlaceholder', 'Enter your code'),
      editable: true,
      emptyDetect: true,
      sanitizer: false,
      raw: true,
      enterCreate: false,
      convertible: true,
      languages: CodeLanguages,
      showLanguages: true,
      customSave: true,
      search: true,
      lineBreakInfoMessage: 'Ctrl + Enter',
    };
  }

  /**
   * Composes the code block UI
   */
  protected onCompose(): void {
    const blockElement = this.getElement();
    this.init(blockElement);
  }

  /**
   * Initializes the code block UI — language selector and line break info
   * @param blockElement - block DOM element
   */
  private init(blockElement: BlockElement): void {
    if (!blockElement) return;

    const { events, i18n } = this.editor;

    if (this.getConfig('showLanguages', true)) {
      const cssName = 'tex-code',
        notSpecified = i18n.get('notSpecified', 'Not specified');

      if (blockElement) {
        const languages = this.getConfig('languages', {}) as ICodeLanguages;

        const getLanguageName = (key: string): string => {
          return languages[key] || notSpecified;
        };

        const updateName = (name: string = notSpecified) => {
          query(
            '.' + cssName + '-lang-link-name',
            (lnk: HTMLLinkElement) => {
              lnk.textContent = name;
            },
            blockElement,
          );
        };

        const languageWrap = make('div', (wrap: HTMLDivElement) => {
          addClass(wrap, cssName + '-lang');

          const menu = make('div', (menu: HTMLDivElement) => {
            addClass(menu, cssName + '-menu tex-animate-fadeIn');

            if (this.getConfig('search', true)) {
              append(
                menu,
                make('div', (search: HTMLDivElement) => {
                  addClass(search, cssName + '-menu-search');
                  const searchInput = make('input', (input: HTMLInputElement) => {
                    addClass(input, 'tex-input');
                    attr(input, 'type', 'text');
                    attr(input, 'placeholder', i18n.get('search', 'Search'));
                    on(input, 'input.codeLang', (inputEvt: KeyboardEvent) => {
                      inputEvt.preventDefault();
                      val(input);
                      const text = lower(val(input)).trim();

                      query(
                        '.' + cssName + '-menu-item',
                        (searchItem: HTMLDivElement) => {
                          if (text) {
                            const itemText = searchItem.textContent?.toLowerCase() || '';
                            const itemKey = data(searchItem, 'langKey') || '';

                            if (!itemText.includes(text) && !itemKey.includes(text)) {
                              css(searchItem, 'display', 'none');
                            } else {
                              css(searchItem, 'display', '');
                            }
                          } else {
                            css(searchItem, 'display', '');
                          }
                        },
                        blockElement,
                      );
                    });
                  });
                  append(search, searchInput);
                }),
              );
            }

            append(
              menu,
              make('div', (item: HTMLDivElement) => {
                addClass(item, cssName + '-menu-item');
                attr(item, 'data-lang-key', '');
                html(item, notSpecified);
                on(item, 'click.rmLang', () => {
                  this.removeOption('lang');
                  updateName();
                  closeMenu();
                  events.change({
                    modelCode: this.getModelCode(),
                    type: 'codeClearLanguage',
                    blockElement: blockElement,
                  });
                });
              }),
            );

            for (const [codeKey, codeName] of Object.entries(languages)) {
              append(
                menu,
                make('div', (item: HTMLDivElement) => {
                  addClass(item, cssName + '-menu-item');
                  attr(item, 'data-lang-key', codeKey);
                  html(item, codeName);
                  on(item, 'click.chLang', () => {
                    this.setOption('lang', codeKey);
                    updateName(codeName);
                    closeMenu();
                    events.change({
                      modelCode: this.getModelCode(),
                      type: 'codeChangeLanguage',
                      blockElement: blockElement,
                      lang: codeKey,
                    });
                  });
                }),
              );
            }
          });
          const eid = this.getEventId();

          const closeMenu = () => {
            off(document, 'click.codeMenu' + eid);
            css(menu, 'display', '');
          };

          const link = make('a', (link: HTMLLinkElement) => {
            addClass(link, cssName + '-lang-link');
            append(link, [
              make('span', (span: HTMLSpanElement) => {
                addClass(span, cssName + '-lang-link-name');
                const curLang = this.getOption('lang', '') || '';
                span.textContent = getLanguageName(curLang);
              }),
              make('span', (span: HTMLSpanElement) => {
                html(
                  span,
                  renderIcon(IconArrowDown, {
                    width: 12,
                    height: 12,
                  }),
                );
              }),
            ]);

            on(link, 'click.codeLink', () => {
              css(menu, 'display', 'block');
              on(
                document,
                'click.codeMenu' + eid,
                (evt: MouseEvent) => {
                  if (!closest(evt.target, menu)) {
                    closeMenu();
                  }
                },
                true,
              );
            });
          });

          append(wrap, [link, menu]);
        });

        prepend(blockElement, languageWrap);
      }
    }

    const lineBreakInfoMessage = this.getConfig('lineBreakInfoMessage', '');

    if (lineBreakInfoMessage) {
      append(
        blockElement,
        make('div', (info: HTMLDivElement) => {
          addClass(info, 'tex-code-line-break-info');
          append(info, [
            make('span', (span: HTMLSpanElement) => {
              html(span, lineBreakInfoMessage);
            }),
            make('span', (span: HTMLSpanElement) => {
              html(
                span,
                renderIcon(IconCornerUpRight, {
                  width: 12,
                  height: 12,
                }),
              );
            }),
          ]);
        }),
      );
    }
  }

  /**
   * Handles keydown events. Creates a new block on Ctrl+Enter.
   * @param evt - Keyboard event
   * @returns False if handled, true otherwise
   */
  protected onKeyDown(evt: KeyboardEvent): boolean {
    const { blockManager } = this.editor;

    if (evt.ctrlKey && evt.key === 'Enter') {
      blockManager.createDefaultBlock();
      evt.preventDefault();
      return false;
    }

    return true;
  }

  /**
   * Saves block data to output format
   * @param blockSchema - Block schema
   * @param _blockElement - Block element
   * @returns The modified block output.
   */
  protected save(blockSchema: BlockSchema, blockElement?: BlockElement): BlockSchema {
    const { blockManager } = this.editor;
    const contentElement = blockManager.getContentElement(blockElement);

    if (contentElement && !isEmptyString(getText(contentElement))) {
      blockSchema.data = [getText(contentElement)];

      const lang = this.getOption('lang', '');

      if (lang) blockSchema.lang = lang;
    }

    return blockSchema;
  }

  /**
   * Parses block schema into create schema
   * @param item - Raw block schema
   * @returns Parsed create schema
   */
  protected parse(item: BlockSchema): BlockCreateSchema {
    const languages = this.getConfig('languages', {}) as ICodeLanguages;
    let lang = (item?.lang || '') as string;

    if (lang && !languages[lang]) lang = '';

    return {
      lang: lang,
      data: typeof item.data[0] === 'string' ? item.data[0] : '',
    };
  }

  /**
   * Re-initializes the block after conversion
   * @param newBlockElement - New block DOM element
   * @returns The initialized block element
   */
  afterConvert(newBlockElement: BlockElement): BlockElement {
    this.init(newBlockElement);

    return newBlockElement;
  }

  /**
   * Destroy the model instance and clean up the resources
   */
  destroy(): void {
    const eid = this.getEventId();
    off(document, 'click.codeMenu' + eid);
  }
}
