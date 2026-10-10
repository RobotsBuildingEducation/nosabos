import { getLandingEthosCopy } from "./landingEthosCopy";

const ARTWORK = [
  "human-guidance",
  "community-scholarships",
  "technology-imagination",
];

export default function LandingEthosSection({ lang }) {
  const copy = getLandingEthosCopy(lang);
  return (
    <section className="lp-section lp-ethos" aria-labelledby="lp-ethos-title">
      <div className="lp-ethos-heading">
        <span className="lp-eyebrow">{copy.label}</span>
        <h2 id="lp-ethos-title">{copy.title}</h2>
      </div>
      <div className="lp-ethos-principles">
        {copy.principles.map((principle, index) => (
          <article className="lp-ethos-principle" key={principle.title}>
            <img
              className="lp-ethos-art"
              src={`/images/ethos/${ARTWORK[index]}.svg`}
              alt=""
              width="320"
              height="280"
              loading="lazy"
              decoding="async"
            />
            <h3>{principle.title}</h3>
            <div className="lp-ethos-description">
              <p className="lp-ethos-lead">{principle.lead}</p>
              <p>{principle.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
