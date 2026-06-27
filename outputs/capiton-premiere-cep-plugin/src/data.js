export const scenarios = [
  {
    id: "tr-tr",
    title: "TR konuşma -> TR altyazı",
    description: "Türkçe röportaj için temiz Türkçe altyazı.",
    sourceLang: "tr",
    targetLang: "tr",
    bilingual: false
  },
  {
    id: "en-en",
    title: "EN konuşma -> EN altyazı",
    description: "İngilizce röportaj için İngilizce altyazı.",
    sourceLang: "en",
    targetLang: "en",
    bilingual: false
  },
  {
    id: "tr-bilingual",
    title: "TR konuşma -> TR + EN",
    description: "Alt alta Türkçe ve İngilizce altyazı.",
    sourceLang: "tr",
    targetLang: "en",
    bilingual: true
  },
  {
    id: "tr-en",
    title: "TR konuşma -> EN altyazı",
    description: "Türkçe röportajı İngilizce subtitle'a çevir.",
    sourceLang: "tr",
    targetLang: "en",
    bilingual: false
  }
];

export const presets = [
  {
    id: "studio-clean",
    name: "Studio Clean",
    description: "Kurumsal, okunaklı, az hareketli.",
    fontFamily: "Inter",
    primaryColor: "#fff4d6",
    secondaryColor: "#f4f1ea",
    accentColor: "#19c37d",
    strokeColor: "#000000",
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    fontWeight: 900,
    animation: "pop"
  },
  {
    id: "reels-punch",
    name: "Reels Punch",
    description: "Kısa video için büyük vurgu ve karaoke.",
    fontFamily: "Montserrat",
    primaryColor: "#ffffff",
    secondaryColor: "#ffdf85",
    accentColor: "#ff4d4d",
    strokeColor: "#000000",
    backgroundColor: "transparent",
    fontWeight: 900,
    animation: "karaoke"
  },
  {
    id: "docu-soft",
    name: "Docu Soft",
    description: "Belgesel ve röportaj için sakin çift satır.",
    fontFamily: "Source Sans 3",
    primaryColor: "#e6f4ff",
    secondaryColor: "#ffe9b5",
    accentColor: "#76b7ff",
    strokeColor: "#111111",
    backgroundColor: "rgba(0, 0, 0, 0.36)",
    fontWeight: 800,
    animation: "fade"
  }
];

export const demoCaptions = [
  {
    id: crypto.randomUUID(),
    start: 1.2,
    end: 4.1,
    text: "Biz bu projede daha hızlı ama daha temiz bir altyazı akışı istiyoruz.",
    translation: "We want a faster but cleaner caption workflow for this project."
  },
  {
    id: crypto.randomUUID(),
    start: 4.3,
    end: 7.8,
    text: "Özellikle Türkçe konuşmalarda çeviri kalitesi bizim için çok kritik.",
    translation: "Translation quality is especially critical for Turkish interviews."
  },
  {
    id: crypto.randomUUID(),
    start: 8.1,
    end: 11.4,
    text: "Markalara göre renk, font ve animasyon presetleri kaydedebilmeliyiz.",
    translation: "We need to save color, font, and animation presets by brand."
  }
];
