function makeDemoMainTrials() {
  const conditions = shuffle([
    "neutral", "congruent", "incongruent",
    "neutral", "congruent", "incongruent",
    "neutral", "congruent", "incongruent",
    "neutral", "congruent", "incongruent",
  ]);
  const targets = shuffle(TARGETS);
  const neutralWords = shuffle(T.neutralWords.flatMap(word => [word, word]));
  const directionCounts = { neutral: 0, congruent: 0, incongruent: 0 };
  let neutralIndex = 0;

  return conditions.map((condition, i) => {
    const direction = directionCounts[condition]++ % 2 === 0 ? "cw" : "ccw";
    const neutralWord = condition === "neutral" ? neutralWords[neutralIndex++] : null;
    return createMainTrial(targets[i], condition, direction, neutralWord);
  });
}

function createMainTrial(target, condition, direction, neutralWord = null) {
  const jitter = randomInt(-CONFIG.jitterDeg, CONFIG.jitterDeg);
  const labelCategory = condition === "congruent"
    ? target.category
    : neighborKey(target.category, direction);

  return {
    is_practice: false,
    condition,
    target_id: target.id,
    target_category: target.category,
    target_hue_deg: wrapHue(target.hue + jitter),
    jitter_deg: jitter,
    label_category: labelCategory,
    label_direction: direction,
    neutral_word: neutralWord,
  };
}

const BLOCK_ASSIGNMENT_PATTERNS = [
  [
    [{ condition: "congruent", direction: "cw" }, { condition: "incongruent", direction: "cw" }],
    [{ condition: "congruent", direction: "ccw" }, { condition: "neutral", direction: "cw" }],
    [{ condition: "incongruent", direction: "ccw" }, { condition: "neutral", direction: "ccw" }],
  ],
  [
    [{ condition: "congruent", direction: "cw" }, { condition: "neutral", direction: "cw" }],
    [{ condition: "incongruent", direction: "cw" }, { condition: "neutral", direction: "ccw" }],
    [{ condition: "congruent", direction: "ccw" }, { condition: "incongruent", direction: "ccw" }],
  ],
  [
    [{ condition: "incongruent", direction: "cw" }, { condition: "neutral", direction: "cw" }],
    [{ condition: "congruent", direction: "cw" }, { condition: "incongruent", direction: "ccw" }],
    [{ condition: "congruent", direction: "ccw" }, { condition: "neutral", direction: "ccw" }],
  ],
];

function countTrials(trials, predicate) {
  return trials.reduce((count, trial) => count + (predicate(trial) ? 1 : 0), 0);
}

function validateFullTrialDesign(trials) {
  const errors = [];
  const expect = (label, actual, expected) => {
    if (actual !== expected) errors.push(`${label}: expected ${expected}, got ${actual}`);
  };

  expect("total trials", trials.length, 72);
  for (const condition of ["neutral", "congruent", "incongruent"]) {
    expect(`${condition} trials`, countTrials(trials, trial => trial.condition === condition), 24);
  }

  for (const target of TARGETS) {
    const targetTrials = trials.filter(trial => trial.target_id === target.id);
    expect(`${target.id} total`, targetTrials.length, 6);
    for (const condition of ["neutral", "congruent", "incongruent"]) {
      const conditionTrials = targetTrials.filter(trial => trial.condition === condition);
      expect(`${target.id} ${condition}`, conditionTrials.length, 2);
      for (const direction of ["cw", "ccw"]) {
        expect(
          `${target.id} ${condition} ${direction}`,
          countTrials(conditionTrials, trial => trial.label_direction === direction),
          1
        );
      }
    }
  }

  for (let block = 0; block < 3; block++) {
    const blockTrials = trials.slice(block * 24, (block + 1) * 24);
    expect(`block ${block + 1} total`, blockTrials.length, 24);
    for (const condition of ["neutral", "congruent", "incongruent"]) {
      expect(
        `block ${block + 1} ${condition}`,
        countTrials(blockTrials, trial => trial.condition === condition),
        8
      );
    }
    for (const target of TARGETS) {
      expect(
        `block ${block + 1} ${target.id}`,
        countTrials(blockTrials, trial => trial.target_id === target.id),
        2
      );
    }
  }

  const neutralTrials = trials.filter(trial => trial.condition === "neutral");
  for (const word of T.neutralWords) {
    expect(
      `neutral word "${word}"`,
      countTrials(neutralTrials, trial => trial.neutral_word === word),
      4
    );
  }

  if (errors.length) console.error("Full trial design validation failed:\n" + errors.join("\n"));
  return errors.length === 0;
}

function makeFullMainTrials() {
  const blocks = [[], [], []];
  const neutralWords = shuffle(T.neutralWords.flatMap(word => Array(4).fill(word)));
  let neutralIndex = 0;

  TARGETS.forEach((target, targetIndex) => {
    const pattern = BLOCK_ASSIGNMENT_PATTERNS[targetIndex % 3];
    pattern.forEach((assignments, blockIndex) => {
      assignments.forEach(({ condition, direction }) => {
        const neutralWord = condition === "neutral" ? neutralWords[neutralIndex++] : null;
        blocks[blockIndex].push(createMainTrial(target, condition, direction, neutralWord));
      });
    });
  });

  const ordered = blocks.flatMap(blockTrials => shuffle(blockTrials));
  validateFullTrialDesign(ordered);
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

