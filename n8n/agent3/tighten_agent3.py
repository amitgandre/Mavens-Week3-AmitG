import json,sys,uuid,copy
from pathlib import Path
root=Path(__file__).parent
ws=json.loads(Path(sys.argv[1]).read_text())
w=copy.deepcopy(next(w for w in ws if w['id']=='0VSB891Bm5GvvZGN'))
chain=next(n for n in w['nodes'] if n['type'].endswith('chainLlm'))
chain['parameters']['text']+='''
STRICT COMPANY ATTRIBUTION:
A company name in the page URL, publisher, title, or search query does NOT establish that a statement describes this company's actions.
Every non-job signal must have a verbatim evidence_excerpt explicitly naming the target company AND connecting it to the stated action/technology. If you cannot supply that quotation, omit the signal.
Generic security advice, educational framework discussions, recommendations, "the key is", "encourages", and hypothetical possibilities are NOT company developments. Never rewrite them as the company adopts, aligns with, acknowledges, or uses something.
A former employee's appointment at another company is NOT a leadership change at the target company. A directory of current/former leaders is not an appointment announcement.
Use deployed/usage only when the excerpt explicitly establishes actual use. "Moving toward", "could", "pilot", "plans", or a reported agency appointment do not establish deployment. Use reported/announced/pilot as appropriate and preserve uncertainty in the summary.
A general AI or digital-twin story is broader IT technology, not a cybersecurity deployment; do not invent a security purpose.
For contract_value use "not found" unless the excerpt states a value or explicitly says the value is undisclosed. Silence is not "not disclosed".
For job ads retain only explicitly named technology/hiring mentions with hiring_signal; do not infer production use.
It is correct to return an empty signals array for generic or weak evidence. Favor supported evidence over filling categories.
'''
chain['parameters']['text']=chain['parameters']['text'].replace('For no supported signals, the valid result is {"company":"{{ $json.company }}","signals":[]}.','For no supported signals use the parser envelope shown below.')
chain['parameters']['text']+='\nFINAL JSON SHAPE: Follow the parser envelope: {"output":{"company":"{{ $json.company }}","signals":[]}}. For unsupported or generic evidence, return this complete object, never {}. For findings, output.signals MUST be an ARRAY of signal objects, even for one finding: {"output":{"company":"{{ $json.company }}","signals":[{...all required signal fields...}]}}. Do not make signals a single object.\n'
model=next(n for n in w['nodes'] if n['type'].endswith('lmChatOllama'))
model['parameters']['options']['temperature']=0
next(n for n in w['nodes'] if n['name']=='Validate Extracted Signals')['parameters']['jsCode']=(root/'validate_signals.js').read_text()
w['versionId']=str(uuid.uuid4());w.pop('activeVersionId',None);w.pop('activeVersion',None);w['active']=False
Path(sys.argv[2]).write_text(json.dumps([w],indent=2))
