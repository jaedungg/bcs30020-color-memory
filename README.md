# Color Memory & Verbal Labeling — jsPsych Demo v4

This version reflects the Team 2 protocol dated Oct 15, 2026.

## What changed

- One start page with **한국어 / English** language selection.
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
- Six target prototypes: red 0°, orange 30°, yellow 55°, green 120°, blue 220°, purple 275°, with ±5° jitter on main trials.
- Incongruent labels use one of the two neighboring categories; directions are balanced in the full version.
- Practice: 3 trials, one per condition, with visual feedback.
- Main task default: **12-trial demo** so the team can test the flow quickly.
- Full planned task: **72 main trials** via `?full=1`.
- Every trial screen shows the current trial number, total trial count, and a progress bar (separately for practice and the main task).
- The completion screen compares the target and selected colors for every main trial and reports per-trial, condition-level, and overall accuracy.
- Trial-level response data can be downloaded as CSV at the end.

Accuracy is scaled linearly from the circular hue error: an exact match is 100%, and the opposite point on the hue wheel (180° error) is 0%. Timed-out or unanswered trials count as 0% in accuracy averages.

## Run locally

Because jsPsych is loaded from a CDN, an internet connection is needed.

From this folder:

```bash
python3 -m http.server 8000
```

Then open:

- Demo: `http://localhost:8000`
- Full 72-trial version: `http://localhost:8000/?full=1`
- Fixed participant ID: `http://localhost:8000/?pid=P001`
- Both: `http://localhost:8000/?full=1&pid=P001`

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
- Consent/demographic questionnaire
- Experimenter interface for marking articulation failures
- Server-side data storage

For a supervised classroom/lab demo, the current CSV download is enough to test the task mechanics.


## Supabase result storage

This branch adds automatic trial-level result storage through a Vercel Function.

Architecture:

```text
Browser experiment
  -> POST /api/save-results
  -> Vercel Function
  -> Supabase REST API
  -> experiment_trials table
```

### 1. Create the table

In Supabase, open **SQL Editor** and run:

```text
supabase/schema.sql
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
- Each row has a unique `row_key`, so retrying the same completed session will update rather than duplicate those rows.
- The final screen displays database save status.
- If automatic saving fails, the participant can retry.
- CSV download remains available as a fallback.

### 4. Local development

The static experiment can still be viewed with a simple local HTTP server, but `/api/save-results` is a Vercel Function. For end-to-end database testing locally, use Vercel CLI or test on a Vercel Preview deployment.
