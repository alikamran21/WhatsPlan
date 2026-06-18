import admin from "firebase-admin";

/**
 * Firestore-backed store. Uses Application Default Credentials, i.e. the
 * service-account JSON pointed to by GOOGLE_APPLICATION_CREDENTIALS.
 * API-compatible with MemoryStore.
 */
export class FirestoreStore {
  constructor(config) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: config.firebaseProjectId || undefined,
      });
    }
    this.db = admin.firestore();
  }

  async upsert(col, id, doc) {
    const data = { ...doc, id };
    await this.db.collection(col).doc(String(id)).set(data, { merge: true });
    return data;
  }

  async get(col, id) {
    const snap = await this.db.collection(col).doc(String(id)).get();
    return snap.exists ? snap.data() : null;
  }

  async delete(col, id) {
    await this.db.collection(col).doc(String(id)).delete();
  }

  async list(col, { where = [], orderBy, dir = "desc", limit } = {}) {
    let q = this.db.collection(col);
    for (const [field, op, val] of where) q = q.where(field, op, val);
    if (orderBy) q = q.orderBy(orderBy, dir);
    if (limit) q = q.limit(limit);
    const snap = await q.get();
    return snap.docs.map((d) => d.data());
  }
}
