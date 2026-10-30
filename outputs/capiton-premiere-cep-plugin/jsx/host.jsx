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
    var settings = null;
    try {
      settings = sequence.getSettings ? sequence.getSettings() : null;
    } catch (settingsError) {}
    var width = capitonFirstNumber([
      settings ? capitonSafeNumber(settings, "videoFrameWidth") : 0,
      settings ? capitonSafeNumber(settings, "frameSizeHorizontal") : 0,
      capitonSafeNumber(sequence, "frameSizeHorizontal")
    ]);
    var height = capitonFirstNumber([
      settings ? capitonSafeNumber(settings, "videoFrameHeight") : 0,
      settings ? capitonSafeNumber(settings, "frameSizeVertical") : 0,
      capitonSafeNumber(sequence, "frameSizeVertical")
    ]);
    return capitonJson({
      ok: true,
      name: sequence.name || "Aktif sekans",
      width: width || 1080,
      height: height || 1920,
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

    var readableClips = capitonCollectReadableAudioClips(track);
    if (readableClips.length > 0) {
      var firstClip = readableClips[0];
      var timelineStartSeconds = firstClip.timelineStartSeconds;
      var timelineEndSeconds = firstClip.timelineEndSeconds;
      for (var i = 1; i < readableClips.length; i += 1) {
        timelineStartSeconds = Math.min(timelineStartSeconds, readableClips[i].timelineStartSeconds);
        timelineEndSeconds = Math.max(timelineEndSeconds, readableClips[i].timelineEndSeconds);
      }

      return capitonJson({
        ok: true,
        trackId: trackId,
        clipIndex: firstClip.clipIndex,
        sequenceName: sequence.name || "Aktif sekans",
        mediaPath: firstClip.mediaPath,
        clipName: firstClip.clipName,
        timelineStartSeconds: timelineStartSeconds,
        timelineEndSeconds: timelineEndSeconds,
        sourceInSeconds: firstClip.sourceInSeconds,
        sourceOutSeconds: firstClip.sourceOutSeconds,
        clips: readableClips,
        message: trackId + " içinde " + readableClips.length + " okunabilir ses klibi bulundu."
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

function capitonCollectReadableAudioClips(track) {
  var result = [];
  if (!track || !track.clips) {
    return result;
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

    result.push({
      clipIndex: i,
      mediaPath: mediaPath,
      clipName: clip.name || "",
      timelineStartSeconds: capitonTimeSeconds(clip.start),
      timelineEndSeconds: capitonTimeSeconds(clip.end),
      sourceInSeconds: capitonTimeSeconds(clip.inPoint),
      sourceOutSeconds: capitonTimeSeconds(clip.outPoint)
    });
  }

  result.sort(function (left, right) {
    return left.timelineStartSeconds - right.timelineStartSeconds;
  });
  return result;
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

function capitonGetVideoTrackCount(sequence) {
  try {
    return capitonFirstNumber([
      capitonSafeNumber(sequence.videoTracks, "numTracks"),
      capitonSafeNumber(sequence.videoTracks, "numItems"),
      capitonSafeNumber(sequence.videoTracks, "length")
    ]);
  } catch (error) {
    return 0;
  }
}

function capitonEnsureVideoTrackCount(sequence, requiredCount) {
  try {
    var currentCount = capitonGetVideoTrackCount(sequence);
    if (currentCount > requiredCount) {
      return currentCount;
    }

    app.enableQE();
    if (!qe || !qe.project) {
      return currentCount;
    }
    var qeSequence = qe.project.getActiveSequence();
    if (!qeSequence || !qeSequence.addTracks) {
      return currentCount;
    }

    while (currentCount <= requiredCount) {
      qeSequence.addTracks(1, currentCount, 0, 0, 0, 0, 0);
      currentCount += 1;
    }
    return currentCount;
  } catch (error) {
    return capitonGetVideoTrackCount(sequence);
  }
}

function capitonTrackRangeIsFree(track, startSeconds, endSeconds) {
  try {
    if (!track || !track.clips) {
      return true;
    }
    var clips = track.clips;
    var count = capitonFirstNumber([capitonSafeNumber(clips, "numItems"), capitonSafeNumber(clips, "length"), 512]);
    for (var i = 0; i < count; i += 1) {
      var clip = capitonGetCollectionItem(clips, i);
      if (!clip) {
        continue;
      }
      var clipStart = capitonTimeSeconds(clip.start);
      var clipEnd = capitonTimeSeconds(clip.end);
      if (clipEnd > startSeconds && clipStart < endSeconds) {
        return false;
      }
    }
    return true;
  } catch (error) {
    return false;
  }
}

function capitonFindFreeOverlayTrackIndex(sequence, startSeconds, endSeconds) {
  var videoCount = capitonGetVideoTrackCount(sequence);
  for (var i = 1; i < videoCount; i += 1) {
    var track = capitonGetCollectionItem(sequence.videoTracks, i);
    if (capitonTrackRangeIsFree(track, startSeconds, endSeconds)) {
      return i;
    }
  }
  capitonEnsureVideoTrackCount(sequence, videoCount);
  return videoCount;
}

function capitonIsZolaOverlayPath(mediaPath) {
  var normalized = String(mediaPath || "").replace(/\\/g, "/").toLowerCase();
  return /-capiton-overlay(?:-tmp)?\.mov$/.test(normalized);
}

function capitonFindExistingOverlay(startSeconds, durationSeconds, removeDuplicates) {
  try {
    if (!app.project || !app.project.activeSequence) {
      return capitonJson({ ok: false, mediaPath: "", message: "Aktif sekans bulunamadı." });
    }

    var sequence = app.project.activeSequence;
    var rangeStart = Math.max(0, Number(startSeconds || 0));
    var safeDuration = Math.max(0.04, Number(durationSeconds || 0));
    var rangeEnd = rangeStart + safeDuration;
    var matches = [];
    var trackCount = capitonGetVideoTrackCount(sequence);

    for (var trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
      var track = capitonGetCollectionItem(sequence.videoTracks, trackIndex);
      if (!track || !track.clips) {
        continue;
      }
      var clipCount = capitonFirstNumber([
        capitonSafeNumber(track.clips, "numItems"),
        capitonSafeNumber(track.clips, "length")
      ]);
      for (var clipIndex = 0; clipIndex < clipCount; clipIndex += 1) {
        var clip = capitonGetCollectionItem(track.clips, clipIndex);
        if (!clip || !clip.projectItem) {
          continue;
        }
        var mediaPath = "";
        try {
          mediaPath = clip.projectItem.getMediaPath();
        } catch (pathError) {}
        if (!capitonIsZolaOverlayPath(mediaPath)) {
          continue;
        }
        var clipStart = capitonTimeSeconds(clip.start);
        var clipEnd = capitonTimeSeconds(clip.end);
        if (clipEnd <= rangeStart || clipStart >= rangeEnd) {
          continue;
        }
        matches.push({
          clip: clip,
          mediaPath: mediaPath,
          trackIndex: trackIndex,
          clipIndex: clipIndex,
          startSeconds: clipStart,
          endSeconds: clipEnd
        });
      }
    }

    if (!matches.length) {
      return capitonJson({ ok: true, found: false, mediaPath: "", removedDuplicates: 0 });
    }

    matches.sort(function (left, right) {
      return right.trackIndex - left.trackIndex || right.clipIndex - left.clipIndex;
    });
    var keep = matches[0];
    var removed = 0;
    if (removeDuplicates && matches.length > 1) {
      for (var i = 1; i < matches.length; i += 1) {
        try {
          if (matches[i].clip.remove) {
            matches[i].clip.remove(false, false);
            removed += 1;
          }
        } catch (removeError) {}
      }
    }

    return capitonJson({
      ok: true,
      found: true,
      mediaPath: keep.mediaPath,
      trackIndex: keep.trackIndex,
      startSeconds: keep.startSeconds,
      endSeconds: keep.endSeconds,
      removedDuplicates: removed,
      message: removed
        ? "Mevcut Zola altyazısı bulundu; yinelenen katmanlar temizlendi."
        : "Mevcut Zola altyazısı bulundu."
    });
  } catch (error) {
    return capitonJson({ ok: false, mediaPath: "", message: "Mevcut Zola altyazısı aranamadı: " + error.toString() });
  }
}

function capitonImportOverlayFile(mediaPath, startSeconds, durationSeconds) {
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
    var usedTrackIndex = -1;
    var safeStartSeconds = Number(startSeconds || 0);
    if (isNaN(safeStartSeconds) || safeStartSeconds < 0) {
      safeStartSeconds = 0;
    }
    var safeDurationSeconds = Number(durationSeconds || 0);
    if (isNaN(safeDurationSeconds) || safeDurationSeconds <= 0) {
      safeDurationSeconds = 0.04;
    }

    if (item && sequence && sequence.videoTracks) {
      var resolvedTrackIndex = capitonFindFreeOverlayTrackIndex(sequence, safeStartSeconds, safeStartSeconds + safeDurationSeconds);

      var targetTrack = capitonGetCollectionItem(sequence.videoTracks, resolvedTrackIndex);
      if (!targetTrack) {
        targetTrack = capitonGetCollectionItem(sequence.videoTracks, 0);
        resolvedTrackIndex = 0;
      }

      if (targetTrack && targetTrack.overwriteClip) {
        try {
          targetTrack.overwriteClip(item, safeStartSeconds);
          addedToTimeline = true;
          usedTrackIndex = resolvedTrackIndex;
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
      trackIndex: usedTrackIndex,
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

function capitonIsEsrarengizWatermarkPath(mediaPath) {
  var normalized = String(mediaPath || "").replace(/\\/g, "/").toLowerCase();
  return /-esrarengiz-watermark\.png$/.test(normalized);
}

function capitonRemoveWatermarkLayers(startSeconds, durationSeconds) {
  try {
    if (!app.project || !app.project.activeSequence) {
      return capitonJson({ ok: false, removed: 0, message: "Aktif sekans bulunamadı." });
    }

    var sequence = app.project.activeSequence;
    var rangeStart = Math.max(0, Number(startSeconds || 0));
    var rangeEnd = rangeStart + Math.max(0.04, Number(durationSeconds || 0));
    var removed = 0;
    var trackCount = capitonGetVideoTrackCount(sequence);
    for (var trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
      var track = capitonGetCollectionItem(sequence.videoTracks, trackIndex);
      if (!track || !track.clips) {
        continue;
      }
      var clipCount = capitonFirstNumber([
        capitonSafeNumber(track.clips, "numItems"),
        capitonSafeNumber(track.clips, "length")
      ]);
      for (var clipIndex = clipCount - 1; clipIndex >= 0; clipIndex -= 1) {
        var clip = capitonGetCollectionItem(track.clips, clipIndex);
        var clipPath = "";
        try {
          clipPath = clip && clip.projectItem ? clip.projectItem.getMediaPath() : "";
        } catch (pathError) {}
        if (!capitonIsEsrarengizWatermarkPath(clipPath)) {
          continue;
        }
        var clipStart = capitonTimeSeconds(clip.start);
        var clipEnd = capitonTimeSeconds(clip.end);
        if (clipEnd <= rangeStart || clipStart >= rangeEnd) {
          continue;
        }
        try {
          if (clip.remove) {
            clip.remove(false, false);
            removed += 1;
          }
        } catch (removeError) {}
      }
    }

    return capitonJson({
      ok: true,
      removed: removed,
      message: removed ? "Eski @esrarengizbiolay watermark katmanı yenilendi." : "Watermark katmanı kapalı."
    });
  } catch (error) {
    return capitonJson({ ok: false, removed: 0, message: "Watermark katmanı temizlenemedi: " + error.toString() });
  }
}

function capitonSetTrackItemOpacity(clip, opacity) {
  try {
    if (!clip || !clip.components) {
      return false;
    }
    var componentCount = capitonFirstNumber([
      capitonSafeNumber(clip.components, "numItems"),
      capitonSafeNumber(clip.components, "length")
    ]);
    for (var componentIndex = 0; componentIndex < componentCount; componentIndex += 1) {
      var component = capitonGetCollectionItem(clip.components, componentIndex);
      if (component && component.properties && capitonSetNumberParam(component.properties, ["Opacity", "Opaklık"], Number(opacity))) {
        return true;
      }
    }
  } catch (error) {}
  return false;
}

function capitonImportWatermarkFile(mediaPath, startSeconds, durationSeconds, opacity) {
  try {
    if (!mediaPath) {
      return capitonJson({ ok: false, message: "Watermark dosya yolu boş." });
    }
    if (!app.project || !app.project.activeSequence) {
      return capitonJson({ ok: false, message: "Aktif sekans bulunamadı." });
    }

    var safeStart = Math.max(0, Number(startSeconds || 0));
    var safeDuration = Math.max(0.2, Number(durationSeconds || 0.2));
    capitonRemoveWatermarkLayers(safeStart, safeDuration);

    var imported = app.project.importFiles([mediaPath], true, app.project.rootItem, false);
    var item = capitonFindProjectItemByMediaPath(app.project.rootItem, mediaPath);
    if (!imported || !item) {
      return capitonJson({ ok: false, message: "@esrarengizbiolay watermark dosyası projeye alınamadı." });
    }
    try {
      item.name = "@esrarengizbiolay watermark";
    } catch (nameError) {}

    var sequence = app.project.activeSequence;
    var trackIndex = capitonFindFreeOverlayTrackIndex(sequence, safeStart, safeStart + safeDuration);
    var track = capitonGetCollectionItem(sequence.videoTracks, trackIndex);
    if (!track || !track.overwriteClip) {
      return capitonJson({ ok: false, message: "Watermark için boş video kanalı oluşturulamadı." });
    }
    track.overwriteClip(item, safeStart);

    var insertedClip = null;
    var clipCount = capitonFirstNumber([
      capitonSafeNumber(track.clips, "numItems"),
      capitonSafeNumber(track.clips, "length")
    ]);
    for (var clipIndex = clipCount - 1; clipIndex >= 0; clipIndex -= 1) {
      var candidate = capitonGetCollectionItem(track.clips, clipIndex);
      var candidatePath = "";
      try {
        candidatePath = candidate && candidate.projectItem ? candidate.projectItem.getMediaPath() : "";
      } catch (pathError) {}
      if (String(candidatePath || "") === String(mediaPath) && Math.abs(capitonTimeSeconds(candidate.start) - safeStart) < 0.08) {
        insertedClip = candidate;
        break;
      }
    }

    var durationSet = false;
    var opacitySet = false;
    if (insertedClip) {
      try {
        insertedClip.end = capitonCreateTimeFromSeconds(safeStart + safeDuration);
        durationSet = true;
      } catch (durationError) {}
      opacitySet = capitonSetTrackItemOpacity(insertedClip, Number(opacity || 20));
    }

    return capitonJson({
      ok: true,
      imported: true,
      addedToTimeline: true,
      mediaPath: mediaPath,
      trackIndex: trackIndex,
      durationSet: durationSet,
      opacitySet: opacitySet,
      opacity: Number(opacity || 20),
      message: "@esrarengizbiolay ayrı watermark katmanı olarak eklendi (%20 opacity)."
    });
  } catch (error) {
    return capitonJson({ ok: false, message: "Watermark timeline'a eklenemedi: " + error.toString() });
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

function capitonReplaceOverlayFile(previousMediaPath, nextMediaPath, fallbackStartSeconds, fallbackDurationSeconds) {
  try {
    if (!previousMediaPath || !nextMediaPath) {
      return capitonJson({ ok: false, message: "Yenilenecek veya yeni görsel altyazı yolu boş." });
    }

    if (!app.project) {
      return capitonJson({ ok: false, message: "Aktif proje bulunamadı." });
    }

    var sequence = app.project.activeSequence;
    var previousItem = capitonFindProjectItemByMediaPath(app.project.rootItem, previousMediaPath);
    var imported = app.project.importFiles([nextMediaPath], true, app.project.rootItem, false);
    var nextItem = capitonFindProjectItemByMediaPath(app.project.rootItem, nextMediaPath);
    if (!imported || !nextItem) {
      return capitonJson({
        ok: false,
        replaced: false,
        mediaPath: nextMediaPath,
        message: "Yeni Zola render dosyası projeye alınamadı; mevcut timeline klibi korunuyor."
      });
    }
    var locations = [];
    if (sequence && sequence.videoTracks) {
      var trackCount = capitonGetVideoTrackCount(sequence);
      for (var trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
        var track = capitonGetCollectionItem(sequence.videoTracks, trackIndex);
        if (!track || !track.clips) {
          continue;
        }
        var clipCount = capitonFirstNumber([
          capitonSafeNumber(track.clips, "numItems"),
          capitonSafeNumber(track.clips, "length")
        ]);
        for (var clipIndex = clipCount - 1; clipIndex >= 0; clipIndex -= 1) {
          var clip = capitonGetCollectionItem(track.clips, clipIndex);
          var clipPath = "";
          try {
            clipPath = clip && clip.projectItem ? clip.projectItem.getMediaPath() : "";
          } catch (pathError) {}
          if (String(clipPath || "") !== String(previousMediaPath || "")) {
            continue;
          }
          locations.push({
            trackIndex: trackIndex,
            startSeconds: capitonTimeSeconds(clip.start),
            endSeconds: capitonTimeSeconds(clip.end)
          });
          try {
            if (clip.remove) {
              clip.remove(false, false);
            }
          } catch (removeError) {}
        }
      }
    }

    var replaced = false;
    var targetTrackIndex = locations.length ? locations[0].trackIndex : -1;
    var targetStartSeconds = locations.length
      ? locations[0].startSeconds
      : Math.max(0, Number(fallbackStartSeconds || 0));

    if (nextItem && sequence && sequence.videoTracks) {
      if (targetTrackIndex < 0) {
        var fallbackDuration = Math.max(0.04, Number(fallbackDurationSeconds || 0));
        targetTrackIndex = capitonFindFreeOverlayTrackIndex(sequence, targetStartSeconds, targetStartSeconds + fallbackDuration);
      }
      var targetTrack = capitonGetCollectionItem(sequence.videoTracks, targetTrackIndex);
      if (targetTrack && targetTrack.overwriteClip) {
        try {
          targetTrack.overwriteClip(nextItem, targetStartSeconds);
          replaced = true;
        } catch (overwriteError) {}
      }
    }

    if (!replaced && previousItem && locations.length) {
      for (var restoreIndex = 0; restoreIndex < locations.length; restoreIndex += 1) {
        try {
          var restoreTrack = capitonGetCollectionItem(sequence.videoTracks, locations[restoreIndex].trackIndex);
          if (restoreTrack && restoreTrack.overwriteClip) {
            restoreTrack.overwriteClip(previousItem, locations[restoreIndex].startSeconds);
          }
        } catch (restoreError) {}
      }
    }

    if (!replaced && !locations.length) {
      var importedResult = capitonImportOverlayFile(nextMediaPath, fallbackStartSeconds, fallbackDurationSeconds);
      try {
        var parsed = JSON.parse(importedResult);
        parsed.replaced = false;
        parsed.message = "Eski Zola klibi bulunamadı; yeni altyazı zaman çizelgesine eklendi.";
        return capitonJson(parsed);
      } catch (parseError) {
        return importedResult;
      }
    }

    return capitonJson({
      ok: !!imported && replaced,
      replaced: replaced,
      previousMediaPath: previousMediaPath,
      mediaPath: nextMediaPath,
      trackIndex: targetTrackIndex,
      startSeconds: targetStartSeconds,
      message: replaced
        ? "Zola altyazısı aynı video kanalında doğru sekans çözünürlüğüyle yenilendi."
        : "Zola altyazı klibi kaldırıldı ancak yeni render aynı kanala yerleştirilemedi."
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
