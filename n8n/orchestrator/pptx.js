// Editable visual briefing. Charts/cards are native PowerPoint shapes; no external runtime.
function buildPowerPoint(briefing) {
  const E=914400,xml=s=>String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const parts=Object.fromEntries(Object.entries(TEMPLATE).map(([k,v])=>[k,Buffer.from(v,'base64')]));
  const C={navy:'0D1B2E',navy2:'162A43',teal:'20B8A6',mint:'68E2CD',blue:'4B8FE8',paper:'F2F5F9',white:'FFFFFF',ink:'152B43',muted:'60748B',border:'DCE5EF',amber:'B77813',pale:'E8F7F3',warn:'FFF4DF'};
  if(parts['ppt/theme/theme1.xml'])parts['ppt/theme/theme1.xml']=Buffer.from(parts['ppt/theme/theme1.xml'].toString().replace(/<a:hlink>.*?<\/a:hlink>/s,'<a:hlink><a:srgbClr val="20B8A6"/></a:hlink>').replace(/<a:folHlink>.*?<\/a:folHlink>/s,'<a:folHlink><a:srgbClr val="20B8A6"/></a:folHlink>'));
  const pages=[],used=new Set(),sources=briefing.sources||[],sourceMap=new Map(sources.map(s=>[s.url,s]));
  const clip=(s,n)=>String(s||'').length>n?String(s).slice(0,n-1).trim()+'…':String(s||'');
  const human=s=>String(s||'not found').replaceAll('_',' ');
  const key=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const chunks=(items,n)=>Array.from({length:Math.ceil(items.length/n)},(_,i)=>items.slice(i*n,i*n+n));
  function page(title,subtitle='',dark=false){const p={title,subtitle,dark,visual:true,rows:[],elements:[]};pages.push(p);return p;}
  function rect(p,x,y,w,h,fill,line=fill,round=true){p.elements.push({kind:'rect',x,y,w,h,fill,line,round});}
  function text(p,x,y,w,h,value,size=14,color=C.ink,bold=false,link=null,maxLines=null){
    let v=String(value??'');const chars=Math.max(10,Math.floor(w*72/(size*.51)));
    if(maxLines){const limit=Math.floor(chars*maxLines*.94);v=clip(v,limit);}
    p.elements.push({kind:'text',x,y,w,h,text:v,size,color,bold,link});p.rows.push({text:v,link});if(link&&sourceMap.has(link))used.add(sourceMap.get(link).id);
  }
  function pill(p,x,y,w,label,warning=false){rect(p,x,y,w,.25,warning?C.warn:C.pale,warning?C.warn:C.pale);text(p,x+.08,y+.035,w-.16,.19,clip(label,31),9.4,warning?C.amber:'16786D',true);}
  function citation(p,x,y,w,url,label){const s=sourceMap.get(url);if(s)used.add(s.id);text(p,x,y,w,.23,label||s?.id||'Source',10.5,C.teal,true,url);}
  const window=briefing.research_window||{},groups=briefing.company_findings||[],all=briefing.signals||[],leaders=briefing.leadership_background||[];
  const stats=briefing.statistics||{},analysis=briefing.analysis_statistics||{},gaps=briefing.gaps||{},memory=briefing.memory||{};
  const priority={leadership_change:0,it_security_contract:1,cybersecurity_news:2,technology_use:3,technology_mention:4};
  const selected=signals=>[...signals].sort((a,b)=>(priority[a.category]??9)-(priority[b.category]??9)).filter((s,i,arr)=>arr.findIndex(v=>key(v.summary)===key(s.summary))===i).slice(0,3);
  const companyLeaders=name=>leaders.find(p=>key(p.company_name)===key(name));
  function roleLabel(role){if(!role)return 'Not researched';if(role.status==='source_reported_current')return [...new Set((role.candidates||[]).map(c=>c.person_name))].join(', ')||'Not found';if(role.status==='conflicting_sources')return 'Conflicting sources';if(role.status==='current_role_disputed')return 'Current role disputed';return human(role.status);}
  function leaderGrid(p,l,x,y,w,compact=false){
    const roles=['CEO','CISO','CTO','CIO'],gap=.12,cw=(w-gap)/2,ch=compact?.43:.88;
    roles.forEach((name,i)=>{const r=l?.roles?.find(r=>r.role===name),xx=x+(i%2)*(cw+gap),yy=y+Math.floor(i/2)*(ch+.1);rect(p,xx,yy,cw,ch,C.paper);
      if(compact)text(p,xx+.08,yy+.08,cw-.16,.28,name+' · '+clip(roleLabel(r),28),10.8,C.ink,false,null,1);
      else {text(p,xx+.14,yy+.1,cw-.28,.2,name,10,C.teal,true);text(p,xx+.14,yy+.34,cw-.28,.44,roleLabel(r),13.5,C.ink,true,null,2);}
      for(const c of r?.candidates||[])if(sourceMap.has(c.source_url))used.add(sourceMap.get(c.source_url).id);
    });
  }
  function backgroundLines(p,l,x,y,w,compact=false){const profiles=l?.profiles||[];
    const firms=profiles.flatMap(p=>(p.claims||[]).filter(c=>c.category==='prior_firm').map(c=>({...c,person:p.person_name})));
    const schools=profiles.flatMap(p=>(p.claims||[]).filter(c=>c.category==='education'&&c.sec_school).map(c=>({...c,person:p.person_name})));
    if(compact){
      const firm= firms[0],school=schools[0];const label='Prior firms: '+(firm?firm.person+' / '+firm.organization:l?'not found':'not researched')+' · SEC: '+(school?school.sec_school:l?'not found':'not researched');
      text(p,x,y,w,.24,label,10.5,C.ink,false,firm?.source_url,1);
      if(school&&sourceMap.has(school.source_url))used.add(sourceMap.get(school.source_url).id);
      profiles.flatMap(p=>(p.linkedin_profiles||[]).map(l=>({...l,person:p.person_name}))).slice(0,2).forEach((l,i)=>citation(p,x+i*w/2,y+.3,w/2,l.source_url,'LinkedIn · '+clip(l.person,21)));
      return;
    }
    const rows=[['Prior firms',firms],['SEC education',schools]];
    rows.forEach(([label,claims],i)=>{const yy=y+i*(compact?.28:.77),claim=claims[0];
      if(!compact)rect(p,x,yy,w,.66,i?C.paper:C.pale);
      const prefix=label+': ',value=claim?claim.person+' — '+(claim.sec_school||claim.organization):l?'not found in saved evidence':'not researched';
      text(p,x+(compact?0:.14),yy+(compact?0:.12),w-(compact?0:.28),compact?.24:.45,prefix+value,compact?10.8:13,C.ink,false,claim?.source_url,compact?1:2);
      if(claim&&sourceMap.has(claim.source_url))used.add(sourceMap.get(claim.source_url).id);
    });
    const links=profiles.flatMap(p=>(p.linkedin_profiles||[]).map(l=>({...l,person:p.person_name}))).slice(0,compact?2:4);
    const yy=y+(compact?.59:1.65);links.forEach((l,i)=>citation(p,x+(i%2)*w/2,yy+Math.floor(i/2)*.28,w/2,l.source_url,'LinkedIn · '+clip(l.person,22)));
  }
  // Opening dashboard replaces a separate cover and overview.
  const overview=page(briefing.company,briefing.mode==='preview'?'Archived research preview · public-source evidence':'IT & cybersecurity market briefing',true);
  text(overview,.6,1.64,11.9,.3,'Window '+(window.start||'not found')+' → '+(window.end||'not found')+'   |   Research date '+briefing.research_date,12,'B8C9DB');
  const metrics=[[briefing.companies?.length||groups.length,'COMPANIES'],[all.length,'EXTRACTED SIGNALS'],[sources.length,'SOURCE RECORDS'],[leaders.reduce((n,l)=>n+(l.profiles||[]).length,0),'LEADERS RESEARCHED']];
  metrics.forEach(([value,label],i)=>{const x=.6+i*3.08;rect(overview,x,1.95,2.88,1.02,C.navy2);text(overview,x+.18,2.08,2.5,.43,value,29,C.mint,true);text(overview,x+.18,2.64,2.5,.2,label,9.3,'C6D5E6',true);});
  const highlights=selected(all);const empty=[{category:'research coverage',summary:'No supported IT/cybersecurity signal was extracted from the supplied evidence.'},{category:'leadership background',summary:leaders.length+' company background snapshots available. Missing or disputed roles remain explicit.'},{category:'evidence quality',summary:'Search snippets are preliminary. Original-source verification is required before treating findings as confirmed.'}];
  for(let i=0;i<3;i++){const s=highlights[i]||empty[i],x=.6+i*4.12;rect(overview,x,3.35,3.92,2.46,C.navy2);rect(overview,x,3.35,.055,2.46,i===0?C.mint:i===1?C.blue:'8EADD2',undefined,false);text(overview,x+.2,3.55,3.5,.35,human(s.category).toUpperCase(),10,C.mint,true,null,1);text(overview,x+.2,4.02,3.5,1.32,s.summary,17,C.white,false,s.source_url,5);if(s.source_url)citation(overview,x+.2,5.46,3.4,s.source_url,(s.company?s.company+' · ':'')+(s.citation_id||'Source'));}
  text(overview,.65,6.25,12.0,.5,'Preliminary evidence • Selected highlights shown; complete research retained in memory.',12,'B8C9DB',false,null,2);
  // Comparable revenue bars and categorized signal counts share one slide.
  const peers=briefing.peer_selection;
  if(peers||groups.length>1){const p=page('Peer landscape','Relative annual revenue and observed signal counts · counts do not measure security risk');
    const rows=peers?[{company:briefing.company,ratio:1,...peers.target},...(peers.selected_peers||[]).map(v=>({...v,ratio:Number(v.revenue_ratio)}))]:groups.map(g=>({company:g.company}));
    const maxRatio=Math.max(1,...rows.map(r=>Number.isFinite(r.ratio)?r.ratio:0));
    text(p,.65,1.8,2.4,.3,'COMPANY',10.5,C.muted,true);text(p,3.12,1.8,3.5,.3,'REVENUE SCALE · TARGET = 1.00×',10.5,C.muted,true);
    ['Leadership','Contracts','Cyber news','Technology'].forEach((t,i)=>text(p,7.2+i*1.3,1.8,1.25,.3,t,9.8,C.muted,true));
    rows.slice(0,6).forEach((r,i)=>{const y=2.35+i*.64;rect(p,.6,y-.08,12.1,.59,i%2?C.white:'E8EEF5');text(p,.75,y,2.2,.28,r.company,13,C.ink,true,null,1);
      if(r.annual_revenue)text(p,.75,y+.29,2.2,.18,r.annual_revenue+' '+(r.currency||'')+' '+(r.units||'')+' · FY '+(r.fiscal_year||'not found'),8.6,C.muted,false,r.source_url,1);
      if(Number.isFinite(r.ratio)&&r.ratio>=0){rect(p,3.15,y+.02,3.25,.19,'D9E4EF');if(r.ratio>0)rect(p,3.15,y+.02,3.25*r.ratio/maxRatio,.19,key(r.company)===key(briefing.company)?C.teal:C.blue);text(p,6.48,y-.02,.65,.3,r.ratio.toFixed(2)+'×',11,C.ink,true);}
      else text(p,3.15,y,3.4,.25,'Revenue comparison unavailable',10.5,C.muted);
      const ss=all.filter(s=>key(s.company)===key(r.company));const counts=[ss.filter(s=>s.category==='leadership_change').length,ss.filter(s=>s.category==='it_security_contract').length,ss.filter(s=>s.category==='cybersecurity_news').length,ss.filter(s=>['technology_use','technology_mention'].includes(s.category)).length];
      counts.forEach((v,k)=>{rect(p,7.45+k*1.3,y-.005,.47,.33,v?C.pale:C.paper);text(p,7.58+k*1.3,y+.035,.25,.22,v,12,v?'16786D':C.muted,true);});if(r.source_url&&sourceMap.has(r.source_url))used.add(sourceMap.get(r.source_url).id);
    });
    text(p,.7,6.43,11.9,.34,'Peers '+(peers?.selected_count??peers?.selected_peers?.length??0)+'/5 · Retail formats may differ. Revenue evidence: '+(peers?(peers.review?.approval_mode==='user_authorized_automatic'?'automated checks; original-source verification pending.':'human-reviewed peer list; fiscal years/currency conversion may differ.'):'not supplied.')+'  Sector: '+(briefing.sector||'not specified'),11,C.muted,false,null,2);
  }
  function signalCards(p,name,x,y,w,large=false){const group=groups.find(g=>key(g.company)===key(name)),ss=selected(group?.signals||[]);const h=large?1.23:.83;
    if(!ss.length){rect(p,x,y,w,large?3.5:2.55,C.white,C.border);text(p,x+.2,y+.3,w-.4,1.2,'No supported signal extracted from the supplied evidence.',large?20:16,C.muted,false,null,4);}
    ss.forEach((s,i)=>{const yy=y+i*(h+.1);rect(p,x,yy,w,h,C.white,C.border);rect(p,x,yy,.045,h,C.teal,undefined,false);text(p,x+.16,yy+.1,w-2,.21,human(s.category).toUpperCase()+(s.citation_id?' · '+s.citation_id:''),9.7,C.teal,true,s.source_url,1);pill(p,x+w-1.72,yy+.08,1.55,human(s.status),/pilot|hiring|reported|proposed/i.test(s.status||''));text(p,x+.16,yy+.35,w-.32,large?.7:.43,s.summary,large?17:13.1,C.ink,false,s.source_url,large?3:2);});
  }
  const snapshots=chunks(groups,2);
  for(const batch of snapshots){const p=page(batch.length===1?batch[0].company+' | research snapshot':'Company snapshots','Selected signals + public leadership background · all snippet-based findings require source verification');
    if(batch.length===1){const g=batch[0],l=companyLeaders(g.company);text(p,.65,1.76,5.9,.34,'IT & CYBERSECURITY SIGNALS',11,C.teal,true);signalCards(p,g.company,.65,2.2,5.82,true);
      rect(p,6.75,1.72,5.9,4.98,C.white,C.border);text(p,6.96,1.91,5.4,.34,'Leadership & professional background',17,C.ink,true);leaderGrid(p,l,6.96,2.5,5.48,false);backgroundLines(p,l,6.96,4.53,5.48,false);text(p,.7,6.42,5.7,.3,(g.signals?.length||0)+' extracted signals · top '+Math.min(3,g.signals?.length||0)+' shown',11,C.muted);text(p,6.96,2.26,5.3,.2,l?'Saved '+String(l.saved_at||l.retrieved_at||'').slice(0,10)+' · current roles unverified':'Run Agent 4 to add leadership background',9.8,C.muted,false,null,1);
    }else batch.forEach((g,i)=>{const x=.65+i*6.15,l=companyLeaders(g.company);text(p,x,1.73,5.8,.4,g.company,21,C.ink,true,null,1);signalCards(p,g.company,x,2.24,5.8);text(p,x,5.03,5.8,.23,'LEADERSHIP · PUBLIC SOURCE CANDIDATES',9.5,C.muted,true);leaderGrid(p,l,x,5.33,5.8,true);backgroundLines(p,l,x,6.39,5.8,true);});
  }
  // Consolidated memory, evidence gaps and follow-up priorities.
  const p=page('What changed & what needs review','Snapshot comparison reflects saved observations, not independently confirmed new events');
  rect(p,.65,1.77,5.86,2.04,C.white,C.border);text(p,.88,1.96,5.4,.3,'RESEARCH MEMORY',11,C.teal,true);
  [[memory.newly_observed_sources?.length||0,'new source URLs'],[memory.new_signals?.length||0,'new signals'],[memory.changed_signals?.length||0,'changed descriptions']].forEach(([v,label],i)=>{const x=.9+i*1.84;text(p,x,2.4,1.65,.48,v,29,C.ink,true);text(p,x,2.98,1.65,.5,label,11,C.muted,false,null,2);});
  rect(p,6.75,1.77,5.88,2.04,C.white,C.border);text(p,6.98,1.96,5.4,.3,'EVIDENCE COVERAGE',11,C.teal,true);
  [[gaps.review_records?.length||0,'records for review'],[gaps.failed_searches?.length||0,'search gaps'],[analysis.sources_failed_or_missing||0,'analysis gaps']].forEach(([v,label],i)=>{const x=7+i*1.83;text(p,x,2.4,1.6,.48,v,29,v?C.amber:C.ink,true);text(p,x,2.98,1.6,.5,label,11,C.muted,false,null,2);});
  const unresolved=leaders.reduce((n,l)=>n+(l.roles||[]).filter(r=>r.status!=='source_reported_current').length,0);
  const actions=[['Verify source material','Review original articles and public biographies. Search snippets alone do not confirm company actions.'],['Resolve leadership gaps',unresolved+' saved roles are missing, disputed or conflicting. '+(briefing.leadership_missing?.length||0)+' companies have no saved Agent 4 background.'],['Complete the coverage',(gaps.failed_searches?.length||0)+' company search gaps; '+leaders.reduce((n,l)=>n+(l.search_failures||[]).length,0)+' saved leadership search gaps. Retain old research with its dates.']];
  actions.forEach(([title,body],i)=>{const x=.65+i*4.1;rect(p,x,4.16,3.9,2.21,C.white,C.border);rect(p,x+.2,4.39,.36,.36,i===1?C.warn:C.pale);text(p,x+.31,4.46,.18,.2,i+1,11,i===1?C.amber:C.teal,true);text(p,x+.2,4.94,3.5,.4,title,17,C.ink,true,null,1);text(p,x+.2,5.48,3.5,.72,body,12.3,C.muted,false,null,3);});
  text(p,.7,6.63,12,.25,memory.previous_run_id?'Previous saved run: '+memory.previous_run_id+' · '+String(memory.previous_run_time||'').slice(0,10):'First compiled snapshot for this company. Older raw research remains retained.',10.5,C.muted,false,null,1);
  // Cite only sources used in displayed highlights; the complete registry stays in memory.
  const cited=sources.filter(s=>used.has(s.id));
  for(const [index,batch] of chunks(cited,12).entries()){const p=page(index===0?'Sources and publication dates':'Sources and publication dates · continued','Clickable source register for displayed highlights · complete evidence and quotations retained in saved research');p.appendix=true;
    batch.forEach((s,i)=>{const x=.65+(i%2)*6.15,y=1.82+Math.floor(i/2)*.81;rect(p,x,y,5.8,.75,C.white,C.border);text(p,x+.14,y+.08,.6,.22,s.id,11,C.teal,true,s.url);text(p,x+.82,y+.08,4.8,.37,s.title,11.7,C.ink,true,s.url,2);const host=s.url.match(/^https?:\/\/([^/]+)/i)?.[1]||s.url;text(p,x+.82,y+.52,4.8,.21,clip(host,44)+' · '+(s.date||'not found'),9.8,C.muted,false,s.url,1);});
  }
  if(!cited.length){const p=page('Sources and publication dates','No displayed source citations available');text(p,.8,2.1,11.7,1,'No source-linked findings were available for the displayed highlights. The full research record remains in memory.',18,C.muted,false,null,3);p.appendix=true;}
  const relationships=[],overrides=[];
  function shapeXml(e,id,linkId){const tr='<a:xfrm><a:off x="'+Math.round(e.x*E)+'" y="'+Math.round(e.y*E)+'"/><a:ext cx="'+Math.round(e.w*E)+'" cy="'+Math.round(e.h*E)+'"/></a:xfrm>';
    if(e.kind==='rect')return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="Card '+id+'"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>'+tr+'<a:prstGeom prst="'+(e.round?'roundRect':'rect')+'"><a:avLst><a:gd name="adj" fmla="val 8000"/></a:avLst></a:prstGeom><a:solidFill><a:srgbClr val="'+e.fill+'"/></a:solidFill><a:ln w="6350"><a:solidFill><a:srgbClr val="'+e.line+'"/></a:solidFill></a:ln></p:spPr></p:sp>';
    const paras=String(e.text).split('\n').map(line=>'<a:p><a:pPr><a:lnSpc><a:spcPct val="105000"/></a:lnSpc><a:spcAft><a:spcPts val="0"/></a:spcAft></a:pPr><a:r><a:rPr lang="en-US" sz="'+Math.round(e.size*100)+'" u="none"'+(e.bold?' b="1"':'')+'><a:solidFill><a:srgbClr val="'+e.color+'"/></a:solidFill><a:latin typeface="Aptos"/>'+(linkId?'<a:hlinkClick r:id="'+linkId+'"/>':'')+'</a:rPr><a:t>'+xml(line)+'</a:t></a:r><a:endParaRPr lang="en-US"/></a:p>').join('');
    return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="Text '+id+'"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>'+tr+'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="t"/><a:lstStyle/>'+paras+'</p:txBody></p:sp>';
  }
  pages.forEach((p,index)=>{
    // Add shared chrome last in metadata, render it before content.
    const content=p.elements;p.elements=[];rect(p,0,0,13.333,1.57,C.navy,undefined,false);rect(p,.6,.33,.42,.055,C.mint,undefined,false);text(p,1.12,.25,11.4,.22,'PUBLIC-SOURCE RESEARCH  /  '+(p.appendix?'SOURCE REGISTER':briefing.company.toUpperCase()),9.4,'A7BBD2',true);
    text(p,.6,.66,12.05,.55,p.title,p.dark?34:27,C.white,true,null,1);if(p.subtitle)text(p,.62,1.24,12.0,.24,p.subtitle,10.5,'B8C9DB',false,null,1);
    p.elements.push(...content);rect(p,.6,7.02,12.1,.012,p.dark?'36506C':C.border,undefined,false);text(p,.62,7.13,11.6,.18,(briefing.mode==='preview'?'PREVIEW · ':'')+'Selected highlights · complete research retained in memory · '+briefing.run_id,8.3,p.dark?'A7BBD2':C.muted,false,null,1);text(p,12.3,7.1,.4,.22,index+1,10,p.dark?'A7BBD2':C.muted,true);
    let id=2,shapes='',links=[];for(const e of p.elements){let linkId=null;if(e.link&&/^https?:\/\//.test(e.link)){linkId='link'+(links.length+1);links.push({id:linkId,url:e.link});}shapes+=shapeXml(e,id++,linkId);}
    const slide='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="'+(p.dark?C.navy:C.paper)+'"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'+shapes+'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
    parts['ppt/slides/slide'+(index+1)+'.xml']=Buffer.from(slide);
    parts['ppt/slides/_rels/slide'+(index+1)+'.xml.rels']=Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout7.xml"/>'+links.map(l=>'<Relationship Id="'+l.id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="'+xml(l.url)+'" TargetMode="External"/>').join('')+'</Relationships>');
    relationships.push('<Relationship Id="rId'+(1000+index)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+(index+1)+'.xml"/>');overrides.push('<Override PartName="/ppt/slides/slide'+(index+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>');
  });
  let presentation=parts['ppt/presentation.xml'].toString();
  const ids='<p:sldIdLst>'+pages.map((_,i)=>'<p:sldId id="'+(256+i)+'" r:id="rId'+(1000+i)+'"/>').join('')+'</p:sldIdLst>';
  presentation=presentation.replace(/<p:sldIdLst\s*\/>|<p:sldIdLst>.*?<\/p:sldIdLst>/s,'');
  presentation=presentation.replace('<p:sldSz',ids+'<p:sldSz');parts['ppt/presentation.xml']=Buffer.from(presentation);
  parts['ppt/_rels/presentation.xml.rels']=Buffer.from(parts['ppt/_rels/presentation.xml.rels'].toString().replace('</Relationships>',relationships.join('')+'</Relationships>'));
  parts['[Content_Types].xml']=Buffer.from(parts['[Content_Types].xml'].toString().replace('</Types>',overrides.join('')+'</Types>'));
  parts['docProps/app.xml']=Buffer.from(parts['docProps/app.xml'].toString().replace(/<Slides>\d+<\/Slides>/,'<Slides>'+pages.length+'</Slides>'));
  // Store-mode ZIP needs no external module and is supported by PowerPoint.
  const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
  const crc32=buf=>{let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
  let offset=0;const local=[],central=[];
  for(const [name,data] of Object.entries(parts)){const filename=Buffer.from(name),crc=crc32(data),header=Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(filename.length,26);
    local.push(header,filename,data);const cd=Buffer.alloc(46);cd.writeUInt32LE(0x02014b50);cd.writeUInt16LE(20,4);cd.writeUInt16LE(20,6);cd.writeUInt16LE(0x800,8);cd.writeUInt32LE(crc,16);cd.writeUInt32LE(data.length,20);cd.writeUInt32LE(data.length,24);cd.writeUInt16LE(filename.length,28);cd.writeUInt32LE(offset,42);central.push(cd,filename);offset+=header.length+filename.length+data.length;}
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(parts).length,8);end.writeUInt16LE(Object.keys(parts).length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  return {buffer:Buffer.concat([...local,directory,end]),slide_count:pages.length,pages};
}
