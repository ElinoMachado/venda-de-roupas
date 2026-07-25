(() => {
  "use strict";

  /* Garante CSS mesmo se o <link> for bloqueado pelo preview */
  (function ensureStyles() {
    if (document.getElementById("arena-inline-css")) return;
    const probe = document.createElement("div");
    probe.className = "app";
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    document.body.appendChild(probe);
    const styled = getComputedStyle(probe).minHeight !== "0px";
    probe.remove();
    if (styled) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/styles/style.css?v=7";
    document.head.appendChild(link);
  })();

  /* ========== Bônus de raridade por classe (por estrela) ========== */
  const RARITY_BONUS = {
    tank: {
      hp: 0.5,
      defense: 0.5,
      damage: 0.2,
      speed: 0.05,
      critChance: 0.02,
      critDamage: 0.05,
      skill: 0.2,
    },
    assassin: {
      hp: 0.2,
      defense: 0.15,
      damage: 0.35,
      speed: 0.12,
      critChance: 0.08,
      critDamage: 0.2,
      skill: 0.4,
    },
    mage: {
      hp: 0.1,
      defense: 0.05,
      damage: 0.1,
      speed: 0.3,
      critChance: 0.03,
      critDamage: 0.08,
      skill: 0.65,
    },
    fighter: {
      hp: 0.35,
      defense: 0.35,
      damage: 0.35,
      speed: 0.1,
      critChance: 0.05,
      critDamage: 0.05,
      skill: 0.3,
    },
  };

  /* ========== Personagens (kits base em 0★ conceitual; estrelas aplicam a tabela) ========== */
  const CHARACTERS = [
    {
      id: "nyx",
      name: "Nyx",
      className: "Assassino",
      role: "assassin",
      defaults: { level: 10, rarity: 3, awakened: 0 },
      color: "#e85d4c",
      glyph: "⚔",
      base: {
        hp: 720,
        manaMax: 5,
        staminaMax: 100,
        damage: 82,
        defense: 24,
        critChance: 0.22,
        critDamage: 1.7,
        speed: 40,
      },
      passiveName: "Lâmina Sombria",
      skillName: "Golpe Fantasma",
      skillManaCost: 3,
      skillBasePower: 2.0,
    },
    {
      id: "gareth",
      name: "Gareth",
      className: "Tank",
      role: "tank",
      defaults: { level: 10, rarity: 3, awakened: 0 },
      color: "#3d8f7a",
      glyph: "🛡",
      base: {
        hp: 1280,
        manaMax: 5,
        staminaMax: 100,
        damage: 52,
        defense: 68,
        critChance: 0.08,
        critDamage: 1.35,
        speed: 20,
      },
      passiveName: "Couraça Pesada",
      skillName: "Muralha de Ferro",
      skillManaCost: 3,
      skillBasePower: 1.3,
    },
    {
      id: "lyra",
      name: "Lyra",
      className: "Mago",
      role: "mage",
      defaults: { level: 10, rarity: 3, awakened: 0 },
      color: "#6c8cff",
      glyph: "✦",
      base: {
        hp: 640,
        manaMax: 5,
        staminaMax: 100,
        damage: 70,
        defense: 20,
        critChance: 0.14,
        critDamage: 1.55,
        speed: 46,
      },
      passiveName: "Catalisador Arcano",
      skillName: "Meteoro Arcano",
      skillManaCost: 3,
      skillBasePower: 2.4,
    },
    {
      id: "kael",
      name: "Kael",
      className: "Lutador",
      role: "fighter",
      defaults: { level: 10, rarity: 3, awakened: 0 },
      color: "#d4a017",
      glyph: "✊",
      base: {
        hp: 960,
        manaMax: 5,
        staminaMax: 100,
        damage: 74,
        defense: 42,
        critChance: 0.16,
        critDamage: 1.5,
        speed: 30,
      },
      passiveName: "Espírito de Luta",
      skillName: "Rajada de Golpes",
      skillManaCost: 3,
      skillBasePower: 1.8,
    },
  ];

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function getTemplate(id) {
    return CHARACTERS.find(function (c) {
      return c.id === id;
    });
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

  /** Nível sobe atributos brutos */
  function levelMult(level) {
    return 1 + (level - 1) * 0.04;
  }

  function rarityStars(rarity) {
    return clamp(rarity, 1, 5);
  }

  function rarityMult(rate, rarity) {
    return 1 + rarityStars(rarity) * rate;
  }

  function pct(n) {
    return Math.round(n * 100) + "%";
  }

  function resolveAbilities(template, rarity, awakened) {
    const a = awakened;
    const rb = RARITY_BONUS[template.role] || RARITY_BONUS.fighter;
    const skillMult = rarityMult(rb.skill, rarity);

    if (template.role === "assassin") {
      const passive = {
        critIgnoreDef: 0.2 + a * 0.05,
        critBonusDmg: 0.1 + a * 0.05,
        critStaminaRestore: a >= 1 ? 4 + a * 3 : 0,
        critBleedTicks: a >= 2 ? a - 1 : 0,
        critBleedPct: a >= 2 ? 0.03 + a * 0.01 : 0,
        critChanceBonus: a >= 3 ? 0.06 : 0,
      };
      const skill = {
        name: template.skillName,
        manaCost: template.skillManaCost,
        power: template.skillBasePower * skillMult * (1 + a * 0.07),
        ignoreDef: 0.1 + a * 0.05,
        bleedPct: 0.06 + a * 0.015,
        bleedTicks: 3 + (a >= 1 ? 1 : 0) + (a >= 3 ? 1 : 0),
        staminaDrain: a >= 1 ? 8 + a * 6 : 0,
      };
      const extras = [];
      if (passive.critStaminaRestore) extras.push("crítico restaura " + passive.critStaminaRestore + " estamina");
      if (passive.critBleedTicks) extras.push("crítico aplica sangramento (" + passive.critBleedTicks + " ticks)");
      if (passive.critChanceBonus) extras.push("+" + pct(passive.critChanceBonus) + " chance crítica");
      return {
        passive: passive,
        skill: skill,
        passiveName: template.passiveName,
        passiveDesc:
          "Críticos ignoram " +
          pct(passive.critIgnoreDef) +
          " da defesa e causam +" +
          pct(passive.critBonusDmg) +
          " de dano." +
          (extras.length ? " Despertar: " + extras.join("; ") + "." : ""),
        skillDesc:
          "Consome " +
          skill.manaCost +
          " mana. Causa " +
          Math.round(skill.power * 100) +
          "% do dano" +
          (skill.ignoreDef ? " (ignora " + pct(skill.ignoreDef) + " defesa)" : "") +
          " e sangramento (" +
          pct(skill.bleedPct) +
          " do HP máx., " +
          skill.bleedTicks +
          " ticks)." +
          (skill.staminaDrain ? " Extra: drena " + skill.staminaDrain + " estamina." : ""),
      };
    }

    if (template.role === "tank") {
      const passive = {
        damageReduction: 0.14 + a * 0.035,
        staminaOnHit: 5 + a * 3,
        shieldOnHitPct: a >= 1 ? 0.015 + a * 0.008 : 0,
        reflectPct: a >= 2 ? 0.04 + a * 0.015 : 0,
      };
      const skill = {
        name: template.skillName,
        manaCost: template.skillManaCost,
        power: template.skillBasePower * skillMult * (1 + a * 0.06),
        shieldPct: 0.14 + a * 0.03,
        selfHealPct: a >= 1 ? 0.04 + a * 0.015 : 0,
        enemyStaminaDrain: a >= 2 ? 12 + a * 4 : 0,
      };
      const extras = [];
      if (passive.shieldOnHitPct) extras.push("ao ser atingido ganha escudo (" + pct(passive.shieldOnHitPct) + " HP)");
      if (passive.reflectPct) extras.push("reflete " + pct(passive.reflectPct) + " do dano");
      return {
        passive: passive,
        skill: skill,
        passiveName: template.passiveName,
        passiveDesc:
          "Recebe " +
          pct(passive.damageReduction) +
          " menos dano. Ao ser atingido, recupera " +
          passive.staminaOnHit +
          " de estamina." +
          (extras.length ? " Despertar: " + extras.join("; ") + "." : ""),
        skillDesc:
          "Consome " +
          skill.manaCost +
          " mana. Causa " +
          Math.round(skill.power * 100) +
          "% do dano e ganha escudo de " +
          pct(skill.shieldPct) +
          " do HP máx." +
          (skill.selfHealPct ? " Cura " + pct(skill.selfHealPct) + " HP." : "") +
          (skill.enemyStaminaDrain ? " Drena " + skill.enemyStaminaDrain + " estamina do alvo." : ""),
      };
    }

    if (template.role === "mage") {
      const passive = {
        skillPowerBonus: 0.12 + a * 0.05,
        basicManaChance: 0.15 + a * 0.05,
        afterSkillStamina: a >= 1 ? 10 + a * 4 : 0,
        burnOnSkillTicks: a >= 2 ? 1 + a : 0,
        burnOnSkillPct: a >= 2 ? 0.025 + a * 0.01 : 0,
      };
      const skill = {
        name: template.skillName,
        manaCost: template.skillManaCost,
        power: template.skillBasePower * skillMult * (1 + a * 0.08) * (1 + passive.skillPowerBonus),
        ignoreDef: 0.2 + a * 0.06,
        staminaDrain: 10 + a * 5,
        burnTicks: 2 + (a >= 1 ? 1 : 0) + (a >= 3 ? 1 : 0),
        burnPct: 0.05 + a * 0.015,
      };
      const extras = [];
      if (passive.afterSkillStamina) extras.push("após skill recupera " + passive.afterSkillStamina + " estamina");
      if (passive.burnOnSkillTicks) extras.push("básicos podem aplicar queimadura");
      return {
        passive: passive,
        skill: skill,
        passiveName: template.passiveName,
        passiveDesc:
          "Habilidades causam +" +
          pct(passive.skillPowerBonus) +
          " de dano. Ataques básicos têm " +
          pct(passive.basicManaChance) +
          " de chance de gerar +1 mana." +
          (extras.length ? " Despertar: " + extras.join("; ") + "." : ""),
        skillDesc:
          "Consome " +
          skill.manaCost +
          " mana. Causa " +
          Math.round(skill.power * 100) +
          "% do dano (ignora " +
          pct(skill.ignoreDef) +
          " defesa), drena " +
          skill.staminaDrain +
          " estamina e aplica queimadura (" +
          pct(skill.burnPct) +
          " HP, " +
          skill.burnTicks +
          " ticks).",
      };
    }

    // Lutador
    const passive = {
      lowHpDamageBonus: 0.18 + a * 0.05,
      lowHpThreshold: 0.5,
      lifestealBasic: a >= 1 ? 0.06 + a * 0.02 : 0,
      stackDamage: a >= 2 ? 0.04 + a * 0.01 : 0,
      maxStacks: a >= 2 ? 3 + a : 0,
    };
    const skill = {
      name: template.skillName,
      manaCost: template.skillManaCost,
      power: template.skillBasePower * skillMult * (1 + a * 0.07),
      hits: 2 + (a >= 1 ? 1 : 0),
      lifestealPct: 0.1 + a * 0.04,
      selfBuffDamage: a >= 2 ? 0.12 + a * 0.04 : 0,
      selfBuffAttacks: a >= 2 ? 2 + a : 0,
    };
    const extras = [];
    if (passive.lifestealBasic) extras.push("básicos roubam " + pct(passive.lifestealBasic) + " de vida");
    if (passive.stackDamage) extras.push("acúmulo de +" + pct(passive.stackDamage) + " dano por golpe (máx " + passive.maxStacks + ")");
    return {
      passive: passive,
      skill: skill,
      passiveName: template.passiveName,
      passiveDesc:
        "Abaixo de " +
        pct(passive.lowHpThreshold) +
        " de vida, causa +" +
        pct(passive.lowHpDamageBonus) +
        " de dano." +
        (extras.length ? " Despertar: " + extras.join("; ") + "." : ""),
      skillDesc:
        "Consome " +
        skill.manaCost +
        " mana. Desfere " +
        skill.hits +
        " golpes totalizando " +
        Math.round(skill.power * 100) +
        "% do dano e rouba " +
        pct(skill.lifestealPct) +
        " do dano como vida." +
        (skill.selfBuffDamage
          ? " Extra: +" + pct(skill.selfBuffDamage) + " dano por " + skill.selfBuffAttacks + " ataques."
          : ""),
    };
  }

  function createCombatant(pick, side) {
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
    const damage = Math.round(b.damage * lm * rarityMult(rb.damage, rarity));
    const defense = Math.round(b.defense * lm * rarityMult(rb.defense, rarity));
    const speed = Math.round(b.speed * speedLm * rarityMult(rb.speed, rarity));
    const critChance = clamp(
      b.critChance + rarityStars(rarity) * rb.critChance + (abilities.passive.critChanceBonus || 0),
      0,
      0.95
    );
    const critDamage = b.critDamage + rarityStars(rarity) * rb.critDamage;

    return {
      id: template.id,
      side: side,
      name: template.name,
      className: template.className,
      role: template.role,
      level: level,
      rarity: rarity,
      awakened: awakened,
      color: template.color,
      glyph: template.glyph,
      passiveName: abilities.passiveName,
      passiveDesc: abilities.passiveDesc,
      passive: abilities.passive,
      skill: abilities.skill,
      skillDesc: abilities.skillDesc,
      maxHp: maxHp,
      hp: maxHp,
      manaMax: b.manaMax,
      mana: 2, // começa perto da skill para o combate ficar mais dinâmico
      staminaMax: b.staminaMax,
      stamina: 15,
      damage: damage,
      defense: defense,
      critChance: critChance,
      critDamage: critDamage,
      speed: speed,
      shield: 0,
      bleed: null,
      fightStacks: 0,
      buffAttacksLeft: 0,
      buffDamageBonus: 0,
      alive: true,
    };
  }

  function starsHtml(n) {
    return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
  }

  function awakenedLabel(n) {
    return n <= 0 ? "Base" : "Despertar " + n;
  }

  /* ========== Motor de batalha ========== */
  const BASE_STAMINA_PER_SEC = 12;
  const SPEED_TO_STAMINA = 0.55;
  const DEFENSE_FACTOR = 0.45;

  function rollCrit(chance) {
    return Math.random() < chance;
  }

  function calcRawDamage(attacker, defender, power, opts) {
    opts = opts || {};
    const ignoreDefense = opts.ignoreDefense || 0;
    const critBonus = opts.critBonus || 0;
    const forceCrit = !!opts.forceCrit;
    const def = defender.defense * (1 - ignoreDefense) * DEFENSE_FACTOR;
    let dmg = attacker.damage * power - def;
    const isCrit = forceCrit || rollCrit(attacker.critChance);
    if (isCrit) dmg *= attacker.critDamage * (1 + critBonus);
    return { damage: Math.max(1, Math.round(dmg)), isCrit: isCrit };
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

  function mitigate(defender, dmg) {
    const dr = defender.passive && defender.passive.damageReduction ? defender.passive.damageReduction : 0;
    if (!dr) return Math.max(1, Math.round(dmg));
    return Math.max(1, Math.round(dmg * (1 - dr)));
  }

  function afterBeingHit(defender, attacker, dealt) {
    const p = defender.passive || {};
    if (!defender.alive) return;
    if (p.staminaOnHit) {
      defender.stamina = clamp(defender.stamina + p.staminaOnHit, 0, defender.staminaMax);
    }
    if (p.shieldOnHitPct) {
      defender.shield += Math.round(defender.maxHp * p.shieldOnHitPct);
    }
    if (p.reflectPct && attacker && attacker.alive && dealt > 0) {
      const reflected = Math.max(1, Math.round(dealt * p.reflectPct));
      applyDamage(attacker, reflected);
      return reflected;
    }
    return 0;
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

  function applyBleed(target, pctHp, ticks) {
    applyDot(target, pctHp, ticks, "bleed");
  }

  function staminaRate(fighter) {
    return BASE_STAMINA_PER_SEC + fighter.speed * SPEED_TO_STAMINA;
  }

  function Battle(fighterA, fighterB, hooks) {
    this.a = fighterA;
    this.b = fighterB;
    this.hooks = hooks || {};
    this.log = [];
    this.elapsed = 0;
    this.over = false;
    this.winner = null;
    this._push(
      "Luta iniciada: " +
        fighterA.name +
        " (Nv." +
        fighterA.level +
        " " +
        starsHtml(fighterA.rarity) +
        " " +
        awakenedLabel(fighterA.awakened) +
        ") vs " +
        fighterB.name +
        " (Nv." +
        fighterB.level +
        " " +
        starsHtml(fighterB.rarity) +
        " " +
        awakenedLabel(fighterB.awakened) +
        ")",
      "system"
    );
  }

  Battle.prototype._push = function (text, kind, side) {
    const entry = { side: side || null, text: text, kind: kind || "info", t: performance.now() };
    this.log.push(entry);
    if (this.hooks.onLog) this.hooks.onLog(entry);
  };

  Battle.prototype._opponent = function (f) {
    return f.side === "a" ? this.b : this.a;
  };

  Battle.prototype._tickBleed = function (fighter, dt) {
    if (!fighter.bleed || !fighter.alive) return;
    fighter.bleed.acc = (fighter.bleed.acc || 0) + dt;
    while (fighter.bleed && fighter.bleed.acc >= 1 && fighter.bleed.ticks > 0) {
      fighter.bleed.acc -= 1;
      fighter.bleed.ticks -= 1;
      const dealt = applyDamage(fighter, fighter.bleed.damagePerTick).dealt;
      const dotName = fighter.bleed.type === "burn" ? "queimadura" : "sangramento";
      this._push(fighter.name + " sofre " + dealt + " de " + dotName, "dot", fighter.side);
      if (this.hooks.onHit) this.hooks.onHit(fighter, dealt, false, "bleed");
      if (!fighter.alive) {
        this._finish(this._opponent(fighter));
        return;
      }
      if (fighter.bleed.ticks <= 0) fighter.bleed = null;
    }
  };

  Battle.prototype._offenseBonus = function (attacker) {
    let bonus = 0;
    const p = attacker.passive || {};
    if (p.lowHpDamageBonus && attacker.hp / attacker.maxHp <= (p.lowHpThreshold || 0.5)) {
      bonus += p.lowHpDamageBonus;
    }
    if (attacker.buffAttacksLeft > 0 && attacker.buffDamageBonus) {
      bonus += attacker.buffDamageBonus;
    }
    if (attacker.fightStacks > 0 && p.stackDamage) {
      bonus += attacker.fightStacks * p.stackDamage;
    }
    return bonus;
  };

  Battle.prototype._consumeBuffAttack = function (attacker) {
    if (attacker.buffAttacksLeft > 0) {
      attacker.buffAttacksLeft -= 1;
      if (attacker.buffAttacksLeft <= 0) attacker.buffDamageBonus = 0;
    }
  };

  Battle.prototype._basicAttack = function (attacker) {
    const defender = this._opponent(attacker);
    const p = attacker.passive || {};
    const probeCrit = rollCrit(attacker.critChance);
    let ignoreDefense = 0;
    let critBonus = 0;
    if (probeCrit && p.critIgnoreDef) {
      ignoreDefense = p.critIgnoreDef;
      critBonus = p.critBonusDmg || 0;
    }

    const offense = 1 + this._offenseBonus(attacker);
    const def = defender.defense * (1 - ignoreDefense) * DEFENSE_FACTOR;
    let dmg = attacker.damage * offense - def;
    if (probeCrit) dmg *= attacker.critDamage * (1 + critBonus);
    dmg = mitigate(defender, Math.max(1, Math.round(dmg)));

    const result = applyDamage(defender, dmg);
    const reflected = afterBeingHit(defender, attacker, result.dealt);
    this._consumeBuffAttack(attacker);

    if (p.lifestealBasic && result.dealt > 0) {
      attacker.hp = clamp(attacker.hp + Math.round(result.dealt * p.lifestealBasic), 0, attacker.maxHp);
    }
    if (p.stackDamage && p.maxStacks) {
      attacker.fightStacks = clamp((attacker.fightStacks || 0) + 1, 0, p.maxStacks);
    }
    if (p.basicManaChance && Math.random() < p.basicManaChance) {
      attacker.mana = clamp(attacker.mana + 1, 0, attacker.manaMax);
      this._push(attacker.name + " canaliza +1 mana", "info", attacker.side);
    }
    if (p.burnOnSkillTicks && Math.random() < 0.35) {
      applyDot(defender, p.burnOnSkillPct, p.burnOnSkillTicks, "burn");
    }

    if (probeCrit) {
      if (p.critStaminaRestore) {
        attacker.stamina = clamp(attacker.stamina + p.critStaminaRestore, 0, attacker.staminaMax);
      }
      if (p.critBleedTicks) {
        applyBleed(defender, p.critBleedPct, p.critBleedTicks);
      }
    }

    const critTag = probeCrit ? " CRÍTICO!" : "";
    const shieldTag = result.absorbed ? " (" + result.absorbed + " bloqueado)" : "";
    this._push(
      attacker.name + " ataca " + defender.name + ": " + result.dealt + shieldTag + critTag,
      probeCrit ? "crit" : "hit",
      attacker.side
    );
    if (reflected) {
      this._push(defender.name + " reflete " + reflected + " em " + attacker.name, "hit", defender.side);
      if (this.hooks.onHit) this.hooks.onHit(attacker, reflected, false, "basic");
    }
    if (this.hooks.onAction) this.hooks.onAction(attacker, "basic");
    if (this.hooks.onHit) this.hooks.onHit(defender, result.dealt, probeCrit, "basic");
    if (!attacker.alive) this._finish(defender);
    else if (!defender.alive) this._finish(attacker);
  };

  Battle.prototype._castSkill = function (attacker) {
    const defender = this._opponent(attacker);
    const skill = attacker.skill;
    const p = attacker.passive || {};
    attacker.mana -= skill.manaCost;

    const hits = Math.max(1, skill.hits || 1);
    const powerPerHit = skill.power / hits;
    let totalDealt = 0;
    let anyCrit = false;
    let absorbedTotal = 0;

    for (let i = 0; i < hits; i++) {
      if (!defender.alive) break;
      const offense = 1 + this._offenseBonus(attacker);
      let raw = calcRawDamage(attacker, defender, powerPerHit * offense, {
        ignoreDefense: skill.ignoreDef || 0,
      });
      let damage = mitigate(defender, raw.damage);
      const result = applyDamage(defender, damage);
      totalDealt += result.dealt;
      absorbedTotal += result.absorbed;
      if (raw.isCrit) anyCrit = true;
    }

    const reflected = afterBeingHit(defender, attacker, totalDealt);
    this._consumeBuffAttack(attacker);

    let extras = [];
    if (skill.bleedTicks) {
      applyBleed(defender, skill.bleedPct, skill.bleedTicks);
      extras.push("sangramento");
    }
    if (skill.burnTicks) {
      applyDot(defender, skill.burnPct, skill.burnTicks, "burn");
      extras.push("queimadura");
    }
    if (skill.staminaDrain) {
      defender.stamina = clamp(defender.stamina - skill.staminaDrain, 0, defender.staminaMax);
      extras.push("drena estamina");
    }
    if (skill.enemyStaminaDrain) {
      defender.stamina = clamp(defender.stamina - skill.enemyStaminaDrain, 0, defender.staminaMax);
      extras.push("drena estamina");
    }
    if (skill.shieldPct) {
      const shieldAmt = Math.round(attacker.maxHp * skill.shieldPct);
      attacker.shield += shieldAmt;
      extras.push("escudo " + shieldAmt);
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
    if (skill.selfBuffDamage && skill.selfBuffAttacks) {
      attacker.buffDamageBonus = skill.selfBuffDamage;
      attacker.buffAttacksLeft = skill.selfBuffAttacks;
      extras.push("buff de dano");
    }
    if (p.afterSkillStamina) {
      attacker.stamina = clamp(attacker.stamina + p.afterSkillStamina, 0, attacker.staminaMax);
    }
    if (hits > 1) extras.unshift(hits + "x golpes");

    const shieldTag = absorbedTotal ? " (" + absorbedTotal + " bloqueado)" : "";
    this._push(
      attacker.name +
        " usa " +
        skill.name +
        ": " +
        totalDealt +
        shieldTag +
        (anyCrit ? " CRÍTICO!" : "") +
        (extras.length ? " + " + extras.join(" + ") : ""),
      "skill",
      attacker.side
    );
    if (reflected) {
      this._push(defender.name + " reflete " + reflected + " em " + attacker.name, "hit", defender.side);
      if (this.hooks.onHit) this.hooks.onHit(attacker, reflected, false, "skill");
    }
    if (this.hooks.onAction) this.hooks.onAction(attacker, "skill");
    if (this.hooks.onHit) this.hooks.onHit(defender, totalDealt, anyCrit, "skill");
    if (!attacker.alive) this._finish(defender);
    else if (!defender.alive) this._finish(attacker);
  };

  Battle.prototype._act = function (fighter) {
    if (!fighter.alive || this.over) return;
    fighter.mana = clamp(fighter.mana + 1, 0, fighter.manaMax);
    if (fighter.mana >= fighter.skill.manaCost) this._castSkill(fighter);
    else this._basicAttack(fighter);
  };

  Battle.prototype._finish = function (winner) {
    if (this.over) return;
    this.over = true;
    this.winner = winner;
    const loser = this._opponent(winner);
    this._push(winner.name + " venceu! " + loser.name + " foi derrotado.", "system");
    if (this.hooks.onEnd) this.hooks.onEnd(winner, loser);
  };

  Battle.prototype.tick = function (dt) {
    if (this.over) return;
    this.elapsed += dt;
    const fighters = [this.a, this.b];
    for (let i = 0; i < fighters.length; i++) {
      if (!fighters[i].alive) continue;
      this._tickBleed(fighters[i], dt);
      if (this.over) return;
    }
    for (let i = 0; i < fighters.length; i++) {
      const f = fighters[i];
      if (!f.alive || this.over) continue;
      f.stamina += staminaRate(f) * dt;
      if (f.stamina >= f.staminaMax) {
        f.stamina = 0;
        this._act(f);
      }
    }
    if (this.hooks.onFrame) this.hooks.onFrame(this);
  };

  /* ========== UI ========== */
  function $(sel) {
    return document.querySelector(sel);
  }

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
    buildPanel: $("#build-panel"),
    buildSlotLabel: $("#build-slot-label"),
    cfgLevel: $("#cfg-level"),
    cfgLevelVal: $("#cfg-level-val"),
    cfgRarity: $("#cfg-rarity"),
    cfgRarityVal: $("#cfg-rarity-val"),
    cfgAwaken: $("#cfg-awaken"),
    cfgAwakenVal: $("#cfg-awaken-val"),
    slotA: $("#slot-a"),
    slotB: $("#slot-b"),
    slotABody: $("#slot-a-body"),
    slotBBody: $("#slot-b-body"),
    btnPrimary: $("#btn-primary"),
    btnSwap: $("#btn-swap"),
    log: $("#battle-log"),
    resultName: $("#result-name"),
    resultSummary: $("#result-summary"),
    toast: $("#toast"),
  };

  const state = {
    mode: "select",
    activeSlot: "a",
    pick: { a: null, b: null },
    battle: null,
    raf: 0,
    lastTs: 0,
    prevShield: { a: 0, b: 0 },
    shieldBreakLock: { a: false, b: false },
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
    return '<span class="stars" aria-label="' + n + ' estrelas">' + starsHtml(n) + "</span>";
  }

  function activePick() {
    return state.pick[state.activeSlot];
  }

  function slotCardHtml(pick) {
    const ch = getTemplate(pick.id);
    return (
      '<div class="slot-card" style="--tone:' +
      ch.color +
      '">' +
      '<span class="avatar-mini">' +
      ch.glyph +
      "</span><div><strong>" +
      ch.name +
      "</strong><small>Nv." +
      pick.level +
      " · " +
      starsHtml(pick.rarity) +
      " · " +
      awakenedLabel(pick.awakened) +
      "</small></div></div>"
    );
  }

  function emptySlotHtml() {
    return '<span class="slot-empty">Toque um personagem</span>';
  }

  function canFight() {
    return !!(state.pick.a && state.pick.b && state.pick.a.id !== state.pick.b.id);
  }

  function updateSlots() {
    ui.slotABody.innerHTML = state.pick.a ? slotCardHtml(state.pick.a) : emptySlotHtml();
    ui.slotBBody.innerHTML = state.pick.b ? slotCardHtml(state.pick.b) : emptySlotHtml();
    ui.slotA.classList.toggle("active", state.activeSlot === "a" && state.mode === "select");
    ui.slotB.classList.toggle("active", state.activeSlot === "b" && state.mode === "select");
    ui.slotA.classList.toggle("filled", !!state.pick.a);
    ui.slotB.classList.toggle("filled", !!state.pick.b);
    ui.btnPrimary.classList.toggle("is-disabled", state.mode === "select" && !canFight());
    ui.btnPrimary.setAttribute("aria-disabled", state.mode === "select" && !canFight() ? "true" : "false");
    ui.btnSwap.hidden = !(state.pick.a && state.pick.b);
  }

  function syncBuildControls(pick) {
    if (!pick) return;
    ui.buildSlotLabel.textContent = state.activeSlot.toUpperCase();
    ui.cfgLevel.value = String(pick.level);
    ui.cfgLevelVal.textContent = String(pick.level);
    ui.cfgRarityVal.textContent = starsHtml(pick.rarity);
    ui.cfgAwakenVal.textContent = awakenedLabel(pick.awakened);

    ui.cfgRarity.innerHTML = [1, 2, 3, 4, 5]
      .map(function (n) {
        return (
          '<button type="button" data-rarity="' +
          n +
          '" class="' +
          (n <= pick.rarity ? "on" : "") +
          '" aria-label="' +
          n +
          ' estrelas">★</button>'
        );
      })
      .join("");

    ui.cfgAwaken.innerHTML = [0, 1, 2, 3]
      .map(function (n) {
        const label = n === 0 ? "Base" : "D" + n;
        return (
          '<button type="button" data-awaken="' +
          n +
          '" class="' +
          (n === pick.awakened ? "on" : "") +
          '">' +
          label +
          "</button>"
        );
      })
      .join("");
  }

  function showDetailForPick(pick) {
    if (!pick) {
      ui.detail.hidden = true;
      return;
    }
    const template = getTemplate(pick.id);
    const preview = createCombatant(pick, "preview");
    ui.detail.hidden = false;
    // Garante que os controles de build não fiquem atrás do dock
    window.requestAnimationFrame(function () {
      if (ui.buildPanel && state.mode === "select") {
        ui.buildPanel.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
    ui.detailName.textContent = template.name;
    ui.detailMeta.innerHTML =
      template.className +
      " · Nv." +
      pick.level +
      " · " +
      renderStars(pick.rarity) +
      " · " +
      awakenedLabel(pick.awakened);

    syncBuildControls(pick);

    const rows = [
      ["Vida", preview.maxHp],
      ["Mana", preview.manaMax],
      ["Estamina", preview.staminaMax],
      ["Dano", preview.damage],
      ["Defesa", preview.defense],
      ["Crit %", Math.round(preview.critChance * 100) + "%"],
      ["Dano Crit", preview.critDamage.toFixed(2) + "x"],
      ["Velocidade", preview.speed],
      ["Skill", Math.round(preview.skill.power * 100) + "%"],
    ];
    ui.detailStats.innerHTML = rows
      .map(function (r) {
        return "<li><span>" + r[0] + "</span><strong>" + r[1] + "</strong></li>";
      })
      .join("");

    ui.detailPassiveName.textContent = preview.passiveName;
    ui.detailPassiveDesc.textContent = preview.passiveDesc;
    ui.detailSkillName.textContent = preview.skill.name + " (" + preview.skill.manaCost + " mana)";
    ui.detailSkillDesc.textContent = preview.skillDesc;
  }

  function renderRoster() {
    ui.roster.innerHTML = CHARACTERS.map(function (ch) {
      const selected =
        (state.pick.a && state.pick.a.id === ch.id) ||
        (state.pick.b && state.pick.b.id === ch.id)
          ? "selected"
          : "";
      return (
        '<button type="button" class="char-card ' +
        selected +
        '" data-id="' +
        ch.id +
        '" style="--tone:' +
        ch.color +
        '">' +
        '<span class="char-glyph">' +
        ch.glyph +
        '</span><span class="char-name">' +
        ch.name +
        '</span><span class="char-class">' +
        ch.className +
        '</span><span class="char-meta">Ajuste Nv / ★ / Despertar</span>' +
        renderStars(ch.defaults.rarity) +
        "</button>"
      );
    }).join("");
  }

  function pickCharacter(id) {
    if (state.pick.a && state.pick.a.id === id) {
      state.activeSlot = "a";
      updateSlots();
      renderRoster();
      showDetailForPick(state.pick.a);
      return;
    }
    if (state.pick.b && state.pick.b.id === id) {
      state.activeSlot = "b";
      updateSlots();
      renderRoster();
      showDetailForPick(state.pick.b);
      return;
    }

    state.pick[state.activeSlot] = makePick(id);
    if (state.activeSlot === "a" && !state.pick.b) state.activeSlot = "b";
    else if (state.activeSlot === "b" && !state.pick.a) state.activeSlot = "a";

    // Se avançou de slot, mostra o personagem recém colocado no slot anterior
    const placedSlot = state.pick.a && state.pick.a.id === id ? "a" : "b";
    state.activeSlot = placedSlot;
    updateSlots();
    renderRoster();
    showDetailForPick(state.pick[placedSlot]);
  }

  function updateActiveBuild( partial) {
    const pick = activePick();
    if (!pick) return;
    if (partial.level != null) pick.level = clamp(partial.level, 1, 50);
    if (partial.rarity != null) pick.rarity = clamp(partial.rarity, 1, 5);
    if (partial.awakened != null) pick.awakened = clamp(partial.awakened, 0, 3);
    updateSlots();
    showDetailForPick(pick);
  }

  function showShieldBubble(side, on) {
    const sprite = $("#fighter-" + side + "-sprite");
    const bubble = $("#fighter-" + side + "-shield");
    if (!sprite || !bubble) return;
    sprite.classList.toggle("has-shield", on);
    bubble.classList.toggle("is-on", on);
  }

  function playShieldBreak(side) {
    const sprite = $("#fighter-" + side + "-sprite");
    const layer = $("#fighter-" + side + "-shield-break");
    const bubble = $("#fighter-" + side + "-shield");
    if (!sprite || !layer) return;

    state.shieldBreakLock[side] = true;
    showShieldBubble(side, false);

    layer.innerHTML = "";
    const shards = 12;
    for (let i = 0; i < shards; i++) {
      const shard = document.createElement("span");
      shard.className = "glass-shard";
      const angle = (Math.PI * 2 * i) / shards + (Math.random() * 0.4 - 0.2);
      const dist = 30 + Math.random() * 38;
      shard.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      shard.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      shard.style.setProperty("--rot", (Math.random() * 240 - 120).toFixed(0) + "deg");
      shard.style.animationDelay = (Math.random() * 0.04).toFixed(3) + "s";
      shard.style.width = 8 + Math.random() * 10 + "px";
      shard.style.height = 11 + Math.random() * 14 + "px";
      layer.appendChild(shard);
    }

    sprite.classList.remove("shield-breaking");
    void sprite.offsetWidth;
    sprite.classList.add("shield-breaking");
    if (bubble) bubble.classList.remove("is-on");

    window.setTimeout(function () {
      sprite.classList.remove("shield-breaking");
      layer.innerHTML = "";
      state.shieldBreakLock[side] = false;
      // Se ganhou escudo durante a quebra, mostra de novo
      if (state.battle) {
        const f = side === "a" ? state.battle.a : state.battle.b;
        if (f && f.shield > 0) showShieldBubble(side, true);
      }
    }, 620);
  }

  function syncShieldVisual(side, shieldValue) {
    const sprite = $("#fighter-" + side + "-sprite");
    if (!sprite) return;
    const prev = state.prevShield[side] || 0;
    const current = Math.max(0, shieldValue || 0);

    if (current > 0) {
      if (!state.shieldBreakLock[side]) showShieldBubble(side, true);
    } else {
      showShieldBubble(side, false);
      if (prev > 0 && !state.shieldBreakLock[side]) playShieldBreak(side);
    }
    state.prevShield[side] = current;
  }

  function setFighterUi(side, combatant) {
    const avatar = $("#fighter-" + side + "-avatar");
    avatar.textContent = combatant.glyph;
    avatar.style.setProperty("--tone", combatant.color);
    $("#fighter-" + side + "-name").textContent = combatant.name;
    $("#fighter-" + side + "-meta").innerHTML =
      "Nv." +
      combatant.level +
      " · " +
      renderStars(combatant.rarity) +
      "<br>" +
      awakenedLabel(combatant.awakened);
    $("#fighter-" + side + "-action").textContent = "Carregando estamina...";
    state.prevShield[side] = 0;
    state.shieldBreakLock[side] = false;
    const sprite = $("#fighter-" + side + "-sprite");
    if (sprite) {
      sprite.classList.remove("has-shield", "shield-breaking");
      const bubble = $("#fighter-" + side + "-shield");
      if (bubble) bubble.classList.remove("is-on");
      const breakLayer = $("#fighter-" + side + "-shield-break");
      if (breakLayer) breakLayer.innerHTML = "";
    }
    updateBars(side, combatant);
  }

  function updateBars(side, f) {
    $("#fighter-" + side + "-hp-fill").style.width = (f.hp / f.maxHp) * 100 + "%";
    $("#fighter-" + side + "-mana-fill").style.width = (f.mana / f.manaMax) * 100 + "%";
    $("#fighter-" + side + "-stamina-fill").style.width = (f.stamina / f.staminaMax) * 100 + "%";
    $("#fighter-" + side + "-hp-text").textContent =
      Math.ceil(f.hp) + "/" + f.maxHp + (f.shield ? " +" + f.shield : "");
    $("#fighter-" + side + "-mana-text").textContent = f.mana + "/" + f.manaMax;
    syncShieldVisual(side, f.shield);
  }

  function appendLog(entry) {
    const row = document.createElement("p");
    row.className =
      "log-row " + entry.kind + (entry.side ? " side-" + entry.side : "");
    row.textContent = entry.text;
    ui.log.prepend(row);
    while (ui.log.children.length > 40) ui.log.lastChild.remove();
  }

  function playAttackMotion(side, kind) {
    const el = $("#fighter-" + side);
    if (!el) return;
    el.classList.remove("attacking");
    void el.offsetWidth;
    el.classList.add("attacking");
    window.setTimeout(function () {
      el.classList.remove("attacking");
    }, 360);

    const layer = $("#slash-layer");
    if (!layer) return;
    const slash = document.createElement("div");
    slash.className = "slash from-" + side + (kind === "skill" ? " skill" : "");
    layer.appendChild(slash);
    window.setTimeout(function () {
      slash.remove();
    }, 420);
  }

  function flashHit(side) {
    const el = $("#fighter-" + side);
    if (!el) return;
    el.classList.remove("hit");
    void el.offsetWidth;
    el.classList.add("hit");
    window.setTimeout(function () {
      el.classList.remove("hit");
    }, 450);
  }

  function spawnDamageNumber(side, amount, isCrit, kind) {
    const layer = $("#fighter-" + side + "-floats");
    if (!layer || amount <= 0) return;
    const node = document.createElement("span");
    let cls = "dmg-float";
    if (kind === "bleed") cls += " bleed";
    else if (kind === "skill") cls += " skill";
    if (isCrit) cls += " crit";
    node.className = cls;
    node.textContent = (isCrit ? "CRIT " : "-") + amount;
    const jitter = (Math.random() * 24 - 12).toFixed(1);
    node.style.left = "calc(50% + " + jitter + "px)";
    layer.appendChild(node);
    window.setTimeout(function () {
      node.remove();
    }, 900);
  }

  function setAction(side, kind) {
    const el = $("#fighter-" + side + "-action");
    el.textContent = kind === "skill" ? "Habilidade!" : "Ataque básico";
    el.classList.remove("pulse");
    void el.offsetWidth;
    el.classList.add("pulse");
  }

  function showScreen(mode) {
    state.mode = mode;
    ui.select.hidden = mode !== "select";
    ui.battle.hidden = mode !== "battle";
    ui.result.hidden = mode !== "result";

    if (mode === "select") {
      ui.tagline.textContent = "Escolha e configure os lutadores";
      ui.btnPrimary.textContent = "Iniciar luta";
      ui.btnSwap.hidden = !(state.pick.a && state.pick.b);
    } else if (mode === "battle") {
      ui.tagline.textContent = "Combate em andamento";
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

  function battleSeconds() {
    return state.battle ? Math.max(1, Math.round(state.battle.elapsed)) : 0;
  }

  function startBattle() {
    if (!canFight()) {
      showToast("Selecione dois personagens diferentes");
      return;
    }

    try {
      const a = createCombatant(state.pick.a, "a");
      const b = createCombatant(state.pick.b, "b");

      ui.log.innerHTML = "";
      setFighterUi("a", a);
      setFighterUi("b", b);
      showScreen("battle");
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast(a.name + " vs " + b.name);

      state.battle = new Battle(a, b, {
        onLog: appendLog,
        onHit: function (target, damage, isCrit, kind) {
          flashHit(target.side);
          spawnDamageNumber(target.side, damage, isCrit, kind);
        },
        onAction: function (attacker, kind) {
          setAction(attacker.side, kind);
          playAttackMotion(attacker.side, kind);
        },
        onFrame: function (battle) {
          updateBars("a", battle.a);
          updateBars("b", battle.b);
        },
        onEnd: function (winner, loser) {
          stopBattleLoop();
          ui.resultName.textContent = winner.name;
          ui.resultSummary.textContent =
            winner.name +
            " (Nv." +
            winner.level +
            ") derrotou " +
            loser.name +
            " em " +
            battleSeconds() +
            "s.";
          // Espera a animação de escudo quebrando (se houver) antes do resultado
          const delay =
            state.shieldBreakLock.a || state.shieldBreakLock.b ? 700 : 280;
          window.setTimeout(function () {
            showScreen("result");
          }, delay);
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
      showToast("Erro ao iniciar luta: " + (err && err.message ? err.message : err));
    }
  }

  function endEarly() {
    if (!state.battle || state.battle.over) return;
    stopBattleLoop();
    const a = state.battle.a;
    const b = state.battle.b;
    const winner = a.hp / a.maxHp >= b.hp / b.maxHp ? a : b;
    const loser = winner === a ? b : a;
    state.battle.over = true;
    state.battle.winner = winner;
    ui.resultName.textContent = winner.name;
    ui.resultSummary.textContent =
      "Luta encerrada. " +
      winner.name +
      " venceu por vantagem de vida (" +
      Math.round((winner.hp / winner.maxHp) * 100) +
      "% vs " +
      Math.round((loser.hp / loser.maxHp) * 100) +
      "%).";
    showScreen("result");
  }

  function resetToSelect() {
    stopBattleLoop();
    state.battle = null;
    showScreen("select");
    updateSlots();
    renderRoster();
    showDetailForPick(activePick() || state.pick.a || state.pick.b);
  }

  function onPrimary() {
    if (state.mode === "select") startBattle();
    else if (state.mode === "battle") endEarly();
    else resetToSelect();
  }

  function bind() {
    ui.roster.addEventListener("click", function (e) {
      const btn = e.target.closest(".char-card");
      if (!btn || state.mode !== "select") return;
      pickCharacter(btn.getAttribute("data-id"));
    });

    ui.slotA.addEventListener("click", function () {
      if (state.mode !== "select") return;
      state.activeSlot = "a";
      updateSlots();
      if (state.pick.a) showDetailForPick(state.pick.a);
    });
    ui.slotB.addEventListener("click", function () {
      if (state.mode !== "select") return;
      state.activeSlot = "b";
      updateSlots();
      if (state.pick.b) showDetailForPick(state.pick.b);
    });

    ui.btnSwap.addEventListener("click", function () {
      const tmp = state.pick.a;
      state.pick.a = state.pick.b;
      state.pick.b = tmp;
      updateSlots();
      showDetailForPick(activePick());
    });

    ui.cfgLevel.addEventListener("input", function () {
      updateActiveBuild({ level: Number(ui.cfgLevel.value) });
    });

    ui.cfgRarity.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-rarity]");
      if (!btn) return;
      updateActiveBuild({ rarity: Number(btn.getAttribute("data-rarity")) });
    });

    ui.cfgAwaken.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-awaken]");
      if (!btn) return;
      updateActiveBuild({ awakened: Number(btn.getAttribute("data-awaken")) });
    });

    ui.btnPrimary.addEventListener("click", onPrimary);
  }

  function init() {
    if (!ui.btnPrimary || !ui.roster) {
      console.error("Arena RPG: elementos da UI não encontrados");
      return;
    }
    state.pick.a = makePick("nyx", { level: 12, rarity: 4, awakened: 1 });
    state.pick.b = makePick("gareth", { level: 12, rarity: 4, awakened: 0 });
    state.activeSlot = "a";
    bind();
    updateSlots();
    renderRoster();
    showDetailForPick(state.pick.a);
    showScreen("select");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
