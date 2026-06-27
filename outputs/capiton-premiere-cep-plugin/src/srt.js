export function parseSrt(input) {
  const normalized = input
    .replace(/\r/g, "")
    .replace(/^WEBVTT[^\n]*\n+/i, "")
    .trim();

  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n");
      const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
      const timeLine = lines[timeLineIndex] || "";
      const [startRaw, endRaw] = timeLine.split("-->").map((part) => part.trim());
      const textLines = lines.slice(timeLineIndex + 1);

      return {
        id: crypto.randomUUID(),
        start: parseTimestamp(startRaw),
        end: parseTimestamp(endRaw),
        text: textLines.join(" ").trim(),
        translation: ""
      };
    })
    .filter((caption) => Number.isFinite(caption.start) && Number.isFinite(caption.end));
}

export function toSrt(captions, mode = "primary") {
  return captions
    .map((caption, index) => {
      const lines = [String(index + 1), `${formatTimestamp(caption.start)} --> ${formatTimestamp(caption.end)}`];
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

export function parseTimestamp(value = "") {
  const match = value.match(/(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/);
  if (!match) {
    return Number.NaN;
  }

  const [, hours, minutes, seconds, millis] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(millis.padEnd(3, "0")) / 1000;
}

export function formatTimestamp(value) {
  const safe = Math.max(0, value || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = Math.floor(safe % 60);
  const millis = Math.round((safe - Math.floor(safe)) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${String(millis).padStart(3, "0")}`;
}

export function formatShortTime(value) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}
