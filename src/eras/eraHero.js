/**
 * Per-era hero writeups (the "greeting"), taken from the actual archived pages
 * where they exist and written in-voice for the estimated GeoCities era. Swapped
 * into the hero when travelling, since the live bio would be anachronistic.
 * We over-index on text here because the archive is thin on images.
 */
export const ERA_HERO = {
  y2001: {
    tagline: '~*~ my kewl synthesizer homepage ~*~',
    writeup: [
      "Welcome 2 my WEB SITE!!! My name is Alan Marcero and i make TRANCE music and synthesizer patches. This page is UNDER CONSTRUCTION so check back l8r!!!",
      'Sign my guestbook, crank up the MIDI, and grab some patches for your synth. Best viewed in Netscape Navigator @ 800x600.',
      'E-MAIL ME and join my web ring!!! ~*~*~',
    ],
  },
  y2007: {
    tagline: 'Web Developer · Music Producer',
    writeup: [
      'Greetings and salutations. My name is Alan Marcero and I am a web developer and electronic music producer hailing from Burlington, Vermont, USA.',
      'Below you will find my personal blog, but the other sections are more interesting and pertain mostly to my hobby as an electronic music producer. Enjoy your stay.',
      'I am always available for remixes or web development / design work — feel free to email me to talk business, or just to chat.',
    ],
  },
  y2014: {
    tagline: 'Web Programmer · Music Producer',
    writeup: [
      'A new approach to synthesizer patch bank design and distribution: every bank is offered on a "name your own price" basis. Try one out before laying down your hard-earned cash.',
      "Sounds inspired by Anjunabeats, Armada, and the artists they've influenced — for the Access Virus, Nord Lead, Prophet '08, Andromeda, and more.",
      '2,805 people have purchased 3,634 patch banks :: last purchase 5 hours ago.',
    ],
  },
  y2020: {
    tagline: 'AM Sounds · EDM Synth Patches',
    writeup: [
      'Trance, EDM, and synthwave patches for classic hardware and modern emulations — still name-your-price, still made with love.',
      'New this era: the Roland SH-01A and Moog Slim / Little Phatty banks join the lineup, each with an HTML5 audio demo.',
      '4,014 people have purchased 5,319 patch banks :: last purchase 1 day ago.',
    ],
  },
};

export const getEraHero = (era) => ERA_HERO[era] || null;
