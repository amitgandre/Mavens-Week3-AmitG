// Local AI suggests search terms only. Headlines and links always come from search results.
function aiSearchPlan(context,modelResult) {
  const jobs=buildSearchJobs(context),allowed=new Map(context.companies.map(c=>[c.toLowerCase(),c]));
  const extras=[],seen=new Set();
  const ideas=modelResult?.output?.searches||modelResult?.searches||[];
  const add=(day,n)=>new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
  for(const idea of Number(context.max_queries_per_company||2)>4&&Array.isArray(ideas)?ideas:[]) {
    const company=allowed.get(String(idea.company||'').trim().toLowerCase());
    const terms=String(idea.terms||'').replace(/[\r\n\t]/g,' ').replace(/\s+/g,' ').trim();
    if(!company||seen.has(company)||terms.length<8||terms.length>180||/https?:|(?:site|before|after|inurl|filetype):|(?:home|personal)\s+(?:address|phone)|password\s+dump|doxx|leaked\s+credentials/i.test(terms))continue;
    seen.add(company);extras.push({job_id:'ai-'+(extras.length+1),company,topic:'ai_discovery',engine:'google',
      query:'"'+company+'" '+terms+' after:'+add(context.window_start,-1)+' before:'+add(context.window_end,1),
      window_start:context.window_start,window_end:context.window_end,query_origin:'local_ollama_suggestion'});
  }
  const planning={provider:'local_ollama',model:'gemma4:12b',status:extras.length?'applied':'core_search_fallback',
    additional_queries:extras.length,companies_without_extra_query:context.companies.filter(c=>!seen.has(c)),
    error:modelResult?.error||null,note:'AI suggestions are query ideas, not factual findings.'};
  return {jobs:[...jobs,...extras],planning};
}
function headlineFeed(pack) {
  const records=[...(pack.evidence_records||[]),...(pack.review_queue||[])];
  const allowedReasons=new Set(['title_only_or_insufficient_excerpt']);
  const candidates=[],undated=[];
  const key=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
  for(const r of records) {
    if(!r.title||!r.source_url||r.source_type==='job_ad'||/\/(?:jobs?|careers)\//i.test(r.source_url))continue;
    // Snippet-only company mentions can describe a former employee at another firm.
    if(!key(r.title).includes(key(r.company)))continue;
    const reasons=r.review_reasons||[];
    const h={company:r.company,headline:r.title,source:r.publisher||r.source_url.match(/^https?:\/\/([^/]+)/i)?.[1]||'Public source',
      publication_date:r.publication_date,source_url:r.source_url,source_id:r.source_id,
      date_verification:'search_metadata_only',other_sources:[]};
    if(!r.publication_date){
      if(reasons.every(x=>allowedReasons.has(x)||['missing_or_ambiguous_date','relative_date_needs_review'].includes(x)))undated.push(h);
      continue;
    }
    if(r.publication_date<pack.research_window.start||r.publication_date>pack.research_window.end||reasons.some(x=>!allowedReasons.has(x)))continue;
    candidates.push(h);
  }
  candidates.sort((a,b)=>b.publication_date.localeCompare(a.publication_date)||a.source_url.localeCompare(b.source_url));
  const unique=[],titles=new Map();
  for(const h of candidates){const titleKey=h.company.toLowerCase()+'|'+key(h.headline);
    if(titles.has(titleKey)){titles.get(titleKey).other_sources.push({source:h.source,source_url:h.source_url});continue;}
    titles.set(titleKey,h);unique.push(h);}
  const selected=[];
  for(const company of pack.companies){const list=unique.filter(h=>h.company===company),domains=new Map(),picked=new Set();
    for(const allowance of [1,2])for(const h of list){const domain=h.source_url.match(/^https?:\/\/([^/]+)/i)?.[1]||h.source;
      if(picked.has(h.source_id)||(domains.get(domain)||0)>=allowance||picked.size>=12)continue;
      picked.add(h.source_id);domains.set(domain,(domains.get(domain)||0)+1);selected.push(h);}}
  const markdown=pack.companies.map(company=>{const hs=selected.filter(h=>h.company===company);
    return '**'+company+'**\n'+(hs.length?hs.map(h=>'- ['+h.headline.replace(/[\[\]]/g,'')+'](<'+h.source_url.replace(/[<>]/g,c=>encodeURIComponent(c))+'>) — '+h.source+' · '+h.publication_date).join('\n'):'No dated IT/cybersecurity headlines found in the supplied search results.');}).join('\n\n');
  return {headlines:selected,headline_markdown:markdown,undated_headlines:undated,
    headline_statistics:{dated_headlines:selected.length,undated_candidates:undated.length,
      source_domains:new Set(selected.map(h=>h.source_url.match(/^https?:\/\/([^/]+)/i)?.[1])).size},
    headline_note:'Titles and URLs are copied from public search results. Dates are search metadata; undated results are kept separately. Job ads are excluded from this headline feed.'};
}
