/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import YearOverlayChart from './YearOverlayChart';
import { extractYearRelative } from './yearOverlay';

const SAMPLE_CLOSES = [
  ['2018-01-02', 100],
  ['2018-06-01', 110],
  ['2018-12-31', 90],
  ['2026-01-02', 200],
  ['2026-06-01', 230],
  ['2026-11-13', 220],
];

describe('YearOverlayChart', () => {
  const series2018 = extractYearRelative(SAMPLE_CLOSES, 2018);
  const series2026 = extractYearRelative(SAMPLE_CLOSES, 2026);

  it('draws both 2018 and 2026 polylines and end labels', () => {
    const { container } = render(
      <YearOverlayChart series2018={series2018} series2026={series2026} subject="SPY" />,
    );

    expect(screen.getByRole('img', { name: /SPY 2018 vs 2026 relative percentage performance/i })).toBeInTheDocument();
    expect(container.querySelector('.st-overlay__line--2018')).not.toBeNull();
    expect(container.querySelector('.st-overlay__line--2026')).not.toBeNull();
    expect(container.querySelector('.st-overlay__endlabel--2018')).toHaveTextContent('−10.0%');
    expect(container.querySelector('.dd-chart__endlabel--current')).toHaveTextContent('+10.0%');
  });

  it('shows both years in the tooltip when stepped with arrow keys', () => {
    const { container } = render(
      <YearOverlayChart series2018={series2018} series2026={series2026} subject="SPY" />,
    );

    const svg = container.querySelector('svg[role="img"]');
    fireEvent.keyDown(svg, { key: 'ArrowLeft' });
    // starts from Dec 31 (day 364) stepped back 7 days to Dec 24; 2018 is active, 2026 ended Nov 13
    expect(container.querySelector('.dd-tip__week')).toHaveTextContent('Dec');
    expect(container.querySelector('.dd-tip')).toHaveTextContent('2018');

    // step forward from start of year into June/Jan where both exist
    fireEvent.keyDown(svg, { key: 'ArrowRight' });
    expect(container.querySelector('.dd-tip__week')).toHaveTextContent('Dec 31');
  });
});
