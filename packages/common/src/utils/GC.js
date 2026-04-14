const { registry, storageRegistry } = require("./registry");
function garbageCollect() {
    console.log("Garbage Collecting");
    setInterval(() => {
        console.log("20 minutes passed");
        const now = new Date();
        for (const [key, value] of registry) {
            if (now - value.lastAccessed > 20 * 60 * 1000) {

                if (value.readyState === 1) {
                    value.close();
                    registry.delete(key);
                }

            }
        }
    }, 20 * 60 * 1000);
}

function storageGarbageCollect() {
    setInterval(() => {
        console.log("1 day passed");
        const now = new Date();
        for (const [key, value] of storageRegistry) {
            if (now - value.lastUsed > 24 * 60 * 60 * 1000) {
                storageRegistry.delete(key);
            }
        }
    }, 24 * 60 * 60 * 1000);
}


module.exports = { garbageCollect, storageGarbageCollect };
