import { EditorialImage } from "@/components/media/editorial-image";
import { getSportArt } from "./sports-art";
export function SectionVisual({ slug }: { slug: string }) {
  const sport = getSportArt(slug);
  if (sport || slug === "sports" || slug === "sports/plans" || slug.startsWith("nutrition") || slug.startsWith("community")) {
    const src = slug.startsWith("nutrition") ? "/images/nutrition/balanced-plate.webp" : (sport?.slug === "swimming" ? "/images/swimming/pool-detail.webp" : sport?.slug === "strength" ? "/images/training/strength-detail.webp" : sport?.image) ?? (slug.startsWith("community") ? "/images/sports/outdoor-run.webp" : "/images/training/strength-detail.webp");
    const alt = slug.startsWith("nutrition") ? "原创营养视觉：三文鱼、蔬菜和谷物组成的一餐，非识别结果" : sport?.alt ?? "原创运动人物视觉";
    const smallSrc = (src.includes("/training/") || src.includes("/swimming/")) ? undefined : src.replace(".webp", "-480.webp");
    return <div className="section-visual section-photo"><EditorialImage src={src} smallSrc={smallSrc} width={sport?.width ?? (src.includes("balanced") ? 724 : 768)} height={sport?.height ?? (src.includes("balanced") ? 543 : 512)} alt={alt} /><div className="section-photo-shade" /><span>BUILT TO EVOLVE.</span></div>;
  }
  const kind = slug.startsWith("ai") ? "intelligence" : slug.startsWith("devices") ? "connection" : "potential";
  return <div className={`section-visual signal-sculpture signal-${kind}`} aria-hidden="true"><div className="signal-orbit orbit-one" /><div className="signal-orbit orbit-two" /><div className="signal-orbit orbit-three" /><div className="signal-core" /><i className="signal-node node-one" /><i className="signal-node node-two" /><span>{kind === "intelligence" ? "HUMAN × INTELLIGENCE" : kind === "connection" ? "CONNECTED, BY CHOICE" : "KNOW YOUR POTENTIAL"}</span></div>;
}
