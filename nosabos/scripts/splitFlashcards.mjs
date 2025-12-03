/**
 * Script to split FLASHCARD_DATA by CEFR level into separate files
 * This improves performance by enabling lazy-loading of flashcard data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original flashcard data file
const flashcardDataPath = path.join(__dirname, '../src/data/flashcardData.js');
const flashcardData = fs.readFileSync(flashcardDataPath, 'utf8');

// Extract FLASHCARD_DATA array
const arrayMatch = flashcardData.match(/export const FLASHCARD_DATA = \[([\s\S]*?)\];/);
if (!arrayMatch) {
  console.error('Could not find FLASHCARD_DATA array');
  process.exit(1);
}

const arrayContent = arrayMatch[1];

// Parse the array content to extract individual flashcards
// We'll split by the pattern that marks each object
const flashcardPattern = /\{[\s\S]*?id: "(.*?)"[\s\S]*?cefrLevel: "(.*?)"[\s\S]*?\},?/g;
let match;
const flashcardsByLevel = {
  A1: [],
  A2: [],
  B1: [],
  B2: [],
  C1: [],
  C2: []
};

const rawFlashcards = [];
let currentFlashcard = '';
let braceCount = 0;
let inFlashcard = false;

// Parse line by line to extract complete flashcard objects
const lines = arrayContent.split('\n');
for (const line of lines) {
  // Count braces to track object boundaries
  for (const char of line) {
    if (char === '{') {
      braceCount++;
      if (braceCount === 1) {
        inFlashcard = true;
        currentFlashcard = '';
      }
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0 && inFlashcard) {
        currentFlashcard += line.substring(0, line.indexOf('}') + 1);
        rawFlashcards.push(currentFlashcard);
        inFlashcard = false;
        currentFlashcard = '';
        continue;
      }
    }
  }

  if (inFlashcard) {
    currentFlashcard += line + '\n';
  }
}

console.log(`Extracted ${rawFlashcards.length} flashcards`);

// Group flashcards by CEFR level
rawFlashcards.forEach(flashcardStr => {
  const levelMatch = flashcardStr.match(/cefrLevel: "(.*?)"/);
  if (levelMatch) {
    const level = levelMatch[1];
    if (flashcardsByLevel[level]) {
      flashcardsByLevel[level].push(flashcardStr.trim());
    }
  }
});

// Create output directory
const outputDir = path.join(__dirname, '../src/data/flashcards');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write separate files for each CEFR level
Object.entries(flashcardsByLevel).forEach(([level, flashcards]) => {
  console.log(`Writing ${flashcards.length} ${level} flashcards`);

  const fileContent = `/**
 * ${level} Level Flashcards
 * Total: ${flashcards.length} flashcards
 */

export const FLASHCARDS_${level} = [
  ${flashcards.join(',\n  ')}
];
`;

  const filePath = path.join(outputDir, `${level.toLowerCase()}.js`);
  fs.writeFileSync(filePath, fileContent, 'utf8');
  console.log(`Created ${filePath}`);
});

console.log('\n✅ Flashcard data split successfully!');
