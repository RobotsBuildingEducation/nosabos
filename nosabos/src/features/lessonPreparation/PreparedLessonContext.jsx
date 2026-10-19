import { createContext, useContext, useMemo } from 'react';
import useUserStore from '../../hooks/useUserStore';
import { assessGeneratedQuestionWorth, assessGeneratedQuestionWorths } from '../../utils/questionDifficultyAssessment';
import { createPreparedQuestionConsumer } from './consumer';
export const PreparedLessonContext = createContext(null);
export function usePreparedLessonQuestion(mode, lesson) {
  const ticket = useContext(PreparedLessonContext);
  return useMemo(() => createPreparedQuestionConsumer(ticket, mode, lesson?.id, {
    getUser: () => useUserStore.getState().user,
    assess: assessGeneratedQuestionWorth,
    assessMany: assessGeneratedQuestionWorths
  }), [ticket, mode, lesson?.id]);
}
