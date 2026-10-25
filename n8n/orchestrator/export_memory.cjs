const {DatabaseSync}=require('node:sqlite'),fs=require('fs');
const db=new DatabaseSync('/home/node/.n8n/database.sqlite',{readOnly:true});
const table=db.prepare('SELECT name FROM sqlite_master WHERE type=?').all('table').map(r=>r.name).find(n=>n.includes('IoseclveuG5G4kFs'));
if(!table||!/^[a-zA-Z0-9_]+$/.test(table))throw Error('Research memory table not found');
const rows=db.prepare('SELECT * FROM "'+table+'" ORDER BY id').all();fs.writeFileSync(process.argv[2]||'/tmp/week3-memory-checkpoint-24.json',JSON.stringify(rows,null,2));console.log(JSON.stringify({rows:rows.length,leader_background_rows:rows.filter(r=>r.record_type==='leadership_background').length,test_background_rows:rows.filter(r=>r.record_type==='leadership_background_test').length}));db.close();
