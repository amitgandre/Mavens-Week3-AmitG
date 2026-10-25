"""Create a replayable manual integration workflow; no user approval is simulated."""
import copy
import json
from pathlib import Path
import sys

w=copy.deepcopy(json.loads(Path(sys.argv[1]).read_text())[0])
fixture=json.loads(Path(sys.argv[2]).read_text())
w.update(id='Agent1Validation20261024',name='Agent 1 - Integration Test',active=False)
form=next(n for n in w['nodes'] if n['name']=='On form submission')
form.update(type='n8n-nodes-base.manualTrigger',typeVersion=1,parameters={})
form.pop('webhookId',None)
fixture['form']['Annual Report URL']='https://investors.pepsico.com/docs/pepsico-5v9wci20/media/Files/investors/q4-2025-form-10k.pdf'
data={'id':'integration-fixture','name':'Recorded Test Input','type':'n8n-nodes-base.code','typeVersion':2,
      'position':[100,0], 'parameters':{'jsCode':'return [{json:'+json.dumps(fixture['form'])+',binary:{Annual_Report:{mimeType:"application/pdf",fileName:"q4-2025-form-10k.pdf"}}}];'}}
w['nodes'].append(data)
w['connections']['On form submission']['main'][0][0]['node']='Recorded Test Input'
w['connections']['Recorded Test Input']={'main':[[{'node':'Research Settings','type':'main','index':0}]]}
for name,value in [('Extract from File',fixture['pdf']),('Find Peer Candidates',fixture['discovery'])]:
    n=next(n for n in w['nodes'] if n['name']==name)
    n.update(type='n8n-nodes-base.code',typeVersion=2,parameters={'jsCode':'return [{json:'+json.dumps(value)+'}];'})
    n.pop('credentials',None)
# Stop before approval; never turn an automated test into a user's approval.
n=next(n for n in w['nodes'] if n['name']=='Review Revenue Peers')
n.update(type='n8n-nodes-base.code',typeVersion=2,parameters={'jsCode':"return [{json:{Decision:'Revise','Sources verified':'No','Accept fewer than five':'No','Review notes':'Automated test only; human approval not granted.'}}];"})
n.pop('webhookId',None)
Path(sys.argv[3]).write_text(json.dumps([w]))
print('Prepared manual test with cached discovery/PDF, live candidate searches, real local Gemma, and no approval granted.')
