import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import {
  FirestoreServices,
  WebCryptoProvider,
} from '@saigontechnology/firebase-chat-shared';
import { createWebFirestoreClient } from './web-firestore-adapter';
import { FirebaseConfig } from '../types';

class FirebaseService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private auth: Auth | null = null;
  private initialized = false;

  initialize(config: FirebaseConfig): void {
    if (this.initialized) {
      console.warn('Firebase already initialized');
      return;
    }

    try {
      const existingApps = getApps();
      if (existingApps.length > 0) {
        this.app = existingApps[0] || null;
      } else {
        this.app = initializeApp(config);
      }

      this.db = getFirestore(this.app!);
      this.auth = getAuth(this.app!);
      this.initialized = true;

      // Auto-wire platform adapters into shared FirestoreServices (mirrors rn-firebase-chat/src/index.ts)
      const svc = FirestoreServices.getInstance();
      svc.setFirestoreClient(createWebFirestoreClient(this.db));
      svc.setCryptoProvider(new WebCryptoProvider());

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

  /** Returns the underlying FirebaseApp (useful for constructing WebFirebaseStorageProvider). */
  getApp(): FirebaseApp {
    if (!this.app) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.app;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  reset(): void {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.initialized = false;
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();

// Export individual getters for convenience
export const getFirebaseAuth = () => firebaseService.getAuth();
export const getFirebaseFirestore = () => firebaseService.getFirestore();
export const getFirebaseApp = () => firebaseService.getApp();

// Export initialization function
export const initializeFirebase = (config: FirebaseConfig) => {
  firebaseService.initialize(config);
};
