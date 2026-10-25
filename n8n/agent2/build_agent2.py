import copy
import json
from pathlib import Path
import sys
import uuid

root=Path(__file__).parent
ws=json.loads(Path(sys.argv[1]).read_text())
parent=next(w for w in ws if w['id']=='2H45pUuwyaVZc99j')
template=next(n for n in parent['nodes'] if n['name']=='Find Peer Candidates')
nodes=[];connections={}
def add(name,typ,params,pos,version=1):
    n={'id':str(uuid.uuid4()),'name':name,'type':typ,'typeVersion':version,'parameters':params,'position':pos};nodes.append(n);return n
def link(a,b,output=0,index=0):
    ports=connections.setdefault(a,{}).setdefault('main',[])
    while len(ports)<=output:ports.append([])
    ports[output].append({'node':b,'type':'main','index':index})
add('Company Research Form','n8n-nodes-base.formTrigger',{'formTitle':'Agent 2 — Recent company evidence','formDescription':'Enter up to six company names, separated by commas or new lines. Four searches per company. Uses public search results from the last three calendar months.','formFields':{'values':[{'fieldLabel':'Company names','fieldType':'textarea','requiredField':True}]},'options':{}},[0,0],2.6)
add('From Approved Agent 1','n8n-nodes-base.executeWorkflowTrigger',{'inputSource':'passthrough'},[0,220],1.1)
add('Validate Companies','n8n-nodes-base.code',{'jsCode':r'''const input=$input.first().json;let companies;
if(Object.hasOwn(input,'Company names'))companies=String(input['Company names']).split(/[,\n]+/).map(s=>s.trim()).filter(Boolean);
else {if(input.approved!==true||!Array.isArray(input.companies_for_agent2))throw new Error('Agent 1 must be approved before company research');companies=input.companies_for_agent2.map(c=>c.company);}
companies=[...new Set(companies)];
if(!companies.length||companies.length>6)throw new Error('Enter between one and six companies');
if(companies.some(c=>typeof c!=='string'||c.length<2||c.length>120||Array.from(c).some(ch=>ch.charCodeAt(0)<32||ch.charCodeAt(0)===34||ch.charCodeAt(0)===92)))throw new Error('Use plain company names');
return [{json:{companies,window_start:input.research_window?.start||'',window_end:input.research_window?.end||'',results_per_query:5}}];'''},[260,100],2)
link('Company Research Form','Validate Companies');link('From Approved Agent 1','Validate Companies')
add('Research Window','n8n-nodes-base.set',{'assignments':{'assignments':[
    {'id':str(uuid.uuid4()),'name':'window_end','value':"={{ $json.window_end || $now.setZone('America/Chicago').toISODate() }}",'type':'string'},
    {'id':str(uuid.uuid4()),'name':'window_start','value':"={{ $json.window_start || DateTime.fromISO($json.window_end || $now.setZone('America/Chicago').toISODate()).minus({months:3}).toISODate() }}",'type':'string'},
    {'id':str(uuid.uuid4()),'name':'retrieved_at','value':'={{ $now.toUTC().toISO() }}','type':'string'}]},'includeOtherFields':True,'options':{}},[500,100],3.5)
link('Validate Companies','Research Window')
logic=(root/'collector.js').read_text()
add('Four Searches Per Company','n8n-nodes-base.code',{'jsCode':logic+'\nreturn buildSearchJobs($input.first().json).map(job=>({json:job}));'},[750,100],2)
link('Research Window','Four Searches Per Company')
add('News or Web?','n8n-nodes-base.if',{'conditions':{'options':{'typeValidation':'strict','version':2},'conditions':[{'id':str(uuid.uuid4()),'leftValue':'={{ $json.engine === "google_news" }}','rightValue':'','operator':{'type':'boolean','operation':'true','singleValue':True}}],'combinator':'and'},'options':{}},[1000,100],2.2)
link('Four Searches Per Company','News or Web?')
for name,engine,y,branch in [('Google News','google_news',-60,0),('Google Web','google',260,1)]:
    n=add(name,template['type'],{'operation':engine,'q':'={{ $json.query }}','additionalFields':{'hl':'en'},'requestOptions':{}},[1270,y])
    n['credentials']=copy.deepcopy(template['credentials']);n.update(retryOnFail=True,maxTries=2,waitBetweenTries=3000,onError='continueRegularOutput')
    link('News or Web?',name,branch)
add('Combine Search Results','n8n-nodes-base.merge',{'mode':'append','numberInputs':2},[1540,100],3.2)
link('Google News','Combine Search Results',index=0);link('Google Web','Combine Search Results',index=1)
add('Prepare Evidence Package','n8n-nodes-base.code',{'jsCode':logic+r'''
const context=$('Research Window').first().json;const jobs=$('Four Searches Per Company').all().map(i=>i.json);
const responses=$input.all().map((item,i)=>{const response={...item.json};
 if(!response.search_parameters?.q){try{response._job=$('Four Searches Per Company').itemMatching(i).json;}catch{}}
 return response;});
return [{json:collectEvidence(context,jobs,responses)}];'''},[1810,100],2)
link('Combine Search Results','Prepare Evidence Package')
add('Agent 2 - Simple Guide','n8n-nodes-base.stickyNote',{'content':'## Agent 2 — public evidence collector\nStart Company Research Form, or receive an approved Agent 1 list.\n4 searches per company; maximum 6 companies.\nNo HTTP Request nodes, GET/POST configuration, or model calls.\nPrepare Evidence Package contains evidence_records, review_queue, coverage, and failures.\nOnly dated in-window excerpts with a lexical company match are ready for Agent 3.\nTitles/snippets are not full articles; original-source review is still required.\nNothing is sent to Agent 3 automatically.','height':290,'width':530},[200,-440])
agent={'id':'Agent2PublicResearch','name':'Agent 2 - Public Web and News','nodes':nodes,'connections':connections,'settings':{'executionOrder':'v1','timezone':'America/Chicago','saveDataSuccessExecution':'all','saveDataErrorExecution':'all'},'active':False,'pinData':{}}
form=next(n for n in nodes if n['name']=='Company Research Form')
form['webhookId']=str(uuid.uuid4())
form['parameters']['path']='agent2-company-research'
form['parameters']['formFields']['values'][0]['fieldName']='company_names'
next(n for n in nodes if n['name']=='Validate Companies')['parameters']['jsCode']=(root/'validate_companies.js').read_text()
# Guard automated handoff; a rejected/revised Agent 1 briefing remains readable.
parent=copy.deepcopy(parent)
for name in ['Approved for Agent 2?','Collect Public Evidence']:
    parent['nodes']=[n for n in parent['nodes'] if n['name']!=name]
    parent['connections'].pop(name,None)
parent['nodes'].append({'id':str(uuid.uuid4()),'name':'Approved for Agent 2?','type':'n8n-nodes-base.if','typeVersion':2.2,'position':[6870,0],'parameters':{'conditions':{'options':{'typeValidation':'strict','version':2},'conditions':[{'id':str(uuid.uuid4()),'leftValue':'={{ $json.approved === true && $json.companies_for_agent2.length > 0 }}','rightValue':'','operator':{'type':'boolean','operation':'true','singleValue':True}}],'combinator':'and'},'options':{}}})
parent['nodes'].append({'id':str(uuid.uuid4()),'name':'Collect Public Evidence','type':'n8n-nodes-base.executeWorkflow','typeVersion':1.3,'position':[7130,0],'parameters':{'source':'database','workflowId':{'__rl':True,'value':agent['id'],'mode':'id'},'mode':'once','options':{'waitForSubWorkflow':True}}})
parent['connections']['Finalize Reviewed Peers']={'main':[[{'node':'Approved for Agent 2?','type':'main','index':0}]]}
parent['connections']['Approved for Agent 2?']={'main':[[{'node':'Collect Public Evidence','type':'main','index':0}],[]]}
Path(sys.argv[2]).write_text(json.dumps([agent,parent],indent=2))
print('Built simple Agent 2:',len(nodes),'nodes; guarded Agent 1 integration prepared.')
