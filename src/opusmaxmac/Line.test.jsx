/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Line from './Line';

describe('Line', () => {
  it('puts the label and the figure it belongs to in the same row', () => {
    render(<Line value="128 patches">Sequential Prophet 08 and Rev2</Line>);

    expect(screen.getByText('Sequential Prophet 08 and Rev2')).toBeInTheDocument();
    expect(screen.getByText('128 patches')).toBeInTheDocument();
  });

  it('is something to read, not something to do, until a caller asks', () => {
    render(<Line value="128 patches">Nord Lead 3 and Nord Rack 3</Line>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('becomes a button when asked, and the whole row is the hit target', () => {
    const onClick = jest.fn();
    render(<Line as="button" value="Demo" onClick={onClick}>Hear it</Line>);

    expect(screen.getByRole('button')).toBeInTheDocument();

    // The figure end of the row, not the label, because a reader aiming at a
    // register line aims at whichever end they were reading.
    fireEvent.click(screen.getByText('Demo'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('becomes a link when asked, and keeps its destination', () => {
    render(<Line as="a" value="Zip" href="/banks/Alan-M_CODEX.zip">Download</Line>);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/banks/Alan-M_CODEX.zip');
  });

  it('renders a button that does not submit', () => {
    // A bare <button> defaults to type="submit". Every action on this page is a
    // button rendered by this component, so getting the default wrong would make
    // "Hear it" submit any form it ever sits inside.
    render(<Line as="button" value="Demo">Hear it</Line>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('still lets a caller ask for a submit button', () => {
    render(<Line as="button" type="submit" value="Go">Send</Line>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('leaves a link without a type, which would mean something else there', () => {
    // type on an <a> is the destination's MIME type, so leaking the button
    // default onto a link would be a lie about the file at the other end.
    render(<Line as="a" value="Zip" href="/banks/audio-demo-midis.zip">Download</Line>);

    expect(screen.getByRole('link')).not.toHaveAttribute('type');
  });

  it('passes the props a caller adds through to the element it renders', () => {
    render(
      <Line
        as="a"
        value="Channel"
        href="https://youtube.com/@alanmarcero"
        target="_blank"
        rel="noopener noreferrer"
        download
        aria-label="Download the Waves CODEX bank"
      >
        Subscribe on YouTube
      </Line>,
    );

    const link = screen.getByRole('link', { name: 'Download the Waves CODEX bank' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('download');
  });

  it('hides the run of leader dots from assistive technology', () => {
    const { container } = render(<Line as="button" value="Zip">Download</Line>);

    const leader = container.querySelector('[aria-hidden="true"]');
    expect(leader).toBeInTheDocument();
    // The dots are drawn in CSS rather than typed in, so there is nothing here
    // for a screen reader to read out between the label and the figure.
    expect(leader).toBeEmptyDOMElement();
    expect(screen.getByRole('button')).toHaveTextContent(/^DownloadZip$/);
  });
});
