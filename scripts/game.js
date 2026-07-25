(() => {
  "use strict";

  /* ========== Personagens ========== */
  const CHARACTERS = [
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
        description:
          "Consome 3 mana. Causa 220% do dano e aplica sangramento (8% do HP máx. em 3 ticks).",
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
        description:
          "Recebe 18% menos dano. Ao ser atingido, recupera 8 de estamina.",
      },
      skill: {
        name: "Muralha de Ferro",
        description:
          "Consome 3 mana. Causa 140% do dano e ganha escudo de 18% do HP máx.",
        manaCost: 3,
        power: 1.4,
      },
    },
  ];

  function scaleFactor(rarity, awakened) {
    return (1 + (rarity - 1) * 0.06) * (1 + awakened * 0.1);
  }

  function createCombatant(template, side) {
    const m = scaleFactor(template.rarity, template.awakened) * (1 + (template.level - 1) * 0.02);
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
      passive: Object.assign({}, template.passive),
      skill: Object.assign({}, template.skill),
      maxHp: Math.round(b.hp * m),
      hp: Math.round(b.hp * m),
      manaMax: b.manaMax,
      mana: 0,
      staminaMax: b.staminaMax,
      stamina: 15,
      damage: Math.round(b.damage * m),
      defense: Math.round(b.defense * m),
      critChance: b.critChance,
      critDamage: b.critDamage,
      speed: b.speed,
      shield: 0,
      bleed: null,
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

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function rollCrit(chance) {
    return Math.random() < chance;
  }

  function calcRawDamage(attacker, defender, power, opts) {
    opts = opts || {};
    const ignoreDefense = opts.ignoreDefense || 0;
    const critBonus = opts.critBonus || 0;
    const def = defender.defense * (1 - ignoreDefense) * DEFENSE_FACTOR;
    let dmg = attacker.damage * power - def;
    const isCrit = rollCrit(attacker.critChance);
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
    this._push("Luta iniciada: " + fighterA.name + " vs " + fighterB.name, "system");
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
      this._push(fighter.name + " sofre " + dealt + " de sangramento", "dot", fighter.side);
      if (this.hooks.onHit) this.hooks.onHit(fighter, dealt, false, "bleed");
      if (!fighter.alive) {
        this._finish(this._opponent(fighter));
        return;
      }
      if (fighter.bleed.ticks <= 0) fighter.bleed = null;
    }
  };

  Battle.prototype._basicAttack = function (attacker) {
    const defender = this._opponent(attacker);
    let ignoreDefense = 0;
    let critBonus = 0;
    const probeCrit = rollCrit(attacker.critChance);
    if (attacker.role === "assassin" && probeCrit) {
      ignoreDefense = 0.3;
      critBonus = 0.15;
    }
    const def = defender.defense * (1 - ignoreDefense) * DEFENSE_FACTOR;
    let dmg = attacker.damage - def;
    if (probeCrit) dmg *= attacker.critDamage * (1 + critBonus);
    dmg = Math.max(1, Math.round(dmg));
    if (defender.role === "tank") dmg = Math.max(1, Math.round(dmg * 0.82));

    const result = applyDamage(defender, dmg);
    if (defender.role === "tank" && defender.alive) {
      defender.stamina = clamp(defender.stamina + 8, 0, defender.staminaMax);
    }
    const critTag = probeCrit ? " CRÍTICO!" : "";
    const shieldTag = result.absorbed ? " (" + result.absorbed + " bloqueado)" : "";
    this._push(
      attacker.name + " ataca " + defender.name + ": " + result.dealt + shieldTag + critTag,
      probeCrit ? "crit" : "hit",
      attacker.side
    );
    if (this.hooks.onAction) this.hooks.onAction(attacker, "basic");
    if (this.hooks.onHit) this.hooks.onHit(defender, result.dealt, probeCrit, "basic");
    if (!defender.alive) this._finish(attacker);
  };

  Battle.prototype._castSkill = function (attacker) {
    const defender = this._opponent(attacker);
    const skill = attacker.skill;
    attacker.mana -= skill.manaCost;

    if (attacker.role === "assassin") {
      let raw = calcRawDamage(attacker, defender, skill.power, { ignoreDefense: 0.15 });
      let damage = raw.damage;
      if (defender.role === "tank") damage = Math.max(1, Math.round(damage * 0.82));
      const result = applyDamage(defender, damage);
      defender.bleed = {
        ticks: 3,
        damagePerTick: Math.max(1, Math.round(defender.maxHp * 0.08)),
        acc: 0,
      };
      if (defender.role === "tank" && defender.alive) {
        defender.stamina = clamp(defender.stamina + 8, 0, defender.staminaMax);
      }
      const shieldTag = result.absorbed ? " (" + result.absorbed + " bloqueado)" : "";
      this._push(
        attacker.name +
          " usa " +
          skill.name +
          ": " +
          result.dealt +
          shieldTag +
          (raw.isCrit ? " CRÍTICO!" : "") +
          " + sangramento",
        "skill",
        attacker.side
      );
      if (this.hooks.onAction) this.hooks.onAction(attacker, "skill");
      if (this.hooks.onHit) this.hooks.onHit(defender, result.dealt, raw.isCrit, "skill");
      if (!defender.alive) this._finish(attacker);
      return;
    }

    if (attacker.role === "tank") {
      const raw = calcRawDamage(attacker, defender, skill.power);
      const result = applyDamage(defender, raw.damage);
      const shieldAmt = Math.round(attacker.maxHp * 0.18);
      attacker.shield += shieldAmt;
      const shieldTag = result.absorbed ? " (" + result.absorbed + " bloqueado)" : "";
      this._push(
        attacker.name +
          " usa " +
          skill.name +
          ": " +
          result.dealt +
          shieldTag +
          (raw.isCrit ? " CRÍTICO!" : "") +
          " + escudo " +
          shieldAmt,
        "skill",
        attacker.side
      );
      if (this.hooks.onAction) this.hooks.onAction(attacker, "skill");
      if (this.hooks.onHit) this.hooks.onHit(defender, result.dealt, raw.isCrit, "skill");
      if (!defender.alive) this._finish(attacker);
    }
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

  function slotCardHtml(ch) {
    return (
      '<div class="slot-card" style="--tone:' +
      ch.color +
      '">' +
      '<span class="avatar-mini">' +
      ch.glyph +
      "</span><div><strong>" +
      ch.name +
      "</strong><small>" +
      ch.className +
      " · Nv." +
      ch.level +
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

  function showDetail(ch) {
    ui.detail.hidden = false;
    ui.detailName.textContent = ch.name;
    ui.detailMeta.innerHTML =
      ch.className +
      " · Nv." +
      ch.level +
      " · " +
      renderStars(ch.rarity) +
      " · " +
      awakenedLabel(ch.awakened);
    const s = ch.base;
    const rows = [
      ["Vida", s.hp],
      ["Mana", s.manaMax],
      ["Estamina", s.staminaMax],
      ["Dano", s.damage],
      ["Defesa", s.defense],
      ["Crit %", Math.round(s.critChance * 100) + "%"],
      ["Dano Crit", s.critDamage.toFixed(2) + "x"],
      ["Velocidade", s.speed],
    ];
    ui.detailStats.innerHTML = rows
      .map(function (r) {
        return "<li><span>" + r[0] + "</span><strong>" + r[1] + "</strong></li>";
      })
      .join("");
    ui.detailPassiveName.textContent = ch.passive.name;
    ui.detailPassiveDesc.textContent = ch.passive.description;
    ui.detailSkillName.textContent = ch.skill.name + " (" + ch.skill.manaCost + " mana)";
    ui.detailSkillDesc.textContent = ch.skill.description;
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
        '</span><span class="char-meta">Nv.' +
        ch.level +
        " · " +
        awakenedLabel(ch.awakened) +
        "</span>" +
        renderStars(ch.rarity) +
        "</button>"
      );
    }).join("");
  }

  function pickCharacter(id) {
    const ch = CHARACTERS.find(function (c) {
      return c.id === id;
    });
    if (!ch) return;
    showDetail(ch);

    if (state.pick.a && state.pick.a.id === id) {
      state.activeSlot = "a";
      updateSlots();
      renderRoster();
      return;
    }
    if (state.pick.b && state.pick.b.id === id) {
      state.activeSlot = "b";
      updateSlots();
      renderRoster();
      return;
    }

    state.pick[state.activeSlot] = ch;
    if (state.activeSlot === "a" && !state.pick.b) state.activeSlot = "b";
    else if (state.activeSlot === "b" && !state.pick.a) state.activeSlot = "a";
    updateSlots();
    renderRoster();
  }

  function setFighterUi(side, combatant) {
    const avatar = $("#fighter-" + side + "-avatar");
    avatar.textContent = combatant.glyph;
    avatar.style.setProperty("--tone", combatant.color);
    $("#fighter-" + side + "-name").textContent = combatant.name;
    $("#fighter-" + side + "-meta").innerHTML =
      combatant.className +
      " · Nv." +
      combatant.level +
      " · " +
      renderStars(combatant.rarity);
    $("#fighter-" + side + "-action").textContent = "Carregando estamina...";
    updateBars(side, combatant);
  }

  function updateBars(side, f) {
    $("#fighter-" + side + "-hp-fill").style.width = (f.hp / f.maxHp) * 100 + "%";
    $("#fighter-" + side + "-mana-fill").style.width = (f.mana / f.manaMax) * 100 + "%";
    $("#fighter-" + side + "-stamina-fill").style.width = (f.stamina / f.staminaMax) * 100 + "%";
    $("#fighter-" + side + "-hp-text").textContent =
      Math.ceil(f.hp) + "/" + f.maxHp + (f.shield ? " +" + f.shield : "");
    $("#fighter-" + side + "-mana-text").textContent = f.mana + "/" + f.manaMax;
  }

  function appendLog(entry) {
    const row = document.createElement("p");
    row.className =
      "log-row " + entry.kind + (entry.side ? " side-" + entry.side : "");
    row.textContent = entry.text;
    ui.log.prepend(row);
    while (ui.log.children.length > 40) ui.log.lastChild.remove();
  }

  function flashHit(side) {
    const el = $("#fighter-" + side);
    el.classList.remove("hit");
    void el.offsetWidth;
    el.classList.add("hit");
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
      ui.tagline.textContent = "Escolha dois lutadores";
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
        onHit: function (target) {
          flashHit(target.side);
        },
        onAction: function (attacker, kind) {
          setAction(attacker.side, kind);
        },
        onFrame: function (battle) {
          updateBars("a", battle.a);
          updateBars("b", battle.b);
        },
        onEnd: function (winner, loser) {
          stopBattleLoop();
          ui.resultName.textContent = winner.name;
          ui.resultSummary.textContent =
            winner.name + " derrotou " + loser.name + " em " + battleSeconds() + "s.";
          showScreen("result");
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
    });
    ui.slotB.addEventListener("click", function () {
      if (state.mode !== "select") return;
      state.activeSlot = "b";
      updateSlots();
    });

    ui.btnSwap.addEventListener("click", function () {
      const tmp = state.pick.a;
      state.pick.a = state.pick.b;
      state.pick.b = tmp;
      updateSlots();
    });

    ui.btnPrimary.addEventListener("click", onPrimary);
  }

  function init() {
    if (!ui.btnPrimary || !ui.roster) {
      console.error("Arena RPG: elementos da UI não encontrados");
      return;
    }
    state.pick.a = CHARACTERS[0];
    state.pick.b = CHARACTERS[1];
    showDetail(CHARACTERS[0]);
    bind();
    updateSlots();
    renderRoster();
    showScreen("select");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
