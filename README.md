# Page Numbers: a simple pagination plugin for Figma, made by Mojave Interactive

## Basic instructions
- Design your page numbers however you want, using placeholder numbers. 
- Make sure every layer containing a page number is named `page number`.
- Every page has to be framed.
- Arrange the pages in rows, left to right.
- Select all the framed pages.
- Run the plugin.

## Detailed instructions:
- Make sure each page (or slide or whatever you're numbering) is framed. If that is not possible (for instance, if you are paginating Figma Components) see the __Ignore non-frame nodes__ option explained below.
- Arrange your page frames in one or more rows, with the first row at the top, and the first slide of each row at the left. This matches the way Figma orders frames in a PDF export or prototype presentation.
- Design the page numbers *to your heart's content* using placeholder digits. This plugin preserves the styles you define. Make sure your design looks good with single digit numbers as well as two- and three- digit numbers, as appropriate.
- Anywhere your design includes a page number, make sure the number and prefix (if you're using one) are in a text layer with the exact name `page number`. Don't use that layer name on any text layers you don't want to be repopulated with a page number! If you've already diligently named the text layers in question, but you used a different name, see the __Name of text layers__ option explained below.
- Select all of the page frames and run the plugin.
- The following options are presented in the plugin UI:
    - __Leading zeros__ (e.g. `01` or `001`; there are none by default)
    - __Optional prefix__ (e.g. `p. 1` or `Page 1`)
    - __Prepend page number to frame name or layer name__. Careful; this will rename your selected frames or layers! For example, a frame called `Team intro slide` could be renamed `4 - Team intro slide`. If the frame or layer name is just a number, the name will be replaced with the new page number.
    - __Name of text layers__. Let's say you already named all of your page number text layers `pagination`; the plugin can look for that instead.
    - __Ignore non-frame nodes__. Typically, we recommend that each page or slide be framed. However, if you are creating slide components (template slides), those will not be framed. Uncheck this option to number non-frame layers.
    - __Remember my choices__. If you want to reset this choice and go back to the defaults, uncheck it and run the plugin once.
- Click the __Run!__ button.
- The characters inside the `page number` text layers will be replaced with the page number of the containing frame. The selected frames or layers will be reordered in the layer panel accordingly.

## Things to know:
- If a page is selected, but doesn't contain any text layers of the specified name (e.g. `page number`), the page counter will still increment. For example, you might not want to show a page number on a page that is a full-bleed image, but you still want an accurate page number on subsequent pages.
- You can have as many page numbers on a page as you like. If there are multiple text layers of the specified name in one of the selected frames, they will all be populated with the same number
- Numbering starts with 1. If you wish to start numbering after a cover page, do not select the cover page frame when running the plugin.
- Frames in a row need to have exactly the same y value (the same vertical position), otherwise the page number order won't be what you want.
- If anything goes wrong, use undo (ctrl-z or cmd-z)!

## For plugin developers:

### Prerequisites
- Node.js 14.7 or greater
- npm

### Development Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development Workflow
- **Build for production**: `npm run build`
  - Compiles the TypeScript plugin code (`code.ts` → `code.js`)
  - Builds and inlines the UI (`ui/` → `ui.html`)
- **Watch mode for development**: `npm run watch`
  - Watches both plugin code and UI for changes
  - Rebuilds automatically when files change
- **Clean build artifacts**: `npm run clean`
  - Removes `ui/dist/`, `node_modules/`, `ui.html`, and `assets/`

### Project Structure
```
figma-page-numbers-plugin/
├── code.ts              # Main plugin code
├── ui.html              # Built UI (generated)
├── ui/                  # UI source files
│   ├── index.html       # UI template
│   ├── main.js          # UI JavaScript
│   ├── style.css        # UI styles
│   ├── src/             # Additional UI source files
│   └── vite.config.js   # Vite configuration
├── manifest.json        # Plugin manifest
└── package.json         # Dependencies and scripts
```

### Publishing
1. Run `npm run build` to generate production files
2. Verify `ui.html` is generated and contains inlined CSS/JS
3. Test the plugin in Figma
4. Package and publish through Figma's plugin system

## Have something to say or add?
Feedback and feature requests are welcomed! If you're thinking about submitting a PR, let's talk.
