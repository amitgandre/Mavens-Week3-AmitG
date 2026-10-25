import json,sys
from pathlib import Path
s=Path(sys.argv[1]).read_text();d=json.JSONDecoder().raw_decode(s[s.index('{\n  "data"'):])[0]
r=d['data']['resultData'];assert not r.get('error'),r.get('error')
results=[i['json'] for i in r['runData']['Validate Extracted Signals'][0]['data']['main'][0]]
assert len(results)==9,len(results)
errors=[{'source_id':j['source_id'],'error':j['error']} for j in results if j['analysis_status']!='complete']
assert not errors,errors
by_id={j['source_id']:j for j in results}
for sid in ['src-d03f0656','src-4e4e9ed1','src-a65da4e5','src-035eec34']:
 assert by_id[sid]['signals']==[],by_id[sid]
assert by_id['src-d6703585']['signals'],'Digital twin finding lost'
assert by_id['src-40c073ab']['signals'],'Hiring mention lost'
assert all(s['status']=='hiring_signal' for s in by_id['src-40c073ab']['signals'])
assert all(s['status']!='deployed' for s in by_id['src-4ded5ef0']['signals'])
report={'passed':True,'test':'Local Gemma on nine recorded real excerpts, no new search calls','sources_processed':len(results),'signals':sum(len(j['signals']) for j in results),'sources_failed':len(errors),'checks':['generic NIST and unified-oversight claims excluded','other-employer appointment excluded','cloud hiring mention retained','digital twin finding retained','AI media not labeled deployed'],'results':results}
Path('n8n/agent3/ATTRIBUTION_TEST_RESULTS.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='results'},indent=2))
