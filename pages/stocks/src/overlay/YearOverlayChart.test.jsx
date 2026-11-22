/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import YearOverlayChart from './YearOverlayChart';
import { extractYearRelative } from './yearOverlay';

const SAMPLE_CLOSES = [
  ['2020-01-02', 100],
  ['2020-06-01', 110],
  ['2020-12-31', 90],
  ['2026-01-02', 200],
  ['2026-06-01', 230],
  ['2026-11-13', 220],
];

describe('YearOverlayChart', () => {
  const baseSeries = extractYearRelative(SAMPLE_CLOSES, 2020);
  const currentSeries = extractYearRelative(SAMPLE_CLOSES, 2026);

  it('draws both comparison and 2026 polylines and end labels', () => {
    const { container } = render(
      <YearOverlayChart
        baseYear={2020}
        currentYear={2026}
        baseSeries={baseSeries}
        currentSeries={currentSeries}
        subject="SPY"
      />,
    );

    expect(screen.getByRole('img', { name: /SPY 2020 vs 2026 relative percentage performance/i })).toBeInTheDocument();
    expect(container.querySelector('.st-overlay__line--base')).not.toBeNull();
    expect(container.querySelector('.st-overlay__line--current')).not.toBeNull();
    expect(container.querySelector('.st-overlay__endlabel--base')).toHaveTextContent('−10.0%');
    expect(container.querySelector('.dd-chart__endlabel--current')).toHaveTextContent('+10.0%');
    expect(container.querySelector('.st-overlay__chart-corr')).toHaveTextContent(/^Correlation [+\u2212]?\d+%$/);
  });

  it('shows the comparison year in the tooltip when stepped with arrow keys', () => {
    const { container } = render(
      <YearOverlayChart
        baseYear={2020}
        currentYear={2026}
        baseSeries={baseSeries}
        currentSeries={currentSeries}
        subject="SPY"
      />,
    );

    const svg = container.querySelector('svg[role="img"]');
    fireEvent.keyDown(svg, { key: 'ArrowLeft' });
    expect(container.querySelector('.dd-tip__week')).toHaveTextContent('Nov 13');
    expect(container.querySelector('.dd-tip')).toHaveTextContent('2020');

    fireEvent.keyDown(svg, { key: 'ArrowRight' });
    expect(container.querySelector('.dd-tip__week')).toHaveTextContent('Dec 31');

    svg.getBoundingClientRect = () => ({ left: 0, width: 1000 });
    fireEvent(svg, new MouseEvent('pointermove', { bubbles: true, clientX: 500 }));
    expect(container.querySelector('.dd-tip__week')).toHaveTextContent('Jun 1');
  });
});
