// POST /api/contact: validates the contact form (/contact) or quote form (/services), saves it to D1
// (binding DB), then emails it (binding MAILER). Same pattern as haijak.tv.
// Works with and without JavaScript: fetch() asks for JSON, a plain form post gets a 303 back to the form.
// MAILER is a private service binding to the astra-mailer Worker (mailer/), which holds the send_email
// binding (Pages cannot) locked to the owner's one verified Email Routing destination.
// The D1 copy is written first: if the email fails, the message is still kept and the visitor still gets "sent".

const LIMITS = { name: 100, email: 254, subject: 150, phone: 40, package: 100, event: 150, message: 5000 };
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
const PER_IP_PER_HOUR = 5;

export async function onRequestPost({ request, env }) {
  const wantsJson = (request.headers.get('Accept') || '').includes('application/json');
  let kind = 'contact';
  const back = () => (kind === 'quote' ? '/services' : '/contact');
  const anchor = () => (kind === 'quote' ? '#quote' : '#form');
  const reply = (ok, error, status) => wantsJson
    ? Response.json(ok ? { ok: true } : { ok: false, error }, { status })
    : Response.redirect(new URL(back() + (ok ? '?sent=1' : '?error=1') + anchor(), request.url).toString(), 303);

  let form;
  try { form = await request.formData(); } catch { return reply(false, 'Could not read the form.', 400); }
  const f = (k) => String(form.get(k) || '').trim();
  if (f('kind') === 'quote') kind = 'quote';

  // honeypot: real visitors never see or fill this field; bots get a fake success
  if (f('website')) return reply(true, null, 200);

  // the quote form calls its free-text box "details"; both land in message
  const data = {
    name: f('name'), email: f('email'), subject: f('subject'), phone: f('phone'),
    package: f('package'), event: f('event'), message: f('message') || f('details'),
  };
  if (!data.name) return reply(false, 'Please enter your name.', 400);
  if (!EMAIL_RE.test(data.email)) return reply(false, 'Please enter a valid email address.', 400);
  if (!data.message) return reply(false, kind === 'quote' ? 'Please add some project details.' : 'Please write a message.', 400);
  for (const k in LIMITS) if (data[k].length > LIMITS[k]) return reply(false, `The ${k} is too long.`, 400);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM messages WHERE ip = ? AND created_at > datetime('now', '-1 hour')"
  ).bind(ip).first('n');
  if (ip && recent >= PER_IP_PER_HOUR) return reply(false, 'Too many messages from this connection. Please try again later.', 429);

  const country = request.headers.get('CF-IPCountry') || '';
  await env.DB.prepare(
    'INSERT INTO messages (kind, name, email, subject, phone, package, event, message, ip, country, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(kind, data.name, data.email, data.subject, data.phone, data.package, data.event, data.message, ip,
    country, (request.headers.get('User-Agent') || '').slice(0, 300)).run();

  if (env.MAILER) {
    try {
      await env.MAILER.sendContact({ kind, ...data, country });
    } catch (e) {
      console.error('contact email failed', e && e.code, e && e.message); // message is safe in D1
    }
  }

  return reply(true, null, 200);
}

export const onRequest = () => new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
