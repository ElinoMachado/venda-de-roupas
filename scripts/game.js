(() => {
  "use strict";

  (function ensureStyles() {
    if (document.getElementById("arena-inline-css")) return;
    fetch("/styles/style.css?v=11")
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
  function levelMult(level) { return 1 + (level - 1) * 0.04; }
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
        staminaDrain: a >= 1 ? 8 + a * 6 : 0, targetMode: "lowest",
      };
      return pack(template, passive, skill,
        "Críticos ignoram " + pct(passive.critIgnoreDef) + " da defesa e causam +" + pct(passive.critBonusDmg) + " de dano.",
        "Causa " + Math.round(skill.power * 100) + "% do dano no alvo de menor vida e aplica sangramento.");
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
        targetMode: "back_random",
        ignoreDef: 0.2 + a * 0.06, staminaDrain: 10 + a * 5,
        burnTicks: 2 + (a >= 1 ? 1 : 0), burnPct: 0.05 + a * 0.015,
      };
      return pack(template, passive, skill,
        "Skills +" + pct(passive.skillPowerBonus) + ". Básicos podem gerar +1 mana. Mira a linha de trás.",
        "Meteoro na linha de trás: " + Math.round(skill.power * 100) + "% + queimadura.");
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
        "Abaixo de 50% HP causa +" + pct(passive.lowHpDamageBonus) + " de dano. Foca a linha de frente.",
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
        "Cura forte no aliado mais ferido e aplica buff de ataque/defesa no time.");
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
      "Mais resistente. Básicos aplicam lentidão e redução de ataque.",
      "Suprime o time inimigo: menos ataque, lentidão" + (skill.aoeMark ? " e marca de dano" : "") + ".");
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
    const speedLm = 1 + (level - 1) * 0.018;
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

  function pickBasicTarget(attacker, enemies) {
    const all = aliveOf(enemies);
    if (!all.length) return null;
    const front = frontOf(enemies);
    const back = backlineOf(enemies);

    if (attacker.role === "assassin") return lowestHp(all);

    if (attacker.role === "mage") {
      const pool = back.length ? back : all;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    // tanks, fighters, supports: front line (fallback any)
    if (attacker.passive && attacker.passive.canTargetBack) {
      return all[Math.floor(Math.random() * all.length)];
    }
    return front || all[0];
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
      }
      if (poke) {
        const dmg = mitigate(poke, Math.max(1, Math.round(attacker.damage * (p.basicDamageRatio || 0.3))), attacker);
        const res = applyDamage(poke, dmg);
        this._push(attacker.name + " acerta " + poke.name + ": " + res.dealt, "hit", attacker.team);
        if (this.hooks.onAction) this.hooks.onAction(attacker, "basic", poke);
        if (this.hooks.onHit) this.hooks.onHit(poke, res.dealt, false, "basic");
        this._afterHit(poke, attacker, res.dealt);
      } else if (wounded && this.hooks.onAction) {
        this.hooks.onAction(attacker, "heal", wounded);
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
    if (p.basicSlow || p.basicAtkDown) {
      target.speedMul = Math.min(target.speedMul || 1, 1 - (p.basicSlow || 0));
      target.atkMul = Math.min(target.atkMul || 1, 1 - (p.basicAtkDown || 0));
      target.debuffTimer = Math.max(target.debuffTimer, p.debuffDuration || 3);
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
      for (let i = 0; i < allies.length; i++) {
        const al = allies[i];
        if (!al.alive) continue;
        const h = Math.round(al.maxHp * skill.healAllRatio * 0.12 * skill.healPower);
        al.hp = clamp(al.hp + h, 0, al.maxHp);
        sideHeal += h;
        al.atkMul = Math.max(al.atkMul, 1 + skill.allyAtkBuff);
        al.defMul = Math.max(al.defMul, 1 + skill.allyDefBuff);
        al.buffTimer = Math.max(al.buffTimer, skill.buffDuration);
      }
      this._push(
        attacker.name + " usa " + skill.name + ": cura " + (main ? main.name + " +" + healMain : "") +
          " / time +" + sideHeal + " + buffs",
        "skill",
        attacker.team
      );
      if (this.hooks.onAction) this.hooks.onAction(attacker, "skill", main || null);
      return;
    }

    // Control AoE
    if (skill.targetMode === "enemy_all") {
      const targets = aliveOf(enemies);
      let total = 0;
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        if (this.hooks.onAction) this.hooks.onAction(attacker, "skill", t);
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
      this._checkEnd();
      return;
    }

    // Single-target skills
    let target = null;
    if (skill.targetMode === "lowest") target = lowestHp(enemies);
    else if (skill.targetMode === "back_random") {
      const back = backlineOf(enemies);
      const pool = back.length ? back : aliveOf(enemies);
      target = pool[Math.floor(Math.random() * pool.length)];
    } else {
      target = frontOf(enemies) || aliveOf(enemies)[0];
    }
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
    if (skill.selfBuffDamage) {
      attacker.buffDamageBonus = skill.selfBuffDamage;
      attacker.buffAttacksLeft = skill.selfBuffAttacks;
      extras.push("buff");
    }
    if (skill.selfDefenseBuff) {
      attacker.defMul = Math.max(attacker.defMul, 1 + skill.selfDefenseBuff);
      attacker.regenBonus = Math.max(attacker.regenBonus, skill.selfRegenBuff || 0);
      attacker.reflectBonus = Math.max(attacker.reflectBonus, skill.reflectBuff || 0);
      attacker.buffTimer = Math.max(attacker.buffTimer, skill.buffDuration || 5);
      extras.push("fortaleza");
    }
    if (skill.defenseShred) {
      target.defMul = Math.min(target.defMul || 1, 1 - skill.defenseShred);
      target.debuffTimer = Math.max(target.debuffTimer, skill.shredDuration || 5);
      extras.push("quebra defesa");
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

  /* ========== UI ========== */
  function $(sel) { return document.querySelector(sel); }

  const ui = {
    tagline: $("#screen-tagline"),
    select: $("#screen-select"),
    battle: $("#screen-battle"),
    result: $("#screen-result"),
    roster: $("#roster"),
    detail: $("#detail"),
    detailName: $("#detail-name"),
    detailMeta: $("#detail-meta"),
    detailStats: $("#detail-stats"),
    detailPassiveName: $("#detail-passive-name"),
    detailPassiveDesc: $("#detail-passive-desc"),
    detailSkillName: $("#detail-skill-name"),
    detailSkillDesc: $("#detail-skill-desc"),
    buildSlotLabel: $("#build-slot-label"),
    cfgLevel: $("#cfg-level"),
    cfgLevelVal: $("#cfg-level-val"),
    cfgRarity: $("#cfg-rarity"),
    cfgRarityVal: $("#cfg-rarity-val"),
    cfgAwaken: $("#cfg-awaken"),
    cfgAwakenVal: $("#cfg-awaken-val"),
    slotsFront: $("#slots-front"),
    slotsBack: $("#slots-back"),
    tabA: $("#tab-a"),
    tabB: $("#tab-b"),
    teamACol: $("#team-a-col"),
    teamBCol: $("#team-b-col"),
    btnPrimary: $("#btn-primary"),
    btnSwap: $("#btn-swap"),
    log: $("#battle-log"),
    resultName: $("#result-name"),
    resultSummary: $("#result-summary"),
    toast: $("#toast"),
  };

  const state = {
    mode: "select",
    activeTeam: "a",
    activeSlot: "front",
    teams: { a: emptyTeam(), b: emptyTeam() },
    battle: null,
    raf: 0,
    lastTs: 0,
    prevShield: {},
    shieldBreakLock: {},
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

  function renderStars(n) {
    return '<span class="stars">' + starsHtml(n) + "</span>";
  }

  function activePick() {
    return state.teams[state.activeTeam][state.activeSlot];
  }

  function allPicks() {
    const out = [];
    ["a", "b"].forEach(function (team) {
      SLOT_ORDER.forEach(function (slot) {
        const p = state.teams[team][slot];
        if (p) out.push({ team: team, slot: slot, pick: p });
      });
    });
    return out;
  }

  function usedIds() {
    return allPicks().map(function (x) { return x.pick.id; });
  }

  function teamCount(team) {
    return SLOT_ORDER.reduce(function (n, s) {
      return n + (state.teams[team][s] ? 1 : 0);
    }, 0);
  }

  /** Time válido: 1–3 heróis e sempre com alguém na frente */
  function teamReady(team) {
    const count = teamCount(team);
    return count >= 1 && count <= 3 && !!state.teams[team].front;
  }

  function canFight() {
    return teamReady("a") && teamReady("b");
  }

  function slotCardHtml(pick) {
    const ch = getTemplate(pick.id);
    return (
      '<div class="slot-card" style="--tone:' + ch.color + '">' +
      '<span class="avatar-mini">' + ch.glyph + "</span>" +
      "<div><strong>" + ch.name +
      "</strong><small>Nv." + pick.level + " · " + starsHtml(pick.rarity) + " · " +
      awakenedLabel(pick.awakened) + "</small></div></div>"
    );
  }

  function slotRemoveHtml(slot, name) {
    return (
      '<button type="button" class="slot-remove" data-remove="' + slot +
      '" aria-label="Remover ' + name + '" title="Remover">×</button>'
    );
  }

  function promoteFrontIfNeeded(team) {
    if (state.teams[team].front) return;
    for (let i = 0; i < 2; i++) {
      const slot = "back" + i;
      if (state.teams[team][slot]) {
        state.teams[team].front = state.teams[team][slot];
        state.teams[team][slot] = null;
        return;
      }
    }
  }

  function clearSlot(team, slot) {
    state.teams[team][slot] = null;
    if (slot === "front") promoteFrontIfNeeded(team);
    if (!state.teams[team].front) state.activeSlot = "front";
    else if (!state.teams[team][state.activeSlot]) {
      state.activeSlot = nextEmptySlot(team) || "front";
    }
  }

  function renderFormation() {
    const team = state.activeTeam;
    const front = state.teams[team].front;
    ui.slotsFront.innerHTML =
      '<div class="slot' +
      (state.activeSlot === "front" ? " active" : "") +
      (front ? " filled" : "") +
      '" data-slot="front" role="button" tabindex="0">' +
      (front
        ? slotRemoveHtml("front", getTemplate(front.id).name) + slotCardHtml(front)
        : '<span class="slot-label">F</span><span class="slot-empty">Frente (obrigatório)</span>') +
      "</div>";

    ui.slotsBack.innerHTML = ["back0", "back1"]
      .map(function (slot, i) {
        const pick = state.teams[team][slot];
        return (
          '<div class="slot' +
          (state.activeSlot === slot ? " active" : "") +
          (pick ? " filled" : "") +
          '" data-slot="' + slot + '" role="button" tabindex="0">' +
          (pick
            ? slotRemoveHtml(slot, getTemplate(pick.id).name) + slotCardHtml(pick)
            : '<span class="slot-label">T' + (i + 1) +
              '</span><span class="slot-empty">Trás (opcional)</span>') +
          "</div>"
        );
      })
      .join("");

    ui.tabA.classList.toggle("active", team === "a");
    ui.tabB.classList.toggle("active", team === "b");
    ui.btnPrimary.classList.toggle("is-disabled", !canFight());
    ui.btnPrimary.setAttribute("aria-disabled", canFight() ? "false" : "true");
  }

  function syncBuildControls(pick) {
    ui.buildSlotLabel.textContent = SLOT_LABELS[state.activeSlot] + " · Time " + state.activeTeam.toUpperCase();
    ui.cfgLevel.value = String(pick.level);
    ui.cfgLevelVal.textContent = String(pick.level);
    ui.cfgRarityVal.textContent = starsHtml(pick.rarity);
    ui.cfgAwakenVal.textContent = awakenedLabel(pick.awakened);
    ui.cfgRarity.innerHTML = [1, 2, 3, 4, 5]
      .map(function (n) {
        return '<button type="button" data-rarity="' + n + '" class="' + (n <= pick.rarity ? "on" : "") + '">★</button>';
      })
      .join("");
    ui.cfgAwaken.innerHTML = [0, 1, 2, 3]
      .map(function (n) {
        return '<button type="button" data-awaken="' + n + '" class="' + (n === pick.awakened ? "on" : "") + '">' +
          (n === 0 ? "Base" : "D" + n) + "</button>";
      })
      .join("");
  }

  function showDetailForPick(pick) {
    if (!pick) { ui.detail.hidden = true; return; }
    const template = getTemplate(pick.id);
    const preview = createCombatant(pick, "x", "front");
    ui.detail.hidden = false;
    ui.detailName.textContent = template.name;
    ui.detailMeta.innerHTML =
      template.className + " · Nv." + pick.level + " · " + renderStars(pick.rarity) + " · " + awakenedLabel(pick.awakened);
    syncBuildControls(pick);
    const rows = [
      ["Vida", preview.maxHp], ["Dano", preview.damage], ["Defesa", preview.defense],
      ["Velocidade", preview.speed], ["Crit %", Math.round(preview.critChance * 100) + "%"],
      ["Skill", preview.skill.power ? Math.round(preview.skill.power * 100) + "%" : "Suporte"],
    ];
    ui.detailStats.innerHTML = rows
      .map(function (r) { return "<li><span>" + r[0] + "</span><strong>" + r[1] + "</strong></li>"; })
      .join("");
    ui.detailPassiveName.textContent = preview.passiveName;
    ui.detailPassiveDesc.textContent = preview.passiveDesc;
    ui.detailSkillName.textContent = preview.skill.name + " (" + preview.skill.manaCost + " mana)";
    ui.detailSkillDesc.textContent = preview.skillDesc;
  }

  function renderRoster() {
    const used = usedIds();
    ui.roster.innerHTML = CHARACTERS.map(function (ch) {
      const taken = used.indexOf(ch.id) >= 0;
      return (
        '<button type="button" class="char-card' + (taken ? " selected" : "") +
        '" data-id="' + ch.id + '"' + (taken ? " disabled" : "") +
        ' style="--tone:' + ch.color + '">' +
        '<span class="char-glyph">' + ch.glyph + "</span>" +
        '<span class="char-name">' + ch.name + "</span>" +
        '<span class="char-class">' + ch.className + "</span>" +
        '<span class="char-meta">' + (taken ? "Em uso" : "Disponível") + "</span>" +
        renderStars(ch.defaults.rarity) +
        "</button>"
      );
    }).join("");
  }

  function nextEmptySlot(team) {
    for (let i = 0; i < SLOT_ORDER.length; i++) {
      if (!state.teams[team][SLOT_ORDER[i]]) return SLOT_ORDER[i];
    }
    return null;
  }

  function pickCharacter(id) {
    if (usedIds().indexOf(id) >= 0) {
      // focus existing
      const found = allPicks().find(function (x) { return x.pick.id === id; });
      if (found) {
        state.activeTeam = found.team;
        state.activeSlot = found.slot;
        renderFormation();
        renderRoster();
        showDetailForPick(found.pick);
      }
      return;
    }
    // Sempre preencher a frente antes das costas
    let slot = state.activeSlot;
    if (slot !== "front" && !state.teams[state.activeTeam].front) {
      slot = "front";
      state.activeSlot = "front";
    }
    if (teamCount(state.activeTeam) >= 3 && state.teams[state.activeTeam][slot]) {
      showToast("Máximo de 3 heróis por time");
      return;
    }
    state.teams[state.activeTeam][slot] = makePick(id);
    const placed = slot;
    const next = nextEmptySlot(state.activeTeam);
    if (next) state.activeSlot = next;
    renderFormation();
    renderRoster();
    showDetailForPick(state.teams[state.activeTeam][placed]);
  }

  function updateActiveBuild(partial) {
    const pick = activePick();
    if (!pick) return;
    if (partial.level != null) pick.level = clamp(partial.level, 1, 50);
    if (partial.rarity != null) pick.rarity = clamp(partial.rarity, 1, 5);
    if (partial.awakened != null) pick.awakened = clamp(partial.awakened, 0, 3);
    renderFormation();
    showDetailForPick(pick);
  }

  function fighterCardHtml(f) {
    const lineClass = f.line === "front" ? "front-liner" : "back-liner";
    return (
      '<article class="fighter side-' + f.team + " " + lineClass + '" id="fighter-' + f.uid + '" data-uid="' + f.uid + '">' +
      '<div class="fighter-sprite" id="fighter-' + f.uid + '-sprite">' +
      '<div class="shield-bubble" id="fighter-' + f.uid + '-shield"></div>' +
      '<div class="avatar" id="fighter-' + f.uid + '-avatar" style="--tone:' + f.color + '">' + f.glyph + "</div>" +
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
      '<div class="line-back" aria-label="Linha de trás">' +
      back.map(fighterCardHtml).join("") +
      "</div>" +
      '<div class="line-front" aria-label="Linha de frente">' +
      (front ? fighterCardHtml(front) : "") +
      "</div>"
    );
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

  function playAttackMotion(unit, kind, target) {
    const el = $("#fighter-" + unit.uid);
    if (!el) return;
    el.classList.remove("attacking");
    void el.offsetWidth;
    el.classList.add("attacking");
    window.setTimeout(function () { el.classList.remove("attacking"); }, 340);

    if (target) {
      const targetEl = $("#fighter-" + target.uid);
      if (targetEl) {
        targetEl.classList.remove("targeted");
        void targetEl.offsetWidth;
        targetEl.classList.add("targeted");
        window.setTimeout(function () { targetEl.classList.remove("targeted"); }, 520);
      }
    }

    const layer = $("#slash-layer");
    if (!layer) return;
    const fromEl = $("#fighter-" + unit.uid + "-avatar") || $("#fighter-" + unit.uid + "-sprite");
    const toEl = target
      ? ($("#fighter-" + target.uid + "-avatar") || $("#fighter-" + target.uid + "-sprite"))
      : null;
    if (!fromEl || !toEl) return;

    const layerRect = layer.getBoundingClientRect();
    const from = fromEl.getBoundingClientRect();
    const to = toEl.getBoundingClientRect();
    const x1 = from.left + from.width / 2 - layerRect.left;
    const y1 = from.top + from.height / 2 - layerRect.top;
    const x2 = to.left + to.width / 2 - layerRect.left;
    const y2 = to.top + to.height / 2 - layerRect.top;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.max(36, Math.hypot(dx, dy));
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    const slash = document.createElement("div");
    slash.className =
      "slash aimed from-" + unit.team +
      (kind === "skill" ? " skill" : "") +
      (kind === "heal" ? " heal" : "");
    slash.style.left = x1 + "px";
    slash.style.top = y1 + "px";
    slash.style.width = dist + "px";
    slash.style.setProperty("--slash-angle", angle + "deg");
    layer.appendChild(slash);

    // Marcador no alvo: “X” de impacto
    const mark = document.createElement("div");
    mark.className = "slash-mark" + (kind === "skill" ? " skill" : "") + (kind === "heal" ? " heal" : "");
    mark.style.left = x2 + "px";
    mark.style.top = y2 + "px";
    layer.appendChild(mark);

    window.setTimeout(function () {
      slash.remove();
      mark.remove();
    }, 480);
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
    el.textContent = kind === "skill" ? "Habilidade!" : kind === "heal" ? "Cura" : "Ataque";
  }

  function appendLog(entry) {
    const row = document.createElement("p");
    row.className = "log-row " + entry.kind + (entry.side ? " side-" + entry.side : "");
    row.textContent = entry.text;
    ui.log.prepend(row);
    while (ui.log.children.length > 50) ui.log.lastChild.remove();
  }

  function showScreen(mode) {
    state.mode = mode;
    ui.select.hidden = mode !== "select";
    ui.battle.hidden = mode !== "battle";
    ui.result.hidden = mode !== "result";
    if (mode === "select") {
      ui.tagline.textContent = "1–3 heróis · frente obrigatória";
      ui.btnPrimary.textContent = "Iniciar luta";
      ui.btnSwap.hidden = false;
    } else if (mode === "battle") {
      ui.tagline.textContent = "Combate";
      ui.btnPrimary.textContent = "Pular / Rendição";
      ui.btnSwap.hidden = true;
    } else {
      ui.tagline.textContent = "Fim da luta";
      ui.btnPrimary.textContent = "Nova luta";
      ui.btnSwap.hidden = true;
    }
    ui.btnPrimary.classList.toggle("is-disabled", mode === "select" && !canFight());
    ui.btnPrimary.removeAttribute("disabled");
  }

  function stopBattleLoop() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  function buildTeam(teamKey) {
    return SLOT_ORDER.filter(function (slot) {
      return !!state.teams[teamKey][slot];
    }).map(function (slot) {
      return createCombatant(state.teams[teamKey][slot], teamKey, slot);
    });
  }

  function startBattle() {
    if (!canFight()) {
      showToast("Cada time precisa de 1–3 heróis e alguém na frente");
      return;
    }
    try {
      const teamA = buildTeam("a");
      const teamB = buildTeam("b");
      state.prevShield = {};
      state.shieldBreakLock = {};
      ui.log.innerHTML = "";
      ui.teamACol.innerHTML = renderTeamCol("a", teamA);
      ui.teamBCol.innerHTML = renderTeamCol("b", teamB);
      teamA.concat(teamB).forEach(updateUnitBars);
      showScreen("battle");
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("Time A vs Time B");

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
        onFrame: function (battle) {
          battle.all.forEach(updateUnitBars);
        },
        onEnd: function (winnerTeam) {
          stopBattleLoop();
          if (!winnerTeam) {
            ui.resultName.textContent = "Empate";
            ui.resultSummary.textContent =
              "Os dois times caíram em " + Math.max(1, Math.round(state.battle.elapsed)) + "s.";
          } else {
            const survivors = (winnerTeam === "a" ? state.battle.teamA : state.battle.teamB)
              .filter(function (f) { return f.alive; })
              .map(function (f) { return f.name; })
              .join(", ");
            ui.resultName.textContent = "Time " + winnerTeam.toUpperCase();
            ui.resultSummary.textContent =
              "Vitória em " +
              Math.max(1, Math.round(state.battle.elapsed)) +
              "s." +
              (survivors ? " Em pé: " + survivors + "." : "");
          }
          const delay = Object.keys(state.shieldBreakLock).some(function (k) {
            return state.shieldBreakLock[k];
          }) ? 700 : 400;
          window.setTimeout(function () { showScreen("result"); }, delay);
        },
      });

      state.lastTs = performance.now();
      const loop = function (ts) {
        if (!state.battle || state.battle.over) return;
        const dt = Math.min(0.05, (ts - state.lastTs) / 1000);
        state.lastTs = ts;
        state.battle.tick(dt);
        state.raf = requestAnimationFrame(loop);
      };
      state.raf = requestAnimationFrame(loop);
    } catch (err) {
      console.error(err);
      showToast("Erro: " + (err.message || err));
    }
  }

  function endEarly() {
    if (!state.battle || state.battle.over) return;
    stopBattleLoop();
    const aAlive = state.battle.teamA.filter(function (f) { return f.alive; });
    const bAlive = state.battle.teamB.filter(function (f) { return f.alive; });
    // Rendição: vence quem ainda tem mais membros vivos (empate por HP%)
    let winner = null;
    if (aAlive.length !== bAlive.length) {
      winner = aAlive.length > bAlive.length ? "a" : "b";
    } else {
      const aHp = aAlive.reduce(function (s, f) { return s + f.hp / f.maxHp; }, 0);
      const bHp = bAlive.reduce(function (s, f) { return s + f.hp / f.maxHp; }, 0);
      if (aHp === bHp) winner = null;
      else winner = aHp > bHp ? "a" : "b";
    }
    state.battle.over = true;
    if (!winner) {
      ui.resultName.textContent = "Empate";
      ui.resultSummary.textContent = "Luta encerrada sem vantagem clara.";
    } else {
      ui.resultName.textContent = "Time " + winner.toUpperCase();
      ui.resultSummary.textContent =
        "Luta encerrada. Vivos — A: " + aAlive.length + " · B: " + bAlive.length + ".";
    }
    showScreen("result");
  }

  function resetToSelect() {
    stopBattleLoop();
    state.battle = null;
    showScreen("select");
    renderFormation();
    renderRoster();
    showDetailForPick(activePick());
  }

  function bind() {
    ui.roster.addEventListener("click", function (e) {
      const btn = e.target.closest(".char-card");
      if (!btn || btn.disabled || state.mode !== "select") return;
      pickCharacter(btn.getAttribute("data-id"));
    });

    ui.slotsFront.addEventListener("click", onSlotClick);
    ui.slotsBack.addEventListener("click", onSlotClick);
    ui.slotsFront.addEventListener("keydown", onSlotKey);
    ui.slotsBack.addEventListener("keydown", onSlotKey);

    function selectFormationSlot(slot) {
      state.activeSlot = slot;
      renderFormation();
      const pick = activePick();
      if (pick) showDetailForPick(pick);
      else ui.detail.hidden = true;
    }

    function onSlotClick(e) {
      const removeBtn = e.target.closest(".slot-remove");
      if (removeBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (state.mode !== "select") return;
        clearSlot(state.activeTeam, removeBtn.getAttribute("data-remove"));
        renderFormation();
        renderRoster();
        showDetailForPick(activePick());
        return;
      }
      const slotEl = e.target.closest(".slot");
      if (!slotEl || state.mode !== "select") return;
      selectFormationSlot(slotEl.getAttribute("data-slot"));
    }

    function onSlotKey(e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const slotEl = e.target.closest(".slot");
      if (!slotEl || state.mode !== "select") return;
      e.preventDefault();
      selectFormationSlot(slotEl.getAttribute("data-slot"));
    }

    ui.tabA.addEventListener("click", function () {
      state.activeTeam = "a";
      state.activeSlot = nextEmptySlot("a") || "front";
      renderFormation();
      showDetailForPick(activePick());
      renderRoster();
    });
    ui.tabB.addEventListener("click", function () {
      state.activeTeam = "b";
      state.activeSlot = nextEmptySlot("b") || "front";
      renderFormation();
      showDetailForPick(activePick());
      renderRoster();
    });

    ui.btnSwap.addEventListener("click", function () {
      const tmp = state.teams.a;
      state.teams.a = state.teams.b;
      state.teams.b = tmp;
      renderFormation();
      renderRoster();
      showDetailForPick(activePick());
      showToast("Times trocados");
    });

    ui.cfgLevel.addEventListener("input", function () {
      updateActiveBuild({ level: Number(ui.cfgLevel.value) });
    });
    ui.cfgRarity.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-rarity]");
      if (btn) updateActiveBuild({ rarity: Number(btn.getAttribute("data-rarity")) });
    });
    ui.cfgAwaken.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-awaken]");
      if (btn) updateActiveBuild({ awakened: Number(btn.getAttribute("data-awaken")) });
    });

    ui.btnPrimary.addEventListener("click", function () {
      if (state.mode === "select") startBattle();
      else if (state.mode === "battle") endEarly();
      else resetToSelect();
    });
  }

  function init() {
    // Time A padrão
    state.teams.a.front = makePick("gareth", { level: 12, rarity: 4, awakened: 1 });
    state.teams.a.back0 = makePick("lyra", { level: 12, rarity: 4, awakened: 0 });
    state.teams.a.back1 = makePick("mira", { level: 12, rarity: 3, awakened: 0 });
    // Time B padrão
    state.teams.b.front = makePick("rook", { level: 12, rarity: 4, awakened: 1 });
    state.teams.b.back0 = makePick("nyx", { level: 12, rarity: 4, awakened: 0 });
    state.teams.b.back1 = makePick("brutus", { level: 12, rarity: 3, awakened: 1 });

    state.activeTeam = "a";
    state.activeSlot = "front";
    bind();
    renderFormation();
    renderRoster();
    showDetailForPick(activePick());
    showScreen("select");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
