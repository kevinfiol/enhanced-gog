// transforms css style objects into style attribute strings
// { borderRadius: '1px' } -> 'border-radius: 1px;'
export function rules(obj) {
  let val, tmp, key, str = '';

  for (key in obj) {
    val = obj[key];

    if (tmp = key.match(/[A-Z]/)) {
      key = key.split('')
      key.splice(tmp.index, 1, '-' + tmp[0].toLowerCase());
      key = key.join('');
    }

    str += key + ':' + val + ';';
  }
  
  return str;
}

export const createPriceFormatter = (sign, delimiter, left) => {
  return (price) => {
    const delimited_price = price.replace('.', delimiter);
    return left ? `${sign}${delimited_price}` : `${delimited_price}${sign}`;
  };
};

export const capitalize = str => str.trim()[0].toUpperCase() + str.trim().slice(1);

export const getDateStr = unixTime => {
  const date = new Date(unixTime * 1000);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

export const request = (method, url, params) => {
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
        onload: res => {
          if (res.status >= 200 && res.status < 300) {
            let text = res.responseText;

            try {
              text = JSON.parse(text);
            } catch {
              text = text;
            }

            resolve(text);
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
          let text = xhr.response;

          try {
            text = JSON.parse(text);
          } catch {
            text = text;
          }

          resolve(text);
        } else {
          reject(xhr.statusText);
        }
      };

      xhr.onerror = () => reject(xhr.statusText);
      xhr.send();
    }
  });
};
