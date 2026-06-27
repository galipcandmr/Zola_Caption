# Capiton CEP Test Paketi

UXP Developer Tool kurulamıyorsa bu paketi Premiere'in Legacy Extension sistemiyle test edebilirsin.

## macOS kurulum

1. Premiere'i kapat.
2. Şu klasörü oluştur:

   `~/Library/Application Support/Adobe/CEP/extensions`

3. Bu klasörü oraya koy:

   `/Users/zoladijital/Documents/Codex/2026-06-18/premier-proda-eklenti-yani-plugin-yapabiliyormusun/outputs/capiton-premiere-cep-plugin`

4. Unsigned extension debug modunu aç:

   ```bash
   defaults write com.adobe.CSXS.11 PlayerDebugMode 1
   defaults write com.adobe.CSXS.12 PlayerDebugMode 1
   defaults write com.adobe.CSXS.13 PlayerDebugMode 1
   ```

5. Premiere'i aç.
6. Menüden şuraya bak:

   `Window > Extensions > Capiton`

Bazı Premiere sürümlerinde menü adı `Window > Extensions (Legacy) > Capiton` olabilir.

## Test akışı

1. Panel açılınca `Trackleri tara`.
2. A1/A2 seç.
3. `Dili otomatik bul`.
4. `Altyazı üret`.
5. `TR konuşma -> TR + EN` seçip `Çeviri taslağı` ile çift dil ekranını test et.

Bu CEP paketi şu an arayüz ve workflow test etmek içindir. Gerçek sekans audio export ve timeline'a graphic clip basma işi hâlâ `src/premiereBridge.js` tarafında tamamlanacak.
