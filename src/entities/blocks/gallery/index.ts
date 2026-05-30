import Files from "../files";
import type {
  BlockModelConstructor,
  BlockElement,
  FileItem,
  GalleryBlockModelConfig,
  Slider as ISlider,
  TexditorEvent,
  GalleryBlockModel,
  BlockSchema,
  BlockSchemaData
} from "@/types";
import {
  IconImage,
  IconMultipleGrid,
  IconPlay,
  IconSingleGrid,
  IconSlider
} from "@/icons";
import { renderIcon } from "@/utils";
import {
  addClass,
  append,
  attr,
  data,
  html,
  make,
  prepend,
  query,
  rebind,
  removeClass,

} from "snappykit";
import Slider from "@/core/ui/slider";
import "@/styles/blocks/gallery.css";

export default class Gallery extends Files implements GalleryBlockModel {
  private defaultStyles: string[] = ["grid", "slider", "single"];
  private slider?: ISlider | null = null;

  /**
  * Set up global configuration
  * @param config - Partial configuration
  * @returns Model constructor
  */
  public static setup(
    config: Partial<GalleryBlockModelConfig>
  ): BlockModelConstructor {
    return super.setup(config);
  }

  /**
   * Configure block model
   * @returns Partial configuration object
   */
  protected configure(): Partial<GalleryBlockModelConfig> {
    return {
      ...super.configure(),
      ...{
        name: "gallery",
        icon: IconImage,
        className: 'tex-gallery tex-files',
        translation: "gallery",
        styles: ["grid", "slider", "single"],
        stylesLtr: "right",
        defaultStyle: "single",
        groupCode: 'gallery',
        sliderInfinite: true,
        imageMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/avif",
          "image/bmp"
        ],
        videoMimeTypes: [
          "video/mp4",
          "video/webm",
          "video/ogg",
          "video/mpeg",
          "video/quicktime",
          "video/x-msvideo"
        ],
        visibleFieldFileName: false,
        requiredFieldFileName: false
      }
    };
  }

  /**
   * Hook called after mounting to the DOM
   * @param _el - The mounted DOM element
   */
  protected onMount(el: BlockElement): void {
    super.onMount(el);
    this.initSlider();
    this.addEvent('onChange.gallery', (evt: TexditorEvent) => {
      const index = (evt?.targetIndex || 0) as number;
      this.initSlider(index);
    })
  }

  /** @see GalleryBlockModel.getDefaultStyle */
  getDefaultStyle(): string {
    const defaultStyle = this.getConfig("defaultStyle", []) as string;

    if (!this.defaultStyles.includes(defaultStyle)) return "single";

    return defaultStyle;
  }

  /** @see GalleryBlockModel.getStyles */
  getStyles(): string[] {
    return this.getConfig('styles', []) as string[];
  }

  /** @see GalleryBlockModel.areStylesAllowed */
  areStylesAllowed(): boolean {
    const styles = this.getStyles();

    return (styles).every((key: string) =>
      this.defaultStyles.includes(key)
    );
  }

  /**
 * Hook called after form element creation
  * @param form - Form element
  */
  protected onFormCreate(form: HTMLElement): void {
    const { blockManager, events, i18n } = this.editor,
      ltr = this.getConfig("stylesLtr", "left"),
      styles = this.getConfig("styles", []) as string[],
      blockElement = this.getElement();

    if (this.areStylesAllowed()) {
      const saveActiveItem = (code: string) => {
        if (styles.includes(code)) {
          query(
            ".tex-gallery-style-item",
            (div: HTMLDivElement) => {
              removeClass(div, "tex-active");
            },
            form
          );
          query(
            ".tex-gallery-style-item-" + code,
            (div: HTMLDivElement) => {
              addClass(div, "tex-active");
            },
            form
          );
        }
      };

      const styleItem = (code: string, icon: string) => {
        return make("div", (item: HTMLDivElement) => {
          addClass(
            item,
            "tex-gallery-style-item tex-gallery-style-item-" + code
          );
          rebind(item, "click.style", () => {
            saveActiveItem(code);
            data(blockElement, 'optionsStyle', code);
            this.destroySlider();

            events.change({
              modelCode: this.getModelCode(),
              type: "galleryStyle",
              index: blockManager.getIndex(),
              blockElement: blockElement,
              contentElement: this.getContentElement(),
            });

            if (code === "slider")
              this.initSlider();
          });
          html(
            item,
            renderIcon(icon, {
              width: 16,
              height: 16
            })
          )
          attr(
            item,
            "title",
            i18n.get("appearance", "Appearance") + ": " + i18n.get(code)
          );
        });
      };

      const stylePanel = make("div", (panel: HTMLDivElement) => {
        addClass(panel, "tex-gallery-styles");
        append(
          panel,
          make("div", (div: HTMLDivElement) => {
            addClass(div, "tex-gallery-style-list");
            const items = [];

            if (styles.includes("single"))
              items.push(styleItem("single", IconSingleGrid));
            if (styles.includes("grid"))
              items.push(styleItem("grid", IconMultipleGrid));
            if (styles.includes("slider"))
              items.push(styleItem("slider", IconSlider));

            append(div, items);
          })
        );
      });

      if (ltr == 'left')
        prepend(form, stylePanel);
      else
        append(form, stylePanel);

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
      if (styles.includes(itemStyle))
        data(blockElement, 'optionsStyle', itemStyle);
    }

    this.setRenderCallback(
      this.getConfig("imageMimeTypes", []) as string[],
      (item: FileItem): HTMLElement => {
        return make("img", (img: HTMLImageElement) => {
          img.src = item.url;
        });
      }
    );

    this.setRenderCallback(
      this.getConfig("videoMimeTypes", []) as string[],
      (item: FileItem): HTMLElement => {
        const videoContainer = make("div", (vc: HTMLDivElement) => {
          const video = make("video", (video: HTMLVideoElement) => {
            append(
              video,
              make("source", (source: HTMLSourceElement) => {
                source.src = item.url;
                attr(source, "type", item.type);
              })
            );
          }),
            playIcon = make("div", (div: HTMLDivElement) => {
              addClass(div, "tex-gallery-item-play");
              div.innerHTML = renderIcon(IconPlay, {
                width: 18,
                height: 18
              });
            });

          append(vc, [video, playIcon]);
        });

        return videoContainer;
      }
    );
  }

  /**
   * Saves block data to output format
   * @param blockSchema - Block schema
   * @param blockElement - Block element
   * @returns The modified block output
   */
  protected save(blockSchema: BlockSchema, blockElement?: BlockElement): BlockSchema {
    blockSchema = super.save(blockSchema, blockElement);
    const data = (blockSchema?.data as FileItem[]),
      resultData: FileItem[] = [];

    if (data.length && Array.isArray(data)) {
      data.forEach((item: FileItem) => {
        if (item.size)
          delete item.size;

        if (item.id)
          delete item.id;
        resultData.push(item);
      });

      blockSchema.data = resultData as BlockSchemaData;
    }
    return blockSchema;
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
      const isSliderOption = data(blockElement, 'optionsStyle') === "slider";

      if (isSliderOption) {
        this.slider = new Slider(contentElement, {
          infinite: this.getConfig("sliderInfinite", true) as boolean
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