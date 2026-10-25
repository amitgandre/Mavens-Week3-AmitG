function makeBriefing(peerBriefing,research,history,runId,runTime,mode='research',leaderRows=[]) {
  if(mode==='research'&&peerBriefing?.approved!==true)throw new Error('Peer research requires an approved briefing');
  const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const company=peerBriefing?.company||research.companies?.[0]||'Company research';
  const companyKey=normalize(company);
  const snapshots=history.filter(r=>r.company_key===companyKey&&r.record_type===(mode==='preview'?'research_preview':'research_snapshot'))
    .sort((a,b)=>String(b.run_time).localeCompare(String(a.run_time)));
  let previous=null;for(const row of snapshots){try{previous=JSON.parse(row.payload_json);break;}catch{}}
  const records=research.evidence_records||[];
  const analyses=research.analysis_results||[];
  const signals=analyses.flatMap(a=>(a.signals||[]).map(s=>({...s,company:a.company,evidence_level:a.evidence_level,publication_date:a.publication_date})));
  const identity=s=>[s.company,s.source_url,s.category,s.person,s.vendor_or_technology].map(normalize).join('|');
  const priorSignals=new Map((previous?.signals||[]).map(s=>[identity(s),s]));
  const changed=[],newSignals=[];
  for(const s of signals){const old=priorSignals.get(identity(s));if(!old)newSignals.push(s);
    else if(['status','summary','effective_date','contract_value'].some(k=>s[k]!==old[k]))changed.push({before:old,after:s});}
  const sources=new Map();
  function source(url,title,date,level){if(!url||!/^https?:\/\//.test(url))return;
    if(!sources.has(url))sources.set(url,{id:'S'+String(sources.size+1).padStart(3,'0'),url,title:title||url,date:date||'not found',level:level||'public evidence'});}
  const financialEvidenceLevel=peerBriefing?.review?.approval_mode==='user_authorized_automatic'?'automated financial checks; original-source verification pending':'human-reviewed financial evidence';
  source(peerBriefing?.target?.source_url,'Target annual revenue',peerBriefing?.target?.fiscal_year,financialEvidenceLevel);
  for(const p of peerBriefing?.selected_peers||[])source(p.source_url,p.company+' revenue',p.fiscal_year,financialEvidenceLevel);
  for(const r of [...records,...(research.review_queue||[])])source(r.source_url,r.title,r.publication_date,r.evidence_level);
  for(const s of signals){source(s.source_url,s.summary,s.publication_date,s.evidence_level);s.citation_id=sources.get(s.source_url)?.id||'unresolved';}
  const priorSourceUrls=new Set((previous?.sources||[]).map(s=>s.url));
  const companies=research.companies||[company,...(peerBriefing?.selected_peers||[]).map(p=>p.company)];
  const leadership=[];
  const leaderCompanies=new Set(companies.map(normalize));
  const seenLeaders=new Set();
  for(const row of [...leaderRows].sort((a,b)=>String(b.run_time).localeCompare(String(a.run_time)))){
    if(row.record_type!=='leadership_background'||!leaderCompanies.has(normalize(row.company_key))||seenLeaders.has(row.company_key))continue;
    try{const saved=JSON.parse(row.payload_json);seenLeaders.add(row.company_key);
      for(const r of saved.discovery_sources||[])source(r.source_url,r.title,r.publication_date,'saved leader search snippet');
      for(const profile of saved.profiles||[])for(const link of profile.linkedin_profiles||[])source(link.source_url,profile.person_name+' — public LinkedIn search result','not found','public LinkedIn search snippet');
      for(const profile of saved.profiles||[])for(const c of profile.claims||[]){source(c.source_url,c.statement,'not found','saved background search snippet');c.citation_id=sources.get(c.source_url)?.id||'unresolved';}
      leadership.push({...saved,saved_run_id:row.run_id,saved_at:row.run_time,background_note:'Saved historical background, not fresh or independently verified current-role evidence.'});
    }catch{ /* Malformed old memory is not reused as evidence. */ }
  }
  return {schema_version:1,mode,leadership_background:leadership,leadership_missing:companies.filter(c=>!leadership.some(p=>normalize(p.company_name)===normalize(c))),run_id:runId,run_time:runTime,research_date:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(runTime)),company,company_key:companyKey,
    sector:peerBriefing?.sector||'not specified',geography:peerBriefing?.geography||'not specified',
    research_window:research.research_window||peerBriefing?.research_window||{},
    peer_selection:peerBriefing||null,companies,signals,sources:[...sources.values()],
    coverage:research.coverage||[],statistics:research.statistics||{},analysis_statistics:research.analysis_statistics||{},
    company_findings:companies.map(name=>({company:name,signals:signals.filter(s=>normalize(s.company)===normalize(name)),
      coverage:(research.coverage||[]).find(c=>normalize(c.company)===normalize(name))||null})),
    memory:{prior_snapshot_count:snapshots.length,previous_run_id:previous?.run_id||null,previous_run_time:previous?.run_time||null,
      newly_observed_sources:[...sources.values()].filter(s=>!priorSourceUrls.has(s.url)).map(s=>s.id),
      new_signals:newSignals,changed_signals:changed,
      note:previous?'Comparison shows differences between saved snapshots, not independently confirmed new events.':'First compiled briefing for this company. Older raw research is retained separately.'},
    gaps:{failed_searches:research.failed_searches||[],review_records:research.review_queue||[],
      rejected_signals:analyses.flatMap(a=>a.rejected_signals||[]),analysis_errors:analyses.filter(a=>a.analysis_status!=='complete')},
    limitations:[...(research.limitations||[]),...(peerBriefing?.limitations||[]),'Source quotations and publication metadata still require original-source verification.',
      'An empty findings list means no supported signal was extracted, not that no cybersecurity activity occurred.',
      'Historical snapshots are comparison material and are not reused as current evidence.'],
    // Preserve the complete collection for future audit and repeatable comparisons.
    research_payload:research};
}
