import copy,json,sys,uuid
from pathlib import Path
root=Path(__file__).parent.parent
ws=json.loads(Path(sys.argv[1]).read_text());w=copy.deepcopy(next(w for w in ws if w['id']=='2H45pUuwyaVZc99j'))
removed={'Review Revenue Peers','Peers Ready for Review?','Peer Research Needs Review'}
w['nodes']=[n for n in w['nodes'] if n['name'] not in removed];w['connections']={k:v for k,v in w['connections'].items() if k not in removed}
w['connections']['Rank Revenue Peers']={'main':[[{'node':'Finalize Reviewed Peers','type':'main','index':0}]]}
next(n for n in w['nodes'] if n['name']=='Finalize Reviewed Peers')['parameters']['jsCode']=(root/'agent1/automatic_decision.js').read_text()
for node in w['nodes']:
 if node['type']=='n8n-nodes-base.code' and 'function normalizeRecord(' in node['parameters'].get('jsCode',''):
  body=node['parameters']['jsCode'];start=body.index('// Pure validation shared') if '// Pure validation shared' in body else body.index('function normalizeRecord(');end=body.index('\n}\n',start)+3;node['parameters']['jsCode']=body[:start]+(root/'agent1/normalize_record.js').read_text()+body[end:]
rank=next(n for n in w['nodes'] if n['name']=='Rank Revenue Peers');rank['parameters']['jsCode']=rank['parameters']['jsCode'].replace("briefing.review_url=$execution.resumeFormUrl;","briefing.review_url=null;")
compile=next(n for n in w['nodes'] if n['name']=='Compile Briefing');old=compile['parameters']['jsCode'];suffix=old[old.index('\nconst peers='):];compile['parameters']['jsCode']=(root/'orchestrator/briefing.js').read_text()+suffix
ppt=next(n for n in w['nodes'] if n['name']=='Build PowerPoint');old=ppt['parameters']['jsCode'];suffix=old[old.index('\nconst briefing=$input.first().json;'):];ppt['parameters']['jsCode']='const TEMPLATE='+(root/'orchestrator/pptx_template.json').read_text()+';\n'+(root/'orchestrator/pptx.js').read_text()+suffix
w['versionId']=str(uuid.uuid4());w.pop('activeVersionId',None);w.pop('activeVersion',None);w['active']=False
Path(sys.argv[2]).write_text(json.dumps([w],indent=2));print('Prepared automatic peer decision per explicit user instruction; source verification remains false and gaps are retained.')
