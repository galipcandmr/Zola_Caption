# Known Limitations ve Sonraki Adimlar

## Mevcut Limitler

- Sadece macOS hedeflendi.
- CEP/Legacy Extension kullaniliyor; Adobe uzun vadede UXP tarafina agirlik verebilir.
- Installer `.command` tabanli; macOS'ta kullanici cift tiklamali.
- DMG imzasiz/notarize edilmemis.
- Google resmi kalan kota bilgisi panelden okunmuyor; panel sadece lokal tahmini karakter sayaci tutuyor.
- `capiton` technical id'leri korunuyor. UI adi Zola Caption olsa da extension id degismedi.
- Stiller ASS/FFmpeg overlay motoruyla calisiyor; Premiere icindeki native text layer olarak tek tek duzenlenebilir degil.
- Render edilen altyaziyi sonradan duzenlemek icin panelde degistirip yeniden render etmek gerekir.

## Neden Native Premiere Text Degil?

MOGRT ve native text denemelerinde:

- Kelime vurgusu tutarsiz calisti.
- Sadece ilk kelime gorunme sorunlari oldu.
- Stroke/renkler template'e gore bozuldu.
- Senkronizasyon kontrolu zordu.

Bu yuzden final output icin overlay video yolu secildi.

## Onerilen Sonraki Adimlar

1. `.pkg` installer:
   - Daha profesyonel kurulum.
   - DMG icinde `.pkg`.
   - Kullanici deneyimi daha temiz.
2. Signing/notarization:
   - Gatekeeper uyarilarini azaltir.
3. Dashboard:
   - Kullanici hesaplari.
   - Lisans/abonelik.
   - Google API key merkezi yonetim.
   - Kullanim/kota raporlari.
4. Update imza dogrulamasi:
   - Release zip checksum veya imza kontrolu.
5. Stil editoru:
   - Preset export/import.
   - Marka bazli preset setleri.
6. Error reporting:
   - Beta tester loglarini merkezi toplama.
7. Windows destegi:
   - CEP path, launch service ve binary farklari ayrica ele alinmali.

