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
  finishDay,
  finishedDayCount,
} from "./week.js";
import { load, save } from "./storage.js";

const app = document.getElementById("app");
let state = load();
let screen = "home";

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
      el("h1", {}, "Practice Stars"),
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

  return [
    el("h1", {}, "This week's practice"),
    el("section", { class: "card" },
      el("p", { class: "label" }, "Practice days"),
      dayDots(done),
      el("p", {}, goalMessage(done)),
      action
    ),
    el("section", { class: "card" },
      el("h2", {}, "Your list"),
      weekGrid(week, null),
      el("div", { class: "row" },
        button("Change the list", () => go("list")),
        button("Start a new week", () => go("new-week"))
      )
    ),
  ];
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
          update({ week: finishDay(state.week, day.date) });
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
      button("Done", () => go("home"), "main")
    ),
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
  return [
    el("h1", {}, "Start a new week"),
    el("section", { class: "card" },
      el("p", {}, "This puts away this week's checklist so you can add the list from your new teacher's note."),
      el("div", { class: "row" },
        button("Keep this week", () => go("home")),
        button("Start a new week", () => {
          update({
            lastItems: state.week.items.map((item) => item.text),
            week: null,
          });
          go("list");
        }, "main")
      )
    ),
  ];
}

// ---------- Drawing ----------

const SCREENS = {
  home: homeScreen,
  practice: practiceScreen,
  finished: finishedScreen,
  list: listScreen,
  "new-week": newWeekScreen,
};

function render() {
  const needsWeek = ["practice", "finished", "new-week"];
  if (!state.week && needsWeek.includes(screen)) screen = "home";
  app.replaceChildren(...SCREENS[screen]());
}

render();
