/**
 * IndexedDB utility for storing image history
 * Supports large data storage with better performance than localStorage
 */

const DB_NAME = 'AIAssistantDB';
const DB_VERSION = 4;

interface HistoryStore {
  storeName: string;
}

// Store names for different pages
export const STORES = {
  GENAI_IMAGE_STUDIO: 'genai-image-studio-history',
  GEMINI_MEDECAL_STYLER: 'gemini-medecal-styler-history',
  CMF_AI: 'cmf-ai-history',
  AI_CAMERA_DIRECTOR: 'ai-camera-director-history',
  AI_LINE_ART_COLORIZER: 'ai-line-art-colorizer-history',
  VEO_STUDIO: 'veo-studio-history',
  CINEMATIC_MULTI_SHOT: 'cinematic-multi-shot-history',
  STYLEMORPH: 'stylemorph-history',
  TRIPO_3D_STUDIO: 'tripo-3d-studio-history'
} as const;

/**
 * Initialize IndexedDB with all required object stores
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores for each page if they don't exist
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };
  });
};

/**
 * Save history items to IndexedDB
 * @param storeName - The name of the object store
 * @param items - Array of history items to save
 * @param maxItems - Maximum number of items to keep (default: 50)
 */
export const saveHistory = async <T extends { id: string }>(
  storeName: string,
  items: T[],
  maxItems: number = 50
): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Clear existing data
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Limit items to maxItems
    const limitedItems = items.slice(0, maxItems);

    // Add new items
    for (const item of limitedItems) {
      await new Promise<void>((resolve, reject) => {
        const addRequest = store.add(item);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      });
    }

    db.close();
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    throw error;
  }
};

/**
 * Load history items from IndexedDB
 * @param storeName - The name of the object store
 * @returns Array of history items
 */
export const loadHistory = async <T>(storeName: string): Promise<T[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        db.close();
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    return [];
  }
};

/**
 * Clear all history items from a specific store
 * @param storeName - The name of the object store to clear
 */
export const clearHistory = async (storeName: string): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Error clearing IndexedDB store:', error);
    throw error;
  }
};

/**
 * Delete a specific item from history
 * @param storeName - The name of the object store
 * @param id - The ID of the item to delete
 */
export const deleteHistoryItem = async (
  storeName: string,
  id: string
): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Error deleting item from IndexedDB:', error);
    throw error;
  }
};
