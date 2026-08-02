import SignalChain from './graphics/SignalChain';

/**
 * The masthead.
 *
 * A catalogue's front page states what is catalogued and how much of it
 * there is, then shows the thing itself. So: the name at sheet width, the
 * biography that has always been the site's opening paragraph, the two
 * numbers that matter, and the schematic of a voice — the object every
 * plate below is a set of settings for.
 *
 * No portrait. The site is about the instruments and what came out of
 * them, and at this size a face would outrank both.
 */
function Masthead({ totalPatches, instrumentCount, releaseCount }) {
  return (
    <header className="masthead">
      <div className="sheet">
        <div className="masthead__meta">
          <p className="legend legend--ink">Alan Marcero · Boston, USA</p>
          <p className="legend">Synthesizer sound design &amp; production</p>
          <p className="legend">Catalogue · Patch banks &amp; releases</p>
        </div>

        <h1 className="masthead__title">
          Alan <em>Marcero</em>
        </h1>

        <div className="masthead__deck">
          <p className="masthead__lead">
            Trance and electronic music producer from Boston, USA. Crafting
            original tracks, remixes, and synthesizer sound design since the
            early 2000s. Supported by Ferry Corsten, Paul van Dyk, Sean Tyas,
            and Daniel Kandi. Featured on A State of Trance and BBC Radio 1&rsquo;s
            Essential Mix. Released on Armada, Bonzai, and Ministry of Sound.
          </p>

          <div className="masthead__figures">
            <p className="figure-stat">
              <span className="figure-stat__value">{totalPatches.toLocaleString()}</span>
              <span className="legend">Patches, free</span>
            </p>
            <p className="figure-stat">
              <span className="figure-stat__value">{instrumentCount}</span>
              <span className="legend">Instruments</span>
            </p>
            {/*
              The release count arrives from the API, so it is absent on the
              first paint and on an API failure. A stat that renders "0
              releases" while the list below is still loading is worse than
              one that waits.
            */}
            {releaseCount > 0 && (
              <p className="figure-stat">
                <span className="figure-stat__value">{releaseCount}</span>
                <span className="legend">Releases &amp; remixes</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="chain-band">
        <div className="sheet">
          <SignalChain />
        </div>
      </div>
    </header>
  );
}

export default Masthead;
