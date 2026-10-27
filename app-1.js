/*
  Color Memory & Verbal Labeling — experiment
  BCS.30020 Team 2

  Default = full experiment (72 main trials + 3 practice trials).
  Add ?demo=1 to run the 12-trial demo and show detailed results.
  Add ?demo=1&full=1 to test the full task with detailed results.
  Add ?pid=P001 to set a participant ID.

  This experiment implements the team's Oct 15 protocol:
  fixation + “ba” -> target + “ba” -> mask + “ba” -> cue word repetition ->
  randomized 360° hue wheel -> inter-trial interval.
*/

const CONFIG = {
  fixationMs: 0,
  targetMs: 1500,
  maskMs: 300,
  cueMs: 3000,
  itiMs: 500,
  responseTimeoutMs: 10000,
  saturation: 80,
  lightness: 50,
  jitterDeg: 3,
  metronomeIntervalMs: 500, // 2 beats / second
  practiceCount: 3,
  demoRepetitionsPerTargetCondition: 0, // custom demo generator below
  fullRepetitionsPerTargetCondition: 2,
};

const CATEGORIES = [
  { key: "red", hue: 0, hex: "#E61919" },
  { key: "orange", hue: 30, hex: "#E68019" },
  { key: "yellow", hue: 55, hex: "#E6D519" },
  { key: "green", hue: 120, hex: "#19E619" },
  { key: "blue", hue: 220, hex: "#195EE6" },
  { key: "purple", hue: 275, hex: "#9119E6" },
];

const TARGETS = [
  { id: "T01", category: "red", hue: 352 },
  { id: "T02", category: "red", hue: 8 },
  { id: "T03", category: "orange", hue: 24 },
  { id: "T04", category: "orange", hue: 36 },
  { id: "T05", category: "yellow", hue: 50 },
  { id: "T06", category: "yellow", hue: 60 },
  { id: "T07", category: "green", hue: 110 },
  { id: "T08", category: "green", hue: 140 },
  { id: "T09", category: "blue", hue: 210 },
  { id: "T10", category: "blue", hue: 235 },
  { id: "T11", category: "purple", hue: 265 },
  { id: "T12", category: "purple", hue: 285 },
];

const TEXT = {
  ko: {
    htmlLang: "ko",
    title: "색 기억 × 언어적 단어 반복",
    intro: `
      <div class="exp-card">
        <h1>색 기억 실험</h1>
        <p>각 시행에서는 먼저 <strong>“바”</strong>를 박자음에 맞춰 반복하면서 색을 봅니다. 색이 사라진 뒤 단어가 나타나면, “바”를 멈추고 <strong>화면의 단어를 그대로 소리 내어 반복</strong>하세요.</p>
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
    fixationSpeech: "박자에 맞춰 “바, 바, 바…”를 반복하세요.",
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
    practiceProgress: "연습",
    mainProgress: "본 실험",
    question: "문제",
    accuracy: "정확도",
    overallAccuracy: "전체 정확도",
    meanAccuracy: "평균 정확도",
    absoluteError: "절대 오차",
    unanswered: "미응답",
    trialResults: "문제별 결과",
    accuracyNote: "정확도는 목표 색과 완전히 일치하면 100%, 색상환에서 정반대(180°)이면 0%가 되도록 환산했습니다. 미응답은 0%로 포함됩니다.",
    practiceFeedback: "연습 피드백",
    continue: "계속",
    breakTitle: "잠시 쉬어가세요",
    breakBody: "준비되면 다음 블록을 시작하세요.",
    nextBlock: "다음 블록 시작",
    completionTitle: "실험이 완료되었습니다.",
    completionBody: "응답이 정상적으로 저장되었습니다. 참여해주셔서 감사합니다.",
    savingCompletionTitle: "응답을 저장하고 있습니다…",
    savingCompletionBody: "잠시만 기다려 주세요.",
    saveIncompleteBody: "일부 응답을 저장하지 못했습니다. 아래 버튼을 눌러 다시 시도해 주세요.",
    finishTitle: "데모 완료",
    finishBody: "아래 버튼으로 시행별 CSV 데이터를 내려받을 수 있습니다.",
    download: "CSV 다운로드",
    restart: "처음으로 돌아가기",
    consent: {
      title: "연구 참여 동의",
      body: `
        <p>본 연구는 색상을 기억하고 재현하는 과정과 간단한 언어 반복 과제의 관계를 알아보기 위한 BCS.30020 수업 프로젝트입니다.</p>
        <p>실험에서는 화면에 제시되는 색상을 기억한 뒤, 안내에 따라 “바” 또는 화면에 나타나는 단어를 소리 내어 반복하게 됩니다. 이후 색상환에서 처음 보았던 색상을 선택합니다. 실험이 끝난 뒤에는 실험 수행 방식에 관한 간단한 설문에 응답하게 됩니다.</p>
        <p>전체 실험에는 약 15–20분이 소요될 예정입니다.</p>
        <p>실험 중에는 다음과 같은 정보가 저장됩니다:</p>
        <ul>
          <li>임의로 생성된 참가자 ID</li>
          <li>언어 설정</li>
          <li>실험 조건 및 제시된 색상/단어</li>
          <li>선택한 색상과 반응 시간</li>
          <li>실험 후 설문 응답</li>
        </ul>
        <p>이 실험에서는 이름이나 이메일 주소와 같은 직접적인 개인정보를 요구하지 않습니다. 또한 참가자의 음성은 녹음하거나 저장하지 않습니다.</p>
        <p>본 연구는 일반적인 컴퓨터 과제 수준의 최소한의 위험만을 포함하지만, 화면을 오래 보거나 반복해서 말하는 과정에서 약간의 피로감을 느낄 수 있습니다.</p>
        <p>연구 참여는 전적으로 자발적입니다. 참여를 원하지 않거나 실험 도중 중단하고 싶은 경우 언제든지 종료할 수 있으며, 이에 따른 불이익은 없습니다.</p>
        <p>아래의 “동의하고 시작하기”를 선택하면 다음 사항에 동의하는 것으로 간주합니다:</p>
        <ul>
          <li>만 18세 이상입니다.</li>
          <li>위 내용을 읽고 이해했습니다.</li>
          <li>본 연구에 자발적으로 참여하는 것에 동의합니다.</li>
        </ul>`,
      agree: "동의하고 시작하기",
      decline: "참여하지 않기",
      declinedTitle: "참여하지 않기를 선택하셨습니다.",
      declinedBody: "창을 닫으셔도 됩니다.",
    },
    questionnaire: {
      title: "실험 후 설문",
      intro: "다음 질문에 응답해 주세요. 별도로 표시되지 않은 서술형 응답은 선택 사항입니다.",
      required: "필수",
      optional: "선택",
      submit: "설문 제출",
      q1: "색상이 화면에 나타나는 동안 안내된 대로 “바, 바, 바…”를 계속 소리 내어 반복했나요?",
      q2: "단어가 화면에 나타난 동안 안내된 대로 그 단어를 계속 소리 내어 반복했나요?",
      q3: "색상을 보는 동안, “바”를 반복하면서도 해당 색상의 이름을 속으로 생각하거나 떠올린 적이 있었나요?",
      q4: "화면에 나타난 단어가 이후 색상을 선택하는 데 영향을 주었다고 느꼈나요?",
      q5: "색상을 기억할 때 주로 어떤 전략을 사용했나요?",
      q6: "실험 중 구별하기 어렵거나 애매하게 느껴진 색상이 있었나요?",
      q7: "실험 중 기술적 문제나 집중을 방해한 일이 있었나요?",
      q8: "이 실험이 무엇을 알아보기 위한 연구라고 생각하셨나요?",
      complianceScale: ["전혀 하지 않았다", "거의 하지 않았다", "가끔 했다", "대부분 했다", "항상 했다"],
      selfLabelScale: ["전혀 없었다", "거의 없었다", "가끔 있었다", "자주 있었다", "거의 항상 그랬다"],
      influenceScale: ["전혀 그렇지 않았다", "거의 그렇지 않았다", "어느 정도 그랬다", "많이 그랬다", "매우 강하게 그랬다"],
      memoryOptions: [
        ["visual_appearance", "색상의 시각적인 모습을 그대로 기억하려고 했다."],
        ["verbal_label", "색상에 이름을 붙여 기억하려고 했다."],
        ["word_comparison", "화면에 나타난 단어와 색상을 비교하면서 기억했다."],
        ["no_strategy", "특별한 전략을 사용하지 않았다."],
        ["other", "기타"],
      ],
      yes: "예",
      no: "아니요",
      otherPlaceholder: "기타 전략을 입력해 주세요. (선택)",
      colorDifficultyPlaceholder: "어떤 색상이 어려웠는지 입력해 주세요. (선택)",
      technicalIssuePlaceholder: "문제나 방해 요인을 입력해 주세요. (선택)",
      purposePlaceholder: "응답을 입력해 주세요. (선택)",
    },
    condition: { neutral: "중립 단어", congruent: "일치 색 단어", incongruent: "불일치 색 단어" },
    category: { red: "빨강", orange: "주황", yellow: "노랑", green: "초록", blue: "파랑", purple: "보라" },
    neutralWords: ["책상", "의자", "창문", "시계", "연필", "가방"],
    ba: "바",
  },
  en: {
    htmlLang: "en",
    title: "Color Memory × Verbal Labeling",
    intro: `
      <div class="exp-card">
        <h1>Color Memory Experiment</h1>
        <p>On each trial, first repeat <strong>“ba”</strong> in time with the beeps while viewing the color. After the color disappears, a word will appear. Stop saying “ba” and <strong>repeat the displayed word aloud</strong> until the color wheel appears.</p>
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
    practiceProgress: "Practice",
    mainProgress: "Main task",
    question: "Trial",
    accuracy: "Accuracy",
    overallAccuracy: "Overall accuracy",
    meanAccuracy: "Mean accuracy",
    absoluteError: "Absolute error",
    unanswered: "No response",
    trialResults: "Trial results",
    accuracyNote: "Accuracy is scaled from 100% for an exact match to 0% for the opposite point (180°) on the hue wheel. Unanswered trials count as 0%.",
    practiceFeedback: "Practice feedback",
    continue: "Continue",
    breakTitle: "Take a short break",
    breakBody: "Start the next block when you are ready.",
    nextBlock: "Start next block",
    completionTitle: "Experiment complete.",
    completionBody: "Your responses have been recorded successfully. Thank you for participating.",
    savingCompletionTitle: "Saving your responses…",
    savingCompletionBody: "Please wait a moment.",
    saveIncompleteBody: "Some responses could not be saved. Please use the button below to try again.",
    finishTitle: "Demo complete",
    finishBody: "You can download the trial-level data as a CSV file below.",
    download: "Download CSV",
    restart: "Return to start",
    consent: {
      title: "Research Participation Consent",
      body: `
        <p>This study is a course project for BCS.30020 investigating how people remember and reproduce colors while performing a simple verbal repetition task.</p>
        <p>During the experiment, you will view and remember colors, repeat either “ba” or a word shown on the screen according to the instructions, and then reproduce the original color using a color wheel. After the main task, you will complete a short questionnaire about how you performed the task.</p>
        <p>The experiment is expected to take approximately 15–20 minutes.</p>
        <p>The following information may be stored during the study:</p>
        <ul>
          <li>A randomly generated participant ID</li>
          <li>Language setting</li>
          <li>Experimental condition and presented colors/words</li>
          <li>Selected colors and response times</li>
          <li>Responses to the post-task questionnaire</li>
        </ul>
        <p>We will not ask for directly identifying information such as your name or email address. Your voice will not be recorded or stored.</p>
        <p>This study involves no more than minimal risks associated with a typical computer-based task, although you may experience mild visual or speaking-related fatigue.</p>
        <p>Participation is completely voluntary. You may choose not to participate or stop the experiment at any time without penalty.</p>
        <p>By selecting “I agree and begin”, you confirm that:</p>
        <ul>
          <li>You are 18 years of age or older.</li>
          <li>You have read and understood the information above.</li>
          <li>You voluntarily agree to participate in this study.</li>
        </ul>`,
      agree: "I agree and begin",
      decline: "I do not wish to participate",
      declinedTitle: "You have chosen not to participate.",
      declinedBody: "You may now close this window.",
    },
    questionnaire: {
      title: "Post-task questionnaire",
      intro: "Please answer the questions below. Text explanations are optional unless otherwise indicated.",
      required: "Required",
      optional: "Optional",
      submit: "Submit questionnaire",
      q1: "While the color was visible, how consistently did you repeat “ba, ba, ba…” aloud as instructed?",
      q2: "While the word was displayed, how consistently did you repeat the displayed word aloud as instructed?",
      q3: "While viewing the color, did you mentally think of or name the color even while repeating “ba”?",
      q4: "To what extent did you feel that the displayed word influenced the color you selected afterward?",
      q5: "What strategy did you mainly use to remember the colors?",
      q6: "Were there any colors that you found difficult or ambiguous to distinguish?",
      q7: "Did you experience any technical problems or major distractions during the experiment?",
      q8: "What do you think this experiment was investigating?",
      complianceScale: ["Never", "Rarely", "Sometimes", "Most of the time", "Always"],
      selfLabelScale: ["Never", "Rarely", "Sometimes", "Often", "Almost always"],
      influenceScale: ["Not at all", "Very little", "Somewhat", "A lot", "Very strongly"],
      memoryOptions: [
        ["visual_appearance", "I tried to remember the visual appearance of the color."],
        ["verbal_label", "I tried to remember the color by giving it a name."],
        ["word_comparison", "I compared the color with the word shown on the screen."],
        ["no_strategy", "I did not use any particular strategy."],
        ["other", "Other"],
      ],
      yes: "Yes",
      no: "No",
      otherPlaceholder: "Describe the other strategy. (Optional)",
      colorDifficultyPlaceholder: "Which colors were difficult? (Optional)",
      technicalIssuePlaceholder: "Describe the problem or distraction. (Optional)",
      purposePlaceholder: "Enter your response. (Optional)",
    },
    condition: { neutral: "Neutral word", congruent: "Congruent color word", incongruent: "Incongruent color word" },
    category: { red: "red", orange: "orange", yellow: "yellow", green: "green", blue: "blue", purple: "purple" },
    neutralWords: ["table", "chair", "window", "clock", "pencil", "bag"],
    ba: "ba",
  },
};

const params = new URLSearchParams(window.location.search);
const DEMO_MODE = params.get("demo") === "1";
const FULL_MODE = !DEMO_MODE || params.get("full") === "1";
const PARTICIPANT_ID = params.get("pid") || `P${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;

let lang = null;
let T = null;
let jsPsych = null;
let audioCtx = null;
let metronomeTimer = null;
let metronomeOn = false;
let consentGiven = false;
let consentedAt = null;

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
function accuracyFromError(absError) {
  if (typeof absError !== "number" || !Number.isFinite(absError)) return 0;
  return Math.max(0, 100 * (1 - Math.min(absError, 180) / 180));
}
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
  return [
    {
      is_practice: true,
      condition: "congruent",
      target_id: "P1",
      target_category: "red",
      target_hue_deg: 0,
      jitter_deg: 0,
      label_category: "red",
      label_direction: null,
      neutral_word: null,
    },
    {
      is_practice: true,
      condition: "incongruent",
      target_id: "P2",
      target_category: "orange",
      target_hue_deg: 30,
      jitter_deg: 0,
      label_category: "yellow",
      label_direction: "cw",
      neutral_word: null,
    },
    {
      is_practice: true,
      condition: "neutral",
      target_id: "P3",
      target_category: "yellow",
      target_hue_deg: 55,
      jitter_deg: 0,
      label_category: null,
      label_direction: null,
      neutral_word: T.neutralWords[0],
    },
  ];
}

