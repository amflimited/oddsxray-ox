import fs from 'node:fs';
import crypto from 'node:crypto';

export const localForgeBuild = 'FORGE-IN-OX-002B';

const ATTEMPTS_FILE = './attempts.local.json';
const MAX_ATTEMPTS = 500;
const MAX_BODY_BYTES = 65536;

const skillNames = {
  evidence_discipline: 'Evidence discipline',
  source_skepticism: 'Source skepticism',
  rule_awareness: 'Rule awareness',
  exit_discipline: 'Exit discipline',
  timing_control: 'Timing control',
  contradiction_recognition: 'Contradiction recognition',
  greed_resistance: 'Greed resistance',
  panic_resistance: 'Panic resistance',
  process_integrity: 'Process integrity'
};

const variants = [
  {
    id: 'base',
    title: 'Base case',
    pressure: 'The clean version of the $180 window.',
    changes: {}
  },
  {
    id: 'source_louder',
    title: 'Source gets louder',
    pressure: 'The same weak source repeats itself with more confidence.',
    changes: {
      feedPressure: 'source_repetition',
      addFeed: {
        'n01-opening-window': ['7:05 — Source repeats: “Book is still behind. Don’t cash yet.”'],
        'n02-source-review': ['6:11 — Source repeats confidence again without adding proof.'],
        'n04-hold-pressure': ['3:58 — Source says: “This is just volatility.”']
      }
    }
  },
  {
    id: 'cashout_rebound',
    title: 'Cashout rebounds briefly',
    pressure: 'A small rebound tempts the player to treat relief as proof.',
    changes: {
      reboundNode: 'n03-market-review',
      reboundCashout: 174,
      addFeed: {
        'n03-market-review': [
          '5:59 — Cashout briefly rebounds to $174.',
          '5:44 — The rebound does not add confirmation.'
        ]
      }
    }
  },
  {
    id: 'rule_worse',
    title: 'Rule evidence is worse',
    pressure: 'The settlement condition makes the source even less reliable.',
    changes: {
      ruleSeverity: 'high',
      replaceEvidenceBasis: {
        'ev-rule-note': 'The source appears to misunderstand the settlement condition. The story can be true while the contract still grades against you.'
      }
    }
  },
  {
    id: 'good_process_bad_result',
    title: 'Exit looks wrong afterward',
    pressure: 'The outcome tries to punish clean process after the player exits.',
    changes: {
      postExitTemptation: true,
      addTerminalFeed: {
        't02-disciplined-exit': [
          'After exit, the simulated position briefly would have improved.',
          'The result tried to punish the process. That does not make the process wrong.'
        ],
        't07-clean-operator': [
          'After rejection, the source later posts a victory screenshot.',
          'A lucky source is not automatically a usable source.'
        ]
      }
    }
  }
];

const nodes = {
  'n01-opening-window': {
    id: 'n01-opening-window',
    scene: 'The $180 Window',
    copy: 'The cashout is $171. You remember seeing $180. The source says the position still has more room. What do you do first?',
    screen: {
      cashout: 171,
      position: '$100 live',
      timer: '8:00',
      rules: 'Unconfirmed',
      source: 'Unverified',
      book: 'Thin',
      risk: 'Rising',
      chart: 'up',
      feed: [
        '8:00 — Position is live. Cashout available at $171.',
        '7:48 — Cashout was $180 two minutes ago.',
        '7:31 — Source says the book is still behind.',
        '7:15 — Market volume looks thin.'
      ]
    },
    evidence: [
      {
        id: 'ev-source-discord',
        type: 'SOURCE',
        label: 'Discord screenshot',
        display: 'The source is a screenshot from a private chat. No timestamp. No original book reference.',
        basis: 'The source may be right, but it is not independently verified.',
        weight: 'high',
        tests: ['source_skepticism', 'source_believer']
      },
      {
        id: 'ev-cashout-history',
        type: 'MARKET',
        label: 'Cashout history',
        display: 'Cashout moved from $100 → $142 → $180 → $171.',
        basis: 'The $180 number is gone. The current decision must use $171, not the peak.',
        weight: 'critical',
        tests: ['exit_discipline', 'anchor_bias']
      },
      {
        id: 'ev-book-depth',
        type: 'BOOK',
        label: 'Book depth',
        display: 'Only one book is showing the favorable signal. Other books have not confirmed.',
        basis: 'This may be stale, thin, or delayed movement rather than real edge.',
        weight: 'critical',
        tests: ['market_skepticism', 'rule_awareness']
      },
      {
        id: 'ev-rule-note',
        type: 'RULES',
        label: 'Settlement condition',
        display: 'The position depends on a condition that may not settle the way the source describes.',
        basis: 'The source is simplifying the rule. The book may grade differently.',
        weight: 'high',
        tests: ['rule_awareness', 'process_integrity']
      },
      {
        id: 'ev-clock-pressure',
        type: 'TIMING',
        label: 'Clock pressure',
        display: 'The decision window is shrinking. Cashout liquidity may disappear.',
        basis: 'Waiting is not neutral. Waiting is also a decision.',
        weight: 'medium',
        tests: ['timing_control', 'delayed_exit']
      },
      {
        id: 'ev-contradiction',
        type: 'CONTRADICTION',
        label: 'Confidence mismatch',
        display: 'The source says the book is behind, but the cashout has already started falling.',
        basis: 'If the book were still badly behind, the cashout should not be decaying this quickly.',
        weight: 'critical',
        tests: ['contradiction_recognition', 'source_skepticism']
      }
    ],
    choices: [
      {
        id: 'inspect_source',
        label: 'Inspect the source',
        next: 'n02-source-review',
        score: 2,
        tags: ['source_skepticism', 'process_integrity'],
        consequence: 'You slow the decision down and check whether the confidence is real.',
        transition: 'The source opens. The confidence is loud, but the proof is thin.',
        skills: { evidence_discipline: 1, source_skepticism: 2, process_integrity: 1 }
      },
      {
        id: 'inspect_market',
        label: 'Inspect the cashout movement',
        next: 'n03-market-review',
        score: 3,
        tags: ['exit_discipline', 'contradiction_recognition', 'process_integrity'],
        consequence: 'You compare the current price against the peak instead of reacting emotionally.',
        transition: 'The board updates. The old number is gone.',
        skills: { evidence_discipline: 1, exit_discipline: 2, contradiction_recognition: 1, process_integrity: 1 }
      },
      {
        id: 'exit_now',
        label: 'Exit at $171',
        next: 't01-clean-but-shallow-exit',
        score: 1,
        tags: ['exit_discipline', 'incomplete_inspection'],
        consequence: 'You protect a $71 gain without fully checking the evidence.',
        transition: 'The position closes cleanly, but the process is shallow.',
        skills: { exit_discipline: 1, process_integrity: -1 }
      },
      {
        id: 'hold_without_checking',
        label: 'Hold for the $180+ return',
        next: 'n04-hold-pressure',
        score: -3,
        tags: ['greed_chasing', 'anchor_bias', 'acted_before_inspection'],
        consequence: 'You anchor to the price that already disappeared.',
        transition: 'The market keeps moving while you negotiate with the past.',
        skills: { evidence_discipline: -2, exit_discipline: -2, greed_resistance: -2, process_integrity: -2 }
      },
      {
        id: 'wait_one_beat',
        label: 'Wait one beat',
        next: 'n05-wait-pressure',
        score: 0,
        tags: ['timing_control', 'delay_risk'],
        consequence: 'You buy a moment, but the market keeps moving while you wait.',
        transition: 'Waiting feels neutral. The board disagrees.',
        skills: { timing_control: 1, process_integrity: 0 }
      }
    ]
  },

  'n02-source-review': {
    id: 'n02-source-review',
    scene: 'The source is loud, not deep.',
    copy: 'The source is a Discord screenshot with no timestamp and no original market reference. The cashout has slipped again.',
    screen: {
      cashout: 168,
      position: '$100 live',
      timer: '6:40',
      rules: 'Unconfirmed',
      source: 'Weak',
      book: 'Unconfirmed',
      risk: 'Rising',
      chart: 'warn',
      feed: [
        '6:40 — Cashout slips to $168.',
        '6:32 — Source repeats confidence but provides no timestamp.',
        '6:18 — No original book reference is visible.',
        '6:05 — The position is still profitable, but the window is narrowing.'
      ]
    },
    evidence: [
      { id: 'ev-source-discord', type: 'SOURCE', label: 'Discord screenshot', display: 'The source is a screenshot from a private chat. No timestamp. No original book reference.', basis: 'Confidence without timestamped source depth cannot carry the decision.', weight: 'high', tests: ['source_skepticism', 'source_believer'] },
      { id: 'ev-clock-pressure', type: 'TIMING', label: 'Clock pressure', display: 'The decision window is shrinking. Cashout liquidity may disappear.', basis: 'The source is not getting stronger while time passes.', weight: 'medium', tests: ['timing_control', 'delayed_exit'] },
      { id: 'ev-contradiction', type: 'CONTRADICTION', label: 'Confidence mismatch', display: 'The source says the book is behind, but the cashout has slipped again.', basis: 'The board is not confirming the source’s confidence.', weight: 'critical', tests: ['contradiction_recognition', 'source_skepticism'] }
    ],
    choices: [
      { id: 'challenge_source', label: 'Challenge the source', next: 'n06-contradiction-review', score: 3, tags: ['source_skepticism', 'contradiction_recognition', 'process_integrity'], consequence: 'You refuse to treat confidence as evidence.', transition: 'The story is checked against the board.', skills: { source_skepticism: 2, contradiction_recognition: 1, process_integrity: 2 } },
      { id: 'exit_after_source_check', label: 'Exit at $168', next: 't02-disciplined-exit', score: 4, tags: ['exit_discipline', 'source_skepticism', 'process_integrity'], consequence: 'You accept the lower current value after confirming the source is weak.', transition: 'The position closes before the weak source costs more value.', skills: { source_skepticism: 2, exit_discipline: 2, process_integrity: 2, greed_resistance: 1 } },
      { id: 'hold_after_weak_source', label: 'Hold anyway', next: 'n04-hold-pressure', score: -4, tags: ['source_believer', 'greed_chasing', 'ignored_evidence'], consequence: 'You identify weak evidence, then ignore it.', transition: 'Seeing the weakness does not help if you still obey the story.', skills: { source_skepticism: -2, exit_discipline: -2, greed_resistance: -2, process_integrity: -2 } }
    ]
  },

  'n03-market-review': {
    id: 'n03-market-review',
    scene: 'The number is not waiting for you.',
    copy: 'The cashout has moved $180 → $171 → $166. Only one book supports the favorable signal. Other books are quiet.',
    screen: { cashout: 166, position: '$100 live', timer: '6:25', rules: 'Unconfirmed', source: 'Unverified', book: 'Thin', risk: 'High', chart: 'down', feed: ['6:25 — Cashout slips to $166.', '6:14 — Only one book still supports the favorable signal.', '6:02 — The broader board is not confirming.', '5:48 — The $180 window is gone.'] },
    evidence: [
      { id: 'ev-cashout-history', type: 'MARKET', label: 'Cashout history', display: 'Cashout moved from $100 → $142 → $180 → $171 → $166.', basis: 'The current decision must use the live $166 value, not the vanished $180 peak.', weight: 'critical', tests: ['exit_discipline', 'anchor_bias'] },
      { id: 'ev-book-depth', type: 'BOOK', label: 'Book depth', display: 'Only one book is showing the favorable signal. Other books have not confirmed.', basis: 'Isolated movement is not enough proof to keep taking risk.', weight: 'critical', tests: ['market_skepticism', 'rule_awareness'] },
      { id: 'ev-contradiction', type: 'CONTRADICTION', label: 'Confidence mismatch', display: 'The source says more upside is coming, but the cashout continues to decay.', basis: 'The board is contradicting the story.', weight: 'critical', tests: ['contradiction_recognition', 'source_skepticism'] }
    ],
    choices: [
      { id: 'inspect_contradiction', label: 'Inspect the contradiction', next: 'n06-contradiction-review', score: 3, tags: ['contradiction_recognition', 'market_skepticism', 'process_integrity'], consequence: 'You compare the source claim against the falling cashout.', transition: 'The board and the story are now in conflict.', skills: { evidence_discipline: 1, contradiction_recognition: 2, source_skepticism: 1, process_integrity: 1 } },
      { id: 'exit_market_decay', label: 'Exit at $166', next: 't02-disciplined-exit', score: 4, tags: ['exit_discipline', 'process_integrity', 'greed_resistance'], consequence: 'You stop chasing the vanished peak and protect the current edge.', transition: 'The position closes before the window decays further.', skills: { exit_discipline: 2, greed_resistance: 2, process_integrity: 2, timing_control: 1 } },
      { id: 'hold_for_peak', label: 'Hold because it was $180', next: 'n04-hold-pressure', score: -5, tags: ['anchor_bias', 'greed_chasing', 'market_worship'], consequence: 'You are not evaluating the current position. You are arguing with the past.', transition: 'The market keeps moving while you wait for yesterday’s price.', skills: { exit_discipline: -2, greed_resistance: -2, process_integrity: -2, timing_control: -1 } }
    ]
  },

  'n04-hold-pressure': {
    id: 'n04-hold-pressure',
    scene: 'The market charges rent.',
    copy: 'The cashout drops to $128. The source says this is just volatility. You can still exit, but the clean window is gone.',
    screen: { cashout: 128, position: '$100 live', timer: '4:10', rules: 'Unconfirmed', source: 'Still loud', book: 'Thin', risk: 'Danger', chart: 'down', feed: ['4:10 — Cashout drops to $128.', '4:04 — Source says this is just volatility.', '3:52 — The clean exit window is gone.', '3:37 — You can still protect profit, but not the good price.'] },
    evidence: [
      { id: 'ev-cashout-history', type: 'MARKET', label: 'Cashout history', display: 'Cashout moved from $180 → $171 → $166 → $128.', basis: 'Delay has already converted a clean decision into damage control.', weight: 'critical', tests: ['exit_discipline', 'missed_window'] },
      { id: 'ev-source-discord', type: 'SOURCE', label: 'Discord screenshot', display: 'The same source remains confident despite the falling board.', basis: 'The source is defending the story, not updating from the market.', weight: 'high', tests: ['source_skepticism', 'source_believer'] },
      { id: 'ev-clock-pressure', type: 'TIMING', label: 'Clock pressure', display: 'The available cashout is still positive, but the decision window is much worse.', basis: 'Late action can still protect some value, but it cannot restore the clean window.', weight: 'medium', tests: ['timing_control', 'delayed_exit'] }
    ],
    choices: [
      { id: 'exit_late', label: 'Exit late at $128', next: 't03-late-exit', score: -1, tags: ['late_discipline', 'anchor_bias', 'delayed_exit'], consequence: 'You protected profit, but only after letting the market punish your delay.', transition: 'The position closes. The autopsy will be about timing.', skills: { exit_discipline: 1, timing_control: -1, process_integrity: -1, greed_resistance: 1 } },
      { id: 'double_down_mentally', label: 'Keep holding', next: 't04-greed-failure', score: -6, tags: ['greed_chasing', 'source_believer', 'process_failure'], consequence: 'You turn the position into a story you need to be true.', transition: 'The position becomes a hostage situation.', skills: { exit_discipline: -2, greed_resistance: -2, source_skepticism: -2, process_integrity: -2 } },
      { id: 'inspect_after_damage', label: 'Inspect evidence now', next: 't05-late-process', score: -2, tags: ['late_process', 'acted_before_inspection', 'missed_window'], consequence: 'You start doing the right process after the valuable window has already closed.', transition: 'The evidence explains what it can no longer protect.', skills: { evidence_discipline: 1, timing_control: -2, process_integrity: -1 } }
    ]
  },

  'n05-wait-pressure': {
    id: 'n05-wait-pressure',
    scene: 'Waiting is also a bet.',
    copy: 'You waited. The cashout fell to $159. Nothing got clearer. The decision is now worse, not safer.',
    screen: { cashout: 159, position: '$100 live', timer: '5:50', rules: 'Unconfirmed', source: 'Unchanged', book: 'Thin', risk: 'High', chart: 'warn', feed: ['5:50 — Cashout drops to $159.', '5:42 — No new confirmation appears.', '5:31 — The source repeats the same claim.', '5:19 — Waiting did not add evidence. It only changed the price.'] },
    evidence: [
      { id: 'ev-clock-pressure', type: 'TIMING', label: 'Clock pressure', display: 'The decision window is shrinking. Cashout liquidity may disappear.', basis: 'Waiting without new information is not neutral.', weight: 'medium', tests: ['timing_control', 'delayed_exit'] },
      { id: 'ev-cashout-history', type: 'MARKET', label: 'Cashout history', display: 'Cashout moved from $180 → $171 → $159 while you waited.', basis: 'The wait cost value without improving certainty.', weight: 'critical', tests: ['exit_discipline', 'missed_window'] },
      { id: 'ev-contradiction', type: 'CONTRADICTION', label: 'Confidence mismatch', display: 'The source did not change, but the board got worse.', basis: 'The story stayed still while the market moved against it.', weight: 'critical', tests: ['contradiction_recognition', 'source_skepticism'] }
    ],
    choices: [
      { id: 'exit_after_wait', label: 'Exit at $159', next: 't06-controlled-damage', score: 1, tags: ['timing_control', 'exit_discipline', 'delayed_action'], consequence: 'You accept that waiting cost value and stop the damage.', transition: 'The mistake is contained before it becomes denial.', skills: { exit_discipline: 1, timing_control: 0, process_integrity: 1, greed_resistance: 1 } },
      { id: 'inspect_market_late', label: 'Inspect market now', next: 'n03-market-review', score: 0, tags: ['late_process', 'market_skepticism'], consequence: 'You finally check the evidence, but after the price has already decayed.', transition: 'The market review opens late.', skills: { evidence_discipline: 1, market_skepticism: 1, timing_control: -1 } },
      { id: 'hold_because_down', label: 'Hold because it already dropped', next: 'n04-hold-pressure', score: -4, tags: ['loss_chasing', 'greed_chasing', 'process_failure'], consequence: 'You let a worse price convince you to take more risk.', transition: 'The drop becomes the excuse to keep holding.', skills: { exit_discipline: -2, greed_resistance: -2, timing_control: -1, process_integrity: -2 } }
    ]
  },

  'n06-contradiction-review': {
    id: 'n06-contradiction-review',
    scene: 'The story and the board disagree.',
    copy: 'The source says the book is behind. But the cashout has fallen three times. If the edge were still expanding, the board would not be decaying this fast.',
    screen: { cashout: 164, position: '$100 live', timer: '5:30', rules: 'Needs review', source: 'Contradicted', book: 'Thin', risk: 'High', chart: 'warn', feed: ['5:30 — Cashout available at $164.', '5:21 — The source remains confident.', '5:09 — The board has contradicted the source three times.', '4:55 — You do not need certainty. You need process.'] },
    evidence: [
      { id: 'ev-contradiction', type: 'CONTRADICTION', label: 'Confidence mismatch', display: 'The source says the book is behind, but the cashout has fallen three times.', basis: 'The board is contradicting the story.', weight: 'critical', tests: ['contradiction_recognition', 'source_skepticism'] },
      { id: 'ev-rule-note', type: 'RULES', label: 'Settlement condition', display: 'The source is simplifying the settlement condition.', basis: 'You can be right about the story and still wrong about the contract.', weight: 'high', tests: ['rule_awareness', 'process_integrity'] },
      { id: 'ev-book-depth', type: 'BOOK', label: 'Book depth', display: 'Only one book supports the favorable signal.', basis: 'Thin confirmation is not enough to override a decaying board.', weight: 'critical', tests: ['market_skepticism', 'rule_awareness'] }
    ],
    choices: [
      { id: 'exit_on_contradiction', label: 'Exit on contradiction', next: 't02-disciplined-exit', score: 5, tags: ['contradiction_recognition', 'exit_discipline', 'source_skepticism', 'process_integrity'], consequence: 'You choose the board over the story and preserve the remaining edge.', transition: 'The position closes because the process no longer supports holding.', skills: { contradiction_recognition: 2, exit_discipline: 2, source_skepticism: 1, process_integrity: 2, greed_resistance: 1 } },
      { id: 'reject_setup', label: 'Reject the setup entirely', next: 't07-clean-operator', score: 5, tags: ['source_skepticism', 'rule_awareness', 'process_integrity', 'future_risk_control'], consequence: 'You mark the source as unusable and refuse future action from the same signal.', transition: 'The case closes as a source-quality failure.', skills: { source_skepticism: 2, rule_awareness: 2, process_integrity: 2, greed_resistance: 1 } },
      { id: 'hold_despite_contradiction', label: 'Hold despite contradiction', next: 't04-greed-failure', score: -6, tags: ['ignored_evidence', 'source_believer', 'greed_chasing', 'process_failure'], consequence: 'You saw the contradiction and chose the story anyway.', transition: 'The autopsy will not treat this as bad luck.', skills: { contradiction_recognition: -2, source_skepticism: -2, exit_discipline: -2, process_integrity: -2, greed_resistance: -2 } }
    ]
  },

  't01-clean-but-shallow-exit': { id: 't01-clean-but-shallow-exit', terminal: true, profile: 'Safe but Shallow', result: 'You exited at $171 and protected profit.', diagnosis: 'The result was fine, but the process was incomplete. You protected value without proving whether the source, rules, or market supported the decision.', scar: 'A good exit can still hide a weak process.', screen: { cashout: 171, position: 'Exited', timer: '7:45', rules: 'Unchecked', source: 'Unchecked', book: 'Unchecked', risk: 'Closed', chart: 'warn', feed: ['You closed the position profitably.', 'Several critical evidence cards were still unopened.', 'This worked here, but the process is not durable.'] } },
  't02-disciplined-exit': { id: 't02-disciplined-exit', terminal: true, profile: 'Disciplined Operator', result: 'You exited after evidence showed the window was decaying.', diagnosis: 'You stopped arguing with the vanished $180 number. You used current evidence, not emotional anchoring, to protect the position.', scar: 'You cannot cash out yesterday’s price.', screen: { cashout: 166, position: 'Exited', timer: '5:30', rules: 'Reviewed', source: 'Weak', book: 'Thin', risk: 'Controlled', chart: 'warn', feed: ['You exited before the board decayed further.', 'The source remained confident, but the market did not confirm.', 'The important move was refusing to anchor to the vanished peak.'] } },
  't03-late-exit': { id: 't03-late-exit', terminal: true, profile: 'Late Protector', result: 'You exited at $128.', diagnosis: 'You eventually protected profit, but only after anchoring to a number that no longer existed. The damage came from delay, not from the final exit.', scar: 'The market charges rent while you negotiate with the past.', screen: { cashout: 128, position: 'Exited', timer: '3:50', rules: 'Unconfirmed', source: 'Still loud', book: 'Thin', risk: 'Damaged', chart: 'danger', feed: ['You closed the position late.', 'Profit survived, but the clean window did not.', 'The delay became the lesson.'] } },
  't04-greed-failure': { id: 't04-greed-failure', terminal: true, profile: 'Greed Chaser', result: 'The cashout collapses. The position loses most of its protected value.', diagnosis: 'You did not hold because the evidence improved. You held because the earlier number made the current number feel unacceptable.', scar: 'A better number is not a better decision.', screen: { cashout: 42, position: '$100 trapped', timer: '2:15', rules: 'Unresolved', source: 'Wrong or late', book: 'Collapsed', risk: 'Failure', chart: 'danger', feed: ['The cashout collapses to $42.', 'The source stops updating.', 'The $180 number became the trap.', 'This was not a bad beat. It was a process failure.'] } },
  't05-late-process': { id: 't05-late-process', terminal: true, profile: 'Late Investigator', result: 'You started checking evidence after the clean decision window had passed.', diagnosis: 'The inspection was correct, but the timing was not. Process after damage is better than denial, but it does not recover the lost window.', scar: 'Evidence checked late becomes an autopsy, not protection.', screen: { cashout: 118, position: '$100 live', timer: '3:25', rules: 'Reviewed late', source: 'Weak', book: 'Thin', risk: 'Damaged', chart: 'danger', feed: ['The source weakness is now visible.', 'The cashout is already damaged.', 'The evidence explains what it can no longer protect.'] } },
  't06-controlled-damage': { id: 't06-controlled-damage', terminal: true, profile: 'Controlled Damage', result: 'You waited, lost value, then exited before the position got worse.', diagnosis: 'You hesitated, but you did not let hesitation become denial. This was not a clean run. It was damage control.', scar: 'Waiting is also a bet.', screen: { cashout: 159, position: 'Exited', timer: '5:20', rules: 'Unconfirmed', source: 'Unchanged', book: 'Thin', risk: 'Contained', chart: 'warn', feed: ['You waited and paid for it.', 'You still exited before hesitation became denial.', 'The damage was contained.'] } },
  't07-clean-operator': { id: 't07-clean-operator', terminal: true, profile: 'Clean Operator', result: 'You rejected the setup after identifying weak source quality and market contradiction.', diagnosis: 'You separated story from contract. You did not need to know whether the bet would win to know the decision process was contaminated.', scar: 'A source without depth is just noise with confidence.', screen: { cashout: 164, position: 'Rejected', timer: '5:10', rules: 'Reviewed', source: 'Rejected', book: 'Thin', risk: 'Controlled', chart: 'warn', feed: ['The setup is rejected.', 'The source did not meet the burden.', 'The board contradicted the story.', 'The process stayed clean.'] } }
};

const scenario = {
  schema_version: 'oddsxray.scenario.v1',
  id: 's01-the-180-window',
  title: 'The $180 Window',
  subtitle: 'You are already in. The cashout moved. Now what?',
  module: 'second-stake',
  scenario_number: 1,
  status: 'active',
  format: 'case_cockpit_tracked_evidence',
  scar: 'You cannot cash out yesterday’s price.',
  skill_names: skillNames,
  variants,
  nodes
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }
let memoryAttempts = [];
try { memoryAttempts = JSON.parse(fs.readFileSync(ATTEMPTS_FILE, 'utf8')); } catch { memoryAttempts = []; }
function persistAttempts() { try { fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(memoryAttempts.slice(0, MAX_ATTEMPTS), null, 2)); } catch { /* read-only runtime fallback */ } }
function send(res, status, body) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body, null, 2)); }
function newAttemptId() { return `att_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`; }
function attempts() { return memoryAttempts; }
function chooseVariant() { return variants[Math.floor(Math.random() * variants.length)]; }

function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) reject(new Error('Request body too large'));
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}
async function readRequestBody(req, res) { try { return await getBody(req); } catch (error) { send(res, 400, { ok: false, error: error.message }); return null; } }

function materializeNode(nodeId, variantId) {
  const base = scenario.nodes[nodeId];
  if (!base) return null;
  const node = clone(base);
  const variant = variants.find(item => item.id === variantId) || variants[0];
  node.variant = { id: variant.id, title: variant.title, pressure: variant.pressure };
  const changes = variant.changes || {};
  if (changes.addFeed?.[node.id] && node.screen) node.screen.feed = [...(node.screen.feed || []), ...changes.addFeed[node.id]];
  if (changes.reboundNode === node.id && Number.isFinite(changes.reboundCashout) && node.screen) {
    node.screen.cashout = changes.reboundCashout;
    node.screen.chart = 'warn';
  }
  if (changes.replaceEvidenceBasis && node.evidence) node.evidence = node.evidence.map(item => changes.replaceEvidenceBasis[item.id] ? { ...item, basis: changes.replaceEvidenceBasis[item.id] } : item);
  if (changes.addTerminalFeed?.[node.id] && node.screen) node.screen.feed = [...(node.screen.feed || []), ...changes.addTerminalFeed[node.id]];
  return node;
}

function markEvidenceSeen(attempt, node) {
  if (!node || node.terminal) return;
  attempt.evidence_seen ||= [];
  for (const evidence of node.evidence || []) {
    if (!attempt.evidence_seen.find(item => item.node_id === node.id && item.evidence_id === evidence.id)) {
      attempt.evidence_seen.push({ node_id: node.id, scene: node.scene, evidence_id: evidence.id, label: evidence.label, type: evidence.type, basis: evidence.basis });
    }
  }
}
function inspectedSet(attempt, nodeId) { return new Set((attempt.evidence_inspections || []).filter(item => item.node_id === nodeId).map(item => item.evidence_id)); }
function missedEvidenceForNode(attempt, nodeId) { const inspected = inspectedSet(attempt, nodeId); return (attempt.evidence_seen || []).filter(item => item.node_id === nodeId && !inspected.has(item.evidence_id)); }
function emptySkills() { return Object.fromEntries(Object.keys(skillNames).map(key => [key, 0])); }
function buildSkillReport(attempt) {
  const totals = emptySkills();
  for (const choice of attempt.choices) for (const [skill, value] of Object.entries(choice.skills || {})) totals[skill] = (totals[skill] || 0) + value;
  const rows = Object.entries(totals).map(([key, score]) => ({ key, label: skillNames[key], score }));
  return { scores: rows, strengths: rows.filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 3), weaknesses: rows.filter(r => r.score < 0).sort((a, b) => a.score - b.score).slice(0, 3) };
}
function buildOutcome(attempt, terminalNode) {
  const tags = {};
  for (const choice of attempt.choices) for (const tag of choice.tags || []) tags[tag] = (tags[tag] || 0) + 1;
  const skillReport = buildSkillReport(attempt);
  return {
    profile: terminalNode.profile,
    result: terminalNode.result,
    diagnosis: terminalNode.diagnosis,
    scar: terminalNode.scar,
    score_total: attempt.score_total,
    variant: attempt.variant,
    skill_report: skillReport,
    replay_prompt: skillReport.weaknesses[0] ? `Run it again and protect ${skillReport.weaknesses[0].label.toLowerCase()}.` : 'Run it again and see whether you can keep the process clean.',
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
  for (const [nodeId, node] of Object.entries(scenario.nodes)) {
    if (node.id !== nodeId) errors.push(`Node key/id mismatch: ${nodeId}`);
    if (!node.terminal && !node.screen) errors.push(`Node ${nodeId} missing screen.`);
    if (node.terminal && node.choices?.length) errors.push(`Terminal node ${nodeId} has choices.`);
    for (const selected of node.choices || []) {
      if (!selected.next || !scenario.nodes[selected.next]) errors.push(`Choice ${nodeId}.${selected.id} points to missing node ${selected.next}.`);
      if (!selected.consequence) errors.push(`Choice ${nodeId}.${selected.id} missing consequence.`);
      if (!selected.transition) errors.push(`Choice ${nodeId}.${selected.id} missing transition.`);
      if (!selected.skills) errors.push(`Choice ${nodeId}.${selected.id} missing skills.`);
    }
  }
  return { ok: errors.length === 0, errors, checked_nodes: Object.keys(scenario.nodes).length, checked_variants: variants.length };
}
const validation = validateScenario();

export async function handleLocalForge(req, res, routePath) {
  if (routePath === '/health' || routePath === '/api/health') return send(res, 200, { ok: true, layer: 'The Forge', build: localForgeBuild, status: 'online', runtime: 'inside-ox', active_scenario: scenario.id, game_mode: scenario.format, validation });
  if (routePath === '/api/validate') return send(res, 200, { ok: validation.ok, build: localForgeBuild, validation });
  if (routePath === '/api/catalog') return send(res, 200, { ok: true, build: localForgeBuild, catalog: { module: 'second-stake', active_scenario: scenario.id, doctrine: 'briefing, evidence, consequence, autopsy, replay' } });
  if (routePath === '/api/scenarios') return send(res, 200, { ok: true, build: localForgeBuild, scenarios: [{ id: scenario.id, title: scenario.title, subtitle: scenario.subtitle, status: 'active', scar: scenario.scar, module: scenario.module, scenario_number: 1, format: scenario.format, validation: validation.ok }, { id: 's02-headline-poison', title: 'Headline Poison', status: 'locked', module: 'second-stake', scenario_number: 2, scar: 'A story can be true and still not pay the contract.' }] });
  if (req.method === 'GET' && routePath.startsWith('/api/scenarios/')) return send(res, 200, { ok: true, build: localForgeBuild, scenario: { ...scenario, nodes: Object.values(scenario.nodes), validation } });

  if (req.method === 'POST' && routePath === '/api/attempts') {
    const variant = chooseVariant();
    const startNode = materializeNode('n01-opening-window', variant.id);
    const attempt = { attempt_id: newAttemptId(), scenario_id: scenario.id, scenario_title: scenario.title, module: scenario.module, status: 'in_progress', started_at: new Date().toISOString(), completed_at: null, current_node_id: 'n01-opening-window', variant, choices: [], evidence_seen: [], evidence_inspections: [], score_total: 0, outcome: null, scar_unlocked: null };
    markEvidenceSeen(attempt, startNode);
    memoryAttempts.unshift(attempt);
    memoryAttempts = memoryAttempts.slice(0, MAX_ATTEMPTS);
    persistAttempts();
    return send(res, 201, { ok: true, build: localForgeBuild, attempt, node: startNode, scenario_summary: { id: scenario.id, title: scenario.title, scar: scenario.scar, scenario_number: 1, format: scenario.format, variant } });
  }

  if (req.method === 'POST' && /^\/api\/attempts\/[^/]+\/evidence$/.test(routePath)) {
    const attemptId = routePath.split('/')[3];
    const body = await readRequestBody(req, res);
    if (body === null) return;
    const attempt = memoryAttempts.find(item => item.attempt_id === attemptId);
    if (!attempt) return send(res, 404, { ok: false, error: 'Attempt not found' });
    if (attempt.status === 'complete') return send(res, 409, { ok: false, error: 'Attempt already complete' });
    if (body.node_id && body.node_id !== attempt.current_node_id) return send(res, 400, { ok: false, error: 'Node mismatch' });
    const node = materializeNode(attempt.current_node_id, attempt.variant?.id);
    const evidence = (node?.evidence || []).find(item => item.id === body.evidence_id);
    if (!evidence) return send(res, 400, { ok: false, error: 'Evidence not valid' });
    attempt.evidence_inspections ||= [];
    if (!attempt.evidence_inspections.find(item => item.node_id === node.id && item.evidence_id === evidence.id)) attempt.evidence_inspections.push({ at: new Date().toISOString(), node_id: node.id, scene: node.scene, evidence_id: evidence.id, label: evidence.label, type: evidence.type, basis: evidence.basis });
    persistAttempts();
    return send(res, 200, { ok: true, build: localForgeBuild, attempt, evidence, inspected: true });
  }

  if (req.method === 'POST' && /^\/api\/attempts\/[^/]+\/choice$/.test(routePath)) {
    const attemptId = routePath.split('/')[3];
    const body = await readRequestBody(req, res);
    if (body === null) return;
    const attempt = memoryAttempts.find(item => item.attempt_id === attemptId);
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
    persistAttempts();
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
