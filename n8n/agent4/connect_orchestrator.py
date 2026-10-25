import copy,json,sys,uuid
from pathlib import Path
root=Path(__file__).parent.parent
ws=json.loads(Path(sys.argv[1]).read_text());w=copy.deepcopy(next(w for w in ws if w['id']=='2H45pUuwyaVZc99j'))
n=copy.deepcopy(next(n for n in w['nodes'] if n['name']=='Recall Previous Research'));n.update(id=str(uuid.uuid4()),name='Recall Saved Leader Background',position=[7600,260],alwaysOutputData=True)
n['parameters']['filters']={'conditions':[{'keyName':'record_type','condition':'eq','keyValue':'leadership_background'}]};n['parameters'].update(returnAll=False,limit=500)
w['nodes']=[node for node in w['nodes'] if node['name']!=n['name']]+[n]
w['connections']['Collect Public Evidence']={'main':[[{'node':n['name'],'type':'main','index':0}]]};w['connections'][n['name']]={'main':[[{'node':'Recall Previous Research','type':'main','index':0}]]}
compile=next(n for n in w['nodes'] if n['name']=='Compile Briefing');compile['parameters']['jsCode']=(root/'orchestrator/briefing.js').read_text()+'''\nconst peers=$('Finalize Reviewed Peers').first().json;const research=$('Collect Public Evidence').first().json;const history=$input.all().map(i=>i.json);const leaders=$('Recall Saved Leader Background').all().map(i=>i.json);return [{json:makeBriefing(peers,research,history,'research-'+$execution.id,$now.toUTC().toISO(),'research',leaders)}];'''
ppt=next(n for n in w['nodes'] if n['name']=='Build PowerPoint');old=ppt['parameters']['jsCode'];suffix=old[old.index('\nconst briefing=$input.first().json;'):];ppt['parameters']['jsCode']='const TEMPLATE='+ (root/'orchestrator/pptx_template.json').read_text()+';\n'+(root/'orchestrator/pptx.js').read_text()+suffix
w['versionId']=str(uuid.uuid4());w.pop('activeVersionId',None);w.pop('activeVersion',None);w['active']=False
Path(sys.argv[2]).write_text(json.dumps([w],indent=2));print('Prepared optional saved Agent 4 backgrounds in orchestrator memory and PowerPoint; approval unchanged.')
