import type {
  BlockManagerInterface,
  ConfigInterface,
  EventsInterface,
  ParserInterface,
  SelectionAPIInterface,
  ToolbarInterface,
  APIInterface,
  ActionsInterface,
  I18NInterface,
  CommandsInterface,
  HistoryManagerInterface,
  ExtensionsInterface
} from ".";

export interface TexditorInterface {
  config: ConfigInterface;
  blockManager: BlockManagerInterface;
  selectionApi: SelectionAPIInterface;
  api: APIInterface;
  events: EventsInterface;
  parser: ParserInterface;
  toolbar: ToolbarInterface;
  actions: ActionsInterface;
  i18n: I18NInterface;
  commands: CommandsInterface;
  historyManager: HistoryManagerInterface;
  extensions: ExtensionsInterface;
  save(): object[] | [];
  destroy(): void;
}
