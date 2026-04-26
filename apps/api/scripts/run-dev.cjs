const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const isWin = process.platform === "win32";
const venvPython = isWin
  ? path.join(root, ".venv", "Scripts", "python.exe")
  : path.join(root, ".venv", "bin", "python");

if (!fs.existsSync(venvPython)) {
  console.error(
    "Missing apps/api/.venv. From apps/api run:\n" +
      "  python -m venv .venv\n" +
      '  pip install -e ".[dev]"\n' +
      "Requires Python 3.12+ (see pyproject.toml).",
  );
  process.exit(1);
}

const proc = spawn(
  venvPython,
  ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8002"],
  { stdio: "inherit", cwd: root },
);
proc.on("exit", (code) => process.exit(code ?? 0));
