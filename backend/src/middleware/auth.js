// import admin from '../config/firebase.js';

/**
 * Simulates JWT Verification until Firebase is fully connected.
 * In Phase 2, this will use admin.auth().verifyIdToken(token).
 */
export async function verifyAdminToken(token) {
  if (!token) throw new Error('No authentication token provided');
  
  // REAL IMPLEMENTATION (Pending Firebase setup):
  // try {
  //   const decodedToken = await admin.auth().verifyIdToken(token);
  //   // You can set custom claims in Firebase for RBAC (e.g. decodedToken.role)
  //   return { uid: decodedToken.uid, email: decodedToken.email, role: decodedToken.role || 'ADMIN' };
  // } catch (err) {
  //   throw new Error('Invalid or expired authentication token');
  // }

  // MOCK IMPLEMENTATION (For current development):
  if (token === 'mock-jwt-admin-token') {
    return { uid: 'admin-123', role: 'ADMIN', email: 'admin@stadium.com' };
  } else if (token === 'mock-jwt-security-token') {
    return { uid: 'sec-456', role: 'SECURITY_OFFICER', email: 'security@stadium.com' };
  }
  
  throw new Error('Invalid authentication token');
}

/**
 * Validates if the decoded user has the required role.
 */
export function hasRequiredRole(user, requiredRole) {
  const roleHierarchy = {
    'VIEWER': 0,
    'SECURITY_OFFICER': 1,
    'ADMIN': 2
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}
