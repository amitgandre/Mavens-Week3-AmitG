const item=$input.first(),f={...item.json};
for(const key of ['Company Name','Official Website','Industry Sector','Geography'])
 if(typeof f[key]!=='string'||f[key].trim().length<2)throw new Error('Enter a meaningful '+key);
for(const key of ['Company Name','Official Website','Industry Sector','Geography'])f[key]=f[key].trim();
const placeholder=f['Company Name'].toLowerCase().replace(/[^a-z0-9]/g,'');
if(['company','companyname','yourcompany','entercompany','entercompanyname','examplecompany','example','test','na','none'].includes(placeholder))
 throw new Error('Enter the actual company name, for example PepsiCo, rather than "Company".');
if(!/^https?:\/\//i.test(f['Official Website']))f['Official Website']='https://'+f['Official Website'];
const host=f['Official Website'].match(/^https?:\/\/([^/:?#\s]+)/i)?.[1]?.toLowerCase().replace(/^www\./,'');
if(!host||!host.includes('.')||host.includes('@'))throw new Error('Enter a valid public official company website');
const min=Number(f['Minimum Revenue Ratio']||0.5),max=Number(f['Maximum Revenue Ratio']||2);
if(!(Number.isFinite(min)&&Number.isFinite(max)&&min>0&&max>=min))throw new Error('Invalid revenue ratio range');
let fx={};if(f['FX Rates JSON']){try{fx=JSON.parse(f['FX Rates JSON']);}catch{throw new Error('FX Rates JSON is not valid JSON');}
 if(!fx||typeof fx!=='object'||Array.isArray(fx))throw new Error('FX Rates JSON must be an object');}
return [{json:{...f,official_domain:host,ratio_min:min,ratio_max:max,fx_rates:fx,has_report:!!item.binary?.Annual_Report},binary:item.binary}];
