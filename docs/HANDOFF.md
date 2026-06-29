# Zola Caption Handoff

Bu dokuman, projeyi yeni bir gelistiriciye veya Claude Code'a devretmek icin hazirlandi. Amac: projeyi acan kisi neyin nerede oldugunu, bugune kadar nelerin eklendigini, hangi kisimlarin hassas oldugunu ve release akisini anlayabilsin.

## Urun Ne Yapar?

Zola Caption, Adobe Premiere Pro icinde calisan bir altyazi panelidir.

Ana workflow:

1. Premiere timeline'daki aktif sekans ve ses kanallari okunur.
2. Secilen audio track'teki medya yolu ve timeline offset'i ExtendScript ile alinir.
3. Lokal Node motoru medyadan sesi cikarir.
4. Whisper.cpp lokal model ile transkripsiyon yapar.
5. Panelde caption bloklari duzenlenebilir.
6. Istenirse Google Translate ile hedef dile ceviri yapilir.
7. Secilen stil/renk/vurgu ayarlarina gore FFmpeg + ASS ile seffaf overlay video render edilir.
8. Overlay video Premiere timeline'a, kaynak sesin basladigi saniyeye eklenir.
9. GitHub Release uzerinden otomatik beta guncelleme yapilir.

## Kullanici Senaryolari

Baslangictaki hedef senaryolar:

- Turkce konusmaya Turkce altyazi.
- Ingilizce konusmaya Ingilizce altyazi.
- Turkce konusmaya Ingilizce altyazi.
- Turkce altyaziyi panelde duzelttikten sonra hedef dile ceviri.
- Marka/stil presetleri ile animasyonlu/karaoke gorunumlu altyazi.

Simdiki uygulama bu senaryolardan en kritik olanlarini kapsar: timeline sesinden lokal transkripsiyon, panelde duzeltme, ceviri, stil secimi, overlay render ve timeline'a basma.

## Mevcut Durum

Guncel surum: `v0.5.35`

Calisan ana parcalar:

- Premiere CEP panel.
- Premiere ExtendScript koprusu.
- Lokal Node engine.
- Whisper.cpp + `ggml-small.bin`.
- FFmpeg ile seffaf overlay render.
- Google Cloud Translation Basic.
- GitHub update kontrolu.
- Otomatik zip tabanli update installer.
- macOS DMG installer.

Hala ileride iyilestirilecek alanlar:

- `.pkg` tabanli daha profesyonel macOS installer.
- Developer ID signing + notarization.
- Dashboard/kullanici lisans sistemi.
- Google kota bilgisi icin Cloud Quotas/Billing entegrasyonu.
- Windows destegi.
- Daha temiz template editoru ve kullaniciya ait preset store.

## Repo ve Release

GitHub repo:

```text
https://github.com/galipcandmr/Zola_Caption
```

Release dosyalari GitHub Release asset olarak yuklenir:

- `Zola-Caption-vX.Y.Z.zip`: Panel + engine + installer.
- `Zola-Caption-vX.Y.Z.dmg`: macOS beta tester installer.

Normal repo commitlerinde buyuk binary/model dosyalari takip edilmez. Bunlar release paketinde yer alir.

## Kritik Prensipler

- `.env` hicbir zaman commitlenmez ve handoff paketine konmaz.
- `outputs/capiton-local-engine/work/` runtime copudur, devre dahil edilmez.
- `dist/` release output'tur, repo icin ignore edilir; handoff paketinde sadece gerekli release artifact'leri ayrica verilir.
- Premiere CEP id'leri `com.zoladijital.capiton...` olarak kalmistir. UI adi Zola Caption olsa da bu id'leri degistirmek mevcut beta kurulumlarini kirabilir.
- Senkronizasyon koduna dokunurken mutlaka gercek Premiere test yap.

## Kurulum Mantigi

DMG icindeki `Zola Caption Installer.command` sunlari yapar:

- CEP paneli `~/Library/Application Support/Adobe/CEP/extensions/com.zoladijital.capiton.panel` klasorune kopyalar.
- Lokal engine'i `~/Library/Application Support/Zola Caption/engine` klasorune kopyalar.
- `.env` dosyasini korur.
- Node yoksa `~/Library/Application Support/Zola Caption/runtime` altina Node runtime indirir.
- LaunchAgent yazar: `~/Library/LaunchAgents/com.zoladijital.capiton.engine.plist`.
- `launchctl` ile lokal engine'i baslatir.
- Adobe CEP debug modunu acar.

## Otomatik Guncelleme Mantigi

Panel acilista update JSON okur:

```text
outputs/capiton-premiere-cep-plugin/updates/update.json
```

Production URL:

```text
https://raw.githubusercontent.com/galipcandmr/Zola_Caption/main/outputs/capiton-premiere-cep-plugin/updates/update.json
```

Yeni surum varsa modal gosterilir. Kullanici `Guncelle` derse panel `http://127.0.0.1:17771/install-update` endpoint'ine zip adresini yollar. Lokal engine zip'i indirir, CEP paneli ve engine klasorlerini gunceller.

Onemli: Tam otomatik update akisi `v0.5.35` ve sonrasinda vardir. Daha eski beta tester'lar bir kez DMG ile `v0.5.35` kurmalidir.

## Devralan Kisi Once Ne Yapmali?

1. `CLAUDE.md` dosyasini oku.
2. `docs/ARCHITECTURE.md` dosyasini oku.
3. `docs/DEVELOPMENT_GUIDE.md` icindeki lokal calistirma adimlarini uygula.
4. `docs/TROUBLESHOOTING.md` icindeki Premiere/engine kontrollerini incele.
5. Gercek Premiere testini yapmadan render/senkron kodunu degistirme.

## Kullanilan Teknolojiler

- Adobe CEP / Legacy Extension.
- ExtendScript JSX.
- Vanilla HTML/CSS/JavaScript.
- Node.js HTTP server.
- whisper.cpp / whisper-cli.
- FFmpeg.
- ASS subtitle styling.
- Google Cloud Translation Basic.
- GitHub Releases.
- macOS LaunchAgent.
- hdiutil DMG packaging.

