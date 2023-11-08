applyTranslations(document);

const metadataPanel = document.getElementById('tabpanel-metadata');

// region INIT
const currentTab = (await chrome.tabs.query({ currentWindow: true, active: true }))?.[0];
const response = await chrome.tabs.sendMessage(currentTab?.id, { type: 'GET_METADATA' });
const preparedMetadata = await getPreparedMetadata(response.metadata, response.url);

metadataPanel.innerHTML = createMetadataTables(preparedMetadata);

addLogic();
// endregion

/*chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'UPDATE_METADATA') {
        const preparedMetadata = await getPreparedMetadata(message.metadata, message.url);

        metadataPanel.innerHTML = createMetadataTables(preparedMetadata);
    }

    return true;
});*/

async function getPreparedMetadata(rawMetadata, url) {
    const baseUrl = `http://localhost:3003/v1/url/${encodeURIComponent(url)}/metadata`;
    const response = await fetch(baseUrl, {
        method: 'POST',
        body: JSON.stringify(rawMetadata),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        console.log('Failed to fetch: ', response.status);
        return [];
    }

    return await response.json();
}

function applyTranslations(document) {
    const { getMessage } = chrome.i18n;
    const elements = Array.from(document.querySelectorAll('*'))
        .filter(element => Object.keys(element.dataset).some(attribute => attribute.startsWith('intl')));

    elements.forEach(element => {
        const dataAttributes = Object.keys(element.dataset).filter(attribute => attribute.startsWith('intl'));

        dataAttributes.forEach(attribute => {
            if (attribute === 'intl') {
                element.innerHTML = getMessage(element.dataset.intl);
            } else {
                const preparedAttribute = attribute
                    .replace(/^intl/i, '')
                    .split(/(?=[A-Z])/).join('-').toLowerCase();

                element.setAttribute(preparedAttribute, getMessage(element.dataset[attribute]));
            }
        });
    });
}

function createMetadataTables(metadata) {
    let html = '';

    for (const category in metadata) {
        const { title, entries, description, prefix } = metadata[category];

        html +=
`
<h2 class="metadata-category">${title}</h2>
${description ? `<p class="metadata-description">${description}</p>` : ''}

<table class="metadata-table">
<thead>
    <tr>
        <th>Name</th>
        <th>Value</th>
    </tr>
</thead>
<tbody>
`;

        for (const entry in entries) {
            const content = entries[entry];

            html +=
`
<tr>
    <td>
        ${category === 'other' ? (
`
            <code${content.deprecated ? ' class="is-deprecated-metatag"' : ''}>
                            ${
                entry?.toLowerCase().startsWith(prefix?.toLowerCase())
                    ? `<span class="metadata-prefix">${prefix}</span><span>${entry.slice(prefix.length)}</span>`
                    : `<span>${entry}</span>`
            }
            </code>
`     
) : (
`
        <button
            class="metadata-tag"
            data-content="${window.btoa(encodeURIComponent(JSON.stringify(content)))}"
            data-name="${entry}"
            title="${chrome.i18n.getMessage('metatagTitle')}"
            >
            <code${content.deprecated ? ' class="is-deprecated-metatag"' : ''}>
                ${
    entry?.toLowerCase().startsWith(prefix?.toLowerCase())
        ? `<span class="metadata-prefix">${prefix}</span><span>${entry.slice(prefix.length)}</span>`
        : `<span>${entry}</span>`
}
            </code>
        </button>
`  
)}
    </td>
    <td>
        <code${content.isInvalidValue ? ` class="is-invalid-value" title="${chrome.i18n.getMessage('metatagInvalidValueTitle')}"` : ''}>${content.value.map(x => `<span>${x}</span>`).join('')}</code>
    </td>
</tr>
`;
        }

        html += `</tbody></table>`;
    }

    return html;
}

function addLogic() {
    const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));

    tabs.forEach((button) => {
        button.addEventListener('click', () => {
            if (button.hasAttribute('aria-selected')) {
                return;
            }

            tabs.forEach((tab) => {
                const tabPanel = document.querySelector(`div[role="tabpanel"][aria-labelledby="${tab.id}"]`);

                tab.removeAttribute('aria-selected');
                tabPanel.classList.add('is-hidden');
            });

            const activeTabPanel = document.querySelector(`div[role="tabpanel"][aria-labelledby="${button.id}"]`);

            button.setAttribute('aria-selected', 'true');
            activeTabPanel.classList.remove('is-hidden');
        });
    });

    // Metatag dialog
    const dialog = document.getElementById('metatag-info-dialog');
    const title = document.getElementById('metatag-info-tagname');
    const description = document.getElementById('metatag-info-description');
    const exampleWrapper = document.getElementById('metatag-info-example-wrapper');
    const example = document.getElementById('metatag-info-example');
    const specification = document.getElementById('metatag-info-specification');
    const enumWrapper = document.getElementById('metatag-info-enum-values-wrapper');
    const enumList = document.getElementById('metatag-info-enum-values');
    const type = document.getElementById('metatag-info-type');
    const deprecated = document.getElementById('metatag-info-deprecated');
    const closeBtn = document.getElementById('metatag-info-close');

    closeBtn.addEventListener('click', () => dialog.close());

    document.querySelectorAll('button.metadata-tag').forEach((button) => {
        button.addEventListener('click', () => {
            const content = JSON.parse(decodeURIComponent(window.atob(button.dataset.content)));

            title.textContent = button.dataset.name;
            description.textContent = content.description;
            type.textContent = content.type;

            if (content.example) {
                exampleWrapper.classList.remove('is-hidden');
                example.innerHTML = Prism.highlight(content.example, Prism.languages.html, 'html');
            } else {
                exampleWrapper.classList.add('is-hidden');
            }

            if (content.specUrl) {
                specification.classList.remove('is-hidden');
                specification.href = content.specUrl;
            } else {
                specification.classList.add('is-hidden');
            }

            if (content.type === 'enum') {
                enumList.innerHTML = '';

                content.enumValues.forEach((value) => {
                    enumList.innerHTML += `<li><code>${value}</code></li>`;
                });

                enumWrapper.classList.remove('is-hidden');
            } else {
                enumWrapper.classList.add('is-hidden');
            }

            if (content.deprecated) {
                deprecated.classList.remove('is-hidden');
            } else {
                deprecated.classList.add('is-hidden');
            }

            dialog.showModal();
        });
    });
}