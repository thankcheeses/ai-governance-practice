/**
 * Seeds tracks and questions into Supabase.
 *
 * The app reads content from the bundled TypeScript modules, so seeding is not
 * required for the app to run. It exists so the database mirrors the shipped
 * content — useful for analytics joins, server-side queries, and any future
 * feature that needs content server-side.
 *
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. The service
 * role key bypasses row level security and must never reach the client.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { ACTIVE_TRACKS, getTrackQuestions } from "../src/content/registry";

config({ path: ".env.local" });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Copy .env.example to .env.local and fill both in before seeding.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log(`Seeding ${ACTIVE_TRACKS.length} track(s)...`);

  const { error: trackError } = await supabase.from("tracks").upsert(
    ACTIVE_TRACKS.map((track, i) => ({
      id: track.id,
      name: track.name,
      summary: track.summary,
      status: track.status,
      sort_order: i,
    })),
    { onConflict: "id" },
  );

  if (trackError) {
    console.error("Failed to seed tracks:", trackError.message);
    process.exit(1);
  }

  let total = 0;

  for (const track of ACTIVE_TRACKS) {
    const questions = getTrackQuestions(track.id);

    // Chunked so a large track does not exceed the request size limit.
    const CHUNK = 100;
    for (let i = 0; i < questions.length; i += CHUNK) {
      const rows = questions.slice(i, i + CHUNK).map((q, offset) => ({
        id: q.id,
        track_id: q.trackId,
        domain: q.domain,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswers.join(","),
        rationale: q.rationale,
        key_takeaway: q.keyTakeaway,
        framework_tags: q.frameworkTags,
        tags: q.tags,
        position: i + offset,
        created_date: q.createdDate,
        updated_date: q.updatedDate,
      }));

      const { error } = await supabase
        .from("questions")
        .upsert(rows, { onConflict: "id" });

      if (error) {
        console.error(`Failed to seed questions for ${track.id}:`, error.message);
        process.exit(1);
      }
      total += rows.length;
    }

    console.log(`  ${track.id}: ${questions.length} questions`);
  }

  console.log(`\nDone. ${total} questions seeded.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
