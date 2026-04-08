import type {
  BlockManagerInterface,
  CommandsInterface,
  ConfigInterface,
  TexditorInterface,
  SelectionAPIInterface,
  APIInterface,
  EventsInterface,
  ParserInterface,
  ToolsInterface,
  ActionsInterface,
  I18NInterface,
  HistoryManagerInterface,
  ExtensionsInterface,
  ConfigStoreInterface
} from "./types";
import Events from "@/core/events";
import BlockManager from "@/core/block-manager";
import Config from "@/core/config";
import Parser from "@/core/parser";
import SelectionAPI from "@/core/selection-api";
import Tools from "@/core/tools";
import I18N from "@/core/i18n";
import Actions from "@/core/actions";
import API from "@/core/api";
import Commands from "@/core/commands";
import HistoryManager from "@/core/history-manager";
import Extensions from "@/core/extensions";
import "@/styles/tex.css";
import "@/styles/animations.css";

export * from "./types";
export * from "./utils";

export default class Texditor implements TexditorInterface {
  config: ConfigInterface;
  blockManager: BlockManagerInterface;
  selectionApi: SelectionAPIInterface;
  api: APIInterface;
  events: EventsInterface;
  parser: ParserInterface;
  tools: ToolsInterface;
  actions: ActionsInterface;
  i18n: I18NInterface;
  commands: CommandsInterface;
  historyManager: HistoryManagerInterface;
  extensions: ExtensionsInterface;

  constructor(config: ConfigStoreInterface) {
    this.config = new Config(config);
    this.i18n = new I18N(this);
    this.api = new API(this);
    this.events = new Events(this);
    this.historyManager = new HistoryManager(this);
    this.blockManager = new BlockManager(this);
    this.selectionApi = new SelectionAPI(this);
    this.parser = new Parser(this);
    this.tools = new Tools(this);
    this.commands = new Commands(this);
    this.actions = new Actions(this);
    this.extensions = new Extensions(this);
    this.events.ready();
  }

  save(): object[] | [] {
    return this.api.save();
  }

  destroy(): void {
    this.api.destroy();
  }
}
