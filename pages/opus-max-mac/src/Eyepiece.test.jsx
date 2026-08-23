/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Eyepiece from './Eyepiece';

const VIDEO_ID = 'senhvxSN3PU';
const LABEL = 'Hear Sequential Prophet 08 and Rev2, demo 1 of 2';

const setup = (props) =>
  render(<Eyepiece videoId={VIDEO_ID} label={LABEL} value="Demo 1" {...props} />);

const cue = () => screen.getByRole('button');

describe('Eyepiece', () => {
  it('loads nothing from youtube.com before anyone asks for it', () => {
    // The whole reason this component exists. Eleven banks with fourteen demos
    // between them plus the release log would otherwise mean dozens of
    // third-party requests on arrival.
    const { container } = setup();

    expect(container.querySelector('iframe')).not.toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/youtube/i);
  });

  it('offers the cue as a register line with its own figure', () => {
    setup();

    expect(screen.getByText('Hear it')).toBeInTheDocument();
    expect(screen.getByText('Demo 1')).toBeInTheDocument();
  });

  it('mounts the player for the video it was given once the cue is used', () => {
    setup();

    fireEvent.click(cue());

    const player = screen.getByTitle(LABEL);
    expect(player).toHaveAttribute(
      'src',
      `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1`,
    );
  });

  it('takes the player away again rather than leaving it playing out of sight', () => {
    const { container } = setup();

    fireEvent.click(cue());
    expect(container.querySelector('iframe')).toBeInTheDocument();

    fireEvent.click(cue());
    // Gone from the document, not hidden: a hidden iframe keeps playing.
    expect(container.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('turns the cue into a way back out while the player is up', () => {
    setup();

    expect(screen.getByText('Hear it')).toBeInTheDocument();

    fireEvent.click(cue());

    expect(screen.getByText('Stop')).toBeInTheDocument();
    expect(screen.queryByText('Hear it')).not.toBeInTheDocument();
  });

  it('says which video it is, and then that it will stop it', () => {
    setup();

    expect(cue()).toHaveAccessibleName(LABEL);

    fireEvent.click(cue());

    expect(cue()).toHaveAccessibleName(`Stop ${LABEL}`);
  });

  it('reports whether the player is open', () => {
    setup();

    expect(cue()).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(cue());
    expect(cue()).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(cue());
    expect(cue()).toHaveAttribute('aria-expanded', 'false');
  });

  it('uses the cue wording it is given', () => {
    setup({ cue: 'Hear demo 2' });

    expect(screen.getByText('Hear demo 2')).toBeInTheDocument();
  });
});
