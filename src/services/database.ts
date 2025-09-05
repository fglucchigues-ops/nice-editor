import { Document } from '../types';

export class DatabaseService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'WritingAppDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'documents';

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }

  async getAllDocuments(): Promise<Document[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const documents = request.result.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        resolve(documents);
      };

      request.onerror = () => {
        reject(new Error('Failed to get documents'));
      };
    });
  }

  async saveDocument(document: Document): Promise<Document> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const documentData = {
        ...document,
        updatedAt: new Date().toISOString(),
        createdAt: document.createdAt || new Date().toISOString()
      };

      const request = store.put(documentData);

      request.onsuccess = () => {
        const savedDocument = {
          ...documentData,
          id: request.result as number
        };
        resolve(savedDocument);
      };

      request.onerror = () => {
        reject(new Error('Failed to save document'));
      };
    });
  }

  async deleteDocument(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete document'));
      };
    });
  }
}