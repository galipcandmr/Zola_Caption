# Zola Caption

Zola Dijital icin Premiere Pro altyazi paneli.

## Klasorler

- `outputs/capiton-premiere-cep-plugin`: Premiere CEP paneli.
- `outputs/capiton-local-engine`: Lokal Whisper ve Google Translate motoru.
- `scripts/package-release.sh`: Beta release zip paketi olusturur.

## GitHub Beta Update Akisi

1. GitHub'da `galipcandmr/Zola_Caption` reposunu ac.
2. Bu klasoru git repo yap ve remote olarak GitHub reposuna bagla.
3. Her beta surumde `scripts/package-release.sh 0.5.34` ile paket olustur.
4. Zip dosyasini GitHub Releases altina yukle.
5. `outputs/capiton-premiere-cep-plugin/updates/update.json` dosyasindaki bilgileri yeni release'e gore guncelle.
6. Panel acilista update JSON'u kontrol eder.

## Update JSON

Panel su semayi okur:

```json
{
  "latest": "0.5.34",
  "minSupported": "0.5.30",
  "mandatory": false,
  "downloadUrl": "https://github.com/galipcandmr/Zola_Caption/releases/download/v0.5.34/Zola-Caption-v0.5.34.zip",
  "notes": [
    "Beta guncelleme kontrol ekrani eklendi."
  ]
}
```

- `latest`: En yeni paket surumu.
- `minSupported`: Bundan eski surumler zorunlu guncelleme sayilir.
- `mandatory`: `true` ise Daha sonra butonu gizlenir.
- `downloadUrl`: Release zip adresi.
- `notes`: Panelde gosterilecek kisa degisiklik notlari.

## Guvenlik

Repo ve release paketleri `.env` dosyasini icermemeli. Google API anahtari kullanicinin lokal engine klasorunde kalir.

## Paket Olusturma

```bash
chmod +x scripts/package-release.sh
scripts/package-release.sh 0.5.33
```

Cikti:

```text
dist/Zola-Caption-v0.5.33.zip
```
