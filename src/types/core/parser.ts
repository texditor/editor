import type { OutputBlockItem } from "..";

export interface ParserInterface {
  // HTML parsing methods
  stripFragmentTags(html: string): string;
  parseHtml(html: string, isFragment?: boolean): Element | null;
  htmlToData(html: string): Array<OutputBlockItem | string>;

  // Block parsing methods
  parseBlocks(
    data: object[],
    createDefault?: boolean,
    skipDecode?: boolean
  ): Node[] | [];
  parseChilds(
    block: OutputBlockItem,
    childRender?: boolean,
    skipDecode?: boolean
  ): Node | Node[];
}
