import "./app.css";
import "../src/styles/theme.css";
import jsonPreview from "./utils/json-preview";
import Texditor from "@/texditor";
// import data1 from "./dataV2.json";
// import data3 from "./dataV3Tools.json";
import data from "./dataWithGallery.json";
import Paragraph from "@/blocks/paragraph";
import H1 from "@/blocks/header/H1";
import H2 from "@/blocks/header/H2";
import H3 from "@/blocks/header/H3";
import List from "@/blocks/list";
import OrderdList from "@/blocks/list/ol";
import { RuLocale } from "@/locales";
import Code from "@/blocks/code";
import Gallery from "@/blocks/gallery";
import H4 from "@/blocks/header/H4";
import H5 from "@/blocks/header/H5";
import H6 from "@/blocks/header/H6";
import BoldTool from "@/tools/bold";
import ItalicTool from "@/tools/italic";
import ClearFormatingTool from "@/tools/clear-formating";
import LinkTool from "@/tools/link";
import SubscriptTool from "@/tools/subscript";
import SuperscriptTool from "@/tools/superscript";
import { Files } from "@/blocks";

const editor = new Texditor({
  handle: "texditor",
  initalData: data,
  actionsLeftIndent: 32,
  // actionsTopOffset: 2,
  locale: "ru",
  toolModels: [BoldTool, ItalicTool, LinkTool, SubscriptTool, SuperscriptTool, ClearFormatingTool],
  blockModels: [
    Paragraph,
    H1,
    H2,
    H3,
    H4,
    H5,
    H6,
    List,
    OrderdList,
    Code,
    Files,
    Gallery.setup({
      mimeTypes: ["image/png", "image/jpeg", "video/mp4"],
      multiple: true,
      // stylesLtr: 'right',
      // styles: [],
      // defaultStyle: 'slider',
      ajaxConfig: {
        url: "http://localhost/upload.php",
        options: {
          data: {
            hello: 33
          }
        }
      }
    })
  ],
  onReady: () => {
    document.getElementById("saveButton")?.click();
  },
  onChange: () => {
    setTimeout(() => {
      document.getElementById("saveButton")?.click();
    }, 10);
  }
});

editor.i18n.setLocale("ru", RuLocale);

document.getElementById("saveButton")?.addEventListener(
  "click",
  () => {
    const output = editor.save();
    const id = document.getElementById("output");

    if (id) jsonPreview.show(output, id);
  },
  true
);
