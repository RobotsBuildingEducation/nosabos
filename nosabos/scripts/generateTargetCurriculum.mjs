#!/usr/bin/env node
// Practice-language curriculum pipeline.
//
// The skill tree is authored for Spanish practice. This script manages the
// authored adaptations other practice languages read at runtime
// (src/data/skillTree/targetCurriculum/<lang>.js — see index.js there).
//
// The adaptation itself is model work: give a strong LLM the exported
// manifest and have it produce, per agenda item, the equivalent concept in
// the practice language plus 1-3 short example phrases. This script owns the
// deterministic parts — export, validation, and merging — so any model's
// output can be reviewed and merged safely.
//
// Usage:
//   node scripts/generateTargetCurriculum.mjs export --levels A1,B2 [--out file]
//       Emit a JSON work manifest of every source-lesson agenda item
//       (concept + lesson context) for the requested CEFR levels.
//
//   node scripts/generateTargetCurriculum.mjs merge --lang it --from adapted.json [--overwrite]
//       Validate model output shaped {lessonId: {itemId: {concept, examples}}}
//       against the live tree and merge it into targetCurriculum/<lang>.js.
//       Existing entries win unless --overwrite; unknown lesson/item ids fail.
//
//   node scripts/generateTargetCurriculum.mjs validate --lang it
//       Report per-level coverage and flag orphaned or empty entries.
//
// Model prompt sketch (per lesson batch): "You adapt a Spanish-practice
// curriculum for learners practicing <language>. For each objective, give the
// equivalent goal in <language>, optional exact `forms` only when the learner
// should produce those forms verbatim, and 1-3 short natural example phrases
// in <language>. Activity instructions are goals, never forms. Adapt, don't
// transliterate: pick the forms a native curriculum author would teach."

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CURRICULUM_DIR = path.join(
  ROOT,
  "src/data/skillTree/targetCurriculum",
);

const args = process.argv.slice(2);
const command = args[0];

function getFlag(name, fallback = null) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : true;
}

async function loadTree() {
  const [{ LEARNING_PATHS }, curriculum] = await Promise.all([
    import(
      pathToFileURL(path.join(ROOT, "src/data/skillTreeData.js")).href
    ),
    import(
      pathToFileURL(path.join(ROOT, "src/utils/lessonCurriculum.js")).href
    ),
  ]);
  return { LEARNING_PATHS, ...curriculum };
}

function textOf(value, lang = "en") {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return String(value[lang] || value.en || value.es || "").trim();
}

function collectSourceLessons(pathByLevel, levels, curriculum) {
  const wantedLevels = levels?.length ? levels : Object.keys(pathByLevel);
  const lessons = [];
  for (const level of wantedLevels) {
    for (const unit of pathByLevel[level] || []) {
      for (const lesson of unit.lessons || []) {
        if (!lesson || lesson.isGame || curriculum.isReviewLesson(lesson)) {
          continue;
        }
        const items = curriculum
          .getLessonAgenda(lesson, { unit })
          .map((item) => ({
            id: item.id,
            kind: item.kind,
            modes: item.modes,
            goal: curriculum.getAgendaGoal(item),
            targetRole: curriculum.getAgendaTargetRole(item),
            forms: curriculum.getAgendaTargetForms(item),
            activityBrief: item.activityBrief || "",
          }));
        if (!items.length) continue;
        lessons.push({
          level,
          unitId: unit.id,
          unitTitle: textOf(unit.title),
          lessonId: lesson.id,
          lessonTitle: textOf(lesson.title),
          lessonDescription: textOf(lesson.description),
          items,
        });
      }
    }
  }
  return lessons;
}

async function loadExistingCurriculum(lang) {
  const file = path.join(CURRICULUM_DIR, `${lang}.js`);
  if (!existsSync(file)) return {};
  const module = await import(pathToFileURL(file).href);
  return module.default || {};
}

function serializeCurriculum(lang, data) {
  const sortedLessons = Object.keys(data).sort();
  const body = sortedLessons
    .map((lessonId) => {
      const items = data[lessonId];
      const itemLines = Object.keys(items)
        .sort()
        .map((itemId) => {
          const entry = items[itemId];
          const examples = (entry.examples || [])
            .map((example) => JSON.stringify(example))
            .join(", ");
          const forms = (entry.forms || [])
            .map((form) => JSON.stringify(form))
            .join(", ");
          const formsLine = forms ? `\n      forms: [${forms}],` : "";
          return `    ${JSON.stringify(itemId)}: {\n      concept: ${JSON.stringify(entry.concept)},${formsLine}\n      examples: [${examples}],\n    },`;
        })
        .join("\n");
      return `  ${JSON.stringify(lessonId)}: {\n${itemLines}\n  },`;
    })
    .join("\n");
  return `// ${lang.toUpperCase()} practice-language curriculum. See ./index.js for the format.\n// Managed by scripts/generateTargetCurriculum.mjs (merge/validate); hand-edits\n// are preserved by merges unless --overwrite is passed.\nexport default {\n${body}\n};\n`;
}

function indexTree(lessons) {
  const byLesson = new Map();
  for (const lesson of lessons) {
    byLesson.set(
      lesson.lessonId,
      new Map(lesson.items.map((item) => [item.id, item])),
    );
  }
  return byLesson;
}

async function runExport(curriculumApi) {
  const levels = String(getFlag("levels", "") || "")
    .split(",")
    .map((level) => level.trim())
    .filter(Boolean);
  const lessons = collectSourceLessons(
    curriculumApi.LEARNING_PATHS.es,
    levels,
    curriculumApi,
  );
  const out = getFlag("out");
  const payload = JSON.stringify(
    { generatedAt: new Date().toISOString(), levels, lessons },
    null,
    2,
  );
  if (out && out !== true) {
    await writeFile(out, payload);
    console.log(
      `Exported ${lessons.length} lessons (${lessons.reduce((sum, lesson) => sum + lesson.items.length, 0)} items) to ${out}`,
    );
  } else {
    console.log(payload);
  }
}

async function runMerge(curriculumApi) {
  const lang = String(getFlag("lang", "") || "").toLowerCase();
  const from = getFlag("from");
  if (!lang || !from || from === true) {
    console.error("merge requires --lang <code> and --from <adapted.json>");
    process.exit(1);
  }
  const overwrite = args.includes("--overwrite");
  const incoming = JSON.parse(await readFile(from, "utf8"));
  const lessons = collectSourceLessons(
    curriculumApi.LEARNING_PATHS.es,
    [],
    curriculumApi,
  );
  const treeIndex = indexTree(lessons);
  const existing = await loadExistingCurriculum(lang);

  const problems = [];
  let added = 0;
  let skipped = 0;
  let repaired = 0;
  const merged = JSON.parse(JSON.stringify(existing));
  for (const [lessonId, items] of Object.entries(incoming)) {
    const lessonIndex = treeIndex.get(lessonId);
    if (!lessonIndex) {
      problems.push(`unknown lesson id: ${lessonId}`);
      continue;
    }
    for (const [itemId, entry] of Object.entries(items || {})) {
      // Agenda item ids are long slugs that authors routinely truncate by a
      // character or two; repair automatically when a unique 52-char-prefix
      // match exists in the tree, and only fail on genuine mismatches.
      let resolvedId = itemId;
      if (!lessonIndex.has(resolvedId)) {
        const candidates = [...lessonIndex.keys()].filter(
          (validId) => validId.slice(0, 52) === itemId.slice(0, 52),
        );
        if (candidates.length === 1) {
          resolvedId = candidates[0];
          repaired += 1;
        } else {
          problems.push(`unknown item id: ${lessonId} → ${itemId}`);
          continue;
        }
      }
      const concept = String(entry?.concept || "").trim();
      if (!concept) {
        problems.push(`empty concept: ${lessonId} → ${resolvedId}`);
        continue;
      }
      const examples = Array.isArray(entry?.examples)
        ? entry.examples.map((example) => String(example).trim()).filter(Boolean)
        : [];
      const forms = Array.isArray(entry?.forms)
        ? entry.forms.map((form) => String(form).trim()).filter(Boolean)
        : [];
      if (merged[lessonId]?.[resolvedId] && !overwrite) {
        skipped += 1;
        continue;
      }
      merged[lessonId] = merged[lessonId] || {};
      merged[lessonId][resolvedId] = { concept, forms, examples };
      added += 1;
    }
  }

  if (problems.length) {
    console.error(`Refusing to merge — ${problems.length} problem(s):`);
    problems.slice(0, 40).forEach((problem) => console.error(`  - ${problem}`));
    process.exit(1);
  }

  const outFile = path.join(CURRICULUM_DIR, `${lang}.js`);
  await writeFile(outFile, serializeCurriculum(lang, merged));
  console.log(
    `Merged ${added} entr(ies) into ${path.relative(ROOT, outFile)} (${skipped} existing kept${
      repaired ? `, ${repaired} truncated id(s) auto-repaired` : ""
    }).`,
  );
  if (!existsSync(path.join(CURRICULUM_DIR, "index.js"))) return;
  const indexSource = await readFile(
    path.join(CURRICULUM_DIR, "index.js"),
    "utf8",
  );
  if (!indexSource.includes(`./${lang}.js`)) {
    console.log(
      `NOTE: add \`import ${lang} from "./${lang}.js";\` and register it in targetCurriculum/index.js`,
    );
  }
}

async function runValidate(curriculumApi) {
  const lang = String(getFlag("lang", "") || "").toLowerCase();
  if (!lang) {
    console.error("validate requires --lang <code>");
    process.exit(1);
  }
  const data = await loadExistingCurriculum(lang);
  const lessons = collectSourceLessons(
    curriculumApi.LEARNING_PATHS.es,
    [],
    curriculumApi,
  );
  const treeIndex = indexTree(lessons);

  const coverage = {};
  for (const lesson of lessons) {
    const bucket = (coverage[lesson.level] ||= { items: 0, covered: 0 });
    for (const item of lesson.items) {
      bucket.items += 1;
      if (data[lesson.lessonId]?.[item.id]?.concept) bucket.covered += 1;
    }
  }

  const orphans = [];
  for (const [lessonId, items] of Object.entries(data)) {
    const lessonIndex = treeIndex.get(lessonId);
    if (!lessonIndex) {
      orphans.push(lessonId);
      continue;
    }
    for (const itemId of Object.keys(items)) {
      if (!lessonIndex.has(itemId)) orphans.push(`${lessonId} → ${itemId}`);
    }
  }

  console.log(`Coverage for "${lang}":`);
  for (const [level, bucket] of Object.entries(coverage)) {
    const pct = bucket.items
      ? Math.round((bucket.covered / bucket.items) * 100)
      : 0;
    console.log(
      `  ${level.padEnd(6)} ${String(bucket.covered).padStart(4)}/${String(bucket.items).padEnd(4)} (${pct}%)`,
    );
  }
  if (orphans.length) {
    console.log(`Orphaned entries (${orphans.length}):`);
    orphans.slice(0, 40).forEach((orphan) => console.log(`  - ${orphan}`));
    process.exitCode = 1;
  } else {
    console.log("No orphaned entries.");
  }
}

const curriculumApi = await loadTree();
if (command === "export") await runExport(curriculumApi);
else if (command === "merge") await runMerge(curriculumApi);
else if (command === "validate") await runValidate(curriculumApi);
else {
  console.error("Usage: generateTargetCurriculum.mjs <export|merge|validate> [flags]");
  process.exit(1);
}
