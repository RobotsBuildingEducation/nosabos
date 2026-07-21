#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import process from "node:process";

import { SUPPORT_LANGUAGE_CODES } from "../src/constants/supportLanguages.js";
import { LEARNING_PATHS } from "../src/data/skillTreeData.js";
import { buildLessonCurriculumAudit } from "../src/utils/lessonCurriculum.js";

const LEVELS = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];
const args = process.argv.slice(2);

function flag(name, fallback = "") {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : true;
}

const requestedTargets = String(flag("target", "all"))
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const targets = requestedTargets.includes("all")
  ? Object.keys(LEARNING_PATHS)
  : requestedTargets;

const reports = targets.map((targetLang) => {
  if (!LEARNING_PATHS[targetLang]) {
    throw new Error(`Unknown target language: ${targetLang}`);
  }
  const units = LEVELS.flatMap((level) =>
    (LEARNING_PATHS[targetLang][level] || []).map((unit) => ({
      ...unit,
      cefrLevel: level,
    })),
  );
  return buildLessonCurriculumAudit(units, {
    requiredSupportLanguages: SUPPORT_LANGUAGE_CODES,
    targetLang,
  });
});

const totals = reports.reduce(
  (sum, report) => ({
    lessons: sum.lessons + report.lessonCount,
    items: sum.items + report.itemCount,
    blockers: sum.blockers + report.blockers.length,
    reviewCandidates: sum.reviewCandidates + report.reviewCandidates.length,
  }),
  { lessons: 0, items: 0, blockers: 0, reviewCandidates: 0 },
);
const payload = {
  generatedAt: new Date().toISOString(),
  supportLanguages: SUPPORT_LANGUAGE_CODES,
  totals,
  reports,
};

const out = flag("out");
if (out && out !== true) {
  await writeFile(out, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Curriculum audit written to ${out}`);
} else if (args.includes("--json")) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  reports.forEach((report) => {
    console.log(
      [
        report.targetLang.padEnd(4),
        `lessons=${String(report.lessonCount).padStart(3)}`,
        `items=${String(report.itemCount).padStart(4)}`,
        `blockers=${String(report.blockers.length).padStart(3)}`,
        `review=${String(report.reviewCandidates.length).padStart(4)}`,
      ].join("  "),
    );
  });
  console.log(
    `TOTAL lessons=${totals.lessons} items=${totals.items} blockers=${totals.blockers} review=${totals.reviewCandidates}`,
  );
  console.log(
    "Review candidates are safe capability goals at runtime, but still need curriculum-author review.",
  );
}

if (args.includes("--strict") && totals.blockers > 0) {
  process.exitCode = 1;
}
