/** Catálogo de personagens de teste */

export const CHARACTERS = [
  {
    id: "nyx",
    name: "Nyx",
    className: "Assassino",
    role: "assassin",
    level: 12,
    rarity: 4,
    awakened: 1,
    color: "#e85d4c",
    glyph: "⚔",
    base: {
      hp: 820,
      manaMax: 5,
      staminaMax: 100,
      damage: 96,
      defense: 28,
      critChance: 0.32,
      critDamage: 1.85,
      speed: 42,
    },
    passive: {
      name: "Lâmina Sombria",
      description: "Críticos ignoram 30% da defesa e causam +15% de dano.",
    },
    skill: {
      name: "Golpe Fantasma",
      description: "Consome 3 mana. Causa 220% do dano e aplica sangramento (8% do HP máx. em 3 ticks).",
      manaCost: 3,
      power: 2.2,
    },
  },
  {
    id: "gareth",
    name: "Gareth",
    className: "Tank",
    role: "tank",
    level: 12,
    rarity: 4,
    awakened: 1,
    color: "#3d8f7a",
    glyph: "🛡",
    base: {
      hp: 1480,
      manaMax: 5,
      staminaMax: 100,
      damage: 58,
      defense: 74,
      critChance: 0.12,
      critDamage: 1.45,
      speed: 22,
    },
    passive: {
      name: "Couraça Pesada",
      description: "Recebe 18% menos dano. Ao ser atingido, recupera 8 de estamina.",
    },
    skill: {
      name: "Muralha de Ferro",
      description: "Consome 3 mana. Causa 140% do dano e ganha escudo de 18% do HP máx.",
      manaCost: 3,
      power: 1.4,
    },
  },
];

/** Multiplicadores de raridade e despertar aplicados aos atributos ofensivos/defensivos */
function scaleFactor(rarity, awakened) {
  const rarityBonus = 1 + (rarity - 1) * 0.06;
  const awakenBonus = 1 + awakened * 0.1;
  return rarityBonus * awakenBonus;
}

export function createCombatant(template, side) {
  const factor = scaleFactor(template.rarity, template.awakened);
  const levelFactor = 1 + (template.level - 1) * 0.02;
  const m = factor * levelFactor;
  const b = template.base;

  return {
    id: template.id,
    side,
    name: template.name,
    className: template.className,
    role: template.role,
    level: template.level,
    rarity: template.rarity,
    awakened: template.awakened,
    color: template.color,
    glyph: template.glyph,
    passive: { ...template.passive },
    skill: { ...template.skill },
    maxHp: Math.round(b.hp * m),
    hp: Math.round(b.hp * m),
    manaMax: b.manaMax,
    mana: 0,
    staminaMax: b.staminaMax,
    stamina: 0,
    damage: Math.round(b.damage * m),
    defense: Math.round(b.defense * m),
    critChance: b.critChance,
    critDamage: b.critDamage,
    speed: b.speed,
    shield: 0,
    bleed: null, // { ticks, damagePerTick }
    alive: true,
  };
}

export function starsHtml(n) {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
}

export function awakenedLabel(n) {
  return n <= 0 ? "Base" : `Despertar ${n}`;
}
