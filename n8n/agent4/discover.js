const LEADER_ROLES=['CEO','CISO','CTO','CIO'];
function leaderInput(input){const company=String(input.company_name||input['Company name']||'').trim();if(company.length<3||company.length>120||/[\n\r"\\<>:]/.test(company))throw Error('Enter a plain company name');return {company_name:company,company_key:bgKey(company),retrieved_at:new Date().toISOString()};}
function leaderJobs(context){return [{...context,role:'CEO/CIO/CTO',query:'"'+context.company_name+'" (CEO OR CIO OR CTO OR "chief executive officer" OR "chief information officer" OR "chief technology officer") leadership'},{...context,role:'CISO',query:'"'+context.company_name+'" (CISO OR "chief information security officer")'}];}
function leaderCollect(context,jobs,responses){const sources=[],failures=[],seen=new Set();for(let i=0;i<responses.length;i++){const response=responses[i],job=jobs.find(j=>j.query===response.search_parameters?.q)||jobs[i];if(response.error||!Array.isArray(response.organic_results)){failures.push({role:job?.role,error:String(response.error?.message||response.error||'No results')});continue;}for(const r of response.organic_results.slice(0,5)){const url=canonicalUrl(r.link);if(!url||seen.has(url)||/signalhire|rocketreach|zoominfo|contactout|apollo\.io|lusha|whitepages|spokeo|beenverified/i.test(url))continue;seen.add(url);sources.push({source_id:sourceId(context.company_name,url),source_url:url,title:r.title||'',evidence_text:(r.title||'')+'\n'+(r.snippet||''),publication_date:r.date||'not found',queried_role:job?.role,evidence_level:'search_snippet'});}}return {...context,sources,discovery_failures:failures};}
function leaderValidate(pack,raw){const data=raw.output||raw,leaders=[],rejected=[];const clean=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
 for(const candidate of Array.isArray(data.leaders)?data.leaders:[]){const reasons=[],source=pack.sources.find(s=>s.source_id===candidate.source_id);const q=clean(candidate.evidence_excerpt);const fullname=String(candidate.person_name||'').trim();
 if(!LEADER_ROLES.includes(candidate.role)||fullname.split(/\s+/).length<2||!bgKey(q).includes(bgKey(fullname)))reasons.push('Full name and requested role required in evidence');
 if(!source||source.source_url!==candidate.source_url||!clean(source.evidence_text).includes(q)||!q)reasons.push('Unsupported source or quotation');
 if(!bgKey(q).includes(bgKey(pack.company_name))&&!bgKey(source?.evidence_text).includes(bgKey(pack.company_name)))reasons.push('Quotation does not identify target company');
 const patterns={CEO:/\b(?:CEO|chief executive officer)\b/i,CISO:/\b(?:CISO|chief information security officer)\b/i,CTO:/\b(?:CTO|chief technology officer)\b/i,CIO:/\b(?:CIO|chief information officer)\b/i};
 if(!patterns[candidate.role]?.test(q))reasons.push('Role title not supported');
 if(/\b(?:former|previous|ex-|stepped down|retired|departed|left the company|until 20\d\d|previously served)\b/i.test(q))reasons.push('Historical or departed leader cannot be treated as current');
 if(/\b(?:will become|will join|will succeed|incoming|expected to become|plans to appoint)\b/i.test(q))reasons.push('Future or proposed appointment is not a current role');
 if(/\b(?:foods north america|beverages north america|north america|latin america|europe|india|asia pacific|foods u\.?s|beverages u\.?s|regional|division|business unit)\b/i.test(q))reasons.push('Regional/divisional role is not the company-wide requested role');
 if(candidate.status!=='reported_current')reasons.push('Current role not established');
 const result={...candidate,verification_status:'needs_current_role_verification',publication_date:source?.publication_date||'not found'};
 (reasons.length?rejected:leaders).push(reasons.length?{...result,rejection_reasons:reasons}:result);
 }
 // Conflicting candidates remain visible and are never silently chosen as fact.
 const personKey=s=>bgKey(String(s||'').replace(/\b[A-Z]\.?(?=\s)/g,''));
 const roles=LEADER_ROLES.map(role=>{const found=leaders.filter(p=>p.role===role);return {role,status:found.length===0?'not found':new Set(found.map(p=>personKey(p.person_name))).size>1?'conflicting_sources':'source_reported_current',candidates:found};});
 for(const role of roles)for(const candidate of role.candidates){
  const contrary=pack.sources.filter(s=>bgKey(s.evidence_text).includes(bgKey(candidate.person_name))&&bgKey(s.evidence_text).includes(bgKey(pack.company_name))&&patternsForRole(role.role).test(s.evidence_text)&&/\b(?:former|prior to joining|previously served|was the global|was global)\b/i.test(s.evidence_text));
  if(contrary.length){role.status='current_role_disputed';candidate.verification_status='conflicting_historical_or_current_sources';candidate.contrary_evidence=contrary.map(s=>({source_id:s.source_id,source_url:s.source_url,evidence_excerpt:s.evidence_text}));}
 }
 const people=[];for(const item of roles.filter(r=>r.status==='source_reported_current').flatMap(r=>r.candidates)){let p=people.find(p=>personKey(p.person_name)===personKey(item.person_name));if(!p){p={person_name:item.person_name,company_name:pack.company_name,roles:[],role_sources:[],retrieved_at:pack.retrieved_at};people.push(p);}if(!p.roles.includes(item.role))p.roles.push(item.role);p.role_sources.push(item);}
 return {...pack,roles,people,rejected_leaders:rejected,discovery_status:data.error||raw.error?'failed':'complete',discovery_error:data.error||raw.error||null};
}

function reconcileLeaderBackground(discovery,profiles){
 const copy=JSON.parse(JSON.stringify(discovery));
 for(const role of copy.roles){
  for(const candidate of role.candidates){
   const p=profiles.find(p=>bgKey(p.person_name)===bgKey(candidate.person_name));
   const contrary=(p?.claims||[]).filter(c=>{
    const source=p.sources?.find(s=>s.source_id===c.source_id);
    const targetContext=bgKey(c.evidence_excerpt+' '+(source?.evidence_text||'')).includes(bgKey(copy.company_name));
    return c.category==='professional_role'&&bgKey(c.evidence_excerpt).includes(bgKey(candidate.person_name))&&targetContext&&/\b(?:former|retired|departed|previously|lost its|left|moved to)\b/i.test(c.evidence_excerpt);
   });
   if(contrary.length){role.status='current_role_disputed';candidate.verification_status='conflicting_historical_or_current_sources';candidate.contrary_evidence=contrary.map(c=>({source_id:c.source_id,source_url:c.source_url,evidence_excerpt:c.evidence_excerpt}));}
  }
 }
 return copy;
}

function patternsForRole(role){return ({CEO:/\b(?:CEO|chief executive officer)\b/i,CISO:/\b(?:CISO|chief information security officer)\b/i,CTO:/\b(?:CTO|chief technology officer)\b/i,CIO:/\b(?:CIO|chief information officer)\b/i})[role];}
