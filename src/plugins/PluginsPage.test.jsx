/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import PluginsPage from './PluginsPage';
import { BETA_NOTE, MANAGER, PLUGINS } from './catalog';

describe('PluginsPage', () => {
  it('leads with OpenVST Manager and the beta note', () => {
    render(<PluginsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Plugins' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: MANAGER.name })).toBeInTheDocument();
    expect(screen.getByText(MANAGER.summary)).toBeInTheDocument();

    const download = screen.getByRole('link', { name: 'Download OpenVST Manager' });
    expect(download).toHaveAttribute('href', MANAGER.downloadUrl);
    expect(screen.getByText(BETA_NOTE)).toBeInTheDocument();
  });

  it('lists every plugin with its summary, repo, and screenshot', () => {
    render(<PluginsPage />);

    expect(screen.queryByText('Why does this exist?')).not.toBeInTheDocument();

    PLUGINS.forEach((plugin) => {
      expect(screen.getByRole('heading', { name: plugin.name })).toBeInTheDocument();
      expect(screen.getByText(plugin.summary)).toBeInTheDocument();
    });

    PLUGINS.forEach((plugin) => {
      const repo = screen.getByRole('link', { name: `${plugin.name} on GitHub` });
      expect(repo).toHaveAttribute('href', plugin.repoUrl);
      expect(repo).toHaveAttribute('target', '_blank');
      expect(repo).toHaveAttribute('rel', 'noopener noreferrer');

      const release = screen.getByRole('link', { name: `${plugin.name} release notes` });
      expect(release).toHaveAttribute('href', plugin.releasesUrl);
      expect(release).toHaveAttribute('target', '_blank');
      expect(release).toHaveAttribute('rel', 'noopener noreferrer');
    });

    const kicker = screen.getByRole('img', { name: 'openKicker editor' });
    expect(kicker).toHaveAttribute('src', PLUGINS[0].shotUrl);
    fireEvent.error(kicker);
    expect(screen.getByText('Screenshot unavailable')).toBeInTheDocument();
  });

  it('shows latest release version and notes from GitHub when available', async () => {
    window.sessionStorage?.clear();
    const originalFetch = global.fetch;
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/openEDMKick/releases/latest')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tag_name: 'v3.10.0',
              html_url: 'https://github.com/alanmarcero/openEDMKick/releases/tag/v3.10.0',
              body: '- Zero-delay feedback SVF filters\n\n![shot](https://example.com/shot.png)',
            }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    try {
      render(<PluginsPage />);
      expect(await screen.findByText('v3.10.0')).toBeInTheDocument();
      expect(screen.getByText('- Zero-delay feedback SVF filters')).toBeInTheDocument();
      expect(screen.queryByText(/example\.com\/shot\.png/)).not.toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
