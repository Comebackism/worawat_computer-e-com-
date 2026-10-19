const pool = require('./db');
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'").then(r => {
  console.log(r.rows.map(x => x.column_name));
  pool.end();
}).catch(e => { console.error(e); pool.end(); });
