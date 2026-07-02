import { motion, type Variants } from "framer-motion";
import type { Domain, MapData } from "../data/mapData";
import { KIND_LABEL } from "../data/mapData";

interface DashboardsProps {
  data: MapData;
  onOpenMap: () => void;
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

// The map's depth language lives in the .dash-card class (index.css); these
// utilities only handle layout so the two views read as one material.
const CARD = "dash-card flex flex-col rounded-2xl border border-hair p-6 pb-[26px]";

function CardLabel({
  children,
  count,
  color,
}: {
  children: React.ReactNode;
  count?: number;
  color?: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-[10px]">
      {color ? (
        <span
          className="h-[9px] w-[9px] flex-none rounded-full"
          style={{ background: color, boxShadow: `0 0 7px -1px ${color}` }}
        />
      ) : null}
      <span className="eyebrow !text-ink">{children}</span>
      {count !== undefined ? (
        <span className="ml-auto text-[10px] tracking-[0.1em] text-muted">{count}</span>
      ) : null}
    </div>
  );
}

/** A simple titled row used for the per-domain facet lists. */
function Row({
  name,
  tag,
  desc,
  href,
}: {
  name: string;
  tag: string;
  desc: string;
  href?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-hair py-[13px] first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[15px] font-medium text-ink no-underline hover:text-accent"
          >
            {name}
          </a>
        ) : (
          <span className="text-[15px] font-medium text-ink">{name}</span>
        )}
        <span className="whitespace-nowrap text-[9.5px] uppercase tracking-[0.14em] text-muted">
          {tag}
        </span>
      </div>
      <span className="text-[12.5px] leading-[1.5]" style={{ color: "var(--text-2)" }}>
        {desc}
      </span>
    </div>
  );
}

/** Top cross-domain bridges, derived from the same relations the map draws. */
function crossDomainBridges(data: MapData) {
  const domainOf = new Map<string, Domain>();
  data.domains.forEach((d) => d.children.forEach((c) => domainOf.set(c.id, d)));

  const pairs = new Map<string, { a: Domain; b: Domain; n: number }>();
  let crossCount = 0;
  data.relations.forEach((r) => {
    const da = domainOf.get(r.from);
    const db = domainOf.get(r.to);
    if (!da || !db || da.id === db.id) return;
    crossCount++;
    const [a, b] = da.id < db.id ? [da, db] : [db, da];
    const key = `${a.id}|${b.id}`;
    const cur = pairs.get(key);
    if (cur) cur.n++;
    else pairs.set(key, { a, b, n: 1 });
  });

  const top = [...pairs.values()].sort((p, q) => q.n - p.n).slice(0, 5);
  return { top, crossCount };
}

export default function Dashboards({ data, onOpenMap }: DashboardsProps) {
  const { top: bridges, crossCount } = crossDomainBridges(data);
  const facetCount = data.domains.reduce((n, d) => n + d.children.length, 0);
  const stats = [
    { value: String(data.domains.length), label: "domains" },
    { value: String(facetCount), label: "facets" },
    { value: String(data.relations.length), label: "threads" },
    { value: String(data.selectedWorks.length), label: "selected works" },
  ];

  return (
    <div className="absolute inset-x-0 bottom-0 top-16 overflow-y-auto px-[clamp(20px,5vw,72px)] pb-20 pt-[30px]">
      <motion.div
        className="mx-auto max-w-[1180px]"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Hero */}
        <motion.div className="my-[14px] mb-10 max-w-[720px]" variants={item}>
          <div className="eyebrow mb-[14px]">Dashboards · Overview</div>
          <h1 className="mb-[14px] font-display text-[clamp(34px,5vw,56px)] font-normal leading-[1.02]">
            A multidisciplinary practice, at a glance.
          </h1>
          <p className="m-0 max-w-[620px] text-[16px] leading-[1.6]" style={{ color: "var(--text-2)" }}>
            {data.center.thesis} Selected works, skills, public appearances, teaching, and research,
            read as one connected body of work.
          </p>
          {/* Practice overview, computed from the same data the map draws. */}
          <div className="dash-stats" aria-label="Practice overview">
            {stats.map((s) => (
              <span key={s.label} className="dash-stat">
                <span className="dash-stat-v">{s.value}</span>
                <span className="dash-stat-k">{s.label}</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-12 gap-[18px]">
          {/* Selected works */}
          <motion.div className={`${CARD} col-span-12 md:col-span-7`} variants={item}>
            <CardLabel count={data.selectedWorks.length}>Selected works</CardLabel>
            {data.selectedWorks.map((w) => (
              <div
                key={w.title}
                className="flex flex-col gap-[3px] border-t border-hair py-[15px] first:border-t-0 first:pt-0"
              >
                {w.url ? (
                  <a
                    href={w.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display text-[21px] leading-[1.1] text-ink no-underline hover:text-accent"
                  >
                    {w.title}
                  </a>
                ) : (
                  <span className="font-display text-[21px] leading-[1.1] text-ink">{w.title}</span>
                )}
                <span className="text-[11px] uppercase tracking-[0.08em] text-muted">{w.meta}</span>
                <span className="mt-1 text-[13px] leading-[1.5]" style={{ color: "var(--text-2)" }}>
                  {w.desc}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Skills */}
          <motion.div className={`${CARD} col-span-12 md:col-span-5`} variants={item}>
            <CardLabel>Skills</CardLabel>
            {data.skillGroups.map((g) => (
              <div key={g.group} className="mb-[18px] last:mb-0">
                <h4 className="m-0 mb-[10px] text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {g.group}
                </h4>
                <div className="flex flex-wrap gap-[7px]">
                  {g.items.map((i) => (
                    <span key={i} className="chip">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Section heading: every domain, derived from mapData */}
          <motion.div className="col-span-12 mt-2" variants={item}>
            <div className="eyebrow">Practice by domain</div>
          </motion.div>

          {/* One card per domain — nothing cherry-picked, nothing omitted */}
          {data.domains.map((d) => (
            <motion.div
              key={d.id}
              className={`${CARD} col-span-12 sm:col-span-6 md:col-span-4`}
              variants={item}
            >
              <CardLabel count={d.children.length} color={d.color}>
                {d.label}
              </CardLabel>
              <div className="flex flex-col">
                {d.children.map((c) => (
                  <Row
                    key={c.id}
                    name={c.label}
                    tag={KIND_LABEL[c.type]}
                    desc={c.tip}
                    href={c.links?.[0]?.url}
                  />
                ))}
              </div>
            </motion.div>
          ))}

          {/* Connections — the same threads the map draws, summarized */}
          <motion.div className={`${CARD} col-span-12 md:col-span-4`} variants={item}>
            <CardLabel count={data.relations.length}>Connections</CardLabel>
            <p className="mb-4 text-[12.5px] leading-[1.5]" style={{ color: "var(--text-2)" }}>
              {crossCount} of {data.relations.length} threads bridge different domains, weaving the
              practice into one web.
            </p>
            <div className="flex flex-col gap-[11px]">
              {bridges.map((b) => (
                <div key={`${b.a.id}-${b.b.id}`} className="flex items-center gap-2 text-[12.5px]">
                  <span
                    className="h-2 w-2 flex-none rounded-full"
                    style={{ background: b.a.color }}
                  />
                  <span className="text-ink">{b.a.label}</span>
                  <span className="text-muted">↔</span>
                  <span
                    className="h-2 w-2 flex-none rounded-full"
                    style={{ background: b.b.color }}
                  />
                  <span className="text-ink">{b.b.label}</span>
                  <span className="ml-auto text-[10px] tracking-[0.1em] text-muted">{b.n}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact card */}
          <motion.div
            className="dash-card col-span-12 flex flex-col rounded-2xl border border-line p-6 pb-[26px] text-ink md:col-span-4"
            variants={item}
          >
            <div className="mb-5 flex items-center gap-[10px]">
              <span
                className="text-[10.5px] font-medium uppercase tracking-[0.24em]"
                style={{ color: "var(--accent)" }}
              >
                Contact
              </span>
            </div>
            <h3 className="m-0 mb-2 font-display text-[28px] font-normal">{data.contact.headline}</h3>
            <p
              className="m-0 mb-[22px] max-w-[360px] text-[14px] leading-[1.6]"
              style={{ color: "var(--muted)" }}
            >
              {data.contact.note}
            </p>
            <div className="contact-actions mt-auto flex flex-col gap-[9px]">
              {data.contact.actions.map((a) => (
                <a
                  key={a.url}
                  href={a.url}
                  {...(a.url.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <span>
                    {a.label}
                    {a.note ? (
                      <span className="ml-2 text-[9px] uppercase tracking-[0.14em] text-muted">
                        {a.note}
                      </span>
                    ) : null}
                  </span>
                  <span style={{ color: "var(--muted)" }}>↗</span>
                </a>
              ))}
            </div>
          </motion.div>

          {/* Explore */}
          <motion.div
            className={`${CARD} col-span-12 items-start justify-center md:col-span-4`}
            variants={item}
          >
            <CardLabel>Explore</CardLabel>
            <p className="m-0 mb-4 text-[13.5px] leading-[1.55]" style={{ color: "var(--text-2)" }}>
              Prefer the spatial view? Open the interactive knowledge map to follow each domain into
              its branch and see how the work connects.
            </p>
            <button
              onClick={onOpenMap}
              className="chip cursor-pointer"
              style={{
                borderColor: "var(--accent)",
                color: "var(--text)",
                background: "var(--accent-soft)",
              }}
            >
              Open the map →
            </button>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="mt-[46px] flex flex-wrap justify-between gap-[10px] border-t border-hair pt-[22px] text-[10.5px] uppercase tracking-[0.12em] text-muted">
          <span>Doğan Karaca - Knowledge Map</span>
          <span>Sound · Image · Data · Cultural memory</span>
        </div>
      </motion.div>
    </div>
  );
}
