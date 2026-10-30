#!/usr/bin/env node
"use strict";

const http = require("http");
const https = require("https");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const os = require("os");
const { spawn, execFileSync } = require("child_process");

const ROOT = __dirname;
const PORT = Number(process.env.CAPITON_ENGINE_PORT || 17771);
const WORK_DIR = path.join(ROOT, "work");
const DEFAULT_MODEL = path.join(ROOT, "models", "ggml-small.bin");
const ENV_PATH = path.join(ROOT, ".env");
const MAX_JSON_BODY_BYTES = 5 * 1024 * 1024;
const TRANSLATION_BATCH_MAX_ITEMS = 100;
const TRANSLATION_BATCH_MAX_CHARACTERS = 20000;
loadEnvFile(ENV_PATH);
let GOOGLE_TRANSLATE_API_KEY =
  process.env.CAPITON_GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY || "";

let updateJobState = { phase: "idle", message: "", code: null, updatedAt: 0 };
let systemFontCache = { loadedAt: 0, result: null };

function setUpdateJob(phase, message, code) {
  updateJobState = { phase, message, code: code || null, updatedAt: Date.now() };
}

fs.mkdirSync(WORK_DIR, { recursive: true });

const server = http.createServer(async (req, res) => {
  const originAllowed = setCors(req, res);

  if (!originAllowed) {
    sendJson(res, 403, { ok: false, code: "ORIGIN_NOT_ALLOWED", message: "İstek kaynağına izin verilmiyor." });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, {
        ok: true,
        name: "Zola Caption Local Engine",
        port: PORT,
        whisper: findWhisperCli(),
        ffmpeg: findExecutable([path.join(ROOT, "bin", "ffmpeg"), "ffmpeg", "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"]),
        workDir: WORK_DIR,
        modelExists: fs.existsSync(DEFAULT_MODEL),
        modelPath: DEFAULT_MODEL,
        googleTranslateConfigured: Boolean(GOOGLE_TRANSLATE_API_KEY)
      });
      return;
    }

    if (req.method === "GET" && req.url === "/system-fonts") {
      const result = await listSystemFonts();
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    if (req.method === "POST" && req.url === "/transcribe") {
      const body = await readJson(req);
      const result = await transcribe(body);
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    if (req.method === "POST" && req.url === "/translate") {
      const body = await readJson(req);
      const result = await translateTextCaptions(body);
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    if (req.method === "POST" && req.url === "/render-overlay") {
      const body = await readJson(req);
      const result = await renderOverlay(body);
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    if (req.method === "POST" && req.url === "/render-watermark") {
      const body = await readJson(req);
      const result = await renderWatermark(body);
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    if (req.method === "POST" && req.url === "/install-update") {
      const body = await readJson(req);
      const result = await installUpdatePackage(body);
      const restartEngineTarget = result.ok ? result.engineTarget : null;
      sendJson(res, result.ok ? 200 : 422, result, restartEngineTarget ? () => {
        // Cevap soketten cikip tamamlanana kadar bekle; motor surecini burada
        // oldurup yeniden baslatiyoruz, bunu cevaptan ONCE yapmak panele yarim
        // kalmis/kopuk bir cevap olarak gidip "Yukleniyor" ekraninda asili
        // kalmasina sebep oluyordu.
        setTimeout(() => installLaunchAgent(restartEngineTarget), 300);
      } : undefined);
      return;
    }

    if (req.method === "GET" && req.url === "/update-status") {
      sendJson(res, 200, { ok: true, ...updateJobState });
      return;
    }

    if (req.method === "POST" && req.url === "/settings/google-api-key") {
      const body = await readJson(req);
      const result = saveGoogleApiKey(body);
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    sendJson(res, 404, { ok: false, message: "Endpoint bulunamadı." });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      ok: false,
      code: error.code || "ENGINE_ERROR",
      message: error.message || String(error)
    });
  }
});

if (require.main === module) {
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Zola Caption Local Engine listening on http://127.0.0.1:${PORT}`);
  });
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function writeEnvValue(filePath, key, value) {
  let lines = [];
  if (fs.existsSync(filePath)) {
    lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  }

  let replaced = false;
  const nextLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return line;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      return line;
    }
    if (trimmed.slice(0, separator).trim() === key) {
      replaced = true;
      return key + "=" + value;
    }
    return line;
  });

  if (!replaced) {
    if (nextLines.length && nextLines[nextLines.length - 1].trim() !== "") {
      nextLines.push("");
    }
    nextLines.push(key + "=" + value);
  }

  const content = nextLines.join("\n").replace(/\n+$/, "\n");
  fs.writeFileSync(filePath, content.endsWith("\n") ? content : content + "\n", { mode: 0o600 });
  fs.chmodSync(filePath, 0o600);
}

function saveGoogleApiKey(body) {
  const apiKey = String((body && body.apiKey) || "").trim();
  if (!apiKey) {
    return { ok: false, code: "EMPTY_API_KEY", message: "Google Translate API anahtarı boş olamaz." };
  }

  try {
    writeEnvValue(ENV_PATH, "CAPITON_GOOGLE_TRANSLATE_API_KEY", apiKey);
    process.env.CAPITON_GOOGLE_TRANSLATE_API_KEY = apiKey;
    GOOGLE_TRANSLATE_API_KEY = apiKey;
    return {
      ok: true,
      googleTranslateConfigured: true,
      message: "Google Translate API anahtarı kaydedildi."
    };
  } catch (error) {
    return {
      ok: false,
      code: "ENV_WRITE_FAILED",
      message: "API anahtarı .env dosyasına yazılamadı: " + (error.message || String(error))
    };
  }
}

async function transcribe(body) {
  const clips = normalizeTranscriptionClips(body && body.clips);
  if (!clips.length) {
    return transcribeSingleMedia(body);
  }

  if (clips.length === 1) {
    const singleResult = await transcribeSingleMedia({
      ...body,
      mediaPath: clips[0].mediaPath,
      trimStartSeconds: clips[0].sourceInSeconds,
      trimEndSeconds: clips[0].sourceOutSeconds
    });
    singleResult.sourceClipCount = singleResult.ok ? 1 : 0;
    return singleResult;
  }

  const timelineStartSeconds = clips.reduce(
    (minimum, clip) => Math.min(minimum, clip.timelineStartSeconds),
    clips[0].timelineStartSeconds
  );
  const runs = [];
  for (let index = 0; index < clips.length; index += 1) {
    const clip = clips[index];
    const result = await transcribeSingleMedia({
      ...body,
      clips: undefined,
      mediaPath: clip.mediaPath,
      trimStartSeconds: clip.sourceInSeconds,
      trimEndSeconds: clip.sourceOutSeconds
    });
    if (!result.ok) {
      return {
        ...result,
        code: result.code || "CLIP_TRANSCRIPTION_FAILED",
        sourceClipCount: index,
        failedClipIndex: clip.clipIndex,
        message:
          `${index + 1}/${clips.length} numaralı ses klibi okunamadı` +
          (clip.clipName ? ` (${clip.clipName})` : "") +
          `: ${result.message || "Bilinmeyen hata"}`
      };
    }
    runs.push({ clip, result });
  }

  const merged = mergeTranscriptionResults(runs, timelineStartSeconds);
  const jobId = `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
  const srtPath = path.join(WORK_DIR, `${jobId}-combined.srt`);
  merged.srt = formatSrtCaptions(merged.captions);
  fs.writeFileSync(srtPath, merged.srt, "utf8");
  merged.files.srtPath = srtPath;
  return merged;
}

async function transcribeSingleMedia(body) {
  const mediaPath = body && body.mediaPath;
  const language = normalizeLanguage((body && body.language) || "auto");
  const task = normalizeTask(body && body.task);
  const modelPath = (body && body.modelPath) || DEFAULT_MODEL;
  const trimStartSeconds = safeSeconds(body && body.trimStartSeconds);
  const trimEndSeconds = safeSeconds(body && body.trimEndSeconds);
  const trimDurationSeconds = trimEndSeconds > trimStartSeconds ? trimEndSeconds - trimStartSeconds : 0;
  const whisperCli = findWhisperCli();
  const ffmpeg = findExecutable([path.join(ROOT, "bin", "ffmpeg"), "ffmpeg", "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"]);
  const afconvert = findExecutable(["/usr/bin/afconvert", "afconvert"]);

  if (!mediaPath || !fs.existsSync(mediaPath)) {
    return { ok: false, code: "MEDIA_NOT_FOUND", message: `Medya dosyası bulunamadı: ${mediaPath || "-"}` };
  }

  try {
    fs.accessSync(mediaPath, fs.constants.R_OK);
  } catch (error) {
    return {
      ok: false,
      code: "MEDIA_NOT_READABLE",
      message: `Video dosyasına okuma izni yok. macOS Sistem Ayarları > Gizlilik ve Güvenlik > Dosyalar ve Klasörler bölümünden Zola/Premiere erişimini aç: ${mediaPath}`
    };
  }

  if (!whisperCli) {
    return {
      ok: false,
      code: "WHISPER_NOT_FOUND",
      message:
        "Lokal whisper-cli bulunamadı. outputs/capiton-local-engine/bin içine whisper-cli koy veya bootstrap script'iyle kur."
    };
  }

  if (!fs.existsSync(modelPath)) {
    return {
      ok: false,
      code: "MODEL_NOT_FOUND",
      message: `Whisper model dosyası yok: ${modelPath}`
    };
  }

  const jobId = `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
  const audioPath = path.join(WORK_DIR, `${jobId}.wav`);
  const outBase = path.join(WORK_DIR, jobId);
  const availableBytes = getAvailableDiskBytes(WORK_DIR);
  if (availableBytes !== null && availableBytes < 300 * 1024 * 1024) {
    return {
      ok: false,
      code: "INSUFFICIENT_DISK_SPACE",
      message: "Altyazı üretmek için diskte en az 300 MB boş alan gerekiyor. Biraz yer açıp tekrar dene."
    };
  }

  if (!ffmpeg && path.extname(mediaPath).toLowerCase() === ".wav" && trimStartSeconds === 0 && trimDurationSeconds === 0) {
    fs.copyFileSync(mediaPath, audioPath);
  } else {
    if (ffmpeg) {
      try {
        await extractAudioWithFallback(ffmpeg, mediaPath, trimStartSeconds, trimDurationSeconds, audioPath);
      } catch (error) {
        const message = describeFfmpegFailure(error, mediaPath);
        writeLastFfmpegError(error, mediaPath);
        return { ok: false, code: "FFMPEG_AUDIO_EXTRACTION_FAILED", message };
      }
    } else if (afconvert) {
      if (trimStartSeconds > 0 || trimDurationSeconds > 0) {
        return {
          ok: false,
          code: "FFMPEG_NOT_FOUND",
          message: "Timeline'daki kesilmiş klibi doğru okumak için ffmpeg gerekli."
        };
      }
      await run(afconvert, [mediaPath, audioPath, "-f", "WAVE", "-d", "LEI16@16000", "-c", "1"]);
    } else {
      return {
        ok: false,
        code: "FFMPEG_NOT_FOUND",
        message: "Video dosyasından ses çıkarmak için ffmpeg veya macOS afconvert gerekli."
      };
    }
  }

  const args = [
    "-m",
    modelPath,
    "-f",
    audioPath,
    "-osrt",
    "-oj",
    "-ojf",
    "-of",
    outBase,
    "-sow",
    "-bo",
    "8",
    "-bs",
    "8",
    "-ml",
    "56",
    "-t",
    String(Math.max(2, Math.min(8, os.cpus().length - 1))),
    "-sns",
    "-nth",
    "0.50",
    "-et",
    "2.20",
    "-lpt",
    "-0.80"
  ];
  args.push("-l", language);
  if (task === "translate") {
    args.push("-tr");
  }
  const prompt = initialPrompt(language, task);
  if (prompt) {
    args.push("--prompt", prompt, "--carry-initial-prompt");
  }
  await run(whisperCli, args);

  const srtPath = `${outBase}.srt`;
  if (!fs.existsSync(srtPath)) {
    return {
      ok: false,
      code: "SRT_NOT_CREATED",
      message: "Whisper çalıştı ama SRT çıktısı oluşmadı."
    };
  }

  const srt = fs.readFileSync(srtPath, "utf8");
  const jsonPath = `${outBase}.json`;
  const whisperJson = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, "utf8")) : null;
  const words = whisperJson ? parseWhisperWords(whisperJson) : [];
  const detectedLanguage = parseWhisperLanguage(whisperJson) || (language === "auto" ? "" : language);
  const captions = normalizeTranscribedCaptions(parseSrt(srt), detectedLanguage || language);
  const normalizedSrt = formatSrtCaptions(captions);
  fs.writeFileSync(srtPath, normalizedSrt, "utf8");
  return {
    ok: true,
    language,
    detectedLanguage,
    task,
    outputLanguage: task === "translate" ? "en" : "source",
    trimStartSeconds,
    trimEndSeconds,
    srt: normalizedSrt,
    captions,
    words,
    files: {
      audioPath,
      srtPath,
      jsonPath: fs.existsSync(jsonPath) ? jsonPath : ""
    }
  };
}

function normalizeTranscriptionClips(clips) {
  if (!Array.isArray(clips)) {
    return [];
  }
  return clips
    .map((clip, index) => ({
      clipIndex: Number.isFinite(Number(clip && clip.clipIndex)) ? Number(clip.clipIndex) : index,
      clipName: String((clip && clip.clipName) || ""),
      mediaPath: String((clip && clip.mediaPath) || ""),
      timelineStartSeconds: safeSeconds(clip && clip.timelineStartSeconds),
      timelineEndSeconds: safeSeconds(clip && clip.timelineEndSeconds),
      sourceInSeconds: safeSeconds(clip && clip.sourceInSeconds),
      sourceOutSeconds: safeSeconds(clip && clip.sourceOutSeconds)
    }))
    .filter((clip) => clip.mediaPath && clip.timelineEndSeconds > clip.timelineStartSeconds)
    .sort((left, right) => left.timelineStartSeconds - right.timelineStartSeconds);
}

function mergeTranscriptionResults(runs, timelineStartSeconds) {
  const captions = [];
  const words = [];
  const clipFiles = [];
  let detectedLanguage = "";

  for (const run of runs) {
    const offset = Math.max(0, run.clip.timelineStartSeconds - timelineStartSeconds);
    for (const caption of run.result.captions || []) {
      captions.push({
        ...caption,
        start: safeSeconds(caption.start) + offset,
        end: safeSeconds(caption.end) + offset
      });
    }
    for (const word of run.result.words || []) {
      words.push({
        ...word,
        start: safeSeconds(word.start) + offset,
        end: safeSeconds(word.end) + offset
      });
    }
    clipFiles.push(run.result.files || {});
    detectedLanguage = detectedLanguage || run.result.detectedLanguage || "";
  }

  captions.sort((left, right) => left.start - right.start || left.end - right.end);
  words.sort((left, right) => left.start - right.start || left.end - right.end);
  const firstResult = runs[0] && runs[0].result ? runs[0].result : {};
  return {
    ok: true,
    language: firstResult.language || "auto",
    detectedLanguage,
    task: firstResult.task || "transcribe",
    outputLanguage: firstResult.outputLanguage || "source",
    trimStartSeconds: 0,
    trimEndSeconds: maxCaptionEnd(captions),
    captions,
    words,
    sourceClipCount: runs.length,
    files: { srtPath: "", jsonPath: "", audioPath: "", clipFiles }
  };
}

function formatSrtCaptions(captions) {
  return (captions || [])
    .map(
      (caption, index) =>
        `${index + 1}\n${formatSrtTime(caption.start)} --> ${formatSrtTime(caption.end)}\n${String(caption.text || "").trim()}`
    )
    .join("\n\n")
    .concat(captions && captions.length ? "\n" : "");
}

function normalizeTranscribedCaptions(captions, language) {
  let capitalizeNext = true;
  return (captions || []).map((caption) => {
    let text = normalizeTranscriptText(caption.text, language);
    if (language === "tr" && capitalizeNext) {
      text = text.replace(/^([a-zçğıöşü])/, (letter) => letter.toLocaleUpperCase("tr-TR"));
    }
    capitalizeNext = /[.!?][\"'”’)]?$/.test(text);
    return { ...caption, text };
  });
}

function normalizeTranscriptText(value, language) {
  let text = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.;:!?])(?=[^\s,.;:!?])/g, "$1 ")
    .trim();
  if (!text || language !== "tr") {
    return text;
  }

  const canonicalTerms = [
    [/\bpremiere\s+pro\b/gi, "Premiere Pro"],
    [/\bcutback\b/gi, "Cutback"],
    [/\bzola\b/gi, "Zola"],
    [/\bre\s*\/\s*max\b/gi, "RE/MAX"],
    [/\boslo\s*dent\b/gi, "OsloDent"],
    [/\bmonarch\b/gi, "MONARCH"],
    [/\besrarengiz\s+bir\s+olay\b/gi, "Esrarengiz Bir Olay"],
    [/\bmahmara\b/gi, "Marmara"],
    [/\bdeprimi\b/gi, "depremi"],
    [/\bulu\s+camii?\b/gi, "Ulu Cami"]
  ];
  canonicalTerms.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  return text.replace(/([.!?]\s+)([a-zçğıöşü])/g, (match, prefix, letter) =>
    prefix + letter.toLocaleUpperCase("tr-TR")
  );
}

function formatSrtTime(value) {
  const totalMilliseconds = Math.max(0, Math.round(safeSeconds(value) * 1000));
  const hours = Math.floor(totalMilliseconds / 3600000);
  const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
  const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
  const milliseconds = totalMilliseconds % 1000;
  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0") +
    "," +
    String(milliseconds).padStart(3, "0")
  );
}

async function translateTextCaptions(body) {
  const captions = Array.isArray(body && body.captions) ? body.captions : [];
  const targetLanguage = normalizeTranslationLanguage(body && body.targetLanguage);
  const sourceLanguage = normalizeTranslationSourceLanguage(body && body.sourceLanguage);

  if (!captions.length) {
    return { ok: false, code: "NO_CAPTIONS", message: "Çeviri için caption bulunamadı." };
  }

  if (!targetLanguage) {
    return { ok: false, code: "TARGET_LANGUAGE_MISSING", message: "Hedef çeviri dili seçilmedi." };
  }

  if (!GOOGLE_TRANSLATE_API_KEY) {
    return {
      ok: false,
      code: "GOOGLE_TRANSLATE_KEY_MISSING",
      message:
        "Google çeviri anahtarı yok. Engine'i CAPITON_GOOGLE_TRANSLATE_API_KEY veya GOOGLE_TRANSLATE_API_KEY ile başlat."
    };
  }

  const sourceItems = captions.map((caption, index) => {
    const item = caption || {};
    return {
      index,
      start: safeSeconds(item.start),
      end: safeSeconds(item.end),
      sourceText: normalizeSubtitleText(item.text)
    };
  });
  const textsToTranslate = sourceItems.filter((item) => item.sourceText).map((item) => item.sourceText);
  const characterCount = textsToTranslate.reduce((total, text) => total + text.length, 0);
  let translatedTexts = [];

  try {
    if (sourceLanguage && sourceLanguage === targetLanguage) {
      translatedTexts = textsToTranslate.slice();
    } else if (textsToTranslate.length) {
      translatedTexts = await translateWithGoogleCloud(textsToTranslate, sourceLanguage || "auto", targetLanguage);
    }
  } catch (error) {
    return {
      ok: false,
      code: "TRANSLATION_FAILED",
      message: "Çeviri servisi çalışmadı: " + (error.message || String(error))
    };
  }

  let translatedIndex = 0;
  const translated = sourceItems.map((item) => {
    const text = item.sourceText ? translatedTexts[translatedIndex] || item.sourceText : "";
    if (item.sourceText) {
      translatedIndex += 1;
    }
    return {
      index: item.index,
      start: item.start,
      end: item.end,
      text,
      sourceText: item.sourceText
    };
  });

  return {
    ok: true,
    provider: "google-cloud-translation-basic",
    sourceLanguage: sourceLanguage || "auto",
    targetLanguage,
    characterCount,
    captions: translated,
    message: `${translated.length} caption ${targetLanguage.toUpperCase()} diline çevrildi. ${characterCount} karakter kullanıldı.`
  };
}

async function translateWithGoogleCloud(texts, sourceLanguage, targetLanguage) {
  const batches = chunkTranslationTexts(texts);
  const translated = [];
  for (const batch of batches) {
    const batchResult = await translateBatchWithGoogleCloud(batch, sourceLanguage, targetLanguage);
    translated.push(...batchResult);
  }
  return translated;
}

function chunkTranslationTexts(texts, maxItems, maxCharacters) {
  const itemLimit = Math.max(1, Number(maxItems) || TRANSLATION_BATCH_MAX_ITEMS);
  const characterLimit = Math.max(1, Number(maxCharacters) || TRANSLATION_BATCH_MAX_CHARACTERS);
  const batches = [];
  let current = [];
  let currentCharacters = 0;

  for (const value of texts || []) {
    const text = String(value || "");
    const wouldOverflowItems = current.length >= itemLimit;
    const wouldOverflowCharacters = current.length > 0 && currentCharacters + text.length > characterLimit;
    if (wouldOverflowItems || wouldOverflowCharacters) {
      batches.push(current);
      current = [];
      currentCharacters = 0;
    }
    current.push(text);
    currentCharacters += text.length;
  }

  if (current.length) {
    batches.push(current);
  }
  return batches;
}

function translateBatchWithGoogleCloud(texts, sourceLanguage, targetLanguage) {
  const target = googleLanguageCode(targetLanguage);
  const source = sourceLanguage && sourceLanguage !== "auto" ? googleLanguageCode(sourceLanguage) : "auto";
  const payload = {
    q: texts,
    target,
    format: "text"
  };
  if (source !== "auto") {
    payload.source = source;
  }
  const rawPayload = JSON.stringify(payload);
  const requestOptions = {
    hostname: "translation.googleapis.com",
    path: "/language/translate/v2?key=" + encodeURIComponent(GOOGLE_TRANSLATE_API_KEY),
    method: "POST",
    timeout: 20000,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(rawPayload)
    }
  };

  return new Promise((resolve, reject) => {
    const request = https.request(requestOptions, (response) => {
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        raw += chunk;
      });
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Google Cloud Translation cevap vermedi (${response.statusCode}): ${raw.slice(0, 240)}`));
          return;
        }

        try {
          const parsed = JSON.parse(raw);
          const translations =
            parsed && parsed.data && Array.isArray(parsed.data.translations) ? parsed.data.translations : [];
          resolve(
            texts.map((text, index) => {
              const translated = translations[index] && translations[index].translatedText;
              return decodeHtmlEntities(translated || text);
            })
          );
        } catch (error) {
          reject(new Error("Google Cloud Translation cevabı okunamadı: " + error.message));
        }
      });
    });

    request.on("timeout", () => {
      request.destroy(new Error("Google Cloud Translation zaman aşımına uğradı."));
    });
    request.on("error", reject);
    request.write(rawPayload);
    request.end();
  });
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeSubtitleText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function installUpdatePackage(body) {
  const info = body || {};
  const downloadUrl = String(info.downloadUrl || "").trim();
  const version = String(info.version || info.latest || "").replace(/^v/i, "").trim();
  const extensionPath = normalizeFileSystemPath(info.extensionPath);

  if (!downloadUrl || !/^https:\/\/github\.com\/galipcandmr\/Zola_Caption\/releases\/download\//.test(downloadUrl)) {
    setUpdateJob("error", "Güncelleme adresi güvenli Zola Caption GitHub release adresi değil.", "INVALID_UPDATE_URL");
    return {
      ok: false,
      code: "INVALID_UPDATE_URL",
      message: "Güncelleme adresi güvenli Zola Caption GitHub release adresi değil."
    };
  }

  const jobId = `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
  const updateDir = path.join(os.tmpdir(), `zola-caption-update-${jobId}`);
  const zipPath = path.join(updateDir, "update.zip");
  fs.mkdirSync(updateDir, { recursive: true });

  try {
    setUpdateJob("checking", "Disk alanı kontrol ediliyor...");
    const REQUIRED_BYTES = 1.5 * 1024 * 1024 * 1024;
    const freeBytes = getAvailableDiskBytes(os.tmpdir());
    if (freeBytes !== null && freeBytes < REQUIRED_BYTES) {
      const message =
        "Yetersiz disk alanı: " +
        Math.round(freeBytes / 1024 / 1024) +
        "MB boş, güncelleme için en az " +
        Math.round(REQUIRED_BYTES / 1024 / 1024) +
        "MB gerekiyor.";
      setUpdateJob("error", message, "INSUFFICIENT_DISK_SPACE");
      return { ok: false, code: "INSUFFICIENT_DISK_SPACE", message };
    }

    setUpdateJob("downloading", "Güncelleme GitHub'dan indiriliyor...");
    await downloadFile(downloadUrl, zipPath);

    setUpdateJob("extracting", "Paket açılıyor...");
    await unzipFile(zipPath, updateDir);

    const packageRoot = findUpdatePackageRoot(updateDir);
    const cepSource = path.join(packageRoot, "capiton-premiere-cep-plugin");
    const engineSource = path.join(packageRoot, "capiton-local-engine");

    if (!fs.existsSync(cepSource) || !fs.existsSync(engineSource)) {
      setUpdateJob("error", "Güncelleme paketi beklenen Zola Caption klasörlerini içermiyor.", "INVALID_UPDATE_PACKAGE");
      return {
        ok: false,
        code: "INVALID_UPDATE_PACKAGE",
        message: "Güncelleme paketi beklenen Zola Caption klasörlerini içermiyor."
      };
    }

    const cepTarget = extensionPath || defaultCepExtensionPath();
    const engineTarget = ROOT;

    setUpdateJob("installing", "Panel dosyaları kopyalanıyor...");
    await copyDirectory(cepSource, cepTarget, {
      removeTarget: true,
      preserveNames: new Set()
    });

    setUpdateJob("installing", "Yerel motor dosyaları kopyalanıyor...");
    await copyDirectory(engineSource, engineTarget, {
      removeTarget: false,
      preserveNames: new Set([".env", "work", "bin", "models"])
    });

    setUpdateJob("hardening", "Güvenlik bayrakları (quarantine/codesign) temizleniyor...");
    hardenEngineBinaries(engineTarget);

    setUpdateJob("restarting", "Arka plan motoru yeniden başlatılıyor...");

    return {
      ok: true,
      version,
      cepTarget,
      engineTarget,
      message:
        "Zola Caption güncellendi; arka plan motoru otomatik yeniden başlatılıyor. Panelin tamamen yenilenmesi için Premiere Pro'yu kapatıp yeniden aç."
    };
  } catch (error) {
    setUpdateJob("error", error.message || String(error), "UPDATE_INSTALL_FAILED");
    return {
      ok: false,
      code: "UPDATE_INSTALL_FAILED",
      message: "Güncelleme yüklenemedi: " + (error.message || String(error))
    };
  } finally {
    fs.rmSync(updateDir, { recursive: true, force: true });
  }
}

function getAvailableDiskBytes(targetPath) {
  try {
    const output = execFileSync("df", ["-k", targetPath], { encoding: "utf8" });
    const lines = output.trim().split("\n");
    const columns = lines[lines.length - 1].trim().split(/\s+/);
    const availableKb = Number(columns[3]);
    return isNaN(availableKb) ? null : availableKb * 1024;
  } catch (error) {
    return null;
  }
}

function hardenEngineBinaries(engineTarget) {
  try {
    execFileSync("xattr", ["-dr", "com.apple.quarantine", engineTarget], { stdio: "ignore" });
  } catch (error) {}

  const binDir = path.join(engineTarget, "bin");
  let entries = [];
  try {
    entries = fs.readdirSync(binDir);
  } catch (error) {
    return;
  }
  for (const name of entries) {
    if (!name.endsWith(".dylib") && name !== "whisper-cli" && name !== "ffmpeg") {
      continue;
    }
    try {
      execFileSync("codesign", ["--force", "--sign", "-", path.join(binDir, name)], { stdio: "ignore" });
    } catch (error) {}
  }
}

function normalizeFileSystemPath(value) {
  let raw = String(value || "").trim();
  // Some CEP/Premiere builds report getSystemPath("extension") as a
  // file:// URI (percent-encoded) instead of a plain filesystem path; using
  // that raw string as a copy target creates a bogus nested directory tree
  // instead of writing to the real extension folder.
  if (/^file:\/\//i.test(raw)) {
    raw = raw.replace(/^file:\/\//i, "");
    try {
      raw = decodeURIComponent(raw);
    } catch (error) {}
  }
  return raw;
}

function defaultCepExtensionPath() {
  return path.join(os.homedir(), "Library", "Application Support", "Adobe", "CEP", "extensions", "com.zoladijital.capiton.panel");
}

function downloadFile(url, targetPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(targetPath);
    const request = https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close(() => {
          fs.unlink(targetPath, () => {
            downloadFile(response.headers.location, targetPath).then(resolve, reject);
          });
        });
        return;
      }

      if (response.statusCode !== 200) {
        file.close(() => {
          fs.unlink(targetPath, () => {
            reject(new Error(`Release paketi indirilemedi: HTTP ${response.statusCode}`));
          });
        });
        return;
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    });
    request.setTimeout(120000, () => {
      request.destroy(new Error("Güncelleme indirme zaman aşımına uğradı."));
    });
    request.on("error", (error) => {
      file.close(() => {
        fs.unlink(targetPath, () => reject(error));
      });
    });
  });
}

async function unzipFile(zipPath, targetDir) {
  const unzip = findExecutable(["/usr/bin/unzip", "unzip"]);
  if (!unzip) {
    throw new Error("macOS unzip bulunamadı.");
  }
  await run(unzip, ["-q", "-o", zipPath, "-d", targetDir]);
}

function findUpdatePackageRoot(updateDir) {
  const entries = fs.readdirSync(updateDir).map((name) => path.join(updateDir, name));
  for (const entry of entries) {
    if (!fs.statSync(entry).isDirectory()) {
      continue;
    }
    if (
      fs.existsSync(path.join(entry, "capiton-premiere-cep-plugin")) &&
      fs.existsSync(path.join(entry, "capiton-local-engine"))
    ) {
      return entry;
    }
  }
  throw new Error("Güncelleme paketi kök klasörü bulunamadı.");
}

async function copyDirectory(source, target, options = {}) {
  const preserveNames = options.preserveNames || new Set();
  if (options.removeTarget && fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
  fs.mkdirSync(target, { recursive: true });
  for (const name of fs.readdirSync(source)) {
    if (name === ".DS_Store" || preserveNames.has(name)) {
      continue;
    }
    const sourcePath = path.join(source, name);
    const targetPath = path.join(target, name);
    const stat = fs.statSync(sourcePath);
    if (stat.isDirectory()) {
      if (fs.existsSync(targetPath) && !fs.statSync(targetPath).isDirectory()) {
        fs.rmSync(targetPath, { force: true });
      }
      await copyDirectory(sourcePath, targetPath, { preserveNames });
    } else {
      await fsp.copyFile(sourcePath, targetPath);
      fs.chmodSync(targetPath, stat.mode);
      // Buyuk dosyalar arasinda event loop'a nefes alma firsati ver, yoksa
      // kopyalama suresince /update-status sorgulamasi cevap alamiyor.
      await new Promise((resolve) => setImmediate(resolve));
    }
  }
}

function installLaunchAgent(engineTarget) {
  const nodePath = process.execPath || findExecutable(["node", "/opt/homebrew/bin/node", "/usr/local/bin/node"]);
  const launchAgentsDir = path.join(os.homedir(), "Library", "LaunchAgents");
  const plistPath = path.join(launchAgentsDir, "com.zoladijital.capiton.engine.plist");
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.zoladijital.capiton.engine</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xmlEscape(nodePath)}</string>
    <string>${xmlEscape(path.join(engineTarget, "server.js"))}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${xmlEscape(engineTarget)}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/zola-caption-engine.out.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/zola-caption-engine.err.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>CAPITON_ENGINE_PORT</key>
    <string>17771</string>
  </dict>
</dict>
</plist>
`;
  fs.mkdirSync(launchAgentsDir, { recursive: true });
  fs.writeFileSync(plistPath, plist, "utf8");
  const launchctl = findExecutable(["/bin/launchctl", "launchctl"]);
  const shell = findExecutable(["/bin/sh", "sh"]);
  if (launchctl && shell) {
    // bootout kills this very process (it's the running LaunchAgent job), so
    // chaining bootstrap on its "close" event is unreliable: this process's
    // event loop can die before the callback fires, leaving the agent
    // unloaded with no restart. Run the restart as a separate detached shell
    // so it survives this process being killed mid-restart.
    const restartCommand = `${shellQuote(launchctl)} bootout gui/${process.getuid()} ${shellQuote(plistPath)}; ${shellQuote(launchctl)} bootstrap gui/${process.getuid()} ${shellQuote(plistPath)}`;
    const child = spawn(shell, ["-c", restartCommand], { stdio: "ignore", detached: true });
    child.unref();
  }
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeTranslationSourceLanguage(language) {
  const code = String(language || "auto").trim().toLowerCase();
  if (code === "auto") {
    return "auto";
  }
  return normalizeTranslationLanguage(code) || "auto";
}

function normalizeTranslationLanguage(language) {
  const code = String(language || "").trim().toLowerCase();
  const supported = new Set(["tr", "en", "de", "ru"]);
  return supported.has(code) ? code : "";
}

function googleLanguageCode(language) {
  return language === "zh" ? "zh-CN" : language;
}

function parseWhisperWords(json) {
  const words = [];
  const segments = Array.isArray(json && json.transcription)
    ? json.transcription
    : Array.isArray(json && json.segments)
      ? json.segments
      : [];

  for (const segment of segments) {
    const tokens = Array.isArray(segment && segment.tokens) ? segment.tokens : [];
    if (tokens.length) {
      const segmentWords = [];
      let current = null;

      for (const token of tokens) {
        const rawText = String(token.text || token.token || token.value || "");
        if (!rawText || /^\[.*\]$/.test(rawText.trim()) || /^<\|.*\|>$/.test(rawText.trim())) {
          continue;
        }

        const offsets = token.offsets || {};
        const timestamps = token.timestamps || {};
        const from = secondsFromWhisperTime(timestamps.from, offsets.from, token.t0 ?? token.start ?? token.start_ms);
        let to = secondsFromWhisperTime(timestamps.to, offsets.to, token.t1 ?? token.end ?? token.end_ms);
        if (!Number.isFinite(from) || !Number.isFinite(to)) {
          continue;
        }
        if (to <= from) {
          // whisper.cpp sometimes emits zero-duration word tokens right after
          // a silence gap; give them a minimal width instead of dropping
          // them, otherwise the word disappears from the global timeline and
          // every caption after the gap mis-aligns against it.
          to = from + 0.06;
        }

        const startsNewWord = /^\s/.test(rawText);
        const piece = rawText.replace(/\s+/g, "");
        if (!piece) {
          continue;
        }

        if (!current || startsNewWord) {
          if (current) {
            segmentWords.push(current);
          }
          current = { start: from, end: to, text: piece };
        } else {
          current.text += piece;
          current.end = to;
        }
      }

      if (current) {
        segmentWords.push(current);
      }

      segmentWords.forEach((word) => {
        const text = cleanWord(word.text);
        if (text) {
          words.push({ start: word.start, end: word.end, text });
        }
      });
      continue;
    }

    if (segment && segment.text) {
      const segmentWords = String(segment.text).trim().split(/\s+/).map(cleanWord).filter(Boolean);
      const segmentOffsets = segment.offsets || {};
      const segmentTimestamps = segment.timestamps || {};
      const from = secondsFromWhisperTime(segmentTimestamps.from, segmentOffsets.from, segment.start ?? segment.start_ms);
      const to = secondsFromWhisperTime(segmentTimestamps.to, segmentOffsets.to, segment.end ?? segment.end_ms);
      if (segmentWords.length && Number.isFinite(from) && Number.isFinite(to) && to > from) {
        const step = (to - from) / segmentWords.length;
        segmentWords.forEach((word, index) => {
          words.push({ start: from + index * step, end: from + (index + 1) * step, text: word });
        });
      }
    }
  }

  return words;
}

function parseWhisperWordsLegacy(json) {
  const words = [];
  const segments = Array.isArray(json && json.transcription)
    ? json.transcription
    : Array.isArray(json && json.segments)
      ? json.segments
      : [];

  for (const segment of segments) {
    const tokens = Array.isArray(segment && segment.tokens) ? segment.tokens : [];
    for (const token of tokens) {
      const text = cleanWord(token.text || token.token || token.value || "");
      if (!text) {
        continue;
      }
      const offsets = token.offsets || {};
      const timestamps = token.timestamps || {};
      const from = secondsFromWhisperTime(timestamps.from, offsets.from, token.t0 ?? token.start ?? token.start_ms);
      const to = secondsFromWhisperTime(timestamps.to, offsets.to, token.t1 ?? token.end ?? token.end_ms);
      if (Number.isFinite(from) && Number.isFinite(to) && to > from) {
        words.push({ start: from, end: to, text });
      }
    }

    if (!tokens.length && segment && segment.text) {
      const segmentWords = String(segment.text).trim().split(/\s+/).map(cleanWord).filter(Boolean);
      const segmentOffsets = segment.offsets || {};
      const segmentTimestamps = segment.timestamps || {};
      const from = secondsFromWhisperTime(segmentTimestamps.from, segmentOffsets.from, segment.start ?? segment.start_ms);
      const to = secondsFromWhisperTime(segmentTimestamps.to, segmentOffsets.to, segment.end ?? segment.end_ms);
      if (segmentWords.length && Number.isFinite(from) && Number.isFinite(to) && to > from) {
        const step = (to - from) / segmentWords.length;
        segmentWords.forEach((word, index) => {
          words.push({ start: from + index * step, end: from + (index + 1) * step, text: word });
        });
      }
    }
  }

  return words;
}

function secondsFromOffset(value) {
  if (typeof value === "number") {
    return value > 1000 ? value / 1000 : value;
  }
  const text = String(value || "").trim();
  const match = text.match(/(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d+))?/);
  if (match) {
    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);
    const millis = Number((match[4] || "0").slice(0, 3).padEnd(3, "0")) / 1000;
    return hours * 3600 + minutes * 60 + seconds + millis;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function millisecondsFromOffset(value) {
  if (typeof value === "number") {
    return value / 1000;
  }
  return secondsFromOffset(value);
}

function secondsFromWhisperTime(timestampValue, offsetValue, fallbackValue) {
  const fromTimestamp = secondsFromOffset(timestampValue);
  if (Number.isFinite(fromTimestamp)) {
    return fromTimestamp;
  }

  const fromOffset = millisecondsFromOffset(offsetValue);
  if (Number.isFinite(fromOffset)) {
    return fromOffset;
  }

  return secondsFromOffset(fallbackValue);
}

function cleanWord(value) {
  return String(value || "").replace(/<\\|[^>]+\\|>/g, "").trim();
}

async function renderOverlay(body) {
  const ffmpeg = findExecutable([path.join(ROOT, "bin", "ffmpeg"), "ffmpeg", "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"]);
  if (!ffmpeg) {
    return { ok: false, code: "FFMPEG_NOT_FOUND", message: "Overlay üretmek için ffmpeg gerekli." };
  }

  const captions = Array.isArray(body && body.captions) ? body.captions : [];
  if (!captions.length) {
    return { ok: false, code: "NO_CAPTIONS", message: "Overlay için caption bulunamadı." };
  }

  const preset = (body && body.preset) || {};
  const width = safeDimension(body && body.width, 1080);
  const height = safeDimension(body && body.height, 1920);
  const renderSize = resolveOverlayRenderSize(width, height);
  const duration = Math.max(1, safeSeconds(body && body.durationSeconds) || maxCaptionEnd(captions) + 0.5);
  const jobId = `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
  const assPath = path.join(WORK_DIR, `${jobId}.ass`);
  const requestedOverlayPath = resolveOverlayOutputPath(body && body.outputPath);
  const overlayPath = requestedOverlayPath || path.join(WORK_DIR, `${jobId}-capiton-overlay.mov`);
  const renderPath = requestedOverlayPath ? path.join(WORK_DIR, `${jobId}-capiton-overlay-tmp.mov`) : overlayPath;

  fs.writeFileSync(assPath, buildAss(captions, preset, renderSize.width, renderSize.height), "utf8");

  await run(ffmpeg, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=black@0.0:s=${renderSize.width}x${renderSize.height}:d=${duration}:r=30,format=rgba`,
    "-r",
    "30",
    "-vf",
    buildOverlayFilterGraph(assPath, width, height, renderSize),
    "-an",
    "-c:v",
    "qtrle",
    "-pix_fmt",
    "argb",
    "-metadata:s:v:0",
    "alpha_mode=straight",
    "-movflags",
    "+faststart",
    renderPath
  ]);

  if (requestedOverlayPath) {
    fs.renameSync(renderPath, overlayPath);
  }

  return {
    ok: true,
    overlayPath,
    assPath,
    durationSeconds: duration,
    width,
    height,
    renderWidth: renderSize.width,
    renderHeight: renderSize.height,
    supersampleFactor: renderSize.factor,
    updatedExisting: !!requestedOverlayPath,
    message: requestedOverlayPath
      ? `Mevcut caption overlay güncellendi: ${overlayPath}`
      : `Stilli caption overlay üretildi: ${overlayPath}`
  };
}

async function renderWatermark(body) {
  const ffmpeg = findExecutable([path.join(ROOT, "bin", "ffmpeg"), "ffmpeg", "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"]);
  if (!ffmpeg) {
    return { ok: false, code: "FFMPEG_NOT_FOUND", message: "Watermark üretmek için ffmpeg gerekli." };
  }

  const preset = (body && body.preset) || {};
  const width = safeDimension(body && body.width, 1080);
  const height = safeDimension(body && body.height, 1920);
  const jobId = `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
  const assPath = path.join(WORK_DIR, `${jobId}-esrarengiz-watermark.ass`);
  const watermarkPath = path.join(WORK_DIR, `${jobId}-esrarengiz-watermark.png`);
  fs.writeFileSync(assPath, buildWatermarkAss(preset, width, height), "utf8");

  await run(ffmpeg, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=black@0.0:s=${width}x${height}:d=0.04:r=1,format=rgba`,
    "-vf",
    buildOverlayFilterGraph(assPath, width, height, { width, height, factor: 1 }),
    "-frames:v",
    "1",
    "-c:v",
    "png",
    watermarkPath
  ]);

  return {
    ok: true,
    watermarkPath,
    assPath,
    width,
    height,
    opacity: 20,
    message: "@esrarengizbiolay watermark katmanı üretildi."
  };
}

function resolveOverlayRenderSize(width, height) {
  const targetWidth = safeDimension(width, 1080);
  const targetHeight = safeDimension(height, 1920);
  const factor = targetWidth < 1080 || targetHeight < 1920 ? 2 : 1;
  return {
    width: Math.min(8192, targetWidth * factor),
    height: Math.min(8192, targetHeight * factor),
    factor
  };
}

function buildOverlayFilterGraph(assPath, targetWidth, targetHeight, renderSize) {
  const bundledFonts = path.join(ROOT, "fonts");
  const fontOption = fs.existsSync(bundledFonts)
    ? `:fontsdir=${escapeFfmpegFilterPath(bundledFonts)}`
    : "";
  const filters = [`ass=${escapeFfmpegFilterPath(assPath)}${fontOption}:alpha=1`];
  if (renderSize.width !== targetWidth || renderSize.height !== targetHeight) {
    filters.push(`scale=${targetWidth}:${targetHeight}:flags=lanczos+accurate_rnd`);
  }
  filters.push("format=argb");
  return filters.join(",");
}

function resolveOverlayOutputPath(value) {
  if (!value) {
    return "";
  }

  const resolved = path.resolve(String(value));
  const workRoot = path.resolve(WORK_DIR) + path.sep;
  if (!resolved.startsWith(workRoot) || path.extname(resolved).toLowerCase() !== ".mov") {
    return "";
  }
  return resolved;
}

function safeSeconds(value) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function initialPrompt(language, task) {
  if (task === "translate") {
    return "Translate the speech into clear, natural English subtitles. Preserve names and meaning.";
  }
  if (language === "tr") {
    return "Türkçe konuşma dökümü. Türkçe karakterler: ç, ğ, ı, İ, ö, ş, ü. Özel adlar: Zola, Premiere Pro, Cutback, Esrarengiz Bir Olay, MONARCH, RE/MAX, OsloDent, Bursa, Marmara Depremi, Ulu Cami.";
  }
  if (language === "en") {
    return "This is an English interview transcript. Preserve names and natural punctuation.";
  }
  return "";
}

function parseWhisperLanguage(json) {
  const language =
    (json && json.result && json.result.language) ||
    (json && json.params && json.params.language) ||
    (json && json.language) ||
    "";
  return typeof language === "string" ? language.trim().toLowerCase() : "";
}

function safeDimension(value, fallback) {
  const parsed = Math.round(Number(value || fallback));
  if (!Number.isFinite(parsed) || parsed < 64 || parsed > 8192) {
    return fallback;
  }
  return parsed;
}

function maxCaptionEnd(captions) {
  return captions.reduce((max, caption) => Math.max(max, safeSeconds(caption.end)), 0);
}

function buildAss(captions, preset, width, height) {
  if (Array.isArray(preset && preset.karaokeCaptions) && preset.karaokeCaptions.length) {
    return buildKaraokeAss(preset.karaokeCaptions, preset, width, height);
  }

  const primary = assColor(preset.primaryColor || "#ffffff", "00");
  const outline = preset.boxEnabled
    ? assColor(preset.boxColor || "#000000", assAlphaFromOpacity(preset.boxOpacity, 80))
    : assColor(preset.strokeColor || "#000000", assAlphaFromOpacity(preset.strokeOpacity, 100));
  const back = preset.boxEnabled
    ? assColor(preset.boxColor || "#000000", assAlphaFromOpacity(preset.boxOpacity, 80))
    : assColor(
        preset.shadowColor || "#000000",
        preset.shadowEnabled === false ? "FF" : assAlphaFromOpacity(preset.shadowOpacity, 65)
      );
  const resolvedFont = resolveAssFontStyle(preset.fontFamily || "Arial", preset.fontWeight, preset.italicEnabled);
  const font = sanitizeAssText(resolvedFont.family);
  const scale = clampNumber(preset.scale, 1, 0.4, 3);
  const dimensionScale = captionDimensionScale(width, height, preset);
  const fontSize = Math.round(Number(preset.fontSize || 56) * scale * dimensionScale);
  const outlineWidth = preset.boxEnabled
    ? clampNumber(preset.boxPadding, 8, 0, 30) * dimensionScale
    : clampNumber(preset.strokeWidth, 5, 0, 24) * dimensionScale;
  const letterSpacing = clampNumber(preset.letterSpacing, 0, -4, 20) * dimensionScale;
  const marginV = Math.round(height * 0.13);
  const borderStyle = preset.boxEnabled ? 3 : 1;
  const shadowSize = preset.shadowEnabled === false ? 0 : clampNumber(preset.shadowDistance, 4, 0, 40) * dimensionScale;
  const bold = resolvedFont.bold;
  const italic = resolvedFont.italic;
  const underline = preset.underlineEnabled ? 1 : 0;
  const dialogueTag = captionDialogueTag(preset, width, height);

  const lines = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Capiton,${font},${fontSize},${primary},${primary},${outline},${back},${bold},${italic},${underline},0,100,100,${letterSpacing},0,${borderStyle},${outlineWidth},${shadowSize},2,80,80,${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
  ];

  for (const caption of captions) {
    const text = sanitizeAssText(transformPresetText(caption.translation || caption.text || "", preset.letterCase));
    if (!text) {
      continue;
    }
    const start = formatAssTime(safeSeconds(caption.start));
    const end = formatAssTime(Math.max(safeSeconds(caption.end), safeSeconds(caption.start) + 0.2));
    lines.push(`Dialogue: 0,${start},${end},Capiton,,0,0,0,,${dialogueTag}${text}`);
  }

  return `${lines.join("\n")}\n`;
}

function buildKaraokeAss(captions, preset, width, height) {
  const primary = assColor(preset.primaryColor || "#ffffff", "00");
  const outline = preset.boxEnabled
    ? assColor(preset.boxColor || "#000000", assAlphaFromOpacity(preset.boxOpacity, 80))
    : assColor(preset.strokeColor || "#000000", assAlphaFromOpacity(preset.strokeOpacity, 100));
  const back = preset.boxEnabled
    ? assColor(preset.boxColor || "#000000", assAlphaFromOpacity(preset.boxOpacity, 80))
    : assColor(
        preset.shadowColor || "#000000",
        preset.shadowEnabled === false ? "FF" : assAlphaFromOpacity(preset.shadowOpacity, 65)
      );
  const active = assInlineColor(readableActiveColor(preset.accentColor, preset.primaryColor));
  const normal = assInlineColor(preset.primaryColor || "#ffffff");
  const past = assInlineColor(preset.pastTextColor || preset.primaryColor || "#ffffff");
  const resolvedFont = resolveAssFontStyle(preset.fontFamily || "Arial", preset.fontWeight, preset.italicEnabled);
  const font = sanitizeAssText(resolvedFont.family);
  const scale = clampNumber(preset.scale, 1, 0.4, 3);
  const dimensionScale = captionDimensionScale(width, height, preset);
  const fontSize = Math.round(Number(preset.fontSize || 56) * scale * dimensionScale);
  const outlineWidth = preset.boxEnabled
    ? clampNumber(preset.boxPadding, 8, 0, 30) * dimensionScale
    : clampNumber(preset.strokeWidth, 6, 0, 24) * dimensionScale;
  const letterSpacing = clampNumber(preset.letterSpacing, 0, -4, 20) * dimensionScale;
  const marginV = Math.round(height * 0.13);
  const borderStyle = preset.boxEnabled ? 3 : 1;
  const shadowSize = preset.shadowEnabled === false ? 0 : clampNumber(preset.shadowDistance, 4, 0, 40) * dimensionScale;
  const bold = resolvedFont.bold;
  const italic = resolvedFont.italic;
  const underline = preset.underlineEnabled ? 1 : 0;
  const dialogueTag = captionDialogueTag(preset, width, height, { stable: true });
  const syncOffsetSeconds = clampNumber(Number(preset.syncOffsetMs || 0) / 1000, 0, -0.35, 0.35);
  const holdAfterLastWordSeconds = clampNumber(preset.holdAfterLastWordSeconds, 1.5, 0, 4);

  const lines = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Capiton,${font},${fontSize},${primary},${primary},${outline},${back},${bold},${italic},${underline},0,100,100,${letterSpacing},0,${borderStyle},${outlineWidth},${shadowSize},2,80,80,${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
  ];
  const events = [];

  for (const caption of captions) {
    const words = Array.isArray(caption && caption.words) ? caption.words : [];
    if (!words.length) {
      continue;
    }

    const captionStart = Math.max(0, Math.min(safeSeconds(caption.start), safeSeconds(words[0].start)) + syncOffsetSeconds);
    const captionEnd = Math.max(
      captionStart + 0.12,
      safeSeconds(caption.end) + syncOffsetSeconds,
      safeSeconds(words[words.length - 1].end) + syncOffsetSeconds
    );

    for (let index = 0; index < words.length; index += 1) {
      const activeWord = words[index];
      const wordStart = Math.max(0, safeSeconds(activeWord.start) + syncOffsetSeconds);
      const start = index === 0 ? captionStart : Math.max(captionStart, wordStart);
      if (start >= captionEnd - 0.02) {
        continue;
      }
      const nextStart = index < words.length - 1 ? Math.max(0, safeSeconds(words[index + 1].start) + syncOffsetSeconds) : captionEnd;
      const fallbackEnd = Math.max(start + 0.12, safeSeconds(activeWord.end) + syncOffsetSeconds);
      const end = Math.max(start + 0.04, Math.min(captionEnd, nextStart > start ? nextStart : fallbackEnd));
      const displayEnd = index === words.length - 1 ? Math.max(end, fallbackEnd + holdAfterLastWordSeconds) : end;
      const text = words
        .map((word, wordIndex) => {
          const clean = sanitizeAssInlineText(transformPresetText(word.text || "", preset.letterCase));
          if (!clean) {
            return "";
          }
          if (wordIndex === index) {
            return `{\\c${active}}${clean}{\\c${normal}}`;
          }
          if (preset.pastTextEnabled && wordIndex < index) {
            return `{\\c${past}}${clean}{\\c${normal}}`;
          }
          return clean;
        })
        .filter(Boolean)
        .join(" ");

      if (!text) {
        continue;
      }

      events.push({ start, end: displayEnd, text: `${dialogueTag}${text}` });
    }
  }

  events
    .sort((left, right) => left.start - right.start || left.end - right.end)
    .forEach((event, index) => {
      const next = events[index + 1];
      const clippedEnd = next ? Math.min(event.end, next.start) : event.end;
      if (clippedEnd <= event.start + 0.025) {
        return;
      }
      lines.push(`Dialogue: 0,${formatAssTime(event.start)},${formatAssTime(clippedEnd)},Capiton,,0,0,0,,${event.text}`);
    });

  return `${lines.join("\n")}\n`;
}

function buildWatermarkAss(preset, width, height) {
  const dimensionScale = captionDimensionScale(width, height, preset);
  const captionFontSize = Math.round(Number(preset.fontSize || 56) * clampNumber(preset.scale, 1, 0.4, 3) * dimensionScale);
  const watermarkFontSize = Math.max(18, Math.round(captionFontSize * 0.42));
  const xOffset = clampNumber(preset.positionX, 0, -540, 540) * (width / 1080);
  const x = Math.round(width / 2 + xOffset);
  const captionY = Math.round(height * (clampNumber(preset.positionY, 76, 5, 95) / 100));
  const gap = Math.max(6, Math.round(captionFontSize * 0.13));
  const y = Math.min(height - watermarkFontSize - 4, captionY + gap);

  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Watermark,Zilla Slab,${watermarkFontSize},&H00ffffff,&H00ffffff,&HFF000000,&HFF000000,0,0,0,0,100,100,0,0,1,0,0,8,0,0,0,1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    `Dialogue: 0,0:00:00.00,0:00:01.00,Watermark,,0,0,0,,{\\an8\\pos(${x},${y})}@esrarengizbiolay`,
    ""
  ].join("\n");
}

function resolveAssFontFamily(value) {
  const font = String(value || "").trim();
  const bundledAliases = {
    "arboria-bold": "Arboria",
    "montserrat-black": "Montserrat",
    "unbounded-medium": "Unbounded",
    "zillaslab-regular": "Zilla Slab"
  };
  return bundledAliases[font.toLowerCase()] || font || "Arial";
}

function resolveAssFontStyle(value, weight, italicEnabled) {
  const source = String(value || "").trim();
  const normalized = source.toLowerCase();
  const numericWeight = clampNumber(weight, 400, 100, 900);
  let family = resolveAssFontFamily(source);
  let bold = numericWeight >= 600 ? 1 : 0;

  if (normalized === "zillaslab-regular" || normalized === "zilla slab") {
    bold = 0;
    if (numericWeight <= 350) {
      family = "Zilla Slab Light";
    } else if (numericWeight <= 450) {
      family = "Zilla Slab";
    } else if (numericWeight <= 550) {
      family = "Zilla Slab Medium";
    } else if (numericWeight <= 650) {
      family = "Zilla Slab SemiBold";
    } else {
      family = "Zilla Slab";
      bold = 1;
    }
  }

  return {
    family,
    bold,
    italic: italicEnabled ? 1 : 0
  };
}

function captionDialogueTag(preset, width, height, options) {
  const animation = String(preset.animation || "pop");
  const xOffset = clampNumber(preset.positionX, 0, -540, 540) * (width / 1080);
  const x = Math.round(width / 2 + xOffset);
  const y = Math.round(height * (clampNumber(preset.positionY, 76, 5, 95) / 100));
  const travel = Math.round(height * 0.045);
  const appearance = captionAppearanceTags(preset);

  if (options && options.stable) {
    return `{\\an2\\pos(${x},${y})${appearance}}`;
  }

  if (animation === "none") {
    return `{\\an2\\pos(${x},${y})${appearance}}`;
  }

  if (animation === "fade") {
    return `{\\an2\\pos(${x},${y})${appearance}\\fad(130,130)}`;
  }
  if (animation === "slide-up") {
    return `{\\an2\\move(${x},${y + travel},${x},${y},0,180)${appearance}\\fad(70,120)}`;
  }
  if (animation === "pop" || animation === "karaoke") {
    return `{\\an2\\pos(${x},${y})${appearance}\\fad(40,80)\\fscx92\\fscy92\\t(0,120,\\fscx108\\fscy108)\\t(120,220,\\fscx100\\fscy100)}`;
  }
  return `{\\an2\\pos(${x},${y})${appearance}}`;
}

function captionAppearanceTags(preset) {
  if (!preset || preset.shadowEnabled === false || preset.boxEnabled) {
    return "";
  }
  const distance = clampNumber(preset.shadowDistance, 4, 0, 40);
  const rawDirection = Number(preset.shadowDirection);
  const normalizedDirection = Number.isFinite(rawDirection) ? ((rawDirection % 360) + 360) % 360 : 135;
  const direction = (normalizedDirection * Math.PI) / 180;
  const xShadow = Math.round(Math.cos(direction) * distance * 10) / 10;
  const yShadow = Math.round(Math.sin(direction) * distance * 10) / 10;
  const blur = clampNumber(preset.shadowBlur, 2, 0, 100);
  return `\\xshad${xShadow}\\yshad${yShadow}\\blur${blur}`;
}

function captionDimensionScale(width, height, preset) {
  const referenceWidth = clampNumber(preset && preset.templateReferenceWidth, 1080, 64, 8192);
  const referenceHeight = clampNumber(preset && preset.templateReferenceHeight, 1920, 64, 8192);
  return Math.max(
    0.1,
    Math.min(8, Math.min(Number(width || referenceWidth) / referenceWidth, Number(height || referenceHeight) / referenceHeight))
  );
}

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

function transformPresetText(text, mode) {
  const value = String(text || "");
  if (mode === "uppercase") {
    return value.toLocaleUpperCase("tr-TR");
  }
  if (mode === "lowercase") {
    return value.toLocaleLowerCase("tr-TR");
  }
  if (mode === "title") {
    return value.replace(/\S+/g, (word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1).toLocaleLowerCase("tr-TR"));
  }
  return value;
}

function readableActiveColor(accentColor, primaryColor) {
  const accent = normalizeHexColor(accentColor || "#fff200");
  const primary = normalizeHexColor(primaryColor || "#ffffff");
  if (!accent || accent === primary) {
    return primary === "#fff200" ? "#5fdcff" : "#fff200";
  }
  return accent;
}

function normalizeHexColor(value) {
  let text = String(value || "").trim().toLowerCase();
  if (!text) {
    return "";
  }
  if (text.charAt(0) !== "#") {
    text = `#${text}`;
  }
  if (/^#[0-9a-f]{3}$/.test(text)) {
    return `#${text.charAt(1)}${text.charAt(1)}${text.charAt(2)}${text.charAt(2)}${text.charAt(3)}${text.charAt(3)}`;
  }
  return /^#[0-9a-f]{6}$/.test(text) ? text : "";
}

function animationTag(animation, width, height, marginV) {
  if (animation === "fade") {
    return "{\\fad(160,160)}";
  }
  if (animation === "slide-up") {
    const x = Math.round(width / 2);
    const y = Math.round(height - marginV);
    return `{\\an2\\move(${x},${y + 80},${x},${y},0,180)\\fad(70,120)}`;
  }
  if (animation === "pop" || animation === "karaoke") {
    return "{\\fad(50,90)\\fscx92\\fscy92\\t(0,130,\\fscx112\\fscy112)\\t(130,240,\\fscx100\\fscy100)}";
  }
  return "";
}

function sanitizeAssText(value) {
  return String(value || "")
    .replace(/\r?\n/g, "\\N")
    .replace(/[{}]/g, "")
    .trim();
}

function sanitizeAssInlineText(value) {
  return String(value || "")
    .replace(/\r?\n/g, " ")
    .replace(/[{}]/g, "")
    .trim();
}

function formatAssTime(value) {
  const safe = Math.max(0, Number(value || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = Math.floor(safe % 60);
  const centis = Math.round((safe - Math.floor(safe)) * 100);
  return `${hours}:${pad2(minutes)}:${pad2(seconds)}.${pad2(centis)}`;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function assColor(hex, alpha) {
  const match = String(hex || "#ffffff").match(/^#?([0-9a-fA-F]{6})$/);
  const value = match ? match[1] : "ffffff";
  const rr = value.slice(0, 2);
  const gg = value.slice(2, 4);
  const bb = value.slice(4, 6);
  return `&H${alpha || "00"}${bb}${gg}${rr}`;
}

function assAlphaFromOpacity(value, fallback) {
  const opacity = clampNumber(value, fallback, 0, 100) / 100;
  return Math.round((1 - opacity) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}

function assInlineColor(hex) {
  const match = String(hex || "#ffffff").match(/^#?([0-9a-fA-F]{6})$/);
  const value = match ? match[1] : "ffffff";
  const rr = value.slice(0, 2);
  const gg = value.slice(2, 4);
  const bb = value.slice(4, 6);
  return `&H${bb}${gg}${rr}&`;
}

function escapeFfmpegFilterPath(filePath) {
  return String(filePath).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

function findWhisperCli() {
  return findExecutable([
    path.join(ROOT, "bin", os.platform() === "win32" ? "whisper-cli.exe" : "whisper-cli"),
    path.join(ROOT, "bin", os.platform() === "win32" ? "main.exe" : "main"),
    "whisper-cli",
    "whisper.cpp",
    "/opt/homebrew/bin/whisper-cli",
    "/usr/local/bin/whisper-cli"
  ]);
}

function findExecutable(candidates) {
  for (const candidate of candidates) {
    if (candidate.includes("/") || candidate.includes("\\")) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
      continue;
    }
    const found = findOnPath(candidate);
    if (found) {
      return found;
    }
  }
  return "";
}

function findOnPath(name) {
  const paths = String(process.env.PATH || "").split(path.delimiter);
  const extensions = os.platform() === "win32" ? ["", ".exe", ".cmd", ".bat"] : [""];
  for (const dir of paths) {
    for (const ext of extensions) {
      const fullPath = path.join(dir, name + ext);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }
  return "";
}

function buildAudioExtractionArgs(mediaPath, trimStartSeconds, trimDurationSeconds, audioPath, fallback) {
  const args = ["-y", "-nostdin", "-hide_banner", "-loglevel", fallback ? "warning" : "error"];
  if (fallback) {
    args.push("-fflags", "+genpts+discardcorrupt", "-err_detect", "ignore_err", "-i", mediaPath);
    if (trimStartSeconds > 0) {
      args.push("-ss", String(trimStartSeconds));
    }
  } else {
    if (trimStartSeconds > 0) {
      args.push("-ss", String(trimStartSeconds));
    }
    args.push("-i", mediaPath);
  }
  if (trimDurationSeconds > 0) {
    args.push("-t", String(trimDurationSeconds));
  }
  args.push("-map", "0:a:0", "-vn", "-ac", "1", "-ar", "16000");
  if (!fallback) {
    args.push("-af", "highpass=f=70,lowpass=f=7600,dynaudnorm=f=250:g=15:p=0.9");
  }
  args.push("-c:a", "pcm_s16le", audioPath);
  return args;
}

async function extractAudioWithFallback(ffmpeg, mediaPath, trimStartSeconds, trimDurationSeconds, audioPath) {
  let primaryError = null;
  try {
    await run(ffmpeg, buildAudioExtractionArgs(mediaPath, trimStartSeconds, trimDurationSeconds, audioPath, false));
    if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 44) {
      return { fallbackUsed: false };
    }
    primaryError = new Error("FFmpeg ses dosyası oluşturdu ancak çıktı boş kaldı.");
  } catch (error) {
    primaryError = error;
  }

  try {
    await run(ffmpeg, buildAudioExtractionArgs(mediaPath, trimStartSeconds, trimDurationSeconds, audioPath, true));
    if (!fs.existsSync(audioPath) || fs.statSync(audioPath).size <= 44) {
      throw new Error("FFmpeg yedek yöntemde de boş ses çıktısı oluşturdu.");
    }
    return { fallbackUsed: true };
  } catch (fallbackError) {
    fallbackError.primaryError = primaryError;
    throw fallbackError;
  }
}

function meaningfulFfmpegLines(value) {
  const ignored = /^(ffmpeg version|built with|configuration:|libav\w+\s+\d|\s*$)/i;
  return String(value || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !ignored.test(line) && !/^\s*[a-z]+\s+\d+\.\s*\d+/i.test(line));
}

function summarizeFfmpegError(error) {
  const fallbackLines = meaningfulFfmpegLines(error && error.stderr);
  const primaryLines = meaningfulFfmpegLines(error && error.primaryError && error.primaryError.stderr);
  const lines = fallbackLines.length ? fallbackLines : primaryLines;
  if (lines.length) {
    return lines.slice(-4).join(" | ").slice(-1200);
  }
  return String((error && error.message) || error || "Bilinmeyen FFmpeg hatası").replace(/^ffmpeg failed \([^)]*\):\s*/i, "").slice(-1200);
}

function describeFfmpegFailure(error, mediaPath) {
  const detail = summarizeFfmpegError(error);
  const normalized = detail.toLowerCase();
  let reason = "Videonun ses kanalı okunamadı.";
  if (/permission denied|operation not permitted|not authorized/.test(normalized)) {
    reason = "Video dosyasına erişim izni yok.";
  } else if (/no such file|not found|does not exist/.test(normalized)) {
    reason = "Video dosyası taşınmış, çevrimdışı veya harici disk bağlı değil.";
  } else if (/does not contain any stream|stream map.*matches no streams|audio.*not found|no audio/.test(normalized)) {
    reason = "Seçilen klipte okunabilir bir ses kanalı bulunamadı.";
  } else if (/no space left|disk full/.test(normalized)) {
    reason = "Diskte ses dosyası oluşturacak boş alan kalmadı.";
  } else if (/invalid data|moov atom not found|corrupt|error while decoding/.test(normalized)) {
    reason = "Video dosyası eksik, bozuk veya codec'i okunamıyor.";
  }
  return `${reason} Medyayı Premiere'de oynatabildiğini ve dosyanın online olduğunu kontrol et. Teknik ayrıntı: ${detail} | Dosya: ${mediaPath}`;
}

function writeLastFfmpegError(error, mediaPath) {
  try {
    const content = [
      new Date().toISOString(),
      `Media: ${mediaPath}`,
      `Error: ${(error && error.message) || error || ""}`,
      `stderr:\n${(error && error.stderr) || ""}`,
      `primary stderr:\n${(error && error.primaryError && error.primaryError.stderr) || ""}`,
      ""
    ].join("\n");
    fs.writeFileSync(path.join(WORK_DIR, "last-ffmpeg-error.log"), content, "utf8");
  } catch (writeError) {}
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      const error = new Error(`${path.basename(command)} failed (${code == null ? signal || "unknown" : code}): ${stderr.slice(-4000)}`);
      error.exitCode = code;
      error.signal = signal;
      error.stderr = stderr;
      error.command = command;
      error.args = args;
      reject(error);
    });
  });
}

function runCapture(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(new Error(`${path.basename(command)} failed (${code}): ${stderr.slice(-2000)}`));
    });
  });
}

async function listSystemFonts(options) {
  const force = !!(options && options.force);
  const cacheAge = Date.now() - systemFontCache.loadedAt;
  if (!force && systemFontCache.result && cacheAge < 10 * 60 * 1000) {
    return systemFontCache.result;
  }

  try {
    let faces = [];
    // system_profiler regularly takes 15-25 seconds on font-heavy Macs.
    // Directory discovery is effectively instant and includes user fonts,
    // system fonts, and the exact font files shipped with Zola.
    faces = fallbackFontFaces().concat(bundledFontFaces());

    const fonts = Array.from(
      new Set(
        faces
          .reduce((values, face) => values.concat([face.family, face.fullName, face.postscriptName]), [])
          .map(cleanFontName)
          .filter(isPublicFontName)
      )
    ).sort(compareFontNames);
    const result = { ok: true, fonts, faces };
    systemFontCache = { loadedAt: Date.now(), result };
    return result;
  } catch (error) {
    const faces = fallbackFontFaces().concat(bundledFontFaces());
    const fonts = Array.from(
      new Set(faces.reduce((values, face) => values.concat([face.family, face.fullName, face.postscriptName]), []).filter(Boolean))
    ).sort(compareFontNames);
    const result = {
      ok: fonts.length > 0,
      fonts,
      faces,
      warning: error.message || String(error)
    };
    systemFontCache = { loadedAt: Date.now(), result };
    return result;
  }
}

function extractMacFontFaces(payload) {
  const items = Array.isArray(payload && payload.SPFontsDataType) ? payload.SPFontsDataType : [];
  const faces = [];
  for (const item of items) {
    if (!item || item.enabled === "no" || item.valid === "no") {
      continue;
    }
    const typefaces = Array.isArray(item.typefaces) ? item.typefaces : [];
    for (const typeface of typefaces) {
      if (!typeface || typeface.enabled === "no" || typeface.valid === "no" || typeface.duplicate === "yes") {
        continue;
      }
      const family = cleanFontName(typeface.family || typeface.fullname || typeface._name);
      const fullName = cleanFontName(typeface.fullname || typeface._name || family);
      if (!family && !fullName) {
        continue;
      }
      if (!isPublicFontName(family) || !isPublicFontName(fullName)) {
        continue;
      }
      faces.push({
        family,
        fullName,
        postscriptName: cleanFontName(typeface._name),
        style: String(typeface.style || "").trim(),
        path: String(item.path || "").trim()
      });
    }
  }

  const unique = new Map();
  for (const face of faces) {
    const key = [face.family, face.fullName, face.postscriptName].join("\u0000").toLocaleLowerCase();
    if (!unique.has(key)) {
      unique.set(key, face);
    }
  }
  return Array.from(unique.values()).sort((left, right) =>
    compareFontNames(`${left.family} ${left.style}`, `${right.family} ${right.style}`)
  );
}

function fallbackFontFaces() {
  const directories =
    os.platform() === "win32"
      ? [path.join(process.env.WINDIR || "C:\\Windows", "Fonts")]
      : [path.join(os.homedir(), "Library", "Fonts"), "/Library/Fonts", "/System/Library/Fonts", "/usr/share/fonts"];
  const faces = [];
  const extensions = new Set([".ttf", ".otf", ".ttc"]);
  for (const directory of directories) {
    if (!fs.existsSync(directory)) {
      continue;
    }
    let files = [];
    try {
      files = fs.readdirSync(directory);
    } catch (error) {
      continue;
    }
    for (const fileName of files) {
      if (!extensions.has(path.extname(fileName).toLowerCase())) {
        continue;
      }
      const postscriptName = path.basename(fileName, path.extname(fileName)).trim();
      const family = postscriptName.replace(/[-_]+/g, " ").trim();
      if (family) {
        faces.push({ family, fullName: family, postscriptName, style: "", path: path.join(directory, fileName) });
      }
    }
  }
  return faces;
}

function bundledFontFaces() {
  const directory = path.join(ROOT, "fonts");
  if (!fs.existsSync(directory)) {
    return [];
  }
  const extensions = new Set([".ttf", ".otf", ".ttc"]);
  return fs.readdirSync(directory)
    .filter((fileName) => extensions.has(path.extname(fileName).toLowerCase()))
    .map((fileName) => {
      const postscriptName = path.basename(fileName, path.extname(fileName)).trim();
      const family = postscriptName.replace(/[-_](Black|Bold|Medium|Regular)$/i, "").replace(/[-_]+/g, " ").trim();
      return {
        family: family || postscriptName,
        fullName: postscriptName.replace(/[-_]+/g, " ").trim(),
        postscriptName,
        style: postscriptName.slice((family || postscriptName).length).replace(/^[-_\s]+/, ""),
        path: path.join(directory, fileName),
        bundled: true
      };
    });
}

function compareFontNames(left, right) {
  return String(left || "").localeCompare(String(right || ""), undefined, { sensitivity: "base", numeric: true });
}

function cleanFontName(value) {
  return String(value || "")
    .replace(/[\u202a-\u202e\u2066-\u2069]/g, "")
    .trim();
}

function isPublicFontName(value) {
  const name = cleanFontName(value);
  return Boolean(name) && name.charAt(0) !== "." && name.charAt(0) !== "_";
}

function readJson(req, maxBytes = MAX_JSON_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let byteCount = 0;
    let settled = false;

    const declaredLength = Number(req.headers && req.headers["content-length"]);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      settled = true;
      reject(httpError(413, "REQUEST_TOO_LARGE", "İstek gövdesi izin verilen boyutu aşıyor."));
      req.resume();
      return;
    }

    req.on("data", (chunk) => {
      if (settled) {
        return;
      }
      byteCount += chunk.length;
      if (byteCount > maxBytes) {
        settled = true;
        reject(httpError(413, "REQUEST_TOO_LARGE", "İstek gövdesi izin verilen boyutu aşıyor."));
        return;
      }
      raw += chunk.toString();
    });
    req.on("end", () => {
      if (settled) {
        return;
      }
      try {
        settled = true;
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        settled = true;
        reject(httpError(400, "INVALID_JSON", "İstek gövdesi geçerli JSON değil."));
      }
    });
    req.on("error", (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
  });
}

function httpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function sendJson(res, status, payload, onFinish) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  if (onFinish) {
    res.on("finish", onFinish);
  }
  res.end(JSON.stringify(payload));
}

function setCors(req, res) {
  const origin = String((req.headers && req.headers.origin) || "");
  const allowed =
    !origin ||
    origin === "null" ||
    /^file:\/\//i.test(origin) ||
    /^cep-html-engine:\/\//i.test(origin) ||
    /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(origin);
  if (!allowed) {
    return false;
  }
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return true;
}

function normalizeLanguage(language) {
  const code = String(language || "auto").trim().toLowerCase();
  const supported = new Set([
    "auto",
    "af",
    "am",
    "ar",
    "as",
    "az",
    "ba",
    "be",
    "bg",
    "bn",
    "bo",
    "br",
    "bs",
    "ca",
    "cs",
    "cy",
    "da",
    "de",
    "el",
    "en",
    "es",
    "et",
    "eu",
    "fa",
    "fi",
    "fo",
    "fr",
    "gl",
    "gu",
    "ha",
    "haw",
    "he",
    "hi",
    "hr",
    "ht",
    "hu",
    "hy",
    "id",
    "is",
    "it",
    "ja",
    "jw",
    "ka",
    "kk",
    "km",
    "kn",
    "ko",
    "la",
    "lb",
    "ln",
    "lo",
    "lt",
    "lv",
    "mg",
    "mi",
    "mk",
    "ml",
    "mn",
    "mr",
    "ms",
    "mt",
    "my",
    "ne",
    "nl",
    "nn",
    "no",
    "oc",
    "pa",
    "pl",
    "ps",
    "pt",
    "ro",
    "ru",
    "sa",
    "sd",
    "si",
    "sk",
    "sl",
    "sn",
    "so",
    "sq",
    "sr",
    "su",
    "sv",
    "sw",
    "ta",
    "te",
    "tg",
    "th",
    "tk",
    "tl",
    "tr",
    "tt",
    "uk",
    "ur",
    "uz",
    "vi",
    "yi",
    "yo",
    "zh"
  ]);
  if (supported.has(code)) {
    return code;
  }
  return "auto";
}

function normalizeTask(task) {
  return String(task || "transcribe").trim().toLowerCase() === "translate" ? "translate" : "transcribe";
}

function parseSrt(input) {
  return String(input || "")
    .replace(/\r/g, "")
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n");
      const timeLine = lines.find((line) => line.includes("-->")) || "";
      const timeLineIndex = lines.indexOf(timeLine);
      const parts = timeLine.split("-->");
      return {
        start: parseTimestamp((parts[0] || "").trim()),
        end: parseTimestamp((parts[1] || "").trim()),
        text: lines.slice(timeLineIndex + 1).join(" ").trim(),
        translation: ""
      };
    })
    .filter((caption) => Number.isFinite(caption.start) && Number.isFinite(caption.end) && caption.text);
}

function parseTimestamp(value) {
  const match = value.match(/(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/);
  if (!match) {
    return Number.NaN;
  }
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4].padEnd(3, "0")) / 1000;
}

module.exports = {
  buildAudioExtractionArgs,
  buildAss,
  buildKaraokeAss,
  buildWatermarkAss,
  buildOverlayFilterGraph,
  chunkTranslationTexts,
  describeFfmpegFailure,
  formatSrtCaptions,
  mergeTranscriptionResults,
  normalizeFileSystemPath,
  normalizeTranscribedCaptions,
  normalizeTranscriptText,
  normalizeTranscriptionClips,
  extractMacFontFaces,
  listSystemFonts,
  parseSrt,
  parseWhisperWords,
  resolveAssFontFamily,
  resolveAssFontStyle,
  resolveOverlayRenderSize,
  server
};
