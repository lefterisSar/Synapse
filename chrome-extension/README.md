# Synapse — Ad Preview Consent Dismisser (Chrome extension)

A tiny, self-contained Chrome extension that dismisses Facebook's cookie-consent dialog **inside the
embedded ad-preview iframe**, so the Ad Previews tab renders cleanly without depending on Windscribe
(or any third-party tool).

## Why this works when the app itself can't

The preview is a **cross-origin `business.facebook.com` iframe**. Page JavaScript (the dashboard's
own code) is forbidden by the browser from touching another origin's iframe. A **browser-extension
content script is not** — with `all_frames: true` it runs *inside* that iframe and can click the
consent button. That privilege gap is the whole reason an extension is needed.

## How it behaves

- Runs only in `facebook.com` frames, and only when Facebook is **embedded as an iframe** (it skips
  top-level facebook.com, so it never touches your normal Facebook browsing).
- Clicks **"Decline optional cookies"** (falling back to essential/allow) the moment the dialog
  appears, revealing the ad. No network blocking, no tracking lists — purely dismisses the dialog.
- **Reports the ad's real height** back to the dashboard (via `postMessage`), so each preview card
  sizes itself to show the whole ad **without scrolling**. Without the extension the dashboard falls
  back to a fixed-height, scrollable preview.

> After editing this extension's files, click the **↻ reload** icon on its card in
> `chrome://extensions` for changes to take effect.

## Install (load unpacked)

1. Open **`chrome://extensions`**.
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select this **`chrome-extension/`** folder.
4. Reload your dashboard tab, open **Ad Previews → Live preview** — the banner should dismiss itself.

It stays installed across restarts. To update after editing the files, hit the **↻ reload** icon on
the extension card in `chrome://extensions`.

## Caveats

- **Local to your Chrome** — it only affects browsers where *you* installed it (same as Windscribe).
- **Depends on the button labels** in `dismiss-consent.js`. If Meta renames them, update that list.
- It **clicks** the consent button rather than hiding it, so the ad renders normally underneath.

## Prefer a maintained option?

Open-source consent auto-handlers like **Consent-O-Matic** or **"I still don't care about cookies"**
do the same thing across the whole web and are actively maintained — reasonable if you'd rather not
keep this in sync yourself. This extension is the minimal, scoped-to-Facebook version.
