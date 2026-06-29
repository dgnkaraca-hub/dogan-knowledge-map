/* ============================================================
   icons.tsx
   ------------------------------------------------------------
   Maps each domain and leaf node to a lucide icon. Keeping this
   separate from mapData.ts lets the content file stay purely
   about words, while the visual layer decides how each node
   is drawn. Falls back to a neutral mark when no icon is set.
   ============================================================ */

import {
  Disc,
  AudioLines,
  Drum,
  Radio,
  Ear,
  Users,
  User,
  GraduationCap,
  BookOpen,
  UsersRound,
  Clapperboard,
  Camera,
  Scissors,
  Film,
  Video,
  Sparkles,
  BarChart3,
  Network,
  FileSearch,
  Map as MapIcon,
  PieChart,
  Workflow,
  Shapes,
  Archive,
  Database,
  Boxes,
  Tv,
  MonitorPlay,
  Star,
  Megaphone,
  Share2,
  Landmark,
  Tent,
  Send,
  Handshake,
  Globe,
  Music,
  Clapperboard as ClapDomain,
  Circle,
  type LucideIcon,
} from "lucide-react";
import type { NodeType } from "../data/mapData";

/** Icon used for each leaf node, keyed by its id. */
const CHILD_ICONS: Record<string, LucideIcon> = {
  // Sound
  "handpan-performance": Disc,
  "sound-art": AudioLines,
  percussion: Drum,
  "live-sessions": Radio,
  "deep-listening": Ear,
  // Education
  workshops: Users,
  private: User,
  academic: GraduationCap,
  "beginner-method": BookOpen,
  community: UsersRound,
  // Film
  "visual-story": Clapperboard,
  cinematography: Camera,
  editing: Scissors,
  documentary: Film,
  audiovisual: Video,
  "generative-video": Sparkles,
  // Data
  "data-analysis": BarChart3,
  "network-analysis": Network,
  "text-mining": FileSearch,
  spatial: MapIcon,
  dataviz: PieChart,
  // Digital Humanities
  "samal-network": Workflow,
  "gobekli-network": Shapes,
  "digital-archiving": Archive,
  "cultural-datasets": Database,
  "knowledge-modeling": Boxes,
  // Media
  trt: Tv,
  haberturk: MonitorPlay,
  disney: Star,
  "public-comm": Megaphone,
  "cross-platform": Share2,
  // International
  institutions: Landmark,
  festivals: Tent,
  outreach: Send,
  partnerships: Handshake,
  remote: Globe,
};

/** Icon used for each domain hub, keyed by domain id. */
const DOMAIN_ICONS: Record<string, LucideIcon> = {
  sound: Music,
  education: GraduationCap,
  film: ClapDomain,
  data: BarChart3,
  dh: Workflow,
  media: Tv,
  international: Globe,
};

/** Neutral fallbacks per node type. */
const TYPE_FALLBACK: Record<NodeType, LucideIcon> = {
  practice: Disc,
  skill: Boxes,
  workshop: Users,
  research: Workflow,
  project: Share2,
  media: Tv,
};

export function iconForChild(id: string, type: NodeType): LucideIcon {
  return CHILD_ICONS[id] ?? TYPE_FALLBACK[type] ?? Circle;
}

export function iconForDomain(id: string): LucideIcon {
  return DOMAIN_ICONS[id] ?? Circle;
}
