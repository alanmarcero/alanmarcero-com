/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import Orrery, { CENTRE, FIELD } from './Orrery';
import { orbitsFor } from './orbits';
import { patchBanks } from '../../data/patchBanks';

const bodies = orbitsFor(patchBanks);

/** Every attribute in the figure that has to be a number to draw anything. */
const GEOMETRY = ['r', 'cx', 'cy', 'x1', 'y1', 'x2', 'y2', 'stroke-width', 'stop-opacity'];

/*
 * The figure is one `role="img"` with no accessible surface inside it, so its
 * parts have to be reached through the DOM. The orbits and the bodies are read
 * out of their own groups: `[data-body]` also marks the observer at the centre,
 * which is not a bank.
 */
const orbitsIn = (container) => [...container.querySelectorAll('.orrery__orbits circle')];
const bodiesIn = (container) => [...container.querySelectorAll('.orrery__bodies [data-body]')];
const leadersIn = (container) => [...container.querySelectorAll('.orrery__bodies line')];

const numberAt = (element, name) => Number(element.getAttribute(name));

const nonFiniteGeometry = (container) => {
  const offenders = [];
  container.querySelectorAll('*').forEach((element) => {
    GEOMETRY.forEach((name) => {
      if (!element.hasAttribute(name)) return;
      if (Number.isFinite(numberAt(element, name))) return;
      offenders.push(`<${element.tagName} ${name}="${element.getAttribute(name)}">`);
    });
  });
  return offenders;
};

describe('Orrery', () => {
  it('is one image, named for what it plots', () => {
    render(<Orrery banks={patchBanks} />);

    const figure = screen.getByRole('img');
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(figure).toHaveAccessibleName(/interval orrery/i);
    expect(figure).toHaveAccessibleName(/11 patch banks/);
    expect(figure).toHaveAccessibleName(/orbits/);
    expect(figure).toHaveAccessibleName(/1:1 to 2:1/);
  });

  it('has nothing inside it for a keyboard to land on', () => {
    // Every ring and body is a mark, not a control — the eleven register rows
    // below are the controls. A tab stop here would be a stop that does nothing.
    const { container } = render(<Orrery banks={patchBanks} />);

    expect(container.querySelector('svg')).toHaveAttribute('focusable', 'false');
    expect(container.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0);
  });

  it('draws one orbit and one body for each bank in the register', () => {
    const { container } = render(<Orrery banks={patchBanks} />);

    expect(orbitsIn(container)).toHaveLength(patchBanks.length);
    expect(bodiesIn(container)).toHaveLength(patchBanks.length);
  });

  it('puts each body on the ring its interval gives it', () => {
    const { container } = render(<Orrery banks={patchBanks} />);

    orbitsIn(container).forEach((orbit, index) => {
      expect(numberAt(orbit, 'r')).toBeCloseTo(bodies[index].radius * FIELD, 6);
    });
    bodiesIn(container).forEach((body, index) => {
      expect(numberAt(body, 'cx')).toBeCloseTo(CENTRE + bodies[index].radius * FIELD, 6);
    });
  });

  it('marks exactly one ring and one body when a row is being read', () => {
    const active = 3;
    const { container } = render(<Orrery banks={patchBanks} activeIndex={active} />);

    const lit = [...container.querySelectorAll('[data-lit]')];
    expect(lit).toHaveLength(1);
    expect(numberAt(lit[0], 'r')).toBeCloseTo(bodies[active].radius * FIELD, 6);

    const enlarged = bodiesIn(container).filter((body, index) =>
      numberAt(body, 'r') > bodies[index].bodyRadius);
    expect(enlarged).toHaveLength(1);
    expect(bodiesIn(container).indexOf(enlarged[0])).toBe(active);

    // The leader line from the observer to the body only exists while that body
    // is the one being read, so there is never more than one of them.
    expect(leadersIn(container)).toHaveLength(1);
    expect(numberAt(leadersIn(container)[0], 'x2'))
      .toBeCloseTo(CENTRE + bodies[active].radius * FIELD, 6);
  });

  it('marks nothing when no row is being read', () => {
    const { container } = render(<Orrery banks={patchBanks} />);

    expect(container.querySelectorAll('[data-lit]')).toHaveLength(0);
    expect(leadersIn(container)).toHaveLength(0);
    bodiesIn(container).forEach((body, index) => {
      expect(numberAt(body, 'r')).toBeCloseTo(bodies[index].bodyRadius, 6);
    });
  });

  it('carries whether it is turning on the figure itself', () => {
    const { container, rerender } = render(<Orrery banks={patchBanks} />);

    expect(container.querySelector('svg')).toHaveAttribute('data-paused', 'false');

    rerender(<Orrery banks={patchBanks} paused />);
    expect(container.querySelector('svg')).toHaveAttribute('data-paused', 'true');
  });

  it('writes finite geometry for the real catalogue', () => {
    const { container } = render(<Orrery banks={patchBanks} activeIndex={0} />);

    expect(nonFiniteGeometry(container)).toEqual([]);
    expect(container.innerHTML).not.toMatch(/NaN/);
  });

  it('writes finite geometry for a bank with no patch count', () => {
    // The patch count is the one thing the figure measures, and one register
    // entry — the MIDI collection — has none. An unguarded division by the
    // largest count would put NaN into an r and drop that body off the figure.
    const countless = [{ name: 'Audio Demo MIDIs', downloadLink: '/banks/audio-demo-midis.zip' }];
    const { container } = render(<Orrery banks={countless} activeIndex={0} />);

    expect(bodiesIn(container)).toHaveLength(1);
    expect(nonFiniteGeometry(container)).toEqual([]);
    expect(container.innerHTML).not.toMatch(/NaN/);
  });

  it('draws an empty field rather than throwing when there are no banks', () => {
    const { container } = render(<Orrery banks={[]} />);

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(orbitsIn(container)).toHaveLength(0);
    expect(bodiesIn(container)).toHaveLength(0);
    expect(nonFiniteGeometry(container)).toEqual([]);
  });
});
