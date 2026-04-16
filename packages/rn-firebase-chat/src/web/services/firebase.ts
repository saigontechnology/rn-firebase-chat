import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { FirebaseConfig } from '../types';

class FirebaseService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private auth: Auth | null = null;
  private storage: FirebaseStorage | null = null;
  private initialized = false;

  initialize(config: FirebaseConfig): void {
    if (this.initialized) {
      console.warn('Firebase already initialized');
      return;
    }

    try {
      // Check if Firebase app already exists
      const existingApps = getApps();
      if (existingApps.length > 0) {
        this.app = existingApps[0] || null;
      } else {
        this.app = initializeApp(config);
      }

      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
      this.storage = getStorage(this.app);
      this.initialized = true;

      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw new Error('Firebase initialization failed');
    }
  }

  getFirestore(): Firestore {
    if (!this.db) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.db;
  }

  getAuth(): Auth {
    if (!this.auth) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.auth;
  }

  getStorage(): FirebaseStorage {
    if (!this.storage) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.storage;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  reset(): void {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.storage = null;
    this.initialized = false;
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();

// Export individual getters for convenience
export const getFirebaseAuth = () => firebaseService.getAuth();
export const getFirebaseFirestore = () => firebaseService.getFirestore();
export const getFirebaseStorage = () => firebaseService.getStorage();

// Export initialization function
export const initializeFirebase = (config: FirebaseConfig) => {
  firebaseService.initialize(config);
};
