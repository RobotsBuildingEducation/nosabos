import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "@babel/parser";
import generateModule from "@babel/generator";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "src/data/skillTreeData.js");
const LEVELS_DIR = path.join(ROOT, "src/data/skillTree/baseLevels");
const BUILDER_PATH = path.join(ROOT, "src/data/skillTreeLevelBuilder.js");

const LEVEL_FILES = {
  "Pre-A1": "pre-a1.js",
  A1: "a1.js",
  A2: "a2.js",
  B1: "b1.js",
  B2: "b2.js",
  C1: "c1.js",
  C2: "c2.js",
};

const source = await fs.readFile(SOURCE_PATH, "utf8");
const ast = parse(source, {
  sourceType: "module",
  plugins: ["jsx"],
});
const generate = generateModule.default || generateModule;

let basePathObject = null;
for (const statement of ast.program.body) {
  if (statement.type !== "VariableDeclaration") continue;
  for (const declaration of statement.declarations) {
    if (declaration.id?.name !== "baseLearningPath") continue;
    basePathObject = declaration.init?.arguments?.[0] || null;
  }
}

if (basePathObject?.type !== "ObjectExpression") {
  throw new Error("Could not locate baseLearningPath object");
}

await fs.mkdir(LEVELS_DIR, { recursive: true });
for (const property of basePathObject.properties) {
  const level =
    property.key?.value ||
    (property.key?.type === "Identifier" ? property.key.name : "");
  const fileName = LEVEL_FILES[level];
  if (!fileName) continue;
  const code = generate(property.value, {
    comments: true,
    compact: false,
    jsescOption: { minimal: true },
  }).code;
  await fs.writeFile(
    path.join(LEVELS_DIR, fileName),
    `// Generated from skillTreeData.js by scripts/generateSplitSkillTreeModules.mjs.\nexport default ${code};\n`,
  );
}

const importStart = source.indexOf("import ");
const helperStart = source.indexOf("const withLocalizedSkillTreeText");
const skillStatusStart = source.indexOf("export const SKILL_STATUS");
const pipelineStart = source.indexOf("const LESSON_XP_RANGE");
const pipelineEnd = source.indexOf("\nconst cefrAlignedLearningPath");

if (
  [importStart, helperStart, skillStatusStart, pipelineStart, pipelineEnd].some(
    (index) => index < 0,
  )
) {
  throw new Error("Could not locate skill-tree builder source boundaries");
}

const imports = source
  .slice(importStart, helperStart)
  .replace(
    /import \{ TARGET_CURRICULUM \} from "\.\/skillTree\/targetCurriculum\/index\.js";\n/,
    "",
  );
const localizationHelper = source.slice(helperStart, skillStatusStart);
const pipeline = source.slice(pipelineStart, pipelineEnd);

const builder = `// Generated from skillTreeData.js by scripts/generateSplitSkillTreeModules.mjs.
// Keep the transformation pipeline byte-for-byte aligned with the aggregate
// curriculum while allowing the app to import one raw CEFR level at a time.
${imports}
${localizationHelper}
${pipeline}

export function buildLearningPathLevel({
  rawUnits = [],
  level,
  targetLang = "es",
  authoredCurriculum,
} = {}) {
  const baseLearningPath = withLocalizedSkillTreeText({
    [level]: rawUnits,
  });
  const alignedPath = withLocalizedSkillTreeText(
    applyCEFRScaffolding(baseLearningPath),
  );
  const clonedPath = JSON.parse(JSON.stringify(alignedPath));
  const targetPath = applyAuthoredTargetCurriculum(
    clonedPath,
    targetLang,
    authoredCurriculum,
  );
  return targetPath?.[level] || [];
}
`;

await fs.writeFile(BUILDER_PATH, builder);
