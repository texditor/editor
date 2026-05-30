import type { FileActionModelConfig, FilesBlockModel } from '@/types';
import { IconPencil } from '@/icons';
import FileActionModel from '@/core/models/file-action-model';
import {
  addClass,
  append,
  attr,
  closest,
  css,
  make,
  prepend,
  query,
  queryList,
  off,
  on,
  rebind,
  isEmptyString,
  randString,
} from 'snappykit';

import { executeMethodIfExists } from '@/utils';

/**
 * Handles the "edit" action for file items.
 * Creates a popup form to edit file name, caption, and description.
 */
export default class EditFileAction extends FileActionModel {
  /** Reference to the popup DOM element */
  private popupNode: HTMLElement | null = null;
  /** Stores timeout IDs for error message hiding */
  private timeouts: Record<string, number | undefined> = {};

  /**
   * Configures the action with name and icon
   */
  protected configure(): Partial<FileActionModelConfig> {
    return {
      name: 'edit',
      icon: IconPencil,
    };
  }

  /** Handles click event  */
  protected onClick(): void {
    this.createPopup();
  }

  /**
   * Creates and displays the edit popup forms
   */
  protected createPopup() {
    const { i18n } = this.editor,
      eid = this.getEventId(),
      cssName = 'tex-files-edit-popup',
      cssForm = 'tex-files-edit-form',
      blockElement = this.getBlockElement(),
      itemElement = this.getItemElement(),
      model = blockElement?.baseModel as FilesBlockModel;

    if (blockElement && itemElement && model) {
      this.popupNode = make('div', (popup: HTMLDivElement) => {
        addClass(popup, cssName);

        const popupOverlay = make('div', (overlay: HTMLDivElement) => {
          addClass(overlay, `${cssName}-overlay tex-animate-fadeIn`);

          const popupContent = make('div', (content: HTMLDivElement) => {
            addClass(content, `${cssName}-content`);

            // Form header with title
            const formHeader = make('div', (div: HTMLDivElement) => {
              addClass(div, cssForm + '-header');
              div.textContent = i18n.get('edit', 'Edit');
            });

            // Form body with dynamic input fields
            const formBody = make('div', (body: HTMLDivElement) => {
              addClass(body, cssForm + '-body');

              const createInput = (name: string, code: string = ''): HTMLElement | null => {
                const inputId = `name-${randString(12)}`,
                  upperName = name.charAt(0).toUpperCase() + name.slice(1);
                const isRequired = executeMethodIfExists(model, 'isRequiredField' + upperName);

                if (executeMethodIfExists(model, 'isVisibleField' + upperName)) {
                  return make('div', (field: HTMLDivElement) => {
                    addClass(field, cssForm + '-field ' + cssForm + '-field-' + name);

                    const input = make('input', (input: HTMLInputElement) => {
                      const prop = Object.getOwnPropertyDescriptor(itemElement, code ? code : 'file' + upperName);
                      input.type = 'text';
                      input.id = inputId;
                      input.value = prop?.value || '';
                      attr(input, 'placeholder', `${i18n.get(name)}` + (isRequired ? '*' : ''));
                      addClass(input, 'tex-input ' + cssForm + '-input-' + name);
                    }) as HTMLInputElement;

                    append(field, input);

                    // Add error label for required fields
                    if (isRequired) {
                      const errorLabel = make('label', (label: HTMLLabelElement) => {
                        addClass(label, 'tex-message tex-message-error tex-hidden tex-animate-fadeIn');
                        attr(label, 'for', inputId);
                        label.textContent = i18n.get('requiredField', 'Required field');
                      }) as HTMLLabelElement;

                      append(field, errorLabel);
                    }
                  });
                }

                return null;
              };

              // Create individual fields
              const nameInput = createInput('fileName', 'fileName'),
                captionInput = createInput('caption'),
                descInput = createInput('desc');

              if (nameInput) append(body, nameInput);
              if (captionInput) append(body, captionInput);
              if (descInput) append(body, descInput);
            });

            // Form footer with action buttons
            const formFooter = make('div', (footer: HTMLDivElement) => {
              addClass(footer, cssForm + '-footer');
              const btnCss = 'tex-btn tex-btn-radius tex-btn-padding';

              const saveButton = make('button', (btn: HTMLButtonElement) => {
                btn.type = 'button';
                addClass(btn, btnCss + ' tex-btn-primary');
                btn.textContent = i18n.get('save', 'Save');
                on(btn, 'click', (evt: MouseEvent) => this.saveHandler(evt));
              });

              const cancelButton = make('button', (btn: HTMLButtonElement) => {
                btn.type = 'button';
                addClass(btn, btnCss + ' tex-btn-secondary');
                btn.textContent = i18n.get('cancel', 'Cancel');
                on(btn, 'click', () => this.removePopup());
              });

              append(footer, [saveButton, cancelButton]);
            });

            append(content, [formHeader, formBody, formFooter]);

            // Reposition popup based on available space
            const reposition = () => {
              setTimeout(() => {
                if (blockElement.offsetHeight < content.offsetHeight + itemElement.offsetTop) {
                  css(content, 'top', blockElement.offsetHeight - content.offsetHeight + itemElement.offsetHeight / 2);
                } else {
                  css(content, 'top', itemElement.offsetTop);
                }
              }, 1);
            };

            rebind(window, 'resize.efa' + eid, () => reposition());
            reposition();
          });

          append(overlay, popupContent);
        });

        append(popup, popupOverlay);

        // Close popup when clicking outside
        on(
          document,
          'click.efa' + eid,
          (evt: MouseEvent) => {
            if (!closest(evt.target, popup)) {
              off(document, 'click.efa' + eid, true);
              this.removePopup();
            }
          },
          true,
        );
      });

      prepend(blockElement, this.popupNode);
    }
  }

  /**
   * Handles save button click
   * @param _evt - Click event
   */
  protected saveHandler(_evt: MouseEvent) {
    const { events } = this.editor,
      blockElement = this.getBlockElement(),
      popupNode = this.popupNode,
      itemElement = this.getItemElement(),
      formCss = 'tex-files-edit-form',
      model = blockElement?.baseModel as FilesBlockModel;

    if (!blockElement || !itemElement || !popupNode || !model) {
      this.removePopup();
      return;
    }

    const requiredStatus = (name: string): boolean => {
      const upperName = name.charAt(0).toUpperCase() + name.slice(1);
      const [field] = queryList<HTMLElement>('.' + formCss + '-field-' + name, popupNode) as HTMLInputElement[];
      const isVisible = executeMethodIfExists(model, 'isVisibleField' + upperName);

      if (!field && isVisible) return false;

      const [input] = queryList<HTMLElement>('.' + formCss + '-input-' + name, field) as HTMLInputElement[];

      if (
        (!input || (input && isEmptyString(input.value))) &&
        executeMethodIfExists(model, 'isRequiredField' + upperName)
      ) {
        // Show error message
        query(
          '.tex-message-error',
          (errorLabel: HTMLLabelElement) => {
            css(errorLabel, 'display', 'block');

            clearTimeout(this.timeouts[name]);
            this.timeouts[name] = setTimeout(() => {
              css(errorLabel, 'display', '');
            }, model.getToastTimeout());
          },
          field,
        );
        return false;
      }

      return true;
    };

    const reqName = requiredStatus('fileName'),
      reqCaption = requiredStatus('caption'),
      reqDesc = requiredStatus('desc');

    if (!reqName || !reqCaption || !reqDesc) return;

    const saveField = (name: string, code: string) => {
      const [field] = queryList<HTMLElement>('.' + formCss + '-field-' + name, popupNode) as HTMLInputElement[];

      if (field) {
        const [input] = queryList<HTMLElement>('.' + formCss + '-input-' + name, field) as HTMLInputElement[];

        if (input) {
          const value = input.value || '';

          Object.defineProperty(itemElement, code, {
            value: value,
            writable: true,
          });

          query(
            '.tex-file-' + name,
            (el: HTMLElement) => {
              el.textContent = value;
            },
            itemElement,
          );
        }
      }
    };

    saveField('fileName', 'fileName');
    saveField('caption', 'fileCaption');
    saveField('desc', 'fileDesc');

    this.removePopup();
    events.change({
      modelCode: this.getModelCode(),
      type: 'changeFileItem',
      blockElement: this.getBlockElement(),
      item: itemElement,
    });
  }

  /** Removes the popup and cleans up event listeners */
  private removePopup(): void {
    const eid = this.getEventId();
    off(document, 'click.efa' + eid, true);
    off(window, 'resize.efa' + eid);
    this.popupNode?.remove();
    this.popupNode = null;
  }

  /** Cleanup when destroying the action */
  destroy(): void {
    this.removePopup();
  }
}
