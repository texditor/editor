/**
 * Configuration options for the Slider component
 */
export interface SliderOptions {
  /**
   * Enables infinite looping navigation
   * When true, navigating past the last slide goes to the first and vice versa
   * @default true
   */
  infinite?: boolean;
  
  /**
   * Callback function triggered whenever the active slide changes
   * @param index - The new current slide index (0-based)
   */
  onChange?: (index: number) => void;
}

/**
 * Public API interface for the Slider class
 * Defines all methods and properties available for external use
 */
export interface SliderInterface {
  /**
   * Navigates to a specific slide by index
   * @param index - Target slide index (0-based)
   * @throws Will not throw but will clamp index based on infinite option
   */
  goToSlide(index: number): void;
  
  /**
   * Navigates to the next slide
   * Behavior depends on infinite option setting
   */
  next(): void;
  
  /**
   * Navigates to the previous slide
   * Behavior depends on infinite option setting
   */
  prev(): void;
  
  /**
   * Completely destroys the slider instance
   * Removes all added classes, styles, and DOM elements
   * Restores the container to its original state
   */
  destroy(): void;
}