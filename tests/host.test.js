"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function timelineClip(name, mediaPath, timelineStart, timelineEnd, sourceIn, sourceOut) {
  return {
    name,
    projectItem: {
      getMediaPath() {
        return mediaPath;
      }
    },
    start: { seconds: timelineStart },
    end: { seconds: timelineEnd },
    inPoint: { seconds: sourceIn },
    outPoint: { seconds: sourceOut }
  };
}

test("Premiere bridge returns every readable clip on the selected audio track", () => {
  const clips = {
    numItems: 2,
    0: timelineClip("İkinci", "/media/interview.mov", 60, 120, 60, 120),
    1: timelineClip("Birinci", "/media/interview.mov", 0, 60, 0, 60)
  };
  const sandbox = {
    app: {
      project: {
        activeSequence: {
          name: "Test sekansı",
          audioTracks: {
            numTracks: 1,
            0: { name: "A1", clips }
          }
        }
      }
    }
  };
  vm.createContext(sandbox);
  const hostSource = fs.readFileSync(
    path.join(__dirname, "..", "outputs", "capiton-premiere-cep-plugin", "jsx", "host.jsx"),
    "utf8"
  );
  vm.runInContext(hostSource, sandbox);

  const result = JSON.parse(sandbox.capitonGetAudioSource("A1"));

  assert.equal(result.ok, true);
  assert.equal(result.clips.length, 2);
  assert.deepEqual(
    result.clips.map((clip) => [clip.clipName, clip.timelineStartSeconds, clip.timelineEndSeconds]),
    [
      ["Birinci", 0, 60],
      ["İkinci", 60, 120]
    ]
  );
  assert.equal(result.timelineStartSeconds, 0);
  assert.equal(result.timelineEndSeconds, 120);
});

test("Premiere bridge exposes active sequence frame dimensions", () => {
  const sandbox = {
    app: {
      project: {
        activeSequence: {
          name: "Dikey sekans",
          getSettings() {
            return { videoFrameWidth: 2160, videoFrameHeight: 3840 };
          },
          audioTracks: { numTracks: 1 },
          videoTracks: { numTracks: 2 }
        }
      }
    }
  };
  vm.createContext(sandbox);
  const hostSource = fs.readFileSync(
    path.join(__dirname, "..", "outputs", "capiton-premiere-cep-plugin", "jsx", "host.jsx"),
    "utf8"
  );
  vm.runInContext(hostSource, sandbox);

  const result = JSON.parse(sandbox.capitonGetSequenceInfo());

  assert.equal(result.width, 2160);
  assert.equal(result.height, 3840);
});

test("existing Zola overlays are reused and accidental duplicate layers are removed", () => {
  let removed = 0;
  const overlayClip = (trackIndex) => ({
    projectItem: { getMediaPath: () => `/work/${trackIndex}-capiton-overlay.mov` },
    start: { seconds: 0 },
    end: { seconds: 120 },
    remove() {
      removed += 1;
    }
  });
  const sandbox = {
    app: {
      project: {
        activeSequence: {
          videoTracks: {
            numTracks: 3,
            0: { clips: { numItems: 0 } },
            1: { clips: { numItems: 1, 0: overlayClip(1) } },
            2: { clips: { numItems: 1, 0: overlayClip(2) } }
          }
        }
      }
    }
  };
  vm.createContext(sandbox);
  const hostSource = fs.readFileSync(
    path.join(__dirname, "..", "outputs", "capiton-premiere-cep-plugin", "jsx", "host.jsx"),
    "utf8"
  );
  vm.runInContext(hostSource, sandbox);

  const result = JSON.parse(sandbox.capitonFindExistingOverlay(0, 120, true));

  assert.equal(result.found, true);
  assert.equal(result.mediaPath, "/work/2-capiton-overlay.mov");
  assert.equal(result.removedDuplicates, 1);
  assert.equal(removed, 1);
});
