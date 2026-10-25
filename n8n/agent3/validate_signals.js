const evidence=$('Within research window').all();
const clean=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
return $input.all().map((item,i)=>{
 const source=evidence[i]?.json||evidence[0]?.json;
 if(!source)throw new Error('Original source evidence unavailable');
 const raw=item.json.output||item.json;
 const companyKey=clean(source.company).replace(/[^a-z0-9]/g,'');
 const accepted=[],rejected=[];
 for(const signal of raw.signals||[]) {
  const problems=[];
  if(signal.source_id!==source.source_id||signal.source_url!==source.source_url)problems.push('Source reference mismatch');
  const quote=clean(signal.evidence_excerpt);
  if(!quote||quote==='not found'||!clean(source.evidence_text).includes(quote))problems.push('Unsupported evidence quotation');
  // A company URL/title alone cannot attribute generic advice to the company.
  const quoteKey=quote.replace(/[^a-z0-9]/g,'');
  const employerJob=source.source_type==='job_ad'&&clean(source.evidence_text).replace(/[^a-z0-9]/g,'').includes(companyKey);
  if(!companyKey||(!quoteKey.includes(companyKey)&&!employerJob))problems.push('Quotation does not explicitly connect the finding to the target company');
  if(/\b(?:should|could|might|recommended|recommendation|best practice|the key is|encourages|traditionally)\b/i.test(quote)&&! /\b(?:has deployed|is using|now uses|now builds|has signed|has appointed|announced that)\b/i.test(quote))problems.push('Generic advice or conditional language does not establish a company action');
  if(/^(?:deployed|deployment|usage|in use)$/i.test(signal.status||'')&&!/\b(?:uses?|using|deployed|implemented|operates?|running|now builds|has adopted)\b/i.test(quote))problems.push('Quotation does not establish actual technology use');
  if(signal.contract_value==='not disclosed'&&!/\b(?:undisclosed|not disclosed|not been disclosed|not publicly disclosed)\b/i.test(quote))problems.push('Undisclosed contract value is not explicitly stated');
  if(signal.status==='hiring_signal'&&/\b(?:lay off|layoffs?|laid off|job cuts)\b/i.test(quote))problems.push('Layoffs do not establish a hiring signal');
  if(signal.category==='leadership_change'){
   if(!/\b(?:cyber\w*|security|information officer|information technology|digital|technology|AI|CIO|CTO|CISO|IT)\b/i.test(quote))problems.push('Leadership quotation does not establish an IT/digital/security development');
   const action=/\b(?:taps?|appoints?|appointed|hires?|hired|names?|named|joins?|joined)\b/i.exec(quote);
   const companyText=clean(source.company),position=quote.indexOf(companyText);
   if(action&&position>action.index){const escaped=companyText.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');if(!new RegExp('(?:at|by|for|to|of)\\s+(?:the\\s+)?'+escaped,'i').test(quote.slice(action.index,position+companyText.length)))problems.push('Target company is mentioned as another employer, not established as the appointing company');}
   if(/\b(?:to|and|or|as|of|with)\s*$/i.test(quote))problems.push('Truncated quotation does not establish the claimed role change');
  }
  if(source.source_type==='job_ad'&&['leadership_change','it_security_contract','technology_use'].includes(signal.category))problems.push('Job advertisement does not establish an appointment, contract, or deployment');
  if(source.source_type==='job_ad'&&/^(?:deployed|signed|appointed)$/i.test(signal.status||''))problems.push('Unsupported job-ad conclusion');
  (problems.length?rejected:accepted).push(problems.length?{...signal,rejection_reasons:problems}:signal);
 }
 return {json:{agent:3,company:source.company,source_id:source.source_id,source_url:source.source_url,
  publication_date:source.publication_date,evidence_level:source.evidence_level||'synthetic_test',
  source_type:source.source_type||'test',full_article_retrieved:source.full_article_retrieved===true,
  analysis_status:raw.error?'failed':'complete',error:raw.error||null,signals:accepted,rejected_signals:rejected,
  limitations:source.full_article_retrieved===true?[]:['Analysis uses supplied excerpts; original source verification is still required.']},pairedItem:{item:i}};
});
