"""Render the world clock's icons from the Topaze gem's own faceting.

    uv run --with pillow python _generate/clock/clock_icon.py

Writes static/clock/clock-512.png, clock-192.png, clock-maskable-512.png and
apple-touch-icon.png. Run from the repo root; commit what it writes.

NAMED `clock-*` AND NOT `icon-*`: the global gitignore carries macOS's `Icon*` rule, and
on a case-insensitive filesystem that silently swallows an `icon-192.png`. Committing one
would need `git add -f`, and a file that is only in the tree because somebody forced it is
a file the next person loses.

THE DIAL IS THE FACETING. `static/clock/gem.png` is a cut stone: triangular facets in the
brand's blue ramp, separated by white seams, light at the top and dark at the foot. Drawn
with TWELVE facets round a centre, that same stone is a clock face — the seams land where
the hour marks would, so the mark needs no ticks drawn on top of it and still reads as a
dial at the size a home screen shows it.

Hands at ten past ten, which is where clocks are photographed: the two hands sit either
side of the top without covering the facet seam at twelve.

DRAWN FOUR TIMES OVERSIZE AND REDUCED, because PIL does not antialias a polygon and the
seams come out ragged at the size they are actually seen.

Copyright (c) 2026 Stefan Loesch. MIT licence: see static/clock/LICENSE.
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[2] / "static" / "clock"

# The brand ramp, light to dark (index.html's --ice, --sky, --azure, --blue, --deep, --navy).
RAMP = ["#55C9EE", "#079FE6", "#008ED7", "#0074BF", "#00649F", "#004E80"]
PAPER = "#FFFFFF"      # the square behind the stone. WHITE, NOT INK: iOS composites a
                       # transparent or dark icon onto black, and a shelf of brand icons
                       # reads as one family only if they share a ground (owner, 2026-11-18)
SEAM = "#FFFFFF"       # the white lines between facets, as on the gem
HANDS = "#272B31"     # the hands are cut INTO the stone: ink reads on the lit facets,
                      # and white would disappear into the seams

HOURS = 12             # facets, one an hour: the seams are the hour marks
OVERSAMPLE = 4
CENTRE = 0.5           # of the side
RADIUS = 0.40          # the stone, as a share of the side
MASKABLE_RADIUS = 0.30 # smaller, so a round mask cannot crop the dial
SEAM_WIDTH = 0.012
HAND_WIDTH = 0.035
HOUR_REACH = 0.19
MINUTE_REACH = 0.28
PIVOT = 0.035
TWELVE = -90           # trigonometry starts at the right; a dial starts at the top


def facet_colour(index: int) -> str:
    """Light at the top, dark at the foot, as the gem is lit.

    By the facet's own HEIGHT rather than its number, so the stone stays lit from above
    however many facets it is cut into."""
    middle = math.radians((index + 0.5) * (360 / HOURS) + TWELVE)
    # Screen y grows downward, so `sin` is -1 at twelve o'clock and +1 at six.
    height = (1 + math.sin(middle)) / 2          # 0 at the top, 1 at the foot
    return RAMP[min(len(RAMP) - 1, int(height * len(RAMP)))]


def point(side: float, degrees: float, reach: float) -> tuple:
    angle = math.radians(degrees + TWELVE)
    return (side * CENTRE + math.cos(angle) * side * reach, side * CENTRE + math.sin(angle) * side * reach)


def draw(side: int, radius: float = RADIUS) -> Image.Image:
    """The mark at `side` pixels: opaque, square, the stone cut into twelve."""
    big = side * OVERSAMPLE
    icon = Image.new("RGB", (big, big), PAPER)
    pen = ImageDraw.Draw(icon)
    middle = (big * CENTRE, big * CENTRE)
    step = 360 / HOURS

    for hour in range(HOURS):
        pen.polygon(
            [middle, point(big, hour * step, radius), point(big, (hour + 1) * step, radius)],
            fill=facet_colour(hour),
        )
    # The seams last, over the facets, so every one of them is the same width.
    for hour in range(HOURS):
        pen.line([middle, point(big, hour * step, radius)], fill=SEAM, width=max(1, round(big * SEAM_WIDTH)))
    pen.polygon(
        [point(big, hour * step, radius) for hour in range(HOURS)],
        outline=SEAM,
        width=max(1, round(big * SEAM_WIDTH)),
    )

    scale = radius / RADIUS
    for degrees, reach in ((305, HOUR_REACH), (60, MINUTE_REACH)):
        pen.line([middle, point(big, degrees, reach * scale)], fill=HANDS, width=max(1, round(big * HAND_WIDTH * scale)))
    pivot = big * PIVOT * scale
    pen.ellipse([middle[0] - pivot, middle[1] - pivot, middle[0] + pivot, middle[1] + pivot], fill=HANDS)
    return icon.resize((side, side), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, side, radius in (
        ("clock-512.png", 512, RADIUS),
        ("clock-192.png", 192, RADIUS),
        ("clock-maskable-512.png", 512, MASKABLE_RADIUS),
        ("apple-touch-icon.png", 180, RADIUS),
    ):
        draw(side, radius).save(OUT / name, "PNG", optimize=True)
        print(f"wrote {OUT / name} ({side}x{side})")


if __name__ == "__main__":
    main()
