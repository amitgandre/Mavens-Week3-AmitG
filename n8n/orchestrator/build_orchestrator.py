import copy,json,sys,uuid
from pathlib import Path
root=Path(__file__).parent
ws=json.loads(Path(sys.argv[1]).read_text())
parent=copy.deepcopy(next(w for w in ws if w['id']=='2H45pUuwyaVZc99j'))
connected=json.loads(Path(sys.argv[2]).read_text())
agent2=copy.deepcopy(next(w for w in connected if w['id']=='Agent2PublicResearch'))
table_id=json.loads(Path(sys.argv[3]).read_text())['id']
fixture=json.loads(Path(sys.argv[4]).read_text())
locator={'__rl':True,'value':table_id,'mode':'id'}
def add(w,name,typ,params,pos,version=1):
    w['nodes']=[n for n in w['nodes'] if n['name']!=name]
    w['connections'].pop(name,None)
    n={'id':str(uuid.uuid4()),'name':name,'type':typ,'typeVersion':version,'parameters':params,'position':pos};w['nodes'].append(n);return n
def link(w,a,b):w['connections'][a]={'main':[[{'node':b,'type':'main','index':0}]]}
def fresh(w):
    w['versionId']=str(uuid.uuid4());w.pop('activeVersionId',None);w.pop('activeVersion',None);w['active']=False
def recall_params(company_expression,kind):
    return {'resource':'row','operation':'get','dataTableId':locator,'matchType':'allConditions','filters':{'conditions':[
        {'keyName':'company_key','condition':'eq','keyValue':company_expression},
        {'keyName':'record_type','condition':'eq','keyValue':kind}]},'returnAll':False,'limit':5,'orderBy':True,'orderByColumn':'run_time','orderByDirection':'DESC'}
brief_code=(root/'briefing.js').read_text()
template='const TEMPLATE='+json.dumps(json.loads((root/'pptx_template.json').read_text()),separators=(',',':'))+';\n'
renderer=template+(root/'pptx.js').read_text()+'''
const briefing=$input.first().json;const deck=buildPowerPoint(briefing);
const filename=briefing.company.replace(/[^a-zA-Z0-9_-]/g,'_')+'-'+briefing.run_id+'.pptx';
const base64=deck.buffer.toString('base64');
return [{json:{briefing,filename,slide_count:deck.slide_count,pptx_base64:base64},binary:{presentation:{data:base64,mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation',fileName:filename}}}];'''
snapshot='''const p=$input.first().json,b=p.briefing;
return [{json:{run_id:b.run_id,company_key:b.company_key,run_time:b.run_time,record_type:b.mode==='preview'?'research_preview':'research_snapshot',title:b.company+' — '+(b.mode==='preview'?'archived preview':'IT/cybersecurity briefing'),payload_json:JSON.stringify(b),pptx_base64:p.pptx_base64,filename:p.filename,window_start:b.research_window.start||'',window_end:b.research_window.end||'',status:b.mode==='preview'?'archived_preview':'complete'}}];'''
download='''const saved=$input.first().json;const ppt=$('Build PowerPoint').first();const b=ppt.json.briefing;
return [{json:{run_id:b.run_id,company:b.company,mode:b.mode,slides:ppt.json.slide_count,signals:b.signals.length,memory_saved:true,memory_row_id:saved.id,previous_run:b.memory.previous_run_id,filename:ppt.json.filename,briefing:b},binary:ppt.binary}];'''
def tail(w,mode,source):
    if mode=='research':company="={{ $('Finalize Reviewed Peers').first().json.company.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'') }}"
    else:company="={{ $('Archived Research').first().json.companies[0].normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'') }}"
    n=add(w,'Recall Previous Research','n8n-nodes-base.dataTable',recall_params(company,'research_preview' if mode=='preview' else 'research_snapshot'),[7410,0],1.1);n['alwaysOutputData']=True
    if mode=='research':compile=brief_code+'''\nconst peers=$('Finalize Reviewed Peers').first().json;const research=$('Collect Public Evidence').first().json;const history=$input.all().map(i=>i.json);return [{json:makeBriefing(peers,research,history,'research-'+$execution.id,$now.toUTC().toISO())}];'''
    else:compile=brief_code+'''\nconst research=$('Archived Research').first().json;const history=$input.all().map(i=>i.json);return [{json:makeBriefing(null,research,history,'preview-'+$execution.id,$now.toUTC().toISO(),'preview')}];'''
    add(w,'Compile Briefing','n8n-nodes-base.code',{'jsCode':compile},[7680,0],2)
    add(w,'Build PowerPoint','n8n-nodes-base.code',{'jsCode':renderer},[7950,0],2)
    add(w,'Prepare Memory Snapshot','n8n-nodes-base.code',{'jsCode':snapshot},[8220,0],2)
    add(w,'Retain Research Snapshot','n8n-nodes-base.dataTable',{'resource':'row','operation':'insert','dataTableId':locator,'columns':{'mappingMode':'autoMapInputData'},'options':{}},[8490,0],1.1)
    add(w,'Download Briefing','n8n-nodes-base.code',{'jsCode':download},[8760,0],2)
    for a,b in [(source,'Recall Previous Research'),('Recall Previous Research','Compile Briefing'),('Compile Briefing','Build PowerPoint'),('Build PowerPoint','Prepare Memory Snapshot'),('Prepare Memory Snapshot','Retain Research Snapshot'),('Retain Research Snapshot','Download Briefing')]:link(w,a,b)
tail(parent,'research','Collect Public Evidence')
add(parent,'Orchestrator Overview','n8n-nodes-base.stickyNote',{'content':'## Market Research Orchestrator\n1. Submit the company form.\n2. Review and approve revenue peers.\n3. Agents 2 and 3 collect and analyze public evidence.\n4. Previous research is recalled for comparison.\n5. A PowerPoint and full research snapshot are retained in local memory.\n6. Download the deck from Download Briefing → Binary.\nOld research is never automatically deleted or treated as new evidence.\nLeadership background research can be added later.','height':330,'width':560},[6400,-600])
fresh(parent);fresh(agent2)
# Archived preview uses real historical evidence and never simulates peer approval.
preview={'id':'ResearchOrchestratorPreview','name':'Orchestrator - Archived Research Preview','nodes':[],'connections':{},'settings':{'executionOrder':'v1','timezone':'America/Chicago'},'pinData':{}}
add(preview,'Start Preview','n8n-nodes-base.manualTrigger',{},[0,0])
add(preview,'Archived Research','n8n-nodes-base.code',{'jsCode':'return [{json:'+json.dumps(fixture)+'}];'},[250,0],2)
link(preview,'Start Preview','Archived Research');tail(preview,'preview','Archived Research');fresh(preview)
# Recall history without calling any search or model service.
recall={'id':'ResearchMemoryRecall','name':'Research Memory - Recall','nodes':[],'connections':{},'settings':{'executionOrder':'v1','timezone':'America/Chicago'},'pinData':{}}
f=add(recall,'Research History Form','n8n-nodes-base.formTrigger',{'path':'research-history','formTitle':'Find saved research','formDescription':'Enter the same company name used in research. Optionally enter a run ID to retrieve a specific older snapshot.','formFields':{'values':[{'fieldLabel':'Company name','fieldName':'company','requiredField':True},{'fieldLabel':'Run ID (optional)','fieldName':'run_id'}]},'options':{}},[0,0],2.6);f['webhookId']=str(uuid.uuid4())
add(recall,'Find Company Key','n8n-nodes-base.code',{'jsCode':'''const f=$input.first().json;const company=String(f.company||'').trim();if(!company)throw new Error('Enter a company name');return [{json:{company_key:company.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,''),run_id:String(f.run_id||'').trim()}}];'''},[250,0],2)
get={'resource':'row','operation':'get','dataTableId':locator,'matchType':'allConditions','filters':{'conditions':[{'keyName':'company_key','condition':'eq','keyValue':'={{ $json.company_key }}'}]},'returnAll':True,'orderBy':True,'orderByColumn':'run_time','orderByDirection':'DESC'}
n=add(recall,'Read Saved Research','n8n-nodes-base.dataTable',get,[500,0],1.1);n['alwaysOutputData']=True
add(recall,'Download Saved Research','n8n-nodes-base.code',{'jsCode':'''const wanted=$('Find Company Key').first().json.run_id;const rows=$input.all().map(i=>i.json).filter(r=>r.run_id&&(!wanted||r.run_id===wanted));
if(!rows.length)return [{json:{found:false,message:'No saved research matches this company/run ID.'}}];
return rows.slice(0,20).map(r=>{const binary={research_json:{data:Buffer.from(r.payload_json).toString('base64'),mimeType:'application/json',fileName:r.run_id+'.json'}};
if(r.pptx_base64)binary.presentation={data:r.pptx_base64,mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation',fileName:r.filename};
return {json:{found:true,run_id:r.run_id,company_key:r.company_key,saved_at:r.run_time,record_type:r.record_type,title:r.title,status:r.status,presentation_available:!!r.pptx_base64,total_matching:rows.length,shown:Math.min(rows.length,20)},binary};});'''},[750,0],2)
for a,b in [('Research History Form','Find Company Key'),('Find Company Key','Read Saved Research'),('Read Saved Research','Download Saved Research')]:link(recall,a,b)
fresh(recall)
Path(sys.argv[5]).write_text(json.dumps([agent2,parent,preview,recall],indent=2))
print('Prepared Orchestrator, archived-preview test, native persistent memory, recall/download, and fresh callable Agent 2 version.')
