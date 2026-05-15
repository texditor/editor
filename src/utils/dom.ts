import { replacement } from "./string";

/**
 * Gets or sets CSS styles on an element
 * @param element - Target DOM element
 * @param prop - CSS property name or object with multiple properties
 * @param value - CSS value (required if prop is string)
 * @returns Computed style value when getting, empty string when setting
 */
export function css(
  element: HTMLElement,
  prop: string | Record<string, string | number | null>,
  value?: string | number | null
): string {
  let result = "";

  const toCamelCase = (str: string): string => {
    return str.replace(/-+(.)?/g, (_, chr: string) =>
      chr ? chr.toUpperCase() : ""
    );
  };

  const addPxSuffix = (value: string | number): string => {
    return typeof value === "number" ? `${value}px` : String(value);
  };

  if (typeof prop === "object") {
    for (const [property, val] of Object.entries(prop)) {
      css(element, property, val);
    }
  } else {
    const camelCaseProp = toCamelCase(prop);

    if (value !== undefined && value !== null) {
      if (value === "" || value === null) {
        element.style.removeProperty(prop);
      } else {
        if (camelCaseProp in element.style) {
          const styleKey = camelCaseProp as keyof CSSStyleDeclaration;

          if (
            typeof element.style[styleKey] === "string" ||
            typeof element.style[styleKey] === "undefined"
          ) {
            element.style.setProperty(prop, addPxSuffix(value));
          }
        }
      }
    } else {
      result =
        window.getComputedStyle(element, "").getPropertyValue(prop) || "";
    }
  }

  return result;
}

/**
 * Checks if an element has a specific CSS class
 * @param element - Target DOM element
 * @param className - CSS class name to check
 * @returns True if element has the class, false otherwise
 */
export function hasClass(
  element: HTMLElement | EventTarget | null,
  className: string
): boolean {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }

  return !!element.className.match(
    new RegExp("(\\s|^)" + className + "(\\s|$)")
  );
}

/**
 * Sets or removes a CSS class on an element
 * @param el - Target DOM element
 * @param className - CSS class name
 * @param active - True to add, false to remove (default: true)
 */
export function setClass(
  el: HTMLElement,
  className: string,
  active: boolean | number = true
) {
  let name = el?.className || '';

  if (el) {
    if (active) {
      if (!hasClass(el, className)) name += " " + className;
    } else if (hasClass(el, className)) name = replacement(className, "", name);

    el.className = name.trim();
  }
}

/**
 * Adds a CSS class to an element
 * @param el - Target DOM element
 * @param className - CSS class name
 */
export function addClass(el: HTMLElement, className: string) {
  setClass(el, className);
}

/**
 * Removes a CSS class from an element
 * @param el - Target DOM element
 * @param className - CSS class name
 */
export function removeClass(el: HTMLElement, className: string) {
  setClass(el, className, 0);
}

/**
 * Toggles a CSS class on an element
 * @param el - Target DOM element
 * @param className - CSS class name
 */
export function toggleClass(el: HTMLElement, className: string) {
  setClass(el, className, !hasClass(el, className));
}

/**
 * Creates a new HTML element
 * @param name - HTML tag name
 * @param callback - Optional callback function called with the created element
 * @returns The created element
 */
export function make(name: string, callback?: CallableFunction): HTMLElement {
  const el: HTMLElement = document.createElement(name);

  if (callback) callback(el);

  return el;
}

/**
 * Creates a new text node.
 * @param content - The text content.
 * @returns The created text node.
 */
export function makeText(content: string = ''): Text {
  return document.createTextNode(content);
}

/**
 * Removes an element from the DOM.
 * @param element - The element to remove.
 */
export function remove(element: Element | HTMLElement): void {
  element.parentNode?.removeChild(element);
}

/**
 * Queries DOM elements matching a selector and executes a callback for each
 * @param selector - CSS selector
 * @param callback - Function called for each matching element
 * @param context - DOM context to query within (default: document)
 * @returns False if no elements found, otherwise number of elements
 */
export function query(
  selector: string,
  callback: CallableFunction,
  context: HTMLElement | Document | undefined | null = document
) {
  context = context ? context : document;
  const elements = context.querySelectorAll(selector);

  if (!elements.length) return false;

  elements.forEach((el, i) => {
    if (callback) callback(el, i);
  });

  return elements.length;
}

/**
 * Returns an array of elements matching a selector
 * @param selector - CSS selector
 * @param context - DOM context to query within (default: document)
 * @returns Array of matching elements
 */
export function queryList(
  selector: string,
  context: HTMLElement | Document | undefined = document
) {
  const list: HTMLElement[] = [];

  query(selector, (el: HTMLElement) => list.push(el), context);

  return list;
}

/**
 * Returns the count of elements matching a selector
 * @param selector - CSS selector
 * @param context - DOM context to query within (default: document)
 * @returns Number of matching elements
 */
export function queryLength(
  selector: string,
  context: HTMLElement | Document | undefined = document
): number {
  let length = 0;

  query(selector, () => length++, context);

  return length;
}

/**
 * Gets or sets inner HTML of an element
 * @param el - Target DOM element
 * @param value - HTML string to set (optional)
 * @returns Element when setting, HTML string when getting
 */
export function html(el: HTMLElement, value?: string | null): string;
export function html(el: HTMLElement, value: string): HTMLElement;
export function html(
  el: HTMLElement,
  value?: string | null
): HTMLElement | string {
  if (value != null) {
    el.innerHTML = value;
    return el;
  }

  return el.innerHTML;
}

/**
 * Converts DOM nodes or elements to HTML string
 * @param data - Node, element, array, or string to convert
 * @returns HTML string representation
 */
export function toHtml(data: string | Node | Node[] | HTMLElement | HTMLElement[]): string {
  if (typeof data === 'string') return data;

  if (Array.isArray(data)) {
    return data.map(item => {
      if (item instanceof HTMLElement) return item.outerHTML;
      if (item instanceof Node) {
        return item.nodeType === Node.TEXT_NODE
          ? item.textContent || ''
          : (item as HTMLElement).outerHTML || item.textContent || '';
      }
      return '';
    }).join('');
  }

  if (data instanceof HTMLElement) return data.outerHTML;

  if (data instanceof Node) {
    return data.nodeType === Node.TEXT_NODE
      ? data.textContent || ''
      : (data as HTMLElement).outerHTML || data.textContent || '';
  }

  return '';
}

/**
 * Appends a child node or nodes to an element
 * @param el - Parent element
 * @param child - Child node, array of nodes, or NodeList to append
 * @returns The parent element
 */
export function append(
  el: Node | Element | HTMLElement,
  child: HTMLElement | Node | NodeList | Node[]
): Element | HTMLElement | Node {
  if (child instanceof NodeList)
    child.forEach((item: Node) => append(el, item));
  else if (Array.isArray(child))
    Array.from(child).forEach((item: Node) => append(el, item));
  else el.appendChild(child);

  return el;
}

/**
 * Prepends a child node or nodes to an element (inserts at the beginning)
 * @param el - Parent element
 * @param child - Child node, array of nodes, or NodeList to prepend
 * @returns The parent element
 */
export function prepend(
  el: Node | Element | HTMLElement,
  child: HTMLElement | Node | NodeList | Node[]
): Element | HTMLElement | Node {
  if (child instanceof NodeList) {
    Array.from(child)
      .reverse()
      .forEach((item: Node) => prepend(el, item));
  } else if (Array.isArray(child)) {
    [...child].reverse().forEach((item: Node) => prepend(el, item));
  } else {
    el.insertBefore(child, el.firstChild);
  }

  return el;
}

/**
 * Inserts a node or nodes before an element
 * @param el - Reference element
 * @param child - Node or nodes to insert
 * @returns The reference element
 */
export function before(
  el: Node | Element | HTMLElement,
  child: HTMLElement | Node | NodeList | Node[]
): Element | HTMLElement | Node {
  if (child instanceof NodeList) {
    Array.from(child).forEach((item: Node) => before(el, item));
  } else if (Array.isArray(child)) {
    Array.from(child).forEach((item: Node) => before(el, item));
  } else {
    el.parentNode?.insertBefore(child, el);
  }
  return el;
}

/**
 * Inserts a node or nodes after an element
 * @param el - Reference element
 * @param child - Node or nodes to insert
 * @returns The reference element
 */
export function after(
  el: Node | Element | HTMLElement,
  child: HTMLElement | Node | NodeList | Node[]
): Element | HTMLElement | Node {
  if (child instanceof NodeList) {
    Array.from(child).forEach((item: Node) => after(el, item));
  } else if (Array.isArray(child)) {
    Array.from(child).forEach((item: Node) => after(el, item));
  } else {
    el.parentNode?.insertBefore(child, el.nextSibling);
  }
  return el;
}

/**
 * Gets or sets an attribute on an element
 * @param el - Target element
 * @param key - Attribute name or object with attributes
 * @param value - Attribute value (if provided, sets the attribute)
 * @returns Attribute value when getting, undefined when setting
 */
export function attr(el: Element | HTMLElement, key: string | Record<string, string>, value?: string) {
  if (typeof key === 'object' && key !== null) {
    Object.entries(key).forEach(([attrKey, attrValue]) => {
      attr(el, attrKey, attrValue);
    });
    return;
  }

  if (value !== undefined) el.setAttribute(key, value);
  else return el.getAttribute(key);
}

/**
 * Checks if an element is a child of another element
 * @param element - Child element to check
 * @param children - Potential parent element
 * @returns The parent if found, false otherwise
 */
export function closest(
  element: Node | HTMLElement | EventTarget | HTMLTextAreaElement | null,
  children: Node | HTMLElement | EventTarget | HTMLTextAreaElement | null
) {
  let el = element as HTMLElement;

  if (!el?.parentElement) return false;

  while (el.parentElement) {
    if (el === children) return el;

    el = el.parentElement;
  }

  return false;
}

/**
 * Appends a text node to an element
 * @param el - Target element
 * @param text - Text content
 * @returns The parent element
 */
export function appendText(
  el: Node | Element | HTMLElement,
  text: string
): Node | Element | HTMLElement {
  return append(el, document.createTextNode(text));
}

/**
 * Creates a text node
 * @param text - Text content
 * @returns The created text node
 */
export function toTextNode(
  text: string
): Node {
  return document.createTextNode(text);
}

/**
 * Merges adjacent text nodes within an element
 * @param element - Target element
 */
export function mergeAdjacentTextNodes(element: HTMLElement): void {
  let childNodes = Array.from(element.childNodes);
  let i = 0;

  while (i < childNodes.length - 1) {
    const currentNode = childNodes[i],
      nextNode = childNodes[i + 1];

    if (
      currentNode.nodeType === Node.TEXT_NODE &&
      nextNode.nodeType === Node.TEXT_NODE
    ) {
      const combinedText =
        (currentNode.textContent || "") + (nextNode.textContent || ""),
        newTextNode = document.createTextNode(combinedText);

      element.replaceChild(newTextNode, currentNode);
      element.removeChild(nextNode);
      childNodes = Array.from(element.childNodes);
    } else {
      i++;
    }
  }
}

/**
 * Replaces an element with its children (removes the wrapper element)
 * @param element - Element to replace with its children
 */
export function replaceWithChildren(element: HTMLElement): void {
  const parent = element.parentNode;

  if (!parent) return;

  const children = Array.from(element.childNodes);

  children.forEach((child) => {
    parent.insertBefore(child, element);
  });

  parent.removeChild(element);
}

/**
 * Gets or sets a data attribute on an element
 * @param el - Target element
 * @param key - Data attribute name (without 'data-' prefix) or object with data attributes
 * @param value - Data attribute value (if provided, sets the attribute)
 * @returns Data attribute value when getting, undefined when setting
 */
export function data(el: HTMLElement, key: string | Record<string, string>, value?: string) {
  if (typeof key === 'object' && key !== null) {
    Object.entries(key).forEach(([dataKey, dataValue]) => {
      data(el, dataKey, dataValue);
    });
    return;
  }

  if (value !== undefined) el.dataset[key] = value;
  else return el.dataset[key];
}

/**
 * Finds all data attributes with a specific prefix and returns them as an object
 * @param element - Target element
 * @param prefix - Data attribute prefix (without 'data-')
 * @returns Object with camelCased keys and parsed values
 */
export function findDatasetsWithPrefix(
  element: HTMLElement,
  prefix: string
): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  const dataPrefix = `data-${prefix}`;

  Array.from(element.attributes).forEach((attr) => {
    if (attr.name.startsWith(dataPrefix)) {
      const key = attr.name
        .replace(`${dataPrefix}-`, "")
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

      const value = isNaN(Number(attr.value)) ? attr.value : Number(attr.value);
      result[key] = value;
    }
  });

  return result;
}

/**
 * Returns an array of child nodes from an element
 * @param element - Target node
 * @returns Array of child nodes
 */
export function getChildNodes(element: Node): Node[] {
  const nodes: Node[] = [],
    childNodes = Array.from(element.childNodes);

  for (const node of childNodes) {
    nodes.push(node);
  }

  return nodes;
}

/**
 * Gets combined text content from a node or array of nodes
 * @param node - Node or array of nodes
 * @returns Combined text content
 */
export function getText(node: Node | Node[]): string {
  let result = "";

  const nodes = Array.isArray(node)
    ? node
    : [node];

  nodes.forEach(
    (nodeItem) => result += nodeItem.textContent
  );

  return result;
}

/**
 * Gets the total text length from a node or array of nodes
 * @param node - Node or array of nodes
 * @returns Total text length
 */
export function getLength(node: Node | Node[]): number {
  return getText(node).length;
}

/**
 * Removes HTML fragment wrapper tags
 * @param html - Raw HTML string that may contain fragment tags
 * @returns Cleaned HTML string without fragment tags
 */
export function stripFragmentTags(html: string): string {
  return html.replace(
    /<!--StartFragment-->([^<]*(?:<(?!!--(?:Start|End)Fragment-->)[^<]*)*)<!--EndFragment-->/g,
    "$1"
  );
}

/**
 * Parses an HTML string into DOM nodes
 * @param html - HTML string to parse
 * @param stripFragment - Whether the HTML contains fragment tags that need stripping (default: false)
 * @returns Array of child nodes, or empty array if parsing failed
 */
export function parseHtml(html: string, stripFragment: boolean = false): Node[] {
  const parser = new DOMParser(),
    input = stripFragment ? stripFragmentTags(html) : html;

  const doc = parser.parseFromString(
    `<parser-rawblock>${input}</parser-rawblock>`,
    "text/html"
  );

  const node = doc.querySelector("parser-rawblock");

  if (!node)
    return [];

  return getChildNodes(node);
}