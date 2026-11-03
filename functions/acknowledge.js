// Cloudflare Pages Function -> POST /acknowledge
// Turns a member's personal ENTRY code (shown by the Discord bot) into a CONFIRMATION code.
// Needs the environment variable RULES_SECRET (same value as on the bot's Render service).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

export async function onRequestPost({ request, env }) {
  if (!env.RULES_SECRET) return json({ error: 'not_configured' }, 500);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'bad_request' }, 400); }
  const entry = String((body && body.code) || '').toUpperCase().replace(/[\s-]/g, '');
  if (!/^[A-HJ-NP-Z2-9]{8}$/.test(entry)) return json({ error: 'invalid_code' }, 400);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.RULES_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('pl-rules-v1:' + entry)));
  let out = '';
  for (let n = 0; n < 10; n++) out += ALPHABET[mac[n] % ALPHABET.length];
  return json({ confirmation: out.slice(0, 5) + '-' + out.slice(5) });
}

export function onRequest() { return json({ error: 'method_not_allowed' }, 405); }
