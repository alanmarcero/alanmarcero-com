/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import ModulePanel from './ModulePanel';

describe('ModulePanel', () => {
  it('renders children inside the module chassis', () => {
    render(
      <ModulePanel>
        <h3 className="module__title">Test Module</h3>
      </ModulePanel>
    );
    expect(screen.getByText('Test Module')).toBeInTheDocument();
  });

  it('renders as an article with the module class', () => {
    const { container } = render(<ModulePanel>content</ModulePanel>);
    const article = container.querySelector('article.module');
    expect(article).toBeInTheDocument();
  });

  it('renders a decorative LED hidden from assistive tech', () => {
    const { container } = render(<ModulePanel>content</ModulePanel>);
    const led = container.querySelector('.module__led');
    expect(led).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards style for stagger indexing', () => {
    const { container } = render(
      <ModulePanel style={{ '--card-index': 3 }}>content</ModulePanel>
    );
    const panel = container.querySelector('.module');
    expect(panel.style.getPropertyValue('--card-index')).toBe('3');
  });
});
