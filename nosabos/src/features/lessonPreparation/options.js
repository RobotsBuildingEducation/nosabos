import { eloForUser, practiceLevelForElo } from '../../utils/performanceEloModel.js';
import { DELIGHT_VARIANT_IDS } from '../../utils/delightQuestionVariants.js';
import { extractCEFRLevel } from '../../utils/cefrUtils.js';
import { chooseStoryMode } from '../stories/storySession.js';
export function createQuestionOptionSelector() {
  const quizDecks = new Map();
  function selectOptions(mode, context) {
    const {
      lesson,
      user,
      targetLang
    } = context;
    const content = lesson.content?.[mode];
    const curriculumLevel = lesson.cefrLevel || content?.cefrLevel || extractCEFRLevel(lesson.id) || 'A1';
    const fixed = lesson.isFinalQuiz || lesson.isTutorial || content?.tutorialPracticeLevel || lesson.isGoal || lesson.isRepair;
    const storyMode = content?.topic === "tutorial" ? "speaking" : chooseStoryMode(content);
    const cefrLevel = fixed || mode === "stories" && storyMode !== "speaking" ? curriculumLevel : practiceLevelForElo(eloForUser(user, targetLang));
    const types = ['fill', 'mc', 'ma', 'speak', 'match', 'translate', 'repeat', ...(!lesson.isFinalQuiz ? ['flashcard'] : []), ...DELIGHT_VARIANT_IDS.map(id => `delight:${id}`)];
    let deck = quizDecks.get(mode);
    if (lesson.isFinalQuiz && !deck?.length) {
      deck = [...types];
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      quizDecks.set(mode, deck);
    }
    const exerciseType = lesson.isFinalQuiz ? deck.shift() : types[Math.floor(Math.random() * types.length)];
    const isListening = exerciseType === 'repeat' && Math.random() < 0.5;
    const repeatMode = exerciseType === 'repeat' ? isListening ? 'listening-target' : Math.random() < 0.5 ? 'target-tts-support-bank' : 'support-tts-target-bank' : null;
    const direction = exerciseType === 'repeat' ? isListening ? 'support-to-target' : repeatMode === 'target-tts-support-bank' ? 'target-to-support' : 'support-to-target' : Math.random() < 0.5 ? 'target-to-support' : 'support-to-target';
    return {
      cefrLevel,
      curriculumCefrLevel: curriculumLevel,
      exerciseType,
      isListening,
      repeatMode,
      direction,
      storyMode
    };
  }
  selectOptions.reset = () => quizDecks.clear();
  return selectOptions;
}
