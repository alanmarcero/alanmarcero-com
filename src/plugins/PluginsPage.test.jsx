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
    });

    const kicker = screen.getByRole('img', { name: 'openKicker editor' });
    expect(kicker).toHaveAttribute('src', PLUGINS[0].shotUrl);
    fireEvent.error(kicker);
    expect(screen.getByText('Screenshot unavailable')).toBeInTheDocument();
  });
});
