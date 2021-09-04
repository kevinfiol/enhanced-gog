const Storage = () => {
    const getValue = key => GM_getValue(key, null);

    const setValue = (key, value) => GM_setValue(key, value);

    const deleteValue = key => GM_deleteValue(key);

    const listValues = () => GM_listValues();

    return { getValue, setValue, deleteValue, listValues };
};

export default Storage;