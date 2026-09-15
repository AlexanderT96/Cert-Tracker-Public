import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const files=['src/market-readiness.js','src/role-readiness-rank.js','src/job-market.js','src/market-dashboard-ui.js','tools/refresh-job-market.mjs'];
const errors=[];
for(const file of files){if(!fs.existsSync(file)){errors.push(`Missing ${file}`);continue;}try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});}catch(error){errors.push(`${file}: syntax check failed: ${error.stderr?.toString()||error.message}`);}}
const index=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8'),workflow=fs.readFileSync('.github/workflows/job-market-refresh.yml','utf8'),market=fs.readFileSync('src/market-readiness.js','utf8'),rank=fs.readFileSync('src/role-readiness-rank.js','utf8'),jobs=fs.readFileSync('src/job-market.js','utf8'),ui=fs.readFileSync('src/market-dashboard-ui.js','utf8'),refresh=fs.readFileSync('tools/refresh-job-market.mjs','utf8');
for(const f of ['src/market-readiness.js','src/role-readiness-rank.js','src/job-market.js','src/market-dashboard-ui.js'])if(!index.includes(f))errors.push(`index.html does not load ${f}`);
for(const f of ['src/market-readiness.js','src/role-readiness-rank.js','src/job-market.js','src/market-dashboard-ui.js','data/job-market.json'])if(!sw.includes(f))errors.push(`Service worker does not cache ${f}`);
for(const marker of ['currentValue()','activeAssessment(filterId=state.filter)','nextCertGaps','evidenceGaps','COMPARE EVIDENCE','NOT ASSESSED','BUILD NEXT','marketAccess','capability'])if(!market.includes(marker))errors.push(`Market readiness model missing ${marker}`);
for(const marker of ['R1','R2','R3','R4','R5','R6','rankForRole','minUsed','minDesigned','minOwned'])if(!rank.includes(marker))errors.push(`Role readiness model missing ${marker}`);
for(const marker of ['bestFit','liveBand','providerSearch','roleForJob','rankJobs','jobSeniority','seniorityFit','seniorityGap','TOO SENIOR'])if(!jobs.includes(marker))errors.push(`Job matching engine missing ${marker}`);
if(!jobs.includes('x.seniorityGap<=1'))errors.push('Live job list is not suppressing vacancies more than one seniority rank above current readiness.');
if(!jobs.includes('x.seniorityGap<=0'))errors.push('Best-fit job matching does not require current seniority readiness.');
for(const marker of ['CAREER EVIDENCE / ILLUSTRATIVE BANDS','ACTIVE ROLE / ILLUSTRATIVE BAND','ACTIVE ROLE FILTER','CURRENT PATHWAY STATE','NEXT CERTIFICATION GAPS','PRACTICAL EVIDENCE GAPS','RECENT MATCHING JOB SAMPLE','RECENT ACTIVE-ROLE JOB SAMPLE','IN PROGRESS','Indeed search','Reed search','Adzuna search'])if(!ui.includes(marker))errors.push(`Primary dashboard market surface missing ${marker}`);
if(!workflow.includes("cron: '7 * * * *'"))errors.push("Automated market refresh must use the quota-limited hourly schedule.");
for(const secret of ['secrets.ADZUNA_APP_ID','secrets.ADZUNA_APP_KEY'])if(!workflow.includes(secret))errors.push(`Workflow missing optional aggregator secret reference ${secret}`);
if(/ADZUNA_APP_(?:ID|KEY)\s*[:=]\s*['\"][^$]/.test(workflow))errors.push('Job provider credential appears hard-coded in workflow.');
if(refresh.includes('www.arbeitnow.co.uk'))errors.push('Unavailable UK provider endpoint must not return.');

// V14 market rotation: most scarce provider requests are spent on personalised
// convergence/bridge roles, while an independently rotating general pool keeps
// broad-market discovery alive. This replaces the old single cursor%QUERIES loop.
for(const marker of ["career-think-tank.js",'PRIORITY_QUERIES','GENERAL_QUERIES','priorityQueryCursor','generalQueryCursor','priorityCursor%PRIORITY_QUERIES.length','generalCursor%GENERAL_QUERIES.length',"allocation:'2 priority : 1 general'"])
  if(!refresh.includes(marker))errors.push(`Adzuna V14 market refresh missing ${marker}`);
if(!/slot%3\s*!==\s*2/.test(refresh))errors.push('Adzuna V14 market refresh does not preserve the 2 priority : 1 broad-discovery rotation.');
if(!/careerOptions\.ROLES/.test(refresh))errors.push('Adzuna general discovery pool is no longer derived from the complete career-role taxonomy.');
if(!/SEARCH_QUERIES/.test(refresh))errors.push('Adzuna priority pool is not linked to the V14 convergence search vocabulary.');
if(!/GENERAL_QUERIES\.length/.test(refresh))errors.push('Adzuna market refresh no longer proves that a broad discovery pool remains available.');

if(!refresh.includes("sort_by:'date'"))errors.push('Market refresh is not prioritising fresh listings.');
if(!refresh.includes('refreshTargetMinutes:60'))errors.push('Generated feed does not advertise a hourly refresh target.');
if(!ui.includes('not sent to a jobs provider'))errors.push('Dashboard does not disclose local-only best-fit matching.');
if(errors.length){console.error(`Market readiness gate failed (${errors.length}):`);errors.forEach(e=>console.error(`- ${e}`));process.exit(1);}console.log('Market readiness gate passed: active-filter role depth, six-level seniority gating, current-value modelling, personalised convergence search with preserved broad discovery, privacy-preserving best-fit jobs and quota-limited hourly automation are enforced.');
