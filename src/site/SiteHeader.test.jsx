/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import SiteHeader from './SiteHeader';
import { EXTERNAL_NAV, SITE_NAV } from './pages';
import { YOUTUBE_CHANNEL_URL } from '../config';

describe('SiteHeader', () => {
  it('links every site page and marks the active one', () => {
    render(<SiteHeader page="plugins" />);

    SITE_NAV.forEach((item) => {
      const link = screen.getByRole('link', { name: item.label });
      expect(link).toHaveAttribute('href', item.href);
    });

    expect(screen.getByRole('link', { name: 'Plugins' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('links the YouTube channel in a new tab', () => {
    render(<SiteHeader page="home" />);

    const youtube = screen.getByRole('link', { name: 'YouTube' });
    expect(EXTERNAL_NAV.map((item) => item.href)).toEqual([YOUTUBE_CHANNEL_URL]);
    expect(youtube).toHaveAttribute('href', YOUTUBE_CHANNEL_URL);
    expect(youtube).toHaveAttribute('target', '_blank');
    expect(youtube).toHaveAttribute('rel', 'noopener noreferrer');
    expect(youtube).not.toHaveAttribute('aria-current');
    expect(youtube.querySelector('.site-nav__mark')).toBeInTheDocument();
  });

  it('opens the menu from the keyboard and closes it on Escape', () => {
    render(<SiteHeader page="home" />);

    const toggle = screen.getByRole('button', { name: 'Open menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'site-menu');

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Site' })).toHaveClass('is-open');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  });
});
