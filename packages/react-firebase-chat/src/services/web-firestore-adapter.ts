import {
  Firestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  Timestamp,
  getCountFromServer,
  type DocumentSnapshot as WebDocSnapshot,
  type QueryDocumentSnapshot as WebQueryDocSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
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

const NATIVE_CURSOR = Symbol('web-firestore-native-cursor');

type CursorHolder = {
  [NATIVE_CURSOR]: WebQueryDocSnapshot;
};

const buildConstraints = (
  constraints?: QueryConstraints
): QueryConstraint[] => {
  const result: QueryConstraint[] = [];
  if (constraints?.where) {
    for (const [field, op, value] of constraints.where) {
      result.push(where(field, op, value));
    }
  }
  if (constraints?.orderBy) {
    for (const [field, dir] of constraints.orderBy) {
      result.push(orderBy(field, dir));
    }
  }
  if (typeof constraints?.limit === 'number') {
    result.push(limit(constraints.limit));
  }
  if (constraints?.startAfter) {
    const native = (constraints.startAfter as unknown as CursorHolder)[
      NATIVE_CURSOR
    ];
    if (native) result.push(startAfter(native));
  }
  return result;
};

const wrapDocSnapshot = <T>(snap: WebDocSnapshot): DocumentSnapshot<T> => ({
  id: snap.id,
  exists: snap.exists(),
  data: () => snap.data() as T | undefined,
});

const wrapQueryDocSnapshot = <T>(
  snap: WebQueryDocSnapshot
): QueryDocumentSnapshot<T> => {
  const wrapped: QueryDocumentSnapshot<T> = {
    id: snap.id,
    exists: true,
    data: () => snap.data() as T,
  };
  Object.defineProperty(wrapped, NATIVE_CURSOR, {
    value: snap,
    enumerable: false,
  });
  return wrapped;
};

const wrapQuerySnapshot = <T>(
  snap: Awaited<ReturnType<typeof getDocs>>
): QuerySnapshot<T> => ({
  docs: snap.docs.map((d) => wrapQueryDocSnapshot<T>(d as WebQueryDocSnapshot)),
  docChanges: () =>
    snap.docChanges().map((change) => ({
      type: change.type,
      doc: wrapQueryDocSnapshot<T>(change.doc as WebQueryDocSnapshot),
    })),
});

const wrapDocRef = <T>(
  db: Firestore,
  path: string,
  id: string
): DocumentRef<T> => ({
  id,
  path: `${path}/${id}`,
  get: () => getDoc(doc(db, path, id)).then(wrapDocSnapshot<T>),
  set: async (data, options) => {
    const ref = doc(db, path, id);
    if (options?.merge) {
      await setDoc(ref, data as object, { merge: true });
    } else {
      await setDoc(ref, data as object);
    }
  },
  update: (data) => updateDoc(doc(db, path, id), data),
  delete: () => deleteDoc(doc(db, path, id)),
  onSnapshot: (cb) =>
    onSnapshot(doc(db, path, id), (snap) => cb(wrapDocSnapshot<T>(snap))),
});

const wrapCollectionRef = <T>(
  db: Firestore,
  path: string
): CollectionRef<T> => ({
  path,
  doc: (id) => {
    const resolvedId = id ?? doc(collection(db, path)).id;
    return wrapDocRef<T>(db, path, resolvedId);
  },
  add: async (data) => {
    const coll = collection(db, path);
    const ref = await addDoc(coll, data as object);
    return wrapDocRef<T>(db, path, ref.id);
  },
  get: async (constraints) => {
    const coll = collection(db, path);
    const q = query(coll, ...buildConstraints(constraints));
    const snap = await getDocs(q);
    return wrapQuerySnapshot<T>(snap);
  },
  count: async (constraints) => {
    const coll = collection(db, path);
    const q = query(coll, ...buildConstraints(constraints));
    const snap = await getCountFromServer(q);
    return snap.data().count;
  },
  onSnapshot: (constraints, cb) => {
    const coll = collection(db, path);
    const q = query(coll, ...buildConstraints(constraints));
    return onSnapshot(q, (snap) => cb(wrapQuerySnapshot<T>(snap)));
  },
});

const makeFieldValues = (): FieldValues => ({
  serverTimestamp: () => serverTimestamp() as unknown as object,
  increment: (n) => increment(n) as unknown as object,
  timestampNow: () => Timestamp.now(),
});

export const createWebFirestoreClient = (db: Firestore): FirestoreClient => ({
  collection: <T>(path: string) => wrapCollectionRef<T>(db, path),
  fieldValues: makeFieldValues(),
});
