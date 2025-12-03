/**
 * Script to split baseLearningPath by CEFR level into separate files
 * This improves performance by enabling lazy-loading of skill tree data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original skill tree data file
const skillTreeDataPath = path.join(__dirname, '../src/data/skillTreeData.js');
const lines = fs.readFileSync(skillTreeDataPath, 'utf8').split('\n');

// Line ranges for each CEFR level (0-indexed)
const levelRanges = {
  A1: { start: 32, end: 2228 },  // Lines 33 to 2229
  A2: { start: 2229, end: 4288 }, // Lines 2230 to 4289
  B1: { start: 4289, end: 6004 }, // Lines 4290 to 6005
  B2: { start: 6005, end: 7376 }, // Lines 6006 to 7377
  C1: { start: 7377, end: 8518 }, // Lines 7378 to 8519
  C2: { start: 8519, end: 10650 }, // Lines 8520 to end
};

// Create output directory
const outputDir = path.join(__dirname, '../src/data/skillTree');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Extract and write each level
Object.entries(levelRanges).forEach(([level, range]) => {
  // Extract the level's data (skip the "A1: [" line, start with the first unit)
  const levelLines = lines.slice(range.start + 1, range.end);

  // Remove the trailing "]," or "]" from the last line
  const lastLineIndex = levelLines.length - 1;
  if (levelLines[lastLineIndex]) {
    levelLines[lastLineIndex] = levelLines[lastLineIndex].replace(/\],?\s*$/, '');
  }

  const content = levelLines.join('\n').trim();

  const fileContent = `/**
 * ${level} Level Skill Tree Data
 */

export const SKILL_TREE_${level} = [
${content}
];
`;

  const filePath = path.join(outputDir, `${level.toLowerCase()}.js`);
  fs.writeFileSync(filePath, fileContent, 'utf8');
  console.log(`✓ Created ${level} skill tree (lines ${range.start + 1} - ${range.end})`);
});

console.log('\n✅ Skill tree data split successfully!');
