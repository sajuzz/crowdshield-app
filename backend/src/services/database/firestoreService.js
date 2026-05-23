import { db } from '../../config/firebase.js'

export async function getDocument(collection, docId) {
  if (!db) return null;
  const doc = await db.collection(collection).doc(docId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function getCollection(collection) {
  if (!db) return [];
  const snapshot = await db.collection(collection).get();
  const docs = [];
  snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
  return docs;
}

export async function addDocument(collection, data) {
  if (!db) return null;
  const docRef = await db.collection(collection).add(data);
  return docRef.id;
}

export async function setDocument(collection, docId, data) {
  if (!db) return;
  await db.collection(collection).doc(docId).set(data, { merge: true });
}

export async function updateDocument(collection, docId, data) {
  if (!db) return;
  await db.collection(collection).doc(docId).update(data);
}

export function onSnapshot(collection, callback) {
  if (!db) return () => {}; // return empty unsubscribe
  return db.collection(collection).onSnapshot((snapshot) => {
    const dataMap = {};
    snapshot.forEach(doc => {
      dataMap[doc.id] = { id: doc.id, ...doc.data() };
    });
    callback(dataMap);
  });
}
