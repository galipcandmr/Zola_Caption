(function () {
  "use strict";

  var CURRENT_VERSION = "v0.5.33";

  var scenarios = [
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
      description: "Türkçe röportajı İngilizce altyazıya çevir.",
      sourceLang: "tr",
      targetLang: "en",
      bilingual: false
    }
  ];

  var presets = [
    {
      id: "floating-words",
      name: "Yüzen Kelimeler",
      badge: "Hazır",
      previewText: "Animasyonlu altyazı önizlemesi",
      description: "Yumuşak girişli beyaz sosyal medya altyazısı.",
      fontFamily: "Inter",
      primaryColor: "#ffffff",
      secondaryColor: "#ffffff",
      accentColor: "#5fdcff",
      strokeColor: "#000000",
      shadowColor: "#000000",
      boxColor: "#000000",
      strokeWidth: 5,
      fontSize: 58,
      animation: "slide-up",
      boxEnabled: false,
      shadowEnabled: true,
      positionX: 0,
      positionY: 76,
      scale: 1,
      letterCase: "as-typed"
    },
    {
      id: "flexi-bg",
      name: "Esnek Arka Plan",
      badge: "Hazır",
      previewText: "ANİMASYONLU ALTYAZI ÖNİZLEMESİ",
      description: "Turkuaz vurgulu blok hissi.",
      fontFamily: "Inter",
      primaryColor: "#4ff9e8",
      secondaryColor: "#ffffff",
      accentColor: "#5ef1e8",
      strokeColor: "#000000",
      shadowColor: "#000000",
      boxColor: "#101014",
      strokeWidth: 0,
      fontSize: 48,
      animation: "fade",
      boxEnabled: false,
      shadowEnabled: false,
      positionX: 0,
      positionY: 75,
      scale: 1,
      letterCase: "uppercase"
    },
    {
      id: "appear-white",
      name: "Sade Beyaz",
      badge: "Sade",
      previewText: "Önizleme",
      description: "Minimal beyaz, röportaj için sakin.",
      fontFamily: "Inter",
      primaryColor: "#ffffff",
      secondaryColor: "#ffffff",
      accentColor: "#ffffff",
      strokeColor: "#000000",
      shadowColor: "#000000",
      boxColor: "#000000",
      strokeWidth: 3,
      fontSize: 56,
      animation: "fade",
      boxEnabled: false,
      shadowEnabled: true,
      positionX: 0,
      positionY: 76,
      scale: 1,
      letterCase: "as-typed"
    },
    {
      id: "karaoke-1",
      name: "Karaoke 1",
      badge: "Karaoke",
      previewText: "Animasyonlu altyazı önizlemesi",
      description: "Beyaz kapsül içinde temiz karaoke.",
      fontFamily: "Inter",
      primaryColor: "#1b1b1b",
      secondaryColor: "#1b1b1b",
      accentColor: "#d6eeff",
      strokeColor: "#ffffff",
      shadowColor: "#000000",
      boxColor: "#ffffff",
      strokeWidth: 0,
      fontSize: 48,
      animation: "karaoke",
      boxEnabled: true,
      shadowEnabled: false,
      positionX: 0,
      positionY: 76,
      scale: 1,
      letterCase: "as-typed"
    },
    {
      id: "karaoke-2",
      name: "Karaoke 2",
      badge: "Karaoke",
      previewText: "ANİMASYONLU ALTYAZI ÖNİZLEMESİ",
      description: "Kırmızı sıcak vurgu, kısa videolar.",
      fontFamily: "Inter",
      primaryColor: "#ffffff",
      secondaryColor: "#ffffff",
      accentColor: "#ff533d",
      strokeColor: "#ff533d",
      shadowColor: "#000000",
      boxColor: "#000000",
      strokeWidth: 4,
      fontSize: 52,
      animation: "pop",
      boxEnabled: false,
      shadowEnabled: true,
      positionX: 0,
      positionY: 76,
      scale: 1,
      letterCase: "uppercase"
    },
    {
      id: "bumble-bee",
      name: "Sarı Vurgu",
      badge: "Viral",
      previewText: "Animasyonlu altyazı önizlemesi",
      description: "Sarı zemin, siyah yazı.",
      fontFamily: "Inter",
      primaryColor: "#000000",
      secondaryColor: "#000000",
      accentColor: "#ffed00",
      strokeColor: "#ffed00",
      shadowColor: "#000000",
      boxColor: "#ffed00",
      strokeWidth: 0,
      fontSize: 54,
      animation: "pop",
      boxEnabled: true,
      shadowEnabled: false,
      positionX: 0,
      positionY: 76,
      scale: 1,
      letterCase: "as-typed"
    },
    {
      id: "pill",
      name: "Beyaz Kapsül",
      badge: "Sade",
      previewText: "Animasyonlu altyazı önizlemesi",
      description: "Beyaz hap arka planlı altyazı.",
      fontFamily: "Inter",
      primaryColor: "#151515",
      secondaryColor: "#151515",
      accentColor: "#151515",
      strokeColor: "#ffffff",
      shadowColor: "#000000",
      boxColor: "#ffffff",
      strokeWidth: 0,
      fontSize: 46,
      animation: "fade",
      boxEnabled: true,
      shadowEnabled: false,
      positionX: 0,
      positionY: 76,
      scale: 1,
      letterCase: "as-typed"
    },
    {
      id: "highlight-yellow",
      name: "Sarı Kelime Vurgusu",
      badge: "Vurgu",
      previewText: "Animasyonlu altyazı önizlemesi",
      description: "Sarı aktif kelime vurgusu.",
      fontFamily: "Inter",
      primaryColor: "#ffffff",
      secondaryColor: "#ffffff",
      accentColor: "#fff200",
      strokeColor: "#000000",
      shadowColor: "#000000",
      boxColor: "#000000",
      strokeWidth: 5,
      fontSize: 58,
      animation: "karaoke",
      boxEnabled: false,
      shadowEnabled: true,
      positionX: 0,
      positionY: 76,
      scale: 1,
      letterCase: "as-typed"
    },
    {
      id: "sky-blue",
      name: "Gök Mavisi",
      badge: "Yumuşak",
      previewText: "Önizleme",
      description: "Mavi marka vurgusu.",
      fontFamily: "Inter",
      primaryColor: "#64d8ff",
      secondaryColor: "#ffffff",
      accentColor: "#64d8ff",
      strokeColor: "#000000",
      shadowColor: "#000000",
      boxColor: "#000000",
      strokeWidth: 3,
      fontSize: 54,
      animation: "fade",
      boxEnabled: false,
      shadowEnabled: true,
      positionX: 0,
      positionY: 76,
      scale: 1,
      letterCase: "as-typed"
    },
    {
      id: "hot-red",
      name: "Sıcak Kırmızı",
      badge: "Viral",
      previewText: "ANİMASYONLU ALTYAZI ÖNİZLEMESİ",
      description: "Kırmızı enerji ve kalın kontur.",
      fontFamily: "Inter",
      primaryColor: "#ffffff",
      secondaryColor: "#ffffff",
      accentColor: "#ff3d28",
      strokeColor: "#ff3d28",
      shadowColor: "#000000",
      boxColor: "#000000",
      strokeWidth: 5,
      fontSize: 54,
      animation: "pop",
      boxEnabled: false,
      shadowEnabled: true,
      positionX: 0,
      positionY: 76,
      scale: 1,
      letterCase: "uppercase"
    }
  ];

  presets = buildCaptioneerPresets();

  var mogrtRatios = ["Portrait", "Square", "Landscape"];
  var mogrtStyles = presets.map(function (preset) {
    return preset.name;
  });

  var whisperLanguages = [
    { code: "auto", label: "Dili otomatik seç" },
    { code: "tr", label: "Türkçe" },
    { code: "en", label: "İngilizce" },
    { code: "de", label: "Almanca" },
    { code: "fr", label: "Fransızca" },
    { code: "es", label: "İspanyolca" },
    { code: "it", label: "İtalyanca" },
    { code: "pt", label: "Portekizce" },
    { code: "ru", label: "Rusça" },
    { code: "ar", label: "Arapça" },
    { code: "zh", label: "Çince" },
    { code: "ja", label: "Japonca" },
    { code: "ko", label: "Korece" },
    { code: "nl", label: "Felemenkçe" },
    { code: "pl", label: "Lehçe" },
    { code: "uk", label: "Ukraynaca" },
    { code: "el", label: "Yunanca" },
    { code: "he", label: "İbranice" },
    { code: "hi", label: "Hintçe" },
    { code: "ur", label: "Urduca" },
    { code: "fa", label: "Farsça" },
    { code: "id", label: "Endonezce" },
    { code: "ms", label: "Malayca" },
    { code: "th", label: "Tayca" },
    { code: "vi", label: "Vietnamca" },
    { code: "sv", label: "İsveççe" },
    { code: "da", label: "Danca" },
    { code: "no", label: "Norveççe" },
    { code: "fi", label: "Fince" },
    { code: "cs", label: "Çekçe" },
    { code: "sk", label: "Slovakça" },
    { code: "ro", label: "Romence" },
    { code: "hu", label: "Macarca" },
    { code: "bg", label: "Bulgarca" },
    { code: "sr", label: "Sırpça" },
    { code: "hr", label: "Hırvatça" },
    { code: "sl", label: "Slovence" },
    { code: "ca", label: "Katalanca" },
    { code: "eu", label: "Baskça" },
    { code: "gl", label: "Galiçyaca" },
    { code: "af", label: "Afrikaanca" },
    { code: "sq", label: "Arnavutça" },
    { code: "hy", label: "Ermenice" },
    { code: "az", label: "Azerice" },
    { code: "be", label: "Belarusça" },
    { code: "bn", label: "Bengalce" },
    { code: "bs", label: "Boşnakça" },
    { code: "et", label: "Estonca" },
    { code: "ka", label: "Gürcüce" },
    { code: "gu", label: "Guceratça" },
    { code: "is", label: "İzlandaca" },
    { code: "kn", label: "Kannadaca" },
    { code: "kk", label: "Kazakça" },
    { code: "lv", label: "Letonca" },
    { code: "lt", label: "Litvanca" },
    { code: "mk", label: "Makedonca" },
    { code: "ml", label: "Malayalamca" },
    { code: "mr", label: "Marathice" },
    { code: "mn", label: "Moğolca" },
    { code: "ne", label: "Nepalce" },
    { code: "pa", label: "Pencapça" },
    { code: "sw", label: "Svahili" },
    { code: "ta", label: "Tamilce" },
    { code: "te", label: "Teluguca" },
    { code: "tl", label: "Filipince" },
    { code: "uz", label: "Özbekçe" },
    { code: "cy", label: "Galce" },
    { code: "la", label: "Latince" }
  ];

  var translationLanguages = [
    { code: "tr", label: "Türkçe" },
    { code: "en", label: "İngilizce" },
    { code: "de", label: "Almanca" },
    { code: "ru", label: "Rusça" }
  ];

  var state = {
    appMode: "setup",
    scenario: scenarios[0],
    preset: presets[0],
    outputMode: "mogrt",
    mogrtRatio: "Portrait",
    mogrtStyle: presets[0].name,
    activeStyleTab: "preset",
    wordsPerScreen: 3,
    styleOverride: false,
    translationTarget: "none",
    captions: [],
    sourceCaptions: [],
    customPresets: [],
    audioTracks: [],
    selectedAudioTrack: null,
    detectedLanguage: null,
    latestSrtPath: "",
    latestOverlayPath: "",
    latestTimelineStartSeconds: 0,
    latestTimelineEndSeconds: 0,
    latestClipDurationSeconds: 0,
    latestWords: [],
    updateInfo: null,
    updateDismissedVersion: ""
  };

  var els = {};

  document.addEventListener("DOMContentLoaded", function () {
    bindElements();
    bindEvents();
    state.customPresets = loadCustomPresets();
    seedMockCaptionsForBrowserPreview();
    renderAll();
    loadHostBridge(function (result) {
      if (!result.ok) {
        writeLog(result.message);
        return;
      }
      writeLog("Premiere köprüsü yüklendi. Zaman çizelgesindeki ses kanalları okunuyor...");
      autoLoadAudioTracks(0);
    });
    checkForUpdates({ silent: true });
  });

  function bindElements() {
    els.setupView = document.querySelector("#setupView");
    els.analyzingView = document.querySelector("#analyzingView");
    els.editView = document.querySelector("#editView");
    els.settingsBtn = document.querySelector("#settingsBtn");
    els.updateBadge = document.querySelector("#updateBadge");
    els.settingsModal = document.querySelector("#settingsModal");
    els.closeSettingsBtn = document.querySelector("#closeSettingsBtn");
    els.doneSettingsBtn = document.querySelector("#doneSettingsBtn");
    els.refreshSettingsBtn = document.querySelector("#refreshSettingsBtn");
    els.settingsVersion = document.querySelector("#settingsVersion");
    els.settingsVersionStatus = document.querySelector("#settingsVersionStatus");
    els.settingsUpdateStatus = document.querySelector("#settingsUpdateStatus");
    els.settingsUpdateDetails = document.querySelector("#settingsUpdateDetails");
    els.settingsInstallUpdateBtn = document.querySelector("#settingsInstallUpdateBtn");
    els.settingsEngineStatus = document.querySelector("#settingsEngineStatus");
    els.settingsEngineDetails = document.querySelector("#settingsEngineDetails");
    els.settingsGoogleStatus = document.querySelector("#settingsGoogleStatus");
    els.settingsGoogleDetails = document.querySelector("#settingsGoogleDetails");
    els.settingsTranslateUsage = document.querySelector("#settingsTranslateUsage");
    els.updateModal = document.querySelector("#updateModal");
    els.updateModalSummary = document.querySelector("#updateModalSummary");
    els.updateNotesList = document.querySelector("#updateNotesList");
    els.installUpdateBtn = document.querySelector("#installUpdateBtn");
    els.deferUpdateBtn = document.querySelector("#deferUpdateBtn");
    els.deferUpdateCloseBtn = document.querySelector("#deferUpdateCloseBtn");
    els.animatedDrawer = document.querySelector("#animatedDrawer");
    els.applyModal = document.querySelector("#applyModal");
    els.topTabs = document.querySelectorAll(".top-tab");
    els.styleTabs = document.querySelectorAll(".style-tab");
    els.stylePanels = document.querySelectorAll(".style-panel-content");
    els.scenarioList = document.querySelector("#scenarioList");
    els.presetList = document.querySelector("#presetList");
    els.presetCount = document.querySelector("#presetCount");
    els.presetSearchInput = document.querySelector("#presetSearchInput");
    els.captionTable = document.querySelector("#captionTable");
    els.captionMeta = document.querySelector("#captionMeta");
    els.sequenceTitle = document.querySelector("#sequenceTitle");
    els.costCard = document.querySelector("#costCard");
    els.logOutput = document.querySelector("#logOutput");
    els.analyzingLabel = document.querySelector("#analyzingLabel");
    els.fileInput = document.querySelector("#fileInput");
    els.speechProvider = document.querySelector("#speechProvider");
    els.translateTargetInput = document.querySelector("#translateTargetInput");
    els.durationInput = document.querySelector("#durationInput");
    els.charInput = document.querySelector("#charInput");
    els.previewPrimary = document.querySelector("#previewPrimary");
    els.previewSecondary = document.querySelector("#previewSecondary");
    els.captionPreviewCard = document.querySelector("#captionPreviewCard");
    els.previewVideo = document.querySelector("#previewVideo");
    els.previewStage = document.querySelector("#previewStage");
    els.fontInput = document.querySelector("#fontInput");
    els.primaryColorInput = document.querySelector("#primaryColorInput");
    els.accentColorInput = document.querySelector("#accentColorInput");
    els.strokeColorInput = document.querySelector("#strokeColorInput");
    els.strokeWidthInput = document.querySelector("#strokeWidthInput");
    els.fontSizeInput = document.querySelector("#fontSizeInput");
    els.animationInput = document.querySelector("#animationInput");
    els.boxEnabledInput = document.querySelector("#boxEnabledInput");
    els.shadowEnabledInput = document.querySelector("#shadowEnabledInput");
    els.positionXInput = document.querySelector("#positionXInput");
    els.positionYInput = document.querySelector("#positionYInput");
    els.paddingLeftInput = document.querySelector("#paddingLeftInput");
    els.paddingRightInput = document.querySelector("#paddingRightInput");
    els.scaleInput = document.querySelector("#scaleInput");
    els.letterCaseInput = document.querySelector("#letterCaseInput");
    els.multiLineInput = document.querySelector("#multiLineInput");
    els.breakCommaInput = document.querySelector("#breakCommaInput");
    els.breakPeriodInput = document.querySelector("#breakPeriodInput");
    els.breakQuestionInput = document.querySelector("#breakQuestionInput");
    els.breakExclamationInput = document.querySelector("#breakExclamationInput");
    els.previewTextSelect = document.querySelector("#previewTextSelect");
    els.outputModeInput = document.querySelector("#outputModeInput");
    els.mogrtRatioInput = document.querySelector("#mogrtRatioInput");
    els.mogrtStyleInput = document.querySelector("#mogrtStyleInput");
    els.wordsPerScreenInput = document.querySelector("#wordsPerScreenInput");
    els.styleOverrideInput = document.querySelector("#styleOverrideInput");
    els.transcribeTimelineBtn = document.querySelector("#transcribeTimelineBtn");
    els.reloadTracksBtn = document.querySelector("#reloadTracksBtn");
    els.closeAnimatedPanelBtn = document.querySelector("#closeAnimatedPanelBtn");
    els.reapplyBtn = document.querySelector("#reapplyBtn");
    els.applyStyleBtn = document.querySelector("#applyStyleBtn");
    els.saveTemplateBtn = document.querySelector("#saveTemplateBtn");
    els.updateTemplateBtn = document.querySelector("#updateTemplateBtn");
    els.newTemplateBtn = document.querySelector("#newTemplateBtn");
    els.previewCurrentFrameBtn = document.querySelector("#previewCurrentFrameBtn");
    els.confirmApplyBtn = document.querySelector("#confirmApplyBtn");
    els.closeApplyModalBtn = document.querySelector("#closeApplyModalBtn");
    els.cancelApplyModalBtn = document.querySelector("#cancelApplyModalBtn");
    els.audioTrackSelect = document.querySelector("#audioTrackSelect");
    els.detectedLanguageInput = document.querySelector("#detectedLanguageInput");
    els.languageMode = document.querySelector("#languageMode");
    els.audioStatus = document.querySelector("#audioStatus");
  }

  function bindEvents() {
    document.querySelector("#importBtn").addEventListener("click", function () {
      els.fileInput.click();
    });
    if (els.settingsBtn) {
      els.settingsBtn.addEventListener("click", openSettingsModal);
    }
    if (els.closeSettingsBtn) {
      els.closeSettingsBtn.addEventListener("click", closeSettingsModal);
    }
    if (els.doneSettingsBtn) {
      els.doneSettingsBtn.addEventListener("click", closeSettingsModal);
    }
    if (els.refreshSettingsBtn) {
      els.refreshSettingsBtn.addEventListener("click", refreshSettingsStatus);
    }
    if (els.settingsInstallUpdateBtn) {
      els.settingsInstallUpdateBtn.addEventListener("click", installAvailableUpdate);
    }
    if (els.installUpdateBtn) {
      els.installUpdateBtn.addEventListener("click", installAvailableUpdate);
    }
    if (els.deferUpdateBtn) {
      els.deferUpdateBtn.addEventListener("click", deferAvailableUpdate);
    }
    if (els.deferUpdateCloseBtn) {
      els.deferUpdateCloseBtn.addEventListener("click", deferAvailableUpdate);
    }
    if (els.settingsModal) {
      els.settingsModal.addEventListener("click", function (event) {
        if (event.target === els.settingsModal) {
          closeSettingsModal();
        }
      });
    }
    if (els.updateModal) {
      els.updateModal.addEventListener("click", function (event) {
        if (event.target === els.updateModal && !isUpdateMandatory(state.updateInfo)) {
          deferAvailableUpdate();
        }
      });
    }
    document.querySelector("#exportBtn").addEventListener("click", exportSrt);
    var applyBtn = document.querySelector("#applyBtn");
    if (applyBtn) {
      applyBtn.addEventListener("click", function () {
        state.outputMode = "mogrt";
        applyToTimeline({ forceImport: false });
      });
    }
    if (els.reapplyBtn) {
      els.reapplyBtn.addEventListener("click", function () {
        state.outputMode = "mogrt";
        applyToTimeline({ forceImport: true });
      });
    }
    els.transcribeTimelineBtn.addEventListener("click", transcribeSelectedTimelineAudio);
    if (els.reloadTracksBtn) {
      els.reloadTracksBtn.addEventListener("click", function () {
        autoLoadAudioTracks(0);
      });
    }
    els.audioTrackSelect.addEventListener("change", function () {
      state.selectedAudioTrack = findTrack(els.audioTrackSelect.value);
      state.detectedLanguage = null;
      renderAudioState();
      if (state.selectedAudioTrack) {
        writeLog(state.selectedAudioTrack.id + " seçildi. Dil algılama için hazır.");
      }
    });
    els.languageMode.addEventListener("change", function () {
      state.detectedLanguage = detectLanguageDraft(state.selectedAudioTrack, els.languageMode.value);
      renderAudioState();
      writeLog(
        state.detectedLanguage.code === "auto"
          ? "Konuşma dili otomatik seçildi. Whisper dili kendisi algılayacak."
          : "Konuşma dili seçildi: " + state.detectedLanguage.label + "."
      );
    });
    els.translateTargetInput.addEventListener("change", function () {
      translateCaptionsToTarget(els.translateTargetInput.value);
    });
    els.outputModeInput.addEventListener("change", function () {
      state.outputMode = els.outputModeInput.value;
      writeLog("Çıkış modu seçildi: " + getOutputModeLabel(state.outputMode) + ".");
    });
    if (els.mogrtRatioInput) {
      els.mogrtRatioInput.addEventListener("change", function () {
      state.mogrtRatio = els.mogrtRatioInput.value;
      renderPresets();
      renderPresetPreview();
      writeLog("MOGRT formatı seçildi: " + state.mogrtRatio + ".");
      });
    }
    if (els.mogrtStyleInput) {
      els.mogrtStyleInput.addEventListener("change", function () {
      state.mogrtStyle = els.mogrtStyleInput.value;
      state.preset = copy(
        getAllPresets().filter(function (preset) {
          return getPresetMogrtStyle(preset) === state.mogrtStyle;
        })[0] || state.preset
      );
      syncPresetControls();
      renderPresets();
      renderPresetPreview();
      writeLog("Stil seçildi: " + getPresetDisplayName(state.preset) + ".");
      });
    }
    els.wordsPerScreenInput.addEventListener("input", function () {
      state.wordsPerScreen = clampWordsPerScreen(els.wordsPerScreenInput.value);
      els.wordsPerScreenInput.value = state.wordsPerScreen;
      reflowEditorCaptions();
      writeLog("Editör " + state.wordsPerScreen + " kelimeye göre otomatik bölündü. Zaman çizelgesine aynı bloklarla basılacak.");
    });
    if (els.styleOverrideInput) {
      els.styleOverrideInput.addEventListener("change", function () {
      state.styleOverride = !!els.styleOverrideInput.checked;
      writeLog(
        state.styleOverride
          ? "Stil geçersiz kılma açık. Yazı tipi ve renk ayarları MOGRT'e uygulanacak."
          : "Stil geçersiz kılma kapalı. MOGRT kendi yazı tipi ve renkleriyle korunacak."
      );
      });
    }
    els.fileInput.addEventListener("change", importSrt);

    Array.prototype.forEach.call(els.topTabs || [], function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-mode-target") || "setup";
        if (target === "edit" && !state.captions.length) {
          writeLog("Önce altyazı üret veya SRT içe aktar.");
          setAppMode("setup");
          return;
        }
        setAppMode(target);
      });
    });

    Array.prototype.forEach.call(els.styleTabs || [], function (tab) {
      tab.addEventListener("click", function () {
        activateStyleTab(tab.getAttribute("data-style-tab") || "preset");
      });
    });

    if (els.closeAnimatedPanelBtn) {
      els.closeAnimatedPanelBtn.addEventListener("click", function () {
        els.animatedDrawer.hidden = true;
      });
    }
    if (els.applyStyleBtn) {
      els.applyStyleBtn.addEventListener("click", function () {
        applyToTimeline({ forceImport: false });
      });
    }
    if (els.confirmApplyBtn) {
      els.confirmApplyBtn.addEventListener("click", confirmApplyModal);
    }
    if (els.closeApplyModalBtn) {
      els.closeApplyModalBtn.addEventListener("click", closeApplyModal);
    }
    if (els.cancelApplyModalBtn) {
      els.cancelApplyModalBtn.addEventListener("click", closeApplyModal);
    }
    if (els.saveTemplateBtn) {
      els.saveTemplateBtn.addEventListener("click", saveCurrentTemplate);
    }
    if (els.updateTemplateBtn) {
      els.updateTemplateBtn.addEventListener("click", updateCurrentTemplate);
    }
    if (els.newTemplateBtn) {
      els.newTemplateBtn.addEventListener("click", saveCurrentTemplate);
    }
    if (els.presetSearchInput) {
      els.presetSearchInput.addEventListener("input", renderPresets);
    }
    if (els.previewCurrentFrameBtn) {
      els.previewCurrentFrameBtn.addEventListener("click", previewTextInCurrentFrame);
    }
    if (els.previewTextSelect) {
      els.previewTextSelect.addEventListener("change", renderPresetPreview);
    }

    [els.speechProvider, els.durationInput, els.charInput].forEach(function (element) {
      if (!element) {
        return;
      }
      element.addEventListener("input", renderCost);
    });
    [
      els.fontInput,
      els.primaryColorInput,
      els.accentColorInput,
      els.strokeColorInput,
      els.strokeWidthInput,
      els.fontSizeInput,
      els.animationInput,
      els.boxEnabledInput,
      els.shadowEnabledInput,
      els.positionXInput,
      els.positionYInput,
      els.paddingLeftInput,
      els.paddingRightInput,
      els.scaleInput,
      els.letterCaseInput,
      els.multiLineInput
    ].forEach(function (element) {
      if (!element) {
        return;
      }
      element.addEventListener("input", updatePresetFromControls);
      element.addEventListener("change", updatePresetFromControls);
    });
  }

  function renderAll() {
    renderScenarios();
    renderPresets();
    renderCaptions();
    renderCost();
    renderAudioState();
    renderLanguageOptions();
    renderMogrtOptions();
    syncPresetControls();
    renderPresetPreview();
    renderAppMode();
  }

  function openSettingsModal() {
    if (!els.settingsModal) {
      return;
    }
    els.settingsModal.hidden = false;
    refreshSettingsStatus();
  }

  function closeSettingsModal() {
    if (els.settingsModal) {
      els.settingsModal.hidden = true;
    }
  }

  function refreshSettingsStatus() {
    if (els.settingsVersion) {
      els.settingsVersion.textContent = CURRENT_VERSION;
    }
    if (els.settingsVersionStatus) {
      els.settingsVersionStatus.textContent = "Yerel paket sürümü. GitHub kontrolü panel açılışında yapılır.";
    }
    renderUpdateStatus();
    if (els.settingsTranslateUsage) {
      els.settingsTranslateUsage.textContent = formatNumber(getLocalTranslationUsage()) + " karakter";
    }
    if (els.settingsEngineStatus) {
      els.settingsEngineStatus.textContent = "Kontrol ediliyor";
    }
    if (els.settingsEngineDetails) {
      els.settingsEngineDetails.textContent = "Yerel motor durumu okunuyor.";
    }
    if (els.settingsGoogleStatus) {
      els.settingsGoogleStatus.textContent = "Kontrol ediliyor";
    }
    if (els.settingsGoogleDetails) {
      els.settingsGoogleDetails.textContent = "Google Translate yapılandırması kontrol ediliyor.";
    }

    callEngineHealth(function (result) {
      if (!result.ok) {
        if (els.settingsEngineStatus) {
          els.settingsEngineStatus.textContent = "Bağlı değil";
        }
        if (els.settingsEngineDetails) {
          els.settingsEngineDetails.textContent = result.message || "Zola Caption yerel motoruna ulaşılamadı.";
        }
        if (els.settingsGoogleStatus) {
          els.settingsGoogleStatus.textContent = "Okunamadı";
        }
        if (els.settingsGoogleDetails) {
          els.settingsGoogleDetails.textContent = "Motor çalışmadan Google Translate durumu okunamaz.";
        }
        return;
      }

      var tools = [];
      tools.push(result.whisper ? "Whisper hazır" : "Whisper yok");
      tools.push(result.ffmpeg ? "FFmpeg hazır" : "FFmpeg yok");
      tools.push(result.modelExists ? "Model hazır" : "Model yok");
      if (els.settingsEngineStatus) {
        els.settingsEngineStatus.textContent = "Çalışıyor";
      }
      if (els.settingsEngineDetails) {
        els.settingsEngineDetails.textContent = tools.join(" · ");
      }
      if (els.settingsGoogleStatus) {
        els.settingsGoogleStatus.textContent = result.googleTranslateConfigured ? "Hazır" : "API anahtarı yok";
      }
      if (els.settingsGoogleDetails) {
        els.settingsGoogleDetails.textContent = result.googleTranslateConfigured
          ? "Google Cloud Translation Basic bağlı. Resmi kalan kota için Cloud Quotas/Billing yetkisi gerekir."
          : "Çeviri için yerel motor .env dosyasına Google Translate API anahtarı eklenmeli.";
      }
    });
  }

  function checkForUpdates(options) {
    var silent = !!(options && options.silent);
    var url = window.CAPITON_UPDATE_URL || "";
    if (!url) {
      state.updateInfo = null;
      renderUpdateStatus();
      return;
    }

    requestJson(url, function (result) {
      if (!result.ok) {
        if (!silent) {
          writeLog(result.message || "Güncelleme bilgisi okunamadı.");
        }
        renderUpdateStatus();
        return;
      }

      state.updateInfo = normalizeUpdateInfo(result.data);
      renderUpdateStatus();
      if (isUpdateAvailable(state.updateInfo) && shouldShowUpdateModal(state.updateInfo)) {
        openUpdateModal();
      }
    });
  }

  function normalizeUpdateInfo(data) {
    var info = data || {};
    return {
      latest: normalizeVersion(info.latest || ""),
      minSupported: normalizeVersion(info.minSupported || ""),
      mandatory: !!info.mandatory,
      downloadUrl: String(info.downloadUrl || ""),
      notes: Array.isArray(info.notes) ? info.notes : []
    };
  }

  function renderUpdateStatus() {
    var info = state.updateInfo;
    var available = isUpdateAvailable(info);
    var mandatory = isUpdateMandatory(info);
    if (els.updateBadge) {
      els.updateBadge.hidden = !available;
    }
    if (els.settingsUpdateStatus) {
      els.settingsUpdateStatus.textContent = available
        ? mandatory
          ? "Zorunlu güncelleme var"
          : "Güncelleme var"
        : window.CAPITON_UPDATE_URL
          ? "Güncel"
          : "Bağlı değil";
    }
    if (els.settingsUpdateDetails) {
      els.settingsUpdateDetails.textContent = available
        ? CURRENT_VERSION + " -> v" + info.latest + ". " + (info.notes[0] || "Yeni sürüm hazır.")
        : window.CAPITON_UPDATE_URL
          ? "Bu paket için yeni sürüm bulunmadı."
          : "GitHub update.json URL'i henüz bağlanmadı.";
    }
    if (els.settingsInstallUpdateBtn) {
      els.settingsInstallUpdateBtn.hidden = !available;
    }
  }

  function openUpdateModal() {
    var info = state.updateInfo;
    if (!info || !els.updateModal) {
      return;
    }
    if (els.updateModalSummary) {
      els.updateModalSummary.textContent = CURRENT_VERSION + " sürümünden v" + info.latest + " sürümüne güncelleme hazır.";
    }
    if (els.updateNotesList) {
      els.updateNotesList.innerHTML = "";
      (info.notes || []).forEach(function (note) {
        var item = document.createElement("li");
        item.textContent = note;
        els.updateNotesList.appendChild(item);
      });
    }
    var mandatory = isUpdateMandatory(info);
    if (els.deferUpdateBtn) {
      els.deferUpdateBtn.hidden = mandatory;
    }
    if (els.deferUpdateCloseBtn) {
      els.deferUpdateCloseBtn.hidden = mandatory;
    }
    els.updateModal.hidden = false;
  }

  function closeUpdateModal() {
    if (els.updateModal) {
      els.updateModal.hidden = true;
    }
  }

  function deferAvailableUpdate() {
    if (isUpdateMandatory(state.updateInfo)) {
      return;
    }
    if (state.updateInfo && state.updateInfo.latest) {
      state.updateDismissedVersion = state.updateInfo.latest;
    }
    closeUpdateModal();
    renderUpdateStatus();
  }

  function installAvailableUpdate() {
    var info = state.updateInfo;
    if (!info || !info.downloadUrl) {
      writeLog("Güncelleme indirme adresi bulunamadı.");
      return;
    }
    closeUpdateModal();
    if (window.cep && window.cep.util && typeof window.cep.util.openURLInDefaultBrowser === "function") {
      window.cep.util.openURLInDefaultBrowser(info.downloadUrl);
    } else {
      window.open(info.downloadUrl, "_blank");
    }
    writeLog("Güncelleme paketi açılıyor: v" + info.latest + ". Premiere'i kapatıp güncelleme paketini çalıştır.");
  }

  function shouldShowUpdateModal(info) {
    if (!isUpdateAvailable(info)) {
      return false;
    }
    return isUpdateMandatory(info) || state.updateDismissedVersion !== info.latest;
  }

  function isUpdateAvailable(info) {
    return !!(info && info.latest && compareVersions(info.latest, normalizeVersion(CURRENT_VERSION)) > 0);
  }

  function isUpdateMandatory(info) {
    if (!info) {
      return false;
    }
    return !!info.mandatory || (!!info.minSupported && compareVersions(normalizeVersion(CURRENT_VERSION), info.minSupported) < 0);
  }

  function normalizeVersion(version) {
    return String(version || "").replace(/^v/i, "").trim();
  }

  function compareVersions(a, b) {
    var left = normalizeVersion(a).split(".").map(function (part) { return Number(part) || 0; });
    var right = normalizeVersion(b).split(".").map(function (part) { return Number(part) || 0; });
    var length = Math.max(left.length, right.length);
    for (var index = 0; index < length; index += 1) {
      if ((left[index] || 0) > (right[index] || 0)) {
        return 1;
      }
      if ((left[index] || 0) < (right[index] || 0)) {
        return -1;
      }
    }
    return 0;
  }

  function seedMockCaptionsForBrowserPreview() {
    if (window.location.search.indexOf("mock=1") === -1) {
      return;
    }
    state.appMode = "edit";
    state.detectedLanguage = { code: "tr", label: "Türkçe", confidence: 1 };
    state.captions = [
      { id: "mock-1", start: 0, end: 1.2, text: "Mutfaginiz bu halden" },
      { id: "mock-2", start: 1.2, end: 2.4, text: "bu hale getirmek" },
      { id: "mock-3", start: 2.4, end: 3.6, text: "sandiginiz kadar" },
      { id: "mock-4", start: 3.6, end: 4.8, text: "zor degil." }
    ];
  }

  function setAppMode(mode) {
    state.appMode = mode;
    renderAppMode();
  }

  function setAnalyzingLabel(text) {
    if (els.analyzingLabel) {
      els.analyzingLabel.textContent = text || "İşlem hazırlanıyor";
    }
  }

  function beginApplyProgress(message) {
    setAnalyzingLabel(message || "Altyazı zaman çizelgesine uygulanıyor");
    setAppMode("analyzing");
  }

  function finishApplyProgress() {
    setAppMode("edit");
  }

  function renderAppMode() {
    var mode = state.appMode || "setup";
    if (!state.captions.length && mode === "edit") {
      mode = "setup";
    }
    if (els.setupView) {
      els.setupView.hidden = mode !== "setup";
    }
    if (els.analyzingView) {
      els.analyzingView.hidden = mode !== "analyzing";
    }
    if (els.editView) {
      els.editView.hidden = mode !== "edit";
    }
    Array.prototype.forEach.call(els.topTabs || [], function (tab) {
      tab.className = "top-tab" + (tab.getAttribute("data-mode-target") === mode ? " active" : "");
    });
  }

  function activateStyleTab(name) {
    state.activeStyleTab = name || "preset";
    Array.prototype.forEach.call(els.styleTabs || [], function (tab) {
      tab.className = "style-tab" + (tab.getAttribute("data-style-tab") === name ? " active" : "");
    });
    Array.prototype.forEach.call(els.stylePanels || [], function (panel) {
      panel.className = "style-panel-content" + (panel.getAttribute("data-style-panel") === name ? " active" : "");
    });
    renderPresetPreview();
  }

  function renderScenarios() {
    if (!els.scenarioList) {
      return;
    }
    els.scenarioList.innerHTML = "";
    scenarios.forEach(function (scenario) {
      var button = document.createElement("button");
      button.className = "scenario-card" + (scenario.id === state.scenario.id ? " active" : "");
      button.innerHTML = "<strong>" + scenario.title + "</strong><p>" + scenario.description + "</p>";
      button.addEventListener("click", function () {
        state.scenario = scenario;
        renderScenarios();
        renderCaptions();
        writeLog("Senaryo seçildi: " + scenario.title);
      });
      els.scenarioList.appendChild(button);
    });
  }

  function renderPresets() {
    els.presetList.innerHTML = "";
    var query = els.presetSearchInput ? String(els.presetSearchInput.value || "").toLowerCase() : "";
    var allPresets = getAllPresets().filter(function (preset) {
      var haystack = [preset.name, preset.mogrtStyle, preset.badge, preset.description].join(" ").toLowerCase();
      return !query || haystack.indexOf(query) !== -1;
    });

    if (els.presetCount) {
      els.presetCount.textContent = allPresets.length;
    }

    allPresets.forEach(function (preset) {
      var selected = preset.id === state.preset.id;
      var button = document.createElement("button");
      button.className = "template-card" + (selected ? " active" : "");
      button.innerHTML = buildPresetCardHtml(preset) + '<span class="template-check"></span>';
      button.addEventListener("click", function () {
        state.preset = copy(preset);
        state.mogrtStyle = getPresetMogrtStyle(preset);
        renderMogrtOptions();
        syncPresetControls();
        renderPresets();
        renderPresetPreview();
        writeLog("Stil seçildi: " + getPresetDisplayName(preset));
      });
      els.presetList.appendChild(button);
    });
  }

  function buildPresetCardHtml(preset) {
    return (
      '<span class="template-preview">' +
      buildPresetPreviewHtml(preset, "template-preview-media") +
      "</span>" +
      '<span class="template-info"><strong>' +
      escapeHtml(getPresetDisplayName(preset)) +
      '</strong><em>' +
      escapeHtml(preset.badge || "Hazır") +
      "</em><small>" +
      escapeHtml(preset.description || "Animasyonlu altyazı stili.") +
      "</small></span>"
    );
  }

  function buildPresetPreviewHtml(preset, className) {
    var style = getPresetMogrtStyle(preset);
    if (style && preset && preset.isCaptioneer) {
      return (
        '<video class="' +
        className +
        '" autoplay muted loop playsinline poster="' +
        escapeHtml(getMogrtPreviewPath(state.mogrtRatio, style, "png")) +
        '" src="' +
        escapeHtml(getMogrtPreviewPath(state.mogrtRatio, style, "mp4")) +
        '"></video>'
      );
    }

    return (
      '<img class="' +
      className +
      ' template-render-preview-image" src="' +
      escapeHtml(buildPresetPreviewImage(preset)) +
      '" alt="' +
      escapeHtml(getPresetDisplayName(preset)) +
      '">'
    );
  }

  function buildPresetPreviewImage(preset) {
    var canvas = document.createElement("canvas");
    var width = 360;
    var height = 216;
    var sampleText = preset.previewText || "Altyazı önizlemesi";
    var fontSize = 48;
    var strokeWidth = 7;
    var maxWords = 3;
    if (arguments.length > 1 && arguments[1]) {
      sampleText = arguments[1];
    }
    if (arguments.length > 2 && arguments[2]) {
      width = arguments[2].width || width;
      height = arguments[2].height || height;
      fontSize = arguments[2].fontSize || fontSize;
      strokeWidth = arguments[2].strokeWidth || strokeWidth;
      maxWords = arguments[2].maxWords || maxWords;
    }
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    var bg = "#7e7e80";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    var words = String(sampleText || preset.previewText || "Altyazı önizlemesi")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, maxWords);
    if (!words.length) {
      words = ["Altyazı", "önizlemesi"];
    }
    var activeIndex = Math.min(words.length - 1, words.length > 1 ? 1 : 0);
    var lineA = words.slice(0, Math.ceil(words.length / 2));
    var lineB = words.slice(Math.ceil(words.length / 2));
    var font = "900 " + fontSize + "px Inter, Arial, sans-serif";
    ctx.font = font;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;

    var firstLineIndexes = lineA.map(function (_, index) {
      return index;
    });
    var secondLineIndexes = lineB.map(function (_, index) {
      return index + lineA.length;
    });
    drawPreviewCanvasLine(ctx, lineA, firstLineIndexes, activeIndex, width / 2, lineB.length ? height * 0.39 : height * 0.5, preset, strokeWidth);
    if (lineB.length) {
      drawPreviewCanvasLine(ctx, lineB, secondLineIndexes, activeIndex, width / 2, height * 0.62, preset, strokeWidth);
    }
    try {
      return canvas.toDataURL("image/png");
    } catch (error) {
      return "";
    }
  }

  function drawPreviewCanvasLine(ctx, words, indexes, activeIndex, centerX, y, preset, strokeWidth) {
    var gap = 12;
    var widths = words.map(function (word) {
      return ctx.measureText(transformTextCase(word, preset.letterCase || "as-typed")).width;
    });
    var total = widths.reduce(function (sum, width) {
      return sum + width;
    }, 0) + gap * Math.max(0, words.length - 1);
    var x = centerX - total / 2;
    words.forEach(function (word, index) {
      var text = transformTextCase(word, preset.letterCase || "as-typed");
      var isActive = indexes[index] === activeIndex;
      ctx.lineWidth = Math.max(0, Number(strokeWidth || 0));
      ctx.strokeStyle = preset.strokeColor || "#000000";
      ctx.shadowColor = "rgba(0,0,0,.55)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      if (ctx.lineWidth > 0) {
        ctx.strokeText(text, x, y);
      }
      ctx.shadowColor = "transparent";
      ctx.fillStyle = isActive ? preset.accentColor || "#a6ff00" : preset.primaryColor || "#ffffff";
      ctx.fillText(text, x, y);
      x += widths[index] + gap;
    });
  }

  function buildPreviewSampleHtml(preset, sampleText, scale) {
    var words = String(sampleText || preset.previewText || "Altyazı önizlemesi")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 3);
    if (!words.length) {
      words = ["Altyazı", "önizlemesi"];
    }
    var activeIndex = Math.min(words.length - 1, words.length > 1 ? 1 : 0);
    var previewScale = Number(scale || 0.4);
    var stroke = Math.max(0, Math.round(Number(preset.strokeWidth || 0) * previewScale));
    var activeStyle =
      "color:" +
      escapeHtml(preset.accentColor || "#a6ff00") +
      ";-webkit-text-stroke:" +
      stroke +
      "px " +
      escapeHtml(preset.strokeColor || "#000000") +
      ";paint-order:stroke fill;";
    return words.map(function (word, index) {
      var clean = escapeHtml(transformTextCase(word, preset.letterCase || "as-typed"));
      return index === activeIndex ? '<span style="' + activeStyle + '">' + clean + "</span>" : clean;
    }).join(" ");
  }

  function getPresetMogrtStyle(preset) {
    if (!preset) {
      return "";
    }
    if (preset.mogrtStyle) {
      return String(preset.mogrtStyle).trim();
    }
    return preset.isCaptioneer ? String(preset.name || "").trim() : "";
  }

  function getPresetDisplayName(preset) {
    return String((preset && (preset.displayName || preset.name)) || "Stil").trim();
  }

  function renderMogrtOptions() {
    els.outputModeInput.value = state.outputMode;
    if (els.mogrtRatioInput) {
      els.mogrtRatioInput.value = state.mogrtRatio;
    }
    if (els.mogrtStyleInput) {
      els.mogrtStyleInput.innerHTML = "";
      getAllPresets().forEach(function (preset) {
        addOption(els.mogrtStyleInput, getPresetMogrtStyle(preset), getPresetDisplayName(preset));
      });
      els.mogrtStyleInput.value = state.mogrtStyle;
    }
    els.wordsPerScreenInput.value = state.wordsPerScreen;
    if (els.styleOverrideInput) {
      els.styleOverrideInput.checked = !!state.styleOverride;
    }
  }

  function getAllPresets() {
    return presets.concat(state.customPresets || []);
  }

  function renderLanguageOptions() {
    var current = els.languageMode.value || "auto";
    els.languageMode.innerHTML = "";
    whisperLanguages.forEach(function (language) {
      addOption(els.languageMode, language.code, language.label);
    });
    els.languageMode.value = findLanguage(current) ? current : "auto";

    if (els.translateTargetInput) {
      var target = state.translationTarget || "none";
      els.translateTargetInput.innerHTML = "";
      addOption(els.translateTargetInput, "none", "Altyazıyı çevir");
      translationLanguages.forEach(function (language) {
        addOption(els.translateTargetInput, language.code, "Çevir: " + language.label);
      });
      els.translateTargetInput.value = findTranslationLanguage(target) ? target : "none";
    }
  }

  function renderCaptions() {
    els.captionTable.innerHTML = "";
    els.captionMeta.textContent = state.captions.length + " blok";

    if (state.captions.length === 0) {
      var empty = document.createElement("div");
      empty.className = "caption-row";
      empty.innerHTML =
        '<div class="caption-time">--:--</div><div class="caption-fields">Henüz altyazı yok. Zaman çizelgesi sesinden altyazı üret veya SRT içe aktar.</div>';
      els.captionTable.appendChild(empty);
      return;
    }

    state.captions.forEach(function (caption, index) {
      var row = document.createElement("div");
      row.className = "caption-row" + (caption.hidden ? " is-hidden" : "");
      row.innerHTML =
        '<div class="caption-time">' +
        formatShortTime(caption.start) +
        '</div><button type="button" class="visibility-toggle" data-index="' +
        index +
        '" title="Bu altyazı bloğunu gizle/göster">' +
        (caption.hidden ? "◌" : "◉") +
        '</button><div class="caption-fields">' +
        '<textarea rows="1" data-index="' +
        index +
        '" data-field="text" aria-label="Kaynak altyazı">' +
        escapeHtml(caption.text) +
        "</textarea>" +
        (shouldShowTranslationField()
          ? '<textarea rows="1" class="translation-field" data-index="' +
            index +
            '" data-field="translation" aria-label="Çeviri">' +
            escapeHtml(caption.translation || "") +
            "</textarea>"
          : "") +
        "</div>";
      els.captionTable.appendChild(row);
    });

    Array.prototype.forEach.call(els.captionTable.querySelectorAll("textarea"), function (textarea) {
      textarea.addEventListener("input", function (event) {
        var index = Number(event.currentTarget.getAttribute("data-index"));
        var field = event.currentTarget.getAttribute("data-field");
        state.captions[index][field] = event.currentTarget.value;
        if (field === "text" && isTranslationActive()) {
          state.captions[index].translationStale = true;
        }
        updateCharacterEstimate();
        renderPresetPreview();
      });
    });

    Array.prototype.forEach.call(els.captionTable.querySelectorAll(".visibility-toggle"), function (button) {
      button.addEventListener("click", function (event) {
        var index = Number(event.currentTarget.getAttribute("data-index"));
        if (!state.captions[index]) {
          return;
        }
        state.captions[index].hidden = !state.captions[index].hidden;
        renderCaptions();
        writeLog(state.captions[index].hidden ? "Altyazı satırı gizlendi." : "Altyazı satırı tekrar açıldı.");
      });
    });

    updateCharacterEstimate();
    renderPreviewTextOptions();
  }

  function renderAudioState() {
    els.audioTrackSelect.innerHTML = "";

    if (state.audioTracks.length === 0) {
      addOption(els.audioTrackSelect, "A1", "A1 - Zaman çizelgesi medyası");
    } else {
      state.audioTracks.forEach(function (track) {
        addOption(els.audioTrackSelect, track.id, track.id + " - " + track.name + " (" + track.clipCount + " klip)");
      });
    }

    els.audioTrackSelect.value = state.selectedAudioTrack ? state.selectedAudioTrack.id : "A1";
    els.audioTrackSelect.disabled = state.audioTracks.length <= 1;

    if (state.detectedLanguage) {
      els.detectedLanguageInput.value =
        state.detectedLanguage.label + " (" + Math.round(state.detectedLanguage.confidence * 100) + "%)";
    } else {
      els.detectedLanguageInput.value = "Henüz algılanmadı";
    }

    if (state.selectedAudioTrack && state.detectedLanguage && state.detectedLanguage.code === "auto") {
      els.audioStatus.textContent = state.selectedAudioTrack.id + " seçildi, konuşma dilini Whisper otomatik algılayacak.";
    } else if (state.selectedAudioTrack && state.detectedLanguage) {
      els.audioStatus.textContent = state.selectedAudioTrack.id + " seçildi, kaynak dil " + state.detectedLanguage.label + ".";
    } else if (state.selectedAudioTrack && state.audioTracks.length === 1) {
      els.audioStatus.textContent = "Tek aktif ses kanalı bulundu; " + state.selectedAudioTrack.id + " otomatik seçildi.";
    } else if (state.selectedAudioTrack) {
      els.audioStatus.textContent = state.audioTracks.length + " aktif ses kanalı bulundu. Kaynak: " + state.selectedAudioTrack.id + ".";
    } else {
      els.audioStatus.textContent = "A1 varsayılan seçildi; Altyazı üret zaman çizelgesi medyasını deneyecek.";
    }
  }

  function autoLoadAudioTracks(attempt) {
    writeLog("Zaman çizelgesindeki ses kanalları okunuyor...");
    listSequenceAudioTracks(function (result) {
      if (!result.ok) {
        state.audioTracks = [fallbackAudioTrack()];
        state.selectedAudioTrack = state.audioTracks[0];
        renderAudioState();
        writeLog((result.message || "Ses kanalları okunamadı.") + "\nA1 varsayılan seçildi; zaman çizelgesi medyası üzerinden devam edebilirsin.");
        return;
      }

      state.audioTracks = result.tracks && result.tracks.length > 0 ? result.tracks : [fallbackAudioTrack()];
      state.selectedAudioTrack = state.audioTracks.length > 0 ? state.audioTracks[0] : null;
      renderAudioState();

      if (state.audioTracks.length === 1) {
        writeLog(result.message + "\nTek aktif ses kanalı olduğu için " + state.selectedAudioTrack.id + " otomatik seçildi.");
      } else if (state.audioTracks.length > 1) {
        writeLog(result.message + "\nBirden fazla aktif ses kanalı var; kaynak kanalı listeden değiştirebilirsin.");
      } else {
        writeLog((result.message || "Ses kanalı bulunamadı.") + "\nA1 varsayılan seçildi; zaman çizelgesi medyası üzerinden devam edebilirsin.");
      }
    });
  }

  function detectSelectedTrackLanguage() {
    var track = state.selectedAudioTrack || { id: "A1", name: "Zaman çizelgesi medyası", index: 1, clipCount: 1 };
    state.detectedLanguage = detectLanguageDraft(track, els.languageMode.value);
    var matchingScenario = scenarios.filter(function (scenario) {
      return state.detectedLanguage.code !== "auto" && scenario.sourceLang === state.detectedLanguage.code;
    })[0];

    if (matchingScenario && state.scenario.sourceLang !== state.detectedLanguage.code) {
      state.scenario = matchingScenario;
        renderScenarios();
        renderCaptions();
    }

    renderAudioState();
    writeLog(
      state.detectedLanguage.code === "auto"
        ? "Dil otomatik bırakıldı. Whisper sesi analiz edip dili kendi seçecek. Kaynak: " + track.id + "."
        : "Dil seçildi: " + state.detectedLanguage.label + ". Kaynak: " + track.id + "."
    );
  }

  function transcribeSelectedTimelineAudio() {
    state.translationTarget = "none";
    if (els.translateTargetInput) {
      els.translateTargetInput.value = "none";
    }
    runTimelineTranscription("transcribe", "source");
  }

  function translateCaptionsToTarget(targetLanguage, callback) {
    var target = targetLanguage || "none";

    if (target === "none") {
      state.translationTarget = "none";
      renderCaptions();
      if (callback) {
        callback(true);
      }
      return;
    }

    if (!state.captions.length) {
      state.translationTarget = "none";
      if (els.translateTargetInput) {
        els.translateTargetInput.value = "none";
      }
      writeLog("Çeviri için önce zaman çizelgesi sesinden altyazı üretmelisin.");
      if (callback) {
        callback(false);
      }
      return;
    }

    syncCaptionsFromEditor();

    if (!findTranslationLanguage(target)) {
      state.translationTarget = "none";
      if (els.translateTargetInput) {
        els.translateTargetInput.value = "none";
      }
      writeLog(languageLabel(target) + " çeviri hedef listesinde yok.");
      if (callback) {
        callback(false);
      }
      return;
    }

    state.translationTarget = target;
    setAnalyzingLabel("Altyazı " + languageLabel(target) + " diline çevriliyor");
    setAppMode("analyzing");
    writeLog("Editördeki güncel metinler " + languageLabel(target) + " diline çevriliyor...");

    callEngine("/translate", {
      sourceLanguage: getCurrentSourceLanguageForTranslation(),
      targetLanguage: target,
      captions: state.captions.map(function (caption, index) {
        return {
          index: index,
          start: caption.start,
          end: caption.end,
          text: caption.text
        };
      })
    }, function (result) {
      if (!result.ok) {
        setAppMode("edit");
        writeLog(result.message || "Çeviri oluşturulamadı.");
        if (callback) {
          callback(false);
        }
        return;
      }

      (result.captions || []).forEach(function (translatedCaption) {
        var index = Number(translatedCaption.index);
        if (!state.captions[index]) {
          return;
        }
        state.captions[index].translation = translatedCaption.text || "";
        state.captions[index].translationLang = target;
        state.captions[index].translationSourceText = state.captions[index].text;
        state.captions[index].translationStale = false;
      });
      addLocalTranslationUsage(result.characterCount);

      setAppMode("edit");
      renderCaptions();
      renderPresetPreview();
      writeLog(result.message || "Altyazı çevirisi güncellendi.");
      if (callback) {
        callback(true);
      }
    });
  }

  function runTimelineTranscription(task, outputLanguage) {
    var track = state.selectedAudioTrack || { id: "A1", name: "Zaman çizelgesi medyası", index: 1, clipCount: 1 };
    var isTranslate = task === "translate";
    setAnalyzingLabel(isTranslate ? "Altyazı çevriliyor" : "Video sesi analiz ediliyor");
    setAppMode("analyzing");

    if (!state.detectedLanguage) {
      state.detectedLanguage = detectLanguageDraft(track, els.languageMode.value);
      renderAudioState();
    }

    writeLog(
      track.id +
        " kaynak medyası Premiere'den okunuyor..." +
        (isTranslate ? "\nAltyazı İngilizceye çevrilecek." : "")
    );

    getAudioSource(track.id, function (sourceResult) {
      if (!sourceResult.ok) {
        setAppMode(state.captions.length ? "edit" : "setup");
        writeLog(sourceResult.message);
        return;
      }

      writeLog(sourceResult.message + "\nZola Caption yerel motora gönderiliyor...");
      callEngine("/transcribe", {
        mediaPath: sourceResult.mediaPath,
        language: state.detectedLanguage ? state.detectedLanguage.code : els.languageMode.value || "auto",
        task: isTranslate ? "translate" : "transcribe",
        outputLanguage: outputLanguage || (isTranslate ? "en" : "source"),
        trackId: track.id,
        scenario: state.scenario.id,
        trimStartSeconds: sourceResult.sourceInSeconds || 0,
        trimEndSeconds: sourceResult.sourceOutSeconds || 0
      }, function (engineResult) {
        if (!engineResult.ok) {
          setAppMode(state.captions.length ? "edit" : "setup");
          writeLog(engineResult.message);
          return;
        }

        var generatedCaptions = (engineResult.captions || []).map(function (caption) {
          return {
            id: uid(),
            start: caption.start,
            end: caption.end,
            text: caption.text,
            translation: ""
          };
        });
        state.sourceCaptions = copy(generatedCaptions);
        state.latestSrtPath = engineResult.files && engineResult.files.srtPath ? engineResult.files.srtPath : "";
        state.latestOverlayPath = "";
        state.latestTimelineStartSeconds = Number(sourceResult.timelineStartSeconds || 0);
        state.latestTimelineEndSeconds = Number(sourceResult.timelineEndSeconds || 0);
        state.latestClipDurationSeconds = Math.max(
          0,
          state.latestTimelineEndSeconds - state.latestTimelineStartSeconds,
          Number(sourceResult.sourceOutSeconds || 0) - Number(sourceResult.sourceInSeconds || 0)
        );
        state.latestWords = engineResult.words || [];
        if (engineResult.detectedLanguage) {
          state.detectedLanguage = {
            code: engineResult.detectedLanguage,
            label: languageLabel(engineResult.detectedLanguage),
            confidence: 1
          };
        }
        state.captions = splitCaptionsForEditor(generatedCaptions);
        setAppMode("edit");
        renderAudioState();
        renderCaptions();
        writeLog(
          (isTranslate ? "Altyazı İngilizceye çevrildi: " : "Altyazı üretildi: ") +
            state.captions.length +
            " blok.\nZaman çizelgesi başlangıcı: " +
            formatShortTime(state.latestTimelineStartSeconds) +
            "\nMod: " +
            (engineResult.task === "translate" ? "İngilizce çeviri" : "Orijinal dil transkripsiyon") +
            "\nSRT: " +
            (engineResult.files && engineResult.files.srtPath ? engineResult.files.srtPath : "-")
        );
      });
    });
  }

  function listSequenceAudioTracks(callback) {
    if (!window.__adobe_cep__ || typeof window.__adobe_cep__.evalScript !== "function") {
      callback({
        ok: false,
        tracks: [],
        message: "Premiere CEP köprüsü bulunamadı. Panel Premiere içinde Legacy Extension olarak açılmalı."
      });
      return;
    }

    window.__adobe_cep__.evalScript("capitonListAudioTracks()", function (raw) {
      try {
        callback(JSON.parse(raw));
      } catch (error) {
        runBridgeDiagnostics("Ses kanalları okunamadı: " + (raw || error.message), callback);
      }
    });
  }

  function loadHostBridge(callback) {
    if (!window.__adobe_cep__ || typeof window.__adobe_cep__.evalScript !== "function") {
      callback({
        ok: false,
        message: "Premiere CEP köprüsü bulunamadı. Panel Premiere içinde Legacy Extension olarak açılmalı."
      });
      return;
    }

    var extensionRoot = "";
    try {
      extensionRoot = window.__adobe_cep__.getSystemPath("extension");
    } catch (error) {
      callback({
        ok: false,
        message: "Extension klasörü okunamadı: " + error.message
      });
      return;
    }

    var hostPath = extensionRoot + "/jsx/host.jsx";
    var script =
      'try { $.evalFile("' +
      escapeForJsx(hostPath) +
      '"); "OK"; } catch (e) { "ERR: " + e.toString() + " line=" + e.line; }';

    window.__adobe_cep__.evalScript(script, function (raw) {
      if (raw === "OK") {
        callback({ ok: true });
        return;
      }

      callback({
        ok: false,
        message: "Premiere köprüsü yüklenemedi: " + raw
      });
    });
  }

  function runBridgeDiagnostics(prefix, callback) {
    window.__adobe_cep__.evalScript("capitonGetSequenceInfo()", function (infoRaw) {
      var suffix = "";
      try {
        var info = JSON.parse(infoRaw);
        suffix = "\nSekans bilgisi: " + (info.message || info.name || JSON.stringify(info));
      } catch (error) {
        suffix = "\nSekans bilgisi de okunamadı: " + (infoRaw || error.message);
      }

      callback({
        ok: false,
        tracks: [],
        message: prefix + suffix
      });
    });
  }

  function getAudioSource(trackId, callback) {
    if (!window.__adobe_cep__ || typeof window.__adobe_cep__.evalScript !== "function") {
      callback({
        ok: false,
        message: "Premiere CEP köprüsü bulunamadı."
      });
      return;
    }

    window.__adobe_cep__.evalScript('capitonGetAudioSource("' + escapeForJsx(trackId) + '")', function (raw) {
      try {
        callback(JSON.parse(raw));
      } catch (error) {
        callback({
          ok: false,
          message: "Premiere medya kaynağı okunamadı: " + (raw || error.message)
        });
      }
    });
  }

  function callEngine(endpoint, payload, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://127.0.0.1:17771" + endpoint, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return;
      }

      try {
        callback(JSON.parse(xhr.responseText || "{}"));
      } catch (error) {
        callback({
          ok: false,
          message: "Zola Caption yerel motor cevabı okunamadı. Motor çalışıyor mu? " + error.message
        });
      }
    };
    xhr.onerror = function () {
      callback({
        ok: false,
        message:
          "Zola Caption yerel motora bağlanılamadı. Önce outputs/capiton-local-engine/server.js çalışmalı ve Whisper kurulmalı."
      });
    };
    xhr.send(JSON.stringify(payload));
  }

  function callEngineHealth(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://127.0.0.1:17771/health", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return;
      }
      try {
        callback(JSON.parse(xhr.responseText || "{}"));
      } catch (error) {
        callback({ ok: false, message: "Yerel motor sağlık cevabı okunamadı: " + error.message });
      }
    };
    xhr.onerror = function () {
      callback({ ok: false, message: "Zola Caption yerel motoruna bağlanılamadı." });
    };
    xhr.send();
  }

  function requestJson(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url + (url.indexOf("?") === -1 ? "?t=" : "&t=") + Date.now(), true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return;
      }
      if (xhr.status && (xhr.status < 200 || xhr.status >= 300)) {
        callback({ ok: false, message: "Güncelleme dosyası okunamadı: HTTP " + xhr.status });
        return;
      }
      try {
        callback({ ok: true, data: JSON.parse(xhr.responseText || "{}") });
      } catch (error) {
        callback({ ok: false, message: "Güncelleme JSON formatı geçersiz: " + error.message });
      }
    };
    xhr.onerror = function () {
      callback({ ok: false, message: "Güncelleme kontrolüne bağlanılamadı." });
    };
    xhr.send();
  }

  function getLocalTranslationUsage() {
    try {
      return Number(window.localStorage.getItem("capiton.translateCharacters") || 0) || 0;
    } catch (error) {
      return 0;
    }
  }

  function addLocalTranslationUsage(count) {
    var next = getLocalTranslationUsage() + Math.max(0, Number(count || 0));
    try {
      window.localStorage.setItem("capiton.translateCharacters", String(next));
    } catch (error) {}
  }

  function formatNumber(value) {
    var text = String(Math.round(Number(value || 0)));
    return text.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function importCaptionFile(srtPath, startSeconds, callback) {
    if (!window.__adobe_cep__ || typeof window.__adobe_cep__.evalScript !== "function") {
      callback({
        ok: false,
        message: "Premiere CEP köprüsü bulunamadı."
      });
      return;
    }

    window.__adobe_cep__.evalScript(
      'capitonImportCaptionFile("' + escapeForJsx(srtPath) + '", ' + Number(startSeconds || 0) + ')',
      function (raw) {
      try {
        callback(JSON.parse(raw));
      } catch (error) {
        callback({
          ok: false,
            message: "Premiere altyazı içe aktarma cevabı okunamadı: " + (raw || error.message)
        });
      }
    });
  }

  function renderCaptionOverlay(callback, options) {
    var overlayPreset = buildOverlayPresetPayload();
    var overlayCaptions = overlayPreset.karaokeCaptions || [];
    var renderCaptions = overlayCaptions.length
      ? overlayCaptions
      : state.captions.filter(function (caption) {
          return !caption.hidden;
        });
    var naturalDuration = maxCaptionEnd(renderCaptions) + 0.2;
    var clipDuration = Number(state.latestClipDurationSeconds || 0);
    var renderDuration = clipDuration > 0 ? Math.max(0.2, clipDuration) : naturalDuration;
    var payload = {
      captions: renderCaptions,
      preset: overlayPreset,
      width: 1080,
      height: 1920,
      durationSeconds: renderDuration
    };
    if (options && options.outputPath) {
      payload.outputPath = options.outputPath;
    }
    callEngine("/render-overlay", payload, callback);
  }

  function importOverlayFile(mediaPath, startSeconds, callback) {
    if (!window.__adobe_cep__ || typeof window.__adobe_cep__.evalScript !== "function") {
      callback({
        ok: false,
        message: "Premiere CEP köprüsü bulunamadı."
      });
      return;
    }

    window.__adobe_cep__.evalScript(
      'capitonImportOverlayFile("' + escapeForJsx(mediaPath) + '", ' + Number(startSeconds || 0) + ')',
      function (raw) {
        try {
          callback(JSON.parse(raw));
        } catch (error) {
          callback({
            ok: false,
            message: "Premiere görsel altyazı içe aktarma cevabı okunamadı: " + (raw || error.message)
          });
        }
      }
    );
  }

  function refreshOverlayFile(mediaPath, callback) {
    if (!window.__adobe_cep__ || typeof window.__adobe_cep__.evalScript !== "function") {
      callback({
        ok: false,
        message: "Premiere CEP köprüsü bulunamadı."
      });
      return;
    }

    window.__adobe_cep__.evalScript('capitonRefreshOverlayFile("' + escapeForJsx(mediaPath) + '")', function (raw) {
      try {
        callback(JSON.parse(raw));
      } catch (error) {
        callback({
          ok: false,
          message: "Premiere görsel altyazı yenileme cevabı okunamadı: " + (raw || error.message)
        });
      }
    });
  }

  function replaceOverlayFile(previousPath, mediaPath, startSeconds, callback) {
    if (!window.__adobe_cep__ || typeof window.__adobe_cep__.evalScript !== "function") {
      callback({
        ok: false,
        message: "Premiere CEP köprüsü bulunamadı."
      });
      return;
    }

    window.__adobe_cep__.evalScript(
      'capitonReplaceOverlayFile("' +
        escapeForJsx(previousPath) +
        '", "' +
        escapeForJsx(mediaPath) +
        '", ' +
        Number(startSeconds || 0) +
        ')',
      function (raw) {
        try {
          callback(JSON.parse(raw));
        } catch (error) {
          callback({
            ok: false,
            message: "Premiere görsel altyazı değiştirme cevabı okunamadı: " + (raw || error.message)
          });
        }
      }
    );
  }

  function importSrt(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      state.sourceCaptions = parseSrt(String(reader.result || ""));
      state.captions = splitCaptionsForEditor(state.sourceCaptions);
      setAppMode("edit");
      renderCaptions();
      writeLog(file.name + " içe aktarıldı. " + state.captions.length + " caption bloğu oluşturuldu.");
    };
    reader.readAsText(file);
  }

  function translateDraft() {
    state.captions = state.captions.map(function (caption) {
      return {
        id: caption.id,
        start: caption.start,
        end: caption.end,
        text: caption.text,
        translation: caption.translation || draftTranslate(caption.text, state.scenario.targetLang)
      };
    });
    renderCaptions();
    writeLog("Çeviri taslağı oluşturuldu. Gerçek Google/OpenAI çağrısı backend proxy bağlanınca aktifleşecek.");
  }

  function exportSrt() {
    syncCaptionsFromEditor();
    var mode = isTranslationActive()
      ? "translation"
      : state.scenario.bilingual
      ? "bilingual"
      : state.scenario.targetLang === "en" && state.scenario.sourceLang === "tr"
        ? "translation"
        : "primary";
    var srt = toSrt(state.captions, mode);
    var blob = new Blob([srt], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "zola-caption-" + state.scenario.id + ".srt";
    link.click();
    URL.revokeObjectURL(url);
    writeLog("SRT dışa aktarma hazırlandı.");
  }

  function applyToTimeline(options) {
    var forceImport = !!(options && options.forceImport);
    var skipTranslationRefresh = !!(options && options.skipTranslationRefresh);
    writeLog(forceImport ? "Yeniden üret ve bas komutu alındı." : "Düzenlemeyi güncelle komutu alındı.");
    syncCaptionsFromEditor();
    updatePresetFromControls({ skipRender: true });

    if (!state.captions.length) {
      writeLog("Önce altyazı üret veya SRT içe aktar.");
      return;
    }

    if (!skipTranslationRefresh && needsTranslationRefresh()) {
      writeLog("Çeviri metni güncel değil; timeline'a basmadan önce seçili dile göre yenileniyor.");
      translateCaptionsToTarget(state.translationTarget, function (ok) {
        if (ok) {
          applyToTimeline({
            forceImport: forceImport,
            skipTranslationRefresh: true
          });
        }
      });
      return;
    }

    state.outputMode = "mogrt";
    applyMogrtToTimeline({ forceImport: forceImport });
  }

  function applyMogrtToTimeline(options) {
    if (shouldUseSynchronizedOverlay()) {
      applySynchronizedOverlayToTimeline(options);
      return;
    }

    applyRawMogrtToTimeline();
  }

  function applyRawMogrtToTimeline() {
    var mogrtPath = getSelectedMogrtPath();
    var captions = buildMogrtCaptionPayloads();
    beginApplyProgress("MOGRT altyazı zaman çizelgesine ekleniyor");

    writeLog(
      "MOGRT altyazılar Premiere'e basılıyor...\nStil: " +
        state.mogrtRatio +
        " / " +
        state.mogrtStyle +
        "\nSRT blok: " +
        state.captions.length +
        " -> MOGRT parça: " +
        captions.length
    );

    importMogrtSequence(
      {
        mogrtPath: mogrtPath,
        ratio: state.mogrtRatio,
        style: state.mogrtStyle,
        preset: buildMogrtPresetPayload(),
        preserveTemplateStyle: !state.styleOverride,
        captions: captions
      },
      function (result) {
        if (result.ok) {
          finishApplyProgress();
          writeLog(result.message || captions.length + " MOGRT altyazı zaman çizelgesine eklendi.");
          return;
        }

        finishApplyProgress();
        writeLog((result.message || "MOGRT içe aktarma başarısız.") + "\nZaman çizelgesine hatalı yedek altyazı eklenmedi.");
      }
    );
  }

  function shouldUseSynchronizedOverlay() {
    return true;
  }

  function applySynchronizedOverlayToTimeline(options) {
    var forceImport = !!(options && options.forceImport);
    var existingOverlayPath = forceImport ? "" : state.latestOverlayPath;
    beginApplyProgress(forceImport ? "Altyazı yeniden üretilip zaman çizelgesine basılıyor" : "Kelime vurgulu altyazı render ediliyor");
    writeLog(
      (forceImport
        ? "Yeni senkron kelime vurgulu altyazı render ediliyor; timeline'a yeniden eklenecek."
        : existingOverlayPath
        ? "Senkron görsel altyazı yeniden render ediliyor; zaman çizelgesindeki mevcut dosya güncellenecek."
        : "Senkron kelime vurgulu görsel altyazı render ediliyor.") +
        "\nEkrandaki kelime: " +
        state.wordsPerScreen
    );
    renderCaptionOverlay(function (overlayResult) {
      if (!overlayResult.ok) {
        finishApplyProgress();
        writeLog((overlayResult.message || "Senkron görsel altyazı üretilemedi.") + "\nZaman çizelgesine hatalı MOGRT yedeği eklenmedi.");
        return;
      }

      if (existingOverlayPath) {
        replaceOverlayFile(existingOverlayPath, overlayResult.overlayPath, state.latestTimelineStartSeconds, function (replaceResult) {
          finishApplyProgress();
          if (replaceResult.ok) {
            state.latestOverlayPath = overlayResult.overlayPath;
          }
          writeLog(
            (overlayResult.message || "Senkron görsel altyazı güncellendi.") +
              "\n" +
              (replaceResult.message || "Premiere medya değiştirme sonucu alınamadı.")
          );
        });
        return;
      }

      writeLog((overlayResult.message || "Senkron görsel altyazı üretildi.") + "\nPremiere zaman çizelgesine ekleniyor...");
      importOverlayFile(overlayResult.overlayPath, state.latestTimelineStartSeconds, function (result) {
        finishApplyProgress();
        if (result.ok) {
          state.latestOverlayPath = overlayResult.overlayPath;
        }
        writeLog(result.message || "Görsel altyazı içe aktarma sonucu alınamadı.");
      });
    });
  }

  function renderCost() {
    var durationMinutes = Number(els.durationInput.value || 0);
    var characterCount = Number(els.charInput.value || 0);
    var speechCost = els.speechProvider.value === "openai-whisper" ? durationMinutes * 0.017 : 0;
    var translationCost = 0;

    els.costCard.innerHTML =
      "<strong>$" +
      (speechCost + translationCost).toFixed(3) +
      " tahmini</strong><br>Transkripsiyon: $" +
      speechCost.toFixed(3) +
      "<br>Çeviri: lokal İngilizce $0.000";
  }

  function renderPresetPreview() {
    var preset = state.preset;
    if (els.previewVideo) {
      els.previewVideo.removeAttribute("src");
      els.previewVideo.removeAttribute("poster");
      els.previewVideo.style.display = "none";
    }

    var sample = getPreviewText();
    els.captionPreviewCard.style.display = "grid";
    els.previewPrimary.innerHTML =
      '<img class="live-preview-image" src="' +
      escapeHtml(
        buildPresetPreviewImage(preset, sample, {
          width: 720,
          height: 360,
          fontSize: 70,
          strokeWidth: Math.max(1, Number(preset.strokeWidth || 5) * 1.5),
          maxWords: Math.max(1, Math.min(4, Number(state.wordsPerScreen || 3)))
        })
      ) +
      '" alt="Altyazı önizlemesi">';
    els.previewPrimary.style.cssText = "display:block;width:100%;max-width:100%;";
    els.previewSecondary.style.display = "none";
    els.previewStage.style.cssText = previewBackgroundStyle(preset);
  }

  function syncPresetControls() {
    els.fontInput.value = state.preset.fontFamily;
    els.primaryColorInput.value = state.preset.primaryColor;
    els.accentColorInput.value = state.preset.accentColor;
    if (els.strokeColorInput) {
      els.strokeColorInput.value = state.preset.strokeColor || "#000000";
    }
    if (els.strokeWidthInput) {
      els.strokeWidthInput.value = state.preset.strokeWidth || 5;
    }
    if (els.fontSizeInput) {
      els.fontSizeInput.value = state.preset.fontSize || 56;
    }
    if (els.boxEnabledInput) {
      els.boxEnabledInput.checked = !!state.preset.boxEnabled;
    }
    if (els.shadowEnabledInput) {
      els.shadowEnabledInput.checked = state.preset.shadowEnabled !== false;
    }
    if (els.positionXInput) {
      els.positionXInput.value = state.preset.positionX || 0;
    }
    if (els.positionYInput) {
      els.positionYInput.value = state.preset.positionY || 76;
    }
    if (els.paddingLeftInput) {
      els.paddingLeftInput.value = state.preset.paddingLeft || 40;
    }
    if (els.paddingRightInput) {
      els.paddingRightInput.value = state.preset.paddingRight || 40;
    }
    if (els.scaleInput) {
      els.scaleInput.value = state.preset.scale || 1;
    }
    if (els.letterCaseInput) {
      els.letterCaseInput.value = state.preset.letterCase || "as-typed";
    }
    if (els.multiLineInput) {
      els.multiLineInput.checked = !!state.preset.multiLine;
    }
    els.animationInput.value = state.preset.animation;
    if (els.mogrtRatioInput) {
      els.mogrtRatioInput.value = state.mogrtRatio;
    }
    if (els.mogrtStyleInput) {
      els.mogrtStyleInput.value = state.mogrtStyle;
    }
  }

  function openApplyModal() {
    syncCaptionsFromEditor();
    if (!state.captions.length) {
      writeLog("Önce altyazı üret veya SRT içe aktar.");
      return;
    }
    if (els.applyModal) {
      els.applyModal.hidden = false;
    }
  }

  function closeApplyModal() {
    if (els.applyModal) {
      els.applyModal.hidden = true;
    }
  }

  function confirmApplyModal() {
    var selected = document.querySelector('input[name="applyCaptionType"]:checked');
    var type = selected ? selected.value : "animated";
    closeApplyModal();
    if (type === "srt") {
      var previous = state.outputMode;
      state.outputMode = "srt";
      applyToTimeline();
      state.outputMode = previous;
      return;
    }
    state.outputMode = "mogrt";
    applyToTimeline();
  }

  function updatePresetFromControls(options) {
    var skipRender = !!(options && options.skipRender);
    state.preset.fontFamily = els.fontInput ? els.fontInput.value || "Inter" : state.preset.fontFamily || "Inter";
    state.preset.primaryColor = els.primaryColorInput ? els.primaryColorInput.value : state.preset.primaryColor || "#ffffff";
    state.preset.accentColor = els.accentColorInput ? els.accentColorInput.value : state.preset.accentColor || "#fff200";
    state.preset.strokeColor = els.strokeColorInput ? els.strokeColorInput.value : state.preset.strokeColor || "#000000";
    state.preset.strokeWidth = els.strokeWidthInput ? Number(els.strokeWidthInput.value || 5) : state.preset.strokeWidth || 5;
    state.preset.fontSize = els.fontSizeInput ? Number(els.fontSizeInput.value || 56) : state.preset.fontSize || 56;
    state.preset.boxEnabled = els.boxEnabledInput ? !!els.boxEnabledInput.checked : !!state.preset.boxEnabled;
    state.preset.shadowEnabled = els.shadowEnabledInput ? !!els.shadowEnabledInput.checked : state.preset.shadowEnabled !== false;
    state.preset.positionX = els.positionXInput ? Number(els.positionXInput.value || 0) : state.preset.positionX || 0;
    state.preset.positionY = els.positionYInput ? Number(els.positionYInput.value || 76) : state.preset.positionY || 76;
    state.preset.paddingLeft = els.paddingLeftInput ? Number(els.paddingLeftInput.value || 40) : state.preset.paddingLeft || 40;
    state.preset.paddingRight = els.paddingRightInput ? Number(els.paddingRightInput.value || 40) : state.preset.paddingRight || 40;
    state.preset.scale = els.scaleInput ? Number(els.scaleInput.value || 1) : state.preset.scale || 1;
    state.preset.letterCase = els.letterCaseInput ? els.letterCaseInput.value || "as-typed" : state.preset.letterCase || "as-typed";
    state.preset.multiLine = els.multiLineInput ? !!els.multiLineInput.checked : !!state.preset.multiLine;
    state.preset.animation = els.animationInput ? els.animationInput.value : state.preset.animation || "none";
    state.mogrtStyle = getPresetMogrtStyle(state.preset) || state.mogrtStyle;
    if (skipRender) {
      return;
    }
    renderPresetPreview();
    renderPresets();
  }

  function importMogrtSequence(payload, callback) {
    if (!window.__adobe_cep__ || typeof window.__adobe_cep__.evalScript !== "function") {
      callback({
        ok: false,
        message: "Premiere CEP köprüsü bulunamadı."
      });
      return;
    }

    var payloadText = JSON.stringify(payload);
    window.__adobe_cep__.evalScript(
      'capitonImportMogrtSequence("' + escapeForJsx(payloadText) + '")',
      function (raw) {
        try {
          callback(JSON.parse(raw));
        } catch (error) {
          callback({
            ok: false,
            message: "Premiere MOGRT içe aktarma cevabı okunamadı: " + (raw || error.message)
          });
        }
      }
    );
  }

  function getSelectedMogrtPath() {
    var prefix = getExtensionRootPath() + "/assets/mogrts/captioneer/";
    var ratioPrefix = state.mogrtRatio === "Portrait" ? "9•16" : state.mogrtRatio === "Landscape" ? "16•9" : "1•1";
    return prefix + state.mogrtRatio + "/" + ratioPrefix + " " + state.mogrtStyle + " Subtitles.mogrt";
  }

  function getExtensionRootPath() {
    try {
      return window.__adobe_cep__.getSystemPath("extension");
    } catch (error) {
      return "";
    }
  }

  function getTimelineCaptionText(caption) {
    var text = "";
    if (state.scenario.targetLang === "en" && state.scenario.sourceLang === "tr" && !state.scenario.bilingual) {
      text = caption.translation || caption.text;
    } else if (state.scenario.bilingual) {
      text = caption.text + (caption.translation ? " " + caption.translation : "");
    } else {
      text = caption.text;
    }
    return formatMogrtCaptionText(text);
  }

  function buildMogrtCaptionPayloads() {
    var timelineOffset = Number(state.latestTimelineStartSeconds || 0);
    var payloads = [];
    state.captions.forEach(function (caption) {
      var text = getRawTimelineCaptionText(caption);
      if (isWordHighlightStyle()) {
        payloads = payloads.concat(buildTimedWordHighlightPayloads(caption, text, timelineOffset));
        return;
      }

      var chunks = splitCaptionForMogrt(text);
      var start = Number(caption.start || 0);
      var end = Math.max(start + 0.25, Number(caption.end || 0));
      var duration = end - start;
      var totalWeight = chunks.reduce(function (sum, chunk) {
        return sum + chunk.weight;
      }, 0);
      var cursor = start;

      chunks.forEach(function (chunk, index) {
        var chunkDuration =
          chunk.start !== undefined && chunk.end !== undefined
            ? Math.max(0.34, chunk.end - chunk.start)
            : index === chunks.length - 1
              ? end - cursor
              : Math.max(0.34, duration * (chunk.weight / Math.max(1, totalWeight)));
        var chunkStart = timelineOffset + (chunk.start !== undefined ? chunk.start : cursor);
        var chunkEnd = timelineOffset + (chunk.end !== undefined ? chunk.end : Math.min(end, cursor + chunkDuration));
        payloads.push({
          startMs: Math.round(chunkStart * 1000),
          endMs: Math.round(Math.max(chunkStart + 0.34, chunkEnd) * 1000),
          text: formatMogrtCaptionText(chunk.text)
        });
        cursor += chunkDuration;
      });
    });
    return payloads;
  }

  function buildTimedWordHighlightPayloads(caption, text, timelineOffset) {
    var clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) {
      return [];
    }

    var wordTexts = clean.split(" ").filter(Boolean);
    var wordItems = buildEditorWordItems(caption, wordTexts);
    var fullText = formatMogrtCaptionText(clean);
    var payloads = [];

    wordItems.forEach(function (word, index) {
      var start = Number(word.start);
      var end = Math.max(start + 0.18, Number(word.end));
      var range = getWordPercentRange(index, wordItems.length);
      var sourceInMs = hasManualHighlightControls() ? 0 : getInternalWordSourceInMs(index, wordItems.length);

      payloads.push({
        startMs: Math.round((timelineOffset + start) * 1000),
        endMs: Math.round((timelineOffset + Math.max(start + 0.18, end)) * 1000),
        sourceInMs: sourceInMs,
        text: fullText,
        highlightStartPercent: range.startPercent,
        highlightEndPercent: range.endPercent
      });
    });

    return payloads;
  }

  function getWordPercentRange(index, totalWords) {
    var safeTotal = Math.max(1, totalWords || 1);
    return {
      startPercent: Math.max(0, Math.min(100, (index / safeTotal) * 100)),
      endPercent: Math.max(0, Math.min(100, ((index + 1) / safeTotal) * 100))
    };
  }

  function getInternalWordSourceInMs(index, totalWords) {
    var sourceDuration = getMogrtInternalDurationSeconds();
    var sourceStep = sourceDuration / Math.max(1, totalWords || 1);
    return Math.round(Math.min(sourceDuration - 0.05, index * sourceStep + 0.04) * 1000);
  }

  function getMogrtInternalDurationSeconds() {
    return 2;
  }

  function syncCaptionsFromEditor() {
    Array.prototype.forEach.call(els.captionTable.querySelectorAll("textarea"), function (textarea) {
      var index = Number(textarea.getAttribute("data-index"));
      var field = textarea.getAttribute("data-field");
      if (state.captions[index] && field) {
        state.captions[index][field] = textarea.value;
      }
    });
  }

  function reflowEditorCaptions() {
    if (!state.captions.length && !state.sourceCaptions.length) {
      renderCaptions();
      return;
    }

    syncCaptionsFromEditor();
    if (!state.sourceCaptions.length) {
      state.sourceCaptions = copy(state.captions);
    }

    state.captions = splitCaptionsForEditor(state.sourceCaptions);
    renderCaptions();
  }

  function splitCaptionsForEditor(captions) {
    var maxWords = clampWordsPerScreen(state.wordsPerScreen);
    var next = [];

    (captions || []).forEach(function (caption) {
      var clean = String(caption.text || "").replace(/\s+/g, " ").trim();
      if (!clean) {
        return;
      }

      var wordTexts = clean.split(" ").filter(Boolean);
      var timedWords = buildEditorWordItems(caption, wordTexts);
      splitWordItemsBySmartLimit(timedWords, maxWords).forEach(function (group) {
        if (!group.length) {
          return;
        }

        next.push({
          id: uid(),
          start: Number(group[0].start),
          end: Math.max(Number(group[0].start) + 0.25, Number(group[group.length - 1].end)),
          text: group.map(function (item) {
            return item.text;
          }).join(" "),
          translation: ""
        });
      });
    });

    return next;
  }

  function buildEditorWordItems(caption, wordTexts) {
    var timedWords = getWordsForCaption(caption);
    if (timedWords.length) {
      return alignEditedWordsToTimings(wordTexts, timedWords, caption);
    }

    var start = Number(caption.start || 0);
    var end = Math.max(start + 0.25, Number(caption.end || 0));
    var step = (end - start) / Math.max(1, wordTexts.length);
    return wordTexts.map(function (word, index) {
      return {
        text: word,
        weight: Math.max(1, word.length),
        start: start + index * step,
        end: start + (index + 1) * step
      };
    });
  }

  function splitWordItemsBySmartLimit(wordItems, maxWords) {
    var groups = [];
    var index = 0;
    var maxUnits = getMaxCaptionLineUnits();

    while (index < wordItems.length) {
      var limit = Math.min(wordItems.length, index + maxWords);
      var end = limit;
      var remainingAfterDefault = wordItems.length - end;

      for (var i = index; i < limit; i += 1) {
        if (hasCaptionBreakPunctuation(wordItems[i].text)) {
          end = i + 1;
          break;
        }
      }

      while (end > index + 1 && estimateCaptionGroupUnits(wordItems.slice(index, end)) > maxUnits) {
        end -= 1;
      }

      if (remainingAfterDefault === 1 && end === limit && end - index > 2) {
        end -= 1;
      }

      groups.push(wordItems.slice(index, end));
      index = end;
    }

    return groups;
  }

  function getMaxCaptionLineUnits() {
    var fontSize = Number((state.preset && state.preset.fontSize) || 56);
    var strokeWidth = Number((state.preset && state.preset.strokeWidth) || 5);
    var scale = Number((state.preset && state.preset.scale) || 1);
    var visualSize = Math.max(32, fontSize * Math.max(0.6, scale) + strokeWidth * 2);
    return Math.max(14, Math.floor(780 / (visualSize * 0.52)));
  }

  function estimateCaptionGroupUnits(group) {
    return (group || []).map(function (item) {
      var text = String((item && item.text) || "");
      return text.split("").reduce(function (total, char) {
        if (/[A-ZÇĞİÖŞÜ]/.test(char)) {
          return total + 1.15;
        }
        if (/[mwMW]/.test(char)) {
          return total + 1.25;
        }
        if (/[ilıİ.,:;!|]/.test(char)) {
          return total + 0.55;
        }
        return total + 1;
      }, 0);
    }).reduce(function (total, value, index) {
      return total + value + (index > 0 ? 0.9 : 0);
    }, 0);
  }

  function hasCaptionBreakPunctuation(word) {
    var text = String(word || "");
    if (els.breakPeriodInput && els.breakPeriodInput.checked && /[.;:…]+["'”’)]*$/.test(text)) {
      return true;
    }
    if (els.breakCommaInput && els.breakCommaInput.checked && /[,،]+["'”’)]*$/.test(text)) {
      return true;
    }
    if (els.breakQuestionInput && els.breakQuestionInput.checked && /\?+["'”’)]*$/.test(text)) {
      return true;
    }
    if (els.breakExclamationInput && els.breakExclamationInput.checked && /!+["'”’)]*$/.test(text)) {
      return true;
    }
    return false;
  }

  function getRawTimelineCaptionText(caption) {
    if (isTranslationActive()) {
      return caption.translation || caption.text;
    }
    if (state.scenario.targetLang === "en" && state.scenario.sourceLang === "tr" && !state.scenario.bilingual) {
      return caption.translation || caption.text;
    }
    if (state.scenario.bilingual) {
      return caption.text + (caption.translation ? " " + caption.translation : "");
    }
    return caption.text;
  }

  function isTranslationActive() {
    return !!findTranslationLanguage(state.translationTarget);
  }

  function shouldShowTranslationField() {
    if (isTranslationActive()) {
      return true;
    }
    return state.captions.some(function (caption) {
      return !!caption.translation;
    });
  }

  function needsTranslationRefresh() {
    if (!isTranslationActive()) {
      return false;
    }
    return state.captions.some(function (caption) {
      var source = String(caption.text || "").replace(/\s+/g, " ").trim();
      var translated = String(caption.translation || "").replace(/\s+/g, " ").trim();
      return (
        !!source &&
        (!translated ||
          caption.translationLang !== state.translationTarget ||
          caption.translationSourceText !== caption.text ||
          caption.translationStale)
      );
    });
  }

  function splitCaptionForMogrt(text) {
    var clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) {
      return [{ text: "", weight: 1 }];
    }

    var words = clean.split(" ");
    var chunks = [];
    var current = [];
    var maxWords = clampWordsPerScreen(state.wordsPerScreen);
    var maxChars = state.mogrtStyle === "Arch" || state.mogrtStyle === "Spinning" ? Math.max(12, maxWords * 7) : Math.max(16, maxWords * 9);

    words.forEach(function (word) {
      var next = current.concat([word]).join(" ");
      if (current.length && (current.length >= maxWords || next.length > maxChars)) {
        chunks.push({ text: current.join(" "), weight: current.join("").length });
        current = [word];
      } else {
        current.push(word);
      }
    });

    if (current.length) {
      chunks.push({ text: current.join(" "), weight: current.join("").length });
    }

    return chunks;
  }

  function splitCaptionWordsForMogrt(caption, text) {
    var clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) {
      return [{ text: "", weight: 1 }];
    }

    var editedWords = clean.split(" ").filter(Boolean);
    var timedWords = getWordsForCaption(caption);
    if (timedWords.length) {
      return groupTimedWordsForScreen(alignEditedWordsToTimings(editedWords, timedWords, caption));
    }

    var start = Number(caption.start || 0);
    var end = Math.max(start + 0.25, Number(caption.end || 0));
    var step = (end - start) / editedWords.length;
    return groupTimedWordsForScreen(editedWords.map(function (word, index) {
      return {
        text: word,
        weight: Math.max(1, word.length),
        start: start + index * step,
        end: start + (index + 1) * step
      };
    }));
  }

  function groupTimedWordsForScreen(wordItems) {
    var maxWords = clampWordsPerScreen(state.wordsPerScreen);
    var chunks = [];
    for (var i = 0; i < wordItems.length; i += maxWords) {
      var group = wordItems.slice(i, i + maxWords);
      if (!group.length) {
        continue;
      }
      chunks.push({
        text: group.map(function (item) {
          return item.text;
        }).join(" "),
        weight: group.reduce(function (sum, item) {
          return sum + Math.max(1, String(item.text || "").length);
        }, 0),
        start: Number(group[0].start),
        end: Number(group[group.length - 1].end)
      });
    }
    return chunks;
  }

  function getWordsForCaption(caption) {
    var start = Number(caption.start || 0) - 0.08;
    var end = Number(caption.end || 0) + 0.08;
    return (state.latestWords || []).filter(function (word) {
      return Number(word.start) < end && Number(word.end) > start;
    });
  }

  function alignEditedWordsToTimings(editedWords, timedWords, caption) {
    if (editedWords.length === timedWords.length) {
      return editedWords.map(function (word, index) {
        return {
          text: word,
          weight: Math.max(1, word.length),
          start: Number(timedWords[index].start),
          end: Number(timedWords[index].end)
        };
      });
    }

    var start = Number(caption.start || 0);
    var end = Math.max(start + 0.25, Number(caption.end || 0));
    var step = (end - start) / editedWords.length;
    return editedWords.map(function (word, index) {
      return {
        text: word,
        weight: Math.max(1, word.length),
        start: start + index * step,
        end: start + (index + 1) * step
      };
    });
  }

  function normalizeWordForTiming(word) {
    return String(word || "")
      .toLocaleLowerCase("tr-TR")
      .replace(/[^a-z0-9çğıöşüâîû]+/gi, "");
  }

  function getGlobalTimedWords() {
    return (state.latestWords || []).map(function (word) {
      return {
        text: String(word.text || word.word || "").replace(/\s+/g, " ").trim(),
        start: Number(word.start),
        end: Number(word.end)
      };
    }).filter(function (word) {
      return word.text && isFinite(word.start) && isFinite(word.end) && word.end > word.start;
    }).sort(function (left, right) {
      return left.start - right.start;
    });
  }

  function fallbackWordItemFromCaption(caption, word, index, total) {
    var start = Number(caption.start || 0);
    var end = Math.max(start + 0.25, Number(caption.end || 0));
    var step = (end - start) / Math.max(1, total);
    return {
      text: word,
      weight: Math.max(1, String(word || "").length),
      start: start + index * step,
      end: start + (index + 1) * step
    };
  }

  function buildSequentialWordItems(caption, wordTexts, timedWords, cursor) {
    var items = [];
    var nextCursor = cursor || 0;

    wordTexts.forEach(function (word, index) {
      if (nextCursor < timedWords.length && timedWords[nextCursor]) {
        var timing = timedWords[nextCursor];
        items.push({
          text: word,
          weight: Math.max(1, String(word || "").length),
          start: Number(timing.start),
          end: Math.max(Number(timing.start) + 0.08, Number(timing.end))
        });
        nextCursor += 1;
        return;
      }

      items.push(fallbackWordItemFromCaption(caption, word, index, wordTexts.length));
    });

    return {
      items: items,
      nextCursor: nextCursor
    };
  }

  function isWordHighlightStyle() {
    return hasManualHighlightControls() || ["Emphasis", "Karaoke"].indexOf(state.mogrtStyle) !== -1;
  }

  function hasManualHighlightControls() {
    return [
      "Block",
      "Clean",
      "Glitch",
      "Marker",
      "Motion Blur",
      "Mr Beast",
      "Spinning",
      "Tiktok",
      "Typewriter"
    ].indexOf(state.mogrtStyle) !== -1;
  }

  function buildMogrtPresetPayload() {
    updatePresetFromControls({ skipRender: true });
    var preset = copy(state.preset);
    preset.forceFontOverride = !!state.styleOverride;
    preset.forceColorOverride = !!state.styleOverride;
    return preset;
  }

  function buildOverlayPresetPayload() {
    updatePresetFromControls({ skipRender: true });
    var preset = copy(state.preset);
    preset.wordsPerScreen = clampWordsPerScreen(state.wordsPerScreen);
    preset.styleName = getPresetMogrtStyle(state.preset) || state.mogrtStyle;
    preset.ratio = state.mogrtRatio;
    preset.karaokeCaptions = buildKaraokeOverlayCaptions();
    return preset;
  }

  function buildKaraokeOverlayCaptions() {
    var maxWords = clampWordsPerScreen(state.wordsPerScreen);
    var clipDuration = Number(state.latestClipDurationSeconds || 0);
    var timedWords = getGlobalTimedWords();
    var cursor = 0;
    var output = [];

    state.captions.forEach(function (caption) {
      var clean = String(getRawTimelineCaptionText(caption) || "").replace(/\s+/g, " ").trim();
      var wordTexts = clean ? clean.split(" ").filter(Boolean) : [];
      var sequential = timedWords.length
        ? buildSequentialWordItems(caption, wordTexts, timedWords, cursor)
        : { items: buildEditorWordItems(caption, wordTexts), nextCursor: cursor };
      var wordItems = sequential.items;
      cursor = sequential.nextCursor;

      if (caption.hidden) {
        return;
      }

      splitWordItemsBySmartLimit(wordItems, maxWords).forEach(function (group) {
        if (!group.length) {
          return;
        }

        var start = Math.max(0, Number(group[0].start || 0));
        var end = Math.max(start + 0.18, Number(group[group.length - 1].end || start + 0.18));
        if (clipDuration > 0) {
          if (start >= clipDuration) {
            return;
          }
          end = Math.min(end, clipDuration);
        }

        var outputWords = group.map(function (word) {
          var wordStart = Math.max(start, Number(word.start || start));
          var wordEnd = Math.max(wordStart + 0.08, Number(word.end || wordStart + 0.08));
          if (clipDuration > 0) {
            if (wordStart >= clipDuration) {
              return null;
            }
            wordEnd = Math.min(wordEnd, clipDuration);
          }
          if (wordEnd <= wordStart) {
            return null;
          }
          return {
            text: word.text,
            start: wordStart,
            end: wordEnd
          };
        }).filter(Boolean);

        output.push({
          start: start,
          end: end,
          text: group.map(function (word) {
            return word.text;
          }).join(" "),
          words: outputWords
        });
      });
    });

    return output.sort(function (left, right) {
      return left.start - right.start;
    }).filter(function (caption) {
      return caption.words.length > 0 && caption.end > caption.start;
    });
  }

  function buildKaraokeOverlayCaptionsLegacy() {
    return state.captions.filter(function (caption) {
      return !caption.hidden;
    }).map(function (caption) {
      var clean = String(getRawTimelineCaptionText(caption) || "").replace(/\s+/g, " ").trim();
      var wordTexts = clean ? clean.split(" ").filter(Boolean) : [];
      var wordItems = buildEditorWordItems(caption, wordTexts);
      return {
        start: Number(caption.start || 0),
        end: Number(caption.end || 0),
        text: clean,
        words: wordItems.map(function (word) {
          return {
            text: word.text,
            start: Number(word.start),
            end: Number(word.end)
          };
        })
      };
    }).filter(function (caption) {
      return caption.words.length > 0;
    });
  }

  function clampWordsPerScreen(value) {
    var parsed = Math.round(Number(value || 3));
    if (!isFinite(parsed)) {
      parsed = 3;
    }
    return Math.max(1, Math.min(6, parsed));
  }

  function formatMogrtCaptionText(text) {
    var clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) {
      return "";
    }
    var maxLine = state.mogrtStyle === "Arch" || state.mogrtStyle === "Spinning" ? 14 : 18;
    var words = clean.split(" ");
    var lines = [""];
    words.forEach(function (word) {
      var index = lines.length - 1;
      var next = lines[index] ? lines[index] + " " + word : word;
      if (next.length > maxLine && lines.length < 2) {
        lines.push(word);
      } else {
        lines[index] = next;
      }
    });
    return lines.join("\r");
  }

  function buildCaptioneerPresets() {
    return [
      {
        id: "custom-uncali-testimonial",
        name: "Uncalı Testimonial",
        previewText: "Altyazı önizlemesi",
        description: "Beyaz metin, turkuaz kelime vurgusu.",
        fontFamily: "Inter",
        primaryColor: "#ffffff",
        accentColor: "#49d9ff",
        strokeColor: "#000000",
        shadowColor: "#000000",
        boxColor: "#000000",
        strokeWidth: 5,
        fontSize: 56,
        animation: "none",
        boxEnabled: false,
        shadowEnabled: true,
        positionX: 0,
        positionY: 76,
        scale: 1,
        letterCase: "as-typed"
      },
      {
        id: "custom-duygu-aksoy",
        name: "Duygu Aksoy",
        previewText: "Altyazı önizlemesi",
        description: "Beyaz metin, sıcak sarı vurgu.",
        fontFamily: "Inter",
        primaryColor: "#ffffff",
        accentColor: "#ffc94a",
        strokeColor: "#000000",
        shadowColor: "#000000",
        boxColor: "#000000",
        strokeWidth: 5,
        fontSize: 56,
        animation: "none",
        boxEnabled: false,
        shadowEnabled: true,
        positionX: 0,
        positionY: 76,
        scale: 1,
        letterCase: "as-typed"
      },
      {
        id: "custom-isin-dental",
        name: "ışın dental",
        previewText: "Altyazı önizlemesi",
        description: "Diş kliniği için temiz mavi vurgu.",
        fontFamily: "Inter",
        primaryColor: "#ffffff",
        accentColor: "#8fe9ff",
        strokeColor: "#000000",
        shadowColor: "#000000",
        boxColor: "#000000",
        strokeWidth: 5,
        fontSize: 56,
        animation: "none",
        boxEnabled: false,
        shadowEnabled: true,
        positionX: 0,
        positionY: 76,
        scale: 1,
        letterCase: "as-typed"
      },
      {
        id: "custom-thera",
        name: "thera",
        previewText: "Altyazı önizlemesi",
        description: "Yumuşak sağlık/terapi tonu.",
        fontFamily: "Inter",
        primaryColor: "#ffffff",
        accentColor: "#8fffe0",
        strokeColor: "#000000",
        shadowColor: "#000000",
        boxColor: "#000000",
        strokeWidth: 5,
        fontSize: 56,
        animation: "none",
        boxEnabled: false,
        shadowEnabled: true,
        positionX: 0,
        positionY: 76,
        scale: 1,
        letterCase: "as-typed"
      },
      {
        id: "custom-remax",
        name: "RE/MAX",
        previewText: "Altyazı önizlemesi",
        description: "Kurumsal mavi vurgu.",
        fontFamily: "Inter",
        primaryColor: "#ffffff",
        accentColor: "#2f80ff",
        strokeColor: "#000000",
        shadowColor: "#000000",
        boxColor: "#000000",
        strokeWidth: 5,
        fontSize: 56,
        animation: "none",
        boxEnabled: false,
        shadowEnabled: true,
        positionX: 0,
        positionY: 76,
        scale: 1,
        letterCase: "as-typed"
      },
      {
        id: "custom-mahru",
        name: "mahru",
        previewText: "Altyazı önizlemesi",
        description: "Mor/pembe vurgu.",
        fontFamily: "Inter",
        primaryColor: "#ffffff",
        accentColor: "#e889ff",
        strokeColor: "#000000",
        shadowColor: "#000000",
        boxColor: "#000000",
        strokeWidth: 5,
        fontSize: 56,
        animation: "none",
        boxEnabled: false,
        shadowEnabled: true,
        positionX: 0,
        positionY: 76,
        scale: 1,
        letterCase: "as-typed"
      },
      {
        id: "custom-syk",
        name: "syk",
        previewText: "Altyazı önizlemesi",
        description: "Lime yeşil vurgu.",
        fontFamily: "Inter",
        primaryColor: "#ffffff",
        accentColor: "#a6ff00",
        strokeColor: "#000000",
        shadowColor: "#000000",
        boxColor: "#000000",
        strokeWidth: 5,
        fontSize: 56,
        animation: "none",
        boxEnabled: false,
        shadowEnabled: true,
        positionX: 0,
        positionY: 76,
        scale: 1,
        letterCase: "as-typed"
      },
      {
        id: "custom-feta",
        name: "feta",
        previewText: "Altyazı önizlemesi",
        description: "Sıcak sarı/marka tonu.",
        fontFamily: "Inter",
        primaryColor: "#ffffff",
        accentColor: "#ffe66d",
        strokeColor: "#000000",
        shadowColor: "#000000",
        boxColor: "#000000",
        strokeWidth: 5,
        fontSize: 56,
        animation: "none",
        boxEnabled: false,
        shadowEnabled: true,
        positionX: 0,
        positionY: 76,
        scale: 1,
        letterCase: "as-typed"
      },
      {
        id: "custom-nfs",
        name: "nfs",
        previewText: "Altyazı önizlemesi",
        description: "Mavi vurgulu sosyal medya stili.",
        fontFamily: "Inter",
        primaryColor: "#ffffff",
        accentColor: "#55b8ff",
        strokeColor: "#000000",
        shadowColor: "#000000",
        boxColor: "#000000",
        strokeWidth: 5,
        fontSize: 56,
        animation: "none",
        boxEnabled: false,
        shadowEnabled: true,
        positionX: 0,
        positionY: 76,
        scale: 1,
        letterCase: "as-typed"
      },
      {
        id: "custom-miyimp",
        name: "mıyımp",
        previewText: "Altyazı önizlemesi",
        description: "Pembe/mor marka vurgusu.",
        fontFamily: "Inter",
        primaryColor: "#ffffff",
        accentColor: "#ff8bdc",
        strokeColor: "#000000",
        shadowColor: "#000000",
        boxColor: "#000000",
        strokeWidth: 5,
        fontSize: 56,
        animation: "none",
        boxEnabled: false,
        shadowEnabled: true,
        positionX: 0,
        positionY: 76,
        scale: 1,
        letterCase: "as-typed"
      }
    ].map(function (preset, index) {
      preset.mogrtStyle = preset.name;
      preset.isCaptioneer = false;
      preset.badge = "Özel";
      preset.order = index;
      return preset;
    });
  }

  function getPresetForMogrtStyle(style) {
    return copy(
      getAllPresets().filter(function (preset) {
        return getPresetMogrtStyle(preset) === style || preset.name === style;
      })[0] || presets[0]
    );
  }

  function getMogrtDescription(style) {
    var descriptions = {
      Clean: "Temiz, okunaklı röportaj altyazısı.",
      Arch: "Kavisli, hareketli vurgu.",
      Block: "Blok zeminli sosyal medya stili.",
      Comic: "Eğlenceli çizgi roman hissi.",
      Emphasis: "Kelime vurgusu yüksek.",
      Glitch: "Dijital glitch hareketi.",
      Karaoke: "Karaoke hissi ve vurgu.",
      Marker: "Marker vurgulu görünüm.",
      "Motion Blur": "Hızlı giriş çıkış hissi.",
      "Mr Beast": "Büyük, agresif viral stil.",
      Obviously: "Kalın ve direkt anlatım.",
      Slant: "Eğik, dinamik başlık stili.",
      Slide: "Kayarak gelen altyazı.",
      Spinning: "Dönen hareketli altyazı.",
      Tiktok: "Kısa video altyazı dili.",
      Typewriter: "Yazı makinesi efekti.",
      Akira: "Sinematik anime hissi."
    };
    return descriptions[style] || "Animasyonlu MOGRT altyazı.";
  }

  function getMogrtPreviewPath(ratio, style, extension) {
    var ratioPrefix = ratio === "Portrait" ? "9-16" : ratio === "Landscape" ? "16-9" : "1-1";
    return (
      "./assets/mogrt-previews/captioneer/" +
      ratio +
      "/" +
      ratioPrefix +
      "-" +
      String(style || "Clean").replace(/\s+/g, "-") +
      "-Subtitles." +
      extension
    );
  }

  function mapAnimationToMogrtStyle(animation) {
    if (animation === "karaoke") {
      return "Karaoke";
    }
    if (animation === "fade") {
      return "Clean";
    }
    if (animation === "slide-up") {
      return "Slide";
    }
    return "Clean";
  }

  function mapMogrtStyleToAnimation(style) {
    if (style === "Karaoke") {
      return "karaoke";
    }
    if (style === "Slide" || style === "Slant") {
      return "slide-up";
    }
    if (style === "Clean") {
      return "fade";
    }
    return "pop";
  }

  function getOutputModeLabel(mode) {
    if (mode === "srt") {
      return "Premiere altyazısı";
    }
    if (mode === "overlay") {
      return "Render edilmiş altyazı";
    }
    return "Animasyonlu altyazı";
  }

  function updateCharacterEstimate() {
    var total = state.captions.reduce(function (sum, caption) {
      return sum + caption.text.length + (caption.translation || "").length;
    }, 0);
    els.charInput.value = total;
    renderCost();
  }

  function renderPreviewTextOptions() {
    if (!els.previewTextSelect) {
      return;
    }
    var selected = els.previewTextSelect.value;
    els.previewTextSelect.innerHTML = "";
    state.captions.slice(0, 40).forEach(function (caption, index) {
      addOption(els.previewTextSelect, String(index), caption.text || "Altyazı " + (index + 1));
    });
    if (!state.captions.length) {
      addOption(els.previewTextSelect, "sample", "Altyazı önizlemesi");
    }
    els.previewTextSelect.value = state.captions.length
      ? selected && selected !== "sample" && state.captions[Number(selected)]
        ? selected
        : "0"
      : "sample";
  }

  function getPreviewText() {
    if (els.previewTextSelect && state.captions.length) {
      var index = Number(els.previewTextSelect.value || 0);
      if (state.captions[index]) {
        return state.captions[index].text || state.preset.previewText || "Altyazı önizlemesi";
      }
    }
    return state.preset.previewText || "Altyazı önizlemesi";
  }

  function previewTextInCurrentFrame() {
    renderPresetPreview();
    writeLog("Önizleme metni güncellendi. Zaman çizelgesine uyguladığında aynı stil motoruyla render edilecek.");
  }

  function previewTextStyle(preset, scale, options) {
    var previewScale = Number(scale || 1);
    var compact = !!(options && options.compact);
    var size = Math.max(10, Math.round(Number(preset.fontSize || 56) * previewScale));
    var stroke = Math.max(0, Math.round(Number(preset.strokeWidth || 0) * previewScale));
    if (compact) {
      stroke = 0;
    }
    var strokeColor = preset.strokeColor || "#000000";
    var shadowLift = Math.max(1, Math.round(2 * previewScale));
    var shadowDrop = Math.max(1, Math.round(5 * previewScale));
    var shadowBlur = Math.max(2, Math.round(12 * previewScale));
    var shadow = preset.shadowEnabled === false
      ? "none"
      : compact
        ? "0 1px 2px rgba(0,0,0,.65)"
        : "0 " + shadowLift + "px 0 " + strokeColor + ",0 " + shadowDrop + "px " + shadowBlur + "px rgba(0,0,0,.62)";
    var transform = preset.animation === "pop" ? "scale(1.04)" : "none";
    var boxPadY = Math.max(2, Math.round(4 * previewScale));
    var boxPadX = Math.max(4, Math.round(9 * previewScale));
    var box = preset.boxEnabled
      ? "background:" +
        (preset.boxColor || "#ffffff") +
        ";border-radius:8px;padding:" +
        boxPadY +
        "px " +
        boxPadX +
        "px;box-decoration-break:clone;-webkit-box-decoration-break:clone;"
      : "";
    return (
      "font-family:" +
      cssString(preset.fontFamily || "Inter") +
      ";font-size:" +
      size +
      "px;font-weight:900;line-height:1.05;color:" +
      (preset.primaryColor || "#ffffff") +
      ";-webkit-text-stroke:" +
      stroke +
      "px " +
      strokeColor +
      ";paint-order:stroke fill;" +
      "-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;" +
      ";text-shadow:" +
      shadow +
      ";transform:" +
      transform +
      ";" +
      box
    );
  }

  function previewBackgroundStyle(preset) {
    return "background:#7e7e80;border-color:" + (preset.accentColor || "#a6ff00") + ";";
  }

  function saveCurrentTemplate() {
    var name = window.prompt("Stil adı", state.preset.name + " Kopya");
    if (!name) {
      return;
    }
    var preset = copy(state.preset);
    preset.id = "custom-" + Date.now();
    preset.name = name;
    preset.displayName = name;
    preset.mogrtStyle = getPresetMogrtStyle(state.preset) || state.mogrtStyle || "Clean";
    preset.isCaptioneer = false;
    preset.badge = "Özel";
    state.customPresets.push(preset);
    saveCustomPresets();
    state.preset = copy(preset);
    state.mogrtStyle = getPresetMogrtStyle(preset);
    renderMogrtOptions();
    renderPresets();
    renderPresetPreview();
    writeLog("Stil kaydedildi: " + name);
  }

  function updateCurrentTemplate() {
    var updated = false;
    state.customPresets = (state.customPresets || []).map(function (preset) {
      if (preset.id === state.preset.id) {
        updated = true;
        var next = copy(state.preset);
        next.mogrtStyle = getPresetMogrtStyle(next) || state.mogrtStyle || "Clean";
        return next;
      }
      return preset;
    });
    if (!updated) {
      saveCurrentTemplate();
      return;
    }
    saveCustomPresets();
    renderPresets();
    writeLog("Stil güncellendi: " + state.preset.name);
  }

  function loadCustomPresets() {
    try {
      var raw = window.localStorage.getItem("capiton.customPresets");
      var parsed = raw ? JSON.parse(raw) : [];
      return parsed instanceof Array
        ? parsed.filter(function (preset) {
            return !!(preset && preset.mogrtStyle);
          })
        : [];
    } catch (error) {
      return [];
    }
  }

  function saveCustomPresets() {
    try {
      window.localStorage.setItem("capiton.customPresets", JSON.stringify(state.customPresets || []));
    } catch (error) {}
  }

  function transformTextCase(text, mode) {
    var value = String(text || "");
    if (mode === "uppercase") {
      return value.toLocaleUpperCase("tr-TR");
    }
    if (mode === "lowercase") {
      return value.toLocaleLowerCase("tr-TR");
    }
    if (mode === "title") {
      return value.replace(/\S+/g, function (word) {
        return word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1).toLocaleLowerCase("tr-TR");
      });
    }
    return value;
  }

  function cssString(value) {
    return '"' + String(value || "").replace(/"/g, "") + '"';
  }

  function detectLanguageDraft(track, languageMode) {
    var selected = findLanguage(languageMode);
    if (selected && selected.code === "auto") {
      return { code: "auto", label: selected.label, confidence: 1 };
    }
    if (selected) {
      return { code: selected.code, label: selected.label, confidence: 1 };
    }
    if (languageMode === "tr") {
      return { code: "tr", label: "Türkçe", confidence: 1 };
    }
    if (languageMode === "en") {
      return { code: "en", label: "İngilizce", confidence: 1 };
    }
    var name = ((track && track.name) || "").toLowerCase();
    if (name.indexOf("en") > -1 || name.indexOf("english") > -1 || name.indexOf("ingilizce") > -1) {
      return { code: "en", label: "İngilizce", confidence: 0.82 };
    }
    return { code: "tr", label: "Türkçe", confidence: 0.78 };
  }

  function findLanguage(code) {
    return whisperLanguages.filter(function (language) {
      return language.code === code;
    })[0] || null;
  }

  function findTranslationLanguage(code) {
    return translationLanguages.filter(function (language) {
      return language.code === code;
    })[0] || null;
  }

  function getCurrentSourceLanguageForTranslation() {
    var detected = state.detectedLanguage && state.detectedLanguage.code ? state.detectedLanguage.code : "";
    if (detected && detected !== "auto") {
      return detected;
    }
    var selected = els.languageMode && els.languageMode.value ? els.languageMode.value : "auto";
    return selected || "auto";
  }

  function languageLabel(code) {
    var language = findLanguage(code) || findTranslationLanguage(code);
    return language ? language.label : String(code || "auto").toUpperCase();
  }

  function draftTranslate(text, targetLang) {
    if (targetLang !== "en") {
      return text;
    }
    return "[EN taslak] " + text;
  }

  function parseSrt(input) {
    var normalized = input.replace(/\r/g, "").replace(/^WEBVTT[^\n]*\n+/i, "").trim();
    if (!normalized) {
      return [];
    }
    return normalized
      .split(/\n{2,}/)
      .map(function (block) {
        var lines = block.trim().split("\n");
        var timeLineIndex = -1;
        lines.forEach(function (line, index) {
          if (timeLineIndex === -1 && line.indexOf("-->") > -1) {
            timeLineIndex = index;
          }
        });
        var parts = (lines[timeLineIndex] || "").split("-->");
        return {
          id: uid(),
          start: parseTimestamp((parts[0] || "").trim()),
          end: parseTimestamp((parts[1] || "").trim()),
          text: lines.slice(timeLineIndex + 1).join(" ").trim(),
          translation: ""
        };
      })
      .filter(function (caption) {
        return isFinite(caption.start) && isFinite(caption.end);
      });
  }

  function toSrt(captions, mode) {
    return captions
      .map(function (caption, index) {
        var lines = [String(index + 1), formatTimestamp(caption.start) + " --> " + formatTimestamp(caption.end)];
        if (mode === "translation") {
          lines.push(caption.translation || caption.text);
        } else if (mode === "bilingual") {
          lines.push(caption.text);
          if (caption.translation) {
            lines.push(caption.translation);
          }
        } else {
          lines.push(caption.text);
        }
        return lines.join("\n");
      })
      .join("\n\n");
  }

  function parseTimestamp(value) {
    var match = value.match(/(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/);
    if (!match) {
      return NaN;
    }
    return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number((match[4] + "000").slice(0, 3)) / 1000;
  }

  function formatTimestamp(value) {
    var safe = Math.max(0, value || 0);
    var hours = Math.floor(safe / 3600);
    var minutes = Math.floor((safe % 3600) / 60);
    var seconds = Math.floor(safe % 60);
    var millis = Math.round((safe - Math.floor(safe)) * 1000);
    return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds) + "," + pad3(millis);
  }

  function formatShortTime(value) {
    return pad(Math.floor(value / 60)) + ":" + pad(Math.floor(value % 60));
  }

  function addOption(select, value, text) {
    var option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
  }

  function findTrack(id) {
    return state.audioTracks.filter(function (track) {
      return track.id === id;
    })[0] || null;
  }

  function fallbackAudioTrack() {
    return {
      id: "A1",
      index: 1,
      name: "Zaman çizelgesi medyası",
      enabled: true,
      clipCount: 1
    };
  }

  function maxCaptionEnd(captions) {
    return captions.reduce(function (max, caption) {
      return Math.max(max, Number(caption.end || 0));
    }, 0);
  }

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function pad(value) {
    var text = String(value);
    return text.length < 2 ? "0" + text : text;
  }

  function pad3(value) {
    var text = String(value);
    while (text.length < 3) {
      text = "0" + text;
    }
    return text;
  }

  function uid() {
    return "id-" + Date.now() + "-" + Math.round(Math.random() * 1000000);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeForJsx(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function writeLog(message) {
    els.logOutput.textContent = message;
  }
})();
