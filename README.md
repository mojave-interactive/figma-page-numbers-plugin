# Page Numbers: a simple pagination plugin for Figma, made by Mojave Interactive

## To use:
- Make sure each page (or slide or whatever you're numbering) is framed.
- Arrange your page frames either A.) in a single vertical column, with the first page at the top or B.) in rows, with the first row at the top, and the first slide of each row at the left.
- Design the page numbers to your heart's content using placeholder digits. Make sure your design looks good with single digit numbers as well as two- and (if needed) three- digit numbers.
- Anywhere your design includes a page number, make sure the *number only* is in a text layer with the exact name `page number`.
- Select all of the page frames and run the plugin. The characters inside the `page number` text layers will be replaced with the page number of the containing frame.


## Things to know:
- If a frame is selected, but doesn't have any text layers named `page number`, the page counter will still increment. For example, you might not want to show a page number on a page that is a full bleed image, but you still want an accurate page number on subsequent pages.
- If there are multiple text layers named `page number` in one of the selected frames, they will all be populated with the same number.
- Numbering starts with 1, and currently had no formatting options. If you wish to start numbering after a cover page, do not select the cover page frame when running the plugin.
- Frames in a row need to have exactly the same y value (the same vertical position), otherwise the page number order won't be what you want.

## For plugin developers:
Requires Node 14.7 or greater. If you're having trouble with the default Node version on your system, look into nvm for managing Node versions.

After loading the plugin into Figma, run:  
`npm install`  
`npm run build`

## Have something to say or add?
Feedback and feature requests are welcomed! If you're thinking about submitting a PR, let's talk.