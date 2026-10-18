function showTrialProgress(trial, trialIndex, totalTrials) {
  let progress = document.getElementById("trial-progress");
  if (!progress) {
    progress = document.createElement("div");
    progress.id = "trial-progress";
    progress.className = "trial-progress";
    progress.setAttribute("role", "status");
    progress.innerHTML = `
      <div class="trial-progress-copy"><span></span><strong></strong></div>
      <div class="trial-progress-track" aria-hidden="true"><span></span></div>`;
    document.body.appendChild(progress);
  }

  const phaseLabel = trial.is_practice ? T.practiceProgress : T.mainProgress;
  progress.querySelector(".trial-progress-copy span").textContent = phaseLabel;
  progress.querySelector(".trial-progress-copy strong").textContent = `${T.question} ${trialIndex + 1} / ${totalTrials}`;
  progress.querySelector(".trial-progress-track span").style.width = `${((trialIndex + 1) / totalTrials) * 100}%`;
  progress.setAttribute("aria-label", `${phaseLabel} ${trialIndex + 1} / ${totalTrials}`);
  progress.hidden = false;
}

function hideTrialProgress() {
  const progress = document.getElementById("trial-progress");
  if (progress) progress.hidden = true;
}

function makeTrialTimeline(trial, trialIndex, blockNumber, totalTrials) {
  const cueWord = cueWordForTrial(trial);
  const targetPrototype = categoryByKey(trial.target_category).hue;
  const labelPrototype = trial.label_category ? categoryByKey(trial.label_category).hue : null;
  const comparisonPrototype = labelPrototype;
  const wheelRotation = randomInt(0, 359);
  let chosenHue = null;
  let responseStart = null;
  let responseRt = null;
  let timedOut = false;
  const updateProgress = () => showTrialProgress(trial, trialIndex, totalTrials);

  const common = {
    participant_id: PARTICIPANT_ID,
    language_version: lang,
    session_date: new Date().toISOString().slice(0,10),
    block: blockNumber,
    trial_number: trialIndex + 1,
    is_practice: trial.is_practice,
    condition: trial.condition,
    condition_label: T.condition[trial.condition],
    target_id: trial.target_id,
    target_category: trial.target_category,
    target_hue_deg: trial.target_hue_deg,
    jitter_deg: trial.jitter_deg,
    cue_word: cueWord,
    label_category: trial.label_category,
    label_prototype_deg: labelPrototype,
    label_direction: trial.label_direction,
    wheel_rotation_deg: wheelRotation,
  };

  const fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="trial-stage">
        <div class="fixation">+</div>
      </div>`,
    choices: "NO_KEYS",
    trial_duration: CONFIG.fixationMs,
    on_load: () => {
      updateProgress();
      startMetronome();
    },
  };

  const target = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="trial-stage"><div class="target-note">${T.targetNote}</div><div class="target-disc" style="background:${hsl(trial.target_hue_deg)}"></div><div class="speech-reminder">${T.fixationSpeech}</div></div>`,
    choices: "NO_KEYS",
    trial_duration: CONFIG.targetMs,
    data: { ...common, trial_stage: "target" },
    on_load: () => {
      updateProgress();
      if (CONFIG.fixationMs <= 0) startMetronome();
    },
  };

  const mask = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="trial-stage">${maskHtml()}</div>`,
    choices: "NO_KEYS",
    trial_duration: CONFIG.maskMs,
    data: { ...common, trial_stage: "mask" },
  };

  const cue = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="trial-stage"><div class="cue-word">${cueWord}</div><div class="cue-help">${T.cueHelp}</div></div>`,
    choices: "NO_KEYS",
    trial_duration: CONFIG.cueMs,
    data: { ...common, trial_stage: "cue" },
  };

  const response = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="wheel-stage">
        <div class="wheel-title">${T.reproduceTitle}</div>
        <div class="wheel-subtitle">${T.reproduceSubtitle}</div>
        <div class="wheel-wrap">
          <canvas id="hue-wheel" class="hue-wheel" aria-label="hue wheel"></canvas>
          <div id="wheel-center" class="wheel-center"></div>
        </div>
        <div id="selection-text" class="selection-text">${T.selectPrompt}</div>
      </div>`,
    choices: [T.submit],
    button_html: (choice) => `<button class="jspsych-btn" id="submit-color" disabled>${choice}</button>`,
    trial_duration: CONFIG.responseTimeoutMs,
    on_load: () => {
      stopMetronome();
      responseStart = performance.now();
      const canvas = document.getElementById("hue-wheel");
      const center = document.getElementById("wheel-center");
      const button = document.getElementById("submit-color");
      const selText = document.getElementById("selection-text");
      const geometry = drawHueWheel(canvas, wheelRotation);
      canvas.addEventListener("pointerdown", (e) => {
        const choice = choiceFromPointer(e, canvas, wheelRotation, geometry);
        if (choice === null) return;
        chosenHue = choice;
        responseRt = performance.now() - responseStart;
        center.style.setProperty("--selected-color", hsl(chosenHue));
        center.classList.add("selected");
        selText.textContent = T.selectedPrompt;
        button.disabled = false;
      });
    },
    on_finish: (data) => {
      timedOut = chosenHue === null;
      const signed = chosenHue === null ? null : circularDifference(chosenHue, trial.target_hue_deg);
      const abs = signed === null ? null : Math.abs(signed);
      let toward = null;
      if (chosenHue !== null && comparisonPrototype !== null) {
        const labelVector = circularDifference(comparisonPrototype, trial.target_hue_deg);
        const direction = Math.sign(labelVector) || 1;
        toward = signed * direction;
      }
      Object.assign(data, {
        ...common,
        trial_stage: "response",
        response_hue_deg: chosenHue,
        signed_error_deg: signed,
        abs_error_deg: abs,
        error_toward_label_deg: toward,
        rt_ms: responseRt,
        timed_out: timedOut,
        articulation_ok: null,
      });
    },
  };

  const feedback = trial.is_practice ? {
    type: jsPsychHtmlButtonResponse,
    stimulus: () => `
      <div class="feedback-stage">
        <div class="exp-card" style="text-align:center">
          <h2>${T.practiceFeedback}</h2>
          <div class="feedback-row">
            <div class="feedback-item"><div class="feedback-label">${T.target}</div><div class="feedback-swatch" style="background:${hsl(trial.target_hue_deg)}"></div></div>
            <div class="feedback-item"><div class="feedback-label">${T.response}</div><div class="feedback-swatch" style="background:${chosenHue === null ? '#ddd' : hsl(chosenHue)}"></div></div>
          </div>
        </div>
      </div>`,
    choices: [T.continue],
    data: { ...common, trial_stage: "practice_feedback" },
  } : null;

  const iti = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="trial-stage"><div class="fixation">+</div></div>`,
    choices: "NO_KEYS",
    trial_duration: CONFIG.itiMs,
    data: { ...common, trial_stage: "iti" },
  };

  const stages = CONFIG.fixationMs > 0 ? [fixation, target, mask, cue, response] : [target, mask, cue, response];
  if (feedback) stages.push(feedback);
  stages.push(iti);
  return stages;
}

