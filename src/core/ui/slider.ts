import { IconArrowLeft, IconArrowRight } from "@/icons";
import {
  addClass,
  append,
  before,
  css,
  html,
  make,
  on,
  query,
  removeClass,
  renderIcon
} from "@/utils";
import { SliderInterface, SliderOptions } from "@/types";
import "@/styles/core/ui/slider.css";

export default class Slider  {
  private container: HTMLElement;
  private slider: HTMLElement;
  private slides: HTMLElement[] = [];
  private dotsContainer?: HTMLElement;
  private currentIndex: number = 0;
  private slideCount: number = 0;
  private options: SliderOptions;

  private defaultOptions: SliderOptions = {
    infinite: true
  };

  /**
   * Creates a new Slider instance
   * @param container - The DOM element containing the slides
   * @param options - Configuration options for the slider
   */
  constructor(container: HTMLElement, options: SliderOptions = {}) {
    if (!container) throw new Error("Container not found");

    this.container = container;
    this.options = { ...this.defaultOptions, ...options };
    this.slider = make("div");

    before(this.container, this.slider);
    append(this.slider, this.container);
    addClass(this.slider, "tex-slider");
    addClass(this.container, "tex-slider-container");

    this.eachSlides((slide: HTMLElement) => {
      addClass(slide, "tex-slide");
      this.slides.push(slide);
    });

    const length = this.slides.length;

    css(this.container, 'width', `${length * 100}%`)

    this.slides.forEach((slide: HTMLElement) => {
      css(slide, {
        width: `${100 / length}%`,
        flex: `0 0 ${100 / length}%`
      })
    });

    this.init();
  }

  /**
   * Iterates through each direct child element of the container
   * @param callback - Function to execute for each slide
   */
  private eachSlides(callback: CallableFunction): void {
    query(
      ":scope > *",
      (slide: HTMLElement, index: number) => {
        callback(slide, index);
      },
      this.container
    );
  }

  /**
   * Initializes the slider by creating all necessary UI elements
   */
  private init(): void {
    this.createDots();
    this.createButtons();
    this.updateActiveDot();
    this.updateSliderPosition();
  }

  /**
   * Creates and appends navigation buttons (prev/next)
   */
  private createButtons(): void {
    const iconConfig = {
      width: 14,
      height: 14
    };

    const prevBtn = make("button", (btn: HTMLButtonElement) => {
      addClass(btn, "tex-slider-btn tex-slider-prev");
      html(btn, renderIcon(IconArrowLeft, iconConfig));
      on(btn, "click.sliderPrev", () => this.prev());
    });

    const nextBtn = make("button", (btn: HTMLButtonElement) => {
      addClass(btn, "tex-slider-btn tex-slider-next");
      html(btn, renderIcon(IconArrowRight, iconConfig));
      on(btn, "click.sliderNext", () => this.next());
    });

    append(this.slider, [prevBtn, nextBtn]);
  }

  /**
   * Creates and appends dot indicators for slide navigation
   */
  private createDots(): void {
    const dotContainer = make("div", (dotCnt: HTMLElement) => {
      addClass(dotCnt, "tex-slider-dots");
    });

    append(this.slider, dotContainer);

    this.dotsContainer = dotContainer;
    html(this.dotsContainer, "");

    for (let i = 0; i < this.slides.length; i++) {
      const dot = make("button", (btn: HTMLButtonElement) => {
        addClass(btn, "tex-slider-dot");
        btn.setAttribute("aria-label", `Go to slide: ${i + 1}`);
        on(btn, "click.sliderDot", () => this.goToSlide(i));
      });

      append(this.dotsContainer, dot);
    }
  }

  /**
   * Updates the active state of dot indicators based on current slide
   */
  private updateActiveDot(): void {
    query(
      ".tex-slider-dot",
      (dot: HTMLButtonElement, index: number) => {
        if (index === this.currentIndex) {
          addClass(dot, "active");
        } else {
          removeClass(dot, "active");
        }
      },
      this.dotsContainer
    );
  }

  /**
   * Updates the slider's transform position for the current slide
   */
  private updateSliderPosition(): void {
    if (this.container) {
      css(
        this.container,
        'transform',
        `translateX(-${this.currentIndex * (100 / this.slides.length)}%)`
      );
    }
  }

  /**
   * Navigates to a specific slide index
   * @param index - Target slide index (0-based)
   */
  goToSlide(index: number): void {
    const length = this.slides.length;

    if (!this.options.infinite) {
      if (index < 0) index = 0;
      if (index >= length) index = length - 1;
    } else {
      if (index < 0) index = length - 1;
      if (index >= length) index = 0;
    }

    this.currentIndex = index;
    this.updateSliderPosition();
    this.updateActiveDot();

    if (this.options?.onChange) this.options?.onChange(index);
  }

  /**
   * Navigates to the next slide
   */
  next(): void {
    this.goToSlide(this.currentIndex + 1);
  }

  /**
   * Navigates to the previous slide
   */
  prev(): void {
    this.goToSlide(this.currentIndex - 1);
  }

  /**
   * Destroys the slider instance and cleans up all modifications
   */
  destroy(): void {
    this.eachSlides((slide: HTMLElement) => {
      removeClass(slide, "tex-slide");
      slide.removeAttribute("style");
    });

    this.container.removeAttribute("style");
    removeClass(this.container, "tex-slider-container");
    query(
      ".tex-slider-dots, .tex-slider-btn",
      (nav: HTMLElement) => {
        nav.remove();
      },
      this.slider
    );

    before(this.slider, this.container)
    this.slider.remove();
  }
}