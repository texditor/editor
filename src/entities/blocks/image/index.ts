import File from '../file';
import type {
  BlockModelConstructor,
  BlockElement,
  FileItem,
  ImageBlockModelConfig,
  Slider as ISlider,
  TexditorEvent,
  ImageBlockModel,
  BlockSchema,
  BlockSchemaData,
} from '@/types';
import { IconImage, IconMultipleGrid, IconSingleGrid, IconSlider } from '@/icons';
import { renderIcon } from '@/utils';
import { addClass, append, attr, data, html, make, prepend, query, rebind, removeClass, text } from 'snappykit';
import Slider from '@/core/ui/slider';
import '@/styles/entities/blocks/image.css';

export default class Image extends File implements ImageBlockModel {
  private defaultStyles: string[] = ['grid', 'slider', 'single'];
  private slider?: ISlider | null = null;

  /**
   * Set up global configuration
   * @param config - Partial configuration
   * @returns Model constructor
   */
  public static setup(config: Partial<ImageBlockModelConfig>): BlockModelConstructor {
    return super.setup(config);
  }

  /**
   * Configure block model
   * @returns Partial configuration object
   */
  protected configure(): Partial<ImageBlockModelConfig> {
    const { i18n } = this.editor;

    return {
      ...super.configure(),
      ...{
        name: 'image',
        icon: IconImage,
        className: 'tex-image tex-file',
        translation: 'image',
        styles: ['grid', 'slider', 'single'],
        stylesLtr: 'right',
        defaultStyle: 'single',
        groupCode: 'image',
        sliderInfinite: true,
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/bmp'],
        visibleFieldFileName: false,
        requiredFieldFileName: false,
        uploadMultipleLabelText: i18n.get('uploadImages', 'Upload Images'),
        uploadAddLabelText: i18n.get('addImages', 'Add Image'),
        uploadLabelText: i18n.get('uploadImage', 'Upload Image'),
      },
    };
  }

  /**
   * Hook called after mounting to the DOM
   * @param _el - The mounted DOM element
   */
  protected onMount(el: BlockElement): void {
    super.onMount(el);
    this.initSlider();
    this.on('onChange.image', (evt: TexditorEvent) => {
      const index = (evt?.targetIndex || 0) as number;
      this.initSlider(index);
    });
  }

  /** @see ImageBlockModel.getDefaultStyle */
  getDefaultStyle(): string {
    const defaultStyle = this.getConfig('defaultStyle', []) as string;

    if (!this.defaultStyles.includes(defaultStyle)) return 'single';

    return defaultStyle;
  }

  /** @see ImageBlockModel.getStyles */
  getStyles(): string[] {
    return this.getConfig('styles', []) as string[];
  }

  /** @see ImageBlockModel.areStylesAllowed */
  areStylesAllowed(): boolean {
    const styles = this.getStyles();

    return styles.every((key: string) => this.defaultStyles.includes(key));
  }

  /**
   * Hook called after form element creation
   * @param form - Form element
   */
  protected onFormCreate(form: HTMLElement): void {
    const { blockManager, events, i18n } = this.editor,
      ltr = this.getConfig('stylesLtr', 'left'),
      styles = this.getConfig('styles', []) as string[],
      blockElement = this.getElement();

    if (this.areStylesAllowed()) {
      const saveActiveItem = (code: string) => {
        if (styles.includes(code)) {
          query(
            '.tex-image-style-item',
            (div: HTMLDivElement) => {
              removeClass(div, 'tex-active');
            },
            form,
          );
          query(
            '.tex-image-style-item-' + code,
            (div: HTMLDivElement) => {
              addClass(div, 'tex-active');
            },
            form,
          );
        }
      };

      const styleItem = (code: string, icon: string) => {
        return make('div', (item: HTMLDivElement) => {
          addClass(item, 'tex-image-style-item tex-image-style-item-' + code);
          rebind(item, 'click.style', () => {
            saveActiveItem(code);
            data(blockElement, 'optionsStyle', code);
            this.destroySlider();

            events.change({
              modelCode: this.getModelCode(),
              type: 'imageStyle',
              index: blockManager.getIndex(),
              blockElement: blockElement,
              contentElement: this.getContentElement(),
            });

            if (code === 'slider') this.initSlider();
          });
          html(
            item,
            renderIcon(icon, {
              width: 16,
              height: 16,
            }),
          );
          attr(item, 'title', i18n.get('appearance', 'Appearance') + ': ' + i18n.get(code));
        });
      };

      const stylePanel = make('div', (panel: HTMLDivElement) => {
        addClass(panel, 'tex-image-styles');
        append(
          panel,
          make('div', (div: HTMLDivElement) => {
            addClass(div, 'tex-image-style-list');
            const items = [];

            if (styles.includes('single')) items.push(styleItem('single', IconSingleGrid));
            if (styles.includes('grid')) items.push(styleItem('grid', IconMultipleGrid));
            if (styles.includes('slider')) items.push(styleItem('slider', IconSlider));

            append(div, items);
          }),
        );
      });

      if (ltr == 'left') prepend(form, stylePanel);
      else append(form, stylePanel);

      let currentStyle = this.getOption('style', 'single') || 'single';
      currentStyle = this.defaultStyles.includes(currentStyle) ? currentStyle : 'single';
      saveActiveItem(currentStyle);
    }
  }

  /**
   * Hook called before list element creation
   * @param _contentElement - Content node element
   */
  protected onCreateList(_contentElement: HTMLElement): void {
    const styles = this.getStyles(),
      blockElement = this.getElement(),
      itemStyle = this.getOption('style', '');

    if (this.areStylesAllowed() && itemStyle) {
      if (styles.includes(itemStyle)) data(blockElement, 'optionsStyle', itemStyle);
    }
  }

  /**
   * Default render method for file items
   * @param item - File item data
   * @returns Rendered HTMLElement
   */
  protected renderItem(item: FileItem): HTMLElement {
    const { i18n } = this.editor;

    if (!this.isSupportedItem(item)) {
      return make('div', (div) => {
        addClass(div, 'tex-image-item-bad');
        const line = make('div', (line) => addClass(line, 'tex-image-item-bad-line'));
        const txt = make('div', (cnt) => text(cnt, i18n.get('unsupportedImageFormat', 'Unsupported image format')));
        append(div, [line, txt]);
      });
    }

    return make('img', (img: HTMLImageElement) => {
      img.src = item.url || '';
    });
  }

  /**
   * Saves block data to output format
   * @param blockSchema - Block schema
   * @param blockElement - Block element
   * @returns The modified block output
   */
  protected save(blockSchema: BlockSchema, blockElement?: BlockElement): BlockSchema {
    const items = this.prepareItems(blockElement);

    const resultData = this.isLinkStrategy()
      ? items.filter((item) => this.isSupportedItem(item)).map(({ size: _size, name: _name, ...item }) => item)
      : items
          .filter((item) => this.isSupportedItem(item) && item.id && item.id > 0)
          .map(({ id, caption, desc }) => ({ id, caption, desc }) as FileItem);

    return {
      ...blockSchema,
      data: resultData as BlockSchemaData,
    };
  }

  /**
   * Checks whether the given file item is a supported image.
   * @param item - The file item to check.
   * @returns True/False
   */
  private isSupportedItem(item: FileItem): boolean {
    if (!item.type) return false;

    if (!item.type.startsWith('image/')) {
      return false;
    }

    if (!this.getMimeTypes().includes(item.type)) return false;

    return true;
  }

  /**
   * Initialize the slider
   *
   * @param index - Starting slide index (default: 0)
   */
  protected initSlider(index: number = 0) {
    const blockElement = this.getElement(),
      contentElement = this.getContentElement();

    this.destroySlider();

    if (blockElement && contentElement) {
      const isSliderOption = data(blockElement, 'optionsStyle') === 'slider';

      if (isSliderOption) {
        this.slider = new Slider(contentElement, {
          infinite: this.getConfig('sliderInfinite', true) as boolean,
        });

        if (index) {
          this.slider.goToSlide(index);
        }
      }
    }
  }

  /**
   * Destroys the current slider instance
   */
  private destroySlider() {
    if (this.slider) {
      this.slider.destroy();
      this.slider = null;
    }
  }

  /**
   * Clean up event listeners on destroy
   */
  destroy(): void {
    this.destroySlider();
    super.destroy();
  }
}
