import json,sys,uuid
from pathlib import Path
root=Path(__file__).parent
ws=json.loads(Path(sys.argv[1]).read_text());w=next(w for w in ws if w['id']=='2H45pUuwyaVZc99j')
nodes={n['name']:n for n in w['nodes']}
nodes['Validate Research Input']['parameters']['jsCode']=(root/'validate_input.js').read_text()
nodes['Find Target Revenue']['parameters']['q']='={{ $("Validate Research Input").first().json["Company Name"] + " latest full year annual consolidated net revenue net sales results site:" + $("Validate Research Input").first().json.official_domain }}'
for name in ['Build Research Context','Normalize Candidate Revenues']:
    old=nodes[name]['parameters']['jsCode'];end=old.index('\nconst ',old.index('return out;'))
    nodes[name]['parameters']['jsCode']=(root/'normalize_record.js').read_text()+old[end:]
context=nodes['Build Research Context']['parameters']['jsCode']
context=context.replace("{company:f['Company Name']}","{company:f['Company Name'],official_domain:f.official_domain}")
nodes['Build Research Context']['parameters']['jsCode']=context
form=nodes['On form submission'];form['parameters']['formDescription']='Enter the actual company name (for example PepsiCo), its official website, sector and geography. Upload its annual report if available. Placeholder names such as Company are not accepted.'
for f in form['parameters']['formFields']['values']:
    if f['fieldLabel']=='Company Name':f['placeholder']='Example: PepsiCo'
def add(name,typ,params,pos,version):
    w['nodes']=[n for n in w['nodes'] if n['name']!=name];w['connections'].pop(name,None)
    w['nodes'].append({'id':str(uuid.uuid4()),'name':name,'type':typ,'typeVersion':version,'position':pos,'parameters':params})
def gate(name,expression,pos):
    add(name,'n8n-nodes-base.if',{'conditions':{'options':{'typeValidation':'strict','version':2},'conditions':[{'id':str(uuid.uuid4()),'leftValue':expression,'rightValue':'','operator':{'type':'boolean','operation':'true','singleValue':True}}],'combinator':'and'},'options':{}},pos,2.2)
def edge(a,b,out=0):
    ports=w['connections'].setdefault(a,{}).setdefault('main',[])
    while len(ports)<=out:ports.append([])
    ports[out].append({'node':b,'type':'main','index':0})
gate('Target Revenue Supported?','={{ $json.target.usable === true }}',[1930,-120])
add('Target Revenue Needs Review','n8n-nodes-base.code',{'jsCode':'''const c=$input.first().json;return [{json:{status:'input_or_evidence_required',stage:'target_revenue',company:c.target.company,issues:c.target.issues,target:c.target,next_action:'Verify the company name and official website. Upload the company annual report and its public URL, or retry with better evidence. No peer approval is requested.'}}];'''},[2200,420],2)
w['connections']['Build Research Context']={'main':[]};edge('Build Research Context','Target Revenue Supported?');edge('Target Revenue Supported?','Find Peer Candidates');edge('Target Revenue Supported?','Target Revenue Needs Review',1)
gate('Peers Ready for Review?','={{ $json.selected_count > 0 && $json.target.usable === true }}',[6160,-100])
add('Peer Research Needs Review','n8n-nodes-base.code',{'jsCode':'''const b=$input.first().json;return [{json:{...b,status:'peer_research_needs_revision',next_action:'No supported companies meet the current criteria. Review the exclusions, improve source evidence, or explicitly widen the revenue range and rerun. No empty list is sent for approval.'}}];'''},[6450,450],2)
w['connections']['Rank Revenue Peers']={'main':[]};edge('Rank Revenue Peers','Peers Ready for Review?');edge('Peers Ready for Review?','Review Revenue Peers');edge('Peers Ready for Review?','Peer Research Needs Review',1)
if 'Recall Previous Research' in nodes:
    locator=nodes['Recall Previous Research']['parameters']['dataTableId']
    add('Recall Retained Financial Evidence','n8n-nodes-base.dataTable',{'resource':'row','operation':'get','dataTableId':locator,'matchType':'allConditions','filters':{'conditions':[{'keyName':'company_key','condition':'eq','keyValue':"={{ $('Validate Research Input').first().json['Company Name'].normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'') }}"}]},'returnAll':False,'limit':50,'orderBy':True,'orderByColumn':'run_time','orderByDirection':'DESC'},[970,400],1.1)
    next(n for n in w['nodes'] if n['name']=='Recall Retained Financial Evidence')['alwaysOutputData']=True
    add('Select Retained Annual Report','n8n-nodes-base.code',{'jsCode':(root/'select_retained_report.js').read_text()},[1230,400],2)
    gate('Retained Report Available?','={{ $json.has_retained_report === true }}',[1460,400])
    w['connections']['Annual Report Attached?']['main'][1]=[{'node':'Recall Retained Financial Evidence','type':'main','index':0}]
    edge('Recall Retained Financial Evidence','Select Retained Annual Report');edge('Select Retained Annual Report','Retained Report Available?');edge('Retained Report Available?','Prepare Report Evidence');edge('Retained Report Available?','Find Target Revenue',1)
    p=nodes['Prepare Report Evidence']['parameters']['jsCode']
    p=p.replace("kind:'uploaded_pdf'","kind:($input.first().json.kind||'uploaded_pdf')")
    p=p.replace("url:original['Annual Report URL']||'uploaded:Annual_Report'","url:$input.first().json.source_url||original['Annual Report URL']||'uploaded:Annual_Report'")
    nodes['Prepare Report Evidence']['parameters']['jsCode']=p
w['versionId']=str(uuid.uuid4());w.pop('activeVersionId',None);w.pop('activeVersion',None);w['active']=False
Path(sys.argv[2]).write_text(json.dumps([w],indent=2))
print('Prepared placeholder rejection, official-source/company checks, and no-empty-review gates.')
