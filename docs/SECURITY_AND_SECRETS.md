# Guvenlik ve Secrets

## Commitlenmemesi Gerekenler

Asla commitlenmemeli:

- `.env`
- Google API key
- runtime `work/` dosyalari
- kullanici video/audio dosyalari
- gecici overlay render dosyalari
- `.DS_Store`

`.gitignore` bu dosyalar icin hazirlandi ama release/handoff paketi olustururken de ayrica dikkat edilmeli.

## Google API Key

Lokal development:

```text
outputs/capiton-local-engine/.env
```

Kurulu beta tester makinesi:

```text
~/Library/Application Support/Zola Caption/engine/.env
```

Beklenen:

```text
CAPITON_GOOGLE_TRANSLATE_API_KEY=...
```

Alternatif:

```text
GOOGLE_TRANSLATE_API_KEY=...
```

## Update Guvenligi

`/install-update` endpoint'i sadece su prefix ile baslayan URL'leri kabul eder:

```text
https://github.com/galipcandmr/Zola_Caption/releases/download/
```

Bu, rastgele URL'den zip indirip kurma riskini azaltir.

## Kod Imzalama

Mevcut beta installer imzasizdir. macOS Gatekeeper uyari verebilir. Beta icin kabul edilebilir ancak urunlesme icin onerilenler:

1. Apple Developer hesabindan Developer ID Application/Installer sertifikasi.
2. `.pkg` installer.
3. Notarization.
4. Sparkle benzeri imzali auto-update veya kendi imzali update dogrulamasi.

## Handoff Paketinde Secret Taramasi

Paket olusturmadan once:

```bash
rg -n "AIza|GOOGLE_TRANSLATE_API_KEY|CAPITON_GOOGLE_TRANSLATE_API_KEY" . \
  --glob '!outputs/capiton-local-engine/.env' \
  --glob '!outputs/capiton-local-engine/work/**' \
  --glob '!dist/**'
```

Sonuc sadece dokumanlarda ornek degisken adi olarak kalmali; gercek key olmamali.

