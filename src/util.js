export const createPriceFormatter = (sign, delimiter, left) => {
  return (price) => {
    const delimited_price = price.replace('.', delimiter);
    return left ? `${sign}${delimited_price}` : `${delimited_price}${sign}`;
  };
};

export const getDateStr = timestamp => {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

export const request = (method, url, { params = {}, body = {} }) => {
  const queryArr = Object.keys(params).map(key => {
    return `${ encodeURIComponent(key) }=${ encodeURIComponent(params[key]) }`;
  });

  const queryStr = queryArr.join('&');

  return new Promise((resolve, reject) => {
    if (window.GM_xmlhttpRequest) {
      const xhr = window.GM_xmlhttpRequest;

      xhr({
        method: method,
        url: `${url}?${queryStr}`,
        data: method === 'POST' ? JSON.stringify(body) : null,
        headers: { 'Content-Type': 'application/json' },
        onload: res => {
          let json = {};

          try {
            json = JSON.parse(res.responseText);
          } catch { /* nothing */ }

          if (res.status >= 200 && res.status < 300) {
            resolve(json);
          } else {
            reject(json);
          }
        },
        onerror: err => reject(err)
      });
    } else {
      const xhr = new XMLHttpRequest();
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.open(method, `${ url }?${ queryStr }`);

      xhr.onload = () => {
        let json = {};

        try {
          json = JSON.parse(xhr.response);
        } catch { /* nothing */ }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(json);
        } else {
          reject(json);
        }
      };

      xhr.onerror = () => reject(xhr);
      xhr.send(JSON.stringify(body));
    }
  });
};
