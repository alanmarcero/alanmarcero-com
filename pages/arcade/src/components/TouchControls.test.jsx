/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import TouchControls from './TouchControls';

const labels = () => screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'));

describe('TouchControls', () => {
  it('renders only the buttons a game asks for', () => {
    render(<TouchControls controls={['left', 'right', 'fire']} onAction={() => {}} />);
    expect(labels()).toEqual(['left', 'right', 'fire']);
  });

  it('gives the top d-pad slot to thrust ahead of up', () => {
    render(<TouchControls controls={['left', 'right', 'thrust', 'up']} onAction={() => {}} />);
    expect(labels()[0]).toBe('thrust');
  });

  it('puts rotate in the top slot and among the actions when there is no up', () => {
    render(<TouchControls controls={['left', 'right', 'down', 'rotate', 'drop']} onAction={() => {}} />);
    expect(labels()).toEqual(['rotate', 'left', 'down', 'right', 'drop', 'rotate']);
  });

  it('reports one press and one release per touch', () => {
    const onAction = jest.fn();
    render(<TouchControls controls={['fire']} onAction={onAction} />);
    const fire = screen.getByRole('button', { name: 'fire' });

    fireEvent.touchStart(fire);
    fireEvent.touchStart(fire);
    fireEvent.touchEnd(fire);
    fireEvent.touchCancel(fire);

    expect(onAction.mock.calls).toEqual([['fire', true], ['fire', false]]);
  });
});
