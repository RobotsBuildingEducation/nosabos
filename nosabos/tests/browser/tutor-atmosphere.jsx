import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ChakraProvider,Box,Button,HStack,Text,VStack} from '@chakra-ui/react';
import TutorViewportEdgeGlow from '../../src/components/TutorViewportEdgeGlow.jsx';
import {createTutorVoiceEnvelope} from '../../src/utils/tutorVoiceEnvelope.js';
export default function Preview(){
 const [state,setState]=useState('speaking');const [light,setLight]=useState(false);const [enabled,setEnabled]=useState(true);const level=useRef(.2);
 const [voiceMode,setVoiceMode]=useState('rhythm');
 const meter=useRef(null);
 useEffect(()=>{
   const start=performance.now();
   const envelope=createTutorVoiceEnvelope({microphone:false});
   const timer=setInterval(()=>{
     const time=(performance.now()-start)/1000;
     const phase=time%9;
     const phrase=phase<6?Math.sin(Math.PI*phase/6):0;
     const rms=voiceMode==='quiet'?0:voiceMode==='loud'?.08:phrase*Math.max(0,.018+.016*Math.sin(time*11)+.008*Math.sin(time*17));
     level.current=envelope(rms,40);
     meter.current?.style.setProperty('--speech-level',String(level.current));
     meter.current?.setAttribute('aria-valuenow',level.current.toFixed(3));
   },40);
   return()=>clearInterval(timer);
 },[voiceMode]);
 return <ChakraProvider><Box minH="100dvh" bg={light?'#f7f1e7':'#060b16'} color={light?'#292722':'#eef3fa'}>
 <VStack position="relative" zIndex={1} maxW="620px" minH="100dvh" mx="auto" pt="60px" pb={8} px={5} spacing={7}>
 <Text w="100%" fontSize="lg" fontWeight={600}>Español · Tutor</Text>
 <Box w="100%" bg={light?'rgba(255,253,249,.9)':'rgba(9,15,29,.86)'} border="1px solid" borderColor={light?'#dedacf':'#273348'} borderRadius="28px" p={8}>
 <Text fontSize="sm" opacity={.7}>{!enabled?'Paused':state==='speaking'?'Tutor speaking':'Your turn'}</Text><Text fontSize="2xl" mt={6}>¡Hola! ¿Cómo estás hoy?</Text><Text mt={5} opacity={.8}>Hello! How are you today?</Text></Box>
 <Box flex={1}/>
 <HStack flexWrap="wrap" justify="center"><Button onClick={()=>setState('speaking')}>Tutor turn</Button><Button onClick={()=>setState('listening')}>Your turn</Button><Button onClick={()=>setLight(!light)}>Theme</Button><Button onClick={()=>setEnabled(!enabled)}>Pause</Button><Button onClick={()=>setVoiceMode('quiet')}>Quiet voice</Button><Button onClick={()=>setVoiceMode('loud')}>Louder voice</Button><Button onClick={()=>setVoiceMode('rhythm')}>Speech rhythm</Button></HStack>
 <VStack spacing={2}><Text fontSize="xs" opacity={.65}>Simulated speech · {voiceMode}</Text>
 <Box ref={meter} role="meter" aria-label="Speech level" aria-valuemin={0} aria-valuemax={1} aria-valuenow={0} w="160px" h="4px" borderRadius="full" overflow="hidden" bg={light?'rgba(30,90,85,.12)':'rgba(180,200,240,.12)'}>
 <Box h="100%" bg={light?'#3c9b90':'#899ce8'} transform="scaleX(var(--speech-level, 0))" transformOrigin="left"/></Box></VStack>
 </VStack><TutorViewportEdgeGlow state={state} enabled={enabled} isLightTheme={light} audioLevelRef={level}/>
 </Box></ChakraProvider>;
}
const root=import.meta.hot?.data.root||createRoot(document.getElementById('root'));
if(import.meta.hot) import.meta.hot.data.root=root;
root.render(<React.StrictMode><Preview/></React.StrictMode>);
