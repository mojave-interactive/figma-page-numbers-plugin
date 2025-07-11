// All code from the <script> block in the old ui.html
const styleCheckbox = (checkboxEl) => {
    if (checkboxEl.checked) {
        checkboxEl.parentElement.classList.add('checked');
    } else {
        checkboxEl.parentElement.classList.remove('checked');
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
    const nodeType = editorType === 'slides' ? 'slides' : 'frames';
    return `${ignoredNodes} selected nodes are being ignored because they are not ${nodeType}. You can disable this in advanced settings.`;
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

  let html = `<div class="summary-title">${data.targetedCount} FRAME${data.targetedCount === 1 ? '' : 'S'}`;
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
    onmessage = (event) => {
        if (event.data.pluginMessage && event.data.pluginMessage.type === 'selection-info') {
            const data = event.data.pluginMessage.data;
            const settings = event.data.pluginMessage.settings;
            const editorType = event.data.pluginMessage.editorType;
            
            // Update UI with settings
            if (settings) {
                const selectedLeadingZeros = document.querySelector(
                    `[data-select-value="${settings.leadingZeros}"]`
                ).innerText;
                document
                    .querySelector('.select')
                    .setAttribute('data-selected', settings.leadingZeros);
                document.querySelector('.select span').innerText = selectedLeadingZeros;
                document.querySelector('input[name="textLayerName"]').value =
                    settings.textLayerName;
                document.querySelector('input[name="optionalPrefix"]').value =
                    settings.optionalPrefix;
                const numberNodesElement = document.querySelector('input[name="numberNodes"]');
                const ignoreNonFrameNodesElement = document.querySelector('input[name="ignoreNonFrameNodes"]');
                const ignoreNonSlideNodesElement = document.querySelector('input[name="ignoreNonSlideNodes"]');
                numberNodesElement.checked = settings.numberNodes;
                ignoreNonFrameNodesElement.checked = settings.ignoreNonFrameNodes;
                ignoreNonSlideNodesElement.checked = settings.ignoreNonSlideNodes;
                styleCheckbox(numberNodesElement);
                styleCheckbox(ignoreNonFrameNodesElement);
                styleCheckbox(ignoreNonSlideNodesElement);
            }
            
            // Count each type
            const typeCounts = data.selectedTypeCounts;
            const typeStrings = Object.entries(typeCounts).map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`);
            // Render summary info above the RUN! button
            renderSummary(data, editorType);
            // Update advanced option visibility based on editorType
            if (editorType === 'slides') {
              document.querySelectorAll('.slides-only').forEach(el => el.style.display = '');
              document.querySelectorAll('.design-only').forEach(el => el.style.display = 'none');
            } else {
              document.querySelectorAll('.design-only').forEach(el => el.style.display = '');
              document.querySelectorAll('.slides-only').forEach(el => el.style.display = 'none');
            }
        } else if (event.data.pluginMessage && !event.data.pluginMessage.type) {
            // Handle saved settings message
            const settings = event.data.pluginMessage;
            const selectedLeadingZeros = document.querySelector(
                `[data-select-value="${settings.leadingZeros}"]`
            ).innerText;
            document
                .querySelector('.select')
                .setAttribute('data-selected', settings.leadingZeros);
            document.querySelector('.select span').innerText = selectedLeadingZeros;
            document.querySelector('input[name="textLayerName"]').value =
                settings.textLayerName;
            document.querySelector('input[name="optionalPrefix"]').value =
                settings.optionalPrefix;
            const numberNodesElement = document.querySelector('input[name="numberNodes"]');
            const ignoreNonFrameNodesElement = document.querySelector('input[name="ignoreNonFrameNodes"]');
            const ignoreNonSlideNodesElement = document.querySelector('input[name="ignoreNonSlideNodes"]');
            numberNodesElement.checked = settings.numberNodes;
            ignoreNonFrameNodesElement.checked = settings.ignoreNonFrameNodes;
            ignoreNonSlideNodesElement.checked = settings.ignoreNonSlideNodes || true;
            styleCheckbox(numberNodesElement);
            styleCheckbox(ignoreNonFrameNodesElement);
            styleCheckbox(ignoreNonSlideNodesElement);
        }
    };
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb) => {
        cb.addEventListener(
            'click',
            (e) => {
                styleCheckbox(e.target);
            },
            false
        );
    });
    const select = document.querySelector('.select');
    const svgSelect = select.querySelector('svg');
    const selectOptionsWrapper = document.querySelector(
        '.select-options-wrapper'
    );
    const close = () => {
        selectOptionsWrapper.classList.add('hidden');
        selectOptionsWrapper.setAttribute('data-value', 0);
        svgSelect.classList.remove('opened');
    };
    select.addEventListener(
        'click',
        (e) => {
            const opened = Number(
                selectOptionsWrapper.getAttribute('data-value')
            );
            if (opened) {
                close();
            } else {
                selectOptionsWrapper.classList.remove('hidden');
                selectOptionsWrapper.setAttribute('data-value', 1);
                svgSelect.classList.add('opened');
            }
        },
        false
    );
    Array.from(selectOptionsWrapper.children).forEach((el) => {
        el.addEventListener(
            'click',
            (e) => {
                const value = Number(el.getAttribute('data-select-value'));
                select.setAttribute('data-selected', value);
                select.querySelector('span').innerText = el.innerText;
                close();
            },
            false
        );
    });
    const advancedOptions = document.querySelector('.advanced-options');
    const advancedOptionsWrapper = document.querySelector(
        '.advanced-options-wrapper'
    );
    const plusIcon = advancedOptions.querySelector('[data-id="plus-icon"]');
    const minusIcon = advancedOptions.querySelector('[data-id="minus-icon"]');
    advancedOptions.addEventListener(
        'click',
        () => {
            const opened = Number(
                advancedOptionsWrapper.getAttribute('data-value')
            );
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
        },
        false
    );
    const instructionOptions = document.querySelector('.instruction-options');
    const svgInstructions = instructionOptions.querySelector('svg');
    const instructionOptionsWrapper = document.querySelector(
        '.instruction-options-wrapper'
    );
    instructionOptions.addEventListener(
        'click',
        (e) => {
            const opened = Number(
                instructionOptionsWrapper.getAttribute('data-value')
            );
            if (opened) {
                instructionOptionsWrapper.classList.add('hidden');
                instructionOptionsWrapper.setAttribute('data-value', 0);
                svgInstructions.classList.remove('opened');
            } else {
                instructionOptionsWrapper.classList.remove('hidden');
                instructionOptionsWrapper.setAttribute('data-value', 1);
                svgInstructions.classList.add('opened');
            }
        },
        false
    );
    document.getElementById('runPlugin').onclick = function () {
        var ignoreNonFrameNodes = document.querySelector(
            'input[name="ignoreNonFrameNodes"]'
        ).checked;
        var ignoreNonSlideNodes = document.querySelector(
            'input[name="ignoreNonSlideNodes"]'
        ).checked;
        var leadingZeros = Number(
            document.querySelector('.select').getAttribute('data-selected')
        );
        var numberNodes = document.querySelector(
            'input[name="numberNodes"]'
        ).checked;
        var optionalPrefix = document.querySelector(
            'input[name="optionalPrefix"]'
        ).value;
        var rememberSettings = document.querySelector(
            'input[name="rememberSettings"]'
        ).checked;
        var textLayerName = document.querySelector(
            'input[name="textLayerName"]'
        ).value;
        parent.postMessage(
            {
                pluginMessage: {
                    ignoreNonFrameNodes,
                    ignoreNonSlideNodes,
                    leadingZeros,
                    numberNodes,
                    optionalPrefix,
                    rememberSettings,
                    textLayerName,
                },
            },
            '*'
        );
    };
}; 