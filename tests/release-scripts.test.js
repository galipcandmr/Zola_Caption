"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

test("version bump changes literal versions without corrupting similar color values", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "zola-caption-bump-test-"));
  const pluginRoot = path.join(root, "outputs", "capiton-premiere-cep-plugin");
  const scriptPath = path.join(root, "scripts", "bump-version.sh");

  fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  fs.mkdirSync(path.join(pluginRoot, "CSXS"), { recursive: true });
  fs.mkdirSync(path.join(pluginRoot, "src"), { recursive: true });
  fs.mkdirSync(path.join(pluginRoot, "updates"), { recursive: true });
  fs.copyFileSync(path.join(__dirname, "..", "scripts", "bump-version.sh"), scriptPath);
  fs.chmodSync(scriptPath, 0o755);

  fs.writeFileSync(path.join(pluginRoot, "CSXS", "manifest.xml"), '<Extension Version="1.1.1"/>');
  fs.writeFileSync(path.join(pluginRoot, "index.html"), '<span>v1.1.1</span>');
  fs.writeFileSync(
    path.join(pluginRoot, "src", "cep-app.js"),
    'var CURRENT_VERSION = "v1.1.1";\nvar similarColor = "#111114";\n'
  );
  fs.writeFileSync(
    path.join(pluginRoot, "updates", "update.json"),
    JSON.stringify({ latest: "1.1.1", downloadUrl: "old" })
  );
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ version: "1.1.1" }));

  execFileSync("bash", [scriptPath, "1.1.2"], { stdio: "pipe" });

  const appSource = fs.readFileSync(path.join(pluginRoot, "src", "cep-app.js"), "utf8");
  const updateInfo = JSON.parse(fs.readFileSync(path.join(pluginRoot, "updates", "update.json"), "utf8"));
  const packageInfo = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

  assert.match(appSource, /CURRENT_VERSION = "v1\.1\.2"/);
  assert.match(appSource, /similarColor = "#111114"/);
  assert.equal(packageInfo.version, "1.1.2");
  assert.equal(
    updateInfo.downloadUrl,
    "https://github.com/galipcandmr/Zola_Caption/releases/download/v1.1.2/Zola-Caption-v1.1.2-update.zip"
  );
});
