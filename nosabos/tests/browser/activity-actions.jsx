/* eslint-disable react-refresh/only-export-components -- Standalone browser test entry. */
// Run with the Vite dev server at /tests/browser/activity-actions.html.
// These checks need a real browser: ResizeObserver, portals, and layout are the
// behavior under test. Run at mobile and desktop viewport sizes.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { ChakraProvider, Box, Button, Input, Select } from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { theme } from "../../src/theme";
import "../../src/index.css";
import ActivityActionRow from "../../src/components/ActivityActionRow";
import QuestionActionArea from "../../src/components/QuestionActionArea";
import FeedbackRail from "../../src/components/FeedbackRail";
import ActivityMenu from "../../src/components/ActivityMenu";
import useQuestionActionStore from "../../src/hooks/useQuestionActionStore";
import { applyThemeMode, useThemeStore } from "../../src/useThemeStore";

const copy = (key) =>
  ({
    correct: "Correct!",
    try_again: "Try again",
    flashcard_explain_answer: "Explain answer",
  }[key] || key);
function Menu() {
  const slot = useQuestionActionStore((s) => s.menuSlot);
  return slot ? (
    createPortal(
      <ActivityMenu
        label="Activity menu"
        modesLabel="Modes"
        backLabel="Back"
        items={[
          {
            id: "notes",
            label: "Notes",
            description: "Saved memories",
            icon: <HamburgerIcon />,
          },
        ]}
        modes={[]}
      />,
      slot,
    )
  ) : (
    <nav data-bottom-navigation="">Full navigation</nav>
  );
}
function Activity({ second, phase, keyboard, onSubmit, onNext, onSkip }) {
  return (
    <QuestionActionArea
      feedback={
        phase === "correct"
          ? true
          : ["incorrect", "explanation"].includes(phase)
          ? false
          : null
      }
      actions={
        phase !== "correct" && (
          <ActivityActionRow
            primary={
              <Button
                colorScheme="purple"
                px={12}
                py={8}
                height="80px"
                width="180px"
                onClick={onSubmit}
              >
                {second ? "Check answers" : "Submit"}
              </Button>
            }
          >
            {keyboard && (
              <Button variant="ghost" px={10}>
                Keyboard
              </Button>
            )}
            <Button variant="ghost" px={10} onClick={onSkip}>
              Skip
            </Button>
          </ActivityActionRow>
        )
      }
    >
      <FeedbackRail
        compact
        t={copy}
        ok={
          phase === "correct"
            ? true
            : ["incorrect", "explanation"].includes(phase)
            ? false
            : null
        }
        lessonProgress={{ label: "Lesson progress", pct: 24, total: 100 }}
        showNext={phase === "correct"}
        onNext={onNext}
        nextLabel="Continue"
        onExplainAnswer={() => {}}
        explanationText={
          phase === "explanation" ? "A longer explanation. ".repeat(80) : ""
        }
      />
    </QuestionActionArea>
  );
}
function Fixture({
  mode = "first",
  phase = "ready",
  keyboard = false,
  generation = 0,
  onSubmit = () => {},
  onNext = () => {},
  onSkip = () => {},
}) {
  return (
    <ChakraProvider theme={theme}>
      <Box p={4}>
        <Box minH="70vh">
          <Input aria-label="Final answer" defaultValue="family" />
        </Box>
        <Box data-fixture="first" display={mode === "first" ? "block" : "none"}>
          <Activity
            key={generation}
            phase={phase}
            keyboard={keyboard}
            onSubmit={onSubmit}
            onNext={onNext}
            onSkip={onSkip}
          />
        </Box>
        <Box
          data-fixture="second"
          display={mode === "second" ? "block" : "none"}
        >
          <Activity second phase={mode === "second" ? phase : "ready"} onSubmit={onSubmit} onNext={onNext} onSkip={onSkip} />
        </Box>
        {mode === "cards" && <QuestionActionArea suppress />}
        <QuestionActionArea fallback />
        <Menu />
      </Box>
    </ChakraProvider>
  );
}
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const settle = async () => {
  for (let n = 0; n < 8; n++) await frame();
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
function panels() {
  return [...document.querySelectorAll("[data-question-action-area]")].filter(
    (p) => getComputedStyle(p).visibility === "visible",
  );
}
function checkRow(primaryLabel, secondary = true) {
  assert(panels().length === 1, "Exactly one activity footer must be visible");
  const panel = panels()[0];
  const menu = panel.querySelector('[aria-label="Activity menu"]');
  const liveContent = panel.querySelector('[data-action-content-state="present"]');
  const primary = liveContent?.querySelector("[data-activity-primary] button");
  assert(
    menu && primary,
    "Menu and primary action must mount from a fresh store",
  );
  assert(
    primary.textContent === primaryLabel,
    `Expected ${primaryLabel}, got ${primary.textContent}`,
  );
  const buttons = [
    menu,
    ...liveContent.querySelectorAll("[data-activity-action-row] button"),
  ];
  const menuBounds = menu.getBoundingClientRect();
  const center = menuBounds.top + menuBounds.height / 2;
  for (const button of buttons) {
    const b = button.getBoundingClientRect();
    assert(
      Math.abs(b.top + b.height / 2 - center) < 1,
      "Actions must share one row",
    );
    assert(
      Math.abs(b.height - (button === menu ? 44 : 40)) < 1,
      "Compact actions preserve the menu tap target",
    );
    assert(
      b.left >= 0 && b.right <= innerWidth,
      "Actions must fit the viewport",
    );
  }
  assert(
    !secondary ||
      panel
        .querySelector("[data-activity-secondary]")
        ?.textContent.includes("Skip"),
    "Skip must remain available",
  );
  assert(
    document.documentElement.scrollWidth <= innerWidth,
    "No horizontal overflow",
  );
}
async function run(report) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const results = [];
  const render = async (props) => {
    root.render(
      <React.StrictMode>
        <Fixture {...props} />
      </React.StrictMode>,
    );
    await settle();
  };
  const test = async (name, fn) => {
    try {
      await fn();
      results.push("PASS " + name);
    } catch (e) {
      results.push("FAIL " + name + ": " + e.message);
    }
    report([...results]);
  };
  try {
    await test("Fresh mount registers Submit and Skip", async () => {
      await render({});
      checkRow("Submit");
    });
    await test("Kept-alive activity switch owns the correct actions", async () => {
      await render({ mode: "second" });
      checkRow("Check answers");
    });
    await test("Switching back restores the first actions", async () => {
      await render({ mode: "first", keyboard: true });
      checkRow("Submit");
    });
    await test("Loading fallback keeps a menu-sized row", async () => {
      await render({ mode: "loading" });
      assert(panels().length === 1, "One fallback");
      const p = panels()[0];
      assert(p.querySelector('[aria-label="Activity menu"]'), "Fallback menu");
      assert(
        Math.abs(p.getBoundingClientRect().height - 66) < 1,
        "Fallback matches the standard bar height",
      );
    });
    await test("Returning from loading restores Submit and Skip", async () => {
      await render({});
      checkRow("Submit");
    });
    await test("Submission and Continue keep their actual callbacks", async () => {
      let submitted = 0,
        continued = 0;
      await render({ onSubmit: () => submitted++ });
      panels()[0].querySelector("[data-activity-primary] button").click();
      assert(submitted === 1, "Submit handler");
      await render({ phase: "correct", onNext: () => continued++ });
      checkRow("Continue", false);
      panels()[0].querySelector("[data-activity-primary] button").click();
      assert(continued === 1, "Continue handler");
    });
    await test("Correct feedback colors the full surface and restores lesson progress", async () => {
      await render({ phase: "correct" });
      const panel = panels()[0];
      assert(
        panel.dataset.questionFeedback === "correct",
        "Correct surface state",
      );
      const surface = panel.querySelector(".bottombar-glass");
      assert(
        getComputedStyle(surface).backgroundImage.includes("linear-gradient"),
        "The outer glass carries the feedback tint",
      );
      const progress = panel.querySelector('[role="progressbar"]');
      assert(
        progress?.getAttribute("aria-valuenow") === "24",
        "Lesson completion remains accessible",
      );
      assert(
        progress.querySelector("stop").getAttribute("stop-color") === "#4aa8ff",
        "Use the light-blue WaveBar",
      );
    });
    await test("Incorrect feedback has a centered full-width explanation button", async () => {
      await render({ phase: "incorrect" });
      const panel = panels()[0];
      assert(
        panel.dataset.questionFeedback === "incorrect",
        "Incorrect surface state",
      );
      const content = panel.querySelector("[data-activity-feedback-content]");
      const button = [...content.querySelectorAll("button")].find((b) =>
        b.textContent.includes("Explain"),
      );
      assert(
        button &&
          button.getBoundingClientRect().width >=
            content.getBoundingClientRect().width - 10,
        "Explain spans the feedback content",
      );
      assert(
        getComputedStyle(button).textAlign === "center",
        "Explain is centered",
      );
    });
    await test("The next question returns to the neutral compact bar", async () => {
      await render({ phase: "ready" });
      for (
        let n = 0;
        n < 60 && Math.abs(panels()[0].getBoundingClientRect().height - 66) > 1;
        n++
      )
        await frame();
      assert(
        panels()[0].dataset.questionFeedback === "idle",
        "No stale result color",
      );
      assert(
        Math.abs(panels()[0].getBoundingClientRect().height - 66) < 1,
        "Spring returns to the standard base height",
      );
      checkRow("Submit");
    });
    for (const [phase, buttonLabel] of [["correct", "Continue"], ["incorrect", "Skip"]]) {
      await test(`${buttonLabel} contracts the bar without hiding the live controls`, async () => {
        let nextRender;
        const advance = () => { nextRender = render({ phase: "ready" }); };
        await render({ phase, onNext: advance, onSkip: advance });
        await settle();
        const button = [...panels()[0].querySelectorAll("button")].find(
          (b) => b.textContent === buttonLabel,
        );
        const expandedHeight = panels()[0].getBoundingClientRect().height;
        button.click();
        await frame();
        await frame();
        const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!reducedMotion) {
          const leaving = panels()[0].querySelector('[data-action-content-state="exiting"]');
          assert(leaving?.inert, "Outgoing actions cannot be activated twice");
          const transform = new DOMMatrixReadOnly(getComputedStyle(leaving).transform);
          assert(transform.m42 > 0, "Feedback moves downward on dismissal");
          assert(panels()[0].querySelector('[data-action-content-state="present"] [data-activity-primary] button')?.textContent === "Submit", "New controls appear before the feedback finishes leaving");
        }
        let intermediateFrames = 0;
        for (let n = 0; n < 90; n++) {
          const panel = panels()[0];
          const live = panel.querySelector('[data-action-content-state="present"]');
          const primary = live?.querySelector('[data-activity-primary] button');
          assert(primary?.textContent === "Submit", "Live Submit remains mounted throughout contraction");
          assert(getComputedStyle(primary).visibility === "visible" && Number(getComputedStyle(live).opacity) === 1, "Live controls never fade or disappear");
          const height = panel.getBoundingClientRect().height;
          if (height > 67 && height < expandedHeight - 1) intermediateFrames++;
          if (!panels()[0].querySelector('[data-action-content-state="exiting"]') &&
              Math.abs(panels()[0].getBoundingClientRect().height - 66) < 1) break;
          await frame();
        }
        await nextRender;
        assert(reducedMotion || intermediateFrames >= 3, "Bar visibly contracts over multiple frames");
        assert(!panels()[0].querySelector('[data-activity-feedback-content]'), "Old feedback is removed");
        assert(Math.abs(panels()[0].getBoundingClientRect().height - 66) < 1, "Bar returns to compact height");
        checkRow("Submit");
      });
    }
    for (const [name, destination] of [
      ["Generating a replacement question", { generation: 1 }],
      ["Switching activity modes", { mode: "second" }],
      ["Entering the loading fallback", { mode: "loading" }],
    ]) {
      await test(`${name} preserves the ongoing surface contraction`, async () => {
        await render({ phase: "correct" });
        for (let n = 0; n < 30; n++) await frame();
        const oldPanel = panels()[0];
        const expandedHeight = oldPanel.getBoundingClientRect().height;
        const pending = render(destination);
        await frame();
        await frame();
        const newPanel = panels()[0];
        assert(newPanel !== oldPanel, "Test must replace the actual footer owner");
        const heights = [];
        for (let n = 0; n < 50; n++) {
          heights.push(panels()[0].getBoundingClientRect().height);
          await frame();
        }
        await pending;
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
          assert(heights[0] > 67, "Incoming footer must start expanded instead of snapping to compact");
          assert(heights.filter((h) => h > 67 && h < expandedHeight - 1).length >= 3,
            "Height animates through intermediate frames across the ownership change");
        }
        assert(Math.abs(heights.at(-1) - 66) < 1, "Incoming surface settles at compact height");
        if (destination.mode !== "loading") checkRow(destination.mode === "second" ? "Check answers" : "Submit");
      });
    }
    await test("Long feedback keeps actions aligned and reserves content space", async () => {
      await render({ phase: "explanation" });
      checkRow("Submit");
      window.scrollTo(0, document.body.scrollHeight);
      await settle();
      const answer = document.querySelector('[aria-label="Final answer"]');
      assert(
        answer.getBoundingClientRect().bottom <=
          panels()[0].getBoundingClientRect().top,
        "Last answer must scroll clear of feedback",
      );
    });
    await test("Suppression shows full navigation and releases the activity footer", async () => {
      await render({ mode: "cards" });
      assert(panels().length === 0, "No activity footer in cards");
      assert(
        document.querySelector("nav[data-bottom-navigation]"),
        "Full navigation restored",
      );
    });
    await test("Leaving an exceptional view restores activity controls", async () => {
      await render({ mode: "second" });
      checkRow("Check answers");
    });
  } finally {
    root.unmount();
    host.remove();
    await settle();
  }
  return results;
}
function Runner() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [preview, setPreview] = useState(false);
  const [phase, setPhase] = useState("ready");
  const [generation, setGeneration] = useState(0);
  const [mode, setMode] = useState("first");
  const start = async () => {
    setPreview(false);
    setResults([]);
    setRunning(true);
    await run(setResults);
    setRunning(false);
  };
  return (
    <ChakraProvider theme={theme}>
      <Box p={4}>
        <h1>Activity action regression checks</h1>
        <Button onClick={start} isDisabled={running}>
          Run checks
        </Button>
        <Button onClick={() => setPreview((v) => !v)} isDisabled={running}>
          Toggle preview
        </Button>
        <pre
          data-results=""
          data-run-status={running ? "running" : "complete"}
          style={{ whiteSpace: "pre-wrap", fontSize: 12 }}
        >
          {results.join("\n")}
        </pre>
        {preview && (
          <>
            <Select
              aria-label="Feedback preview"
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
            >
              {["ready", "correct", "incorrect", "explanation"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <Fixture
              phase={phase}
              generation={generation}
              mode={mode}
              onSubmit={() => setPhase("incorrect")}
              onNext={() => {
                setPhase("ready");
                setGeneration((value) => value + 1);
              }}
              onSkip={() => {
                setPhase("ready");
                setMode((value) => value === "first" ? "second" : "first");
              }}
            />
          </>
        )}
      </Box>
    </ChakraProvider>
  );
}
const previewTheme = new URLSearchParams(location.search).get("theme") === "dark"
  ? "dark"
  : "light";
// Keep preview preferences local to this page; never persist user settings.
useThemeStore.setState({ themeMode: previewTheme });
applyThemeMode(previewTheme);
createRoot(document.getElementById("root")).render(<Runner />);
