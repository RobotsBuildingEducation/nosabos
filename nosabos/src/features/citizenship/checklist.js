const item = (id, text, stage = "documents") => ({ id, text, stage });

export const CHECKLIST_LIBRARY = Object.freeze({
  existingDocumentCopies: item(
    "existing-document-copies",
    "Get certified copies of the Mexican acta or document if needed.",
  ),
  identityConsistency: item(
    "identity-consistency",
    "Confirm CURP and name consistency across IDs.",
  ),
  mexicanIds: item(
    "mexican-ids",
    "Schedule passport, matricula, INE, or record-correction steps as applicable.",
    "after",
  ),
  mexicoBirthActa: item(
    "mexico-birth-acta",
    "Locate or obtain a certified Mexican birth acta.",
  ),
  civilRegistryReview: item(
    "civil-registry-review",
    "Ask the relevant civil registry or consulate about late, missing, or inconsistent registration evidence.",
    "resolve",
  ),
  historicRecords: item(
    "historic-records",
    "Collect older supporting records such as school, medical, baptismal, parent, or sibling records.",
  ),
  declaratoriaEvidence: item(
    "declaratoria-evidence",
    "Gather proof of the voluntary foreign nationality acquisition or use and ask SRE which declaratoria evidence applies.",
    "resolve",
  ),
  vesselRecord: item(
    "vessel-aircraft-record",
    "Collect the vessel or aircraft birth record and identity records needed to issue or recognize the Mexican acta.",
  ),
  foreignBirthAppointment: item(
    "foreign-birth-appointment",
    "Use MiConsulado and choose civil registry or birth registration, not passport.",
    "appointment",
  ),
  applicantLongFormBirth: item(
    "applicant-long-form-birth",
    "Bring the applicant's long-form certified birth certificate.",
  ),
  mexicanParentProof: item(
    "mexican-parent-proof",
    "Bring the Mexican parent's strongest nationality document and matching identity records.",
  ),
  parentChain: item(
    "parent-chain",
    "Document the potentially Mexican parent and confirm when that parent became Mexican.",
    "resolve",
  ),
  naturalizationResidence: item(
    "naturalization-residence",
    "Keep qualifying residence active until the route minimum is met.",
    "resolve",
  ),
  naturalizationPacket: item(
    "naturalization-packet",
    "Prepare DNN-3, resident card, full passport copies, entries/exits letter, CURP, photos, payment, and criminal-record certificates.",
    "filing",
  ),
  modalityProof: item(
    "naturalization-modality-proof",
    "Gather modality proof such as marriage acta, child's Mexican acta, descent records, origin-country birth certificate, COMAR letter, or custody/adoption records.",
    "filing",
  ),
  marriageProof: item(
    "marriage-proof",
    "Prepare the marriage record and proof of two years living together at the qualifying marital domicile.",
    "filing",
  ),
  descendantProof: item(
    "descendant-proof",
    "Prepare the direct line of birth records linking the applicant to the Mexican by birth.",
    "filing",
  ),
  adoptionProof: item(
    "adoption-parental-authority-proof",
    "Prepare adoption, custody, parental-authority, age, and uninterrupted-residence records.",
    "filing",
  ),
  distinguishedServicesProof: item(
    "distinguished-services-proof",
    "Prepare evidence of cultural, social, scientific, technical, artistic, sports, or business services benefiting Mexico.",
    "filing",
  ),
  criminalReview: item(
    "criminal-review",
    "Obtain case dispositions and qualified advice about the criminal-proceeding issue before filing.",
    "resolve",
  ),
  residenceAbsenceReview: item(
    "residence-absence-review",
    "Calculate qualifying residence again after applying the statutory absence rule.",
    "resolve",
  ),
  cardAndAddress: item(
    "card-address-readiness",
    "Confirm resident card is valid at least six months beyond the filing date and shows CURP.",
    "filing",
  ),
  examsSpanish: item(
    "spanish-exam",
    "Prepare to demonstrate Spanish even when a history and culture exception applies.",
    "filing",
  ),
  examsHistory: item(
    "history-culture-exam",
    "Prepare for the Mexican history and culture examination unless a current exception applies.",
    "filing",
  ),
  passportValidity: item(
    "foreign-passport-validity",
    "Confirm the foreign passport meets the current SRE validity requirement.",
    "filing",
  ),
  translation: item(
    "apostille-translation",
    "Confirm apostille, legalization, and authorized-translation requirements for foreign records.",
  ),
  refugeeDocumentation: item(
    "refugee-documentation",
    "Prepare the COMAR recognition record and confirm refugee-specific foreign birth-document requirements.",
    "filing",
  ),
});

export const ALL_CHECKLIST_ITEMS = Object.freeze(
  Object.values(CHECKLIST_LIBRARY),
);

const CHECKLIST_ID_BY_TEXT = new Map(
  ALL_CHECKLIST_ITEMS.map((entry) => [entry.text, entry.id]),
);

export const getChecklistStableId = (entry) => {
  if (entry && typeof entry === "object" && entry.id) return entry.id;
  return CHECKLIST_ID_BY_TEXT.get(String(entry || "")) || "";
};

export const getLegacyChecklistItemId = (entry) => {
  const text = String(
    entry && typeof entry === "object" ? entry.text || "" : entry || "",
  );
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return `item_${text.length}_${hash.toString(36)}`;
};

export const uniqueChecklistItems = (...groups) => {
  const byId = new Map();
  groups.flat().filter(Boolean).forEach((entry) => byId.set(entry.id, entry));
  return [...byId.values()];
};
