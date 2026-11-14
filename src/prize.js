// A real-world prize a grown-up can set, earned with golden gifts.
// One golden gift is given each week the goal is reached.
// A prize looks like: { text: "Movie night", need: 5, base: 2 }
// `base` is how many golden gifts had been earned when the prize was set,
// so only gifts earned afterwards count toward it.

export function goldenCount(history, week) {
  const past = history.filter((entry) => entry.met).length;
  return past + (week && week.goldenGiven ? 1 : 0);
}

export function prizeProgress(prize, count) {
  const have = Math.max(0, Math.min(prize.need, count - prize.base));
  return { have, need: prize.need, earned: have >= prize.need };
}
