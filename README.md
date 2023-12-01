After loading into Figma, run:
`npm install`
`npm run build`

Each selected frame will be given a page number, starting at 1. Any text layers in a given frame with the exact name "page number" will have the containing text replaced with the page number for that frame. If a selected frame doesn't have a layer with that name, no change will be made...but the page number will still increment.

Frames are numbered left to right, starting from the top; the top left frame will be page 1, and the last page will be the bottom, right-most frame.

We made this for our own purposes but are happy to hear feedback and feature requests!