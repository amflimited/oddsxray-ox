import fs from 'node:fs';
import crypto from 'node:crypto';

export const localForgeBuild = 'FORGE-IN-OX-001B';
const ATTEMPTS_FILE = './attempts.local.json';
const MAX_ATTEMPTS = 500;
const MAX_BODY_BYTES = 65536;

const scenario = {
  id: 's01-the-180-window',
  title: 'The $180 Window',
  subtitle: 'A controlled case about a visible exit that does not stay open.',
  module: 'second-stake',
  scenario_number: 1,
  status: 'active',
  format: 'single_runtime_tracked_evidence',
  scar: 'The exit number is a door, not a promise.',
  nodes: {
    start: {
      id: 'start',
      scene: 'The Window Opens',
      copy: 'You are already in the case. The screen shows a strong exit, but the source has not confirmed the trigger. Decide what evidence matters before the window closes.',
      screen: { cashout: 171, position: '$100', timer: '8:00', rules: 'Buried', source: 'Pending', book: 'Thin', risk: 'Rising', chart: 'up', feed: ['Exit is visible.', 'Source is pending.', 'Depth is thin.'] },
      evidence: [
        { id: 'rules', label: 'Rules tab', type: 'contract', display: 'Exact trigger is hidden under the title.', basis: 'Rules define what pays.' },
        { id: 'source', label: 'Official source', type: 'resolver', display: 'No qualifying confirmation yet.', basis: 'The named source controls the result.' },
        { id: 'book', label: 'Depth view', type: 'liquidity', display: 'The top number is visible but shallow.', basis: 'Displayed value is not the same as a fillable exit.' },
        { id: 'thread', label: 'Comment thread', type: 'social', display: 'Confident posts, no source link.', basis: 'Social proof is not settlement proof.' }
      ],
      choices: [
        { id: 'rules', label: 'Open the Rules tab first', next: 'rules', score: 4, tags: ['rules_first'], consequence: 'You anchor on the contract before the screen number takes over.' },
        { id: 'exit', label: 'Take the visible exit now', next: 'end_window', score: 4, tags: ['exit_taken'], consequence: 'You take the door while it exists.' },
        { id: 'depth', label: 'Check whether the exit has depth', next: 'depth', score: 3, tags: ['depth_checked'], consequence: 'You inspect the doorway before relying on it.' },
        { id: 'thread', label: 'Read the thread everyone is quoting', next: 'noise', score: -2, tags: ['social_evidence'], consequence: 'You trade time for social certainty.' }
      ]
    },
    rules: {
      id: 'rules',
      scene: 'The Fine Print Cuts Differently',
      copy: 'The rule is narrower than the headline. The exit still exists, but now you know the screen number is not proof.',
      screen: { cashout: 169, position: '$100', timer: '7:20', rules: 'Read', source: 'Pending', book: 'Thin', risk: 'Medium', chart: 'flat', feed: ['Only the named source counts.', 'The broad story is not enough.'] },
      evidence: [
        { id: 'trigger', label: 'Payout trigger', type: 'contract', display: 'Named source plus exact trigger before cutoff.', basis: 'Broad truth can still fail a narrow rule.' },
        { id: 'clock', label: 'Clock', type: 'time', display: 'The window is tightening.', basis: 'Delay changes the available exit.' }
      ],
      choices: [
        { id: 'source', label: 'Open the named official source', next: 'source', score: 4, tags: ['source_checked'], consequence: 'You move from opinion to control evidence.' },
        { id: 'plan', label: 'Set a hard exit rule', next: 'planned', score: 5, tags: ['exit_rule'], consequence: 'You give your future self a rule before pressure arrives.' },
        { id: 'ignore', label: 'Ignore the wording and trust the obvious story', next: 'late', score: -4, tags: ['definition_skipper'], consequence: 'The definition error follows you into a worse exit.' }
      ]
    },
    source: {
      id: 'source',
      scene: 'The Source Gap',
      copy: 'The official source is quiet. The crowd has confidence, but the controlling source has not crossed the line.',
      screen: { cashout: 158, position: '$100', timer: '6:30', rules: 'Read', source: 'Checked', book: 'Thin', risk: 'Medium', chart: 'flat', feed: ['Resolver is quiet.', 'The crowd is ahead of the source.'] },
      evidence: [
        { id: 'official', label: 'Official page', type: 'resolver', display: 'No qualifying update is posted.', basis: 'The resolver controls the outcome.' },
        { id: 'headline', label: 'Shared headline', type: 'social', display: 'The broad story may be true but not payable.', basis: 'Headline truth is not rule truth.' }
      ],
      choices: [
        { id: 'pass', label: 'Pass because the payable event is not confirmed', next: 'end_pass', score: 6, tags: ['disciplined_pass'], consequence: 'No exposure means no rescue mission.' },
        { id: 'small', label: 'Continue only with a small controlled position', next: 'planned', score: 3, tags: ['small_size'], consequence: 'The case stays small enough to remain a decision.' },
        { id: 'assume', label: 'Assume the source is basically confirming it', next: 'late', score: -4, tags: ['assumption_gap'], consequence: 'Missing-source risk arrives later as exit pressure.' }
      ]
    },
    depth: {
      id: 'depth',
      scene: 'The Door Is Smaller Than the Quote',
      copy: 'The visible number is not the full doorway. A full exit would slip below the estimate.',
      screen: { cashout: 146, position: '$100', timer: '6:10', rules: 'Unclear', source: 'Pending', book: 'Checked', risk: 'High', chart: 'warn', feed: ['Full exit would slip.', 'Small exits can still fill.'] },
      evidence: [
        { id: 'ladder', label: 'Depth ladder', type: 'liquidity', display: 'Small depth near the visible quote.', basis: 'Exit quality depends on depth.' }
      ],
      choices: [
        { id: 'chunk', label: 'Exit in chunks and accept real fill', next: 'end_depth', score: 5, tags: ['depth_respected'], consequence: 'You convert a display number into a real exit.' },
        { id: 'hold', label: 'Hold because the quote still looks good', next: 'late', score: -4, tags: ['quote_worship'], consequence: 'The next screen punishes relying on a quote instead of depth.' }
      ]
    },
    planned: {
      id: 'planned',
      scene: 'Controlled Exposure',
      copy: 'You are exposed but not trapped. The position is small enough for evidence to matter more than emotion.',
      screen: { cashout: 76, position: '$50', timer: '5:50', rules: 'Read', source: 'Checked', book: 'Thin', risk: 'Low', chart: 'flat', feed: ['Size is controlled.', 'Exit rule is visible.'] },
      evidence: [
        { id: 'rule', label: 'Exit rule', type: 'process', display: 'Exit if source contradicts or depth thins.', basis: 'A rule must exist before pressure.' }
      ],
      choices: [
        { id: 'execute', label: 'Execute the rule and close', next: 'end_process', score: 6, tags: ['rule_executed'], consequence: 'The plan survives the moment it becomes useful.' },
        { id: 'break', label: 'Ignore the rule because the move feels strong', next: 'late', score: -4, tags: ['rule_broken'], consequence: 'A rule that vanishes under pressure is decoration.' }
      ]
    },
    noise: {
      id: 'noise',
      scene: 'The Thread Gets Loud',
      copy: 'The thread creates certainty without responsibility. Nobody has the controlling source.',
      screen: { cashout: 164, position: '$100', timer: '5:30', rules: 'Unclear', source: 'Pending', book: 'Thin', risk: 'Rising', chart: 'flat', feed: ['Confident posts.', 'No source link.'] },
      evidence: [
        { id: 'loud', label: 'Loud account', type: 'social', display: 'Confident claim, no source link.', basis: 'Confidence is not evidence.' }
      ],
      choices: [
        { id: 'leave', label: 'Leave the thread and check the source', next: 'source', score: 4, tags: ['noise_rejected'], consequence: 'You exit the noise loop before it becomes your evidence.' },
        { id: 'trust', label: 'Trust the account that agrees with you', next: 'late', score: -5, tags: ['confirmation_bias'], consequence: 'Agreement becomes a fake source.' }
      ]
    },
    late: {
      id: 'late',
      scene: 'The Door Gets Smaller',
      copy: 'The old number is no longer an offer. It is a ghost. A worse but real door remains.',
      screen: { cashout: 91, position: '$100', timer: '2:10', rules: 'Late', source: 'Updated', book: 'Thin', risk: 'High', chart: 'down', feed: ['The old window is gone.', 'A smaller exit remains.'] },
      evidence: [
        { id: 'ghost', label: 'Missed high', type: 'process', display: 'The prior number is not current value.', basis: 'Old highs are not current exits.' }
      ],
      choices: [
        { id: 'take', label: 'Take the reduced exit', next: 'end_late', score: 3, tags: ['late_exit'], consequence: 'You let current value beat old memory.' },
        { id: 'hold', label: 'Hold for the old number to return', next: 'zero', score: -6, tags: ['anchored_to_high'], consequence: 'The ghost high becomes the loss driver.' }
      ]
    },
    end_window: { id: 'end_window', terminal: true, profile: 'Window Taker', result: 'You took the exit while it existed.', diagnosis: 'You stopped negotiating with a temporary number.', scar: 'The exit number is a door, not a promise.', screen: { cashout: 180, position: 'Closed', timer: 'Done', rules: 'Mixed', source: 'Pending', book: 'Exited', risk: 'None', chart: 'up', feed: ['Exit taken.'] } },
    end_process: { id: 'end_process', terminal: true, profile: 'Process Winner', result: 'You followed the rule before pressure rewrote it.', diagnosis: 'Best process path. The case did not become a personality test.', scar: 'A rule only matters if it survives the moment it becomes useful.', screen: { cashout: 76, position: 'Closed', timer: 'Done', rules: 'Read', source: 'Checked', book: 'Exited', risk: 'None', chart: 'flat', feed: ['Rule executed.'] } },
    end_depth: { id: 'end_depth', terminal: true, profile: 'Depth Realist', result: 'You accepted an imperfect exit that could actually fill.', diagnosis: 'You respected depth instead of worshiping the displayed number.', scar: 'A price you cannot exit is decoration.', screen: { cashout: 146, position: 'Closed', timer: 'Done', rules: 'Mixed', source: 'Pending', book: 'Exited', risk: 'None', chart: 'warn', feed: ['Exit filled.'] } },
    end_pass: { id: 'end_pass', terminal: true, profile: 'Disciplined Pass', result: 'You passed because the payable event was not confirmed.', diagnosis: 'Strong prevention path. Passing was an active decision.', scar: 'The cleanest loss is the one you never enter.', screen: { cashout: 0, position: 'No trade', timer: 'Done', rules: 'Read', source: 'Checked', book: 'Closed', risk: 'None', chart: 'down', feed: ['No rescue needed.'] } },
    end_late: { id: 'end_late', terminal: true, profile: 'Damage Controller', result: 'You took the reduced exit after the read worsened.', diagnosis: 'Expensive, but not terminal.', scar: 'An ugly exit beats a clean zero.', screen: { cashout: 91, position: 'Closed', timer: 'Done', rules: 'Late', source: 'Updated', book: 'Exited', risk: 'None', chart: 'warn', feed: ['Risk removed.'] } },
    zero: { id: 'zero', terminal: true, profile: 'Window Ghost', result: 'The exit vanished while you waited for the old number.', diagnosis: 'Classic first-loss pattern: missed door, reassurance, identity defense.', scar: 'You did not lose because you were early. You lost because you would not leave.', screen: { cashout: 0, position: 'Near zero', timer: 'Done', rules: 'Too late', source: 'Updated', book: 'Closed', risk: 'Finished', chart: 'down', feed: ['Exit gone.'] } }
  }
};

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJson(file, value) {
  const bounded = Array.isArray(value) ? value.slice(0, MAX_ATTEMPTS) : value;
  fs.writeFileSync(file, JSON.stringify(bounded, null, 2));
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body, null, 2));
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    let done = false;
    const fail = (error) => { if (!done) { done = true; reject(error); } };
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

function newAttemptId() {
  return `att_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

function attempts() {
  return readJson(ATTEMPTS_FILE, []);
}

function markEvidenceSeen(attempt, node) {
  if (!node || node.terminal) return;
  attempt.evidence_seen ||= [];
  for (const evidence of node.evidence || []) {
    const exists = attempt.evidence_seen.find(item => item.node_id === node.id && item.evidence_id === evidence.id);
    if (!exists) {
      attempt.evidence_seen.push({ node_id: node.id, scene: node.scene, evidence_id: evidence.id, label: evidence.label, type: evidence.type, basis: evidence.basis });
    }
  }
}

function inspectedSet(attempt, nodeId) {
  return new Set((attempt.evidence_inspections || []).filter(item => item.node_id === nodeId).map(item => item.evidence_id));
}

function missedEvidenceForNode(attempt, nodeId) {
  const inspected = inspectedSet(attempt, nodeId);
  return (attempt.evidence_seen || []).filter(item => item.node_id === nodeId && !inspected.has(item.evidence_id));
}

function buildOutcome(attempt, terminalNode) {
  const tags = {};
  for (const choice of attempt.choices) {
    for (const tag of choice.tags || []) tags[tag] = (tags[tag] || 0) + 1;
  }
  return {
    profile: terminalNode.profile,
    result: terminalNode.result,
    diagnosis: terminalNode.diagnosis,
    scar: terminalNode.scar,
    score_total: attempt.score_total,
    timeline: attempt.choices.map((choice, index) => ({
      move: index + 1,
      scene: choice.scene,
      label: choice.label,
      score: choice.score,
      tags: choice.tags,
      consequence: choice.consequence,
      missed_evidence: missedEvidenceForNode(attempt, choice.node_id)
    })),
    missed_evidence: (attempt.evidence_seen || []).filter(item => !inspectedSet(attempt, item.node_id).has(item.evidence_id)),
    inspected_evidence: attempt.evidence_inspections || [],
    top_mistakes: Object.entries(tags).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count).slice(0, 8)
  };
}

function summarizeAttempt(attempt) {
  return {
    attempt_id: attempt.attempt_id,
    scenario_id: attempt.scenario_id,
    scenario_title: attempt.scenario_title,
    status: attempt.status,
    started_at: attempt.started_at,
    completed_at: attempt.completed_at,
    choices_count: attempt.choices.length,
    evidence_inspections_count: (attempt.evidence_inspections || []).length,
    score_total: attempt.score_total,
    scar_unlocked: attempt.scar_unlocked,
    profile: attempt.outcome?.profile || null
  };
}

async function readRequestBody(req, res) {
  try {
    return await getBody(req);
  } catch (error) {
    send(res, 400, { ok: false, error: error.message });
    return null;
  }
}

export async function handleLocalForge(req, res, routePath) {
  if (routePath === '/health' || routePath === '/api/health') {
    return send(res, 200, { ok: true, layer: 'The Forge', build: localForgeBuild, status: 'online', runtime: 'inside-ox', active_scenario: scenario.id, game_mode: scenario.format });
  }

  if (routePath === '/api/catalog') {
    return send(res, 200, { ok: true, build: localForgeBuild, catalog: { module: 'second-stake', active_scenario: scenario.id } });
  }

  if (routePath === '/api/scenarios') {
    return send(res, 200, { ok: true, build: localForgeBuild, scenarios: [{ id: scenario.id, title: scenario.title, subtitle: scenario.subtitle, status: 'active', scar: scenario.scar, module: scenario.module, scenario_number: 1, format: scenario.format }] });
  }

  if (req.method === 'GET' && routePath.startsWith('/api/scenarios/')) {
    return send(res, 200, { ok: true, build: localForgeBuild, scenario: { ...scenario, nodes: Object.values(scenario.nodes) } });
  }

  if (req.method === 'POST' && routePath === '/api/attempts') {
    const startNode = scenario.nodes.start;
    const attempt = {
      attempt_id: newAttemptId(),
      scenario_id: scenario.id,
      scenario_title: scenario.title,
      module: scenario.module,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      completed_at: null,
      current_node_id: 'start',
      choices: [],
      evidence_seen: [],
      evidence_inspections: [],
      score_total: 0,
      outcome: null,
      scar_unlocked: null
    };
    markEvidenceSeen(attempt, startNode);
    const currentAttempts = attempts();
    currentAttempts.unshift(attempt);
    writeJson(ATTEMPTS_FILE, currentAttempts);
    return send(res, 201, { ok: true, build: localForgeBuild, attempt, node: startNode, scenario_summary: { id: scenario.id, title: scenario.title, scar: scenario.scar, scenario_number: 1, format: scenario.format } });
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

    const node = scenario.nodes[attempt.current_node_id];
    const evidence = (node?.evidence || []).find(item => item.id === body.evidence_id);
    if (!evidence) return send(res, 400, { ok: false, error: 'Evidence not valid' });

    attempt.evidence_inspections ||= [];
    const exists = attempt.evidence_inspections.find(item => item.node_id === node.id && item.evidence_id === evidence.id);
    if (!exists) {
      attempt.evidence_inspections.push({ at: new Date().toISOString(), node_id: node.id, scene: node.scene, evidence_id: evidence.id, label: evidence.label, type: evidence.type, basis: evidence.basis });
    }
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

    const node = scenario.nodes[attempt.current_node_id];
    const selected = (node?.choices || []).find(item => item.id === body.choice_id);
    if (!selected) return send(res, 400, { ok: false, error: 'Choice not valid' });

    const nextNode = scenario.nodes[selected.next];
    if (!nextNode) return send(res, 500, { ok: false, error: 'Scenario routing error', detail: `Unknown node: ${selected.next}` });

    attempt.choices.push({
      at: new Date().toISOString(),
      node_id: node.id,
      scene: node.scene,
      choice_id: selected.id,
      label: selected.label,
      next_node_id: selected.next,
      score: selected.score,
      tags: selected.tags,
      consequence: selected.consequence
    });
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
    return send(res, 200, { ok: true, build: localForgeBuild, attempt, node: responseNode, complete: attempt.status === 'complete', scar_unlocked: attempt.scar_unlocked });
  }

  if (req.method === 'GET' && routePath === '/api/attempts') {
    return send(res, 200, { ok: true, build: localForgeBuild, attempts: attempts().slice(0, 80).map(summarizeAttempt) });
  }

  if (req.method === 'GET' && routePath === '/api/progress') {
    const currentAttempts = attempts();
    const completed = currentAttempts.filter(attempt => attempt.status === 'complete');
    return send(res, 200, {
      ok: true,
      build: localForgeBuild,
      progress: {
        total_attempts: currentAttempts.length,
        completed_attempts: completed.length,
        scars_unlocked: new Set(completed.map(attempt => attempt.scar_unlocked).filter(Boolean)).size,
        evidence_inspections: currentAttempts.reduce((total, attempt) => total + (attempt.evidence_inspections || []).length, 0)
      }
    });
  }

  return send(res, 404, { ok: false, error: 'Local Forge route not found', build: localForgeBuild, path: routePath });
}
