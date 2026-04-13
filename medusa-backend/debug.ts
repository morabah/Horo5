import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/horo_medusa' });
pool.query('SELECT pc.id, pc.handle, pc.name, pc.parent_category_id FROM product_category pc').then(res => {
  console.log(res.rows);
  pool.end();
}).catch(err => {
  console.error(err);
  pool.end();
});
