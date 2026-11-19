// Ušati - pozadinska skripta: preuzima fotografiju koju portal servira sa drugog domena,
// jer se takva slika u stranici ne moze procitati za prepoznavanje lica.
// Slika se ne cuva i ne salje nikud, vraca se samo sadrzajnoj skripti u istoj kartici.
chrome.runtime.onMessage.addListener((poruka, posiljalac, odgovor) => {
  if (!poruka || poruka.type !== 'usati-fetch' || typeof poruka.url !== 'string') return;
  let url;
  try { url = new URL(poruka.url); } catch (e) { odgovor(null); return; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') { odgovor(null); return; }
  fetch(url.href, { credentials: 'omit' })
    .then(r => {
      const tip = r.headers.get('content-type') || '';
      if (!r.ok || !tip.startsWith('image/')) throw new Error('nije slika');
      return r.arrayBuffer().then(b => ({ b, tip }));
    })
    .then(({ b, tip }) => {
      if (b.byteLength > 8 * 1024 * 1024) throw new Error('prevelika');
      const bajti = new Uint8Array(b);
      let s = '';
      for (let i = 0; i < bajti.length; i += 0x8000) s += String.fromCharCode.apply(null, bajti.subarray(i, i + 0x8000));
      odgovor({ dataUrl: 'data:' + tip.split(';')[0] + ';base64,' + btoa(s) });
    })
    .catch(() => odgovor(null));
  return true;
});
