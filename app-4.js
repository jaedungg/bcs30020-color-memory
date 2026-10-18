function simpleButtonPage(html, buttonText) {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: html,
    choices: [buttonText],
  };
}

function showFinalScreen() {
  stopMetronome();
  const rows = jsPsych.data.get().filter({ trial_stage: "response", is_practice: false }).values();
  const byCondition = ["neutral", "congruent", "incongruent"].map(cond => {
    const vals = rows.filter(r => r.condition === cond && typeof r.abs_error_deg === "number").map(r => r.abs_error_deg);
    const mean = vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : null;
    return { cond, mean };
  });
  const summaryRows = byCondition.map(x => `<tr><td>${T.condition[x.cond]}</td><td>${x.mean === null ? "—" : x.mean.toFixed(1) + "°"}</td></tr>`).join("");
  document.body.innerHTML = `
    <main class="language-screen">
      <div class="language-card" style="text-align:left">
        <h1>${T.finishTitle}</h1>
        <p>${T.finishBody}</p>
        <table class="result-table"><thead><tr><th>${lang === 'ko' ? '조건' : 'Condition'}</th><th>${lang === 'ko' ? '평균 절대오차' : 'Mean absolute error'}</th></tr></thead><tbody>${summaryRows}</tbody></table>
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
