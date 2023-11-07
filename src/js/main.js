chrome.devtools.panels.create('Metadata', '/assets/icons/128.png', 'metadata-panel.html', (panel) => {
    panel.onSearch.addListener((action, queryString) => {
       console.log(action, queryString);
    });
});