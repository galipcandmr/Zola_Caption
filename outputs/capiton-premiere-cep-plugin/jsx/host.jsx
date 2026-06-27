function capitonJson(value) {
  try {
    return capitonSerializeJson(value);
  } catch (error) {
    return "{\"ok\":false,\"message\":\"JSON çıkışı oluşturulamadı: " + capitonEscapeJsonString(error.toString()) + "\"}";
  }
}

function capitonSerializeJson(value) {
  var type = typeof value;

  if (value === null || value === undefined) {
    return "null";
  }

  if (type === "string") {
    return "\"" + capitonEscapeJsonString(value) + "\"";
  }

  if (type === "number") {
    return isFinite(value) ? String(value) : "0";
  }

  if (type === "boolean") {
    return value ? "true" : "false";
  }

  if (value instanceof Array) {
    var items = [];
    for (var i = 0; i < value.length; i += 1) {
      items.push(capitonSerializeJson(value[i]));
    }
    return "[" + items.join(",") + "]";
  }

  var props = [];
  for (var key in value) {
    if (!value.hasOwnProperty(key)) {
      continue;
    }
    props.push("\"" + capitonEscapeJsonString(key) + "\":" + capitonSerializeJson(value[key]));
  }
  return "{" + props.join(",") + "}";
}

function capitonEscapeJsonString(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

function capitonOkMediaJson(trackId, sequence, media) {
  return (
    "{\"ok\":true," +
    "\"trackId\":\"" + capitonEscapeJsonString(trackId || "A1") + "\"," +
    "\"clipIndex\":" + Number(media.clipIndex || 0) + "," +
    "\"sequenceName\":\"" + capitonEscapeJsonString(sequence && sequence.name ? sequence.name : "Aktif sekans") + "\"," +
    "\"mediaPath\":\"" + capitonEscapeJsonString(media.mediaPath) + "\"," +
    "\"clipName\":\"" + capitonEscapeJsonString(media.clipName || "") + "\"," +
    "\"timelineStartSeconds\":" + Number(media.timelineStartSeconds || 0) + "," +
    "\"timelineEndSeconds\":" + Number(media.timelineEndSeconds || 0) + "," +
    "\"sourceInSeconds\":" + Number(media.sourceInSeconds || 0) + "," +
    "\"sourceOutSeconds\":" + Number(media.sourceOutSeconds || 0) + "," +
    "\"fallback\":true," +
    "\"message\":\"" + capitonEscapeJsonString((trackId || "A1") + " için zaman çizelgesi medyası kaynak alındı: " + media.mediaPath) + "\"" +
    "}"
  );
}

function capitonListAudioTracks() {
  try {
    if (!app.project || !app.project.activeSequence) {
      return capitonJson({
        ok: false,
        tracks: [],
        message: "Aktif sekans bulunamadı. Premiere zaman çizelgesinde bir sekans aç."
      });
    }

    var sequence = app.project.activeSequence;
    var read = capitonReadAudioTracks(sequence);

    return capitonJson({
      ok: true,
      tracks: read.tracks,
      sequenceName: sequence.name || "Aktif sekans",
      debug: read.debug,
      message:
        (sequence.name || "Aktif sekans") +
        " sekansı içinde " +
        read.tracks.length +
        " aktif ses kanalı bulundu."
    });
  } catch (error) {
    return capitonJson({
      ok: false,
      tracks: [],
      message: "Ses kanalı okunamadı: " + error.toString()
    });
  }
}

function capitonReadAudioTracks(sequence) {
  var tracks = [];
  var debug = [];
  var audioTracks = sequence.audioTracks;

  if (!audioTracks) {
    return { tracks: tracks, debug: "sequence.audioTracks yok" };
  }

  var declaredCount = capitonFirstNumber([
    capitonSafeNumber(audioTracks, "numTracks"),
    capitonSafeNumber(audioTracks, "numItems"),
    capitonSafeNumber(audioTracks, "length")
  ]);
  debug.push("declared=" + declaredCount);

  var scanLimit = declaredCount > 0 ? declaredCount : 32;
  var seen = {};

  for (var i = 0; i < scanLimit; i += 1) {
    var track = capitonGetCollectionItem(audioTracks, i);
    if (!track && declaredCount > 0) {
      debug.push("A" + (i + 1) + "=null");
      continue;
    }

    if (!track) {
      continue;
    }

    var clipCount = capitonGetClipCount(track);
    var hasUsefulTrack = clipCount > 0;

    if (!hasUsefulTrack) {
      debug.push("A" + (i + 1) + "=empty");
      continue;
    }

    var id = "A" + (i + 1);
    if (seen[id]) {
      continue;
    }

    seen[id] = true;
    tracks.push({
      id: id,
      index: i + 1,
      name: capitonGetTrackName(track, i),
      enabled: true,
      clipCount: clipCount
    });
  }

  if (tracks.length === 0 && declaredCount === 0) {
    var fallbackCount = capitonInferAudioTrackCountFromQe();
    debug.push("qeFallback=" + fallbackCount);
    for (var j = 0; j < fallbackCount; j += 1) {
      tracks.push({
        id: "A" + (j + 1),
        index: j + 1,
        name: "Ses Kanalı " + (j + 1),
        enabled: true,
        clipCount: 0
      });
    }
  }

  if (tracks.length === 0) {
    var linkedMedia = capitonFindFirstTimelineMedia(sequence);
    debug.push("linkedMediaFallback=" + (linkedMedia ? "yes" : "no"));
    if (linkedMedia) {
      tracks.push({
        id: "A1",
        index: 1,
        name: "A1 - Zaman çizelgesi medyası",
        enabled: true,
        clipCount: 1,
        fallbackMediaPath: linkedMedia.mediaPath
      });
    }
  }

  debug.push("found=" + tracks.length);
  return { tracks: tracks, debug: debug.join(", ") };
}

function capitonGetCollectionItem(collection, index) {
  var item = null;

  if (!item) {
    try {
      item = collection.getTrackAt(index);
    } catch (errorTrack) {}
  }

  if (!item) {
    try {
      item = collection.getItemAt(index);
    } catch (errorItem) {}
  }

  if (!item) {
    try {
      item = collection[index];
    } catch (errorA) {}
  }

  if (!item) {
    try {
      item = collection(index);
    } catch (errorB) {}
  }

  return item;
}

function capitonGetClipCount(track) {
  if (!track || !track.clips) {
    return 0;
  }

  var count = capitonFirstNumber([
    capitonSafeNumber(track.clips, "numItems"),
    capitonSafeNumber(track.clips, "length")
  ]);

  if (count > 0) {
    return count;
  }

  var bruteCount = 0;
  for (var i = 0; i < 256; i += 1) {
    var clip = capitonGetCollectionItem(track.clips, i);
    if (!clip) {
      continue;
    }
    bruteCount += 1;
  }
  return bruteCount;
}

function capitonHasTrackShape(track) {
  try {
    return !!(track && (track.clips || track.name !== undefined));
  } catch (error) {
    return false;
  }
}

function capitonGetTrackName(track, index) {
  try {
    if (track && track.name) {
      return String(track.name);
    }
  } catch (error) {}

  return "Ses Kanalı " + (index + 1);
}

function capitonInferAudioTrackCountFromQe() {
  try {
    app.enableQE();
    if (!qe || !qe.project) {
      return 0;
    }
    var qeSequence = qe.project.getActiveSequence();
    if (!qeSequence) {
      return 0;
    }

    var count = capitonFirstNumber([
      capitonSafeNumber(qeSequence, "numAudioTracks"),
      capitonSafeNumber(qeSequence, "audioTracks")
    ]);
    return count;
  } catch (error) {
    return 0;
  }
}

function capitonFindFirstTimelineMedia(sequence) {
  var audioMedia = capitonFindFirstMediaInTracks(sequence.audioTracks, 32);
  if (audioMedia) {
    audioMedia.kind = "audio";
    return audioMedia;
  }

  var videoMedia = capitonFindFirstMediaInTracks(sequence.videoTracks, 32);
  if (videoMedia) {
    videoMedia.kind = "video";
    return videoMedia;
  }

  return null;
}

function capitonFindFirstMediaInTracks(tracks, maxTracks) {
  if (!tracks) {
    return null;
  }

  var count = capitonFirstNumber([
    capitonSafeNumber(tracks, "numTracks"),
    capitonSafeNumber(tracks, "numItems"),
    capitonSafeNumber(tracks, "length"),
    maxTracks || 32
  ]);

  for (var i = 0; i < count; i += 1) {
    var track = capitonGetCollectionItem(tracks, i);
    if (!track || !track.clips) {
      continue;
    }

    var clips = track.clips;
    var clipCount = capitonFirstNumber([
      capitonSafeNumber(clips, "numItems"),
      capitonSafeNumber(clips, "length"),
      256
    ]);

    for (var j = 0; j < clipCount; j += 1) {
      var clip = capitonGetCollectionItem(clips, j);
      if (!clip || !clip.projectItem) {
        continue;
      }

      var mediaPath = "";
      try {
        mediaPath = clip.projectItem.getMediaPath();
      } catch (errorA) {}

      if (mediaPath) {
        return {
          trackIndex: i + 1,
          clipIndex: j,
          clipName: clip.name || "",
          mediaPath: mediaPath,
          timelineStartSeconds: capitonTimeSeconds(clip.start),
          timelineEndSeconds: capitonTimeSeconds(clip.end),
          sourceInSeconds: capitonTimeSeconds(clip.inPoint),
          sourceOutSeconds: capitonTimeSeconds(clip.outPoint)
        };
      }
    }
  }

  return null;
}

function capitonSafeNumber(object, propertyName) {
  try {
    var value = object[propertyName];
    if (typeof value === "number" && value >= 0) {
      return value;
    }
    if (value !== undefined && value !== null && !isNaN(Number(value))) {
      return Number(value);
    }
  } catch (error) {}

  return 0;
}

function capitonFirstNumber(values) {
  for (var i = 0; i < values.length; i += 1) {
    if (values[i] && values[i] > 0) {
      return values[i];
    }
  }
  return 0;
}

function capitonGetSequenceInfo() {
  try {
    if (!app.project || !app.project.activeSequence) {
      return capitonJson({ ok: false, message: "Aktif sekans yok." });
    }

    var sequence = app.project.activeSequence;
    return capitonJson({
      ok: true,
      name: sequence.name || "Aktif sekans",
      audioTrackCount: sequence.audioTracks ? sequence.audioTracks.numTracks : 0,
      videoTrackCount: sequence.videoTracks ? sequence.videoTracks.numTracks : 0
    });
  } catch (error) {
    return capitonJson({ ok: false, message: error.toString() });
  }
}

function capitonGetAudioSource(trackId) {
  try {
    if (!app.project || !app.project.activeSequence) {
      return "{\"ok\":false,\"message\":\"Aktif sekans bulunamadı.\"}";
    }

    var sequence = app.project.activeSequence;
    var index = capitonTrackIdToIndex(trackId);
    var audioTracks = sequence.audioTracks;
    var track = audioTracks ? capitonGetCollectionItem(audioTracks, index) : null;

    if (!track) {
      var fallbackMedia = capitonFindFirstTimelineMediaSimple(sequence);
      if (fallbackMedia) {
        return capitonOkMediaJson(trackId || "A1", sequence, fallbackMedia);
      }

      return "{\"ok\":false,\"message\":\"Ses kanalı okunamadı ve zaman çizelgesi medyası bulunamadı.\"}";
    }

    var clips = track.clips;
    var scanLimit = capitonFirstNumber([
      capitonSafeNumber(clips, "numItems"),
      capitonSafeNumber(clips, "length"),
      256
    ]);

    for (var i = 0; i < scanLimit; i += 1) {
      var clip = capitonGetCollectionItem(clips, i);
      if (!clip || !clip.projectItem) {
        continue;
      }

      var mediaPath = "";
      try {
        mediaPath = clip.projectItem.getMediaPath();
      } catch (errorA) {}

      if (!mediaPath) {
        continue;
      }

      return capitonJson({
        ok: true,
        trackId: trackId,
        clipIndex: i,
        sequenceName: sequence.name || "Aktif sekans",
        mediaPath: mediaPath,
        clipName: clip.name || "",
        timelineStartSeconds: capitonTimeSeconds(clip.start),
        timelineEndSeconds: capitonTimeSeconds(clip.end),
        sourceInSeconds: capitonTimeSeconds(clip.inPoint),
        sourceOutSeconds: capitonTimeSeconds(clip.outPoint),
        message: trackId + " içindeki medya bulundu: " + mediaPath
      });
    }

    return capitonJson({
      ok: false,
      message: trackId + " içinde okunabilir medya yolu olan klip bulunamadı."
    });
  } catch (error) {
    return capitonJson({
      ok: false,
      message: "Ses kaynağı okunamadı: " + error.toString()
    });
  }
}

function capitonTrackIdToIndex(trackId) {
  var text = String(trackId || "A1").replace("a", "A");
  var numberText = text.split("A").join("");
  var value = Number(numberText);
  if (!value || isNaN(value)) {
    value = 1;
  }
  return Math.max(0, value - 1);
}

function capitonFindFirstTimelineMediaSimple(sequence) {
  var media = capitonFindFirstMediaInTracks(sequence.audioTracks, 32);
  if (media) {
    return media;
  }
  return capitonFindFirstMediaInTracks(sequence.videoTracks, 32);
}

function capitonImportCaptionFile(srtPath, startSeconds) {
  try {
    if (!srtPath) {
      return capitonJson({ ok: false, message: "SRT yolu boş." });
    }

    if (!app.project || !app.project.activeSequence) {
      return capitonJson({ ok: false, message: "Aktif sekans bulunamadı." });
    }

    var imported = app.project.importFiles([srtPath], true, app.project.rootItem, false);
    var item = capitonFindProjectItemByMediaPath(app.project.rootItem, srtPath);
    var sequence = app.project.activeSequence;
    var addedToTimeline = false;
    var timelineMessage = "";
    var safeStartSeconds = Number(startSeconds || 0);
    if (isNaN(safeStartSeconds) || safeStartSeconds < 0) {
      safeStartSeconds = 0;
    }

    if (item && sequence && sequence.createCaptionTrack) {
      try {
        sequence.createCaptionTrack(item, safeStartSeconds, 0);
        addedToTimeline = true;
      } catch (captionErrorA) {
        try {
          sequence.createCaptionTrack(item, safeStartSeconds);
          addedToTimeline = true;
        } catch (captionErrorB) {
          timelineMessage = " Altyazı kanalı otomatik eklenemedi: " + captionErrorB.toString();
        }
      }
    } else {
      timelineMessage = " Bu Premiere sürümünde createCaptionTrack API bulunamadı.";
    }

    return capitonJson({
      ok: !!imported,
      imported: !!imported,
      addedToTimeline: addedToTimeline,
      srtPath: srtPath,
      startSeconds: safeStartSeconds,
      message: addedToTimeline
        ? "SRT içe aktarıldı ve aktif sekansa " + safeStartSeconds + ". saniyeden altyazı kanalı olarak eklendi."
        : "SRT içe aktarıldı." + timelineMessage
    });
  } catch (error) {
    return capitonJson({
      ok: false,
      message: "Altyazı içe aktarılamadı: " + error.toString()
    });
  }
}

function capitonImportOverlayFile(mediaPath, startSeconds) {
  try {
    if (!mediaPath) {
      return capitonJson({ ok: false, message: "Görsel altyazı yolu boş." });
    }

    if (!app.project || !app.project.activeSequence) {
      return capitonJson({ ok: false, message: "Aktif sekans bulunamadı." });
    }

    var imported = app.project.importFiles([mediaPath], true, app.project.rootItem, false);
    var item = capitonFindProjectItemByMediaPath(app.project.rootItem, mediaPath);
    var sequence = app.project.activeSequence;
    var addedToTimeline = false;
    var timelineMessage = "";
    var safeStartSeconds = Number(startSeconds || 0);
    if (isNaN(safeStartSeconds) || safeStartSeconds < 0) {
      safeStartSeconds = 0;
    }

    if (item && sequence && sequence.videoTracks) {
      var trackIndex = 0;
      try {
        var videoCount = capitonFirstNumber([
          capitonSafeNumber(sequence.videoTracks, "numTracks"),
          capitonSafeNumber(sequence.videoTracks, "numItems"),
          capitonSafeNumber(sequence.videoTracks, "length")
        ]);
        trackIndex = videoCount > 1 ? 1 : 0;
      } catch (trackCountError) {}

      var targetTrack = capitonGetCollectionItem(sequence.videoTracks, trackIndex);
      if (!targetTrack) {
        targetTrack = capitonGetCollectionItem(sequence.videoTracks, 0);
      }

      if (targetTrack && targetTrack.overwriteClip) {
        try {
          targetTrack.overwriteClip(item, safeStartSeconds);
          addedToTimeline = true;
        } catch (overwriteError) {
          timelineMessage = " Görsel altyazı zaman çizelgesine eklenemedi: " + overwriteError.toString();
        }
      } else {
        timelineMessage = " Video kanalı overwriteClip API bulunamadı.";
      }
    } else {
      timelineMessage = " Sekans video kanalı okunamadı.";
    }

    return capitonJson({
      ok: !!imported,
      imported: !!imported,
      addedToTimeline: addedToTimeline,
      mediaPath: mediaPath,
      startSeconds: safeStartSeconds,
      message: addedToTimeline
        ? "Stilli görsel altyazı içe aktarıldı ve zaman çizelgesine eklendi."
        : "Görsel altyazı içe aktarıldı." + timelineMessage
    });
  } catch (error) {
    return capitonJson({
      ok: false,
      message: "Görsel altyazı içe aktarılamadı: " + error.toString()
    });
  }
}

function capitonRefreshOverlayFile(mediaPath) {
  try {
    if (!mediaPath) {
      return capitonJson({ ok: false, message: "Yenilenecek görsel altyazı yolu boş." });
    }

    if (!app.project) {
      return capitonJson({ ok: false, message: "Aktif proje bulunamadı." });
    }

    var item = capitonFindProjectItemByMediaPath(app.project.rootItem, mediaPath);
    if (!item) {
      return capitonJson({
        ok: false,
        mediaPath: mediaPath,
        message: "Görsel altyazı dosyası güncellendi ama Premiere proje öğesi bulunamadı. Zaman çizelgesi klibini elle yeniden bağlamak gerekebilir."
      });
    }

    var refreshed = false;
    try {
      if (item.refreshMedia) {
        item.refreshMedia();
        refreshed = true;
      }
    } catch (refreshError) {}

    if (!refreshed) {
      try {
        if (item.changeMediaPath) {
          item.changeMediaPath(mediaPath, true);
          refreshed = true;
        }
      } catch (changeErrorA) {
        try {
          item.changeMediaPath(mediaPath, 1);
          refreshed = true;
        } catch (changeErrorB) {}
      }
    }

    return capitonJson({
      ok: true,
      mediaPath: mediaPath,
      refreshed: refreshed,
      message: refreshed
        ? "Zaman çizelgesindeki mevcut görsel altyazı medyası yenilendi. Yazım düzeltmesi için yeni klip eklenmedi."
        : "Görsel altyazı dosyası güncellendi. Premiere önbelleği eski görünürse klibi kapat/aç veya sekansı yeniden aç."
    });
  } catch (error) {
    return capitonJson({
      ok: false,
      message: "Görsel altyazı yenilenemedi: " + error.toString()
    });
  }
}

function capitonReplaceOverlayFile(previousMediaPath, nextMediaPath, startSeconds) {
  try {
    if (!previousMediaPath || !nextMediaPath) {
      return capitonJson({ ok: false, message: "Yenilenecek veya yeni görsel altyazı yolu boş." });
    }

    if (!app.project) {
      return capitonJson({ ok: false, message: "Aktif proje bulunamadı." });
    }

    var item = capitonFindProjectItemByMediaPath(app.project.rootItem, previousMediaPath);
    if (!item) {
      var importedResult = capitonImportOverlayFile(nextMediaPath, startSeconds);
      try {
        var parsed = JSON.parse(importedResult);
        parsed.replaced = false;
        parsed.message = "Eski görsel altyazı proje öğesi bulunamadı; yeni altyazı zaman çizelgesine tekrar eklendi.";
        return capitonJson(parsed);
      } catch (parseError) {
        return importedResult;
      }
    }

    var replaced = false;
    try {
      if (item.changeMediaPath) {
        item.changeMediaPath(nextMediaPath, true);
        replaced = true;
      }
    } catch (changeErrorA) {
      try {
        item.changeMediaPath(nextMediaPath, 1);
        replaced = true;
      } catch (changeErrorB) {}
    }

    if (replaced) {
      try {
        if (item.refreshMedia) {
          item.refreshMedia();
        }
      } catch (refreshError) {}
    }

    return capitonJson({
      ok: replaced,
      replaced: replaced,
      previousMediaPath: previousMediaPath,
      mediaPath: nextMediaPath,
      message: replaced
        ? "Zaman çizelgesindeki mevcut görsel altyazı yeni render dosyasına bağlandı."
        : "Görsel altyazı proje öğesi bulundu ama yeni dosyaya bağlanamadı."
    });
  } catch (error) {
    return capitonJson({
      ok: false,
      message: "Görsel altyazı değiştirilemedi: " + error.toString()
    });
  }
}

function capitonImportMogrtSequence(payloadJson) {
  function fail(code, message) {
    return capitonJson({ ok: false, code: code, message: message });
  }

  try {
    if (!app.project || !app.project.activeSequence) {
      return fail("no-sequence", "Aktif sekans bulunamadı.");
    }

    if (!payloadJson) {
      return fail("empty-payload", "MOGRT verisi boş.");
    }

    if (typeof JSON === "undefined" || !JSON.parse) {
      return fail("json-missing", "Premiere ExtendScript JSON.parse desteklemiyor.");
    }

    var payload = JSON.parse(payloadJson);
    if (!payload || !payload.captions || !payload.captions.length) {
      return fail("no-captions", "Zaman çizelgesine basılacak altyazı bulunamadı.");
    }

    var mogrtPath = String(payload.mogrtPath || "");
    var mogrtFile = new File(mogrtPath);
    if (!mogrtPath || !mogrtFile.exists) {
      return fail("mogrt-missing", "MOGRT dosyası bulunamadı: " + mogrtPath);
    }

    var sequence = app.project.activeSequence;
    if (!sequence.importMGT) {
      return fail("importmgt-missing", "Bu Premiere sürümünde importMGT API bulunamadı.");
    }

    var videoTrackCount = capitonFirstNumber([
      capitonSafeNumber(sequence.videoTracks, "numTracks"),
      capitonSafeNumber(sequence.videoTracks, "numItems"),
      capitonSafeNumber(sequence.videoTracks, "length")
    ]);
    if (!videoTrackCount) {
      return fail("no-video-track", "Aktif sekans içinde video kanalı bulunamadı.");
    }

    var videoTrackOffset = Math.max(0, videoTrackCount - 1);
    var inserted = 0;
    var skipped = 0;

    for (var i = 0; i < payload.captions.length; i += 1) {
      var caption = payload.captions[i];
      if (!caption) {
        skipped += 1;
        continue;
      }

      var startSeconds = Number(caption.startMs || 0) / 1000;
      var endSeconds = Number(caption.endMs || 0) / 1000;
      if (!isFinite(startSeconds) || !isFinite(endSeconds) || endSeconds <= startSeconds) {
        skipped += 1;
        continue;
      }

      var durationSeconds = Math.max(0.12, endSeconds - startSeconds);
      var sourceInSeconds = Math.max(0, Number(caption.sourceInMs || 0) / 1000);
      var clip = sequence.importMGT(mogrtFile.fsName, capitonCreateTimeFromSeconds(startSeconds).ticks, videoTrackOffset, 0);
      if (!clip) {
        return fail("mogrt-import-failed", "MOGRT içe aktarılamadı. Altyazı sırası: " + i);
      }

      var component = null;
      try {
        component = clip.getMGTComponent();
      } catch (componentError) {}

      if (component && component.properties) {
        capitonApplyMogrtProperties(component.properties, String(caption.text || ""), payload.preset || {}, !!payload.preserveTemplateStyle, caption);
      }

      capitonSetTrackItemTime(clip, "inPoint", sourceInSeconds);
      capitonSetTrackItemTime(clip, "outPoint", sourceInSeconds + durationSeconds);
      capitonSetTrackItemTime(clip, "end", startSeconds + durationSeconds);
      inserted += 1;
    }

    return capitonJson({
      ok: inserted > 0,
      inserted: inserted,
      skipped: skipped,
      mogrtPath: mogrtFile.fsName,
      message:
        inserted +
        " MOGRT altyazı zaman çizelgesine eklendi." +
        (skipped ? " Atlanan blok: " + skipped + "." : "")
    });
  } catch (error) {
    return fail("error", "MOGRT içe aktarma hatası: " + error.toString());
  }
}

function capitonApplyMogrtProperties(properties, text, preset, preserveTemplateStyle, caption) {
  var textParams = capitonGetMogrtTextParams(properties);
  for (var textIndex = 0; textIndex < textParams.length; textIndex += 1) {
    var textParam = textParams[textIndex];
    try {
      textParam.setValue(capitonBuildTextParamValue(textParam, text, preset), 1);
    } catch (textJsonError) {
      try {
        textParam.setValue(text, 1);
      } catch (textPlainError) {}
    }
  }

  if (!preserveTemplateStyle) {
    var primaryColor = capitonParseHexColor(preset.primaryColor || "#ffffff");
    var accentColor = capitonParseHexColor(preset.accentColor || preset.primaryColor || "#fff200");
    var strokeColor = capitonParseHexColor(preset.strokeColor || "#000000");
    var primarySet = capitonSetColorParam(properties, ["Primary Color", "Primary Colour", "Fill Color", "Fill Colour", "Colour", "Color", "Text Color", "Main Color", "Main Colour"], primaryColor);
    var accentSet = capitonSetColorParam(properties, ["Accent Color", "Accent Colour", "Highlight Color", "Highlight Colour", "Emphasis Color", "Emphasis Colour", "Secondary Color", "Secondary Colour", "Word Color", "Active Word Color"], accentColor);
    var strokeSet = capitonSetColorParam(properties, ["Stroke Color", "Stroke Colour", "Outline Color", "Outline Colour", "Shadow Color", "Shadow Colour"], strokeColor);
    if (!primarySet && !accentSet && !strokeSet && preset.forceColorOverride) {
      capitonSetColorParamsByOrder(properties, [primaryColor, accentColor, strokeColor]);
    }
    capitonSetNumberParam(properties, ["Stroke Width", "Stroke", "Outline Width", "Outline"], Number(preset.strokeWidth || 5));
  }

  capitonSetNumberParam(properties, ["Type-On Opacity"], 100);

  if (caption && isFinite(Number(caption.highlightStartPercent)) && isFinite(Number(caption.highlightEndPercent))) {
    capitonSetNumberParam(properties, ["Highlight Based On"], 1);
    capitonSetNumberParam(properties, ["Active Word Opacity"], 100);
    capitonSetNumberParam(properties, ["Highlight Start", "Active Word Start", "Word Start"], Number(caption.highlightStartPercent));
    capitonSetNumberParam(properties, ["Highlight End", "Active Word End", "Word End"], Number(caption.highlightEndPercent));
  }
}

function capitonGetMogrtTextParams(properties) {
  var params = [];
  var named = capitonGetParamByDisplayNames(properties, [
    "Caption Text",
    "This is a caption preview",
    "Source Text",
    "Text Source Text",
    "Text",
    "Subtitle",
    "Subtitles"
  ]);
  if (named) {
    params.push(named);
  }

  capitonIterateProperties(properties, function (property) {
    try {
      var value = property.getValue();
      if (typeof value === "string" && value.indexOf("textEditValue") !== -1) {
        if (!capitonArrayContainsParam(params, property)) {
          params.push(property);
        }
      }
    } catch (valueError) {}
    return null;
  });

  return params;
}

function capitonArrayContainsParam(params, property) {
  for (var i = 0; i < params.length; i += 1) {
    if (params[i] === property) {
      return true;
    }
  }
  return false;
}

function capitonBuildTextParamValue(textParam, text, preset) {
  var currentValue = {};
  try {
    var raw = textParam.getValue();
    if (raw && typeof raw === "string") {
      currentValue = JSON.parse(raw);
    }
  } catch (parseError) {
    currentValue = {};
  }

  if (!currentValue || typeof currentValue !== "object") {
    currentValue = {};
  }

  currentValue.textEditValue = String(text || "");
  currentValue.capPropTextRunCount = 1;
  currentValue.capPropFontFauxStyleEdit = true;
  capitonSetTextFieldShape(currentValue, "fontTextRunLength", Math.max(1, currentValue.textEditValue.length));
  capitonSetTextFieldShape(currentValue, "fontFSAllCapsValue", false);
  capitonSetTextFieldShape(currentValue, "fontFSSmallCapsValue", false);

  if (preset && preset.fontFamily && preset.forceFontOverride) {
    currentValue.capPropFontEdit = true;
    capitonSetTextFieldShape(currentValue, "fontEditValue", String(preset.fontFamily));
  }

  if (preset && preset.fontSize && preset.forceFontOverride) {
    currentValue.capPropFontSizeEdit = true;
    capitonSetTextFieldShape(currentValue, "fontSizeEditValue", Math.max(1, Math.round(Number(preset.fontSize))));
  }

  return JSON.stringify(currentValue);
}

function capitonSetTextFieldShape(target, fieldName, value) {
  if (target[fieldName] instanceof Array) {
    target[fieldName] = [value];
  } else {
    target[fieldName] = value;
  }
}

function capitonSetColorParam(properties, displayNames, color) {
  var param = capitonGetParamByDisplayNames(properties, displayNames);
  if (!param || !color) {
    return false;
  }

  try {
    param.setColorValue(color.alpha, color.red, color.green, color.blue, 1);
    return true;
  } catch (colorError) {}

  return false;
}

function capitonSetColorParamsByOrder(properties, colors) {
  if (!properties || !colors || !colors.length) {
    return 0;
  }

  var applied = 0;
  capitonIterateProperties(properties, function (property) {
    if (applied >= colors.length) {
      return null;
    }

    var color = colors[applied];
    try {
      property.setColorValue(color.alpha, color.red, color.green, color.blue, 1);
      applied += 1;
    } catch (colorError) {}

    return null;
  });

  return applied;
}

function capitonSetNumberParam(properties, displayNames, value) {
  var param = capitonGetParamByDisplayNames(properties, displayNames);
  if (!param || !isFinite(value)) {
    return false;
  }

  try {
    param.setValue(value, 1);
    return true;
  } catch (valueErrorA) {}

  try {
    param.setValue(value);
    return true;
  } catch (valueErrorB) {}

  return false;
}

function capitonGetParamByDisplayNames(properties, displayNames) {
  if (!properties || !displayNames || !displayNames.length) {
    return null;
  }

  for (var i = 0; i < displayNames.length; i += 1) {
    try {
      if (properties.getParamForDisplayName) {
        var direct = properties.getParamForDisplayName(displayNames[i]);
        if (direct) {
          return direct;
        }
      }
    } catch (directError) {}
  }

  var normalized = {};
  for (var j = 0; j < displayNames.length; j += 1) {
    normalized[capitonNormalizeName(displayNames[j])] = true;
  }

  return capitonIterateProperties(properties, function (property) {
    var name = "";
    try {
      name = property.displayName;
    } catch (nameError) {}
    return normalized[capitonNormalizeName(name)] ? property : null;
  });
}

function capitonIterateProperties(properties, callback) {
  var count = capitonFirstNumber([
    capitonSafeNumber(properties, "numItems"),
    capitonSafeNumber(properties, "length")
  ]);

  for (var i = 0; i < count; i += 1) {
    var property = null;
    try {
      property = properties[i];
    } catch (indexError) {}
    if (!property) {
      try {
        property = properties.getParamAt(i);
      } catch (getError) {}
    }
    if (!property) {
      continue;
    }
    var result = callback(property, i);
    if (result) {
      return result;
    }
  }

  return null;
}

function capitonNormalizeName(value) {
  return String(value || "").replace(/\s+/g, " ").toLowerCase();
}

function capitonParseHexColor(hexColor) {
  var value = String(hexColor || "#ffffff").replace("#", "");
  if (value.length === 3) {
    value = value.charAt(0) + value.charAt(0) + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2);
  }

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    value = "ffffff";
  }

  return {
    alpha: 255,
    red: parseInt(value.substr(0, 2), 16),
    green: parseInt(value.substr(2, 2), 16),
    blue: parseInt(value.substr(4, 2), 16)
  };
}

function capitonCreateTimeFromSeconds(seconds) {
  var time = new Time();
  time.seconds = Math.max(0, Number(seconds) || 0);
  return time;
}

function capitonSetTrackItemTime(trackItem, propertyName, seconds) {
  var time = capitonCreateTimeFromSeconds(seconds);
  try {
    trackItem[propertyName] = time;
    return true;
  } catch (assignError) {}

  try {
    if (trackItem[propertyName]) {
      trackItem[propertyName].seconds = time.seconds;
      return true;
    }
  } catch (secondsError) {}

  try {
    if (trackItem[propertyName]) {
      trackItem[propertyName].ticks = time.ticks;
      return true;
    }
  } catch (ticksError) {}

  return false;
}

function capitonFindProjectItemByMediaPath(root, mediaPath) {
  if (!root) {
    return null;
  }

  try {
    if (root.getMediaPath && root.getMediaPath() === mediaPath) {
      return root;
    }
  } catch (errorA) {}

  try {
    if (!root.children) {
      return null;
    }
    var count = root.children.numItems || 0;
    for (var i = 0; i < count; i += 1) {
      var child = root.children[i];
      var found = capitonFindProjectItemByMediaPath(child, mediaPath);
      if (found) {
        return found;
      }
    }
  } catch (errorB) {}

  return null;
}

function capitonTimeSeconds(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  try {
    if (typeof value.seconds === "number") {
      return Math.max(0, value.seconds);
    }
  } catch (errorA) {}

  try {
    if (value.ticks !== undefined && value.ticks !== null) {
      return Math.max(0, Number(value.ticks) / 254016000000);
    }
  } catch (errorB) {}

  try {
    if (!isNaN(Number(value))) {
      return Math.max(0, Number(value));
    }
  } catch (errorC) {}

  return 0;
}
