import type { Unsubscribe } from './types';

export type DocumentData = Record<string, unknown>;

export type WhereOp =
  | '=='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'in'
  | 'not-in'
  | 'array-contains'
  | 'array-contains-any';

export type OrderDir = 'asc' | 'desc';

export type WhereClause = readonly [field: string, op: WhereOp, value: unknown];
export type OrderByClause = readonly [field: string, dir?: OrderDir];

export interface QueryConstraints {
  where?: ReadonlyArray<WhereClause>;
  orderBy?: ReadonlyArray<OrderByClause>;
  limit?: number;
  // Cursors are opaque for pagination purposes; adapters don't inspect data().
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startAfter?: DocumentSnapshot<any>;
}

export interface DocumentSnapshot<T = DocumentData> {
  readonly id: string;
  readonly exists: boolean;
  data(): T | undefined;
}

export interface QueryDocumentSnapshot<
  T = DocumentData,
> extends DocumentSnapshot<T> {
  data(): T;
}

export interface DocumentChange<T = DocumentData> {
  readonly type: 'added' | 'modified' | 'removed';
  readonly doc: QueryDocumentSnapshot<T>;
}

export interface QuerySnapshot<T = DocumentData> {
  readonly docs: ReadonlyArray<QueryDocumentSnapshot<T>>;
  docChanges(): ReadonlyArray<DocumentChange<T>>;
}

export interface DocumentRef<T = DocumentData> {
  readonly id: string;
  readonly path: string;
  get(): Promise<DocumentSnapshot<T>>;
  set(data: Partial<T>, options?: { merge?: boolean }): Promise<void>;
  update(data: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
  onSnapshot(cb: (snap: DocumentSnapshot<T>) => void): Unsubscribe;
}

export interface CollectionRef<T = DocumentData> {
  readonly path: string;
  doc(id?: string): DocumentRef<T>;
  add(data: Partial<T>): Promise<DocumentRef<T>>;
  get(constraints?: QueryConstraints): Promise<QuerySnapshot<T>>;
  count(constraints?: QueryConstraints): Promise<number>;
  onSnapshot(
    constraints: QueryConstraints | undefined,
    cb: (snap: QuerySnapshot<T>) => void
  ): Unsubscribe;
}

/**
 * Sentinels passed back into set/update. Each adapter returns its SDK-native
 * value; shared code treats them as opaque. All known SDK sentinels are
 * objects, so we return `object` for ergonomic assignment to field types.
 */
export interface FieldValues {
  serverTimestamp(): object;
  increment(n: number): object;
  timestampNow(): object;
}

export interface FirestoreClient {
  collection<T = DocumentData>(path: string): CollectionRef<T>;
  fieldValues: FieldValues;
}
