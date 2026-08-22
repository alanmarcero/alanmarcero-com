/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import Demo from './Demo';

const props = {
  videoId: 'senhvxSN3PU',
  label: 'Play the demo',
};

describe('Demo', () => {
  it('preserves the original one-way facade when no stop label is supplied', () => {
    render(<Demo {...props} />);

    fireEvent.click(screen.getByRole('button', { name: props.label }));

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByTitle(props.label)).toBeInTheDocument();
  });

  it('can keep a stop cue beside the player and remove the iframe again', () => {
    render(<Demo {...props} stopLabel="Stop the demo" />);
    const cue = screen.getByRole('button', { name: props.label });

    expect(cue).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(cue);

    expect(cue).toHaveAccessibleName('Stop the demo');
    expect(cue).toHaveTextContent('Stop');
    expect(cue).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTitle(props.label)).toBeInTheDocument();

    fireEvent.click(cue);

    expect(screen.queryByTitle(props.label)).not.toBeInTheDocument();
    expect(cue).toHaveAccessibleName(props.label);
    expect(cue).toHaveAttribute('aria-expanded', 'false');
  });
});
