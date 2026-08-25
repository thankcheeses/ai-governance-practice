/*
  Three content corrections found in the full-bank audit.

  1. aigp-020 tested the definition of a "pre-data gate". That term appears in
     no published body of knowledge, standard or regulation — it is internal
     vocabulary. A candidate who learns it acquires a word no examiner or
     practitioner will recognise, which is worse than learning nothing. The
     underlying idea is real and worth testing, so the item is rewritten to
     test it in the vocabulary the field actually uses: preventive controls run
     before the act they exist to prevent; the same requirement implemented as
     an after-the-fact review is a detective control and detects only what has
     already happened.

  2. aigp-015 and aigp-174 gave conflicting answers to the same situation. On
     discovering biased outputs, 015 keyed "notify stakeholders and assess
     scope" while 174 keyed "establish whether the bias is ongoing and can be
     stopped". aigp-109's own distractor note takes a third position — that
     suspension before cause is known is premature. 174 and 109 are the
     better-written items and agree with each other, so 015 moves to them:
     establish what is happening and whether it is ongoing, and let that decide
     who is told and when. A bank that contradicts itself teaches nothing.

  3. Ten questions carried an "NHID" tag — the author's own company. The
     project states in its README, its Terms and its Privacy Policy that it is
     independent. Internal branding in the content metadata undercuts that for
     no benefit, so the tag is removed. The remaining tags on each item are
     untouched.

  Run:  node scripts/fix-p0-content.mjs [--write]
*/

import { readFileSync, writeFileSync } from "node:fs";

const QUESTIONS = "src/content/tracks/aigp-preparation/questions.json";
const write = process.argv.includes("--write");
const questions = JSON.parse(readFileSync(QUESTIONS, "utf8"));
const byId = (id) => questions.find((q) => q.id === id);
const changes = [];

/* -- 1. aigp-020: replace the invented term --------------------------------- */
const q20 = byId(20);
if (q20) {
  q20.question =
    "A payer's voice AI agent handles claims inquiries. Governance requires the agent to disclose that it is not human, and the caller to be authenticated, before any claims detail is discussed. The vendor proposes satisfying both requirements through a post-call audit of sampled recordings instead. What is the strongest objection?";
  q20.options = [
    "A. Sampling would not review enough calls to give the payer statistical confidence in the result.",
    "B. Auditing recordings requires retaining full call audio, which carries its own retention risk.",
    "C. Both controls exist to act before the disclosure, so an audit can only establish that they failed.",
    "D. The proposal moves the compliance burden onto the payer's own staff rather than the vendor's.",
  ];
  q20.correct = "C";
  q20.rationale =
    "A control that exists to prevent something has to run before it. Disclosure and authentication are preventive: their whole function is to stop a member speaking to an undisclosed machine, or hearing claims detail before their identity is established. Implemented as a post-call audit they become detective controls, which establish after the fact that the harm already occurred. The other objections are real — sampling power, retention exposure, and where the burden sits all matter — but each one describes a weakness in the audit, not the reason an audit cannot do this job at all.";
  q20.tags = ["preventive controls", "transparency", "authentication"];
  changes.push("aigp-020: rewritten without the invented term");
}

/* -- 2. aigp-015: align with aigp-174 and aigp-109 -------------------------- */
const q15 = byId(15);
if (q15) {
  const ci = q15.correct;
  const idx = ["A", "B", "C", "D", "E"].indexOf(ci);
  q15.options[idx] =
    `${ci}. Establish whether the disparity is ongoing and how far it reaches, then notify accordingly.`;
  q15.rationale =
    "The first move is to find out what is actually happening: whether the disparity is still occurring, how many people it has reached, and what is driving it. That finding is what makes every later decision possible — whether to suspend, whom to notify, and what to remediate. Acting before it is established risks withdrawing a service on the strength of an unexplained number, and notifying before it is established reports a finding the organisation cannot yet stand behind.";
  changes.push("aigp-015: key option and rationale aligned with aigp-174/109");
}

/* -- 3. remove the NHID tag ------------------------------------------------- */
let tagged = 0;
for (const q of questions) {
  if (!Array.isArray(q.tags)) continue;
  const next = q.tags.filter((t) => t !== "NHID");
  if (next.length !== q.tags.length) {
    q.tags = next;
    tagged++;
  }
}
if (tagged) changes.push(`NHID tag removed from ${tagged} questions`);

/* -- verify ---------------------------------------------------------------- */
const problems = [];
for (const q of questions) {
  const keys = String(q.correct).split(",").map((s) => s.trim());
  for (const k of keys) {
    const i = ["A", "B", "C", "D", "E"].indexOf(k);
    if (i < 0 || i >= q.options.length) problems.push(`aigp-${q.id}: correct key ${k} out of range`);
  }
  q.options.forEach((o, i) => {
    if (!o.startsWith(`${["A", "B", "C", "D", "E"][i]}. `)) {
      problems.push(`aigp-${q.id}: option ${i} prefix does not match position`);
    }
  });
  if (!q.tags?.length) problems.push(`aigp-${q.id}: left with no tags`);
  if (/pre-data gate|NHID/i.test(JSON.stringify(q))) {
    problems.push(`aigp-${q.id}: still references internal vocabulary`);
  }
}

changes.forEach((c) => console.log("  " + c));
if (problems.length) {
  console.error("\nREFUSING TO WRITE:");
  problems.forEach((p) => console.error("  " + p));
  process.exit(1);
}
console.log(`\n${changes.length} change groups, no integrity problems.`);

if (write) {
  writeFileSync(QUESTIONS, JSON.stringify(questions, null, 2) + "\n");
  console.log("written.");
} else {
  console.log("dry run — pass --write to apply.");
}
