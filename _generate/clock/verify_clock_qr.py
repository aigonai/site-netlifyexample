"""Decode the world clock's own QR codes, to prove the encoder in the browser works.

    uv run --with opencv-python-headless --with numpy --with pillow --with qrcode \
        python _generate/clock/verify_clock_qr.py

WHY IT EXISTS. The encoder is JavaScript, because topaze.xyz is static and the settings
the code carries are never sent anywhere — so there is no server-side `qrcode` to lean on,
and the one thing that matters cannot be checked by reading the code: whether a phone can
actually read what the page draws. This renders it and reads it back.

WHAT IT DOES. Runs `qr.js` under node over payloads chosen to land on every version from
1 to 10 and on both sides of each boundary, renders each matrix to an image, and decodes
it with OpenCV's detector. A version that encodes but does not decode is the failure this
exists to catch: it happened once here, and the symbol looked perfectly ordinary.

Copyright (c) 2026 Stefan Loesch. MIT licence: see static/clock/LICENSE.
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import List

import cv2
import numpy as np
from PIL import Image

ENCODER = Path(__file__).resolve().parents[2] / "static" / "clock" / "qr.js"
#: Rendered big enough that the detector is reading the code and not the resampling.
SCALE = 8
#: Four light modules on every side. A code with no quiet zone is one a phone will not read.
QUIET = 4
#: The longest payload version 10 holds; `qr.js` refuses anything above it.
LONGEST = 213

# Inputs come through the environment rather than argv: `node -e` does not agree with
# itself across versions about where the first extra argument lands.
RUNNER = """
global.window = global;
require(process.env.CLOCK_QR_ENCODER);
const out = {};
for (const text of JSON.parse(process.env.CLOCK_QR_TEXTS)) {
  const m = AigonQR.encode(text);
  if (!m) { out[text] = null; continue; }
  const rows = [];
  for (let y = 0; y < m.size; y++) {
    let r = "";
    for (let x = 0; x < m.size; x++) r += m.dark(x, y) ? "1" : "0";
    rows.push(r);
  }
  out[text] = { version: m.version, rows: rows };
}
console.log(JSON.stringify(out));
"""


def payloads() -> List[str]:
    """One payload per version, a real settings line, and the first refused length."""
    lengths = [1, 17, 38, 44, 64, 90, 107, 123, 154, 194, LONGEST, LONGEST + 1]
    return ["WCB1;2a;2m,00,15,1z", "Zürich · Köln · 東京"] + ["x" * n for n in lengths]


def encoded(texts: List[str]) -> dict:
    """Every payload's module matrix, as the browser's own encoder builds it."""
    done = subprocess.run(
        ["node", "-e", RUNNER],
        capture_output=True,
        text=True,
        check=True,
        env={**os.environ, "CLOCK_QR_ENCODER": str(ENCODER), "CLOCK_QR_TEXTS": json.dumps(texts)},
    )
    return json.loads(done.stdout)


def as_image(rows: List[str]) -> "np.ndarray":
    side = (len(rows) + 2 * QUIET) * SCALE
    sheet = Image.new("L", (side, side), 255)
    pixels = sheet.load()
    for y, row in enumerate(rows):
        for x, module in enumerate(row):
            if module != "1":
                continue
            for dy in range(SCALE):
                for dx in range(SCALE):
                    pixels[(x + QUIET) * SCALE + dx, (y + QUIET) * SCALE + dy] = 0
    return np.array(sheet)


def main() -> int:
    if not ENCODER.exists():
        print(f"no encoder at {ENCODER}")
        return 1
    texts = payloads()
    results = encoded(texts)
    detector = cv2.QRCodeDetector()
    failures = 0

    for text in texts:
        code = results.get(text)
        label = text if len(text) <= 24 else f"len={len(text.encode())}"
        if code is None:
            kept = len(text.encode()) > LONGEST
            print(f"{'refused ok' if kept else 'REFUSED   '}  {label}")
            failures += 0 if kept else 1
            continue
        read, _points, _straight = detector.detectAndDecode(as_image(code["rows"]))
        if read == text:
            print(f"v{code['version']:<2} decoded   {label}")
        else:
            print(f"v{code['version']:<2} FAILED    {label} -> {read[:40]!r}")
            failures += 1

    print(f"\n{len(texts) - failures}/{len(texts)} as expected")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
