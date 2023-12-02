class PageNumberer {
  frameMatrix: { x: number, y: number, frameNode: FrameNode }[] = []
  layersToNumber: { layer: TextNode, number: number }[] = []

  constructor() { 
    this.buildFrameMatrix()
  }

  public buildFrameMatrix() {
    const selectedNodes = figma.currentPage.selection
    for (var node of selectedNodes) {
      if (node.type === 'FRAME' && node.visible && node.children.length > 0) {
        this.frameMatrix.push({ y: node.y, x: node.x, frameNode: node })
      }
    }
    this.frameMatrix.sort((a, b) => {
      if (a.y === b.y) {
        return a.x - b.x
      } else {
        return a.y - b.y
      }
    })
  }

  public updatePageNumbersAndFinish() {
    var pageNumber = 1
    var fontsToLoad: FontName[] = []
    for (var frame of this.frameMatrix) {
      var pageNumberLayers:TextNode[] = []
      //@ts-ignore - we're appropriately checking for the type of node
      pageNumberLayers = frame.frameNode.findAll(n => n.name === "page number" && n.type === "TEXT")
      if (pageNumberLayers.length > 0) {
        for (var layer of pageNumberLayers) {
          this.layersToNumber.push({ layer: layer, number: pageNumber })
          this.checkForFontsToLoad(layer, fontsToLoad)
        }
      }
      //increment even if the frame doesn't have a page number layer
      pageNumber++
    }
    // get an array of loadFontAsync() promises, one for each entry in foundFonts[]
    const fontPromises = fontsToLoad.map(f => figma.loadFontAsync(f));
    // text is set only after all fonts are loaded
    Promise.all(fontPromises).then(() => {
        this.layersToNumber.map(l => this.setTextOfNode(l.layer, l.number.toString()))
        figma.closePlugin();
    })
  }

  checkForFontsToLoad = (layer: TextNode, fontsToLoad: FontName[]) => {
    if (layer.hasMissingFont) {
      throw  "One or more fonts is missing.";
    }
    for (let i = 0; i < layer.characters.length; i++) {
      const fontName = layer.getRangeFontName(i, i + 1) as FontName;
      if (fontsToLoad.find(f => f.family === fontName.family) === undefined) {
        fontsToLoad.push(fontName);
      }
    }
    return fontsToLoad;
  }

  setTextOfNode = (textNode: TextNode, text: string) => {
    textNode.characters = text;
    return textNode;
  }
}    

figma.skipInvisibleInstanceChildren = true
const pageNumberer = new PageNumberer()
pageNumberer.updatePageNumbersAndFinish()
