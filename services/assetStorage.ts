
// Simple IndexedDB wrapper to store massive blobs/base64 strings 
// avoiding localStorage 5MB limit.

const DB_NAME = 'panchatantra_assets_db';
const STORE_NAME = 'media_assets';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export const initAssetStorage = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });

    return dbPromise;
};

const getKey = (storyId: string, sceneIndex: number, type: 'image' | 'audio') => 
    `${storyId}_${sceneIndex}_${type}`;

export const storeAsset = async (
    storyId: string, 
    sceneIndex: number, 
    type: 'image' | 'audio', 
    data: string
): Promise<void> => {
    const db = await initAssetStorage();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const key = getKey(storyId, sceneIndex, type);
        const request = store.put(data, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getStoredAsset = async (
    storyId: string,
    sceneIndex: number,
    type: 'image' | 'audio'
): Promise<string | null> => {
    const db = await initAssetStorage();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const key = getKey(storyId, sceneIndex, type);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};
