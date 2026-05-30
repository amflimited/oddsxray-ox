#!/usr/bin/env bash
set -e
BUILD="FORGE-003A"
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
{"name":"oddsxray-forge","version":"0.0.3","type":"module","scripts":{"start":"node server.js"}}
JSON
cat > server.js <<'JS'
import http from "node:http";
import fs from "node:fs";
import crypto from "node:crypto";
const PORT=process.env.PORT||3001, BUILD="FORGE-003A", ATT="./data/attempts.json";
const baseScenarios=[
[1,"s01-oracle-not-your-eyes","The Oracle Is Not Your Eyes","You believed the screen. The resolver was telling a different story.","resolver_skip"],
[2,"s02-green-number-trap","The Green Number Trap","A green number is not an exit plan.","cashout_greed"],
[3,"s03-headline-poison","Headline Poison","Being right about the news is not the same as being right about the contract.","headline_chaser"],
[4,"s04-liquidity-mirage","The Liquidity Mirage","A price you cannot exit is decoration.","liquidity_illusion"],
[5,"s05-whale-shadow","The Whale Shadow","Copying size without knowing motive is surrender.","whale_fader"],
[6,"s06-clock-kill","The Clock Kill","Time can beat your thesis before facts do.","clock_sloppy"],
[7,"s07-definition-knife","The Definition Knife","The fine print is the blade.","definition_skipper"],
[8,"s08-averaging-down","The Second Bullet","More conviction is not a repair kit.","revenge_size"],
[9,"s09-crowd-heat","The Crowd Gets Loud","Noise feels safer right before it gets expensive.","crowd_bias"],
[10,"s10-perfect-story-wrong-market","Perfect Story, Wrong Market","The story can be perfect and the trade can still be wrong.","market_mismatch"]
];
const stages=[
[1,"intake","What do you look at first?",["Read the contract/resolution source before touching price","Check the chart first, then maybe read rules","Trust the headline because it explains the move","Jump in before the price gets away"]],
[2,"definition","What has to happen for this to pay?",["Identify the exact payout trigger and failure condition","Summarize the event in your own words","Assume common-sense meaning controls it","Ignore definition because everyone knows what it means"]],
[3,"source","What evidence do you trust?",["Use primary source/resolver-aligned evidence","Compare a few sources but weight them equally","Use social posts from people already in the trade","Use the loudest screenshot in the feed"]],
[4,"price","What does the price mean?",["Treat price as market opinion, not proof","Use price as one input after definition/source","Assume high price means smart money already knows","Chase because movement confirms your feeling"]],
[5,"entry","Do you enter?",["Pass unless edge, exit, and size are defined","Enter small with a written invalidation point","Enter because upside looks obvious","Enter larger to make the lesson worth it"]],
[6,"exit","The position moves green. What now?",["Execute the exit rule or reduce risk","Take stake out but keep emotional upside","Wait one more tick because it feels close","Move the exit because the story still feels true"]],
[7,"pressure","Bad information hits your position. What changes?",["Re-check the kill condition and cut if triggered","Wait for confirmation while reducing exposure","Explain it away as temporary fear","Add because the market is overreacting"]],
[8,"close","Final window. What do you do?",["Close according to the rule even if it hurts","Trim and accept an imperfect result","Hold for the heroic reversal","Double down to fix the whole path"]]
];
function makeScenario(row){const [n,id,title,scar,tag]=row;const nodes=[];for(const st of stages){const [i,stage,q,labels]=st;const next=i<8?`n${i+1}`:"result";nodes.push({id:i===1?"start":`n${i}`,stage_number:i,stage,prompt:`${title}: ${q}`,pressure:`Scenario ${n}. The market gives you incomplete information, emotional pressure, and a chance to confuse story with payout mechanics.`,choices:[
{id:`r${i}`,label:labels[0],next,grade:"READ",score:2,tags:["disciplined_read",stage],diagnostic:"You slowed the trade down and checked the mechanism before emotion."},
{id:`p${i}`,label:labels[1],next,grade:"PARTIAL",score:1,tags:["partial_read",stage],diagnostic:"You saw part of the board, but left a hole big enough for the market to exploit."},
{id:`t${i}`,label:labels[2],next,grade:"TRAP",score:-2,tags:[tag,"shortcut_"+stage],diagnostic:"You substituted a convenient signal for the actual payout mechanism."},
{id:`b${i}`,label:labels[3],next,grade:"BURN",score:-3,tags:[tag,"impulse_"+stage],diagnostic:"You acted before the trade had earned the right to exist."}
]});}nodes.push({id:"result",terminal:true,result:`${title} is complete. Your path shows whether you traded the contract or traded the feeling around it.`,scar});return {id,legacy_id:id.replace(/^s\d+-/,""),module:"second-stake",scenario_number:n,title,source_title:title,scar,status:"active",primary_kill_stage:tag,secondary_stage:"process_control",max_score:16,min_score:-24,nodes};}
function catalog(){return {schema:"oddsxray.second_stake.catalog.v1",build:BUILD,module:"second-stake",scenario_count:scenarios().length,scenarios:scenarios()};}
function scenarios(){return baseScenarios.map(makeScenario)}
function readJson(p,f){try{return JSON.parse(fs.readFileSync(p,"utf8"))}catch{return f}}
function writeJson(p,v){fs.writeFileSync(p,JSON.stringify(v,null,2))}
function attempts(){return readJson(ATT,[])}
function id(pre){return `${pre}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`}
function now(){return new Date().toISOString()}
function findScenario(sid){return scenarios().find(s=>s.id===sid||s.legacy_id===sid)}
function send(res,code,body){res.writeHead(code,{"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type"});res.end(JSON.stringify(body,null,2))}
function body(req){return new Promise(r=>{let d="";req.on("data",c=>d+=c);req.on("end",()=>{try{r(d?JSON.parse(d):{})}catch{r({})}})})}
function summarize(a){return {attempt_id:a.attempt_id,scenario_id:a.scenario_id,scenario_title:a.scenario_title,status:a.status,started_at:a.started_at,completed_at:a.completed_at,score_total:a.score_total,max_score:a.max_score,score_pct:a.score_pct,scar_unlocked:a.scar_unlocked,choices_count:a.choices.length,top_mistakes:a.top_mistakes||[],strengths:a.strengths||[]}}
function classify(a,s){const tagCounts={};const strengths=[];const weak=[];for(const c of a.choices){for(const t of c.tags||[])tagCounts[t]=(tagCounts[t]||0)+1;if(c.grade==="READ")strengths.push(c.stage);if(c.grade==="TRAP"||c.grade==="BURN")weak.push(c.stage)}const top=Object.entries(tagCounts).sort((x,y)=>y[1]-x[1]).slice(0,6).map(([tag,count])=>({tag,count}));const pct=Math.round(((a.score_total||0)/(s.max_score||16))*100);let profile="cooked",result="The market did not need to beat your prediction. It only needed to exploit your process.",diagnosis="You traded story, confidence, price, or emotion before identifying what actually controls payout.";if(pct>=75){profile="disciplined_reader";result="You won by refusing to trade until the payout mechanism was visible.";diagnosis="Strong process. You checked the controlling factor before size, exit, or emotion."}else if(pct>=35){profile="mixed_reader";result="You saw several traps, but the market still found open doors.";diagnosis="Partial reads are still expensive. The weak stages show where your next loss forms."}else if(pct>=0){profile="survived_by_luck";result="You occasionally did the right thing, but not often enough to trust the outcome.";diagnosis="This path can look fine when the market is gentle. Under pressure, shortcuts become losses."}return {profile,result,diagnosis,scar:s.scar,score_total:a.score_total,min_score:s.min_score,max_score:s.max_score,score_pct:pct,top_mistakes:top,strengths:[...new Set(strengths)],weak_stages:[...new Set(weak)],tag_counts:tagCounts}}
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,`http://${req.headers.host}`);if(req.method==="OPTIONS")return send(res,204,{});if(url.pathname==="/health")return send(res,200,{ok:true,app:"Odds X-Ray",layer:"The Forge",build:BUILD,status:"online",scenarios:scenarios().length});if(url.pathname==="/api/catalog")return send(res,200,{ok:true,build:BUILD,catalog:{schema:catalog().schema,module:"second-stake"},scenario_count:scenarios().length});if(url.pathname==="/api/scenarios")return send(res,200,{ok:true,build:BUILD,scenarios:scenarios().map(s=>({id:s.id,legacy_id:s.legacy_id,module:s.module,scenario_number:s.scenario_number,title:s.title,scar:s.scar,status:s.status,primary_kill_stage:s.primary_kill_stage,secondary_stage:s.secondary_stage,max_score:s.max_score}))});if(req.method==="GET"&&url.pathname.startsWith("/api/scenarios/")){const s=findScenario(decodeURIComponent(url.pathname.split("/").pop()));return s?send(res,200,{ok:true,build:BUILD,scenario:s}):send(res,404,{ok:false,error:"Scenario not found",build:BUILD})}if(req.method==="POST"&&url.pathname==="/api/attempts"){const b=await body(req);const s=findScenario(b.scenario_id||"s01-oracle-not-your-eyes");if(!s)return send(res,404,{ok:false,error:"Scenario not found",scenario_id:b.scenario_id});const node=s.nodes[0];const a={attempt_id:id("att"),scenario_id:s.id,scenario_title:s.title,module:s.module,status:"in_progress",started_at:now(),completed_at:null,current_node_id:node.id,choices:[],score_total:0,max_score:s.max_score,min_score:s.min_score,score_pct:0,outcome:null,scar_unlocked:null,top_mistakes:[],strengths:[]};const all=attempts();all.unshift(a);writeJson(ATT,all);return send(res,201,{ok:true,build:BUILD,attempt:a,node,scenario_summary:{id:s.id,title:s.title,scar:s.scar,scenario_number:s.scenario_number,primary_kill_stage:s.primary_kill_stage}})}if(req.method==="POST"&&url.pathname.match(/^\/api\/attempts\/[^/]+\/choice$/)){const b=await body(req),attemptId=url.pathname.split("/")[3],all=attempts(),a=all.find(x=>x.attempt_id===attemptId);if(!a)return send(res,404,{ok:false,error:"Attempt not found"});if(a.status==="complete")return send(res,409,{ok:false,error:"Attempt already complete",attempt:a});const s=findScenario(a.scenario_id),map=Object.fromEntries(s.nodes.map(n=>[n.id,n])),node=map[b.node_id||a.current_node_id],ch=(node.choices||[]).find(c=>c.id===b.choice_id);if(!ch)return send(res,400,{ok:false,error:"Choice not valid"});a.choices.push({at:now(),node_id:node.id,stage:node.stage,choice_id:ch.id,label:ch.label,next_node_id:ch.next,grade:ch.grade,score:ch.score,tags:ch.tags,diagnostic:ch.diagnostic});a.score_total+=ch.score;a.current_node_id=ch.next;let next=map[ch.next];if(ch.next==="result"||!next){const out=classify(a,s);a.status="complete";a.completed_at=now();a.outcome=out;a.scar_unlocked=out.scar;a.score_pct=out.score_pct;a.top_mistakes=out.top_mistakes;a.strengths=out.strengths;next={id:"result",terminal:true,result:out.result,diagnosis:out.diagnosis,scar:out.scar,outcome:out}}writeJson(ATT,all);return send(res,200,{ok:true,build:BUILD,attempt:a,node:next,complete:a.status==="complete",scar_unlocked:a.scar_unlocked})}if(url.pathname==="/api/attempts")return send(res,200,{ok:true,build:BUILD,attempts:attempts().map(summarize).slice(0,80)});if(url.pathname.match(/^\/api\/attempts\/[^/]+$/)){const a=attempts().find(x=>x.attempt_id===url.pathname.split("/").pop());return a?send(res,200,{ok:true,build:BUILD,attempt:a}):send(res,404,{ok:false,error:"Attempt not found"})}if(url.pathname==="/api/progress"){const all=attempts(),done=all.filter(a=>a.status==="complete"),tags={};for(const a of done)for(const m of a.top_mistakes||[])tags[m.tag]=(tags[m.tag]||0)+m.count;return send(res,200,{ok:true,build:BUILD,progress:{total_attempts:all.length,completed_attempts:done.length,scars_unlocked:new Set(done.map(a=>a.scar_unlocked).filter(Boolean)).size,recurring_mistakes:Object.entries(tags).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([tag,count])=>({tag,count}))}})}return send(res,404,{ok:false,error:"Route not found",build:BUILD})});
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
echo "FORGE-003A installed: ten Second Stake choicebook scenarios + decision analytics."
curl -s http://127.0.0.1:3001/health
