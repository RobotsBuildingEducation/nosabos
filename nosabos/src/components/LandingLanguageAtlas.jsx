import { useState } from "react";
import { Send } from "lucide-react";
import { getPracticeLanguageOptions } from "../constants/languages";
import { getDefaultLandingPracticeLanguage } from "../utils/languageDetection";
import { landingSectionLabel } from "./landingPageRefreshCopy";
import {
  createLanguagePostcards,
  languageAtlasCopy,
} from "./landingLanguageAtlasCopy";
import "./landingLanguageAtlas.css";
import { LANDING_GLOBE_GEOMETRY } from "./landingGlobeGeometry";

function GreetingGlobe() {
  return (
    <div className="lp-atlas-globe" aria-hidden="true">
      <svg viewBox="0 0 500 500" fill="none">
        <defs>
          <clipPath id="lp-atlas-globe-clip">
            <circle cx="250" cy="250" r="177" />
          </clipPath>
        </defs>
        <circle
          cx="250"
          cy="250"
          r="225"
          stroke="currentColor"
          strokeDasharray="2 9"
          opacity=".18"
        />
        <circle cx="250" cy="250" r="203" stroke="currentColor" opacity=".12" />
        <circle
          cx="250"
          cy="250"
          r="177"
          fill="var(--atlas-ocean)"
          stroke="currentColor"
          strokeWidth="1.3"
          opacity=".9"
        />
        <g clipPath="url(#lp-atlas-globe-clip)">
          <path
            d={LANDING_GLOBE_GEOMETRY.graticule}
            stroke="currentColor"
            strokeWidth=".65"
            opacity=".14"
          />
          <path
            d={LANDING_GLOBE_GEOMETRY.land}
            fill="currentColor"
            opacity=".2"
          />
          <path
            d={LANDING_GLOBE_GEOMETRY.borders}
            stroke="currentColor"
            strokeWidth=".45"
            strokeLinejoin="round"
            opacity=".3"
          />
        </g>
        <path
          d="M31 298C-8 388 80 470 233 451C375 432 480 330 466 272"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="5 7"
          opacity=".4"
        />
        <path
          d="M95 60V80M85 70H105M408 418V436M399 427H417"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity=".6"
        />
        <circle cx="389" cy="78" r="4" fill="currentColor" opacity=".5" />
      </svg>
      <Send className="lp-atlas-plane" size={25} strokeWidth={1.2} />
    </div>
  );
}

export default function LandingLanguageAtlas({ copy, lang }) {
  const [postcards] = useState(createLanguagePostcards);
  const [selectedCode, setSelectedCode] = useState(() => getDefaultLandingPracticeLanguage(lang));
  const words = languageAtlasCopy[lang] || languageAtlasCopy.en;
  const languages = getPracticeLanguageOptions({
    ui: copy,
    uiLang: lang,
    includeTierTagInLabel: false,
  });
  const selected =
    languages.find((language) => language.value === selectedCode) ||
    languages[0];
  const postcard = postcards[selected.value];

  return (
    <section
      className="lp-section lp-atlas"
      aria-labelledby="lp-languages-title"
    >
      <div className="lp-atlas-header">
        <span className="lp-eyebrow">{landingSectionLabel(copy.languages_label, lang)}</span>
      </div>
      <div className="lp-atlas-layout">
        <div className="lp-atlas-editorial">
          <h2 id="lp-languages-title">{words.title}</h2>
          <p className="lp-atlas-intro">{words.intro}</p>
          <div
            className="lp-atlas-postcard"
            id="lp-atlas-postcard"
            data-tone={postcard.tone}
          >
            <div className="lp-atlas-postcard-top">
              <span className="lp-atlas-postage" aria-hidden="true">
                {selected.flag}
                <i />
                <i />
                <i />
              </span>
            </div>
            <div
              className="lp-atlas-postcard-message"
              aria-live="polite"
              aria-atomic="true"
            >
              <div
                key={selectedCode}
                className="lp-atlas-message-enter"
              >
                <span
                  className="lp-atlas-greeting"
                  lang={selected.value}
                  dir="ltr"
                >
                  {postcard.greeting}
                </span>
                <span className="lp-atlas-meaning">
                  {words.meanings[postcard.greetingMeaning]}
                </span>
              </div>
              <div className="lp-atlas-postcard-language">
                <span>{selected.label}</span>
                <span lang={selected.value} dir="ltr">
                  {postcard.native}
                </span>
                {(selected.beta || selected.alpha) && (
                  <small>
                    {selected.alpha
                      ? copy.languages_alpha
                      : copy.languages_beta}
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="lp-atlas-world">
          <GreetingGlobe />
          <ul className="lp-atlas-greetings" aria-label={copy.languages_label}>
            {languages.map((language) => {
              const card = postcards[language.value];
              return (
                <li
                  key={language.value}
                  style={{
                    "--card-x": `${card.x}%`,
                    "--card-y": `${card.y}%`,
                    "--card-tilt": `${card.tilt}deg`,
                  }}
                >
                  <button
                    type="button"
                    className="lp-atlas-greeting-card"
                    data-tone={card.tone}
                    aria-pressed={selectedCode === language.value}
                    aria-label={`${language.label}${language.beta ? ` (${copy.languages_beta})` : language.alpha ? ` (${copy.languages_alpha})` : ""}`}
                    aria-controls="lp-atlas-postcard"
                    onClick={() => setSelectedCode(language.value)}
                  >
                    <span
                      className="lp-atlas-card-greeting"
                      lang={language.value}
                      dir="ltr"
                    >
                      {card.greeting}
                    </span>
                    <span className="lp-atlas-card-meta">
                      <span aria-hidden="true">{language.flag}</span>
                      <span>{language.label}</span>
                      {(language.beta || language.alpha) && (
                        <i
                          title={
                            language.alpha
                              ? copy.languages_alpha
                              : copy.languages_beta
                          }
                        />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
