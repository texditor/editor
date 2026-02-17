# Texditor - Minimalistic Block Editor 🧱✏️

A modern, modular block-based text editor built with TypeScript. Featuring a clean architecture, extensible design, and customizable content blocks.

![Beta Version](https://img.shields.io/badge/version-beta-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

## Features ✨

- 🧩 Modular block system
- 🎨 Clean, extensible architecture
- �️ Customizable themes
- 🛠️ Rich toolset (bold, italic, links, etc.)
- 📦 Easy to integrate

## Quick Start 🚀

### Basic Setup

```js
import "@texditor/editor/styles/theme.css"; // Theme variables
import "@texditor/editor/styles/editor.css"; // Core styles
import Texditor from "@texditor/editor";

const editor = new Texditor({
  handle: "texditor" // Target element ID
});
```

```html
<div class="editor" id="texditor"></div>
```

##### Advanced Configuration

```js
import {
  Code,
  Files,
  Gallery,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  List,
  OrderedList,
  Paragraph
} from "@texditor/editor/blocks";
import { Undo, Redo } from "@texditor/editor/extensions";

import {
  BoldTool,
  ClearFormatingTool,
  ItalicTool,
  LinkTool,
  SubscriptTool,
  SuperscriptTool
} from "@texditor/editor/tools";

const editor = new Texditor({
  handle: "texditor",
  extensions: [Undo, Redo],
  tools: [
    BoldTool,
    LinkTool
    // Add more tools...
  ],
  blockModels: [
    Paragraph, // Default configuration
    H1.setup({
      // Custom configuration
      placeholder: "Heading 1",
      sanitizerConfig: {
        elements: ["a", "sup", "sub"]
        // Additional sanitizer options...
      }
    })
    // Add more blocks...
  ]
});
```

### Contribution 🤝

We welcome contributions! Please feel free to submit issues or pull requests.
