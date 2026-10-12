import { useState, useRef, useEffect } from 'react';
import ModulePanel from './ModulePanel';
import { CONTACT_URL } from '../config';
import { mintStamp, sha256Hex } from '../utils/contactStamp';

const EMPTY = { name: '', email: '', message: '', website: '' };
const FALLBACK_ERROR = 'Your message could not be sent. Please try again later.';

// POSTs reach the Lambda through CloudFront's origin access control, which
// signs the request but cannot hash the body itself: the viewer must send the
// body's SHA-256 in x-amz-content-sha256.
export async function sendContact(fields, startedAt) {
  const ts = Date.now();
  const name = fields.name.trim();
  const email = fields.email.trim();
  const message = fields.message.trim();
  const nonce = await mintStamp({ ts, name, email, message });
  const body = JSON.stringify({
    name, email, message,
    website: fields.website,
    elapsedMs: ts - startedAt,
    ts,
    nonce,
  });
  const response = await fetch(CONTACT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-amz-content-sha256': await sha256Hex(body),
    },
    body,
  });
  if (response.ok) return;
  const data = await response.json().catch(() => ({}));
  throw new Error(data.error || FALLBACK_ERROR);
}

function ContactForm() {
  const [fields, setFields] = useState(EMPTY);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const startedAt = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    startedAt.current = Date.now();
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const update = (key) => (event) => setFields((f) => ({ ...f, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('sending');
    setError('');
    try {
      await sendContact(fields, startedAt.current);
      if (!mounted.current) return;
      setFields(EMPTY);
      setStatus('sent');
    } catch (err) {
      if (!mounted.current) return;
      setError(err.message || FALLBACK_ERROR);
      setStatus('error');
    }
  };

  const sending = status === 'sending';

  return (
    <ModulePanel className="module contact">
      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="contact-form__row">
          <label className="contact-form__field">
            <span>Name</span>
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={100}
              value={fields.name}
              onChange={update('name')}
              disabled={sending}
            />
          </label>
          <label className="contact-form__field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={fields.email}
              onChange={update('email')}
              disabled={sending}
            />
          </label>
        </div>
        <label className="contact-form__field">
          <span>Message</span>
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={5000}
            rows={6}
            value={fields.message}
            onChange={update('message')}
            disabled={sending}
          />
        </label>

        {/* honeypot: hidden from people and assistive tech; bots fill it in */}
        <div className="contact-form__trap" aria-hidden="true">
          <label>
            Website
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={fields.website}
              onChange={update('website')}
            />
          </label>
        </div>

        <div className="contact-form__actions">
          <button type="submit" className="btn" disabled={sending}>
            {sending ? 'Sending…' : 'Send message'}
          </button>
          <p className="contact-form__status" role="status" aria-live="polite">
            {status === 'sent' && 'Thanks, your message is on its way.'}
            {status === 'error' && <span className="contact-form__error">{error}</span>}
          </p>
        </div>
      </form>
    </ModulePanel>
  );
}

export default ContactForm;
