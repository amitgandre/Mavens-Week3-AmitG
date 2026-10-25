import copy,json,sys,uuid
from pathlib import Path
root=Path(__file__).parent
w=copy.deepcopy(json.loads(Path(sys.argv[1]).read_text())[0])
newnames=['Plan Leader Research','Leadership Research Needed?','Companies for Leadership','Research Company Leaders','Recall Updated Leader Background']
w['nodes']=[n for n in w['nodes'] if n['name'] not in newnames];w['connections']={k:v for k,v in w['connections'].items() if k not in newnames}
def add(name,typ,params,pos,version=1):
 n={'id':str(uuid.uuid4()),'name':name,'type':typ,'typeVersion':version,'position':pos,'parameters':params};w['nodes'].append(n);return n
def link(a,b,output=0):
 ports=w['connections'].setdefault(a,{}).setdefault('main',[])
 while len(ports)<=output:ports.append([])
 ports[output]=[{'node':b,'type':'main','index':0}]
logic=(root/'plan_leader_research.js').read_text()
add('Plan Leader Research','n8n-nodes-base.code',{'jsCode':logic+"\nreturn [{json:planLeaderResearch($('Collect Public Evidence').first().json.companies,$input.all().map(i=>i.json),Date.parse($now.toUTC().toISO()))}];"},[7900,260],2)
add('Leadership Research Needed?','n8n-nodes-base.if',{'conditions':{'options':{'typeValidation':'strict','version':2},'conditions':[{'id':str(uuid.uuid4()),'leftValue':'={{ $json.pending_companies.length > 0 }}','rightValue':'','operator':{'type':'boolean','operation':'true','singleValue':True}}],'combinator':'and'},'options':{}},[8150,260],2.2)
add('Companies for Leadership','n8n-nodes-base.code',{'jsCode':"return $input.first().json.pending_companies.map(company_name=>({json:{company_name}}));"},[8400,100],2)
n=add('Research Company Leaders','n8n-nodes-base.executeWorkflow',{'source':'database','workflowId':{'__rl':True,'value':'Agent4LeadershipBackground','mode':'id'},'mode':'each','options':{'waitForSubWorkflow':True}},[8650,100],1.3);n['onError']='continueRegularOutput'
recall=copy.deepcopy(next(n for n in w['nodes'] if n['name']=='Recall Saved Leader Background'));recall.update(id=str(uuid.uuid4()),name='Recall Updated Leader Background',position=[8950,260]);w['nodes'].append(recall)
link('Recall Saved Leader Background','Plan Leader Research');link('Plan Leader Research','Leadership Research Needed?');link('Leadership Research Needed?','Companies for Leadership',0);link('Leadership Research Needed?','Recall Updated Leader Background',1);link('Companies for Leadership','Research Company Leaders');link('Research Company Leaders','Recall Updated Leader Background');link('Recall Updated Leader Background','Recall Previous Research')
compile=next(n for n in w['nodes'] if n['name']=='Compile Briefing');compile['parameters']['jsCode']=compile['parameters']['jsCode'].replace("$('Recall Saved Leader Background').all()","$('Recall Updated Leader Background').all()")
w['versionId']=str(uuid.uuid4());w.pop('activeVersionId',None);w.pop('activeVersion',None);w['active']=False
Path(sys.argv[2]).write_text(json.dumps([w],indent=2));print('Connected Agent 4 for all researched companies with a 24-hour retained-background cache.')
