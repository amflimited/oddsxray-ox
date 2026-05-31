export const settledForgeBuild = "SETTLED-IN-OX-001A";

const skillNames = {
  resolver_awareness: "Resolver awareness",
  contract_reading: "Contract reading",
  source_hierarchy: "Source hierarchy",
  dispute_risk_awareness: "Dispute risk awareness",
  truth_vs_settlement_separation: "Truth-vs-settlement separation",
  exit_discipline: "Exit discipline",
  anchoring_resistance: "Anchoring resistance",
  social_noise_resistance: "Social-noise resistance",
  risk_control: "Risk control",
  process_integrity: "Process integrity"
};

const sources = [
  { id: "src-decrypt-polymarket-no", title: "Polymarket Rules No on $237M Controversial Bet Over Zelenskyy’s Suit", publisher: "Decrypt", url: "https://decrypt.co/329210/polymarket-rules-no-237m-bet-zelenskyys", supports: ["market scale", "final No resolution", "controversy framing"] },
  { id: "src-coindesk-controversy", title: "Polymarket Embroiled in $160M Controversy Over Whether Zelensky Wore a Suit at NATO", publisher: "CoinDesk", url: "https://www.coindesk.com/markets/2025/07/07/polymarket-embroiled-in-usd160m-controversy-over-whether-zelensky-wore-a-suit-at-nato", supports: ["market dispute", "price collapse", "public controversy"] },
  { id: "src-yahoo-power-user", title: "This Isn’t Decentralized, Says Polymarket Power User as Zelenskyy’s Suit Controversy Unfolds", publisher: "Yahoo Finance", url: "https://finance.yahoo.com/news/isn-t-decentralized-says-polymarket-111359338.html", supports: ["community reaction", "decentralization concern", "conflict-of-interest framing"] },
  { id: "src-cryptopolitan-uma-protest", title: "Polymarket community protests oracle vote by UMA whales, claims market manipulation", publisher: "Cryptopolitan", url: "https://www.cryptopolitan.com/polymarket-community-protests-oracle-vote-by-uma-whales-claims-market-manipulation/", supports: ["UMA whale criticism", "community protest", "manipulation claims"] },
  { id: "src-blocmates-uma-drama", title: "Polymarket’s UMA Oracle Drama Erupts Over Zelensky’s Jacket", publisher: "blocmates", url: "https://www.blocmates.com/news-posts/polymarket-uma-oracle-drama-erupts-over-zelensky-jacket-was-it-a-suit-or-not", supports: ["oracle drama", "suit/jacket framing", "UMA dispute explanation"] },
  { id: "src-mexc-market-terms", title: "Will Zelenskyy wear a suit before July? Market terms and resolution", publisher: "MEXC News", url: "https://www.mexc.com/news/33616", supports: ["market terms", "resolution conditions", "credible reporting clause"] },
  { id: "src-laika-uma-scrutiny", title: "Polymarket UMA oracle resolution disputes under scrutiny", publisher: "Laika Labs", url: "https://laikalabs.ai/news/polymarket-uma-oracle-resolution-disputes-scrutiny", supports: ["oracle dispute scrutiny", "resolver-risk framing"] },
  { id: "src-coindesk-price-collapse", title: "Polymarket Hit by $160M Controversy Over Whether Ukraine’s President Zelenskyy Wore a Suit at NATO", publisher: "CoinDesk", url: "https://www.coindesk.com/markets/2025/07/07/polymarket-embroiled-in-usd160m-controversy-over-whether-zelensky-wore-a-suit-at-nato", supports: ["Yes price collapse", "market repricing after dispute"] },
  { id: "src-mexc-chainlink", title: "Polymarket Taps Chainlink to Settle Price Bets", publisher: "MEXC News", url: "https://www.mexc.com/news/94888", supports: ["post-controversy settlement changes", "manipulation characterization", "no-compensation aftermath"] }
];

const evidence = {
  "ev-photo-evidence": { id: "ev-photo-evidence", type: "REALITY_EVIDENCE", label: "The photographs", display: "The photos show a black jacket, matching trousers, and a collared shirt.", finding: "This supports the real-world belief that he wore something commonly described as a suit.", why_it_matters: "This is evidence about reality, not necessarily evidence about settlement.", skill_tested: "truth_vs_settlement_separation", inspection_value: "medium", sources: ["src-coindesk-controversy", "src-blocmates-uma-drama"] },
  "ev-press-described-suit": { id: "ev-press-described-suit", type: "SOURCE", label: "Press called it a suit", display: "Multiple press sources described the outfit as a suit or suit-like.", finding: "The public evidence favors Yes.", why_it_matters: "Press language may support the trader’s belief, but the market still depends on the resolver.", skill_tested: "source_hierarchy", inspection_value: "medium", sources: ["src-coindesk-controversy", "src-blocmates-uma-drama"] },
  "ev-market-wording": { id: "ev-market-wording", type: "MARKET_WORDING", label: "Market question", display: "The market asks whether Zelenskyy would wear a suit before July.", finding: "The surface question sounds simple, but the settlement mechanism is the real control point.", why_it_matters: "Simple wording can hide complex resolution risk.", skill_tested: "contract_reading", inspection_value: "high", sources: ["src-mexc-market-terms"] },
  "ev-credible-reporting": { id: "ev-credible-reporting", type: "SOURCE_HIERARCHY", label: "Consensus of credible reporting", display: "The contract references credible reporting, but that does not automatically mean every article settles the market.", finding: "The player must determine who decides whether reporting is sufficient.", why_it_matters: "Evidence is not the same as authority.", skill_tested: "source_hierarchy", inspection_value: "critical", sources: ["src-mexc-market-terms"] },
  "ev-uma-oracle": { id: "ev-uma-oracle", type: "RESOLVER", label: "UMA oracle", display: "The final resolution may depend on an oracle process outside the trader’s visual evidence.", finding: "The trade is partly a bet on how the resolver interprets the evidence.", why_it_matters: "The resolver can become more important than the underlying event.", skill_tested: "resolver_awareness", inspection_value: "critical", sources: ["src-blocmates-uma-drama", "src-laika-uma-scrutiny"] },
  "ev-dispute-process": { id: "ev-dispute-process", type: "DISPUTE_MECHANISM", label: "Challenge and vote", display: "If the proposed outcome is challenged, the market may enter a voting/dispute process.", finding: "A clear-looking event can become a governance contest.", why_it_matters: "The payout can depend on process dynamics after the event happens.", skill_tested: "dispute_risk_awareness", inspection_value: "critical", sources: ["src-blocmates-uma-drama", "src-laika-uma-scrutiny"] },
  "ev-voter-incentive": { id: "ev-voter-incentive", type: "DISPUTE_MECHANISM", label: "Voting incentives", display: "Voters may be rewarded for aligning with the winning resolution, and participants may have financial exposure.", finding: "The player should treat dispute incentives as part of the market risk.", why_it_matters: "If the judge can have exposure, the trader must price that risk.", skill_tested: "resolver_awareness", inspection_value: "critical", sources: ["src-yahoo-power-user", "src-cryptopolitan-uma-protest", "src-laika-uma-scrutiny"] },
  "ev-whale-risk": { id: "ev-whale-risk", type: "PRICE_DEPTH", label: "Heavy No pressure", display: "The book shows unusual resistance from the No side despite visible evidence.", finding: "The market may be pricing resolver risk, not factual uncertainty.", why_it_matters: "A strange price can be a warning that someone understands the settlement layer better.", skill_tested: "dispute_risk_awareness", inspection_value: "high", sources: ["src-cryptopolitan-uma-protest", "src-yahoo-power-user"] },
  "ev-exit-window": { id: "ev-exit-window", type: "EXIT_WINDOW", label: "Falling bid", display: "Even after the trade goes wrong, there is a limited chance to exit before collapse.", finding: "The second decision matters after the original thesis weakens.", why_it_matters: "A bad entry can still become a controlled loss.", skill_tested: "exit_discipline", inspection_value: "high", sources: ["src-coindesk-price-collapse"] }
};

const nodes = {
  "n01-obvious-truth": { id: "n01-obvious-truth", kind: "decision", title: "The Obvious Truth", story: "Marcus sees the photos. The press has called it a suit. Yes looks like the side reality should pay. The market is not asking whether Marcus feels certain. It is asking whether the contract will resolve Yes.", prompt: "What are you actually betting on?", evidence: ["ev-photo-evidence", "ev-press-described-suit"], choices: [
    { id: "buy_yes_obvious", label: "Buy Yes — he wore the suit.", next: "n03-priya-warning", score: -3, tags: ["truth_believer", "acted_before_resolver", "headline_trade"], consequence: "You trade the visible fact before inspecting the resolver.", transition: "The trade feels clean because the photo feels clean.", skills: { truth_vs_settlement_separation: -2, resolver_awareness: -2, contract_reading: -1, process_integrity: -2 } },
    { id: "inspect_market_wording", label: "Inspect the market wording.", next: "n02-evidence-room", score: 2, tags: ["contract_reading", "process_integrity"], consequence: "You slow down and check what the contract actually asks.", transition: "The obvious trade becomes a wording problem.", skills: { contract_reading: 2, process_integrity: 1 } },
    { id: "inspect_resolver", label: "Inspect who resolves the market.", next: "n02-evidence-room", score: 4, tags: ["resolver_awareness", "process_integrity"], consequence: "You look for the authority that decides payout, not just reality.", transition: "The trade stops being a photo question and becomes a settlement question.", skills: { resolver_awareness: 3, process_integrity: 1 } },
    { id: "inspect_dispute_mechanism", label: "Inspect the dispute process.", next: "n02-evidence-room", score: 4, tags: ["dispute_risk_awareness", "resolver_awareness"], consequence: "You notice that a challenged outcome may go through an oracle vote.", transition: "The market now has a second layer: the event and the process after the event.", skills: { dispute_risk_awareness: 3, resolver_awareness: 2, process_integrity: 1 } },
    { id: "pass_until_resolver_clear", label: "Pass until the resolver is clear.", next: "t01-clean-pass", score: 5, tags: ["clean_pass", "resolver_awareness", "risk_control"], consequence: "You refuse to trade a market whose settlement machinery you have not understood.", transition: "The obvious trade stays outside your account.", skills: { resolver_awareness: 2, risk_control: 3, process_integrity: 2, anchoring_resistance: 1 } }
  ] },
  "n02-evidence-room": { id: "n02-evidence-room", kind: "evidence_room", title: "Evidence Room", story: "The question is no longer only what happened. The question is who has authority to settle it. The photos tell one story. The contract may pay another.", prompt: "You have seen enough to know this is not just a clothing trade. What do you do next?", evidence: Object.keys(evidence), choices: [
    { id: "continue_to_warning", label: "Continue to Priya’s warning.", next: "n03-priya-warning", score: 1, tags: ["process_integrity"], consequence: "You carry the evidence forward before making the next position decision.", transition: "Priya asks the question Marcus skipped.", skills: { process_integrity: 1 } }
  ] },
  "n03-priya-warning": { id: "n03-priya-warning", kind: "decision", title: "Priya’s Warning", story: "Priya calls Marcus and asks the question he skipped: Who decides the market? The press does not directly pay the contract. The resolver matters. A challenged market can become a vote.", prompt: "Now that you know the resolver can matter more than the photo, what do you do?", evidence: ["ev-credible-reporting", "ev-uma-oracle", "ev-dispute-process", "ev-voter-incentive", "ev-whale-risk"], choices: [
    { id: "exit_after_warning", label: "Exit after Priya’s warning.", next: "t02-resolver-reader", score: 5, tags: ["resolver_awareness", "exit_discipline", "truth_vs_settlement_separation"], consequence: "You accept that the trade is no longer just about the suit.", transition: "The position closes before the dispute owns it.", skills: { resolver_awareness: 3, exit_discipline: 2, truth_vs_settlement_separation: 3, process_integrity: 2 } },
    { id: "reduce_after_warning", label: "Reduce exposure but keep a small position.", next: "n04-dispute-opens", score: 2, tags: ["risk_control", "partial_exit", "resolver_awareness"], consequence: "You admit resolver risk but leave room for the obvious truth to still win.", transition: "The position becomes smaller, but the lesson is not finished.", skills: { risk_control: 2, resolver_awareness: 1, exit_discipline: 1, process_integrity: 1 } },
    { id: "inspect_oracle_deeper", label: "Inspect the oracle mechanics deeper.", next: "n02-evidence-room", score: 4, tags: ["resolver_awareness", "dispute_risk_awareness", "process_integrity"], consequence: "You study the actual process before deciding whether the trade is still valid.", transition: "The oracle becomes the trade.", skills: { resolver_awareness: 2, dispute_risk_awareness: 3, process_integrity: 2 } },
    { id: "hold_because_photos", label: "Hold because he obviously wore a suit.", next: "n04-dispute-opens", score: -4, tags: ["truth_believer", "resolver_blind", "anchoring"], consequence: "You keep treating factual correctness as payout certainty.", transition: "The photo stays clear. The trade gets darker.", skills: { truth_vs_settlement_separation: -3, resolver_awareness: -2, anchoring_resistance: -2, process_integrity: -2 } },
    { id: "add_more_after_warning", label: "Add more because the market is mispricing reality.", next: "n04-dispute-opens", score: -7, tags: ["overconfidence", "resolver_blind", "size_error"], consequence: "You increase exposure after learning that reality may not be the controlling layer.", transition: "The trade gets larger after the uncertainty gets worse.", skills: { resolver_awareness: -3, risk_control: -3, anchoring_resistance: -2, process_integrity: -3 } }
  ] },
  "n04-dispute-opens": { id: "n04-dispute-opens", kind: "decision", title: "The Dispute Opens", story: "The outcome is challenged. The market starts pricing the vote, not the suit. Yes begins to fall. Marcus can still exit, but doing so means admitting the trade changed.", prompt: "The fact did not change. The payout risk did. What do you do?", evidence: ["ev-dispute-process", "ev-voter-incentive", "ev-whale-risk", "ev-exit-window"], choices: [
    { id: "exit_when_dispute_opens", label: "Exit now.", next: "t03-controlled-loss", score: 4, tags: ["exit_discipline", "resolver_awareness", "process_recovery"], consequence: "You take a loss or reduced profit, but you recognize that the original product changed.", transition: "You stop arguing with the contract and protect what can still be protected.", skills: { exit_discipline: 3, resolver_awareness: 2, risk_control: 2, process_integrity: 1 } },
    { id: "hold_for_truth", label: "Hold for truth.", next: "n05-vote-turns", score: -5, tags: ["truth_believer", "anchoring", "resolver_blind"], consequence: "You stay in because selling feels like admitting reality no longer matters.", transition: "The market keeps pricing the vote while you keep pricing the photo.", skills: { truth_vs_settlement_separation: -3, anchoring_resistance: -3, resolver_awareness: -2, process_integrity: -2 } },
    { id: "reduce_and_watch", label: "Reduce and watch the vote.", next: "t04-late-but-learning", score: 1, tags: ["partial_exit", "process_recovery", "exit_discipline"], consequence: "You contain the damage while continuing to learn from the resolution process.", transition: "You pay some tuition, but you stop the lesson from becoming catastrophic.", skills: { exit_discipline: 1, risk_control: 2, resolver_awareness: 1, process_integrity: 1 } },
    { id: "read_dispute_arguments", label: "Read the dispute arguments.", next: "n05-vote-turns", score: 2, tags: ["dispute_risk_awareness", "resolver_awareness"], consequence: "You stop looking at the outfit and start looking at what voters are being asked to accept.", transition: "The market is now about settlement language and incentive pressure.", skills: { dispute_risk_awareness: 2, resolver_awareness: 2, process_integrity: 1 } },
    { id: "add_because_vote_absurd", label: "Add because the vote is absurd.", next: "t06-right-and-ruined", score: -8, tags: ["revenge_trade", "truth_believer", "size_error", "process_failure"], consequence: "You confuse being morally and factually right with being positioned well.", transition: "The trade becomes a protest. The market does not pay protests.", skills: { risk_control: -3, anchoring_resistance: -3, truth_vs_settlement_separation: -3, process_integrity: -3 } }
  ] },
  "n05-vote-turns": { id: "n05-vote-turns", kind: "decision", title: "The Vote Turns", story: "Yes collapses. The market no longer debates the clothing. It debates the settlement path. Marcus still has a bid, but it is falling.", prompt: "Do you protect what remains, or keep demanding that the market pay the truth?", evidence: ["ev-exit-window", "ev-dispute-process", "ev-voter-incentive"], choices: [
    { id: "take_remaining_bid", label: "Take the remaining bid.", next: "t05-late-seller", score: 0, tags: ["late_exit", "process_recovery", "resolver_awareness"], consequence: "You exit late, but you finally accept that the resolver controls payout.", transition: "The lesson is expensive, but the position is no longer trapped.", skills: { exit_discipline: 1, resolver_awareness: 1, process_integrity: -1 } },
    { id: "hold_to_final", label: "Hold to final resolution.", next: "t06-right-and-ruined", score: -6, tags: ["truth_believer", "anchoring", "process_failure"], consequence: "You ride the trade to the settlement outcome because reality still feels impossible to deny.", transition: "The final vote settles the product you actually bought.", skills: { truth_vs_settlement_separation: -3, anchoring_resistance: -3, exit_discipline: -2, process_integrity: -3 } },
    { id: "read_rules_after_damage", label: "Read the rules after damage.", next: "t07-late-reader", score: -1, tags: ["late_process", "resolver_awareness", "missed_window"], consequence: "You learn the lesson, but too late to protect the position.", transition: "The rule becomes explanation instead of protection.", skills: { resolver_awareness: 1, contract_reading: 1, exit_discipline: -2, process_integrity: -1 } }
  ] },
  "t01-clean-pass": { id: "t01-clean-pass", kind: "terminal", terminal: true, profile: "Clean Pass", result: "You did not trade because the settlement authority was not clear enough.", diagnosis: "You gave up a tempting obvious trade because the resolver layer was not understood. That is not cowardice. That is settlement literacy.", scar: "If you cannot identify the resolver, you do not have a trade.", score_band: [5, 7], autopsy: ["You did not pass because the photos were weak.", "You passed because the settlement authority was not clean enough.", "That is the difference between avoiding a market and being afraid of one."] },
  "t02-resolver-reader": { id: "t02-resolver-reader", kind: "terminal", terminal: true, profile: "Resolver Reader", result: "You exited or avoided the trade after identifying the oracle risk.", diagnosis: "You recognized that the trade was not simply about whether the suit existed. It was about whether the resolver would accept that evidence.", scar: "The photo was evidence. The oracle was settlement.", score_band: [6, 9], autopsy: ["You separated evidence from authority.", "The photos told you what happened.", "The press told you what people called it.", "The resolver decided what paid.", "You stopped before confusing those three things."] },
  "t03-controlled-loss": { id: "t03-controlled-loss", kind: "terminal", terminal: true, profile: "Controlled Loss", result: "You entered too early but exited when the dispute changed the product.", diagnosis: "The first decision was weak. The second decision saved you. You stopped demanding that reality pay a contract you had not fully read.", scar: "A bad entry does not require a worse exit.", score_band: [1, 4], autopsy: ["You entered too fast.", "But when the trade changed from suit evidence to resolver risk, you changed too.", "That second decision mattered."] },
  "t04-late-but-learning": { id: "t04-late-but-learning", kind: "terminal", terminal: true, profile: "Late but Learning", result: "You reduced exposure and watched the resolver process play out.", diagnosis: "You did not fully avoid the mistake, but you shifted from defending the trade to understanding the settlement.", scar: "When the trade changes, your position has to change.", score_band: [0, 3], autopsy: ["You paid some tuition.", "But you stopped defending the first version of the trade.", "The position got smaller as the settlement risk got larger."] },
  "t05-late-seller": { id: "t05-late-seller", kind: "terminal", terminal: true, profile: "Late Seller", result: "You sold after the vote turned and preserved only part of the remaining value.", diagnosis: "You learned the resolver lesson after the market had already repriced it. Late discipline is still discipline, but it is expensive.", scar: "The market charges tuition for late reading.", score_band: [-2, 1], autopsy: ["You finally stopped asking the market to pay the photo.", "The problem is that the market had already moved on.", "Late reading protected something, but not enough."] },
  "t06-right-and-ruined": { id: "t06-right-and-ruined", kind: "terminal", terminal: true, profile: "Right and Ruined", result: "You held to the end. The market resolved against the visible truth.", diagnosis: "You were right about the suit and wrong about the bet. You kept arguing with reality after the contract had moved into the resolver’s hands.", scar: "You did not bet on the suit. You bet on the vote.", score_band: [-8, -4], autopsy: ["You were right about the thing everyone could see.", "That was not enough.", "The market did not pay visible truth. It paid the resolution process.", "You did not bet on the suit.", "You bet on the vote."] },
  "t07-late-reader": { id: "t07-late-reader", kind: "terminal", terminal: true, profile: "Late Reader", result: "You finally read the rules after the clean exit window was gone.", diagnosis: "The reading was correct, but timing matters. Rules read after damage become an autopsy, not protection.", scar: "The rule only protects you before the trade owns you.", score_band: [-3, 0], autopsy: ["You eventually found the rule.", "But the rule only protects capital before the capital is already trapped.", "After the damage, reading becomes explanation."] }
};

const chapter = { schema_version: "settled.chapter.v1", id: "chapter-01-the-suit", product: "settled", title: "The Suit", subtitle: "A trader was right about reality and wrong about what paid.", chapter_number: 1, status: "active", format: "interactive_casebook", law: "Truth does not matter if the resolver mechanism pays something else.", scar: "You did not bet on the suit. You bet on the vote.", player_role: "Marcus Hale", source_mode: "fictionalized_story_real_market", start_node_id: "n01-obvious-truth", skill_names: skillNames, sources, evidence, nodes };

let memoryAttempts = [];
const MAX_BODY_BYTES = 65536;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function send(res, status, body) { res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); res.end(JSON.stringify(body, null, 2)); }
function newAttemptId() { return `settled_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`; }
function getBody(req) { return new Promise((resolve, reject) => { let data = ""; let size = 0; req.on("data", chunk => { size += chunk.length; if (size > MAX_BODY_BYTES) reject(new Error("Request body too large")); data += chunk; }); req.on("end", () => { if (!data) return resolve({}); try { resolve(JSON.parse(data)); } catch { reject(new Error("Invalid JSON body")); } }); req.on("error", reject); }); }
async function readRequestBody(req, res) { try { return await getBody(req); } catch (error) { send(res, 400, { ok: false, error: error.message }); return null; } }

function validateChapter() {
  const errors = [];
  const sourceIds = new Set(sources.map(source => source.id));
  const evidenceIds = new Set(Object.keys(evidence));
  for (const [nodeId, node] of Object.entries(nodes)) {
    if (node.id !== nodeId) errors.push(`Node key/id mismatch: ${nodeId}`);
    if (!node.kind) errors.push(`Node ${nodeId} missing kind.`);
    if (!node.title) errors.push(`Node ${nodeId} missing title.`);
    if (!node.terminal && !Array.isArray(node.choices)) errors.push(`Node ${nodeId} missing choices array.`);
    if (node.terminal && node.choices?.length) errors.push(`Terminal node ${nodeId} has choices.`);
    for (const evidenceId of node.evidence || []) if (!evidenceIds.has(evidenceId)) errors.push(`Node ${nodeId} references missing evidence ${evidenceId}.`);
    for (const selected of node.choices || []) {
      if (!selected.next || !nodes[selected.next]) errors.push(`Choice ${nodeId}.${selected.id} points to missing node ${selected.next}.`);
      if (!selected.consequence) errors.push(`Choice ${nodeId}.${selected.id} missing consequence.`);
      if (!selected.transition) errors.push(`Choice ${nodeId}.${selected.id} missing transition.`);
      if (!selected.skills) errors.push(`Choice ${nodeId}.${selected.id} missing skills.`);
      for (const skill of Object.keys(selected.skills || {})) if (!skillNames[skill]) errors.push(`Choice ${nodeId}.${selected.id} uses unknown skill ${skill}.`);
    }
  }
  for (const card of Object.values(evidence)) for (const sourceId of card.sources || []) if (!sourceIds.has(sourceId)) errors.push(`Evidence ${card.id} references missing source ${sourceId}.`);
  return { ok: errors.length === 0, errors, checked_nodes: Object.keys(nodes).length, checked_evidence: Object.keys(evidence).length, checked_sources: sources.length };
}
const validation = validateChapter();

function materializeNode(nodeId) {
  const node = nodes[nodeId];
  if (!node) return null;
  const copy = clone(node);
  copy.evidence_cards = (copy.evidence || []).map(id => evidence[id]).filter(Boolean);
  return copy;
}
function summarizeAttempt(attempt) { return { attempt_id: attempt.attempt_id, chapter_id: attempt.chapter_id, status: attempt.status, current_node_id: attempt.current_node_id, score_total: attempt.score_total, choices_count: attempt.choices.length, evidence_inspections_count: attempt.evidence_inspections.length, profile: attempt.outcome?.profile || null, scar_unlocked: attempt.scar_unlocked || null }; }
function buildSkillReport(attempt) { const totals = Object.fromEntries(Object.keys(skillNames).map(key => [key, 0])); for (const choice of attempt.choices) for (const [skill, value] of Object.entries(choice.skills || {})) totals[skill] = (totals[skill] || 0) + value; return Object.entries(totals).map(([key, score]) => ({ key, label: skillNames[key], score })).sort((a, b) => b.score - a.score); }
function buildOutcome(attempt, terminalNode) { return { profile: terminalNode.profile, result: terminalNode.result, diagnosis: terminalNode.diagnosis, scar: terminalNode.scar, score_total: attempt.score_total, skill_report: buildSkillReport(attempt), timeline: attempt.choices, inspected_evidence: attempt.evidence_inspections, autopsy: terminalNode.autopsy || [] }; }

export async function handleSettledForge(req, res, routePath) {
  if (routePath === "/health" || routePath === "/api/health") return send(res, 200, { ok: true, layer: "SETTLED", build: settledForgeBuild, status: "online", runtime: "inside-ox", active_chapter: chapter.id, format: chapter.format, validation });
  if (routePath === "/api/validate") return send(res, 200, { ok: validation.ok, build: settledForgeBuild, validation });
  if (routePath === "/api/catalog") return send(res, 200, { ok: true, build: settledForgeBuild, catalog: { product: "settled", active_chapter: chapter.id, doctrine: "story, evidence, resolver, autopsy, scar" } });
  if (routePath === "/api/chapters") return send(res, 200, { ok: true, build: settledForgeBuild, chapters: [{ id: chapter.id, title: chapter.title, subtitle: chapter.subtitle, status: chapter.status, scar: chapter.scar, chapter_number: chapter.chapter_number, format: chapter.format, validation: validation.ok }] });
  if (req.method === "GET" && routePath.startsWith("/api/chapters/")) return send(res, 200, { ok: true, build: settledForgeBuild, chapter: { ...chapter, nodes: Object.values(chapter.nodes), validation } });
  if (req.method === "POST" && routePath === "/api/attempts") {
    const startNode = materializeNode(chapter.start_node_id);
    const attempt = { attempt_id: newAttemptId(), chapter_id: chapter.id, chapter_title: chapter.title, status: "in_progress", started_at: new Date().toISOString(), completed_at: null, current_node_id: chapter.start_node_id, choices: [], evidence_inspections: [], score_total: 0, outcome: null, scar_unlocked: null };
    memoryAttempts.unshift(attempt);
    memoryAttempts = memoryAttempts.slice(0, 200);
    return send(res, 201, { ok: true, build: settledForgeBuild, attempt, node: startNode, chapter_summary: { id: chapter.id, title: chapter.title, scar: chapter.scar, chapter_number: chapter.chapter_number, format: chapter.format } });
  }
  if (req.method === "POST" && /^\/api\/attempts\/[^/]+\/evidence$/.test(routePath)) {
    const attemptId = routePath.split("/")[3];
    const body = await readRequestBody(req, res);
    if (body === null) return;
    const attempt = memoryAttempts.find(item => item.attempt_id === attemptId);
    if (!attempt) return send(res, 404, { ok: false, error: "Attempt not found" });
    if (attempt.status === "complete") return send(res, 409, { ok: false, error: "Attempt already complete" });
    if (body.node_id && body.node_id !== attempt.current_node_id) return send(res, 400, { ok: false, error: "Node mismatch" });
    const node = materializeNode(attempt.current_node_id);
    const card = (node?.evidence_cards || []).find(item => item.id === body.evidence_id);
    if (!card) return send(res, 400, { ok: false, error: "Evidence not valid" });
    if (!attempt.evidence_inspections.find(item => item.node_id === node.id && item.evidence_id === card.id)) attempt.evidence_inspections.push({ at: new Date().toISOString(), node_id: node.id, evidence_id: card.id, label: card.label, type: card.type, finding: card.finding });
    return send(res, 200, { ok: true, build: settledForgeBuild, attempt, evidence: card, inspected: true });
  }
  if (req.method === "POST" && /^\/api\/attempts\/[^/]+\/choice$/.test(routePath)) {
    const attemptId = routePath.split("/")[3];
    const body = await readRequestBody(req, res);
    if (body === null) return;
    const attempt = memoryAttempts.find(item => item.attempt_id === attemptId);
    if (!attempt) return send(res, 404, { ok: false, error: "Attempt not found" });
    if (attempt.status === "complete") return send(res, 409, { ok: false, error: "Attempt already complete" });
    if (body.node_id && body.node_id !== attempt.current_node_id) return send(res, 400, { ok: false, error: "Node mismatch" });
    const node = materializeNode(attempt.current_node_id);
    const selected = (node?.choices || []).find(item => item.id === body.choice_id);
    if (!selected) return send(res, 400, { ok: false, error: "Choice not valid" });
    const nextNode = materializeNode(selected.next);
    if (!nextNode) return send(res, 500, { ok: false, error: "Chapter routing error", detail: `Unknown node: ${selected.next}` });
    attempt.choices.push({ at: new Date().toISOString(), node_id: node.id, title: node.title, choice_id: selected.id, label: selected.label, next_node_id: selected.next, score: selected.score || 0, tags: selected.tags || [], consequence: selected.consequence, transition: selected.transition, skills: selected.skills || {} });
    attempt.score_total += selected.score || 0;
    attempt.current_node_id = selected.next;
    let responseNode = nextNode;
    if (nextNode.terminal) {
      const outcome = buildOutcome(attempt, nextNode);
      attempt.status = "complete";
      attempt.completed_at = new Date().toISOString();
      attempt.outcome = outcome;
      attempt.scar_unlocked = outcome.scar;
      responseNode = { ...nextNode, outcome };
    }
    return send(res, 200, { ok: true, build: settledForgeBuild, attempt, node: responseNode, transition: { title: selected.transition, detail: selected.consequence }, complete: attempt.status === "complete", scar_unlocked: attempt.scar_unlocked });
  }
  if (req.method === "GET" && routePath === "/api/attempts") return send(res, 200, { ok: true, build: settledForgeBuild, attempts: memoryAttempts.slice(0, 80).map(summarizeAttempt) });
  if (req.method === "GET" && routePath === "/api/progress") return send(res, 200, { ok: true, build: settledForgeBuild, progress: { total_attempts: memoryAttempts.length, completed_attempts: memoryAttempts.filter(item => item.status === "complete").length, scars_unlocked: new Set(memoryAttempts.map(item => item.scar_unlocked).filter(Boolean)).size, evidence_inspections: memoryAttempts.reduce((total, item) => total + item.evidence_inspections.length, 0), validation_ok: validation.ok } });
  return send(res, 404, { ok: false, error: "SETTLED route not found", build: settledForgeBuild, path: routePath });
}
