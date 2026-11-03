export interface SportArt {
  slug: string; title: string; english: string; image: string; alt: string; width: number; height: number; accent: string;
}
export const sportsArt: readonly SportArt[] = [
  { slug: "strength", title: "力量训练", english: "STRENGTH", image: "/images/sports/strength.webp", alt: "原创力量运动视觉：女性运动员进行哑铃训练", width: 768, height: 512, accent: "#c8f270" },
  { slug: "swimming", title: "游泳", english: "SWIMMING", image: "/images/sports/swimming.webp", alt: "原创游泳视觉：戴泳帽与泳镜的运动员在泳池边", width: 768, height: 512, accent: "#6ac6ff" },
  { slug: "outdoor-run", title: "户外跑步", english: "OUTDOOR RUNNING", image: "/images/sports/outdoor-run.webp", alt: "原创跑步视觉：晨光中在田径跑道奔跑的女性运动员", width: 768, height: 512, accent: "#aabaff" },
  { slug: "treadmill", title: "跑步机爬坡", english: "TREADMILL", image: "/images/sports/treadmill.webp", alt: "原创爬坡视觉：男性运动员在倾斜跑步机上训练", width: 768, height: 512, accent: "#a9bfff" },
  { slug: "indoor-cycle", title: "室内动感单车", english: "INDOOR CYCLING", image: "/images/sports/indoor-cycle.webp", alt: "原创骑行视觉：女性运动员使用室内动感单车", width: 768, height: 512, accent: "#8cb6ff" },
  { slug: "hike", title: "徒步与登山", english: "HIKING", image: "/images/sports/hike.webp", alt: "原创户外视觉：背负背包的徒步者走在山脊", width: 768, height: 512, accent: "#d6bd8b" },
  { slug: "elliptical", title: "椭圆机", english: "ELLIPTICAL", image: "/images/sports/elliptical.webp", alt: "原创运动视觉：女性运动员使用带长踏板和活动扶手的椭圆机", width: 768, height: 512, accent: "#7bd8ca" },
  { slug: "rowing", title: "划船机", english: "ROWING", image: "/images/sports/rowing.webp", alt: "原创运动视觉：男性运动员使用室内划船测功仪", width: 768, height: 512, accent: "#91c8e6" },
  { slug: "jump-rope", title: "跳绳", english: "JUMP ROPE", image: "/images/sports/jump-rope.webp", alt: "原创运动视觉：女性运动员在跳绳，绳索与手柄可见", width: 724, height: 543, accent: "#c4b8ef" },
  { slug: "stair-climber", title: "登山机", english: "STAIR CLIMBER", image: "/images/sports/stair-climber.webp", alt: "原创运动视觉：男性运动员使用有旋转台阶的登山机", width: 724, height: 543, accent: "#9dbeec" },
  { slug: "other", title: "其他运动", english: "YOUR MOVEMENT", image: "/images/sports/other.webp", alt: "原创运动视觉：女性运动员在瑜伽垫上进行平衡练习", width: 724, height: 543, accent: "#b8c3b0" },
];
export function getSportArt(slug: string) { return sportsArt.find((sport) => sport.slug === slug.replace(/^sports\//, "")); }
