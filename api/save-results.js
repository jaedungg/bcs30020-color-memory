const ALLOWED_FIELDS = [
  "row_key",
  "session_id",
  "participant_id",
  "language_version",
  "run_mode",
  "demo_version",
  "session_date",
  "block",
  "trial_number",
  "is_practice",
  "condition",
  "condition_label",
  "target_id",
  "target_category",
  "target_hue_deg",
  "jitter_deg",
  "cue_word",
  "label_category",
  "label_prototype_deg",
  "label_direction",
  "wheel_rotation_deg",
  "response_hue_deg",
  "signed_error_deg",
  "abs_error_deg",
  "error_toward_label_deg",
  "rt_ms",
  "timed_out",
  "articulation_ok",
  "client_saved_at"
];

function sanitizeRow(row) {
  const clean = {};
  for (const key of ALLOWED_FIELDS) {
    const value = row?.[key];
    clean[key] = value === undefined || Number.isNaN(value) ? null : value;
  }
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
      error: "Database environment variables are not configured."
    });
  }

  const body = req.body || {};
  const rows = Array.isArray(body.rows) ? body.rows : [];

  if (rows.length < 1 || rows.length > 100) {
    return res.status(400).json({
      ok: false,
      error: "rows must contain between 1 and 100 trial records."
    });
  }

  const cleanedRows = rows.map(sanitizeRow);

  for (const row of cleanedRows) {
    if (
      !row.row_key ||
      !row.session_id ||
      !row.participant_id ||
      !row.language_version ||
      typeof row.trial_number !== "number"
    ) {
      return res.status(400).json({
        ok: false,
        error: "One or more rows are missing required fields."
      });
    }
  }

  try {
    const endpoint =
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/experiment_trials?on_conflict=row_key`;

    const dbResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseSecretKey,
        "Prefer": "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(cleanedRows)
    });

    if (!dbResponse.ok) {
      const detail = await dbResponse.text();
      console.error("Supabase insert failed:", dbResponse.status, detail);
      return res.status(502).json({
        ok: false,
        error: "Database insert failed."
      });
    }

    return res.status(200).json({
      ok: true,
      saved: cleanedRows.length
    });
  } catch (error) {
    console.error("save-results error:", error);
    return res.status(500).json({
      ok: false,
      error: "Unexpected server error."
    });
  }
}
