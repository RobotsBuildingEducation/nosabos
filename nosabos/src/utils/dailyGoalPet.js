const DAY_MS = 24 * 60 * 60 * 1000;

export const DAILY_GOAL_PET_DEFAULT_HEALTH = 100;
export const DAILY_GOAL_PET_HEALTH_GAIN = 15;
export const DAILY_GOAL_PET_HEALTH_LOSS = 10;
// Don't look back further than this when catching up a long absence — a hard
// ceiling on how much history a single reconcile will scan.
const MAX_CATCHUP_DAYS = 400;

export function clampDailyGoalPetHealth(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DAILY_GOAL_PET_DEFAULT_HEALTH;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function getDailyGoalPetHealth(data = {}) {
  return clampDailyGoalPetHealth(data?.dailyGoalPetHealth);
}

export function getNextDailyGoalResetAt(now = new Date()) {
  return new Date(now.getTime() + DAY_MS).toISOString();
}

export function hasDailyGoalResetExpired(resetAt, now = new Date()) {
  const resetAtMs = Date.parse(resetAt || 0) || 0;
  return !resetAtMs || now.getTime() >= resetAtMs;
}

export function applyDailyGoalPetDelta(health, delta) {
  return clampDailyGoalPetHealth(Number(health || 0) + Number(delta || 0));
}

// Calendar-day helpers. We work in whole local days expressed as a UTC-based
// integer index so day math is DST-safe and timezone-stable. Keys are the same
// "YYYY-MM-DD" local format the rest of the app stores (see getLocalDayKey).
function dayIndexFromDate(date) {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS,
  );
}

function dayIndexFromKey(key) {
  if (typeof key !== "string") return NaN;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!match) return NaN;
  return Math.floor(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS,
  );
}

function dayKeyFromIndex(index) {
  const date = new Date(index * DAY_MS);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getEffectiveGoal(data) {
  const raw =
    data?.dailyGoalXp ?? data?.progress?.dailyGoalXp ?? data?.stats?.dailyGoalXp;
  return Math.max(0, Math.round(Number(raw) || 0));
}

// Most recent day the user did anything we can prove (earned XP or reached the
// goal). Durable — survives the rolling dailyResetAt being bumped forward by an
// app-open that earned nothing, which is what makes the catch-up trustworthy.
function lastActivityDayIndex(data) {
  let best = NaN;
  const consider = (key) => {
    const index = dayIndexFromKey(key);
    if (Number.isFinite(index) && (!Number.isFinite(best) || index > best)) {
      best = index;
    }
  };

  const history = data?.dailyXpHistory;
  if (history && typeof history === "object") {
    for (const key of Object.keys(history)) {
      if (Number(history[key]) > 0) consider(key);
    }
  }
  if (Array.isArray(data?.completedGoalDates)) {
    for (const key of data.completedGoalDates) consider(key);
  }
  return best;
}

// How many past days (before today) have lapsed without the goal being reached
// and haven't been charged against the pet yet. Decay is tracked by calendar
// days, not by how many times the app was opened.
//
// Anchored on `dailyGoalPetLastAccountedDay` (the last day already reflected in
// health). For legacy data without it we fall back to the last day of recorded
// activity, so an absence is still measured from the durable heatmap history
// rather than the clobber-prone dailyResetAt. Today is in progress and never
// counts. Returns 0 when no goal is configured.
export function countMissedDailyGoalWindows(data = {}, now = new Date()) {
  const goal = getEffectiveGoal(data);
  if (goal <= 0) return 0;

  const todayIndex = dayIndexFromDate(now);
  const yesterdayIndex = todayIndex - 1;

  let throughIndex = dayIndexFromKey(data?.dailyGoalPetLastAccountedDay);
  if (!Number.isFinite(throughIndex)) {
    throughIndex = lastActivityDayIndex(data);
  }
  if (!Number.isFinite(throughIndex)) {
    // Brand-new account with no history — nothing in the past to charge for.
    throughIndex = yesterdayIndex;
  }
  // Safety bound for a very stale or corrupt anchor.
  if (throughIndex < yesterdayIndex - MAX_CATCHUP_DAYS) {
    throughIndex = yesterdayIndex - MAX_CATCHUP_DAYS;
  }

  const reached = new Set(
    Array.isArray(data?.completedGoalDates) ? data.completedGoalDates : [],
  );

  let missed = 0;
  for (let day = throughIndex + 1; day <= yesterdayIndex; day += 1) {
    if (!reached.has(dayKeyFromIndex(day))) missed += 1;
  }
  return missed;
}

// Fields for advancing the pet on reset / reconcile.
//   resetWindow=true  → also start a fresh 24h window (clears today's XP).
//   resetWindow=false → health-only reconcile (used when catching up missed
//                       days on load without disturbing an in-progress day).
export function buildDailyGoalResetFields(
  data = {},
  now = new Date(),
  { resetWindow = true } = {},
) {
  const currentHealth = getDailyGoalPetHealth(data);
  const missedWindows = countMissedDailyGoalWindows(data, now);
  // One health penalty per missed day; clamped at 0, so a long absence can
  // take the pet all the way to the dead state.
  const nextHealth = applyDailyGoalPetDelta(
    currentHealth,
    -missedWindows * DAILY_GOAL_PET_HEALTH_LOSS,
  );
  const appliedDelta = nextHealth - currentHealth;
  // Everything up to yesterday is now reflected in health; today stays open.
  const lastAccountedDay = dayKeyFromIndex(dayIndexFromDate(now) - 1);

  return {
    ...(resetWindow
      ? {
          dailyXp: 0,
          dailyHasCelebrated: false,
          dailyResetAt: getNextDailyGoalResetAt(now),
          dailyStartedAt: now.toISOString(),
        }
      : {}),
    dailyGoalPetHealth: nextHealth,
    dailyGoalPetLastAccountedDay: lastAccountedDay,
    ...(appliedDelta < 0
      ? {
          dailyGoalPetLastOutcome: "missed",
          dailyGoalPetLastDelta: appliedDelta,
          dailyGoalPetLastUpdatedAt: now.toISOString(),
        }
      : {}),
  };
}
