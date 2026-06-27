"use client";
import { useEffect, useState } from "react";

// Motivational plant-based facts shown while dishes load — a kinder loading screen.
// Figures: ~200 animal lives/yr from the plant-based guide; the well-known per-day
// water / land / CO2 savings of a plant-based diet. Phrased warmly for users.
const PLANT_FACTS = [
  "💧 Did you know? Going plant-based for a day can save around 1,100 gallons of water — small plates, big ripples. 🌊",
  "🌳 Each plant-based day spares roughly 30 sq ft of forest. Let's grow something kinder together. 🌱",
  "🐮 Going plant-based can save around 200 animal lives a year — that's over 1,000 friends in just five years. 💚",
  "☁️ A single plant-based day can cut about 20 lbs of CO₂. Cooking dinner can help cool the planet. 🌍",
  "🐷 Every meat-free meal is a small act of kindness. Let's make the kinder choice. 🐑",
  "🐔 Choosing plants even a few times a week spares hundreds of lives a year. 🐥",
  "🌎 Plant-based eating uses a fraction of the land and water of animal farming — same plate, lighter footprint. 🌿",
  "🐟 Going plant-based helps keep our oceans full of fish, not nets. 🌊",
  "🌍 If the world went fully plant-based, we could free up almost 75% of farmland — room to rewild and let nature breathe. 🌳",
  "🐮 If we all committed to plant-based, we'd spare over 200 billion animals every year. Imagine that much kindness. 💚",
  "💧 If we all went plant-based, we'd save around 50% of the water used in agriculture. Every meal is a drop that adds up. 🌊",
  "🦠 Did you know? Up to 80% of the world's antibiotics go to farmed animals, not people — fueling drug-resistant superbugs. Going plant-based helps keep our life-saving medicines working. 💊",
  "💚 Good food, done kindly. Thanks for cooking with compassion. 🐰",
];

export function LoadingFacts() {
  // Start at 0 for a stable first paint, then randomize + rotate on the client.
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(Math.floor(Math.random() * PLANT_FACTS.length));
    const t = setInterval(() => setI((p) => (p + 1) % PLANT_FACTS.length), 6000);
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
        {PLANT_FACTS[i]}
      </p>
    </div>
  );
}
