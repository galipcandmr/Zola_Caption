# Troubleshooting

## Panel Premiere'de Gorunmuyor

Kontrol:

```text
~/Library/Application Support/Adobe/CEP/extensions/com.zoladijital.capiton.panel
```

Bu klasorde `CSXS/manifest.xml` ve `index.html` olmali.

Debug modu:

```bash
defaults read com.adobe.CSXS.11 PlayerDebugMode
defaults read com.adobe.CSXS.12 PlayerDebugMode
defaults read com.adobe.CSXS.13 PlayerDebugMode
```

Gerekirse installer'i tekrar calistir:

```bash
bash "dist/Zola-Caption-v0.5.35/Zola Caption Installer.command"
```

Premiere'i kapatip ac.

## Yerel Motor Bagli Degil

Health:

```bash
curl http://127.0.0.1:17771/health
```

LaunchAgent:

```bash
launchctl print gui/$(id -u)/com.zoladijital.capiton.engine
```

Loglar:

```text
/tmp/zola-caption-engine.out.log
/tmp/zola-caption-engine.err.log
```

Engine klasoru:

```text
~/Library/Application Support/Zola Caption/engine
```

## Whisper Bulunamadi

Release paketinde sunlar olmali:

```text
capiton-local-engine/bin/whisper-cli
capiton-local-engine/models/ggml-small.bin
```

Installer sonrasi hedefte:

```text
~/Library/Application Support/Zola Caption/engine/bin/whisper-cli
~/Library/Application Support/Zola Caption/engine/models/ggml-small.bin
```

## FFmpeg Bulunamadi

Release paketinde:

```text
capiton-local-engine/bin/ffmpeg
```

Health endpoint `ffmpeg` path'i dondurmelidir.

## Google Translate Calismiyor

Health endpoint'te:

```json
"googleTranslateConfigured": true
```

olmali.

`.env`:

```text
~/Library/Application Support/Zola Caption/engine/.env
```

Icerik:

```text
CAPITON_GOOGLE_TRANSLATE_API_KEY=...
```

Not: Installer `.env` dosyasini korur ama yeni kurulumda otomatik key koymaz.

## Altyazi Sesle Senkron Degil

Once su alanlara bak:

- Panelde timeline baslangici dogru mu log'da gorunuyor?
- `host.jsx` media path ve timeline start saniyesini dogru donduruyor mu?
- Whisper word timing JSON olusuyor mu?
- Overlay timeline'da video/audio ile ayni frame'den mi basliyor?

Kodda dikkat edilecek fonksiyonlar:

- `host.jsx`: audio source ve timeline offset.
- `cep-app.js`: `buildKaraokeOverlayCaptions`, `alignEditedWordsToTimings`.
- `server.js`: `parseWhisperWords`, `buildKaraokeAss`.

Senkron sorunu cozulurken onceki karar:

- Timeline baslangici Premiere'den alinan clip start degeridir.
- Overlay video timeline'da ayni start saniyesine basilir.
- Kelime vurgusu Whisper word timingleriyle eslestirilir.
- Bosluk varsa son kelime bir miktar ekranda kalir; senkronu bozmamak icin ana timing kaydirilmaz.

## Ust Uste Binen Yazi

Olasiliklar:

- Ekrandaki kelime sayisi cok yuksek.
- `groupTimedWordsForScreen` cok uzun gruplar uretiyor.
- ASS style stroke/shadow fazla buyuk.
- Font size veya scale cok yuksek.

Ilk bakilacak ayarlar:

- `wordsPerScreen`
- `fontSize`
- `strokeWidth`
- `positionY`

## Update Var Ama Kurulmuyor

Kontrol:

```bash
curl http://127.0.0.1:17771/health
```

Engine calismiyorsa panel update'i kuramaz.

Update URL sadece su prefix ile kabul edilir:

```text
https://github.com/galipcandmr/Zola_Caption/releases/download/
```

`update.json` dosyasinda download URL dogru mu kontrol et.

## DMG Aciliyor Ama Otomatik Kurulmuyor

macOS DMG acilinca script otomatik calismaz. Kullanici DMG icindeki:

```text
Zola Caption Installer.command
```

dosyasina cift tiklamalidir.

Profesyonel kurulum icin ileride `.pkg` + signing/notarization dusunulmeli.

