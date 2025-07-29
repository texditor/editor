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
import Commands from "./core/commands";

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

  constructor(config: ConfigStore) {
    this.config = new Config(config);
    this.i18n = new I18N(this);
    this.api = new API(this);
    this.events = new Events(this);
    this.blockManager = new BlockManager(this);
    this.selectionApi = new SelectionAPI(this);
    this.parser = new Parser(this);
    this.toolbar = new Toolbar(this);
    this.commands = new Commands(this);
    this.actions = new Actions(this);
    this.events.onReady(() => {
      this.api.render();
      this.actions.apply();
      this.toolbar.apply();

      const readyCallback = this.config.get("onReady", false);

      if (typeof readyCallback === "function") readyCallback(this);
    });
  }

  save(): object[] | [] {
    return this.api.save();
  }
}
