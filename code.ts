class PageNumberer {
  selectedNodeMatrix: { x: number, y: number, selectedNode: BaseNode }[] = []
  ignoreNonFrameNodes: boolean = true
  layersToNumber: { layer: TextNode, number: number }[] = []
  leadingZeros: number = 0
  numberSelectedNodes: boolean = true

  constructor(ignoreNonFrameNodes: boolean, leadingZeros: number, numberNodes: boolean) {
    this.ignoreNonFrameNodes = ignoreNonFrameNodes
    this.leadingZeros = leadingZeros
    this.numberSelectedNodes = numberNodes
    this.buildFrameMatrix()
  }

  public buildFrameMatrix() {
    const selectedNodes = figma.currentPage.selection
    for (var node of selectedNodes) {
      //debugger
      // @ts-expect-error
      if (node.visible && typeof node.children !== 'undefined' && node.children.length > 0) {
        if (this.ignoreNonFrameNodes && node.type !== 'FRAME') {
          continue
        }
        this.selectedNodeMatrix.push({ y: node.y, x: node.x, selectedNode: node })
      }
    }
    this.selectedNodeMatrix.sort((a, b) => {
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
    for (var selection of this.selectedNodeMatrix) {
      if (this.numberSelectedNodes) {
        if (selection.selectedNode.name.match(/^\d*$/)){
          selection.selectedNode.name = pageNumber.toString()
        } else {
          selection.selectedNode.name = selection.selectedNode.name.replace(/^\d* ?-? ?/, pageNumber.toString() +  ' - ')
        }
      }
      var pageNumberLayers:TextNode[] = []
      //@ts-ignore - we're appropriately checking for the type of node
      pageNumberLayers = selection.selectedNode.findAll(n => n.name === "page number" && n.type === "TEXT")
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
    if (this.leadingZeros === 0) {
      textNode.characters = text
    } else {
      textNode.characters = this.padStart(text, this.leadingZeros)
    }
    return textNode;
  }

  padStart = (text: string, targetLength: number) => {
    if (text.length >= targetLength) {
      return text;
    }
    const padding = "0".repeat(targetLength - text.length);
    return padding + text;
  }
}    

figma.showUI(__html__, { themeColors: true, width: 600 })
figma.ui.onmessage = (message) => {
  if(typeof message.leadingZeros === "string") {
    const pageNumberer = new PageNumberer(message.ignoreNonFrameNodes, parseInt(message.leadingZeros), message.numberNodes)
    pageNumberer.updatePageNumbersAndFinish()
  }
  else
  {
    figma.closePlugin()
  }
}
