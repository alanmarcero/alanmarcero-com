import { YOUTUBE_CHANNEL_URL } from '../../../src/config';
import { patchBanks } from '../../../src/data/patchBanks';
import EnvelopeField from './shared/graphics/EnvelopeField';
import { totalPatches } from './shared/lib/catalog';
import WaveTrace from './shared/graphics/WaveTrace.jsx';
import Line from './shared/Line';
import SynthesistMark from '../../../src/components/graphics/SynthesistMark';

const TOTAL_PATCHES = totalPatches(patchBanks);

function Hero() {
  return (
    <header className="codex-hero">
      <div className="codex-hero__field" aria-hidden="true">
        <EnvelopeField
          seed="alan-marcero-codex"
          count={TOTAL_PATCHES}
          aspect={1.8}
          cellWidth={8}
          cellHeight={6}
          gap={2}
          draw
          beam
        />
      </div>

      <div className="codex-shell codex-hero__inner">
        <div className="codex-meta">
          <p>Alan Marcero · Boston, USA</p>
          <p>Synthesizer sound design &amp; production</p>
          <p>Patch banks &amp; releases</p>
        </div>

        <h1 className="codex-hero__title">
          Alan <em>Marcero</em>
        </h1>

        <div className="codex-hero__deck">
          <div className="codex-hero__copy">
            <p className="codex-hero__lead">
              Trance and electronic music producer from Boston, USA. I've produced
              original tracks, remixes, and synthesizer sound banks since the
              early 2000s. My music has been supported by Ferry Corsten, Paul van Dyk,
              Sean Tyas, and Daniel Kandi, featured on A State of Trance and BBC Radio 1's
              Essential Mix, and released on Armada, Bonzai, and Ministry of Sound.
            </p>

            <div className="codex-hero__actions">
              <Line
                as="a"
                className="codex-primary-action"
                value="Channel"
                href={YOUTUBE_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Subscribe on YouTube
              </Line>
              <Line as="a" value="OpenVST" href="/plugins">
                Plugins
              </Line>
            </div>
          </div>

          <div className="codex-hero__instrument" aria-hidden="true">
            <div className="codex-hero__speaker">
              <div className="codex-speaker__cone">
                <WaveTrace
                  seed="alan-marcero-speaker"
                  variant="silhouette"
                  cycles={3}
                  className="codex-speaker__trace"
                />
              </div>
              <div className="codex-hero__mark">
                <SynthesistMark size={112} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Hero;
