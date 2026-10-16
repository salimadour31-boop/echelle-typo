/**
 * Échelle Typo — générateur d'échelle typographique modulaire
 * Maths : taille(n) = base × ratio^n
 * Interligne : on cherche le plus petit multiple de l'unité de baseline
 *             ≥ taille × 1.2 (confort lecture), exprimé en px puis / taille.
 */

(function () {
  "use strict";

  const ROOT_PX = 16; // 1rem / 1em de référence pour les conversions
  const PT_PER_PX = 72 / 96; // 1 px CSS ≈ 0.75 pt (96 dpi)

  // Noms d'échelons autour de la base (xs… → base → …2xl, 3xl…)
  const NAMES_BELOW = ["xs", "sm", "md"];
  const NAMES_ABOVE = ["lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl", "10xl", "11xl"];

  const els = {
    lang: document.getElementById("lang"),
    baseSize: document.getElementById("baseSize"),
    unit: document.getElementById("unit"),
    ratio: document.getElementById("ratio"),
    customRatio: document.getElementById("customRatio"),
    stepsBelow: document.getElementById("stepsBelow"),
    stepsAbove: document.getElementById("stepsAbove"),
    baseline: document.getElementById("baseline"),
    pageWidth: document.getElementById("pageWidth"),
    customWidth: document.getElementById("customWidth"),
    fgColor: document.getElementById("fgColor"),
    bgColor: document.getElementById("bgColor"),
    sampleText: document.getElementById("sampleText"),
    scaleBody: document.getElementById("scaleBody"),
    preview: document.getElementById("preview"),
    previewFrame: document.getElementById("previewFrame"),
    toast: document.getElementById("toast"),
    copyCss: document.getElementById("copyCss"),
    copyJson: document.getElementById("copyJson"),
    dlCss: document.getElementById("dlCss"),
    dlPng: document.getElementById("dlPng"),
  };

  let currentLang = "fr";
  let scale = []; // { step, name, px, display, unitStr, lhPx, lhRatio }

  function t(key) {
    const pack = I18N[currentLang] || I18N.fr;
    return pack[key] ?? I18N.fr[key] ?? key;
  }

  function applyI18n() {
    document.documentElement.lang = currentLang === "kab" ? "kab" : currentLang;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      const val = t(key);
      if (node.tagName === "OPTION") node.textContent = val;
      else node.textContent = val;
    });
    // Texte d'exemple : ne remplace que si vide ou encore une valeur par défaut connue
    const defaults = [I18N.fr.sampleDefault, I18N.en.sampleDefault, I18N.kab.sampleDefault];
    if (!els.sampleText.value.trim() || defaults.includes(els.sampleText.value)) {
      els.sampleText.value = t("sampleDefault");
    }
    document.title = t("title") + " — Modular Scale";
  }

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(showToast._tid);
    showToast._tid = setTimeout(() => els.toast.classList.remove("show"), 1800);
  }

  /** Convertit la taille de base saisie vers des pixels CSS. */
  function baseToPx(value, unit) {
    const v = Number(value);
    if (!isFinite(v) || v <= 0) return ROOT_PX;
    switch (unit) {
      case "rem":
      case "em":
        return v * ROOT_PX;
      case "pt":
        return v / PT_PER_PX; // pt → px
      default:
        return v; // px
    }
  }

  /** Convertit des pixels vers l'unité d'affichage choisie. */
  function pxToUnit(px, unit) {
    switch (unit) {
      case "rem":
      case "em":
        return px / ROOT_PX;
      case "pt":
        return px * PT_PER_PX;
      default:
        return px;
    }
  }

  function formatSize(n, unit) {
    const rounded = Math.round(n * 1000) / 1000;
    const s = Number.isInteger(rounded) ? String(rounded) : String(rounded);
    return s + unit;
  }

  /**
   * Interligne rythmé :
   * - cible ≈ 1.2 × taille (corps) ou 1.15 × (titres gros)
   * - on arrondit au multiple supérieur de `baseline` (en px)
   * - lhRatio = lhPx / fontPx (valeur CSS unitless)
   */
  function snapLineHeight(fontPx, baselinePx) {
    const comfort = fontPx >= 28 ? 1.15 : fontPx >= 20 ? 1.2 : 1.35;
    const target = fontPx * comfort;
    const steps = Math.max(1, Math.ceil(target / baselinePx));
    const lhPx = steps * baselinePx;
    return { lhPx, lhRatio: Math.round((lhPx / fontPx) * 1000) / 1000 };
  }

  function stepName(step, below, above) {
    if (step === 0) return "base";
    if (step < 0) {
      // step -1 = dernier de la liste "below" utilisée, etc.
      const idx = below + step; // step=-3, below=3 → idx=0 → xs
      if (idx >= 0 && idx < NAMES_BELOW.length) return NAMES_BELOW[idx];
      // Au-delà : xxs, 3xs…
      const extra = Math.abs(step) - below;
      return extra <= 0 ? "xs" : (extra + 1) + "xs";
    }
    // step > 0
    if (step - 1 < NAMES_ABOVE.length) return NAMES_ABOVE[step - 1];
    return step + "xl";
  }

  /** Recalcule toute l'échelle. */
  function computeScale() {
    const unit = els.unit.value;
    const basePx = baseToPx(els.baseSize.value, unit);
    let ratio = els.ratio.value === "custom"
      ? Number(els.customRatio.value)
      : Number(els.ratio.value);
    if (!isFinite(ratio) || ratio <= 1) ratio = 1.25;

    const below = Math.max(0, Math.min(8, parseInt(els.stepsBelow.value, 10) || 0));
    const above = Math.max(0, Math.min(12, parseInt(els.stepsAbove.value, 10) || 0));
    const baselinePx = Math.max(2, Number(els.baseline.value) || 8);

    const steps = [];
    for (let n = -below; n <= above; n++) {
      // taille = base × ratio^n  (n négatif → plus petit)
      const px = basePx * Math.pow(ratio, n);
      const display = pxToUnit(px, unit);
      const { lhPx, lhRatio } = snapLineHeight(px, baselinePx);
      const name = stepName(n, below, above);
      steps.push({
        step: n,
        name,
        px: Math.round(px * 1000) / 1000,
        display: Math.round(display * 1000) / 1000,
        unitStr: formatSize(display, unit),
        lhPx,
        lhRatio,
        cssVar: "--fs-" + name,
      });
    }
    scale = steps;
    return steps;
  }

  function renderTable() {
    const frag = document.createDocumentFragment();
    scale.forEach((row) => {
      const tr = document.createElement("tr");
      if (row.step === 0) tr.classList.add("is-base");
      tr.innerHTML =
        "<td>" + row.step + "</td>" +
        "<td><code>" + row.name + "</code></td>" +
        "<td>" + row.unitStr + "</td>" +
        "<td>" + row.px + "px</td>" +
        "<td>" + row.lhPx + "px</td>" +
        "<td>" + row.lhRatio + "</td>";
      frag.appendChild(tr);
    });
    els.scaleBody.replaceChildren(frag);
  }

  function pageMaxWidth() {
    const mode = els.pageWidth.value;
    if (mode === "a4") return 794; // ~210mm @ 96dpi
    if (mode === "letter") return 816;
    if (mode === "custom") return Math.max(200, Number(els.customWidth.value) || 600);
    return null;
  }

  function renderPreview() {
    const fg = els.fgColor.value;
    const bg = els.bgColor.value;
    const text = els.sampleText.value || t("sampleDefault");
    const maxW = pageMaxWidth();

    els.preview.style.color = fg;
    els.preview.style.background = bg;
    els.preview.style.maxWidth = maxW ? maxW + "px" : "100%";
    els.preview.style.fontFamily =
      'Georgia, "Times New Roman", Times, serif';

    const frag = document.createDocumentFragment();
    // Afficher du plus grand au plus petit pour un aperçu type "spécimen"
    [...scale].reverse().forEach((row) => {
      const block = document.createElement("div");
      block.className = "step";
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = row.name + " · " + row.unitStr + " · lh " + row.lhRatio;
      const p = document.createElement("p");
      p.style.margin = "0";
      p.style.fontSize = row.px + "px";
      p.style.lineHeight = String(row.lhRatio);
      p.style.fontWeight = row.step >= 2 ? "700" : row.step >= 1 ? "600" : "400";
      p.textContent = text;
      block.appendChild(meta);
      block.appendChild(p);
      frag.appendChild(block);
    });
    els.preview.replaceChildren(frag);
  }

  function refresh() {
    computeScale();
    renderTable();
    renderPreview();
  }

  function buildCss() {
    const lines = [
      "/* Échelle Typo — variables générées */",
      ":root {",
    ];
    scale.forEach((row) => {
      lines.push("  " + row.cssVar + ": " + row.unitStr + ";");
      lines.push("  " + row.cssVar.replace("--fs-", "--lh-") + ": " + row.lhRatio + ";");
    });
    lines.push("}");
    lines.push("");
    scale.forEach((row) => {
      lines.push(
        ".text-" + row.name + " { font-size: var(" + row.cssVar +
        "); line-height: var(" + row.cssVar.replace("--fs-", "--lh-") + "); }"
      );
    });
    lines.push("");
    return lines.join("\n");
  }

  function buildJson() {
    return JSON.stringify(
      {
        base: Number(els.baseSize.value),
        unit: els.unit.value,
        ratio: els.ratio.value === "custom"
          ? Number(els.customRatio.value)
          : Number(els.ratio.value),
        baselinePx: Number(els.baseline.value),
        scale: scale.map((r) => ({
          step: r.step,
          name: r.name,
          size: r.unitStr,
          px: r.px,
          lineHeightPx: r.lhPx,
          lineHeight: r.lhRatio,
          cssVar: r.cssVar,
        })),
      },
      null,
      2
    );
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("copied"));
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      showToast(t("copied"));
    }
  }

  function downloadBlob(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(t("downloaded"));
  }

  /**
   * Capture PNG sans lib externe : on redessine l'échelle sur un <canvas>.
   */
  function downloadPng() {
    const pad = 28;
    const rowH = 36;
    const headerH = 52;
    const width = 720;
    const height = pad * 2 + headerH + scale.length * rowH + 24;
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);

    const bg = els.bgColor.value;
    const fg = els.fgColor.value;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Bandeau titre
    ctx.fillStyle = fg;
    ctx.globalAlpha = 0.08;
    ctx.fillRect(0, 0, width, headerH);
    ctx.globalAlpha = 1;

    ctx.fillStyle = fg;
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillText(t("title"), pad, 28);
    ctx.font = "400 12px system-ui, sans-serif";
    ctx.globalAlpha = 0.7;
    const ratioLabel =
      els.ratio.value === "custom"
        ? els.customRatio.value
        : els.ratio.options[els.ratio.selectedIndex].text;
    ctx.fillText(
      "base " + formatSize(Number(els.baseSize.value), els.unit.value) +
        " · " + ratioLabel,
      pad,
      46
    );
    ctx.globalAlpha = 1;

    let y = pad + headerH;
    scale.forEach((row) => {
      ctx.font = "600 13px ui-monospace, monospace";
      ctx.fillStyle = fg;
      ctx.fillText(row.name, pad, y + 14);
      ctx.font = "400 12px system-ui, sans-serif";
      ctx.globalAlpha = 0.75;
      ctx.fillText(row.unitStr + "  ·  " + row.px + "px  ·  lh " + row.lhRatio, pad + 90, y + 14);
      ctx.globalAlpha = 1;

      // Barre visuelle proportionnelle (log-ish clamp)
      const barW = Math.min(280, Math.max(12, row.px * 2.2));
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(width - pad - 280, y + 4, 280, 16);
      ctx.globalAlpha = 0.85;
      ctx.fillRect(width - pad - barW, y + 4, barW, 16);
      ctx.globalAlpha = 1;

      y += rowH;
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "echelle-typo.png";
      a.click();
      URL.revokeObjectURL(a.href);
      showToast(t("pngReady"));
    }, "image/png");
  }

  function syncCustomVisibility() {
    els.customRatio.hidden = els.ratio.value !== "custom";
    els.customWidth.hidden = els.pageWidth.value !== "custom";
  }

  function loadPrefs() {
    try {
      const lang = localStorage.getItem("echelle-typo-lang");
      if (lang && I18N[lang]) {
        currentLang = lang;
        els.lang.value = lang;
      }
      const raw = localStorage.getItem("echelle-typo-prefs");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.baseSize != null) els.baseSize.value = p.baseSize;
        if (p.unit) els.unit.value = p.unit;
        if (p.ratio) els.ratio.value = p.ratio;
        if (p.customRatio != null) els.customRatio.value = p.customRatio;
        if (p.stepsBelow != null) els.stepsBelow.value = p.stepsBelow;
        if (p.stepsAbove != null) els.stepsAbove.value = p.stepsAbove;
        if (p.baseline != null) els.baseline.value = p.baseline;
        if (p.pageWidth) els.pageWidth.value = p.pageWidth;
        if (p.customWidth != null) els.customWidth.value = p.customWidth;
        if (p.fgColor) els.fgColor.value = p.fgColor;
        if (p.bgColor) els.bgColor.value = p.bgColor;
      }
    } catch (_) { /* ignore */ }
  }

  function savePrefs() {
    try {
      localStorage.setItem("echelle-typo-lang", currentLang);
      localStorage.setItem(
        "echelle-typo-prefs",
        JSON.stringify({
          baseSize: els.baseSize.value,
          unit: els.unit.value,
          ratio: els.ratio.value,
          customRatio: els.customRatio.value,
          stepsBelow: els.stepsBelow.value,
          stepsAbove: els.stepsAbove.value,
          baseline: els.baseline.value,
          pageWidth: els.pageWidth.value,
          customWidth: els.customWidth.value,
          fgColor: els.fgColor.value,
          bgColor: els.bgColor.value,
        })
      );
    } catch (_) { /* ignore */ }
  }

  // Events
  els.lang.addEventListener("change", () => {
    currentLang = els.lang.value;
    applyI18n();
    savePrefs();
    refresh();
  });

  [
    els.baseSize, els.unit, els.ratio, els.customRatio,
    els.stepsBelow, els.stepsAbove, els.baseline,
    els.pageWidth, els.customWidth, els.fgColor, els.bgColor, els.sampleText,
  ].forEach((el) => {
    el.addEventListener("input", () => {
      syncCustomVisibility();
      savePrefs();
      refresh();
    });
    el.addEventListener("change", () => {
      syncCustomVisibility();
      savePrefs();
      refresh();
    });
  });

  els.copyCss.addEventListener("click", () => copyText(buildCss()));
  els.copyJson.addEventListener("click", () => copyText(buildJson()));
  els.dlCss.addEventListener("click", () =>
    downloadBlob("echelle-typo.css", buildCss(), "text/css")
  );
  els.dlPng.addEventListener("click", downloadPng);

  // Boot
  loadPrefs();
  syncCustomVisibility();
  applyI18n();
  refresh();
})();
