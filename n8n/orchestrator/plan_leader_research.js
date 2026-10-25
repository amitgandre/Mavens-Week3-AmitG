function planLeaderResearch(companies,rows,now){
 const key=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
 const latest=new Map();
 for(const row of rows){if(row.record_type!=='leadership_background')continue;try{const profile=JSON.parse(row.payload_json);const time=Date.parse(profile.retrieved_at||row.run_time);const k=key(profile.company_name);if(!latest.has(k)||time>latest.get(k).time)latest.set(k,{time,profile,run_id:row.run_id});}catch{}}
 const pending=[],reused=[];
 for(const company of companies){const old=latest.get(key(company));if(old&&old.time<=now&&now-old.time<604800000&&['complete','partial'].includes(old.profile.status))reused.push({company,run_id:old.run_id,retrieved_at:old.profile.retrieved_at,status:old.profile.status});else pending.push(company);}
 return {pending_companies:pending,reused_profiles:reused,cache_hours:168,note:'Retained background is dated and still needs source/current-role verification. Partial cached coverage stays explicit.'};
}
