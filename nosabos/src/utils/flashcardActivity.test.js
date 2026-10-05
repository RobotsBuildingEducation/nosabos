import test from "node:test";
import assert from "node:assert/strict";
import { getFlashcardReviewPreviewCount, mergeFlashcardActivityCounts } from "./flashcardActivity.js";

const day = "2026-10-04";

test("a correct answer previews the first review before a rating is saved", () => {
  assert.equal(getFlashcardReviewPreviewCount(0, 0), 1);
  // The stored count can then catch up without another increase.
  assert.equal(getFlashcardReviewPreviewCount(1, 0), 1);
  assert.equal(getFlashcardReviewPreviewCount(1), 1);
});

test("answer previews exceed the target and don't override newer saved progress", () => {
  assert.equal(getFlashcardReviewPreviewCount(5, 5), 6);
  assert.equal(getFlashcardReviewPreviewCount(6, 5), 6);
  assert.equal(getFlashcardReviewPreviewCount(7, 5), 7);
});

test("an incorrect, retried, or unopened result has no pending preview", () => {
  assert.equal(getFlashcardReviewPreviewCount(0, null), 0);
  assert.equal(getFlashcardReviewPreviewCount(4, null), 4);
});

test("a card completion advances once regardless of which save listener arrives first", () => {
  for (const confirmations of [[{ stored: 4, cards: 3 }, { stored: 4, cards: 4 }],
    [{ stored: 3, cards: 4 }, { stored: 4, cards: 4 }]]) {
    const counts = [mergeFlashcardActivityCounts({ [day]: 3 })[day]];
    counts.push(mergeFlashcardActivityCounts({ [day]: 3 }, { [day]: 3 }, { [day]: 4 })[day]);
    for (const { stored, cards } of confirmations) {
      counts.push(mergeFlashcardActivityCounts({ [day]: stored }, { [day]: cards }, { [day]: 4 })[day]);
    }
    assert.deepEqual(counts, [3, 4, 4, 4]);
  }
});

test("repeated reviews and successive pending cards keep their expected total until confirmation", () => {
  // Ten saved reviews can refer to fewer unique cards; a repeat still adds one.
  assert.equal(mergeFlashcardActivityCounts({ [day]: 10 }, { [day]: 3 }, { [day]: 11 })[day], 11);
  assert.equal(mergeFlashcardActivityCounts({ [day]: 10 }, { [day]: 3 }, { [day]: 12 })[day], 12);
  assert.equal(mergeFlashcardActivityCounts({ [day]: 11 }, { [day]: 3 }, { [day]: 12 })[day], 12);
  assert.equal(mergeFlashcardActivityCounts({ [day]: 12 }, { [day]: 3 }, { [day]: 12 })[day], 12);
});

test("yesterday's optimistic progress does not carry into a new daily goal", () => {
  const result = mergeFlashcardActivityCounts({ [day]: 1 }, {}, { "2026-10-03": 12 });
  assert.equal(result[day], 1);
  assert.equal(mergeFlashcardActivityCounts({ [day]: 2 })[day], 2);
  assert.deepEqual(mergeFlashcardActivityCounts({ [day]: Infinity }, { [day]: NaN }), {});
});
