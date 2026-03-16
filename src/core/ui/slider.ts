import { IconArrowLeft, IconArrowRight } from "@/icons";
import {
  addClass,
  append,
  html,
  make,
  on,
  query,
  removeClass,
  renderIcon
} from "@/utils";
import { SliderInterface, SliderOptions } from "@/types";


export default class Slider implements SliderInterface {
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
   * @param container - The DOM element containing the slider structure
   * @param options - Configuration options for the slider
   */
  constructor(container: HTMLElement, options: SliderOptions = {}) {
    if (!container) throw new Error("Container not found");

    this.container = container;
    this.options = { ...this.defaultOptions, ...options };
    const slider = this.container.firstChild as HTMLElement;
    addClass(this.container, "tex-slider-container");
    addClass(slider, "tex-slider");
    this.slider = slider;

    this.eachSlides((slide: HTMLElement) => {
      addClass(slide, "tex-slide");
      this.slides.push(slide);
    });

    this.slideCount = this.slides.length;
    this.init();
  }

  /**
   * Iterates through each slide element
   * @param callback - Function to execute for each slide
   */
  private eachSlides(callback: CallableFunction): void {
    query(
      ".tex-slider > *",
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

    append(this.container, [prevBtn, nextBtn]);
  }

  /**
   * Creates and appends dot indicators for slide navigation
   */
  private createDots(): void {
    const dotContainer = make("div", (dotCnt: HTMLElement) => {
      addClass(dotCnt, "tex-slider-dots");
    });

    append(this.container, dotContainer);

    this.dotsContainer = dotContainer;
    this.dotsContainer.innerHTML = "";

    for (let i = 0; i < this.slideCount; i++) {
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
    if (this.slider)
      this.slider.style.transform = `translateX(-${this.currentIndex * 100}%)`;
  }

  /**
   * Navigates to a specific slide index
   * @param index - Target slide index (0-based)
   */
  goToSlide(index: number): void {
    if (!this.options.infinite) {
      if (index < 0) index = 0;
      if (index >= this.slideCount) index = this.slideCount - 1;
    } else {
      if (index < 0) index = this.slideCount - 1;
      if (index >= this.slideCount) index = 0;
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
    });

    query(
      ".tex-slider",
      (slider: HTMLElement) => {
        slider.removeAttribute("style");
        removeClass(slider, "tex-slider");
      },
      this.container
    );

    query(
      ".tex-slider-dots, .tex-slider-btn",
      (nav: HTMLElement) => {
        nav.remove();
      },
      this.container
    );
  }
}