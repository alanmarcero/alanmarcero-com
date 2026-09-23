/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import GameCanvas from './GameCanvas';

jest.mock('../games/useGameLoop', () => ({ useGameLoop: () => {} }));

function fakeGameDefinition() {
  const instances = [];
  const factory = () => {
    const instance = {
      onHudUpdate: null,
      init: jest.fn(),
      resize: jest.fn(),
      update: jest.fn(),
      render: jest.fn(),
      handleKeyDown: jest.fn(),
      handleKeyUp: jest.fn(),
      handleTouchAction: jest.fn(),
      destroy: jest.fn(),
    };
    instances.push(instance);
    return instance;
  };
  return { instances, game: { id: 'fake', name: 'Fake', controls: { touch: [] }, factory } };
}

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ({});
});

describe('GameCanvas', () => {
  it('starts a run and shows what the game reports', () => {
    const { game, instances } = fakeGameDefinition();
    render(<GameCanvas game={game} onExit={() => {}} />);

    expect(instances).toHaveLength(1);
    expect(instances[0].init).toHaveBeenCalledTimes(1);

    act(() => instances[0].onHudUpdate({ score: 42, lives: 2, level: 3, gameOver: false }));
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.queryByText('GAME OVER')).not.toBeInTheDocument();
  });

  it('restarts into a fresh run that receives input and resizes', () => {
    const { game, instances } = fakeGameDefinition();
    render(<GameCanvas game={game} onExit={() => {}} />);

    act(() => instances[0].onHudUpdate({ score: 7, lives: 0, level: 1, gameOver: true }));
    fireEvent.click(screen.getByText('Play Again'));

    const [first, second] = instances;
    expect(first.destroy).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('GAME OVER')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    act(() => window.dispatchEvent(new Event('resize')));
    expect(second.handleKeyDown).toHaveBeenCalledWith('ArrowLeft');
    expect(second.resize).toHaveBeenCalled();
    expect(first.resize).not.toHaveBeenCalled();
  });

  it('destroys the live run on unmount', () => {
    const { game, instances } = fakeGameDefinition();
    const { unmount } = render(<GameCanvas game={game} onExit={() => {}} />);
    act(() => instances[0].onHudUpdate({ score: 0, lives: 0, level: 1, gameOver: true }));
    fireEvent.click(screen.getByText('Play Again'));

    unmount();
    expect(instances[1].destroy).toHaveBeenCalledTimes(1);
  });

  it('exits on Escape without passing the key to the game', () => {
    const { game, instances } = fakeGameDefinition();
    const onExit = jest.fn();
    render(<GameCanvas game={game} onExit={onExit} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(instances[0].handleKeyDown).not.toHaveBeenCalled();
  });
});
