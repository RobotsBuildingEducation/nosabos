import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { selectSound, submitActionSound } from "../constants/sounds.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("sound constants exist and map to correct tone keys", () => {
  assert.equal(selectSound, "select");
  assert.equal(submitActionSound, "submitAction");
});

test("NotesDrawer wires selectSound to interactive selections", () => {
  const fileContent = fs.readFileSync(path.join(__dirname, "../components/NotesDrawer.jsx"), "utf8");

  assert.ok(
    fileContent.includes('import useSoundSettings from "../hooks/useSoundSettings";'),
    "NotesDrawer should import useSoundSettings",
  );
  assert.ok(
    fileContent.includes('import { selectSound } from "../constants/sounds";'),
    "NotesDrawer should import selectSound",
  );
  assert.ok(
    fileContent.includes("const playSound = useSoundSettings((s) => s.playSound);"),
    "NotesDrawer should initialize playSound",
  );

  // Tab change
  assert.ok(
    /onChange=\{index => \{\s*playSound\(selectSound\);/.test(fileContent),
    "Tabs onChange should play selectSound",
  );

  // CEFR Accordion button
  assert.ok(
    fileContent.includes("playSound(selectSound);\n                                    }"),
    "CEFR level accordion button should play selectSound",
  );

  // Note item Accordion button
  assert.ok(
    fileContent.includes("onClick={() => playSound(selectSound)}"),
    "Note item accordion button should play selectSound",
  );

  // Clear all button
  assert.ok(
    fileContent.includes("playSound(selectSound);\n                    clearNotesForLanguage(targetLang);"),
    "Clear all button should play selectSound",
  );

  // Delete note button
  assert.ok(
    fileContent.includes("playSound(selectSound);\n                  removeNote(note.id);"),
    "Delete note button should play selectSound",
  );

  // Close drawer button
  assert.ok(
    fileContent.includes("playSound(selectSound);\n            onClose();"),
    "Drawer close button should play selectSound",
  );
});

test("VoiceJourney wires selectSound to listen, record, delete, and retry", () => {
  const fileContent = fs.readFileSync(path.join(__dirname, "../components/VoiceJourney.jsx"), "utf8");

  assert.ok(
    fileContent.includes('import useSoundSettings from "../hooks/useSoundSettings";'),
    "VoiceJourney should import useSoundSettings",
  );
  assert.ok(
    fileContent.includes('import { selectSound } from "../constants/sounds";'),
    "VoiceJourney should import selectSound",
  );
  assert.ok(
    fileContent.includes("const playSound = useSoundSettings((s) => s.playSound);"),
    "VoiceJourney should initialize playSound",
  );

  // Listen button
  assert.ok(
    fileContent.includes("playSound(selectSound);\n                if (active && clips)"),
    "Listen button should play selectSound",
  );

  // Record button
  assert.ok(
    fileContent.includes("playSound(selectSound);\n                  requestRef.current += 1;"),
    "Record button should play selectSound",
  );

  // Delete triggers
  assert.ok(
    fileContent.includes("playSound(selectSound); setConfirmDelete(number);"),
    "Delete milestone prompt button should play selectSound",
  );
  assert.ok(
    fileContent.includes("playSound(selectSound); remove(number);"),
    "Confirm delete button should play selectSound",
  );
  assert.ok(
    fileContent.includes("playSound(selectSound); setConfirmDelete(null);"),
    "Cancel delete button should play selectSound",
  );

  // Retry button
  assert.ok(
    fileContent.includes("playSound(selectSound); retry();"),
    "Error retry button should play selectSound",
  );
});

test("JourneyRecordingModal wires selectSound and submitActionSound", () => {
  const fileContent = fs.readFileSync(path.join(__dirname, "../components/JourneyRecordingModal.jsx"), "utf8");

  assert.ok(
    fileContent.includes('import useSoundSettings from "../hooks/useSoundSettings";'),
    "JourneyRecordingModal should import useSoundSettings",
  );
  assert.ok(
    fileContent.includes('import { selectSound, submitActionSound } from "../constants/sounds";'),
    "JourneyRecordingModal should import selectSound and submitActionSound",
  );
  assert.ok(
    fileContent.includes("const playSound = useSoundSettings((s) => s.playSound);"),
    "JourneyRecordingModal should initialize playSound",
  );

  // Milestone selection
  assert.ok(
    fileContent.includes("const selectMilestone = num => {\n    if (num > sessionCount || busy) return;\n    playSound(selectSound);"),
    "selectMilestone should play selectSound",
  );

  // Save recording
  assert.ok(
    fileContent.includes("const handleSave = async () => {\n    if (!activeRecording?.blob) return;\n    playSound(submitActionSound);"),
    "handleSave should play submitActionSound",
  );

  // ModalCloseButton
  assert.ok(
    fileContent.includes("playSound(selectSound);\n            onClose?.();"),
    "ModalCloseButton should play selectSound",
  );

  // Record again button
  assert.ok(
    fileContent.includes('import { MdReplay } from "react-icons/md";'),
    "JourneyRecordingModal should import MdReplay",
  );
  assert.ok(
    fileContent.includes("leftIcon={<MdReplay />}"),
    "Again button should have MdReplay leftIcon",
  );
  assert.ok(
    fileContent.includes("playSound(selectSound);\n                          setActiveRecording(null);"),
    "Again button should play selectSound",
  );

  // Record/stop toggle button
  assert.ok(
    fileContent.includes("playSound(selectSound);\n                        if (recorderState.status === \"recording\")"),
    "Record/Stop button should play selectSound",
  );

  // Later / Done button
  assert.ok(
    fileContent.includes("playSound(selectSound);\n                  onClose?.();"),
    "Done/Later button should play selectSound",
  );

  // View in journey button
  assert.ok(
    fileContent.includes("playSound(selectSound);\n                  onOpenJourney?.();"),
    "View in journey button should play selectSound",
  );
});

test("JourneyTestButton wires selectSound on trigger", () => {
  const fileContent = fs.readFileSync(path.join(__dirname, "../components/JourneyTestButton.jsx"), "utf8");

  assert.ok(
    fileContent.includes('import useSoundSettings from "../hooks/useSoundSettings";'),
    "JourneyTestButton should import useSoundSettings",
  );
  assert.ok(
    fileContent.includes('import { selectSound } from "../constants/sounds";'),
    "JourneyTestButton should import selectSound",
  );
  assert.ok(
    fileContent.includes("playSound(selectSound);\n          open();"),
    "JourneyTestButton should play selectSound on click",
  );
});
