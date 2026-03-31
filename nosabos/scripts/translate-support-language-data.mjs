import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { parse } = require("@babel/parser");
const generate = require("@babel/generator").default;
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");

const CLI_ARGS = process.argv.slice(2);
const TARGET_LANGUAGE =
  CLI_ARGS.find((arg) => !arg.startsWith("--")) || "it";
const REFRESH_IDENTICAL = CLI_ARGS.includes("--refresh-identical");
const TARGET_LANGUAGE_SUFFIX =
  TARGET_LANGUAGE.charAt(0).toUpperCase() + TARGET_LANGUAGE.slice(1);
const TARGET_LANGUAGE_LABEL =
  TARGET_LANGUAGE === "it"
    ? "Italian"
    : TARGET_LANGUAGE === "es"
      ? "Spanish"
      : TARGET_LANGUAGE.toUpperCase();
const MODEL = process.env.SUPPORT_LANGUAGE_TRANSLATION_MODEL || "gpt-5-nano";
const ROOT_DIR = process.cwd();
const CACHE_DIR = path.join(ROOT_DIR, ".cache", "support-language-translation");
const CACHE_FILE = path.join(CACHE_DIR, `${TARGET_LANGUAGE}.json`);
const PLACEHOLDER_PATTERN = /__EXPR_(\d+)__/g;
const TRANSLATABLE_SKILL_TREE_KEYS = new Set([
  "scenario",
  "prompt",
  "successCriteria",
  "unitTitle",
]);
const TRANSLATABLE_EN_SUFFIX_KEYS = new Set([
  "title_en",
  "rubric_en",
  "scenario_en",
  "prompt_en",
  "successCriteria_en",
]);

function log(message) {
  process.stdout.write(`${message}\n`);
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, "utf8");
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function loadEnvironment() {
  const envFiles = [
    path.join(ROOT_DIR, ".env"),
    path.join(ROOT_DIR, ".env.local"),
  ];

  for (const envFile of envFiles) {
    const values = readEnvFile(envFile);
    for (const [key, value] of Object.entries(values)) {
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function loadCache() {
  ensureDir(CACHE_DIR);
  if (!fs.existsSync(CACHE_FILE)) return {};

  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  ensureDir(CACHE_DIR);
  fs.writeFileSync(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

function getDataFiles() {
  const flashcardFiles = fs
    .readdirSync(path.join(ROOT_DIR, "src", "data", "flashcards"))
    .filter((file) => file.endsWith(".js"))
    .map((file) => path.join("src", "data", "flashcards", file));

  const skillTreeFiles = fs
    .readdirSync(path.join(ROOT_DIR, "src", "data", "skillTree"))
    .filter((file) => file.endsWith(".js") && file !== "index.js")
    .map((file) => path.join("src", "data", "skillTree", file));

  const alphabetFiles = fs
    .readdirSync(path.join(ROOT_DIR, "src", "data"))
    .filter((file) => file.endsWith("Alphabet.js"))
    .map((file) => path.join("src", "data", file));

  return [
    path.join("src", "data", "flashcardData.js"),
    ...flashcardFiles,
    path.join("src", "data", "skillTreeData.js"),
    ...skillTreeFiles,
    ...alphabetFiles,
  ];
}

function parseCode(filePath) {
  const absolutePath = path.join(ROOT_DIR, filePath);
  const code = fs.readFileSync(absolutePath, "utf8");
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx"],
  });

  return { absolutePath, code, ast };
}

function getPropertyName(node) {
  if (!node || !t.isObjectProperty(node) || node.computed) return null;
  if (t.isIdentifier(node.key)) return node.key.name;
  if (t.isStringLiteral(node.key)) return node.key.value;
  return null;
}

function getObjectProperties(node) {
  return node.properties.filter((property) => t.isObjectProperty(property));
}

function findProperty(node, propertyName) {
  return getObjectProperties(node).find(
    (property) => getPropertyName(property) === propertyName,
  );
}

function insertProperty(node, propertyName, valueNode, preferredAfter = []) {
  if (findProperty(node, propertyName)) return false;

  const newProperty = t.objectProperty(t.identifier(propertyName), valueNode);
  const properties = node.properties;
  let insertIndex = properties.length;

  for (let i = properties.length - 1; i >= 0; i -= 1) {
    const currentName = getPropertyName(properties[i]);
    if (preferredAfter.includes(currentName)) {
      insertIndex = i + 1;
      break;
    }
  }

  properties.splice(insertIndex, 0, newProperty);
  return true;
}

function extractTextDescriptor(node) {
  if (t.isStringLiteral(node)) {
    return {
      text: node.value,
      sourceType: "string",
      expressions: [],
    };
  }

  if (t.isTemplateLiteral(node)) {
    let text = "";

    node.quasis.forEach((quasi, index) => {
      text += quasi.value.cooked || "";
      if (index < node.expressions.length) {
        text += `__EXPR_${index}__`;
      }
    });

    return {
      text,
      sourceType: "template",
      expressions: node.expressions.map((expression) =>
        t.cloneNode(expression, true),
      ),
    };
  }

  return null;
}

function createStringNode(text) {
  return t.stringLiteral(text);
}

function createTemplateNode(text, expressions) {
  const matches = [...text.matchAll(PLACEHOLDER_PATTERN)];

  if (matches.length !== expressions.length) {
    return null;
  }

  const quasis = [];
  const nextExpressions = [];
  let cursor = 0;

  for (const match of matches) {
    const placeholder = match[0];
    const expressionIndex = Number(match[1]);
    const start = match.index ?? 0;

    quasis.push(
      t.templateElement(
        {
          raw: text.slice(cursor, start),
          cooked: text.slice(cursor, start),
        },
        false,
      ),
    );

    nextExpressions.push(t.cloneNode(expressions[expressionIndex], true));
    cursor = start + placeholder.length;
  }

  quasis.push(
    t.templateElement(
      {
        raw: text.slice(cursor),
        cooked: text.slice(cursor),
      },
      true,
    ),
  );

  return t.templateLiteral(quasis, nextExpressions);
}

function buildValueNodeFromTranslation(translation, descriptor, fallbackNode) {
  if (!descriptor) return t.cloneNode(fallbackNode, true);

  if (descriptor.sourceType === "template") {
    const templateNode = createTemplateNode(
      translation,
      descriptor.expressions || [],
    );

    if (templateNode) return templateNode;
    return t.cloneNode(fallbackNode, true);
  }

  return createStringNode(translation);
}

function createCacheKey({ kind, text, secondaryText }) {
  return JSON.stringify([
    TARGET_LANGUAGE,
    REFRESH_IDENTICAL ? "refresh-identical-v2" : "base",
    kind,
    text,
    secondaryText || "",
  ]);
}

function buildBatchPrompt(batch) {
  const serialized = JSON.stringify(
    batch.map((item) => ({
      id: item.id,
      kind: item.kind,
      source_lang: item.sourceLang,
      text: item.text,
      secondary_text: item.secondaryText || "",
      file: item.filePath,
      field: item.fieldName,
    })),
  );

  return `You are translating support-language curriculum strings for a language-learning app.

Translate every item into natural ${TARGET_LANGUAGE_LABEL}.

Rules:
- Return strict JSON only. No markdown. No code fences.
- Use this exact shape: {"translations":[{"id":"...","text":"..."}]}
- Keep every "id" exactly as provided.
- Preserve placeholders like __EXPR_0__, __EXPR_1__, etc exactly.
- Preserve quoted example words, CEFR labels, punctuation, ellipses, and capitalization unless ${TARGET_LANGUAGE_LABEL} requires a natural adjustment.
- For flashcard concepts, give the concise ${TARGET_LANGUAGE_LABEL} meaning a learner would expect.
- For alphabet pronunciation help, translate the explanation into ${TARGET_LANGUAGE_LABEL} while keeping sample words intact.
- When an item is a UI/course title, a lesson description, a tutorial line, a meaning gloss, a pronunciation explanation, or an everyday vocabulary word, translate it into Italian instead of copying English.
- Only keep the source unchanged when it is genuinely standard ${TARGET_LANGUAGE_LABEL}, a single letter/letter-name, a symbol, a proper noun, or a truly common international borrowing that Italians normally leave in that form (for example: taxi, hotel, yoga, Wi-Fi, TV).
- Do not leave obvious English course phrases, grammar labels, verbs, or meaning glosses untranslated.

Items:
${serialized}`;
}

async function callResponses(prompt) {
  const baseUrl = process.env.VITE_RESPONSES_URL;
  if (!baseUrl) {
    throw new Error("VITE_RESPONSES_URL is not configured.");
  }

  const response = await fetch(`${baseUrl}/proxyResponses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      text: { format: { type: "text" } },
      input: prompt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Translation request failed (${response.status}): ${errorText.slice(
        0,
        300,
      )}`,
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return (
    payload?.output_text ||
    (Array.isArray(payload?.output)
      ? payload.output
          .map((item) =>
            Array.isArray(item?.content)
              ? item.content.map((segment) => segment?.text || "").join("")
              : "",
          )
          .join("")
      : "") ||
    (typeof payload === "string" ? payload : "")
  );
}

function parseJsonResponse(rawText) {
  const trimmed = String(rawText || "").trim();
  if (!trimmed) {
    throw new Error("Empty translation response.");
  }

  const candidates = [trimmed];
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  throw new Error(`Could not parse translation JSON: ${trimmed.slice(0, 300)}`);
}

async function translateBatch(batch, cache) {
  const prompt = buildBatchPrompt(batch);
  const rawText = await callResponses(prompt);
  const parsed = parseJsonResponse(rawText);
  const translations = Array.isArray(parsed?.translations)
    ? parsed.translations
    : [];

  const byId = new Map(
    translations.map((item) => [String(item?.id || ""), String(item?.text || "")]),
  );

  for (const item of batch) {
    const translated = byId.get(item.id);
    if (!translated) {
      throw new Error(`Missing translation for ${item.id}`);
    }

    cache[item.cacheKey] = translated.trim();
  }

  saveCache(cache);
}

async function resolveTranslations(pending, cache) {
  const items = Array.from(pending.values()).filter(
    (item) => !cache[item.cacheKey],
  );

  if (!items.length) {
    log(`Translation cache already covers ${pending.size} entries.`);
    return;
  }

  log(
    `Resolving ${items.length} unique ${TARGET_LANGUAGE_LABEL} translations with ${MODEL}...`,
  );

  const batchSize = 30;

  async function processBatch(batch, label) {
    let lastError = null;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await translateBatch(batch, cache);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          log(`Retrying ${label} after error: ${error.message}`);
        }
      }
    }

    if (batch.length > 10) {
      const midpoint = Math.ceil(batch.length / 2);
      log(
        `Splitting ${label} into ${batch.length} smaller items after repeated response errors.`,
      );
      await processBatch(batch.slice(0, midpoint), `${label}a`);
      await processBatch(batch.slice(midpoint), `${label}b`);
      return;
    }

    throw lastError;
  }

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const label = `batch ${Math.floor(index / batchSize) + 1}`;
    await processBatch(batch, label);

    log(
      `Translated batch ${Math.floor(index / batchSize) + 1}/${Math.ceil(
        items.length / batchSize,
      )}`,
    );
  }
}

function queueTranslation({
  pending,
  cache,
  kind,
  filePath,
  fieldName,
  sourceLang,
  text,
  secondaryText = "",
}) {
  const trimmedText = String(text || "").trim();
  if (!trimmedText) return null;

  const cacheKey = createCacheKey({
    kind,
    text: trimmedText,
    secondaryText,
  });

  if (!pending.has(cacheKey)) {
    pending.set(cacheKey, {
      id: `item_${pending.size + 1}`,
      cacheKey,
      kind,
      filePath,
      fieldName,
      sourceLang,
      text: trimmedText,
      secondaryText: String(secondaryText || "").trim(),
    });
  }

  return cacheKey;
}

function collectModificationsForFile(filePath, ast, pending, cache) {
  const modifications = [];
  const isSkillTreeFile = filePath.includes("skillTree");
  const isAlphabetFile = filePath.endsWith("Alphabet.js");

  traverse(ast, {
    ObjectExpression(objectPath) {
      const node = objectPath.node;
      const properties = getObjectProperties(node);
      const propertyMap = new Map(
        properties.map((property) => [getPropertyName(property), property]),
      );

      const enProperty = propertyMap.get("en");
      const esProperty = propertyMap.get("es");
      const targetProperty = propertyMap.get(TARGET_LANGUAGE);
      const localizedSourceProperty = enProperty || esProperty;

      if (localizedSourceProperty) {
        const sourceDescriptor = extractTextDescriptor(
          localizedSourceProperty.value,
        );
        const targetDescriptor = targetProperty
          ? extractTextDescriptor(targetProperty.value)
          : null;
        const secondaryDescriptor =
          enProperty && esProperty
            ? extractTextDescriptor(
                localizedSourceProperty === enProperty
                  ? esProperty.value
                  : enProperty.value,
              )
            : null;

        const needsInsert = !targetProperty;
        const needsRefresh =
          REFRESH_IDENTICAL &&
          targetProperty &&
          sourceDescriptor?.text &&
          targetDescriptor?.text &&
          targetDescriptor.text.trim() === sourceDescriptor.text.trim();

        if ((needsInsert || needsRefresh) && sourceDescriptor?.text) {
          const translationKey = queueTranslation({
            pending,
            cache,
            kind: needsRefresh
              ? "localized_object_refresh"
              : "localized_object",
            filePath,
            fieldName:
              getPropertyName(objectPath.parent) ||
              getPropertyName(objectPath.parentPath?.node),
            sourceLang: enProperty ? "en" : "es",
            text: sourceDescriptor.text,
            secondaryText: secondaryDescriptor?.text || "",
          });

          if (translationKey) {
            modifications.push(() => {
              const translated =
                cache[translationKey] || sourceDescriptor.text;
              if (needsRefresh && targetProperty) {
                targetProperty.value = buildValueNodeFromTranslation(
                  translated,
                  sourceDescriptor,
                  localizedSourceProperty.value,
                );
                return true;
              }
              return insertProperty(
                node,
                TARGET_LANGUAGE,
                buildValueNodeFromTranslation(
                  translated,
                  sourceDescriptor,
                  localizedSourceProperty.value,
                ),
                ["es", "en"],
              );
            });
          }
        }
      }

      if (isAlphabetFile) {
        for (const [baseKey, localizedKey, kind] of [
          ["name", `name${TARGET_LANGUAGE_SUFFIX}`, "alphabet_name"],
          ["sound", `sound${TARGET_LANGUAGE_SUFFIX}`, "alphabet_sound"],
          ["tip", `tip${TARGET_LANGUAGE_SUFFIX}`, "alphabet_tip"],
        ]) {
          const baseProperty = propertyMap.get(baseKey);
          if (!baseProperty) continue;
          const sourceDescriptor = extractTextDescriptor(baseProperty.value);
          const localizedProperty = propertyMap.get(localizedKey);
          const localizedDescriptor = localizedProperty
            ? extractTextDescriptor(localizedProperty.value)
            : null;
          const secondaryProperty =
            baseKey === "name" ? null : propertyMap.get(`${baseKey}Es`);
          const secondaryDescriptor = secondaryProperty
            ? extractTextDescriptor(secondaryProperty.value)
            : null;

          if (!sourceDescriptor?.text) continue;
          const needsInsert = !localizedProperty;
          const shouldRefreshName = baseKey !== "name";
          const needsRefresh =
            REFRESH_IDENTICAL &&
            shouldRefreshName &&
            localizedProperty &&
            localizedDescriptor?.text &&
            localizedDescriptor.text.trim() === sourceDescriptor.text.trim();
          if (!needsInsert && !needsRefresh) continue;

          const translationKey = queueTranslation({
            pending,
            cache,
            kind: needsRefresh ? `${kind}_refresh` : kind,
            filePath,
            fieldName: baseKey,
            sourceLang: "en",
            text: sourceDescriptor.text,
            secondaryText: secondaryDescriptor?.text || "",
          });

          if (!translationKey) continue;

          modifications.push(() => {
            const translated = cache[translationKey] || sourceDescriptor.text;
            if (needsRefresh && localizedProperty) {
              localizedProperty.value = buildValueNodeFromTranslation(
                translated,
                sourceDescriptor,
                baseProperty.value,
              );
              return true;
            }
            return insertProperty(
              node,
              localizedKey,
              buildValueNodeFromTranslation(
                translated,
                sourceDescriptor,
                baseProperty.value,
              ),
              baseKey === "name" ? ["name"] : [`${baseKey}Es`, baseKey],
            );
          });
        }
      }

      if (!isSkillTreeFile) return;

      for (const property of properties) {
        const propertyName = getPropertyName(property);
        if (!propertyName) continue;

        const hasBaseKey = TRANSLATABLE_SKILL_TREE_KEYS.has(propertyName);
        const hasEnSuffixKey = TRANSLATABLE_EN_SUFFIX_KEYS.has(propertyName);
        const targetPropertyName = hasEnSuffixKey
          ? propertyName.replace(/_en$/, `_${TARGET_LANGUAGE}`)
          : `${propertyName}_${TARGET_LANGUAGE}`;

        if (!hasBaseKey && !hasEnSuffixKey) continue;

        const sourceDescriptor = extractTextDescriptor(property.value);
        const targetProperty = propertyMap.get(targetPropertyName);
        const targetDescriptor = targetProperty
          ? extractTextDescriptor(targetProperty.value)
          : null;
        if (!sourceDescriptor?.text) continue;
        const needsInsert = !targetProperty;
        const needsRefresh =
          REFRESH_IDENTICAL &&
          targetProperty &&
          targetDescriptor?.text &&
          targetDescriptor.text.trim() === sourceDescriptor.text.trim();
        if (!needsInsert && !needsRefresh) continue;

        const secondaryProperty = hasEnSuffixKey
          ? propertyMap.get(propertyName.replace(/_en$/, "_es"))
          : propertyMap.get(`${propertyName}_es`);
        const secondaryDescriptor = secondaryProperty
          ? extractTextDescriptor(secondaryProperty.value)
          : null;

        const translationKey = queueTranslation({
          pending,
          cache,
          kind: needsRefresh
            ? hasEnSuffixKey
              ? "skill_tree_en_suffix_refresh"
              : "skill_tree_string_refresh"
            : hasEnSuffixKey
              ? "skill_tree_en_suffix"
              : "skill_tree_string",
          filePath,
          fieldName: propertyName,
          sourceLang: "en",
          text: sourceDescriptor.text,
          secondaryText: secondaryDescriptor?.text || "",
        });

        if (!translationKey) continue;

        modifications.push(() => {
          const translated = cache[translationKey] || sourceDescriptor.text;
          if (needsRefresh && targetProperty) {
            targetProperty.value = buildValueNodeFromTranslation(
              translated,
              sourceDescriptor,
              property.value,
            );
            return true;
          }
          return insertProperty(
            node,
            targetPropertyName,
            buildValueNodeFromTranslation(
              translated,
              sourceDescriptor,
              property.value,
            ),
            [`${propertyName}_es`, propertyName],
          );
        });
      }
    },
  });

  return modifications;
}

function writeFileIfChanged(filePath, originalCode, ast) {
  const generated = generate(
    ast,
    {
      comments: true,
      compact: false,
      retainLines: false,
      jsescOption: { minimal: true },
    },
    originalCode,
  ).code;

  if (generated === originalCode) return false;

  fs.writeFileSync(filePath, `${generated}\n`, "utf8");
  return true;
}

async function main() {
  loadEnvironment();
  const cache = loadCache();
  const pending = new Map();
  const fileContexts = [];

  for (const filePath of getDataFiles()) {
    const { absolutePath, code, ast } = parseCode(filePath);
    const modifications = collectModificationsForFile(
      filePath,
      ast,
      pending,
      cache,
    );

    fileContexts.push({
      filePath,
      absolutePath,
      code,
      ast,
      modifications,
    });
  }

  log(`Scanned ${fileContexts.length} data files.`);
  log(`Queued ${pending.size} unique translation entries.`);
  if (REFRESH_IDENTICAL) {
    log("Refresh mode: replacing Italian values that still match English.");
  }

  await resolveTranslations(pending, cache);

  let filesChanged = 0;
  let propertiesAdded = 0;

  for (const context of fileContexts) {
    let fileTouched = false;

    for (const applyModification of context.modifications) {
      if (applyModification()) {
        fileTouched = true;
        propertiesAdded += 1;
      }
    }

    if (!fileTouched) continue;

    if (writeFileIfChanged(context.absolutePath, context.code, context.ast)) {
      filesChanged += 1;
      log(`Updated ${context.filePath}`);
    }
  }

  log(
    `Completed ${TARGET_LANGUAGE_LABEL} expansion for curriculum data. Files changed: ${filesChanged}. Properties added: ${propertiesAdded}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
