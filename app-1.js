/*
  Color Memory & Verbal Labeling — protocol demo
  BCS.30020 Team 2

  Default = short demo (12 main trials + 3 practice trials).
  Add ?full=1 to the URL to run the planned 72-trial main task.
  Add ?pid=P001 to set a participant ID.

  This demo implements the team's Oct 15 protocol:
  fixation + “ba” -> target + “ba” -> mask + “ba” -> cue word repetition ->
  randomized 360° hue wheel -> inter-trial interval.
*/

const CONFIG = {
  fixationMs: 500,
  targetMs: 3000,
  maskMs: 300,
  cueMs: 3000,
  itiMs: 500,
  responseTimeoutMs: 10000,
  saturation: 80,
  lightness: 50,
  jitterDeg: 5,
  metronomeIntervalMs: 500, // 2 beats / second
  practiceCount: 3,
  demoRepetitionsPerTargetCondition: 0, // custom demo generator below
  fullRepetitionsPerTargetCondition: 4,
};

const CATEGORIES = [
  { key: "red", hue: 0, hex: "#E61919" },
  { key: "orange", hue: 30, hex: "#E68019" },
  { key: "yellow", hue: 55, hex: "#E6D519" },
  { key: "green", hue: 120, hex: "#19E619" },
  { key: "blue", hue: 220, hex: "#195EE6" },
  { key: "purple", hue: 275, hex: "#9119E6" },
];

const TEXT = {
  ko: {
    htmlLang: "ko",
    title: "색 기억 × 언어적 단어 반복",
    intro: `
      <div class="exp-card">
        <span class="demo-badge">테스트 데모</span>
        <h1>색 기억 실험</h1>
        <p>각 시행에서는 먼저 <strong>“바”</strong>를 박자음에 맞춰 반복하면서 색을 봅니다. 색이 사라진 뒤 단어가 나타나면, “바”를 멈추고 <strong>화면의 단어를 그대로 소리 내어 반복</strong>하세요.</p>
        <div class="note">
          <strong>모든 조건의 말하기 난이도를 같게 하기 위해</strong> 참가자가 직접 색 이름을 만들어 내지 않습니다. 제시된 단어는 실제 색과 일치할 수도, 다른 색 이름일 수도, 색과 무관한 명사일 수도 있습니다.
        </div>
        <p>마지막에는 색상환에서 처음 보았던 색을 가능한 정확하게 선택합니다. 본 실험에서는 정답 피드백이 없습니다.</p>
        <p><strong>소리를 켜 주세요.</strong> 박자음은 초당 2번 재생됩니다.</p>
      </div>`,
    beginPractice: "연습 시작",
    beginMain: "본 실험 시작",
    practiceIntro: `
      <div class="exp-card"><h2>연습</h2><p>세 조건을 한 번씩 연습합니다. 연습 시행에서는 응답 후 목표 색과 선택한 색을 보여줍니다.</p></div>`,
    mainIntroDemo: `
      <div class="exp-card"><h2>본 실험 데모</h2><p>데모에서는 절차 확인을 위해 <strong>12시행</strong>만 진행합니다. 실제 계획안은 72시행입니다.</p><p>중립·일치·불일치 조건은 <strong>시행마다 무작위로 섞여</strong> 나옵니다.</p></div>`,
    mainIntroFull: `
      <div class="exp-card"><h2>본 실험</h2><p>총 <strong>72시행</strong>이며 24시행씩 3블록으로 진행합니다. 조건은 시행마다 무작위로 섞입니다.</p></div>`,
    fixationSpeech: "박자에 맞춰 “바, 바, 바…”",
    fixationSub: "색이 나타나도 계속 반복하세요.",
    targetNote: "색을 기억하세요",
    cueHelp: "“바”를 멈추고, 이 단어를 박자에 맞춰 계속 반복하세요.",
    reproduceTitle: "처음 보았던 색을 선택하세요",
    reproduceSubtitle: "색상환을 클릭한 뒤 제출하세요. 색상환의 위치는 매 시행마다 달라집니다.",
    selectPrompt: "색상환에서 색을 선택하세요.",
    selectedPrompt: "색이 선택되었습니다.",
    submit: "이 색으로 제출",
    target: "목표 색",
    response: "내 응답",
    practiceFeedback: "연습 피드백",
    continue: "계속",
    breakTitle: "잠시 쉬어가세요",
    breakBody: "준비되면 다음 블록을 시작하세요.",
    nextBlock: "다음 블록 시작",
    finishTitle: "데모 완료",
    finishBody: "아래 버튼으로 시행별 CSV 데이터를 내려받을 수 있습니다.",
    download: "CSV 다운로드",
    restart: "처음으로 돌아가기",
    condition: { neutral: "중립 단어", congruent: "일치 색 단어", incongruent: "불일치 색 단어" },
    category: { red: "빨강", orange: "주황", yellow: "노랑", green: "초록", blue: "파랑", purple: "보라" },
    neutralWords: ["책상", "의자", "창문", "시계", "가방", "연필"],
    ba: "바",
  },
  en: {
    htmlLang: "en",
    title: "Color Memory × Verbal Labeling",
    intro: `
      <div class="exp-card">
        <span class="demo-badge">TEST DEMO</span>
        <h1>Color Memory Experiment</h1>
        <p>On each trial, first repeat <strong>“ba”</strong> in time with the beeps while viewing the color. After the color disappears, a word will appear. Stop saying “ba” and <strong>repeat the displayed word aloud</strong> until the color wheel appears.</p>
        <div class="note">
          To keep speaking difficulty comparable across conditions, you do <strong>not</strong> generate a color name yourself. The word may match the color, name a different color, or be an unrelated noun.
        </div>
        <p>Finally, select the original color as accurately as possible from the color wheel. There is no feedback during the main task.</p>
        <p><strong>Please turn your sound on.</strong> The metronome plays two beats per second.</p>
      </div>`,
    beginPractice: "Start practice",
    beginMain: "Start main task",
    practiceIntro: `<div class="exp-card"><h2>Practice</h2><p>You will practice each of the three conditions once. Practice trials include feedback.</p></div>`,
    mainIntroDemo: `<div class="exp-card"><h2>Main task demo</h2><p>This demo uses only <strong>12 trials</strong> to test the procedure. The planned study uses 72 trials.</p><p>Neutral, congruent, and incongruent trials are <strong>randomly intermixed</strong>.</p></div>`,
    mainIntroFull: `<div class="exp-card"><h2>Main task</h2><p>There are <strong>72 trials</strong> in three blocks of 24. Conditions are randomly intermixed trial by trial.</p></div>`,
    fixationSpeech: "Repeat “ba, ba, ba…” with the beat",
    fixationSub: "Keep repeating it while the color is visible.",
    targetNote: "Remember the color",
    cueHelp: "Stop saying “ba” and repeat this word with the beat.",
    reproduceTitle: "Select the color you saw at the beginning",
    reproduceSubtitle: "Click the hue wheel, then submit. The wheel rotates randomly on every trial.",
    selectPrompt: "Select a color on the wheel.",
    selectedPrompt: "Color selected.",
    submit: "Submit this color",
    target: "Target color",
    response: "My response",
    practiceFeedback: "Practice feedback",
    continue: "Continue",
    breakTitle: "Take a short break",
    breakBody: "Start the next block when you are ready.",
    nextBlock: "Start next block",
    finishTitle: "Demo complete",
    finishBody: "You can download the trial-level data as a CSV file below.",
    download: "Download CSV",
    restart: "Return to start",
    condition: { neutral: "Neutral word", congruent: "Congruent color word", incongruent: "Incongruent color word" },
    category: { red: "red", orange: "orange", yellow: "yellow", green: "green", blue: "blue", purple: "purple" },
    neutralWords: ["table", "chair", "window", "clock", "pencil", "bottle"],
    ba: "ba",
  },
};

const params = new URLSearchParams(window.location.search);
const FULL_MODE = params.get("full") === "1";
const PARTICIPANT_ID = params.get("pid") || `P${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;

let lang = null;
let T = null;
let jsPsych = null;
let audioCtx = null;
let metronomeTimer = null;
let metronomeOn = false;

function wrapHue(h) { return ((h % 360) + 360) % 360; }
function circularDifference(a, b) { return ((a - b + 540) % 360) - 180; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function hsl(h) { return `hsl(${wrapHue(h)} ${CONFIG.saturation}% ${CONFIG.lightness}%)`; }
function categoryIndex(key) { return CATEGORIES.findIndex(c => c.key === key); }
function categoryByKey(key) { return CATEGORIES.find(c => c.key === key); }
function neighborKey(key, direction) {
  const i = categoryIndex(key);
  const n = CATEGORIES.length;
  return CATEGORIES[(i + (direction === "cw" ? 1 : -1) + n) % n].key;
}
function labelForCategory(key) { return T.category[key]; }
function cueWordForTrial(trial) {
  if (trial.condition === "neutral") return trial.neutral_word;
  if (trial.condition === "congruent") return labelForCategory(trial.target_category);
  return labelForCategory(trial.label_category);
}

function initAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === "suspended") audioCtx.resume();
}
function beep() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 760;
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.11, audioCtx.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.055);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + 0.06);
}
function startMetronome() {
  stopMetronome();
  metronomeOn = true;
  beep();
  metronomeTimer = window.setInterval(() => { if (metronomeOn) beep(); }, CONFIG.metronomeIntervalMs);
}
function stopMetronome() {
  metronomeOn = false;
  if (metronomeTimer) window.clearInterval(metronomeTimer);
  metronomeTimer = null;
}

function maskHtml() {
  const hues = Array.from({length: 36}, () => randomInt(0, 359));
  return `<div class="mask-grid">${hues.map(h => `<div class="mask-cell" style="background:${hsl(h)}"></div>`).join("")}</div>`;
}

function makePracticeTrials() {
  // One trial per condition, hues deliberately offset from the six prototypes.
  const practiceHues = [15, 88, 195];
  const practiceCats = ["red", "yellow", "blue"];
  const conditions = shuffle(["neutral", "congruent", "incongruent"]);
  return conditions.map((condition, i) => {
    const target_category = practiceCats[i];
    let label_category = null;
    let label_direction = null;
    if (condition === "incongruent") {
      label_direction = i % 2 === 0 ? "cw" : "ccw";
      label_category = neighborKey(target_category, label_direction);
    }
    if (condition === "neutral") {
      label_direction = i % 2 === 0 ? "cw" : "ccw";
      label_category = neighborKey(target_category, label_direction); // comparison direction only
    }
    return {
      is_practice: true,
      condition,
      target_id: `PRACTICE_${i+1}`,
      target_category,
      target_hue_deg: practiceHues[i],
      jitter_deg: null,
      label_category,
      label_direction,
      neutral_word: T.neutralWords[i % T.neutralWords.length],
    };
  });
}

