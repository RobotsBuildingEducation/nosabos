import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Exercise the production UI handler with controlled network/save responses.
const source = fs.readFileSync(new URL('../../components/AlphabetBootcamp.jsx', import.meta.url), 'utf8');
const start = source.indexOf('const handleNewRound = useCallback(async () => {');
const body = source.slice(start + 'const handleNewRound = useCallback(async () => {'.length, source.indexOf('\n  }, [isGeneratingDeck', start));
function harness({ generate, save } = {}) {
  const newCards = Array.from({length:6}, (_,i)=>({id:'extra-'+i,practiceWord:'fresh-'+i}));
  const alphabet = Array.from({length:28}, (_,i)=>({id:'base-'+i,practiceWord:'existing-'+i}));
  const state = { deck:[], collectedLetters:[...alphabet], generated:null, loading:false, saved:[], errors:[] };
  const environment = {
    isGeneratingDeck:false, isInitialized:true, focusedPractice:null, deck:state.deck,
    collectedLetters:state.collectedLetters, alphabet,
    generationRequestRef:{current:0}, generationScope:'account:de:hi:C2', generationScopeRef:{current:'account:de:hi:C2'},
    playSound:()=>{},selectSound:'select', setIsGeneratingDeck:value=>{state.loading=value;},
    targetLang:'de',uiLang:'hi',activeLevel:'C2',curriculumCards:alphabet,generatedCards:[],npub:'account',accountScope:'account:de',
    generateSupplementalPhonicsDeck:generate || (async options=>{state.options=options;return newCards;}),
    saveSupplementalPhonicsDeck:save || (async (npub,cards)=>{state.saved.push({npub,cards});}),
    generatedRecordsRef:{current:{scope:null,records:[]}},supplementalPhonicsRecord:card=>({letterId:card.id}),
    setGeneratedState:value=>{state.generated=value;},setDeck:value=>{state.deck=value;},
    toast:value=>state.errors.push(value),uiText:()=> 'Generation failed',console:{warn:()=>{}},
  };
  const run = new Function(...Object.keys(environment), 'return async () => {'+body+'};')(...Object.values(environment));
  return {run,state,environment,newCards,alphabet};
}

test('new round keeps all completed cards, saves six definitions and then displays them', async()=>{
  const {run,state,alphabet,newCards}=harness();
  await run();
  assert.deepEqual(state.collectedLetters,alphabet);
  assert.deepEqual(state.deck,newCards);
  assert.equal(state.generated.cards.length,6);
  assert.equal(state.saved[0].npub,'account');
  assert.deepEqual(state.options.existingWords,alphabet.map(card=>card.practiceWord));
  assert.equal(state.loading,false);
});

test('a failed definition save keeps the completed collection and makes retry available',async()=>{
  const {run,state,alphabet}=harness({save:async()=>{throw new Error('Offline');}});
  await run();
  assert.deepEqual(state.collectedLetters,alphabet);
  assert.deepEqual(state.deck,[]);
  assert.equal(state.generated,null);
  assert.equal(state.errors.length,1);
  assert.equal(state.loading,false);
});

test('switching accounts or levels while generating cannot save or display a late response',async()=>{
  let resolve;
  const {run,state,environment,newCards}=harness({generate:()=>new Promise(done=>{resolve=done;})});
  const pending=run();
  environment.generationScopeRef.current='different-account:de:hi:C2';
  resolve(newCards);
  await pending;
  assert.deepEqual(state.saved,[]);
  assert.deepEqual(state.deck,[]);
  assert.equal(state.generated,null);
});
