import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, Button } from '@chakra-ui/react';
import { LessonDetailModal } from '../src/components/SkillTree';
import Vocabulary from '../src/components/Vocabulary';
import GrammarBook from '../src/components/GrammarBook';
import { PreparedLessonContext } from '../src/features/lessonPreparation/PreparedLessonContext';
import { preparationContext } from "../src/features/lessonPreparation/runtime";
import useUserStore from '../src/hooks/useUserStore';
import { theme } from '../src/theme';

// The browser runner supplies controlled model responses; it does not make
// live generation, grading, or reward requests. The modal, scheduler, consumers, and exercise parsers are production.
useUserStore.getState().setUser({ appLanguage: 'en', progress: { targetLang: 'es', supportLang: 'en', showTranslations: true } });
const normal = { id: 'lesson-a1-preparation-regression', title: {en:'Prepared family lesson'}, description:{en:'Family practice'},
  modes:['vocabulary','grammar'], cefrLevel:'A1', xpReward:20,
  content:{vocabulary:{topic:'family',words:['madre','padre']},grammar:{topic:'family sentences'}} };
const unit = {id:'unit-a1-preparation',title:{en:'Family'},cefrLevel:'A1',lessons:[normal]};
export default function Regression() {
  const [lesson,setLesson] = useState(normal);
  const [open,setOpen] = useState(false);
  const [ticket,setTicket] = useState(null);
  const session=useRef(null);
  const next = () => { const value=session.current.advance(session.current.current.id);setTicket(value); };
  useEffect(()=>{let cancelled=false;ticket?.promise.then(()=>{if(!cancelled)session.current.prepareNext(ticket.mode)});return()=>{cancelled=true}},[ticket]);
  window.openPreparationLesson = (kind='normal') => {session.current?.dispose();setTicket(null);setLesson(kind==='game'?{...normal,isGame:true,modes:['game']}:kind==='quiz'?{...normal,id:'quiz',isFinalQuiz:true,modes:['vocabulary'],quizConfig:{questionsRequired:2,passingScore:2}}:normal);setOpen(true)};
  window.preparationState=()=>({current:session.current?.current?.id,next:session.current?.next?.id,mode:ticket?.mode});
  return <ChakraProvider theme={theme}>
    <Button onClick={()=>window.openPreparationLesson()}>Open lesson</Button>
    <LessonDetailModal lesson={lesson} unit={unit} isOpen={open} onClose={()=>setOpen(false)} supportLang="en" targetLang="es" activeNpub="regression"
      onStartLesson={async(_lesson,_scenario,prepared)=>{if(!prepared.matches(preparationContext({lesson:_lesson,account:"regression",targetLang:"es",supportLang:"en"})))throw new Error("Modal preparation scope changed on start");session.current=prepared;prepared.started=true;setTicket(prepared.current);setOpen(false);return true}} />
    {ticket && <PreparedLessonContext.Provider value={ticket}>
      {ticket.mode==='vocabulary'?<Vocabulary key={ticket.id} userLanguage="en" lesson={lesson} lessonContent={lesson.content.vocabulary} isFinalQuiz={lesson.isFinalQuiz} quizConfig={lesson.quizConfig} onSkip={next}/>:<GrammarBook key={ticket.id} userLanguage="en" lesson={lesson} lessonContent={lesson.content.grammar} onSkip={next}/>}
      <Button onClick={next}>Advance module for regression</Button>
    </PreparedLessonContext.Provider>}
  </ChakraProvider>;
}
createRoot(document.getElementById('root')).render(<Regression/>);

window.verifyPreparedLessonRecipes = async () => {
  const modules = {
    vocabulary: await import('../src/components/Vocabulary'),
    grammar: await import('../src/components/GrammarBook'),
    reading: await import('../src/components/History'),
    realtime: await import('../src/components/RealTimeTest'),
    stories: await import('../src/components/Stories'),
  };
  const results = [];
  for (const [mode, module] of Object.entries(modules)) {
    const options = mode === 'vocabulary' || mode === 'grammar'
      ? ['fill', 'mc', 'ma', 'speak', 'match', 'translate', 'repeat', 'flashcard'].map(exerciseType => ({ exerciseType }))
      : mode === 'stories' ? ['speaking', 'radio', 'conversation'].map(storyMode => ({ storyMode })) : [{}];
    for (const option of options) {
      const recipe = await module.buildLessonPreparationRecipe({ lesson: normal, account: 'regression',
        targetLang: 'es', supportLang: 'en', targetName: 'Spanish', supportName: 'English',
        user: useUserStore.getState().user, lessonContent: { topic: 'family', focusPoints: ['madre', 'padre'] } },
        { cefrLevel: 'A1', curriculumCefrLevel: 'A1', direction: 'target-to-support', ...option });
      results.push({ mode, type: option.exerciseType || option.storyMode || mode, valid: typeof recipe.prompt === 'string' && recipe.prompt.length > 30 });
    }
  }
  return results;
};
