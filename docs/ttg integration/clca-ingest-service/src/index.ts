import express from 'express';
import admin from 'firebase-admin';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import contentSchema from './schemas/contentdoc.schema.json';
import { v4 as uuidv4 } from 'uuid';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(contentSchema);

const app = express();
app.use(express.json({ limit: '512kb' }));

// Initialize Firebase Admin if credentials provided
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
} else {
  try {
    admin.initializeApp();
  } catch (e: any) {
    console.warn('Firebase admin init skipped or already initialized:', e.message || e);
  }
}

const db = admin.firestore();

// Simple auth middleware using service token
function verifyServiceToken(req: express.Request, res: express.Response, next: Function) {
  const token = req.header('x-service-token') || req.header('authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'missing token' });
  if (!process.env.TTG_INGEST_TOKEN) return res.status(500).json({ error: 'server misconfiguration: no ingest token' });
  if (token !== process.env.TTG_INGEST_TOKEN) return res.status(403).json({ error: 'invalid token' });
  next();
}

app.post('/api/ingest/content', verifyServiceToken, async (req, res) => {
  const payload = req.body;
  const ok = validate(payload);
  if (!ok) return res.status(400).json({ error: 'invalid payload', details: validate.errors });

  const { ownerSystem, originalId, updatedAt } = payload as any;
  if (!ownerSystem || !originalId) return res.status(400).json({ error: 'ownerSystem+originalId required' });

  try {
    const coll = db.collection('content');
    const q = coll.where('ownerSystem', '==', ownerSystem).where('originalId', '==', originalId).limit(1);
    const snap = await q.get();

    if (!snap.empty) {
      const docRef = snap.docs[0].ref;
      const existing = snap.docs[0].data() as any;
      if (existing.updatedAt === updatedAt) {
        return res.status(200).json({ status: 'noop', id: docRef.id });
      }
      if (new Date(existing.updatedAt).getTime() > new Date(updatedAt).getTime()) {
        return res.status(409).json({ error: 'incoming updatedAt older than existing', id: docRef.id });
      }
      await docRef.update({
        ...payload,
        lastIngestedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.status(200).json({ status: 'updated', id: docRef.id });
    } else {
      const docRef = await coll.add({
        ...payload,
        createdAt: payload.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        lastIngestedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.status(201).json({ status: 'created', id: docRef.id });
    }
  } catch (err: any) {
    console.error('ingest error', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

app.post('/api/ingest/content/delete', verifyServiceToken, async (req, res) => {
  const { ownerSystem, originalId } = req.body;
  if (!ownerSystem || !originalId) return res.status(400).json({ error: 'ownerSystem+originalId required' });
  try {
    const coll = db.collection('content');
    const q = coll.where('ownerSystem', '==', ownerSystem).where('originalId', '==', originalId).limit(1);
    const snap = await q.get();
    if (snap.empty) return res.status(404).json({ error: 'not found' });
    await snap.docs[0].ref.update({ status: 'archived', archivedAt: admin.firestore.FieldValue.serverTimestamp() });
    return res.status(200).json({ status: 'archived' });
  } catch (err: any) {
    console.error('delete error', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

// Simple public GET for published content (cursor-based lightweight)
app.get('/api/content/published', async (req, res) => {
  try {
    const system = req.query.system as string | undefined;
    const limit = Math.min(50, parseInt((req.query.limit as string) || '25', 10));
    let q: FirebaseFirestore.Query = db.collection('content').where('status', '==', 'published');
    if (system) q = q.where('ownerSystem', '==', system);
    q = q.orderBy('updatedAt', 'desc').limit(limit);
    const snap = await q.get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const after = items.length ? items[items.length - 1].updatedAt : null;
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json({ items, after });
  } catch (err: any) {
    console.error('published fetch error', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

const port = parseInt(process.env.PORT || '8080', 10);
app.listen(port, () => {
  console.log(`CLCA ingest service listening on port ${port}`);
});
