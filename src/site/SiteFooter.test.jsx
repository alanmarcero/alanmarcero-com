/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import SiteFooter from './SiteFooter';
import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from '../config';

describe('SiteFooter', () => {
  it('renders the current year', () => {
    render(<SiteFooter />);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });

  it('links YouTube and GitHub in a new tab', () => {
    render(<SiteFooter />);

    const links = [screen.getByRole('link', { name: 'YouTube' }), screen.getByRole('link', { name: 'GitHub' })];
    expect(links[0]).toHaveAttribute('href', YOUTUBE_CHANNEL_URL);
    expect(links[1]).toHaveAttribute('href', GITHUB_URL);
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('does not link to the removed arcade', () => {
    render(<SiteFooter />);
    expect(screen.queryByRole('link', { name: /arcade/i })).not.toBeInTheDocument();
  });
});
