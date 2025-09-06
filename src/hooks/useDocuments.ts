import { useState, useEffect, useCallback } from 'react';
import { Document } from '../types';
import { DatabaseService } from '../services/database';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [db, setDb] = useState<DatabaseService | null>(null);

  // Initialize database
  useEffect(() => {
    const initDB = async () => {
      const dbService = new DatabaseService();
      await dbService.init();
      setDb(dbService);
      
      const docs = await dbService.getAllDocuments();
      setDocuments(docs);
      
      // Load the most recent document
      if (docs.length > 0) {
        const latest = docs[0];
        setCurrentDocument(latest);
        setLastSavedContent(latest.content);
      } else {
        // No documents, start with empty document
        setCurrentDocument(null);
        setLastSavedContent('');
      }
    };
    
    initDB();
  }, []);

  // Auto-save every 3 seconds if there are changes
  useEffect(() => {
    // Remove auto-save from here - it's now handled in App.tsx with toast
  }, []);

  const createDocument = useCallback(() => {
    const newDoc: Document = {
      title: '',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setCurrentDocument(newDoc);
    setLastSavedContent('');
    setHasUnsavedChanges(false);
  }, []);

  const openDocument = useCallback((doc: Document) => {
    setCurrentDocument(doc);
    setLastSavedContent(doc.content);
    setHasUnsavedChanges(false);
  }, []);

  const updateDocument = useCallback((title: string, content: string) => {
    if (!currentDocument) return;
    
    const updatedDoc = {
      ...currentDocument,
      title,
      content,
      updatedAt: new Date().toISOString()
    };
    
    setCurrentDocument(updatedDoc);
    
    // Compare with the last saved version of this specific document
    const savedDoc = documents.find(d => d.id === currentDocument.id);
    const savedTitle = savedDoc?.title || '';
    const savedContent = savedDoc?.content || '';
    
    setHasUnsavedChanges(
      content !== savedContent || title !== savedTitle
    );
  }, [currentDocument, lastSavedContent, documents]);

  const saveDocument = useCallback(async () => {
    if (!db || !currentDocument) return null;
    
    const savedDoc = await db.saveDocument(currentDocument);
    setCurrentDocument(savedDoc);
    setLastSavedContent(savedDoc.content);
    setHasUnsavedChanges(false);
    
    // Update documents list
    const docs = await db.getAllDocuments();
    setDocuments(docs);
    
    return savedDoc;
  }, [db, currentDocument]);

  const deleteDocument = useCallback(async (id?: number) => {
    if (!db) return;
    
    const docId = id || currentDocument?.id;
    if (!docId) return;
    
    await db.deleteDocument(docId);
    
    // Update documents list
    const docs = await db.getAllDocuments();
    setDocuments(docs);
  }, [db, currentDocument]);

  return {
    documents,
    currentDocument,
    hasUnsavedChanges,
    createDocument,
    openDocument,
    updateDocument,
    saveDocument,
    deleteDocument
  };
}