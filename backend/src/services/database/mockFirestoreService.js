// Mock Firestore Service layer to simulate Firebase interaction

// In-memory store representing Firestore collections
const store = {
  stadium_state: {
    mode: 'AUTONOMOUS',
    matchPhase: 'PRE_MATCH',
    weather: 'CLEAR'
  },
  zones: {
    'gate-a': { id: 'gate-a', name: 'Gate A Entrance', density: 30, status: 'NORMAL', waitTime: 5 },
    'gate-b': { id: 'gate-b', name: 'Gate B Entrance', density: 20, status: 'NORMAL', waitTime: 2 },
    'concourse-east': { id: 'concourse-east', name: 'East Concourse', density: 40, status: 'NORMAL', waitTime: 8 },
    'food-court': { id: 'food-court', name: 'Main Food Court', density: 60, status: 'NORMAL', waitTime: 15 }
  },
  alerts: {},
  audit_logs: {},
  ticket_flows: {},
  incidents: {}
};

// Listeners for onSnapshot
const listeners = {
  stadium_state: [],
  zones: [],
  alerts: [],
  audit_logs: [],
  ticket_flows: [],
  incidents: []
};

function notifyListeners(collection) {
  const data = store[collection];
  listeners[collection].forEach(callback => callback(data));
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

const mockFirestoreService = {
  // Get all documents in a collection
  async getCollection(collection) {
    console.log(`[MockDB] getCollection: ${collection}`);
    return Object.values(store[collection] || {});
  },

  // Get a specific document
  async getDocument(collection, docId) {
    return store[collection] ? store[collection][docId] : null;
  },

  // Set/Overwrite a document
  async setDocument(collection, docId, data) {
    if (!store[collection]) store[collection] = {};
    store[collection][docId] = data;
    notifyListeners(collection);
    return true;
  },

  // Update a document (merge)
  async updateDocument(collection, docId, data) {
    if (!store[collection]) store[collection] = {};
    store[collection][docId] = { ...store[collection][docId], ...data };
    notifyListeners(collection);
    return true;
  },

  // Add a new document with auto ID (e.g. for logs/alerts)
  async addDocument(collection, data) {
    const docId = generateId();
    if (!store[collection]) store[collection] = {};
    store[collection][docId] = { id: docId, ...data };
    notifyListeners(collection);
    return docId;
  },
  
  // Real-time listener
  onSnapshot(collection, callback) {
    if (!listeners[collection]) listeners[collection] = [];
    listeners[collection].push(callback);
    // Initial call
    callback(store[collection]);
    
    // Return unsubscribe function
    return () => {
      listeners[collection] = listeners[collection].filter(cb => cb !== callback);
    };
  }
};

export default mockFirestoreService;
