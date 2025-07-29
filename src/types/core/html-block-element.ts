import BlockModel from "@/core/models/block-model";

export interface HTMLBlockElement extends HTMLElement {
  blockModel: BlockModel;
  value: string;
}
