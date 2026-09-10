// Adapter accepts a Codex browser tab (tab.playwright + tab.reload) or a
// Playwright page wrapped as { playwright: page, reload: () => page.reload() }.
export async function runAstraBrowserChecks(tab) {
  const page = tab.playwright;
  const checks = [];
  const check = async (name, expected, locator) => {
    const text = await locator.innerText();
    if (!text.includes(expected))
      throw new Error(`${name}: expected ${expected}, got ${text}`);
    checks.push(name);
  };
  const button = (name) => page.getByRole("button", { name, exact: true });
  await button("Reset fixture").click();
  await page.getByRole("combobox", { name: "Goal mode" }).selectOption("lesson");
  await page
    .getByRole("textbox", {
      name: "Your goal (optional)",
      exact: true,
    })
    .fill("Talk with my grandmother about her childhood");
  await button("Save goal").click();
  await check(
    "one derived Goal",
    "repair → goal → speak",
    page.getByTestId("courses"),
  );
  await button("Open Goal task").click();
  await tab.reload();
  await check("refresh resumes objective", "lesson", page.getByTestId("route"));
  if (await page.getByRole("textbox", { name: "Try today's action", exact: true }).count()) throw new Error("Goal response form must start closed");
  checks.push("no response panel above practice");
  await button("Goal · Ask where your grandmother lived").click();
  await page
    .getByRole("textbox", { name: "Try today's action", exact: true })
    .fill("Hola");
  await button("Check my response").click();
  await check(
    "failed action remains incomplete",
    "Try asking",
    page.getByText("Try asking where she lived: ¿Dónde vivías?", {
      exact: true,
    }),
  );
  await button("Close").click();
  for (const [mode, surface] of Object.entries({
    tutor: "tutor",
    conversation: "conversations",
    flashcards: "flashcards",
    lesson: "lesson",
    phonics: "alphabet",
  })) {
    await page.getByRole("combobox", { name: "Goal mode" }).selectOption(mode);
    await button("Open Goal task").click();
    await check(`${mode} routing`, surface, page.getByTestId("route"));
    if (["phonics", "tutor", "conversation"].includes(mode))
      await button("Fixture: successful native attempt").click();
    else {
      await button("Goal · Ask where your grandmother lived").click();
      await page
        .getByRole("textbox", { name: "Try today's action", exact: true })
        .fill("¿Dónde vivías?");
      await button("Check my response").click();
    }
    if (["flashcards", "lesson"].includes(mode)) await button("Close").click();
    await check(
      `${mode} completion UI`,
      "Goal complete",
      button("Goal complete · Ask where your grandmother lived"),
    );
  }
  await page
    .getByRole("combobox", { name: "Practice language" })
    .selectOption("fr");
  await check(
    "language isolation",
    "repair → speak → learn",
    page.getByTestId("courses"),
  );
  await page
    .getByRole("combobox", { name: "Practice language" })
    .selectOption("es");
  await button("Pause").click();
  await check(
    "paused goal omitted",
    "repair → speak → learn",
    page.getByTestId("courses"),
  );
  await button("Resume").click();
  await check(
    "resume restores goal",
    "repair → goal → speak",
    page.getByTestId("courses"),
  );
  await button("Mark achieved").click();
  await check(
    "achieved goal omitted",
    "repair → speak → learn",
    page.getByTestId("courses"),
  );
  await check(
    "custom settings untouched",
    "Original custom topic | Original help | Original persona",
    page.getByTestId("custom-preferences"),
  );
  return checks;
}

// Start on /?onboarding. Uses the real Onboarding component and a local callback.
export async function runOnboardingBrowserChecks(tab) {
  const page = tab.playwright;
  const button = (name) => page.getByRole("button", { name, exact: true });
  const field = () => page.getByRole("textbox", { name: "Your goal (optional)", exact: true });
  if (!(await page.getByRole("heading", { name: "Welcome", exact: true }).isVisible())) throw new Error("Welcome must be visible");
  if (!(await page.locator('[aria-current="step"]').innerText()).includes("Language")) throw new Error("Language must be first");
  if (await field().count()) throw new Error("Goals must not render on the Language step");
  await button("Next").click();
  if (!(await page.locator('[aria-current="step"]').innerText()).includes("Goals")) throw new Error("Progress must follow the current step");
  await field().fill("Talk with my grandmother about her childhood");
  await button("Back").click();
  await button("Next").click();
  const draft = await field().evaluate((element) => element.value);
  if (draft !== "Talk with my grandmother about her childhood") throw new Error("Back/Next lost the goal draft");
  await button("Start session").click();
  const result = JSON.parse(await page.getByTestId("onboarding-result").innerText());
  if (result.supportLang !== "en" || result.targetLang !== "es" || result.learningGoals.es !== draft) throw new Error("Onboarding save lost a language or goal");
  return ["Language first", "Goals second", "progress follows step", "draft preserved", "languages and goal saved together"];
}

// Start on /?flashcard. The preview uses the real LessonFlashcard and feedback rail.
export async function runLessonFlashcardProgressChecks(tab) {
  const page = tab.playwright;
  for (const expected of [67, 74]) {
    await page.getByRole("textbox").fill("Would you like to grab coffee?");
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    const actual = await page.getByRole("progressbar", { name: "Lesson progress" }).getAttribute("aria-valuenow");
    if (Number(actual) !== expected) throw new Error(`Expected cumulative progress ${expected}, got ${actual}`);
    if (expected === 67) await page.getByRole("button", { name: "Next question", exact: true }).click();
  }
  return ["flashcard feedback includes progress", "progress survives the next exercise"];
}

// Start on /?completion, then exercise reload recovery and save retry.
export async function runGoalLessonCompletionChecks(tab) {
  const page = tab.playwright;
  const button = (name) => page.getByRole("button", { name, exact: true });
  const assertFinished = async () => {
    if (!(await page.getByRole("heading", { name: "Goal lesson", exact: true }).isVisible())) throw new Error("Finished task did not stay on the answered question");
    if (!(await page.getByRole("dialog", { name: "Task complete" }).isVisible())) throw new Error("Task-complete modal did not render over the question");
  };
  await button("Correct answer +5 XP").click();
  await button("Correct answer +5 XP").click();
  await assertFinished();
  await button("Continue").click();
  if (!(await page.getByRole("heading", { name: "Tutor", exact: true }).isVisible())) throw new Error("Continue did not advance to Tutor");
  await tab.goto("http://127.0.0.1:5186/?completion&resume");
  await assertFinished();
  await tab.goto("http://127.0.0.1:5186/?completion&resume&fail");
  if (!(await page.getByRole("heading", { name: "Goal lesson", exact: true }).isVisible())) throw new Error("Save failure removed the answered question");
  await button("Retry").click();
  await assertFinished();
  return ["100% stays on the question under the modal", "Continue advances to Tutor", "reload at 100% finishes", "save failure retries in place"];
}
