function makeDemoMainTrials() {
  // 12 trials: each condition 4 times, broad coverage of the 6 target categories.
  const conditions = shuffle(["neutral","congruent","incongruent","neutral","congruent","incongruent","neutral","congruent","incongruent","neutral","congruent","incongruent"]);
  const cats = shuffle([...CATEGORIES, ...CATEGORIES]).slice(0, 12);
  const dirCounters = { neutral: 0, incongruent: 0 };
  return conditions.map((condition, i) => {
    const cat = cats[i];
    const jitter = randomInt(-CONFIG.jitterDeg, CONFIG.jitterDeg);
    let label_category = null;
    let label_direction = null;
    if (condition === "incongruent" || condition === "neutral") {
      const count = dirCounters[condition]++;
      label_direction = count % 2 === 0 ? "cw" : "ccw";
      label_category = neighborKey(cat.key, label_direction);
    }
    return {
      is_practice: false,
      condition,
      target_id: cat.key.toUpperCase(),
      target_category: cat.key,
      target_hue_deg: wrapHue(cat.hue + jitter),
      jitter_deg: jitter,
      label_category,
      label_direction,
      neutral_word: T.neutralWords[i % T.neutralWords.length],
    };
  });
}

function makeFullMainTrials() {
  // Build a separate 24-trial pool for each condition (6 targets × 4 reps).
  // Then distribute 8 trials from each condition into each block so every
  // 24-trial block contains exactly 8 neutral, 8 congruent, and 8 incongruent trials.
  const pools = { neutral: [], congruent: [], incongruent: [] };
  for (const condition of ["neutral", "congruent", "incongruent"]) {
    for (const cat of CATEGORIES) {
      for (let rep = 0; rep < CONFIG.fullRepetitionsPerTargetCondition; rep++) {
        const jitter = randomInt(-CONFIG.jitterDeg, CONFIG.jitterDeg);
        let label_category = null;
        let label_direction = null;
        if (condition === "neutral" || condition === "incongruent") {
          label_direction = rep % 2 === 0 ? "cw" : "ccw";
          label_category = neighborKey(cat.key, label_direction);
        }
        pools[condition].push({
          is_practice: false,
          condition,
          target_id: cat.key.toUpperCase(),
          target_category: cat.key,
          target_hue_deg: wrapHue(cat.hue + jitter),
          jitter_deg: jitter,
          label_category,
          label_direction,
          neutral_word: T.neutralWords[(categoryIndex(cat.key) + rep) % T.neutralWords.length],
        });
      }
    }
    pools[condition] = shuffle(pools[condition]);
  }

  const ordered = [];
  for (let block = 0; block < 3; block++) {
    const blockTrials = [];
    for (const condition of ["neutral", "congruent", "incongruent"]) {
      blockTrials.push(...pools[condition].slice(block * 8, (block + 1) * 8));
    }
    ordered.push(...shuffle(blockTrials));
  }
  return ordered;
}

function drawHueWheel(canvas, rotationDeg) {
  const dpr = window.devicePixelRatio || 1;
  const cssSize = Math.min(430, Math.max(280, Math.floor(window.innerWidth * 0.78)));
  canvas.style.width = `${cssSize}px`;
  canvas.style.height = `${cssSize}px`;
  canvas.width = Math.floor(cssSize * dpr);
  canvas.height = Math.floor(cssSize * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const cx = cssSize / 2, cy = cssSize / 2;
  const outer = cssSize * 0.47, inner = cssSize * 0.29;
  for (let hue = 0; hue < 360; hue += 1) {
    const display = wrapHue(hue + rotationDeg);
    const a0 = (display - 90 - 0.6) * Math.PI / 180;
    const a1 = (display - 90 + 1.6) * Math.PI / 180;
    ctx.beginPath();
    ctx.arc(cx, cy, outer, a0, a1);
    ctx.arc(cx, cy, inner, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = hsl(hue);
    ctx.fill();
  }
  return { cssSize, cx, cy, outer, inner };
}

function choiceFromPointer(event, canvas, rotationDeg, geometry) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const dx = x - geometry.cx;
  const dy = y - geometry.cy;
  const r = Math.sqrt(dx*dx + dy*dy);
  if (r < geometry.inner || r > geometry.outer) return null;
  const standardDeg = Math.atan2(dy, dx) * 180 / Math.PI;
  const topClockwiseDeg = wrapHue(standardDeg + 90);
  return Math.round(wrapHue(topClockwiseDeg - rotationDeg));
}

