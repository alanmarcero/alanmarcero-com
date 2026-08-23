/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Finder from './Finder';

const LABEL = 'Find an instrument or a track';

const setup = (props) => {
  const onQueryChange = jest.fn();
  const view = render(
    <Finder
      query=""
      onQueryChange={onQueryChange}
      bankCount={11}
      trackCount={0}
      {...props}
    />,
  );
  return { ...view, onQueryChange, field: screen.getByLabelText(LABEL) };
};

describe('Finder', () => {
  it('names the field, so a reader arriving at it is told what it searches', () => {
    // getByLabelText only finds the input if the label really is associated
    // with it — the field has no box of its own to imply the pairing.
    const { field } = setup({ query: 'Nord' });

    expect(field).toHaveValue('Nord');
  });

  it('hands every keystroke straight to its caller', () => {
    const { field, onQueryChange } = setup();

    fireEvent.change(field, { target: { value: 'Virus' } });

    expect(onQueryChange).toHaveBeenCalledWith('Virus');
  });

  it('clears the query on Escape and leaves the cursor where you were typing', () => {
    const { field, onQueryChange } = setup({ query: 'Nord' });

    fireEvent.keyDown(field, { key: 'Escape' });

    expect(onQueryChange).toHaveBeenCalledWith('');
    expect(field).toHaveFocus();
  });

  it('does nothing on Escape when there is nothing to clear', () => {
    const { field, onQueryChange } = setup({ query: '' });

    fireEvent.keyDown(field, { key: 'Escape' });

    expect(onQueryChange).not.toHaveBeenCalled();
  });

  it('leaves other keys alone', () => {
    const { field, onQueryChange } = setup({ query: 'Nord' });

    fireEvent.keyDown(field, { key: 'Enter' });

    expect(onQueryChange).not.toHaveBeenCalled();
  });

  it('says nothing about results until there is a query', () => {
    setup({ query: '' });

    // A live region that starts out reading "11 banks · 0 releases" announces a
    // result for a search nobody has made.
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('announces both counts once there is a query', () => {
    setup({ query: 'Nord', bankCount: 2, trackCount: 7 });

    expect(screen.getByRole('status')).toHaveTextContent('2 banks · 7 releases');
  });

  it('counts a search that found nothing rather than going quiet', () => {
    setup({ query: 'zzzz', bankCount: 0, trackCount: 0 });

    expect(screen.getByRole('status')).toHaveTextContent('0 banks · 0 releases');
  });
});
