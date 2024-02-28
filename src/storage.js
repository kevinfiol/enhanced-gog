const getValue = key => GM_getValue(key, null);
const setValue = (key, value) => GM_setValue(key, value);

export function retrieveUserSettings() {
  const collapsed = getValue('collapsed');
  const userRegion = getValue('userRegion');
  const userCountry = getValue('userCountry');
  return { collapsed, userRegion, userCountry };
}

export function persistUserSettings(settings = {}) {
  for (const k in settings) {
    setValue(k, settings[k]);
  }
}