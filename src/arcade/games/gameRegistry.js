import { SpaceInvaders } from './space-invaders/SpaceInvaders';
import { Asteroids } from './asteroids/Asteroids';
import { Tetris } from './tetris/Tetris';
import { PacMan } from './pac-man/PacMan';

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
  {
    id: 'pac-man',
    name: 'Pac-Man',
    description: 'Eat dots and avoid ghosts in the maze',
    accent: '#ff4500',
    controls: {
      keyboard: { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' },
      touch: ['left', 'right', 'up', 'down'],
    },
    factory: () => new PacMan(),
  },
];
