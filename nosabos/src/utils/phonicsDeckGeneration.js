import { callResponses, DEFAULT_RESPONSES_MODEL } from './llm';
import { LANGUAGE_PROMPT_LABELS } from '../constants/languages';
import { buildSupplementalPhonicsDeck, SUPPLEMENTAL_DECK_SIZE } from './supplementalPhonics.js';

export async function generateSupplementalPhonicsDeck({ target, support, level, existingWords = [], batchId }) {
  const raw = await callResponses({
    model: DEFAULT_RESPONSES_MODEL,
    input: [
      'Create an optional continuation deck for pronunciation practice.',
      'Target language: ' + LANGUAGE_PROMPT_LABELS[target] + '. Support language: ' + LANGUAGE_PROMPT_LABELS[support] + '.',
      'Practice level: ' + level + '. Produce exactly ' + SUPPLEMENTAL_DECK_SIZE + ' distinct units at this level.',
      'Use genuine target-language words or phrases in their native writing system.',
      'For Pre-A1/A1 use simple sound contrasts. A2/B1: syllables, length, clusters and stress. B2/C1/C2: connected speech, subtle contrasts and natural phrasing.',
      'ALL explanations, coaching tips and meanings must be in the support language. Do not use English comparisons when English is not the support language.',
      'Avoid all of these previously practiced words/phrases: ' + JSON.stringify(existingWords.slice(-1000)),
      'Return ONLY a JSON array. Each object has these required string fields:',
      '{"grapheme":"target sound or spelling","exampleWord":"target word or phrase","sound":"localized explanation","tip":"localized coaching","meaning":"localized meaning"}',
      'Do not claim that transcription can measure tone, stress or pitch. Do not include markdown, HTML or alternative English fields.',
    ].join('\n'),
  });
  const text = typeof raw === 'string' ? raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '') : '';
  return buildSupplementalPhonicsDeck(JSON.parse(text), { target, support, level, existingWords, batchId });
}
