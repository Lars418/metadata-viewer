applyTranslations(document);
addTabsLogic();

chrome.tabs.query({ active: true, currentWindow: true}, (tabs) => {
    const currentTabId = tabs[0]?.id;

    chrome.tabs.sendMessage(currentTabId, { action: 'GET_META_TAGS'}, async (response) => {
        if (!response) {
            return;
        }

        const metadataContainer = document.querySelector('#tabpanel-metadata');
        const preparedMetadata = await getPreparedMetadata(response.metadata, response.url);

        metadataContainer.innerHTML = createMetadataTables(preparedMetadata);
    });
});

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

function addTabsLogic() {
    const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));

    tabs.forEach((button) => {
        button.addEventListener('click', () => {
               if (button.hasAttribute('aria-selected')) {
                   return;
               }

               tabs.forEach((tab) => {
                   const tabPanel = document.querySelector(`div[role="tabpanel"][aria-labelledby="${tab.id}"]`);

                   tab.removeAttribute('aria-selected');
                   tabPanel.classList.remove('is-hidden');
               });

               const activeTabPanel = document.querySelector(`div[role="tabpanel"][aria-labelledby="${button.id}"]`);

               button.setAttribute('aria-selected', 'true');
               activeTabPanel.classList.remove('is-hidden');
        });
    })
}

function createMetadataTables(metadata) {
    let html = '';

    for (const category in metadata) {
        const { entries, description, prefix } = metadata[category];

        html +=
`
<h2 class="metadata-category">${chrome.i18n.getMessage(`cat_metadata_${category}`)}</h2>
${description ? `<p class="metadata-description">${description}</p>` : ''}

<table class="metadata-table">
<thead>
    <tr>
        <th>Name</th>
        <th>Value</th>
        <th></th>
        <!--
        <th>Description</th>
        <th>Type</th>
        <th>Example</th>
        <th>Specification</th>
        -->
    </tr>
</thead>
<tbody>
`;

        for (const entry in entries) {
            const content = entries[entry];

            html +=
`
<tr>
    <td
        ${content.description ? `title="${content.description}"` : ''}
    >
        <code>
            ${
                entry?.toLowerCase().startsWith(prefix?.toLowerCase())
                ? `<span class="metadata-prefix">${prefix}</span><pre>${entry.slice(prefix.length)}</pre>`
                : `<pre>${entry}</pre>`
            }
        </code>
    </td>
    <td>
        <code>
            <pre>${content.value.map(x => `<div>${x}</div>`).join('')}</pre>
        </code>
    </td>
    <td>
        <button
            data-category="${entry}"
            data-content="${window.btoa(JSON.stringify(content))}"
        >
            ?
        </button>
    </td>
    <!--
    <td>${content.type}</td>
    <td>${content.example?.replace(/</g, '&lt;')?.replace(/>/g, '&gt;')}</td>
    <td>${content.specUrl}</td>
    -->
</tr>
`;
        }

        html += `</tbody></table>`;
    }

    return html;
}