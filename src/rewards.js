// The rules for stars, gifts, and stickers. Nothing here touches the page.
//
// Finishing a practice gives:
//   - one star for each item checked, plus BONUS_STARS if every item is checked
//   - one gift: a "big" gift if every item is checked, otherwise a "small" one
//   - one extra "golden" gift, once a week, on the practice that reaches the goal
// A gift holds a sticker the player doesn't have yet. Big and golden gifts
// hold a shiny one.

import { finishedDayCount } from "./week.js";

export const BONUS_STARS = 2;
export const ALBUM_FULL_STARS = 5;

export function starsForDay(day, itemCount) {
  const all = itemCount > 0 && day.done.length === itemCount;
  return day.done.length + (all ? BONUS_STARS : 0);
}

// Works out what finishing this day earns, and returns the changed week
// and star total. Safe to call again after the checks are changed: stars
// are corrected, and gifts are only ever given once.
export function awardFinish(week, date, stars, goal) {
  const day = week.days.find((d) => d.date === date);
  const earned = starsForDay(day, week.items.length);
  const newStars = stars - (day.stars || 0) + earned;

  let gifts = day.gifts;
  let goldenGiven = Boolean(week.goldenGiven);
  if (!gifts) {
    const all = day.done.length === week.items.length;
    gifts = [{ kind: all ? "big" : "small", stickerId: null }];
  }
  const finishedCount = finishedDayCount({
    ...week,
    days: week.days.map((d) => (d.date === date ? { ...d, finished: true } : d)),
  });
  if (!goldenGiven && finishedCount >= goal) {
    gifts = [...gifts, { kind: "golden", stickerId: null }];
    goldenGiven = true;
  }

  const days = week.days.map((d) =>
    d.date === date ? { ...d, finished: true, stars: earned, gifts } : d
  );
  return { week: { ...week, days, goldenGiven }, stars: newStars };
}

// Gifts that have been earned but not opened yet, oldest first.
export function unopenedGifts(week) {
  const list = [];
  for (const day of week.days) {
    (day.gifts || []).forEach((gift, index) => {
      if (!gift.stickerId && !gift.empty) list.push({ date: day.date, index, kind: gift.kind });
    });
  }
  return list;
}

// Picks a sticker the player doesn't own. `random` is a function returning
// a number from 0 up to (not including) 1, such as Math.random.
export function pickSticker(owned, allStickers, random) {
  const missing = allStickers.filter((sticker) => !owned[sticker.id]);
  if (missing.length === 0) return null;
  return missing[Math.floor(random() * missing.length)];
}

// Opens one gift. Returns the changed week, album, and stars, plus what was
// inside: { sticker, shiny } or { sticker: null, bonusStars } when the
// album is already full.
export function openGift(week, owned, stars, date, index, allStickers, random) {
  const day = week.days.find((d) => d.date === date);
  const gift = day.gifts[index];
  const sticker = pickSticker(owned, allStickers, random);
  const shiny = gift.kind !== "small";

  const opened = sticker ? { ...gift, stickerId: sticker.id } : { ...gift, empty: true };
  const days = week.days.map((d) =>
    d.date === date
      ? { ...d, gifts: d.gifts.map((g, i) => (i === index ? opened : g)) }
      : d
  );
  if (!sticker) {
    return {
      week: { ...week, days }, owned, stars: stars + ALBUM_FULL_STARS,
      inside: { sticker: null, bonusStars: ALBUM_FULL_STARS },
    };
  }
  return {
    week: { ...week, days },
    owned: { ...owned, [sticker.id]: { shiny } },
    stars,
    inside: { sticker, shiny },
  };
}
