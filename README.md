# Texditor – Visual Block Editor with Full JSON Export Support

[![npm version](https://img.shields.io/npm/v/texditor.svg)](https://www.npmjs.com/package/texditor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Website

[Website](https://texditor.priveted.com) /
[Guide](https://texditor.priveted.com/guide/) /
[API](https://texditor.priveted.com/api/) /

#### Русская версия

[Сайт](https://texditor.priveted.com/ru/) /
[Руководство](https://texditor.priveted.com/ru/guide/) /
[API](https://texditor.priveted.com/ru/api/) /

**Texditor** is a modern, **visual block editor** built with TypeScript. It provides a flexible, modular architecture for creating, editing, and managing structured content. All data is stored and exported in **pure JSON format**, making it easy to integrate, save, and process content programmatically.

---

## Key Features

- **Visual Block-Based Editing**: Easily add, remove, and customize blocks (paragraphs, headings, code, galleries, files, etc.) in a user-friendly interface.
- **Full JSON Export Support**: All content is stored and exported as **clean, structured JSON**, ensuring seamless integration with any backend or database.
- **Flexible Architecture**: Support for extensions, tools, and actions to expand functionality.
- **Localization**: Built-in multi-language support (English, Russian, and more).
- **History Management**: Undo/redo functionality with keyboard shortcut support.
- **Event System**: Track changes and execute complex operations with commands.
- **Customization**: Configure styles, behavior, and appearance through settings.

---

## Quick Start

### Installation

```bash
npm install texditor
```

### Basic Setup

Include the styles and initialize the editor:

```javascript
import 'texditor/styles/theme.css'; // Theme variables
import Texditor from 'texditor';

const editor = new Texditor({
  handle: 'texditor', // Target element ID
});
```

```html
<div id="texditor"></div>
```

---

### Advanced Configuration

Configure blocks, tools, extensions, and localization:

```javascript
import Texditor from 'texditor';
import { Paragraph, H1, H2, H3, H4, H5, H6, List, OrderedList, Code, Gallery, Files } from 'texditor/entities/blocks';
import {
  BoldTool,
  ItalicTool,
  LinkTool,
  ClearFormattingTool,
  SubscriptTool,
  SuperscriptTool,
} from 'texditor/entities/tools';
import { Undo, Redo } from 'texditor/entities/extensions';
import { EnLocale, RuLocale } from 'texditor/locales';

const editor = new Texditor({
  handle: 'texditor',

  // Default content (JSON format)
  content: [{ type: 'p', data: ['Start typing...'] }],

  // Localization
  locale: 'en',
  locales: [
    { code: 'en', data: EnLocale },
    { code: 'ru', data: RuLocale },
  ],

  // Blocks
  blocks: [
    Paragraph,
    H1.setup({ placeholder: 'Heading 1' }),
    H2,
    H3,
    List.setup({ sortable: true }),
    OrderedList,
    Code.setup({ search: true }),
    Gallery.setup({
      mimeTypes: ['image/png', 'image/jpeg'],
      multiple: true,
      ajaxConfig: {
        url: '/upload',
        options: { success: (data) => console.log(data) },
      },
    }),
    Files.setup({
      mimeTypes: ['image/png', 'application/pdf'],
      multiple: false,
    }),
  ],

  // Tools
  tools: [BoldTool, ItalicTool, LinkTool, ClearFormattingTool],

  // Extensions
  extensions: [Undo.setup({ visibleTitle: false }), Redo],

  // Actions
  actions: [CreateAction, ConvertAction, DeleteAction, MoveUpAction, MoveDownAction],

  // UI settings
  extensionsFixed: true,
  extensionVisibleTitle: true,
  autofocus: true,

  // Event handlers
  onReady: (evt) => console.log('Editor is ready!'),
  onChange: (evt) => {
    // Get content as JSON
    const content = evt.instance.save();
    console.log('Content changed (JSON):', content);
  },
});
```

---

## JSON Output Example

All content is exported as **structured JSON**, where special characters and nested elements are properly formatted:

```json
[
  {
    "type": "h1",
    "data": ["Welcome to Texditor"]
  },
  {
    "type": "p",
    "data": [
      "This is a paragraph with ",
      { "type": "b", "data": ["bold text"] },
      " and ",
      {
        "type": "a",
        "attr": { "href": "https://example.com" },
        "data": ["a link"]
      },
      "."
    ]
  },
  {
    "type": "code",
    "lang": "javascript",
    "data": ["const greet = () => {\n  console.log('Hello, world!');\n};\n\ngreet();"]
  },
  {
    "type": "gallery",
    "style": "grid",
    "data": [
      {
        "url": "/images/sunset.jpg",
        "type": "image/jpeg",
        "caption": "Beautiful sunset",
        "desc": "A photo of a sunset over the mountains"
      },
      {
        "url": "/images/forest.png",
        "type": "image/png",
        "caption": "Green forest",
        "desc": "A lush forest with tall trees"
      }
    ]
  },
  {
    "type": "ul",
    "data": [
      { "type": "li", "data": ["First item"] },
      {
        "type": "li",
        "data": ["Second item with ", { "type": "b", "data": ["bold text"] }]
      },
      {
        "type": "li",
        "data": [
          "Third item with a ",
          {
            "type": "a",
            "attr": { "href": "https://example.com" },
            "data": ["link"]
          }
        ]
      }
    ]
  },
  {
    "type": "ol",
    "data": [
      { "type": "li", "data": ["Step one"] },
      { "type": "li", "data": ["Step two"] },
      { "type": "li", "data": ["Step three"] }
    ]
  },
  {
    "type": "files",
    "data": [
      {
        "url": "/documents/report.pdf",
        "type": "application/pdf",
        "name": "Annual Report.pdf",
        "size": 2450
      }
    ]
  }
]
```

## License

[MIT](https://opensource.org/licenses/MIT)
