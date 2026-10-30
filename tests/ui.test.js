"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(
  path.join(root, "outputs", "capiton-premiere-cep-plugin", "index.html"),
  "utf8"
);
const appSource = fs.readFileSync(
  path.join(root, "outputs", "capiton-premiere-cep-plugin", "src", "cep-app.js"),
  "utf8"
);
const styles = fs.readFileSync(
  path.join(root, "outputs", "capiton-premiere-cep-plugin", "styles.css"),
  "utf8"
);
const manifest = fs.readFileSync(
  path.join(root, "outputs", "capiton-premiere-cep-plugin", "CSXS", "manifest.xml"),
  "utf8"
);

test("Turkish social captions default to three words on one line", () => {
  assert.match(appSource, /wordsPerScreen:\s*3/);
  assert.match(html, /id="wordsPerScreenInput"[^>]*value="3"/);
  assert.match(html, /id="multiLineInput"\s+type="checkbox"/);
  assert.doesNotMatch(html, /id="multiLineInput"[^>]*checked/);
});

test("caption editor exposes Cutback-equivalent typography controls", () => {
  [
    "fontPickerTrigger",
    "fontWeightInput",
    "italicEnabledInput",
    "underlineEnabledInput",
    "letterSpacingInput",
    "boxColorInput",
    "boxOpacityInput",
    "boxPaddingInput",
    "shadowColorInput",
    "shadowOpacityInput",
    "shadowDistanceInput",
    "shadowBlurInput",
    "shadowDirectionInput"
  ].forEach((id) => assert.match(html, new RegExp(`id="${id}"`), `${id} should exist`));
});

test("Esrarengiz templates enable a removable separate watermark layer by default", () => {
  assert.match(html, /id="watermarkSettingsRow"/);
  assert.match(html, /id="watermarkEnabledInput"[^>]*checked/);
  assert.match(appSource, /capitonImportWatermarkFile/);
  assert.match(appSource, /capitonRemoveWatermarkLayers/);
  assert.match(appSource, /watermarkEnabled:\s*true/);
  assert.match(styles, /#previewWatermark[\s\S]*opacity:\s*0\.2/);
});

test("Premiere permission bridge stages protected media before retrying transcription", () => {
  assert.match(manifest, /<Parameter>--enable-nodejs<\/Parameter>/);
  assert.match(manifest, /<Parameter>--mixed-context<\/Parameter>/);
  assert.match(appSource, /function callTranscriptionEngine\(/);
  assert.match(appSource, /function stageAudioThroughPremiere\(/);
  assert.match(appSource, /premiere-audio-/);
  assert.match(appSource, /retryPayload\.mediaPath = stageResult\.clips\[0\]\.mediaPath/);
});

test("caption editor follows the compact Cutback-style workflow", () => {
  ["Şablon", "Genel", "Altyazı", "Stil", "Animasyon"].forEach((label) => {
    assert.match(html, new RegExp(`data-style-tab="[^"]+">${label}<`));
  });
  assert.match(html, /id="applyBtn"[^>]*>[^<]*<span[^>]*>⌁<\/span> Timeline<\/button>/);
  assert.match(html, /id="reapplyBtn"[^>]*>Zaman çizelgesine uygula<\/button>/);
  assert.match(styles, /Cutback-inspired compact workflow/);
  assert.match(styles, /\.engine-card\s*\{\s*display:\s*none;/s);
  assert.match(styles, /\.drawer-head\s*\{\s*display:\s*none;/s);
});

test("style preview only wraps captions when multi-line mode is enabled", () => {
  assert.match(appSource, /var line1 = words\.join\(" "\);\s*var line2 = "";\s*if \(preset\.multiLine && words\.length > 1\)/s);
  assert.match(appSource, /font-family:" \+ fontFamilyCss\(preset\.fontFamily \|\| "Inter"\)/);
});

test("very narrow Premiere panels keep the style drawer reachable", () => {
  const narrowFix = styles.lastIndexOf("Keep every caption and style control reachable");
  const hiddenDrawer = styles.lastIndexOf(".animated-drawer {\n    display: none;");
  assert.ok(narrowFix > hiddenDrawer, "the narrow layout override must follow the legacy hide rule");
  assert.match(styles.slice(narrowFix), /\.animated-drawer\s*\{[^}]*display:\s*grid;/s);
  assert.match(styles.slice(narrowFix), /\.edit-screen\s*\{[^}]*overflow-y:\s*auto;/s);
});

test("panel sends no more than three words per karaoke caption", () => {
  const instrumentedSource = appSource.replace(
    /\}\)\(\);\s*$/,
    "window.__zolaTest={state:state,setElements:function(value){els=value;},buildKaraokeOverlayCaptions:buildKaraokeOverlayCaptions,buildCaptioneerPresets:buildCaptioneerPresets};})();"
  );
  const sandbox = {
    window: {},
    document: { addEventListener() {} },
    localStorage: { getItem() { return null; }, setItem() {} },
    crypto: { randomUUID() { return "test-id"; } },
    console,
    setTimeout,
    clearTimeout,
    XMLHttpRequest: function XMLHttpRequest() {}
  };
  vm.createContext(sandbox);
  vm.runInContext(instrumentedSource, sandbox);

  const api = sandbox.window.__zolaTest;
  api.state.wordsPerScreen = 3;
  api.state.latestClipDurationSeconds = 10;
  api.state.preset.fontSize = 58;
  api.state.preset.strokeWidth = 5;
  api.state.preset.scale = 1;
  api.setElements({
    breakPeriodInput: { checked: false },
    breakCommaInput: { checked: false },
    breakQuestionInput: { checked: true },
    breakExclamationInput: { checked: false }
  });

  const text = "Merhaba Dünya. Bu, Zola alt yazı uygulamasının gerçek uçtan uca testidir.";
  const words = text.split(" ").map((word, index) => ({
    text: word,
    start: index * 0.4,
    end: index * 0.4 + 0.35
  }));
  api.state.captions = [{ start: 0, end: words.at(-1).end, text, words }];

  const result = api.buildKaraokeOverlayCaptions();
  assert.deepEqual(Array.from(result, (caption) => caption.words.length), [3, 3, 2, 3]);
  assert.ok(result.every((caption) => caption.text.split(/\s+/).length <= 3));
  assert.ok(result.every((caption) => caption.end > caption.start));
});

test("Turkish editor groups words across Whisper boundaries without breaking meaning", () => {
  const instrumentedSource = appSource.replace(
    /\}\)\(\);\s*$/,
    "window.__zolaTest={state:state,splitCaptionsForEditor:splitCaptionsForEditor};})();"
  );
  const sandbox = {
    window: {},
    document: { addEventListener() {} },
    localStorage: { getItem() { return null; }, setItem() {} },
    crypto: { randomUUID() { return `test-${Math.random()}`; } },
    console,
    setTimeout,
    clearTimeout,
    XMLHttpRequest: function XMLHttpRequest() {}
  };
  vm.createContext(sandbox);
  vm.runInContext(instrumentedSource, sandbox);

  const api = sandbox.window.__zolaTest;
  const text = "Bursa'da deprem gecesi 7 kişi ortaya çıktı. 1999 Marmara Depremi sırasında, Bursa'da şiddetli şekilde sarsıldı. O gece, Ulu Cami'de bulunduğu söylenen bazı görevlilere göre deprem sırasında içeride tuhaf bir şey yaşandı.";
  const words = text.split(/\s+/).map((word, index) => ({
    text: word,
    start: index * 0.5,
    end: index * 0.5 + 0.45
  }));
  api.state.wordsPerScreen = 3;
  api.state.latestWords = words;

  const result = api.splitCaptionsForEditor([
    { start: 0, end: words.at(-1).end, text }
  ]);

  assert.deepEqual(Array.from(result, (caption) => caption.text), [
    "Bursa'da deprem",
    "gecesi 7 kişi",
    "ortaya çıktı.",
    "1999 Marmara Depremi",
    "sırasında, Bursa'da",
    "şiddetli şekilde sarsıldı.",
    "O gece,",
    "Ulu Cami'de",
    "bulunduğu söylenen bazı",
    "görevlilere göre deprem",
    "sırasında içeride tuhaf",
    "bir şey yaşandı."
  ]);
});

test("all personal Cutback caption templates retain their exact imported styles", () => {
  const instrumentedSource = appSource.replace(
    /\}\)\(\);\s*$/,
    "window.__zolaTest={buildCaptioneerPresets:buildCaptioneerPresets};})();"
  );
  const sandbox = {
    window: {},
    document: { addEventListener() {} },
    localStorage: { getItem() { return null; }, setItem() {} },
    crypto: { randomUUID() { return "test-id"; } },
    console,
    setTimeout,
    clearTimeout,
    XMLHttpRequest: function XMLHttpRequest() {}
  };
  vm.createContext(sandbox);
  vm.runInContext(instrumentedSource, sandbox);

  const templates = sandbox.window.__zolaTest.buildCaptioneerPresets();
  assert.equal(templates.length, 17);
  assert.deepEqual(Array.from(templates, (preset) => preset.name), [
    "Uncali Testimonial", "Duygu Aksoy", "ışın dental", "thera", "RE/MAX", "mahru", "syk", "feta",
    "nfs", "myimp", "demo", "esrarengizbiolay", "esrarengiz", "MONARCH", "çamlicas", "oslodent", "Esrarengizbiolay"
  ]);

  const uncali = templates[0];
  assert.equal(uncali.fontFamily, "Montserrat-Black");
  assert.equal(uncali.fontSize, 57);
  assert.equal(uncali.accentColor, "#00cbd9");
  assert.equal(uncali.templateReferenceWidth, 1280);
  assert.equal(uncali.templateReferenceHeight, 720);

  const duygu = templates[1];
  assert.equal(duygu.positionY, 93.33333333333334);
  assert.equal(duygu.accentColor, "#ffcc5d");

  const camlicas = templates[14];
  assert.equal(camlicas.fontFamily, "Unbounded-Medium");
  assert.equal(camlicas.strokeWidth, 0);
  assert.equal(camlicas.boxColor, "#95c125");
  assert.equal(camlicas.boxPadding, 15);
  assert.equal(camlicas.pastTextEnabled, true);
  assert.equal(camlicas.pastTextColor, "#ffffff");

  const monarch = templates[13];
  assert.equal(monarch.strokeOpacity, 50);
  assert.equal(monarch.shadowOpacity, 70);
  assert.equal(monarch.shadowDirection, 180);
  assert.equal(monarch.shadowBlur, 90);

  const newestEsrarengiz = templates[16];
  assert.equal(templates[11].watermarkEnabled, true);
  assert.equal(newestEsrarengiz.templateReferenceWidth, 720);
  assert.equal(newestEsrarengiz.templateReferenceHeight, 1280);
  assert.equal(newestEsrarengiz.fontFamily, "ZillaSlab-Regular");
  assert.equal(newestEsrarengiz.fontSize, 56);
  assert.equal(newestEsrarengiz.strokeWidth, 2);
  assert.equal(newestEsrarengiz.shadowDistance, 12);
  assert.equal(newestEsrarengiz.shadowBlur, 60);
  assert.equal(newestEsrarengiz.positionY, 66.25);
  assert.equal(newestEsrarengiz.watermarkEnabled, true);
});
