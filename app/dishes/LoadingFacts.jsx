"use client";
import { useEffect, useState } from "react";

// Motivational plant-based facts shown while dishes load — a kinder loading screen.
// `w` is a relative weight: the big-picture "if we all went plant-based" facts are
// weighted higher (3×) so they show up more often than the everyday ones.
const PLANT_FACTS = [
  { w: 3, t: "🌍 If the world went fully plant-based, we could free up almost 75% of farmland — room to rewild and let nature breathe. 🌳" },
  { w: 3, t: "🐮 If we all committed to plant-based, we'd spare over 200 billion animals every year. Imagine that much kindness. 💚" },
  { w: 3, t: "💧 If we all went plant-based, we'd save around 50% of the water used in agriculture. Every meal is a drop that adds up. 🌊" },
  { w: 3, t: "🦠 Did you know? Up to 80% of the world's antibiotics go to farmed animals, not people — fueling drug-resistant superbugs. Going plant-based helps keep our life-saving medicines working. 💊" },
  { w: 1, t: "💧 Did you know? Going plant-based for a day can save around 1,100 gallons of water — small plates, big ripples. 🌊" },
  { w: 1, t: "🌳 Each plant-based day spares roughly 30 sq ft of forest. Let's grow something kinder together. 🌱" },
  { w: 1, t: "🐮 Going plant-based can save around 200 animal lives a year — that's over 1,000 friends in just five years. 💚" },
  { w: 1, t: "☁️ A single plant-based day can cut about 20 lbs of CO₂. Cooking dinner can help cool the planet. 🌍" },
  { w: 1, t: "🐷 Every meat-free meal is a small act of kindness. Let's make the kinder choice. 🐑" },
  { w: 1, t: "🐔 Choosing plants even a few times a week spares hundreds of lives a year. 🐥" },
  { w: 1, t: "🌎 Plant-based eating uses a fraction of the land and water of animal farming — same plate, lighter footprint. 🌿" },
  { w: 1, t: "🐟 Going plant-based helps keep our oceans full of fish, not nets. 🌊" },
  { w: 1, t: "💚 Good food, done kindly. Thanks for cooking with compassion. 🐰" },
];

const TOTAL_WEIGHT = PLANT_FACTS.reduce((s, f) => s + f.w, 0);

// Weighted random index; re-rolls to avoid repeating the one currently shown.
function pickWeighted(exclude = -1) {
  for (let tries = 0; tries < 8; tries++) {
    let r = Math.random() * TOTAL_WEIGHT;
    for (let k = 0; k < PLANT_FACTS.length; k++) {
      r -= PLANT_FACTS[k].w;
      if (r < 0) {
        if (k !== exclude) return k;
        break; // landed on the current one — re-roll
      }
    }
  }
  return (exclude + 1) % PLANT_FACTS.length;
}

export function LoadingFacts() {
  // Start at 0 for a stable first paint, then weighted-pick + rotate on the client.
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(pickWeighted());
    const t = setInterval(() => setI((p) => pickWeighted(p)), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="empty-state">
      <div style={{ fontSize: 40, marginBottom: 8 }} aria-hidden>🌱</div>
      <h3>Plating up kinder recipes…</h3>
      <p
        key={i}
        style={{
          maxWidth: 500,
          margin: "16px auto 0",
          lineHeight: 1.6,
          fontSize: 15.5,
          color: "var(--moss, #1e4d2b)",
          transition: "opacity 0.4s ease",
        }}
      >
        {PLANT_FACTS[i].t}
      </p>
    </div>
  );
}
