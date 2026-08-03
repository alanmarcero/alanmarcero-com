/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react';
import Imprint from './Imprint';
import { credits } from './data/plates';
import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from '../config';

/** The credit whose subject is this bank. */
const creditFor = (bank) =>
  screen.getAllByRole('listitem').find((item) => item.textContent.includes(bank));

describe('Imprint', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('credits every photograph the page is allowed to use', () => {
    // CC BY and CC BY-SA are conditional licences: this block is the condition
    // being met. A credit that quietly stops rendering takes the right to show
    // the photograph with it, and nothing else on the page would look wrong.
    render(<Imprint />);

    expect(credits.length).toBeGreaterThan(0);
    expect(screen.getAllByRole('listitem')).toHaveLength(credits.length);

    credits.forEach((credit) => {
      const item = creditFor(credit.bank);
      expect(item).toBeDefined();
      expect(item).toHaveTextContent(credit.author);
      expect(item).toHaveTextContent(credit.licence);
    });
  });

  it('links each licence it names to the licence itself', () => {
    render(<Imprint />);

    const licensed = credits.filter((credit) => credit.licenceUrl);
    expect(licensed.length).toBeGreaterThan(0);

    licensed.forEach((credit) => {
      const link = within(creditFor(credit.bank)).getByRole('link', { name: credit.licence });
      expect(link).toHaveAttribute('href', credit.licenceUrl);
      expect(link.getAttribute('rel')).toContain('noopener noreferrer');
    });
  });

  it('still names the licence of a photograph that has no licence page', () => {
    render(<Imprint />);

    const unlinked = credits.filter((credit) => !credit.licenceUrl);
    unlinked.forEach((credit) => {
      const item = creditFor(credit.bank);
      expect(item).toHaveTextContent(credit.licence);
      expect(within(item).queryByRole('link', { name: credit.licence })).not.toBeInTheDocument();
    });
  });

  it('links back to the file each photograph came from', () => {
    render(<Imprint />);

    credits.filter((credit) => credit.source).forEach((credit) => {
      const source = within(creditFor(credit.bank)).getByRole('link', { name: 'source' });
      expect(source).toHaveAttribute('href', credit.source);
    });
  });

  it('counts the plates it is crediting, not the instruments they show', () => {
    render(<Imprint />);

    // Eight photographs cover far more than eight machines — one bank alone
    // names four — so "instruments" would be a miscount.
    expect(screen.getByText(`Photographs · ${credits.length} plates · Wikimedia Commons`))
      .toBeInTheDocument();
    expect(screen.queryByText(/instruments · Wikimedia Commons/)).not.toBeInTheDocument();
  });

  it('sends the elsewhere links out in a new tab, safely', () => {
    render(<Imprint />);

    const elsewhere = screen.getByRole('navigation', { name: 'Elsewhere' });

    const youtube = within(elsewhere).getByRole('link', { name: /youtube/i });
    expect(youtube).toHaveAttribute('href', YOUTUBE_CHANNEL_URL);
    expect(youtube).toHaveAttribute('rel', 'noopener noreferrer');

    const github = within(elsewhere).getByRole('link', { name: /github/i });
    expect(github).toHaveAttribute('href', GITHUB_URL);
    expect(github).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('keeps the arcade in the same tab, since it is this site', () => {
    render(<Imprint />);

    const arcade = within(screen.getByRole('navigation', { name: 'Elsewhere' }))
      .getByRole('link', { name: /arcade/i });
    expect(arcade).toHaveAttribute('href', '/opus-max-mac-arcade');
    expect(arcade).not.toHaveAttribute('target');
  });

  it('gives every link that opens a new tab the noopener rel', () => {
    // "Opens in a new tab" has no accessible surface to query, so the attribute
    // is the only thing to look at.
    const { container } = render(<Imprint />);

    const external = [...container.querySelectorAll('a[target="_blank"]')];
    expect(external.length).toBeGreaterThan(0);
    external.forEach((link) => {
      expect(link.getAttribute('rel')).toContain('noopener noreferrer');
    });
  });

  it('reads the copyright year off the clock rather than off the markup', () => {
    // Only Date is faked: faking the timer functions as well interferes with
    // React's scheduler.
    jest.useFakeTimers({
      now: new Date('2031-04-05T12:00:00Z'),
      doNotFake: [
        'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
        'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask',
        'requestAnimationFrame', 'cancelAnimationFrame',
        'requestIdleCallback', 'cancelIdleCallback', 'performance', 'hrtime',
      ],
    });

    render(<Imprint />);

    expect(screen.getByText('© 2031 Alan Marcero')).toBeInTheDocument();
  });
});
