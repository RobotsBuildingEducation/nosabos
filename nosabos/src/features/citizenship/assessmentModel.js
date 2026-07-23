export const LEGAL_BASES = Object.freeze({
  MEXICAN_BY_BIRTH: "mexican_by_birth",
  MEXICAN_BY_NATURALIZATION: "mexican_by_naturalization",
  FOREIGN: "foreign",
  UNKNOWN: "unknown",
});

export const WORKFLOWS = Object.freeze({
  EXISTING_DOCUMENT: "existing_document",
  MEXICO_BIRTH_RECORD: "mexico_birth_record",
  FOREIGN_BIRTH_REGISTRATION: "foreign_birth_registration",
  PARENT_CHAIN: "parent_chain",
  DECLARATORIA: "declaratoria",
  NATURALIZATION: "naturalization",
});

export const ASSESSMENT_STATUSES = Object.freeze({
  NEED_MORE_INFORMATION: "need_more_information",
  ALREADY_MEXICAN: "already_mexican",
  ELIGIBLE_NOW: "eligible_now",
  NOT_ELIGIBLE_YET: "not_eligible_yet",
  NEEDS_REVIEW: "needs_review",
});

export const NATURALIZATION_MODALITIES = Object.freeze({
  GENERAL_5Y: "general_5y",
  MARRIAGE_2Y: "marriage_2y",
  MEXICAN_CHILD_2Y: "mexican_child_2y",
  DIRECT_DESCENDANT_2Y: "direct_descendant_2y",
  LATIN_IBERIAN_2Y: "latin_iberian_2y",
  DISTINGUISHED_SERVICES: "distinguished_services",
  ADOPTION_PARENTAL_AUTHORITY_1Y: "adoption_parental_authority_1y",
});

export const RULE_REVIEW_DATE = "2026-07-23";

export const OFFICIAL_SOURCES = Object.freeze({
  nationalityLaw: {
    id: "mx-nationality-law",
    title: "Mexico Nationality Law",
    href: "https://www.diputados.gob.mx/LeyesBiblio/pdf/53.pdf",
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  constitution: {
    id: "mx-constitution",
    title: "Constitution of Mexico",
    href: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf",
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  sreNaturalization: {
    id: "sre-naturalization",
    title: "SRE nationality and naturalization",
    href: "https://sre.gob.mx/tramites-y-servicios/nacionalidad-y-naturalizacion",
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  sreMarriage: {
    id: "sre-marriage-naturalization",
    title: "SRE marriage naturalization requirements",
    href: "https://portales.sre.gob.mx/tramites-dgaj/naturalizacion/carta-de-naturalizacion-por-haber-contraido-matrimonio-con-varon-o-mujer-mexicanos",
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  sreAdoption: {
    id: "sre-adoption-naturalization",
    title: "SRE adoption and parental-authority requirements",
    href: "https://portales.sre.gob.mx/tramites-dgaj/naturalizacion/carta-de-naturalizacion-por-haber-estado-sujeto-a-patria-potestad-o-haber-sido-adoptado-por-mexicanos",
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  sreExams: {
    id: "sre-naturalization-exams",
    title: "SRE naturalization appointment and exam guidance",
    href: "https://portales.sre.gob.mx/tramites-dgaj/naturalizacion/que-sucedera-el-dia-de-su-cita-para-iniciar-el-tramite-de-naturalizacion",
    lastReviewedAt: RULE_REVIEW_DATE,
  },
});

export const LEGAL_RULES = Object.freeze({
  existingDocument: {
    code: "DOC-01",
    explanation:
      "A listed nationality document can establish that the applicant is already Mexican.",
    sourceIds: ["mx-nationality-law"],
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  mexicanBirth: {
    code: "BIRTH-01",
    explanation:
      "Birth in Mexican territory or aboard a Mexican vessel or aircraft is a Mexican-by-birth basis.",
    sourceIds: ["mx-constitution"],
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  mexicanParentAtBirth: {
    code: "BIRTH-02",
    explanation:
      "A person born abroad may be Mexican by birth when a legal parent was Mexican at the time of birth.",
    sourceIds: ["mx-constitution"],
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  generalResidence: {
    code: "NAT-5Y",
    explanation: "The general naturalization residence period is five years.",
    sourceIds: ["mx-nationality-law"],
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  shortenedResidence: {
    code: "NAT-2Y",
    explanation:
      "Direct descent, a Mexican child by birth, Latin American or Iberian origin, and qualifying distinguished services can use a two-year period.",
    sourceIds: ["mx-nationality-law"],
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  marriage: {
    code: "NAT-MARRIAGE",
    explanation:
      "The marriage route requires two immediately preceding years of residence and living together at the marital domicile in Mexico, subject to the government-assignment exception.",
    sourceIds: ["mx-nationality-law", "sre-marriage-naturalization"],
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  adoption: {
    code: "NAT-ADOPTION",
    explanation:
      "The adoption or parental-authority route uses one uninterrupted year and includes a limited period following majority.",
    sourceIds: ["mx-nationality-law", "sre-adoption-naturalization"],
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  absences: {
    code: "NAT-ABSENCE",
    explanation:
      "More than six months of absence in the two years before filing interrupts ordinary residence; the one-year route must be uninterrupted.",
    sourceIds: ["mx-nationality-law"],
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  criminalProceedings: {
    code: "NAT-CRIMINAL",
    explanation:
      "A pending proceeding may suspend processing, while a current custodial sentence for an intentional offense prevents issuance.",
    sourceIds: ["mx-nationality-law"],
    lastReviewedAt: RULE_REVIEW_DATE,
  },
  exams: {
    code: "NAT-EXAMS",
    explanation:
      "Naturalization requires Spanish; current SRE guidance treats minors, recognized refugees, and applicants over 60 separately for the history and culture examination.",
    sourceIds: ["mx-nationality-law", "sre-naturalization-exams"],
    lastReviewedAt: RULE_REVIEW_DATE,
  },
});

export const createAssessment = (overrides = {}) => ({
  legalBasis: LEGAL_BASES.UNKNOWN,
  workflow: null,
  modality: null,
  status: ASSESSMENT_STATUSES.NEED_MORE_INFORMATION,
  issues: [],
  readiness: [],
  checklist: [],
  reasons: [],
  ruleCodes: [],
  nextQuestionId: null,
  ...overrides,
});

