import { SpaceInvaders } from './space-invaders/SpaceInvaders';
import { Asteroids } from './asteroids/Asteroids';
import { Tetris } from './tetris/Tetris';
import { PacMan } from './pac-man/PacMan';
import { Breakout } from './breakout/Breakout';
import { Frogger } from './frogger/Frogger';
import { Snake } from './snake/Snake';
import { Pong } from './pong/Pong';
import { RhythmCatcher } from './rhythm/RhythmCatcher';
import { Centipede } from './centipede/Centipede';

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
  {
    id: 'breakout',
    name: 'Breakout',
    description: 'Smash bricks with a bouncing ball',
    accent: '#00e5ff',
    controls: {
      keyboard: { left: 'ArrowLeft', right: 'ArrowRight', launch: 'Space' },
      touch: ['left', 'right', 'fire'],
    },
    factory: () => new Breakout(),
  },
  {
    id: 'frogger',
    name: 'Frogger',
    description: 'Cross traffic and rivers to reach safety',
    accent: '#b829f5',
    controls: {
      keyboard: { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' },
      touch: ['left', 'right', 'up', 'down'],
    },
    factory: () => new Frogger(),
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Eat food and grow without hitting yourself',
    accent: '#00e5ff',
    controls: {
      keyboard: { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' },
      touch: ['left', 'right', 'up', 'down'],
    },
    factory: () => new Snake(),
  },
  {
    id: 'pong',
    name: 'Pong',
    description: 'Classic paddle ball against the CPU',
    accent: '#b829f5',
    controls: {
      keyboard: { up: 'ArrowUp', down: 'ArrowDown' },
      touch: ['up', 'down'],
    },
    factory: () => new Pong(),
  },
  {
    id: 'rhythm',
    name: 'Rhythm Catcher',
    description: 'Catch falling notes with perfect timing',
    accent: '#ff4500',
    controls: {
      keyboard: { left: 'ArrowLeft', down: 'ArrowDown', up: 'ArrowUp', right: 'ArrowRight' },
      touch: ['left', 'down', 'up', 'right'],
    },
    factory: () => new RhythmCatcher(),
  },
  {
    id: 'centipede',
    name: 'Centipede',
    description: 'Blast the centipede through a mushroom field',
    accent: '#ff4500',
    controls: {
      keyboard: { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', fire: 'Space' },
      touch: ['left', 'right', 'up', 'down', 'fire'],
    },
    factory: () => new Centipede(),
  },
];
