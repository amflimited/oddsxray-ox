import fs from 'node:fs';
import crypto from 'node:crypto';

export const localForgeBuild = 'FORGE-IN-OX-002A';
const ATTEMPTS_FILE = './attempts.local.json';
const MAX_ATTEMPTS = 500;
const MAX_BODY_BYTES = 65536;

const skillNames = {
  contract: 'Contract discipline',
  source: 'Source discipline',
  liquidity: 'Liquidity awareness',
  exit: 'Exit discipline',
  sizing: 'Position control',
  social: 'Social-noise resistance'
};

const variants = [
  {
    id: 'source_delay',
    title: 'Source Delay',
    pressure: 'The official source is slow, but the crowd behaves as if it has already resolved.',
    node_overrides: {
      start: { screen: { source: 'Delayed', timer: '8:30' }, feed_add: ['Variant: the resolver is slower than the crowd.'] },
      source: { screen: { timer: '7:00' }, feed_add: ['The delay makes confidence feel more valuable than evidence.'] }
    }
  },
  {
    id: 'thin_book',
    title: 'Thin Book',
    pressure: 'The visible exit is attractive, but the order book cannot absorb casual size.',
    node_overrides: {
      start: { screen: { book: 'Very thin', risk: 'High' }, feed_add: ['Variant: the door is narrower than usual.'] },
      depth: { screen: { cashout: 132, risk: 'Critical' }, feed_add: ['Depth is worse than the quote first implied.'] }
    }
  },
  {
    id: 'loud_thread',
    title: 'Loud Thread',
    pressure: 'The comment thread is unusually confident and unusually unsupported.',
    node_overrides: {
      start: { feed_add: ['Variant: social confidence is louder than source evidence.'] },
      noise: { screen: { risk: 'High' }, feed_add: ['The loudest account still has no source link.'] }
    }
  },
  {
    id: 'early_spike',
    title: 'Early Spike',
    pressure: 'The first visible exit is unusually high, which makes later normal exits feel like losses.',
    node_overrides: {
      start: { screen: { cashout: 184, chart: 'up' }, feed_add: ['Variant: the first number is high enough to create anchoring.'] },
      late: { screen: { cashout: 84 }, feed_add: ['The old spike is now only a memory.'] }
    }
  },
  {
    id: 'late_rule_discovery',
    title: 'Late Rule Discovery',
    pressure: 'The key rule wording appears after the market has already tempted action.',
    node_overrides: {
      start: { screen: { rules: 'Buried' }, feed_add: ['Variant: the rule clue is present but easy to skip.'] },
      rules: { screen: { cashout: 154, timer: '6:20' }, feed_add: ['The rule read came late enough to cost money.'] }
    }
  }
];

const nodes = {
  briefing: {
    id: 'briefing',
    kind: 'briefing',
    scene: 'Case Briefing',
    copy: 'You are already in a $100 position. A green exit is visible. The crowd is loud. The source is unresolved. Your job is not to be brave. Your job is to decide what evidence deserves control before the exit window closes.',
    objectives: ['Find what actually resolves the market.', 'Decide whether the visible exit is real enough to take.', 'Avoid turning one position into a rescue mission.'],
    choices: [{ id: 'begin', label: 'Begin The $180 Window', next: 'start', score: 0, tags: ['briefing_started'], consequence: 'The market cockpit opens.', skills: {} }]
  },
  start: {
    id: 'start',
    scene: 'The Window Opens',
    copy: 'The screen shows a strong exit, but the source has not confirmed the trigger. The old version of you sees proof. The better version asks what controls payout.',
    screen: { cashout: 171, position: '$100', timer: '8:00', rules: 'Buried', source: 'Pending', book: 'Thin', risk: 'Rising', chart: 'up', feed: ['Exit is visible.', 'Source is pending.', 'Depth is thin.'] },
    evidence: [
      { id: 'rules', label: 'Rules tab', type: 'contract', display: 'Exact trigger is hidden under the title.', basis: 'Rules define what pays.' },
      { id: 'source', label: 'Official source', type: 'resolver', display: 'No qualifying confirmation yet.', basis: 'The named source controls the result.' },
      { id: 'book', label: 'Depth view', type: 'liquidity', display: 'The top number is visible but shallow.', basis: 'Displayed value is not the same as a fillable exit.' },
      { id: 'thread', label: 'Comment thread', type: 'social', display: 'Confident posts, no source link.', basis: 'Social proof is not settlement proof.' }
    ],
    choices: [
      { id: 'rules', label: 'Open the Rules tab first', next: 'rules', score: 4, tags: ['rules_first'], consequence: 'You anchor on the contract before the screen number takes over.', transition: 'The contract language comes into focus.', skills: { contract: 2, source: 1, exit: 1 } },
      { id: 'exit', label: 'Take the visible exit now', next: 'end_window', score: 4, tags: ['exit_taken'], consequence: 'You take the door while it exists.', transition: 'The position closes before the window can move.', skills: { exit: 3, liquidity: 1 } },
      { id: 'depth', label: 'Check whether the exit has depth', next: 'depth', score: 3, tags: ['depth_checked'], consequence: 'You inspect the doorway before relying on it.', transition: 'The quote becomes an order-book problem.', skills: { liquidity: 3, exit: 1 } },
      { id: 'thread', label: 'Read the thread everyone is quoting', next: 'noise', score: -2, tags: ['social_evidence'], consequence: 'You trade time for social certainty.', transition: 'The crowd gets louder while the source stays quiet.', skills: { social: -2, source: -1 } },
      { id: 'sizeup', label: 'Increase the position because the number is green', next: 'heavy', score: -5, tags: ['chased_green', 'oversize'], consequence: 'You buy more exposure without buying more evidence.', transition: 'The position gets heavier than the read.', skills: { sizing: -3, exit: -1, liquidity: -1 } }
    ]
  },
  rules: {
    id: 'rules',
    scene: 'The Fine Print Cuts Differently',
    copy: 'The rule is narrower than the headline. The exit still exists, but now you know the screen number is not proof.',
    screen: { cashout: 169, position: '$100', timer: '7:20', rules: 'Read', source: 'Pending', book: 'Thin', risk: 'Medium', chart: 'flat', feed: ['Only the named source counts.', 'The broad story is not enough.', 'Exit can vanish during volatility.'] },
    evidence: [
      { id: 'trigger', label: 'Payout trigger', type: 'contract', display: 'Named source plus exact trigger before cutoff.', basis: 'Broad truth can still fail a narrow rule.' },
      { id: 'clock', label: 'Clock', type: 'time', display: 'The window is tightening.', basis: 'Delay changes the available exit.' },
      { id: 'cashout_note', label: 'Exit note', type: 'execution', display: 'The displayed exit is an estimate, not stored value.', basis: 'An available exit must be taken to become real.' }
    ],
    choices: [
      { id: 'source', label: 'Open the named official source', next: 'source', score: 4, tags: ['source_checked'], consequence: 'You move from opinion to control evidence.', transition: 'The source gap becomes visible.', skills: { source: 3, contract: 1 } },
      { id: 'plan', label: 'Set a hard exit rule before acting again', next: 'planned', score: 5, tags: ['exit_rule'], consequence: 'You give your future self a rule before pressure arrives.', transition: 'The trade becomes controlled instead of emotional.', skills: { exit: 2, sizing: 2, contract: 1 } },
      { id: 'partial', label: 'Sell half, then keep investigating', next: 'protected', score: 4, tags: ['partial_exit', 'stake_protected'], consequence: 'You reduce the blast radius before continuing.', transition: 'Half the danger leaves the table.', skills: { exit: 2, sizing: 2 } },
      { id: 'ignore', label: 'Ignore the wording and trust the obvious story', next: 'late', score: -4, tags: ['definition_skipper'], consequence: 'The definition error follows you into a worse exit.', transition: 'The rule waits for you later.', skills: { contract: -3, source: -1 } }
    ]
  },
  source: {
    id: 'source',
    scene: 'The Source Gap',
    copy: 'The official source is quiet. The crowd has confidence, but the controlling source has not crossed the line.',
    screen: { cashout: 158, position: '$100', timer: '6:30', rules: 'Read', source: 'Checked', book: 'Thin', risk: 'Medium', chart: 'flat', feed: ['Resolver is quiet.', 'The crowd is ahead of the source.', 'The exit is smaller than before.'] },
    evidence: [
      { id: 'official', label: 'Official page', type: 'resolver', display: 'No qualifying update is posted.', basis: 'The resolver controls the outcome.' },
      { id: 'headline', label: 'Shared headline', type: 'social', display: 'The broad story may be true but not payable.', basis: 'Headline truth is not rule truth.' },
      { id: 'timer', label: 'Remaining time', type: 'time', display: 'Every minute makes the exit less dependable.', basis: 'Unresolved time pressure changes the decision.' }
    ],
    choices: [
      { id: 'pass', label: 'Pass because the payable event is not confirmed', next: 'end_pass', score: 6, tags: ['disciplined_pass'], consequence: 'No exposure means no rescue mission.', transition: 'The market moves without your balance attached.', skills: { source: 3, contract: 2, sizing: 1 } },
      { id: 'small', label: 'Continue only with a small controlled position', next: 'planned', score: 3, tags: ['small_size'], consequence: 'The case stays small enough to remain a decision.', transition: 'The position shrinks back into a manageable problem.', skills: { sizing: 3, exit: 1 } },
      { id: 'wait', label: 'Wait for the official update before acting', next: 'end_pass', score: 5, tags: ['disciplined_wait'], consequence: 'You let the market move without forcing your balance to move.', transition: 'The trap closes while you stand outside it.', skills: { source: 3, exit: 1, social: 1 } },
      { id: 'assume', label: 'Assume the source is basically confirming it', next: 'late', score: -4, tags: ['assumption_gap'], consequence: 'Missing-source risk arrives later as exit pressure.', transition: 'Almost-confirmed becomes not-confirmed.', skills: { source: -3, contract: -1 } }
    ]
  },
  depth: {
    id: 'depth',
    scene: 'The Door Is Smaller Than the Quote',
    copy: 'The visible number is not the full doorway. A full exit would slip below the estimate.',
    screen: { cashout: 146, position: '$100', timer: '6:10', rules: 'Unclear', source: 'Pending', book: 'Checked', risk: 'High', chart: 'warn', feed: ['Full exit would slip.', 'Small exits can still fill.', 'Displayed value is not guaranteed money out.'] },
    evidence: [
      { id: 'ladder', label: 'Depth ladder', type: 'liquidity', display: 'Small depth near the visible quote.', basis: 'Exit quality depends on depth.' },
      { id: 'slip', label: 'Slippage warning', type: 'execution', display: 'A full-size exit gets worse than the quote.', basis: 'A worse real exit can beat a perfect fantasy.' }
    ],
    choices: [
      { id: 'chunk', label: 'Exit in chunks and accept real fill', next: 'end_depth', score: 5, tags: ['depth_respected'], consequence: 'You convert a display number into a real exit.', transition: 'The quote becomes money in smaller pieces.', skills: { liquidity: 3, exit: 2 } },
      { id: 'market', label: 'Market-sell and end the danger', next: 'end_late', score: 3, tags: ['risk_removed'], consequence: 'You pay slippage to remove risk.', transition: 'The exit is ugly, but the danger is gone.', skills: { exit: 2, liquidity: 1 } },
      { id: 'rules', label: 'Read the rules before deciding', next: 'rules', score: 2, tags: ['process_recovered'], consequence: 'You recover process before the exit gets worse.', transition: 'The cockpit slows down long enough to read.', skills: { contract: 2 } },
      { id: 'hold', label: 'Hold because the quote still looks good', next: 'late', score: -4, tags: ['quote_worship'], consequence: 'The next screen punishes relying on a quote instead of depth.', transition: 'The door narrows while you stare at the label.', skills: { liquidity: -3, exit: -1 } }
    ]
  },
  planned: {
    id: 'planned',
    scene: 'Controlled Exposure',
    copy: 'You are exposed but not trapped. The position is small enough for evidence to matter more than emotion.',
    screen: { cashout: 76, position: '$50', timer: '5:50', rules: 'Read', source: 'Checked', book: 'Thin', risk: 'Low', chart: 'flat', feed: ['Size is controlled.', 'Exit rule is visible.', 'The source is still pending.'] },
    evidence: [
      { id: 'rule', label: 'Exit rule', type: 'process', display: 'Exit if source contradicts or depth thins.', basis: 'A rule must exist before pressure.' },
      { id: 'size', label: 'Position size', type: 'risk', display: 'Smaller exposure protects decision quality.', basis: 'Position size changes psychology.' }
    ],
    choices: [
      { id: 'execute', label: 'Execute the rule and close', next: 'end_process', score: 6, tags: ['rule_executed'], consequence: 'The plan survives the moment it becomes useful.', transition: 'The rule does its job.', skills: { exit: 3, sizing: 2, contract: 1 } },
      { id: 'trim', label: 'Trim most and keep tiny exposure', next: 'protected', score: 4, tags: ['trimmed'], consequence: 'You keep optionality without letting the position own you.', transition: 'The trade becomes survivable.', skills: { sizing: 3, exit: 1 } },
      { id: 'break', label: 'Ignore the rule because the move feels strong', next: 'late', score: -4, tags: ['rule_broken'], consequence: 'A rule that vanishes under pressure is decoration.', transition: 'The plan disappears when it is needed.', skills: { exit: -3, sizing: -1 } },
      { id: 'scale', label: 'Scale up because the controlled trade worked', next: 'heavy', score: -4, tags: ['size_creep'], consequence: 'Small success becomes large exposure before evidence improves.', transition: 'The position gets heavier again.', skills: { sizing: -3, liquidity: -1 } }
    ]
  },
  noise: {
    id: 'noise',
    scene: 'The Thread Gets Loud',
    copy: 'The thread creates certainty without responsibility. Nobody has the controlling source.',
    screen: { cashout: 164, position: '$100', timer: '5:30', rules: 'Unclear', source: 'Pending', book: 'Thin', risk: 'Rising', chart: 'flat', feed: ['Confident posts.', 'No source link.', 'One warning about wording gets buried.'] },
    evidence: [
      { id: 'loud', label: 'Loud account', type: 'social', display: 'Confident claim, no source link.', basis: 'Confidence is not evidence.' },
      { id: 'warning', label: 'Wording warning', type: 'contract', display: 'One user mentions exact trigger wording.', basis: 'The boring warning is often the important one.' }
    ],
    choices: [
      { id: 'leave', label: 'Leave the thread and check the source', next: 'source', score: 4, tags: ['noise_rejected'], consequence: 'You exit the noise loop before it becomes your evidence.', transition: 'The crowd fades; the source matters again.', skills: { social: 3, source: 1 } },
      { id: 'rules', label: 'Follow the wording warning to the rules', next: 'rules', score: 3, tags: ['rules_recovered'], consequence: 'You salvage the useful signal.', transition: 'One boring warning becomes the useful path.', skills: { contract: 2, social: 1 } },
      { id: 'trust', label: 'Trust the account that agrees with you', next: 'late', score: -5, tags: ['confirmation_bias'], consequence: 'Agreement becomes a fake source.', transition: 'The loud account does not hold the door open.', skills: { social: -3, source: -2 } },
      { id: 'argue', label: 'Argue while the market moves', next: 'late', score: -5, tags: ['ego_delay'], consequence: 'You spend the exit window trying to win a comment thread.', transition: 'The market keeps moving while you type.', skills: { social: -3, exit: -2 } }
    ]
  },
  heavy: {
    id: 'heavy',
    scene: 'The Position Gets Heavy',
    copy: 'The position is heavier than the read. You did not buy more evidence. You bought more exposure.',
    screen: { cashout: 183, position: '$200', timer: '4:50', rules: 'Unclear', source: 'Pending', book: 'Very thin', risk: 'High', chart: 'up', feed: ['Number is bigger.', 'Exit is thinner.', 'Every tick feels personal.'] },
    evidence: [
      { id: 'size', label: 'Position jump', type: 'risk', display: 'Exposure grew before evidence improved.', basis: 'Risk can grow while certainty does not.' },
      { id: 'exit', label: 'Exit depth', type: 'liquidity', display: 'The same doorway cannot handle the larger position cleanly.', basis: 'Size changes the meaning of liquidity.' }
    ],
    choices: [
      { id: 'exit', label: 'Take the ugly available exit', next: 'end_late', score: 2, tags: ['emergency_exit'], consequence: 'You pay for size but avoid full capture.', transition: 'The exit is ugly, but it is still an exit.', skills: { exit: 2, liquidity: 1, sizing: -1 } },
      { id: 'depth', label: 'Check whether this size can exit', next: 'depth', score: 3, tags: ['liquidity_checked'], consequence: 'You inspect the bottleneck before panic does.', transition: 'The position runs into the order book.', skills: { liquidity: 3 } },
      { id: 'cut', label: 'Cut back to original size', next: 'planned', score: 3, tags: ['deescalated_size'], consequence: 'You reverse the size error before it becomes identity.', transition: 'The position gets quiet enough to think.', skills: { sizing: 3, exit: 1 } },
      { id: 'wait', label: 'Wait because this has to become the big win', next: 'zero', score: -6, tags: ['must_win'], consequence: 'Need becomes the plan.', transition: 'The trade becomes a rescue mission.', skills: { sizing: -3, exit: -2, social: -1 } }
    ]
  },
  late: {
    id: 'late',
    scene: 'The Door Gets Smaller',
    copy: 'The old number is no longer an offer. It is a ghost. A worse but real door remains.',
    screen: { cashout: 91, position: '$100', timer: '2:10', rules: 'Late', source: 'Updated', book: 'Thin', risk: 'High', chart: 'down', feed: ['The old window is gone.', 'A smaller exit remains.', 'The old high is now the danger.'] },
    evidence: [
      { id: 'ghost', label: 'Missed high', type: 'process', display: 'The prior number is not current value.', basis: 'Old highs are not current exits.' },
      { id: 'real', label: 'Current exit', type: 'execution', display: 'The smaller door is still available.', basis: 'Current money beats old memory.' }
    ],
    choices: [
      { id: 'take', label: 'Take the reduced exit', next: 'end_late', score: 3, tags: ['late_exit'], consequence: 'You let current value beat old memory.', transition: 'The ghost high loses control.', skills: { exit: 3, liquidity: 1 } },
      { id: 'read', label: 'Read the rules now', next: 'rules', score: 0, tags: ['late_read'], consequence: 'Late process is still better than no process.', transition: 'The rule finally gets read, but the price has moved.', skills: { contract: 1, exit: -1 } },
      { id: 'hold', label: 'Hold for the old number to return', next: 'zero', score: -6, tags: ['anchored_to_high'], consequence: 'The ghost high becomes the loss driver.', transition: 'The old number does not come back.', skills: { exit: -4, sizing: -1 } },
      { id: 'add', label: 'Add more so the bounce fixes it', next: 'zero', score: -7, tags: ['revenge_size'], consequence: 'Size becomes emotional repair instead of evidence.', transition: 'More size buys more of the same problem.', skills: { sizing: -4, exit: -2 } }
    ]
  },
  protected: { id: 'protected', terminal: true, profile: 'Stake Protector', result: 'You protected the original stake and reduced the blast radius.', diagnosis: 'Strong partial-exit behavior. You made room to be imperfect without letting one mistake own the whole account.', scar: 'First protect the stake. Then decide what deserves to stay alive.', screen: { cashout: 100, position: 'Protected', timer: 'Done', rules: 'Read', source: 'Checked', book: 'Reduced', risk: 'Low', chart: 'flat', feed: ['Stake protected.'] } },
  end_window: { id: 'end_window', terminal: true, profile: 'Window Taker', result: 'You took the exit while it existed.', diagnosis: 'You stopped negotiating with a temporary number.', scar: 'The exit number is a door, not a promise.', screen: { cashout: 180, position: 'Closed', timer: 'Done', rules: 'Mixed', source: 'Pending', book: 'Exited', risk: 'None', chart: 'up', feed: ['Exit taken.'] } },
  end_process: { id: 'end_process', terminal: true, profile: 'Process Winner', result: 'You followed the rule before pressure rewrote it.', diagnosis: 'Best process path. The case did not become a personality test.', scar: 'A rule only matters if it survives the moment it becomes useful.', screen: { cashout: 76, position: 'Closed', timer: 'Done', rules: 'Read', source: 'Checked', book: 'Exited', risk: 'None', chart: 'flat', feed: ['Rule executed.'] } },
  end_depth: { id: 'end_depth', terminal: true, profile: 'Liquidity Realist', result: 'You accepted an imperfect exit that could actually fill.', diagnosis: 'You respected depth instead of worshiping the displayed number.', scar: 'A price you cannot exit is decoration.', screen: { cashout: 146, position: 'Closed', timer: 'Done', rules: 'Mixed', source: 'Pending', book: 'Exited', risk: 'None', chart: 'warn', feed: ['Exit filled.'] } },
  end_pass: { id: 'end_pass', terminal: true, profile: 'Disciplined Pass', result: 'You passed because the payable event was not confirmed.', diagnosis: 'Strong prevention path. Passing was an active decision.', scar: 'The cleanest loss is the one you never enter.', screen: { cashout: 0, position: 'No trade', timer: 'Done', rules: 'Read', source: 'Checked', book: 'Closed', risk: 'None', chart: 'down', feed: ['No rescue needed.'] } },
  end_late: { id: 'end_late', terminal: true, profile: 'Damage Controller', result: 'You took the reduced exit after the read worsened.', diagnosis: 'Expensive, but not terminal. You accepted the evidence before the account took the full lesson.', scar: 'An ugly exit beats a clean zero.', screen: { cashout: 91, position: 'Closed', timer: 'Done', rules: 'Late', source: 'Updated', book: 'Exited', risk: 'None', chart: 'warn', feed: ['Risk removed.'] } },
  zero: { id: 'zero', terminal: true, profile: 'Window Ghost', result: 'The exit vanished while you waited for the old number.', diagnosis: 'Classic first-loss pattern: missed door, reassurance, identity defense.', scar: 'You did not lose because you were early. You lost because you would not leave.', screen: { cashout: 0, position: 'Near zero', timer: 'Done', rules: 'Too late', source: 'Updated', book: 'Closed', risk: 'Finished', chart: 'down', feed: ['Exit gone.'] } }
};

const scenario = {
  schema_version: 'oddsxray.scenario.v1',
  id: 's01-the-180-window',
  title: 'The $180 Window',
  subtitle: 'A controlled first-loss case about a visible exit that does not stay open.',
  module: 'second-stake',
  scenario_number: 1,
  status: 'active',
  format: 'template_locked_tracked_evidence',
  scar: 'The exit number is a door, not a promise.',
  skill_names: skillNames,
  variants,
  nodes
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(Array.isArray(value) ? value.slice(0, MAX_ATTEMPTS) : value, null, 2)); }
function send(res, status, body) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body, null, 2)); }
function newAttemptId() { return `att_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`; }
function attempts() { return readJson(ATTEMPTS_FILE, []); }
function chooseVariant() { return variants[Math.floor(Math.random() * variants.length)]; }

function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    let done = false;
    const fail = error => { if (!done) { done = true; reject(error); } };
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) return fail(new Error('Request body too large'));
      data += chunk;
    });
    req.on('end', () => {
      if (done) return;
      done = true;
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', fail);
  });
}
async function readRequestBody(req, res) { try { return await getBody(req); } catch (error) { send(res, 400, { ok: false, error: error.message }); return null; } }

function materializeNode(nodeId, variantId) {
  const base = scenario.nodes[nodeId];
  if (!base) return null;
  const node = clone(base);
  const variant = variants.find(item => item.id === variantId) || variants[0];
  const overlay = variant?.node_overrides?.[nodeId];
  if (overlay) {
    if (overlay.screen) node.screen = { ...(node.screen || {}), ...overlay.screen };
    if (overlay.copy) node.copy = overlay.copy;
    if (overlay.feed_add && node.screen?.feed) node.screen.feed = [...node.screen.feed, ...overlay.feed_add];
  }
  node.variant = { id: variant.id, title: variant.title, pressure: variant.pressure };
  return node;
}

function markEvidenceSeen(attempt, node) {
  if (!node || node.terminal || node.kind === 'briefing') return;
  attempt.evidence_seen ||= [];
  for (const evidence of node.evidence || []) {
    const exists = attempt.evidence_seen.find(item => item.node_id === node.id && item.evidence_id === evidence.id);
    if (!exists) attempt.evidence_seen.push({ node_id: node.id, scene: node.scene, evidence_id: evidence.id, label: evidence.label, type: evidence.type, basis: evidence.basis });
  }
}
function inspectedSet(attempt, nodeId) { return new Set((attempt.evidence_inspections || []).filter(item => item.node_id === nodeId).map(item => item.evidence_id)); }
function missedEvidenceForNode(attempt, nodeId) { const inspected = inspectedSet(attempt, nodeId); return (attempt.evidence_seen || []).filter(item => item.node_id === nodeId && !inspected.has(item.evidence_id)); }

function emptySkills() { return Object.fromEntries(Object.keys(skillNames).map(key => [key, 0])); }
function buildSkillReport(attempt) {
  const totals = emptySkills();
  for (const choice of attempt.choices) for (const [skill, value] of Object.entries(choice.skills || {})) totals[skill] = (totals[skill] || 0) + value;
  const rows = Object.entries(totals).map(([key, score]) => ({ key, label: skillNames[key], score }));
  return {
    scores: rows,
    strengths: rows.filter(row => row.score > 0).sort((a, b) => b.score - a.score).slice(0, 3),
    weaknesses: rows.filter(row => row.score < 0).sort((a, b) => a.score - b.score).slice(0, 3)
  };
}
function buildOutcome(attempt, terminalNode) {
  const tags = {};
  for (const choice of attempt.choices) for (const tag of choice.tags || []) tags[tag] = (tags[tag] || 0) + 1;
  const skills = buildSkillReport(attempt);
  return {
    profile: terminalNode.profile,
    result: terminalNode.result,
    diagnosis: terminalNode.diagnosis,
    scar: terminalNode.scar,
    score_total: attempt.score_total,
    variant: attempt.variant,
    skill_report: skills,
    replay_prompt: skills.weaknesses?.[0] ? `Run it again and protect ${skills.weaknesses[0].label.toLowerCase()}.` : 'Run it again and see whether you can keep the process clean.',
    timeline: attempt.choices.map((choice, index) => ({ move: index + 1, scene: choice.scene, label: choice.label, score: choice.score, tags: choice.tags, consequence: choice.consequence, transition: choice.transition, missed_evidence: missedEvidenceForNode(attempt, choice.node_id) })),
    missed_evidence: (attempt.evidence_seen || []).filter(item => !inspectedSet(attempt, item.node_id).has(item.evidence_id)),
    inspected_evidence: attempt.evidence_inspections || [],
    top_mistakes: Object.entries(tags).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count).slice(0, 8)
  };
}
function summarizeAttempt(attempt) {
  return { attempt_id: attempt.attempt_id, scenario_id: attempt.scenario_id, scenario_title: attempt.scenario_title, status: attempt.status, started_at: attempt.started_at, completed_at: attempt.completed_at, choices_count: attempt.choices.length, evidence_inspections_count: (attempt.evidence_inspections || []).length, score_total: attempt.score_total, scar_unlocked: attempt.scar_unlocked, profile: attempt.outcome?.profile || null, variant: attempt.variant || null, skill_report: attempt.outcome?.skill_report || null };
}
function compareRecentRuns() {
  const completed = attempts().filter(a => a.status === 'complete').slice(0, 2).map(summarizeAttempt);
  return { available: completed.length >= 2, attempts: completed, note: completed.length >= 2 ? 'Compare score, profile, variant, evidence inspections, and weak skills.' : 'Complete two runs to compare.' };
}

function validateScenario() {
  const errors = [];
  const nodeEntries = Object.entries(scenario.nodes);
  if (!scenario.id || !scenario.title || !scenario.format) errors.push('Scenario metadata is incomplete.');
  for (const [nodeId, node] of nodeEntries) {
    if (node.id !== nodeId) errors.push(`Node key/id mismatch: ${nodeId}`);
    if (!node.scene && node.kind !== 'briefing') errors.push(`Node ${nodeId} missing scene.`);
    if (!node.copy && !node.terminal) errors.push(`Node ${nodeId} missing copy.`);
    if (!node.terminal && node.kind !== 'briefing') {
      const s = node.screen || {};
      for (const key of ['cashout', 'position', 'timer', 'rules', 'source', 'book', 'risk', 'chart', 'feed']) if (s[key] === undefined) errors.push(`Node ${nodeId} missing screen.${key}.`);
      if (!Array.isArray(node.evidence) || !node.evidence.length) errors.push(`Node ${nodeId} missing evidence.`);
    }
    if (node.terminal && node.choices?.length) errors.push(`Terminal node ${nodeId} has choices.`);
    for (const selected of node.choices || []) {
      if (!selected.next || !scenario.nodes[selected.next]) errors.push(`Choice ${nodeId}.${selected.id} points to missing node ${selected.next}.`);
      if (!selected.consequence) errors.push(`Choice ${nodeId}.${selected.id} missing consequence.`);
      if (!selected.transition) errors.push(`Choice ${nodeId}.${selected.id} missing transition.`);
      if (!selected.skills) errors.push(`Choice ${nodeId}.${selected.id} missing skills.`);
    }
  }
  return { ok: errors.length === 0, errors, checked_nodes: nodeEntries.length, checked_variants: variants.length };
}
const validation = validateScenario();
if (!validation.ok) throw new Error(`Scenario validation failed: ${validation.errors.join('; ')}`);

export async function handleLocalForge(req, res, routePath) {
  if (routePath === '/health' || routePath === '/api/health') return send(res, 200, { ok: true, layer: 'The Forge', build: localForgeBuild, status: 'online', runtime: 'inside-ox', active_scenario: scenario.id, game_mode: scenario.format, validation });
  if (routePath === '/api/validate') return send(res, 200, { ok: validation.ok, build: localForgeBuild, validation });
  if (routePath === '/api/catalog') return send(res, 200, { ok: true, build: localForgeBuild, catalog: { module: 'second-stake', active_scenario: scenario.id, doctrine: 'briefing, evidence, consequence, autopsy, replay' } });
  if (routePath === '/api/scenarios') return send(res, 200, { ok: true, build: localForgeBuild, scenarios: [{ id: scenario.id, title: scenario.title, subtitle: scenario.subtitle, status: 'active', scar: scenario.scar, module: scenario.module, scenario_number: 1, format: scenario.format, validation: validation.ok }, { id: 's02-headline-poison', title: 'Headline Poison', status: 'locked', module: 'second-stake', scenario_number: 2, scar: 'A story can be true and still not pay the contract.' }] });
  if (req.method === 'GET' && routePath.startsWith('/api/scenarios/')) return send(res, 200, { ok: true, build: localForgeBuild, scenario: { ...scenario, nodes: Object.values(scenario.nodes), validation } });

  if (req.method === 'POST' && routePath === '/api/attempts') {
    const variant = chooseVariant();
    const startNode = materializeNode('briefing', variant.id);
    const attempt = { attempt_id: newAttemptId(), scenario_id: scenario.id, scenario_title: scenario.title, module: scenario.module, status: 'in_progress', started_at: new Date().toISOString(), completed_at: null, current_node_id: 'briefing', variant: { id: variant.id, title: variant.title, pressure: variant.pressure }, choices: [], evidence_seen: [], evidence_inspections: [], score_total: 0, outcome: null, scar_unlocked: null };
    const currentAttempts = attempts();
    currentAttempts.unshift(attempt);
    writeJson(ATTEMPTS_FILE, currentAttempts);
    return send(res, 201, { ok: true, build: localForgeBuild, attempt, node: startNode, scenario_summary: { id: scenario.id, title: scenario.title, scar: scenario.scar, scenario_number: 1, format: scenario.format, variant: attempt.variant } });
  }

  if (req.method === 'POST' && /^\/api\/attempts\/[^/]+\/evidence$/.test(routePath)) {
    const attemptId = routePath.split('/')[3];
    const body = await readRequestBody(req, res);
    if (body === null) return;
    const currentAttempts = attempts();
    const attempt = currentAttempts.find(item => item.attempt_id === attemptId);
    if (!attempt) return send(res, 404, { ok: false, error: 'Attempt not found' });
    if (attempt.status === 'complete') return send(res, 409, { ok: false, error: 'Attempt already complete' });
    if (body.node_id && body.node_id !== attempt.current_node_id) return send(res, 400, { ok: false, error: 'Node mismatch' });
    const node = materializeNode(attempt.current_node_id, attempt.variant?.id);
    const evidence = (node?.evidence || []).find(item => item.id === body.evidence_id);
    if (!evidence) return send(res, 400, { ok: false, error: 'Evidence not valid' });
    attempt.evidence_inspections ||= [];
    if (!attempt.evidence_inspections.find(item => item.node_id === node.id && item.evidence_id === evidence.id)) attempt.evidence_inspections.push({ at: new Date().toISOString(), node_id: node.id, scene: node.scene, evidence_id: evidence.id, label: evidence.label, type: evidence.type, basis: evidence.basis });
    writeJson(ATTEMPTS_FILE, currentAttempts);
    return send(res, 200, { ok: true, build: localForgeBuild, attempt, evidence, inspected: true });
  }

  if (req.method === 'POST' && /^\/api\/attempts\/[^/]+\/choice$/.test(routePath)) {
    const attemptId = routePath.split('/')[3];
    const body = await readRequestBody(req, res);
    if (body === null) return;
    const currentAttempts = attempts();
    const attempt = currentAttempts.find(item => item.attempt_id === attemptId);
    if (!attempt) return send(res, 404, { ok: false, error: 'Attempt not found' });
    if (attempt.status === 'complete') return send(res, 409, { ok: false, error: 'Attempt already complete' });
    if (body.node_id && body.node_id !== attempt.current_node_id) return send(res, 400, { ok: false, error: 'Node mismatch' });
    const node = materializeNode(attempt.current_node_id, attempt.variant?.id);
    const selected = (node?.choices || []).find(item => item.id === body.choice_id);
    if (!selected) return send(res, 400, { ok: false, error: 'Choice not valid' });
    const nextNode = materializeNode(selected.next, attempt.variant?.id);
    if (!nextNode) return send(res, 500, { ok: false, error: 'Scenario routing error', detail: `Unknown node: ${selected.next}` });
    attempt.choices.push({ at: new Date().toISOString(), node_id: node.id, scene: node.scene || node.kind, choice_id: selected.id, label: selected.label, next_node_id: selected.next, score: selected.score || 0, tags: selected.tags || [], consequence: selected.consequence, transition: selected.transition, skills: selected.skills || {} });
    attempt.score_total += selected.score || 0;
    attempt.current_node_id = selected.next;
    markEvidenceSeen(attempt, nextNode);
    let responseNode = nextNode;
    if (nextNode.terminal) {
      const result = buildOutcome(attempt, nextNode);
      attempt.status = 'complete';
      attempt.completed_at = new Date().toISOString();
      attempt.outcome = result;
      attempt.scar_unlocked = result.scar;
      responseNode = { ...nextNode, outcome: result };
    }
    writeJson(ATTEMPTS_FILE, currentAttempts);
    return send(res, 200, { ok: true, build: localForgeBuild, attempt, node: responseNode, transition: { title: selected.transition || 'State changes', detail: selected.consequence || null }, complete: attempt.status === 'complete', scar_unlocked: attempt.scar_unlocked });
  }

  if (req.method === 'GET' && routePath === '/api/attempts') return send(res, 200, { ok: true, build: localForgeBuild, attempts: attempts().slice(0, 80).map(summarizeAttempt), compare: compareRecentRuns() });
  if (req.method === 'GET' && routePath === '/api/compare') return send(res, 200, { ok: true, build: localForgeBuild, compare: compareRecentRuns() });
  if (req.method === 'GET' && routePath === '/api/progress') {
    const currentAttempts = attempts();
    const completed = currentAttempts.filter(attempt => attempt.status === 'complete');
    return send(res, 200, { ok: true, build: localForgeBuild, progress: { total_attempts: currentAttempts.length, completed_attempts: completed.length, scars_unlocked: new Set(completed.map(attempt => attempt.scar_unlocked).filter(Boolean)).size, evidence_inspections: currentAttempts.reduce((total, attempt) => total + (attempt.evidence_inspections || []).length, 0), validation_ok: validation.ok } });
  }
  return send(res, 404, { ok: false, error: 'Local Forge route not found', build: localForgeBuild, path: routePath });
}
