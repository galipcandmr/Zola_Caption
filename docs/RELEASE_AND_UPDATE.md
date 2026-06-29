# Release ve Otomatik Guncelleme

Bu dokuman beta release hazirlama, GitHub'a yukleme ve otomatik guncelleme mantigini anlatir.

## Surum Numarasi

Surumler `0.5.35` gibi tutulur. Panel icinde `v0.5.35` olarak gorunur.

Degistirilmesi gereken yerler:

- `outputs/capiton-premiere-cep-plugin/src/cep-app.js`
  - `CURRENT_VERSION`
- `outputs/capiton-premiere-cep-plugin/index.html`
  - UI version text
  - cache bust queryleri
- `outputs/capiton-premiere-cep-plugin/CSXS/manifest.xml`
  - `ExtensionBundleVersion`
  - `Extension Version`
- `outputs/capiton-premiere-cep-plugin/updates/update.json`
  - `latest`
  - `downloadUrl`
  - `notes`
- `README.md` ve dokumanlar gerekiyorsa.

## Paket Olusturma

Zip:

```bash
scripts/package-release.sh 0.5.35
```

Cikti:

```text
dist/Zola-Caption-v0.5.35.zip
```

DMG:

```bash
scripts/build-macos-dmg.sh 0.5.35
```

Cikti:

```text
dist/Zola-Caption-v0.5.35.dmg
```

## GitHub Release Yukleme

Ornek:

```bash
gh release create v0.5.35 \
  dist/Zola-Caption-v0.5.35.zip \
  dist/Zola-Caption-v0.5.35.dmg \
  --repo galipcandmr/Zola_Caption \
  --title "Zola Caption v0.5.35" \
  --notes "Release notlari"
```

Var olan release'e asset yuklemek:

```bash
gh release upload v0.5.35 dist/Zola-Caption-v0.5.35.zip dist/Zola-Caption-v0.5.35.dmg --clobber --repo galipcandmr/Zola_Caption
```

## Update JSON

Dosya:

```text
outputs/capiton-premiere-cep-plugin/updates/update.json
```

Ornek:

```json
{
  "latest": "0.5.35",
  "minSupported": "0.5.30",
  "mandatory": false,
  "downloadUrl": "https://github.com/galipcandmr/Zola_Caption/releases/download/v0.5.35/Zola-Caption-v0.5.35.zip",
  "installMode": "engine",
  "notes": [
    "Tek tik otomatik guncelleme akisi eklendi."
  ]
}
```

Alanlar:

- `latest`: En yeni surum.
- `minSupported`: Bundan eski surumler zorunlu update sayilir.
- `mandatory`: `true` ise Daha sonra butonu kapatilir.
- `downloadUrl`: Zip release asset URL'i.
- `installMode`: Su an `engine`.
- `notes`: Modal'da gorunen release notlari.

## Otomatik Guncelleme Nasil Calisir?

1. Panel acilista `window.CAPITON_UPDATE_URL` uzerinden `update.json` okur.
2. `latest` mevcut `CURRENT_VERSION`'dan buyukse modal acar.
3. Kullanici `Guncelle` der.
4. Panel `POST /install-update` endpoint'ine `downloadUrl`, `version`, `extensionPath` gonderir.
5. Engine zip'i indirir.
6. Zip icinden:
   - `capiton-premiere-cep-plugin` klasoru CEP hedefine kurulur.
   - `capiton-local-engine` klasoru engine hedefine kurulur.
7. `.env` ve `work/` korunur.
8. LaunchAgent yenilenir.
9. Kullanici Premiere'i kapatip acar.

## Beta Tester Icin Ilk Kurulum

Eski build'lerde otomatik update yoksa kullanici bir kez DMG kurmalidir:

```text
Zola-Caption-v0.5.35.dmg
```

DMG icinde:

```text
Zola Caption Installer.command
```

Bundan sonraki surumler panelden otomatik guncellenebilir.

## Handoff Paketi

Kod devri icin `dist/Zola-Caption-Handoff-YYYYMMDD-HHMM.zip` olusturulur. Bu paket:

- kaynak kodu
- dokumanlari
- scriptleri
- release assetlerini

icerir; `.env`, `work/`, `.git`, runtime cache ve gecici dosyalari icermez.

