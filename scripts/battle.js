/**
 * Motor de batalha:
 * - Velocidade aumenta ganho de estamina/s
 * - Estamina cheia → +1 mana + ataque básico ou habilidade
 */

const BASE_STAMINA_PER_SEC = 12;
const SPEED_TO_STAMINA = 0.55;
const DEFENSE_FACTOR = 0.45;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function rollCrit(chance) {
  return Math.random() < chance;
}

function calcRawDamage(attacker, defender, power, { ignoreDefense = 0, critBonus = 0 } = {}) {
  const def = defender.defense * (1 - ignoreDefense) * DEFENSE_FACTOR;
  let dmg = attacker.damage * power - def;
  const isCrit = rollCrit(attacker.critChance);
  if (isCrit) {
    dmg *= attacker.critDamage * (1 + critBonus);
  }
  return { damage: Math.max(1, Math.round(dmg)), isCrit };
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
  return { dealt: remaining, absorbed };
}

function staminaRate(fighter) {
  return BASE_STAMINA_PER_SEC + fighter.speed * SPEED_TO_STAMINA;
}

function formatLog(side, text, kind = "info") {
  return { side, text, kind, t: performance.now() };
}

export class Battle {
  constructor(fighterA, fighterB, hooks = {}) {
    this.a = fighterA;
    this.b = fighterB;
    this.hooks = hooks;
    this.log = [];
    this.elapsed = 0;
    this.over = false;
    this.winner = null;
    this._push(`Luta iniciada: ${fighterA.name} vs ${fighterB.name}`, "system");
  }

  _push(text, kind = "info", side = null) {
    const entry = formatLog(side, text, kind);
    this.log.push(entry);
    this.hooks.onLog?.(entry);
  }

  _opponent(f) {
    return f.side === "a" ? this.b : this.a;
  }

  _tickBleed(fighter, dt) {
    if (!fighter.bleed || !fighter.alive) return;
    fighter.bleed.acc = (fighter.bleed.acc || 0) + dt;
    while (fighter.bleed && fighter.bleed.acc >= 1 && fighter.bleed.ticks > 0) {
      fighter.bleed.acc -= 1;
      fighter.bleed.ticks -= 1;
      const { dealt } = applyDamage(fighter, fighter.bleed.damagePerTick);
      this._push(
        `${fighter.name} sofre ${dealt} de sangramento`,
        "dot",
        fighter.side
      );
      this.hooks.onHit?.(fighter, dealt, false, "bleed");
      if (!fighter.alive) {
        this._finish(this._opponent(fighter));
        return;
      }
      if (fighter.bleed.ticks <= 0) fighter.bleed = null;
    }
  }

  _basicAttack(attacker) {
    const defender = this._opponent(attacker);
    let ignoreDefense = 0;
    let critBonus = 0;

    if (attacker.role === "assassin") {
      // Passiva: críticos mais letais (aplicada no cálculo se critar — estimamos via flags)
      ignoreDefense = 0; // aplicado só em crit abaixo
    }

    // Primeiro roll com possível passiva de assassino
    const probeCrit = rollCrit(attacker.critChance);
    if (attacker.role === "assassin" && probeCrit) {
      ignoreDefense = 0.3;
      critBonus = 0.15;
    }

    const def = defender.defense * (1 - ignoreDefense) * DEFENSE_FACTOR;
    let dmg = attacker.damage - def;
    if (probeCrit) dmg *= attacker.critDamage * (1 + critBonus);
    dmg = Math.max(1, Math.round(dmg));

    // Passiva tank: -18% dano recebido
    if (defender.role === "tank") {
      dmg = Math.max(1, Math.round(dmg * 0.82));
    }

    const { dealt, absorbed } = applyDamage(defender, dmg);
    if (defender.role === "tank" && defender.alive) {
      defender.stamina = clamp(defender.stamina + 8, 0, defender.staminaMax);
    }

    const critTag = probeCrit ? " CRÍTICO!" : "";
    const shieldTag = absorbed ? ` (${absorbed} bloqueado)` : "";
    this._push(
      `${attacker.name} ataca ${defender.name}: ${dealt}${shieldTag}${critTag}`,
      probeCrit ? "crit" : "hit",
      attacker.side
    );
    this.hooks.onAction?.(attacker, "basic");
    this.hooks.onHit?.(defender, dealt, probeCrit, "basic");

    if (!defender.alive) this._finish(attacker);
  }

  _castSkill(attacker) {
    const defender = this._opponent(attacker);
    const skill = attacker.skill;
    attacker.mana -= skill.manaCost;

    if (attacker.role === "assassin") {
      let { damage, isCrit } = calcRawDamage(attacker, defender, skill.power, {
        ignoreDefense: 0.15,
      });
      if (defender.role === "tank") damage = Math.max(1, Math.round(damage * 0.82));
      const { dealt, absorbed } = applyDamage(defender, damage);
      const bleedTick = Math.max(1, Math.round(defender.maxHp * 0.08));
      defender.bleed = { ticks: 3, damagePerTick: bleedTick, acc: 0 };
      if (defender.role === "tank" && defender.alive) {
        defender.stamina = clamp(defender.stamina + 8, 0, defender.staminaMax);
      }
      const shieldTag = absorbed ? ` (${absorbed} bloqueado)` : "";
      this._push(
        `${attacker.name} usa ${skill.name}: ${dealt}${shieldTag}${isCrit ? " CRÍTICO!" : ""} + sangramento`,
        "skill",
        attacker.side
      );
      this.hooks.onAction?.(attacker, "skill");
      this.hooks.onHit?.(defender, dealt, isCrit, "skill");
      if (!defender.alive) this._finish(attacker);
      return;
    }

    if (attacker.role === "tank") {
      let { damage, isCrit } = calcRawDamage(attacker, defender, skill.power);
      const { dealt, absorbed } = applyDamage(defender, damage);
      const shieldAmt = Math.round(attacker.maxHp * 0.18);
      attacker.shield += shieldAmt;
      const shieldTag = absorbed ? ` (${absorbed} bloqueado)` : "";
      this._push(
        `${attacker.name} usa ${skill.name}: ${dealt}${shieldTag}${isCrit ? " CRÍTICO!" : ""} + escudo ${shieldAmt}`,
        "skill",
        attacker.side
      );
      this.hooks.onAction?.(attacker, "skill");
      this.hooks.onHit?.(defender, dealt, isCrit, "skill");
      if (!defender.alive) this._finish(attacker);
    }
  }

  _act(fighter) {
    if (!fighter.alive || this.over) return;
    fighter.mana = clamp(fighter.mana + 1, 0, fighter.manaMax);
    this.hooks.onMana?.(fighter);

    if (fighter.mana >= fighter.skill.manaCost) {
      this._castSkill(fighter);
    } else {
      this._basicAttack(fighter);
    }
  }

  _finish(winner) {
    if (this.over) return;
    this.over = true;
    this.winner = winner;
    const loser = this._opponent(winner);
    this._push(`${winner.name} venceu! ${loser.name} foi derrotado.`, "system");
    this.hooks.onEnd?.(winner, loser);
  }

  tick(dt) {
    if (this.over) return;
    this.elapsed += dt;

    for (const f of [this.a, this.b]) {
      if (!f.alive) continue;
      this._tickBleed(f, dt);
      if (this.over) return;
    }

    for (const f of [this.a, this.b]) {
      if (!f.alive || this.over) continue;
      f.stamina += staminaRate(f) * dt;
      if (f.stamina >= f.staminaMax) {
        f.stamina = 0;
        this._act(f);
      }
    }

    this.hooks.onFrame?.(this);
  }

  snapshot(fighter) {
    return {
      hp: fighter.hp,
      maxHp: fighter.maxHp,
      mana: fighter.mana,
      manaMax: fighter.manaMax,
      stamina: fighter.stamina,
      staminaMax: fighter.staminaMax,
      shield: fighter.shield,
      alive: fighter.alive,
    };
  }
}
