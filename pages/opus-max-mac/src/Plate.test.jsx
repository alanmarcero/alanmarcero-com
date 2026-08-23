/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import Plate from './Plate';
import { plateFor } from './data/plates';
import { patchBanks } from '../../../src/data/patchBanks';

const bankNamed = (name) => patchBanks.find((bank) => bank.name === name);

/**
 * Which banks the component actually draws instead of photographing, read off
 * what it renders for the real catalogue rather than restated from a list.
 */
const drawnInstead = () =>
  patchBanks
    .filter((bank) => {
      const { container, unmount } = render(<Plate bank={bank} />);
      const photographed = Boolean(container.querySelector('img'));
      unmount();
      return !photographed;
    })
    .map((bank) => bank.name);

/** The banks with nothing to listen to — a different question, same shape. */
const noAudioDemo = () =>
  patchBanks.filter((bank) => (bank.audioDemo || []).length === 0).map((bank) => bank.name);

const PHOTOGRAPHED = patchBanks.filter((bank) => plateFor(bank.name));

describe('Plate', () => {
  it('prints the photograph a bank has, with an alt and a candidate set', () => {
    PHOTOGRAPHED.forEach((bank) => {
      const { unmount } = render(<Plate bank={bank} />);

      const photo = screen.getByRole('img');
      expect(photo.getAttribute('alt')).toBeTruthy();
      // The plate is rendered at wildly different sizes across the two layouts,
      // so the browser has to be given something to choose from.
      expect(photo).toHaveAttribute('srcset', expect.stringContaining('.webp'));
      expect(photo).toHaveAttribute('sizes');

      unmount();
    });
  });

  it('names the machine in the frame in the alt text', () => {
    render(<Plate bank={bankNamed('Nord Lead 2X, Nord Lead 2, DiscoDSP Discovery Pro')} />);

    // The photograph is of a Nord Rack 2, not the Nord Lead 2 the bank is named
    // for, and the alt text is where that has to be admitted.
    expect(screen.getByRole('img')).toHaveAccessibleName(/Nord Rack 2/);
  });

  it('credits the photographer and the licence beside the plate', () => {
    // CC BY and CC BY-SA require visible attribution: this caption is the
    // licence condition being met, not a courtesy.
    render(<Plate bank={bankNamed('Sequential Prophet 08 and Rev2')} />);

    expect(screen.getByText(/Pete Brown/)).toBeInTheDocument();
    expect(screen.getByText(/CC BY 2\.0/)).toBeInTheDocument();
  });

  it('says in words that there is no photograph, rather than showing a lookalike', () => {
    drawnInstead().forEach((name) => {
      const { container, unmount } = render(<Plate bank={bankNamed(name)} />);

      expect(container.querySelector('img')).not.toBeInTheDocument();
      expect(screen.getByText(/no photograph on file/i)).toBeInTheDocument();

      unmount();
    });
  });

  it('leaves exactly three banks unphotographed, and they are the three that cannot be', () => {
    // Derived from what the component renders for the real catalogue. A commit
    // that hands the SH-01A an SH-101 shot fails here instead of shipping a
    // photograph of a different synthesizer.
    expect(drawnInstead()).toEqual([
      'Roland SH-01A',
      'Waves CODEX',
      'Audio Demo MIDIs',
    ]);
  });

  it('does not confuse having no photograph with having no demo', () => {
    // The two sets overlap on two of three, which is exactly why conflating
    // them would look right. The SH-01A has a demo and no photograph; the JP-08
    // has a photograph and no demo.
    const drawn = drawnInstead();
    const silent = noAudioDemo();

    expect(silent).toEqual(['Roland JP-08', 'Waves CODEX', 'Audio Demo MIDIs']);
    expect(drawn).not.toEqual(silent);
    expect(drawn.filter((name) => silent.includes(name))).toHaveLength(2);

    expect(drawn).toContain('Roland SH-01A');
    expect(silent).not.toContain('Roland SH-01A');
    expect(silent).toContain('Roland JP-08');
    expect(drawn).not.toContain('Roland JP-08');
  });

  it('gives the drawn plates a figure with no words in it of its own', () => {
    const { container } = render(<Plate bank={bankNamed('Waves CODEX')} />);

    const figure = container.querySelector('svg');
    expect(figure).toHaveAttribute('aria-hidden', 'true');
    expect(figure).toHaveAttribute('focusable', 'false');
  });
});
