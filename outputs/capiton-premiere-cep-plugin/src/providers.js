export const providerProfiles = {
  "openai-whisper": {
    label: "OpenAI Whisper/Realtime",
    type: "speech",
    unit: "minute",
    usdPerUnit: 0.017,
    note: "Hızlı transkripsiyon için. Gerçek çağrı backend proxy üzerinden yapılmalı."
  },
  "premiere-native": {
    label: "Premiere yerel transcript",
    type: "speech",
    unit: "minute",
    usdPerUnit: 0,
    note: "En ucuz seçenek; kalite ve otomasyon Premiere sürümüne bağlı."
  },
  "manual-srt": {
    label: "Hazır SRT/VTT",
    type: "speech",
    unit: "minute",
    usdPerUnit: 0,
    note: "Dışarıdan hazırlanmış altyazı dosyasıyla çalışır."
  },
  "google-nmt": {
    label: "Google Translate NMT",
    type: "translation",
    unit: "character",
    usdPerMillionChars: 20,
    freeCharsPerMonth: 500000,
    note: "Genellikle maliyet/kalite dengesi iyi; ilk 500 bin karakter aylık krediye girebilir."
  },
  "openai-mini": {
    label: "OpenAI küçük model",
    type: "translation",
    unit: "token",
    usdPerMillionInputTokens: 0.75,
    usdPerMillionOutputTokens: 4.5,
    note: "Daha doğal çeviri ve ton koruma için iyi; Google NMT'den pahalı olabilir."
  },
  none: {
    label: "Çeviri yok",
    type: "translation",
    unit: "none",
    note: "Sadece kaynak dil altyazı üretir."
  }
};

export function estimateCost({ durationMinutes, characterCount, speechProvider, translateProvider }) {
  const speech = providerProfiles[speechProvider];
  const translation = providerProfiles[translateProvider];
  const speechCost = speech?.usdPerUnit ? durationMinutes * speech.usdPerUnit : 0;
  let translationCost = 0;

  if (translateProvider === "google-nmt") {
    const billableChars = Math.max(0, characterCount - providerProfiles["google-nmt"].freeCharsPerMonth);
    translationCost = (billableChars / 1000000) * providerProfiles["google-nmt"].usdPerMillionChars;
  }

  if (translateProvider === "openai-mini") {
    const inputTokens = characterCount / 4;
    const outputTokens = characterCount / 3.5;
    translationCost =
      (inputTokens / 1000000) * providerProfiles["openai-mini"].usdPerMillionInputTokens +
      (outputTokens / 1000000) * providerProfiles["openai-mini"].usdPerMillionOutputTokens;
  }

  return {
    speechCost,
    translationCost,
    total: speechCost + translationCost,
    speechNote: speech?.note || "",
    translationNote: translation?.note || ""
  };
}

export async function createTranslationDraft(captions, scenario) {
  return captions.map((caption) => ({
    ...caption,
    translation: caption.translation || draftTranslate(caption.text, scenario.targetLang)
  }));
}

export async function detectLanguageDraft({ track, languageMode }) {
  if (languageMode === "tr") {
    return { code: "tr", label: "Türkçe", confidence: 1, source: "manual-default" };
  }

  if (languageMode === "en") {
    return { code: "en", label: "İngilizce", confidence: 1, source: "manual-default" };
  }

  const trackName = `${track?.name || ""} ${track?.id || ""}`.toLowerCase();

  if (trackName.includes("en") || trackName.includes("english")) {
    return { code: "en", label: "İngilizce", confidence: 0.82, source: "track-name-draft" };
  }

  return { code: "tr", label: "Türkçe", confidence: 0.78, source: "track-name-draft" };
}

function draftTranslate(text, targetLang) {
  if (targetLang !== "en") {
    return text;
  }

  const dictionary = [
    ["Biz bu projede", "In this project, we"],
    ["daha hızlı", "a faster"],
    ["daha temiz", "cleaner"],
    ["altyazı akışı", "caption workflow"],
    ["Türkçe konuşmalarda", "in Turkish interviews"],
    ["çeviri kalitesi", "translation quality"],
    ["bizim için çok kritik", "is very critical for us"],
    ["Markalara göre", "By brand"],
    ["renk, font ve animasyon presetleri", "color, font, and animation presets"],
    ["kaydedebilmeliyiz", "we need to be able to save"]
  ];

  let result = text;
  for (const [source, target] of dictionary) {
    result = result.replace(source, target);
  }

  if (result === text) {
    return `[EN taslak] ${text}`;
  }

  return result;
}
