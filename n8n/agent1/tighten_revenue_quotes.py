"""Keep financial quotations short and verbatim without weakening validation."""
import json
import sys
import uuid
from pathlib import Path
workflows=json.loads(Path(sys.argv[1]).read_text())
for workflow in workflows:
    for node in workflow['nodes']:
        if node['name'] in ['Extract Revenue Evidence','Extract Candidate Revenue']:
            params=node['parameters']
            addition=('\nFor evidence_excerpt copy ONE short contiguous passage, ideally the revenue row and its adjacent year header, at most 500 characters. '
                      'Do not combine separate passages, repeat rows, omit words, insert ellipses, correct spelling or rewrite PDF text. '
                      'Other fields may use the rest of the supplied evidence. Preserve the exact source text in the quotation.')
            if addition not in params.get('text',''):params['text']+=addition
        if node['name'] in ['Extract Revenue Evidence - Local Gemma','Extract Candidate Revenue - Local Gemma']:
            node['parameters'].setdefault('options',{})['temperature']=0
    workflow['versionId']=str(uuid.uuid4())
    for key in ['activeVersion','activeVersionId','shared']:workflow.pop(key,None)
    workflow['active']=False
Path(sys.argv[2]).write_text(json.dumps(workflows,indent=2))
print('Short verbatim financial quote instructions applied; evidence validation unchanged.')
