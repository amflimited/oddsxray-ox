#!/usr/bin/env bash
set -e
BUILD="FORGE-004A"
APP_DIR="/opt/oddsxray-forge"
export DEBIAN_FRONTEND=noninteractive
mkdir -p "$APP_DIR/data" /var/log/oddsxray-forge
cd "$APP_DIR"
if ! command -v node >/dev/null 2>&1 || ! command -v nginx >/dev/null 2>&1; then
  apt update
  apt install -y nodejs npm curl nginx
fi
if [ ! -f data/attempts.json ]; then echo '[]' > data/attempts.json; fi
cp data/attempts.json data/attempts.backup.$(date +%Y%m%d%H%M%S).json 2>/dev/null || true
cat > package.json <<'JSON'
{"name":"oddsxray-forge","version":"0.0.4","type":"module","scripts":{"start":"node server.js"}}
JSON
cat > server.js <<'JS'
import http from "node:http";
import fs from "node:fs";
import crypto from "node:crypto";

const PORT = process.env.PORT || 3001;
const BUILD = "FORGE-004A";
const ATTEMPT_PATH = "./data/attempts.json";

const lockedScenarios = [
  [2,"s02-headline-poison","Headline Poison","A story can be true and still not pay the contract."],
  [3,"s03-liquidity-mirage","The Liquidity Mirage","A price you cannot exit is decoration."],
  [4,"s04-whale-shadow","The Whale Shadow","Copying size without motive is surrender."],
  [5,"s05-clock-kill","The Clock Kill","Time can beat your thesis before facts do."],
  [6,"s06-definition-knife","The Definition Knife","The fine print is the blade."],
  [7,"s07-second-bullet","The Second Bullet","Averaging down can turn a mistake into a plan."],
  [8,"s08-crowd-heat","The Crowd Gets Loud","Noise feels safer right before it gets expensive."],
  [9,"s09-perfect-story-wrong-market","Perfect Story, Wrong Market","Correct story, wrong contract, same zero."],
  [10,"s10-final-table","The Final Table","The market does not care that you learned late."]
];

const scenarioOne = {
  id: "s01-the-180-window",
  legacy_id: "green-number-trap",
  module: "second-stake",
  scenario_number: 1,
  title: "The $180 Window",
  subtitle: "A first-loss case file about the cash-out door that does not stay open.",
  status: "active",
  format: "casefile_choice_game",
  scar: "The cash-out number is a door, not a promise.",
  primary_kill_stage: "cashout_hesitation",
  max_score: 18,
  min_score: -24,
  nodes: [
    {
      id: "start",
      scene: "Case Open",
      prompt: "You put $100 into a market ten minutes ago. You did not read the full rules. You only knew the headline sounded obvious. The position is now flashing green. A cash-out estimate flickers between $164 and $171 while the price candle is still moving. Your thumb is already hovering near the trade button.",
      choices: [
        { id: "open_rules", label: "Open the buried Rules / Resolution tab before touching anything", next: "rules_tab", score: 3, tags: ["rules_first","slowed_down"], effects: { set: { contract_read: true } }, diagnostic: "You interrupted the impulse and looked for the thing that decides payout." },
        { id: "slam_buy", label: "Buy more before the move gets away", next: "buy_blind", score: -4, tags: ["chased_green","no_exit_rule","size_impulse"], effects: { add: { position: 100, panic: 2 }, set: { entry_blind: true } }, diagnostic: "You treated movement as permission to add risk." },
        { id: "check_chart", label: "Open the price chart and stare at the green candle", next: "chart_room", score: -1, tags: ["price_as_truth"], effects: { add: { chart_fixation: 1 } }, diagnostic: "You looked at the crowd vote before checking what the vote was actually about." },
        { id: "open_thread", label: "Open the comment thread everyone is quoting", next: "social_thread", score: -2, tags: ["social_evidence","headline_chaser"], effects: { add: { noise: 2 } }, diagnostic: "You let other traders become the resolver." }
      ]
    },
    {
      id: "rules_tab",
      scene: "The Fine Print",
      prompt: "The rules are not long, but they are annoying. The contract pays only if the official source posts a qualifying update before a specific cutoff. Social screenshots do not count. Cash-out is discretionary and may vanish during volatility. You now understand why the green number feels more solid than it really is.",
      choices: [
        { id: "write_exit", label: "Write a hard exit rule: cash out at $180 or cut if official source contradicts", next: "rule_written", score: 4, tags: ["exit_rule_defined","contract_read"], effects: { set: { exit_rule: true, contract_read: true } }, diagnostic: "You turned vague hope into an operating rule." },
        { id: "check_resolver", label: "Open the official source named in the rules", next: "resolver_source", score: 3, tags: ["resolver_checked","primary_source"], effects: { set: { resolver_checked: true, contract_read: true } }, diagnostic: "You moved from narrative to controlling evidence." },
        { id: "buy_small", label: "Buy a small amount anyway, but cap the damage", next: "small_entry", score: 1, tags: ["small_size","partial_read"], effects: { add: { position: 40 }, set: { contract_read: true } }, diagnostic: "You reduced damage, but still entered before the whole case was clear." },
        { id: "dismiss_rules", label: "Dismiss the wording as legal clutter and buy the obvious story", next: "buy_overconfident", score: -3, tags: ["definition_skipper","story_over_contract"], effects: { add: { position: 100, confidence: 2 }, set: { contract_read: false } }, diagnostic: "You saw the warning and chose the more comfortable version." }
      ]
    },
    {
      id: "chart_room",
      scene: "The Green Candle",
      prompt: "The chart looks intoxicating. The price ran from 52¢ to 67¢ fast. The order book looks thin, but the top number is green and your brain keeps translating that into safety. You still do not know the exact payout trigger.",
      choices: [
        { id: "chase_chart", label: "Chase the candle with the rest of the $100", next: "buy_blind", score: -4, tags: ["chased_green","price_as_truth"], effects: { add: { position: 100, panic: 1 }, set: { entry_blind: true } }, diagnostic: "You confused a moving price with a completed read." },
        { id: "chart_to_rules", label: "Leave the chart and read the rules", next: "rules_tab", score: 2, tags: ["recovered_attention"], effects: { add: { discipline: 1 } }, diagnostic: "You caught yourself before the chart became the whole case." },
        { id: "wait_pullback", label: "Wait for a pullback instead of buying the spike", next: "waiting_room", score: 1, tags: ["waited","reduced_impulse"], effects: { add: { patience: 1 } }, diagnostic: "Waiting helped, but waiting without a reason is still not a plan." },
        { id: "inspect_spread", label: "Inspect the spread and ask whether you can actually exit", next: "liquidity_check", score: 3, tags: ["liquidity_checked"], effects: { set: { liquidity_checked: true } }, diagnostic: "You checked whether the number on screen could become money." }
      ]
    },
    {
      id: "social_thread",
      scene: "The Noise Pit",
      prompt: "The thread is full of screenshots. One account says insiders know the answer. Another says the contract wording is being misread. Nobody links the official source. The price ticks up again while you read.",
      choices: [
        { id: "copy_thread", label: "Copy the loudest account and buy before the crowd notices", next: "buy_overconfident", score: -4, tags: ["social_evidence","crowd_bias","no_primary_source"], effects: { add: { position: 100, noise: 3 } }, diagnostic: "You outsourced the read to someone with unknown incentives." },
        { id: "ask_original", label: "Ignore the thread and find the original source", next: "resolver_source", score: 3, tags: ["primary_source","noise_rejected"], effects: { set: { resolver_checked: true } }, diagnostic: "You stopped treating reposts as evidence." },
        { id: "keep_scrolling", label: "Keep scrolling until it feels clearer", next: "rumor_spiral", score: -2, tags: ["analysis_by_feed","delay_without_rule"], effects: { add: { noise: 2, time_lost: 1 } }, diagnostic: "You used more content as a substitute for a decision rule." },
        { id: "step_back", label: "Put the phone down for two minutes and let the candle finish", next: "waiting_room", score: 1, tags: ["emotional_pause"], effects: { add: { discipline: 1, time_lost: 1 } }, diagnostic: "The pause helped, but the case still needs a read." }
      ]
    },
    {
      id: "resolver_source",
      scene: "The Actual Source",
      prompt: "The official source has not confirmed the headline yet. A scheduled update is expected soon, but the current text is ambiguous. The market is pricing as if the update already happened. You can feel the gap between 'probably' and 'paid'.",
      choices: [
        { id: "tiny_with_rule", label: "Enter tiny only, with a written cash-out and kill rule", next: "controlled_entry", score: 3, tags: ["small_size","exit_rule_defined","resolver_checked"], effects: { add: { position: 25 }, set: { exit_rule: true, resolver_checked: true } }, diagnostic: "You allowed uncertainty, but limited what uncertainty could cost." },
        { id: "wait_official", label: "Wait for the scheduled official update", next: "official_wait", score: 4, tags: ["waited_for_source","disciplined_pass"], effects: { set: { resolver_checked: true, waited_for_source: true } }, diagnostic: "You refused to pay for confirmation that had not arrived." },
        { id: "basically_confirms", label: "Treat the ambiguity as basically confirmed and buy", next: "buy_overconfident", score: -3, tags: ["assumption_gap","story_over_contract"], effects: { add: { position: 100, confidence: 2 }, set: { resolver_checked: true } }, diagnostic: "You filled the gap with the answer you wanted." },
        { id: "no_trade", label: "Make no trade because the payout trigger is not confirmed", next: "ending_pass", score: 5, tags: ["disciplined_pass","no_trade_is_trade"], effects: { set: { passed: true } }, diagnostic: "You treated passing as an active decision." }
      ]
    },
    {
      id: "rule_written",
      scene: "The Plan Before the Heat",
      prompt: "Your plan is written: if cash-out reaches $180, take it. If the official source contradicts the thesis, cut. If liquidity thins, reduce in chunks. The market keeps moving while you decide whether the trade deserves any size at all.",
      choices: [
        { id: "enter_planned", label: "Enter with controlled size and the rule visible", next: "controlled_entry", score: 3, tags: ["planned_entry","size_control"], effects: { add: { position: 50 }, set: { exit_rule: true } }, diagnostic: "You entered with the trade already bounded." },
        { id: "skip_after_plan", label: "Skip the trade because the plan shows the edge is thin", next: "ending_pass", score: 5, tags: ["disciplined_pass","edge_filter"], effects: { set: { passed: true } }, diagnostic: "The plan did its job by stopping a weak trade." },
        { id: "plan_then_ignore", label: "Keep the plan in your head and buy full size anyway", next: "buy_overconfident", score: -2, tags: ["plan_theater","oversize"], effects: { add: { position: 100, confidence: 1 }, set: { exit_rule: true } }, diagnostic: "A rule you immediately override is decoration." },
        { id: "check_liquidity_first", label: "Check whether the exit size can actually fill", next: "liquidity_check", score: 3, tags: ["liquidity_checked","exit_quality"], effects: { set: { liquidity_checked: true, exit_rule: true } }, diagnostic: "You connected the plan to the market mechanics." }
      ]
    },
    {
      id: "buy_blind",
      scene: "Blind Entry",
      prompt: "You add size before understanding the contract. The screen rewards you immediately. Cash-out jumps to $180 for a few seconds. This is exactly the moment that made you believe you had it figured out last time.",
      choices: [
        { id: "take_180_blind", label: "Take the $180 cash-out now, no speech, no negotiation", next: "ending_window_taken", score: 4, tags: ["cashout_taken","lucky_but_saved"], effects: { set: { cashed_out: true } }, diagnostic: "You were late on process but early enough on exit." },
        { id: "pull_stake_blind", label: "Pull your original stake and leave only house money", next: "ending_stake_saved", score: 2, tags: ["stake_protected","partial_exit"], effects: { set: { stake_removed: true } }, diagnostic: "You reduced the blast radius before pride took over." },
        { id: "wait_200", label: "Wait for $200 because $180 proves you were right", next: "cashout_slips", score: -4, tags: ["cashout_hesitation","greed_delay"], effects: { add: { time_lost: 1, panic: 1 } }, diagnostic: "You turned an exit into evidence for holding." },
        { id: "add_green", label: "Add more because the green number feels like confirmation", next: "add_on_green", score: -5, tags: ["revenge_size","green_confirmation","oversize"], effects: { add: { position: 150, panic: 2 } }, diagnostic: "You made the reward signal larger than the risk control." }
      ]
    },
    {
      id: "buy_overconfident",
      scene: "The Story Trade",
      prompt: "You enter full size on the story. The trade goes green fast. Cash-out flashes $176, then $183, then $179. Nothing has officially resolved. The market is giving you a door, but not a guarantee that the door stays open.",
      choices: [
        { id: "take_180_story", label: "Hit cash-out while it is still there", next: "ending_window_taken", score: 4, tags: ["cashout_taken","story_interrupted"], effects: { set: { cashed_out: true } }, diagnostic: "You broke the spell before it became a loss." },
        { id: "read_late", label: "Read the rules now before deciding", next: "late_rules", score: 0, tags: ["late_read","damage_control"], effects: { set: { contract_read: true }, add: { time_lost: 1 } }, diagnostic: "Late reading is better than no reading, but the position is already exposed." },
        { id: "screenshot", label: "Take a screenshot of the green number and wait", next: "cashout_slips", score: -4, tags: ["screenshot_profit","cashout_hesitation"], effects: { add: { time_lost: 1, pride: 1 } }, diagnostic: "You preserved the feeling instead of the money." },
        { id: "double_story", label: "Double down because the story is obviously right", next: "add_on_green", score: -5, tags: ["oversize","story_over_contract"], effects: { add: { position: 200, panic: 3 } }, diagnostic: "You treated confidence as collateral." }
      ]
    },
    {
      id: "small_entry",
      scene: "Small Fire",
      prompt: "You enter small. The position turns green, but not life-changing green. Cash-out shows $62 on your $40. It is less exciting, which is exactly why it is easier to think clearly.",
      choices: [
        { id: "take_small", label: "Take the small win and close the case", next: "ending_small_clean", score: 4, tags: ["cashout_taken","size_control"], effects: { set: { cashed_out: true } }, diagnostic: "You let a small edge stay small." },
        { id: "scale_small", label: "Scale up now that the small trade is green", next: "add_on_green", score: -3, tags: ["green_confirmation","size_creep"], effects: { add: { position: 120, panic: 1 } }, diagnostic: "You used small-size success as permission to abandon small size." },
        { id: "check_source_small", label: "Check the official source before touching the cash-out", next: "resolver_source", score: 2, tags: ["resolver_checked","process_return"], effects: { set: { resolver_checked: true } }, diagnostic: "You went back to the thing that controls payout." },
        { id: "wait_small", label: "Wait for it to get interesting", next: "cashout_slips", score: -2, tags: ["boredom_risk","cashout_hesitation"], effects: { add: { time_lost: 1 } }, diagnostic: "You let boredom push the trade into danger." }
      ]
    },
    {
      id: "controlled_entry",
      scene: "Controlled Exposure",
      prompt: "You are in, but the position is bounded. Cash-out reaches a modest gain. The official update is still pending. Because your size is controlled, this is now a decision instead of an emergency.",
      choices: [
        { id: "execute_rule", label: "Execute the written exit rule", next: "ending_process_win", score: 5, tags: ["rule_executed","process_win"], effects: { set: { cashed_out: true } }, diagnostic: "You did what you said before the heat arrived." },
        { id: "trim_wait", label: "Trim most of it and wait for the source with tiny exposure", next: "official_pressure", score: 3, tags: ["trimmed","risk_reduced"], effects: { add: { position: -35 }, set: { trimmed: true } }, diagnostic: "You paid yourself for uncertainty and kept only controlled exposure." },
        { id: "ignore_rule", label: "Ignore your own rule because the move feels strong", next: "cashout_slips", score: -3, tags: ["rule_broken","cashout_hesitation"], effects: { add: { time_lost: 1, pride: 1 } }, diagnostic: "You built a plan and then asked emotion for permission to break it." },
        { id: "scale_controlled", label: "Scale up because controlled entry worked", next: "add_on_green", score: -3, tags: ["size_creep","green_confirmation"], effects: { add: { position: 125 } }, diagnostic: "Good process became bait for bad size." }
      ]
    },
    {
      id: "liquidity_check",
      scene: "The Exit Is Smaller Than the Number",
      prompt: "The spread is wider than the green headline suggests. You can exit small chunks near the displayed price, but a full exit would slip. The market is not as liquid as the cash-out estimate made it feel.",
      choices: [
        { id: "sell_chunks", label: "Sell in chunks and accept an imperfect but real exit", next: "ending_chunk_exit", score: 4, tags: ["liquidity_respected","imperfect_exit"], effects: { set: { exited_chunks: true } }, diagnostic: "You chose real money over the prettier quoted number." },
        { id: "market_sell", label: "Market-sell everything and accept the slippage", next: "ending_slippage", score: 2, tags: ["accepted_slippage","risk_removed"], effects: { set: { cashed_out: true } }, diagnostic: "The exit was ugly, but the risk left the screen." },
        { id: "hold_quote", label: "Hold because the displayed price is still high", next: "cashout_slips", score: -3, tags: ["liquidity_illusion","cashout_hesitation"], effects: { add: { time_lost: 1 } }, diagnostic: "You valued the quote more than the fill." },
        { id: "read_comments_liq", label: "Check comments to see if others are having trouble exiting", next: "rumor_spiral", score: -1, tags: ["delay_without_rule","social_evidence"], effects: { add: { noise: 1, time_lost: 1 } }, diagnostic: "You looked for consensus when the order book already answered." }
      ]
    },
    {
      id: "waiting_room",
      scene: "Waiting Without a Position",
      prompt: "You wait. The candle stops looking vertical. The cash-out screenshots in the thread keep getting larger, then less frequent. You still have not committed. That means you still have optionality.",
      choices: [
        { id: "use_wait_rules", label: "Use the waiting time to read the actual contract", next: "rules_tab", score: 3, tags: ["used_wait_well","rules_first"], effects: { set: { contract_read: true } }, diagnostic: "You converted delay into information." },
        { id: "fomo_after_wait", label: "Feel late and enter anyway", next: "buy_overconfident", score: -3, tags: ["fomo_entry","late_chase"], effects: { add: { position: 100, panic: 1 } }, diagnostic: "Waiting became pressure instead of protection." },
        { id: "check_source_wait", label: "Wait for the official source instead of the crowd", next: "official_wait", score: 4, tags: ["waited_for_source"], effects: { set: { waited_for_source: true } }, diagnostic: "You let the resolver speak first." },
        { id: "pass_wait", label: "Pass because the setup no longer has clean upside", next: "ending_pass", score: 5, tags: ["disciplined_pass"], effects: { set: { passed: true } }, diagnostic: "You refused to manufacture a trade out of impatience." }
      ]
    },
    {
      id: "official_wait",
      scene: "The Update Arrives",
      prompt: "The official source updates. It is not the clean confirmation the crowd expected. The market drops before most people in the thread understand why. Because you waited, your account balance does not move.",
      choices: [
        { id: "stay_out", label: "Stay out and mark the avoided loss", next: "ending_pass", score: 5, tags: ["avoided_loss","source_patience"], effects: { set: { passed: true } }, diagnostic: "The win was not needing to be rescued." },
        { id: "buy_dip", label: "Buy the dip because the crowd may recover", next: "stall_two", score: -4, tags: ["dip_chase","crowd_bias"], effects: { add: { position: 100, panic: 2 } }, diagnostic: "You waited correctly, then entered after the reason to wait proved dangerous." },
        { id: "study_post", label: "Read the contract against the update to understand the miss", next: "ending_study", score: 4, tags: ["postmortem_before_trade","learning_loop"], effects: { set: { studied: true } }, diagnostic: "You turned the avoided trade into a lesson." },
        { id: "thread_reassure", label: "Look for someone saying the update is being misread", next: "rumor_spiral", score: -2, tags: ["social_reassurance","second_guessing"], effects: { add: { noise: 2 } }, diagnostic: "You went looking for permission to ignore the source." }
      ]
    },
    {
      id: "cashout_slips",
      scene: "The Door Gets Smaller",
      prompt: "The $180 window is gone. The cash-out estimate shows $146, then $132. You still have profit, but now it feels insulting to accept less than the number you already saw. This is the trap: you are negotiating with a ghost price.",
      choices: [
        { id: "take_146", label: "Take the reduced cash-out and stop negotiating with the ghost", next: "ending_reduced_win", score: 2, tags: ["damage_control","cashout_taken_late"], effects: { set: { cashed_out: true } }, diagnostic: "Late discipline still saved the account." },
        { id: "read_late_slip", label: "Read the rules now to decide if this is still alive", next: "late_rules", score: 0, tags: ["late_read","damage_control"], effects: { set: { contract_read: true }, add: { time_lost: 1 } }, diagnostic: "You finally checked the mechanism after the window shrank." },
        { id: "hold_bounce", label: "Hold for the bounce back to $180", next: "stall_two", score: -4, tags: ["anchored_to_high","cashout_hesitation"], effects: { add: { time_lost: 1, panic: 2 } }, diagnostic: "You anchored to a number the market no longer offered." },
        { id: "add_to_reclaim", label: "Add more so the next bounce fixes the missed exit", next: "revenge_add", score: -5, tags: ["revenge_size","anchored_to_high"], effects: { add: { position: 150, panic: 3 } }, diagnostic: "You tried to repair regret with more risk." }
      ]
    },
    {
      id: "late_rules",
      scene: "The Blade Was in the Definition",
      prompt: "Now you see it. The contract is not about the broad headline. It is about a narrow qualifying update before the cutoff. The crowd was trading the vibe. The market is starting to understand the distinction.",
      choices: [
        { id: "cut_after_late", label: "Cut immediately even though the lesson is embarrassing", next: "ending_late_cut", score: 2, tags: ["late_cut","definition_learned"], effects: { set: { cut: true } }, diagnostic: "You accepted embarrassment before it became a full loss." },
        { id: "hope_definition", label: "Hold because the broad story is still basically right", next: "stall_two", score: -4, tags: ["story_over_contract","definition_skipper"], effects: { add: { panic: 2 } }, diagnostic: "You chose the headline after learning the contract did not pay the headline." },
        { id: "look_for_out", label: "Check liquidity for any exit that still fills", next: "liquidity_check", score: 2, tags: ["exit_search","damage_control"], effects: { set: { liquidity_checked: true } }, diagnostic: "You stopped debating and looked for an executable exit." },
        { id: "ask_thread_late", label: "Ask the thread whether the wording matters", next: "rumor_spiral", score: -3, tags: ["social_reassurance","definition_avoidance"], effects: { add: { noise: 2, time_lost: 1 } }, diagnostic: "You asked the crowd to overrule the rules." }
      ]
    },
    {
      id: "add_on_green",
      scene: "The Position Gets Heavy",
      prompt: "Your position is now too large for the original idea. The cash-out estimate briefly looks huge, then starts flickering. Every tick matters more because you made the trade bigger after it already rewarded you.",
      choices: [
        { id: "panic_take_big", label: "Take the ugly available exit before size traps you", next: "ending_slippage", score: 1, tags: ["risk_removed","oversize_recovered"], effects: { set: { cashed_out: true } }, diagnostic: "You paid tuition, but you left the classroom." },
        { id: "wait_big", label: "Wait because this has to become the big win now", next: "revenge_add", score: -5, tags: ["must_win","oversize","cashout_hesitation"], effects: { add: { panic: 3, time_lost: 1 } }, diagnostic: "You changed the goal from correct decision to emotional rescue." },
        { id: "find_liquidity_big", label: "Check whether a position this size can actually exit", next: "liquidity_check", score: 2, tags: ["liquidity_checked","oversize_awareness"], effects: { set: { liquidity_checked: true } }, diagnostic: "You finally asked whether the size could fit through the door." },
        { id: "celebrate_big", label: "Screenshot the big green number before selling", next: "cashout_slips", score: -4, tags: ["screenshot_profit","delay_without_rule"], effects: { add: { pride: 2, time_lost: 1 } }, diagnostic: "You chose proof of being right over the act of getting paid." }
      ]
    },
    {
      id: "rumor_spiral",
      scene: "Everyone Has a Version",
      prompt: "The thread splits into factions. One side says the market is wrong. One says the rules are clear. One posts an old screenshot as if it is new. None of this changes what the resolver will count, but it changes how lonely it feels to exit.",
      choices: [
        { id: "official_from_spiral", label: "Leave the thread and check the official source", next: "official_pressure", score: 2, tags: ["noise_rejected","primary_source"], effects: { set: { resolver_checked: true } }, diagnostic: "You escaped the social fog before it became your thesis." },
        { id: "favorite_account", label: "Trust the account that agrees with your position", next: "ending_zero", score: -5, tags: ["confirmation_bias","social_evidence"], effects: { add: { time_lost: 2, panic: 2 } }, diagnostic: "You selected the witness who made you feel least wrong." },
        { id: "cash_from_spiral", label: "Cash out whatever is still available", next: "ending_reduced_win", score: 1, tags: ["damage_control","late_exit"], effects: { set: { cashed_out: true } }, diagnostic: "You exited late, but you exited." },
        { id: "argue_thread", label: "Argue in the thread while the market moves", next: "stall_two", score: -4, tags: ["ego_delay","time_lost"], effects: { add: { time_lost: 2, pride: 1 } }, diagnostic: "You spent decision time trying to win socially." }
      ]
    },
    {
      id: "official_pressure",
      scene: "The Source Turns Cold",
      prompt: "The official source posts language that weakens the trade. The cash-out door is still open, but smaller. This is the point where a trader either accepts new information or starts defending the old self.",
      choices: [
        { id: "accept_new_info", label: "Accept the new information and exit", next: "ending_late_cut", score: 3, tags: ["new_info_accepted","cut_rule"], effects: { set: { cut: true } }, diagnostic: "You let the evidence outrank the version you wanted." },
        { id: "trim_new_info", label: "Trim down to token exposure and keep watching", next: "ending_stake_saved", score: 2, tags: ["risk_reduced","partial_exit"], effects: { set: { trimmed: true } }, diagnostic: "You reduced the damage zone instead of pretending nothing changed." },
        { id: "deny_new_info", label: "Decide the source is being misread and hold", next: "stall_two", score: -4, tags: ["new_info_denial","story_over_contract"], effects: { add: { panic: 2 } }, diagnostic: "You demoted the source once it stopped agreeing with you." },
        { id: "average_pressure", label: "Average down because everyone is scared", next: "revenge_add", score: -5, tags: ["revenge_size","falling_knife"], effects: { add: { position: 150, panic: 3 } }, diagnostic: "You called fear irrational before checking if it was informed." }
      ]
    },
    {
      id: "stall_two",
      scene: "The Bounce Never Quite Comes",
      prompt: "The estimate is now near break-even, sometimes below. You are no longer trying to make the best decision. You are trying to undo the feeling of missing the $180 window.",
      choices: [
        { id: "cut_breakeven", label: "Cut near breakeven and accept that the window closed", next: "ending_late_cut", score: 1, tags: ["late_cut","anchoring_broken"], effects: { set: { cut: true } }, diagnostic: "You stopped worshiping the missed high." },
        { id: "hold_to_zero", label: "Hold because selling now would make the mistake real", next: "ending_zero", score: -5, tags: ["loss_realization_avoidance","hold_to_zero"], effects: { add: { panic: 3 } }, diagnostic: "You let the need to avoid regret choose the ending." },
        { id: "double_breakeven", label: "Double so a small bounce fixes everything", next: "revenge_add", score: -5, tags: ["revenge_size","must_win"], effects: { add: { position: 200, panic: 4 } }, diagnostic: "You tried to make the market erase your previous decision." },
        { id: "source_then_cut", label: "Check the official source one last time and cut if it is not clean", next: "official_pressure", score: 1, tags: ["source_check_late","damage_control"], effects: { set: { resolver_checked: true } }, diagnostic: "Late process is still process, if you let it act." }
      ]
    },
    {
      id: "revenge_add",
      scene: "The Rescue Trade",
      prompt: "The trade is no longer about the contract. It is about getting back to the number you already saw. The position is bigger, the exit is thinner, and the next official update is minutes away.",
      choices: [
        { id: "emergency_exit", label: "Emergency exit everything, even with slippage", next: "ending_slippage", score: 0, tags: ["emergency_exit","oversize_recovered"], effects: { set: { cashed_out: true } }, diagnostic: "You stopped the rescue trade before it became a disaster." },
        { id: "pray_hold", label: "Hold and hope the update rescues the position", next: "ending_zero", score: -6, tags: ["hope_as_plan","hold_to_zero","oversize"], effects: { add: { panic: 5 } }, diagnostic: "Hope became the only remaining strategy." },
        { id: "third_bullet", label: "Add one more time because the price is cheaper now", next: "ending_burnout", score: -7, tags: ["third_bullet","revenge_size","falling_knife"], effects: { add: { position: 300, panic: 6 } }, diagnostic: "You converted one missed exit into a full behavioral failure." },
        { id: "rules_rescue", label: "Finally read the contract and accept whatever it says", next: "late_rules", score: -1, tags: ["very_late_read","damage_control"], effects: { set: { contract_read: true } }, diagnostic: "The read arrived after the size damage, but it can still stop the bleeding." }
      ]
    },
    { id: "ending_window_taken", terminal: true, result: "You took the $180 window while it existed. The trade may have started messy, but the exit was real. The important lesson is not that you were brilliant. It is that you stopped negotiating after the market offered you the door.", diagnosis: "Good exit behavior. Weakness depends on whether you read before entering. You protected yourself from the most common first-loss pattern: turning a temporary cash-out into a permanent fantasy.", scar: "The cash-out number is a door, not a promise.", profile: "Window Taker" },
    { id: "ending_stake_saved", terminal: true, result: "You protected the original stake and left only controlled upside. This is not as emotionally satisfying as the perfect exit, but it prevents the market from holding your whole throat.", diagnosis: "Partial exit behavior. You reduced risk before pride had enough time to rewrite the plan.", scar: "First protect the stake. Then decide what deserves to stay alive.", profile: "Stake Protector" },
    { id: "ending_small_clean", terminal: true, result: "You took the small win. It did not feel heroic, which is why it worked. The market never got a chance to turn your boredom into risk.", diagnosis: "Strong size control. You let a limited trade stay limited.", scar: "Small wins only stay clean if you let them stay small.", profile: "Clean Exit" },
    { id: "ending_process_win", terminal: true, result: "You followed the rule you wrote before the heat. That is the whole point. The trade did not need drama because the decision had already been made.", diagnosis: "Best process path. You separated planning from pressure and did not renegotiate under green-light hypnosis.", scar: "A rule only matters if it survives the moment it becomes useful.", profile: "Process Winner" },
    { id: "ending_chunk_exit", terminal: true, result: "You exited in chunks. The number was less pretty than the quote, but it became real. You chose executable money over screenshot money.", diagnosis: "Good liquidity awareness. You understood that displayed price and fillable exit are not the same object.", scar: "A price you cannot exit is decoration.", profile: "Liquidity Realist" },
    { id: "ending_slippage", terminal: true, result: "You paid slippage to get out. It felt bad, but it ended the danger. The exit was ugly because the previous decisions made it ugly.", diagnosis: "Mixed path. You made at least one dangerous choice, then recovered by removing exposure instead of defending it.", scar: "An ugly exit beats a clean zero.", profile: "Emergency Survivor" },
    { id: "ending_reduced_win", terminal: true, result: "You took the reduced cash-out after missing the best window. That is not failure. Failure would have been demanding the market reopen a door it already closed.", diagnosis: "Late but useful discipline. You broke the anchor to the high number before it became a full loss.", scar: "The ghost of the high is not money.", profile: "Late Saver" },
    { id: "ending_late_cut", terminal: true, result: "You cut after the read turned against you. It hurt because it forced the mistake into the open. That is still better than letting the mistake finish the account.", diagnosis: "Damage-control path. The process was late, but evidence eventually outranked ego.", scar: "Cutting late is expensive. Refusing to cut is how expensive becomes total.", profile: "Damage Controller" },
    { id: "ending_pass", terminal: true, result: "You made no trade. Nothing exploded. Nothing had to be rescued. The market moved without you, and that was the point: not every obvious-looking setup deserves your money.", diagnosis: "Strongest prevention path. You treated no-trade as an active decision instead of a missed opportunity.", scar: "The cleanest loss is the one you never enter.", profile: "Disciplined Pass" },
    { id: "ending_study", terminal: true, result: "You watched the trap close from outside the cage. Then you studied why. This is the boring path that makes the next live decision less expensive.", diagnosis: "Best learning path without exposure. You built recognition without paying tuition.", scar: "Watching the stove burn someone else still teaches heat.", profile: "Case Reader" },
    { id: "ending_zero", terminal: true, result: "The cash-out disappears. The update resolves against the crowd interpretation. The position goes to near-zero while the thread argues about why it should not have happened.", diagnosis: "Classic first-loss path. You saw a green number, refused the door, searched for reassurance, and let a missed exit become identity defense.", scar: "You did not lose because you were early. You lost because you would not leave.", profile: "Window Ghost" },
    { id: "ending_burnout", terminal: true, result: "The third bullet lands in the same hole as the first two. The contract does not care that the average price improved. It resolves against the position and the account takes the full lesson.", diagnosis: "Severe revenge-size path. You used additional risk to treat regret, then let the contract finish what the behavior started.", scar: "More size cannot repair a broken read.", profile: "Third Bullet" }
  ]
};

function scenarios(){ return [scenarioOne, ...lockedScenarios.map(([n,id,title,scar]) => ({ id, module:"second-stake", scenario_number:n, title, scar, status:"locked", format:"casefile_choice_game", nodes:[] }))]; }
function readJson(path,fallback){ try { return JSON.parse(fs.readFileSync(path,"utf8")); } catch { return fallback; } }
function writeJson(path,value){ fs.writeFileSync(path, JSON.stringify(value,null,2)); }
function attempts(){ return readJson(ATTEMPT_PATH, []); }
function now(){ return new Date().toISOString(); }
function makeId(prefix){ return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`; }
function findScenario(id){ return scenarios().find(s => s.id === id || s.legacy_id === id); }
function nodeMap(s){ return Object.fromEntries((s.nodes||[]).map(n => [n.id,n])); }
function send(res,status,body){ res.writeHead(status,{"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type"}); res.end(JSON.stringify(body,null,2)); }
function body(req){ return new Promise(resolve => { let data=""; req.on("data",c=>data+=c); req.on("end",()=>{ try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } }); }); }
function applyEffects(state, effects={}){ const next={...(state||{})}; for(const [k,v] of Object.entries(effects.set||{})) next[k]=v; for(const [k,v] of Object.entries(effects.add||{})) next[k]=(Number(next[k]||0)+Number(v)); return next; }
function summarizeAttempt(a){ return { attempt_id:a.attempt_id, scenario_id:a.scenario_id, scenario_title:a.scenario_title, status:a.status, started_at:a.started_at, completed_at:a.completed_at||null, choices_count:a.choices.length, score_total:a.score_total, scar_unlocked:a.scar_unlocked||null, profile:a.outcome?.profile||null, top_mistakes:a.top_mistakes||[], strengths:a.strengths||[] }; }
function autopsy(attempt, terminal){ const tags={}; const strengths=[]; const mistakes=[]; for(const c of attempt.choices){ for(const t of c.tags||[]) tags[t]=(tags[t]||0)+1; if((c.score||0)>1) strengths.push(c.label); if((c.score||0)<0) mistakes.push(c.label); } const top=Object.entries(tags).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([tag,count])=>({tag,count})); return { profile:terminal.profile||"Case Complete", result:terminal.result, diagnosis:terminal.diagnosis, scar:terminal.scar||scenarioOne.scar, score_total:attempt.score_total, top_mistakes:top.filter(x=>!["cashout_taken","disciplined_pass","process_win","rule_executed"].includes(x.tag)), strengths:strengths.slice(-5), weak_choices:mistakes.slice(-5), state:attempt.state||{} }; }

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==="OPTIONS") return send(res,204,{});
  if(url.pathname==="/health") return send(res,200,{ok:true,app:"Odds X-Ray",layer:"The Forge",build:BUILD,status:"online",active_scenario:scenarioOne.id,scenarios:scenarios().length,game_mode:"casefile_choice_game"});
  if(url.pathname==="/api/catalog") return send(res,200,{ok:true,build:BUILD,catalog:{module:"second-stake",active_scenario:scenarioOne.id,active_title:scenarioOne.title,doctrine:"game_not_quiz"},scenario_count:scenarios().length});
  if(url.pathname==="/api/scenarios") return send(res,200,{ok:true,build:BUILD,scenarios:scenarios().map(s=>({id:s.id,legacy_id:s.legacy_id||null,module:s.module,scenario_number:s.scenario_number,title:s.title,subtitle:s.subtitle||null,scar:s.scar,status:s.status,format:s.format,primary_kill_stage:s.primary_kill_stage||null}))});
  if(req.method==="GET" && url.pathname.startsWith("/api/scenarios/")){ const id=decodeURIComponent(url.pathname.split("/").pop()); const s=findScenario(id); if(!s) return send(res,404,{ok:false,error:"Scenario not found",build:BUILD}); if(s.status==="locked") return send(res,423,{ok:false,error:"Scenario locked; Scenario 01 is the current hand-authored build.",scenario:s,build:BUILD}); return send(res,200,{ok:true,build:BUILD,scenario:s}); }
  if(req.method==="POST" && url.pathname==="/api/attempts"){ const b=await body(req); const s=findScenario(b.scenario_id||scenarioOne.id); if(!s || s.status==="locked") return send(res,404,{ok:false,error:"Playable scenario not found",default_scenario:scenarioOne.id,build:BUILD}); const start=s.nodes.find(n=>n.id==="start"); const a={attempt_id:makeId("att"),scenario_id:s.id,scenario_title:s.title,module:s.module,status:"in_progress",started_at:now(),completed_at:null,current_node_id:start.id,state:{position:0,panic:0,noise:0,time_lost:0},choices:[],score_total:0,outcome:null,scar_unlocked:null,top_mistakes:[],strengths:[]}; const all=attempts(); all.unshift(a); writeJson(ATTEMPT_PATH,all); return send(res,201,{ok:true,build:BUILD,attempt:a,node:start,scenario_summary:{id:s.id,title:s.title,scar:s.scar,scenario_number:s.scenario_number,format:s.format}}); }
  if(req.method==="POST" && url.pathname.match(/^\/api\/attempts\/[^/]+\/choice$/)){ const b=await body(req); const attemptId=url.pathname.split("/")[3]; const all=attempts(); const a=all.find(x=>x.attempt_id===attemptId); if(!a) return send(res,404,{ok:false,error:"Attempt not found",build:BUILD}); if(a.status==="complete") return send(res,409,{ok:false,error:"Attempt already complete",attempt:a,build:BUILD}); const s=findScenario(a.scenario_id); const map=nodeMap(s); const node=map[b.node_id||a.current_node_id]; const choice=(node?.choices||[]).find(c=>c.id===b.choice_id); if(!choice) return send(res,400,{ok:false,error:"Choice not valid for current scene",current_node_id:a.current_node_id,build:BUILD}); a.state=applyEffects(a.state, choice.effects); a.choices.push({at:now(),node_id:node.id,scene:node.scene,choice_id:choice.id,label:choice.label,next_node_id:choice.next,score:choice.score||0,tags:choice.tags||[],diagnostic:choice.diagnostic||null,state_after:a.state}); a.score_total+=choice.score||0; a.current_node_id=choice.next; let next=map[choice.next]; if(!next) return send(res,500,{ok:false,error:"Next scene missing",next:choice.next,build:BUILD}); if(next.terminal){ const out=autopsy(a,next); a.status="complete"; a.completed_at=now(); a.outcome=out; a.scar_unlocked=out.scar; a.top_mistakes=out.top_mistakes; a.strengths=out.strengths; next={...next,outcome:out}; } writeJson(ATTEMPT_PATH,all); return send(res,200,{ok:true,build:BUILD,attempt:a,choice:a.choices[a.choices.length-1],node:next,complete:a.status==="complete",scar_unlocked:a.scar_unlocked}); }
  if(req.method==="GET" && url.pathname==="/api/attempts") return send(res,200,{ok:true,build:BUILD,attempts:attempts().map(summarizeAttempt).slice(0,80)});
  if(req.method==="GET" && url.pathname.match(/^\/api\/attempts\/[^/]+$/)){ const a=attempts().find(x=>x.attempt_id===url.pathname.split("/").pop()); return a?send(res,200,{ok:true,build:BUILD,attempt:a}):send(res,404,{ok:false,error:"Attempt not found",build:BUILD}); }
  if(req.method==="GET" && url.pathname==="/api/progress"){ const all=attempts(); const done=all.filter(a=>a.status==="complete"); const tags={}; for(const a of done) for(const m of a.top_mistakes||[]) tags[m.tag]=(tags[m.tag]||0)+m.count; return send(res,200,{ok:true,build:BUILD,progress:{total_attempts:all.length,completed_attempts:done.length,scars_unlocked:new Set(done.map(a=>a.scar_unlocked).filter(Boolean)).size,recurring_mistakes:Object.entries(tags).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([tag,count])=>({tag,count}))}}); }
  return send(res,404,{ok:false,error:"Route not found",build:BUILD});
});
server.listen(PORT,"127.0.0.1",()=>console.log(`The Forge ${BUILD} running on ${PORT}`));
JS
cat > /etc/systemd/system/oddsxray-forge.service <<'UNIT'
[Unit]
Description=Odds X-Ray Forge API
After=network.target
[Service]
WorkingDirectory=/opt/oddsxray-forge
ExecStart=/usr/bin/node /opt/oddsxray-forge/server.js
Restart=always
RestartSec=3
Environment=PORT=3001
[Install]
WantedBy=multi-user.target
UNIT
cat > /etc/nginx/sites-available/oddsxray-forge <<'NGINX'
server {
    listen 80;
    server_name forge.oddsxray.com 209.74.83.238;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/oddsxray-forge /etc/nginx/sites-enabled/oddsxray-forge
if [ -e /etc/nginx/sites-enabled/default ]; then mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.disabled 2>/dev/null || true; fi
nginx -t
systemctl daemon-reload
systemctl enable oddsxray-forge >/dev/null 2>&1 || true
systemctl restart oddsxray-forge
systemctl reload nginx
systemctl disable --now odx-forge-update.timer >/dev/null 2>&1 || true
echo "FORGE-004A installed: Scenario 01 is now The $180 Window, a case-file choice game instead of a quiz."
curl -s http://127.0.0.1:3001/health
