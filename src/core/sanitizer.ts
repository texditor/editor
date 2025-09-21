import { SanitizerConfig, TransformerContext, TransformerOutput } from "@/types/core/sanitizer";

export default class Sanitizer {
  static REGEX_PROTOCOL = /^([A-Za-z0-9+\-.&;*\s]*?)(?::|&*0*58|&*x0*3a)/i;
  static RELATIVE = "**";
  static ALL = "*";
  private config: SanitizerConfig;
  private allowedElements: Record<string, boolean>;
  private dom: Document;
  private currentElement: Node | null = null;
  private whitelistNodes: Node[] = [];
  private transformers: Array<(context: TransformerContext) => TransformerOutput | null>;

  /**
   * Creates a new Sanitizer instance with the provided configuration
   * @param options - Configuration options for the sanitizer
   */
  constructor(options: SanitizerConfig = {}) {
    this.config = {
      elements: options.elements ? options.elements : [],
      attributes: options.attributes ? options.attributes : {},
      allowComments: options.allowComments ? options.allowComments : false,
      protocols: options.protocols ? options.protocols : {},
      addAttributes: options.addAttributes ? options.addAttributes : {},
      dom: options.dom ? options.dom : document,
      removeContents: options.removeContents,
      transformers: options.transformers ? options.transformers : [],
      removeAllContents: false,
      removeElementContents: {}
    };

    if (this.config.attributes)
      this.config.attributes[Sanitizer.ALL] = this.config.attributes[Sanitizer.ALL]
        ? this.config.attributes[Sanitizer.ALL]
        : [];

    this.allowedElements = {};
    this.dom = this.config.dom!;

    for (let i = 0; i < this.config.elements!.length; i++) {
      this.allowedElements[this.config.elements![i]] = true;
    }

    if (options.removeContents) {
      if (Array.isArray(options.removeContents)) {
        for (let i = 0; i < options.removeContents.length; i++) {
          (this.config.removeElementContents as Record<string, boolean>)[options.removeContents[i]] = true;
        }
      } else {
        this.config.removeAllContents = true;
      }
    }

    this.transformers = options.transformers ? options.transformers : [];
  }

  /**
   * Finds the index of a node in an array
   * @param needle - The node to search for
   * @param haystack - The array of nodes to search in
   * @returns The index of the node or -1 if not found
   */
  private arrayIndex(needle: Node, haystack: Node[]): number {
    for (let i = 0; i < haystack.length; i++) {
      if (haystack[i] === needle) return i;
    }
    return -1;
  }

  /**
   * Merges multiple arrays while removing duplicates
   * @param arrays - Arrays to merge
   * @returns A new array with unique items from all input arrays
   */
  private mergeArrays(...arrays: (string[] | undefined)[]): string[] {
    const result: string[] = [];
    const uniq_hash: Record<string, boolean> = {};

    for (const array of arrays) {
      if (!array || !array.length) continue;
      for (const item of array) {
        if (uniq_hash[item]) continue;
        uniq_hash[item] = true;
        result.push(item);
      }
    }

    return result;
  }

  /**
   * Cleans a node based on its type
   * @param elem - The node to clean
   */
  private clean(elem: Node): void {
    let clone: Node;

    switch (elem.nodeType) {
      case 1:
        this.cleanElement(elem as Element);
        break;
      case 3:
      case 5:
        clone = this.dom.createTextNode(elem.textContent || "");
        this.currentElement?.appendChild(clone);
        break;
      case 8:
        if (this.config.allowComments) {
          clone = elem.cloneNode(false);
          this.currentElement?.appendChild(clone);
        }
        break;
      default:
        console.warn("Unknown node type", elem.nodeType);
        break;
    }
  }

  /**
   * Cleans an element node by applying transformations and filtering attributes
   * @param elem - The element to clean
   */
  private cleanElement(elem: Element): void {
    const transform = this.transformElement(elem);
    elem = transform.node as Element;
    const name = elem.nodeName.toLowerCase();
    const parentElement = this.currentElement;

    if (this.allowedElements[name] || transform.whitelist) {
      this.currentElement = this.dom.createElement(elem.nodeName);
      parentElement?.appendChild(this.currentElement);

      const allowed_attributes = this.mergeArrays(
        this.config.attributes?.[name],
        this.config.attributes?.[Sanitizer.ALL],
        transform.attrWhitelist
      );

      for (let i = 0; i < allowed_attributes.length; i++) {
        const attr_name = allowed_attributes[i];
        const attr = elem.attributes.getNamedItem(attr_name);
        if (attr) {
          let attr_ok = true;
          if (this.config.protocols?.[name]?.[attr_name]) {
            const protocols = this.config.protocols[name][attr_name];
            const del = attr.value.toLowerCase().match(Sanitizer.REGEX_PROTOCOL);
            if (del) {
              attr_ok = protocols.indexOf(del[1]) !== -1;
            } else {
              attr_ok = protocols.indexOf(Sanitizer.RELATIVE) !== -1;
            }
          }
          if (attr_ok) {
            const attr_node = document.createAttribute(attr_name);
            attr_node.value = attr.value;
            (this.currentElement as Element).setAttributeNode(attr_node);
          }
        }
      }

      if (this.config.addAttributes?.[name]) {
        for (const attr_name in this.config.addAttributes[name]) {
          const attr_node = document.createAttribute(attr_name);
          attr_node.value = this.config.addAttributes[name][attr_name];
          (this.currentElement as Element).setAttributeNode(attr_node);
        }
      }
    } else if (this.arrayIndex(elem, this.whitelistNodes) !== -1) {
      this.currentElement = elem.cloneNode(true) as Element;
      while (this.currentElement.childNodes.length > 0) {
        this.currentElement.removeChild(this.currentElement.firstChild!);
      }
      parentElement?.appendChild(this.currentElement);
    }

    if (!this.config.removeAllContents && !(this.config.removeElementContents as Record<string, boolean>)[name]) {
      for (let i = 0; i < elem.childNodes.length; i++) {
        this.clean(elem.childNodes[i]);
      }
    }

    if ((this.currentElement as Element).normalize) {
      (this.currentElement as Element).normalize();
    }
    this.currentElement = parentElement;
  }

  /**
   * Applies transformers to a node and returns the transformed result
   * @param node - The node to transform
   * @returns The transformation output containing whitelist status and attributes
   */
  private transformElement(node: Node): TransformerOutput {
    const output: TransformerOutput = {
      attrWhitelist: [],
      node: node,
      whitelist: false
    };

    for (let i = 0; i < this.transformers.length; i++) {
      const transform = this.transformers[i]({
        allowedElements: this.allowedElements,
        config: this.config,
        node: node,
        nodeName: node.nodeName.toLowerCase(),
        whitelistNodes: this.whitelistNodes,
        dom: this.dom
      });

      if (transform == null) continue;
      if (typeof transform !== "object") {
        throw new Error("Transformer output must be an object or null");
      }

      if (transform.whitelistNodes?.length) {
        for (let j = 0; j < transform.whitelistNodes.length; j++) {
          if (this.arrayIndex(transform.whitelistNodes[j], this.whitelistNodes) === -1) {
            this.whitelistNodes.push(transform.whitelistNodes[j]);
          }
        }
      }

      output.whitelist = transform.whitelist ? true : false;
      if (transform.attrWhitelist) {
        output.attrWhitelist = this.mergeArrays(output.attrWhitelist, transform.attrWhitelist);
      }
      output.node = transform.node ? transform.node : output.node;
    }

    return output;
  }

  /**
   * Converts an array of nodes to a string, handling text and element nodes appropriately
   * @param nodes - The nodes to convert to string
   * @returns The concatenated string representation of the nodes
   */
  mergeTextNodesToString(nodes: Node[] | NodeListOf<ChildNode>): string {
    return Array.from(nodes)
      .map((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return this.escapeHtml(node.textContent || "");
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          return (node as HTMLElement).outerHTML || "";
        }
        return "";
      })
      .join("");
  }

  /**
   * Escapes HTML special characters in text
   * @param text - The text to escape
   * @returns The escaped HTML string
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Sanitizes HTML input by removing disallowed elements and attributes
   * @param input - HTML string or HTMLElement to sanitize
   * @returns The sanitized HTML string
   */
  sanitize(input: string | HTMLElement): string {
    let container: HTMLElement;

    if (typeof input === "string") {
      container = document.createElement("div");
      const textNode = document.createTextNode(input);
      container.appendChild(textNode);
    } else {
      container = input;
    }

    const fragment = this.dom.createDocumentFragment();
    this.currentElement = fragment;
    this.whitelistNodes = [];

    for (let i = 0; i < container.childNodes.length; i++) {
      this.clean(container.childNodes[i]);
    }

    if (fragment.normalize) fragment.normalize();

    return this.mergeTextNodesToString(fragment.childNodes);
  }
}
