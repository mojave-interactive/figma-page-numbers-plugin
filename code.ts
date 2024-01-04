class PageNumberer {
  selectedNodeMatrix: { x: number, y: number, selectedNode: BaseNode }[] = []
  ignoreNonFrameNodes: boolean
  layersToNumber: { layer: TextNode, number: number }[] = []
  leadingZeros: number
  lowestIndex: number = -1
  numberSelectedNodes: boolean
  optionalPrefix: string
  textLayerName: string

  constructor(
      ignoreNonFrameNodes: boolean = true, 
      leadingZeros: number = 0, 
      numberNodes: boolean = true, 
      optionalPrefix: string = "",
      rememberSettings: boolean = false,
      textLayerName: string = "page number"
    ) {
    this.ignoreNonFrameNodes = ignoreNonFrameNodes
    this.leadingZeros = leadingZeros
    this.numberSelectedNodes = numberNodes
    this.optionalPrefix = optionalPrefix
    this.textLayerName = textLayerName
    if (rememberSettings) {
      figma.clientStorage.setAsync('pageNumbererSettings', {
        ignoreNonFrameNodes: ignoreNonFrameNodes,
        leadingZeros: leadingZeros,
        numberNodes: numberNodes,
        optionalPrefix: optionalPrefix,
        textLayerName: textLayerName
      })
    } else {
      figma.clientStorage.deleteAsync('pageNumbererSettings')
    }
    this.buildFrameMatrix()
  }

  public buildFrameMatrix() {
    const selectedNodes = figma.currentPage.selection
    var currentIndex = 0
    for (var node of selectedNodes) {
      // @ts-expect-error
      if (node.visible && typeof node.children !== 'undefined' && node.children.length > 0) {
        if (this.ignoreNonFrameNodes && node.type !== 'FRAME') {
          continue
        }
        currentIndex = node.parent?.children.findIndex(n => n.id === node.id) || 0
        if (this.lowestIndex === -1 || currentIndex < this.lowestIndex) {
          this.lowestIndex = currentIndex
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
      //@ts-expect-error
      selection.selectedNode.parent?.insertChild(this.lowestIndex, selection.selectedNode)
      debugger
      if (this.numberSelectedNodes) {
        if (selection.selectedNode.name.match(/^\d*$/)){
          selection.selectedNode.name = pageNumber.toString()
        } else {
          selection.selectedNode.name = selection.selectedNode.name.replace(/^\d* ?-? ?/, pageNumber.toString() +  ' - ')
        }
      }
      var pageNumberLayers:TextNode[] = []
      //@ts-ignore - we're appropriately checking for the type of node
      pageNumberLayers = selection.selectedNode.findAll(n => n.name === this.textLayerName && n.type === "TEXT")
      if (pageNumberLayers.length > 0) {
        for (var layer of pageNumberLayers) {
          this.layersToNumber.push({ layer: layer, number: pageNumber })
          this.checkForFontsToLoad(layer, fontsToLoad)
        }
      }
      //increment even if the frame doesn't have a layer with the name in textLayerName
      pageNumber++
    }
    console.log(this.lowestIndex)
    // get an array of loadFontAsync() promises, one for each entry in foundFonts[]
    const fontPromises = fontsToLoad.map(f => figma.loadFontAsync(f));
    // text is set only after all fonts are loaded
    Promise.all(fontPromises).then(() => {
        this.layersToNumber.map(l => this.setTextOfNode(l.layer, this.optionalPrefix, l.number.toString()))
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

  setTextOfNode = (textNode: TextNode, prefix: string, text: string) => {
    if (this.leadingZeros === 0) {
      textNode.characters = prefix + text
    } else {
      textNode.characters = prefix + this.padStart(text, this.leadingZeros + 1)
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

figma.showUI(__html__, { themeColors: true, height: 450, width: 700 })
figma.clientStorage.getAsync('pageNumbererSettings').then((settings) => {
  if (settings) {
    figma.ui.postMessage(settings)
  }
})
figma.ui.onmessage = (message) => {
  if(typeof message.leadingZeros === "string") {
    const pageNumberer = new PageNumberer(
      message.ignoreNonFrameNodes, 
      parseInt(message.leadingZeros), 
      message.numberNodes, 
      message.optionalPrefix,
      message.rememberSettings,
      message.textLayerName
    )
    pageNumberer.updatePageNumbersAndFinish()
  }
  else
  {
    figma.closePlugin()
  }
}
