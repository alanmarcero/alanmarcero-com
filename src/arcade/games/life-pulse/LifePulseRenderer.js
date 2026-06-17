import { CYAN, VIOLET, ORANGE, BG, WHITE, MUTED } from '../palette';

const GAME_W = 640;
const GAME_H = 360;

// Bio-lab palette — richer than base arcade palette
const BIO = {
  deep: '#0a0818',
  vein: '#1a1535',
  membrane: '#2d1f4e',
  glow: '#00e8d4',
  glowSoft: 'rgba(0, 232, 212, 0.35)',
  coral: '#ff6b4a',
  coralSoft: 'rgba(255, 107, 74, 0.45)',
  spore: '#b8f0e8',
  nucleus: '#ffe566',
  acid: '#7cff9a',
  blood: '#ff3d6b',
};

const POWERUP_COLORS = {
  double: '#ffe566',
  shield: '#7cffe0',
  speed: '#ffeb3b',
  pulse: '#00e8d4',
  option: '#a0fff4',
  laser: '#7cffe0',
  bomb: '#ff6b4a',
  homing: '#ffe566',
  overcharge: '#ffffff',
  nova: '#ff5722',
  focus: '#7cffe0',
  chain: '#ffe566',
  reflect: '#a0fff4',
  swarm: '#ff3d6b',
  vortex: '#c840ff',
  echo: '#a0fff4',
  orbit: '#00f0ff',
  charge: '#ffe566',
};

function withGlow(ctx, color, blur, fn) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  fn();
  ctx.restore();
}

function drawVein(ctx, x1, y1, cx, cy, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.stroke();
}

export function drawBackground(ctx, state) {
  const { time, scroll, pulseCharge = 0 } = state;
  const heartbeat = 0.5 + Math.sin(time * 2.8) * 0.5;
  const pulseGlow = (pulseCharge / 100) * 0.12;

  // Deep gradient field
  const grad = ctx.createLinearGradient(0, 0, GAME_W, GAME_H);
  grad.addColorStop(0, BIO.deep);
  grad.addColorStop(0.45, '#120e28');
  grad.addColorStop(1, '#0d1220');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Heartbeat ambient pulse (signature Life Pulse feel)
  ctx.fillStyle = `rgba(0, 232, 212, ${0.04 + heartbeat * 0.03 + pulseGlow})`;
  ctx.beginPath();
  ctx.ellipse(GAME_W * 0.35, GAME_H * 0.5, 180 + heartbeat * 20, 120 + heartbeat * 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Parallax organic veins — layer 1 (slow)
  const s1 = scroll * 0.5;
  ctx.globalAlpha = 0.28;
  for (let i = 0; i < 6; i++) {
    const baseX = ((i * 127 - s1) % (GAME_W + 120)) - 60;
    const sway = Math.sin(time * 0.7 + i * 1.3) * 18;
    drawVein(
      ctx,
      baseX, 8,
      baseX + 45 + sway, GAME_H * 0.4,
      baseX - 20 + sway * 0.5, GAME_H - 10,
      `rgba(90, 60, 140, ${0.35 + i * 0.04})`,
      2.2
    );
  }

  // Layer 2 (faster, brighter)
  const s2 = scroll * 1.4;
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 8; i++) {
    const baseX = ((i * 89 - s2) % (GAME_W + 80)) - 40;
    const y = 20 + (i * 41) % (GAME_H - 40);
    drawVein(
      ctx,
      baseX, y,
      baseX + 30, y + 25,
      baseX + 55, y + 8,
      `rgba(0, 200, 180, ${0.25 + Math.sin(time + i) * 0.08})`,
      1.4
    );
  }
  ctx.globalAlpha = 1;

  // Floating spores / cells
  for (let i = 0; i < 28; i++) {
    const seed = i * 97.3;
    const x = ((seed + scroll * (0.15 + (i % 3) * 0.08)) % (GAME_W + 40)) - 20;
    const y = 12 + ((seed * 0.37) % (GAME_H - 24));
    const r = 1.2 + Math.sin(time * 1.8 + seed) * 0.8;
    const alpha = 0.12 + Math.sin(time * 2.2 + i) * 0.06;
    ctx.fillStyle = i % 4 === 0 ? `rgba(255, 107, 74, ${alpha})` : `rgba(0, 232, 212, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let y = 0; y < GAME_H; y += 3) {
    ctx.fillRect(0, y, GAME_W, 1);
  }
}

export function drawPlayer(ctx, state) {
  const { player, time, powerLevel, timers } = state;
  if (!player.alive) return;

  const { x: px, y: py, invuln, speedTimer } = player;
  const flicker = invuln > 0 ? (Math.floor(time * 18) % 2 === 0 ? 0.35 : 1) : 1;
  ctx.globalAlpha = flicker;

  const boosted = speedTimer > 0;
  const overcharge = timers.overcharge > 0;
  const laser = timers.laser > 0;
  const focus = timers.focus > 0;
  const power = powerLevel;

  // Thruster particles
  const thrustLen = 8 + Math.sin(time * 22) * 3 + (boosted ? 5 : 0);
  withGlow(ctx, BIO.coral, 12, () => {
    const tg = ctx.createLinearGradient(px - 18, py, px - 18 - thrustLen, py);
    tg.addColorStop(0, BIO.coral);
    tg.addColorStop(0.5, ORANGE);
    tg.addColorStop(1, 'rgba(255, 87, 34, 0)');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(px - 12, py - 3);
    ctx.lineTo(px - 12 - thrustLen, py);
    ctx.lineTo(px - 12, py + 3);
    ctx.closePath();
    ctx.fill();
  });

  if (boosted) {
    ctx.strokeStyle = 'rgba(255, 230, 180, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const off = i * 4;
      ctx.beginPath();
      ctx.moveTo(px - 16 - off, py - 2);
      ctx.lineTo(px - 26 - off, py);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }

  // Ship body — organic arrow with membrane wings
  withGlow(ctx, overcharge ? WHITE : BIO.glow, overcharge ? 18 : 10, () => {
    const hull = overcharge ? '#e8ffff' : (power >= 2 ? '#9afff0' : (power >= 1 ? '#6ef5e8' : BIO.glow));
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(px + 14, py);
    ctx.bezierCurveTo(px + 4, py - 10, px - 8, py - 9, px - 12, py - 4);
    ctx.lineTo(px - 14, py);
    ctx.lineTo(px - 12, py + 4);
    ctx.bezierCurveTo(px - 8, py + 9, px + 4, py + 10, px + 14, py);
    ctx.closePath();
    ctx.fill();

    // Wing membranes
    ctx.fillStyle = overcharge ? 'rgba(255, 230, 120, 0.5)' : 'rgba(0, 200, 180, 0.35)';
    ctx.beginPath();
    ctx.moveTo(px - 2, py - 6);
    ctx.quadraticCurveTo(px - 10, py - 14, px - 6, py - 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px - 2, py + 6);
    ctx.quadraticCurveTo(px - 10, py + 14, px - 6, py + 2);
    ctx.closePath();
    ctx.fill();

    // Core nucleus
    ctx.fillStyle = overcharge ? BIO.nucleus : WHITE;
    ctx.beginPath();
    ctx.arc(px + 2, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Shield bubble
  if (invuln > 2.5) {
    const sr = 16 + Math.sin(time * 6) * 1.5;
    ctx.strokeStyle = `rgba(124, 255, 224, ${0.5 + Math.sin(time * 8) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, sr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // Power auras
  if (overcharge) {
    const ar = 20 + Math.sin(time * 11) * 3;
    ctx.strokeStyle = 'rgba(255, 230, 120, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, ar, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
  if (focus) {
    ctx.strokeStyle = 'rgba(124, 255, 224, 0.55)';
    ctx.lineWidth = 1.5;
    const fr = 13 + Math.sin(time * 9) * 2;
    ctx.beginPath();
    ctx.arc(px, py, fr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(px, py, fr * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
  }
  if (laser && !overcharge) {
    ctx.strokeStyle = 'rgba(160, 255, 240, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px + 4, py, 12 + Math.sin(time * 14) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  ctx.globalAlpha = 1;
}

export function drawBullet(ctx, b) {
  if (b.charge) {
    withGlow(ctx, BIO.nucleus, 16, () => {
      const len = 34;
      const g = ctx.createLinearGradient(b.x, b.y, b.x + len, b.y);
      g.addColorStop(0, 'rgba(255, 230, 102, 0.2)');
      g.addColorStop(0.4, BIO.nucleus);
      g.addColorStop(1, WHITE);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(b.x + len * 0.4, b.y, len * 0.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (b.laser) {
    withGlow(ctx, '#a0fff4', 10, () => {
      const len = b.vy === 0 ? 28 : 20;
      ctx.fillStyle = '#a0fff4';
      ctx.fillRect(b.x - 1, b.y - 1.5, len, 3);
      ctx.fillStyle = WHITE;
      ctx.fillRect(b.x + len * 0.5, b.y - 0.8, 6, 1.6);
    });
  } else {
    withGlow(ctx, BIO.glow, 6, () => {
      ctx.fillStyle = b.echo ? 'rgba(160, 255, 240, 0.7)' : BIO.glow;
      ctx.beginPath();
      ctx.arc(b.x + 4, b.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0, 232, 212, 0.35)';
      const len = b.vy === 0 ? 8 : 6;
      ctx.fillRect(b.x - 1, b.y - 0.8, len, 1.6);
    });
  }
}

export function drawEnemyBullet(ctx, b) {
  withGlow(ctx, BIO.coral, 5, () => {
    ctx.fillStyle = BIO.coral;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(b.x + 3, b.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

export function drawEnemy(ctx, e, time) {
  const ex = e.x;
  const ey = e.y;
  const er = e.r || 9;
  const pulse = Math.sin(time * 5.5 + (e.id || 0)) * 0.5 + 1;
  const hitFlash = e.lastHit && (time - e.lastHit) < 0.12;

  if (hitFlash) {
    ctx.globalAlpha = 0.7;
    withGlow(ctx, WHITE, 14, () => {
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(ex, ey, er * 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    return;
  }

  const drawType = () => {
    switch (e.type) {
      case 'turret':
        withGlow(ctx, VIOLET, 8, () => {
          ctx.fillStyle = BIO.membrane;
          ctx.beginPath();
          ctx.ellipse(ex, ey, er, er * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#4a3068';
          ctx.beginPath();
          ctx.arc(ex - 3, ey, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = BIO.coral;
          ctx.beginPath();
          ctx.arc(ex - 3, ey, 2, 0, Math.PI * 2);
          ctx.fill();
        });
        break;

      case 'growth': {
        const ps = 0.85 + (pulse - 0.5) * 0.2;
        withGlow(ctx, BIO.acid, 10, () => {
          ctx.fillStyle = `rgba(124, 255, 154, ${0.25 + pulse * 0.1})`;
          ctx.beginPath();
          ctx.arc(ex, ey, er * ps * 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = BIO.acid;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ex, ey, er * ps, 0, Math.PI * 2);
          ctx.stroke();
          // Nucleus
          ctx.fillStyle = VIOLET;
          ctx.beginPath();
          ctx.arc(ex - 3, ey - 2, 3.5 * ps, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = BIO.nucleus;
          ctx.beginPath();
          ctx.arc(ex + 2, ey + 3, 2 * ps, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 1;
        });
        break;
      }

      case 'spiker':
        withGlow(ctx, BIO.blood, 7, () => {
          ctx.fillStyle = '#5a2040';
          ctx.beginPath();
          ctx.arc(ex, ey, er * 0.85, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = BIO.blood;
          ctx.lineWidth = 1.8;
          for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2 + time * 0.5;
            ctx.beginPath();
            ctx.moveTo(ex + Math.cos(ang) * er * 0.5, ey + Math.sin(ang) * er * 0.5);
            ctx.lineTo(ex + Math.cos(ang) * er * 1.3, ey + Math.sin(ang) * er * 1.3);
            ctx.stroke();
          }
          ctx.lineWidth = 1;
        });
        break;

      case 'tendril':
      case 'tendril-parasite': {
        const whip = e.whip || 1;
        withGlow(ctx, VIOLET, 6, () => {
          ctx.strokeStyle = '#8a50c8';
          ctx.lineWidth = 3;
          const segments = 5;
          let lx = ex - er;
          let ly = ey;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          for (let s = 1; s <= segments; s++) {
            const t = s / segments;
            const wx = ex - er + t * er * 2.2;
            const wy = ey + Math.sin(time * 3 * whip + s * 1.2) * (12 + s * 3);
            ctx.lineTo(wx, wy);
            lx = wx; ly = wy;
          }
          ctx.stroke();
          ctx.fillStyle = BIO.membrane;
          ctx.beginPath();
          ctx.ellipse(ex, ey, er * 0.9, er * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = BIO.coral;
          ctx.beginPath();
          ctx.arc(ex + er * 0.3, ey, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 1;
        });
        break;
      }

      case 'parasite': {
        const isQueen = e.isQueen;
        const isSwarm = e.isSwarm;
        const col = isQueen ? BIO.blood : (isSwarm ? '#ff7090' : '#c840ff');
        withGlow(ctx, col, isQueen ? 10 : 5, () => {
          const s = isQueen ? 1.3 : (isSwarm ? 0.75 : 1);
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.ellipse(ex, ey, er * s, er * 0.8 * s, time * 2, 0, Math.PI * 2);
          ctx.fill();
          // Flagella
          ctx.strokeStyle = `rgba(200, 64, 255, ${0.6})`;
          ctx.lineWidth = 1;
          for (let f = 0; f < (isQueen ? 5 : 3); f++) {
            const ang = time * 4 + f * 2.1;
            ctx.beginPath();
            ctx.moveTo(ex - er * 0.3, ey);
            ctx.quadraticCurveTo(
              ex - er - 4, ey + Math.sin(ang) * 6,
              ex - er - 10, ey + Math.sin(ang + 1) * 4
            );
            ctx.stroke();
          }
          ctx.lineWidth = 1;
        });
        break;
      }

      case 'swooper':
        withGlow(ctx, '#7dd4ff', 6, () => {
          ctx.fillStyle = '#4ab8e8';
          ctx.beginPath();
          ctx.moveTo(ex + er, ey);
          ctx.lineTo(ex - er * 0.6, ey - er * 0.8);
          ctx.lineTo(ex - er * 0.4, ey);
          ctx.lineTo(ex - er * 0.6, ey + er * 0.8);
          ctx.closePath();
          ctx.fill();
        });
        break;

      default: // drone
        withGlow(ctx, BIO.glow, 5, () => {
          ctx.fillStyle = `rgba(0, 200, 180, ${0.5 + pulse * 0.15})`;
          ctx.beginPath();
          ctx.arc(ex, ey, er, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = BIO.glow;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ex, ey, er * 0.55, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = WHITE;
          ctx.beginPath();
          ctx.arc(ex + 2, ey - 1, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 1;
        });
    }
  };

  drawType();

  if (e.elite) {
    ctx.strokeStyle = `rgba(255, 140, 60, ${0.5 + Math.sin(time * 8) * 0.2})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(ex, ey, er * 1.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // Weakpoint marker on crit targets
  if (['growth', 'tendril', 'parasite'].includes(e.type)) {
    const wr = 4 + Math.sin(time * 10) * 1;
    ctx.strokeStyle = `rgba(255, 230, 102, ${0.6 + Math.sin(time * 12) * 0.3})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(ex, ey, wr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}

export function drawBoss(ctx, boss, time) {
  if (!boss) return;
  const bx = boss.x;
  const by = boss.y;
  const hpRatio = boss.hp / boss.maxHp;
  const phase = boss.phase || 0;
  const pulse = Math.sin(time * 3) * 0.5 + 0.5;

  // Main mass — pulsing organic horror
  withGlow(ctx, VIOLET, 16, () => {
    const bw = 72 + pulse * 4;
    const bh = 52 + pulse * 3;
    const grad = ctx.createRadialGradient(bx, by, 5, bx, by, bw * 0.6);
    grad.addColorStop(0, '#6a3088');
    grad.addColorStop(0.6, BIO.membrane);
    grad.addColorStop(1, '#1a1030');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(bx, by, bw * 0.5, bh * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = WHITE;
    const eyePulse = 2.5 + Math.sin(time * 5) * 0.5;
    ctx.beginPath();
    ctx.arc(bx - 14, by - 8, eyePulse, 0, Math.PI * 2);
    ctx.arc(bx + 12, by - 10, eyePulse * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BIO.blood;
    ctx.beginPath();
    ctx.arc(bx - 14, by - 8, 1.2, 0, Math.PI * 2);
    ctx.arc(bx + 12, by - 10, 1, 0, Math.PI * 2);
    ctx.fill();
  });

  // Vulnerable core
  const coreR = 10 + Math.sin(time * 5) * 2;
  withGlow(ctx, BIO.coral, 12, () => {
    ctx.fillStyle = `rgba(255, 107, 74, ${0.7 + pulse * 0.3})`;
    ctx.beginPath();
    ctx.arc(bx + 4, by + 2, coreR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = BIO.nucleus;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx + 4, by + 2, coreR * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  });

  // Tendrils
  ctx.strokeStyle = `rgba(0, 232, 212, ${0.4 + phase * 0.2})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const ty = by - 16 + i * 10;
    const tx = bx - 30 - Math.sin(time * 4 + i) * 8;
    ctx.beginPath();
    ctx.moveTo(bx - 28, ty);
    ctx.quadraticCurveTo(tx, ty + Math.sin(time * 3 + i) * 5, tx - 12, ty + Math.cos(time + i) * 3);
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  // HP bar
  const barW = 90;
  const barH = 5;
  const barX = bx - barW / 2;
  const barY = by - 42;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
  ctx.fillStyle = 'rgba(60, 40, 80, 0.8)';
  ctx.fillRect(barX, barY, barW, barH);
  const hpColor = hpRatio > 0.5 ? BIO.acid : (hpRatio > 0.25 ? BIO.nucleus : BIO.blood);
  ctx.fillStyle = hpColor;
  ctx.fillRect(barX, barY, barW * hpRatio, barH);
  if (phase > 0) {
    ctx.fillStyle = 'rgba(255, 60, 80, 0.8)';
    ctx.font = 'bold 8px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ENRAGED', bx, barY - 4);
    ctx.textAlign = 'left';
  }
}

export function drawPowerup(ctx, p, time) {
  const px = p.x;
  const py = p.y;
  const bob = Math.sin(p.life * 4) * 2;
  const col = POWERUP_COLORS[p.type] || CYAN;
  const pr = 7 + Math.sin(time * 6 + p.life) * 1;

  withGlow(ctx, col, 10, () => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py + bob, pr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `${col}88`;
    ctx.beginPath();
    ctx.arc(px, py + bob, pr * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Icon letter
    const letter = (p.type || '?')[0].toUpperCase();
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 8px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, px, py + bob);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 1;
  });
}

export function drawPulseBomb(ctx, pulse, time) {
  const pr = pulse.r + Math.sin(time * 22) * 1.5;
  const col = pulse.boosted ? BIO.nucleus : BIO.glow;

  withGlow(ctx, col, pulse.boosted ? 20 : 14, () => {
    ctx.fillStyle = pulse.boosted ? 'rgba(255, 230, 102, 0.5)' : 'rgba(0, 232, 212, 0.45)';
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, pr, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, pr * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating heartbeat ring
    ctx.strokeStyle = VIOLET;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const ang = time * 9 + i * (Math.PI * 2 / 3);
      ctx.beginPath();
      ctx.arc(
        pulse.x + Math.cos(ang) * 4,
        pulse.y + Math.sin(ang) * 4,
        2.5, 0, Math.PI * 2
      );
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  });
}

export function drawPulseWave(ctx, wave, time) {
  const prog = wave.age / wave.duration;
  const rad = wave.maxRadius * prog;
  const alpha = (1 - prog) * 0.55;

  ctx.globalAlpha = alpha;
  ctx.strokeStyle = wave.boosted ? BIO.nucleus : BIO.glow;
  ctx.lineWidth = 3 * (1 - prog * 0.5);
  ctx.beginPath();
  ctx.arc(wave.x, wave.y, rad, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(wave.x, wave.y, rad * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

export function drawExplosion(ctx, ex, time) {
  const prog = ex.age / ex.duration;
  const rad = (ex.size || 18) * (0.5 + prog * 1.4);
  const alpha = Math.max(0.05, 1 - prog);

  ctx.globalAlpha = alpha;

  // Core flash
  withGlow(ctx, BIO.coral, 12, () => {
    const g = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, rad * 0.5);
    g.addColorStop(0, WHITE);
    g.addColorStop(0.3, BIO.coral);
    g.addColorStop(1, 'rgba(255, 87, 34, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, rad * 0.45, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 2.5 * (1 - prog);
  ctx.beginPath();
  ctx.arc(ex.x, ex.y, rad, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(200, 64, 255, ${alpha * 0.6})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ex.x, ex.y, rad * 0.55, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    const a = Math.max(0.05, Math.min(1, p.life / (p.maxLife || 0.5)));
    ctx.globalAlpha = a;
    const col = p.color || WHITE;
    if (p.glow) {
      ctx.shadowColor = col;
      ctx.shadowBlur = 6;
    }
    ctx.fillStyle = col;
    if (p.round) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}

export function drawOptions(ctx, options, time) {
  for (const o of options) {
    withGlow(ctx, BIO.glow, 6, () => {
      const col = o.isOrbit ? '#a0fff4' : BIO.glow;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(o.x, o.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(o.x + 1, o.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    if (o.isOrbit) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(o.x, o.y, 8 + Math.sin(time * 6) * 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }
}

export function drawVortexField(ctx, player, time) {
  const px = player.x;
  const py = player.y;
  ctx.strokeStyle = `rgba(200, 64, 255, ${0.2 + Math.sin(time * 5) * 0.1})`;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const r = 40 + i * 22 + Math.sin(time * 3 + i) * 8;
    ctx.beginPath();
    ctx.arc(px, py, r, time + i, time + i + Math.PI * 1.2);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

export function drawHud(ctx, state) {
  const {
    combo, comboTimer, highScore, gameOver, time, gameStartTime,
    kills, maxCombo, perfectWaves, grazeCount, damageTakenThisWave,
    runScoreMulti, pulseCharge, pulseStock, novaReady, wave,
    waveBanner, timers, powerLevel, powerTimer, level, score,
    computeGrade,
  } = state;

  // Pulse meter (signature mechanic HUD)
  const meterX = 14;
  const meterY = GAME_H - 14;
  const meterW = 80;
  const meterH = 6;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(meterX - 1, meterY - 1, meterW + 2, meterH + 2);
  ctx.fillStyle = 'rgba(30, 25, 50, 0.8)';
  ctx.fillRect(meterX, meterY, meterW, meterH);
  const fillW = meterW * (pulseCharge / 100);
  const meterGrad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
  meterGrad.addColorStop(0, BIO.glow);
  meterGrad.addColorStop(1, VIOLET);
  ctx.fillStyle = meterGrad;
  ctx.fillRect(meterX, meterY, fillW, meterH);
  ctx.fillStyle = MUTED;
  ctx.font = '8px "Inter", sans-serif';
  ctx.fillText('PULSE', meterX, meterY - 3);
  if (pulseStock > 0) {
    ctx.fillStyle = BIO.nucleus;
    ctx.fillText(`x${pulseStock}`, meterX + meterW + 6, meterY + 5);
  }
  if (novaReady) {
    ctx.fillStyle = ORANGE;
    ctx.font = 'bold 8px "Space Grotesk", sans-serif';
    ctx.fillText('NOVA', meterX + meterW + 6, meterY - 3);
  }

  // Active power indicators
  const activePowers = [];
  if (powerLevel > 0 && powerTimer > 0) activePowers.push(`PWR${powerLevel}`);
  if (timers.laser > 0) activePowers.push('LSR');
  if (timers.homing > 0) activePowers.push('HOM');
  if (timers.overcharge > 0) activePowers.push('OVR');
  if (timers.focus > 0) activePowers.push('FOC');
  if (timers.chain > 0) activePowers.push('CHN');
  if (timers.reflect > 0) activePowers.push('REF');
  if (timers.vortex > 0) activePowers.push('VTX');
  if (timers.surge > 0) activePowers.push('SURGE');

  if (activePowers.length > 0) {
    ctx.fillStyle = 'rgba(160, 255, 240, 0.85)';
    ctx.font = 'bold 8px "Space Grotesk", sans-serif';
    ctx.fillText(activePowers.join(' '), meterX, meterY - 14);
  }

  // Combo
  if (combo > 1) {
    const comboAlpha = Math.min(1, comboTimer / 0.6 + 0.3);
    ctx.globalAlpha = comboAlpha;
    ctx.fillStyle = combo > 6 ? VIOLET : ORANGE;
    ctx.font = 'bold 12px "Space Grotesk", sans-serif';
    ctx.fillText(`COMBO x${combo}`, 18, 24);
    ctx.globalAlpha = 1;
  }

  // Wave indicator
  ctx.fillStyle = 'rgba(160, 158, 180, 0.6)';
  ctx.font = '9px "Inter", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`WAVE ${Math.floor(wave)}`, GAME_W - 10, GAME_H - 8);

  // High score
  if (highScore > 0) {
    ctx.fillStyle = 'rgba(160, 158, 180, 0.7)';
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillText(`HI ${highScore}`, GAME_W - 10, 16);
  }
  ctx.textAlign = 'left';

  // Wave clear banner
  if (waveBanner > 0) {
    const ba = Math.min(1, waveBanner / 0.4);
    ctx.globalAlpha = ba;
    ctx.fillStyle = BIO.glow;
    ctx.font = 'bold 16px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WAVE CLEAR', GAME_W / 2, GAME_H * 0.35);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  // Game over stats
  if (gameOver) {
    const elapsed = Math.max(0, time - (gameStartTime || time));
    ctx.fillStyle = 'rgba(200, 198, 220, 0.85)';
    ctx.font = 'bold 9px "Inter", sans-serif';
    ctx.textAlign = 'center';
    const statsY = GAME_H - 28;
    ctx.fillText(
      `TIME ${elapsed.toFixed(0)}s  •  KILLS ${kills || 0}  •  MAX COMBO x${maxCombo || 0}`,
      GAME_W / 2, statsY
    );
    const acc = (grazeCount || 0) + (damageTakenThisWave || 0) > 0
      ? Math.floor((grazeCount || 0) / ((grazeCount || 0) + (damageTakenThisWave || 1)) * 100)
      : 100;
    ctx.font = '8px "Inter", sans-serif';
    ctx.fillText(
      `PERFECT WAVES ${perfectWaves || 0}  •  ACC ${acc}%  •  x${(runScoreMulti || 1).toFixed(2)}`,
      GAME_W / 2, statsY + 10
    );
    const grade = computeGrade();
    ctx.font = 'bold 14px "Space Grotesk", sans-serif';
    ctx.fillStyle = grade === 'S' || grade === 'A' ? BIO.nucleus : (grade === 'B' ? '#a0fff4' : 'rgba(200,198,220,0.9)');
    ctx.fillText(`RANK ${grade}`, GAME_W / 2, statsY - 16);
    ctx.textAlign = 'left';
  }
}

export function drawScorePopups(ctx, popups) {
  ctx.font = 'bold 10px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  for (const sp of popups) {
    const a = Math.max(0.1, sp.life / 0.85);
    ctx.globalAlpha = a;
    ctx.fillStyle = ORANGE;
    ctx.fillText(`+${sp.amount}`, sp.x, sp.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function drawPost(ctx, w, h) {
  // Vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

export { GAME_W, GAME_H, BIO };