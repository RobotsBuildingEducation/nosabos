// Reading-specific scope. Subjects are optional contexts to rotate; the lesson's
// target-language forms and comprehension distinctions remain authoritative.
// Stable lesson IDs keep saved progress and target-language adaptations intact.
const pools = {
  extended_family: ["a cousin and their parents", "an aunt and her niece or nephew", "an uncle and his siblings", "a grandparent and their grandchildren", "relatives in an old photograph", "younger and older generations of a family"],
  places: ["a town square", "a quiet neighborhood", "a busy city center", "a coastal town", "a mountain village", "a district with parks and shops"],
  school: ["a school project", "a new class", "a school club", "a school outing", "a change to the school day", "preparing for a school event"],
  travel: ["a missed connection", "an unexpected local discovery", "a change of accommodation", "a helpful fellow traveler", "a forgotten travel item", "an unfamiliar local custom"],
  people: ["a friend", "a classmate", "a teacher", "children playing together", "a coworker", "a teammate", "a familiar shop worker", "a neighbor"],
  numbers: ["counting art supplies", "scores in a friendly game", "amounts on price tags", "seats and tickets", "a collection of objects", "quantities for a group activity"],
  greetings: ["a first day in a class", "welcoming a visitor at home", "joining a hobby group", "arriving at work", "a family visit", "meeting people at a community event"],
  farewells: ["finishing a class", "leaving a family visit", "ending a workday", "departing on a journey", "moving away from friends", "finishing a group activity"],
  reactions: ["an unexpected discovery", "a changed plan", "progress with a skill", "a surprising practical detail", "a small disappointment", "a thoughtful gesture"],
  courtesy: ["borrowing something at school", "thanking someone at home", "requesting help on public transport", "returning an item to its owner", "correcting a small mistake at work", "receiving help at a shop"],
  belongings: ["things on a desk", "objects in coat pockets", "items on a bedroom shelf", "contents of a travel bag", "supplies for an art activity", "belongings stored by the front door"],
  menus: ["a bakery cafe breakfast menu", "a park cafe lunch menu", "a station cafe drinks menu", "a seaside cafe snack menu", "a neighborhood cafe seasonal menu", "a museum cafe afternoon menu"],
  contacts: ["a fictional sports club contact card", "a fictional language class contact card", "a fictional hobby group contact card", "a fictional volunteer contact card", "a fictional music class contact card", "a fictional library activity contact card"],
  calendars: ["a student's week", "a worker's shift pattern", "a hobby club calendar", "a family activity calendar", "a volunteering week", "a local events calendar"],
  invitations: ["a birthday gathering", "an art opening", "a study meeting", "a picnic", "a club celebration", "a small music event"],
  appointments: ["a tutoring appointment", "a bicycle repair appointment", "a music lesson", "a group project meeting", "a home maintenance visit", "a club planning meeting"],
  family: ["siblings and their parents", "cousins in two households", "grandparents and grandchildren", "aunts and uncles", "relatives in a family photograph", "relationships at a family gathering"],
  colors: ["clothing and accessories", "flowers and leaves", "stationery and school supplies", "vehicles and bicycles", "signs and decorations", "paintings and crafts"],
  food: ["breakfast preferences", "fresh fruit and snacks", "lunch choices", "foods for a picnic", "seasonal ingredients", "a favorite evening meal"],
  restaurant_bills: ["a breakfast bill", "a family lunch bill", "a cafe snack bill", "a group dinner bill", "a takeaway restaurant bill", "a set-menu restaurant bill"],
  classroom: ["an art classroom", "a language classroom", "a science classroom", "a music classroom", "a shared study room", "a classroom reading corner"],
  home: ["a kitchen", "a bedroom", "a living room", "a hallway", "a home study corner", "a shared dining room"],
  clothing: ["a rainy-day outfit", "clothes for a hot day", "sports clothes", "clothes for a celebration", "work clothes", "clothes packed for a trip"],
  routines: ["a student's routine", "a gardener's routine", "a shop worker's routine", "a musician's routine", "a parent's routine", "a volunteer's routine"],
  weather: ["a coastal and an inland city", "a mountain and a valley city", "a rainy and a dry city", "two cities in different seasons", "two cities during a weather change", "a warm and a cool city"],
  preferences: ["indoor and outdoor hobbies", "food and drink choices", "ways of traveling", "music and art", "places to spend free time", "group and individual activities"],
  information: ["library visitor information", "a club membership page", "an event information page", "a repair service information sheet", "a course information page", "a transport information notice"],
  destinations: ["two coastal destinations", "two historic towns", "a forest and a mountain destination", "two cities with different attractions", "two quiet countryside destinations", "an island and a lakeside destination"],
  shopping: ["stationery shopping", "buying household items", "buying clothes", "buying hobby supplies", "buying a gift", "buying sports equipment"],
  markets: ["a fruit stall", "a vegetable stall", "a bread stall", "a flower stall", "a grains and beans stall", "a mixed market shopping list"],
  transport: ["a local bus timetable", "a train timetable", "a ferry timetable", "an airport shuttle timetable", "a coach timetable", "a tram timetable"],
  routes: ["a route to a library", "a route to a park", "a route to a station", "a route to a museum", "a route to a community center", "a route to a sports ground"],
  plans: ["a shared study plan", "a weekend outing", "a volunteering plan", "a family visit", "a hobby project", "a small community activity"],
  hobbies: ["gardening", "drawing", "making music", "reading", "photography", "making or repairing simple objects"],
  fitness: ["a walking plan", "a swimming plan", "a cycling plan", "a dance practice plan", "a stretching routine", "a recreational sports plan"],
  past_events: ["a misplaced delivery", "a repaired bicycle", "an interrupted outing", "an exhibition visit", "a delayed journey", "a group project that changed direction", "finding a forgotten object", "learning an unfamiliar task"],
  future: ["learning a skill", "organizing an event", "improving a shared space", "planning a visit", "starting a hobby project", "changing a weekly routine"],
  wellbeing: ["sleep and daily schedules", "movement during a busy day", "rest during a demanding week", "everyday food routines", "balancing social time and quiet time", "managing a change in routine"],
  health: ["a fictional cold and rest note", "a fictional seasonal allergy note", "a fictional minor sports injury note", "a fictional sore-throat care note", "a fictional tiredness consultation summary", "a fictional recovery follow-up note"],
  jobs: ["creative and technical jobs", "outdoor and indoor jobs", "jobs involving books and information", "jobs involving food", "repair and maintenance jobs", "jobs involving care for plants or animals"],
  learning: ["learning a language", "learning an instrument", "learning to cook", "learning to use a device", "learning to draw", "learning a practical repair skill"],
  technology: ["calendar and reminder apps", "navigation tools", "photo organization", "translation tools", "accessibility features", "devices for a shared project"],
  comparisons: ["two useful objects", "two shared spaces", "two ways to complete a task", "two transport choices", "two places to visit", "two group activities"],
  problem_solving: ["a scheduling conflict", "a misplaced item", "a shared-space problem", "a travel disruption", "a group-work disagreement", "a practical equipment problem"],
  bookings: ["a city hotel confirmation", "a countryside hotel confirmation", "an overnight airport hotel confirmation", "a domestic flight confirmation", "a connecting flight confirmation", "a return flight confirmation"],
  environment: ["water use", "urban shade", "repair and reuse", "local biodiversity", "waste collection", "energy use in shared spaces"],
  celebrations: ["two family celebrations", "two seasonal celebrations", "two community festivals", "two school celebrations", "two music celebrations", "two gatherings honoring an achievement"],
  civic: ["library access", "public transport", "accessible public spaces", "community gardens", "street lighting", "local recreation facilities"],
  opinions: ["shared spaces", "digital habits", "learning opportunities", "transport choices", "workplace practices", "arts in public life"],
  complaints: ["a delayed delivery", "a noisy accommodation", "an incomplete repair", "a billing mistake", "a cancelled service", "a damaged purchase"],
  predictions: ["an outdoor event", "a delivery arrival", "a transport delay", "completion of a group project", "attendance at an activity", "results of a practical experiment"],
  professional: ["a team handover", "a workplace process change", "a facility update", "a project status report", "a service improvement", "an equipment replacement proposal"],
  reporting: ["a community announcement", "an event organizer's update", "a project leader's explanation", "a visitor's written account", "a course announcement", "a service provider's notice"],
  science: ["materials and durability", "energy storage", "ecology and habitats", "robotics", "water systems", "observation and measurement tools"],
  culture: ["public art", "architecture", "craft objects", "music traditions", "photography", "a cultural text"],
  philosophy: ["fairness", "personal identity", "freedom and responsibility", "memory", "knowledge and uncertainty", "the value of cooperation"],
  academic: ["language and communication", "learning and memory", "urban space", "ecology", "social cooperation", "design and accessibility"],
  leadership: ["a volunteer project", "a team deadline", "a service handover", "a training initiative", "a shared-space improvement", "a remote collaboration"],
  literature: ["a forgotten letter", "a changing landscape", "an unfinished journey", "an ordinary object with personal meaning", "returning to a familiar place", "a quiet turning point"],
  regional_language: ["a personal travel account", "an informal event invitation", "a local product review", "a community announcement", "a hobby blog entry", "a single-author personal update"],
  specialized: ["a contract provision", "an administrative rule", "a scientific methods excerpt", "a technical process description", "a scientific discussion excerpt", "a legal reasoning excerpt"],
  foundations: ["arriving for an activity", "finding an everyday object", "describing a simple need", "identifying a familiar person", "describing a location", "preparing for a daily task"],
};

const doc = (name, requirements) => ({ name, requirements });
const documents = {
  menu: doc("Cafe menu", "Preserve a readable menu with food and drink items. Vary the cafe, menu section, and items."),
  contact: doc("Fictional contact card", "Include a clearly identifiable fictional phone number and age; do not use real contact information."),
  invitation: doc("Invitation", "Include an event and its date, clearly stated in an invitation from one author."),
  appointments: doc("Two schedules", "Include both schedules and enough information to identify a mutually available appointment time."),
  family: doc("Family tree description", "Explain multiple family relationships clearly enough to determine who is related to whom."),
  bill: doc("Itemized restaurant bill", "Include items, prices, total, payment, and change with consistent arithmetic. Preserve the restaurant-bill comprehension task."),
  receipt: doc("Prices and receipt", "Include purchased items, amounts, and consistent prices and totals."),
  market: doc("Market list", "Include several quantities and prices that can be followed in a market shopping list."),
  timetable: doc("Transport schedule", "Include destinations, times, and service details in a readable schedule."),
  route: doc("Route description", "Include connected directions and landmarks leading to an identifiable destination."),
  fitness: doc("Fitness plan", "State the activity, frequency, and goal of a fictional everyday fitness plan."),
  jobs: doc("Two job profiles", "Describe two jobs and a person's interests with enough evidence to choose a match."),
  progress: doc("Learner progress note", "Include strengths, challenges, and the next learning goal."),
  booking: doc("Hotel or flight confirmation", "Include a fictional booking's dates, times, and practical details."),
  article: doc("Informational article", "Use connected informative prose with the claims or evidence needed for the reading objective."),
  complaints: doc("Two single-author complaints", "Present two written complaints with contrasting tones. No reply thread, dialogue, or speaker turns."),
  proposal: doc("Proposal or report", "Include the central proposal or findings and supporting practical details."),
  wellness: doc("Wellness plan", "Explain how sleep, nutrition, movement, and stress interact in a fictional plan."),
  reflection: doc("Reflective prose", "Use a single author's connected reflection with the required language distinctions."),
  abstract: doc("Academic abstract", "Provide a clear argument and its basis. Do not invent citations or attribute fabricated findings to real researchers."),
  opposing: doc("Two opposing written views", "Present two positions and their reasoning as written prose, without a debate script or speaker turns."),
  literary: doc("Original literary prose excerpt", "Use continuous narrative or descriptive prose with a discernible theme and deliberate stylistic choices. No dialogue or character script."),
  regional: doc("Regional written texts", "Preserve the target-language regional contrasts specified by the adapted curriculum; vary the subject matter, not the required varieties."),
  specialized: doc("Specialized legal or scientific excerpt", "Preserve the specialized register and interpretable technical detail. Use a fictional example or established facts, not invented legal rules or citations."),
  informal: doc("Informal single-author text", "Use slang, ellipsis, or idioms needed for the lesson in one author's post or personal account. No dialogue, chat exchange, or script."),
};

// Columns: lesson number, subject pool, required document (optional), corrected
// reading objective (only where the legacy instruction confuses skill/setting).
const byLevel = {
  "pre-a1": [
    ["1-3", "people"], ["2-2", "numbers"],
    ["3-2", "farewells", "", "Identify different farewell expressions and when they fit in a single-author reading."],
    ["3-3", "greetings", "", "Identify greetings appropriate to different times of day in a single-author reading."],
    ["4-3", "reactions", "", "Recognize the meanings of short reactions and exclamations from their context in connected prose."],
    ["5-3", "courtesy", "", "Recognize polite expressions and what the writer uses them to request, acknowledge, or repair in everyday situations."],
    ["6-2", "belongings", "", "Identify personal items and who has or uses them in a short everyday reading."],
    ["6-3", "menus", "menu"],
    ["7-2", "colors", "", "Identify additional colors and the objects they describe in a short reading."],
    ["8-3", "greetings", "", "Recognize first-meeting expressions and polite introductions in a single-author reading."],
  ],
  a1: [
    ["1-3", "greetings"], ["3-3", "contacts", "contact"], ["4-3", "numbers"],
    ["5-3", "calendars"], ["6-3", "invitations", "invitation"], ["7-3", "appointments", "appointments"],
    ["8-3", "family", "family"], ["9-3", "colors"], ["10-3", "food"], ["11-3", "restaurant_bills", "bill"],
    ["12-3", "classroom"], ["13-3", "home"], ["14-3", "clothing"], ["15-3", "routines"],
    ["16-3", "weather"], ["17-3", "preferences"], ["18-3", "information"],
  ],
  a2: [
    ["1-3", "people"], ["2-3", "destinations"], ["3-3", "shopping", "receipt"], ["4-3", "markets", "market"],
    ["5-3", "transport", "timetable"], ["6-3", "routes", "route"], ["7-3", "plans"], ["8-3", "hobbies"],
    ["9-3", "fitness", "fitness"], ["10-3", "past_events"], ["11-3", "past_events"], ["12-3", "past_events"],
    ["13-3", "future"], ["14-3", "wellbeing"], ["15-3", "health"], ["16-3", "jobs", "jobs"],
    ["17-3", "learning", "progress"], ["18-3", "technology"],
  ],
  b1: [
    ["1-3", "past_events"], ["2-3", "past_events"], ["3-3", "future"], ["4-3", "comparisons"],
    ["5-3", "problem_solving"], ["6-3", "plans"], ["7-3", "future"], ["8-3", "bookings", "booking"],
    ["9-3", "environment", "article"], ["10-3", "celebrations"], ["11-3", "civic", "article"], ["12-3", "opinions"],
    ["13-3", "complaints", "complaints"], ["14-3", "past_events"], ["15-3", "predictions"],
  ],
  b2: [
    ["1-3", "past_events"], ["2-3", "professional"], ["3-3", "reporting"], ["4-3", "culture"],
    ["5-3", "professional"], ["6-3", "professional", "proposal"], ["7-3", "science"],
    ["8-3", "civic"], ["9-3", "culture"], ["10-3", "civic", "proposal"], ["11-3", "wellbeing", "wellness"], ["12-3", "philosophy"],
  ],
  c1: [
    ["1-3", "opinions"], ["2-3", "past_events", "reflection"], ["3-3", "problem_solving"],
    ["4-3", "culture"], ["5-3", "academic", "abstract"], ["6-3", "leadership", "proposal"],
    ["7-3", "opinions", "opposing"], ["8-3", "culture", "article"], ["9-3", "literature", "literary"], ["10-3", "academic"],
  ],
  c2: [
    ["1-3", "culture"], ["2-3", "regional_language", "regional"], ["3-3", "literature", "literary"],
    ["4-3", "opinions"], ["5-3", "specialized", "specialized"], ["6-3", "opinions"], ["7-3", "culture"],
    ["8-3", "regional_language", "informal", "Understand informal written language, including slang, idioms, and ellipsis, in a single-author passage."],
  ],
};

export const READING_CURRICULUM = Object.fromEntries(Object.entries(byLevel).flatMap(([level, lessons]) =>
  lessons.map(([number, pool, document, objective]) => [`lesson-${level}-${number}`, { pool, document, objective }])));

const subjectsFor = (pool) => (pools[pool] || []).map((name, index) => ({
  id: `${pool}-${index + 1}`, name,
  guidance: "Develop this subject using the lesson's required meanings and forms. Invent fresh concrete details within it; this is a scope, not a story template.",
}));

export function withReadingCurriculum(lesson, { unit } = {}) {
  const reading = lesson?.content?.reading;
  if (!reading || reading.topic === "tutorial") return lesson;
  const definition = READING_CURRICULUM[lesson.id];
  const isReview = lesson.id?.includes("integrated-practice");
  const sources = isReview ? (unit?.lessons || []).map((source) => READING_CURRICULUM[source.id]).filter(Boolean) : [];
  const poolIds = [...new Set(definition ? [definition.pool] : sources.length ? sources.map((source) => source.pool) : ["foundations"])];
  const subjectOptions = reading.readingSubjects?.length ? reading.readingSubjects : poolIds.flatMap(subjectsFor);
  const requiredDocument = documents[definition?.document || (sources.length === 1 ? sources[0].document : "") ] || null;
  const scope = {
    version: 1,
    source: definition ? "authored" : isReview && (sources.length || unit?.id === "unit-pre-a1-foundations") ? "unit-review" : "fallback",
    poolIds,
    objective: definition?.objective || "",
    requiredDocument,
  };
  // Normalize narrow reading instructions before unit reviews copy them into
  // their objective snapshots. Other practice modes retain their own briefs.
  const agenda = scope.objective && lesson.agenda ? {
    ...lesson.agenda,
    items: lesson.agenda.items.map((item) => item.modes?.length === 1 && item.modes[0] === "reading" ? {
      ...item, goal: scope.objective, targetConcept: scope.objective,
      activityBrief: scope.objective, preserveCanonicalGoal: true,
    } : item),
  } : lesson.agenda;
  return {
    ...lesson, ...(agenda ? { agenda } : {}),
    content: { ...lesson.content, reading: {
      ...reading,
      ...(scope.objective ? { prompt: scope.objective, topic: `${definition.pool} in everyday life` } : {}),
      readingScope: scope, readingSubjects: subjectOptions,
    } },
  };
}

export function getReadingScopeIssues(units) {
  return units.flatMap((unit) => (unit.lessons || []).flatMap((lesson) => {
    const reading = lesson.content?.reading;
    if (!reading || reading.topic === "tutorial") return [];
    const issues = [];
    if (!reading.readingScope || reading.readingScope.source === "fallback") issues.push("missing_authored_scope");
    if ((reading.readingSubjects?.length || 0) < 4) issues.push("insufficient_subject_variety");
    if (new Set(reading.readingSubjects?.map((subject) => subject.id)).size !== reading.readingSubjects?.length) issues.push("duplicate_subject_ids");
    return issues.map((type) => ({ lessonId: lesson.id, type }));
  }));
}

const storyOverrides = {
  "lesson-pre-a1-1-2": ["extended_family", "Identify extended family members, such as grandparents, aunts, uncles, and cousins, in a short everyday situation. Vary which relatives are central; use a meaningful subset rather than every relative in every story."],
  "lesson-pre-a1-2-2": ["numbers", "Identify quantities from six to ten in an everyday interaction."],
  "lesson-pre-a1-2-3": ["numbers", "Describe how many objects someone has or shares using numbers zero to ten."],
  "lesson-pre-a1-3-3": ["greetings", "Choose and produce an appropriate greeting on arriving and meeting people."],
  "lesson-pre-a1-4-2": ["preferences", "Respond to an undecided everyday choice with an uncertainty expression."],
  "lesson-pre-a1-4-3": ["reactions"],
  "lesson-pre-a1-5-2": ["courtesy", "Choose an appropriate apology or excuse-me expression for an everyday situation."],
  "lesson-pre-a1-6-2": ["belongings"],
  "lesson-pre-a1-7-3": ["colors", "Describe objects using light, dark, and neutral color words."],
  "lesson-pre-a1-8-2": ["greetings", "Ask for and remember the names of two people you meet."],
  "lesson-pre-a1-8-3": ["greetings"],
  "lesson-a2-2-2": ["places"],
  "lesson-a2-14-2": ["health"],
  "lesson-a2-17-2": ["school"],
  "lesson-b1-8-2": ["travel"],
};

export function withStoryCurriculum(lesson, { unit } = {}) {
  const stories = lesson?.content?.stories;
  if (!stories || stories.topic === "tutorial") return lesson;
  const override = storyOverrides[lesson.id];
  const sources = (unit?.lessons || []).map((source) => READING_CURRICULUM[source.id]).filter(Boolean);
  const reviewPools = lesson.id?.includes("integrated-practice")
    ? (unit?.lessons || []).flatMap((source) => storyOverrides[source.id] ? [storyOverrides[source.id][0]] : []) : [];
  const poolIds = [...new Set(override ? [override[0]] : sources.length ? [...sources.map((source) => source.pool), ...reviewPools] : ["foundations"])];
  const objective = override?.[1] || "";
  const agenda = objective && lesson.agenda ? {
    ...lesson.agenda,
    items: lesson.agenda.items.map((item) => item.modes?.length === 1 && item.modes[0] === "stories" ? {
      ...item, goal: objective, targetConcept: objective, activityBrief: objective, preserveCanonicalGoal: true,
    } : item),
  } : lesson.agenda;
  return { ...lesson, ...(agenda ? { agenda } : {}), content: { ...lesson.content, stories: {
    ...stories,
    ...(objective ? { prompt: objective, scenario: objective } : {}),
    storySubjects: poolIds.flatMap(subjectsFor),
    storyScope: { version: 1, poolIds, objective,
      source: override ? "authored" : sources.length || unit?.id === "unit-pre-a1-foundations" ? "unit" : "fallback" },
  } } };
}

export function withActivityCurriculum(lesson, context) {
  return withStoryCurriculum(withReadingCurriculum(lesson, context), context);
}
