function validateFx(raw, evidence) {
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
  const source=evidence.sources.find(s=>s.url===raw.source_url);
  const quote=clean(raw.evidence_excerpt),rate=Number(raw.rate);
  const from=evidence.currency.toLowerCase(),to=evidence.target_currency.toLowerCase();
  // An unlabelled table value is insufficient: it may be an inverse rate or another currency.
  const pair=new RegExp('\\b'+from+'\\s*(?:/|to|→|-)\\s*'+to+'\\b');
  const equation=new RegExp('\\b1(?:\\.0+)?\\s*'+from+'\\s*(?:=|equals)\\s*[0-9.,]+\\s*'+to+'\\b');
  const directed=pair.test(quote)||equation.test(quote);
  const annual=/annual|yearly|year average|year-average/.test(quote)&&/average/.test(quote);
  const usable=!!source&&quote.length>10&&clean(source.text).includes(quote)&&
    /^\d+(?:\.\d+)?$/.test(raw.rate||'')&&Number.isFinite(rate)&&rate>0&&
    quote.includes(raw.rate)&&quote.includes(evidence.period)&&directed&&annual;
  return {currency:evidence.currency,usable,to_target:usable?rate:null,
    target_currency:evidence.target_currency,period:evidence.period,source_url:raw.source_url,
    evidence_excerpt:raw.evidence_excerpt,evidence_level:'search_snippet',
    issue:usable?'':'Annual average, year, rate, and currency direction are not all explicitly supported'};
}
