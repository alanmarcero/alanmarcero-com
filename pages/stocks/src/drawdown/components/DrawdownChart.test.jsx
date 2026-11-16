/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import DrawdownChart from './DrawdownChart';
import { drawdownEpisodes, underwater } from '../drawdowns';

const SAMPLE_CLOSES = [
  ['2025-01-02', 100],
  ['2025-06-02', 70],
  ['2025-11-14', 85],
];

describe('DrawdownChart', () => {
  it('places the current drawdown label outside the plot area to the right', () => {
    const points = underwater(SAMPLE_CLOSES);
    const episodes = drawdownEpisodes(SAMPLE_CLOSES);
    const { container } = render(
      <DrawdownChart points={points} episodes={episodes} subject="Sample" />,
    );

    const dot = container.querySelector('.dd-chart__dot--current');
    const label = container.querySelector('.dd-chart__endlabel--current');

    expect(dot).not.toBeNull();
    expect(label).not.toBeNull();
    expect(label).toHaveTextContent('−15.0%');
    expect(label).toHaveAttribute('text-anchor', 'start');
    expect(Number(label.getAttribute('x'))).toBeGreaterThan(Number(dot.getAttribute('cx')));
  });
});
