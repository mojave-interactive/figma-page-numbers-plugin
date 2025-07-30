// All code from the <script> block in the old ui.html
const styleCheckbox = (checkboxEl) => {
    if (checkboxEl.checked) {
        checkboxEl.parentElement.classList.add('checked');
    } else {
        checkboxEl.parentElement.classList.remove('checked');
    }
}

// Default settings constants
const DEFAULT_SETTINGS = {
    ignoreGroups: true,
    leadingZeros: 0,
    numberNodes: true,
    optionalPrefix: '',
    rememberSettings: true,
    textLayerName: 'page number'
};

// Simple function to get current settings from DOM
function getCurrentSettings() {
    const selectElement = document.querySelector('.select');
    const leadingZerosValue = selectElement?.getAttribute('data-selected');
    
    return {
        ignoreGroups: document.querySelector('input[name="ignoreGroups"]')?.checked ?? DEFAULT_SETTINGS.ignoreGroups,
        leadingZeros: leadingZerosValue ? Number(leadingZerosValue) : DEFAULT_SETTINGS.leadingZeros,
        numberNodes: document.querySelector('input[name="numberNodes"]')?.checked ?? DEFAULT_SETTINGS.numberNodes,
        optionalPrefix: document.querySelector('input[name="optionalPrefix"]')?.value ?? DEFAULT_SETTINGS.optionalPrefix,
        rememberSettings: document.querySelector('input[name="rememberSettings"]')?.checked ?? DEFAULT_SETTINGS.rememberSettings,
        textLayerName: document.querySelector('input[name="textLayerName"]')?.value ?? DEFAULT_SETTINGS.textLayerName
    };
}

// Simple function to send preview with current settings
function sendPreview() {
    const settings = getCurrentSettings();
    parent.postMessage({
        pluginMessage: {
            previewOnly: true,
            ...settings
        }
    }, '*');
}

// Simple function to send run with current settings
function sendRun() {
    const settings = getCurrentSettings();
    parent.postMessage({
        pluginMessage: {
            ...settings
        }
    }, '*');
}

// Function to update DOM from settings (used when loading saved settings)
function updateDOMFromSettings(settings) {
    if (!settings) {
        return;
    }
    
    // Only update DOM elements that have corresponding values in settings
    // Don't override with defaults to preserve saved values
    
    // Update leading zeros dropdown
    if (settings.leadingZeros !== undefined) {
        const selectedLeadingZeros = document.querySelector(`[data-select-value="${settings.leadingZeros}"]`)?.innerText;
        if (selectedLeadingZeros) {
            document.querySelector('.select')?.setAttribute('data-selected', settings.leadingZeros);
            const selectSpan = document.querySelector('.select span');
            if (selectSpan) selectSpan.innerText = selectedLeadingZeros;
        }
    }
    
    // Update text inputs
    if (settings.textLayerName !== undefined) {
        const textLayerInput = document.querySelector('input[name="textLayerName"]');
        if (textLayerInput) textLayerInput.value = settings.textLayerName;
    }
    
    if (settings.optionalPrefix !== undefined) {
        const prefixInput = document.querySelector('input[name="optionalPrefix"]');
        if (prefixInput) prefixInput.value = settings.optionalPrefix;
    }
    
    // Update checkboxes - only if they exist in settings
    if (settings.numberNodes !== undefined) {
        const element = document.querySelector('input[name="numberNodes"]');
        if (element) {
            element.checked = settings.numberNodes;
            styleCheckbox(element);
        }
    }
    
    if (settings.ignoreGroups !== undefined) {
        const element = document.querySelector('input[name="ignoreGroups"]');
        if (element) {
            element.checked = settings.ignoreGroups;
            styleCheckbox(element);
        }
    }
    
    if (settings.rememberSettings !== undefined) {
        const element = document.querySelector('input[name="rememberSettings"]');
        if (element) {
            element.checked = settings.rememberSettings;
            styleCheckbox(element);
        }
    }
    
    // Check if advanced options should be expanded based on non-default values
    checkAndExpandAdvancedOptions(settings);
}

// Check if any advanced settings have non-default values and expand if needed
function checkAndExpandAdvancedOptions(settings) {
    // Check if any advanced option has a non-default value
    const hasNonDefaultValues = (
        (settings.textLayerName !== undefined && settings.textLayerName !== DEFAULT_SETTINGS.textLayerName) ||
        (settings.numberNodes !== undefined && settings.numberNodes !== DEFAULT_SETTINGS.numberNodes) ||
        (settings.ignoreGroups !== undefined && settings.ignoreGroups !== DEFAULT_SETTINGS.ignoreGroups)
    );
    
    if (hasNonDefaultValues) {
        expandAdvancedOptions();
    }
}

// Function to expand advanced options
function expandAdvancedOptions() {
    const advancedOptionsWrapper = document.querySelector('.advanced-options-wrapper');
    const advancedOptions = document.querySelector('.advanced-options');
    const plusIcon = advancedOptions?.querySelector('[data-id="plus-icon"]');
    const minusIcon = advancedOptions?.querySelector('[data-id="minus-icon"]');
    
    if (advancedOptionsWrapper && plusIcon && minusIcon) {
        advancedOptionsWrapper.classList.remove('hidden');
        advancedOptionsWrapper.setAttribute('data-value', 1);
        plusIcon.classList.add('hidden');
        minusIcon.classList.remove('hidden');
    }
}

function getPageSummary(data) {
  let msg = `We count ${data.targetedCount ?? 0} pages.`;
  if ((data.missingTextLayerCount ?? 0) > 0) {
    msg += ` ${data.missingTextLayerCount} of them don't have a layer called '${data.textLayerName}', so they'll increment the page count, but won't be numbered.`;
  }
  return msg;
}

function getIgnoredNodesSummary(data, editorType) {
  const ignoredNodes = data.ignoredCount ?? 0;
  if (ignoredNodes > 0) {
    // Only show messages in design editor where the ignore option is visible
    if (editorType !== 'slides') {
      const ignoredGroups = data.ignoredTypeCounts?.GROUP ?? 0;
      const otherIgnoredNodes = ignoredNodes - ignoredGroups;
      
      const messages = [];
      
      if (ignoredGroups > 0) {
        messages.push(`Ignoring ${ignoredGroups} unframed group${ignoredGroups === 1 ? '' : 's'}. You can include unframed groups in Advanced Options.`);
      }
      
      if (otherIgnoredNodes > 0) {
        messages.push(`Ignoring ${otherIgnoredNodes} layer${otherIgnoredNodes === 1 ? '' : 's'} that aren't groups or frames. Please select frames or groups.`);
      }
      
      return messages.join(' ');
    }
  }
  return null;
}

function getRenameSummary(data) {
  if (data.numberSelectedNodes) {
    return 'Selected nodes will be renamed.';
  }
  return null;
}

function renderSummary(data, editorType) {
  const summaryInfo = document.getElementById('summary-info');
  if (!summaryInfo) return;

  // Determine the appropriate label based on selection type
  let nodeTypeLabel = 'NODES';
  const typeCounts = data.selectedTypeCounts;
  
  if (editorType === 'slides') {
    // For slides editor, check if all selected are slides
    if (typeCounts.SLIDE && Object.keys(typeCounts).length === 1) {
      nodeTypeLabel = 'SLIDES';
    }
  } else {
    // For design editor, check if all selected are frames
    if (typeCounts.FRAME && Object.keys(typeCounts).length === 1) {
      nodeTypeLabel = 'FRAMES';
    }
  }

  let html = `<div class="summary-title">${data.targetedCount} ${nodeTypeLabel}`;
  if (data.ignoredTypeCounts?.GROUP) {
    html += `, ${data.ignoredTypeCounts.GROUP} GROUP${data.ignoredTypeCounts.GROUP === 1 ? '' : 'S'}`;
  }
  html += ' SELECTED</div>';

  const bullets = [
    getPageSummary(data),
    getIgnoredNodesSummary(data, editorType),
    getRenameSummary(data)
  ].filter(Boolean);

  if (bullets.length > 0) {
    html += '<ul class="summary-bullets">' + bullets.map(b => `<li>${b}</li>`).join('') + '</ul>';
  }

  summaryInfo.innerHTML = html;
}

window.onload = function () {
    let hasLoadedInitialSettings = false;
    
    // Handle messages from plugin
    onmessage = (event) => {
        if (event.data.pluginMessage && event.data.pluginMessage.type === 'selection-info') {
            const data = event.data.pluginMessage.data;
            const settings = event.data.pluginMessage.settings;
            const editorType = event.data.pluginMessage.editorType;
            
            // Only update UI with settings on first load, not on selection changes
            if (settings && !hasLoadedInitialSettings) {
                updateDOMFromSettings(settings);
                hasLoadedInitialSettings = true;
            }
            
            // Always render summary info (this should update with selection changes)
            renderSummary(data, editorType);
            
            // Update advanced option visibility based on editorType
            if (editorType === 'slides') {
                document.querySelectorAll('.slides-only').forEach(el => {
                    // Use flex for checkbox-wrapper, block for others
                    el.style.display = el.classList.contains('checkbox-wrapper') ? 'flex' : 'block';
                });
                document.querySelectorAll('.design-only').forEach(el => el.style.display = 'none');
            } else {
                document.querySelectorAll('.design-only').forEach(el => {
                    // Use flex for checkbox-wrapper, block for others
                    el.style.display = el.classList.contains('checkbox-wrapper') ? 'flex' : 'block';
                });
                document.querySelectorAll('.slides-only').forEach(el => el.style.display = 'none');
            }
            
        } else if (event.data.pluginMessage && !event.data.pluginMessage.type) {
            // Handle saved settings message (only on initial load)
            if (!hasLoadedInitialSettings) {
                const settings = event.data.pluginMessage;
                updateDOMFromSettings(settings);
                hasLoadedInitialSettings = true;
            }
        }
    };
    
    // Set up event listeners
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb) => {
        cb.addEventListener('click', (e) => {
            styleCheckbox(e.target);
        }, false);
    });
    
    // Add specific listener for ignore groups checkbox to trigger refresh
    const ignoreGroupsCheckbox = document.querySelector('input[name="ignoreGroups"]');
    if (ignoreGroupsCheckbox) {
        ignoreGroupsCheckbox.addEventListener('change', () => {
            sendPreview();
        });
    }
    
    // Add debounced listener for text layer name input to trigger refresh
    const textLayerNameInput = document.querySelector('input[name="textLayerName"]');
    if (textLayerNameInput) {
        let debounceTimeout;
        
        textLayerNameInput.addEventListener('input', () => {
            // Clear previous timeout
            clearTimeout(debounceTimeout);
            
            // Set new timeout for 2 seconds
            debounceTimeout = setTimeout(() => {
                sendPreview();
            }, 1000);
        });
    }
    
    // Set up select dropdown
    const select = document.querySelector('.select');
    const svgSelect = select.querySelector('svg');
    const selectOptionsWrapper = document.querySelector('.select-options-wrapper');
    
    const close = () => {
        selectOptionsWrapper.classList.add('hidden');
        selectOptionsWrapper.setAttribute('data-value', 0);
        svgSelect.classList.remove('opened');
    };
    
    select.addEventListener('click', (e) => {
        const opened = Number(selectOptionsWrapper.getAttribute('data-value'));
        if (opened) {
            close();
        } else {
            selectOptionsWrapper.classList.remove('hidden');
            selectOptionsWrapper.setAttribute('data-value', 1);
            svgSelect.classList.add('opened');
        }
    }, false);
    
    Array.from(selectOptionsWrapper.children).forEach((el) => {
        el.addEventListener('click', (e) => {
            const value = Number(el.getAttribute('data-select-value'));
            select.setAttribute('data-selected', value);
            select.querySelector('span').innerText = el.innerText;
            close();
            
            // Send preview with updated settings
            sendPreview();
        }, false);
    });
    
    // Set up advanced options toggle
    const advancedOptions = document.querySelector('.advanced-options');
    const advancedOptionsWrapper = document.querySelector('.advanced-options-wrapper');
    const plusIcon = advancedOptions.querySelector('[data-id="plus-icon"]');
    const minusIcon = advancedOptions.querySelector('[data-id="minus-icon"]');
    
    advancedOptions.addEventListener('click', () => {
        const opened = Number(advancedOptionsWrapper.getAttribute('data-value'));
        if (opened) {
            advancedOptionsWrapper.classList.add('hidden');
            advancedOptionsWrapper.setAttribute('data-value', 0);
            plusIcon.classList.remove('hidden');
            minusIcon.classList.add('hidden');
        } else {
            advancedOptionsWrapper.classList.remove('hidden');
            advancedOptionsWrapper.setAttribute('data-value', 1);
            plusIcon.classList.add('hidden');
            minusIcon.classList.remove('hidden');
        }
    }, false);
    
    // Set up instructions toggle
    const instructionOptions = document.querySelector('.instruction-options');
    const svgInstructions = instructionOptions.querySelector('svg');
    const instructionOptionsWrapper = document.querySelector('.instruction-options-wrapper');
    
    instructionOptions.addEventListener('click', (e) => {
        const opened = Number(instructionOptionsWrapper.getAttribute('data-value'));
        if (opened) {
            instructionOptionsWrapper.classList.add('hidden');
            instructionOptionsWrapper.setAttribute('data-value', 0);
            svgInstructions.classList.remove('opened');
        } else {
            instructionOptionsWrapper.classList.remove('hidden');
            instructionOptionsWrapper.setAttribute('data-value', 1);
            svgInstructions.classList.add('opened');
        }
    }, false);
    
    // Set up run button - now much simpler and no infinite loops!
    document.getElementById('runPlugin').onclick = function () {
        sendRun();
    };
}; 