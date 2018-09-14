/**
 * DOM Methods
 */
const q = query => document.querySelector(query);

const c = (tag, className, innerHTML = '') => {
    const el = document.createElement(tag);
    el.className = className;
    el.innerHTML = innerHTML;
    return el;
};

const createPriceFormatter = (sign, delimiter, left) => {
    return (price) => {
        const delimited_price = price.replace('.', delimiter);
        return left ? `${sign}${delimited_price}` : `${delimited_price}${sign}`;
    };
};

const capitalize = str => str.trim()[0].toUpperCase() + str.trim().slice(1);

const getDateStr = unixTime => {
    const date = new Date(unixTime * 1000);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
};

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

export { q, c, createPriceFormatter, capitalize, getDateStr, request }