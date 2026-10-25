const draft=$('Rank Revenue Peers').first().json;
if(draft.target?.usable!==true)throw Error('Target annual revenue failed evidence checks; automatic selection cannot continue');
const selected=draft.selected_peers||[];
if(selected.some(p=>p.usable===false||(p.exclusion_reasons||[]).length))throw Error('A selected peer failed automated evidence checks');
return [{json:{...draft,review_url:null,status:draft.shortfall?'approved_with_gaps':'approved',approved:true,
 review:{approval_mode:'user_authorized_automatic',decision:'Approve',sources_verified:false,source_validation:'automated quotation, number, year, currency, revenue-range and sector checks; original sources not independently verified',accept_shortfall:true,notes:'User explicitly waived pre-approval. Unresolved evidence and fewer than five eligible peers remain reported as gaps.'},
 next_action:'Continue research automatically; retain evidence limitations in the final briefing.',
 companies_for_agent2:[{company:draft.company,is_target:true},...selected.map(p=>({company:p.company,is_target:false,source_url:p.source_url}))]}}];
