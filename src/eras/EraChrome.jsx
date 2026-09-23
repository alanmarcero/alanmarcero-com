import { getEra, PAST_ERAS, DEFAULT_ERA } from './eras';
import MidiPlayer from '../components/MidiPlayer';

const gifSrc = (name) => `/eras/gifs/${name}.gif`;

// Every GIF in the zoo — the GIFs are the point.
const GIF_ZOO = [
  'fire', 'flames', 'flames2', 'anarchy', 'anarchy2', 'alien', 'alien2',
  'ufo', 'saucer', 'space', 'star', 'cool', 'globe', 'new', 'new2',
  'construction', 'construction2', 'netscape', 'guestbook', 'email',
  'starcraft', 'diablo', 'warcraft',
];

const gif = (name, key) => <img key={key} src={gifSrc(name)} alt="" className="gc-gif" />;

/**
 * Decorative era chrome layered over the re-skinned page: a persistent
 * time-travel bar (all past eras) plus, for the GeoCities era, an avalanche of
 * period-correct animated GIFs (marquees, stickers, a favorites wall), a
 * Sandstorm MIDI player, and a hit counter. Renders nothing in the present.
 */
export default function EraChrome({ era, onSetEra }) {
  if (era === DEFAULT_ERA) return null;
  const info = getEra(era);

  return (
    <>
      <div className="time-travel-bar" role="region" aria-label="Time travel controls">
        <span className="time-travel-bar__status">
          <span aria-hidden="true">⏳</span> Viewing <b>{info.year}</b> · {info.label}
        </span>
        <div className="time-travel-bar__years">
          {PAST_ERAS.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`time-travel-bar__year${e.id === era ? ' is-active' : ''}`}
              aria-current={e.id === era}
              onClick={() => onSetEra(e.id)}
            >
              {e.year}
            </button>
          ))}
          <button type="button" className="time-travel-bar__home" onClick={() => onSetEra(DEFAULT_ERA)}>
            Return to Present <span aria-hidden="true">⏭</span>
          </button>
        </div>
      </div>

      {era === 'y2001' && <GeoCitiesChrome />}
    </>
  );
}

function GeoCitiesChrome() {
  return (
    <div className="gc-chrome">
      {/* top marquees, crammed with GIFs */}
      <marquee className="gc-marquee gc-marquee--fire" scrollamount="7" aria-hidden="true">
        {gif('fire', 1)} {gif('flames', 2)} {gif('anarchy', 3)}
        <span className="gc-blink">★ WELCOME TO ALANMARCERO.COM ★</span>
        {gif('alien', 4)} the RADDEST synth patches on the WORLD WIDE WEB!!!
        {gif('ufo', 5)} {gif('diablo', 6)} sign my guestbook!!! {gif('anarchy2', 7)} {gif('star', 8)}
      </marquee>
      <marquee className="gc-marquee gc-marquee--alt" direction="right" scrollamount="5" aria-hidden="true">
        {gif('saucer', 1)} {gif('starcraft', 2)} best viewed in Netscape Navigator 4.0 @ 800x600
        {gif('warcraft', 3)} {gif('cool', 4)} {gif('space', 5)} {gif('new', 6)} {gif('flames2', 7)}
      </marquee>

      {/* corner stickers — distributed to the four corners */}
      <img src={gifSrc('alien')} alt="" className="gc-sticker gc-sticker--tl" />
      <img src={gifSrc('ufo')} alt="" className="gc-sticker gc-sticker--tr" />
      <img src={gifSrc('diablo')} alt="" className="gc-sticker gc-sticker--bl" />
      <img src={gifSrc('anarchy')} alt="" className="gc-sticker gc-sticker--br" />

      {/* MIDI background player (autoplays sandstorm.mid) */}
      <MidiPlayer autoStart />

      <div className="gc-footer">
        <img src={gifSrc('bar')} alt="" className="gc-bar" />

        {/* games cluster */}
        <div className="gc-block">
          <h3 className="gc-heading gc-blink">~*~ I &hearts; BLiZZARD ~*~</h3>
          <p>
            <img src={gifSrc('starcraft')} alt="StarCraft" />
            <img src={gifSrc('diablo')} alt="Diablo" />
            <img src={gifSrc('warcraft')} alt="WarCraft" />
          </p>
          <p className="gc-small">GG no re :: cya on Battle.net!!</p>
        </div>

        <img src={gifSrc('bar')} alt="" className="gc-bar" />

        {/* the classic "here are my favorite gifs" wall (a lil stacking is ok) */}
        <div className="gc-block">
          <h3 className="gc-heading">~*~ heres some of my FAVORITE gifs ~*~</h3>
          <div className="gc-wall" aria-hidden="true">
            {GIF_ZOO.concat(GIF_ZOO.slice(0, 10)).map((name, i) => gif(name, i))}
          </div>
        </div>

        <img src={gifSrc('bar')} alt="" className="gc-bar" />

        <HitCounter />

        <p className="gc-badges">
          <img src={gifSrc('netscape')} alt="Netscape Now!" />
          <img src={gifSrc('construction2')} alt="Under construction" />
          <a href="#guestbook" onClick={(e) => e.preventDefault()}>
            <img src={gifSrc('guestbook')} alt="Sign my guestbook" />
          </a>
          <img src={gifSrc('email')} alt="Email me" />
        </p>

        <p className="gc-webring">
          {gif('star', 'a')} <a href="#" onClick={(e) => e.preventDefault()}>[ &laquo; Prev ]</a> ·{' '}
          <a href="#" onClick={(e) => e.preventDefault()}>[ Synthesizer WebRing ]</a> ·{' '}
          <a href="#" onClick={(e) => e.preventDefault()}>[ Next &raquo; ]</a> {gif('star', 'b')}
        </p>

        <p className="gc-fineprint">
          <span className="gc-blink">&copy; 2001 Alan Marcero</span> · Made with Notepad · No frames! ·{' '}
          webmaster@alanmarcero.com
        </p>
      </div>
    </div>
  );
}

// Fake odometer-style hit counter, frozen on a leet number.
const HIT_DIGITS = '00013370'.split('');

function HitCounter() {
  return (
    <div className="gc-counter">
      <span className="gc-counter__label">You are visitor number</span>
      <span className="gc-counter__digits" aria-label="visitor number 13,370">
        {HIT_DIGITS.map((d, i) => (
          <span key={i} className="gc-counter__digit">{d}</span>
        ))}
      </span>
      <span className="gc-counter__label">since 04 / 20 / 2001</span>
    </div>
  );
}
