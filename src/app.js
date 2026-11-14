// Draws the screens and handles taps. The rules live in week.js.

import {
  DEFAULT_GOAL,
  dateString,
  dayName,
  parseList,
  newWeek,
  replaceItems,
  findDay,
  startDay,
  toggleItem,
  finishedDayCount,
} from "./week.js";
import { awardFinish, unopenedGifts, openGift } from "./rewards.js";
import { shortDate, summarize, weekStreak, totals, recentWeeks } from "./history.js";
import { goldenCount, prizeProgress } from "./prize.js";
import { makeBackup, readBackup } from "./backup.js";
import { SETS, ALL_STICKERS } from "../data/stickers.js";
import { load, save } from "./storage.js";

const app = document.getElementById("app");
let state = load();
let screen = "home";
let justOpened = null; // what was inside the gift that was just opened
let justChecked = null; // the item that was just checked, so its box can pop
const calmMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const today = () => dateString(new Date());
// How many practice days a week to aim for. Set in the grown-ups area.
const goal = () => state.goal || DEFAULT_GOAL;

function update(changes) {
  state = { ...state, ...changes };
  save(state);
}

function go(name) {
  screen = name;
  render();
  window.scrollTo(0, 0);
}

// Small helper for building page elements without writing HTML strings.
// Text always goes in as text, so nothing typed into the list can run as code.
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "onClick") node.addEventListener("click", value);
    else if (key === "class") node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}

function icon(name) {
  const paths = {
    check: "M5 13l5 5L20 7",
    star: "M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8z",
    plus: "M12 5v14M5 12h14",
    flame: "M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z",
    moon: "M16 4a9 9 0 1 0 5 13A7.500 7.500 0 0 1 16 4z",
  };
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", `icon icon-${name}`);
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", paths[name]);
  svg.append(path);
  return svg;
}

function button(label, onClick, kind = "plain") {
  return el("button", { class: `btn btn-${kind}`, type: "button", onClick }, label);
}

// ---------- Home ----------

function homeScreen() {
  const week = state.week;
  if (!week) {
    return [
      topBar("Starry Keys"),
      el("section", { class: "card" },
        el("h2", {}, state.lastItems.length ? "Start your new week" : "Start your first week"),
        el("p", {}, "Add the list from your teacher's note, then check things off each day you practice."),
        button("Add this week's list", () => go("list"), "main")
      ),
      state.history.length > 0 && weeksCard(),
      prizeCard(),
      holdButton(),
    ];
  }

  const done = finishedDayCount(week);
  const todayDay = findDay(week, today());
  let action;
  if (!todayDay) {
    action = button("Start today's practice", startToday, "gold");
  } else if (!todayDay.finished) {
    action = button("Keep practicing", () => go("practice"), "gold");
  } else {
    action = el("div", { class: "sky-done" },
      el("p", {}, icon("check"), " Today's practice is done."),
      button("Change today's checks", () => go("practice"), "ghost")
    );
  }

  const waiting = unopenedGifts(week).length;
  return [
    topBar("This week's practice"),
    waiting > 0 && el("section", { class: "card gift-card" },
      el("p", {}, waiting === 1 ? "You have a gift to open." : `You have ${waiting} gifts to open.`),
      button(waiting === 1 ? "Open your gift" : "Open your gifts", () => go("gift"), "main")
    ),
    skyHero(done, action),
    weeksCard(),
    el("section", { class: "card" },
      el("h2", {}, "Your list"),
      weekGrid(week, null),
      el("div", { class: "row" },
        button("Change the list", () => go("list")),
        button("Start a new week", () => go("new-week"))
      )
    ),
    prizeCard(),
    holdButton(),
  ];
}

// The page title with the star total and the way into the sticker album.
function topBar(title) {
  return el("div", { class: "top" },
    el("h1", {}, title),
    el("div", { class: "top-right" },
      el("span", { class: "star-count", "aria-label": `${state.stars} stars` }, icon("star"), ` ${state.stars}`),
      button("Sticker album", () => go("album"))
    )
  );
}

function goalMessage(done) {
  const left = goal() - done;
  if (done === 0) return `Your goal is ${goal()} practice days this week.`;
  if (left > 1) return `${done} of ${goal()} done. ${left} more to reach your goal.`;
  if (left === 1) return `${done} of ${goal()} done. One more to reach your goal.`;
  if (left === 0) return "You reached your goal this week.";
  return `You reached your goal, plus ${-left} extra.`;
}

// ---------- The home screen pictures ----------

// A five-pointed star as SVG path data, centered on (cx, cy).
function starPath(cx, cy, outer) {
  const inner = outer * 0.46;
  let d = "";
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    d += `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(angle)).toFixed(1)} ${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }
  return d + "Z";
}

// This week as a night sky. Each practice day is a star sitting on a music
// staff like a note: gold once it's done, an outline while it's still to come.
function skyHero(done, action) {
  const slots = Math.max(goal(), done);
  const heights = [118, 96, 74, 96, 118, 74, 52]; // which staff line each star sits on
  const width = 600;
  const gap = slots > 1 ? Math.min(110, 440 / (slots - 1)) : 0;
  const first = width / 2 - (gap * (slots - 1)) / 2;
  let art = "";
  for (const y of [52, 74, 96, 118, 140]) {
    art += `<line x1="24" x2="${width - 24}" y1="${y}" y2="${y}" class="staff"/>`;
  }
  for (const [x, y, r] of [[52, 26, 2], [150, 18, 1.5], [268, 30, 2], [372, 16, 1.5], [470, 28, 2], [556, 20, 1.5], [96, 166, 1.5], [330, 170, 2], [520, 164, 1.5]]) {
    art += `<circle cx="${x}" cy="${y}" r="${r}" class="speck"/>`;
  }
  for (let i = 0; i < slots; i++) {
    const x = first + gap * i;
    const y = heights[i % heights.length];
    if (i < done) {
      art += `<circle cx="${x}" cy="${y}" r="38" class="halo"/>`
        + `<line x1="${x + 21}" x2="${x + 21}" y1="${y - 4}" y2="${y - 62}" class="stem"/>`
        + `<path d="${starPath(x, y, 26)}" class="star-done"/>`;
    } else {
      art += `<path d="${starPath(x, y, 22)}" class="star-todo"/>`;
    }
  }
  const sky = el("div", { class: "sky-art", role: "img",
    "aria-label": `${done} of ${goal()} practice days done this week` });
  sky.innerHTML = `<svg viewBox="0 0 ${width} 190" aria-hidden="true">${art}</svg>`;

  return el("section", { class: "sky" },
    sky,
    el("p", { class: "sky-message" }, goalMessage(done)),
    action
  );
}

// The last few weeks as a row of star stacks: one star per practice day.
// A week that reached its goal gets a check, and the weeks in the current
// streak are joined by a gold line.
function weeksCard() {
  const weeks = recentWeeks(state.history, state.week, goal(), 8);
  const streak = weekStreak(state.history, state.week, goal());
  const sum = totals(state.history, state.week, goal());
  const stickers = ALL_STICKERS.filter((sticker) => state.owned[sticker.id]).length;

  // The gold line runs from the first week of the streak to the last,
  // passing through any holiday weeks in between.
  const inStreak = weeks.map((week, index) => (week.inStreak ? index : -1)).filter((index) => index >= 0);
  const lineStart = inStreak.length ? inStreak[0] : -1;
  const lineEnd = inStreak.length ? inStreak[inStreak.length - 1] : -1;

  const columns = weeks.map((week, index) => {
    const before = index > lineStart && index <= lineEnd;
    const after = index >= lineStart && index < lineEnd;
    const stars = [];
    for (let i = 0; i < Math.min(week.days, 7); i++) stars.push(el("span", { class: "mini-star" }, icon("star")));
    let mark;
    if (week.holiday) mark = el("span", { class: "mark mark-holiday" }, icon("moon"));
    else if (week.met) mark = el("span", { class: "mark mark-met" }, icon("check"));
    else mark = el("span", { class: "mark" });
    return el("div", { class: `week-col ${week.met ? "week-met" : ""} ${week.current ? "week-now" : ""}` },
      el("div", { class: "week-stars" }, stars),
      el("div", { class: `week-mark ${before ? "link-left" : ""} ${after ? "link-right" : ""}` }, mark),
      el("span", { class: "week-label" }, week.current ? "Now" : shortDate(week.startedOn))
    );
  });

  const described = weeks.map((week) =>
    `${week.current ? "This week" : `Week of ${shortDate(week.startedOn)}`}: ${week.days} practice ${week.days === 1 ? "day" : "days"}${week.met ? ", goal reached" : ""}${week.holiday ? ", holiday" : ""}`
  ).join(". ");

  let streakLine;
  if (streak > 1) streakLine = `${streak} weeks in a row reaching your goal.`;
  else if (streak === 1) streakLine = "1 week reaching your goal. Keep the line going next week.";
  else streakLine = "Reach your goal this week to start a streak.";

  return el("section", { class: "card" },
    el("div", { class: "top" },
      el("h2", {}, "Your weeks"),
      state.history.length > 0 && button("Past weeks", () => go("past"))),
    el("div", { class: "weeks", role: "img", "aria-label": described }, columns),
    el("p", { class: `streak-line ${streak > 0 ? "streak-on" : ""}` }, streak > 0 && icon("flame"), ` ${streakLine}`),
    el("div", { class: "tally" },
      el("div", {}, el("strong", {}, String(sum.practiceDays)), sum.practiceDays === 1 ? " practice day" : " practice days"),
      el("div", {}, el("strong", {}, String(sum.goalsReached)), sum.goalsReached === 1 ? " goal reached" : " goals reached"),
      el("div", {}, el("strong", {}, `${stickers}`), ` of ${ALL_STICKERS.length} stickers`))
  );
}

function startToday() {
  update({ week: startDay(state.week, today()) });
  go("practice");
}

// ---------- The checklist grid ----------

// One row per item, one column per practice day. `activeDate` is the day
// whose boxes can be tapped; pass null for a look-only grid.
function weekGrid(week, activeDate) {
  const table = el("table", { class: "grid" });
  const head = el("tr", {}, el("th", {}, ""));
  for (const day of week.days) {
    const isActive = day.date === activeDate;
    head.append(
      el("th", { class: isActive ? "col-active" : "" },
        day.date === today() ? "Today" : dayName(day.date))
    );
  }
  table.append(head);

  for (const item of week.items) {
    const row = el("tr", {}, el("td", { class: "item-text" }, item.text));
    for (const day of week.days) {
      const checked = day.done.includes(item.id);
      if (day.date === activeDate) {
        row.append(el("td", {},
          el("button", {
            class: `box box-tap ${checked ? "box-on" : ""} ${checked && justChecked === item.id ? "box-pop" : ""}`,
            type: "button",
            "aria-pressed": String(checked),
            "aria-label": `${item.text}: ${checked ? "done" : "not done yet"}`,
            onClick: () => {
              justChecked = checked ? null : item.id;
              update({ week: toggleItem(state.week, day.date, item.id) });
              render();
              justChecked = null;
            },
          }, checked ? icon("check") : null)
        ));
      } else {
        row.append(el("td", {},
          el("span", {
            class: `box ${checked ? "box-on" : ""}`,
            role: "img",
            "aria-label": checked ? "done" : "not done",
          }, checked ? icon("check") : null)
        ));
      }
    }
    table.append(row);
  }
  return el("div", { class: "grid-wrap" }, table);
}

// ---------- Practice ----------

function practiceScreen() {
  const week = state.week;
  const day = findDay(week, today());
  if (!day) return homeScreen();
  const total = week.items.length;
  return [
    el("h1", {}, "Today's practice"),
    el("section", { class: "card" },
      el("p", { class: "label" }, `${day.done.length} of ${total} checked`),
      weekGrid(week, day.date),
      el("div", { class: "row" },
        button("Back", () => go("home")),
        button("Finish practice", () => {
          update(awardFinish(state.week, day.date, state.stars, goal()));
          go("finished");
        }, "main")
      )
    ),
  ];
}

function finishedScreen() {
  const week = state.week;
  const day = findDay(week, today());
  const total = week.items.length;
  const count = day ? day.done.length : 0;
  const headline = count === total ? "You did everything on your list" : "Practice done";
  return [
    el("section", { class: "card center" },
      el("div", { class: "big-star" }, icon("star")),
      el("h1", {}, headline),
      el("p", {}, `${count} of ${total} checked today. ${goalMessage(finishedDayCount(week))}`),
      el("p", { class: "earned" }, icon("star"), ` You earned ${day ? day.stars : 0} ${day && day.stars === 1 ? "star" : "stars"} today.`),
      unopenedGifts(week).length > 0
        ? button(unopenedGifts(week).length === 1 ? "Open your gift" : "Open your gifts", () => go("gift"), "main")
        : button("Done", () => go("home"), "main")
    ),
  ];
}

// ---------- Gifts ----------

const GIFT_NAMES = { small: "A gift", big: "A big gift", golden: "A golden gift" };

function giftBox(kind) {
  const colors = {
    small: ["#7a6ad8", "#4f46a8", "#f2b33d"],
    big: ["#58b7d6", "#2f7f9c", "#d9534f"],
    golden: ["#f7c948", "#b97f12", "#ffffff"],
  }[kind];
  const box = el("div", { class: `gift-art gift-${kind}` });
  box.innerHTML = `<svg viewBox="0 -14 48 62" aria-hidden="true">
    <rect x="6" y="20" width="36" height="24" rx="3" fill="${colors[0]}" stroke="${colors[1]}" stroke-width="2"/>
    <rect x="21" y="20" width="6" height="24" fill="${colors[2]}"/>
    <g class="lid">
      <rect x="3" y="12" width="42" height="10" rx="3" fill="${colors[0]}" stroke="${colors[1]}" stroke-width="2"/>
      <rect x="21" y="12" width="6" height="10" fill="${colors[2]}"/>
      <path d="M24 12c-4-9-13-7-10-2 2 3 6 2 10 2zM24 12c4-9 13-7 10-2-2 3-6 2-10 2z" fill="${colors[2]}" stroke="${colors[1]}" stroke-width="1.5"/>
    </g>
  </svg>`;
  return box;
}

// A burst of paper bits for the moment a sticker appears. It is only for
// show, so screen readers skip it, and it is left out for people who ask
// their device for less motion.
function confetti() {
  if (calmMotion()) return null;
  const colors = ["#ffc93c", "#ff7a6b", "#5b4fc4", "#3fc1c9", "#7ed492"];
  const bits = [];
  for (let i = 0; i < 26; i++) {
    const bit = el("span", { class: "bit" });
    bit.style.left = `${4 + ((i * 37) % 92)}%`;
    bit.style.background = colors[i % colors.length];
    bit.style.animationDelay = `${(i % 7) * 0.07}s`;
    bit.style.setProperty("--turn", `${(i % 2 ? 1 : -1) * (200 + i * 23)}deg`);
    bits.push(bit);
  }
  return el("div", { class: "confetti", "aria-hidden": "true" }, bits);
}

function stickerArt(sticker, shiny) {
  const art = el("div", { class: `sticker ${shiny ? "sticker-shiny" : ""}` });
  art.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true">${sticker.art}</svg>`;
  return art;
}

function giftScreen() {
  const waiting = unopenedGifts(state.week);

  if (justOpened) {
    const inside = justOpened;
    const next = waiting.length > 0
      ? button("Open the next gift", () => { justOpened = null; render(); }, "main")
      : button("Done", () => { justOpened = null; go("home"); }, "main");
    if (!inside.sticker) {
      return [el("section", { class: "card center" },
        el("div", { class: "big-star" }, icon("star")),
        el("h1", {}, "Your album is full"),
        el("p", {}, `You have every sticker, so this gift holds ${inside.bonusStars} extra stars.`),
        next)];
    }
    const set = SETS.find((s) => s.stickers.includes(inside.sticker));
    return [el("section", { class: "card center reveal-card" },
      confetti(),
      el("p", { class: "label" }, inside.shiny ? "New shiny sticker" : "New sticker"),
      el("div", { class: "reveal" }, stickerArt(inside.sticker, inside.shiny)),
      el("h1", {}, inside.sticker.name),
      el("p", {}, `It's in the ${set.name} page of your album.`),
      next)];
  }

  if (waiting.length === 0) return homeScreen();
  const gift = waiting[0];
  return [el("section", { class: "card center" },
    el("h1", {}, GIFT_NAMES[gift.kind]),
    el("button", {
      class: "gift-button", type: "button", "aria-label": "Open the gift",
      onClick: (event) => {
        const giftButton = event.currentTarget;
        if (giftButton.classList.contains("opening")) return;
        giftButton.classList.add("opening"); // the lid lifts off
        setTimeout(() => {
          const result = openGift(state.week, state.owned, state.stars,
            gift.date, gift.index, ALL_STICKERS, Math.random);
          justOpened = result.inside;
          update({ week: result.week, owned: result.owned, stars: result.stars });
          render();
        }, calmMotion() ? 0 : 700);
      },
    }, giftBox(gift.kind)),
    el("p", {}, "Tap the gift to open it."))];
}

// ---------- Sticker album ----------

function albumScreen() {
  const total = ALL_STICKERS.length;
  const have = ALL_STICKERS.filter((s) => state.owned[s.id]).length;
  return [
    el("div", { class: "top" },
      el("h1", {}, "Sticker album"),
      el("div", { class: "top-right" },
        el("span", { class: "star-count", "aria-label": `${state.stars} stars` }, icon("star"), ` ${state.stars}`),
        button("Back", () => go("home")))
    ),
    el("p", { class: "label" }, `${have} of ${total} stickers`),
    SETS.map((set) => {
      const count = set.stickers.filter((s) => state.owned[s.id]).length;
      return el("section", { class: "card" },
        el("h2", {}, `${set.name} `, el("span", { class: "label" }, `${count} of ${set.stickers.length}`)),
        el("div", { class: "album" }, set.stickers.map((sticker) => {
          const mine = state.owned[sticker.id];
          return mine
            ? el("div", { class: "slot" }, stickerArt(sticker, mine.shiny),
                el("span", { class: "slot-name" }, sticker.name))
            : el("div", { class: "slot slot-empty", role: "img", "aria-label": "Sticker not found yet" },
                el("div", { class: "sticker sticker-missing" }, "?"),
                el("span", { class: "slot-name" }, " "));
        }))
      );
    }),
  ];
}

// ---------- This week's list ----------

function listScreen() {
  const editing = Boolean(state.week);
  const box = el("textarea", {
    id: "list-box",
    rows: "7",
    placeholder: "C major scale, hands together\nMinuet, bars 1 to 8, slowly\nTheory book page 14",
    "aria-label": "This week's list, one thing per line",
    "aria-describedby": "list-help",
  });
  if (editing) box.value = state.week.items.map((item) => item.text).join("\n");

  const preview = el("ol", { class: "preview" });
  const error = el("p", { class: "error", role: "alert" });
  const showPreview = () => {
    error.textContent = "";
    preview.replaceChildren(...parseList(box.value).map((text) => el("li", {}, text)));
  };
  box.addEventListener("input", showPreview);
  showPreview();

  const repeats = editing ? [] : state.lastItems;
  const repeatRow = repeats.length
    ? el("div", {},
        el("p", { class: "label" }, "From last week (tap to add)"),
        el("div", { class: "chips" }, repeats.map((text) =>
          el("button", {
            class: "chip", type: "button",
            onClick: (event) => {
              box.value = (box.value.trim() ? box.value.trimEnd() + "\n" : "") + text;
              event.currentTarget.remove();
              showPreview();
            },
          }, icon("plus"), text)
        ))
      )
    : null;

  const saveList = () => {
    const texts = parseList(box.value);
    if (texts.length === 0) {
      error.textContent = "Add at least one thing to practice.";
      return;
    }
    update({
      week: editing ? replaceItems(state.week, texts) : newWeek(texts, today()),
    });
    go("home");
  };

  return [
    el("h1", {}, editing ? "Change the list" : "This week's list"),
    el("section", { class: "card" },
      el("p", { id: "list-help" },
        "Put one thing on each line. You can type, paste a list, or tap the microphone on the keyboard and read your teacher's note out loud. Say \"new line\" between things."),
      box,
      repeatRow,
      el("p", { class: "label" }, "Your checklist will be"),
      preview,
      error,
      el("div", { class: "row" },
        button("Cancel", () => go("home")),
        button(editing ? "Save the list" : "Make my checklist", saveList, "main")
      )
    ),
  ];
}

// ---------- Start a new week ----------

function newWeekScreen() {
  if (unopenedGifts(state.week).length > 0) {
    return [
      el("h1", {}, "Start a new week"),
      el("section", { class: "card" },
        el("p", {}, "You still have a gift from this week. Open it first so it isn't lost."),
        el("div", { class: "row" },
          button("Back", () => go("home")),
          button("Open your gift", () => go("gift"), "main"))
      ),
    ];
  }
  return [
    el("h1", {}, "Start a new week"),
    el("section", { class: "card" },
      el("p", {}, "This puts away this week's checklist so you can add the list from your new teacher's note."),
      el("div", { class: "row" },
        button("Keep this week", () => go("home")),
        button("Start a new week", () => {
          update({
            lastItems: state.week.items.map((item) => item.text),
            history: [...state.history, summarize(state.week, goal())],
            week: null,
          });
          go("list");
        }, "main")
      )
    ),
  ];
}

// ---------- Prize and the grown-ups area ----------

function prizeCard() {
  if (!state.prize) return null;
  const progress = prizeProgress(state.prize, goldenCount(state.history, state.week));
  const dots = [];
  for (let i = 0; i < progress.need; i++) {
    dots.push(el("span", { class: `gold-dot ${i < progress.have ? "gold-dot-on" : ""}` },
      i < progress.have ? icon("star") : null));
  }
  return el("section", { class: `card ${progress.earned ? "gift-card" : ""}` },
    el("h2", {}, progress.earned ? "You earned your prize" : "Your prize"),
    el("p", { class: "prize-text" }, state.prize.text),
    el("div", { class: "dots", role: "img",
      "aria-label": `${progress.have} of ${progress.need} golden gifts` }, dots),
    el("p", { class: "label" }, progress.earned
      ? "Show this to a grown-up."
      : `${progress.have} of ${progress.need} golden gifts. You get one each week you reach your goal.`)
  );
}

// The way into the grown-ups area: press and hold for three seconds.
function holdButton() {
  const HOLD_MS = 3000;
  let timer = null;
  const btn = el("button", { class: "hold", type: "button" },
    el("span", { class: "hold-fill" }), el("span", { class: "hold-text" }, "Grown-ups: press and hold"));
  const start = () => {
    if (timer) return;
    btn.classList.add("holding");
    timer = setTimeout(() => { timer = null; go("parent"); }, HOLD_MS);
  };
  const stop = () => {
    clearTimeout(timer);
    timer = null;
    btn.classList.remove("holding");
  };
  btn.addEventListener("pointerdown", start);
  for (const name of ["pointerup", "pointerleave", "pointercancel", "blur"]) btn.addEventListener(name, stop);
  btn.addEventListener("keydown", (event) => { if (event.key === " " || event.key === "Enter") start(); });
  btn.addEventListener("keyup", stop);
  btn.addEventListener("contextmenu", (event) => event.preventDefault());
  return el("div", { class: "hold-wrap" }, btn);
}

function stepper(label, value, min, max, onChange) {
  return el("div", { class: "stepper" },
    el("button", { class: "btn step-btn", type: "button", "aria-label": `${label}: one fewer`,
      onClick: () => { if (value > min) onChange(value - 1); } }, "−"),
    el("span", { class: "step-value", "aria-live": "polite" }, String(value)),
    el("button", { class: "btn step-btn", type: "button", "aria-label": `${label}: one more`,
      onClick: () => { if (value < max) onChange(value + 1); } }, "+")
  );
}

function toggle(label, on, onChange) {
  return el("button", { class: `btn toggle ${on ? "toggle-on" : ""}`, type: "button",
    "aria-pressed": String(on), onClick: () => onChange(!on) },
    on ? icon("check") : null, on ? ` ${label}: on` : `${label}: off`);
}

let prizeDraft = null; // the prize being typed in the grown-ups area

function parentScreen() {
  const week = state.week;
  const count = goldenCount(state.history, week);
  if (!prizeDraft) prizeDraft = { text: state.prize ? state.prize.text : "", need: state.prize ? state.prize.need : 5 };

  const prizeInput = el("input", { type: "text", class: "text-input", maxlength: "60",
    placeholder: "Movie night", "aria-label": "Prize" });
  prizeInput.value = prizeDraft.text;
  prizeInput.addEventListener("input", () => { prizeDraft.text = prizeInput.value; prizeError.textContent = ""; });
  const prizeError = el("p", { class: "error", role: "alert" });

  const recent = state.history.map((past, index) => ({ past, index })).reverse().slice(0, 6);

  return [
    el("div", { class: "top" },
      el("h1", {}, "Grown-ups"),
      button("Done", () => { prizeDraft = null; backupNote = ""; restoreDraft = null; go("home"); }, "main")),

    el("section", { class: "card" },
      el("h2", {}, "Weekly goal"),
      el("p", {}, "Practice days to aim for each week."),
      stepper("Weekly goal", goal(), 1, 7, (value) => { update({ goal: value }); render(); })
    ),

    el("section", { class: "card" },
      el("h2", {}, "Holiday weeks"),
      el("p", {}, "A holiday week is skipped by the week streak: it doesn't add to it or end it."),
      week && el("div", { class: "holiday-row" },
        el("span", {}, `This week (from ${shortDate(week.startedOn)})`),
        toggle("Holiday", Boolean(week.holiday), (on) => { update({ week: { ...state.week, holiday: on } }); render(); })),
      recent.map(({ past, index }) => el("div", { class: "holiday-row" },
        el("span", {}, `Week of ${shortDate(past.startedOn)}: ${past.days} practice ${past.days === 1 ? "day" : "days"}`),
        toggle("Holiday", past.holiday, (on) => {
          update({ history: state.history.map((entry, i) => (i === index ? { ...entry, holiday: on } : entry)) });
          render();
        }))),
      !week && recent.length === 0 && el("p", { class: "label" }, "No weeks yet.")
    ),

    el("section", { class: "card" },
      el("h2", {}, "Prize"),
      el("p", {}, "A real-world treat earned with golden gifts. One golden gift is given each week the goal is reached."),
      prizeInput,
      el("p", { class: "label" }, "Golden gifts needed"),
      stepper("Golden gifts needed", prizeDraft.need, 1, 20, (value) => { prizeDraft.need = value; render(); }),
      prizeError,
      el("div", { class: "row" },
        state.prize && button(
          prizeProgress(state.prize, count).earned ? "Prize given: clear it" : "Remove the prize",
          () => { update({ prize: null }); prizeDraft = null; render(); }),
        button(state.prize ? "Save the prize" : "Set the prize", () => {
          const text = prizeDraft.text.trim();
          if (!text) { prizeError.textContent = "Type what the prize is."; return; }
          // Keep progress when only editing; start from now for a new prize.
          const base = state.prize ? state.prize.base : count;
          update({ prize: { text, need: prizeDraft.need, base } });
          render();
        }, "main"))
    ),

    backupCard(),
  ];
}

// ---------- Backup ----------

let backupNote = ""; // a short message shown in the backup card
let restoreDraft = null; // a backup file that was picked, waiting for a yes

async function saveBackup() {
  const name = `starry-keys-backup-${today()}.json`;
  const file = new File([makeBackup(state, today())], name, { type: "application/json" });
  // On an iPad this opens the share sheet ("Save to Files", AirDrop, ...).
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return "Backup made.";
    } catch (error) {
      if (error.name === "AbortError") return "";
    }
  }
  // Anywhere else, download the file.
  const link = el("a", { href: URL.createObjectURL(file), download: name });
  document.body.append(link);
  link.click();
  link.remove();
  return "Backup saved to your downloads.";
}

function restoreBackup(backup) {
  save(backup.state);
  state = load();
}

function backupCard() {
  if (restoreDraft) {
    return el("section", { class: "card gift-card" },
      el("h2", {}, "Replace everything on this device?"),
      el("p", {}, `This backup${restoreDraft.savedOn ? ` from ${shortDate(restoreDraft.savedOn)}` : ""} will replace the checklist, stars, stickers, and past weeks on this device.`),
      el("div", { class: "row" },
        button("Keep what's here", () => { restoreDraft = null; render(); }),
        button("Replace with the backup", async () => {
          const backup = restoreDraft;
          restoreDraft = null;
          try {
            restoreBackup(backup);
            backupNote = "Backup restored.";
          } catch {
            backupNote = "The backup couldn't be restored.";
          }
          prizeDraft = null;
          render();
        }, "main"))
    );
  }
  const input = el("input", { type: "file", accept: "application/json,.json", class: "file-input" });
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      restoreDraft = readBackup(await file.text());
      backupNote = "";
    } catch (error) {
      backupNote = error.message;
    }
    render();
  });
  return el("section", { class: "card" },
    el("h2", {}, "Backup"),
    el("p", {}, "Everything is stored only on this device. A backup is one file with the checklist, stars, stickers, and past weeks. Keep it somewhere safe, such as the Files app."),
    el("p", { class: "done-note", role: "status" }, backupNote),
    el("div", { class: "row" },
      button("Save a backup", async () => {
        try {
          backupNote = await saveBackup();
        } catch {
          backupNote = "The backup couldn't be made.";
        }
        render();
      }),
      el("label", { class: "btn file-label" }, input, "Restore from a backup"))
  );
}

// ---------- Past weeks ----------

function pastScreen() {
  const weeks = [...state.history].reverse();
  return [
    el("div", { class: "top" },
      el("h1", {}, "Past weeks"),
      button("Back", () => go("home"))),
    weeks.map((past) =>
      el("section", { class: "card" },
        el("h2", {}, `Week of ${shortDate(past.startedOn)}`),
        el("p", { class: past.met ? "done-note" : "" },
          past.met && icon("star"),
          ` ${past.days} practice ${past.days === 1 ? "day" : "days"}`,
          past.met ? ". Goal reached." : ".",
          past.holiday ? " Holiday week." : ""),
        el("ul", { class: "past-items" }, past.items.map((text) => el("li", {}, text)))
      )),
  ];
}

// ---------- Drawing ----------

const SCREENS = {
  home: homeScreen,
  practice: practiceScreen,
  finished: finishedScreen,
  list: listScreen,
  "new-week": newWeekScreen,
  gift: giftScreen,
  album: albumScreen,
  past: pastScreen,
  parent: parentScreen,
};

function render() {
  const needsWeek = ["practice", "finished", "new-week", "gift"];
  if (!state.week && needsWeek.includes(screen)) screen = "home";
  // A screen is a list of parts. Lists inside it are flattened, and parts
  // that are switched off (false or null) are skipped.
  app.replaceChildren(...SCREENS[screen]().flat(Infinity).filter(Boolean));
}

render();

// Offline: sw.js saves the app's files so it opens without internet.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch((error) => console.warn("Offline mode is off:", error));
}
// Ask the device to keep this app's saved data even when storage runs low.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
