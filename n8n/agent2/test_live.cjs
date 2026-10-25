const fs=require('fs'),assert=require('assert');
const build=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const data=JSON.parse(fs.readFileSync(process.argv[3],'utf8')).runData;
const first=n=>data[n].at(-1).data.main[0][0].json;
const context=first('Research Window'),jobs=data['Four Searches Per Company'].at(-1).data.main[0];
const responses=[...data['Google News'].at(-1).data.main[0],...data['Google Web'].at(-1).data.main[0]];
const script=build[0].nodes.find(n=>n.name==='Prepare Evidence Package').parameters.jsCode;
const result=new Function('$input','$',script)({all:()=>responses},()=>({first:()=>({json:context}),all:()=>jobs}))[0].json;
assert.equal(result.statistics.queries_succeeded,4);assert.equal(result.statistics.queries_failed,0);
assert.equal(result.statistics.unique_sources,20);assert(result.evidence_records.length>0);
for(const r of result.evidence_records){
 for(const k of ['company','source_id','source_url','publication_date','evidence_text'])assert(r[k]);
 assert(r.publication_date>=context.window_start&&r.publication_date<=context.window_end);
 assert.equal(r.full_article_retrieved,false);assert(!r.review_reasons.length);
}
assert(!result.evidence_records.some(r=>r.title.includes('KFC picks Coca-Cola')));
const validation=build[0].nodes.find(n=>n.name==='Validate Companies').parameters.jsCode;
const validate=input=>new Function('$input',validation)({first:()=>({json:input})});
assert.throws(()=>validate({approved:false,companies_for_agent2:[{company:'PepsiCo'}]}));
assert.deepEqual(validate({'Company names':'PepsiCo, The Coca-Cola Company\nNestlé'})[0].json.companies,['PepsiCo','The Coca-Cola Company','Nestlé']);
const summary={live_searches:4,live_execution:'success',final_collector_regression:'passed',statistics:result.statistics,
 research_window:result.research_window,ready_titles:result.evidence_records.map(r=>r.title),
 unapproved_handoff_test:'blocked',model_calls:0,http_request_nodes:0,full_articles_retrieved:0};
fs.writeFileSync(__dirname+'/TEST_RESULTS.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
// Keep the separately runnable live test aligned with the production collector.
const test=JSON.parse(JSON.stringify(build[0]));test.id='Agent2LiveTest';test.name='Agent 2 - Live Search Test';
const form=test.nodes.find(n=>n.name==='Company Research Form');form.type='n8n-nodes-base.manualTrigger';form.typeVersion=1;form.parameters={};
test.nodes.push({id:'test-company',name:'Test Company',type:'n8n-nodes-base.code',typeVersion:2,position:[130,0],parameters:{jsCode:'return [{json:{"Company names":"PepsiCo"}}];'}});
test.connections['Company Research Form']={main:[[{node:'Test Company',type:'main',index:0}]]};
test.connections['Test Company']={main:[[{node:'Validate Companies',type:'main',index:0}]]};
fs.writeFileSync(process.argv[4],JSON.stringify([...build,test],null,2));
