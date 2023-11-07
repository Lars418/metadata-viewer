/*chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log(`${tabId} updated: `, { changeInfo, tab });

    // Only send message if page has been fully loaded
    if (changeInfo?.status !== 'complete') {
        return;
    }

    const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_METADATA' });
    console.log('Response in SW: ', response);
});*/

/*chrome.webNavigation.onHistoryStateUpdated.addListener(async ({ tabId }) => {
    await chrome.tabs.sendMessage(tabId, { type: 'GET_METADATA' });
});*/