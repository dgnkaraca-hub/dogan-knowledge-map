/* ============================================================
   mapData.ts
   ------------------------------------------------------------
   THE single source of content for the whole site.
   Edit this file to change every label, description, link,
   and dashboard entry. Nothing else needs to be touched to
   update the content of the knowledge map or the dashboards.
   ============================================================ */

/** A node "kind" drives its visual treatment in the drawer/tooltips. */
export type NodeType =
  | "practice"
  | "skill"
  | "workshop"
  | "research"
  | "project"
  | "media";

/** An external link shown in the detail drawer or a dashboard row. */
export interface NodeLink {
  label: string;
  url: string;
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
  /** Optional small tags shown in the drawer. */
  tags?: string[];
  /** Optional external links shown in the drawer. */
  links?: NodeLink[];
}

/** One of the seven primary domains arranged around the center. */
export interface Domain {
  id: string;
  label: string;
  /** Short text shown in the domain tooltip. */
  blurb: string;
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
 * practice. These cross-links are what turn the tree into a web: the
 * network layout pulls connected ideas toward each other and draws a
 * fine line between them, the way a Gephi graph reveals structure.
 */
export interface RelationEdge {
  from: string;
  to: string;
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
      color: "#5b8cff",
      children: [
        {
          id: "handpan-performance",
          label: "Handpan performance",
          type: "practice",
          tip: "Live handpan across concerts, sessions, and cultural programs.",
          desc: "Live handpan performance built around resonance, space, and presence, from intimate sessions to cultural programs and concert stages.",
          tags: ["performance", "live", "handpan"],
          links: [{ label: "TRT Müzik - performance", url: "https://youtu.be/ZPxlcO6CRiM" }],
        },
        {
          id: "sound-art",
          label: "Sound art",
          type: "practice",
          tip: "Resonance and acoustic texture as material for art.",
          desc: "Working with resonance, overtone, and acoustic texture as raw material, treating sound itself as a medium rather than a backdrop.",
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
        },
        {
          id: "deep-listening",
          label: "Listening practices",
          type: "practice",
          tip: "Deep listening and acoustic meditation as shared attention.",
          desc: "Deep listening and acoustic meditation sessions, guiding a group toward shared, undivided attention through sustained sound.",
        },
      ],
    },
    {
      id: "education",
      label: "Education",
      blurb: "Teaching the handpan from first touch to musical fluency.",
      color: "#7ea6ff",
      children: [
        {
          id: "workshops",
          label: "Handpan workshops",
          type: "workshop",
          tip: "Group workshops in technique, rhythm, and tone.",
          desc: "Group workshops introducing technique, rhythm, and tone, designed so a room of strangers can make music together within the first hour.",
          tags: ["workshop", "group"],
        },
        {
          id: "private",
          label: "Private lessons",
          type: "workshop",
          tip: "One-to-one guidance tailored to each learner.",
          desc: "One-to-one guidance shaped around each learner's pace, ear, and musical goals.",
        },
        {
          id: "academic",
          label: "Academic workshops",
          type: "workshop",
          tip: "Bringing the handpan into university settings.",
          desc: "University workshops that bring the handpan into academic settings, including the first academic handpan workshop held at Yeditepe University.",
          tags: ["academic", "university"],
        },
        {
          id: "beginner-method",
          label: "Beginner methodology",
          type: "research",
          tip: "A structured path for absolute beginners.",
          desc: "A structured, repeatable path for absolute beginners, sequencing scales, exercises, and ear training into clear stages of progress.",
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
          tags: ["AI", "experimental", "series"],
          links: [
            { label: "AI Generated I", url: "https://youtu.be/JFOCqtC82vo" },
            { label: "AI Generated II", url: "https://youtu.be/mDZdtSaQ0OA" },
            { label: "AI Generated III", url: "https://youtu.be/2Vf1AuCnzmE" },
            { label: "AI Generated IV", url: "https://youtu.be/BtZr-e6EFRQ" },
          ],
        },
      ],
    },
    {
      id: "data",
      label: "Data",
      blurb: "Turning datasets into questions, structures, and visuals.",
      color: "#aac6ff",
      children: [
        {
          id: "data-analysis",
          label: "Data analysis",
          type: "skill",
          tip: "Exploratory and applied analysis of cultural and media data.",
          desc: "Exploratory and applied analysis across cultural and media datasets, including a 684-campaign media performance study.",
        },
        {
          id: "network-analysis",
          label: "Network analysis",
          type: "skill",
          tip: "Mapping relationships within texts, people, and places.",
          desc: "Mapping relationships within texts, people, and places, reading structure and centrality rather than isolated points.",
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
      color: "#e6eeff",
      children: [
        {
          id: "samal-network",
          label: "Sam'al Epigraphic Network",
          type: "research",
          tip: "A network visualization of epigraphic relationships.",
          desc: "A network visualization of epigraphic relationships, built with Vite, React, TypeScript, and D3, modelling inscriptions as a connected graph.",
          tags: ["D3", "TypeScript", "prototype"],
        },
        {
          id: "gobekli-network",
          label: "Göbekli Tepe Iconography",
          type: "research",
          tip: "A sibling network mapping iconographic motifs.",
          desc: "A sibling research prototype mapping iconographic motifs as a connected graph, exploring how symbols cluster and relate.",
          tags: ["network", "iconography", "prototype"],
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
        },
      ],
    },
    {
      id: "media",
      label: "Media",
      blurb: "Public communication across broadcast and digital platforms.",
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
        },
        {
          id: "haberturk",
          label: "Habertürk",
          type: "media",
          tip: "Live television appearance on a morning program.",
          desc: "A live television appearance on Habertürk, performing and speaking about the practice.",
        },
        {
          id: "disney",
          label: "Disney+ Türkiye",
          type: "media",
          tip: "Content collaboration with Disney+ Türkiye.",
          desc: "A content collaboration with Disney+ Türkiye, contributing to cross-platform cultural programming.",
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
        },
      ],
    },
    {
      id: "international",
      label: "International",
      blurb: "Cultural exchange beyond a single place.",
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
     Add or remove freely to change how tightly the map knits together.
     ---------------------------------------------------------------- */
  relations: [
    // sound <-> film (performance feeds the audiovisual work)
    { from: "live-sessions", to: "audiovisual" },
    { from: "sound-art", to: "generative-video" },
    { from: "deep-listening", to: "documentary" },
    // sound <-> education
    { from: "handpan-performance", to: "workshops" },
    { from: "percussion", to: "beginner-method" },
    { from: "deep-listening", to: "private" },
    // education <-> international
    { from: "workshops", to: "festivals" },
    { from: "academic", to: "institutions" },
    { from: "community", to: "partnerships" },
    // data <-> digital humanities (methods power the research)
    { from: "network-analysis", to: "samal-network" },
    { from: "network-analysis", to: "gobekli-network" },
    { from: "text-mining", to: "cultural-datasets" },
    { from: "dataviz", to: "knowledge-modeling" },
    { from: "spatial", to: "gobekli-network" },
    { from: "data-analysis", to: "digital-archiving" },
    // digital humanities <-> film (research becomes visual story)
    { from: "samal-network", to: "visual-story" },
    { from: "digital-archiving", to: "editing" },
    // film <-> media (work reaches an audience)
    { from: "documentary", to: "trt" },
    { from: "visual-story", to: "haberturk" },
    { from: "generative-video", to: "cross-platform" },
    // media <-> international
    { from: "cross-platform", to: "remote" },
    { from: "public-comm", to: "outreach" },
    // data <-> media (audience and campaign analysis)
    { from: "data-analysis", to: "cross-platform" },
    // education <-> film (teaching captured on video)
    { from: "beginner-method", to: "audiovisual" },
    // dh <-> international (research shared across borders)
    { from: "cultural-datasets", to: "institutions" },
    // sound <-> data (listening as data)
    { from: "deep-listening", to: "data-analysis" },
    // film internal + film <-> sound (camera work feeds the audiovisual work
    // and captures the live sessions) — connects the cinematography node
    { from: "cinematography", to: "audiovisual" },
    { from: "cinematography", to: "live-sessions" },
    // media <-> international (the Disney+ collaboration is a partnership and
    // cross-platform content) — connects the disney node
    { from: "disney", to: "cross-platform" },
    { from: "disney", to: "partnerships" },
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
    note: "Open to performances, workshops, residencies, and research collaborations. A short conversation is always welcome.",
    actions: [
      // Replace this placeholder address with your preferred contact email.
      { label: "hello@dogankaraca.com", url: "mailto:hello@dogankaraca.com" },
      { label: "dogankaraca.com", url: "https://dogankaraca.com" },
    ],
  },
};
