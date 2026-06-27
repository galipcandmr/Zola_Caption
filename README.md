# Zola Caption

Zola Dijital icin Premiere Pro altyazi paneli.

## Klasorler

- `outputs/capiton-premiere-cep-plugin`: Premiere CEP paneli.
- `outputs/capiton-local-engine`: Lokal Whisper ve Google Translate motoru.
- `scripts/package-release.sh`: Beta release zip paketi olusturur.
- `scripts/build-macos-dmg.sh`: Beta tester icin tek tik macOS DMG kurulum paketi olusturur.
- `scripts/install-macos.sh`: DMG ve zip icindeki otomatik macOS kurulum script'i.

## GitHub Beta Update Akisi

1. GitHub'da `galipcandmr/Zola_Caption` reposunu ac.
2. Bu klasoru git repo yap ve remote olarak GitHub reposuna bagla.
3. Her beta surumde `scripts/package-release.sh 0.5.35` ile paket olustur.
4. Zip dosyasini GitHub Releases altina yukle.
5. `outputs/capiton-premiere-cep-plugin/updates/update.json` dosyasindaki bilgileri yeni release'e gore guncelle.
6. Panel acilista update JSON'u kontrol eder.
7. Kullanici `Guncelle` dediginde panel yerel motora otomatik kurulum komutu gonderir; zip iner, CEP paneli ve engine dosyalari kopyalanir.

## Update JSON

Panel su semayi okur:

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

- `latest`: En yeni paket surumu.
- `minSupported`: Bundan eski surumler zorunlu guncelleme sayilir.
- `mandatory`: `true` ise Daha sonra butonu gizlenir.
- `downloadUrl`: Release zip adresi.
- `installMode`: `engine` ise panel, yerel motor uzerinden otomatik kurulum yapar.
- `notes`: Panelde gosterilecek kisa degisiklik notlari.

## Guvenlik

Repo ve release paketleri `.env` dosyasini icermemeli. Google API anahtari kullanicinin lokal engine klasorunde kalir.

## Paket Olusturma

```bash
chmod +x scripts/package-release.sh
scripts/package-release.sh 0.5.35
```

Cikti:

```text
dist/Zola-Caption-v0.5.35.zip
```

## macOS DMG Olusturma

```bash
scripts/build-macos-dmg.sh 0.5.35
```

Cikti:

```text
dist/Zola-Caption-v0.5.35.dmg
```

DMG icindeki `Zola Caption Installer.command` beta tester bilgisayarinda sunlari otomatik yapar:

- Premiere CEP panelini `~/Library/Application Support/Adobe/CEP/extensions/com.zoladijital.capiton.panel` klasorune kurar.
- Yerel motoru `~/Library/Application Support/Zola Caption/engine` klasorune kurar.
- Google API anahtari bulunan `.env` dosyasini korur.
- macOS LaunchAgent kurarak yerel motoru acilista otomatik baslatir.
- Node yoksa hafif runtime'i uygulama destek klasorune indirir.
- Premiere Legacy Extension debug modunu acar.
