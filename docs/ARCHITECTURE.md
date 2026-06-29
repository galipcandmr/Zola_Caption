# Mimari

Zola Caption iki ana parcadan olusur:

1. Premiere icinde calisan CEP panel.
2. Mac uzerinde localhost'ta calisan lokal engine.

```text
Premiere Pro
  |
  | CEP panel UI
  v
outputs/capiton-premiere-cep-plugin/index.html
outputs/capiton-premiere-cep-plugin/src/cep-app.js
  |
  | window.__adobe_cep__.evalScript(...)
  v
outputs/capiton-premiere-cep-plugin/jsx/host.jsx
  |
  | aktif sekans, audio track, medya path, timeline offset
  v
CEP panel JS
  |
  | HTTP POST http://127.0.0.1:17771/*
  v
outputs/capiton-local-engine/server.js
  |
  | whisper-cli / ffmpeg / Google Translate
  v
SRT + kelime timing + overlay .mov
  |
  | ExtendScript ile import
  v
Premiere timeline
```

## CEP Panel

Klasor:

```text
outputs/capiton-premiere-cep-plugin/
```

Onemli dosyalar:

- `CSXS/manifest.xml`: CEP manifest. Menu adi, extension id ve host support burada.
- `index.html`: Panel HTML.
- `styles.css`: Panel UI.
- `src/cep-app.js`: Ana uygulama mantigi.
- `src/update-config.js`: GitHub update JSON URL'i.
- `jsx/host.jsx`: Premiere ExtendScript koprusu.
- `updates/update.json`: Release manifest.
- `assets/brand/`: Logo dosyalari.

### cep-app.js Sorumluluklari

`cep-app.js` buyuk dosyadir ve su sorumluluklari tasir:

- UI elementlerini bind eder.
- Ses tracklerini okur.
- Transkripsiyon ve ceviri isteklerini lokal engine'e yollar.
- Caption editor state'ini tutar.
- Stil/preset UI'ini render eder.
- Overlay render payload'u olusturur.
- Render edilen overlay'i Premiere timeline'a import eder.
- GitHub update kontrolu ve otomatik kurulum tetiklemesini yapar.

En kritik fonksiyon gruplari:

- Audio/sequence:
  - `autoLoadAudioTracks`
  - `listSequenceAudioTracks`
  - `getAudioSource`
- Transkripsiyon:
  - `transcribeSelectedTimelineAudio`
  - `runTimelineTranscription`
- Ceviri:
  - `translateCaptionsToTarget`
  - `translateDraft`
- Editor ve bolme:
  - `syncCaptionsFromEditor`
  - `reflowEditorCaptions`
  - `splitCaptionsForEditor`
  - `splitWordItemsBySmartLimit`
- Overlay/senkron:
  - `applySynchronizedOverlayToTimeline`
  - `buildKaraokeOverlayCaptions`
  - `groupTimedWordsForScreen`
  - `alignEditedWordsToTimings`
- Update:
  - `checkForUpdates`
  - `installAvailableUpdate`

## ExtendScript Bridge

Dosya:

```text
outputs/capiton-premiere-cep-plugin/jsx/host.jsx
```

Sorumluluklari:

- Aktif sequence'i okur.
- Ses tracklerini ve track uzerindeki clip sayilarini bulur.
- Secilen track icin kaynak medya path'ini bulur.
- Timeline start/end ve source in/out offsetlerini dondurur.
- Render edilen overlay video dosyasini Premiere'e import eder.
- Overlay'i timeline'a dogru baslangic saniyesinde yerlestirir.

Onemli not: Premiere scripting API bazen surumden surume tutarsiz davranir. Bu yuzden `host.jsx` icinde birden fazla fallback yolu vardir. Gereksiz sadeleştirme yapma.

## Lokal Engine

Klasor:

```text
outputs/capiton-local-engine/
```

Onemli dosyalar:

- `server.js`: Node HTTP server.
- `bin/`: whisper-cli, ffmpeg ve dinamik kutuphaneler release paketinde bulunur.
- `models/ggml-small.bin`: Whisper modeli release paketinde bulunur.
- `.env.example`: Ornek env.
- `scripts/bootstrap-whisper-macos.sh`: Ilk kurulum/binary hazirlama yardimcisi.

### Engine Endpointleri

- `GET /health`
  - Engine, whisper, ffmpeg, model ve Google key durumunu dondurur.
- `POST /transcribe`
  - Medyadan ses cikarir, Whisper ile SRT ve word timing uretir.
- `POST /translate`
  - Caption listesini Google Cloud Translation Basic ile cevirir.
- `POST /render-overlay`
  - Caption + preset payload'undan seffaf overlay video uretir.
- `POST /install-update`
  - GitHub Release zip'ini indirir ve panel/engine guncellemesini kurar.

## Transkripsiyon

Engine `whisper-cli` calistirir:

- Audio wav'e donusturulur.
- `-osrt` ile SRT.
- `-oj` ve `-ojf` ile JSON word timing.
- Dil `auto`, `tr`, `en`, `de`, `ru` vb. olabilir.
- Task `transcribe` veya Whisper'in destekledigi `translate` modunda olabilir.

## Word Timing ve Senkronizasyon

Senkronizasyon icin sadece SRT yeterli degildir. Whisper JSON icinden kelime timingleri parse edilir. Panelde metin duzenlenirse su strateji uygulanir:

1. Editor'deki guncel metin kelimelere bolunur.
2. Whisper word timingleri normalize edilir.
3. Duzenlenen kelimeler mevcut timinglere yaklastirilir.
4. Ekrandaki kelime sayisi ayarina gore caption gruplari uretilir.
5. Kelime vurgusu icin her kelimeye `activeStart/activeEnd` araligi verilir.
6. Engine bu timinglerle ASS dialogue eventleri uretir.

Bu akisin bozulmasi gecikme, vurgu kaymasi veya ust uste yazilar yaratir.

## Overlay Render

Engine `renderOverlay` endpoint'inde FFmpeg + ASS kullanir.

Stil bilgileri:

- font family
- font size
- primary color
- highlight/accent color
- stroke color/width
- shadow
- box
- position
- letter case
- animation

ASS dosyasi `buildKaraokeAss` veya `buildAss` ile uretilir. Sonra FFmpeg seffaf `.mov` overlay olusturur. Premiere tarafinda bu overlay video timeline'a eklenir.

## Ceviri

Ceviri Google Cloud Translation Basic API ile yapilir. Panel ceviri yapmadan once editor'deki guncel caption metnini `syncCaptionsFromEditor` ile state'e alir. Boylece kullanici hatali kelimeleri duzelttiyse ceviri duzeltilen metinden yapilir.

Desteklenen hedefler urun ihtiyacina gore sinirli tutulabilir. Ilk hedef diller:

- Turkce
- Ingilizce
- Almanca
- Rusca

## Otomatik Guncelleme

Update akisinda iki katman var:

- Panel: update JSON'u kontrol eder, modal/badge gosterir.
- Engine: zip indirir, klasorleri kopyalar, LaunchAgent yeniler.

Update endpoint:

```text
POST /install-update
```

Guvenlik olarak sadece `https://github.com/galipcandmr/Zola_Caption/releases/download/` ile baslayan URL kabul edilir.

## Kurulum Hedefleri

CEP panel:

```text
~/Library/Application Support/Adobe/CEP/extensions/com.zoladijital.capiton.panel
```

Engine:

```text
~/Library/Application Support/Zola Caption/engine
```

LaunchAgent:

```text
~/Library/LaunchAgents/com.zoladijital.capiton.engine.plist
```

Node runtime:

```text
~/Library/Application Support/Zola Caption/runtime/
```

