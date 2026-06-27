# Capiton Local Engine

Premiere panelinin localhost üzerinden konuşacağı offline transkripsiyon motoru.

## Çalıştırma

```bash
node /Users/zoladijital/Documents/Codex/2026-06-18/premier-proda-eklenti-yani-plugin-yapabiliyormusun/outputs/capiton-local-engine/server.js
```

Varsayılan adres:

`http://127.0.0.1:17771`

## Whisper kurulumu

Bu klasör bağımsız paket mimarisidir ama büyük binary/model dosyaları şu an repoya gömülü değil.

Mac için:

```bash
cd /Users/zoladijital/Documents/Codex/2026-06-18/premier-proda-eklenti-yani-plugin-yapabiliyormusun/outputs/capiton-local-engine
chmod +x scripts/bootstrap-whisper-macos.sh
scripts/bootstrap-whisper-macos.sh
```

Beklenen dosyalar:

- `bin/whisper-cli`
- `models/ggml-small.bin`

Panel `Altyazı üret` dediğinde seçili Premiere track'indeki kaynak medyayı bu engine'e gönderir.

## Google çeviri

Metin çevirisi Google Cloud Translation Basic ile yapılır. API anahtarını koda gömme; engine'i şu ortam değişkenlerinden biriyle başlat:

```bash
CAPITON_GOOGLE_TRANSLATE_API_KEY="GOOGLE_API_KEYIN" node server.js
```

veya:

```bash
GOOGLE_TRANSLATE_API_KEY="GOOGLE_API_KEYIN" node server.js
```

Otomatik çalışan lokal engine için aynı klasöre `.env` dosyası koyabilirsin:

```bash
CAPITON_GOOGLE_TRANSLATE_API_KEY=GOOGLE_API_KEYIN
```

İlk etapta panelde desteklenen çeviri dilleri:

- Türkçe
- İngilizce
- Almanca
- Rusça

Panel, çeviri yapmadan önce editördeki son altyazı metnini engine'e gönderir. Yani kullanıcı bir kelimeyi düzelttiyse Google'a düzeltilmiş hali gider.
