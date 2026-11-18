# Ušati (Nelečeni Ears Edition) 🫏🐰👹

Zabavno i satirično proširenje za Chromium pregledače (Google Chrome, Brave, Microsoft Edge, Opera) koje u realnom vremenu prepoznaje lica i montira smiješne uši na YouTube prenosima i domaćim novinskim portalima!

> 🔗 **Priznanje i veza sa originalom:**  
> Ovaj projekat je direktno inspirisan fantastičnim open-source projektom [**Tpojka/neleceni**](https://github.com/Tpojka/neleceni) koji automatski stišava zvuk prenosa Narodne skupštine kad govori odabrana osoba. Dok original rješava zvučni dio problema, **Ušati** dodaje vizuelni satirični sloj – montirajući magareće, zečije ili Šrek uši u realnom vremenu!

---

## 🚀 Šta sve radi?

### 1. YouTube uživo i video prenosi (Real-Time Face Tracking)
- Kada gledate prenose sjednica, obraćanja ili bilo koji YouTube video, ekstenzija automatski preko videa postavlja providno platno (`<canvas>`).
- Koristi ultrabrzi lokalni kaskadni detektor lica (`pico.js`, 235 KB kaskada) koji u realnom vremenu prati položaj glave.
- Na vrh glave postavlja uši koje dinamički prate veličinu lica, nagib i kretanje po ekranu, uz blago komično mrckanje/mrdanje!
- Ne opterećuje procesor jer se detekcija radi na smanjenom frejmu, a rendering ide u punih 60 FPS preko requestAnimationFrame.

### 2. Skeniranje novinskih portala (Nova, N1, Blic, Kurir, Informer, Danas...)
- Kada otvorite bilo koji domaći portal, ekstenzija skenira članke i fotografije.
- Ako prepozna da se u naslovu, slici ili tekstu pominje **Vučić**, automatski detektuje lice na slici i lijepi odabrane uši direktno na fotografiju!
- Podržava beskonačno skrolovanje (Infinite Scroll) – kako se učitavaju nove vijesti, tako se automatski montiraju uši.

---

## 🎨 Modeli ušiju na izbor

U popup meniju ekstenzije možete birati:
- 🫏 **Magareće uši** (klasične dugačke sive uši sa roze unutrašnjošću)
- 🐰 **Zečije uši** (visoke bijele uši sa jednim savijenim vrhom)
- 👹 **Šrek uši** (zelene ogarske trubice)
- 😈 **Đavolji rogovi** (crveni zašiljeni rogovi sa sjajem)
- 🐶 **Pseće uši** (viseće lovačke smeđe uši)

Takođe možete podešavati:
- **Veličinu ušiju:** od diskretnih do ogromnih karikaturnih (0.8x – 2.2x).
- **Animaciju mrdanja:** uši blago mrckaju dok govornik priča.
- **Filter:** samo kad se pominje Vučić (preporučeno) ili na svim licima na vijestima.

---

## 🛠️ Kako instalirati u Chrome / Brave / Edge (u 3 koraka)

1. Preuzmite ovaj repozitorijum (`git clone` ili Download ZIP).
2. Otvorite stranicu sa ekstenzijama u vašem pregledaču:
   - Za **Chrome**: unesite `chrome://extensions` u adresnu traku.
   - Za **Brave**: unesite `brave://extensions`.
   - Za **Edge**: unesite `edge://extensions`.
3. U gornjem desnom uglu uključite prekidač **Developer mode** (Režim za programere).
4. Kliknite na dugme **Load unpacked** (Učitaj neraspakovano) u gornjem lijevom uglu i izaberite preuzetu fasciklu.

---

## 📜 Licenca
MIT License – slobodno za korišćenje, forkovanje, izmjene i dijeljenje.  
Veliko hvala autoru projekta [neleceni](https://github.com/Tpojka/neleceni) na inspiraciji!
