/* ============================================================
   mapData.ts
   ------------------------------------------------------------
   THE single source of content for the whole site.
   Edit this file to change every label, description, link,
   and dashboard entry. Nothing else needs to be touched to
   update the content of the knowledge map or the dashboards.

   Data-trust convention: every meaningful claim can carry a
   `confidence` marker and a `source`. Nothing uncertain is
   presented as confirmed — see the Confidence type below.
   ============================================================ */

/** A node "kind" drives its visual treatment in the drawer/tooltips. */
export type NodeType =
  | "practice"
  | "skill"
  | "workshop"
  | "research"
  | "project"
  | "media";

/** Lifecycle / prominence of a piece of work. */
export type NodeStatus =
  | "active"
  | "archive"
  | "draft"
  | "research"
  | "featured"
  | "opportunity";

/**
 * How much the reader should trust a claim:
 * - confirmed      backed by a public link or artifact in this repo
 * - user-provided  stated by Doğan / project notes, no public link yet
 * - imported       pulled from another project or dataset
 * - inferred       editorial framing derived from confirmed material
 * - draft          being written, expect changes
 * - placeholder    known stand-in, replace before relying on it
 */
export type Confidence =
  | "confirmed"
  | "user-provided"
  | "imported"
  | "inferred"
  | "draft"
  | "placeholder";

/** Where a piece of content came from. */
export interface SourceInfo {
  kind:
    | "manual"
    | "seed"
    | "chat-import"
    | "project-import"
    | "file-import"
    | "web"
    | "ai-generated";
  label?: string;
  url?: string;
  note?: string;
}

/** A small labelled figure shown in the drawer / dashboards. */
export interface Metric {
  label: string;
  value: string;
}

/** An external link shown in the detail drawer or a dashboard row. */
export interface NodeLink {
  label: string;
  url: string;
  /** Optional small annotation rendered next to the link (e.g. "placeholder"). */
  note?: string;
}

/** A leaf node hanging off a domain (a project, skill, or practice). */
export interface ChildNode {
  id: string;
  label: string;
  type: NodeType;
  /** Short one-line text shown in the hover tooltip. */
  tip: string;
  /** Longer text shown in the detail drawer. */
  desc: string;
  /** Optional extended reading shown below the description in the drawer. */
  extended?: string;
  /** Optional small tags shown in the drawer. */
  tags?: string[];
  /** Optional external links shown in the drawer. */
  links?: NodeLink[];
  status?: NodeStatus;
  year?: string;
  location?: string;
  role?: string;
  visibility?: "public" | "private" | "hidden";
  confidence?: Confidence;
  source?: SourceInfo;
  metrics?: Metric[];
  /** Free-form follow-ups ("book a workshop", "watch the session"). */
  relatedActions?: string[];
  /** Explicit related node ids, in addition to what relations[] implies. */
  relatedIds?: string[];
}

/** One of the seven primary domains arranged around the center. */
export interface Domain {
  id: string;
  label: string;
  /** Short text shown in the domain tooltip. */
  blurb: string;
  /** One-sentence thesis of the domain, used by dashboards/panels. */
  thesis?: string;
  /** Ids of the domains this one most strongly feeds into. */
  related?: string[];
  /**
   * Accent for this domain. Relation threads leaving the domain are tinted with
   * it and it drives the legend swatch. Kept within the space palette — deep
   * space blue through space grey to star-white — so the map stays cohesive:
   * brighter (star-white) domains read forward, deeper blues recede like depth.
   */
  color: string;
  children: ChildNode[];
}

export interface CenterInfo {
  name: string;
  role: string;
  thesis: string;
}

export interface SelectedWork {
  title: string;
  meta: string;
  url: string | null;
  desc: string;
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface ContactInfo {
  headline: string;
  note: string;
  actions: NodeLink[];
}

/**
 * A "thread" between two nodes (by id) that are related across the
 * practice. These cross-links are what turn the tree into a web.
 * `type` and `label` are optional metadata that explain WHY the two
 * nodes connect — the plain { from, to } form keeps working.
 */
export interface RelationEdge {
  from: string;
  to: string;
  type?:
    | "method"
    | "media"
    | "research"
    | "practice"
    | "education"
    | "international"
    | "archive";
  label?: string;
  strength?: number;
  note?: string;
}

export interface MapData {
  center: CenterInfo;
  domains: Domain[];
  relations: RelationEdge[];
  selectedWorks: SelectedWork[];
  skillGroups: SkillGroup[];
  contact: ContactInfo;
}

/** Human-readable labels for each node type. */
export const KIND_LABEL: Record<NodeType, string> = {
  practice: "Practice",
  skill: "Skill",
  workshop: "Workshop",
  research: "Research",
  project: "Project",
  media: "Media",
};

/** Human-readable labels for node status. */
export const STATUS_LABEL: Record<NodeStatus, string> = {
  active: "Active",
  archive: "Archive",
  draft: "Draft",
  research: "Research",
  featured: "Featured",
  opportunity: "Opportunity",
};

/** Human-readable labels for confidence markers. */
export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  confirmed: "Confirmed",
  "user-provided": "User-provided",
  imported: "Imported",
  inferred: "Inferred",
  draft: "Draft",
  placeholder: "Placeholder",
};

export const mapData: MapData = {
  center: {
    name: "Doğan Karaca",
    role: "sound artist · visual storyteller · digital humanities researcher",
    thesis: "A practice connecting sound, image, data, and cultural memory.",
  },

  domains: [
    {
      id: "sound",
      label: "Sound",
      blurb: "Performance, composition, and listening as a way of paying attention.",
      thesis:
        "Sound is treated as a way of paying attention — resonance, rhythm, and presence as one continuous practice.",
      related: ["education", "film", "data"],
      color: "#5b8cff",
      children: [
        {
          id: "handpan-performance",
          label: "Handpan performance",
          type: "practice",
          tip: "Live handpan across concerts, sessions, and cultural programs.",
          desc: "Live handpan performance built around resonance, space, and presence, from intimate sessions to cultural programs and concert stages.",
          extended:
            "The performance practice moves between very different rooms — quiet listening sessions, festival programs, historic venues, and national broadcast — while keeping the same core: letting the instrument's resonance set the pace of the room rather than filling it.",
          tags: ["performance", "live", "handpan"],
          links: [{ label: "TRT Müzik - performance", url: "https://youtu.be/ZPxlcO6CRiM" }],
          status: "featured",
          confidence: "confirmed",
          source: { kind: "seed", label: "TRT Müzik broadcast", url: "https://youtu.be/ZPxlcO6CRiM" },
        },
        {
          id: "sound-art",
          label: "Sound art",
          type: "practice",
          tip: "Resonance and acoustic texture as material for art.",
          desc: "Working with resonance, overtone, and acoustic texture as raw material, treating sound itself as a medium rather than a backdrop.",
          status: "active",
        },
        {
          id: "percussion",
          label: "Percussion ensemble",
          type: "skill",
          tip: "Frame drums and percussion as a layered rhythmic language.",
          desc: "Frame drums and percussion instruments arranged into a layered rhythmic language that frames and answers the handpan.",
        },
        {
          id: "live-sessions",
          label: "Live sessions",
          type: "practice",
          tip: "Intimate live recordings and improvised sets.",
          desc: "Improvised and arranged live sets, often recorded in a single take to keep the room and the moment intact.",
          status: "active",
        },
        {
          id: "deep-listening",
          label: "Listening practices",
          type: "practice",
          tip: "Deep listening and acoustic meditation as shared attention.",
          desc: "Deep listening and acoustic meditation sessions, guiding a group toward shared, undivided attention through sustained sound.",
          extended:
            "Listening is treated as the root skill under everything else in the practice — the same attention that shapes a performance also shapes how a dataset, an edit, or a classroom is read.",
        },
      ],
    },
    {
      id: "education",
      label: "Education",
      blurb: "Teaching the handpan from first touch to musical fluency.",
      thesis:
        "Teaching turns the handpan from an object of fascination into a learnable, shareable language.",
      related: ["sound", "international", "film"],
      color: "#7ea6ff",
      children: [
        {
          id: "workshops",
          label: "Handpan workshops",
          type: "workshop",
          tip: "Group workshops in technique, rhythm, and tone.",
          desc: "Group workshops introducing technique, rhythm, and tone, designed so a room of strangers can make music together within the first hour.",
          tags: ["workshop", "group"],
          status: "active",
          relatedActions: ["Book a group workshop"],
        },
        {
          id: "private",
          label: "Private lessons",
          type: "workshop",
          tip: "One-to-one guidance tailored to each learner.",
          desc: "One-to-one guidance shaped around each learner's pace, ear, and musical goals.",
          status: "active",
          relatedActions: ["Ask about private lessons"],
        },
        {
          id: "academic",
          label: "Academic workshops",
          type: "workshop",
          tip: "Bringing the handpan into university settings.",
          desc: "University workshops that bring the handpan into academic settings, including the first academic handpan workshop held at Yeditepe University.",
          tags: ["academic", "university"],
          location: "Yeditepe University",
          confidence: "user-provided",
        },
        {
          id: "beginner-method",
          label: "Beginner methodology",
          type: "research",
          tip: "A structured path for absolute beginners.",
          desc: "A structured, repeatable path for absolute beginners, sequencing scales, exercises, and ear training into clear stages of progress.",
          extended:
            "The method treats the first months on the instrument as a designed curriculum rather than free exploration: touch and posture first, then rhythm cells, then scale awareness and ear training — each stage with clear exercises and a clear exit point.",
          status: "research",
        },
        {
          id: "community",
          label: "Community learning",
          type: "workshop",
          tip: "Circles and meetups that grow a shared practice.",
          desc: "Circles and recurring meetups that turn individual practice into a living community.",
        },
      ],
    },
    {
      id: "film",
      label: "Film",
      blurb: "Visual storytelling and audiovisual craft.",
      thesis: "Image and sound are composed together — editing treated as rhythm, structure as meaning.",
      related: ["sound", "media", "dh"],
      color: "#4a78e0",
      children: [
        {
          id: "visual-story",
          label: "Visual storytelling",
          type: "practice",
          tip: "Shaping narrative through image, rhythm, and tone.",
          desc: "Shaping narrative through image, rhythm, and tone, letting structure and pacing carry as much meaning as the subject.",
        },
        {
          id: "cinematography",
          label: "Cinematography",
          type: "skill",
          tip: "Camera work attentive to light and movement.",
          desc: "Camera work with close attention to light, framing, and movement.",
        },
        {
          id: "editing",
          label: "Editing",
          type: "skill",
          tip: "Editing as the rhythm and structure of a piece.",
          desc: "Editing treated as composition, the rhythm, structure, and breath of a finished piece.",
        },
        {
          id: "documentary",
          label: "Documentary language",
          type: "practice",
          tip: "A documentary sensibility toward real subjects.",
          desc: "A documentary sensibility toward real subjects and moments, favouring observation over staging.",
        },
        {
          id: "audiovisual",
          label: "Audiovisual work",
          type: "project",
          tip: "Work where sound and image are composed together.",
          desc: "Projects where sound and image are designed as one, composition and montage developed in parallel rather than in sequence.",
        },
        {
          id: "generative-video",
          label: "Generative video",
          type: "project",
          tip: "Experiments with AI-assisted moving image.",
          desc: "An ongoing series of experiments with AI-assisted moving image, exploring how generative tools extend a visual and rhythmic language.",
          extended:
            "The series treats generative tools as an extension of the same audiovisual language developed in the film work — rhythm, texture, and pacing decisions stay authored even when the frames are machine-assisted.",
          tags: ["AI", "experimental", "series"],
          links: [
            { label: "AI Generated I", url: "https://youtu.be/JFOCqtC82vo" },
            { label: "AI Generated II", url: "https://youtu.be/mDZdtSaQ0OA" },
            { label: "AI Generated III", url: "https://youtu.be/2Vf1AuCnzmE" },
            { label: "AI Generated IV", url: "https://youtu.be/BtZr-e6EFRQ" },
          ],
          status: "active",
          confidence: "confirmed",
          metrics: [{ label: "Published experiments", value: "4 videos" }],
        },
      ],
    },
    {
      id: "data",
      label: "Data",
      blurb: "Turning datasets into questions, structures, and visuals.",
      thesis:
        "Datasets become questions — structure, pattern, and story read out of cultural and media data.",
      related: ["dh", "media", "sound"],
      color: "#aac6ff",
      children: [
        {
          id: "data-analysis",
          label: "Data analysis",
          type: "skill",
          tip: "Exploratory and applied analysis of cultural and media data.",
          desc: "Exploratory and applied analysis across cultural and media datasets, including a 684-campaign media performance study.",
          metrics: [{ label: "Media performance study", value: "684 campaigns" }],
          confidence: "user-provided",
        },
        {
          id: "network-analysis",
          label: "Network analysis",
          type: "skill",
          tip: "Mapping relationships within texts, people, and places.",
          desc: "Mapping relationships within texts, people, and places, reading structure and centrality rather than isolated points.",
          extended:
            "Network thinking is the method that powers the digital-humanities prototypes: entities and relations first, then layout, then reading — the same discipline this knowledge map itself is built on.",
        },
        {
          id: "text-mining",
          label: "Text mining",
          type: "skill",
          tip: "Extracting patterns and themes from large corpora.",
          desc: "Extracting patterns, themes, and entities from large text corpora to make qualitative material searchable and comparable.",
        },
        {
          id: "spatial",
          label: "Spatial thinking · GIS",
          type: "skill",
          tip: "Geographic and spatial perspectives on cultural data.",
          desc: "Geographic and spatial perspectives on cultural data, placing records, sites, and movements onto shared coordinates.",
        },
        {
          id: "dataviz",
          label: "Data visualization",
          type: "skill",
          tip: "Designing clear, expressive views of complex data.",
          desc: "Designing clear, expressive views of complex data, choosing the form that lets a pattern speak for itself.",
        },
      ],
    },
    {
      id: "dh",
      label: "Digital Humanities",
      blurb: "Computational methods in the service of cultural memory.",
      thesis:
        "Computational methods in the service of cultural memory — from epigraphy to iconography to archives.",
      related: ["data", "film", "international"],
      color: "#e6eeff",
      children: [
        {
          id: "samal-network",
          label: "Sam'al Epigraphic Network",
          type: "research",
          tip: "A network visualization of epigraphic relationships.",
          desc: "A network visualization of epigraphic relationships, built with Vite, React, TypeScript, and D3, modelling inscriptions as a connected graph.",
          extended:
            "The prototype models the Aramean dynasty of Zincirli (c. 920–713 BCE) as a sourced graph — kings, officials, inscriptions, languages, and deities — with a timeline view beside the relational network. Every entity and relation carries an explicit citation and a confidence rating; scholarly disagreements are recorded in the notes rather than hidden.",
          tags: ["D3", "TypeScript", "prototype"],
          status: "featured",
          confidence: "user-provided",
          source: {
            kind: "project-import",
            label: "Sam'al Epigraphic Network build",
            note: "Sibling project in the same workspace; figures read from its dataset.",
          },
          metrics: [
            { label: "Entities", value: "32" },
            { label: "Relations", value: "68" },
            { label: "Sources cited", value: "14" },
          ],
        },
        {
          id: "gobekli-network",
          label: "Göbekli Tepe Iconography",
          type: "research",
          tip: "A sibling network mapping iconographic motifs.",
          desc: "A sibling research prototype mapping iconographic motifs as a connected graph, exploring how symbols cluster and relate.",
          extended:
            "Enclosures, pillars, motifs, finds, and phases are modelled as one sourced network, so questions like \"which motifs co-occur on which pillars\" become graph queries instead of prose claims.",
          tags: ["network", "iconography", "prototype"],
          status: "research",
          confidence: "user-provided",
          source: {
            kind: "project-import",
            label: "Göbekli Tepe Iconography build",
            note: "Sibling project in the same workspace; figures read from its dataset.",
          },
          metrics: [
            { label: "Nodes", value: "40" },
            { label: "Edges", value: "62" },
          ],
        },
        {
          id: "digital-archiving",
          label: "Digital archiving",
          type: "research",
          tip: "Recovering and structuring cultural archives.",
          desc: "Recovering and structuring cultural archives, including a long-running cinephile and literary blog reconstructed from web archives.",
          tags: ["archive", "preservation"],
        },
        {
          id: "cultural-datasets",
          label: "Cultural datasets",
          type: "research",
          tip: "Curating datasets from historical sources.",
          desc: "Building and curating datasets from historical and cultural sources, with care for provenance and structure.",
        },
        {
          id: "knowledge-modeling",
          label: "Knowledge modeling",
          type: "research",
          tip: "Representing cultural knowledge as graphs.",
          desc: "Representing cultural knowledge as graphs and structured models, a discipline this very map is built on.",
          extended:
            "This site is itself an instance of the method: one typed data file describes domains, facets, and relations, and the honeycomb interface is generated from it.",
        },
      ],
    },
    {
      id: "media",
      label: "Media",
      blurb: "Public communication across broadcast and digital platforms.",
      thesis:
        "Public communication carries the practice to broad audiences across broadcast and digital platforms.",
      related: ["film", "international", "data"],
      color: "#93b4ff",
      children: [
        {
          id: "trt",
          label: "TRT",
          type: "media",
          tip: "Appearances on TRT Müzik and TRT 2 cultural programs.",
          desc: "Appearances on national broadcast, TRT Müzik and TRT 2 cultural programs, bringing the handpan to a wide audience.",
          links: [
            { label: "TRT Müzik", url: "https://youtu.be/ZPxlcO6CRiM" },
            { label: "TRT 2", url: "https://youtu.be/hjghfvX_tZ0" },
          ],
          status: "featured",
          confidence: "confirmed",
        },
        {
          id: "haberturk",
          label: "Habertürk",
          type: "media",
          tip: "Live television appearance on a morning program.",
          desc: "A live television appearance on Habertürk, performing and speaking about the practice.",
          confidence: "user-provided",
        },
        {
          id: "disney",
          label: "Disney+ Türkiye",
          type: "media",
          tip: "Content collaboration with Disney+ Türkiye.",
          desc: "A content collaboration with Disney+ Türkiye, contributing to cross-platform cultural programming.",
          confidence: "user-provided",
        },
        {
          id: "public-comm",
          label: "Public communication",
          type: "media",
          tip: "Talking about the practice for general audiences.",
          desc: "Speaking about handpan and creative practice for general audiences, in plain and inviting language.",
        },
        {
          id: "cross-platform",
          label: "Cross-platform content",
          type: "project",
          tip: "Original content across video, audio, and social.",
          desc: "Original content produced across video, audio, and social platforms, with one consistent editorial voice.",
          links: [
            { label: "2024 recap", url: "https://youtu.be/h-bnEF_9MJo" },
            { label: "2025 recap", url: "https://youtu.be/uUiAAmMLoQo" },
          ],
          status: "active",
          confidence: "confirmed",
        },
      ],
    },
    {
      id: "international",
      label: "International",
      blurb: "Cultural exchange beyond a single place.",
      thesis:
        "The practice travels — institutions, festivals, and remote collaborations across borders.",
      related: ["education", "media", "dh"],
      color: "#cadcff",
      children: [
        {
          id: "institutions",
          label: "Cultural institutions",
          type: "project",
          tip: "Programs and performances with cultural institutions.",
          desc: "Programs and performances developed together with cultural institutions across different countries.",
        },
        {
          id: "festivals",
          label: "Festivals",
          type: "project",
          tip: "Performances and sessions within festival contexts.",
          desc: "Performances and listening sessions within festival contexts and curated programs.",
        },
        {
          id: "outreach",
          label: "Outreach",
          type: "project",
          tip: "Sustained outreach to partners and venues abroad.",
          desc: "Sustained, personalised outreach to partners and venues, one recent campaign reached more than 145 organisations across twelve countries.",
          metrics: [{ label: "Organisations reached", value: "145+ across 12 countries" }],
          confidence: "user-provided",
          status: "active",
        },
        {
          id: "partnerships",
          label: "Partnerships",
          type: "project",
          tip: "Collaborations across borders and disciplines.",
          desc: "Cross-border collaborations with collectives and producers, including work with the High Vibe Collective and a release with producer Seb Wildblood.",
          links: [
            { label: "High Vibe Collective - performance", url: "https://youtu.be/GV9BzPsjoJ4" },
          ],
          metrics: [{ label: "Collaborative release", value: "600k+ streams (with Seb Wildblood)" }],
          confidence: "user-provided",
          status: "featured",
        },
        {
          id: "remote",
          label: "Remote collaborations",
          type: "project",
          tip: "Working together across distance and time zones.",
          desc: "Working together across distance and time zones, recording, composing, and producing remotely.",
        },
      ],
    },
  ],

  /* ----------------------------------------------------------------
     Cross-links ("threads"). Each pair connects related ideas across
     the practice; the network layout uses these to weave the web.
     Both endpoints must be valid node ids from the domains above.
     `type` explains the nature of the link; `label` (optional) is a
     human sentence shown in the drawer's Related section.
     ---------------------------------------------------------------- */
  relations: [
    // sound <-> film (performance feeds the audiovisual work)
    { from: "live-sessions", to: "audiovisual", type: "practice", label: "Live sets become audiovisual pieces" },
    { from: "sound-art", to: "generative-video", type: "practice", label: "Sound textures drive the generative imagery" },
    { from: "deep-listening", to: "documentary", type: "practice" },
    // sound <-> education
    { from: "handpan-performance", to: "workshops", type: "education", label: "The stage practice is what gets taught" },
    { from: "percussion", to: "beginner-method", type: "education" },
    { from: "deep-listening", to: "private", type: "education" },
    // education <-> international
    { from: "workshops", to: "festivals", type: "international" },
    { from: "academic", to: "institutions", type: "international" },
    { from: "community", to: "partnerships", type: "international" },
    // data <-> digital humanities (methods power the research)
    { from: "network-analysis", to: "samal-network", type: "method", label: "Graph methods power the epigraphic network" },
    { from: "network-analysis", to: "gobekli-network", type: "method", label: "Graph methods power the iconography map" },
    { from: "text-mining", to: "cultural-datasets", type: "method" },
    { from: "dataviz", to: "knowledge-modeling", type: "method" },
    { from: "spatial", to: "gobekli-network", type: "method" },
    { from: "data-analysis", to: "digital-archiving", type: "method" },
    // digital humanities <-> film (research becomes visual story)
    { from: "samal-network", to: "visual-story", type: "research" },
    { from: "digital-archiving", to: "editing", type: "archive" },
    // film <-> media (work reaches an audience)
    { from: "documentary", to: "trt", type: "media" },
    { from: "visual-story", to: "haberturk", type: "media" },
    { from: "generative-video", to: "cross-platform", type: "media" },
    // media <-> international
    { from: "cross-platform", to: "remote", type: "international" },
    { from: "public-comm", to: "outreach", type: "international" },
    // data <-> media (audience and campaign analysis)
    { from: "data-analysis", to: "cross-platform", type: "method", label: "Campaign analysis informs the content strategy" },
    // education <-> film (teaching captured on video)
    { from: "beginner-method", to: "audiovisual", type: "media" },
    // dh <-> international (research shared across borders)
    { from: "cultural-datasets", to: "institutions", type: "research" },
    // sound <-> data (listening as data)
    { from: "deep-listening", to: "data-analysis", type: "method" },
    // film internal + film <-> sound (camera work feeds the audiovisual work
    // and captures the live sessions) — connects the cinematography node
    { from: "cinematography", to: "audiovisual", type: "practice" },
    { from: "cinematography", to: "live-sessions", type: "practice" },
    // media <-> international (the Disney+ collaboration is a partnership and
    // cross-platform content) — connects the disney node
    { from: "disney", to: "cross-platform", type: "media" },
    { from: "disney", to: "partnerships", type: "international" },
  ],

  /* Curated highlights for the Dashboards view. */
  selectedWorks: [
    {
      title: "High Vibe Collective - Prince's Palace",
      meta: "Performance",
      url: "https://youtu.be/GV9BzPsjoJ4",
      desc: "A handpan performance captured within an international collective program.",
    },
    {
      title: "TRT Müzik - Sesler Âlemi",
      meta: "Broadcast · Topkapı Palace",
      url: "https://youtu.be/ZPxlcO6CRiM",
      desc: "A national broadcast performance recorded at a historic setting.",
    },
    {
      title: "TRT 2 - Yeryüzleri",
      meta: "Broadcast",
      url: "https://youtu.be/hjghfvX_tZ0",
      desc: "A cultural-program appearance on national television.",
    },
    {
      title: "Release with Seb Wildblood",
      meta: "Recording",
      url: null,
      desc: "A collaborative release with the producer, surpassing 600,000 streams.",
    },
    {
      title: "Blue Sapphire",
      meta: "Performance · 2023",
      url: "https://youtu.be/6CNz1FrzKVk",
      desc: "A live handpan set from 2023.",
    },
    {
      title: "Sam'al Epigraphic Network",
      meta: "Digital humanities · Prototype",
      url: null,
      desc: "An interactive network visualization of epigraphic relationships, in development.",
    },
  ],

  skillGroups: [
    {
      group: "Sound",
      items: ["Handpan", "Percussion ensemble", "Sound art", "Live recording", "Deep listening"],
    },
    {
      group: "Image",
      items: ["Cinematography", "Editing", "Visual storytelling", "Documentary", "Generative video"],
    },
    {
      group: "Data & research",
      items: [
        "Data analysis",
        "Network analysis",
        "Text mining",
        "GIS / spatial",
        "Data visualization",
        "Digital archiving",
      ],
    },
  ],

  contact: {
    headline: "Let's make something together.",
    note: "Open to performances, workshops, residencies, research collaborations, media production, and creative AI projects. A short conversation is always welcome.",
    actions: [
      // Placeholder address — replace with the preferred contact email.
      { label: "hello@dogankaraca.com", url: "mailto:hello@dogankaraca.com", note: "placeholder" },
      { label: "dogankaraca.com", url: "https://dogankaraca.com" },
    ],
  },
};
