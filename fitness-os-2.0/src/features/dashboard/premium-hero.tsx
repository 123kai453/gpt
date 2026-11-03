"use client";
import Link from "next/link";
import { useRef, useSyncExternalStore, type PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { EditorialImage } from "@/components/media/editorial-image";
function subscribePointer(callback: () => void) {
  const query = window.matchMedia("(min-width: 900px) and (pointer: fine)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function readPointer() { return window.matchMedia("(min-width: 900px) and (pointer: fine)").matches; }
const particles = [[16, 21], [38, 75], [58, 18], [76, 62], [88, 36], [52, 82]];
export function PremiumHero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const desktop = useSyncExternalStore(subscribePointer, readPointer, () => false);
  const canMove = desktop && reduced === false;
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 65, damping: 24 });
  const y = useSpring(pointerY, { stiffness: 65, damping: 24 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scrollY = useTransform(scrollYProgress, [0, 1], [0, 32]);
  const combinedY = useTransform([y, scrollY], (values) => Number(values[0]) + Number(values[1]));
  function move(event: PointerEvent<HTMLElement>) {
    if (!canMove) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - bounds.left) / bounds.width - .5) * 12);
    pointerY.set(((event.clientY - bounds.top) / bounds.height - .5) * 8);
  }
  return <section ref={ref} className="premium-hero" aria-labelledby="hero-title" data-motion={canMove ? "enhanced" : "reduced"} onPointerMove={move} onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}>
    <motion.div className="hero-photograph" style={{ x: canMove ? x : 0, y: canMove ? combinedY : 0, scale: canMove ? 1.025 : 1 }}>
      <EditorialImage src="/images/hero/athlete-desktop.webp" smallSrc="/images/hero/athlete-desktop-960.webp" smallWidth={960} mobileSrc="/images/hero/athlete-mobile.webp" mobileSmallSrc="/images/hero/athlete-mobile-390.webp" width={1600} height={900} alt="原创匿名女性运动员半身主视觉，目光坚定，身着无品牌黑色训练服" priority sizes="(max-width: 767px) 100vw, 85vw" position="73% 42%" />
    </motion.div>
    <div className="hero-shade" />
    <div className="hero-light" aria-hidden="true" />
    <div className="hero-particles" aria-hidden="true">{particles.map(([left, top], i) => <i key={left} style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${i * -2.4}s` }} />)}</div>
    <div className="premium-hero-content">
      <motion.div className="hero-brand-line" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .6 }}><span className="brand-line-mark" />FITNESS OS<span className="hero-brand-index">THE HUMAN POTENTIAL</span></motion.div>
      <h1 id="hero-title"><motion.span initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .05 }}>突破极限，</motion.span><motion.span initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .16 }}>持续进化<span className="hero-period">。</span></motion.span></h1>
      <motion.div className="hero-copy-group" initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .28 }}>
        <p className="hero-english">PUSH BEYOND.<br />EVOLVE EVERY DAY.</p>
        <p className="hero-description">记录训练，理解身体，持续进步。</p>
        <div className="premium-hero-actions"><Link className="hero-primary-action" href="/explore">开始探索 <span>EXPLORE</span><ArrowUpRight size={18} /></Link><Link className="hero-secondary-action" href="/sports/strength">查看训练 <ArrowRight size={17} /></Link></div>
      </motion.div>
    </div>
    <div className="hero-bottom-line"><span><i />BUILT FOR YOUR LONG GAME</span><span>力量 / 速度 / 自律 / 进化</span></div>
    <span className="hero-vertical-caption" aria-hidden="true">A STUDY IN HUMAN POTENTIAL — 001</span>
  </section>;
}
