const SESSION_ID = (window.crypto && crypto.randomUUID)
  ? crypto.randomUUID()
  : `S${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

let dbSaveInProgress = false;

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

async function saveResultsToDatabase(responseRows) {
  if (dbSaveInProgress) return;
  dbSaveInProgress = true;

  const copy = lang === "ko"
    ? {
        saving: "결과를 데이터베이스에 저장하고 있습니다…",
        success: "결과가 데이터베이스에 저장되었습니다.",
        error: "자동 저장에 실패했습니다. CSV를 다운로드하거나 다시 시도해 주세요.",
      }
    : {
        saving: "Saving results to the database…",
        success: "Results were saved to the database.",
        error: "Automatic saving failed. Download the CSV or try again.",
      };

  setSaveStatus("saving", copy.saving);

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
    setSaveStatus("success", copy.success);
  } catch (error) {
    console.error("Database save failed:", error);
    setSaveStatus("error", copy.error);
  } finally {
    dbSaveInProgress = false;
  }
}

function simpleButtonPage(html, buttonText) {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: html,
    choices: [buttonText],
  };
}

function showFinalScreen() {
  stopMetronome();
  const allResponseRows = jsPsych.data.get().filter({ trial_stage: "response" }).values();
  const rows = allResponseRows.filter(row => !row.is_practice);
  const byCondition = ["neutral", "congruent", "incongruent"].map(cond => {
    const vals = rows.filter(r => r.condition === cond && typeof r.abs_error_deg === "number").map(r => r.abs_error_deg);
    const mean = vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : null;
    return { cond, mean };
  });
  const summaryRows = byCondition.map(x => `<tr><td>${T.condition[x.cond]}</td><td>${x.mean === null ? "—" : x.mean.toFixed(1) + "°"}</td></tr>`).join("");

  const saveTitle = lang === "ko" ? "데이터 저장" : "Data storage";
  const retryLabel = lang === "ko" ? "다시 저장하기" : "Retry save";

  document.body.innerHTML = `
    <main class="language-screen">
      <div class="language-card" style="text-align:left">
        <h1>${T.finishTitle}</h1>
        <p>${T.finishBody}</p>
        <table class="result-table"><thead><tr><th>${lang === 'ko' ? '조건' : 'Condition'}</th><th>${lang === 'ko' ? '평균 절대오차' : 'Mean absolute error'}</th></tr></thead><tbody>${summaryRows}</tbody></table>
        <div style="margin:18px 0; padding:14px 16px; border:1px solid var(--line); border-radius:12px;">
          <strong>${saveTitle}</strong>
          <div id="db-save-status" style="margin-top:7px; color:var(--muted);"></div>
          <button id="retry-save" class="primary-btn" style="display:none; margin-top:10px;">${retryLabel}</button>
        </div>
        <div class="language-buttons" style="justify-content:flex-start">
          <button id="download-csv">${T.download}</button>
          <button id="restart">${T.restart}</button>
        </div>
      </div>
    </main>`;

  document.getElementById("download-csv").addEventListener("click", () => {
    jsPsych.data.get().filter({ trial_stage: "response" }).localSave("csv", `color_memory_${PARTICIPANT_ID}_${lang}.csv`);
  });
  document.getElementById("restart").addEventListener("click", () => window.location.href = window.location.pathname);
  document.getElementById("retry-save").addEventListener("click", () => saveResultsToDatabase(allResponseRows));

  saveResultsToDatabase(allResponseRows);
}

function startExperiment(selectedLang) {
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
  practice.forEach((trial, i) => timeline.push(...makeTrialTimeline(trial, i, 0)));

  timeline.push(simpleButtonPage(FULL_MODE ? T.mainIntroFull : T.mainIntroDemo, T.beginMain));
  const mainTrials = FULL_MODE ? makeFullMainTrials() : makeDemoMainTrials();

  if (FULL_MODE) {
    for (let block = 0; block < 3; block++) {
      const blockTrials = mainTrials.slice(block * 24, (block + 1) * 24);
      blockTrials.forEach((trial, i) => timeline.push(...makeTrialTimeline(trial, block * 24 + i, block + 1)));
      if (block < 2) {
        timeline.push(simpleButtonPage(`<div class="break-card"><div class="exp-card" style="text-align:center"><h2>${T.breakTitle}</h2><p>${T.breakBody}</p></div></div>`, T.nextBlock));
      }
    }
  } else {
    mainTrials.forEach((trial, i) => timeline.push(...makeTrialTimeline(trial, i, 1)));
  }

  jsPsych.run(timeline);
}

document.querySelectorAll("[data-lang]").forEach(btn => {
  btn.addEventListener("click", () => startExperiment(btn.dataset.lang));
});
