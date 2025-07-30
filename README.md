# Page Numbers: a simple pagination plugin for Figma, made by Mojave Interactive

This plugin automatically numbers your pages or slides in Figma. It works with both **Figma Design files** and **Figma Slides files**.

## Quick Start (Slides Files)

For Figma Slides files, the process is simple:

1. **Design your page numbers** however you want, using placeholder numbers
2. **Name your text layers** `page number` (or change this in Advanced Options)
3. **Select all your slides** (including slides without page numbers)
4. **Run the plugin**

That's it! The plugin will automatically number your slides in the order they appear in your presentation.

## Design Files

For Figma Design files, you have more control over the layout:

1. **Design your page numbers** however you want, using placeholder numbers
2. **Name your text layers** `page number` (or change this in Advanced Options)
3. **Frame each page** (or use Advanced Options to number non-frame layers)
4. **Arrange pages in rows**, left to right, top to bottom
5. **Select all the page frames**
6. **Run the plugin**

## Plugin Options

The plugin offers several customization options:

### Basic Options
- **Leading zeros** (e.g. `01` or `001`; none by default)
- **Optional prefix** (e.g. `p. 1` or `Page 1`)
- **Remember my choices** - saves your settings for next time

### Advanced Options
- **Name of text layers** - if you used a different name than `page number`
- **Prepend page number to frame/layer name** - renames your frames/layers (e.g., `4 - Team intro slide`)
- **Ignore non-frame/slide nodes** - controls which types of layers get numbered

## How It Works

- **Slides files**: Numbers slides in their presentation order
- **Design files**: Numbers frames based on their position (left to right, top to bottom)
- **Text replacement**: Replaces placeholder numbers in your `page number` layers
- **Multiple numbers per page**: If you have multiple `page number` layers on one page, they all get the same number
- **Missing numbers**: Pages without `page number` layers are still counted in the sequence

## Tips

- **Start with 1**: If you want to skip a cover page, don't select it when running the plugin
- **Undo**: If something goes wrong, use undo (Ctrl+Z or Cmd+Z)
- **Position matters**: In Design files, frames in the same row need the same Y position for correct ordering
- **Full-bleed images**: You can have slides/pages without page numbers - they're still counted in the sequence

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
