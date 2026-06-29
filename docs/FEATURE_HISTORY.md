# Feature History

Bu dokuman projede bugune kadar eklenen ana ozellikleri ve kritik karar noktalarini ozetler.

## 1. Premiere Plugin Yaklasimi

Ilk hedef Premiere Pro icin altyazi ureten bir paneldi. UXP Developer Tool kurulumu problemli oldugu icin CEP/Legacy Extension yolu secildi.

Karar:

- CEP panel + ExtendScript koprusu.
- Panel HTML/CSS/vanilla JS ile yazildi.
- Premiere timeline islemleri `host.jsx` icinde tutuldu.

## 2. Audio Track Bulma

Baslangicta panel ses kanallarini goremedi. Premiere API'nin audio track koleksiyonlari farkli surumlerde tutarsiz oldugu icin `host.jsx` icinde birden fazla fallback yazildi:

- `getTrackAt`
- `getItemAt`
- index access
- linked media fallback
- timeline media fallback

Son durumda tek aktif audio varsa otomatik A1 secilir; birden fazla aktif track varsa kullanici secim yapabilir.

## 3. Lokal Transkripsiyon

Maliyet hedefi sifira yakin oldugu icin lokal Whisper tercih edildi.

Eklenenler:

- whisper.cpp / `whisper-cli`
- `ggml-small.bin`
- FFmpeg ile audio extract
- SRT + JSON word timing uretimi

## 4. Panel Editoru

Transkripsiyon sonucunda caption bloklari panelde duzenlenebilir hale getirildi. Onemli karar:

- Timeline'a basarken editor'deki en guncel metin kullanilir.
- Kullanici panelde kelime duzelttiyse ceviri ve render duzeltilen metinden yapilir.

## 5. Kelime Sayisi ve Akilli Bolme

Kullanicinin ekranda ayni anda kac kelime gorunecegini belirlemesi eklendi. Manuel buton yerine kelime sayisi degisince otomatik bolme mantigi kuruldu.

## 6. MOGRT Denemeleri

Captioneer MOGRT dosyalari incelendi ve projeye alindi. Ancak MOGRT icinde metin/vurgu senkronu ve stilleri kontrol etmek Premiere tarafinda tutarsiz davrandi.

Son karar:

- Final goruntu icin MOGRT yerine senkron overlay video render tercih edildi.
- Stil onizleme ve preset kartlari panelde kaldirilmadi ama timeline output ana yol olarak FFmpeg overlay kullanir.

## 7. Overlay Render

FFmpeg + ASS ile transparent `.mov` overlay uretilir.

Bu cozum su sorunlari cozdu:

- Vurgu kelimesinin kaymasi.
- MOGRT icinde sadece ilk kelimenin gorunmesi.
- Stroke/renklerin Premiere tarafinda tutarsizligi.
- Caption'in timeline'a yanlis baslangicla gelmesi.

## 8. Senkronizasyon Stabilizasyonu

En cok zaman alan konu ses ve altyazinin ayni anda baslamasi ve kelime vurgusunun dogru zamanda calismasiydi.

Kararlar:

- Premiere'den timeline start saniyesi alinir.
- Overlay timeline'a bu start saniyesinde basilir.
- Whisper word timingleri overlay icinde lokal zaman olarak kullanilir.
- Kisa bosluklarda son kelime ekranda biraz kalabilir ama global timing kaydirilmaz.

## 9. Ceviri

Whisper'in translate modunun sadece Ingilizce odakli oldugu fark edildi. Urun ihtiyaci Turkce, Ingilizce, Almanca ve Rusca gibi hedef dillere ceviri oldugu icin Google Cloud Translation Basic eklendi.

Onemli:

- Ceviri editor'deki guncel caption metninden yapilir.
- API key `.env` icinde lokal kalir.
- Kullanim sayaci panelde lokal tahmini olarak tutulur.

## 10. UI Yenilemeleri

Panel zaman icinde sade hale getirildi:

- Sol sekme kalabaligi kaldirildi.
- Hazirla ve Altyaziyi duzenle temel iki adim olarak ayrildi.
- Zola logosu ve Zola Caption marka adi eklendi.
- Islevsiz butonlar temizlendi.
- Stil kartlari ve onizlemeler daha kompakt hale getirildi.

## 11. GitHub Update Akisi

GitHub repo:

```text
galipcandmr/Zola_Caption
```

Panel acilista update JSON okur. Yeni surum varsa modal gosterir.

## 12. Otomatik Kurulum ve DMG

`v0.5.35` ile:

- Tek tik otomatik update endpoint'i eklendi.
- macOS installer script'i eklendi.
- DMG uretim script'i eklendi.
- LaunchAgent kurulumu otomatiklesti.
- Node yoksa runtime otomatik indiriliyor.

