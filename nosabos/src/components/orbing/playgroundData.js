import {
  Activity, ArrowUpRight, CheckCircle2, Cloud, Compass, Eye, Flame,
  Hand, Headphones, Heart, HeartHandshake, Moon, Music, Orbit,
  Rocket, RotateCcw, RotateCw, Shuffle, Sparkles, Zap,
} from "lucide-react";
export * from "../../achievements/orbPresets.js";
import { PLAYGROUND_REACTIONS as PRESET_REACTIONS } from "../../achievements/orbPresets.js";
const ICONS = { Activity, ArrowUpRight, CheckCircle2, Cloud, Compass, Eye, Flame, Hand, Headphones, Heart, HeartHandshake, Moon, Music, Orbit, Rocket, RotateCcw, RotateCw, Shuffle, Sparkles, Zap };
export const PLAYGROUND_REACTIONS = PRESET_REACTIONS.map(item => ({ ...item, icon: ICONS[item.icon] }));
