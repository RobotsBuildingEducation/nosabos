import { useState } from "react";
import { useThemeStore } from "../useThemeStore";
import { useReducedMotion } from "framer-motion";
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ChartNoAxesCombined,
  Compass,
  Globe2,
  Heart,
  MessageCircle,
  Users,
  Wallet,
} from "lucide-react";
import LandingLanguageAtlas from "./LandingLanguageAtlas";
import LandingEthosSection from "./LandingEthosSection";
import { getLandingEthosCopy } from "./landingEthosCopy";
import LandingTutorDemo from "./LandingTutorDemo";
import CompanionRewardDance from "./CompanionRewardDance";
import { getCustomizeModalCopy } from "./companionCustomizeCopy";
import { PET_TYPES } from "../utils/petTypes";
import { landingPageRefreshCopy, landingSectionLabel } from "./landingPageRefreshCopy";
import { landingCapabilityCopy } from "./landingCapabilityCopy";
import { LANDING_PROFICIENCY_LEVELS, LANDING_PROFICIENCY_STATS } from "./landingProficiencyStats";
import "./landingPageSections.css";

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
  const themeMode = useThemeStore((s) => s.themeMode);
  const artworkSuffix = themeMode === "dark" ? "-dark" : "";
  return (
    <div className="lp-mission-art" aria-hidden="true">
      <img
        src={`/images/bitcoin-learning${artworkSuffix}.svg`}
        alt=""
        width="480"
        height="360"
        loading="lazy"
        decoding="async"
      />
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
  const ethos = getLandingEthosCopy(lang);
  const visibleFaqs = [faqs[0], { q: ethos.bitcoinQuestion, a: ethos.bitcoinAnswer }, { q: words.costQuestion, a: words.costAnswer }];
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

      <LandingEthosSection lang={lang} />

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
