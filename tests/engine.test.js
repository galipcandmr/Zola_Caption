"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  buildAudioExtractionArgs,
  buildAss,
  buildKaraokeAss,
  buildOverlayFilterGraph,
  buildWatermarkAss,
  chunkTranslationTexts,
  describeFfmpegFailure,
  extractMacFontFaces,
  formatSrtCaptions,
  mergeTranscriptionResults,
  normalizeFileSystemPath,
  normalizeTranscribedCaptions,
  normalizeTranscriptText,
  normalizeTranscriptionClips,
  parseSrt,
  parseWhisperWords,
  resolveAssFontFamily,
  resolveAssFontStyle,
  resolveOverlayRenderSize
} = require("../outputs/capiton-local-engine/server");

const root = path.join(__dirname, "..");

test("timeline audio clips are normalized and sorted before transcription", () => {
  const clips = normalizeTranscriptionClips([
    {
      clipIndex: 1,
      mediaPath: "/video.mov",
      timelineStartSeconds: 60,
      timelineEndSeconds: 120,
      sourceInSeconds: 60,
      sourceOutSeconds: 120
    },
    {
      clipIndex: 0,
      mediaPath: "/video.mov",
      timelineStartSeconds: 0,
      timelineEndSeconds: 60,
      sourceInSeconds: 0,
      sourceOutSeconds: 60
    }
  ]);

  assert.deepEqual(clips.map((clip) => clip.clipIndex), [0, 1]);
});

test("multiple transcription results preserve timeline offsets and gaps", () => {
  const merged = mergeTranscriptionResults(
    [
      {
        clip: { timelineStartSeconds: 10 },
        result: {
          ok: true,
          language: "tr",
          task: "transcribe",
          outputLanguage: "source",
          detectedLanguage: "tr",
          captions: [{ start: 0, end: 2, text: "Birinci" }],
          words: [{ start: 0.1, end: 0.5, text: "Birinci" }],
          files: { srtPath: "first.srt" }
        }
      },
      {
        clip: { timelineStartSeconds: 75 },
        result: {
          ok: true,
          language: "tr",
          task: "transcribe",
          outputLanguage: "source",
          captions: [{ start: 0, end: 3, text: "İkinci" }],
          words: [{ start: 0.2, end: 0.8, text: "İkinci" }],
          files: { srtPath: "second.srt" }
        }
      }
    ],
    10
  );

  assert.equal(merged.sourceClipCount, 2);
  assert.deepEqual(
    merged.captions.map((caption) => [caption.start, caption.end, caption.text]),
    [
      [0, 2, "Birinci"],
      [65, 68, "İkinci"]
    ]
  );
  assert.deepEqual(merged.words.map((word) => word.start), [0.1, 65.2]);
  assert.match(formatSrtCaptions(merged.captions), /00:01:05,000 --> 00:01:08,000/);
});

test("FFmpeg audio extraction retries with tolerant decoding and keeps timeline trim", () => {
  const primary = buildAudioExtractionArgs("/Volumes/Media/video.mp4", 12.5, 8, "/tmp/audio.wav", false);
  const fallback = buildAudioExtractionArgs("/Volumes/Media/video.mp4", 12.5, 8, "/tmp/audio.wav", true);

  assert.ok(primary.indexOf("-ss") < primary.indexOf("-i"));
  assert.ok(fallback.indexOf("-ss") > fallback.indexOf("-i"));
  assert.deepEqual(primary.slice(primary.indexOf("-map"), primary.indexOf("-map") + 2), ["-map", "0:a:0"]);
  assert.ok(fallback.includes("+genpts+discardcorrupt"));
  assert.ok(fallback.includes("ignore_err"));
  assert.ok(!fallback.includes("highpass=f=70,lowpass=f=7600,dynaudnorm=f=250:g=15:p=0.9"));
});

test("FFmpeg failures lead with an actionable Turkish reason instead of the version banner", () => {
  const error = new Error("ffmpeg failed");
  error.stderr = "ffmpeg version 7.1 Copyright\n[in#0] Error opening input: Operation not permitted\n";
  const message = describeFfmpegFailure(error, "/Users/test/Desktop/video.mp4");

  assert.match(message, /^Video dosyasına erişim izni yok\./);
  assert.match(message, /Operation not permitted/);
  assert.doesNotMatch(message, /ffmpeg version 7\.1/);
});

test("translation texts are batched by item count without losing order", () => {
  const texts = Array.from({ length: 205 }, (_, index) => `caption-${index}`);
  const batches = chunkTranslationTexts(texts, 100, 100000);

  assert.deepEqual(batches.map((batch) => batch.length), [100, 100, 5]);
  assert.deepEqual(batches.flat(), texts);
});

test("translation texts are batched by character count", () => {
  const batches = chunkTranslationTexts(["12345", "67890", "abc", "def"], 100, 10);
  assert.deepEqual(batches, [["12345", "67890"], ["abc", "def"]]);
});

test("SRT parser accepts comma and dot millisecond separators", () => {
  const captions = parseSrt(
    "1\n00:00:01,250 --> 00:00:02.500\nMerhaba dünya\n\n2\n00:00:03,000 --> 00:00:04,125\nİkinci satır"
  );

  assert.equal(captions.length, 2);
  assert.equal(captions[0].start, 1.25);
  assert.equal(captions[0].end, 2.5);
  assert.equal(captions[1].text, "İkinci satır");
});

test("Turkish transcript cleanup preserves Turkish casing and canonical brand names", () => {
  assert.equal(
    normalizeTranscriptText("zola,cutback ve premiere pro ile esrarengiz bir olay", "tr"),
    "Zola, Cutback ve Premiere Pro ile Esrarengiz Bir Olay"
  );
  assert.equal(normalizeTranscriptText("ışın dental. çamlıca", "tr"), "ışın dental. Çamlıca");
  assert.equal(
    normalizeTranscriptText("1999 mahmara deprimi sırasında ulu camii'de", "tr"),
    "1999 Marmara depremi sırasında Ulu Cami'de"
  );
  assert.deepEqual(
    normalizeTranscribedCaptions([
      { start: 0, end: 1, text: "bursa'da şiddetli" },
      { start: 1, end: 2, text: "şekilde sarsıldı." },
      { start: 2, end: 3, text: "o gece ulu camii'de" }
    ], "tr").map((caption) => caption.text),
    ["Bursa'da şiddetli", "şekilde sarsıldı.", "O gece Ulu Cami'de"]
  );
});

test("file URI extension paths are decoded before update installation", () => {
  assert.equal(
    normalizeFileSystemPath("file:///Users/Test/Library/Application%20Support/Adobe/CEP"),
    "/Users/Test/Library/Application Support/Adobe/CEP"
  );
});

test("zero-duration whisper tokens receive a usable duration", () => {
  const words = parseWhisperWords({
    transcription: [
      {
        tokens: [
          { text: " Merhaba", timestamps: { from: "00:00:01.000", to: "00:00:01.000" } }
        ]
      }
    ]
  });

  assert.equal(words.length, 1);
  assert.ok(words[0].end > words[0].start);
});

test("karaoke ASS keeps active-word events chronological and non-empty", () => {
  const ass = buildKaraokeAss(
    [
      {
        start: 0,
        end: 1,
        words: [
          { text: "Merhaba", start: 0, end: 0.4 },
          { text: "dünya", start: 0.4, end: 0.9 }
        ]
      }
    ],
    { primaryColor: "#ffffff", accentColor: "#fff200", animation: "karaoke" },
    1080,
    1920
  );
  const dialogueLines = ass.split("\n").filter((line) => line.startsWith("Dialogue:"));

  assert.equal(dialogueLines.length, 2);
  assert.match(dialogueLines[0], /Merhaba.*dünya/);
  assert.match(dialogueLines[1], /Merhaba.*dünya/);
});

test("macOS font inventory exposes valid unique family and face names", () => {
  const faces = extractMacFontFaces({
    SPFontsDataType: [
      {
        enabled: "yes",
        valid: "yes",
        path: "/Library/Fonts/Example-Bold.ttf",
        typefaces: [
          {
            _name: "Example-Bold",
            family: "Example",
            fullname: "Example Bold",
            style: "Bold",
            enabled: "yes",
            valid: "yes",
            duplicate: "no"
          },
          {
            _name: "Example-Bold",
            family: "Example",
            fullname: "Example Bold",
            style: "Bold",
            enabled: "yes",
            valid: "yes",
            duplicate: "no"
          }
        ]
      },
      {
        enabled: "no",
        valid: "yes",
        typefaces: [{ family: "Disabled" }]
      }
    ]
  });

  assert.deepEqual(faces, [
    {
      family: "Example",
      fullName: "Example Bold",
      postscriptName: "Example-Bold",
      style: "Bold",
      path: "/Library/Fonts/Example-Bold.ttf"
    }
  ]);
});

test("bundled font file names resolve to the family names libass actually uses", () => {
  assert.equal(resolveAssFontFamily("ZillaSlab-Regular"), "Zilla Slab");
  assert.equal(resolveAssFontFamily("Montserrat-Black"), "Montserrat");
  assert.equal(resolveAssFontFamily("Arboria-Bold"), "Arboria");
  assert.equal(resolveAssFontFamily("Unbounded-Medium"), "Unbounded");
  assert.equal(resolveAssFontFamily("Example Bold"), "Example Bold");
});

test("Zilla Slab numeric weights select real bundled faces", () => {
  assert.deepEqual(resolveAssFontStyle("ZillaSlab-Regular", 400, false), {
    family: "Zilla Slab", bold: 0, italic: 0
  });
  assert.deepEqual(resolveAssFontStyle("ZillaSlab-Regular", 500, false), {
    family: "Zilla Slab Medium", bold: 0, italic: 0
  });
  assert.deepEqual(resolveAssFontStyle("ZillaSlab-Regular", 600, true), {
    family: "Zilla Slab SemiBold", bold: 0, italic: 1
  });
  assert.deepEqual(resolveAssFontStyle("ZillaSlab-Regular", 900, false), {
    family: "Zilla Slab", bold: 1, italic: 0
  });

  ["Light", "Medium", "SemiBold", "Bold"].forEach((face) => {
    assert.ok(fs.existsSync(path.join(root, "outputs", "capiton-local-engine", "fonts", `ZillaSlab-${face}.ttf`)));
  });
});

test("Esrarengiz watermark is rendered directly below the caption as its own transparent asset", () => {
  const ass = buildWatermarkAss(
    {
      fontSize: 56,
      scale: 1,
      positionX: 0,
      positionY: 66.25,
      templateReferenceWidth: 720,
      templateReferenceHeight: 1280
    },
    720,
    1280
  );

  assert.match(ass, /Style: Watermark,Zilla Slab,24,/);
  assert.match(ass, /\\an8\\pos\(360,855\)\}@esrarengizbiolay/);
  assert.doesNotMatch(ass, /Outline,[1-9]/);
});

test("advanced caption typography is emitted into ASS styles and dialogue tags", () => {
  const ass = buildAss(
    [{ start: 0, end: 2, text: "Gelişmiş yazı" }],
    {
      fontFamily: "Example Bold",
      fontSize: 64,
      fontWeight: 700,
      italicEnabled: true,
      underlineEnabled: true,
      letterSpacing: 3.5,
      strokeWidth: 7,
      shadowEnabled: true,
      shadowDistance: 6,
      shadowDirection: 90,
      shadowBlur: 4,
      animation: "none"
    },
    1080,
    1920
  );

  assert.match(ass, /Style: Capiton,Example Bold,64,[^\n]+,1,1,1,0,100,100,3\.5,/);
  assert.match(ass, /\\xshad0\\yshad6\\blur4/);
});

test("caption pixel controls scale proportionally with the active sequence size", () => {
  const ass = buildAss(
    [{ start: 0, end: 2, text: "Ölçek testi" }],
    {
      fontFamily: "Inter",
      fontSize: 56,
      strokeWidth: 6,
      animation: "none"
    },
    720,
    1280
  );

  assert.match(ass, /PlayResX: 720/);
  assert.match(ass, /PlayResY: 1280/);
  assert.match(ass, /Style: Capiton,Inter,37,/);
});

test("imported Cutback reference size, opacity, blur and past-word color reach ASS", () => {
  const ass = buildAss(
    [{
      start: 0,
      end: 2,
      words: [
        { text: "Bir", start: 0, end: 0.5 },
        { text: "iki", start: 0.5, end: 1 },
        { text: "üç", start: 1, end: 1.5 }
      ]
    }],
    {
      fontFamily: "ZillaSlab-Regular",
      fontSize: 84,
      scale: 1,
      templateReferenceWidth: 1280,
      templateReferenceHeight: 720,
      primaryColor: "#454545",
      accentColor: "#ffffff",
      pastTextEnabled: true,
      pastTextColor: "#ffffff",
      strokeColor: "#000000",
      strokeOpacity: 50,
      strokeWidth: 3,
      shadowEnabled: true,
      shadowOpacity: 70,
      shadowDirection: 540,
      shadowDistance: 18,
      shadowBlur: 90,
      animation: "none",
      karaokeCaptions: [{
        start: 0,
        end: 2,
        words: [
          { text: "Bir", start: 0, end: 0.5 },
          { text: "iki", start: 0.5, end: 1 },
          { text: "üç", start: 1, end: 1.5 }
        ]
      }]
    },
    1280,
    720
  );

  assert.match(ass, /Style: Capiton,Zilla Slab,84,/);
  assert.match(ass, /&H80000000/);
  assert.match(ass, /\\xshad-18\\yshad0\\blur90/);
  assert.match(ass, /\{\\c&Hffffff&\}Bir.*\{\\c&Hffffff&\}iki/);
});

test("Cutback segment boxes use the imported box color instead of the text outline color", () => {
  const ass = buildAss(
    [{ start: 0, end: 2, text: "Yeşil kutu" }],
    {
      fontFamily: "Unbounded-Medium",
      fontSize: 50,
      primaryColor: "#454545",
      strokeColor: "#000000",
      boxEnabled: true,
      boxColor: "#95c125",
      boxOpacity: 100,
      boxPadding: 15,
      animation: "none"
    },
    1080,
    1920
  );

  assert.match(ass, /Style: Capiton,Unbounded,50,&H00454545,&H00454545,&H0025c195,&H0025c195,[^\n]+,3,15,/);
});

test("low-resolution overlays are supersampled and rendered directly into alpha", () => {
  const renderSize = resolveOverlayRenderSize(540, 960);
  const filterGraph = buildOverlayFilterGraph("/tmp/caption.ass", 540, 960, renderSize);

  assert.deepEqual(renderSize, { width: 1080, height: 1920, factor: 2 });
  assert.match(filterGraph, /ass=.*:alpha=1/);
  assert.match(filterGraph, /scale=540:960:flags=lanczos\+accurate_rnd/);
  assert.doesNotMatch(filterGraph, /colorkey/);
});

test("full-HD overlays avoid unnecessary supersampling", () => {
  assert.deepEqual(resolveOverlayRenderSize(1080, 1920), {
    width: 1080,
    height: 1920,
    factor: 1
  });
});
