import {
  CHARACTERS,
  createCombatant,
  starsHtml,
  awakenedLabel,
} from "./characters.js";
import { Battle } from "./battle.js";

const $ = (sel) => document.querySelector(sel);

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
};

const state = {
  mode: "select", // select | battle | result
  activeSlot: "a",
  pick: { a: null, b: null },
  battle: null,
  raf: 0,
  lastTs: 0,
};

function renderStars(n) {
  return `<span class="stars" aria-label="${n} estrelas">${starsHtml(n)}</span>`;
}

function slotCardHtml(ch) {
  return `
    <div class="slot-card" style="--tone:${ch.color}">
      <span class="avatar-mini">${ch.glyph}</span>
      <div>
        <strong>${ch.name}</strong>
        <small>${ch.className} · Nv.${ch.level}</small>
      </div>
    </div>
  `;
}

function emptySlotHtml() {
  return `<span class="slot-empty">Toque um personagem</span>`;
}

function updateSlots() {
  ui.slotABody.innerHTML = state.pick.a ? slotCardHtml(state.pick.a) : emptySlotHtml();
  ui.slotBBody.innerHTML = state.pick.b ? slotCardHtml(state.pick.b) : emptySlotHtml();
  ui.slotA.classList.toggle("active", state.activeSlot === "a" && state.mode === "select");
  ui.slotB.classList.toggle("active", state.activeSlot === "b" && state.mode === "select");
  ui.slotA.classList.toggle("filled", !!state.pick.a);
  ui.slotB.classList.toggle("filled", !!state.pick.b);

  const ready = state.pick.a && state.pick.b && state.pick.a.id !== state.pick.b.id;
  ui.btnPrimary.disabled = !ready;
  ui.btnSwap.hidden = !(state.pick.a && state.pick.b);
}

function showDetail(ch) {
  ui.detail.hidden = false;
  ui.detailName.textContent = ch.name;
  ui.detailMeta.innerHTML = `${ch.className} · Nv.${ch.level} · ${renderStars(ch.rarity)} · ${awakenedLabel(ch.awakened)}`;
  const s = ch.base;
  ui.detailStats.innerHTML = [
    ["Vida", s.hp],
    ["Mana", s.manaMax],
    ["Estamina", s.staminaMax],
    ["Dano", s.damage],
    ["Defesa", s.defense],
    ["Crit %", `${Math.round(s.critChance * 100)}%`],
    ["Dano Crit", `${s.critDamage.toFixed(2)}x`],
    ["Velocidade", s.speed],
  ]
    .map(([k, v]) => `<li><span>${k}</span><strong>${v}</strong></li>`)
    .join("");
  ui.detailPassiveName.textContent = ch.passive.name;
  ui.detailPassiveDesc.textContent = ch.passive.description;
  ui.detailSkillName.textContent = `${ch.skill.name} (${ch.skill.manaCost} mana)`;
  ui.detailSkillDesc.textContent = ch.skill.description;
}

function renderRoster() {
  ui.roster.innerHTML = CHARACTERS.map((ch) => {
    const selected =
      state.pick.a?.id === ch.id || state.pick.b?.id === ch.id ? "selected" : "";
    return `
      <button type="button" class="char-card ${selected}" data-id="${ch.id}" style="--tone:${ch.color}" role="listitem">
        <span class="char-glyph">${ch.glyph}</span>
        <span class="char-name">${ch.name}</span>
        <span class="char-class">${ch.className}</span>
        <span class="char-meta">Nv.${ch.level} · ${awakenedLabel(ch.awakened)}</span>
        ${renderStars(ch.rarity)}
      </button>
    `;
  }).join("");
}

function pickCharacter(id) {
  const ch = CHARACTERS.find((c) => c.id === id);
  if (!ch) return;

  showDetail(ch);

  // Se já está no outro slot, troca o slot ativo
  if (state.pick.a?.id === id) {
    state.activeSlot = "a";
    updateSlots();
    renderRoster();
    return;
  }
  if (state.pick.b?.id === id) {
    state.activeSlot = "b";
    updateSlots();
    renderRoster();
    return;
  }

  state.pick[state.activeSlot] = ch;

  // Avança para o próximo slot vazio
  if (state.activeSlot === "a" && !state.pick.b) state.activeSlot = "b";
  else if (state.activeSlot === "b" && !state.pick.a) state.activeSlot = "a";

  updateSlots();
  renderRoster();
}

function setFighterUi(side, combatant) {
  $(`#fighter-${side}-avatar`).textContent = combatant.glyph;
  $(`#fighter-${side}-avatar`).style.setProperty("--tone", combatant.color);
  $(`#fighter-${side}-name`).textContent = combatant.name;
  $(`#fighter-${side}-meta`).innerHTML = `${combatant.className} · Nv.${combatant.level} · ${renderStars(combatant.rarity)}`;
  $(`#fighter-${side}-action`).textContent = "Pronto";
  updateBars(side, combatant);
}

function updateBars(side, f) {
  const hpPct = (f.hp / f.maxHp) * 100;
  const manaPct = (f.mana / f.manaMax) * 100;
  const staPct = (f.stamina / f.staminaMax) * 100;
  $(`#fighter-${side}-hp-fill`).style.width = `${hpPct}%`;
  $(`#fighter-${side}-mana-fill`).style.width = `${manaPct}%`;
  $(`#fighter-${side}-stamina-fill`).style.width = `${staPct}%`;
  $(`#fighter-${side}-hp-text`).textContent = `${Math.ceil(f.hp)}/${f.maxHp}${f.shield ? ` +${f.shield}` : ""}`;
  $(`#fighter-${side}-mana-text`).textContent = `${f.mana}/${f.manaMax}`;
}

function appendLog(entry) {
  const row = document.createElement("p");
  row.className = `log-row ${entry.kind}${entry.side ? ` side-${entry.side}` : ""}`;
  row.textContent = entry.text;
  ui.log.prepend(row);
  while (ui.log.children.length > 40) ui.log.lastChild.remove();
}

function flashHit(side) {
  const el = $(`#fighter-${side}`);
  el.classList.remove("hit");
  void el.offsetWidth;
  el.classList.add("hit");
}

function setAction(side, kind) {
  const el = $(`#fighter-${side}-action`);
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
    ui.btnPrimary.disabled = !(state.pick.a && state.pick.b);
    ui.btnSwap.hidden = !(state.pick.a && state.pick.b);
  } else if (mode === "battle") {
    ui.tagline.textContent = "Combate em andamento";
    ui.btnPrimary.textContent = "Pular / Rendição";
    ui.btnPrimary.disabled = false;
    ui.btnSwap.hidden = true;
  } else {
    ui.tagline.textContent = "Fim da luta";
    ui.btnPrimary.textContent = "Nova luta";
    ui.btnPrimary.disabled = false;
    ui.btnSwap.hidden = true;
  }
}

function stopBattleLoop() {
  if (state.raf) cancelAnimationFrame(state.raf);
  state.raf = 0;
}

function startBattle() {
  if (!state.pick.a || !state.pick.b) return;

  const a = createCombatant(state.pick.a, "a");
  const b = createCombatant(state.pick.b, "b");

  ui.log.innerHTML = "";
  setFighterUi("a", a);
  setFighterUi("b", b);
  showScreen("battle");

  state.battle = new Battle(a, b, {
    onLog: appendLog,
    onHit: (target) => flashHit(target.side),
    onAction: (attacker, kind) => setAction(attacker.side, kind),
    onFrame: (battle) => {
      updateBars("a", battle.a);
      updateBars("b", battle.b);
    },
    onEnd: (winner, loser) => {
      stopBattleLoop();
      ui.resultName.textContent = winner.name;
      ui.resultSummary.textContent = `${winner.name} derrotou ${loser.name} em ${battleSeconds()}s.`;
      showScreen("result");
    },
  });

  state.lastTs = performance.now();
  const loop = (ts) => {
    if (!state.battle || state.battle.over) return;
    const dt = Math.min(0.05, (ts - state.lastTs) / 1000);
    state.lastTs = ts;
    state.battle.tick(dt);
    state.raf = requestAnimationFrame(loop);
  };
  state.raf = requestAnimationFrame(loop);
}

function battleSeconds() {
  return state.battle ? Math.max(1, Math.round(state.battle.elapsed)) : 0;
}

function endEarly() {
  if (!state.battle || state.battle.over) return;
  stopBattleLoop();
  // Considera o com mais % de vida como vencedor
  const a = state.battle.a;
  const b = state.battle.b;
  const aPct = a.hp / a.maxHp;
  const bPct = b.hp / b.maxHp;
  const winner = aPct >= bPct ? a : b;
  const loser = winner === a ? b : a;
  state.battle.over = true;
  state.battle.winner = winner;
  ui.resultName.textContent = winner.name;
  ui.resultSummary.textContent = `Luta encerrada. ${winner.name} venceu por vantagem de vida (${Math.round((winner.hp / winner.maxHp) * 100)}% vs ${Math.round((loser.hp / loser.maxHp) * 100)}%).`;
  showScreen("result");
}

function resetToSelect() {
  stopBattleLoop();
  state.battle = null;
  showScreen("select");
  updateSlots();
  renderRoster();
}

function bind() {
  ui.roster.addEventListener("click", (e) => {
    const btn = e.target.closest(".char-card");
    if (!btn || state.mode !== "select") return;
    pickCharacter(btn.dataset.id);
  });

  ui.slotA.addEventListener("click", () => {
    if (state.mode !== "select") return;
    state.activeSlot = "a";
    updateSlots();
  });
  ui.slotB.addEventListener("click", () => {
    if (state.mode !== "select") return;
    state.activeSlot = "b";
    updateSlots();
  });

  ui.btnSwap.addEventListener("click", () => {
    const tmp = state.pick.a;
    state.pick.a = state.pick.b;
    state.pick.b = tmp;
    updateSlots();
  });

  ui.btnPrimary.addEventListener("click", () => {
    if (state.mode === "select") startBattle();
    else if (state.mode === "battle") endEarly();
    else resetToSelect();
  });
}

// Auto-seleciona os 2 personagens de teste
state.pick.a = CHARACTERS[0];
state.pick.b = CHARACTERS[1];
showDetail(CHARACTERS[0]);
bind();
updateSlots();
renderRoster();
showScreen("select");
