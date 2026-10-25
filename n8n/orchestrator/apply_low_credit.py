import copy,json,sys,uuid
from pathlib import Path
root=Path(__file__).parent.parent
ws=json.loads(Path(sys.argv[1]).read_text());out=[]
a2=copy.deepcopy(next(w for w in ws if w['id']=='Agent2PublicResearch'))
for n in a2['nodes']:
 if n['type']=='n8n-nodes-base.code' and '// Local AI suggests' in n['parameters'].get('jsCode',''):
  body=n['parameters']['jsCode'];tail=body[body.index('// Local AI suggests'):];start=tail.index('// Local AI suggests');end=tail.index('\nconst context=',start) if '\nconst context=' in tail else -1
  if end<0:raise RuntimeError('Cannot locate Agent 2 code tail')
  n['parameters']['jsCode']=(root/'agent2/collector.js').read_text()+'\n'+(root/'agent2/ai_headlines.js').read_text()+tail[end:]
 if n['name']=='Plan Extra Searches - Local AI':n['disabled']=True
 if n['name']=='Company Research Form':n['parameters']['formDescription']='Low-credit mode: two public searches per company, no automatic retries or extra AI-generated searches. Up to six companies (12 search requests). Existing SerpApi allowance applies.'
 if n['type']=='n8n-nodes-base.stickyNote':n['parameters']['content']='## Low-credit Agent 2\nTwo searches per company: cyber news + combined IT web search.\nAI query expansion is disabled. No automatic search retries.\nMaximum 12 search requests for six companies.\nReal source-linked headlines and evidence still go to local Agent 3.'
a2['connections']['Research Window']={'main':[[{'node':'Build Search Plan','type':'main','index':0}]]};out.append(a2)
a4=copy.deepcopy(next(w for w in ws if w['id']=='Agent4LeadershipBackground'))
for n in a4['nodes']:
 if n['type']=='n8n-nodes-base.code':
  body=n['parameters']['jsCode'];start=body.index('// Public professional background only.');end=body.index('const LEADER_ROLES=',start);body=body[:start]+(root/'agent4/background.js').read_text()+'\n'+body[end:];start=body.index('function leaderJobs(');end=body.index('\nfunction leaderCollect',start);new=(root/'agent4/discover.js').read_text();a=new.index('function leaderJobs(');b=new.index('\nfunction leaderCollect',a);body=body[:start]+new[a:b]+body[end:];n['parameters']['jsCode']=body
 if n['name']=='Company Leadership Briefing':n['parameters']['jsCode']=n['parameters']['jsCode'].replace('initial_search_budget:4+4*','initial_search_budget:2+')
 if n['name']=='Company Leadership Form':n['parameters']['formDescription']='Low-credit public background research: two discovery searches plus one public LinkedIn search per distinct leader (maximum six searches/company). No automatic retries. Public snippets need verification.'
 if n['type']=='n8n-nodes-base.stickyNote':n['parameters']['content']='## Low-credit Agent 4\nTwo combined searches discover CEO/CISO/CTO/CIO candidates.\nOne public LinkedIn search per distinct leader (max four people).\nMaximum six searches/company; no automatic retries.\nProfessional roles, requested prior firms and education only.\nUse retained profiles to avoid repeat searches.'
a4=json.loads(json.dumps(a4).replace('Four Leadership Searches','Two Leadership Searches').replace('Four Background Searches Per Person','One Background Search Per Person'));out.append(a4)
a3=copy.deepcopy(next(w for w in ws if w['id']=='0VSB891Bm5GvvZGN'));next(n for n in a3['nodes'] if n['name']=='Validate Extracted Signals')['parameters']['jsCode']=(root/'agent3/validate_signals.js').read_text();out.append(a3)
for w in out:
 for n in w['nodes']:
  if 'serpApi' in n['type']:n['retryOnFail']=False;n.pop('maxTries',None);n.pop('waitBetweenTries',None)
 w['versionId']=str(uuid.uuid4());w.pop('activeVersionId',None);w.pop('activeVersion',None);w['active']=False
Path(sys.argv[2]).write_text(json.dumps(out,indent=2));print('Prepared low-credit Agents 2/4 and stricter Agent 3; no network calls.')
