#!/usr/bin/env node
"use strict";

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const ROOT = __dirname;
const PORT = Number(process.env.CAPITON_ENGINE_PORT || 17771);
const WORK_DIR = path.join(ROOT, "work");
const DEFAULT_MODEL = path.join(ROOT, "models", "ggml-small.bin");
loadEnvFile(path.join(ROOT, ".env"));
const GOOGLE_TRANSLATE_API_KEY =
  process.env.CAPITON_GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY || "";

fs.mkdirSync(WORK_DIR, { recursive: true });

const server = http.createServer(async (req, res) => {
  setCors(res);

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
        modelExists: fs.existsSync(DEFAULT_MODEL),
        modelPath: DEFAULT_MODEL,
        googleTranslateConfigured: Boolean(GOOGLE_TRANSLATE_API_KEY)
      });
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

    if (req.method === "POST" && req.url === "/install-update") {
      const body = await readJson(req);
      const result = await installUpdatePackage(body);
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    sendJson(res, 404, { ok: false, message: "Endpoint bulunamadı." });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: error.message || String(error) });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Zola Caption Local Engine listening on http://127.0.0.1:${PORT}`);
});

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

async function transcribe(body) {
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

  if (path.extname(mediaPath).toLowerCase() === ".wav" && trimStartSeconds === 0 && trimDurationSeconds === 0) {
    fs.copyFileSync(mediaPath, audioPath);
  } else {
    if (ffmpeg) {
      const ffmpegArgs = ["-y", "-i", mediaPath];
      if (trimStartSeconds > 0) {
        ffmpegArgs.push("-ss", String(trimStartSeconds));
      }
      if (trimDurationSeconds > 0) {
        ffmpegArgs.push("-t", String(trimDurationSeconds));
      }
      ffmpegArgs.push("-vn", "-ac", "1", "-ar", "16000", audioPath);
      await run(ffmpeg, ffmpegArgs);
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
    "56"
  ];
  args.push("-l", language);
  if (task === "translate") {
    args.push("-tr");
  }
  const prompt = initialPrompt(language, task);
  if (prompt) {
    args.push("--prompt", prompt);
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
  return {
    ok: true,
    language,
    detectedLanguage,
    task,
    outputLanguage: task === "translate" ? "en" : "source",
    trimStartSeconds,
    trimEndSeconds,
    srt,
    captions: parseSrt(srt),
    words,
    files: {
      audioPath,
      srtPath,
      jsonPath: fs.existsSync(jsonPath) ? jsonPath : ""
    }
  };
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

function translateWithGoogleCloud(texts, sourceLanguage, targetLanguage) {
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
  const extensionPath = String(info.extensionPath || "").trim();

  if (!downloadUrl || !/^https:\/\/github\.com\/galipcandmr\/Zola_Caption\/releases\/download\//.test(downloadUrl)) {
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
    await downloadFile(downloadUrl, zipPath);
    await unzipFile(zipPath, updateDir);

    const packageRoot = findUpdatePackageRoot(updateDir);
    const cepSource = path.join(packageRoot, "capiton-premiere-cep-plugin");
    const engineSource = path.join(packageRoot, "capiton-local-engine");

    if (!fs.existsSync(cepSource) || !fs.existsSync(engineSource)) {
      return {
        ok: false,
        code: "INVALID_UPDATE_PACKAGE",
        message: "Güncelleme paketi beklenen Zola Caption klasörlerini içermiyor."
      };
    }

    const cepTarget = extensionPath || defaultCepExtensionPath();
    const engineTarget = ROOT;
    copyDirectory(cepSource, cepTarget, {
      removeTarget: true,
      preserveNames: new Set()
    });
    copyDirectory(engineSource, engineTarget, {
      removeTarget: false,
      preserveNames: new Set([".env", "work"])
    });
    installLaunchAgent(engineTarget);

    return {
      ok: true,
      version,
      cepTarget,
      engineTarget,
      message:
        "Zola Caption güncellendi. Değişikliğin tamamen yansıması için Premiere Pro'yu kapatıp yeniden aç."
    };
  } catch (error) {
    return {
      ok: false,
      code: "UPDATE_INSTALL_FAILED",
      message: "Güncelleme yüklenemedi: " + (error.message || String(error))
    };
  }
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

function copyDirectory(source, target, options = {}) {
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
      copyDirectory(sourcePath, targetPath, { preserveNames });
    } else {
      fs.copyFileSync(sourcePath, targetPath);
      fs.chmodSync(targetPath, stat.mode);
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
  if (launchctl) {
    spawn(launchctl, ["bootout", `gui/${process.getuid()}`, plistPath], { stdio: "ignore" }).on("close", () => {
      spawn(launchctl, ["bootstrap", `gui/${process.getuid()}`, plistPath], { stdio: "ignore" });
    });
  }
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
        const to = secondsFromWhisperTime(timestamps.to, offsets.to, token.t1 ?? token.end ?? token.end_ms);
        if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
          continue;
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
  const duration = Math.max(1, safeSeconds(body && body.durationSeconds) || maxCaptionEnd(captions) + 0.5);
  const jobId = `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
  const assPath = path.join(WORK_DIR, `${jobId}.ass`);
  const requestedOverlayPath = resolveOverlayOutputPath(body && body.outputPath);
  const overlayPath = requestedOverlayPath || path.join(WORK_DIR, `${jobId}-capiton-overlay.mov`);
  const renderPath = requestedOverlayPath ? path.join(WORK_DIR, `${jobId}-capiton-overlay-tmp.mov`) : overlayPath;

  fs.writeFileSync(assPath, buildAss(captions, preset, width, height), "utf8");
  const keyColor = "0x123456";

  await run(ffmpeg, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=${keyColor}:s=${width}x${height}:d=${duration}:r=30`,
    "-r",
    "30",
    "-vf",
    `ass=${escapeFfmpegFilterPath(assPath)},colorkey=${keyColor}:0.08:0.0,format=yuva444p10le`,
    "-an",
    "-c:v",
    "prores_ks",
    "-profile:v",
    "4444",
    "-alpha_bits",
    "16",
    "-vendor",
    "apl0",
    "-pix_fmt",
    "yuva444p10le",
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
    updatedExisting: !!requestedOverlayPath,
    message: requestedOverlayPath
      ? `Mevcut caption overlay güncellendi: ${overlayPath}`
      : `Stilli caption overlay üretildi: ${overlayPath}`
  };
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
    return "Bu bir Türkçe röportaj konuşmasıdır. İsimleri, ekleri ve doğal Türkçe cümleleri doğru yaz.";
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
  const outline = assColor(preset.strokeColor || "#000000", "00");
  const back = preset.boxEnabled
    ? assColor(preset.boxColor || "#000000", "00")
    : assColor(preset.shadowColor || "#000000", preset.shadowEnabled === false ? "FF" : "50");
  const font = sanitizeAssText(preset.fontFamily || "Arial");
  const scale = clampNumber(preset.scale, 1, 0.4, 3);
  const fontSize = Math.round(Number(preset.fontSize || Math.max(42, height * 0.052)) * scale);
  const outlineWidth = Number(preset.strokeWidth || 5);
  const marginV = Math.round(height * 0.13);
  const borderStyle = preset.boxEnabled ? 3 : 1;
  const shadowSize = preset.shadowEnabled === false ? 0 : 2;
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
    `Style: Capiton,${font},${fontSize},${primary},${primary},${outline},${back},1,0,0,0,100,100,0,0,${borderStyle},${outlineWidth},${shadowSize},2,80,80,${marginV},1`,
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
  const outline = assColor(preset.strokeColor || "#000000", "00");
  const back = preset.boxEnabled
    ? assColor(preset.boxColor || "#000000", "00")
    : assColor(preset.shadowColor || "#000000", preset.shadowEnabled === false ? "FF" : "50");
  const active = assInlineColor(readableActiveColor(preset.accentColor, preset.primaryColor));
  const normal = assInlineColor(preset.primaryColor || "#ffffff");
  const font = sanitizeAssText(preset.fontFamily || "Arial");
  const scale = clampNumber(preset.scale, 1, 0.4, 3);
  const fontSize = Math.round(Number(preset.fontSize || Math.max(42, height * 0.052)) * scale);
  const outlineWidth = clampNumber(preset.strokeWidth, 6, 0, 18);
  const letterSpacing = clampNumber(preset.letterSpacing, 1, 0, 12);
  const marginV = Math.round(height * 0.13);
  const borderStyle = preset.boxEnabled ? 3 : 1;
  const shadowSize = preset.shadowEnabled === false ? 0 : 3;
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
    `Style: Capiton,${font},${fontSize},${primary},${primary},${outline},${back},1,0,0,0,100,100,${letterSpacing},0,${borderStyle},${outlineWidth},${shadowSize},2,80,80,${marginV},1`,
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
          return wordIndex === index ? `{\\c${active}}${clean}{\\c${normal}}` : clean;
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

function captionDialogueTag(preset, width, height, options) {
  const animation = String(preset.animation || "pop");
  const x = Math.round(width / 2 + clampNumber(preset.positionX, 0, -width / 2, width / 2));
  const y = Math.round(height * (clampNumber(preset.positionY, 76, 5, 95) / 100));
  const travel = Math.round(height * 0.045);

  if (options && options.stable) {
    return `{\\an2\\pos(${x},${y})}`;
  }

  if (animation === "none") {
    return `{\\an2\\pos(${x},${y})}`;
  }

  if (animation === "fade") {
    return `{\\an2\\pos(${x},${y})\\fad(130,130)}`;
  }
  if (animation === "slide-up") {
    return `{\\an2\\move(${x},${y + travel},${x},${y},0,180)\\fad(70,120)}`;
  }
  if (animation === "pop" || animation === "karaoke") {
    return `{\\an2\\pos(${x},${y})\\fad(40,80)\\fscx92\\fscy92\\t(0,120,\\fscx108\\fscy108)\\t(120,220,\\fscx100\\fscy100)}`;
  }
  return `{\\an2\\pos(${x},${y})}`;
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

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${path.basename(command)} failed (${code}): ${stderr.slice(-2000)}`));
    });
  });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
