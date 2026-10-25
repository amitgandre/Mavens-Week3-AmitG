function mergeSearchRecovery(original,recovered,noResultJobs,retryCount){
 const seen=new Map([...original.evidence_records,...original.review_queue].map(r=>[r.source_id,JSON.parse(JSON.stringify(r))]));
 for(const r of [...recovered.evidence_records,...recovered.review_queue]){
  if(!seen.has(r.source_id)){seen.set(r.source_id,r);continue;}
  const old=seen.get(r.source_id);old.topics=[...new Set([...old.topics,...r.topics])];old.provenance=[...old.provenance,...r.provenance];
  if(old.publication_date&&r.publication_date&&old.publication_date!==r.publication_date){old.review_reasons=[...new Set([...old.review_reasons,'conflicting_publication_dates'])];old.eligible_for_agent3=false;}
 }
 const all=[...seen.values()],ready=all.filter(r=>r.eligible_for_agent3),review=all.filter(r=>!r.eligible_for_agent3);
 const searches=new Map(original.searches.map(s=>[s.job_id,s]));for(const s of [...recovered.searches,...noResultJobs])searches.set(s.job_id,s);
 const succeeded=new Set(searches.keys());const failures=[...original.failed_searches.filter(f=>!succeeded.has(f.job_id)&&!recovered.failed_searches.some(v=>v.job_id===f.job_id)),...recovered.failed_searches];
 const merged={...original,retrieved_at:recovered.retrieved_at,status:failures.length?'partial':'collected',searches:[...searches.values()],failed_searches:failures,evidence_records:ready,review_queue:review,dropped_results:[...original.dropped_results,...recovered.dropped_results],
  coverage:original.companies.map(company=>({company,searches:[...searches.values()].filter(s=>s.company===company).length,failed_searches:failures.filter(f=>f.company===company).length,records:all.filter(r=>r.company===company).length,ready_records:ready.filter(r=>r.company===company).length,topics:['cybersecurity','leadership','contracts','technology'].map(topic=>({topic,results:all.filter(r=>r.company===company&&r.topics.includes(topic)).length})),status:failures.some(f=>f.company===company)?'search_incomplete':all.some(r=>r.company===company)?'results_collected':'no_results_found'})),
  statistics:{...original.statistics,queries_succeeded:searches.size,queries_failed:failures.length,unique_sources:all.length,ready_for_agent3:ready.length,needs_review:review.length},search_recovery:{original_failed_queries:original.failed_searches.length,retry_queries:retryCount,zero_results_reclassified:noResultJobs.length,remaining_failures:failures.length,prior_retrieved_at:original.retrieved_at}};
 const readyIds=new Set(ready.map(r=>r.source_id));merged.analysis_results=(original.analysis_results||[]).filter(a=>readyIds.has(a.source_id));
 merged.prior_analyses_held_for_review=(original.analysis_results||[]).filter(a=>!readyIds.has(a.source_id));
 const analyzed=new Set(merged.analysis_results.filter(a=>a.analysis_status==='complete').map(a=>a.source_id));
 return {research:merged,to_analyze:ready.filter(r=>!analyzed.has(r.source_id))};
}
