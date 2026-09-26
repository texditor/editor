# Texditor — minimalistic visual block editor

A powerful and flexible block editor that allows you to create web applications with a clean and elegant data architecture, presented in JSON format

---
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

On our [official website](https://texditor.priveted.com), you will find more detailed information about configuring the editor.

---

## JSON Output Example

All content is exported as **structured JSON**, where special characters and nested elements are properly formatted:

```json
[
    {
        "type" : "h2",
        "data" : [
            "Life: A Journey, Not a Destination"
        ]
    },
    {
        "type" : "p",
        "data" : [
            {
                "type" : "b",
                "data" : [
                    "Life "
                ]
            },
            "is not a straight ",
            {
                "type" : "a",
                "data" : [
                    "road"
                ],
                "attr" : {
                    "href" : "https://agenoria.ru/"
                }
            },
            " marked on a map. It is more of a winding path, full of unexpected turns, steep climbs and breathtaking views from the summits. We ",
            {
                "type" : "i",
                "data" : [
                    "make mistakes"
                ]
            },
            ", fall, and it is these scars and bruises that become our most honest biography. ",
            {
                "type" : "mark",
                "data" : [
                    "The value"
                ]
            },
            " lies not in perfectly avoiding falls, but in the courage to get up each time, becoming a little wiser and stronger. It is in the small things – in the morning coffee, in the laughter of an old friend, in the warmth of a sunbeam on your face – that its true ",
            {
                "type" : "code",
                "data" : [
                    "magic"
                ]
            },
            " lies."
        ]
    },
    {
        "type" : "image",
        "data" : [
            {
                "url" : "/images/cat.jpg",
                "type" : "image/jpeg",
                "caption" : "Image Title",
                "desc" : "Basic description of the image"
            },
            {
                "url" : "/images/rose.jpg",
                "type" : "image/jpeg"
            },
            {
                "url" : "/images/girl.jpg",
                "type" : "image/jpeg"
            },
            {
                "url" : "/images/dog.jpg",
                "type" : "image/jpeg"
            }
        ],
        "style" : "grid"
    },
    {
        "type" : "h3",
        "data" : [
            "To-do list"
        ]
    },
    {
        "type" : "ul",
        "data" : [
            {
                "type" : "li",
                "data" : [
                    "Write a report"
                ]
            },
            {
                "type" : "li",
                "data" : [
                    "Reply to emails"
                ]
            },
            {
                "type" : "li",
                "data" : [
                    "Call the client"
                ]
            }
        ]
    },
    {
        "type" : "image",
        "data" : [
            {
                "url" : "/images/balloons.jpg",
                "type" : "image/jpeg"
            },
            {
                "url" : "/images/sunrise.jpg",
                "type" : "image/jpeg",
                "caption" : "Image Title"
            }
        ],
        "style" : "slider"
    },
    {
        "type" : "h2",
        "data" : [
            "Video"
        ]
    },
    {
        "type" : "p",
        "data" : [
            "Adding a kitten video"
        ]
    },
    {
        "type" : "video",
        "data" : [
            {
                "url" : "/video/cat.mp4",
                "type" : "video/mp4",
                "caption" : "Hello Kitty",
                "desc" : "This is a beautiful kitten."
            }
        ]
    },
    {
        "type" : "h2",
        "data" : [
            "Files"
        ]
    },
    {
        "type" : "p",
        "data" : [
            "Let's add a few files to make everything look harmonious."
        ]
    },
    {
        "type" : "file",
        "data" : [
            {
                "url" : "/images/cat.jpg",
                "type" : "image/png",
                "caption" : "Hello Kitty",
                "desc" : "It's a beautiful kitten.",
                "name" : "cat.jpg",
                "size" : 54993
            },
            {
                "url" : "/files/My-Document.docx",
                "type" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "name" : "Мy-Document.docx",
                "size" : 12993
            }
        ]
    },
    {
        "type" : "h2",
        "data" : [
            "Images in a row"
        ]
    },
    {
        "type" : "p",
        "data" : [
            "This layout style allows you to display images in their natural size, as well as move them to another row."
        ]
    },
    {
        "type" : "image",
        "data" : [
            {
                "url" : "/images/telegram.png",
                "type" : "image/png"
            },
            {
                "url" : "/images/inst.png",
                "type" : "image/png"
            },
            {
                "url" : "/images/youtube.png",
                "type" : "image/png"
            },
            {
                "url" : "/images/check.png",
                "type" : "image/png"
            },
            {
                "url" : "/images/dinosaur.png",
                "type" : "image/png"
            }
        ],
        "style" : "row"
    },
    {
        "type" : "h2",
        "data" : [
            "Table"
        ]
    },
    {
        "type" : "p",
        "data" : [
            "This customizable table, thanks to the ",
            {
                "type" : "code",
                "data" : [
                    "maxBreaks: 2"
                ]
            },
            " parameter, allows you to wrap text onto the next line. To use this feature, you need to press and hold the ",
            {
                "type" : "mark",
                "data" : [
                    "Shift and Enter"
                ]
            },
            " keys."
        ]
    },
    {
        "type" : "table",
        "data" : [
            {
                "type" : "tr",
                "data" : [
                    {
                        "type" : "th",
                        "data" : [
                            "Situation"
                        ]
                    },
                    {
                        "type" : "th",
                        "data" : [
                            "What the owner sees"
                        ]
                    },
                    {
                        "type" : "th",
                        "data" : [
                            "What the cat is actually thinking"
                        ]
                    }
                ]
            },
            {
                "type" : "tr",
                "data" : [
                    {
                        "type" : "td",
                        "data" : [
                            "Morning"
                        ]
                    },
                    {
                        "type" : "td",
                        "data" : [
                            {
                                "type" : "mark",
                                "data" : [
                                    "The cat"
                                ]
                            },
                            " is sitting on your chest, staring into your eyes"
                        ]
                    },
                    {
                        "type" : "td",
                        "data" : [
                            "\"Pulse check. Alive? So the empty bowl isn't just a coincidence.\""
                        ]
                    }
                ]
            },
            {
                "type" : "tr",
                "data" : [
                    {
                        "type" : "td",
                        "data" : [
                            "Night"
                        ]
                    },
                    {
                        "type" : "td",
                        "data" : [
                            {
                                "type" : "mark",
                                "data" : [
                                    "The cat"
                                ]
                            },
                            " is racing around the apartment"
                        ]
                    },
                    {
                        "type" : "td",
                        "data" : [
                            "\"Hour of hunting invisible demons. ",
                            {
                                "type" : "br"
                            },
                            {
                                "type" : "br"
                            },
                            {
                                "type" : "b",
                                "data" : [
                                    "The owner"
                                ]
                            },
                            " must be thrilled.\""
                        ]
                    }
                ]
            },
            {
                "type" : "tr",
                "data" : [
                    {
                        "type" : "td",
                        "data" : [
                            "Work"
                        ]
                    },
                    {
                        "type" : "td",
                        "data" : [
                            {
                                "type" : "mark",
                                "data" : [
                                    "The cat"
                                ]
                            },
                            " lay down on the laptop"
                        ]
                    },
                    {
                        "type" : "td",
                        "data" : [
                            "\"Warm. ",
                            {
                                "type" : "i",
                                "data" : [
                                    "Perfect"
                                ]
                            },
                            ". And those boring numbers won't keep me from sleeping anymore.\""
                        ]
                    }
                ]
            }
        ]
    }
]
```

## License

[MIT](https://opensource.org/licenses/MIT)
