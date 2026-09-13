I’d push Piyali toward a companion that prepares you for moments in your real life—and lets you feel yourself becoming capable.
I explored the local home screen, lesson path, conversation setup, and the code behind your curriculum, tutoring, stories, RPG, review, and companion systems. These are product hypotheses grounded in that review; I haven’t validated them against learner interviews or usage data.
You already have substantial depth: structured CEFR lessons, nine exercise variants, live conversation, tutoring, phonics, spaced review, radio, stories, games, and personalized repairs. The opportunities that interest me most build connections between those experiences.
A useful competitive check: Speak already generates practice from mistakes and interests, and Duolingo’s Lily remembers details from previous conversations. My inference is that Piyali’s differentiation will depend on what that personalization helps someone accomplish.

1. “Help me get ready for…” — the strongest next product
   Let learners bring an upcoming moment:
   “I’m meeting my partner’s parents.”
   “I want to participate in tomorrow’s meeting.”
   “I want to ask my grandmother about her childhood.”

Piyali turns that intention into a short journey using your existing activities. A family conversation might involve listening to a short story, practicing a follow-up question, rehearsing with the tutor, and attempting a conversation with an unexpected response.
Your home currently leads with “Tutor / Lessons / Flash Cards” and an XP bonus. The upgraded experience could lead with:
Today: keep a family conversation going.
Practice asking two follow-up questions · About 6 minutes

The distinction from your existing custom conversation topics is that the intention persists across days and coordinates every mode. After the event, a brief “How did it go?” shapes the next session.
Start with three carefully designed journeys. This also fits the CEFR’s action-oriented approach, which connects several lessons through realistic scenarios culminating in a meaningful performance. 2. Give the companion a lasting picture of what I can do
Your [companion memory intentionally expires after its reinforcement window (line 1212)](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/utils/companionMemory.js:1212). Keep that fresh, lightweight mistake log, and add durable summaries of demonstrated capabilities.
For a phrase or skill, distinguish:

- I recognize it.
- I can produce it with help.
- I can use it independently.
- I can still use it later, in a different situation.
  That enables a much more perceptive companion:
  “You understand these questions easily. Today we’ll practice answering without the sentence starter.”

A particularly valuable connection: [free-form conversation currently stays outside companion repair (line 2730)](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/components/Conversations.jsx:2730) because it is too unstructured. After a conversation, offer one focused check: “Let’s try that request once more.” Its result can become reliable learning evidence.
First version: track a small set of useful communication skills across tutor, lessons, and these checks. Let learners see the reasons behind recommendations. 3. “Listen to how far you’ve come” — the most emotionally powerful upgrade
With permission, save occasional short speaking samples and create a private progress reel.
Your first week: introducing yourself with prompts.
Today: introducing yourself and asking someone a question independently.

Let the learner play both. Highlight concrete changes: completed the task, needed fewer hints, added a follow-up, recovered after getting stuck.
The delightful moment is hearing your own growth. A score cannot deliver quite the same experience.
Use comparable prompts, plus an occasional unfamiliar situation to check whether improvement transfers. Research on speaking-task repetition distinguishes improvement on practiced material from performance on new tasks.
First version: one baseline recording and one weekly comparison, with learner-controlled saving and deletion. 4. Turn your stories, radio, and RPG into a continuing world
You already have recurring characters, stable voices, and authored RPG episodes. Give them shared continuity.
For example:
A character mentions a missing package on the radio.
In a conversation, you discover where it went.
In the RPG, you explain the mistake and arrange its return.
Tomorrow, the character remembers your help.

Language becomes how the learner changes what happens.
The especially interesting mechanic is information that must be communicated: one character knows the time, another has the address, and the learner must connect the pieces. Success means resolving the situation. Grammar feedback can follow naturally.
First version: one three-episode storyline, a small cast, and a few persistent consequences. The quality of the characters and writing would matter enormously here. 5. “Teach me through this” — bring the learner’s world into Piyali
Let someone choose a message, menu photo, short audio clip, or passage and say:
“I want to understand this—and respond like myself.”

Piyali could:

1. Explain the specific confusing part.
2. Pull out two useful expressions.
3. Help the learner compose their own response.
4. Rehearse likely replies.
5. Revisit those expressions in later practice.
   Your existing immersion tasks already encourage learners to discover media and communities. This would close the loop when they encounter something interesting or difficult.
   First version: pasted text and a “Practice replying” action. Images and audio can follow. The key experience is that something from my day becomes tomorrow’s useful lesson.
6. Build a distinctive “Family & Belonging” experience
   This is a promising audience hypothesis given Piyali’s cultural direction, citizenship work, and community-language resources.
   Possible experiences include:

- Practicing how to tell a family story.
- Understanding teasing, affection, politeness, and regional expressions.
- Asking a relative about a recipe or childhood memory.
- Rehearsing a voice message before sending it yourself.
- Learning from recordings relatives choose to contribute.
  Give learners separate support for comprehension and expression. Someone who understands family conversation but struggles to answer should receive a fitting path.
  Your “Natural or Weird?” and dialogue exercises could become particularly useful here: Would I say this to a cousin, an elder, or a colleague?
  For Nahuatl and Yucatec Maya, a small collection created with credited, compensated community speakers could become a distinctive product. It builds on your existing decision to seek community knowledge for these languages.

7. Make returning to Piyali feel wonderful
   Your [pet system can reduce health to a dead state after missed goals (line 127)](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/utils/dailyGoalPet.js:127). I’d test how learners experience that, especially after a long absence.
   An alternative comeback experience:
   “Welcome back. I saved something you already know. Let’s start there.”

The companion could have been resting or collecting a small discovery. One familiar success restarts the relationship.
Also let today’s practice adapt to explicit circumstances:
2 minutes / 6 minutes / longer
Can speak / need quiet

Your variety of modes makes this unusually feasible. Preserve the learning objective while adjusting the activity, and remember unfinished work.
The hypothesis to test is whether a welcoming return helps people resume and continue practicing.
A few smaller upgrades also deserve attention:

- Celebrate conversational recovery. Asking someone to repeat, clarifying meaning, and paraphrasing are meaningful achievements.
- Offer “I meant something else.” Learners need a graceful way to challenge an AI correction and clarify their intention.
- Make assessment claims trustworthy. One [reading-feedback prompt estimates pronunciation and confidence from a transcript (line 1838)](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/components/History.jsx:1838). I’d narrow feedback to what the available evidence supports; confident but questionable feedback can undermine the entire tutor relationship.
- Give companions souvenirs tied to actual accomplishments. A little radio after understanding an episode, or a postcard after completing a journey, makes customization carry personal meaning.
  My first investment would combine ideas 1–3 into one small experience: choose an upcoming moment, complete a few connected practices, attempt a fresh situation, and hear the improvement.
  I’d pilot it with roughly 10–15 learners before expanding. Watch whether they understand why today’s practice matters, can perform the task later with fewer supports, voluntarily return, and actually use something outside the app. Those findings would tell us which larger product—personal rehearsal, a continuing story world, or family connection—deserves the next major investment.
