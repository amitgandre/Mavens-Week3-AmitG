// Public professional background only. Model outputs are candidates, never independent evidence.
const bgKey=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const SEC_SCHOOLS=[['University of Alabama',['University of Alabama']],['University of Arkansas',['University of Arkansas']],['Auburn University',['Auburn University']],['University of Florida',['University of Florida']],['University of Georgia',['University of Georgia']],['University of Kentucky',['University of Kentucky']],['Louisiana State University',['Louisiana State University','LSU']],['University of Mississippi',['University of Mississippi','Ole Miss']],['Mississippi State University',['Mississippi State University']],['University of Missouri',['University of Missouri']],['University of Oklahoma',['University of Oklahoma']],['University of South Carolina',['University of South Carolina']],['University of Tennessee',['University of Tennessee']],['University of Texas at Austin',['University of Texas at Austin','University of Texas, Austin']],['Texas A&M University',['Texas A&M University','Texas A and M University']],['Vanderbilt University',['Vanderbilt University']]];
const FIRMS=[['Deloitte',['Deloitte','Deloitte Consulting']],['KPMG',['KPMG']],['EY',['Ernst & Young','Ernst and Young','EY']]];
function bgInput(input) {
 const name=String(input.person_name||input['Person name']||'').trim(),company=String(input.company_name||input['Company name']||'').trim();
 for(const [label,value] of [['person',name],['company',company]])if(value.length<3||value.length>120||/[\n\r"\\<>:]/.test(value)||/\b(?:password|address|phone|doxx|ssn)\b/i.test(value))throw Error('Enter a plain professional '+label+' name');
 if(name.split(/\s+/).length<2)throw Error('Enter the person’s full name to reduce mistaken identity');
 return {person_name:name,company_name:company,company_key:bgKey(company),retrieved_at:new Date().toISOString()};
}
function bgJobs(context){return [{...context,job_id:'bg-1',topic:'linkedin_public',query:'site:linkedin.com/in/ "'+context.person_name+'" "'+context.company_name+'"'}];}
function bgCollect(context,jobs,responses){
 const sources=[],review=[],failures=[],seen=new Map();
 const companyAliases=[context.company_name,...(/^(?:procter.*gamble|p&g)$/i.test(context.company_name)?['P&G','Procter & Gamble']:[])].map(bgKey);
 for(let i=0;i<responses.length;i++){
  const response=responses[i],job=jobs.find(j=>j.query===response.search_parameters?.q)||jobs[i];
  if(response.error||!Array.isArray(response.organic_results)){failures.push({topic:job?.topic||'unknown',error:String(response.error?.message||response.error||'No organic result list')});continue;}
  for(const r of response.organic_results.slice(0,6)){
   const url=canonicalUrl(r.link);if(!url)continue;if(seen.has(url)){const existing=seen.get(url);if(job?.topic&&!existing.search_topics.includes(job.topic))existing.search_topics.push(job.topic);continue;}
   const host=url.match(/^https?:\/\/([^/]+)/i)[1];
   if(/(?:signalhire|rocketreach|zoominfo|contactout|apollo\.io|lusha|whitepages|spokeo|beenverified|peoplefinders|theorg\.com\/.*contact)/i.test(host)||/email|phone number|contact details/i.test(r.title||''))continue;
   const title=String(r.title||''),snippet=String(r.snippet||'').slice(0,2200),text=title+'\n'+snippet;
   const linkedProfile=/(?:^|\.)linkedin\.com$/i.test(host)&&/^https?:\/\/[^/]+\/in\//i.test(url);
   const reasons=[];if(job?.topic==='linkedin_public'&&!linkedProfile)reasons.push('Dedicated LinkedIn query returned a non-profile result');if(!bgKey(text).includes(bgKey(context.person_name)))reasons.push('Full person name not present');
   if(!companyAliases.some(a=>bgKey(text).includes(a)))reasons.push('Company context missing; identity needs review');
   if(!snippet.trim())reasons.push('No supporting excerpt');
   const record={source_id:sourceId(context.person_name,url),source_url:url,title,evidence_text:text,publication_date:r.date||'not found',retrieved_at:context.retrieved_at,evidence_level:'search_snippet',full_article_retrieved:false,review_reasons:reasons,source_type:linkedProfile?'linkedin_search_snippet':'public_search_result',search_topics:job?.topic?[job.topic]:[],profile_page_retrieved:false};
   seen.set(url,record);
   (reasons.length?review:sources).push(record);
  }
 }
 return {...context,sources,review_queue:review,search_failures:failures,search_count:jobs.length,identity_note:'Sources require full name and company context; name matches alone are not accepted. Same-name ambiguity still requires review.'};
}
function bgValidate(pack,raw){
 const data=raw?.output||raw||{},accepted=[],rejected=[];const clean=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
 for(const claim of Array.isArray(data.claims)?data.claims:[]){
  const source=pack.sources.find(s=>s.source_id===claim.source_id),problems=[];
  const quote=clean(claim.evidence_excerpt),type=claim.category;
  if(/@|\b(?:wife|husband|children|spouse|home address|phone|birthplace|religion|political)\b/i.test(claim.statement||''))problems.push('Outside professional research scope');
  if(!source||claim.source_url!==source.source_url)problems.push('Source reference mismatch');
  if(!quote||quote==='not found'||!source||!clean(source.evidence_text).includes(quote))problems.push('Unsupported evidence quotation');
  if(!['professional_role','prior_firm','education'].includes(type))problems.push('Unsupported background category');
  if(/\b(?:may|might|could|perhaps|rumou?r|unconfirmed)\b/.test(quote))problems.push('Speculative evidence');
  let match=null;
  if(type==='prior_firm'){
   match=FIRMS.find(([name,aliases])=>bgKey(claim.organization)===bgKey(name)&&aliases.some(a=>new RegExp('\\b'+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(quote)));
   if(!match||!/\b(?:worked|working|joined|career|served|consultant|manager|partner|employment|employed|auditor|director|at deloitte|at kpmg|at ernst|at ey)\b/.test(quote))problems.push('Explicit employment at requested firm not established');
   if(/\b(?:award|awards|panel|sponsored|speaker|conference)\b/.test(quote)&&!/\b(?:worked at|employed by|joined|served at)\b/.test(quote))problems.push('Award or event association is not employment');
   if(/\b(?:client|customer|vendor|partnership|advises|advised)\b/.test(quote)&&!/\b(?:worked at|employed by|joined|served at)\b/.test(quote))problems.push('Client/vendor relationship is not employment');
  }
  if(type==='education'){
   if(!/\b(?:degree|graduate|graduated|alumn|bachelor|master|mba|phd|education|studied|attended|earned|holds)\w*\b/.test(quote))problems.push('Attendance or education relationship not established');
   if(!bgKey(quote).includes(bgKey(claim.organization)))problems.push('Named institution absent from quotation');
   if(/\b(?:spoke|speaker|sponsor|sponsored|conference|client|recruiter)\b/.test(quote)&&!/\b(?:graduated|earned|degree|studied|attended as a student)\b/.test(quote))problems.push('Speaking or business relationship is not attendance');
   if(/\bhonorary\b/.test(quote))problems.push('Honorary degree does not establish attendance');
   if(/university of alabama (?:at )?(?:birmingham|huntsville)|university of tennessee (?:at )?(?:chattanooga|martin)|university of missouri[ -](?:st\.? louis|kansas city)|lsu (?:shreveport|alexandria)|louisiana state university (?:at )?(?:shreveport|alexandria)/i.test(quote))problems.push('Separate campus cannot establish SEC school attendance');
   match=SEC_SCHOOLS.find(([name,aliases])=>aliases.some(a=>bgKey(a)===bgKey(claim.organization)));
  }
  if(type==='professional_role'&&(!claim.organization||!bgKey(quote).includes(bgKey(claim.organization))||!/\b(?:chief|officer|director|president|head|manager|partner|cio|ciso|cto|leads?|led|appointed|joined|serves?|served)\b/.test(quote)))problems.push('Explicit professional role not established');
  const value={...claim,evidence_level:'search_snippet',verification_status:'needs_original_source_verification',sec_school:type==='education'?(match?match[0]:null):null,sec_membership_basis:type==='education'?'Current SEC member school list as of 2026-10-25; does not establish sports participation or membership at time of attendance':null};
  (problems.length?rejected:accepted).push(problems.length?{...value,rejection_reasons:problems}:value);
 }
 const unique=[...new Map(accepted.map(c=>[[c.category,bgKey(c.organization),bgKey(c.statement),c.source_id].join('|'),c])).values()];
 const firmMatches=unique.filter(c=>c.category==='prior_firm'),education=unique.filter(c=>c.category==='education');
 const profile={agent:4,...pack,analysis_status:data.error||raw?.error?'failed':'complete',error:data.error||raw?.error||null,claims:unique,rejected_claims:rejected,
  linkedin_profiles:pack.sources.filter(s=>s.source_type==='linkedin_search_snippet').map(s=>({person_name:pack.person_name,source_id:s.source_id,source_url:s.source_url,title:s.title,evidence_level:'search_snippet',profile_page_retrieved:false,verification_status:'needs_profile_verification'})),
  requested_firm_experience:{status:firmMatches.length?'supported_by_snippet':'not found',matches:firmMatches},sec_education:{status:education.some(c=>c.sec_school)?'supported_by_snippet':'not found',matches:education.filter(c=>c.sec_school)},
  limitations:['Public professional background only; no contact details, family information, personal addresses, or private data collected.','Search snippets are preliminary evidence; current roles, employment and education need original-source verification.','Not found means insufficient supplied evidence, not proof of no experience or attendance.','Background research is historical and is not restricted to the three-month news window.','SEC attendance does not imply playing football or any other sport.']};
 profile.background_markdown='**'+pack.person_name+' — '+pack.company_name+'**\n'+(unique.length?unique.map(c=>'- '+c.statement+' — ['+c.organization+'](<'+c.source_url+'>) · needs source verification').join('\n'):'No supported professional background claims found in the supplied excerpts.');
 if(profile.linkedin_profiles.length)profile.background_markdown+='\n\nPublic LinkedIn search results:\n'+profile.linkedin_profiles.map(p=>'- ['+p.title.replace(/[\[\]]/g,'')+'](<'+p.source_url+'>) · search snippet only').join('\n');
 return profile;
}
