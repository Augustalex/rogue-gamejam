const Time = 24 * 60 * 60 * 1000;

export {
    getOrCreate
};

async function getOrCreate(key, factory) {
    const cacheResult = localStorage.getItem(key);
    if (cacheResult) {
        const [storeTime, value] = JSON.parse(cacheResult);
        if (Date.now() - storeTime < Time) {
            return value;
        }
    }

    const value = await factory();
    const cacheValue = JSON.stringify([Date.now(), value]);
    localStorage.setItem(key, cacheValue);
    return value;
}
