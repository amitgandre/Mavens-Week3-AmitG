// Pure collection logic. No network requests and no model-generated facts.
function validDay(value) {
  const s=String(value||'');
  return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
}
function canonicalUrl(value) {
  const s=String(value||'').trim();
  const m=s.match(/^https?:\/\/([^\s/?#]+)([^#]*)/i);
  if(!m||m[1].includes('@')||m[1].includes(':'))return null;
  const host=m[1].toLowerCase();
  if(!host.includes('.')||/^(?:localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)||/^172\.(?:1[6-9]|2\d|3[01])\./.test(host)||/\.(?:local|internal)$/.test(host))return null;
  const [path,query='']=m[2].split('?');
  const clean=query.split('&').filter(Boolean).filter(p=>!/^(?:utm_[^=]*|gclid|fbclid|mc_cid|mc_eid)=/i.test(p)).sort().join('&');
  return (s.toLowerCase().startsWith('https:')?'https://':'http://')+host+(path||'/').replace(/\/$/,'')+(clean?'?'+clean:'');
}
function sourceId(company,url) {
  const input=company.toLowerCase()+'|'+url; let hash=2166136261;
  for(let i=0;i<input.length;i++)hash=Math.imul(hash^input.charCodeAt(i),16777619)>>>0;
  return 'src-'+hash.toString(16).padStart(8,'0');
}
function publicationDate(result, retrievedAt) {
  const raw=result.iso_date||result.publication_date||result.date||'';
  if(validDay(raw))return {date:raw,status:'explicit_date_metadata',raw};
  const iso=/^\d{4}-\d{2}-\d{2}T/.test(raw);
  const named=/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b.*\b20\d{2}\b/i.test(raw);
  const us=/^\d{2}\/\d{2}\/20\d{2},/.test(raw);
  if((iso||named||us)&&Number.isFinite(Date.parse(raw))){
    const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(raw));
    return {date,status:'explicit_date_metadata',raw};
  }
  const relative=String(raw).match(/^(\d+)\s+(hour|day|week|month|minute)s?\s+ago$/i);
  return {date:null,status:relative?'relative_date_needs_review':'missing_or_ambiguous_date',raw};
}
function buildSearchJobs(context) {
  if(!validDay(context.window_start)||!validDay(context.window_end)||context.window_start>context.window_end)
    throw new Error('Research dates must be valid YYYY-MM-DD values in order');
  const add=(day,n)=>new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
  const topics=Number(context.max_queries_per_company||2)<=2?[
    ['cybersecurity','(cybersecurity OR "information security" OR ransomware OR "cyber incident")'],
    ['web_it_signals','(CIO OR CISO OR CTO OR technology OR cloud) (appointed OR contract OR partnership OR deploys OR adopts)']
  ]:[
    ['cybersecurity','(cybersecurity OR "information security" OR "cyber incident" OR ransomware)'],
    ['leadership','(CIO OR CISO OR "chief information officer" OR "chief information security officer") (appointed OR joins OR departure OR named)'],
    ['contracts','("IT services" OR cybersecurity OR "security operations") (contract OR agreement OR partnership)'],
    ['technology','(cloud OR identity OR endpoint OR "OT security" OR SIEM) (deploys OR adopts OR pilot OR implementation)']
  ];
  const jobs=[];
  for(const company of context.companies)for(const [topic,terms] of topics) {
    const engine=topic==='cybersecurity'?'google_news':'google';
    jobs.push({job_id:'job-'+(jobs.length+1),company,topic,engine,
      query:'"'+company+'" '+terms+' after:'+add(context.window_start,-1)+' before:'+add(context.window_end,1),
      window_start:context.window_start,window_end:context.window_end});
  }
  return jobs;
}
function collectEvidence(context,jobs,responses) {
  const records=new Map(), failures=[],searches=[],dropped=[];
  const key=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const alias=company=>key(company.replace(/^the\s+/i,'').replace(/\b(?:company|corporation|corp|incorporated|inc|ltd|limited|plc)\b\.?/gi,''));
  function put(result,job,supplement=false) {
    const url=canonicalUrl(result.link||result.source_url);
    if(!url){dropped.push({company:job.company,reason:'Unsupported public source URL',title:result.title||''});return;}
    const title=String(result.title||'').trim();
    let body=String(supplement?result.evidence_text||'':result.snippet||result.description||'').trim();
    const rawSnippet=body;const ellipsis=body.search(/\.{3}|…/);
    if(!supplement&&ellipsis>=0&&(body.slice(0,ellipsis).match(/[·›]/g)||[]).length>=2)
      body=body.slice(ellipsis+(body[ellipsis]==='…'?1:3)).trim();
    const date=publicationDate(result,context.retrieved_at);
    const publisher=typeof result.source==='object'?result.source?.name||result.source?.title||'':result.source||result.publisher||'';
    const text=(title+' '+body+' '+publisher+' '+url);
    const nameMatch=alias(job.company).length>2&&key(text).includes(alias(job.company));
    const topicMatch=/\b(?:cyber\w*|security|ransomware|CIO|CISO|CTO|cloud|artificial intelligence|AI|machine learning|Microsoft|Azure|AWS|SAP|Salesforce|ServiceNow|identity|endpoint|SIEM|SOC|network|digital|technology|software|data platform|data center|information systems|information technology|IT services|chief information officer)\b/i.test(title+' '+body)||/\bIT\b/.test(title+' '+body);
    const issues=[];
    if(!date.date)issues.push(date.status);
    else if(date.date<context.window_start||date.date>context.window_end)issues.push('outside_research_window');
    if(!supplement&&!nameMatch)issues.push('company_match_needs_review');
    if(!supplement&&!topicMatch)issues.push('IT_cybersecurity_relevance_needs_review');
    if(body.length<20)issues.push('title_only_or_insufficient_excerpt');
    const evidenceLevel=supplement?'user_supplied_public_excerpt':body?'search_snippet':'search_title_only';
    const r={company:job.company,source_id:sourceId(job.company,url),source_url:url,title,publisher,
      publication_date:date.date,date_status:date.status,date_as_returned:date.raw,
      retrieved_at:context.retrieved_at,event_date:null,evidence_level:evidenceLevel,
      source_type:/\/(?:jobs?|careers)\//i.test(url)?'job_ad':'public_search_result',
      full_article_retrieved:false,source_publication_verified:false,
      snippet_cleaning:rawSnippet!==body?'navigation_prefix_removed':'none',
      evidence_text:body?title+'\n'+body:title,
      topics:[job.topic],provenance:[{job_id:job.job_id,engine:job.engine,query:job.query||''}],
      review_reasons:issues,eligible_for_agent3:issues.length===0,company_match:nameMatch?'lexical_only':'unconfirmed'};
    const id=job.company.toLowerCase()+'|'+url;
    if(records.has(id)) {
      const prior=records.get(id); const best=r.evidence_text.length>prior.evidence_text.length?r:prior;
      const other=best===r?prior:r;
      const merged={...best,topics:[...new Set([...prior.topics,...r.topics])],provenance:[...prior.provenance,...r.provenance]};
      if(!merged.publication_date&&other.publication_date){merged.publication_date=other.publication_date;merged.date_status=other.date_status;
        merged.review_reasons=merged.review_reasons.filter(s=>!['missing_or_ambiguous_date','relative_date_needs_review'].includes(s));}
      if(prior.publication_date&&r.publication_date&&prior.publication_date!==r.publication_date)
        merged.review_reasons=[...new Set([...merged.review_reasons,'conflicting_publication_dates'])];
      if(prior.review_reasons.includes('conflicting_publication_dates'))merged.review_reasons.push('conflicting_publication_dates');
      if(merged.publication_date&&(merged.publication_date<context.window_start||merged.publication_date>context.window_end))
        merged.review_reasons.push('outside_research_window');
      merged.review_reasons=[...new Set(merged.review_reasons)];
      merged.eligible_for_agent3=merged.review_reasons.length===0;
      records.set(id,merged);
    } else records.set(id,r);
  }
  for(let i=0;i<responses.length;i++) {
    const response=responses[i];const job=jobs.find(j=>j.query===response.search_parameters?.q)||response._job;
    if(!job){failures.push({job_id:null,error:'Search result could not be linked to its input query'});continue;}
    if(response.error){const message=typeof response.error==='string'?response.error:response.error?.message||'Search failed';if(/^(?:Google(?: News)? hasn.t returned any results for this query\.?|No results found for this query\.?)$/i.test(message.trim())){searches.push({...job,result_count:0,retained_result_count:0,status:'no_results_found'});continue;}failures.push({job_id:job.job_id,company:job.company,topic:job.topic,engine:job.engine,error:message});continue;}
    const flat=[];
    function walk(list){for(const r of list||[]){if(r.link)flat.push(r);if(r.stories)walk(r.stories);if(r.highlight)walk([r.highlight]);}}
    walk(response.organic_results||response.news_results||[]);
    searches.push({...job,result_count:flat.length,retained_result_count:Math.min(flat.length,context.results_per_query)});
    for(const r of flat.slice(0,context.results_per_query))put(r,job);
  }
  const completed=new Set([...searches.map(s=>s.job_id),...failures.map(f=>f.job_id)]);
  for(const job of jobs)if(!completed.has(job.job_id))failures.push({...job,error:'Search response missing'});
  for(const r of context.supplemental_evidence||[]) {
    if(!context.companies.includes(r.company))continue;
    put(r,{company:r.company,topic:'supplemental',job_id:'manual',engine:'user_public_excerpt'},true);
  }
  const all=[...records.values()];
  const titleGroups=new Map();
  for(const r of all){const t=key(r.title);if(t.length<20)continue;const k=r.company+'|'+t;
    if(!titleGroups.has(k))titleGroups.set(k,[]);titleGroups.get(k).push(r.source_id);}
  for(const r of all){r.possible_syndication_ids=titleGroups.get(r.company+'|'+key(r.title))||[];}
  const ready=all.filter(r=>r.eligible_for_agent3).sort((a,b)=>b.publication_date.localeCompare(a.publication_date)||a.source_id.localeCompare(b.source_id));
  const review=all.filter(r=>!r.eligible_for_agent3);
  const coverage=context.companies.map(company=>({company,searches:searches.filter(s=>s.company===company).length,
    failed_searches:failures.filter(s=>s.company===company).length,records:all.filter(r=>r.company===company).length,
    ready_records:ready.filter(r=>r.company===company).length,
    topics:['cybersecurity','leadership','contracts','technology'].map(topic=>({topic,results:all.filter(r=>r.company===company&&r.topics.includes(topic)).length})),
    status:failures.some(f=>f.company===company)?'search_incomplete':all.some(r=>r.company===company)?'results_collected':'no_results_found'}));
  return {agent:2,status:failures.length?'partial':'collected',companies:context.companies,
    research_window:{start:context.window_start,end:context.window_end},retrieved_at:context.retrieved_at,
    coverage,searches,failed_searches:failures,evidence_records:ready,review_queue:review,dropped_results:dropped,
    statistics:{queries_planned:jobs.length,queries_succeeded:searches.length,queries_failed:failures.length,
      unique_sources:all.length,ready_for_agent3:ready.length,needs_review:review.length},
    analyze_with_agent3:context.analyze_with_agent3,max_analysis_records:context.max_analysis_records,
    limitations:['Search titles/snippets are public search evidence, not retrieved full articles.',
      'Dates come from search metadata or user-provided evidence and need original-source verification.',
      'Unknown dates, out-of-window results, weak company matches, and title-only records are held for review.',
      'Event dates are deliberately left unknown for Agent 3 to extract from evidence.',
      'Job advertisements are hiring evidence, not proof of deployed technology or leadership appointments.',
      'No login automation, private data access, scanning, or direct site-fetch requests are performed.']};
}
