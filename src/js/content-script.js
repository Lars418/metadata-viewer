chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const metadata = getAllMetadata();
    const url = window.location.href;

    sendResponse({
        metadata,
        url
    });

    return true;
});

function prepareMetaElement(element) {
    const key =
        element.getAttribute('name')
        || element.getAttribute('property')
        || element.getAttribute('itemprop')
        || element.getAttribute('http-equiv')
        || (element.attributes.length > 0 ? element.attributes[0].name : 'UNKNOWN');
    const value = element.getAttribute('content')
        || (element.attributes.length > 0 ? element.attributes[0].value : 'UNKNOWN');

    return [key, value];
}

function getAllMetadata() {
    const metaElements = document.querySelectorAll('meta');

    const metadata = Array.from(metaElements).map(metaElement => prepareMetaElement(metaElement));
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