export function getRuntimeInfo() {
  const isUxp = typeof window !== "undefined" && typeof window.uxp !== "undefined";
  const isCep = typeof window !== "undefined" && typeof window.__adobe_cep__ !== "undefined";
  return {
    isCep,
    isUxp,
    mode: isUxp ? "Premiere UXP" : isCep ? "Premiere CEP/Legacy" : "Browser preview"
  };
}

export async function applyCaptionPlanToPremiere(plan) {
  const runtime = getRuntimeInfo();

  if (!runtime.isUxp && !runtime.isCep) {
    return {
      ok: false,
      message: "Önizleme modundasın. Premiere içinde açınca timeline köprüsü çalışacak.",
      plan
    };
  }

  if (runtime.isCep) {
    return {
      ok: false,
      message: "CEP panel bağlı; timeline'a yazma adımı henüz eklenmedi. Önce gerçek transkripsiyon çıkışını bağlayacağız.",
      plan
    };
  }

  // Premiere DOM mapping will live here. Keeping this isolated lets us test
  // UI, parsing, pricing, and provider logic without touching timeline code.
  return {
    ok: false,
    message: "UXP algılandı; Premiere DOM graphic clip yazımı sıradaki uygulama adımı.",
    plan
  };
}

export async function listSequenceAudioTracks() {
  const runtime = getRuntimeInfo();

  if (runtime.isCep) {
    return evalCepJson("capitonListAudioTracks()");
  }

  if (!runtime.isUxp) {
    return {
      ok: false,
      tracks: [],
      message: "Premiere dışında gerçek audio track listelenemez."
    };
  }

  return {
    ok: false,
    tracks: [],
    message: "UXP algılandı; aktif sekans audio track listeleme Premiere DOM bağlanınca tamamlanacak."
  };
}

export async function extractTimelineAudioForTranscription({ track }) {
  const runtime = getRuntimeInfo();

  if (!track) {
    return {
      ok: false,
      message: "Önce altyazı için kullanılacak audio track seçilmeli."
    };
  }

  if (runtime.isCep) {
    return {
      ok: false,
      message:
        `${track.id} seçildi ama gerçek audio extraction henüz bağlı değil. ` +
        "Bir sonraki adımda seçili track'i WAV'a export edip OpenAI/Google tarafına göndereceğiz."
    };
  }

  if (!runtime.isUxp) {
    return {
      ok: false,
      message: "Premiere dışında gerçek audio çıkarılamaz."
    };
  }

  return {
    ok: false,
    message: "UXP algılandı; seçili track'i geçici WAV olarak export etme adımı Premiere köprüsünde tamamlanacak."
  };
}

function evalCepJson(script) {
  return new Promise((resolve) => {
    if (!window.__adobe_cep__ || typeof window.__adobe_cep__.evalScript !== "function") {
      resolve({ ok: false, tracks: [], message: "CEP evalScript kullanılamıyor." });
      return;
    }

    window.__adobe_cep__.evalScript(script, (raw) => {
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        resolve({
          ok: false,
          tracks: [],
          message: `Premiere köprüsü okunamadı: ${raw || error.message}`
        });
      }
    });
  });
}

export function buildCaptionPlan({ captions, scenario, preset, audio }) {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    audio,
    scenario,
    preset,
    renderMode: scenario.bilingual ? "bilingual" : scenario.targetLang === "en" && scenario.sourceLang === "tr" ? "translation" : "primary",
    captions: captions.map((caption) => ({
      start: caption.start,
      end: caption.end,
      primaryText: caption.text,
      secondaryText: caption.translation,
      textToRender:
        scenario.bilingual
          ? `${caption.text}\n${caption.translation || ""}`.trim()
          : scenario.targetLang === "en" && scenario.sourceLang === "tr"
            ? caption.translation || caption.text
            : caption.text
    }))
  };
}
