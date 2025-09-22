import fetch from 'node-fetch';
import sample from '../fixtures/sample-event.json';
const endpoint = process.env.INGEST_URL || 'http://localhost:8080/api/ingest/content';
const token = process.env.TTG_INGEST_TOKEN || 'dev-token';
async function send() {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-service-token': token },
    body: JSON.stringify(sample)
  });
  console.log('status', res.status);
  console.log(await res.text());
}
send().catch(err=>{ console.error(err); process.exit(1); });
