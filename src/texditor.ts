import "@/styles/tex.css";
import "@/styles/animations.css";
import { ConfigStore } from "@/types/core";
import Events from "@/core/events";
import BlockManager from "@/core/block-manager";
import Config from "@/core/config";
import Parser from "@/core/parser";
import SelectionAPI from "@/core/selection-api";
import Toolbar from "@/core/toolbar";
import I18N from "@/core/i18n";
import Actions from "@/core/actions";
import API from "@/core/api";
import Commands from "@/core/commands";
import HistoryManager from "@/core/history-manager";
import Extensions from "./core/extensions";

export default class Texditor {
  config: Config;
  blockManager: BlockManager;
  selectionApi: SelectionAPI;
  api: API;
  events: Events;
  parser: Parser;
  toolbar: Toolbar;
  actions: Actions;
  i18n: I18N;
  commands: Commands;
  historyManager: HistoryManager;
  extensions: Extensions;

  constructor(config: ConfigStore) {
    this.config = new Config(config);
    this.i18n = new I18N(this);
    this.api = new API(this);
    this.events = new Events(this);
    this.historyManager = new HistoryManager(this);
    this.blockManager = new BlockManager(this);
    this.selectionApi = new SelectionAPI(this);
    this.parser = new Parser(this);
    this.toolbar = new Toolbar(this);
    this.commands = new Commands(this);
    this.actions = new Actions(this);
    this.extensions = new Extensions(this);
    this.events.onReady(() => {
      this.api.render();
      this.actions.apply();
      this.toolbar.apply();
      this.historyManager.save();

      const readyCallback = this.config.get("onReady", false);

      if (typeof readyCallback === "function") readyCallback(this);
    });
  }

  save(): object[] | [] {
    return this.api.save();
  }

  destroy(): void {
    this.api.destroy();
  }
}
