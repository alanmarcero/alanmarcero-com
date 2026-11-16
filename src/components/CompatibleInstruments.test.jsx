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
    expect(screen.getByRole('link', { name: 'Alesis A6 Andromeda' })).toHaveAttribute(
      'href',
      '/banks/Alan_M_Andromeda_A6.zip'
    );
    expect(screen.getByText(/Isla Electronics ASYX/)).toBeInTheDocument();
    expect(screen.getByText(/Profit-08 \(mpc-vst-profit8, GitHub\)/)).toBeInTheDocument();
    expect(screen.queryByText('Audio Demo MIDIs')).not.toBeInTheDocument();
  });

  it('returns null when no banks have a patch count', () => {
    const { container } = render(
      <CompatibleInstruments banks={[{ name: 'MIDIs', downloadLink: '/banks/m.zip' }]} />
    );
    expect(container.firstChild).toBeNull();
  });
});
