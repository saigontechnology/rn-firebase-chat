import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection as fsCollection,
  doc as fsDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy as fsOrderBy,
  limit as fsLimit,
  startAfter as fsStartAfter,
  onSnapshot,
  getCountFromServer,
  serverTimestamp,
  increment,
  Timestamp,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import type {
  CollectionRef,
  DocumentRef,
  DocumentSnapshot,
  FieldValues,
  FirestoreClient,
  QueryConstraints,
  QueryDocumentSnapshot,
  QuerySnapshot,
} from '@saigontechnology/firebase-chat-shared';

type RNData = FirebaseFirestoreTypes.DocumentData;
type RNCollRef = FirebaseFirestoreTypes.CollectionReference<RNData>;
type RNDocRef = FirebaseFirestoreTypes.DocumentReference<RNData>;
type RNDocSnap = FirebaseFirestoreTypes.DocumentSnapshot<RNData>;
type RNQueryDocSnap = FirebaseFirestoreTypes.QueryDocumentSnapshot<RNData>;
type RNQuerySnap = FirebaseFirestoreTypes.QuerySnapshot<RNData>;
type RNQuery = FirebaseFirestoreTypes.Query<RNData>;

const NATIVE_CURSOR = Symbol('rn-firestore-native-cursor');

type CursorHolder = {
  [NATIVE_CURSOR]: RNQueryDocSnap;
};

const buildQuery = (
  collRef: RNCollRef,
  constraints?: QueryConstraints
): RNQuery => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qc: any[] = [];

  if (constraints?.where) {
    for (const [field, op, value] of constraints.where) {
      qc.push(where(field, op, value));
    }
  }
  if (constraints?.orderBy) {
    for (const [field, dir] of constraints.orderBy) {
      qc.push(fsOrderBy(field, dir));
    }
  }
  if (typeof constraints?.limit === 'number') {
    qc.push(fsLimit(constraints.limit));
  }
  if (constraints?.startAfter) {
    const native = (constraints.startAfter as unknown as CursorHolder)[
      NATIVE_CURSOR
    ];
    if (native) qc.push(fsStartAfter(native));
  }

  return qc.length > 0 ? (query(collRef, ...qc) as RNQuery) : collRef;
};

const wrapDocSnapshot = (snap: RNDocSnap): DocumentSnapshot<RNData> => ({
  id: snap.id,
  exists: snap.exists(),
  data: () => snap.data(),
});

const wrapQueryDocSnapshot = (
  snap: RNQueryDocSnap
): QueryDocumentSnapshot<RNData> => {
  const wrapped: QueryDocumentSnapshot<RNData> = {
    id: snap.id,
    exists: true,
    data: () => snap.data(),
  };
  Object.defineProperty(wrapped, NATIVE_CURSOR, {
    value: snap,
    enumerable: false,
  });
  return wrapped;
};

const wrapQuerySnapshot = (snap: RNQuerySnap): QuerySnapshot<RNData> => ({
  docs: snap.docs.map(wrapQueryDocSnapshot),
  docChanges: () =>
    snap.docChanges().map((change) => ({
      type: change.type,
      doc: wrapQueryDocSnapshot(change.doc),
    })),
});

const wrapDocRef = (ref: RNDocRef): DocumentRef<RNData> => ({
  id: ref.id,
  path: ref.path,
  get: () => getDoc(ref).then(wrapDocSnapshot),
  set: (data, options) =>
    setDoc(ref, data as unknown as RNData, options ?? {}) as Promise<void>,
  update: (data) => updateDoc(ref, data as unknown as RNData),
  delete: () => deleteDoc(ref),
  onSnapshot: (cb) =>
    onSnapshot(ref, (snap) => {
      if (snap) cb(wrapDocSnapshot(snap));
    }),
});

const wrapCollectionRef = (collRef: RNCollRef): CollectionRef<RNData> => ({
  path: collRef.path,
  doc: (id) => wrapDocRef(id ? fsDoc(collRef, id) : fsDoc(collRef)),
  add: (data) => addDoc(collRef, data as unknown as RNData).then(wrapDocRef),
  get: (constraints) =>
    getDocs(buildQuery(collRef, constraints)).then(wrapQuerySnapshot),
  count: async (constraints) => {
    const snap = await getCountFromServer(buildQuery(collRef, constraints));
    return snap.data().count;
  },
  onSnapshot: (constraints, cb) =>
    onSnapshot(buildQuery(collRef, constraints), (snap) => {
      if (snap) cb(wrapQuerySnapshot(snap));
    }),
});

const fieldValues: FieldValues = {
  serverTimestamp: () => serverTimestamp() as unknown as object,
  increment: (n) => increment(n) as unknown as object,
  timestampNow: () => Timestamp.now(),
};

export const createRNFirestoreClient = (): FirestoreClient => {
  const db = getFirestore(getApp());
  return {
    collection: <T>(path: string) =>
      wrapCollectionRef(
        fsCollection(db, path) as RNCollRef
      ) as unknown as CollectionRef<T>,
    fieldValues,
  };
};
