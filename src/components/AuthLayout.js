import AuthVisualPanel from "./AuthVisualPanel";

function AuthMetric({ label, value }) {
  return (
    <article className="auth-shell__metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default function AuthLayout({
  pageClassName = "",
  variant = "split",
  hero,
  card,
  children,
}) {
  return (
    <section className={`auth-shell ${pageClassName}`.trim()}>
      <div className="auth-shell__backdrop"></div>
      <div className="auth-shell__mesh"></div>
      <div className="auth-shell__grain"></div>

      <div className={`auth-shell__layout auth-shell__layout--${variant}`}>
        {hero ? (
          <div className="auth-shell__hero">
            {hero.badge ? <span className="auth-shell__badge">{hero.badge}</span> : null}
            {hero.title ? <h1>{hero.title}</h1> : null}
            {hero.description ? <p>{hero.description}</p> : null}

            {Array.isArray(hero.metrics) && hero.metrics.length > 0 ? (
              <div className="auth-shell__metrics">
                {hero.metrics.map((metric) => (
                  <AuthMetric key={metric.label} label={metric.label} value={metric.value} />
                ))}
              </div>
            ) : null}

            {hero.visual ? (
              <AuthVisualPanel
                variant={hero.visual.variant}
                title={hero.visual.title}
                caption={hero.visual.caption}
                compact={hero.visual.compact}
              />
            ) : null}

            {hero.panel ? (
              <div className="auth-shell__panel">
                <strong>{hero.panel.title}</strong>
                <span>{hero.panel.description}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={`auth-card ${card?.className || ""}`.trim()}>
          {card ? (
            <div className="auth-card__header">
              {card.eyebrow ? <span className="auth-card__eyebrow">{card.eyebrow}</span> : null}
              {card.title ? <h2>{card.title}</h2> : null}
              {card.description ? <p>{card.description}</p> : null}
            </div>
          ) : null}

          {children}
        </div>
      </div>
    </section>
  );
}
