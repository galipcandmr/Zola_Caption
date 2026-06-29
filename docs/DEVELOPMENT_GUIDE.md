# Gelistirme Rehberi

Bu rehber lokal gelistirme, Premiere test, paketleme ve temel kontrolleri anlatir.

## Gereksinimler

- macOS.
- Adobe Premiere Pro.
- Node.js. Tester makinesinde yoksa installer indirir; gelistirici makinesinde lokal test icin gerekir.
- Python 3, statik server icin yeterlidir.
- GitHub CLI opsiyonel; release upload icin kullanisli.

Bu projede dis paket yoneticisi zorunlu degil. Panel vanilla JS/CSS/HTML ile yazildi.

## Tarayicida UI Onizleme

Premiere'e basmadan UI onizlemek icin:

```bash
python3 -m http.server 18183 --directory outputs/capiton-premiere-cep-plugin
```

Tarayici:

```text
http://127.0.0.1:18183/index.html?mock=1
```

Mock modda Premiere koprusu yoktur. UI ve style paneli test edilir, gercek timeline islemleri calismaz.

## Lokal Engine Calistirma

Gelistirme icin:

```bash
node outputs/capiton-local-engine/server.js
```

Health kontrolu:

```bash
curl http://127.0.0.1:17771/health
```

Beklenen:

```json
{
  "ok": true,
  "name": "Zola Caption Local Engine",
  "port": 17771
}
```

## Premiere'e Lokal Kurulum

Hazir release paketi varsa:

```bash
bash "dist/Zola-Caption-v0.5.35/Zola Caption Installer.command"
```

Manuel kurulum hedefleri:

```text
~/Library/Application Support/Adobe/CEP/extensions/com.zoladijital.capiton.panel
~/Library/Application Support/Zola Caption/engine
```

Premiere acildiktan sonra:

```text
Window > Extensions > Zola Caption
```

Bazi surumlerde:

```text
Window > Extensions (Legacy) > Zola Caption
```

## Debug Modu

Installer asagidaki Adobe CEP debug ayarlarini acar:

```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.13 PlayerDebugMode 1
defaults write com.adobe.CSXS.14 PlayerDebugMode 1
defaults write com.adobe.CSXS.15 PlayerDebugMode 1
```

## Google Translate Key

Lokal engine klasorunde `.env` olmalidir:

```text
~/Library/Application Support/Zola Caption/engine/.env
```

Icerik:

```text
CAPITON_GOOGLE_TRANSLATE_API_KEY=...
```

Repo icindeki `outputs/capiton-local-engine/.env` sadece lokal gelistirme icindir, commitlenmemelidir.

## Siklikla Kullanilan Komutlar

Syntax kontrol:

```bash
bash -n scripts/install-macos.sh
bash -n scripts/build-macos-dmg.sh
bash -n scripts/package-release.sh
node -c outputs/capiton-local-engine/server.js
node -c outputs/capiton-premiere-cep-plugin/src/cep-app.js
```

Release zip:

```bash
scripts/package-release.sh 0.5.35
```

DMG:

```bash
scripts/build-macos-dmg.sh 0.5.35
```

Git durum:

```bash
git status --short
git log --oneline -5
```

## Gercek Premiere Test Akisi

1. Premiere'i ac.
2. Timeline'da video + ses olan bir sequence ac.
3. Zola Caption panelini ac.
4. Hazirla ekraninda ses kanali dogru gorunuyor mu kontrol et.
5. Konusma dili `Dili otomatik sec` veya manuel sec.
6. `Altyazi uret`.
7. Altyaziyi duzenle ekraninda bir kelimeyi degistir.
8. Gerekirse ceviri hedefini sec.
9. Stil sec.
10. `Yeniden uret ve bas`.
11. Overlay timeline'da kaynak sesle ayni baslangicta mi kontrol et.
12. Kelime vurgusu okunan kelimeyle eslesiyor mu kontrol et.

## Kod Degistirme Kurallari

- UI degisikligi icin once mock browser'da bak.
- Timeline/senkron degisikligi icin mutlaka Premiere testi yap.
- `.env`, `work/`, `dist/` dosyalarini commitleme.
- Technical id'leri degistirme:
  - `com.zoladijital.capiton`
  - `com.zoladijital.capiton.panel`
  - `com.zoladijital.capiton.engine`
- UI adi `Zola Caption` olarak kalmali.
- Update JSON ile panel `CURRENT_VERSION` uyumlu olmali.

