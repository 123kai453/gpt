import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { EditorialImage } from "@/components/media/editorial-image";
import type { SportArt } from "./sports-art";
export function SportCard({ sport, href = `/sports/${sport.slug}`, description, index }: { sport: SportArt; href?: string; description?: string; index?: string }) {
  return <Link href={href} className="editorial-sport-card" style={{ "--sport-accent": sport.accent } as CSSProperties}>
    <div className="sport-photo-frame"><EditorialImage src={sport.image} smallSrc={sport.image.replace(".webp", "-480.webp")} width={sport.width} height={sport.height} alt={sport.alt} /><div className="sport-photo-shade" /><span className="sport-card-index">{index ?? sport.english}</span><span className="sport-card-open" aria-hidden="true"><ArrowUpRight size={19} /></span></div>
    <div className="editorial-sport-caption"><span className="sport-english">{sport.english}</span><h2>{sport.title}</h2>{description && <p>{description}</p>}<span className="sport-phase">PHASE 3 · 尚未开放</span></div>
  </Link>;
}
