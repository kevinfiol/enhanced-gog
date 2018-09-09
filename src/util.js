const request = (method, url, params) => {
    const queryArr = Object.keys(params).map(key => {
        return `${ encodeURIComponent(key) }=${ encodeURIComponent(params[key]) }`;
    });

    const queryStr = queryArr.join('&');

    return new Promise((resolve, reject) => {
        if (window.GM_xmlhttpRequest) {
            const xhr = window.GM_xmlhttpRequest;

            xhr({
                method: method,
                url: `${ url }?${ queryStr }`,
                onload: res => {
                    if (res.status >= 200 && res.status < 300) {
                        resolve(res.responseText);
                    } else {
                        reject(res.statusText);
                    }
                },
                onerror: err => reject(err.statusText)
            });
        } else {
            const xhr = new XMLHttpRequest();
            xhr.open(method, `${ url }?${ queryStr }`);
    
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject(xhr.statusText);
                }
            };
    
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send();
        }
    });
};

export { request }