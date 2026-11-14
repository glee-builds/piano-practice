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
import { shortDate, summarize, weekStreak } from "./history.js";
import { SETS, ALL_STICKERS } from "../data/stickers.js";
import { load, save } from "./storage.js";

const app = document.getElementById("app");
let state = load();
let screen = "home";
let justOpened = null; // what was inside the gift that was just opened

const today = () => dateString(new Date());

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
      topBar("Practice Stars"),
      el("section", { class: "card" },
        el("h2", {}, state.lastItems.length ? "Start your new week" : "Start your first week"),
        el("p", {}, "Add the list from your teacher's note, then check things off each day you practice."),
        button("Add this week's list", () => go("list"), "main")
      ),
    ];
  }

  const done = finishedDayCount(week);
  const todayDay = findDay(week, today());
  let action;
  if (!todayDay) {
    action = button("Start today's practice", startToday, "main");
  } else if (!todayDay.finished) {
    action = button("Keep practicing", () => go("practice"), "main");
  } else {
    action = el("div", {},
      el("p", { class: "done-note" }, icon("check"), " Today's practice is done."),
      button("Change today's checks", () => go("practice"))
    );
  }

  const waiting = unopenedGifts(week).length;
  return [
    topBar("This week's practice"),
    waiting > 0 && el("section", { class: "card gift-card" },
      el("p", {}, waiting === 1 ? "You have a gift to open." : `You have ${waiting} gifts to open.`),
      button(waiting === 1 ? "Open your gift" : "Open your gifts", () => go("gift"), "main")
    ),
    el("section", { class: "card" },
      el("p", { class: "label" }, "Practice days"),
      streakPill(),
      dayDots(done),
      el("p", {}, goalMessage(done)),
      action
    ),
    el("section", { class: "card" },
      el("h2", {}, "Your list"),
      weekGrid(week, null),
      el("div", { class: "row" },
        button("Change the list", () => go("list")),
        button("Start a new week", () => go("new-week")),
        state.history.length > 0 && button("Past weeks", () => go("past"))
      )
    ),
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

// Shows how many weeks in a row reached the goal. Hidden when there is
// no streak, so a missed week is never pointed out.
function streakPill() {
  const streak = weekStreak(state.history, state.week, DEFAULT_GOAL);
  if (streak === 0) return null;
  return el("p", { class: "streak" }, icon("flame"),
    streak === 1 ? " 1 week streak" : ` ${streak} week streak`);
}

function goalMessage(done) {
  const left = DEFAULT_GOAL - done;
  if (done === 0) return `Your goal is ${DEFAULT_GOAL} practice days this week.`;
  if (left > 1) return `${done} of ${DEFAULT_GOAL} done. ${left} more to reach your goal.`;
  if (left === 1) return `${done} of ${DEFAULT_GOAL} done. One more to reach your goal.`;
  if (left === 0) return "You reached your goal this week.";
  return `You reached your goal, plus ${-left} extra.`;
}

function dayDots(done) {
  const count = Math.max(DEFAULT_GOAL, done);
  const dots = [];
  for (let i = 0; i < count; i++) {
    dots.push(
      i < done
        ? el("span", { class: "dot dot-on", "aria-label": "Practice day done" }, icon("star"))
        : el("span", { class: "dot", "aria-label": "Practice day to go" }, String(i + 1))
    );
  }
  return el("div", { class: "dots" }, dots);
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
            class: `box box-tap ${checked ? "box-on" : ""}`,
            type: "button",
            "aria-pressed": String(checked),
            "aria-label": `${item.text}: ${checked ? "done" : "not done yet"}`,
            onClick: () => {
              update({ week: toggleItem(state.week, day.date, item.id) });
              render();
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
          update(awardFinish(state.week, day.date, state.stars, DEFAULT_GOAL));
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
  box.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true">
    <rect x="6" y="20" width="36" height="24" rx="3" fill="${colors[0]}" stroke="${colors[1]}" stroke-width="2"/>
    <rect x="3" y="12" width="42" height="10" rx="3" fill="${colors[0]}" stroke="${colors[1]}" stroke-width="2"/>
    <rect x="21" y="12" width="6" height="32" fill="${colors[2]}"/>
    <path d="M24 12c-4-9-13-7-10-2 2 3 6 2 10 2zM24 12c4-9 13-7 10-2-2 3-6 2-10 2z" fill="${colors[2]}" stroke="${colors[1]}" stroke-width="1.5"/>
  </svg>`;
  return box;
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
    return [el("section", { class: "card center" },
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
      onClick: () => {
        const result = openGift(state.week, state.owned, state.stars,
          gift.date, gift.index, ALL_STICKERS, Math.random);
        justOpened = result.inside;
        update({ week: result.week, owned: result.owned, stars: result.stars });
        render();
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
            history: [...state.history, summarize(state.week, DEFAULT_GOAL)],
            week: null,
          });
          go("list");
        }, "main")
      )
    ),
  ];
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
};

function render() {
  const needsWeek = ["practice", "finished", "new-week", "gift"];
  if (!state.week && needsWeek.includes(screen)) screen = "home";
  // A screen is a list of parts. Lists inside it are flattened, and parts
  // that are switched off (false or null) are skipped.
  app.replaceChildren(...SCREENS[screen]().flat(Infinity).filter(Boolean));
}

render();
