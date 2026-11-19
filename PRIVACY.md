# Privacy Policy for Ušati (Nelečeni Ears Edition)

*Last updated: November 19, 2026 (version 1.1.0)*

**Ušati** is an open-source browser extension developed by **Petrić Tools**. We are committed to protecting user privacy and ensuring full transparency regarding data practices.

---

### 1. Zero Data Collection
Ušati **does not collect, store, transmit, sell, or share any personal data, browsing history, or user information**.

### 2. Local Processing (Client-Side Only)
- All face detection and face recognition (using the open-source `face-api.js` library) execute **100% locally on your device** inside your web browser.
- The extension ships with one fixed reference: a set of 128 numbers describing the face of one public figure, computed from published news photos. It is not a photograph and a face cannot be reconstructed from it. Faces seen on pages are compared to it on your device only and are never stored.
- No video streams, images, web camera feeds, or page contents are ever transmitted over the network or uploaded to external servers.

### 3. Permissions Used
- **`storage`**: Used solely on your device to remember your UI settings and preferences (e.g., active ear style and enabled/disabled state per domain). No personal data is stored.
- **Host permissions (`*://www.youtube.com/*`, news sites)**: Required exclusively to inject the visual canvas overlay and display the decorative ear graphics on relevant web pages.

- **Fetching news photos**: when a news portal serves a photo from another domain, the extension's background script downloads that same photo directly from the portal so it can be analyzed locally. Nothing is sent anywhere else.

### 4. Third-Party Services
Ušati does not use any third-party analytics, tracking scripts, or advertising networks.

### 5. Open Source
The complete source code of Ušati is publicly available for inspection and audit at:
https://github.com/Petric-Tools/usati

### 6. Contact
If you have any questions about this privacy policy, you may reach out via GitHub Issues at:
https://github.com/Petric-Tools/usati/issues
