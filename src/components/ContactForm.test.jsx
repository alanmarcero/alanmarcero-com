/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactForm from './ContactForm';
import { mintStamp, sha256Hex } from '../utils/contactStamp';

jest.mock('../utils/contactStamp', () => ({
  mintStamp: jest.fn().mockResolvedValue(42),
  sha256Hex: jest.fn().mockResolvedValue('abc123'),
}));

const fill = () => {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: ' Ada ' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello, lovely patches.' } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: /send message/i }));

describe('ContactForm', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  });

  it('renders the fields and a send button', () => {
    render(<ContactForm />);
    expect(screen.getByLabelText('Name')).toBeRequired();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Message')).toBeRequired();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('hides the honeypot from people and assistive tech', () => {
    const { container } = render(<ContactForm />);
    const trap = container.querySelector('input[name="website"]');
    expect(trap).toHaveAttribute('tabindex', '-1');
    expect(trap.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('posts a stamped message with the body hash CloudFront needs', async () => {
    render(<ContactForm />);
    fill();
    submit();
    expect(await screen.findByText(/on its way/i)).toBeInTheDocument();

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/contact');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ name: 'Ada', email: 'ada@example.com', message: 'Hello, lovely patches.', website: '', nonce: 42 });
    expect(typeof body.elapsedMs).toBe('number');
    expect(mintStamp).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ada', ts: body.ts }));
    expect(sha256Hex).toHaveBeenCalledWith(init.body);
    expect(init.headers['x-amz-content-sha256']).toBe('abc123');
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });

  it('shows the server error and keeps the message', async () => {
    global.fetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Too many messages. Please try again later.' }) });
    render(<ContactForm />);
    fill();
    submit();
    expect(await screen.findByText('Too many messages. Please try again later.')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toHaveValue('Hello, lovely patches.');
  });

  it('falls back to a generic error when the network fails', async () => {
    global.fetch.mockRejectedValue(new TypeError(''));
    render(<ContactForm />);
    fill();
    submit();
    expect(await screen.findByText(/could not be sent/i)).toBeInTheDocument();
  });

  it('disables the form while sending', async () => {
    let resolve;
    global.fetch.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<ContactForm />);
    fill();
    submit();
    expect(await screen.findByRole('button', { name: /sending/i })).toBeDisabled();
    resolve({ ok: true, json: async () => ({}) });
    await waitFor(() => expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled());
  });
});
