/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import CompatibleInstruments from './CompatibleInstruments';
import { patchBanks } from '../data/patchBanks';

describe('CompatibleInstruments', () => {
  it('renders a row for every synth bank with formats, hardware, and software', () => {
    render(<CompatibleInstruments banks={patchBanks} />);

    expect(screen.getByRole('heading', { name: 'Compatible Instruments' })).toBeInTheDocument();
    const andromedaLinks = screen.getAllByRole('link', { name: 'Alesis A6 Andromeda' });
    expect(andromedaLinks[0]).toHaveAttribute('href', '/banks/Alan_M_Andromeda_A6.zip');
    expect(andromedaLinks[1]).toHaveAttribute('href', 'https://www.alesis.com/');
    expect(screen.getByRole('link', { name: 'Isla Electronics ASYX' })).toHaveAttribute(
      'href',
      'https://islaelectronics.com/'
    );
    expect(screen.getByRole('link', { name: 'Profit-08 (mpc-vst-profit8, GitHub)' })).toHaveAttribute(
      'href',
      'https://github.com/sd88me/mpc-vst-profit8'
    );
    expect(screen.getByRole('link', { name: 'The Usual Suspects OsTIrus (GitHub)' })).toHaveAttribute(
      'href',
      'https://github.com/dsp56300/gearmulator'
    );
    expect(screen.queryByText('Audio Demo MIDIs')).not.toBeInTheDocument();
  });

  it('returns null when no banks have a patch count', () => {
    const { container } = render(
      <CompatibleInstruments banks={[{ name: 'MIDIs', downloadLink: '/banks/m.zip' }]} />
    );
    expect(container.firstChild).toBeNull();
  });
});
