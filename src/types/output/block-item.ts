export type BlockItemData = string | string[] | object[];

export interface OutputBlockItem {
  data: BlockItemData | [];
  type: string;
  attr?: Record<string, string | undefined>;
  [key: string]: unknown;
}
