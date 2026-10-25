const f=$('Validate Research Input').first().json;
const rows=$input.all().map(i=>i.json).filter(r=>r.run_id);
const key=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const canon=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
const domain=url=>String(url||'').match(/^https?:\/\/([^/:?#\s]+)/i)?.[1]?.toLowerCase().replace(/^www\./,'');
const owned=url=>{const h=domain(url);return h&&(h===f.official_domain||h.endsWith('.'+f.official_domain));};
const minimumYear=Number(String(f.window_end).slice(0,4))-1;
const parsed=rows.map(row=>{try{return {row,payload:JSON.parse(row.payload_json)};}catch{return null;}}).filter(Boolean);
const docs=parsed.filter(r=>r.row.record_type==='source_document'&&typeof r.payload.text==='string');
for(const d of docs)for(const r of parsed){
 const records=Object.values(r.payload.artifacts||{}).flat();
 for(const result of records){const target=result.target||result.output||result;
  if(key(target.company)!==key(f['Company Name'])||!owned(target.source_url)||Number(target.fiscal_year)<minimumYear)continue;
  const quote=canon(target.evidence_excerpt);
  if(!quote||quote==='not found'||!canon(d.payload.text).includes(quote))continue;
  return [{json:{has_retained_report:true,text:d.payload.text,source_url:target.source_url,kind:'retained_pdf',document_id:d.row.run_id,retained_at:d.row.run_time,retained_fiscal_year:target.fiscal_year}}];
 }
}
return [{json:{has_retained_report:false}}];
