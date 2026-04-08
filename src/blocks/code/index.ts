import type {
  BlockModelInterface,
  BlockOutput,
  BlockNode,
  BlockModelConfig
} from "@/types";
import BlockModel from "@/core/models/block-model";
import { addClass, append, attr, closest, css, html, make, prepend, query } from "@/utils/dom";
import { IconArrowDown, IconCode, IconCornerUpRight } from "@/icons";
import CodeLanguages, { CodeLanguagesInterface } from './languages';
import "@/styles/blocks/code.css";
import { isEmptyString, off, on, renderIcon } from "@/utils";

export default class Code extends BlockModel implements BlockModelInterface {
  protected configure(): Partial<BlockModelConfig> {
    return {
      autoParse: false,
      autoMerge: true,
      tagName: "pre",
      translationCode: "code",
      type: "code",
      groupCode: 'code',
      icon: IconCode,
      cssClasses: "tex-code",
      placeholder: this.editor.i18n.get("codePlaceholder", "Enter your code"),
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
      lineBreakInfoMessage: "Ctrl + Enter"
    };
  }

  protected onCreate(): void {
    const blockNode = this.getBlockNode();

    const lang = this.getOption('lang');

    if (lang) {
      attr(blockNode, 'data-lang', lang);
    }

    this.init(blockNode);
  }

  private init(blockNode: BlockNode) {
    const { events, i18n } = this.editor;

    if (this.getConfig('showLanguages', true)) {
      const cssName = 'tex-code',
        notSpecified = i18n.get('notSpecified', 'Not specified');

      if (blockNode) {
        const languages = this.getConfig('languages', {}) as CodeLanguagesInterface;

        const getLanguageName = (key: string): string => {
          return languages[key] || notSpecified;
        };

        const updateName = (name: string = notSpecified) => {
          query('.' + cssName + '-lang-link-name', (lnk: HTMLLinkElement) => {
            lnk.textContent = name
          }, blockNode)
        };

        const languageWrap = make('div', (wrap: HTMLDivElement) => {
          addClass(wrap, cssName + '-lang');

          const menu = make('div', (menu: HTMLDivElement) => {
            addClass(menu, cssName + '-menu tex-animate-fadeIn');

            if (this.getConfig('search', true)) {
              append(
                menu,
                make('div', (search: HTMLDivElement) => {
                  addClass(search, cssName + "-menu-search")
                  const searchInput = make('input', (input: HTMLInputElement) => {
                    addClass(input, 'tex-input');
                    attr(input, 'type', 'text');
                    attr(input, 'placeholder', i18n.get('search', 'Search'));
                    on(input, 'input.codeLang', (inputEvt: KeyboardEvent) => {
                      inputEvt.preventDefault();
                      const text = input.value.toLowerCase().trim();

                      query("." + cssName + "-menu-item", (searchItem: HTMLDivElement) => {
                        if (text) {
                          const itemText = searchItem.textContent?.toLowerCase() || '';
                          const itemKey = searchItem.dataset.langKey || '';

                          if (!itemText.includes(text) && !itemKey.includes(text)) {
                            css(searchItem, 'display', 'none');
                          } else {
                            css(searchItem, 'display', '');
                          }
                        } else {
                          css(searchItem, 'display', '');
                        }
                      });
                    });
                  });
                  append(search, searchInput);
                })
              );
            }

            append(
              menu,
              make('div', (item: HTMLDivElement) => {
                addClass(item, cssName + '-menu-item');
                attr(item, 'data-lang-key', '');
                html(item, notSpecified);
                on(item, 'click.rmLang', () => {
                  blockNode.removeAttribute('data-lang');
                  updateName();
                  closeMenu();
                  events.change({
                    type: "codeClearLanguage",
                    blockNode: blockNode
                  })
                });
              })
            );

            for (const [codeKey, codeName] of Object.entries(languages)) {
              append(
                menu,
                make('div', (item: HTMLDivElement) => {
                  addClass(item, cssName + '-menu-item');
                  attr(item, 'data-lang-key', codeKey);
                  html(item, codeName);
                  on(item, 'click.chLang', () => {
                    attr(blockNode, 'data-lang', codeKey);
                    updateName(codeName);
                    closeMenu();
                    events.change({
                      type: "codeChangeLanguage",
                      blockNode: blockNode,
                      lang: codeKey
                    })
                  });
                })
              );
            }
          });

          const closeMenu = () => {
            off(document, "click.codeMenu");
            css(menu, 'display', '');
          }

          const link = make('a', (link: HTMLLinkElement) => {
            addClass(link, cssName + '-lang-link');
            append(link, [
              make('span', (span: HTMLSpanElement) => {
                addClass(span, cssName + '-lang-link-name');
                const curLang = blockNode.dataset.lang || '';
                span.textContent = getLanguageName(curLang);
              }),
              make('span', (span: HTMLSpanElement) => {
                html(span, renderIcon(IconArrowDown, {
                  width: 12,
                  height: 12
                }));
              })
            ]);

            on(link, 'click.codeLink', () => {
              css(menu, 'display', 'block');
              on(document, "click.codeMenu", (evt: MouseEvent) => {
                if (!closest(evt.target, menu)) {
                  closeMenu();
                }
              }, true);
            });
          });

          append(wrap, [link, menu]);
        })

        prepend(blockNode, languageWrap)
      }
    }

    const lineBreakInfoMessage = this.getConfig('lineBreakInfoMessage', '');

    if (lineBreakInfoMessage) {
      append(
        blockNode, make('div', (info: HTMLDivElement) => {
          addClass(info, 'tex-code-line-break-info');
          append(
            info,
            [
              make('span', (span: HTMLSpanElement) => {
                html(span, lineBreakInfoMessage);
              }),
              make('span', (span: HTMLSpanElement) => {
                html(span, renderIcon(IconCornerUpRight, {
                  width: 12,
                  height: 12
                }));
              })
            ]
          )
        })
      )
    }
  }

  onKeyDown(evt: KeyboardEvent): boolean {
    const { blockManager } = this.editor;

    if (evt.ctrlKey && evt.key === 'Enter') {
      blockManager.createDefaultBlock();
      evt.preventDefault();
      return false;
    }

    return true;
  }

  protected save(block: BlockOutput, blockNode?: BlockNode): BlockOutput {
    const { blockManager } = this.editor;
    const contnetNode = blockManager.getContentNode(blockNode);

    if (contnetNode?.textContent && !isEmptyString(contnetNode?.textContent)) {
      block.data = [contnetNode.textContent];

      if (blockNode?.dataset.lang)
        block.lang = blockNode.dataset.lang;
    }

    return block;
  }

  protected parse(item: BlockOutput) {
    const languages = this.getConfig('languages', {}) as CodeLanguagesInterface;
    let lang = (item?.lang || '') as string;

    if (lang && !languages[lang])
      lang = '';

    return this.create({
      lang: lang,
      content:
        typeof item.data[0] === "string"
          ? item.data[0]
          : ""
    });
  }

  afterConvert(newBlockNode: BlockNode): BlockNode {
    this.init(newBlockNode);

    return newBlockNode;
  }
}