import { HASH_ROUTES, legacyRedirectFromLocation } from './legacyRoutes';

describe('legacyRedirectFromLocation', () => {
  it('sends the old section anchors to their pages', () => {
    expect(legacyRedirectFromLocation({ pathname: '/', search: '', hash: '#store' })).toBe('/patches');
    expect(legacyRedirectFromLocation({
      pathname: '/',
      search: '',
      hash: '#compatible-instruments',
    })).toBe('/patches#compatible-instruments');
    expect(legacyRedirectFromLocation({ pathname: '/', search: '', hash: '#music-remixes' })).toBe('/music');
    expect(legacyRedirectFromLocation({ pathname: '/', search: '', hash: '#contact' })).toBe('/contact');
  });

  it('keeps a search query when an old anchor moves', () => {
    expect(legacyRedirectFromLocation({
      pathname: '/',
      search: '?q=prophet',
      hash: '#store',
    })).toBe('/patches?q=prophet');
  });

  it('sends a bare home search to the patch banks', () => {
    expect(legacyRedirectFromLocation({ pathname: '/', search: '?q=hi%20mom', hash: '' }))
      .toBe('/patches?q=hi%20mom');
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

  it('covers the anchors the old nav used', () => {
    expect(Object.keys(HASH_ROUTES).sort()).toEqual([
      'compatible-instruments',
      'contact',
      'music-remixes',
      'store',
    ]);
  });
});
