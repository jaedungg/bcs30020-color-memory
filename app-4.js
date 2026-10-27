const SESSION_ID = (window.crypto && crypto.randomUUID)
  ? crypto.randomUUID()
  : `S${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

let dbSaveInProgress = false;
let trialSaveState = "idle";
let sessionSaveState = "idle";
let questionnaireResponses = null;
let surveySubmittedAt = null;

function buildDbRows(rows) {
  const savedAt = new Date().toISOString();
  return rows.map(row => ({
    row_key: `${SESSION_ID}:${row.is_practice ? "practice" : "main"}:${row.block}:${row.trial_number}`,
    session_id: SESSION_ID,
    participant_id: row.participant_id,
    language_version: row.language_version,
    run_mode: row.run_mode,
    demo_version: row.demo_version,
    session_date: row.session_date,
    block: row.block,
    trial_number: row.trial_number,
    is_practice: Boolean(row.is_practice),
    condition: row.condition,
    condition_label: row.condition_label,
    target_id: row.target_id,
    target_category: row.target_category,
    target_hue_deg: row.target_hue_deg,
    jitter_deg: row.jitter_deg,
    cue_word: row.cue_word,
    label_category: row.label_category,
    label_prototype_deg: row.label_prototype_deg,
    label_direction: row.label_direction,
    wheel_rotation_deg: row.wheel_rotation_deg,
    response_hue_deg: row.response_hue_deg,
    signed_error_deg: row.signed_error_deg,
    abs_error_deg: row.abs_error_deg,
    error_toward_label_deg: row.error_toward_label_deg,
    rt_ms: row.rt_ms,
    timed_out: Boolean(row.timed_out),
    articulation_ok: row.articulation_ok,
    client_saved_at: savedAt,
  }));
}

function setSaveStatus(kind, message) {
  const status = document.getElementById("db-save-status");
  const retry = document.getElementById("retry-save");
  if (!status) return;
  status.textContent = message;
  status.dataset.state = kind;
  if (retry) retry.style.display = kind === "error" ? "inline-block" : "none";
}

function saveStatusCopy() {
  return lang === "ko"
    ? {
        saving: "시행 결과와 설문 응답을 데이터베이스에 저장하고 있습니다…",
        success: "시행 결과와 설문 응답이 데이터베이스에 저장되었습니다.",
        error: DEMO_MODE
          ? "일부 데이터의 자동 저장에 실패했습니다. CSV를 다운로드하거나 다시 시도해 주세요."
          : "일부 데이터의 자동 저장에 실패했습니다. 다시 시도해 주세요.",
      }
    : {
        saving: "Saving trial results and questionnaire responses to the database…",
        success: "Trial results and questionnaire responses were saved to the database.",
        error: DEMO_MODE
          ? "Some data could not be saved automatically. Download the CSV or try again."
          : "Some data could not be saved automatically. Please try again.",
      };
}

function updateCompletionAndSaveStatus() {
  const copy = saveStatusCopy();
  const title = document.getElementById("completion-title");
  const body = document.getElementById("completion-body");
  const bothFinished = [trialSaveState, sessionSaveState]
    .every(state => state === "success" || state === "error");
  const allSaved = trialSaveState === "success" && sessionSaveState === "success";

  if (!bothFinished) {
    setSaveStatus("saving", copy.saving);
    return;
  }

  if (title) title.textContent = DEMO_MODE ? T.finishTitle : T.completionTitle;
  if (body) {
    body.textContent = allSaved
      ? (DEMO_MODE ? T.finishBody : T.completionBody)
      : T.saveIncompleteBody;
  }
  setSaveStatus(allSaved ? "success" : "error", allSaved ? copy.success : copy.error);
}

async function saveResultsToDatabase(responseRows) {
  try {
    const response = await fetch("/api/save-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: SESSION_ID,
        rows: buildDbRows(responseRows),
      }),
    });

    if (!response.ok) throw new Error(`save-results returned ${response.status}`);
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Unknown save error");
    trialSaveState = "success";
  } catch (error) {
    console.error("Database save failed:", error);
    trialSaveState = "error";
  }
}

function buildSessionRow() {
  return {
    session_id: SESSION_ID,
    participant_id: PARTICIPANT_ID,
    language_version: lang,
    run_mode: FULL_MODE ? "full72" : "demo12",
    consent_given: consentGiven,
    consented_at: consentedAt,
    ...(questionnaireResponses || {}),
    completed: true,
    survey_submitted_at: surveySubmittedAt,
  };
}

async function saveSessionToDatabase() {
  try {
    const response = await fetch("/api/save-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSessionRow()),
    });

    if (!response.ok) throw new Error(`save-session returned ${response.status}`);
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Unknown save error");
    sessionSaveState = "success";
  } catch (error) {
    console.error("Session save failed:", error);
    sessionSaveState = "error";
  }
}

async function saveAllData(responseRows) {
  if (dbSaveInProgress) return;
  dbSaveInProgress = true;

  const saves = [];
  if (trialSaveState !== "success") {
    trialSaveState = "saving";
    saves.push(saveResultsToDatabase(responseRows));
  }
  if (sessionSaveState !== "success") {
    sessionSaveState = "saving";
    saves.push(saveSessionToDatabase());
  }
  updateCompletionAndSaveStatus();

  await Promise.all(saves);
  dbSaveInProgress = false;
  updateCompletionAndSaveStatus();
}

function simpleButtonPage(html, buttonText) {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: html,
    choices: [buttonText],
    on_load: hideTrialProgress,
  };
}

function showConsentScreen(selectedLang) {
  lang = selectedLang;
  T = TEXT[lang];
  document.documentElement.lang = T.htmlLang;
  document.title = T.title;

  const screen = document.getElementById("language-screen");
  screen.innerHTML = `
    <div class="language-card consent-card">
      <h1>${T.consent.title}</h1>
      <div class="consent-copy">${T.consent.body}</div>
      <div class="consent-actions">
        <button type="button" id="consent-agree" class="primary-btn">${T.consent.agree}</button>
        <button type="button" id="consent-decline" class="secondary-btn">${T.consent.decline}</button>
      </div>
    </div>`;

  document.getElementById("consent-agree").addEventListener("click", () => {
    if (consentGiven) return;
    consentGiven = true;
    consentedAt = new Date().toISOString();
    startExperiment(selectedLang);
  });

  document.getElementById("consent-decline").addEventListener("click", () => {
    screen.innerHTML = `
      <div class="language-card decline-card">
        <h1>${T.consent.declinedTitle}</h1>
        <p>${T.consent.declinedBody}</p>
      </div>`;
  });
}

function scaleOptions(name, labels) {
  return labels.map((label, index) => `
    <label class="scale-option">
      <input type="radio" name="${name}" value="${index + 1}" required>
      <span><strong>${index + 1}</strong>${label}</span>
    </label>`).join("");
}

function choiceOptions(name, options) {
  return options.map(([value, label]) => `
    <label class="choice-option">
      <input type="radio" name="${name}" value="${value}" required>
      <span>${label}</span>
    </label>`).join("");
}

function makeQuestionnaireTrial() {
  const Q = T.questionnaire;
  return {
    type: jsPsychHtmlKeyboardResponse,
    choices: "NO_KEYS",
    stimulus: `
      <div class="questionnaire-stage">
        <form id="post-task-questionnaire" class="exp-card questionnaire-card">
          <h1>${Q.title}</h1>
          <p class="questionnaire-intro">${Q.intro}</p>

          <fieldset class="questionnaire-item">
            <legend>1. ${Q.q1} <span class="required-label">${Q.required}</span></legend>
            <div class="scale-options">${scaleOptions("ba_compliance", Q.complianceScale)}</div>
          </fieldset>

          <fieldset class="questionnaire-item">
            <legend>2. ${Q.q2} <span class="required-label">${Q.required}</span></legend>
            <div class="scale-options">${scaleOptions("cue_compliance", Q.complianceScale)}</div>
          </fieldset>

          <fieldset class="questionnaire-item">
            <legend>3. ${Q.q3} <span class="required-label">${Q.required}</span></legend>
            <div class="scale-options">${scaleOptions("self_labeling_frequency", Q.selfLabelScale)}</div>
          </fieldset>

          <fieldset class="questionnaire-item">
            <legend>4. ${Q.q4} <span class="required-label">${Q.required}</span></legend>
            <div class="scale-options">${scaleOptions("perceived_word_influence", Q.influenceScale)}</div>
          </fieldset>

          <fieldset class="questionnaire-item">
            <legend>5. ${Q.q5} <span class="required-label">${Q.required}</span></legend>
            <div class="choice-options">${choiceOptions("memory_strategy", Q.memoryOptions)}</div>
            <div id="memory-strategy-other-wrap" class="conditional-input" hidden>
              <label for="memory-strategy-other">${Q.memoryOptions[4][1]} <span class="optional-label">${Q.optional}</span></label>
              <input type="text" id="memory-strategy-other" name="memory_strategy_other" maxlength="1000" placeholder="${Q.otherPlaceholder}">
            </div>
          </fieldset>

          <fieldset class="questionnaire-item">
            <legend>6. ${Q.q6} <span class="required-label">${Q.required}</span></legend>
            <div class="yes-no-options">
              <label class="choice-option"><input type="radio" name="color_difficulty" value="yes" required><span>${Q.yes}</span></label>
              <label class="choice-option"><input type="radio" name="color_difficulty" value="no" required><span>${Q.no}</span></label>
            </div>
            <div id="color-difficulty-wrap" class="conditional-input" hidden>
              <label for="color-difficulty-text">${Q.colorDifficultyPlaceholder}</label>
              <input type="text" id="color-difficulty-text" name="color_difficulty_text" maxlength="1000" placeholder="${Q.colorDifficultyPlaceholder}">
            </div>
          </fieldset>

          <fieldset class="questionnaire-item">
            <legend>7. ${Q.q7} <span class="required-label">${Q.required}</span></legend>
            <div class="yes-no-options">
              <label class="choice-option"><input type="radio" name="technical_issue" value="yes" required><span>${Q.yes}</span></label>
              <label class="choice-option"><input type="radio" name="technical_issue" value="no" required><span>${Q.no}</span></label>
            </div>
            <div id="technical-issue-wrap" class="conditional-input" hidden>
              <label for="technical-issue-text">${Q.technicalIssuePlaceholder}</label>
              <input type="text" id="technical-issue-text" name="technical_issue_text" maxlength="1000" placeholder="${Q.technicalIssuePlaceholder}">
            </div>
          </fieldset>

          <fieldset class="questionnaire-item">
            <legend>8. ${Q.q8} <span class="optional-label">${Q.optional}</span></legend>
            <textarea name="guessed_study_purpose" rows="5" maxlength="5000" placeholder="${Q.purposePlaceholder}"></textarea>
          </fieldset>

          <button type="submit" class="primary-btn questionnaire-submit">${Q.submit}</button>
        </form>
      </div>`,
    on_load: () => {
      stopMetronome();
      hideTrialProgress();
      const form = document.getElementById("post-task-questionnaire");

      const toggleConditional = (name, showValue, wrapperId) => {
        form.querySelectorAll(`input[name="${name}"]`).forEach(input => {
          input.addEventListener("change", () => {
            document.getElementById(wrapperId).hidden = input.value !== showValue;
          });
        });
      };
      toggleConditional("memory_strategy", "other", "memory-strategy-other-wrap");
      toggleConditional("color_difficulty", "yes", "color-difficulty-wrap");
      toggleConditional("technical_issue", "yes", "technical-issue-wrap");

      form.addEventListener("submit", event => {
        event.preventDefault();
        const values = new FormData(form);
        const optionalText = name => {
          const value = String(values.get(name) || "").trim();
          return value || null;
        };
        const memoryStrategy = String(values.get("memory_strategy"));
        const colorDifficulty = values.get("color_difficulty") === "yes";
        const technicalIssue = values.get("technical_issue") === "yes";

        questionnaireResponses = {
          ba_compliance: Number(values.get("ba_compliance")),
          cue_compliance: Number(values.get("cue_compliance")),
          self_labeling_frequency: Number(values.get("self_labeling_frequency")),
          perceived_word_influence: Number(values.get("perceived_word_influence")),
          memory_strategy: memoryStrategy,
          memory_strategy_other: memoryStrategy === "other" ? optionalText("memory_strategy_other") : null,
          color_difficulty: colorDifficulty,
          color_difficulty_text: colorDifficulty ? optionalText("color_difficulty_text") : null,
          technical_issue: technicalIssue,
          technical_issue_text: technicalIssue ? optionalText("technical_issue_text") : null,
          guessed_study_purpose: optionalText("guessed_study_purpose"),
        };
        surveySubmittedAt = new Date().toISOString();
        jsPsych.finishTrial({ trial_stage: "post_task_questionnaire" });
      });
    },
  };
}

function showFinalScreen() {
  stopMetronome();
  hideTrialProgress();
  const allResponseRows = jsPsych.data.get().filter({ trial_stage: "response" }).values();
  const rows = allResponseRows.filter(row => !row.is_practice);
  const saveTitle = lang === "ko" ? "데이터 저장" : "Data storage";
  const retryLabel = lang === "ko" ? "다시 저장하기" : "Retry save";
  let resultsHtml = "";
  let actionsHtml = "";

  if (DEMO_MODE) {
    const byCondition = ["neutral", "congruent", "incongruent"].map(cond => {
      const conditionRows = rows.filter(r => r.condition === cond);
      const errors = conditionRows.filter(r => typeof r.abs_error_deg === "number").map(r => r.abs_error_deg);
      const meanError = errors.length ? errors.reduce((a,b) => a+b, 0) / errors.length : null;
      const meanAccuracy = conditionRows.length
        ? conditionRows.reduce((sum, row) => sum + accuracyFromError(row.abs_error_deg), 0) / conditionRows.length
        : null;
      return { cond, meanError, meanAccuracy };
    });
    const overallAccuracy = rows.length
      ? rows.reduce((sum, row) => sum + accuracyFromError(row.abs_error_deg), 0) / rows.length
      : 0;
    const summaryRows = byCondition.map(x => `
      <tr>
        <td>${T.condition[x.cond]}</td>
        <td>${x.meanAccuracy === null ? "—" : x.meanAccuracy.toFixed(1) + "%"}</td>
        <td>${x.meanError === null ? "—" : x.meanError.toFixed(1) + "°"}</td>
      </tr>`).join("");
    const trialResults = rows.map(row => {
      const answered = typeof row.response_hue_deg === "number";
      const accuracy = accuracyFromError(row.abs_error_deg);
      return `
        <article class="trial-result">
          <div class="trial-result-heading">
            <strong>${T.question} ${row.trial_number}</strong>
            <span>${T.condition[row.condition]}</span>
          </div>
          <div class="trial-color-comparison">
            <div class="result-color">
              <span class="result-swatch" style="background:${hsl(row.target_hue_deg)}"></span>
              <span>${T.target}</span>
            </div>
            <span class="comparison-arrow" aria-hidden="true">→</span>
            <div class="result-color">
              <span class="result-swatch ${answered ? "" : "unanswered"}" style="background:${answered ? hsl(row.response_hue_deg) : "#ddd"}"></span>
              <span>${answered ? T.response : T.unanswered}</span>
            </div>
          </div>
          <div class="trial-result-metrics">
            <strong>${T.accuracy} ${accuracy.toFixed(1)}%</strong>
            <span>${T.absoluteError} ${answered ? row.abs_error_deg.toFixed(1) + "°" : "—"}</span>
          </div>
        </article>`;
    }).join("");

    resultsHtml = `
      <section class="overall-result" aria-label="${T.overallAccuracy}">
        <span>${T.overallAccuracy}</span>
        <strong>${overallAccuracy.toFixed(1)}%</strong>
      </section>
      <p class="accuracy-note">${T.accuracyNote}</p>
      <table class="result-table"><thead><tr><th>${lang === "ko" ? "조건" : "Condition"}</th><th>${T.meanAccuracy}</th><th>${T.absoluteError}</th></tr></thead><tbody>${summaryRows}</tbody></table>
      <section class="trial-results-section">
        <h2>${T.trialResults}</h2>
        <div class="trial-results-grid">${trialResults}</div>
      </section>`;
    actionsHtml = `
      <div class="language-buttons results-actions">
        <button id="download-csv">${T.download}</button>
        <button id="restart">${T.restart}</button>
      </div>`;
  }

  document.body.innerHTML = `
    <main class="language-screen results-screen">
      <div class="language-card results-card">
        <h1 id="completion-title">${T.savingCompletionTitle}</h1>
        <p id="completion-body">${T.savingCompletionBody}</p>
        ${resultsHtml}
        <div class="save-panel">
          <strong>${saveTitle}</strong>
          <div id="db-save-status" style="margin-top:7px; color:var(--muted);"></div>
          <button id="retry-save" class="primary-btn" style="display:none; margin-top:10px;">${retryLabel}</button>
        </div>
        ${actionsHtml}
      </div>
    </main>`;

  if (DEMO_MODE) {
    document.getElementById("download-csv").addEventListener("click", () => {
      jsPsych.data.get().filter({ trial_stage: "response" }).localSave("csv", `color_memory_${PARTICIPANT_ID}_${lang}.csv`);
    });
    document.getElementById("restart").addEventListener("click", () => window.location.href = window.location.pathname);
  }
  document.getElementById("retry-save").addEventListener("click", () => saveAllData(allResponseRows));

  saveAllData(allResponseRows);
}

function startExperiment(selectedLang) {
  if (!consentGiven || !consentedAt) return;
  lang = selectedLang;
  T = TEXT[lang];
  document.documentElement.lang = T.htmlLang;
  document.title = T.title;
  initAudio();
  document.getElementById("language-screen").remove();

  jsPsych = initJsPsych({
    display_element: "jspsych-target",
    on_finish: showFinalScreen,
  });
  jsPsych.data.addProperties({
    participant_id: PARTICIPANT_ID,
    language_version: lang,
    demo_version: "protocol-v3",
    run_mode: FULL_MODE ? "full72" : "demo12",
  });

  const timeline = [];
  timeline.push(simpleButtonPage(T.intro, T.beginPractice));
  timeline.push(simpleButtonPage(T.practiceIntro, T.beginPractice));

  const practice = makePracticeTrials();
  practice.forEach((trial, i) => timeline.push(...makeTrialTimeline(trial, i, 0, practice.length)));

  timeline.push(simpleButtonPage(FULL_MODE ? T.mainIntroFull : T.mainIntroDemo, T.beginMain));
  const mainTrials = FULL_MODE ? makeFullMainTrials() : makeDemoMainTrials();

  if (FULL_MODE) {
    for (let block = 0; block < 3; block++) {
      const blockTrials = mainTrials.slice(block * 24, (block + 1) * 24);
      blockTrials.forEach((trial, i) => timeline.push(...makeTrialTimeline(trial, block * 24 + i, block + 1, mainTrials.length)));
      if (block < 2) {
        timeline.push(simpleButtonPage(`<div class="break-card"><div class="exp-card" style="text-align:center"><h2>${T.breakTitle}</h2><p>${T.breakBody}</p></div></div>`, T.nextBlock));
      }
    }
  } else {
    mainTrials.forEach((trial, i) => timeline.push(...makeTrialTimeline(trial, i, 1, mainTrials.length)));
  }

  timeline.push(makeQuestionnaireTrial());

  jsPsych.run(timeline);
}

document.querySelectorAll("[data-lang]").forEach(btn => {
  btn.addEventListener("click", () => showConsentScreen(btn.dataset.lang));
});
