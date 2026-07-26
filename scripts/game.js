(() => {
  "use strict";

  (function ensureStyles() {
    if (document.getElementById("arena-inline-css")) return;
    fetch("/styles/style.css?v=31")
      .then(function (r) { return r.text(); })
      .then(function (css) {
        if (document.getElementById("arena-inline-css")) return;
        var s = document.createElement("style");
        s.id = "arena-inline-css";
        s.textContent = css;
        document.head.appendChild(s);
      })
      .catch(function () {});
  })();

  const SLOT_ORDER = ["front", "back0", "back1"];
  const SLOT_LABELS = { front: "Frente", back0: "Trás 1", back1: "Trás 2" };

  const RARITY_BONUS = {
    tank: { hp: 0.5, defense: 0.5, damage: 0.2, speed: 0.05, critChance: 0.02, critDamage: 0.05, skill: 0.2 },
    assassin: { hp: 0.2, defense: 0.15, damage: 0.35, speed: 0.12, critChance: 0.08, critDamage: 0.2, skill: 0.4 },
    mage: { hp: 0.1, defense: 0.05, damage: 0.1, speed: 0.3, critChance: 0.03, critDamage: 0.08, skill: 0.65 },
    fighter: { hp: 0.35, defense: 0.35, damage: 0.35, speed: 0.1, critChance: 0.05, critDamage: 0.05, skill: 0.3 },
    support_heal: { hp: 0.15, defense: 0.1, damage: 0.05, speed: 0.18, critChance: 0.02, critDamage: 0.05, skill: 0.55 },
    support_control: { hp: 0.25, defense: 0.25, damage: 0.12, speed: 0.14, critChance: 0.03, critDamage: 0.08, skill: 0.45 },
  };

  const CHARACTERS = [
    {
      id: "nyx", name: "Nyx", className: "Assassino", role: "assassin",
      defaults: { level: 10, rarity: 3, awakened: 0 }, color: "#e85d4c", glyph: "⚔",
      base: { hp: 720, manaMax: 5, staminaMax: 100, damage: 82, defense: 24, critChance: 0.22, critDamage: 1.7, speed: 40 },
      passiveName: "Lâmina Sombria", skillName: "Golpe Fantasma", skillManaCost: 3, skillBasePower: 2.0,
    },
    {
      id: "gareth", name: "Gareth", className: "Tank", role: "tank",
      defaults: { level: 10, rarity: 3, awakened: 0 }, color: "#3d8f7a", glyph: "🛡",
      base: { hp: 1280, manaMax: 5, staminaMax: 100, damage: 52, defense: 68, critChance: 0.08, critDamage: 1.35, speed: 20 },
      passiveName: "Couraça Pesada", skillName: "Muralha de Ferro", skillManaCost: 3, skillBasePower: 1.3,
      kit: "guard",
    },
    {
      id: "lyra", name: "Lyra", className: "Mago", role: "mage",
      defaults: { level: 10, rarity: 3, awakened: 0 }, color: "#6c8cff", glyph: "✦",
      base: { hp: 640, manaMax: 5, staminaMax: 100, damage: 70, defense: 20, critChance: 0.14, critDamage: 1.55, speed: 46 },
      passiveName: "Catalisador Arcano", skillName: "Meteoro Arcano", skillManaCost: 3, skillBasePower: 2.4,
    },
    {
      id: "kael", name: "Kael", className: "Lutador", role: "fighter",
      defaults: { level: 10, rarity: 3, awakened: 0 }, color: "#d4a017", glyph: "✊",
      base: { hp: 960, manaMax: 5, staminaMax: 100, damage: 74, defense: 42, critChance: 0.16, critDamage: 1.5, speed: 30 },
      passiveName: "Espírito de Luta", skillName: "Rajada de Golpes", skillManaCost: 3, skillBasePower: 1.8,
      kit: "brawler",
    },
    {
      id: "mira", name: "Mira", className: "Suporte", role: "support_heal",
      defaults: { level: 10, rarity: 3, awakened: 0 }, color: "#7bc67e", glyph: "✚",
      base: { hp: 680, manaMax: 5, staminaMax: 100, damage: 38, defense: 22, critChance: 0.1, critDamage: 1.35, speed: 34 },
      passiveName: "Aura Vital", skillName: "Benção Renovadora", skillManaCost: 3, skillBasePower: 1.0,
    },
    {
      id: "nox", name: "Nox", className: "Controle", role: "support_control",
      defaults: { level: 10, rarity: 3, awakened: 0 }, color: "#9b6bff", glyph: "🕸",
      base: { hp: 860, manaMax: 5, staminaMax: 100, damage: 48, defense: 40, critChance: 0.12, critDamage: 1.4, speed: 28 },
      passiveName: "Correntes Sombrias", skillName: "Campo de Supressão", skillManaCost: 3, skillBasePower: 1.1,
    },
    {
      id: "rook", name: "Rook", className: "Tank", role: "tank",
      defaults: { level: 10, rarity: 3, awakened: 0 }, color: "#5a8f9c", glyph: "⬡",
      base: { hp: 1200, manaMax: 5, staminaMax: 100, damage: 48, defense: 72, critChance: 0.08, critDamage: 1.3, speed: 18 },
      passiveName: "Couraça Viva", skillName: "Fortaleza Espinhosa", skillManaCost: 3, skillBasePower: 1.15,
      kit: "fortress",
    },
    {
      id: "brutus", name: "Brutus", className: "Lutador", role: "fighter",
      defaults: { level: 10, rarity: 3, awakened: 0 }, color: "#c45c26", glyph: "⚒",
      base: { hp: 920, manaMax: 5, staminaMax: 100, damage: 78, defense: 40, critChance: 0.15, critDamage: 1.55, speed: 28 },
      passiveName: "Quebra-Muralha", skillName: "Golpe Demolidor", skillManaCost: 3, skillBasePower: 2.0,
      kit: "antitank",
    },
  ];

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function pct(n) { return Math.round(n * 100) + "%"; }
  function starsHtml(n) { return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n)); }
  function awakenedLabel(n) { return n <= 0 ? "Base" : "Despertar " + n; }
  /**
   * Curva de combate por nível (referência nv10 = 1.0x).
   * HP/dano/defesa sobem ~linear com o nível, o que deixa 1 peça
   * forte o bastante para encarar ~2 da metade do nível
   * (10 vs 2×5, 20 vs 2×10, 30 vs 2×15, 40 vs 2×20).
   * Acima do 30 há um leve reforço para nv50 ≈ 2×30.
   */
  function levelMult(level) {
    const L = clamp(level, 1, 50);
    let m = L / 10;
    if (L > 30) {
      const t = (L - 30) / 20;
      m *= 1 + 0.2 * t;
    }
    return m;
  }

  /** Velocidade sobe bem menos que HP/dano, para não virar só “quem age mais”. */
  function speedLevelMult(level) {
    const L = clamp(level, 1, 50);
    return Math.pow(L / 10, 0.35);
  }

  function rarityStars(rarity) { return clamp(rarity, 1, 5); }
  function rarityMult(rate, rarity) { return 1 + rarityStars(rarity) * rate; }

  function getTemplate(id) {
    return CHARACTERS.find(function (c) { return c.id === id; });
  }

  function makePick(id, overrides) {
    const t = getTemplate(id);
    const o = overrides || {};
    return {
      id: t.id,
      level: clamp(o.level != null ? o.level : t.defaults.level, 1, 50),
      rarity: clamp(o.rarity != null ? o.rarity : t.defaults.rarity, 1, 5),
      awakened: clamp(o.awakened != null ? o.awakened : t.defaults.awakened, 0, 3),
    };
  }

  function emptyTeam() {
    return { front: null, back0: null, back1: null };
  }

  function resolveAbilities(template, rarity, awakened) {
    const a = awakened;
    const rb = RARITY_BONUS[template.role] || RARITY_BONUS.fighter;
    const skillMult = rarityMult(rb.skill, rarity);
    const kit = template.kit || template.role;

    if (template.role === "assassin") {
      const passive = {
        critIgnoreDef: 0.2 + a * 0.05, critBonusDmg: 0.1 + a * 0.05,
        critStaminaRestore: a >= 1 ? 4 + a * 3 : 0,
        critBleedTicks: a >= 2 ? a - 1 : 0, critBleedPct: a >= 2 ? 0.03 + a * 0.01 : 0,
        critChanceBonus: a >= 3 ? 0.06 : 0,
      };
      const skill = {
        name: template.skillName, manaCost: template.skillManaCost,
        power: template.skillBasePower * skillMult * (1 + a * 0.07),
        ignoreDef: 0.1 + a * 0.05, bleedPct: 0.06 + a * 0.015,
        bleedTicks: 3 + (a >= 1 ? 1 : 0) + (a >= 3 ? 1 : 0),
        staminaDrain: a >= 1 ? 8 + a * 6 : 0, targetMode: "front",
      };
      return pack(template, passive, skill,
        "Críticos ignoram " + pct(passive.critIgnoreDef) + " da defesa e causam +" + pct(passive.critBonusDmg) + " de dano.",
        "Golpe na frente: " + Math.round(skill.power * 100) + "% do dano + sangramento.");
    }

    if (template.role === "tank" && kit === "fortress") {
      const passive = {
        damageReduction: 0.1 + a * 0.03,
        reflectPct: 0.1 + a * 0.04,
        regenPerSec: 0.008 + a * 0.003,
        defenseStackOnHit: 0.03 + a * 0.01,
        maxDefenseStacks: 4 + a,
        staminaOnHit: 4 + a * 2,
      };
      const skill = {
        name: template.skillName, manaCost: template.skillManaCost,
        power: template.skillBasePower * skillMult * (1 + a * 0.05),
        targetMode: "front",
        selfDefenseBuff: 0.35 + a * 0.08,
        selfRegenBuff: 0.02 + a * 0.008,
        reflectBuff: 0.12 + a * 0.04,
        buffDuration: 6 + a,
      };
      return pack(template, passive, skill,
        "Regenera " + pct(passive.regenPerSec) + " HP/s, reflete " + pct(passive.reflectPct) + " e ganha defesa ao ser atingido.",
        "Fortalece a si: +" + pct(skill.selfDefenseBuff) + " defesa, regen e reflexo por " + skill.buffDuration + "s.");
    }

    if (template.role === "tank") {
      const passive = {
        damageReduction: 0.14 + a * 0.035, staminaOnHit: 5 + a * 3,
        shieldOnHitPct: a >= 1 ? 0.015 + a * 0.008 : 0,
        reflectPct: a >= 2 ? 0.04 + a * 0.015 : 0,
      };
      const skill = {
        name: template.skillName, manaCost: template.skillManaCost,
        power: template.skillBasePower * skillMult * (1 + a * 0.06),
        targetMode: "front",
        shieldPct: 0.14 + a * 0.03,
        selfHealPct: a >= 1 ? 0.04 + a * 0.015 : 0,
        enemyStaminaDrain: a >= 2 ? 12 + a * 4 : 0,
      };
      return pack(template, passive, skill,
        "Recebe " + pct(passive.damageReduction) + " menos dano. Ao ser atingido, recupera estamina.",
        "Causa " + Math.round(skill.power * 100) + "% no frente e ganha escudo de " + pct(skill.shieldPct) + " HP.");
    }

    if (template.role === "mage") {
      const passive = {
        skillPowerBonus: 0.12 + a * 0.05, basicManaChance: 0.15 + a * 0.05,
        afterSkillStamina: a >= 1 ? 10 + a * 4 : 0,
      };
      const skill = {
        name: template.skillName, manaCost: template.skillManaCost,
        power: template.skillBasePower * skillMult * (1 + a * 0.08) * (1 + passive.skillPowerBonus),
        targetMode: "front",
        ignoreDef: 0.2 + a * 0.06, staminaDrain: 10 + a * 5,
        burnTicks: 2 + (a >= 1 ? 1 : 0), burnPct: 0.05 + a * 0.015,
      };
      return pack(template, passive, skill,
        "Skills +" + pct(passive.skillPowerBonus) + ". Básicos podem gerar +1 mana.",
        "Meteoro na frente: " + Math.round(skill.power * 100) + "% + queimadura.");
    }

    if (template.role === "fighter" && kit === "antitank") {
      const passive = {
        bonusVsTank: 0.45 + a * 0.1,
        ignoreTankDr: 0.35 + a * 0.1,
        ignoreDefVsTank: 0.2 + a * 0.05,
        lowHpDamageBonus: a >= 2 ? 0.12 : 0,
      };
      const skill = {
        name: template.skillName, manaCost: template.skillManaCost,
        power: template.skillBasePower * skillMult * (1 + a * 0.07),
        targetMode: "front",
        antitankPowerBonus: 0.5 + a * 0.12,
        ignoreDef: 0.15 + a * 0.05,
        defenseShred: 0.15 + a * 0.05,
        shredDuration: 5 + a,
      };
      return pack(template, passive, skill,
        "+" + pct(passive.bonusVsTank) + " dano vs Tanks e ignora parte da redução/defesa deles.",
        "Golpe anti-tank na frente: dano extra vs tank e reduz defesa do alvo.");
    }

    if (template.role === "fighter") {
      const passive = {
        lowHpDamageBonus: 0.18 + a * 0.05, lowHpThreshold: 0.5,
        lifestealBasic: a >= 1 ? 0.06 + a * 0.02 : 0,
        stackDamage: a >= 2 ? 0.04 + a * 0.01 : 0, maxStacks: a >= 2 ? 3 + a : 0,
      };
      const skill = {
        name: template.skillName, manaCost: template.skillManaCost,
        power: template.skillBasePower * skillMult * (1 + a * 0.07),
        targetMode: "front", hits: 2 + (a >= 1 ? 1 : 0),
        lifestealPct: 0.1 + a * 0.04,
        selfBuffDamage: a >= 2 ? 0.12 + a * 0.04 : 0, selfBuffAttacks: a >= 2 ? 2 + a : 0,
      };
      return pack(template, passive, skill,
        "Abaixo de 50% HP causa +" + pct(passive.lowHpDamageBonus) + " de dano.",
        "Rajada na frente: " + skill.hits + " golpes e roubo de vida.");
    }

    if (template.role === "support_heal") {
      const passive = {
        auraHealPerSec: 0.004 + a * 0.002,
        basicHealRatio: 0.9 + a * 0.15,
        basicDamageRatio: 0.3,
        allyDamageBuff: a >= 1 ? 0.08 + a * 0.03 : 0,
      };
      const skill = {
        name: template.skillName, manaCost: template.skillManaCost,
        power: 0,
        healPower: (1.1 + a * 0.15) * skillMult,
        healAllRatio: 0.55 + a * 0.08,
        allyAtkBuff: 0.18 + a * 0.05,
        allyDefBuff: 0.12 + a * 0.04,
        buffDuration: 5 + a,
        targetMode: "ally_heal",
      };
      return pack(template, passive, skill,
        "Frágil. Aura cura aliados (" + pct(passive.auraHealPerSec) + " HP/s). Básico cura o mais ferido.",
        "Cura o aliado mais ferido, regenera o time por " + skill.buffDuration + "s e buffa ataque/defesa.");
    }

    // support_control
    const passive = {
      damageReduction: 0.08 + a * 0.02,
      basicSlow: 0.12 + a * 0.03,
      basicAtkDown: 0.08 + a * 0.02,
      debuffDuration: 3 + a,
    };
    const skill = {
      name: template.skillName, manaCost: template.skillManaCost,
      power: template.skillBasePower * skillMult * (1 + a * 0.05),
      targetMode: "enemy_all",
      aoeAtkDown: 0.22 + a * 0.05,
      aoeSlow: 0.25 + a * 0.05,
      aoeMark: a >= 2 ? 0.12 + a * 0.03 : 0,
      debuffDuration: 5 + a,
      staminaDrainAll: 8 + a * 3,
    };
      return pack(template, passive, skill,
        "Mais resistente. Básicos (na frente) aplicam lentidão e redução de ataque.",
        "Suprime o time inimigo inteiro: menos ataque, lentidão" + (skill.aoeMark ? " e marca de dano" : "") + ".");
    }

  function pack(template, passive, skill, pDesc, sDesc) {
    return {
      passive: passive, skill: skill,
      passiveName: template.passiveName, skillName: template.skillName,
      passiveDesc: pDesc, skillDesc: "Consome " + skill.manaCost + " mana. " + sDesc,
    };
  }

  function createCombatant(pick, team, slot) {
    const template = getTemplate(pick.id);
    const level = clamp(pick.level, 1, 50);
    const rarity = clamp(pick.rarity, 1, 5);
    const awakened = clamp(pick.awakened, 0, 3);
    const lm = levelMult(level);
    const speedLm = speedLevelMult(level);
    const rb = RARITY_BONUS[template.role] || RARITY_BONUS.fighter;
    const abilities = resolveAbilities(template, rarity, awakened);
    const b = template.base;
    const maxHp = Math.round(b.hp * lm * rarityMult(rb.hp, rarity));

    return {
      id: template.id,
      uid: team + "-" + slot,
      team: team,
      slot: slot,
      line: slot === "front" ? "front" : "back",
      name: template.name,
      className: template.className,
      role: template.role,
      kit: template.kit || template.role,
      level: level, rarity: rarity, awakened: awakened,
      color: template.color, glyph: template.glyph,
      passiveName: abilities.passiveName, passiveDesc: abilities.passiveDesc,
      passive: abilities.passive,
      skill: abilities.skill, skillDesc: abilities.skillDesc,
      maxHp: maxHp, hp: maxHp,
      manaMax: b.manaMax, mana: 2,
      staminaMax: b.staminaMax, stamina: 10 + Math.random() * 20,
      damage: Math.round(b.damage * lm * rarityMult(rb.damage, rarity)),
      defense: Math.round(b.defense * lm * rarityMult(rb.defense, rarity)),
      baseDefense: 0,
      critChance: clamp(b.critChance + rarityStars(rarity) * rb.critChance + (abilities.passive.critChanceBonus || 0), 0, 0.95),
      critDamage: b.critDamage + rarityStars(rarity) * rb.critDamage,
      speed: Math.round(b.speed * speedLm * rarityMult(rb.speed, rarity)),
      shield: 0, bleed: null, fightStacks: 0,
      buffAttacksLeft: 0, buffDamageBonus: 0,
      defenseStacks: 0,
      atkMul: 1, defMul: 1, speedMul: 1, markMul: 1,
      buffTimer: 0, debuffTimer: 0, regenBonus: 0, reflectBonus: 0,
      healBuffTimer: 0, healBuffPerSec: 0,
      alive: true,
    };
  }

  /* ========== Battle helpers ========== */
  const BASE_STAMINA_PER_SEC = 12;
  const SPEED_TO_STAMINA = 0.55;
  const DEFENSE_FACTOR = 0.45;

  function rollCrit(chance) { return Math.random() < chance; }

  function aliveOf(list) { return list.filter(function (f) { return f.alive; }); }

  function frontOf(team) {
    return team.find(function (f) { return f.slot === "front" && f.alive; }) || null;
  }

  function backlineOf(team) {
    return team.filter(function (f) { return f.line === "back" && f.alive; });
  }

  function lowestHp(list) {
    const a = aliveOf(list);
    if (!a.length) return null;
    return a.reduce(function (best, f) { return f.hp < best.hp ? f : best; });
  }

  /** Ataques e skills ofensivas focam o tank/frente (fallback: qualquer vivo). */
  function pickFrontTarget(enemies) {
    const all = aliveOf(enemies);
    if (!all.length) return null;
    return frontOf(enemies) || all[0];
  }

  function pickBasicTarget(_attacker, enemies) {
    return pickFrontTarget(enemies);
  }

  function applyDamage(target, amount) {
    let remaining = amount;
    let absorbed = 0;
    if (target.shield > 0) {
      absorbed = Math.min(target.shield, remaining);
      target.shield -= absorbed;
      remaining -= absorbed;
    }
    target.hp = clamp(target.hp - remaining, 0, target.maxHp);
    if (target.hp <= 0) target.alive = false;
    return { dealt: remaining, absorbed: absorbed };
  }

  function mitigate(defender, dmg, attacker) {
    let dr = defender.passive && defender.passive.damageReduction ? defender.passive.damageReduction : 0;
    if (attacker && attacker.passive && attacker.passive.ignoreTankDr && defender.role === "tank") {
      dr *= 1 - attacker.passive.ignoreTankDr;
    }
    let out = dmg * (1 - dr);
    out *= defender.markMul || 1;
    return Math.max(1, Math.round(out));
  }

  function effectiveDefense(f) {
    const stackBonus = 1 + (f.defenseStacks || 0) * ((f.passive && f.passive.defenseStackOnHit) || 0);
    return f.defense * (f.defMul || 1) * stackBonus;
  }

  function applyDot(target, pctHp, ticks, type) {
    if (ticks <= 0 || pctHp <= 0) return;
    const per = Math.max(1, Math.round(target.maxHp * pctHp));
    const kind = type || "bleed";
    if (target.bleed && target.bleed.ticks > 0) {
      target.bleed.ticks = Math.max(target.bleed.ticks, ticks);
      target.bleed.damagePerTick = Math.max(target.bleed.damagePerTick, per);
      target.bleed.type = kind;
    } else {
      target.bleed = { ticks: ticks, damagePerTick: per, acc: 0, type: kind };
    }
  }

  function Battle(teamA, teamB, hooks) {
    this.teamA = teamA;
    this.teamB = teamB;
    this.all = teamA.concat(teamB);
    this.hooks = hooks || {};
    this.log = [];
    this.elapsed = 0;
    this.over = false;
    this.winnerTeam = null;
    this._push("Luta 3x3 iniciada!", "system");
  }

  Battle.prototype._push = function (text, kind, side) {
    const entry = { side: side || null, text: text, kind: kind || "info", t: performance.now() };
    this.log.push(entry);
    if (this.hooks.onLog) this.hooks.onLog(entry);
  };

  Battle.prototype._enemies = function (f) {
    return f.team === "a" ? this.teamB : this.teamA;
  };

  Battle.prototype._allies = function (f) {
    return f.team === "a" ? this.teamA : this.teamB;
  };

  Battle.prototype._checkEnd = function () {
    if (this.over) return true;
    // Só acaba quando TODOS de um time estão mortos
    const aAlive = aliveOf(this.teamA);
    const bAlive = aliveOf(this.teamB);
    if (aAlive.length > 0 && bAlive.length > 0) return false;

    this.over = true;
    if (aAlive.length === 0 && bAlive.length === 0) {
      this.winnerTeam = null;
      this._push("Empate — ambos os times foram derrotados!", "system");
    } else {
      this.winnerTeam = aAlive.length > 0 ? "a" : "b";
      const survivors = (this.winnerTeam === "a" ? aAlive : bAlive)
        .map(function (f) { return f.name; })
        .join(", ");
      this._push(
        "Time " + this.winnerTeam.toUpperCase() + " venceu! Sobreviventes: " + survivors,
        "system"
      );
    }
    if (this.hooks.onEnd) this.hooks.onEnd(this.winnerTeam);
    return true;
  };

  Battle.prototype._hasAuraHealer = function (f) {
    const allies = this._allies(f);
    for (let i = 0; i < allies.length; i++) {
      const s = allies[i];
      if (s.alive && s.uid !== f.uid && s.passive && s.passive.auraHealPerSec) return true;
    }
    return false;
  };

  Battle.prototype._tickStatus = function (f, dt) {
    if (!f.alive) return;
    if (f.buffTimer > 0) {
      f.buffTimer -= dt;
      if (f.buffTimer <= 0) {
        f.atkMul = 1; f.defMul = 1; f.regenBonus = 0; f.reflectBonus = 0; f.buffTimer = 0;
      }
    }
    if (f.debuffTimer > 0) {
      f.debuffTimer -= dt;
      if (f.debuffTimer <= 0) {
        f.atkMul = Math.max(1, f.atkMul);
        // reset debuff parts carefully
        if (f.atkMul < 1) f.atkMul = 1;
        f.speedMul = 1; f.markMul = 1; f.debuffTimer = 0;
      }
    }
    if (f.healBuffTimer > 0) {
      f.healBuffTimer -= dt;
      if (f.healBuffPerSec > 0) {
        f.hp = clamp(f.hp + f.maxHp * f.healBuffPerSec * dt, 0, f.maxHp);
      }
      if (f.healBuffTimer <= 0) {
        f.healBuffTimer = 0;
        f.healBuffPerSec = 0;
      }
    }
    const regen = ((f.passive && f.passive.regenPerSec) || 0) + (f.regenBonus || 0);
    if (regen > 0) {
      f.hp = clamp(f.hp + f.maxHp * regen * dt, 0, f.maxHp);
    }
    // aura heal from support allies
    const allies = this._allies(f);
    for (let i = 0; i < allies.length; i++) {
      const s = allies[i];
      if (!s.alive || s.uid === f.uid) continue;
      if (s.passive && s.passive.auraHealPerSec) {
        f.hp = clamp(f.hp + f.maxHp * s.passive.auraHealPerSec * dt, 0, f.maxHp);
      }
    }
  };

  Battle.prototype._tickBleed = function (fighter, dt) {
    if (!fighter.bleed || !fighter.alive) return;
    fighter.bleed.acc = (fighter.bleed.acc || 0) + dt;
    while (fighter.bleed && fighter.bleed.acc >= 1 && fighter.bleed.ticks > 0) {
      fighter.bleed.acc -= 1;
      fighter.bleed.ticks -= 1;
      const dealt = applyDamage(fighter, fighter.bleed.damagePerTick).dealt;
      const name = fighter.bleed.type === "burn" ? "queimadura" : "sangramento";
      this._push(fighter.name + " sofre " + dealt + " de " + name, "dot", fighter.team);
      if (this.hooks.onHit) this.hooks.onHit(fighter, dealt, false, "bleed");
      if (!fighter.alive) { this._checkEnd(); return; }
      if (fighter.bleed.ticks <= 0) fighter.bleed = null;
    }
  };

  Battle.prototype._afterHit = function (defender, attacker, dealt) {
    const p = defender.passive || {};
    if (!defender.alive) return 0;
    if (p.staminaOnHit) defender.stamina = clamp(defender.stamina + p.staminaOnHit, 0, defender.staminaMax);
    if (p.shieldOnHitPct) defender.shield += Math.round(defender.maxHp * p.shieldOnHitPct);
    if (p.defenseStackOnHit) {
      defender.defenseStacks = clamp((defender.defenseStacks || 0) + 1, 0, p.maxDefenseStacks || 5);
    }
    const reflect = (p.reflectPct || 0) + (defender.reflectBonus || 0);
    if (reflect > 0 && attacker && attacker.alive && dealt > 0) {
      const reflected = Math.max(1, Math.round(dealt * reflect));
      applyDamage(attacker, reflected);
      return reflected;
    }
    return 0;
  };

  Battle.prototype._offenseBonus = function (attacker, target) {
    let bonus = 0;
    const p = attacker.passive || {};
    if (p.lowHpDamageBonus && attacker.hp / attacker.maxHp <= (p.lowHpThreshold || 0.5)) bonus += p.lowHpDamageBonus;
    if (attacker.buffAttacksLeft > 0 && attacker.buffDamageBonus) bonus += attacker.buffDamageBonus;
    if (attacker.fightStacks > 0 && p.stackDamage) bonus += attacker.fightStacks * p.stackDamage;
    if (p.bonusVsTank && target && target.role === "tank") bonus += p.bonusVsTank;
    bonus += (attacker.atkMul || 1) - 1;
    return bonus;
  };

  Battle.prototype._basicAttack = function (attacker) {
    const allies = this._allies(attacker);
    const enemies = this._enemies(attacker);
    const p = attacker.passive || {};

    // Support heal: heal ally + weak poke
    if (attacker.role === "support_heal") {
      const wounded = lowestHp(allies);
      const poke = pickBasicTarget(attacker, enemies);
      if (wounded) {
        const heal = Math.max(1, Math.round(attacker.damage * (p.basicHealRatio || 0.9)));
        wounded.hp = clamp(wounded.hp + heal, 0, wounded.maxHp);
        this._push(attacker.name + " cura " + wounded.name + ": +" + heal, "heal", attacker.team);
        if (this.hooks.onHeal) this.hooks.onHeal(wounded, heal);
        if (this.hooks.onBuff) this.hooks.onBuff(attacker, [wounded]);
        else if (!poke && this.hooks.onAction) this.hooks.onAction(attacker, "heal", wounded);
      }
      if (poke) {
        const dmg = mitigate(poke, Math.max(1, Math.round(attacker.damage * (p.basicDamageRatio || 0.3))), attacker);
        const res = applyDamage(poke, dmg);
        this._push(attacker.name + " acerta " + poke.name + ": " + res.dealt, "hit", attacker.team);
        if (this.hooks.onAction) this.hooks.onAction(attacker, "basic", poke);
        if (this.hooks.onHit) this.hooks.onHit(poke, res.dealt, false, "basic");
        this._afterHit(poke, attacker, res.dealt);
      }
      this._checkEnd();
      return;
    }

    const target = pickBasicTarget(attacker, enemies);
    if (!target) return;

    let ignoreDefense = 0;
    let critBonus = 0;
    const isCrit = rollCrit(attacker.critChance);
    if (isCrit && p.critIgnoreDef) {
      ignoreDefense = p.critIgnoreDef;
      critBonus = p.critBonusDmg || 0;
    }
    if (p.ignoreDefVsTank && target.role === "tank") {
      ignoreDefense = Math.max(ignoreDefense, p.ignoreDefVsTank);
    }

    const offense = 1 + this._offenseBonus(attacker, target);
    const def = effectiveDefense(target) * (1 - ignoreDefense) * DEFENSE_FACTOR;
    let dmg = attacker.damage * offense - def;
    if (isCrit) dmg *= attacker.critDamage * (1 + critBonus);
    dmg = mitigate(target, Math.max(1, Math.round(dmg)), attacker);

    const result = applyDamage(target, dmg);
    const reflected = this._afterHit(target, attacker, result.dealt);

    if (attacker.buffAttacksLeft > 0) {
      attacker.buffAttacksLeft -= 1;
      if (attacker.buffAttacksLeft <= 0) attacker.buffDamageBonus = 0;
    }
    if (p.lifestealBasic && result.dealt > 0) {
      attacker.hp = clamp(attacker.hp + Math.round(result.dealt * p.lifestealBasic), 0, attacker.maxHp);
    }
    if (p.stackDamage && p.maxStacks) {
      attacker.fightStacks = clamp((attacker.fightStacks || 0) + 1, 0, p.maxStacks);
    }
    if (p.basicManaChance && Math.random() < p.basicManaChance) {
      attacker.mana = clamp(attacker.mana + 1, 0, attacker.manaMax);
    }
    let appliedDebuff = false;
    if (p.basicSlow || p.basicAtkDown) {
      target.speedMul = Math.min(target.speedMul || 1, 1 - (p.basicSlow || 0));
      target.atkMul = Math.min(target.atkMul || 1, 1 - (p.basicAtkDown || 0));
      target.debuffTimer = Math.max(target.debuffTimer, p.debuffDuration || 3);
      appliedDebuff = true;
    }
    if (isCrit) {
      if (p.critStaminaRestore) attacker.stamina = clamp(attacker.stamina + p.critStaminaRestore, 0, attacker.staminaMax);
      if (p.critBleedTicks) applyDot(target, p.critBleedPct, p.critBleedTicks, "bleed");
    }

    const line = target.line === "front" ? "frente" : "trás";
    this._push(
      attacker.name + " ataca " + target.name + " (" + line + "): " + result.dealt +
        (result.absorbed ? " (" + result.absorbed + " bloqueado)" : "") +
        (isCrit ? " CRÍTICO!" : ""),
      isCrit ? "crit" : "hit",
      attacker.team
    );
    if (reflected) {
      this._push(target.name + " reflete " + reflected, "hit", target.team);
      if (this.hooks.onHit) this.hooks.onHit(attacker, reflected, false, "basic");
    }
    if (this.hooks.onAction) this.hooks.onAction(attacker, "basic", target);
    if (appliedDebuff && this.hooks.onDebuff) this.hooks.onDebuff(attacker, [target]);
    if (this.hooks.onHit) this.hooks.onHit(target, result.dealt, isCrit, "basic");
    this._checkEnd();
  };

  Battle.prototype._castSkill = function (attacker) {
    const skill = attacker.skill;
    const enemies = this._enemies(attacker);
    const allies = this._allies(attacker);
    attacker.mana -= skill.manaCost;

    // Heal support skill
    if (skill.targetMode === "ally_heal") {
      const main = lowestHp(allies);
      const healMain = main ? Math.round(main.maxHp * 0.22 * skill.healPower) : 0;
      if (main) {
        main.hp = clamp(main.hp + healMain, 0, main.maxHp);
        if (this.hooks.onHeal) this.hooks.onHeal(main, healMain);
      }
      let sideHeal = 0;
      const buffTargets = [];
      const hotPerSec = 0.018 * skill.healPower;
      for (let i = 0; i < allies.length; i++) {
        const al = allies[i];
        if (!al.alive) continue;
        const h = Math.round(al.maxHp * skill.healAllRatio * 0.12 * skill.healPower);
        al.hp = clamp(al.hp + h, 0, al.maxHp);
        sideHeal += h;
        al.atkMul = Math.max(al.atkMul, 1 + skill.allyAtkBuff);
        al.defMul = Math.max(al.defMul, 1 + skill.allyDefBuff);
        al.buffTimer = Math.max(al.buffTimer, skill.buffDuration);
        // Recuperação de vida com duração (para aura/+ countdown)
        al.healBuffTimer = Math.max(al.healBuffTimer || 0, skill.buffDuration);
        al.healBuffPerSec = Math.max(al.healBuffPerSec || 0, hotPerSec);
        buffTargets.push(al);
      }
      this._push(
        attacker.name + " usa " + skill.name + ": cura " + (main ? main.name + " +" + healMain : "") +
          " / time +" + sideHeal + " + regen " + Math.round(skill.buffDuration) + "s",
        "skill",
        attacker.team
      );
      if (this.hooks.onBuff) this.hooks.onBuff(attacker, buffTargets);
      else if (this.hooks.onAction) this.hooks.onAction(attacker, "heal", main || null);
      return;
    }

    // Control AoE
    if (skill.targetMode === "enemy_all") {
      const targets = aliveOf(enemies);
      let total = 0;
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        const dmg = mitigate(t, Math.max(1, Math.round(attacker.damage * skill.power * 0.55)), attacker);
        const res = applyDamage(t, dmg);
        total += res.dealt;
        t.atkMul = Math.min(t.atkMul || 1, 1 - skill.aoeAtkDown);
        t.speedMul = Math.min(t.speedMul || 1, 1 - skill.aoeSlow);
        if (skill.aoeMark) t.markMul = Math.max(t.markMul || 1, 1 + skill.aoeMark);
        t.debuffTimer = Math.max(t.debuffTimer, skill.debuffDuration);
        t.stamina = clamp(t.stamina - (skill.staminaDrainAll || 0), 0, t.staminaMax);
        if (this.hooks.onHit) this.hooks.onHit(t, res.dealt, false, "skill");
      }
      this._push(attacker.name + " usa " + skill.name + ": " + total + " em área + debuffs", "skill", attacker.team);
      if (this.hooks.onDebuff) this.hooks.onDebuff(attacker, targets);
      else if (targets[0] && this.hooks.onAction) this.hooks.onAction(attacker, "skill", targets[0]);
      this._checkEnd();
      return;
    }

    // Skills ofensivas single-target: sempre a frente/tank
    const target = pickFrontTarget(enemies);
    if (!target) return;

    let power = skill.power;
    if (skill.antitankPowerBonus && target.role === "tank") power *= 1 + skill.antitankPowerBonus;

    const hits = Math.max(1, skill.hits || 1);
    const powerPerHit = power / hits;
    let totalDealt = 0;
    let absorbedTotal = 0;
    let anyCrit = false;
    let ignoreDef = skill.ignoreDef || 0;
    if (attacker.passive && attacker.passive.ignoreDefVsTank && target.role === "tank") {
      ignoreDef = Math.max(ignoreDef, attacker.passive.ignoreDefVsTank);
    }

    for (let i = 0; i < hits; i++) {
      if (!target.alive) break;
      const offense = 1 + this._offenseBonus(attacker, target);
      const isCrit = rollCrit(attacker.critChance);
      if (isCrit) anyCrit = true;
      const def = effectiveDefense(target) * (1 - ignoreDef) * DEFENSE_FACTOR;
      let dmg = attacker.damage * powerPerHit * offense - def;
      if (isCrit) dmg *= attacker.critDamage;
      dmg = mitigate(target, Math.max(1, Math.round(dmg)), attacker);
      const res = applyDamage(target, dmg);
      totalDealt += res.dealt;
      absorbedTotal += res.absorbed;
    }

    const reflected = this._afterHit(target, attacker, totalDealt);
    const extras = [];
    if (skill.bleedTicks) { applyDot(target, skill.bleedPct, skill.bleedTicks, "bleed"); extras.push("sangramento"); }
    if (skill.burnTicks) { applyDot(target, skill.burnPct, skill.burnTicks, "burn"); extras.push("queimadura"); }
    if (skill.staminaDrain) {
      target.stamina = clamp(target.stamina - skill.staminaDrain, 0, target.staminaMax);
      extras.push("drena EST");
    }
    if (skill.enemyStaminaDrain) {
      target.stamina = clamp(target.stamina - skill.enemyStaminaDrain, 0, target.staminaMax);
    }
    if (skill.shieldPct) {
      const sh = Math.round(attacker.maxHp * skill.shieldPct);
      attacker.shield += sh;
      extras.push("escudo " + sh);
    }
    if (skill.selfHealPct) {
      const heal = Math.round(attacker.maxHp * skill.selfHealPct);
      attacker.hp = clamp(attacker.hp + heal, 0, attacker.maxHp);
      extras.push("cura " + heal);
    }
    if (skill.lifestealPct && totalDealt > 0) {
      const heal = Math.round(totalDealt * skill.lifestealPct);
      attacker.hp = clamp(attacker.hp + heal, 0, attacker.maxHp);
      extras.push("roubo " + heal);
    }
    const selfBuffTargets = [];
    const debuffTargets = [];
    if (skill.selfBuffDamage) {
      attacker.buffDamageBonus = skill.selfBuffDamage;
      attacker.buffAttacksLeft = skill.selfBuffAttacks;
      extras.push("buff");
      selfBuffTargets.push(attacker);
    }
    if (skill.selfDefenseBuff) {
      attacker.defMul = Math.max(attacker.defMul, 1 + skill.selfDefenseBuff);
      attacker.regenBonus = Math.max(attacker.regenBonus, skill.selfRegenBuff || 0);
      attacker.reflectBonus = Math.max(attacker.reflectBonus, skill.reflectBuff || 0);
      attacker.buffTimer = Math.max(attacker.buffTimer, skill.buffDuration || 5);
      if (skill.selfRegenBuff) {
        attacker.healBuffTimer = Math.max(attacker.healBuffTimer || 0, skill.buffDuration || 5);
        attacker.healBuffPerSec = Math.max(attacker.healBuffPerSec || 0, skill.selfRegenBuff);
      }
      extras.push("fortaleza");
      if (selfBuffTargets.indexOf(attacker) < 0) selfBuffTargets.push(attacker);
    }
    if (skill.defenseShred) {
      target.defMul = Math.min(target.defMul || 1, 1 - skill.defenseShred);
      target.debuffTimer = Math.max(target.debuffTimer, skill.shredDuration || 5);
      extras.push("quebra defesa");
      debuffTargets.push(target);
    }
    if (hits > 1) extras.unshift(hits + "x");

    this._push(
      attacker.name + " usa " + skill.name + " em " + target.name + ": " + totalDealt +
        (absorbedTotal ? " (" + absorbedTotal + " bloqueado)" : "") +
        (anyCrit ? " CRÍTICO!" : "") +
        (extras.length ? " + " + extras.join(" + ") : ""),
      "skill",
      attacker.team
    );
    if (reflected) {
      this._push(target.name + " reflete " + reflected, "hit", target.team);
      if (this.hooks.onHit) this.hooks.onHit(attacker, reflected, false, "skill");
    }
    if (this.hooks.onAction) this.hooks.onAction(attacker, "skill", target);
    if (selfBuffTargets.length && this.hooks.onBuff) this.hooks.onBuff(attacker, selfBuffTargets);
    if (debuffTargets.length && this.hooks.onDebuff) this.hooks.onDebuff(attacker, debuffTargets);
    if (this.hooks.onHit) this.hooks.onHit(target, totalDealt, anyCrit, "skill");
    this._checkEnd();
  };

  Battle.prototype._act = function (fighter) {
    if (!fighter.alive || this.over) return;
    fighter.mana = clamp(fighter.mana + 1, 0, fighter.manaMax);
    if (fighter.mana >= fighter.skill.manaCost) this._castSkill(fighter);
    else this._basicAttack(fighter);
  };

  Battle.prototype.tick = function (dt) {
    if (this.over) return;
    this.elapsed += dt;
    const units = this.all;
    for (let i = 0; i < units.length; i++) {
      if (!units[i].alive) continue;
      this._tickStatus(units[i], dt);
      this._tickBleed(units[i], dt);
      if (this.over) return;
    }
    for (let i = 0; i < units.length; i++) {
      const f = units[i];
      if (!f.alive || this.over) continue;
      const rate = (BASE_STAMINA_PER_SEC + f.speed * SPEED_TO_STAMINA) * (f.speedMul || 1);
      f.stamina += rate * dt;
      if (f.stamina >= f.staminaMax) {
        f.stamina = 0;
        this._act(f);
        if (this.over) return;
      }
    }
    if (this.hooks.onFrame) this.hooks.onFrame(this);
  };

  /* ========== Campanha / UI ========== */
  function $(sel) { return document.querySelector(sel); }

  const SAVE_KEY = "arena_rpg_save_v2";
  const TOWERS = [
    { id: 1, name: "Torre 1", subtitle: "Equipe 1", teamSize: 1, floors: 4, baseLevel: 1, levelStep: 2 },
    { id: 2, name: "Torre 2", subtitle: "Equipe 2", teamSize: 2, floors: 4, baseLevel: 8, levelStep: 3 },
    { id: 3, name: "Torre 3", subtitle: "Equipe 3", teamSize: 3, floors: 4, baseLevel: 14, levelStep: 3 },
  ];

  const ui = {
    tagline: $("#screen-tagline"),
    menu: $("#screen-menu"),
    heroes: $("#screen-heroes"),
    roll: $("#screen-roll"),
    formation: $("#screen-formation"),
    tower: $("#screen-tower"),
    battle: $("#screen-battle"),
    result: $("#screen-result"),
    reward: $("#screen-reward"),
    roster: $("#roster"),
    heroesList: $("#heroes-list"),
    heroesDetail: $("#heroes-detail"),
    heroesDetailBody: $("#heroes-detail-body"),
    rollChoices: $("#roll-choices"),
    rollTitle: $("#roll-title"),
    rollSubtitle: $("#roll-subtitle"),
    rollPreview: $("#roll-preview"),
    rollPreviewBody: $("#roll-preview-body"),
    slotsFront: $("#slots-front"),
    slotsBack: $("#slots-back"),
    detail: $("#detail"),
    detailName: $("#detail-name"),
    detailMeta: $("#detail-meta"),
    detailStats: $("#detail-stats"),
    detailPassiveName: $("#detail-passive-name"),
    detailPassiveDesc: $("#detail-passive-desc"),
    detailSkillName: $("#detail-skill-name"),
    detailSkillDesc: $("#detail-skill-desc"),
    towerLadder: $("#tower-ladder"),
    towerTabs: $("#tower-tabs"),
    towerTitle: $("#tower-title"),
    teamACol: $("#team-a-col"),
    teamBCol: $("#team-b-col"),
    btnPrimary: $("#btn-primary"),
    btnSecondary: $("#btn-secondary"),
    log: $("#battle-log"),
    battleTimer: $("#battle-timer"),
    battleTimerValue: $("#battle-timer-value"),
    battleTimerHaste: $("#battle-timer-haste"),
    resultName: $("#result-name"),
    resultSummary: $("#result-summary"),
    rewardCard: $("#reward-card"),
    rewardActions: $("#reward-actions"),
    xpBadge: $("#xp-badge"),
    toast: $("#toast"),
  };

  const HASTE_AFTER_SEC = 30;
  const HASTE_MULT = 4;

  const state = {
    mode: "menu",
    save: null,
    activeSlot: "front",
    team: emptyTeam(),
    selectedHeroId: null,
    rollOptions: [],
    rollContext: "starter", // starter | reward
    selectedRollIdx: null,
    pendingReward: null,
    flowAfterReward: false,
    flowStarter: false,
    activeTowerId: 1,
    battle: null,
    enemyTeam: emptyTeam(),
    raf: 0,
    lastTs: 0,
    prevShield: {},
    shieldBreakLock: {},
    hasteAnnounced: false,
  };

  function showToast(msg) {
    if (!ui.toast) return;
    ui.toast.textContent = msg;
    ui.toast.hidden = false;
    ui.toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      ui.toast.classList.remove("show");
      ui.toast.hidden = true;
    }, 2200);
  }

  function formatBattleTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  function updateBattleTimer(elapsed, hasted) {
    if (!ui.battleTimerValue) return;
    ui.battleTimerValue.textContent = formatBattleTime(elapsed);
    if (ui.battleTimer) ui.battleTimer.classList.toggle("is-haste", !!hasted);
    if (ui.battleTimerHaste) ui.battleTimerHaste.hidden = !hasted;
  }

  function defaultSave() {
    return {
      xp: 0,
      collection: {},
      team: { front: null, back0: null, back1: null },
      unlockedTower: 1,
      floorsCleared: { 1: 0, 2: 0, 3: 0 },
      hasStarter: false,
    };
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const data = JSON.parse(raw);
      const base = defaultSave();
      return Object.assign(base, data, {
        collection: data.collection || {},
        team: Object.assign(base.team, data.team || {}),
        floorsCleared: Object.assign(base.floorsCleared, data.floorsCleared || {}),
      });
    } catch (e) {
      return defaultSave();
    }
  }

  function persist() {
    state.save.team = {
      front: state.team.front ? state.team.front.id : null,
      back0: state.team.back0 ? state.team.back0.id : null,
      back1: state.team.back1 ? state.team.back1.id : null,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(state.save));
    syncXpBadge();
  }

  function syncXpBadge() {
    if (ui.xpBadge) ui.xpBadge.textContent = "XP " + (state.save ? state.save.xp : 0);
  }

  function ownedList() {
    return Object.keys(state.save.collection).map(function (id) {
      return state.save.collection[id];
    });
  }

  function copiesNeededForNextStar(rarity) {
    if (rarity >= 5) return 0;
    return rarity; // 1→2 needs 1, 2→3 needs 2, ...
  }

  function spareCopies(entry) {
    return Math.max(0, (entry.copies || 1) - 1);
  }

  /** Cópias 5★ sobrando (só existem quando o herói já está 5★). */
  function fiveStarCopies(entry) {
    if (!entry || entry.rarity < 5) return 0;
    return spareCopies(entry);
  }

  function autoFuse(entry) {
    let fused = false;
    while (entry.rarity < 5) {
      const need = copiesNeededForNextStar(entry.rarity);
      const spare = spareCopies(entry);
      if (spare < need) break;
      entry.copies -= need;
      entry.rarity += 1;
      fused = true;
    }
    return fused;
  }

  function canAwaken(entry) {
    return !!entry && entry.rarity >= 5 && entry.awakened < 3 && fiveStarCopies(entry) >= 1;
  }

  function awakenHero(entry) {
    if (!canAwaken(entry)) return false;
    entry.copies -= 1;
    entry.awakened += 1;
    return true;
  }

  function addHeroToCollection(id, opts) {
    opts = opts || {};
    const existing = state.save.collection[id];
    if (!existing) {
      state.save.collection[id] = {
        id: id,
        level: opts.level || 1,
        rarity: 1,
        awakened: opts.awakened || 0,
        copies: 1,
      };
      return { created: true, fused: false, entry: state.save.collection[id] };
    }
    existing.copies += 1;
    const fused = autoFuse(existing);
    return { created: false, fused: fused, entry: existing };
  }

  function xpToNextLevel(level) {
    if (level >= 50) return null;
    return Math.round(28 * level * (1 + level * 0.07));
  }

  function sellXpValue(level, rarity) {
    return Math.round(35 * Math.max(1, level) * Math.max(1, rarity));
  }

  function entryToPick(entry) {
    return makePick(entry.id, {
      level: entry.level,
      rarity: entry.rarity,
      awakened: entry.awakened,
    });
  }

  function randomHeroId(exclude) {
    exclude = exclude || [];
    const pool = CHARACTERS.map(function (c) { return c.id; }).filter(function (id) {
      return exclude.indexOf(id) < 0;
    });
    if (!pool.length) return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function makeRollOptions(count) {
    const out = [];
    const used = [];
    for (let i = 0; i < count; i++) {
      const id = randomHeroId(used);
      used.push(id);
      out.push({ id: id, level: 1, rarity: 1, awakened: 0 });
    }
    return out;
  }

  function getTower(id) {
    return TOWERS.find(function (t) { return t.id === id; }) || TOWERS[0];
  }

  function currentFloor(towerId) {
    return state.save.floorsCleared[towerId] || 0;
  }

  function enemyLevelFor(tower, floorIndex) {
    const step = tower.levelStep != null ? tower.levelStep : 3;
    return clamp(tower.baseLevel + floorIndex * step, 1, 50);
  }

  function buildEnemyTeam(tower, floorIndex) {
    const size = tower.teamSize;
    const level = enemyLevelFor(tower, floorIndex);
    // Torre 1 andar 1: sempre Nv.1 · 1★ · sem despertar (tutorial)
    const rarity = tower.id === 1
      ? (floorIndex === 0 ? 1 : clamp(1 + Math.floor(floorIndex / 2), 1, 2))
      : clamp(1 + Math.floor(floorIndex / 2), 1, 4);
    const awakened = tower.id === 1 ? 0 : (floorIndex >= 3 ? 1 : 0);
    const used = [];
    const team = emptyTeam();
    const slots = SLOT_ORDER.slice(0, size);
    // Primeiro combate: inimigo mais simples (não tank/controle)
    const easyFirstIds = ["nyx", "kael", "lyra", "mira", "brutus"];
    slots.forEach(function (slot) {
      let id;
      if (tower.id === 1 && floorIndex === 0) {
        const pool = easyFirstIds.filter(function (x) { return used.indexOf(x) < 0; });
        id = pool[Math.floor(Math.random() * pool.length)] || randomHeroId(used);
      } else {
        id = randomHeroId(used);
      }
      used.push(id);
      team[slot] = makePick(id, { level: level, rarity: rarity, awakened: awakened });
    });
    return team;
  }

  function playerTeamForFight(maxSize) {
    const team = emptyTeam();
    const slots = SLOT_ORDER.slice(0, maxSize);
    slots.forEach(function (slot) {
      const pick = state.team[slot];
      if (pick && state.save.collection[pick.id]) {
        team[slot] = entryToPick(state.save.collection[pick.id]);
      }
    });
    return team;
  }

  function teamCountLocal(team) {
    return SLOT_ORDER.reduce(function (n, s) { return n + (team[s] ? 1 : 0); }, 0);
  }

  function syncTeamFromSave() {
    const t = emptyTeam();
    SLOT_ORDER.forEach(function (slot) {
      const id = state.save.team[slot];
      if (id && state.save.collection[id]) t[slot] = entryToPick(state.save.collection[id]);
    });
    state.team = t;
  }

  function clearPlayerSlot(slot) {
    state.team[slot] = null;
    if (slot === "front") {
      for (let i = 0; i < 2; i++) {
        const s = "back" + i;
        if (state.team[s]) {
          state.team.front = state.team[s];
          state.team[s] = null;
          break;
        }
      }
    }
    if (!state.team.front) state.activeSlot = "front";
    persist();
  }

  /* ----- screens ----- */
  function hideAllScreens() {
    ["menu", "heroes", "roll", "formation", "tower", "battle", "result", "reward"].forEach(function (k) {
      if (ui[k]) ui[k].hidden = true;
    });
  }

  function setDock(secondaryLabel, primaryLabel, secondaryHidden) {
    ui.btnSecondary.textContent = secondaryLabel || "Voltar";
    ui.btnPrimary.textContent = primaryLabel || "Continuar";
    ui.btnSecondary.hidden = !!secondaryHidden;
    ui.btnPrimary.classList.remove("is-disabled");
    ui.btnPrimary.removeAttribute("disabled");
    ui.btnSecondary.removeAttribute("disabled");
  }

  function showScreen(mode) {
    state.mode = mode;
    hideAllScreens();
    syncXpBadge();

    if (mode === "menu") {
      ui.menu.hidden = false;
      ui.tagline.textContent = "Escolha seu caminho";
      setDock("Heróis", state.save && state.save.hasStarter ? "Continuar campanha" : "Novo jogo", false);
      renderMenu();
    } else if (mode === "heroes") {
      ui.heroes.hidden = false;
      ui.tagline.textContent = "Coleção · subir nível e despertar";
      setDock("Voltar", "Ir à formação", false);
      renderHeroes();
    } else if (mode === "roll") {
      ui.roll.hidden = false;
      ui.tagline.textContent = state.rollContext === "starter"
        ? "1/4 · Escolha o herói"
        : "Recompensa · escolha 1 de 3";
      state.selectedRollIdx = null;
      setDock("—", state.rollContext === "starter" ? "Confirmar herói" : "Confirmar escolha", true);
      ui.btnPrimary.classList.add("is-disabled");
      renderRoll();
    } else if (mode === "formation") {
      ui.formation.hidden = false;
      if (state.flowAfterReward) {
        ui.tagline.textContent = "Ajuste a formação · depois o próximo andar";
        setDock("Heróis", "Próximo andar", false);
      } else if (state.flowStarter) {
        ui.tagline.textContent = "2/4 · Herói na formação — continue";
        setDock("Heróis", "Ver torre", false);
      } else {
        ui.tagline.textContent = "Formação da equipe";
        setDock("Heróis", "Ver torre", false);
      }
      renderFormation();
      renderOwnedRoster();
      showDetailForPick(state.team[state.activeSlot]);
    } else if (mode === "tower") {
      ui.tower.hidden = false;
      ui.tagline.textContent = state.flowAfterReward
        ? "Próximo andar · iniciar combate"
        : (state.flowStarter ? "3/4 · Torre · iniciar combate" : "Torre · iniciar combate");
      state.flowAfterReward = false;
      state.flowStarter = false;
      setDock("Formação", "Iniciar combate", false);
      renderTower();
    } else if (mode === "battle") {
      ui.battle.hidden = false;
      ui.tagline.textContent = "Combate";
      setDock("—", "Desistir", true);
    } else if (mode === "result") {
      ui.result.hidden = false;
      ui.tagline.textContent = "Fim da luta";
      if (state._resultWin) {
        setDock("—", "Abrir recompensa", true);
      } else {
        setDock("Formação", "Tentar de novo", false);
      }
    } else if (mode === "reward") {
      ui.reward.hidden = false;
      ui.tagline.textContent = "Guardar ou vender o herói";
      setDock("—", "Escolha acima", true);
      ui.btnPrimary.classList.add("is-disabled");
      renderReward();
    }
  }

  function renderMenu() {
    const cont = $("#menu-continue-hint");
    if (!cont) return;
    if (state.save && state.save.hasStarter) {
      cont.hidden = false;
      cont.textContent =
        "Progresso: Torre " + state.save.unlockedTower +
        " · Heróis " + ownedList().length +
        " · XP " + state.save.xp;
    } else {
      cont.hidden = true;
    }
  }

  function renderHeroes() {
    const owned = ownedList();
    const ownedIds = owned.map(function (e) { return e.id; });
    ui.heroesList.innerHTML = CHARACTERS.map(function (ch) {
      const entry = state.save.collection[ch.id];
      const locked = !entry;
      return (
        '<button type="button" class="hero-card' + (locked ? " locked" : "") +
        (state.selectedHeroId === ch.id ? " active" : "") +
        '" data-id="' + ch.id + '" style="--tone:' + ch.color + '">' +
        '<span class="char-glyph">' + (locked ? "?" : ch.glyph) + "</span>" +
        '<span class="char-name">' + (locked ? "???" : ch.name) + "</span>" +
        '<span class="char-class">' + (locked ? "Não obtido" : ch.className) + "</span>" +
        (entry
          ? '<span class="char-meta">Nv.' + entry.level + " · " + starsHtml(entry.rarity) +
            " · x" + entry.copies + "</span>"
          : '<span class="char-meta">Bloqueado</span>') +
        "</button>"
      );
    }).join("");

    if (!state.selectedHeroId || ownedIds.indexOf(state.selectedHeroId) < 0) {
      state.selectedHeroId = owned[0] ? owned[0].id : null;
    }
    renderHeroesDetail();
  }

  function renderHeroesDetail() {
    const box = ui.heroesDetailBody;
    if (!box) return;
    const entry = state.selectedHeroId ? state.save.collection[state.selectedHeroId] : null;
    if (!entry) {
      ui.heroesDetail.hidden = true;
      box.innerHTML = "";
      return;
    }
    ui.heroesDetail.hidden = false;
    const template = getTemplate(entry.id);
    const preview = createCombatant(entryToPick(entry), "x", "front");
    const need = copiesNeededForNextStar(entry.rarity);
    const spare = spareCopies(entry);
    const star5 = fiveStarCopies(entry);
    const xpNeed = xpToNextLevel(entry.level);
    const awakenReady = canAwaken(entry);
    box.innerHTML =
      "<h2>" + template.name + "</h2>" +
      '<p class="detail-meta">' + template.className + " · Nv." + entry.level + " · " +
      starsHtml(entry.rarity) + " · " + awakenedLabel(entry.awakened) + "</p>" +
      '<p class="fuse-line">Cópias: <strong>' + entry.copies +
      "</strong> · sobrando <strong>" + spare + "</strong>" +
      (entry.rarity < 5
        ? " · próxima estrela precisa <strong>" + need + "</strong>"
        : " · cópias 5★: <strong>" + star5 + "</strong>") +
      "</p>" +
      '<p class="fuse-line">Despertar consome <strong>1 cópia 5★</strong> por nível (máx. D3).</p>' +
      '<div class="heroes-controls">' +
      '<button type="button" class="btn ghost" data-hero-act="level"' +
      (!xpNeed || state.save.xp < xpNeed ? " disabled" : "") +
      ">Subir nível (" + (xpNeed == null ? "máx" : xpNeed + " XP") + ")</button>" +
      '<button type="button" class="btn ghost" data-hero-act="awaken"' +
      (!awakenReady ? " disabled" : "") +
      ">" +
      (entry.awakened >= 3
        ? "Despertar máx."
        : entry.rarity < 5
          ? "Despertar (precisa 5★)"
          : star5 < 1
            ? "Despertar (sem cópia 5★)"
            : "Despertar → D" + (entry.awakened + 1) + " (−1 cópia 5★)") +
      "</button>" +
      "</div>" +
      "<ul class='detail-stats'>" +
      [["Vida", preview.maxHp], ["Dano", preview.damage], ["Defesa", preview.defense], ["Velocidade", preview.speed]]
        .map(function (r) { return "<li><span>" + r[0] + "</span><strong>" + r[1] + "</strong></li>"; })
        .join("") +
      "</ul>" +
      '<div class="detail-abilities"><div><span class="ability-tag">Passiva</span><strong>' +
      preview.passiveName + "</strong><p>" + preview.passiveDesc +
      '</p></div><div><span class="ability-tag skill">Habilidade</span><strong>' +
      preview.skill.name + "</strong><p>" + preview.skillDesc + "</p></div></div>";
  }

  function rollPickPreview(opt) {
    return createCombatant(makePick(opt.id, {
      level: opt.level || 1,
      rarity: opt.rarity || 1,
      awakened: opt.awakened || 0,
    }), "x", "front");
  }

  function renderRoll() {
    if (ui.rollTitle) {
      ui.rollTitle.textContent = state.rollContext === "starter"
        ? "Escolha seu primeiro herói"
        : "Recompensa da vitória";
    }
    if (ui.rollSubtitle) {
      ui.rollSubtitle.textContent = state.rollContext === "starter"
        ? "Toque para ver info → confirme embaixo → vai para a formação"
        : "Toque para ver info → confirme → guardar ou vender";
    }
    const choices = document.getElementById("roll-choices") || ui.rollChoices;
    if (!choices) return;
    choices.innerHTML = state.rollOptions.map(function (opt, idx) {
      const ch = getTemplate(opt.id);
      const preview = rollPickPreview(opt);
      const active = state.selectedRollIdx === idx;
      return (
        '<button type="button" class="roll-card' + (active ? " active" : "") +
        '" data-roll-idx="' + idx + '" style="--tone:' + ch.color + '">' +
        '<span class="char-glyph">' + ch.glyph + "</span>" +
        "<strong>" + ch.name + "</strong>" +
        "<small>" + ch.className + " · Nv." + preview.level + "</small>" +
        "<span class='stars'>" + starsHtml(opt.rarity || 1) + "</span>" +
        '<span class="roll-card-stats">HP ' + preview.maxHp +
        " · ATK " + preview.damage +
        " · DEF " + preview.defense + "</span>" +
        '<span class="roll-card-skill">' + preview.skill.name + "</span>" +
        "</button>"
      );
    }).join("");
    renderRollPreview();
  }

  function renderRollPreview() {
    const box = document.getElementById("roll-preview") || ui.rollPreview;
    const body = document.getElementById("roll-preview-body") || ui.rollPreviewBody;
    if (!box || !body) return;

    box.hidden = false;
    box.removeAttribute("hidden");

    const idx = state.selectedRollIdx;
    const opt = idx == null ? null : state.rollOptions[idx];
    if (!opt) {
      body.innerHTML = '<p class="roll-preview-placeholder">Toque um dos 3 heróis abaixo para ver vida, dano, passiva e habilidade.</p>';
      ui.btnPrimary.classList.add("is-disabled");
      ui.btnPrimary.textContent = "Selecionar herói";
      return;
    }

    const ch = getTemplate(opt.id);
    const preview = rollPickPreview(opt);

    body.innerHTML =
      "<h2>" + ch.name + "</h2>" +
      '<p class="detail-meta">' + ch.className + " · Nv." + preview.level + " · " +
      starsHtml(preview.rarity) + " · " + awakenedLabel(preview.awakened) + "</p>" +
      '<ul class="detail-stats">' +
      [["Vida", preview.maxHp], ["Dano", preview.damage], ["Defesa", preview.defense],
        ["Velocidade", preview.speed], ["Crit %", Math.round(preview.critChance * 100) + "%"]]
        .map(function (r) { return "<li><span>" + r[0] + "</span><strong>" + r[1] + "</strong></li>"; })
        .join("") +
      "</ul>" +
      '<div class="detail-abilities">' +
      "<div><span class=\"ability-tag\">Passiva</span><strong>" + preview.passiveName +
      "</strong><p>" + preview.passiveDesc + "</p></div>" +
      "<div><span class=\"ability-tag skill\">Habilidade</span><strong>" + preview.skill.name +
      " (" + preview.skill.manaCost + " mana)</strong><p>" + preview.skillDesc + "</p></div>" +
      "</div>";

    ui.btnPrimary.classList.remove("is-disabled");
    ui.btnPrimary.textContent = state.rollContext === "starter"
      ? "Confirmar " + ch.name
      : "Escolher " + ch.name;
  }

  function renderOwnedRoster() {
    const owned = ownedList();
    const used = SLOT_ORDER.map(function (s) { return state.team[s] && state.team[s].id; }).filter(Boolean);
    ui.roster.classList.add("roster-rail");
    ui.roster.style.display = "flex";
    ui.roster.style.flexDirection = "row";
    ui.roster.style.flexWrap = "nowrap";
    ui.roster.style.gap = "8px";
    ui.roster.style.overflowX = "auto";
    ui.roster.innerHTML = owned.map(function (entry) {
      const ch = getTemplate(entry.id);
      const taken = used.indexOf(entry.id) >= 0;
      return (
        '<button type="button" class="char-card' + (taken ? " selected" : "") +
        '" data-id="' + entry.id + '"' + (taken ? " disabled" : "") +
        ' style="--tone:' + ch.color + ';flex:0 0 104px;width:104px;min-width:104px;">' +
        '<span class="char-glyph">' + ch.glyph + "</span>" +
        '<span class="char-name">' + ch.name + "</span>" +
        '<span class="char-class">' + ch.className + "</span>" +
        '<span class="char-meta">Nv.' + entry.level + " · " + starsHtml(entry.rarity) + "</span>" +
        "</button>"
      );
    }).join("") || '<p class="empty-roster">Nenhum herói na coleção</p>';
  }

  function slotCardHtml(pick) {
    const ch = getTemplate(pick.id);
    return (
      '<div class="slot-card" style="--tone:' + ch.color + '">' +
      '<span class="avatar-mini">' + ch.glyph + "</span><div><strong>" + ch.name +
      "</strong><small>Nv." + pick.level + " · " + starsHtml(pick.rarity) + " · " +
      awakenedLabel(pick.awakened) + "</small></div></div>"
    );
  }

  function renderFormation() {
    const front = state.team.front;
    ui.slotsFront.innerHTML =
      '<button type="button" class="slot' +
      (state.activeSlot === "front" ? " active" : "") +
      (front ? " filled" : "") +
      '" data-slot="front"><span class="slot-label">F</span><div class="slot-body">' +
      (front ? slotCardHtml(front) : '<span class="slot-empty">Frente (obrigatório)</span>') +
      "</div></button>";

    ui.slotsBack.innerHTML = ["back0", "back1"]
      .map(function (slot, i) {
        const pick = state.team[slot];
        return (
          '<button type="button" class="slot' +
          (state.activeSlot === slot ? " active" : "") +
          (pick ? " filled" : "") +
          '" data-slot="' + slot + '"><span class="slot-label">T' + (i + 1) +
          '</span><div class="slot-body">' +
          (pick ? slotCardHtml(pick) : '<span class="slot-empty">Trás (opcional)</span>') +
          "</div></button>"
        );
      })
      .join("");
  }

  function showDetailForPick(pick) {
    if (!pick) { ui.detail.hidden = true; return; }
    const src = state.save.collection[pick.id] || {
      id: pick.id,
      level: pick.level,
      rarity: pick.rarity,
      awakened: pick.awakened,
      copies: 1,
    };
    const template = getTemplate(pick.id);
    const preview = createCombatant(entryToPick(src), "x", "front");
    ui.detail.hidden = false;
    ui.detailName.textContent = template.name;
    ui.detailMeta.innerHTML =
      template.className + " · Nv." + preview.level + " · " + starsHtml(preview.rarity) + " · " +
      awakenedLabel(preview.awakened);
    const rows = [
      ["Vida", preview.maxHp], ["Dano", preview.damage], ["Defesa", preview.defense],
      ["Velocidade", preview.speed],
    ];
    ui.detailStats.innerHTML = rows
      .map(function (r) { return "<li><span>" + r[0] + "</span><strong>" + r[1] + "</strong></li>"; })
      .join("");
    ui.detailPassiveName.textContent = preview.passiveName;
    ui.detailPassiveDesc.textContent = preview.passiveDesc;
    ui.detailSkillName.textContent = preview.skill.name + " (" + preview.skill.manaCost + " mana)";
    ui.detailSkillDesc.textContent = preview.skillDesc;
  }

  function renderTower() {
    const tower = getTower(state.activeTowerId);
    if (ui.towerTitle) {
      ui.towerTitle.textContent = tower.name + " · até " + tower.teamSize + " herói(s)";
    }
    ui.towerTabs.innerHTML = TOWERS.map(function (t) {
      const locked = t.id > state.save.unlockedTower;
      const cleared = currentFloor(t.id);
      return (
        '<button type="button" class="tower-tab' +
        (t.id === state.activeTowerId ? " active" : "") +
        (locked ? " locked" : "") + '" data-tower="' + t.id + '"' +
        (locked ? " disabled" : "") + ">" +
        t.name + "<small>" + cleared + "/" + t.floors + "</small></button>"
      );
    }).join("");

    const floor = currentFloor(tower.id);
    const rows = [];
    for (let i = tower.floors - 1; i >= 0; i--) {
      const done = i < floor;
      const current = i === floor;
      const locked = i > floor;
      const lvl = enemyLevelFor(tower, i);
      rows.push(
        '<div class="tower-rung' +
        (done ? " done" : "") +
        (current ? " current" : "") +
        (locked ? " locked" : "") +
        '"><span class="rung-mark">' + (done ? "✓" : current ? "►" : "·") +
        "</span><div><strong>Andar " + (i + 1) + "</strong><small>" +
        tower.teamSize + " inimigo(s) · Nv." + lvl + "</small></div></div>"
      );
    }
    ui.towerLadder.innerHTML = rows.join("");

    const canFight = floor < tower.floors && !!state.team.front;
    ui.btnPrimary.classList.toggle("is-disabled", !canFight);
    if (floor >= tower.floors) {
      ui.btnPrimary.textContent = "Torre concluída";
      ui.btnPrimary.classList.add("is-disabled");
    } else if (!state.team.front) {
      ui.btnPrimary.textContent = "Precisa de formação";
    } else {
      ui.btnPrimary.textContent = "Iniciar combate · andar " + (floor + 1);
    }
  }

  function renderReward() {
    const opt = state.pendingReward;
    if (!opt) return;
    const ch = getTemplate(opt.id);
    const xp = sellXpValue(opt.level || 1, opt.rarity || 1);
    const owned = state.save.collection[opt.id];
    const keepLabel = owned
      ? (owned.rarity < 5 ? "Guardar cópia (fusão)" : "Guardar cópia")
      : "Adicionar à formação/coleção";
    ui.rewardCard.innerHTML =
      '<div class="roll-card static" style="--tone:' + ch.color + '">' +
      '<span class="char-glyph">' + ch.glyph + "</span>" +
      "<strong>" + ch.name + "</strong>" +
      "<small>" + ch.className + " · Nv." + (opt.level || 1) + "</small>" +
      "<span class='stars'>" + starsHtml(opt.rarity || 1) + "</span></div>" +
      '<p class="section-sub" style="margin-top:10px">Depois você poderá ver a formação e seguir ao próximo andar.</p>';
    ui.rewardActions.innerHTML =
      '<button type="button" class="btn primary" data-reward="keep">' + keepLabel + "</button>" +
      '<button type="button" class="btn ghost" data-reward="sell">Vender por ' + xp + " XP</button>";
  }

  /* ----- battle visuals (reuse) ----- */
  function fighterCardHtml(f) {
    const lineClass = f.line === "front" ? "front-liner" : "back-liner";
    return (
      '<article class="fighter side-' + f.team + " " + lineClass + '" id="fighter-' + f.uid + '" data-uid="' + f.uid + '">' +
      '<div class="fighter-sprite" id="fighter-' + f.uid + '-sprite">' +
      '<div class="shield-bubble" id="fighter-' + f.uid + '-shield"></div>' +
      '<div class="heal-aura-ring" id="fighter-' + f.uid + '-heal-aura" aria-hidden="true"></div>' +
      '<div class="avatar" id="fighter-' + f.uid + '-avatar" style="--tone:' + f.color + '">' + f.glyph + "</div>" +
      '<div class="heal-buff-badge" id="fighter-' + f.uid + '-heal-badge" hidden>' +
      '<span class="heal-plus">+</span>' +
      '<span class="heal-count" id="fighter-' + f.uid + '-heal-count">0</span>' +
      "</div>" +
      '<div class="float-layer" id="fighter-' + f.uid + '-floats"></div>' +
      '<div class="shield-break" id="fighter-' + f.uid + '-shield-break"></div>' +
      "</div>" +
      "<h2>" + f.name + "</h2>" +
      '<p class="fighter-meta">Nv.' + f.level + " · " + starsHtml(f.rarity) + "</p>" +
      '<div class="bars">' +
      '<div class="bar hp"><span id="fighter-' + f.uid + '-hp-fill"></span><em id="fighter-' + f.uid + '-hp-text"></em></div>' +
      '<div class="bar mana"><span id="fighter-' + f.uid + '-mana-fill"></span><em id="fighter-' + f.uid + '-mana-text"></em></div>' +
      '<div class="bar stamina"><span id="fighter-' + f.uid + '-stamina-fill"></span><em>EST</em></div>' +
      "</div>" +
      '<p class="action-line" id="fighter-' + f.uid + '-action">...</p>' +
      "</article>"
    );
  }

  function renderTeamCol(team, fighters) {
    const front = fighters.find(function (f) { return f.slot === "front"; });
    const back = fighters.filter(function (f) { return f.line === "back"; });
    return (
      '<div class="line-back" aria-label="Linha de trás">' + back.map(fighterCardHtml).join("") + "</div>" +
      '<div class="line-front" aria-label="Linha de frente">' + (front ? fighterCardHtml(front) : "") + "</div>"
    );
  }

  function getHealBuffSeconds(f) {
    let seconds = 0;
    if (f.healBuffTimer > 0) seconds = Math.max(seconds, f.healBuffTimer);
    if (f.regenBonus > 0 && f.buffTimer > 0) seconds = Math.max(seconds, f.buffTimer);
    return seconds;
  }

  function isReceivingHealRecovery(f) {
    if (!f || !f.alive) return false;
    if (getHealBuffSeconds(f) > 0) return true;
    if (state.battle && typeof state.battle._hasAuraHealer === "function") {
      return state.battle._hasAuraHealer(f);
    }
    return false;
  }

  function syncHealBuffVisual(f) {
    const uid = f.uid;
    const sprite = $("#fighter-" + uid + "-sprite");
    const badge = $("#fighter-" + uid + "-heal-badge");
    const count = $("#fighter-" + uid + "-heal-count");
    if (!sprite || !badge) return;
    const timed = getHealBuffSeconds(f);
    const active = isReceivingHealRecovery(f);
    sprite.classList.toggle("heal-aura", active);
    badge.hidden = !active;
    if (!active || !count) return;
    if (timed > 0) {
      count.hidden = false;
      count.textContent = String(Math.max(1, Math.ceil(timed)));
    } else {
      count.hidden = true;
      count.textContent = "";
    }
  }

  function showShieldBubble(uid, on) {
    const sprite = $("#fighter-" + uid + "-sprite");
    const bubble = $("#fighter-" + uid + "-shield");
    if (!sprite || !bubble) return;
    sprite.classList.toggle("has-shield", on);
    bubble.classList.toggle("is-on", on);
  }

  function playShieldBreak(uid) {
    const sprite = $("#fighter-" + uid + "-sprite");
    const layer = $("#fighter-" + uid + "-shield-break");
    if (!sprite || !layer) return;
    state.shieldBreakLock[uid] = true;
    showShieldBubble(uid, false);
    layer.innerHTML = "";
    for (let i = 0; i < 10; i++) {
      const shard = document.createElement("span");
      shard.className = "glass-shard";
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.3;
      const dist = 24 + Math.random() * 30;
      shard.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      shard.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      shard.style.setProperty("--rot", (Math.random() * 200 - 100) + "deg");
      layer.appendChild(shard);
    }
    sprite.classList.remove("shield-breaking");
    void sprite.offsetWidth;
    sprite.classList.add("shield-breaking");
    window.setTimeout(function () {
      sprite.classList.remove("shield-breaking");
      layer.innerHTML = "";
      state.shieldBreakLock[uid] = false;
    }, 600);
  }

  function syncShieldVisual(uid, shieldValue) {
    const prev = state.prevShield[uid] || 0;
    const current = Math.max(0, shieldValue || 0);
    if (current > 0) {
      if (!state.shieldBreakLock[uid]) showShieldBubble(uid, true);
    } else {
      showShieldBubble(uid, false);
      if (prev > 0 && !state.shieldBreakLock[uid]) playShieldBreak(uid);
    }
    state.prevShield[uid] = current;
  }

  function updateUnitBars(f) {
    const uid = f.uid;
    const hpEl = $("#fighter-" + uid + "-hp-fill");
    if (!hpEl) return;
    hpEl.style.width = (f.hp / f.maxHp) * 100 + "%";
    $("#fighter-" + uid + "-mana-fill").style.width = (f.mana / f.manaMax) * 100 + "%";
    $("#fighter-" + uid + "-stamina-fill").style.width = (f.stamina / f.staminaMax) * 100 + "%";
    $("#fighter-" + uid + "-hp-text").textContent =
      Math.ceil(f.hp) + "/" + f.maxHp + (f.shield ? " +" + f.shield : "");
    $("#fighter-" + uid + "-mana-text").textContent = f.mana + "/" + f.manaMax;
    const card = $("#fighter-" + uid);
    if (card) card.classList.toggle("dead", !f.alive);
    syncShieldVisual(uid, f.shield);
    syncHealBuffVisual(f);
  }

  function pulseFighter(unit, cls, ms) {
    const el = $("#fighter-" + unit.uid);
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    window.setTimeout(function () { el.classList.remove(cls); }, ms || 520);
  }

  function playAimedBeam(fromUnit, toUnit, styleKind) {
    const layer = $("#slash-layer");
    if (!layer || !fromUnit || !toUnit) return;
    const fromEl = $("#fighter-" + fromUnit.uid + "-avatar") || $("#fighter-" + fromUnit.uid + "-sprite");
    const toEl = $("#fighter-" + toUnit.uid + "-avatar") || $("#fighter-" + toUnit.uid + "-sprite");
    if (!fromEl || !toEl) return;
    const layerRect = layer.getBoundingClientRect();
    const from = fromEl.getBoundingClientRect();
    const to = toEl.getBoundingClientRect();
    const x1 = from.left + from.width / 2 - layerRect.left;
    const y1 = from.top + from.height / 2 - layerRect.top;
    const x2 = to.left + to.width / 2 - layerRect.left;
    const y2 = to.top + to.height / 2 - layerRect.top;
    const dist = Math.max(28, Math.hypot(x2 - x1, y2 - y1));
    const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    const slash = document.createElement("div");
    slash.className = "slash aimed " + styleKind +
      (styleKind === "buff" || styleKind === "debuff" || styleKind === "heal" ? "" : " from-" + fromUnit.team);
    if (styleKind === "skill") slash.classList.add("skill");
    slash.style.left = x1 + "px";
    slash.style.top = y1 + "px";
    slash.style.width = dist + "px";
    slash.style.setProperty("--slash-angle", angle + "deg");
    layer.appendChild(slash);
    const mark = document.createElement("div");
    mark.className = "slash-mark " + styleKind;
    mark.style.left = x2 + "px";
    mark.style.top = y2 + "px";
    layer.appendChild(mark);
    window.setTimeout(function () { slash.remove(); mark.remove(); }, 480);
  }

  function playAttackMotion(unit, kind, target) {
    const el = $("#fighter-" + unit.uid);
    if (!el) return;
    el.classList.remove("attacking");
    void el.offsetWidth;
    el.classList.add("attacking");
    window.setTimeout(function () { el.classList.remove("attacking"); }, 340);
    if (!target) return;
    pulseFighter(target, "targeted", 520);
    playAimedBeam(unit, target, kind === "heal" ? "heal" : kind === "skill" ? "skill" : "basic");
  }

  function playStatusMotion(source, kind, targets) {
    const list = (targets || []).filter(Boolean);
    if (!list.length) return;
    const srcEl = $("#fighter-" + source.uid);
    if (srcEl) {
      srcEl.classList.remove("attacking");
      void srcEl.offsetWidth;
      srcEl.classList.add("attacking");
      window.setTimeout(function () { srcEl.classList.remove("attacking"); }, 340);
    }
    const pulseCls = kind === "buff" ? "buffed" : "debuffed";
    list.forEach(function (target, i) {
      window.setTimeout(function () {
        pulseFighter(target, pulseCls, 560);
        if (target.uid === source.uid) {
          const avatar = $("#fighter-" + target.uid + "-avatar");
          const layer = $("#slash-layer");
          if (!avatar || !layer) return;
          const layerRect = layer.getBoundingClientRect();
          const rect = avatar.getBoundingClientRect();
          const ring = document.createElement("div");
          ring.className = "status-ring " + kind;
          ring.style.left = rect.left + rect.width / 2 - layerRect.left + "px";
          ring.style.top = rect.top + rect.height / 2 - layerRect.top + "px";
          layer.appendChild(ring);
          window.setTimeout(function () { ring.remove(); }, 520);
          return;
        }
        playAimedBeam(source, target, kind);
      }, i * 70);
    });
  }

  function flashHit(unit) {
    const el = $("#fighter-" + unit.uid);
    if (!el) return;
    el.classList.remove("hit");
    void el.offsetWidth;
    el.classList.add("hit");
    window.setTimeout(function () { el.classList.remove("hit"); }, 420);
  }

  function spawnDamageNumber(unit, amount, isCrit, kind) {
    const layer = $("#fighter-" + unit.uid + "-floats");
    if (!layer || amount <= 0) return;
    const node = document.createElement("span");
    node.className = "dmg-float" + (isCrit ? " crit" : "") + (kind === "skill" ? " skill" : "") + (kind === "bleed" ? " bleed" : "");
    node.textContent = (kind === "heal" ? "+" : isCrit ? "CRIT " : "-") + amount;
    if (kind === "heal") node.style.color = "#7dffa0";
    layer.appendChild(node);
    window.setTimeout(function () { node.remove(); }, 900);
  }

  function setAction(unit, kind) {
    const el = $("#fighter-" + unit.uid + "-action");
    if (!el) return;
    el.textContent =
      kind === "skill" ? "Habilidade!" :
      kind === "heal" ? "Cura" :
      kind === "buff" ? "Buff" :
      kind === "debuff" ? "Debuff" : "Ataque";
  }

  function appendLog(entry) {
    const row = document.createElement("p");
    row.className = "log-row " + entry.kind + (entry.side ? " side-" + entry.side : "");
    row.textContent = entry.text;
    ui.log.prepend(row);
    while (ui.log.children.length > 50) ui.log.lastChild.remove();
  }

  function stopBattleLoop() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  function buildCombatTeam(teamObj, teamKey, maxSize) {
    return SLOT_ORDER.slice(0, maxSize).filter(function (slot) {
      return !!teamObj[slot];
    }).map(function (slot) {
      return createCombatant(teamObj[slot], teamKey, slot);
    });
  }

  function startTowerFight() {
    const tower = getTower(state.activeTowerId);
    const floor = currentFloor(tower.id);
    if (floor >= tower.floors) {
      showToast("Esta torre já foi concluída");
      return;
    }
    if (!state.team.front) {
      showToast("Coloque alguém na frente");
      return;
    }
    const playerTeam = playerTeamForFight(tower.teamSize);
    if (!playerTeam.front) {
      showToast("Equipe inválida para esta torre");
      return;
    }
    if (teamCountLocal(playerTeam) > tower.teamSize) {
      showToast("Esta torre aceita no máximo " + tower.teamSize + " herói(s)");
      return;
    }
    // trim extras beyond tower size already done by playerTeamForFight
    state.enemyTeam = buildEnemyTeam(tower, floor);
    try {
      const teamA = buildCombatTeam(playerTeam, "a", tower.teamSize);
      const teamB = buildCombatTeam(state.enemyTeam, "b", tower.teamSize);
      state.prevShield = {};
      state.shieldBreakLock = {};
      state.hasteAnnounced = false;
      ui.log.innerHTML = "";
      ui.teamACol.innerHTML = renderTeamCol("a", teamA);
      ui.teamBCol.innerHTML = renderTeamCol("b", teamB);
      teamA.concat(teamB).forEach(updateUnitBars);
      updateBattleTimer(0, false);
      showScreen("battle");
      showToast(tower.name + " · Andar " + (floor + 1));

      state.battle = new Battle(teamA, teamB, {
        onLog: appendLog,
        onHit: function (target, damage, isCrit, kind) {
          flashHit(target);
          spawnDamageNumber(target, damage, isCrit, kind);
        },
        onHeal: function (target, amount) {
          spawnDamageNumber(target, amount, false, "heal");
        },
        onAction: function (attacker, kind, target) {
          setAction(attacker, kind);
          playAttackMotion(attacker, kind, target || null);
        },
        onBuff: function (source, targets) {
          setAction(source, "buff");
          playStatusMotion(source, "buff", targets || []);
        },
        onDebuff: function (source, targets) {
          setAction(source, "debuff");
          playStatusMotion(source, "debuff", targets || []);
        },
        onFrame: function (battle) {
          battle.all.forEach(updateUnitBars);
        },
        onEnd: function (winnerTeam) {
          stopBattleLoop();
          const delay = Object.keys(state.shieldBreakLock).some(function (k) {
            return state.shieldBreakLock[k];
          }) ? 700 : 400;
          window.setTimeout(function () { finishBattle(winnerTeam); }, delay);
        },
      });

      state.lastTs = performance.now();
      const loop = function (ts) {
        if (!state.battle || state.battle.over) return;
        const rawDt = Math.min(0.05, (ts - state.lastTs) / 1000);
        state.lastTs = ts;
        const hasted = state.battle.elapsed >= HASTE_AFTER_SEC;
        if (hasted && !state.hasteAnnounced) {
          state.hasteAnnounced = true;
          showToast("30s! Combate acelerado 4×");
        }
        state.battle.tick(rawDt * (hasted ? HASTE_MULT : 1));
        updateBattleTimer(state.battle.elapsed, hasted);
        state.raf = requestAnimationFrame(loop);
      };
      state.raf = requestAnimationFrame(loop);
    } catch (err) {
      console.error(err);
      showToast("Erro: " + (err.message || err));
    }
  }

  function finishBattle(winnerTeam) {
    const won = winnerTeam === "a";
    if (won) {
      const tower = getTower(state.activeTowerId);
      const floor = currentFloor(tower.id);
      state.save.floorsCleared[tower.id] = floor + 1;
      if (floor + 1 >= tower.floors && state.save.unlockedTower < 3 && tower.id === state.save.unlockedTower) {
        state.save.unlockedTower = Math.min(3, tower.id + 1);
        showToast("Nova torre desbloqueada!");
      }
      persist();
      state._resultWin = true;
      ui.resultName.textContent = "Vitória!";
      ui.resultSummary.textContent =
        tower.name + " · Andar " + (floor + 1) + " limpo. Role um novo herói e decida se guarda ou vende.";
      showScreen("result");
    } else {
      state._resultWin = false;
      ui.resultName.textContent = winnerTeam ? "Derrota" : "Empate";
      ui.resultSummary.textContent = "Ajuste a formação e tente o andar de novo.";
      showScreen("result");
    }
  }

  function endEarly() {
    if (!state.battle || state.battle.over) return;
    stopBattleLoop();
    state.battle.over = true;
    finishBattle("b");
  }

  function beginStarterRoll() {
    state.save = defaultSave();
    state.team = emptyTeam();
    state.rollContext = "starter";
    state.rollOptions = makeRollOptions(3);
    state.selectedRollIdx = null;
    persist();
    showScreen("roll");
  }

  function beginRewardRoll() {
    state.rollContext = "reward";
    state.rollOptions = makeRollOptions(3);
    state.selectedRollIdx = null;
    showScreen("roll");
  }

  function chooseRoll(idx) {
    const opt = state.rollOptions[idx];
    if (!opt) return;
    if (state.rollContext === "starter") {
      addHeroToCollection(opt.id, { level: 1, awakened: 0 });
      state.save.hasStarter = true;
      state.team = emptyTeam();
      state.team.front = entryToPick(state.save.collection[opt.id]);
      state.activeSlot = "back0";
      state.flowAfterReward = false;
      state.flowStarter = true;
      persist();
      showToast(getTemplate(opt.id).name + " pronto — confira a formação");
      showScreen("formation");
      return;
    }
    // reward: escolher o herói → tela guardar/vender
    state.pendingReward = opt;
    showScreen("reward");
  }

  function afterRewardDecision() {
    state.pendingReward = null;
    state.flowAfterReward = true;
    showScreen("formation");
  }

  function keepReward() {
    const opt = state.pendingReward;
    if (!opt) return;
    const res = addHeroToCollection(opt.id, { level: opt.level || 1 });
    persist();
    const name = getTemplate(opt.id).name;
    if (res.created) showToast(name + " na coleção — veja a formação");
    else if (res.fused) showToast(name + " fundido! " + starsHtml(res.entry.rarity));
    else showToast("Cópia de " + name + " guardada");
    afterRewardDecision();
  }

  function sellReward() {
    const opt = state.pendingReward;
    if (!opt) return;
    const xp = sellXpValue(opt.level || 1, opt.rarity || 1);
    state.save.xp += xp;
    persist();
    showToast("+" + xp + " XP — veja a formação");
    afterRewardDecision();
  }

  function placeOwnedHero(id) {
    if (!state.save.collection[id]) return;
    if (SLOT_ORDER.some(function (s) { return state.team[s] && state.team[s].id === id; })) {
      showToast("Já está na equipe");
      return;
    }
    let slot = state.activeSlot;
    if (slot !== "front" && !state.team.front) slot = "front";
    state.team[slot] = entryToPick(state.save.collection[id]);
    const next = SLOT_ORDER.find(function (s) { return !state.team[s]; });
    if (next) state.activeSlot = next;
    persist();
    renderFormation();
    renderOwnedRoster();
    showDetailForPick(state.team[slot]);
  }

  function bind() {
    document.body.addEventListener("click", function (e) {
      const menuNew = e.target.closest("[data-menu='new']");
      const menuHeroes = e.target.closest("[data-menu='heroes']");
      const menuContinue = e.target.closest("[data-menu='continue']");
      if (menuNew) { beginStarterRoll(); return; }
      if (menuHeroes) { showScreen("heroes"); return; }
      if (menuContinue) {
        if (state.save.hasStarter) showScreen("formation");
        else beginStarterRoll();
        return;
      }

      const heroCard = e.target.closest("#heroes-list .hero-card");
      if (heroCard && state.mode === "heroes") {
        if (heroCard.classList.contains("locked")) {
          showToast("Ainda não obtido");
          return;
        }
        state.selectedHeroId = heroCard.getAttribute("data-id");
        renderHeroes();
        return;
      }

      const heroAct = e.target.closest("[data-hero-act]");
      if (heroAct && state.mode === "heroes") {
        const entry = state.save.collection[state.selectedHeroId];
        if (!entry) return;
        const act = heroAct.getAttribute("data-hero-act");
        if (act === "level") {
          const need = xpToNextLevel(entry.level);
          if (need == null) return;
          if (state.save.xp < need) { showToast("XP insuficiente"); return; }
          state.save.xp -= need;
          entry.level += 1;
          persist();
          showToast(getTemplate(entry.id).name + " → Nv." + entry.level);
          renderHeroes();
          syncTeamFromSave();
        } else if (act === "awaken") {
          if (!canAwaken(entry)) {
            if (entry.rarity < 5) showToast("Só desperta em 5★");
            else if (entry.awakened >= 3) showToast("Despertar no máximo");
            else showToast("Precisa de 1 cópia 5★");
            return;
          }
          awakenHero(entry);
          persist();
          showToast(getTemplate(entry.id).name + " → " + awakenedLabel(entry.awakened));
          renderHeroes();
          syncTeamFromSave();
        }
        return;
      }

      const rollCard = e.target.closest("[data-roll-idx]");
      if (rollCard && state.mode === "roll") {
        state.selectedRollIdx = Number(rollCard.getAttribute("data-roll-idx"));
        renderRoll();
        return;
      }

      const rewardBtn = e.target.closest("[data-reward]");
      if (rewardBtn && state.mode === "reward") {
        if (rewardBtn.getAttribute("data-reward") === "keep") keepReward();
        else sellReward();
        return;
      }

      const towerTab = e.target.closest("[data-tower]");
      if (towerTab && state.mode === "tower") {
        state.activeTowerId = Number(towerTab.getAttribute("data-tower"));
        renderTower();
        return;
      }

      const rosterCard = e.target.closest("#roster .char-card");
      if (rosterCard && state.mode === "formation" && !rosterCard.disabled) {
        placeOwnedHero(rosterCard.getAttribute("data-id"));
        return;
      }
    });

    ui.slotsFront.addEventListener("click", onSlotClick);
    ui.slotsBack.addEventListener("click", onSlotClick);
    const slotTap = { key: "", t: 0 };
    function onSlotClick(e) {
      const btn = e.target.closest(".slot");
      if (!btn || state.mode !== "formation") return;
      const slot = btn.getAttribute("data-slot");
      const key = slot;
      const now = Date.now();
      const pick = state.team[slot];
      if (pick && slotTap.key === key && now - slotTap.t <= 380) {
        slotTap.key = "";
        clearPlayerSlot(slot);
        renderFormation();
        renderOwnedRoster();
        showDetailForPick(state.team[state.activeSlot]);
        showToast("Removido da equipe");
        return;
      }
      slotTap.key = key;
      slotTap.t = now;
      state.activeSlot = slot;
      renderFormation();
      showDetailForPick(state.team[slot]);
    }

    ui.btnPrimary.addEventListener("click", function () {
      if (ui.btnPrimary.classList.contains("is-disabled")) return;
      if (state.mode === "menu") {
        if (state.save.hasStarter) showScreen("formation");
        else beginStarterRoll();
      } else if (state.mode === "heroes") {
        showScreen("formation");
      } else if (state.mode === "roll") {
        if (state.selectedRollIdx == null) {
          showToast("Toque um herói para ver os detalhes");
          return;
        }
        chooseRoll(state.selectedRollIdx);
      } else if (state.mode === "formation") {
        if (!state.team.front) {
          showToast("Coloque um herói na frente");
          return;
        }
        showScreen("tower");
      } else if (state.mode === "tower") {
        startTowerFight();
      } else if (state.mode === "battle") {
        endEarly();
      } else if (state.mode === "result") {
        if (state._resultWin) beginRewardRoll();
        else showScreen("tower");
      }
    });

    ui.btnSecondary.addEventListener("click", function () {
      if (state.mode === "menu") {
        showScreen("heroes");
      } else if (state.mode === "heroes") {
        // Volta ao ponto da campanha
        if (state.save && state.save.hasStarter) showScreen("formation");
        else showScreen("menu");
      } else if (state.mode === "formation") {
        showScreen("heroes");
      } else if (state.mode === "tower") {
        showScreen("formation");
      } else if (state.mode === "result") {
        if (!state._resultWin) showScreen("formation");
      }
    });
  }

  function init() {
    state.save = loadSave();
    syncTeamFromSave();
    state.activeTowerId = state.save.unlockedTower || 1;
    bind();
    syncXpBadge();
    showScreen("menu");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
