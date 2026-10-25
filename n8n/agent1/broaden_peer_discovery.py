"""Use complementary evidence searches before selecting five eligible peers."""
import copy
import json
import sys
import uuid
from pathlib import Path
workflows=json.loads(Path(sys.argv[1]).read_text())
for w in workflows:
    search=next(n for n in w['nodes'] if n['name']=='Find Peer Candidates')
    assert 'serpApi' in search['type'], 'Apply this transformation only once'
    native=copy.deepcopy(search);native['id']=str(uuid.uuid4());native['name']='Search Peer Discovery'
    native['parameters']['q']='={{ $json.discovery_query }}';native['retryOnFail']=False
    build={'id':str(uuid.uuid4()),'name':'Build Peer Discovery Queries','type':'n8n-nodes-base.code','typeVersion':2,'position':[1950,-100],'parameters':{'jsCode':"const c=$input.first().json;return [c.target.company+' comparable companies similar annual revenue same sector '+c.sector+' '+c.geography, c.geography+' largest supermarket chains annual revenue '+c.target.fiscal_year+' ranking',c.geography+' largest home improvement retailers annual revenue '+c.target.fiscal_year,c.geography+' largest general merchandise retailers annual revenue '+c.target.fiscal_year+' ranking'].map(discovery_query=>({json:{discovery_query}}));"}}
    search['type']='n8n-nodes-base.code';search['typeVersion']=2;search.pop('credentials',None)
    search['parameters']={'jsCode':"const seen=new Set(),organic_results=[],search_failures=[];for(const item of $input.all()){const j=item.json;if(j.error)search_failures.push(j.error);for(const r of j.organic_results||[]){if(!r.link||seen.has(r.link))continue;seen.add(r.link);organic_results.push(r);}}return [{json:{organic_results,search_failures}}];"}
    w['nodes']+=[build,native]
    def link(a,b):w['connections'][a]={'main':[[{'node':b,'type':'main','index':0}]]}
    for route in w['connections'].values():
        for outputs in route.values():
            for edges in outputs:
                for edge in edges:
                    if edge['node']=='Find Peer Candidates':edge['node']='Build Peer Discovery Queries'
    link('Build Peer Discovery Queries','Search Peer Discovery');link('Search Peer Discovery','Find Peer Candidates')
    for n in w['nodes']:
        if n['name']=='Extract Peer Candidates - Schema':
            schema=json.loads(n['parameters']['inputSchema']);schema['properties']['candidates']['maxItems']=12;n['parameters']['inputSchema']=json.dumps(schema)
    w['versionId']=str(uuid.uuid4())
Path(sys.argv[2]).write_text(json.dumps(workflows))
print('Prepared four complementary financial discovery searches, deduplicated evidence, and up to 12 candidates. Final peer cap remains five.')
