import { replacement } from "./string";

export function css(
  element: HTMLElement,
  prop: string | Record<string, string | number | null>,
  value?: string | number | null
): string {
  let result = "";

  const toCamelCase = (str: string): string => {
    return str.replace(/-+(.)?/g, (_, chr: string) => (chr ? chr.toUpperCase() : ""));
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

          if (typeof element.style[styleKey] === "string" || typeof element.style[styleKey] === "undefined") {
            element.style.setProperty(prop, addPxSuffix(value));
          }
        }
      }
    } else {
      result = window.getComputedStyle(element, "").getPropertyValue(prop) || "";
    }
  }

  return result;
}

export function hasClass(element: HTMLElement | EventTarget | null, className: string): boolean {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }

  return !!element.className.match(new RegExp("(\\s|^)" + className + "(\\s|$)"));
}

export function setClass(el: HTMLElement, className: string, active: boolean | number = true) {
  let name = el.className;

  if (el) {
    if (active) {
      if (!hasClass(el, className)) name += " " + className;
    } else if (hasClass(el, className)) name = replacement(className, "", name);

    el.className = name.trim();
  }
}

export function addClass(el: HTMLElement, className: string) {
  setClass(el, className);
}

export function removeClass(el: HTMLElement, className: string) {
  setClass(el, className, 0);
}

export function toggleClass(el: HTMLElement, className: string) {
  setClass(el, className, !hasClass(el, className));
}

export function make(name: string, callback?: CallableFunction): HTMLElement {
  const el: HTMLElement = document.createElement(name);

  if (callback) callback(el);

  return el;
}

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

export function queryList(selector: string, context: HTMLElement | Document | undefined = document) {
  const list: HTMLElement[] = [];

  query(selector, (el: HTMLElement) => list.push(el), context);

  return list;
}

export function queryLength(selector: string, context: HTMLElement | Document | undefined = document): number {
  let length = 0;

  query(selector, () => length++, context);

  return length;
}

export function html(el: HTMLElement, value?: string | undefined) {
  if (value !== undefined) el.innerHTML = value;

  return el;
}

export function append(
  el: Node | Element | HTMLElement,
  child: HTMLElement | Node | NodeList | Node[]
): Element | HTMLElement | Node {
  if (child instanceof NodeList) child.forEach((item: Node) => append(el, item));
  else if (Array.isArray(child)) Array.from(child).forEach((item: Node) => append(el, item));
  else el.appendChild(child);

  return el;
}

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

export function attr(el: HTMLElement, key: string, value?: string) {
  if (value !== undefined) el.setAttribute(key, value);
  else return el.getAttribute(key);
}

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

export function appendText(el: Node | Element | HTMLElement, text: string): Node | Element | HTMLElement {
  return append(el, document.createTextNode(text));
}

export function mergeAdjacentTextNodes(element: HTMLElement): void {
  let childNodes = Array.from(element.childNodes);
  let i = 0;

  while (i < childNodes.length - 1) {
    const currentNode = childNodes[i],
      nextNode = childNodes[i + 1];

    if (currentNode.nodeType === Node.TEXT_NODE && nextNode.nodeType === Node.TEXT_NODE) {
      const combinedText = (currentNode.textContent || "") + (nextNode.textContent || ""),
        newTextNode = document.createTextNode(combinedText);

      element.replaceChild(newTextNode, currentNode);
      element.removeChild(nextNode);
      childNodes = Array.from(element.childNodes);
    } else {
      i++;
    }
  }
}

export function replaceWithChildren(element: HTMLElement): void {
  const parent = element.parentNode;

  if (!parent) return;

  const children = Array.from(element.childNodes);

  children.forEach((child) => {
    parent.insertBefore(child, element);
  });

  parent.removeChild(element);
}

export function findDatasetsWithPrefix(element: HTMLElement, prefix: string): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  const dataPrefix = `data-${prefix}`;

  Array.from(element.attributes).forEach((attr) => {
    if (attr.name.startsWith(dataPrefix)) {
      const key = attr.name.replace(`${dataPrefix}-`, "").replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

      const value = isNaN(Number(attr.value)) ? attr.value : Number(attr.value);
      result[key] = value;
    }
  });

  return result;
}

export function getChildNodes(element: Node): Node[] {
  const nodes: Node[] = [],
    childNodes = Array.from(element.childNodes);

  for (const node of childNodes) {
    nodes.push(node);
  }

  return nodes;
}
