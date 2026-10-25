function rankPeers(context, records) {
  const target = context.target;
  const clean = s => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const excluded = [], eligible = [], seen = new Set([clean(target.company)]);
  for (const record of records) {
    const r = {...record, exclusion_reasons:[...(record.issues || [])]};
    const key = clean(r.company), group = clean(r.parent_group || r.company);
    if (!key || seen.has(key) || seen.has(group)) r.exclusion_reasons.push('Self, duplicate, or repeated parent group');
    seen.add(key); seen.add(group);
    if (r.sector_fit !== 'same') r.exclusion_reasons.push('Sector fit requires review');
    if (!target.usable) r.exclusion_reasons.push('Target revenue evidence is incomplete');
    if (r.fiscal_year !== target.fiscal_year) r.exclusion_reasons.push('Fiscal year differs from target');
    let rate = 1;
    if (r.currency !== target.currency) {
      const fx = context.fx_rates?.[r.currency];
      if (!fx || !(fx.to_target > 0) || !Number.isFinite(fx.to_target) ||
          fx.target_currency !== target.currency || String(fx.period) !== target.fiscal_year ||
          !/^https:\/\//.test(fx.source_url || '')) {
        r.exclusion_reasons.push('Sourced annual-average currency conversion is missing');
        rate = null;
      } else {
        rate = fx.to_target;
        r.fx_evidence = fx;
      }
    }
    r.revenue_in_target_currency = rate !== null && r.revenue_base_units > 0 ? r.revenue_base_units * rate : null;
    r.revenue_ratio = target.revenue_base_units > 0 && r.revenue_in_target_currency > 0
      ? r.revenue_in_target_currency / target.revenue_base_units : null;
    if (r.revenue_ratio === null || r.revenue_ratio < context.ratio_min || r.revenue_ratio > context.ratio_max)
      r.exclusion_reasons.push('Outside chosen revenue range or not comparable');
    r.distance = r.revenue_ratio > 0 ? Math.abs(Math.log(r.revenue_ratio)) : null;
    r.exclusion_reasons = [...new Set(r.exclusion_reasons)];
    (r.exclusion_reasons.length ? excluded : eligible).push(r);
  }
  eligible.sort((a,b)=>a.distance-b.distance || a.company.localeCompare(b.company));
  const selected = eligible.slice(0,5).map((r,i)=>({...r,rank:i+1}));
  return {status:'awaiting_human_review', company:target.company, sector:context.sector,
    geography:context.geography, research_window:context.research_window, target,
    criteria:{ratio_min:context.ratio_min,ratio_max:context.ratio_max,matching_fiscal_year:target.fiscal_year,
      currency:target.currency,ranking:'absolute natural log of peer-to-target revenue ratio'},
    selected_peers:selected, alternatives:eligible.slice(5), excluded_candidates:excluded,
    selected_count:selected.length, shortfall:Math.max(0,5-selected.length),
    limitations:[
      'Selection is provisional until you verify original financial sources and sector/parent-group fit.',
      'Search snippets are preliminary evidence. Uploaded report text is not independently authenticated.',
      'Missing figures, mismatched fiscal years, unknown sector fit, and missing FX sources are excluded.',
      'Fiscal-year labels are compared; differing year-end dates still require human review.',
      'Geography and parent-group relationships are model assessments requiring review.'
    ],
    next_action:selected.length<5?'Review exclusions, supply missing evidence/FX, or explicitly widen criteria.':'Review the five proposed peers.'};
}
