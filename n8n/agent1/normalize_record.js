// Pure validation shared by the n8n nodes and offline tests.
function normalizeRecord(raw, evidence, identity) {
  const out = {...raw, company: identity.company, sector_fit: identity.sector_fit || 'same',
    sector_overlap: identity.sector_overlap || '', parent_group: identity.parent_group || identity.company,
    discovery_source: identity.source_url || '', evidence_level: evidence.kind,
    issues: [], usable: false};
  const canonical = s => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const companyKey=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\b(?:the|inc|incorporated|corp|corporation|co|company|companies|plc|ltd|limited|llc)\b/g,'').replace(/[^a-z0-9]/g,'');
  const expectedCompany=companyKey(identity.company);
  if(!expectedCompany||companyKey(raw.company)!==expectedCompany)
    out.issues.push('Extracted company does not match the requested company');
  const amount = String(raw.annual_revenue || '').trim();
  // Avoid ambiguous locale formats and inequalities. All values are in original units.
  const numberPattern = /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/;
  const unit = canonical(raw.units);
  const multipliers = {units:1,thousands:1e3,millions:1e6,billions:1e9,trillions:1e12};
  out.currency = String(raw.currency || '').trim().toUpperCase();
  out.fiscal_year = String(raw.fiscal_year || '').trim();
  const source = evidence.sources.find(s => s.url === raw.source_url);
  const quote = canonical(raw.evidence_excerpt);
  if(source&&!companyKey(source.text).includes(expectedCompany))
    out.issues.push('Cited evidence does not identify the requested company');
  if(source&&identity.official_domain&&/^https?:\/\//i.test(source.url)) {
    const host=source.url.match(/^https?:\/\/([^/:?#\s]+)/i)?.[1]?.toLowerCase().replace(/^www\./,'');
    if(host!==identity.official_domain&&!host?.endsWith('.'+identity.official_domain))
      out.issues.push('Target revenue source is outside the official company website');
  }
  if (!source || !quote || quote === 'not found' || !canonical(source.text).includes(quote))
    out.issues.push('Missing or unsupported source quotation');
  if(/\b(?:projected|projection|forecast|estimated|estimate|guidance)\b/i.test(quote))out.issues.push('Projected or estimated revenue is not established actual annual revenue');
  if (!numberPattern.test(amount)) out.issues.push('Missing or ambiguous annual revenue');
  if (!Object.hasOwn(multipliers, unit)) out.issues.push('Missing or ambiguous reporting units');
  if (!/^[A-Z]{3}$/.test(out.currency)) out.issues.push('Missing ISO currency');
  if (!/^20\d{2}$/.test(out.fiscal_year)) out.issues.push('Missing fiscal year');
  if (source && /^20\d{2}$/.test(out.fiscal_year) && !String(source.text).includes(out.fiscal_year))
    out.issues.push('Fiscal year is not present in the cited evidence');
  if (raw.reporting_scope !== 'consolidated') out.issues.push('Revenue is not established as consolidated');
  const unformatted = amount.replaceAll(',', '');
  if (numberPattern.test(amount) && quote && !quote.replaceAll(',', '').includes(unformatted))
    out.issues.push('Revenue amount is not present in quotation');
  out.revenue_original_units = numberPattern.test(amount) ? Number(unformatted) : null;
  out.revenue_base_units = out.revenue_original_units !== null && Object.hasOwn(multipliers, unit)
    ? out.revenue_original_units * multipliers[unit] : null;
  if (!(out.revenue_base_units > 0) || !Number.isFinite(out.revenue_base_units))
    out.issues.push('Revenue must be finite and positive');
  out.usable = out.issues.length === 0;
  out.verification_status = 'awaiting_human_source_review';
  return out;
}
