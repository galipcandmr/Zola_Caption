import { presets, scenarios } from "./data.js";
import {
  applyCaptionPlanToPremiere,
  buildCaptionPlan,
  extractTimelineAudioForTranscription,
  getRuntimeInfo,
  listSequenceAudioTracks
} from "./premiereBridge.js";
import { createTranslationDraft, detectLanguageDraft, estimateCost } from "./providers.js";
import { formatShortTime, parseSrt, toSrt } from "./srt.js";

const state = {
  scenario: scenarios[0],
  preset: presets[0],
  captions: [],
  audioTracks: [],
  selectedAudioTrack: null,
  detectedLanguage: null,
  audioRef: null
};

const els = {
  scenarioList: document.querySelector("#scenarioList"),
  presetList: document.querySelector("#presetList"),
  captionTable: document.querySelector("#captionTable"),
  captionMeta: document.querySelector("#captionMeta"),
  costCard: document.querySelector("#costCard"),
  logOutput: document.querySelector("#logOutput"),
  fileInput: document.querySelector("#fileInput"),
  speechProvider: document.querySelector("#speechProvider"),
  translateProvider: document.querySelector("#translateProvider"),
  durationInput: document.querySelector("#durationInput"),
  charInput: document.querySelector("#charInput"),
  previewPrimary: document.querySelector("#previewPrimary"),
  previewSecondary: document.querySelector("#previewSecondary"),
  previewStage: document.querySelector("#previewStage"),
  fontInput: document.querySelector("#fontInput"),
  primaryColorInput: document.querySelector("#primaryColorInput"),
  accentColorInput: document.querySelector("#accentColorInput"),
  animationInput: document.querySelector("#animationInput"),
  scanAudioBtn: document.querySelector("#scanAudioBtn"),
  detectLanguageBtn: document.querySelector("#detectLanguageBtn"),
  transcribeTimelineBtn: document.querySelector("#transcribeTimelineBtn"),
  audioTrackSelect: document.querySelector("#audioTrackSelect"),
  detectedLanguageInput: document.querySelector("#detectedLanguageInput"),
  languageMode: document.querySelector("#languageMode"),
  audioStatus: document.querySelector("#audioStatus")
};

document.querySelector("#importBtn").addEventListener("click", () => els.fileInput.click());
document.querySelector("#splitBtn").addEventListener("click", smartSplit);
document.querySelector("#translateBtn").addEventListener("click", translateDraft);
document.querySelector("#exportBtn").addEventListener("click", exportSrt);
document.querySelector("#applyBtn").addEventListener("click", applyToTimeline);
els.scanAudioBtn.addEventListener("click", scanAudioTracks);
els.detectLanguageBtn.addEventListener("click", detectSelectedTrackLanguage);
els.transcribeTimelineBtn.addEventListener("click", transcribeSelectedTimelineAudio);

els.audioTrackSelect.addEventListener("input", () => {
  state.selectedAudioTrack = state.audioTracks.find((track) => track.id === els.audioTrackSelect.value) || null;
  state.audioRef = null;
  state.detectedLanguage = null;
  renderAudioState();
  if (state.selectedAudioTrack) {
    writeLog(`${state.selectedAudioTrack.id} seçildi. Dil algılama için hazır.`);
  }
});

els.fileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const content = await file.text();
  state.captions = parseSrt(content);
  renderCaptions();
  writeLog(`${file.name} içe aktarıldı. ${state.captions.length} caption bloğu bulundu.`);
});

[els.speechProvider, els.translateProvider, els.durationInput, els.charInput].forEach((element) => {
  element.addEventListener("input", renderCost);
});

[els.fontInput, els.primaryColorInput, els.accentColorInput, els.animationInput].forEach((element) => {
  element.addEventListener("input", updatePresetFromControls);
});

function renderAll() {
  renderScenarios();
  renderPresets();
  renderCaptions();
  renderCost();
  renderAudioState();
  renderPresetPreview();
  const runtime = getRuntimeInfo();
  writeLog(`Zola Caption hazır. Çalışma modu: ${runtime.mode}.`);
}

function renderScenarios() {
  els.scenarioList.innerHTML = "";
  scenarios.forEach((scenario) => {
    const button = document.createElement("button");
    button.className = `scenario-card${scenario.id === state.scenario.id ? " active" : ""}`;
    button.innerHTML = `<strong>${scenario.title}</strong><p>${scenario.description}</p>`;
    button.addEventListener("click", () => {
      state.scenario = scenario;
      renderScenarios();
      renderCaptions();
      writeLog(`Senaryo seçildi: ${scenario.title}`);
    });
    els.scenarioList.append(button);
  });
}

function renderPresets() {
  els.presetList.innerHTML = "";
  presets.forEach((preset) => {
    const button = document.createElement("button");
    button.className = `preset-card${preset.id === state.preset.id ? " active" : ""}`;
    button.innerHTML = `
      <span class="swatch" style="background:${preset.accentColor}"></span>
      <span><strong>${preset.name}</strong><span>${preset.description}</span></span>
    `;
    button.addEventListener("click", () => {
      state.preset = { ...preset };
      syncPresetControls();
      renderPresets();
      renderPresetPreview();
      writeLog(`Preset seçildi: ${preset.name}`);
    });
    els.presetList.append(button);
  });
}

function renderCaptions() {
  els.captionTable.innerHTML = "";
  els.captionMeta.textContent = `${state.captions.length} blok`;

  if (state.captions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "caption-row";
    empty.innerHTML = `<div class="caption-time">--:--</div><div class="caption-fields">Henüz caption yok. Timeline sesinden altyazı üret veya SRT içe aktar.</div>`;
    els.captionTable.append(empty);
    return;
  }

  state.captions.forEach((caption, index) => {
    const row = document.createElement("div");
    row.className = "caption-row";
    row.innerHTML = `
      <div class="caption-time">${formatShortTime(caption.start)}<br>${formatShortTime(caption.end)}</div>
      <div class="caption-fields">
        <textarea data-index="${index}" data-field="text" aria-label="Kaynak altyazı">${caption.text}</textarea>
        ${
          state.scenario.targetLang === "en" || state.scenario.bilingual
            ? `<textarea class="translation-field" data-index="${index}" data-field="translation" aria-label="Çeviri">${caption.translation || ""}</textarea>`
            : ""
        }
      </div>
    `;
    els.captionTable.append(row);
  });

  els.captionTable.querySelectorAll("textarea").forEach((textarea) => {
    textarea.addEventListener("input", (event) => {
      const index = Number(event.currentTarget.dataset.index);
      const field = event.currentTarget.dataset.field;
      state.captions[index][field] = event.currentTarget.value;
      updateCharacterEstimate();
    });
  });

  updateCharacterEstimate();
}

function renderCost() {
  const cost = estimateCost({
    durationMinutes: Number(els.durationInput.value || 0),
    characterCount: Number(els.charInput.value || 0),
    speechProvider: els.speechProvider.value,
    translateProvider: els.translateProvider.value
  });

  els.costCard.innerHTML = `
    <strong>$${cost.total.toFixed(3)} tahmini</strong><br>
    Transkripsiyon: $${cost.speechCost.toFixed(3)}<br>
    Çeviri: $${cost.translationCost.toFixed(3)}<br>
    <span>${cost.translationNote}</span>
  `;
}

function renderAudioState() {
  els.audioTrackSelect.innerHTML = "";

  if (state.audioTracks.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Önce trackleri tara";
    els.audioTrackSelect.append(option);
  } else {
    state.audioTracks.forEach((track) => {
      const option = document.createElement("option");
      option.value = track.id;
      option.textContent = `${track.id} - ${track.name} (${track.clipCount} clip)`;
      els.audioTrackSelect.append(option);
    });
  }

  els.audioTrackSelect.value = state.selectedAudioTrack?.id || "";

  if (state.detectedLanguage) {
    const confidence = Math.round(state.detectedLanguage.confidence * 100);
    els.detectedLanguageInput.value = `${state.detectedLanguage.label} (${confidence}%)`;
  } else {
    els.detectedLanguageInput.value = "Henüz algılanmadı";
  }

  if (state.selectedAudioTrack && state.detectedLanguage) {
    els.audioStatus.textContent = `${state.selectedAudioTrack.id} seçildi, kaynak dil ${state.detectedLanguage.label}.`;
  } else if (state.selectedAudioTrack) {
    els.audioStatus.textContent = `${state.selectedAudioTrack.id} seçildi. Dil algılama bekleniyor.`;
  } else {
    els.audioStatus.textContent = "Sekanstaki ses tracklerini tarayıp altyazı için kaynak seç.";
  }
}

function renderPresetPreview() {
  const preset = state.preset;
  els.previewPrimary.style.color = preset.primaryColor;
  els.previewSecondary.style.color = preset.secondaryColor;
  els.previewPrimary.style.fontFamily = preset.fontFamily;
  els.previewSecondary.style.fontFamily = preset.fontFamily;
  els.previewStage.style.borderColor = preset.accentColor;
}

function syncPresetControls() {
  els.fontInput.value = state.preset.fontFamily;
  els.primaryColorInput.value = state.preset.primaryColor;
  els.accentColorInput.value = state.preset.accentColor;
  els.animationInput.value = state.preset.animation;
}

function updatePresetFromControls() {
  state.preset = {
    ...state.preset,
    fontFamily: els.fontInput.value || "Inter",
    primaryColor: els.primaryColorInput.value,
    accentColor: els.accentColorInput.value,
    animation: els.animationInput.value
  };
  renderPresetPreview();
}

function updateCharacterEstimate() {
  const total = state.captions.reduce((sum, caption) => sum + caption.text.length + (caption.translation || "").length, 0);
  els.charInput.value = total;
  renderCost();
}

function smartSplit() {
  state.captions = state.captions.flatMap((caption) => {
    if (caption.text.length < 76) {
      return [caption];
    }

    const midpoint = Math.floor(caption.text.length / 2);
    const splitAt = caption.text.indexOf(" ", midpoint) > -1 ? caption.text.indexOf(" ", midpoint) : midpoint;
    const duration = caption.end - caption.start;
    const firstText = caption.text.slice(0, splitAt).trim();
    const secondText = caption.text.slice(splitAt).trim();
    const splitTime = caption.start + duration * (firstText.length / caption.text.length);

    return [
      { ...caption, id: crypto.randomUUID(), end: splitTime, text: firstText },
      { ...caption, id: crypto.randomUUID(), start: splitTime, text: secondText }
    ];
  });

  renderCaptions();
  writeLog("Uzun caption blokları akıllı şekilde bölündü.");
}

async function translateDraft() {
  state.captions = await createTranslationDraft(state.captions, state.scenario);
  renderCaptions();
  writeLog("Çeviri taslağı oluşturuldu. Gerçek Google/OpenAI çağrısı backend proxy bağlanınca aktifleşecek.");
}

async function scanAudioTracks() {
  const result = await listSequenceAudioTracks();
  state.audioTracks = result.tracks;
  state.selectedAudioTrack = result.tracks[0] || null;
  state.detectedLanguage = null;
  state.audioRef = null;
  renderAudioState();
  writeLog(result.message);
}

async function detectSelectedTrackLanguage() {
  if (!state.selectedAudioTrack) {
    writeLog("Önce A1/A2 gibi bir audio track seçmelisin.");
    return;
  }

  const extraction = await extractTimelineAudioForTranscription({
    track: state.selectedAudioTrack
  });

  state.audioRef = extraction.audioRef || null;

  if (!extraction.ok) {
    writeLog(extraction.message);
    return;
  }

  state.detectedLanguage = await detectLanguageDraft({
    track: state.selectedAudioTrack,
    audioRef: state.audioRef,
    languageMode: els.languageMode.value
  });

  const matchingScenario = scenarios.find((scenario) => scenario.sourceLang === state.detectedLanguage.code);
  if (matchingScenario && state.scenario.sourceLang !== state.detectedLanguage.code) {
    state.scenario = matchingScenario;
    renderScenarios();
    renderCaptions();
  }

  renderAudioState();
  writeLog(`${extraction.message}\nDil algılandı: ${state.detectedLanguage.label}.`);
}

async function transcribeSelectedTimelineAudio() {
  if (!state.selectedAudioTrack) {
    writeLog("Önce sekans içinden A1/A2 gibi bir audio track seçmelisin.");
    return;
  }

  const extraction = await extractTimelineAudioForTranscription({
    track: state.selectedAudioTrack
  });

  state.audioRef = extraction.audioRef || null;

  if (!extraction.ok) {
    writeLog(extraction.message);
    return;
  }

  if (!state.detectedLanguage || els.languageMode.value !== "auto") {
    state.detectedLanguage = await detectLanguageDraft({
      track: state.selectedAudioTrack,
      audioRef: state.audioRef,
      languageMode: els.languageMode.value
    });
  }

  renderAudioState();
  renderCaptions();
  writeLog(
    `${state.selectedAudioTrack.id} seçildi.\n` +
      `Dil: ${state.detectedLanguage.label}.\n` +
      "Gerçek altyazı üretimi için sonraki adım: seçili track'i WAV olarak çıkarıp transkripsiyon servisine gönderen backend/proxy bağlantısı. Demo caption artık üretilmiyor."
  );
}

function exportSrt() {
  const mode = state.scenario.bilingual ? "bilingual" : state.scenario.targetLang === "en" && state.scenario.sourceLang === "tr" ? "translation" : "primary";
  const srt = toSrt(state.captions, mode);
  const blob = new Blob([srt], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `zola-caption-${state.scenario.id}.srt`;
  link.click();
  URL.revokeObjectURL(url);
  writeLog("SRT dışa aktarma hazırlandı.");
}

async function applyToTimeline() {
  if (els.speechProvider.value !== "manual-srt" && !state.selectedAudioTrack) {
    writeLog("Timeline sesinden altyazı üretmek için önce audio track seçmelisin.");
    return;
  }

  const plan = buildCaptionPlan({
    captions: state.captions,
    scenario: state.scenario,
    preset: state.preset,
    audio: {
      track: state.selectedAudioTrack,
      audioRef: state.audioRef,
      detectedLanguage: state.detectedLanguage,
      languageMode: els.languageMode.value
    }
  });
  const result = await applyCaptionPlanToPremiere(plan);
  writeLog(`${result.message}\n\nPlan özeti:\n${JSON.stringify(plan, null, 2)}`);
}

function writeLog(message) {
  els.logOutput.textContent = message;
}

syncPresetControls();
renderAll();
