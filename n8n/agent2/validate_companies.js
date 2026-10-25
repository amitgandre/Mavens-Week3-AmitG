const input=$input.first().json;
let companies;
if(Object.hasOwn(input,'companies_for_agent2')) {
  if(input.approved!==true||!Array.isArray(input.companies_for_agent2))
    throw new Error('Agent 1 must be approved before company research');
  companies=input.companies_for_agent2.map(c=>c.company);
} else {
  const names=input.company_names??input['Company names'];
  if(typeof names!=='string'||!names.trim())
    throw new Error('No company names received. Start Company Research Form, open its Test URL, enter a company, and click Submit.');
  companies=names.split(/[,\n]+/).map(s=>s.trim()).filter(Boolean);
}
companies=[...new Map(companies.map(c=>[String(c).toLowerCase(),c])).values()];
if(!companies.length||companies.length>6)throw new Error('Enter between one and six companies');
if(companies.some(c=>typeof c!=='string'||c.length<2||c.length>120||Array.from(c).some(ch=>ch.charCodeAt(0)<32||ch.charCodeAt(0)===34||ch.charCodeAt(0)===92)))
  throw new Error('Use plain company names');
return [{json:{companies,window_start:input.research_window?.start||'',window_end:input.research_window?.end||'',results_per_query:5}}];
