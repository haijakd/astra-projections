// astra-mailer: emails Astra Projections contact and quote form messages to the owner.
// Pages projects cannot hold a send_email binding, so the Pages Function (functions/api/contact.js)
// calls sendContact() here over a private service binding. workers_dev is off: no public URL.
import { WorkerEntrypoint } from 'cloudflare:workers';

const FROM = { email: 'contact@astraprojections.com', name: 'Astra Projections website' };
const oneLine = (s) => String(s || '').replace(/[\r\n"]/g, ' ').trim();

export default class Mailer extends WorkerEntrypoint {
  async fetch() {
    return new Response(null, { status: 404 });
  }

  // m = { kind, name, email, subject, phone, package, event, message, country } (validated by contact.js)
  async sendContact(m) {
    const quote = m.kind === 'quote';
    const topic = quote
      ? 'Quote request' + (m.event ? ': ' + oneLine(m.event) : '')
      : oneLine(m.subject) || 'New message';
    const lines = [
      `Name: ${m.name}`,
      `Email: ${m.email}`,
      quote ? `Phone: ${m.phone || '(none)'}` : `Subject: ${m.subject || '(none)'}`,
      ...(quote ? [`Package: ${m.package || '(none)'}`, `Event: ${m.event || '(none)'}`] : []),
      `Country: ${m.country || '?'}`,
    ];
    const res = await this.env.MAIL.send({
      to: this.env.OWNER,
      from: FROM,
      replyTo: { email: m.email, name: oneLine(m.name) },
      subject: `astraprojections.com: ${topic} (from ${oneLine(m.name)})`,
      text:
        lines.join('\n') + `\n\n${m.message || '(no details)'}\n\n--\n` +
        `Sent from the ${quote ? 'Request a Quote form on /services' : 'contact form on /contact'} at astraprojections.com. ` +
        `Hit Reply to answer ${oneLine(m.name)} directly.`,
    });
    return { ok: true, id: res && res.messageId };
  }
}
