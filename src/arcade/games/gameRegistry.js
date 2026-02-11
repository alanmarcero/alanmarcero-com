import { SpaceInvaders } from './space-invaders/SpaceInvaders';
import { Asteroids } from './asteroids/Asteroids';
import { Tetris } from './tetris/Tetris';

export const games = [
  {
    id: 'space-invaders',
    name: 'Space Invaders',
    description: 'Defend Earth from waves of alien invaders',
    accent: '#00e5ff',
    controls: {
      keyboard: { left: 'ArrowLeft', right: 'ArrowRight', fire: 'Space' },
      touch: ['left', 'right', 'fire'],
    },
    factory: () => new SpaceInvaders(),
  },
  {
    id: 'asteroids',
    name: 'Asteroids',
    description: 'Navigate and blast through an asteroid field',
    accent: '#b829f5',
    controls: {
      keyboard: { left: 'ArrowLeft', right: 'ArrowRight', thrust: 'ArrowUp', fire: 'Space' },
      touch: ['left', 'right', 'thrust', 'fire'],
    },
    factory: () => new Asteroids(),
  },
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Stack and clear lines before they reach the top',
    accent: '#ff4500',
    controls: {
      keyboard: { left: 'ArrowLeft', right: 'ArrowRight', down: 'ArrowDown', rotate: 'ArrowUp', drop: 'Space' },
      touch: ['left', 'right', 'down', 'rotate', 'drop'],
    },
    factory: () => new Tetris(),
  },
];
