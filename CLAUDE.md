# Zola Caption - Claude Code Handoff

Bu dosya projeyi devralacak geliştirici veya Claude Code oturumu için ilk okunacak kısa rehberdir.

## Proje Özeti

Zola Caption, Adobe Premiere Pro icin gelistirilmis bir CEP/Legacy Extension altyazi panelidir. Panel timeline'daki sesi bulur, lokal Whisper ile metne cevirir, kullanicinin panelde duzenledigi altyaziyi animasyonlu/karaoke tarzinda overlay video olarak render eder ve Premiere timeline'a basar. Ayrica Google Cloud Translation Basic ile altyazi cevirisi ve GitHub Release uzerinden beta guncelleme akisina sahiptir.

## En Onemli Uyari

Altyazi senkronizasyonu zor stabil hale getirildi. Su alanlara dokunmadan once mutlaka mevcut davranisi test et:

- `outputs/capiton-premiere-cep-plugin/src/cep-app.js`
  - `applySynchronizedOverlayToTimeline`
  - `buildKaraokeOverlayCaptions`
  - `groupTimedWordsForScreen`
  - `alignEditedWordsToTimings`
  - `buildSequentialWordItems`
- `outputs/capiton-local-engine/server.js`
  - `parseWhisperWords`
  - `renderOverlay`
  - `buildKaraokeAss`
  - `captionDialogueTag`

Bu kisimlar kelime kelime vurgu, ekranda kac kelime gorunecegi, timeline baslangici ve overlay video suresi icin kritik.

## Ana Klasorler

- `outputs/capiton-premiere-cep-plugin/`: Premiere icinde calisan CEP paneli.
- `outputs/capiton-premiere-cep-plugin/jsx/host.jsx`: Premiere ExtendScript koprusu.
- `outputs/capiton-local-engine/`: Node tabanli lokal motor. Whisper, ceviri ve overlay render burada.
- `scripts/package-release.sh`: Release zip uretir.
- `scripts/build-macos-dmg.sh`: macOS DMG installer uretir.
- `scripts/install-macos.sh`: DMG/zip icindeki macOS kurulum script'i.
- `docs/`: Devir, mimari, release, troubleshooting ve guvenlik notlari.

## Guncel Uretim Surumu

Bu handoff hazirlandiginda ana surum `v0.5.35`.

GitHub:

- Repo: `galipcandmr/Zola_Caption`
- Release akisi: GitHub Releases + `outputs/capiton-premiere-cep-plugin/updates/update.json`

## Lokal Calistirma

Paneli tarayicida onizlemek icin statik server ac:

```bash
python3 -m http.server 18183 --directory outputs/capiton-premiere-cep-plugin
```

Sonra:

```text
http://127.0.0.1:18183/index.html?mock=1
```

Premiere icinde calismasi icin CEP klasorune kurulmasi gerekir:

```bash
bash "dist/Zola-Caption-v0.5.35/Zola Caption Installer.command"
```

## Secrets

`.env` dosyasi repo ve handoff paketine konmamali. Google key su dosyada lokal kalir:

```text
~/Library/Application Support/Zola Caption/engine/.env
```

Beklenen degiskenler:

```text
CAPITON_GOOGLE_TRANSLATE_API_KEY=...
GOOGLE_TRANSLATE_API_KEY=...
```

## Test Checklist

1. Premiere icinde panel aciliyor mu?
2. A1/A2 ses kanallari dogru listeleniyor mu?
3. Lokal motor `/health` donuyor mu?
4. Turkce video icin altyazi cikariyor mu?
5. Editor'de duzenlenen kelime timeline'a aynen gidiyor mu?
6. Overlay senkronu kaymadan basliyor mu?
7. Kelime vurgusu okunan kelimeyle eslesiyor mu?
8. Ceviri secilen hedef dile, editor'deki guncel metinden yapiliyor mu?
9. Guncelleme modal'i yeni version varsa gorunuyor mu?
10. DMG installer temiz makinede kurulum yapiyor mu?

Detayli bilgi icin `docs/HANDOFF.md` ile basla.
