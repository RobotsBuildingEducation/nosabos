import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "@babel/parser";
import { Linter } from "eslint";
import globals from "globals";
import { transformWithEsbuild } from "vite";
import React, { useCallback } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as chakra from "@chakra-ui/react";
import { FaMicrophone } from "react-icons/fa";
import { formatThreeClueMysteryCopy } from "../utils/threeClueMysteryI18n.js";

const source = readFileSync(new URL("./DelightQuestionLab.jsx", import.meta.url), "utf8");
const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });
const variants = ["SentenceShapeshifter", "ThreeClueMystery", "ThreeWordChallenge"];

test("lesson variants have no undefined variables, including JSX expressions", () => {
  const messages = new Linter().verify(source, {
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: { "no-undef": "error" },
  });
  assert.deepEqual(messages, []);
});

// Execute the production render functions without importing Firebase, stores,
// or model clients. Assistant and keyboard subtrees are outside this regression.
const declarations = ast.program.body.filter((node) =>
  (node.type === "FunctionDeclaration" &&
    [...variants, "SpeechAnswerButton"].includes(node.id.name)) ||
  (node.type === "VariableDeclaration" &&
    node.declarations.every(({ id }) => id.name?.startsWith("APP_"))),
);
const { code } = await transformWithEsbuild(
  declarations.map((node) => source.slice(node.start, node.end)).join("\n"),
  "DelightQuestionLab.jsx",
  { jsx: "transform", jsxFactory: "React.createElement" },
);
const dependencies = {
  React, useCallback, ...chakra, FaMicrophone,
  getLanguageDirection: () => "ltr",
  getQuestionToolButtonProps: () => ({}),
  questionSquircleStyle: {},
  formatThreeClueMysteryCopy,
  QuestionAssistantButton: () => null,
  BetaVirtualKeyboard: () => null,
  VoiceWaveIcon: () => null,
};
const components = new Function(
  ...Object.keys(dependencies),
  `${code}\nreturn { ${variants.join(", ")} };`,
)(...Object.values(dependencies));

for (const name of variants) {
  test(`${name} renders and disables the microphone while evaluating speech`, () => {
    const props = {
      question: {
        source: "Ella camina.", constraint: "Make it plural.",
        clues: ["A greeting", "Starts with h", "Used in the daytime"],
        cues: ["hola", "amigo", "hoy"],
      },
      response: { text: "" }, setResponse() {},
      targetLang: "es", supportLang: "en", supportsSpeech: true,
    };
    for (const isSpeechEvaluating of [undefined, false, true]) {
      const html = renderToStaticMarkup(React.createElement(
        chakra.ChakraProvider, null,
        React.createElement(components[name], { ...props, isSpeechEvaluating }),
      ));
      const microphone = html.match(/<button\b[^>]*aria-label="Record answer"[^>]*>/)?.[0];
      assert.ok(microphone, "microphone renders without a ReferenceError");
      assert.equal(/\bdisabled=/.test(microphone), isSpeechEvaluating === true);
    }
  });
}

test("the parent passes live speech evaluation state to every speech variant", () => {
  const found = new Set();
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "JSXOpeningElement" && variants.includes(node.name?.name)) {
      const prop = node.attributes.find((attribute) => attribute.name?.name === "isSpeechEvaluating");
      assert.equal(prop?.value?.expression?.name, "isSpeechEvaluating", node.name.name);
      found.add(node.name.name);
    }
    for (const child of Object.values(node)) {
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === "object") visit(child);
    }
  }
  visit(ast.program);
  assert.equal(found.size, variants.length);
});
