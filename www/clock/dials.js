/* THE DIAL VIEWS: the same cities, arranged round a clock face instead of down a list.
 *
 * WHY A DIAL AT ALL. A list answers "what time is it in Tokyo". A dial answers the
 * question you actually have, which is "who is in the same part of the day as me" — and
 * it answers it by POSITION, before you have read a single number.
 *
 * THREE OF THEM, because the honest answer to how to draw this was not obvious:
 *
 *   dial24  one face, twenty-four hours, every city on it once. The band behind the
 *           cities is daylight ROUGHLY — six to six — because a single shared face
 *           cannot carry each city's real sunrise, which depends on its latitude. The
 *           Cities view is where the true sun times live.
 *   dial12  one face, twelve hours, two rings. The ring a city sits on says which half
 *           of the day it is in: outer for afternoon and evening, inner for the small
 *           hours and the morning. Twelve hours is the face everybody can read at a
 *           glance; the ring is what twelve hours cannot say by itself.
 *   ampm    the same twelve hours drawn twice, morning and afternoon, so a city appears
 *           on one face only and the two groups are simply two pictures.
 *
 * NO STATE OF ITS OWN. Everything comes from `Clock` (`clock.js`), which hands over the
 * cities already placed, so a dial does no time arithmetic and cannot disagree with the
 * list about what o'clock it is.
 *
 * Copyright (c) 2026 Stefan Loesch. MIT licence: see static/clock/LICENSE.
 */

(function () {
  "use strict";

  var SVG = "http://www.w3.org/2000/svg";
  var SIDE = 480;
  var MIDDLE = SIDE / 2;
  //: The face, and the ring the city dots sit on.
  var FACE_RADIUS = 168;
  //: Room around the face for the labels. WIDER THAN IT IS TALL, because a label is laid
  //: out sideways from the dot: the face needs width for the names and very little height,
  //: and a square margin spends half the picture on nothing.
  var MARGIN_X = 88;
  var MARGIN_Y = 34;
  var BAND_WIDTH = 26;
  //: The inner ring of the two-ring dial, far enough in to read as a separate circle.
  var INNER_RADIUS = 96;
  //: Labels start here and step outward when they would collide.
  var LABEL_GAP = 26;
  //: A line of a label, in the units of the face — the `1.25em` the tspans step by at the
  //: label's own font size.
  var LINE_HEIGHT = 19;
  //: Half a line, and the clear space between one label's foot and the next label's top,
  //: both in lines.
  var HALF_LINE = 0.5;
  var LABEL_GAP_LINES = 1.2;
  var MINUTES_AN_HOUR = 60;
  var HOURS_HALF_DAY = 12;
  var DEGREES_ROUND = 360;
  //: The logo's shades, handed over by `clock.js` so there is one definition of them.
  var RAMP = [];
  //: Trigonometry starts at three o'clock; a dial starts at twelve.
  var TWELVE = -90;
  //: Noon, in minutes — the middle of the day and the light end of the ramp.
  var NOON_MINUTES = 12 * 60;
  //: What hour a position on a face really is. A 24-hour face means what it says; the
  //: afternoon ring of the two-ring dial is twelve hours later than its numbers read.
  function SAME_HOUR(hour) {
    return hour;
  }
  function AFTERNOON_HOUR(hour) {
    return hour + HOURS_HALF_DAY;
  }
  //: Where the day is cut when it is cut into light and dark rather than into AM and PM.
  var DAY_STARTS_AT = 6;
  //: THE SIX-TO-SIX WHEELS KEEP THE ORDINARY FACE and move the seam to the foot of it.
  //: The day wheel runs 06:00 round to 18:00 with NOON AT THE TOP; the night wheel runs
  //: 18:00 round to 06:00 with MIDNIGHT AT THE TOP. Both ends of each seam are the same
  //: hour of the ramp — six in the morning and six in the evening are one shade — so the
  //: colour meets itself at the foot and neither wheel has a step anywhere on it.
  function DAY_HOUR(hour) {
    return hour < DAY_STARTS_AT ? hour + HOURS_HALF_DAY : hour;
  }
  function NIGHT_HOUR(hour) {
    return hour < DAY_STARTS_AT ? hour : hour + HOURS_HALF_DAY;
  }

  //: The gem, and how tall it is for its width (`gem.png` is 600x592).
  var GEM_SRC = "/clock/gem.png?v=2";
  var GEM_RATIO = 592 / 600;
  var GEM_OPACITY = 0.92;
  //: How far apart the letters of a ring's name sit, in degrees, astride twelve o'clock.
  //: Wide enough that the turn of the colour shows between them, close enough to read as
  //: one word.
  var RING_LETTER_DEGREES = 13;
  //: How wide the gem is drawn on each face, by how much empty middle that face has.
  var GEM_ON_TWENTY_FOUR = 132;
  var GEM_ON_TWELVE = 78;
  //: How long a consolidated label may run before it starts counting instead, and what
  //: the separator between two names costs.

  var LABEL_JOIN = 3;
  var SEAM_OVERLAP_DEGREES = 0.4;

  function node(name, attrs) {
    var made = document.createElementNS(SVG, name);
    Object.keys(attrs || {}).forEach(function (key) {
      made.setAttribute(key, attrs[key]);
    });
    return made;
  }

  function at(degrees, radius) {
    var angle = ((degrees + TWELVE) * Math.PI) / 180;
    return { x: MIDDLE + Math.cos(angle) * radius, y: MIDDLE + Math.sin(angle) * radius };
  }

  /* A filled annulus sector — the daylight band, and the rings behind the dots. */
  function ringPath(from, to, outer, inner) {
    var a = at(from, outer);
    var b = at(to, outer);
    var c = at(to, inner);
    var d = at(from, inner);
    var sweep = (to - from + DEGREES_ROUND) % DEGREES_ROUND > 180 ? 1 : 0;
    return [
      "M", a.x, a.y,
      "A", outer, outer, 0, sweep, 1, b.x, b.y,
      "L", c.x, c.y,
      "A", inner, inner, 0, sweep, 0, d.x, d.y,
      "Z"
    ].join(" ");
  }

  /* The hour marks and their numbers. `hours` is 24 or 12. */
  function face(svg, hours, radius) {
    for (var hour = 0; hour < hours; hour++) {
      // THROUGH `degreesFor`, never the raw angle: a 24-hour face is turned so that noon
      // is at the top, and an hour mark placed without that turn puts midnight where the
      // cities think noon is — which looked almost right and was wrong by twelve hours.
      var degrees = degreesFor(hour * MINUTES_AN_HOUR, hours);
      var quarter = hours === 24 ? hour % 6 === 0 : hour % 3 === 0;
      var from = at(degrees, radius - BAND_WIDTH - (quarter ? 10 : 5));
      var to = at(degrees, radius - BAND_WIDTH);
      svg.appendChild(
        node("line", {
          x1: from.x, y1: from.y, x2: to.x, y2: to.y,
          class: quarter ? "tick major" : "tick"
        })
      );
      if (!quarter) continue;
      var where = at(degrees, radius - BAND_WIDTH - 26);
      var mark = node("text", { x: where.x, y: where.y, class: "hour" });
      mark.textContent = hours === 24 ? String(hour).padStart(2, "0") : String(hour === 0 ? 12 : hour);
      svg.appendChild(mark);
    }
  }

  /* Where a city sits on a face of `hours` hours, in degrees from twelve o'clock.
   *
   * A 24-hour face is turned half a revolution so NOON IS AT THE TOP: the daylight band
   * is then the upper half of the picture, which is the way round a reader expects it. */
  function degreesFor(minutes, hours) {
    if (hours === 24) {
      return (((minutes - HOURS_HALF_DAY * MINUTES_AN_HOUR) / (24 * MINUTES_AN_HOUR)) * DEGREES_ROUND + DEGREES_ROUND) % DEGREES_ROUND;
    }
    return ((minutes % (HOURS_HALF_DAY * MINUTES_AN_HOUR)) / (HOURS_HALF_DAY * MINUTES_AN_HOUR)) * DEGREES_ROUND;
  }

  /* Cities reading the same clock become ONE point on the face.
   *
   * A dial places a city by its time, so two cities on the same time are the same place
   * on the drawing — drawn separately they are one dot with two labels fanned off it,
   * which says there are two times when there are not (owner, 2026-11-18). Half of
   * Europe is one group for most of the year.
   *
   * GROUPED BY THE TRUE MINUTE OF THE DAY, not by where they land on this face: on a
   * twelve-hour face 02:00 and 14:00 share an angle and are not the same time. They stay
   * apart, and the ring each sits on keeps them apart on the drawing too.
   *
   * The group is HERE if any city in it is, so the reader's own place is never hidden
   * inside a name it shares. */
  function consolidate(placedCities) {
    var order = [];
    var byMinute = {};
    placedCities.forEach(function (one) {
      var key = String(one.minutes);
      if (!byMinute[key]) {
        byMinute[key] = { one: one, names: [], here: false };
        order.push(key);
      }
      byMinute[key].names.push(one.city.name);
      byMinute[key].here = byMinute[key].here || one.here;
    });

    return order.map(function (key) {
      var group = byMinute[key];
      // ONE NAME A LINE, AND THE TIME ONCE AT THE FOOT. Saying the hour next to each name
      // is the repetition the grouping exists to remove (owner, 2026-11-18: "if they have
      // the same time, you don't need to show the time again"), and not saying it buys
      // the room to spell the names out instead of counting them.
      // EVERY NAME, one to a line. Not a few and a count: the names are the thing the
      // reader came for, and the room to print them is exactly what saying the hour once
      // instead of five times buys.
      var names = group.names;
      return {
        city: { name: names.join(" · ") },
        lines: names,
        here: group.here,
        parts: group.one.parts,
        hour: group.one.hour,
        minutes: group.one.minutes,
        offset: group.one.offset
      };
    });
  }

  /* The dots and their labels.
   *
   * LABELS ARE SEPARATED BY THEIR BOXES, NOT BY THEIR ANGLES. Two cities an hour apart
   * are 15 degrees apart on a 24-hour face, which says nothing about whether their names
   * overlap — that depends on where round the face they are, since the same angle is a
   * tall gap at the side and almost none at the top. So every label is seated first, then
   * the ones down each side are pushed apart vertically until none of them touch. */
  function cities(svg, placedCities, radiusOf, hours, h12) {
    var seats = consolidate(placedCities).map(function (one) {
      var degrees = degreesFor(one.minutes, hours);
      var radius = radiusOf(one);
      return {
        one: one,
        degrees: degrees,
        radius: radius,
        dot: at(degrees, radius),
        // OUTSIDE THE WHOLE FACE, not outside this city's own ring: on the two-ring dial
        // a label seated off the inner ring lands on top of the outer one.
        seat: at(degrees, FACE_RADIUS + LABEL_GAP)
      };
    });

    // Down each side independently: a label on the left never collides with one on the
    // right, and treating them as one column would fan out names that were already clear.
    [true, false].forEach(function (right) {
      var side = seats
        .filter(function (entry) {
          return entry.seat.x >= MIDDLE === right;
        })
        .sort(function (a, b) {
          return a.seat.y - b.seat.y;
        });
      // BY EACH LABEL'S OWN HEIGHT: a group of four names is four lines tall, and a fixed
      // step would let the next label print over its foot.
      for (var i = 1; i < side.length; i++) {
        var above = side[i - 1];
        var foot = above.seat.y + (above.one.lines.length - HALF_LINE) * LINE_HEIGHT;
        var wanted = foot + LABEL_GAP_LINES * LINE_HEIGHT;
        if (side[i].seat.y < wanted) side[i].seat.y = wanted;
      }
    });

    seats.forEach(function (entry) {
      svg.appendChild(
        node("circle", {
          cx: entry.dot.x, cy: entry.dot.y, r: entry.one.here ? 8 : 6,
          class: entry.one.here ? "dot here" : "dot"
        })
      );

      var right = entry.seat.x >= MIDDLE;
      var x = entry.seat.x + (right ? 10 : -10);
      var leader = at(entry.degrees, entry.radius + 7);
      svg.appendChild(
        node("line", { x1: leader.x, y1: leader.y, x2: entry.seat.x, y2: entry.seat.y, class: "leader" })
      );

      var label = node("text", {
        x: x,
        y: entry.seat.y,
        class: entry.one.here ? "label here" : "label",
        "text-anchor": right ? "start" : "end"
      });
      entry.one.lines.forEach(function (line, index) {
        var name = node("tspan", index === 0 ? {} : { x: x, dy: "1.25em" });
        name.textContent = line;
        label.appendChild(name);
      });
      var clock = node("tspan", { class: "at", x: x, dy: "1.25em" });
      clock.textContent = reading(entry.one, h12);
      label.appendChild(clock);
      svg.appendChild(label);
    });
  }

  function reading(one, h12) {
    var hour = one.hour;
    if (!h12) return String(hour).padStart(2, "0") + ":" + one.parts.minute;
    var half = hour % HOURS_HALF_DAY === 0 ? HOURS_HALF_DAY : hour % HOURS_HALF_DAY;
    return half + ":" + one.parts.minute + (hour < HOURS_HALF_DAY ? " AM" : " PM");
  }

  function sheet() {
    // The box is grown symmetrically around the face so the outermost label still lands
    // inside the drawing: the dial is `SIDE` wide, the labels need the rest.
    var svg = node("svg", {
      viewBox: -MARGIN_X + " " + -MARGIN_Y + " " + (SIDE + MARGIN_X * 2) + " " + (SIDE + MARGIN_Y * 2),
      class: "face",
      role: "img"
    });
    return svg;
  }

  /* Has anything this face shows actually changed?
   *
   * A dial is rebuilt from nothing each time it is drawn, and the rail draws the screens
   * either side of the one you are on as well — so without this the page would rebuild
   * three SVGs a second to show the same minute three hundred times. The signature is
   * what a face DISPLAYS: the cities, their minute, and whether the clock is on twelve or
   * twenty-four. Seconds are deliberately not in it; no dial shows them. */
  function unchanged(host, placedCities, h12) {
    var signature = (h12 ? "12" : "24") + "|" + placedCities.map(function (one) {
      return one.city.name + "@" + one.minutes;
    }).join(",");
    if (host.dataset.drawn === signature) return true;
    host.dataset.drawn = signature;
    return false;
  }

  /* THE GEM IN THE MIDDLE. A dial's centre is the one part of it that holds nothing, and
   * an empty disc in the middle of a brand's own clock is a waste of the best place on
   * the picture (owner, 2026-11-18). Only on faces with nothing there: the AM and PM
   * wheels already say their own name in the middle. */
  function gem(svg, width) {
    svg.appendChild(
      node("image", {
        href: GEM_SRC,
        x: MIDDLE - width / 2,
        y: MIDDLE - (width * GEM_RATIO) / 2,
        width: width,
        height: width * GEM_RATIO,
        opacity: GEM_OPACITY
      })
    );
  }

  /* A ring's name, written ON the ring and ASTRIDE TWELVE O'CLOCK — one letter either
   * side of it (owner, 2026-11-18: "the A on the one side of the colour, the M on the
   * other side").
   *
   * Twelve is where the ring's own colour turns over: it is the darkest hour meeting the
   * lightest, and the only fixed point on a face whose cities move. Sitting the name on
   * that seam makes it part of the drawing rather than a tag parked somewhere empty —
   * and twelve is the one angle no city can crowd for long. */
  function ringLabel(svg, text, radius) {
    text.split("").forEach(function (letter, index) {
      var spread = (index - (text.length - 1) / 2) * RING_LETTER_DEGREES;
      var seat = at(spread, radius);
      var mark = node("text", { x: seat.x, y: seat.y, class: "ringname" });
      mark.textContent = letter;
      svg.appendChild(mark);
    });
  }

  // ── the three dials ─────────────────────────────────────────────────────────────────

  /* The shade for a TIME OF DAY, cut from the logo's ramp.
   *
   * BY HOW FAR THE HOUR IS FROM NOON, evenly: the six shades divide the twelve hours
   * between noon and midnight two hours each, so the three light ones span six to six and
   * the three dark ones span six to six, with the turn exactly on the hour.
   *
   * IT USED TO FOLLOW THE SINE of the hour's height on the face, which is how the mark is
   * lit — and as a gradation it did not work (owner, 2026-11-18). A sine is flat at both
   * ends: it gave SIX hours of the lightest shade round noon, six of the darkest round
   * midnight, and squeezed the whole ramp into the two hours either side of six. The
   * boundary was in the right place and the picture read as two blocks with a step in it
   * rather than as a gradation at all.
   *
   * By the time rather than by the position, so one cycle still runs across two
   * twelve-hour wheels: the AM wheel darkest at midnight lightening to noon, the PM wheel
   * lightest at noon darkening back, meeting in the same shade at both ends.
   */
  function shadeAtMinutes(minutes) {
    var fromNoon = Math.abs(minutes - NOON_MINUTES) / NOON_MINUTES;
    return RAMP[Math.min(RAMP.length - 1, Math.floor(fromNoon * RAMP.length))];
  }

  /* The band, one facet an hour, cut from the logo's ramp.
   *
   * SEGMENTS RATHER THAN TWO LONG ARCS: a half-circle arc has to carry SVG's large-arc
   * and sweep flags, and getting either wrong produces a band that is merely in the wrong
   * place — it still looks like a band, so nothing announces the mistake. A segment
   * cannot span half a circle, so both flags are constant. */
  function band(svg, outer, inner, hours, trueHourOf) {
    for (var hour = 0; hour < hours; hour++) {
      var from = degreesFor(hour * MINUTES_AN_HOUR, hours);
      var to = degreesFor((hour + 1) * MINUTES_AN_HOUR, hours);
      if (to <= from) to += DEGREES_ROUND;
      // A HAIR OF OVERLAP: abutting paths antialias against each other and leave a pale
      // seam at every join.
      svg.appendChild(
        node("path", {
          d: ringPath(from, to + SEAM_OVERLAP_DEGREES, outer, inner),
          fill: shadeAtMinutes((trueHourOf(hour) + 0.5) * MINUTES_AN_HOUR)
        })
      );
    }
  }

  function drawTwentyFour(host, clock, now) {
    var placedCities = clock.placed(now);
    if (unchanged(host, placedCities, clock.state.h12)) return;
    var svg = sheet();
    band(svg, FACE_RADIUS, FACE_RADIUS - BAND_WIDTH, 24, SAME_HOUR);
    face(svg, 24, FACE_RADIUS);
    gem(svg, GEM_ON_TWENTY_FOUR);
    cities(svg, placedCities, function () {
      return FACE_RADIUS - BAND_WIDTH / 2;
    }, 24, clock.state.h12);
    host.textContent = "";
    host.appendChild(svg);
  }

  function drawTwelve(host, clock, now) {
    var placedCities = clock.placed(now);
    if (unchanged(host, placedCities, clock.state.h12)) return;
    var svg = sheet();
    band(svg, FACE_RADIUS, FACE_RADIUS - BAND_WIDTH, 12, AFTERNOON_HOUR);
    band(svg, INNER_RADIUS, INNER_RADIUS - BAND_WIDTH, 12, SAME_HOUR);
    face(svg, 12, FACE_RADIUS);

    ringLabel(svg, "PM", FACE_RADIUS - BAND_WIDTH / 2);
    ringLabel(svg, "AM", INNER_RADIUS - BAND_WIDTH / 2);
    gem(svg, GEM_ON_TWELVE);

    cities(svg, placedCities, function (one) {
      return one.hour < HOURS_HALF_DAY ? INNER_RADIUS - BAND_WIDTH / 2 : FACE_RADIUS - BAND_WIDTH / 2;
    }, 12, clock.state.h12);
    host.textContent = "";
    host.appendChild(svg);
  }

  /* One of the two wheels: AM (00:00 to 11:59) or PM (12:00 to 23:59).
   *
   * EVERY HOUR KEEPS THE COLOUR THE 24-HOUR DIAL GIVES IT. That is the whole rule: a
   * time has one shade, wherever it is drawn. A consequence is that a wheel's seam at
   * the top is a step — a twelve-hour cut puts midnight at one end of the wheel and noon
   * at the other, and those are the two ends of the ramp. */
  function drawHalf(host, clock, now, afternoon) {
    var mineOnly = clock.placed(now).filter(function (one) {
      return afternoon === one.hour >= HOURS_HALF_DAY;
    });
    if (unchanged(host, mineOnly, clock.state.h12)) return;
    var svg = sheet();
    band(svg, FACE_RADIUS, FACE_RADIUS - BAND_WIDTH, 12, afternoon ? AFTERNOON_HOUR : SAME_HOUR);
    face(svg, 12, FACE_RADIUS);

    var mine = mineOnly;
    // The wheel says which half of the day it is, inside its own face: a caption above it
    // needed a box to sit in, and the boxes were the thing worth losing.
    var title = node("text", { x: MIDDLE, y: MIDDLE - 10, class: "facename" });
    title.textContent = afternoon ? "PM" : "AM";
    svg.appendChild(title);
    if (mine.length === 0) {
      var empty = node("text", { x: MIDDLE, y: MIDDLE + 22, class: "keyname centred" });
      empty.textContent = "nobody";
      svg.appendChild(empty);
    }
    cities(svg, mine, function () {
      return FACE_RADIUS - BAND_WIDTH / 2;
    }, 12, clock.state.h12);
    host.textContent = "";
    host.appendChild(svg);
  }

  //: Is this hour in the daylight half of the six-to-six cut?
  function isDaylight(hour) {
    return hour >= DAY_STARTS_AT && hour < DAY_STARTS_AT + HOURS_HALF_DAY;
  }

  /* ONE FACE, TWO RINGS, cut six to six: THE DAY RING OUTSIDE, the night ring inside.
   *
   * The same arrangement as the AM/PM dial — a city's ring says which half of the day it
   * is in, its angle says the hour — with the halves cut at six instead of at twelve.
   *
   * THE OTHER WAY ROUND FROM THE AM/PM DIAL, and only this one (owner, 2026-11-18). The
   * AM/PM dial puts the later half outside, which is an ordering. This one is not an
   * ordering: it is daylight and the dark, and the daylight belongs on the outside where
   * it is the bigger, brighter ring. So the outer ring is lightest at the top (noon) and
   * the inner one darkest there (midnight), and each meets itself at the foot. */
  function drawDayNightRings(host, clock, now) {
    var placedCities = clock.placed(now);
    if (unchanged(host, placedCities, clock.state.h12)) return;
    var svg = sheet();
    band(svg, FACE_RADIUS, FACE_RADIUS - BAND_WIDTH, 12, DAY_HOUR);
    band(svg, INNER_RADIUS, INNER_RADIUS - BAND_WIDTH, 12, NIGHT_HOUR);
    face(svg, 12, FACE_RADIUS);

    ringLabel(svg, "DAY", FACE_RADIUS - BAND_WIDTH / 2);
    ringLabel(svg, "NIGHT", INNER_RADIUS - BAND_WIDTH / 2);
    gem(svg, GEM_ON_TWELVE);

    cities(svg, placedCities, function (one) {
      return isDaylight(one.hour) ? FACE_RADIUS - BAND_WIDTH / 2 : INNER_RADIUS - BAND_WIDTH / 2;
    }, 12, clock.state.h12);
    host.textContent = "";
    host.appendChild(svg);
  }

  /* One of the two six-to-six wheels: DAY (06:00 to 17:59) or NIGHT (18:00 to 05:59).
   *
   * THE SAME FACE AS EVERY OTHER TWELVE-HOUR FACE — twelve at the top, six at the foot —
   * so a city sits where a clock would put its hour hand, and nothing about reading the
   * dial has to be relearned. What changes is only which half of the day the wheel
   * holds, and therefore where its seam falls: at the foot, between two hours that carry
   * the same shade, instead of at the top between the two ends of the ramp.
   */
  function drawSixToSix(host, clock, now, night) {
    var mineOnly = clock.placed(now).filter(function (one) {
      return night !== isDaylight(one.hour);
    });
    if (unchanged(host, mineOnly, clock.state.h12)) return;
    var svg = sheet();
    band(svg, FACE_RADIUS, FACE_RADIUS - BAND_WIDTH, 12, night ? NIGHT_HOUR : DAY_HOUR);
    face(svg, 12, FACE_RADIUS);

    var title = node("text", { x: MIDDLE, y: MIDDLE - 10, class: "facename" });
    title.textContent = night ? "NIGHT" : "DAY";
    svg.appendChild(title);
    if (mineOnly.length === 0) {
      var empty = node("text", { x: MIDDLE, y: MIDDLE + 22, class: "keyname centred" });
      empty.textContent = "nobody";
      svg.appendChild(empty);
    }
    cities(svg, mineOnly, function () {
      return FACE_RADIUS - BAND_WIDTH / 2;
    }, 12, clock.state.h12);
    host.textContent = "";
    host.appendChild(svg);
  }

  window.ClockDials = {
    register: function (clock) {
      RAMP = clock.RAMP;
      clock.register("dial24", "24-hour dial", clock.pick("view-dial24"), function (now) {
        drawTwentyFour(clock.pick("dial24"), clock, now);
      });
      clock.register("dial12", "12-hour dial", clock.pick("view-dial12"), function (now) {
        drawTwelve(clock.pick("dial12"), clock, now);
      });
      clock.register("dn12", "Day/night dial", clock.pick("view-dn12"), function (now) {
        drawDayNightRings(clock.pick("dn12"), clock, now);
      });
      clock.register("ampm", "AM & PM dials", clock.pick("view-ampm"), function (now) {
        var am = clock.pick("dialAm");
        var pm = clock.pick("dialPm");
        drawHalf(am, clock, now, false);
        drawHalf(pm, clock, now, true);

        // THE WHEEL YOU ARE IN COMES FIRST — on top when they are stacked, on the left
        // when they are side by side. The reader's own time is the thing they look for,
        // so it should not move between two positions depending on the hour (owner,
        // 2026-11-18: "the current city is always on top").
        var here = clock.placed(now).filter(function (one) {
          return one.here;
        })[0];
        var afternoonHere = here ? here.hour >= HOURS_HALF_DAY : false;
        am.parentNode.style.order = afternoonHere ? "1" : "0";
        pm.parentNode.style.order = afternoonHere ? "0" : "1";
      });
      clock.register("daynight", "Day & night dials", clock.pick("view-daynight"), function (now) {
        var day = clock.pick("dialDay");
        var night = clock.pick("dialNight");
        drawSixToSix(day, clock, now, false);
        drawSixToSix(night, clock, now, true);

        // The wheel the reader is in comes first, as on the AM/PM pair.
        var here = clock.placed(now).filter(function (one) {
          return one.here;
        })[0];
        var darkHere = here ? !isDaylight(here.hour) : false;
        day.parentNode.style.order = darkHere ? "1" : "0";
        night.parentNode.style.order = darkHere ? "0" : "1";
      });
    }
  };
})();
