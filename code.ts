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
  ignoreGroups: boolean
  layersToNumber: { layer: TextNode, number: number }[] = []
  leadingZeros: number
  lowestIndex: number = -1
  numberSelectedNodes: boolean
  optionalPrefix: string
  textLayerName: string
  ignoredNodes: SceneNode[] = []
  nodesMissingTextLayer: (FrameNode | GroupNode | ComponentNode | SlideNode)[] = []

  constructor(
      ignoreGroups: boolean = true,
      leadingZeros: number = 0, 
      numberNodes: boolean = true, 
      optionalPrefix: string = "",
      rememberSettings: boolean = false,
      textLayerName: string = "page number"
    ) {
    this.ignoreGroups = ignoreGroups
    this.leadingZeros = leadingZeros
    this.numberSelectedNodes = numberNodes
    this.optionalPrefix = optionalPrefix
    this.textLayerName = textLayerName
    if (rememberSettings) {
      figma.clientStorage.setAsync('pageNumbererSettings', {
        ignoreGroups: ignoreGroups,
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
    this.findNodesMissingTextLayer();
  }

  private isNodeWithChildren(node: SceneNode): node is FrameNode | GroupNode | ComponentNode | SlideNode {
    return 'children' in node
  }

  public buildFrameMatrix() {
    const selectedNodes = figma.currentPage.selection
    let currentIndex = 0

    for (const node of selectedNodes) {
      if (this.isNodeWithChildren(node) && node.visible && typeof node.children !== 'undefined' && node.children.length > 0) {
        // Only support frames and groups in design editor
        if (node.type !== 'FRAME' && node.type !== 'GROUP') {
          this.ignoredNodes.push(node);
          continue
        }
        
        // If ignoring groups and this is a group, ignore it
        if (this.ignoreGroups && node.type === 'GROUP') {
          this.ignoredNodes.push(node);
          continue
        }

        currentIndex = node.parent?.children.findIndex(n => n.id === node.id) || 0
        if (this.lowestIndex === -1 || currentIndex < this.lowestIndex) {
          this.lowestIndex = currentIndex
        }
        this.selectedNodeMatrix.push({ y: node.y, x: node.x, selectedNode: node })
      } else {
        this.ignoredNodes.push(node);
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

  private findNodesMissingTextLayer() {
    // Only check nodes that are targeted for numbering
    for (const entry of this.selectedNodeMatrix) {
      const node = entry.selectedNode;
      const pageNumberLayers = node.findAll(n => n.name === this.textLayerName && n.type === "TEXT") as TextNode[];
      if (pageNumberLayers.length === 0) {
        this.nodesMissingTextLayer.push(node);
      }
    }
  }

  public getSummary() {
    // Count selected nodes by type
    const typeCounts: { [type: string]: number } = {};
    for (const node of figma.currentPage.selection) {
      typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
    }
    // Count ignored nodes by type
    const ignoredTypeCounts: { [type: string]: number } = {};
    for (const node of this.ignoredNodes) {
      ignoredTypeCounts[node.type] = (ignoredTypeCounts[node.type] || 0) + 1;
    }
    // Count nodes missing text layer by type
    const missingTextLayerTypeCounts: { [type: string]: number } = {};
    for (const node of this.nodesMissingTextLayer) {
      missingTextLayerTypeCounts[node.type] = (missingTextLayerTypeCounts[node.type] || 0) + 1;
    }
    return {
      selectedCount: figma.currentPage.selection.length,
      selectedTypeCounts: typeCounts,
      ignoredCount: this.ignoredNodes.length,
      ignoredTypeCounts: ignoredTypeCounts,
      targetedCount: this.selectedNodeMatrix.length,
      missingTextLayerCount: this.nodesMissingTextLayer.length,
      missingTextLayerTypeCounts: missingTextLayerTypeCounts,
      textLayerName: this.textLayerName
    };
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
    const selectedNodes = figma.currentPage.selection
    let currentIndex = 0
    
    for (const node of selectedNodes) {
      if (this.isNodeWithChildren(node) && node.visible && typeof node.children !== 'undefined' && node.children.length > 0) {
        // Only support slides in slides editor
        if (node.type !== 'SLIDE') {
          this.ignoredNodes.push(node);
          continue
        }
        this.selectedNodeMatrix.push({ x: currentIndex, selectedNode: node })
        currentIndex++
      } else {
        this.ignoredNodes.push(node);
      }
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

figma.showUI(__html__, { themeColors: true, height: 525, width: 288 })

// Function to send selection info to UI
function sendSelectionInfo() {
  // Use default settings for preview (or retrieve from storage if needed)
  figma.clientStorage.getAsync('pageNumbererSettings').then((settings) => {
    const opts = settings || {
      ignoreGroups: true,
      leadingZeros: 0,
      numberNodes: true,
      optionalPrefix: '',
      rememberSettings: true,
      textLayerName: 'page number'
    };
    const pageNumberer = new PageNumberer(
      opts.ignoreGroups,
      opts.leadingZeros,
      opts.numberNodes,
      opts.optionalPrefix,
      opts.rememberSettings,
      opts.textLayerName
    );
    figma.ui.postMessage({ type: 'selection-info', data: pageNumberer.getSummary(), settings: opts, editorType: figma.editorType });
  });
}

// Send selection info on open
sendSelectionInfo();

// Send selection info on selection change
figma.on('selectionchange', sendSelectionInfo);

figma.clientStorage.getAsync('pageNumbererSettings').then((settings) => {
  if (settings) {
    figma.ui.postMessage(settings)
  }
})
figma.ui.onmessage = (message) => {
    // If previewOnly, just send summary for UI update
    if (message.previewOnly) {
      const pageNumberer = new PageNumberer(
        message.ignoreGroups,
        message.leadingZeros, 
        message.numberNodes, 
        message.optionalPrefix,
        message.rememberSettings,
        message.textLayerName
      );
      figma.ui.postMessage({ type: 'selection-info', data: pageNumberer.getSummary(), settings: message, editorType: figma.editorType });
      return;
    }
    // Otherwise, run the plugin as normal
    const pageNumberer = new PageNumberer(
      message.ignoreGroups,
      message.leadingZeros, 
      message.numberNodes, 
      message.optionalPrefix,
      message.rememberSettings,
      message.textLayerName
    );
    if (figma.editorType === 'figma') {
      pageNumberer.updatePageNumbersAndFinish();
    } else if (figma.editorType === 'slides'){
      pageNumberer.updatePageNumbersAndFinishSlides();
    }
}
