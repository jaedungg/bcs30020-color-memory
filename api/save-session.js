const SCORE_FIELDS = [
  "ba_compliance",
  "cue_compliance",
  "self_labeling_frequency",
  "perceived_word_influence",
];

const OPTIONAL_TEXT_FIELDS = [
  "memory_strategy_other",
  "color_difficulty_text",
  "technical_issue_text",
  "guessed_study_purpose",
];

const MEMORY_STRATEGIES = new Set([
  "visual_appearance",
  "verbal_label",
  "word_comparison",
  "no_strategy",
  "other",
]);

function isNonEmptyString(value, maxLength = 200) {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

function isIsoTimestamp(value) {
  return isNonEmptyString(value, 100) && Number.isFinite(Date.parse(value));
}

function validateSession(session) {
  if (!session || typeof session !== "object" || Array.isArray(session)) {
    return "session must be an object.";
  }
  if (!isNonEmptyString(session.session_id)) return "session_id is required.";
  if (!isNonEmptyString(session.participant_id)) return "participant_id is required.";
  if (!["ko", "en"].includes(session.language_version)) return "language_version is invalid.";
  if (!["full72", "demo12"].includes(session.run_mode)) return "run_mode is invalid.";
  if (session.consent_given !== true) return "consent_given must be true.";
  if (!isIsoTimestamp(session.consented_at)) return "consented_at is invalid.";
  if (session.completed !== true) return "completed must be true.";
  if (!isIsoTimestamp(session.survey_submitted_at)) return "survey_submitted_at is invalid.";

  for (const field of SCORE_FIELDS) {
    if (!Number.isInteger(session[field]) || session[field] < 1 || session[field] > 5) {
      return `${field} must be an integer from 1 to 5.`;
    }
  }
  if (!MEMORY_STRATEGIES.has(session.memory_strategy)) return "memory_strategy is invalid.";
  if (typeof session.color_difficulty !== "boolean") return "color_difficulty must be boolean.";
  if (typeof session.technical_issue !== "boolean") return "technical_issue must be boolean.";

  for (const field of OPTIONAL_TEXT_FIELDS) {
    const value = session[field];
    if (value !== null && value !== undefined && (typeof value !== "string" || value.length > 5000)) {
      return `${field} must be text no longer than 5000 characters.`;
    }
  }
  return null;
}

function sanitizeSession(session) {
  const clean = {
    session_id: session.session_id,
    participant_id: session.participant_id,
    language_version: session.language_version,
    run_mode: session.run_mode,
    consent_given: true,
    consented_at: session.consented_at,
    completed: true,
    survey_submitted_at: session.survey_submitted_at,
    memory_strategy: session.memory_strategy,
    color_difficulty: session.color_difficulty,
    technical_issue: session.technical_issue,
  };

  for (const field of SCORE_FIELDS) clean[field] = session[field];
  for (const field of OPTIONAL_TEXT_FIELDS) clean[field] = session[field] || null;
  return clean;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecretKey) {
    return res.status(500).json({
      ok: false,
      error: "Database environment variables are not configured.",
    });
  }

  const session = req.body;
  const validationError = validateSession(session);
  if (validationError) {
    return res.status(400).json({ ok: false, error: validationError });
  }

  const cleanedSession = sanitizeSession(session);

  try {
    const endpoint =
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/experiment_sessions?on_conflict=session_id`;
    const dbResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseSecretKey,
        "Prefer": "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([cleanedSession]),
    });

    if (!dbResponse.ok) {
      const detail = await dbResponse.text();
      console.error("Supabase session upsert failed:", dbResponse.status, detail);
      return res.status(502).json({ ok: false, error: "Database upsert failed." });
    }

    return res.status(200).json({ ok: true, saved: 1 });
  } catch (error) {
    console.error("save-session error:", error);
    return res.status(500).json({ ok: false, error: "Unexpected server error." });
  }
}
