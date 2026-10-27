# Color Memory & Verbal Labeling — jsPsych Experiment

This version reflects the Team 2 protocol dated Oct 15, 2026.

## What changed

- Language selection is followed by bilingual consent before jsPsych starts.
- A required post-task questionnaire is shown after the main task and before completion.
- Three conditions are **randomly intermixed trial by trial**:
  1. Neutral word
  2. Congruent color word
  3. Incongruent neighboring color word
- Participants repeat **“ba”** during fixation, target presentation, and the mask.
- Target color and mask are enlarged to about **4× the previous visual area** on a desktop display (approximately 2× the width/height), while remaining responsive on smaller screens.
- After the color disappears, a cue word is shown for 3 s and repeated aloud.
- A metronome beep runs at **2 beats/second** during articulation.
- Trial sequence: 500 ms fixation → 3000 ms target → 300 ms mask → 3000 ms cue/retention → hue-wheel response (max 10 s) → 500 ms ITI.
- Response uses a **360° HSL hue wheel**, randomly rotated on each trial.
- Six category prototypes remain available for verbal labels and bias calculations: red 0°, orange 30°, yellow 55°, green 120°, blue 220°, purple 275°.
- Twelve main targets (`T01`–`T12`) use finalized base hues with ±3° jitter.
- The full design has 72 main trials: 12 targets × 3 conditions × 2 repetitions, balanced across three 24-trial blocks.
- Practice uses fixed trials P1 (congruent red), P2 (incongruent orange/yellow), and P3 (neutral yellow/table), with visual feedback.
- The default URL runs the full 72-trial task. Add `?demo=1` for the short 12-trial demo, or `?demo=1&full=1` to test all 72 trials with detailed results.
- Every trial screen shows the current trial number, total trial count, and a progress bar (separately for practice and the main task).
- The participant completion screen confirms completion and database-save status without showing performance results. Add `?demo=1` to show the per-trial, condition-level, and overall accuracy summary used for development.
- In `?demo=1` mode, trial-level response data can also be downloaded as CSV at the end.

Accuracy is scaled linearly from the circular hue error: an exact match is 100%, and the opposite point on the hue wheel (180° error) is 0%. Timed-out or unanswered trials count as 0% in accuracy averages.

## Run locally

Because jsPsych is loaded from a CDN, an internet connection is needed.

From this folder:

```bash
python3 -m http.server 8000
```

Then open:

- Full 72-trial version: `http://localhost:8000`
- Short demo: `http://localhost:8000/?demo=1`
- Full version with detailed results: `http://localhost:8000/?demo=1&full=1`
- Fixed participant ID: `http://localhost:8000/?pid=P001`

## Data fields implemented

The response rows include, among others:

- participant_id
- language_version
- block
- trial_number
- is_practice
- condition
- target_id
- target_category
- target_hue_deg
- jitter_deg
- cue_word
- label_category
- label_prototype_deg
- label_direction
- wheel_rotation_deg
- response_hue_deg
- signed_error_deg
- abs_error_deg
- error_toward_label_deg
- rt_ms
- timed_out
- articulation_ok (placeholder; currently null)

## Not yet implemented

- Microphone recording / automatic articulation verification
- Color-vision screening
- Demographic questionnaire
- Experimenter interface for marking articulation failures

For a supervised classroom/lab demo, the current CSV download is enough to test the task mechanics.


## Supabase result storage

Trial results and session-level consent/questionnaire data are stored through separate Vercel Functions.

Architecture:

```text
Browser experiment
  -> POST /api/save-results
  -> Vercel Function
  -> Supabase REST API
  -> experiment_trials table

Browser experiment
  -> POST /api/save-session
  -> Vercel Function
  -> Supabase REST API
  -> experiment_sessions table
```

### 1. Create the table

In Supabase, open **SQL Editor** and run:

```text
supabase/schema.sql
supabase/experiment_sessions.sql
```

The table is protected from direct browser access. The experiment writes through the server-side Vercel Function only.

### 2. Add Vercel environment variables

In **Vercel > Project Settings > Environment Variables**, add:

```text
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Use a current Supabase **secret key** for the server-side variable. Never put the real secret key in GitHub or browser JavaScript.

Add the variables to Production and Preview if you want database saving to work on both deployment types, then redeploy.

### 3. What happens at the end of the experiment

- Practice and main response trials are sent in one batch.
- Consent and questionnaire responses are upserted as one session row.
- Both tables use the same `session_id`, `participant_id`, `language_version`, and `run_mode`.
- Each row has a unique `row_key`, so retrying the same completed session will update rather than duplicate those rows.
- The final screen reports success only after both save requests finish.
- If either request fails, the retry button retries only the failed save.
- In `?demo=1` mode, CSV download remains available as a fallback.

### 4. Local development

The static experiment can still be viewed with a simple local HTTP server, but the `/api/save-results` and `/api/save-session` routes are Vercel Functions. For end-to-end database testing locally, use Vercel CLI or test on a Vercel Preview deployment.
