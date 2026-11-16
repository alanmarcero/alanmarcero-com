import ModulePanel from './ModulePanel';

const joinOrDash = (items) => (items && items.length > 0 ? items.join(', ') : '-');

function CompatibleInstruments({ banks }) {
  const synthBanks = banks.filter((bank) => bank.count);
  if (synthBanks.length === 0) return null;

  return (
    <div id="compatible-instruments" className="compat-wrap">
      <div className="section-head compat-head">
        <h3 className="compat-title">Compatible Instruments</h3>
      </div>
      <ModulePanel className="module compat-panel">
        <div className="compat-scroll">
          <table className="compat-table">
            <thead>
              <tr>
                <th scope="col">Bank</th>
                <th scope="col">Formats</th>
                <th scope="col">Hardware</th>
                <th scope="col">Software &amp; Emulators</th>
              </tr>
            </thead>
            <tbody>
              {synthBanks.map((bank) => (
                <tr key={bank.downloadLink}>
                  <td className="compat-bank">
                    <a href={bank.downloadLink} download>{bank.name}</a>
                  </td>
                  <td className="compat-formats">{joinOrDash(bank.formats)}</td>
                  <td>{joinOrDash(bank.hardware || bank.instruments)}</td>
                  <td>{joinOrDash(bank.software)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModulePanel>
    </div>
  );
}

export default CompatibleInstruments;
