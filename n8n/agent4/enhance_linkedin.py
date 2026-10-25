import copy,json,sys,uuid
from pathlib import Path
root=Path(__file__).parent
ws=json.loads(Path(sys.argv[1]).read_text());w=copy.deepcopy(next(w for w in ws if w['id']=='Agent4LeadershipBackground'))
for n in w['nodes']:
 if n['type']=='n8n-nodes-base.code':
  code=n['parameters']['jsCode'];start=code.index('// Public professional background only.');end=code.index('const LEADER_ROLES=',start);code=code[:start]+(root/'background.js').read_text()+'\n'+code[end:];n['parameters']['jsCode']=code
 if n['name']=='Company Leadership Briefing':
  n['parameters']['jsCode']=n['parameters']['jsCode'].replace('initial_search_budget:4+3*','initial_search_budget:4+4*').replace('background_analysis_errors:profiles.filter',"linkedin_profiles:profiles.flatMap(p=>p.linkedin_profiles||[]).length,background_analysis_errors:profiles.filter")
 if n['name']=='Company Leadership Form':n['parameters']['formDescription']=n['parameters']['formDescription'].replace('three per distinct leader (maximum 16','four per distinct leader, including a public LinkedIn search (maximum 20')
 if n['type']=='n8n-nodes-base.stickyNote':n['parameters']['content']=n['parameters']['content'].replace('Up to 3 public-background','Up to 4 public-background')+'\nPublic LinkedIn searches use Google snippets only: no LinkedIn login or profile-page retrieval.'
w=json.loads(json.dumps(w).replace('Three Background Searches Per Person','Four Background Searches Per Person'))
w['versionId']=str(uuid.uuid4());w.pop('activeVersionId',None);w.pop('activeVersion',None);w['active']=False
Path(sys.argv[2]).write_text(json.dumps([w],indent=2));print('Prepared dedicated public LinkedIn query per leader; existing workflow identity, form and connections preserved.')
