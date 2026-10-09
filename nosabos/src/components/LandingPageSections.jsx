import { useId, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Bitcoin,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ChartNoAxesCombined,
  Compass,
  Globe2,
  GraduationCap,
  Heart,
  MessageCircle,
  Sprout,
  Users,
  Wallet,
} from "lucide-react";
import LandingLanguageAtlas from "./LandingLanguageAtlas";
import LandingTutorDemo from "./LandingTutorDemo";
import CompanionRewardDance from "./CompanionRewardDance";
import { getCustomizeModalCopy } from "./companionCustomizeCopy";
import { PET_TYPES } from "../utils/petTypes";
import { landingPageRefreshCopy, landingSectionLabel } from "./landingPageRefreshCopy";
import { landingCapabilityCopy } from "./landingCapabilityCopy";
import { LANDING_PROFICIENCY_LEVELS, LANDING_PROFICIENCY_STATS } from "./landingProficiencyStats";
import "./landingPageSections.css";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
function ProficiencyPreview({ words, lang }) {
  const numbers = new Intl.NumberFormat(lang);
  return (
    <div className="lp-proficiency-preview">
      <dl className="lp-proficiency-stats">
        {Object.entries(LANDING_PROFICIENCY_STATS).map(([key, value]) => (
          <div key={key}><dt>{words[key]}</dt><dd dir="ltr">{numbers.format(value)}</dd></div>
        ))}
      </dl>
      <ul className="lp-proficiency-modes">
        {words.modeNames.map(mode => <li key={mode}>{mode}</li>)}
      </ul>
      <div className="lp-proficiency-levels" dir="ltr" aria-hidden="true">
        {LANDING_PROFICIENCY_LEVELS.map(level => <span key={level}>{level}</span>)}
      </div>
      <div className="lp-proficiency-score">
        <span>{words.scoreLabel}</span><strong dir="ltr">0–100</strong>
        <div aria-hidden="true" />
      </div>
    </div>
  );
}
function PracticePreview({ mode, copy, words, lang, visible }) {
  // A sample English lesson for Spanish speakers; Spanish for other UI languages.
  const english = lang === "es";
  return (
    <div className={`lp-preview lp-preview--${mode}`}>
      {mode === "speak" && (
        <LandingTutorDemo key={lang} copy={copy} lang={lang} visible={visible} />
      )}
      {mode === "remember" && (
        <div className="lp-memory-preview">
          <div className="lp-memory-goal">
            <span>{words.memoryGoalLabel}</span>
            <p>{words.memoryGoal}</p>
          </div>
          <div className="lp-correction">
            <span>{words.before}</span>
            <p lang={english ? "en" : "es"} dir="ltr">
              {english ? (
                <>
                  Yesterday I <s>go</s> to the park.
                </>
              ) : (
                <>
                  Ayer <s>voy</s> al parque.
                </>
              )}
            </p>
          </div>
          <div className="lp-correction lp-correction--after">
            <span>
              <Check size={14} />
              {words.after}
            </span>
            <p lang={english ? "en" : "es"} dir="ltr">
              {english ? (
                <>
                  Yesterday I <strong>went</strong> to the park.
                </>
              ) : (
                <>
                  Ayer <strong>fui</strong> al parque.
                </>
              )}
            </p>
          </div>
          <div className="lp-memory-tomorrow">
            <span>{words.memoryTomorrow}</span>
            <dl className="lp-memory-tasks">
              {[
                [1, words.memoryLesson],
                [1, words.memoryTutorSession],
                [5, words.memoryFlashcards],
              ].map(([count, label]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{new Intl.NumberFormat(lang).format(count)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
      {mode === "grow" && (
        <ProficiencyPreview words={words} lang={lang} />
      )}
    </div>
  );
}

function CompanionCarousel({ copy, words, lang }) {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const names = getCustomizeModalCopy(lang);
  const type = PET_TYPES[index];

  function move(direction) {
    setIndex((current) => (current + direction + PET_TYPES.length) % PET_TYPES.length);
  }

  return (
    <div
      className="lp-companion-carousel"
      role="group"
      aria-label={copy.feature_companion}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        move(event.key === "ArrowLeft" ? -1 : 1);
      }}
    >
      <div className="lp-companion-stage">
        <button
          type="button"
          className="lp-companion-prev"
          aria-label={words.previousCompanion}
          onClick={() => move(-1)}
        >
          <ChevronLeft size={19} />
        </button>
        <div key={type} className="lp-companion-character" aria-hidden="true">
          <CompanionRewardDance
            petType={type}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
        <button
          type="button"
          className="lp-companion-next"
          aria-label={words.nextCompanion}
          onClick={() => move(1)}
        >
          <ChevronRight size={19} />
        </button>
      </div>
      <div className="lp-companion-caption" aria-live="polite" aria-atomic="true">
        <span>{names[type]}</span>
      </div>
    </div>
  );
}

function FeatureIllustration({ id, copy, words, lang }) {
  if (id === "companion") return <CompanionCarousel copy={copy} words={words} lang={lang} />;
  if (id === "connected") return (
    <div className="lp-connected-art" aria-hidden="true">
      <span><Users size={27} strokeWidth={1.5} /></span><i />
      <span><Globe2 size={34} strokeWidth={1.5} /></span><i />
      <span><Wallet size={27} strokeWidth={1.5} /></span>
    </div>
  );
  if (id === "immersion") return (
    <div className="lp-immersion-art" aria-hidden="true">
      <svg viewBox="0 0 230 120" fill="none">
        <path d="M25 98C15 37 47 21 77 43S126 114 174 79S216 44 204 22" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" opacity=".5" />
        <circle cx="25" cy="98" r="6" fill="currentColor" opacity=".5" />
        <circle cx="204" cy="22" r="6" fill="currentColor" />
      </svg>
      <Compass size={72} strokeWidth={1.3} />
      <span><Check size={15} /></span>
    </div>
  );
  return null;
}

function MissionIllustration() {
  const id = useId();
  return (
    <div className="lp-mission-art" aria-hidden="true">
      <svg viewBox="0 0 340 300" fill="none">
        <defs>
          <linearGradient id={`${id}-gold`} x1="100" y1="47" x2="221" y2="171" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffe4a3" />
            <stop offset=".5" stopColor="#ffc96c" />
            <stop offset="1" stopColor="#f0a543" />
          </linearGradient>
          <linearGradient id={`${id}-rim`} x1="114" y1="71" x2="222" y2="190" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e9b461" />
            <stop offset="1" stopColor="#b96c2c" />
          </linearGradient>
        </defs>
        <circle cx="170" cy="148" r="120" fill="currentColor" opacity=".06" />
        <ellipse cx="170" cy="266" rx="97" ry="10" fill="currentColor" opacity=".07" />
        <path d="M71 152C37 74 139 8 235 48C302 76 319 148 270 207" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 8" opacity=".3" />

        <g className="lp-bitcoin-coin">
          <circle cx="173" cy="119" r="66" fill={`url(#${id}-rim)`} />
          <circle cx="164" cy="110" r="66" fill={`url(#${id}-gold)`} stroke="#bd7b35" strokeWidth="1.5" />
          <circle cx="164" cy="110" r="54" stroke="#fff5d7" strokeWidth="1.5" opacity=".8" />
          <path d="M111 96A54 54 0 0 1 157 57" stroke="#fff9e9" strokeWidth="4" strokeLinecap="round" />
          <Bitcoin x="126" y="72" width="76" height="76" stroke="#825124" strokeWidth="1.9" />
          <path d="M205 152L212 159M217 135L224 142M188 166L195 173" stroke="#a36b32" strokeWidth="2" strokeLinecap="round" opacity=".6" />
        </g>

        <g transform="rotate(-12 66 170)">
          <rect x="41" y="145" width="50" height="50" rx="17" fill="var(--lp-lilac)" stroke="var(--lp-line)" />
          <Heart x="53" y="157" width="26" height="26" strokeWidth="1.5" fill="currentColor" fillOpacity=".12" />
        </g>
        <g transform="rotate(12 265 112)">
          <rect x="238" y="85" width="54" height="54" rx="18" fill="var(--lp-mint)" stroke="var(--lp-line)" />
          <GraduationCap x="248" y="96" width="34" height="34" strokeWidth="1.5" />
        </g>

        <path d="M68 202C104 191 133 198 170 216C207 198 236 191 272 202L278 249C239 239 206 246 170 264C134 246 101 239 62 249Z" fill="var(--lp-mint)" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M70 193C106 182 137 192 170 208C203 192 234 182 270 193V237C235 231 201 240 170 255C139 240 105 231 70 237Z" fill="var(--lp-surface)" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M170 208V254M88 208C109 206 132 213 150 222M88 222C109 220 132 227 150 236M190 222C209 213 231 206 252 208M190 236C209 227 231 220 252 222" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".5" />
        <path d="M225 189V226L234 221L243 226V188" fill="#f8c773" stroke="#bd7b35" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M70 54V66M64 60H76M268 179V193M261 186H275M232 30V40M227 35H237" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="98" cy="138" r="3" fill="#e6a247" />
        <circle cx="297" cy="152" r="3" fill="currentColor" opacity=".5" />
        <circle cx="51" cy="109" r="3" fill="currentColor" opacity=".5" />
      </svg>
    </div>
  );
}

export default function LandingPageSections({
  copy,
  lang,
  features,
  faqs,
  children,
}) {
  const [activeTab, setActiveTab] = useState("speak");
  const [toolkitOpen, setToolkitOpen] = useState(false);
  const words = {
    ...(landingPageRefreshCopy[lang] || landingPageRefreshCopy.en),
    ...(landingCapabilityCopy[lang] || landingCapabilityCopy.en),
  };
  const tabs = [
    {
      id: "speak",
      icon: MessageCircle,
      title: copy.feature_tutor,
      desc: copy.feature_tutor_desc,
      detail: copy.feature_conversations_desc,
    },
    {
      id: "remember",
      icon: Bookmark,
      title: words.memoryTitle,
      desc: words.memoryDesc,
      detail: words.memoryDetail,
    },
    {
      id: "grow",
      icon: ChartNoAxesCombined,
      title: words.proficiencyTitle,
      desc: words.proficiencyDesc,
      detail: words.proficiencyDetail,
    },
  ];
  const formatBenefit = (benefit) => benefit.replace(/\{(\w+)\}/g,
    (_, key) => new Intl.NumberFormat(lang).format(LANDING_PROFICIENCY_STATS[key]));
  const values = [copy.value_1, formatBenefit(words.practiceModesBenefit), formatBenefit(words.curriculumBenefit), copy.value_4];
  const visibleFaqs = [...faqs.slice(0, 2), { q: words.costQuestion, a: words.costAnswer }];
  const cards = [
    { id: "companion", title: copy.feature_companion, desc: words.companionDesc, icon: <Heart size={18} /> },
    { id: "connected", title: words.connectedTitle, desc: words.connectedDesc, icon: <Users size={18} /> },
    { id: "immersion", title: copy.feature_immersion, desc: words.immersionDesc, icon: <Compass size={18} /> },
  ];

  function navigateTabs(event, index) {
    const key = event.key;
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(key)) return;
    event.preventDefault();
    const forward = lang === "ar" ? "ArrowLeft" : "ArrowRight";
    const next =
      key === "Home"
        ? 0
        : key === "End"
          ? tabs.length - 1
          : (index + (key === forward ? 1 : -1) + tabs.length) % tabs.length;
    setActiveTab(tabs[next].id);
    const tabButtons = event.currentTarget.parentElement.querySelectorAll('[role="tab"]');
    tabButtons.item(next).focus();
  }

  return (
    <div className="lp-refresh">
      <LandingLanguageAtlas copy={copy} lang={lang} />

      <section
        className="lp-section lp-showcase"
        aria-labelledby="lp-showcase-title"
      >
        <div className="lp-section-heading">
          <span className="lp-eyebrow">{landingSectionLabel(copy.features_label, lang)}</span>
          <h2 id="lp-showcase-title">{words.title}</h2>
          <p>{words.intro}</p>
        </div>
        <div className="lp-showcase-interactive">
          <div
            className="lp-tabs"
            role="tablist"
            aria-label={copy.features_label}
          >
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                id={`lp-tab-${tab.id}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`lp-panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => navigateTabs(event, index)}
              >
                <tab.icon size={18} />
                <span>{words[tab.id]}</span>
              </button>
            ))}
          </div>
          <div className="lp-showcase-panels">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`lp-showcase-panel lp-showcase-panel--${tab.id}`}
                id={`lp-panel-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`lp-tab-${tab.id}`}
                aria-hidden={activeTab !== tab.id}
                inert={activeTab !== tab.id}
                tabIndex={activeTab === tab.id ? 0 : -1}
              >
                <div className="lp-showcase-copy">
                  <span className="lp-feature-symbol">
                    <tab.icon size={25} strokeWidth={1.5} />
                  </span>
                  <h3>{tab.title}</h3>
                  <p>{tab.desc}</p>
                  <div className="lp-feature-detail">
                    <span />
                    <p>{tab.detail}</p>
                  </div>
                </div>
                <PracticePreview
                  mode={tab.id}
                  copy={copy}
                  words={words}
                  lang={lang}
                  visible={activeTab === tab.id}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="lp-bento">
          {cards.map((card, index) => (
            <article key={card.id}
              className={`lp-bento-card lp-bento-card--${["peach", "lilac", "mint"][index]} lp-bento-card--${card.id}`}>
              <div className="lp-bento-art">
                <FeatureIllustration id={card.id} copy={copy} words={words} lang={lang} />
              </div>
              <div className="lp-bento-copy">
                <span className="lp-feature-card-icon" aria-hidden="true">{card.icon}</span>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            </article>
          ))}
        </div>
        <details className="lp-toolkit" onToggle={(event) => setToolkitOpen(event.currentTarget.open)}>
          <summary>
            <span>{toolkitOpen ? words.close : words.browse}</span>
            <span>{features.length}<ChevronDown size={17} /></span>
          </summary>
          <div className="lp-toolkit-grid">
            {features.map((feature) => (
              <article key={feature.title}>
                <span className="lp-tool-icon" aria-hidden="true">{feature.icon}</span>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </details>
      </section>

      <section
        className="lp-section lp-journey"
        aria-labelledby="lp-journey-title"
      >
        <div className="lp-journey-heading">
          <span className="lp-eyebrow">{landingSectionLabel(copy.value_label, lang)}</span>
          <h2 id="lp-journey-title">{words.journey}</h2>
          <p>{words.journeyNote}</p>
          <div className="lp-journey-levels" dir="ltr" aria-hidden="true">
            {LEVELS.map((level) => (
              <span key={level}>{level}</span>
            ))}
          </div>
          <Sprout
            className="lp-journey-sprout"
            aria-hidden="true"
            strokeWidth={1}
          />
        </div>
        <div className="lp-values">
          {values.map((value, i) => (
            <div key={value}>
              <span>0{i + 1}</span>
              <p>{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="lp-section lp-mission"
        aria-labelledby="lp-mission-title"
      >
        <MissionIllustration />
        <div>
          <span className="lp-eyebrow">{landingSectionLabel(copy.scholarship_label, lang)}</span>
          <h2 id="lp-mission-title">
            {copy.scholarship_title}
            <br />
            <em>{copy.scholarship_title_accent}</em>
          </h2>
          <p>{copy.scholarship_desc}</p>
          <p>{copy.scholarship_note}</p>
        </div>
      </section>

      <section className="lp-section lp-faq" aria-labelledby="lp-faq-title">
        <div>
          <span className="lp-eyebrow">{landingSectionLabel(copy.faq_label, lang)}</span>
          <h2 id="lp-faq-title">{copy.faq_title}</h2>
          <CircleHelp
            className="lp-faq-decoration"
            size={48}
            strokeWidth={1}
            aria-hidden="true"
          />
        </div>
        <div className="lp-faq-list">
          {visibleFaqs.map((faq) => (
            <details key={faq.q}>
              <summary>
                {faq.q}
                <span>
                  <ChevronDown size={18} />
                </span>
              </summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section
        className="lp-section lp-start"
        id="lp-start"
        aria-labelledby="lp-start-title"
      >
        <div className="lp-start-copy">
          <h2 id="lp-start-title">
            {copy.cta_final_title}
            {copy.cta_final_accent && (
              <>
                <br />
                <em>{copy.cta_final_accent}</em>
              </>
            )}
          </h2>
          <p>{words.signupIntro}</p>
          <div className="lp-start-doodle" aria-hidden="true">
            <span>hola.</span>
            <span>hello.</span>
            <span>こんにちは。</span>
          </div>
        </div>
        <div className="lp-start-form">{children}</div>
      </section>
    </div>
  );
}
