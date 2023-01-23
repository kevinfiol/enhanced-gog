const getValue = key => GM_getValue(key, null);
const setValue = (key, value) => GM_setValue(key, value);

export function retrieveUserSettings() {
  const userRegion = getValue('userRegion');
  const userCountry = getValue('userCountry');
  return { userRegion, userCountry };
}

export function persistUserSettings({ userRegion, userCountry }) {
  setValue('userRegion', userRegion);
  setValue('userCountry', userCountry);
}