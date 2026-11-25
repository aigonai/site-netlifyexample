/* A QR CODE, DRAWN IN THE BROWSER WITH NOTHING BEHIND IT.
 *
 * The clock keeps its cities in this device's localStorage, and topaze.xyz is a static
 * site with nothing behind it, so the code that carries them to another device has to be
 * encoded HERE. There is no server to ask, and there must not be: the settings would have
 * to be sent somewhere first, which is the one thing this page promises not to do.
 *
 * Byte mode, error correction M, versions 1 to 10 (up to 271 bytes). The whole payload
 * is cities by index into the built-in table, so a screenful of them is ~60 bytes and
 * lands in version 2. Anything longer than version 10 is refused rather than guessed.
 *
 * VERIFIED AGAINST python-qrcode, module for module, and every version decoded back
 * with OpenCV — `_generate/verify_clock_qr.py` is that harness; run it after touching
 * anything here. Format and version information are computed (BCH) rather than
 * tabulated: a table of sixteen 15-bit words is a typo nobody sees until a phone fails
 * to scan, and the polynomial division is four lines.
 *
 * Copyright (c) 2026 Stefan Loesch. MIT licence: see static/clock/LICENSE.
 */

(function (root) {
  "use strict";

  // Galois field GF(256) with the QR primitive polynomial, as log/antilog tables.
  var EXP = new Uint8Array(512);
  var LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function mul(a, b) {
    return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
  }

  /* The generator polynomial for `degree` error-correction codewords. */
  function generator(degree) {
    var poly = [1];
    for (var d = 0; d < degree; d++) {
      var next = poly.concat([0]);
      for (var i = 0; i < poly.length; i++) next[i + 1] ^= mul(poly[i], EXP[d]);
      poly = next;
    }
    return poly;
  }

  /* Reed-Solomon remainder: the `degree` check codewords for one block. */
  function remainder(data, degree) {
    var gen = generator(degree);
    var out = new Array(degree).fill(0);
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ out[0];
      out.shift();
      out.push(0);
      if (factor !== 0) for (var j = 0; j < degree; j++) out[j] ^= mul(gen[j + 1], factor);
    }
    return out;
  }

  // Per version (index 0 is version 1): total codewords, then the error-correction
  // blocks for level M as [block count, data codewords per block] groups.
  var SPEC = [
    { total: 26, groups: [[1, 16]] },
    { total: 44, groups: [[1, 28]] },
    { total: 70, groups: [[1, 44]] },
    { total: 100, groups: [[2, 32]] },
    { total: 134, groups: [[2, 43]] },
    { total: 172, groups: [[4, 27]] },
    { total: 196, groups: [[4, 31]] },
    { total: 242, groups: [[2, 38], [2, 39]] },
    { total: 292, groups: [[3, 36], [2, 37]] },
    { total: 346, groups: [[4, 43], [1, 44]] }
  ];
  // Alignment pattern centres per version; version 1 has none.
  var ALIGN = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  var MAX_VERSION = SPEC.length;
  var BYTE_MODE = 4;
  var ECC_M_BITS = 0; // the format information's two bits for level M

  function dataCapacity(version) {
    var spec = SPEC[version - 1];
    var bytes = 0;
    spec.groups.forEach(function (g) {
      bytes += g[0] * g[1];
    });
    return bytes;
  }

  function countBits(version) {
    return version < 10 ? 8 : 16;
  }

  /* The smallest version that holds `length` bytes in byte mode, or 0. */
  function versionFor(length) {
    for (var v = 1; v <= MAX_VERSION; v++) {
      var header = 4 + countBits(v);
      if (dataCapacity(v) * 8 >= header + length * 8) return v;
    }
    return 0;
  }

  /* The message as codewords: header, data, terminator, padding. */
  function codewords(bytes, version) {
    var bits = [];
    function push(value, width) {
      for (var i = width - 1; i >= 0; i--) bits.push((value >> i) & 1);
    }
    push(BYTE_MODE, 4);
    push(bytes.length, countBits(version));
    for (var i = 0; i < bytes.length; i++) push(bytes[i], 8);

    var capacity = dataCapacity(version) * 8;
    push(0, Math.min(4, capacity - bits.length)); // terminator, as much as fits
    while (bits.length % 8 !== 0) bits.push(0);

    var out = [];
    for (var b = 0; b < bits.length; b += 8) {
      var byte = 0;
      for (var k = 0; k < 8; k++) byte = (byte << 1) | bits[b + k];
      out.push(byte);
    }
    var pad = [0xec, 0x11];
    for (var p = 0; out.length < dataCapacity(version); p++) out.push(pad[p % 2]);
    return out;
  }

  /* Data and check codewords, interleaved as the standard orders them. */
  function interleave(data, version) {
    var spec = SPEC[version - 1];
    var blocks = [];
    var checkLength = 0;
    spec.groups.forEach(function (group) {
      var perBlock = group[1];
      for (var n = 0; n < group[0]; n++) blocks.push(data.splice(0, perBlock));
    });
    var totalData = 0;
    blocks.forEach(function (block) {
      totalData += block.length;
    });
    checkLength = Math.floor((spec.total - totalData) / blocks.length);
    var checks = blocks.map(function (block) {
      return remainder(block, checkLength);
    });

    var out = [];
    var widest = Math.max.apply(
      null,
      blocks.map(function (b) {
        return b.length;
      })
    );
    for (var i = 0; i < widest; i++) {
      blocks.forEach(function (block) {
        if (i < block.length) out.push(block[i]);
      });
    }
    for (var j = 0; j < checkLength; j++) {
      checks.forEach(function (check) {
        out.push(check[j]);
      });
    }
    return out;
  }

  /* BCH remainder of `value` under `poly`, used for both information fields. */
  function bch(value, poly, polyBits) {
    var shifted = value;
    while (bitLength(shifted) >= polyBits) shifted ^= poly << (bitLength(shifted) - polyBits);
    return shifted;
  }

  function bitLength(value) {
    var n = 0;
    while (value !== 0) {
      n++;
      value >>>= 1;
    }
    return n;
  }

  function formatBits(mask) {
    var data = (ECC_M_BITS << 3) | mask;
    return ((data << 10) | bch(data << 10, 0x537, 11)) ^ 0x5412;
  }

  function versionBits(version) {
    return (version << 12) | bch(version << 12, 0x1f25, 13);
  }

  /* A square grid of nulls (free), true (dark) and false (light). */
  function blank(size) {
    var grid = [];
    for (var y = 0; y < size; y++) grid.push(new Array(size).fill(null));
    return grid;
  }

  function finder(grid, x, y) {
    for (var dy = -1; dy <= 7; dy++) {
      for (var dx = -1; dx <= 7; dx++) {
        var px = x + dx;
        var py = y + dy;
        if (px < 0 || py < 0 || px >= grid.length || py >= grid.length) continue;
        var ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        grid[py][px] = ring !== 2 && ring <= 3;
      }
    }
  }

  function patterns(grid, version) {
    var size = grid.length;
    finder(grid, 0, 0);
    finder(grid, size - 7, 0);
    finder(grid, 0, size - 7);

    for (var i = 8; i < size - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }
    var centres = ALIGN[version - 1];
    var last = size - 7;
    centres.forEach(function (cy) {
      centres.forEach(function (cx) {
        // THE THREE CENTRES A FINDER ALREADY OWNS, and only those. Testing "is this cell
        // taken" instead would also skip the centres that sit ON THE TIMING ROW — which
        // is every middle centre from version 7 up, and a symbol missing those is
        // unreadable while looking almost right.
        var inFinder = (cx === 6 && cy === 6) || (cx === 6 && cy === last) || (cx === last && cy === 6);
        if (inFinder) return;
        for (var dy = -2; dy <= 2; dy++) {
          for (var dx = -2; dx <= 2; dx++) {
            grid[cy + dy][cx + dx] = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
          }
        }
      });
    });
    grid[size - 8][8] = true; // the one fixed dark module

    // The format information's own cells, reserved now and written per mask.
    for (var f = 0; f <= 8; f++) {
      if (grid[8][f] === null) grid[8][f] = false;
      if (grid[f][8] === null) grid[f][8] = false;
    }
    for (var g = 0; g < 8; g++) {
      if (grid[8][size - 1 - g] === null) grid[8][size - 1 - g] = false;
      if (grid[size - 1 - g][8] === null) grid[size - 1 - g][8] = false;
    }
    if (version >= 7) {
      var bits = versionBits(version);
      for (var b = 0; b < 18; b++) {
        var bit = ((bits >> b) & 1) === 1;
        grid[Math.floor(b / 3)][size - 11 + (b % 3)] = bit;
        grid[size - 11 + (b % 3)][Math.floor(b / 3)] = bit;
      }
    }
  }

  /* The format information, twice: clockwise out of the top-left corner, and the split
   * copy along the other two finders. Both run from the most significant bit. */
  function formatCells(size) {
    var first = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
                 [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
    var second = [[size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8],
                  [size - 6, 8], [size - 7, 8], [8, size - 8], [8, size - 7], [8, size - 6],
                  [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]];
    return [first, second];
  }

  function writeFormat(grid, mask) {
    var bits = formatBits(mask);
    formatCells(grid.length).forEach(function (copy) {
      copy.forEach(function (cell, i) {
        grid[cell[0]][cell[1]] = ((bits >> (14 - i)) & 1) === 1;
      });
    });
  }

  var MASKS = [
    function (x, y) { return (x + y) % 2 === 0; },
    function (x, y) { return y % 2 === 0; },
    function (x, y) { return x % 3 === 0; },
    function (x, y) { return (x + y) % 3 === 0; },
    function (x, y) { return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0; },
    function (x, y) { return ((x * y) % 2) + ((x * y) % 3) === 0; },
    function (x, y) { return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; },
    function (x, y) { return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; }
  ];

  /* The payload bits, laid in the standard two-column zigzag. */
  function placeData(grid, bits, mask) {
    var size = grid.length;
    var index = 0;
    var upward = true;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // the vertical timing pattern is not a data column
      for (var step = 0; step < size; step++) {
        var y = upward ? size - 1 - step : step;
        for (var c = 0; c < 2; c++) {
          var x = right - c;
          if (grid[y][x] !== null) continue;
          var bit = index < bits.length ? bits[index] === 1 : false;
          index++;
          grid[y][x] = MASKS[mask](x, y) ? !bit : bit;
        }
      }
      upward = !upward;
    }
  }

  function runPenalty(line) {
    var score = 0;
    var run = 1;
    for (var i = 1; i <= line.length; i++) {
      if (i < line.length && line[i] === line[i - 1]) {
        run++;
        continue;
      }
      if (run >= 5) score += 3 + (run - 5);
      run = 1;
    }
    return score;
  }

  function penalty(grid) {
    var size = grid.length;
    var score = 0;
    var dark = 0;
    for (var y = 0; y < size; y++) {
      var row = [];
      var column = [];
      for (var x = 0; x < size; x++) {
        row.push(grid[y][x]);
        column.push(grid[x][y]);
        if (grid[y][x]) dark++;
      }
      score += runPenalty(row) + runPenalty(column);
    }
    for (var by = 0; by < size - 1; by++) {
      for (var bx = 0; bx < size - 1; bx++) {
        var v = grid[by][bx];
        if (v === grid[by][bx + 1] && v === grid[by + 1][bx] && v === grid[by + 1][bx + 1]) score += 3;
      }
    }
    var finderLike = [true, false, true, true, true, false, true, false, false, false, false];
    for (var ly = 0; ly < size; ly++) {
      for (var lx = 0; lx < size; lx++) {
        score += 40 * (matches(grid, lx, ly, finderLike, true) ? 1 : 0);
        score += 40 * (matches(grid, lx, ly, finderLike, false) ? 1 : 0);
        var reversed = finderLike.slice().reverse();
        score += 40 * (matches(grid, lx, ly, reversed, true) ? 1 : 0);
        score += 40 * (matches(grid, lx, ly, reversed, false) ? 1 : 0);
      }
    }
    var ratio = Math.abs((dark * 100) / (size * size) - 50);
    score += 10 * Math.floor(ratio / 5);
    return score;
  }

  function matches(grid, x, y, pattern, horizontal) {
    var size = grid.length;
    if (horizontal ? x + pattern.length > size : y + pattern.length > size) return false;
    for (var i = 0; i < pattern.length; i++) {
      var cell = horizontal ? grid[y][x + i] : grid[y + i][x];
      if (cell !== pattern[i]) return false;
    }
    return true;
  }

  function utf8(text) {
    var out = [];
    var encoded = encodeURIComponent(text);
    for (var i = 0; i < encoded.length; i++) {
      if (encoded[i] === "%") {
        out.push(parseInt(encoded.substr(i + 1, 2), 16));
        i += 2;
      } else {
        out.push(encoded.charCodeAt(i));
      }
    }
    return out;
  }

  /* The modules for `text`, or null when it is longer than version 10 holds.
   * `{ size, dark(x, y), version }` — the caller draws it however it likes. */
  function encode(text) {
    var bytes = utf8(text);
    var version = versionFor(bytes.length);
    if (version === 0) return null;

    var words = interleave(codewords(bytes, version), version);
    var bits = [];
    words.forEach(function (word) {
      for (var i = 7; i >= 0; i--) bits.push((word >> i) & 1);
    });

    var size = version * 4 + 17;
    var best = null;
    var bestScore = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      var grid = blank(size);
      patterns(grid, version);
      placeData(grid, bits, mask);
      writeFormat(grid, mask);
      var score = penalty(grid);
      if (score < bestScore) {
        bestScore = score;
        best = grid;
      }
    }
    return {
      version: version,
      size: size,
      dark: function (x, y) {
        return best[y][x] === true;
      }
    };
  }

  /* The longest payload this encoder takes, header included — what the page tells a
   * person who has collected more cities than one code can carry. */
  function maxBytes() {
    return Math.floor((dataCapacity(MAX_VERSION) * 8 - 4 - countBits(MAX_VERSION)) / 8);
  }

  root.AigonQR = { encode: encode, maxBytes: maxBytes() };
})(typeof window !== "undefined" ? window : this);
