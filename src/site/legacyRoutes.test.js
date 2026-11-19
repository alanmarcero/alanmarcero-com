import { HASH_ROUTES, legacyRedirectFromLocation } from './legacyRoutes';

describe('legacyRedirectFromLocation', () => {
  it('sends the old section anchors that moved to their pages', () => {
    expect(legacyRedirectFromLocation({ pathname: '/', search: '', hash: '#music-remixes' })).toBe('/music');
    expect(legacyRedirectFromLocation({ pathname: '/', search: '', hash: '#contact' })).toBe('/contact');
  });

  it('keeps a search query when an old anchor moves', () => {
    expect(legacyRedirectFromLocation({
      pathname: '/',
      search: '?q=prophet',
      hash: '#contact',
    })).toBe('/contact?q=prophet');
  });

  it('leaves the patch banks on the home page', () => {
    expect(legacyRedirectFromLocation({ pathname: '/', search: '', hash: '#store' })).toBeNull();
    expect(legacyRedirectFromLocation({
      pathname: '/',
      search: '',
      hash: '#compatible-instruments',
    })).toBeNull();
    expect(legacyRedirectFromLocation({ pathname: '/', search: '?q=hi%20mom', hash: '' })).toBeNull();
  });

  it('leaves the home page alone when nothing old is in the URL', () => {
    expect(legacyRedirectFromLocation({ pathname: '/', search: '', hash: '' })).toBeNull();
    expect(legacyRedirectFromLocation({ pathname: '/', search: '?era=y2007', hash: '' })).toBeNull();
  });

  it('does not redirect other pages', () => {
    expect(legacyRedirectFromLocation({ pathname: '/plugins', search: '?q=kick', hash: '#store' })).toBeNull();
  });

  it('treats index.html as the home page', () => {
    expect(legacyRedirectFromLocation({ pathname: '/index.html', search: '', hash: '#contact' }))
      .toBe('/contact');
  });

  it('covers the anchors that still leave the home page', () => {
    expect(Object.keys(HASH_ROUTES).sort()).toEqual([
      'contact',
      'music-remixes',
    ]);
  });
});
