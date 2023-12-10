# Page Numbers: a simple pagination plugin for Figma, made by Mojave Interactive

## tl;dr instructions
- Design your page numbers however you want, using placeholder numbers. 
- Name each text layer containing a page number `page number`.
- Every page has to be framed.
- Select all the framed pages.
- Run the plugin.

## Detailed instructions:
- Make sure each page (or slide or whatever you're numbering) is framed. If that is not possible (for instance, if you are paginating Figma Components) see the __Ignore non-frame nodes__ option explained below.
- Arrange your page frames in one or more rows, with the first row at the top, and the first slide of each row at the left. This matches the way Figma orders frames in a PDF export or prototype presentation.
- Design the page numbers *to your heart's content* using placeholder digits. This plugin preserves the styles you define. Make sure your design looks good with single digit numbers as well as two- and three- digit numbers, as appropriate.
- Anywhere your design includes a page number, make sure the *number only* is in a text layer with the exact name `page number`. Don't use that layer name on any text layers you don't want to be repopulated with a page number! If you've already diligently named the text layers in question, but you used a different name, see the __Name of text layers__ option explained below.
- Select all of the page frames and run the plugin.
- The following options are presented in the plugin UI:
    - __Leading zeros__ (e.g. `01` or `001`; there are none by default)
    - __Optional prefix__ (e.g. `p. 1` or `Page 1`)
    - __Prepend page number to frame name or layer name__. Careful; this will rename your selected frames or layers! For example, a frame called `Team intro slide` could be renamed `4 - Team intro slide`. If the frame or layer name is just a number, the name will be replaced with the new page number.
    - __Name of text layers__. Let's say you already named all of your page number text layers `pagination`; the plugin can look for that instead.
    - __Ignore non-frame nodes__. Typically, we recommend that each page or slide be framed. However, if you are creating slide components (template slides), those will not be framed. Uncheck this option to number unframed items.
    - __Remember my choices__. If you want to reset this choice and go back to the defaults, uncheck it and run the plugin once.
- Click the __Run!__ button.
- The characters inside the `page number` text layers will be replaced with the page number of the containing frame.


## Things to know:
- If a frame is selected, but doesn't have any text layers of the specified name (e.g. `page number`), the page counter will still increment. For example, you might not want to show a page number on a page that is a full bleed image, but you still want an accurate page number on subsequent pages.
- You can have as many page numbers on a page as you like. If there are multiple text layers of the specified name in one of the selected frames, they will all be populated with the same number
- Numbering starts with 1. If you wish to start numbering after a cover page, do not select the cover page frame when running the plugin.
- Frames in a row need to have exactly the same y value (the same vertical position), otherwise the page number order won't be what you want.
- If anything goes wrong, use undo (ctrl-z or cmd-z)!

## For plugin developers:
Requires Node 14.7 or greater. If you're having trouble with the default Node version on your system, look into nvm for managing Node versions.

After loading the plugin into Figma, run:  
`npm install`  
`npm run build`

## Have something to say or add?
Feedback and feature requests are welcomed! If you're thinking about submitting a PR, let's talk.
