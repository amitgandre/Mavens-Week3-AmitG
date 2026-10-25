// Run inside the n8n container. Read execution history only; never export credentials.
const fs=require('fs'),crypto=require('crypto'),{DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('/home/node/.n8n/database.sqlite',{readOnly:true});
const rows=db.prepare('SELECT e.id,e.workflowId,e.status,e.startedAt,e.stoppedAt,d.data FROM execution_entity e JOIN execution_data d ON d.executionId=e.id ORDER BY e.id').all();
const wanted=new Set(['Rank Revenue Peers','Finalize Reviewed Peers','Prepare Evidence Package','Research and Signals','Extract Revenue Evidence','Extract Peer Candidates','Extract Cybersecurity Signals.','Validate Extracted Signals']);
const memory=[],docs=new Set();
const key=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function decode(text){const a=JSON.parse(text);if(!Array.isArray(a))return a;const cache=new Map();function expand(i){if(cache.has(i))return cache.get(i);const v=a[i];if(v===null||typeof v!=='object')return v;const out=Array.isArray(v)?[]:{};cache.set(i,out);for(const k of Object.keys(v))out[k]=typeof v[k]==='string'&&/^\d+$/.test(v[k])?expand(Number(v[k])):v[k];return out;}return expand(0);}
function row(run_id,company,run_time,type,title,payload,status){return {run_id,company_key:key(company),run_time,record_type:type,title,payload_json:JSON.stringify(payload),pptx_base64:'',filename:'',window_start:payload.research_window?.start||'',window_end:payload.research_window?.end||'',status};}
for(const exec of rows){let data;try{data=decode(exec.data);}catch{continue;}const runs=data.resultData?.runData||{};
 const first=n=>runs[n]?.at(-1)?.data?.main?.[0]?.[0]?.json;
 const form=first('On form submission')||first('Company Research Form')||{};
 const pack=first('Research and Signals')||first('Prepare Evidence Package');
 const artifacts={};for(const name of wanted)if(runs[name])artifacts[name]=runs[name].flatMap(r=>r.data?.main?.[0]?.map(i=>i.json)||[]);
 if(!Object.keys(artifacts).length)continue;
 const companies=pack?.companies||[first('Rank Revenue Peers')?.company||first('Extract Revenue Evidence')?.output?.company||form['Company Name']||first('Test Evidence')?.company||'unknown'];
 const time=new Date(exec.stoppedAt||exec.startedAt).toISOString();
 for(const company of [...new Set(companies)])memory.push(row('legacy-exec-'+exec.id+'-'+key(company),company,time,'legacy_research','Execution '+exec.id+' — '+company,
   {execution_id:exec.id,workflow_id:exec.workflowId,company,research_window:pack?.research_window||{},artifacts,legacy:true,original_status:exec.status},exec.status));
 const pdf=first('Extract from File');
 if(pdf?.text){const hash=crypto.createHash('sha256').update(pdf.text).digest('hex');if(!docs.has(hash)){docs.add(hash);memory.push(row('document-'+hash,companies[0],time,'source_document','Uploaded annual report — extracted text',{sha256:hash,text:pdf.text,document_metadata:pdf.info||{},origin_execution:exec.id},'archived'));}}
}
db.close();fs.writeFileSync('/tmp/legacy-research-memory.json',JSON.stringify(memory));
console.log(JSON.stringify({research_records:memory.filter(r=>r.record_type==='legacy_research').length,source_documents:docs.size,total_rows:memory.length,payload_bytes:Buffer.byteLength(JSON.stringify(memory))}));
