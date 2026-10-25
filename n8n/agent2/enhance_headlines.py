import copy,json,sys,uuid
from pathlib import Path
root=Path(__file__).parent
ws=json.loads(Path(sys.argv[1]).read_text());w=copy.deepcopy(next(w for w in ws if w['id']=='Agent2PublicResearch'))
agent3=next(w for w in ws if w['id']=='0VSB891Bm5GvvZGN')
model=copy.deepcopy(next(n for n in agent3['nodes'] if n['type'].endswith('lmChatOllama')))
chain_template=next(n for n in agent3['nodes'] if n['type'].endswith('chainLlm'))
parser_type=next(n['type'] for n in agent3['nodes'] if n['type'].endswith('outputParserStructured'))
def add(name,typ,params,pos,version=1):
    w['nodes']=[n for n in w['nodes'] if n['name']!=name];w['connections'].pop(name,None)
    n={'id':str(uuid.uuid4()),'name':name,'type':typ,'typeVersion':version,'parameters':params,'position':pos};w['nodes'].append(n);return n
schema={'type':'object','properties':{'searches':{'type':'array','maxItems':6,'items':{'type':'object','properties':{'company':{'type':'string'},'terms':{'type':'string'}},'required':['company','terms'],'additionalProperties':False}}},'required':['searches'],'additionalProperties':False}
chain=add('Plan Extra Searches - Local AI',chain_template['type'],{'promptType':'define','text':'''=Suggest ONE additional short public-web search for EACH company to discover recent IT/cybersecurity headlines beyond generic searches.
Companies: {{ JSON.stringify($json.companies) }}
Window: {{ $json.window_start }} to {{ $json.window_end }}
Copy company names exactly. terms should be 3–10 search words/phrases covering a useful angle such as digital transformation partnerships, AI governance, OT security, identity programs, security vendors or leadership interviews.
Do not invent headlines, facts, source names, URLs, or specific company technology deployments.
Do not put the company name, URLs, site:, before:, after: or dates in terms; code adds company/date restrictions.
Return JSON with searches, an array of objects with company and terms. If unavailable return {"searches":[]}. JSON only.''','hasOutputParser':True,'batching':{}},[650,-100],chain_template['typeVersion'])
chain.update(onError='continueRegularOutput',retryOnFail=True,maxTries=2,waitBetweenTries=1500)
model.update(id=str(uuid.uuid4()),name='Search Planner - Local Gemma',position=[600,100],parameters={'model':'gemma4:12b','options':{'format':'json','think':False,'numCtx':4096,'numPredict':2048}});w['nodes'].append(model)
add('Search Planner - Schema',parser_type,{'schemaType':'manual','inputSchema':json.dumps(schema)},[820,100],1.3)
w['connections']['Search Planner - Local Gemma']={'ai_languageModel':[[{'node':chain['name'],'type':'ai_languageModel','index':0}]]}
w['connections']['Search Planner - Schema']={'ai_outputParser':[[{'node':chain['name'],'type':'ai_outputParser','index':0}]]}
logic=(root/'collector.js').read_text()+'\n'+(root/'ai_headlines.js').read_text()
build=next(n for n in w['nodes'] if n['name'] in ['Four Searches Per Company','Build Search Plan'])
build['parameters']['jsCode']=logic+'''\nconst context=$('Research Window').first().json;const plan=aiSearchPlan(context,$input.first().json);return plan.jobs.map(job=>({json:{...job,ai_planning:plan.planning}}));'''
w['connections']['Research Window']={'main':[[{'node':chain['name'],'type':'main','index':0}]]}
w['connections'][chain['name']]={'main':[[{'node':build['name'],'type':'main','index':0}]]}
prepare=next(n for n in w['nodes'] if n['name']=='Prepare Evidence Package')
prepare['parameters']['jsCode']=logic+'''
const context=$('Research Window').first().json;const jobs=$('Four Searches Per Company').all().map(i=>i.json);
const responses=$input.all().map((item,i)=>{const response={...item.json};if(!response.search_parameters?.q){try{response._job=$('Four Searches Per Company').itemMatching(i).json;}catch{}}return response;});
const p=collectEvidence(context,jobs,responses);return [{json:{...p,ai_search_planning:jobs[0]?.ai_planning||null,...headlineFeed(p)}}];'''
# Rename the plan block and every expression/connection referencing it.
w=json.loads(json.dumps(w).replace('Four Searches Per Company','Build Search Plan'))
for node in w['nodes']:
    if node['name'] not in ['Plan Extra Searches - Local AI','Search Planner - Local Gemma','Search Planner - Schema','Build Search Plan'] and node['position'][0]>=1000:
        node['position'][0]+=500
for name,position in {'Plan Extra Searches - Local AI':[750,100],'Search Planner - Local Gemma':[750,350],'Search Planner - Schema':[950,350],'Build Search Plan':[1100,100]}.items():
    next(n for n in w['nodes'] if n['name']==name)['position']=position
form=next(n for n in w['nodes'] if n['name']=='Company Research Form');form['parameters']['formDescription']='Enter up to six companies. Local AI suggests one extra search per company. Up to five searches per company return dated headlines and source links. Existing SerpApi quota applies.'
note=next(n for n in w['nodes'] if n['type']=='n8n-nodes-base.stickyNote');note['parameters']['content']='## AI-assisted headline discovery\nLocal Gemma suggests one extra query per company.\nCore four searches always run if AI is unavailable.\nHeadlines/links are copied from actual public search results.\nOpen Research and Signals → headlines or headline_markdown.\nUnknown dates stay separate; job ads excluded from headline feed.\nUsable excerpts still go to Agent 3. No HTTP Request nodes.'
w['versionId']=str(uuid.uuid4());w.pop('activeVersionId',None);w.pop('activeVersion',None);w['active']=False
Path(sys.argv[2]).write_text(json.dumps([w],indent=2))
print('Prepared local-AI query planning and source-linked headline feed; core searches and Agent 3 handoff retained.')
