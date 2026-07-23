export const DEFAULT_CITIZENSHIP_ANSWERS = Object.freeze({
  existingDocs: [],
  birthplace: "",
  registeredMexico: "",
  foreignNationalityBefore1998: "",
  actaIssue: "",
  parentMexicanAtBirth: "",
  parentProof: "",
  parentOrigin: "",
  parentNationalityTiming: "",
  residentStatus: "",
  residenceYears: "",
  naturalizationBases: [],
  marriageDuration: "",
  marriageCohabitation: "",
  adoptionStatus: "",
  descendantDegree: "",
  secondDegreeException: "",
  absences: "",
  oneYearAbsence: "",
  criminalHistory: "",

  currentCitizenship: "",
  applicantType: "",
  ageGroup: "",
  handlingLocation: "",
  parentNamesMatch: "",
  birthCertificateType: "",
  parentsMarriedTiming: "",
  parentAvailability: "",
  foreignBirthRecord: "",
  cardReady: "",
  addressMatch: "",
  refugee: "",
  spanishExamReady: "",
  historyCultureExamReady: "",
  passportReady: "",

  // Version-2 fields retained only for safe migration.
  applicantAdult: "",
  marriedMexican: "",
  mexicanChild: "",
  descendant: "",
  latinIberian: "",
  adoptedParentalAuthority: "",
  distinguishedService: "",
  examReady: "",
});

export const QUESTION_ROLES = Object.freeze({
  ROUTE: "route",
  ELIGIBILITY: "eligibility",
  REVIEW: "review",
  READINESS: "readiness",
  PERSONALIZATION: "personalization",
});

export const CITIZENSHIP_QUESTIONS = [
  {
    id: "existingDocs",
    section: "Documents",
    iconKey: "document",
    type: "multi",
    role: QUESTION_ROLES.ROUTE,
    label: "Do you already have any Mexican nationality document?",
    helper:
      "A decisive nationality document can take you directly to a document or ID workflow.",
    options: [
      { value: "birth_acta", label: "Mexican birth certificate" },
      { value: "passport", label: "Mexican passport" },
      { value: "declaratoria", label: "Declaratoria / certificate" },
      { value: "naturalization_letter", label: "Carta de Naturalizacion" },
      { value: "matricula", label: "Matricula" },
      { value: "curp", label: "CURP" },
      { value: "ine", label: "INE" },
      { value: "none", label: "None" },
    ],
  },
  {
    id: "birthplace",
    section: "Identity",
    iconKey: "location",
    type: "single",
    role: QUESTION_ROLES.ROUTE,
    label: "Where were you born?",
    helper: "Birthplace is the first legal divider.",
    options: [
      { value: "mexico", label: "Mexico" },
      { value: "us", label: "U.S." },
      { value: "other_country", label: "Other country" },
      { value: "mexican_ship_aircraft", label: "Mexican ship or aircraft" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "registeredMexico",
    section: "Born in Mexico",
    iconKey: "home",
    type: "single",
    role: QUESTION_ROLES.ROUTE,
    label: "Were you registered with a Mexican civil registry?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "foreignNationalityBefore1998",
    section: "Born in Mexico",
    iconKey: "shield",
    type: "single",
    role: QUESTION_ROLES.ROUTE,
    label:
      "Before March 20, 1998, did you voluntarily acquire or use another nationality?",
    helper:
      "Do not choose yes for a nationality acquired automatically at birth.",
    options: [
      { value: "yes", label: "Yes, voluntarily acquired or used" },
      { value: "automatic_at_birth", label: "Automatic at birth" },
      { value: "after", label: "Only after March 20, 1998" },
      { value: "no", label: "No" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "actaIssue",
    section: "Born in Mexico",
    iconKey: "document",
    type: "single",
    role: QUESTION_ROLES.REVIEW,
    label:
      "Is your Mexican birth certificate late-registered or inconsistent with your ID?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "parentMexicanAtBirth",
    section: "Mexican parent",
    iconKey: "family",
    type: "single",
    role: QUESTION_ROLES.ROUTE,
    label: "Was at least one legal parent Mexican when you were born?",
    options: [
      { value: "mother", label: "Mother" },
      { value: "father", label: "Father" },
      { value: "both", label: "Both" },
      {
        value: "parent_after_birth",
        label: "Parent became Mexican after my birth",
      },
      { value: "not_sure", label: "Not sure" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "parentProof",
    section: "Mexican parent",
    iconKey: "document",
    type: "single",
    role: QUESTION_ROLES.ROUTE,
    label: "What proof does the potentially Mexican parent have?",
    options: [
      { value: "parent_birth_acta", label: "Mexican birth acta" },
      { value: "parent_passport", label: "Mexican passport" },
      {
        value: "parent_naturalization_letter",
        label: "Carta de Naturalizacion",
      },
      { value: "parent_declaratoria", label: "Declaratoria / certificate" },
      { value: "parent_matricula", label: "Matricula" },
      { value: "parent_ine", label: "INE" },
      { value: "none", label: "None" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "parentNationalityTiming",
    section: "Mexican parent",
    iconKey: "family",
    type: "single",
    role: QUESTION_ROLES.ROUTE,
    label: "Was that parent already Mexican on the day you were born?",
    options: [
      { value: "before_birth", label: "Yes" },
      { value: "after_birth", label: "No, the parent became Mexican later" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "residentStatus",
    section: "Naturalization",
    iconKey: "legal",
    type: "single",
    role: QUESTION_ROLES.ELIGIBILITY,
    label: "What is your current immigration status in Mexico?",
    options: [
      { value: "permanent", label: "Permanent resident" },
      { value: "temporary", label: "Temporary resident" },
      { value: "student", label: "Temporary student" },
      { value: "tourist", label: "Tourist/FMM" },
      { value: "no", label: "No current status in Mexico" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "residenceYears",
    section: "Naturalization",
    iconKey: "legal",
    type: "single",
    role: QUESTION_ROLES.ELIGIBILITY,
    label: "How long have you had qualifying residence in Mexico?",
    options: [
      { value: "5_plus", label: "5+ years" },
      { value: "2_5", label: "2-5 years" },
      { value: "1_2", label: "1-2 years" },
      { value: "under_1", label: "Less than 1 year" },
      { value: "none", label: "None / no qualifying residence" },
    ],
  },
  {
    id: "naturalizationBases",
    section: "Naturalization",
    iconKey: "legal",
    type: "multi",
    role: QUESTION_ROLES.ROUTE,
    label: "Which of these may apply to you?",
    helper: "Select every possible naturalization basis.",
    options: [
      { value: "marriage", label: "Married to a Mexican citizen" },
      { value: "mexican_child", label: "Parent of a Mexican child by birth" },
      {
        value: "direct_descendant",
        label: "Direct descendant of a Mexican by birth",
      },
      {
        value: "latin_iberian",
        label: "From Latin America or the Iberian Peninsula",
      },
      {
        value: "adoption_parental_authority",
        label:
          "Adopted by or formerly under parental authority of Mexican citizens",
      },
      {
        value: "distinguished_services",
        label: "Distinguished services benefiting Mexico",
      },
      { value: "none", label: "None of these" },
    ],
  },
  {
    id: "marriageDuration",
    section: "Naturalization",
    iconKey: "family",
    type: "single",
    role: QUESTION_ROLES.ELIGIBILITY,
    label: "Have you been married for at least two years?",
    options: [
      { value: "2_plus", label: "Yes" },
      { value: "under_2", label: "No" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "marriageCohabitation",
    section: "Naturalization",
    iconKey: "home",
    type: "single",
    role: QUESTION_ROLES.ELIGIBILITY,
    label:
      "For the last two years, have you lived together at your marital home in Mexico?",
    options: [
      { value: "two_years_mexico", label: "Yes" },
      {
        value: "government_assignment_abroad",
        label: "Mexican spouse assigned abroad by the Mexican government",
      },
      { value: "under_two_years", label: "Together in Mexico under two years" },
      { value: "not_living_together", label: "Not living together" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "adoptionStatus",
    section: "Naturalization",
    iconKey: "family",
    type: "single",
    role: QUESTION_ROLES.ELIGIBILITY,
    label: "Which adoption or parental-authority situation applies?",
    options: [
      {
        value: "minor_current",
        label: "Currently a minor in the qualifying relationship",
      },
      {
        value: "adult_within_one_year",
        label: "Reached majority less than one year ago",
      },
      {
        value: "adult_over_one_year",
        label: "Reached majority more than one year ago",
      },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "descendantDegree",
    section: "Naturalization",
    iconKey: "family",
    type: "single",
    role: QUESTION_ROLES.ROUTE,
    label: "How are you directly descended from a Mexican by birth?",
    options: [
      { value: "first", label: "Parent" },
      { value: "second", label: "Grandparent" },
      { value: "further", label: "More distant direct ancestor" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "secondDegreeException",
    section: "Naturalization",
    iconKey: "shield",
    type: "single",
    role: QUESTION_ROLES.REVIEW,
    label: "Does the narrow second-degree residence exception apply?",
    helper:
      "This exception is limited to a second-degree direct descendant with no other nationality or unrecognized birth-acquired rights.",
    options: [
      { value: "no_other_nationality", label: "I have no other nationality" },
      {
        value: "birth_rights_not_recognized",
        label: "My birth-acquired rights are not recognized",
      },
      { value: "has_other_nationality", label: "Neither applies" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "absences",
    section: "Naturalization",
    iconKey: "legal",
    type: "single",
    role: QUESTION_ROLES.ELIGIBILITY,
    label:
      "During the last two years of qualifying residence, how much time were you outside Mexico?",
    options: [
      { value: "none", label: "None" },
      { value: "under_6_months", label: "Under 6 months total" },
      { value: "over_6_months", label: "Over 6 months total" },
      { value: "not_applicable", label: "No qualifying residence yet" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "oneYearAbsence",
    section: "Naturalization",
    iconKey: "legal",
    type: "single",
    role: QUESTION_ROLES.ELIGIBILITY,
    label: "Was your immediately preceding year of residence uninterrupted?",
    options: [
      { value: "none", label: "Yes, no absence interrupted it" },
      { value: "any", label: "No, there was an absence" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "criminalHistory",
    section: "Naturalization",
    iconKey: "warning",
    type: "single",
    role: QUESTION_ROLES.REVIEW,
    label: "Which criminal-proceeding statement applies to you?",
    options: [
      { value: "no", label: "No known criminal issue" },
      { value: "pending", label: "Pending criminal proceeding" },
      {
        value: "current_intentional_sentence",
        label: "Currently serving a custodial sentence for an intentional offense",
      },
      { value: "past_conviction", label: "Completed or past conviction" },
      { value: "unknown", label: "Unknown" },
    ],
  },

  // Optional refinement questions.
  {
    id: "currentCitizenship",
    section: "Identity",
    iconKey: "person",
    type: "single",
    role: QUESTION_ROLES.PERSONALIZATION,
    label: "What is your current country of citizenship?",
    helper:
      "This keeps nationality-specific warnings accurate. It does not decide your route.",
    options: [
      { value: "us", label: "U.S." },
      { value: "mexico", label: "Mexico" },
      { value: "both", label: "Both" },
      { value: "other", label: "Other" },
      { value: "multiple", label: "Multiple" },
    ],
  },
  {
    id: "applicantType",
    section: "Applicant",
    iconKey: "person",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label: "Are you applying for yourself or for a minor?",
    options: [
      { value: "self_adult", label: "Self" },
      { value: "minor_guardian", label: "Parent/guardian for child" },
      { value: "authorized", label: "Attorney/authorized person" },
    ],
  },
  {
    id: "ageGroup",
    section: "Applicant",
    iconKey: "person",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label: "What is the applicant's age group?",
    options: [
      { value: "minor", label: "Under 18" },
      { value: "adult", label: "18 to 60" },
      { value: "over_60", label: "Over 60" },
    ],
  },
  {
    id: "handlingLocation",
    section: "Location",
    iconKey: "location",
    type: "text",
    role: QUESTION_ROLES.PERSONALIZATION,
    label: "Which consulate or Mexican state will handle the case?",
    helper:
      "You can use a ZIP, preferred consulate, or Mexican state. Skip it if you do not know yet.",
    placeholder: "ZIP, preferred consulate, or Mexican state",
    optional: true,
  },
  {
    id: "parentOrigin",
    section: "Mexican parent",
    iconKey: "family",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label:
      "Was the Mexican parent born in Mexico, born abroad, or naturalized Mexican?",
    options: [
      { value: "born_mexico", label: "Born in Mexico" },
      { value: "born_abroad", label: "Born abroad" },
      { value: "naturalized", label: "Naturalized Mexican" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "parentNamesMatch",
    section: "Documents",
    iconKey: "document",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label:
      "Do parent names on your foreign birth certificate match the Mexican parent records?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "minor_difference", label: "Accents, spelling, or order differ" },
      { value: "married_surname", label: "Married surname issue" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "birthCertificateType",
    section: "Documents",
    iconKey: "document",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label: "Do you have a long-form certified birth certificate?",
    options: [
      { value: "long_form", label: "Yes, long-form certified" },
      { value: "short_abstract", label: "Short abstract only" },
      { value: "hospital_only", label: "Hospital certificate only" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "parentsMarriedTiming",
    section: "Family record",
    iconKey: "family",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label: "Were your parents married before your birth?",
    options: [
      { value: "six_months_before", label: "Yes, at least 6 months before birth" },
      { value: "late_or_after_birth", label: "Yes, but later" },
      { value: "no", label: "No" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "parentAvailability",
    section: "Family record",
    iconKey: "family",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label:
      "Is either parent deceased, absent, unavailable, or unwilling to participate?",
    options: [
      { value: "no", label: "No" },
      { value: "yes_father", label: "Yes, father" },
      { value: "yes_mother", label: "Yes, mother" },
      { value: "both", label: "Both" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "foreignBirthRecord",
    section: "Documents",
    iconKey: "document",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label:
      "Was your birth certificate issued outside the U.S. or in a language other than English/Spanish?",
    options: [
      { value: "us", label: "U.S." },
      { value: "non_us", label: "Non-U.S." },
      { value: "non_english", label: "Non-English" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "cardReady",
    section: "Naturalization",
    iconKey: "document",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label:
      "Is your resident card valid at least six months beyond filing and does it show CURP?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_applicable", label: "Not applicable" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "addressMatch",
    section: "Naturalization",
    iconKey: "location",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label:
      "Is your INM-registered address the same as your application address?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_applicable", label: "Not applicable" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "refugee",
    section: "Naturalization",
    iconKey: "shield",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label: "Are you recognized as a refugee by COMAR?",
    helper:
      "Refugee status affects documents and the history/culture exam, not the residence modality.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "spanishExamReady",
    section: "Naturalization",
    iconKey: "checklist",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label: "Do you feel ready to demonstrate Spanish?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "maybe", label: "Maybe" },
    ],
  },
  {
    id: "historyCultureExamReady",
    section: "Naturalization",
    iconKey: "checklist",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label: "Do you feel ready for the Mexican history and culture exam?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "maybe", label: "Maybe" },
    ],
  },
  {
    id: "passportReady",
    section: "Naturalization",
    iconKey: "document",
    type: "single",
    role: QUESTION_ROLES.READINESS,
    label:
      "Do you have a valid foreign passport with at least 45 business days of validity?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "recently_renewed", label: "Recently renewed" },
    ],
  },
];

export const QUESTION_BY_ID = new Map(
  CITIZENSHIP_QUESTIONS.map((question) => [question.id, question]),
);

export const getQuestionById = (questionId) =>
  QUESTION_BY_ID.get(questionId) || null;

export const hasQuestionAnswer = (questionOrId, answers) => {
  const id =
    typeof questionOrId === "string" ? questionOrId : questionOrId?.id || "";
  const value = answers?.[id];
  if (Array.isArray(value)) return value.length > 0;
  return String(value || "").trim().length > 0;
};

export const normalizeAnswerValue = (questionId, value) => {
  if (questionId !== "naturalizationBases" && questionId !== "existingDocs") {
    return value;
  }
  const values = Array.isArray(value) ? [...new Set(value)] : [];
  if (values.length <= 1) return values;
  const exclusive = questionId === "existingDocs" ? "none" : "none";
  return values[values.length - 1] === exclusive
    ? [exclusive]
    : values.filter((item) => item !== exclusive);
};

