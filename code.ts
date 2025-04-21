/*
 * Page Numbers Figma Plugin
 *
 * Copyright (c) 2023 Mojave Interactive LLC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * For a copy of the GNU General Public License version 3.0,
 * please visit: https://www.gnu.org/licenses/gpl-3.0.html
 */
class PageNumberer {
  selectedNodeMatrix: { x: number, y?: number, selectedNode: FrameNode | GroupNode | ComponentNode | SlideNode }[] = []
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

    if (figma.editorType === 'figma') {
      this.buildFrameMatrix()
    } else if (figma.editorType === 'slides'){
      this.buildFrameMatrixSlides()
    }
  }

  private isNodeWithChildren(node: SceneNode): node is FrameNode | GroupNode | ComponentNode {
    return 'children' in node
  }

  public buildFrameMatrix() {
    const selectedNodes = figma.currentPage.selection
    let currentIndex = 0

    for (const node of selectedNodes) {
      if (this.isNodeWithChildren(node) && node.visible && typeof node.children !== 'undefined' && node.children.length > 0) {
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
        return a.y! - b.y!
      }
    })
  }

  public updatePageNumbersAndFinish() {
    let pageNumber = 1
    const fontsToLoad: FontName[] = []
    for (const selection of this.selectedNodeMatrix) {
      selection.selectedNode.parent?.insertChild(this.lowestIndex, selection.selectedNode as SceneNode)
      if (this.numberSelectedNodes) {
        if (selection.selectedNode.name.match(/^\d*$/)){
          selection.selectedNode.name = pageNumber.toString()
        } else {
          selection.selectedNode.name = selection.selectedNode.name.replace(/^\d* ?-? ?/, pageNumber.toString() +  ' - ')
        }
      }
      let pageNumberLayers:TextNode[] = []
      pageNumberLayers = selection.selectedNode.findAll(n => n.name === this.textLayerName && n.type === "TEXT") as TextNode[]
      if (pageNumberLayers.length > 0) {
        for (const layer of pageNumberLayers) {
          this.layersToNumber.push({ layer: layer, number: pageNumber })
          this.checkForFontsToLoad(layer, fontsToLoad)
        }
      }
      //increment even if the frame doesn't have a layer with the name in textLayerName
      pageNumber++
    }
    // get an array of loadFontAsync() promises, one for each entry in foundFonts[]
    const fontPromises = fontsToLoad.map(f => figma.loadFontAsync(f))
    // text is set only after all fonts are loaded
    Promise.all(fontPromises).then(() => {
        this.layersToNumber.map(l => this.setTextOfNode(l.layer, this.optionalPrefix, l.number.toString()))
        figma.closePlugin()
    })
  }

  public buildFrameMatrixSlides() {
    const selectedNodes = figma.currentPage.selection.filter(n =>
      n.type === 'SLIDE' && n.visible
    ) as SlideNode[]
    
    for (let i = 0; i < selectedNodes.length; i++) {
      const node = selectedNodes[i];
      this.selectedNodeMatrix.push({ x: i, selectedNode: node })
    }
  }

  public updatePageNumbersAndFinishSlides() {
    let pageNumber = 1
    const fontsToLoad: FontName[] = []

    for (const selection of this.selectedNodeMatrix) {
      let pageNumberLayers:TextNode[] = []
      pageNumberLayers = selection.selectedNode.findAll(n => n.name === this.textLayerName && n.type === "TEXT") as TextNode[]
      
      if (pageNumberLayers.length > 0) {
        for (const layer of pageNumberLayers) {
          this.layersToNumber.push({ layer: layer, number: pageNumber })
          this.checkForFontsToLoad(layer, fontsToLoad)
        }
      }
      pageNumber++
    }

    const fontPromises = fontsToLoad.map(f => figma.loadFontAsync(f))
    Promise.all(fontPromises).then(() => {
        this.layersToNumber.map(l => this.setTextOfNode(l.layer, this.optionalPrefix, l.number.toString()))
        figma.closePlugin()
    })
  }

  checkForFontsToLoad = (layer: TextNode, fontsToLoad: FontName[]) => {
    if (layer.hasMissingFont) {
      throw  "One or more fonts is missing."
    }
    for (let i = 0; i < layer.characters.length; i++) {
      const fontName = layer.getRangeFontName(i, i + 1) as FontName
      if (fontsToLoad.find(f => f.family === fontName.family) === undefined) {
        fontsToLoad.push(fontName)
      }
    }
    return fontsToLoad
  }

  setTextOfNode = (textNode: TextNode, prefix: string, text: string) => {
    if (this.leadingZeros === 0) {
      textNode.characters = prefix + text
    } else {
      textNode.characters = prefix + this.padStart(text, this.leadingZeros + 1)
    }

    if (figma.editorType === 'slides') {
      textNode.textAutoResize = "WIDTH_AND_HEIGHT"
    }
    return textNode
  }

  padStart = (text: string, targetLength: number) => {
    if (text.length >= targetLength) {
      return text
    }
    const padding = "0".repeat(targetLength - text.length)
    return padding + text
  }
}    

figma.showUI(__html__, { themeColors: true, height: 508, width: 288 })
figma.clientStorage.getAsync('pageNumbererSettings').then((settings) => {
  if (settings) {
    figma.ui.postMessage(settings)
  }
})
figma.ui.onmessage = (message) => {
    const pageNumberer = new PageNumberer(
      message.ignoreNonFrameNodes, 
      message.leadingZeros, 
      message.numberNodes, 
      message.optionalPrefix,
      message.rememberSettings,
      message.textLayerName
    )

    if (figma.editorType === 'figma') {
      pageNumberer.updatePageNumbersAndFinish();
    } else if (figma.editorType === 'slides'){
      pageNumberer.updatePageNumbersAndFinishSlides();
    }
}
