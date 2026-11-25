/* THE WORLD CLOCK, at topaze.xyz/clock. Everything here runs in the browser; the site is
 * static and has nothing behind it.
 *
 * WHY THE CITIES ARE A TABLE IN THIS FILE and not a lookup somewhere. There is nowhere to
 * look them up — and the page should keep working with the network gone — so the list a
 * person searches ships with it. 110 cities is 6 KB and covers the places people actually
 * call; a zone the table does not have can still be typed in full and is carried by name.
 *
 * WHY EACH CITY CARRIES A LATITUDE. An offset says what the clock reads there; it does not
 * say whether anybody is awake. So each row draws the SUN'S OWN DAY — elevation computed
 * at that latitude, which is the difference between Reykjavik in June and Nairobi in June
 * that no offset can express.
 *
 * THE SETTINGS NEVER LEAVE THE DEVICE: `localStorage`, and a QR code to carry them to
 * another one (`qr.js`). There is no account here, nothing to sign in to, and no request
 * made after the page has loaded.
 *
 * Copyright (c) 2026 Stefan Loesch. MIT licence: see static/clock/LICENSE.
 */

(function () {
  "use strict";

  // name, country, IANA zone, latitude, longitude. Order is the search's tie-break, so
  // the better-known city of a pair comes first.
  var CITIES = [
    ["London", "United Kingdom", "Europe/London", 51.51, -0.13],
    ["Dublin", "Ireland", "Europe/Dublin", 53.35, -6.26],
    ["Lisbon", "Portugal", "Europe/Lisbon", 38.72, -9.14],
    ["Madrid", "Spain", "Europe/Madrid", 40.42, -3.7],
    ["Barcelona", "Spain", "Europe/Madrid", 41.39, 2.17],
    ["Paris", "France", "Europe/Paris", 48.86, 2.35],
    ["Fontainebleau", "France", "Europe/Paris", 48.4, 2.7],
    ["Brussels", "Belgium", "Europe/Brussels", 50.85, 4.35],
    ["Amsterdam", "Netherlands", "Europe/Amsterdam", 52.37, 4.9],
    ["Luxembourg", "Luxembourg", "Europe/Luxembourg", 49.61, 6.13],
    ["Berlin", "Germany", "Europe/Berlin", 52.52, 13.4],
    ["Munich", "Germany", "Europe/Berlin", 48.14, 11.58],
    ["Frankfurt", "Germany", "Europe/Berlin", 50.11, 8.68],
    ["Zurich", "Switzerland", "Europe/Zurich", 47.38, 8.54],
    ["Geneva", "Switzerland", "Europe/Zurich", 46.2, 6.14],
    ["Vienna", "Austria", "Europe/Vienna", 48.21, 16.37],
    ["Prague", "Czechia", "Europe/Prague", 50.08, 14.44],
    ["Copenhagen", "Denmark", "Europe/Copenhagen", 55.68, 12.57],
    ["Stockholm", "Sweden", "Europe/Stockholm", 59.33, 18.07],
    ["Oslo", "Norway", "Europe/Oslo", 59.91, 10.75],
    ["Helsinki", "Finland", "Europe/Helsinki", 60.17, 24.94],
    ["Warsaw", "Poland", "Europe/Warsaw", 52.23, 21.01],
    ["Budapest", "Hungary", "Europe/Budapest", 47.5, 19.04],
    ["Rome", "Italy", "Europe/Rome", 41.9, 12.5],
    ["Milan", "Italy", "Europe/Rome", 45.46, 9.19],
    ["Athens", "Greece", "Europe/Athens", 37.98, 23.73],
    ["Bucharest", "Romania", "Europe/Bucharest", 44.43, 26.1],
    ["Istanbul", "Türkiye", "Europe/Istanbul", 41.01, 28.98],
    ["Kyiv", "Ukraine", "Europe/Kyiv", 50.45, 30.52],
    ["Moscow", "Russia", "Europe/Moscow", 55.76, 37.62],
    ["Reykjavik", "Iceland", "Atlantic/Reykjavik", 64.15, -21.94],
    ["Casablanca", "Morocco", "Africa/Casablanca", 33.57, -7.59],
    ["Accra", "Ghana", "Africa/Accra", 5.6, -0.19],
    ["Lagos", "Nigeria", "Africa/Lagos", 6.52, 3.38],
    ["Cairo", "Egypt", "Africa/Cairo", 30.04, 31.24],
    ["Nairobi", "Kenya", "Africa/Nairobi", -1.29, 36.82],
    ["Addis Ababa", "Ethiopia", "Africa/Addis_Ababa", 9.01, 38.76],
    ["Johannesburg", "South Africa", "Africa/Johannesburg", -26.2, 28.05],
    ["Cape Town", "South Africa", "Africa/Johannesburg", -33.92, 18.42],
    ["Jerusalem", "Israel", "Asia/Jerusalem", 31.78, 35.22],
    ["Tel Aviv", "Israel", "Asia/Jerusalem", 32.08, 34.78],
    ["Dubai", "United Arab Emirates", "Asia/Dubai", 25.2, 55.27],
    ["Abu Dhabi", "United Arab Emirates", "Asia/Dubai", 24.45, 54.38],
    ["Doha", "Qatar", "Asia/Qatar", 25.29, 51.53],
    ["Riyadh", "Saudi Arabia", "Asia/Riyadh", 24.71, 46.68],
    ["Tehran", "Iran", "Asia/Tehran", 35.69, 51.39],
    ["Baku", "Azerbaijan", "Asia/Baku", 40.41, 49.87],
    ["Tbilisi", "Georgia", "Asia/Tbilisi", 41.72, 44.78],
    ["Yerevan", "Armenia", "Asia/Yerevan", 40.18, 44.51],
    ["Karachi", "Pakistan", "Asia/Karachi", 24.86, 67.01],
    ["Tashkent", "Uzbekistan", "Asia/Tashkent", 41.3, 69.24],
    ["Almaty", "Kazakhstan", "Asia/Almaty", 43.24, 76.89],
    ["Mumbai", "India", "Asia/Kolkata", 19.08, 72.88],
    ["Delhi", "India", "Asia/Kolkata", 28.61, 77.21],
    ["Bengaluru", "India", "Asia/Kolkata", 12.97, 77.59],
    ["Colombo", "Sri Lanka", "Asia/Colombo", 6.93, 79.86],
    ["Kathmandu", "Nepal", "Asia/Kathmandu", 27.72, 85.32],
    ["Dhaka", "Bangladesh", "Asia/Dhaka", 23.81, 90.41],
    ["Bangkok", "Thailand", "Asia/Bangkok", 13.76, 100.5],
    ["Hanoi", "Vietnam", "Asia/Ho_Chi_Minh", 21.03, 105.85],
    ["Ho Chi Minh City", "Vietnam", "Asia/Ho_Chi_Minh", 10.82, 106.63],
    ["Jakarta", "Indonesia", "Asia/Jakarta", -6.21, 106.85],
    ["Singapore", "Singapore", "Asia/Singapore", 1.35, 103.82],
    ["Kuala Lumpur", "Malaysia", "Asia/Kuala_Lumpur", 3.14, 101.69],
    ["Manila", "Philippines", "Asia/Manila", 14.6, 120.98],
    ["Hong Kong", "Hong Kong", "Asia/Hong_Kong", 22.32, 114.17],
    ["Shanghai", "China", "Asia/Shanghai", 31.23, 121.47],
    ["Beijing", "China", "Asia/Shanghai", 39.9, 116.41],
    ["Shenzhen", "China", "Asia/Shanghai", 22.54, 114.06],
    ["Taipei", "Taiwan", "Asia/Taipei", 25.03, 121.57],
    ["Seoul", "South Korea", "Asia/Seoul", 37.57, 126.98],
    ["Tokyo", "Japan", "Asia/Tokyo", 35.68, 139.69],
    ["Osaka", "Japan", "Asia/Tokyo", 34.69, 135.5],
    ["Novosibirsk", "Russia", "Asia/Novosibirsk", 55.01, 82.93],
    ["Vladivostok", "Russia", "Asia/Vladivostok", 43.12, 131.89],
    ["Perth", "Australia", "Australia/Perth", -31.95, 115.86],
    ["Adelaide", "Australia", "Australia/Adelaide", -34.93, 138.6],
    ["Brisbane", "Australia", "Australia/Brisbane", -27.47, 153.03],
    ["Sydney", "Australia", "Australia/Sydney", -33.87, 151.21],
    ["Melbourne", "Australia", "Australia/Melbourne", -37.81, 144.96],
    ["Auckland", "New Zealand", "Pacific/Auckland", -36.85, 174.76],
    ["Wellington", "New Zealand", "Pacific/Auckland", -41.29, 174.78],
    ["Suva", "Fiji", "Pacific/Fiji", -18.14, 178.44],
    ["Honolulu", "United States", "Pacific/Honolulu", 21.31, -157.86],
    ["Anchorage", "United States", "America/Anchorage", 61.22, -149.9],
    ["Vancouver", "Canada", "America/Vancouver", 49.28, -123.12],
    ["Seattle", "United States", "America/Los_Angeles", 47.61, -122.33],
    ["San Francisco", "United States", "America/Los_Angeles", 37.77, -122.42],
    ["Los Angeles", "United States", "America/Los_Angeles", 34.05, -118.24],
    ["Denver", "United States", "America/Denver", 39.74, -104.98],
    ["Mexico City", "Mexico", "America/Mexico_City", 19.43, -99.13],
    ["Chicago", "United States", "America/Chicago", 41.88, -87.63],
    ["Dallas", "United States", "America/Chicago", 32.78, -96.8],
    ["Toronto", "Canada", "America/Toronto", 43.65, -79.38],
    ["New York", "United States", "America/New_York", 40.71, -74.01],
    ["Washington", "United States", "America/New_York", 38.91, -77.04],
    ["Boston", "United States", "America/New_York", 42.36, -71.06],
    ["Miami", "United States", "America/New_York", 25.76, -80.19],
    ["Havana", "Cuba", "America/Havana", 23.11, -82.37],
    ["Halifax", "Canada", "America/Halifax", 44.65, -63.58],
    ["Panama City", "Panama", "America/Panama", 8.98, -79.52],
    ["Bogotá", "Colombia", "America/Bogota", 4.71, -74.07],
    ["Lima", "Peru", "America/Lima", -12.05, -77.04],
    ["Santiago", "Chile", "America/Santiago", -33.45, -70.67],
    ["Buenos Aires", "Argentina", "America/Argentina/Buenos_Aires", -34.6, -58.38],
    ["Montevideo", "Uruguay", "America/Montevideo", -34.9, -56.16],
    ["São Paulo", "Brazil", "America/Sao_Paulo", -23.55, -46.63],
    ["Rio de Janeiro", "Brazil", "America/Sao_Paulo", -22.91, -43.17],
    ["Brasília", "Brazil", "America/Sao_Paulo", -15.79, -47.88],
    ["Azores", "Portugal", "Atlantic/Azores", 37.74, -25.67],
    ["UTC", "Coordinated Universal Time", "UTC", 0, 0]
  ];

  var STORE_KEY = "aigon.worldclock.v1";
  var PAYLOAD_TAG = "WCB1";
  //: WHERE A SCANNED CODE OPENS. The page's own address, spelled out rather than taken
  //: from `location`, because a code is photographed off one device and opened on
  //: another: it has to name the site, not wherever the code happened to be drawn.
  var CANONICAL = "https://topaze.xyz/clock/";
  //: The list rides in the query under this name. Its separators (`;` `,` `~`) are all
  //: legal in a query string unescaped (RFC 3986), so the address needs no percent
  //: escaping and the code stays small.
  var LIST_PARAM = "cities";
  var SEED_ZONES = ["America/New_York", "Europe/London", "Asia/Dubai", "Asia/Tokyo"];
  var HITS_SHOWN = 7;
  var RAD = Math.PI / 180;
  var MINUTES_A_DAY = 1440;
  var BAND_STEP_MINUTES = 15;
  var MS_A_MINUTE = 60000;
  // The sun's centre at the moment its upper limb touches the horizon: refraction plus
  // half the disc. This is the definition of sunrise, not a fudge factor.
  //: THE LOGO'S OWN SHADES, light to dark. `_generate/clock_icon.py` cuts the mark into
  //: twelve facets from this exact ramp, lit from above; the dials and the daylight strip
  //: take their colours from here, so the whole page is one stone. Defined ONCE, and
  //: handed to `dials.js` rather than copied into it.
  var RAMP = ["#55c9ee", "#079fe6", "#008ed7", "#0074bf", "#00649f", "#004e80"];
  //: Where the sun has to be for each shade — the elevations the ramp is cut at, from
  //: high noon down to the dark. The last shade takes everything below the last bound.
  var RAMP_ELEVATIONS = [30, 12, -0.833, -6, -12];
  var HORIZON = -0.833;
  var GOLDEN_ABOVE = 6;
  var CIVIL_TWILIGHT = -6;

  function byZone(zone) {
    for (var i = 0; i < CITIES.length; i++) if (CITIES[i][2] === zone) return CITIES[i];
    return null;
  }

  function mod(value, span) {
    return ((value % span) + span) % span;
  }

  /* The sun's elevation in degrees at `date`, seen from (`lat`, `lon`).
   *
   * The low-precision solar position of the Astronomical Almanac: good to about an
   * arcminute, which is three orders of magnitude better than a 12-pixel band needs. */
  function sunElevation(date, lat, lon) {
    var n = date.getTime() / 86400000 + 2440587.5 - 2451545.0; // days from J2000.0
    var meanLongitude = mod(280.46 + 0.9856474 * n, 360);
    var meanAnomaly = mod(357.528 + 0.9856003 * n, 360) * RAD;
    var ecliptic =
      (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * RAD;
    var obliquity = (23.439 - 0.0000004 * n) * RAD;
    var declination = Math.asin(Math.sin(obliquity) * Math.sin(ecliptic));
    var rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(ecliptic), Math.cos(ecliptic));
    var siderealHours = mod(18.697374558 + 24.06570982441908 * n, 24);
    var hourAngle = (siderealHours * 15 + lon - rightAscension / RAD) * RAD;
    var phi = lat * RAD;
    return (
      Math.asin(
        Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle)
      ) / RAD
    );
  }

  /* The parts of `date` as the clock in `zone` shows them. */
  function partsIn(zone, date) {
    var format = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
      timeZoneName: "shortOffset"
    });
    var out = {};
    format.formatToParts(date).forEach(function (part) {
      out[part.type] = part.value;
    });
    return out;
  }

  /* Minutes that zone is ahead of UTC, read off its own "GMT+5:30". */
  function offsetMinutes(parts) {
    var found = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(parts.timeZoneName || "");
    if (!found) return 0;
    var sign = found[1] === "-" ? -1 : 1;
    return sign * (parseInt(found[2], 10) * 60 + (found[3] ? parseInt(found[3], 10) : 0));
  }

  function zoneLabel(zone) {
    var tail = zone.split("/").pop();
    return tail.replace(/_/g, " ");
  }

  function pad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function hhmm(minutes) {
    var whole = Math.round(minutes);
    return pad(Math.floor(whole / 60) % 24) + ":" + pad(whole % 60);
  }

  function offsetWord(minutes) {
    var sign = minutes < 0 ? "−" : "+";
    var size = Math.abs(minutes);
    var hours = Math.floor(size / 60);
    var rest = size % 60;
    return sign + hours + (rest ? ":" + pad(rest) : "") + "h";
  }

  /* A city's own day: the colour of each quarter-hour, and when the sun crosses. */
  function solarDay(city, date) {
    var parts = partsIn(city.zone, date);
    var midnightUtc =
      Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) -
      offsetMinutes(parts) * MS_A_MINUTE;

    var samples = [];
    for (var minute = 0; minute <= MINUTES_A_DAY; minute += BAND_STEP_MINUTES) {
      samples.push(sunElevation(new Date(midnightUtc + minute * MS_A_MINUTE), city.lat, city.lon));
    }

    function elevationAt(minute) {
      return sunElevation(new Date(midnightUtc + minute * MS_A_MINUTE), city.lat, city.lon);
    }

    /* The minute the sun crosses the horizon between two samples, to half a minute. */
    function crossing(index, rising) {
      var low = (index - 1) * BAND_STEP_MINUTES;
      var high = index * BAND_STEP_MINUTES;
      for (var step = 0; step < 6; step++) {
        var middle = (low + high) / 2;
        var above = elevationAt(middle) > HORIZON;
        if (above === rising) high = middle;
        else low = middle;
      }
      return (low + high) / 2;
    }

    var rise = null;
    var set = null;
    for (var i = 1; i < samples.length; i++) {
      var was = samples[i - 1] > HORIZON;
      var is = samples[i] > HORIZON;
      if (!was && is && rise === null) rise = crossing(i, true);
      if (was && !is && set === null) set = crossing(i, false);
    }
    return { samples: samples, rise: rise, set: set, allDay: samples[0] > HORIZON && rise === null && set === null };
  }

  /* The shade for a sun elevation, cut from the same ramp as the mark.
   *
   * THE STRIP IS NOT AMBER ANY MORE (owner, 2026-11-18: "don't use yellow, just use a
   * topaze colour gradation"). Amber on the strip and amber on the "now" marker were two
   * different claims in one colour; the ramp says how high the sun is, and amber is left
   * to mean one thing only, which is NOW. */
  function shadeForElevation(elevation) {
    for (var i = 0; i < RAMP_ELEVATIONS.length; i++) {
      if (elevation > RAMP_ELEVATIONS[i]) return RAMP[i];
    }
    return RAMP[RAMP.length - 1];
  }

  function bandFor(day) {
    var stops = [];
    var span = day.samples.length - 1;
    for (var i = 0; i < span; i++) {
      var colour = shadeForElevation((day.samples[i] + day.samples[i + 1]) / 2);
      stops.push(colour + " " + ((i / span) * 100).toFixed(3) + "% " + (((i + 1) / span) * 100).toFixed(3) + "%");
    }
    return "linear-gradient(to right, " + stops.join(", ") + ")";
  }

  // ── what the page is showing ────────────────────────────────────────────────────────

  function cityFromRow(row) {
    return { name: row[0], country: row[1], zone: row[2], lat: row[3], lon: row[4] };
  }

  function known(zone) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: zone });
      return true;
    } catch (whatever) {
      return false;
    }
  }

  //: "system" follows the device; "light" and "dark" overrule it. A DEVICE PREFERENCE,
  //: not part of the list — it is deliberately NOT carried by the QR code, because the
  //: phone you are moving the cities to has its own idea about dark mode.
  var THEMES = ["system", "light", "dark"];
  //: 24-HOUR AND SORTED BY TIME, AND NO SWITCH FOR EITHER (owner, 2026-11-18: "we're in
  //: Europe... you can still keep them internally, I just don't want them in the user
  //: interface"). The fields stay: a code written by an older copy of this page may carry
  //: either, and the payload format does not change just because the buttons went.
  var state = { cities: [], h12: false, byTime: true, theme: "system" };

  function load() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(STORE_KEY);
    } catch (blocked) {
      raw = null; // a private window, or site data refused. The page still works.
    }
    if (raw) {
      try {
        var saved = JSON.parse(raw);
        if (saved && Array.isArray(saved.cities)) {
          state.h12 = saved.h12 === true;
          state.byTime = saved.byTime !== false;
          state.theme = THEMES.indexOf(saved.theme) === -1 ? "system" : saved.theme;
          state.cities = saved.cities.filter(function (city) {
            return city && typeof city.zone === "string" && known(city.zone);
          });
          return;
        }
      } catch (broken) {
        /* fall through to the seed */
      }
    }
    seed();
  }

  function seed() {
    var here = Intl.DateTimeFormat().resolvedOptions().timeZone;
    state.cities = SEED_ZONES.filter(function (zone) {
      return zone !== here;
    }).map(function (zone) {
      return cityFromRow(byZone(zone));
    });
  }

  function save() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (blocked) {
      /* nothing to do: the list simply does not survive this browser's refusal */
    }
  }

  // ── the payload a QR code carries ───────────────────────────────────────────────────

  function base36Pair(index) {
    var text = index.toString(36);
    return text.length === 1 ? "0" + text : text;
  }

  /* The whole settings as one line. Built-in cities are their index in `CITIES`, two
   * base-36 digits; anything else is spelled out, which is what keeps a hand-typed zone
   * portable. */
  function payload() {
    var entries = state.cities.map(function (city) {
      for (var i = 0; i < CITIES.length; i++) {
        if (CITIES[i][2] === city.zone && CITIES[i][0] === city.name) return base36Pair(i);
      }
      return "~" + city.zone + "~" + city.name;
    });
    return PAYLOAD_TAG + ";" + (state.h12 ? "1" : "2") + (state.byTime ? "t" : "a") + ";" + entries.join(",");
  }

  /* The whole settings as an address somebody can simply open.
   *
   * THE CODE IS A LINK, NOT A BLOB (owner, 2026-11-18). A phone's camera offers to open a
   * URL; it can do nothing with an opaque string, which left the reader copying text
   * between two devices by hand. */
  function payloadUrl() {
    return CANONICAL + "?" + LIST_PARAM + "=" + payload();
  }

  /* `payload` read back, from the line itself or from a link carrying it. Returns null
   * rather than a half-applied list: a code that was mis-typed or truncated must change
   * nothing. */
  function readPayload(text) {
    var typed = String(text || "").trim();
    // A PASTED LINK IS THE NORMAL CASE, because a link is what the code view hands you
    // and what a phone's camera gives you to copy. Everything after the list is cut off:
    // another parameter, and the view in the hash — `…?cities=…#dial24` is exactly what
    // comes off the address bar, and it used to be refused.
    var asked = typed.indexOf(LIST_PARAM + "=");
    if (asked !== -1) {
      typed = decodeURIComponent(typed.slice(asked + LIST_PARAM.length + 1).split("&")[0].split("#")[0]);
    }
    var fields = typed.split(";");
    if (fields.length < 3 || fields[0] !== PAYLOAD_TAG) return null;
    var flags = fields[1];
    var rest = fields.slice(2).join(";");
    var cities = [];
    var pieces = rest ? rest.split(",") : [];
    for (var i = 0; i < pieces.length; i++) {
      var piece = pieces[i];
      if (piece.charAt(0) === "~") {
        var spelled = piece.slice(1).split("~");
        if (spelled.length !== 2 || !known(spelled[0])) return null;
        var row = byZone(spelled[0]);
        cities.push({
          name: spelled[1] || zoneLabel(spelled[0]),
          country: row ? row[1] : "",
          zone: spelled[0],
          lat: row ? row[3] : 0,
          lon: row ? row[4] : 0
        });
        continue;
      }
      // Exactly two base-36 digits. Without the length check `parseInt` would read
      // "2mx" as a number and quietly accept a line that was mangled in transit.
      if (piece.length !== 2) return null;
      var index = parseInt(piece, 36);
      if (isNaN(index) || index < 0 || index >= CITIES.length) return null;
      cities.push(cityFromRow(CITIES[index]));
    }
    return { cities: cities, h12: flags.charAt(0) === "1", byTime: flags.charAt(1) === "t" };
  }

  /* A list that arrived in the address: applied, saved, and then REMOVED FROM THE
   * ADDRESS.
   *
   * The URL has to end up clean (owner, 2026-11-18). A bookmark or a shared link that
   * still carries somebody's city list would hand that list to whoever opened it next,
   * and the back button would re-apply it over whatever the reader had since chosen. So
   * the parameter is read once, on arrival, and the address is rewritten without it. */
  function fromAddress() {
    var search = window.location.search;
    if (search.indexOf(LIST_PARAM + "=") === -1) return false;
    var read = readPayload(search);
    if (read) {
      state.cities = read.cities;
      state.h12 = read.h12;
      state.byTime = read.byTime;
      save();
    }
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    return read !== null;
  }

  // ── the views ───────────────────────────────────────────────────────────────────────
  //
  // ONE STATE, SEVERAL ARRANGEMENTS. Every view reads the same cities and the same clock;
  // none of them keeps anything of its own. So switching is free, and a city added in one
  // is in all of them.
  //
  // A view registers itself with `Clock.register`, which is also how `dials.js` adds the
  // three dials without this file knowing anything about them.

  var el = {};
  //: How long a just-added row stays lit before it is an ordinary row again.
  var FRESH_MS = 2600;
  //: The fewest copies of the sequence the carousel lays down, and the least content it
  //: wants in front of it — enough that a flick never reaches an end before the scroller
  //: has been moved back a copy.
  var LOOP_LEAST_COPIES = 5;
  var LOOP_SCREENS_WANTED = 4;
  //: Long enough for the smooth scroll home to have finished before the loop is allowed
  //: to move the scroller underneath it again.
  var LOOP_HOME_MS = 800;
  //: Untouched for this long, the carousel goes back to where you are.
  var LOOP_IDLE_MS = 5 * 60 * 1000;

  var rowRefs = [];
  var loopEntries = [];
  var loopRefs = [];
  var loopBlocks = [];
  var loopCopies = LOOP_LEAST_COPIES;
  var loopHoming = false;
  var loopIdleTimer = 0;
  var dayCache = {};
  var views = [];
  var current = "";
  var railWait = 0;
  var settling = 0;
  var touched = false;
  //: Where the view is kept, so a reload and a shared link both land where they were.
  var ROUTE_PREFIX = "#";
  //: How long after the last scroll event the rail is taken to have settled. Short enough
  //: that the bar keeps up with a drag, long enough not to fire on every frame of one.
  var RAIL_SETTLE_MS = 90;
  //: When to put the rail back on its view while the page is still arriving: after the
  //: fonts, and after anything slower. Stops as soon as the reader touches the rail.
  var HOLD_AT_MS = [250, 900, 2000];
  //: How long a scroll WE started is left alone. Without it the scroll events from our
  //: own scroll are read back before it has landed, the rail is judged to be on the view
  //: it is leaving, and we are sent back there — which is why opening `#ampm` showed the
  //: list every time while `#dial24`, one screen along, happened to arrive in time.
  var RAIL_OURS_MS = 600;

  function pick(id) {
    return document.getElementById(id);
  }

  function dayFor(city, now) {
    var parts = partsIn(city.zone, now);
    var key = city.zone + "|" + city.lat + "|" + parts.year + parts.month + parts.day;
    if (!dayCache[key]) dayCache[key] = solarDay(city, now);
    return dayCache[key];
  }

  function timeMarkup(parts) {
    var hour = Number(parts.hour);
    if (!state.h12) return '<span class="hm">' + pad(hour) + ":" + parts.minute + "</span>";
    var half = hour % 12 === 0 ? 12 : hour % 12;
    return (
      '<span class="hm">' + half + ":" + parts.minute + "</span>" +
      '<span class="ampm">' + (hour < 12 ? "AM" : "PM") + "</span>"
    );
  }

  function solarWords(day) {
    if (day.rise === null && day.set === null) {
      return day.allDay ? "The sun does not set today" : "The sun does not rise today";
    }
    var words = [];
    if (day.rise !== null) words.push("Sunrise " + hhmm(day.rise));
    if (day.set !== null) words.push("Sunset " + hhmm(day.set));
    return words.join(" · ");
  }

  /* The city this device is in, from the browser's own zone. */
  function hereCity() {
    var zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    var row = byZone(zone);
    return row
      ? cityFromRow(row)
      : { name: zoneLabel(zone), country: "", zone: zone, lat: null, lon: null };
  }

  /* Every city a dial should draw: the ones on the list, and where the reader is, which is
   * marked so a view can set it apart. Each carries the clock reading it needs, so a view
   * does no time arithmetic of its own. */
  function placed(now) {
    var here = hereCity();
    var all = [{ city: here, here: true }];
    state.cities.forEach(function (city) {
      if (city.zone !== here.zone) all.push({ city: city, here: false });
    });
    return all.map(function (one) {
      var parts = partsIn(one.city.zone, now);
      return {
        city: one.city,
        here: one.here,
        parts: parts,
        hour: Number(parts.hour),
        minutes: Number(parts.hour) * 60 + Number(parts.minute),
        offset: offsetMinutes(parts)
      };
    });
  }

  // ── the Cities view ─────────────────────────────────────────────────────────────────

  function hereNow(now) {
    var city = hereCity();
    var parts = partsIn(city.zone, now);
    el.hereName.textContent = city.name;
    el.hereZone.textContent = city.zone + " · " + parts.timeZoneName;
    el.hereTime.innerHTML = timeMarkup(parts) + '<span class="sec">' + parts.second + "</span>";
    el.hereDate.textContent =
      parts.weekday + " " + Number(parts.day) + " " +
      new Intl.DateTimeFormat("en-GB", { timeZone: city.zone, month: "long" }).format(now) + " " + parts.year;

    if (city.lat === null) {
      el.hereArc.hidden = true;
      el.hereSolar.textContent = "No sun times for " + city.zone + " — the city table does not hold it.";
      return offsetMinutes(parts);
    }
    var day = dayFor(city, now);
    el.hereArc.hidden = false;
    el.hereArc.style.background = bandFor(day);
    el.hereArc.firstElementChild.style.left =
      (((Number(parts.hour) * 60 + Number(parts.minute)) / MINUTES_A_DAY) * 100).toFixed(2) + "%";
    el.hereSolar.textContent = solarWords(day);
    return offsetMinutes(parts);
  }

  function shown() {
    var list = state.cities.slice();
    if (!state.byTime) return list;
    var now = new Date();
    return list.sort(function (a, b) {
      return offsetMinutes(partsIn(a.zone, now)) - offsetMinutes(partsIn(b.zone, now));
    });
  }

  /* ONE CARD, MADE IN ONE PLACE and used by both the list and the carousel. The two
   * views differ in how they are scrolled, and in nothing else — so a card drawn for one
   * of them has to be the card drawn for the other, down to the daylight strip and the
   * sun times (owner, 2026-11-18: "exactly the same items ... the only difference is the
   * infinite scroll"). */
  function makeRow(city, mine) {
    var item = document.createElement("li");
    item.className = "row" + (mine ? " mine" : "");
    item.innerHTML =
      '<p class="name"></p><p class="time"></p>' +
      '<p class="where"></p><p class="shift"></p>' +
      '<div class="band"><div class="arc"><i class="pin"></i></div></div>' +
      '<div class="foot-line"><span class="solar"></span>' +
      '<button type="button" class="drop">Remove</button></div>';
    var refs = {
      city: city,
      mine: mine === true,
      node: item,
      name: item.querySelector(".name"),
      time: item.querySelector(".time"),
      where: item.querySelector(".where"),
      shift: item.querySelector(".shift"),
      arc: item.querySelector(".arc"),
      pin: item.querySelector(".pin"),
      solar: item.querySelector(".solar")
    };
    item.querySelector(".drop").addEventListener("click", function () {
      state.cities = state.cities.filter(function (one) {
        return !(one.zone === city.zone && one.name === city.name);
      });
      save();
      buildRows();
      redraw();
    });
    refs.name.textContent = city.name;
    return refs;
  }

  function fillRow(refs, now, hereOffset) {
    var city = refs.city;
    var parts = partsIn(city.zone, now);
    var minutes = Number(parts.hour) * 60 + Number(parts.minute);
    refs.time.innerHTML = timeMarkup(parts);
    refs.where.textContent = [city.country, parts.weekday + " " + Number(parts.day)]
      .filter(Boolean)
      .join(" · ");
    var difference = offsetMinutes(parts) - hereOffset;
    refs.shift.textContent = refs.mine
      ? "Where you are"
      : difference === 0
        ? "Same time as here"
        : offsetWord(difference) + " from here";

    var day = dayFor(city, now);
    refs.arc.style.background = bandFor(day);
    refs.pin.style.left = ((minutes / MINUTES_A_DAY) * 100).toFixed(2) + "%";
    refs.solar.textContent = solarWords(day);
    refs.node.classList.toggle("asleep", sunElevation(now, city.lat, city.lon) < CIVIL_TWILIGHT);
  }

  function buildRows() {
    el.rows.textContent = "";
    rowRefs = [];
    var list = shown();
    el.empty.hidden = list.length > 0;

    list.forEach(function (city) {
      var refs = makeRow(city, false);
      el.rows.appendChild(refs.node);
      rowRefs.push(refs);
    });
    buildLoop();
  }

  function drawList(now) {
    var hereOffset = hereNow(now);
    rowRefs.forEach(function (refs) {
      fillRow(refs, now, hereOffset);
    });
  }

  // ── the carousel ────────────────────────────────────────────────────────────────────

  /* THE SAME CITIES AS A RING WITH NO ENDS.
   *
   * There is no such thing as an endless scroller; there is a long one that is MOVED BACK
   * UNDER THE READER before they reach either end. The sequence is laid down several times
   * over, and whenever the scroll position nears an edge it is shifted by exactly one
   * copy's height. Every copy is identical, so the shift changes nothing that is on the
   * screen — the reader sees a list that keeps going, in both directions, for ever.
   *
   * THE SHIFT MUST NOT HAPPEN DURING THE SMOOTH SCROLL HOME. Setting `scrollTop` cancels a
   * smooth scroll in flight, so the loop stands down while `loopHoming` is set and puts
   * things right once the journey is over.
   *
   * HOW MANY COPIES is measured rather than guessed: enough that three screenfuls sit in
   * front of the reader, and never fewer than five. Too few and a fast flick reaches the
   * end of the content before the shift can be applied.
   */
  function ringOrder() {
    var here = hereCity();
    var list = [{ city: here, mine: true }];
    state.cities.forEach(function (city) {
      if (city.zone === here.zone && city.name === here.name) return;
      list.push({ city: city, mine: false });
    });
    var now = new Date();
    return list.sort(function (a, b) {
      return offsetMinutes(partsIn(a.city.zone, now)) - offsetMinutes(partsIn(b.city.zone, now));
    });
  }

  //: One copy of the ring: the same `<ol class="rows">` of the same cards the list uses.
  function loopBlock(entries) {
    var block = document.createElement("ol");
    block.className = "rows";
    var refs = [];
    entries.forEach(function (entry) {
      var row = makeRow(entry.city, entry.mine);
      block.appendChild(row.node);
      refs.push(row);
    });
    return { block: block, refs: refs };
  }

  function buildLoop() {
    if (!el || !el.loopInner) return;
    loopEntries = ringOrder();
    el.loopInner.textContent = "";
    loopRefs = [];
    loopBlocks = [];

    // One copy first, so its height is a measurement and not an estimate.
    var first = loopBlock(loopEntries);
    el.loopInner.appendChild(first.block);
    loopRefs.push(first.refs);
    loopBlocks.push(first.block);
    var oneHigh = first.block.offsetHeight || 1;
    var screens = Math.ceil((el.loopScroll.clientHeight * LOOP_SCREENS_WANTED) / oneHigh) + 2;
    loopCopies = Math.max(LOOP_LEAST_COPIES, screens);

    for (var copy = 1; copy < loopCopies; copy++) {
      var more = loopBlock(loopEntries);
      el.loopInner.appendChild(more.block);
      loopRefs.push(more.refs);
      loopBlocks.push(more.block);
    }
    goHome(false);
  }

  //: One copy's height, measured between two consecutive copies — which is the distance
  //: the scroller has to move for the picture to be unchanged. Dividing the whole by the
  //: number of copies would be wrong: the copies are spaced apart, so the total is not a
  //: whole number of them.
  function copyHeight() {
    if (loopBlocks.length < 2) return 0;
    return loopBlocks[1].offsetTop - loopBlocks[0].offsetTop;
  }

  function mineIndex() {
    for (var i = 0; i < loopEntries.length; i++) {
      if (loopEntries[i].mine) return i;
    }
    return -1;
  }

  //: Where the scroller has to be for a given copy of *here* to sit in the middle.
  function restingPlace(copy) {
    var index = mineIndex();
    if (index < 0 || !loopRefs[copy]) return null;
    var node = loopRefs[copy][index].node;
    return node.offsetTop - (el.loopScroll.clientHeight - node.offsetHeight) / 2;
  }

  function goHome(smooth) {
    if (!loopRefs.length) return;
    var middle = Math.floor(loopCopies / 2);
    var wanted = restingPlace(middle);
    if (wanted === null) return;

    if (smooth) {
      // THE NEAREST COPY, so the journey home is always a short one. Every copy is the
      // same list, so any of them is "home"; going to the middle one from wherever the
      // reader has drifted would be a scroll of arbitrary length.
      var from = el.loopScroll.scrollTop;
      for (var copy = 0; copy < loopCopies; copy++) {
        var place = restingPlace(copy);
        if (place !== null && Math.abs(place - from) < Math.abs(wanted - from)) wanted = place;
      }
      loopHoming = true;
      el.loopScroll.scrollTo({ top: wanted, behavior: motion() });
      window.setTimeout(function () {
        loopHoming = false;
        reseat();
      }, LOOP_HOME_MS);
      return;
    }
    el.loopScroll.scrollTop = wanted;
  }

  /* The shift, by WHOLE COPIES AND AS MANY AS IT TAKES.
   *
   * A flick does not move the scroller by a little between two scroll events; on a phone
   * it can cross most of a screen. A guard band of half a copy, shifted by exactly one
   * copy, is therefore not enough twice over — the reader reaches the end of the content
   * before the shift fires, which is the moment the screen goes blank. So the band is a
   * whole copy at each end, and the correction is however many copies it takes to land
   * back inside it, computed rather than applied once. */
  function reseat() {
    if (loopHoming || !loopRefs.length) return;
    var one = copyHeight();
    var scroller = el.loopScroll;
    if (one <= 0 || scroller.scrollHeight <= scroller.clientHeight) return;

    var low = one;
    var high = one * (loopCopies - 2);
    if (high <= low) return;
    if (scroller.scrollTop < low) {
      scroller.scrollTop += one * Math.ceil((low - scroller.scrollTop) / one);
    } else if (scroller.scrollTop > high) {
      scroller.scrollTop -= one * Math.ceil((scroller.scrollTop - high) / one);
    }
  }

  function loopTouched() {
    if (loopIdleTimer) window.clearTimeout(loopIdleTimer);
    loopIdleTimer = window.setTimeout(function () {
      if (current === "loop") goHome(true);
    }, LOOP_IDLE_MS);
  }

  function drawLoop(now) {
    if (!loopRefs.length) return;
    var hereOffset = offsetMinutes(partsIn(hereCity().zone, now));
    loopRefs.forEach(function (copy) {
      copy.forEach(function (refs) {
        fillRow(refs, now, hereOffset);
      });
    });
  }

  // ── adding a city ───────────────────────────────────────────────────────────────────

  function searchHits(typed) {
    var needle = typed.trim().toLowerCase();
    if (!needle) return [];
    var hits = [];
    for (var i = 0; i < CITIES.length && hits.length < HITS_SHOWN; i++) {
      var row = CITIES[i];
      var hay = (row[0] + " " + row[1] + " " + row[2]).toLowerCase().replace(/_/g, " ");
      if (hay.indexOf(needle) !== -1) hits.push(row);
    }
    return hits;
  }

  /* THE SAME ADD BOX APPEARS ON MORE THAN ONE SCREEN, so it is a thing rather than a
   * place: each box carries its own field and its own list of hits, and typing in one
   * leaves the other alone. It is also how you look a time up without adding anything —
   * which is why the hour beside each hit is set in the clock's own figures, at a size
   * meant to be read (owner, 2026-11-18). */
  function drawHits(box) {
    var typed = box.search.value;
    box.hits.textContent = "";
    var now = new Date();

    searchHits(typed).forEach(function (row) {
      var city = cityFromRow(row);
      var item = document.createElement("li");
      var button = document.createElement("button");
      button.type = "button";
      var parts = partsIn(city.zone, now);
      button.innerHTML =
        "<span>" + city.name + ' <span class="at">' + city.country + "</span></span>" +
        '<span class="hit-time">' + pad(Number(parts.hour)) + ":" + parts.minute + "</span>";
      button.addEventListener("click", function () {
        add(city);
      });
      item.appendChild(button);
      box.hits.appendChild(item);
    });

    // A zone typed in full that the table does not hold — carried by its own name.
    var trimmed = typed.trim();
    if (trimmed.indexOf("/") !== -1 && !byZone(trimmed) && known(trimmed)) {
      var own = document.createElement("li");
      var mine = document.createElement("button");
      mine.type = "button";
      mine.innerHTML =
        "<span>" + zoneLabel(trimmed) + ' <span class="at">' + trimmed + "</span></span>" +
        '<span class="at">Add zone</span>';
      mine.addEventListener("click", function () {
        add({ name: zoneLabel(trimmed), country: "", zone: trimmed, lat: 0, lon: 0 });
      });
      own.appendChild(mine);
      box.hits.appendChild(own);
    }
    box.hits.hidden = box.hits.childElementCount === 0;
    box.clear.hidden = box.search.value === "";
  }

  function add(city) {
    var already = state.cities.some(function (one) {
      return one.zone === city.zone && one.name === city.name;
    });
    if (!already) state.cities.push(city);
    save();
    el.boxes.forEach(function (box) {
      box.search.value = "";
      drawHits(box);
    });
    buildRows();
    redraw();
    reveal(city);
  }

  /* THE ROW YOU JUST ADDED IS SCROLLED TO AND LIT. The add box sits under *here*, above
   * the list, and the list is sorted by time — so a new city lands wherever its hour puts
   * it, which may be well down the page and out of sight. Without this, adding a city
   * looks like nothing happening (owner, 2026-11-18). */
  function reveal(city) {
    var refs = rowRefs.filter(function (one) {
      return one.city.zone === city.zone && one.city.name === city.name;
    })[0];
    if (!refs) return;
    var view = el.viewOfList;
    var top = refs.node.getBoundingClientRect().top -
      view.getBoundingClientRect().top + view.scrollTop;
    view.scrollTo({
      top: Math.max(0, top - (view.clientHeight - refs.node.offsetHeight) / 2),
      behavior: motion()
    });
    refs.node.classList.add("fresh");
    window.setTimeout(function () {
      refs.node.classList.remove("fresh");
    }, FRESH_MS);
  }

  // ── the QR view ─────────────────────────────────────────────────────────────────────

  function drawQr(text) {
    var code = window.AigonQR.encode(text);
    var canvas = el.qr;
    var pen = canvas.getContext("2d");
    if (!code) {
      canvas.hidden = true;
      el.qrNote.textContent =
        "Too many cities for one code (" + text.length + " characters, " + window.AigonQR.maxBytes +
        " is the most a code holds). Use the text below instead.";
      return;
    }
    canvas.hidden = false;
    var quiet = 4;
    var modules = code.size + quiet * 2;
    var scale = Math.max(2, Math.floor(320 / modules));
    canvas.width = modules * scale;
    canvas.height = modules * scale;
    pen.fillStyle = "#ffffff";
    pen.fillRect(0, 0, canvas.width, canvas.height);
    pen.fillStyle = "#000000";
    for (var y = 0; y < code.size; y++) {
      for (var x = 0; x < code.size; x++) {
        if (code.dark(x, y)) pen.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
      }
    }
    el.qrNote.textContent =
      state.cities.length + (state.cities.length === 1 ? " city" : " cities") + " · version " + code.version;
  }

  /* THE CODE VIEW SHOWS NO TIMES, deliberately: it is the view you hold up to another
   * device, and a clock ticking in the corner of the photograph helps nobody. */
  function drawCode() {
    var text = payloadUrl();
    el.payload.value = text;
    drawQr(text);
    el.qrCities.textContent = "";
    state.cities.forEach(function (city) {
      var item = document.createElement("li");
      item.innerHTML = "<span>" + city.name + '</span><span class="at">' + city.zone + "</span>";
      el.qrCities.appendChild(item);
    });
  }

  function said(words, bad) {
    el.said.textContent = words;
    el.said.classList.toggle("bad", bad === true);
  }

  function apply() {
    var read = readPayload(el.importBox.value);
    if (!read) {
      said("That is not a code this page wrote. Nothing was changed.", true);
      return;
    }
    state.cities = read.cities;
    state.h12 = read.h12;
    state.byTime = read.byTime;
    save();
    el.importBox.value = "";
    said(read.cities.length + (read.cities.length === 1 ? " city" : " cities") + " taken from the code.");
    applyTheme();
    buildRows();
    redraw();
  }

  // ── the menu, and which view is on ──────────────────────────────────────────────────

  /* A view: its id (which is also its address), the words in the menu, the element it
   * owns, and what to draw. `draw` is called on every tick while the view is showing and
   * never while it is not. */
  function register(id, name, node, draw) {
    views.push({ id: id, name: name, node: node, draw: draw });
  }

  function buildMenu() {
    el.viewList.textContent = "";
    views.forEach(function (view) {
      var item = document.createElement("li");
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = view.name;
      button.setAttribute("aria-current", view.id === current ? "true" : "false");
      button.addEventListener("click", function () {
        show(view.id);
        closeMenu();
      });
      item.appendChild(button);
      el.viewList.appendChild(item);
    });
  }

  /* Move to a view by SCROLLING THE RAIL TO IT. The views are not hidden and shown any
   * more — they sit side by side, and which one you are on is a scroll position. So this
   * asks the browser to scroll, and `arrived` notices when it has. */
  function show(id) {
    var wanted = views.filter(function (view) {
      return view.id === id;
    })[0];
    if (!wanted) wanted = views[0];
    ours();
    el.rail.scrollTo({ left: railLeft(wanted.id), behavior: motion() });
    arrived(wanted.id);
  }

  /* How far along the rail a view sits. BY ITS INDEX, not by `offsetLeft`: the rail is
   * not a positioned ancestor, so `offsetLeft` is measured from somewhere else entirely
   * and scrolling to it lands the rail between two screens. */
  function railLeft(id) {
    var where = views.map(function (view) {
      return view.id;
    }).indexOf(id);
    return Math.max(0, where) * el.rail.clientWidth;
  }

  /* Put the rail exactly on a view, with no animation and without telling anyone: used
   * when the layout moved under us rather than when the reader asked to go somewhere. */
  /* Put the rail on a view and KEEP it there while the page finishes arriving.
   *
   * The rail is positioned by multiplying a screen's width, and that width is not final
   * until the fonts and the gem have loaded. Each of those shifts the layout, the snap
   * container re-snaps, and the rail can end up between two screens — which looked like
   * the app ignoring the view it was asked for. So it is put back at every moment the
   * layout is likely to have moved, and not once the reader has taken hold of it. */
  function hold(id) {
    settle(id);
    window.requestAnimationFrame(function () {
      if (!touched) settle(id);
    });
    window.addEventListener("load", function () {
      if (!touched) settle(current);
    });
    HOLD_AT_MS.forEach(function (when) {
      window.setTimeout(function () {
        if (!touched) settle(current);
      }, when);
    });
  }

  /* Jump the rail, with no animation, in a way no browser can decline.
   *
   * `scrollTo({behavior: "auto"})` means "do whatever the CSS says", and the CSS says
   * `scroll-behavior: smooth` — so it animated. `behavior: "instant"` is the spec's word
   * for a jump and was simply ignored here: the call returned, and the rail did not move
   * at all, which is how the dial views kept opening on the list.
   *
   * So the smooth behaviour is turned off ON THE ELEMENT for the one assignment that has
   * to be instant, and put back. An inline style beats the stylesheet, `scrollLeft` is as
   * old as scrolling, and there is nothing left to support or not support. */
  function settle(id) {
    ours();
    var was = el.rail.style.scrollBehavior;
    el.rail.style.scrollBehavior = "auto";
    el.rail.scrollLeft = railLeft(id);
    el.rail.style.scrollBehavior = was;
  }

  /* Mark the next stretch of scrolling as ours, so `onRail` leaves it alone. */
  function ours() {
    window.clearTimeout(settling);
    settling = window.setTimeout(function () {
      settling = 0;
    }, RAIL_OURS_MS);
  }

  function motion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
  }

  /* The view the rail is now on: the name in the bar, the mark in the menu, the address.
   * Called both when we scrolled on purpose and when the reader dragged. */
  function arrived(id) {
    if (id === current) return;
    current = id;
    var wanted = views.filter(function (view) {
      return view.id === id;
    })[0];
    el.viewName.textContent = wanted ? wanted.name : "";
    if (window.location.hash !== ROUTE_PREFIX + current) {
      window.history.replaceState(null, "", ROUTE_PREFIX + current);
    }
    buildMenu();
    redraw();
  }

  /* Which screen the rail is showing, from where it is scrolled to. */
  function onRail() {
    if (settling) return;
    var width = el.rail.clientWidth;
    if (!width) return;
    var index = Math.round(el.rail.scrollLeft / width);
    var view = views[Math.min(views.length - 1, Math.max(0, index))];
    if (view) arrived(view.id);
  }

  function openMenu() {
    el.menu.hidden = false;
    el.menuOpen.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    el.menu.hidden = true;
    el.menuOpen.setAttribute("aria-expanded", "false");
  }

  /* The theme the reader chose. The stylesheet already answers to `data-theme`; this only
   * decides whether the attribute is there at all, since its absence IS "follow the
   * device". The browser chrome is told too, so the status bar matches the page. */
  function applyTheme() {
    var root = document.documentElement;
    if (state.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", state.theme);

    var dark = state.theme === "dark" ||
      (state.theme === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var bar = document.querySelector('meta[name="theme-color"]');
    if (bar) bar.setAttribute("content", dark ? "#1f2227" : "#f6f8fa");

    Array.prototype.forEach.call(el.themeRow.children, function (button) {
      button.setAttribute("aria-pressed", button.dataset.themeChoice === state.theme ? "true" : "false");
    });
  }

  /* Draw the view that is showing, now. Called every second, and whenever the state
   * changes under it. */
  /* Draw the screen you are on, AND the ones either side of it.
   *
   * On a rail the next screen is visible the moment a drag starts, so drawing only the
   * current one shows a blank panel sliding in. The dials skip the work themselves when
   * nothing they show has changed, so the neighbours cost almost nothing between
   * minutes. */
  function redraw() {
    var now = new Date();
    var where = views.map(function (view) {
      return view.id;
    }).indexOf(current);
    views.forEach(function (view, index) {
      if (Math.abs(index - where) <= 1) view.draw(now);
    });
  }

  function start() {
    el = {
      hereName: pick("hereName"), hereZone: pick("hereZone"), hereTime: pick("hereTime"),
      hereDate: pick("hereDate"), hereArc: pick("hereArc"), hereSolar: pick("hereSolar"),
      rows: pick("clockRows"), empty: pick("clockEmpty"),
      search: pick("clockSearch"), hits: pick("clockHits"),
      qr: pick("clockQr"), qrNote: pick("clockQrNote"), qrCities: pick("qrCities"),
      payload: pick("clockPayload"), importBox: pick("clockImport"), said: pick("clockSaid"),
      menu: pick("menu"), menuOpen: pick("menuOpen"), viewList: pick("viewList"),
      viewName: pick("viewName"), themeRow: pick("themeRow"), rail: pick("rail"),
      viewOfList: pick("view-list"),
      loopScroll: pick("loopScroll"), loopInner: pick("loopInner"), bar: pick("bar"),
      loopSearch: pick("loopSearch"), loopHits: pick("loopHits"),
      clear: pick("clockClear"), loopClear: pick("loopClear")
    };

    el.boxes = [
      { search: el.search, hits: el.hits, clear: el.clear },
      { search: el.loopSearch, hits: el.loopHits, clear: el.loopClear }
    ];

    load();
    fromAddress();
    applyTheme();
    buildRows();

    register("list", "Cities", pick("view-list"), drawList);
    register("loop", "Carousel", pick("view-loop"), drawLoop);
    el.loopScroll.addEventListener("scroll", function () {
      reseat();
      loopTouched();
    }, { passive: true });
    // A belt for the scroll event: it is throttled during momentum in some browsers, and
    // these fire when the finger leaves and when the movement finally stops.
    ["touchend", "touchcancel", "scrollend"].forEach(function (name) {
      el.loopScroll.addEventListener(name, function () {
        reseat();
      }, { passive: true });
    });
    /* THE BAR IS THE WAY BACK. Tapping it anywhere that is not already a control takes
     * the list to its top and the carousel to where you are; on the other screens there
     * is nowhere to go back to, so it does nothing (owner, 2026-11-18). */
    el.bar.addEventListener("click", function (event) {
      if (event.target.closest("a, button")) return;
      if (current === "list") el.viewOfList.scrollTo({ top: 0, behavior: motion() });
      if (current === "loop") {
        goHome(true);
        loopTouched();
      }
    });
    loopTouched();
    if (window.ClockDials) window.ClockDials.register(Clock);
    register("qr", "QR code", pick("view-qr"), drawCode);

    var asked = window.location.hash.replace(ROUTE_PREFIX, "");
    var first = views.filter(function (view) {
      return view.id === asked;
    })[0] || views[0];
    arrived(first.id);
    hold(first.id);

    // THE READER HAS TOUCHED IT, so stop putting it back. Everything below exists to
    // fight the layout settling under us; none of it may fight a finger.
    ["touchstart", "wheel", "pointerdown", "keydown"].forEach(function (name) {
      window.addEventListener(name, function () {
        touched = true;
      }, { passive: true, once: true });
    });
    window.setInterval(redraw, 1000);
    window.addEventListener("hashchange", function () {
      show(window.location.hash.replace(ROUTE_PREFIX, "") || "list");
    });

    el.menuOpen.addEventListener("click", function () {
      if (el.menu.hidden) openMenu();
      else closeMenu();
    });
    document.addEventListener("click", function (event) {
      if (el.menu.hidden) return;
      if (!el.menu.contains(event.target) && !el.menuOpen.contains(event.target)) closeMenu();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    // The rail is the source of truth for which view is on; watch where it stops.
    el.rail.addEventListener("scroll", function () {
      window.clearTimeout(railWait);
      railWait = window.setTimeout(onRail, RAIL_SETTLE_MS);
    }, { passive: true });
    window.addEventListener("resize", function () {
      window.clearTimeout(railWait);
      railWait = window.setTimeout(function () {
        settle(current);
      }, RAIL_SETTLE_MS);
    });
    Array.prototype.forEach.call(el.themeRow.children, function (button) {
      button.addEventListener("click", function () {
        state.theme = button.dataset.themeChoice;
        save();
        applyTheme();
      });
    });
    // Following the device means following it as it changes, not only at load.
    if (window.matchMedia) {
      var watcher = window.matchMedia("(prefers-color-scheme: dark)");
      if (watcher.addEventListener) watcher.addEventListener("change", applyTheme);
    }
    el.boxes.forEach(function (box) {
      box.search.addEventListener("input", function () {
        drawHits(box);
      });
      box.clear.addEventListener("click", function () {
        box.search.value = "";
        drawHits(box);
        box.search.focus();
      });
    });
    pick("clockApply").addEventListener("click", apply);
    pick("clockCopy").addEventListener("click", function () {
      var text = el.payload.value;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () {
            said("Copied.");
          },
          function () {
            el.payload.select();
            said("Press copy on the selection.", true);
          }
        );
        return;
      }
      el.payload.select();
      said("Press copy on the selection.", true);
    });
  }

  /* What a view needs to draw itself, and nothing else. `dials.js` is written against
   * this and knows nothing of the page's markup beyond the element it is given. */
  var Clock = {
    register: register,
    placed: placed,
    state: state,
    pick: pick,
    pad: pad,
    hhmm: hhmm,
    partsIn: partsIn,
    offsetMinutes: offsetMinutes,
    sunElevation: sunElevation,
    dayFor: dayFor,
    zoneLabel: zoneLabel,
    MINUTES_A_DAY: MINUTES_A_DAY,
    CIVIL_TWILIGHT: CIVIL_TWILIGHT,
    RAMP: RAMP
  };
  window.Clock = Clock;

  /* OFFLINE AFTER THE FIRST OPEN (`sw.js`). Registered late and failing quietly: a
   * browser that refuses service workers, or a page opened from a file, still gets the
   * whole clock — it simply needs the network to start it.
   *
   * AND IT UPDATES ITSELF, which it has to. Installed on a home screen this app has no
   * address bar and no reload button, and its own layout rules out pull-to-refresh: the
   * body does not scroll, the rail does. So an installed copy had NO WAY to take a new
   * build — it would sit on the one it had, looking like nothing had shipped. When a new
   * worker takes over, the page reloads itself, once. */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/clock/sw.js", { scope: "/clock/" }).catch(function () {});
    });
    var reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      // ONCE. `controllerchange` can fire again during the reload it causes, and a reload
      // that causes a reload is a page that never finishes loading.
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
