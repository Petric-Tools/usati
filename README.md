<p align="center">
  <img src="assets/icon128.png" width="96" height="96" alt="Ušati logo">
</p>

<h1 align="center">Ušati / Ушати (Nelečeni Ears Edition) 🐴🐰👹</h1>

<p align="center">
  <b>Забавно и сатирично проширење за прегледаче које у реалном времену монтира уши на YouTube преносима и вестима!</b><br>
  <i>Fun and satirical browser extension that overlays funny ears in real-time on YouTube streams and news portals!</i>
</p>

<p align="center">
  <a href="#српски-ћирилица"><b>Српски (ћирилица)</b></a> •
  <a href="#srpski-latinica"><b>Srpski (latinica)</b></a> •
  <a href="#english"><b>English</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Browsers-Chrome%20%7C%20Brave%20%7C%20Edge%20%7C%20Opera-success?style=flat-square" alt="Browsers">
  <img src="https://img.shields.io/badge/License-MIT-orange?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/Local%20Model-face--api.js%20(offline)-purple?style=flat-square" alt="Offline & Fast">
</p>

---

> 🔗 **Инспирација и веза са оригиналом / In honor of original:**  
> Овај пројекат је директно инспирисан сјајним open-source пројектом [**Tpojka/neleceni**](https://github.com/Tpojka/neleceni) који аутоматски утишава звук преноса Народне скупштине када говори одабрани говорник. Док оригинал решава звучни део, **Ушати** додаје визуелни сатирични слој – монтирајући магареће, зечије или Огар уши у реалном времену преко лица говорника!

---

## Српски (ћирилица)

### 🚀 Шта све ради?

#### 1. YouTube уживо и видео преноси (Праћење лица у реалном времену)
- Када гледате преносе седница, конференције или било који видео на YouTube-у, проширење поставља провидно платно (`<canvas>`) преко видео плејера.
- Користи локални модел за препознавање лица (`face-api.js`) који у прегледачу препознаје Вучића, па уши добија само он, а не сви у кадру. У подешавањима се може укључити и режим „сва лица“.
- На врх главе поставља уши које динамички прате величину лица, нагиб главе и кретање по екрану, уз благо комично мрцкање/мрдање!
- Ради локално, без слања података на интернет и са минималном потрошњом процесора (детекција се ради на смањеном фрејму, а приказ тече у 60 FPS).

#### 2. Скенирање новинских портала (Nova, N1, Blic, Kurir, Informer, Danas...)
- Када отворите било који домаћи портал, проширење скенира слике и чланке.
- Ако препозна да се у наслову, тексту или опису слике помиње председник или Вучић, аутоматски проналази лице и лепи одабране уши директно на фотографију.
- Подржава бесконачно скроловање (*Infinite Scroll*) – нове вести аутоматски добијају уши чим се учитају на екран.

### 🎨 Модели ушију на избор
- 🐴 **Магареће уши** – дугачке сиве уши са розе унутрашњошћу
- 🐰 **Зечије уши** – беле уши са једним повијеним врхом
- 👹 **Огар уши** – зелене огарске трубице
- 😈 **Ђавољи рогови** – црвени зашиљени рогови са сјајем
- 🐶 **Псеће уши** – смеђе ловачке уши

У искачућем (*popup*) менију можете подешавати и величину ушију (од diskretnih до огромних карикатурних 0.8x–2.2x), анимацију мрцкања и филтрирање.

### 🛠️ Инсталација (у 3 корака)
1. Преузмите овај репозиторијум (`git clone https://github.com/inside83/usati.git` или кликните на **Code -> Download ZIP** и распакујте).
2. Отворите страницу за проширења у вашем прегледачу:
   - **Chrome:** `chrome://extensions`
   - **Brave:** `brave://extensions`
   - **Edge:** `edge://extensions`
3. У горњем десном углу укључите **Developer mode** (Режим за програмере).
4. Кликните на **Load unpacked** (Учитај нераспаковано) у горњем левом углу и изаберите преузету фасциклу.

---

## Srpski (latinica)

### 🚀 Šta sve radi?

#### 1. YouTube uživo i video prenosi (Praćenje lica u realnom vremenu)
- Tokom prenosa sjednica Skupštine ili bilo kog YouTube videa, proširenje preko plejera postavlja providno platno (`<canvas>`).
- Koristi lokalni model za prepoznavanje lica (`face-api.js`) koji u pregledaču prepoznaje Vučića, pa uši dobija samo on, a ne svi u kadru. U podešavanjima se može uključiti i režim „sva lica“.
- Montira odabrane uši koje prate pokrete, nagib i zumiranje glave, uz animaciju mrckanja.

#### 2. Skeniranje novinskih portala
- Automatski prepoznaje članke i fotografije gdje se pominje predsjednik ili Vučić na vodećim portalima (*Nova, N1, Blic, Kurir, Informer, Danas, Politika, Telegraf, Mondo, Alo, B92, RTS...*).
- Pronalazi lica na slikama i montira smiješne uši direktno u članku.

### 🎨 Izbor modela
- 🐴 Magareće uši
- 🐰 Zečije uši
- 👹 Ogar uši
- 😈 Đavolji rogovi
- 🐶 Pseće uši

### 🛠️ Instalacija
1. Preuzmite repozitorijum kao ZIP arhiv i raspakujte ga.
2. Otvorite `chrome://extensions` (ili `brave://extensions` / `edge://extensions`).
3. Uključite **Developer mode** u gornjem desnom uglu.
4. Kliknite na **Load unpacked** i odaberite fasciklu projekta.

---

## English

### 🚀 Overview
**Ušati** is a lightweight, satirical browser extension that tracks faces in real-time and overlays funny cartoon ears (donkey, bunny, ogre/ogre, devil horns, dog ears) on YouTube streams and news portals.

### 🌟 Features
- **Real-Time YouTube Tracking:** Uses offline face detection and recognition (`face-api.js`, MIT) running locally on WebGL/CPU, so only the selected politician gets ears unless "all faces" mode is on. No video feeds or frames leave your machine.
- **Smart News Portal Scanner:** Scans news articles and image captions; when target political figures are identified, it automatically overlays ears onto the photos.
- **Customizable Styles:** Choose from 5 different SVG ear styles with adjustable scaling (0.8x to 2.2x) and optional ear-twitch animations.
- **100% Client-Side:** Zero analytics, zero data collection, privacy-respecting and fully offline-capable.

### 🛠️ How to install
1. Clone or download this repository as a `.zip` archive and extract it.
2. Navigate to `chrome://extensions` in your Chromium-based browser (Chrome, Brave, Edge, Opera).
3. Enable **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** and select the folder containing `manifest.json`.

---

## 📜 License & Credits
- **License:** [MIT License](LICENSE)
- **Credits & Inspiration:** Huge credit to [@Tpojka](https://github.com/Tpojka) for the original [neleceni](https://github.com/Tpojka/neleceni) project!
