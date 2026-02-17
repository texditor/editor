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

interface SliderOptions {
  infinite?: boolean;
  onChange?: (index: number) => void;
}

export default class Slider {
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

  constructor(container: HTMLElement, options: SliderOptions = {}) {
    if (!container) throw new Error("Container not found");

    this.container = container as HTMLElement;
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

  private eachSlides(callback: CallableFunction) {
    query(
      ".tex-slider > *",
      (slide: HTMLElement, index: number) => {
        callback(slide, index);
      },
      this.container
    );
  }

  private init(): void {
    this.createDots();
    this.createButtons();
    this.updateActiveDot();
  }

  private createButtons() {
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

  private updateSliderPosition(): void {
    this.slider.style.transform = `translateX(-${this.currentIndex * 100}%)`;
  }

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

  next(): void {
    this.goToSlide(this.currentIndex + 1);
  }

  prev(): void {
    this.goToSlide(this.currentIndex - 1);
  }

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
