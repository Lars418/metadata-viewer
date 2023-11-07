chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received in content-script.js: ', message);

    if (message.type === 'GET_METADATA') {
        sendResponse({
            type: 'FORWARD_METADATA',
            url: window.location.href,
            metadata: getAllMetadata(),
        });
    }

    return true;
});
function prepareMetaElement(element) {
    const key =
        element.getAttribute('name')
        ?? element.getAttribute('property')
        ?? element.getAttribute('itemprop')
        ?? element.getAttribute('http-equiv')
        ?? (element.attributes.length > 0 ? element.attributes[0].name : 'UNKNOWN');
    const value = element.getAttribute('content') ?? element.getAttribute('charset');
        //?? (element.attributes.length > 0 ? element.attributes[0].value : 'UNKNOWN');

    return [key, value];
}

function getAllMetadata() {
    const metaElements = document.querySelectorAll('meta');

    const metadata = Array.from(metaElements)
        .filter(element => element.attributes.length > 0)
        .filter(element => !element.hasAttribute('itemprop')) // don't show microdata
        .map(metaElement => prepareMetaElement(metaElement));
    const preparedMetadata = {};

    metadata.forEach(metadata => {
        const [key, value] = metadata;

        if (preparedMetadata[key]) {
            preparedMetadata[key].push(value);
        } else {
            preparedMetadata[key] = [value];
        }
    });

    return Object.entries(preparedMetadata);
}