import 'dotenv/config';
import mockService from './mockFirestoreService.js';
import * as realService from './firestoreService.js';

// Toggle this to true in production or via .env
const USE_REAL_FIRESTORE = process.env.USE_REAL_FIRESTORE === 'true';

const dbService = USE_REAL_FIRESTORE ? realService : mockService;

export default dbService;
