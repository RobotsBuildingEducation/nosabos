import { createQuestionOptionSelector } from './options';
import useUserStore from '../../hooks/useUserStore';
import { DEFAULT_TARGET_LANGUAGE, normalizePracticeLanguage, normalizeSupportLanguage, getLanguagePromptName } from '../../constants/languages';
import { questionWorthForUser } from '../../utils/performanceEloModel';
import { assessGeneratedQuestionWorth, assessGeneratedQuestionWorths } from '../../utils/questionDifficultyAssessment';
import { createLessonPreparationSession } from './session';
import { sanitizeGeminiResponseSchema } from '../../utils/geminiResponseSchema';
import { generateContentStreamWithTimeout, generateContentWithTimeout, settleProviderWithin } from '../../utils/providerGenerationTimeout';
export function preparationContext({
  lesson,
  account,
  targetLang,
  supportLang,
  user = useUserStore.getState().user
}) {
  return {
    lesson,
    account: account || user?.id || user?.local_npub || '',
    targetLang: normalizePracticeLanguage(targetLang, DEFAULT_TARGET_LANGUAGE),
    supportLang: normalizeSupportLanguage(supportLang || user?.appLanguage || 'en'),
    user
  };
}
export async function collectPreparedStream(response) {
  let text = '';
  for await (const chunk of response.stream) text += typeof chunk.text === 'function' ? chunk.text() : chunk.text || '';
  const final = await response.response;
  return (typeof final?.text === 'function' ? final.text() : final?.text) || text;
}
async function prepare(ticket) {
  const {
    mode,
    options,
    signal
  } = ticket;
  const originalContent = ticket.context.lesson.content?.[mode];
  const lessonContent = ticket.context.lesson.gameReviewContext && originalContent ? {
    ...originalContent,
    curriculumContext: ticket.context.lesson.gameReviewContext
  } : originalContent;
  const context = {
    ...ticket.context,
    lessonContent
  };
  const {
    user,
    targetLang,
    supportLang
  } = context;
  if (signal.aborted || mode === "realtime" && lessonContent?.topic === "tutorial") return null;
  if (['vocabulary', 'grammar'].includes(mode) && options.exerciseType.startsWith('delight:')) {
    const {
      prepareDelightQuestion
    } = await import('../../utils/prepareDelightQuestion');
    const question = await prepareDelightQuestion({
      ...context,
      ...options,
      variant: options.exerciseType.slice(8),
      moduleType: mode,
      signal
    });
    return {
      preparedQuestion: question,
      difficultyScore: question.worth.difficultyScore
    };
  }
  const component = mode === 'vocabulary' ? await import('../../components/Vocabulary') : mode === 'grammar' ? await import('../../components/GrammarBook') : mode === 'reading' ? await import('../../components/History') : mode === 'realtime' ? await import('../../components/RealTimeTest') : mode === 'stories' ? await import('../../components/Stories') : null;
  if (signal.aborted || !component?.buildLessonPreparationRecipe) return null;
  const recipe = await component.buildLessonPreparationRecipe({
    ...context,
    targetName: getLanguagePromptName(targetLang),
    supportName: getLanguagePromptName(supportLang)
  }, options);
  if (recipe.prepare) return recipe.prepare(signal);
  const {
    questionModel,
    readingModel,
    simplemodel,
    storyModel
  } = await import('../../firebaseResources/firebaseResources');
  const model = mode === 'reading' ? readingModel : mode === 'realtime' ? simplemodel : mode === 'stories' ? storyModel : questionModel;
  const request = {
    contents: [{
      role: 'user',
      parts: [{
        text: recipe.prompt
      }]
    }],
    ...(recipe.generationConfig ? {
      generationConfig: recipe.generationConfig
    } : {})
  };
  let raw;
  try {
    raw = recipe.responseSchema ? (await generateContentWithTimeout(model, {
      ...request,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: sanitizeGeminiResponseSchema(recipe.responseSchema)
      }
    })).response.text() : await collectPreparedStream(await generateContentStreamWithTimeout(model, request));
  } catch {
    if (signal.aborted) return null;
    const {
      callResponses,
      DEFAULT_RESPONSES_MODEL
    } = await import('../../utils/llm');
    raw = await settleProviderWithin(callResponses({
      model: DEFAULT_RESPONSES_MODEL,
      input: recipe.prompt,
      skipGemini: true,
      ...(recipe.responseSchema ? {
        responseSchema: recipe.responseSchema,
        responseSchemaName: 'prepared_lesson_question'
      } : {})
    }));
  }
  if (signal.aborted || !String(raw || '').trim()) return null;
  // Comprehension stories already grade their authored checkpoints locally.
  if (recipe.metadata?.comprehensionStory) return { raw, ...recipe.metadata };
  // Content can be displayed while its independent difficulty request finishes.
  // Grading awaits this same promise; it never launches a second assessment.
  const assessmentPromise = (async () => {
    if (recipe.metadata?.speakingStory) {
      const sentences = String(raw).split('\n').flatMap(line => {
        try {
          const item = JSON.parse(line);
          return item.type === 'sentence' && item.tgt ? [{
            sentence: item.tgt,
            task: 'Understand and pronounce this sentence'
          }] : [];
        } catch {
          return [];
        }
      });
      const worths = await settleProviderWithin(assessGeneratedQuestionWorths({
        user,
        targetLang,
        questionLevel: options.cefrLevel,
        questions: sentences,
        mode: 'story'
      })).catch(() => sentences.map(() => questionWorthForUser(user, targetLang, options.cefrLevel)));
      return {
        sentenceDifficultyScores: worths.map(worth => worth.difficultyScore)
      };
    }
    const worth = await settleProviderWithin(assessGeneratedQuestionWorth({
      user,
      targetLang,
      questionLevel: options.cefrLevel,
      question: raw,
      mode
    })).catch(() => questionWorthForUser(user, targetLang, options.cefrLevel));
    return {
      difficultyScore: worth.difficultyScore
    };
  })();
  return {
    raw,
    assessmentPromise,
    ...recipe.metadata
  };
}
export function prepareSkillTreeLesson(context, initialMode) {
  return createLessonPreparationSession(context, prepare, Math.random, createQuestionOptionSelector(), initialMode);
}
