import { Pool } from 'pg';
const pool = new Pool({
  host: '10.1.1.113', port: 7300, database: 'training_exercises',
  user: 'liuhaojun', password: 'liuhaojun', ssl: false,
});

const schema = 'liuhaojun';

async function main() {
  try {
    const r2 = await pool.query(
      `SELECT mp.code FROM ${schema}.cec_new_energy_measurement_points mp WHERE mp.if_delete = '0' ORDER BY mp.create_tm DESC LIMIT 3 OFFSET 0`
    );
    const codes = r2.rows.map(r => r.code);
    console.log('Codes:', codes);

    const placeholders = codes.map((_, i) => `$${i + 1}`).join(',');
    const detailSql = `
      SELECT
        mp.code, mp.type_code, mp.station_code, mp.second_class_code,
        mp.third_class_code, mp.data_category_code, mp.data_code,
        COALESCE(t.type_name, '') AS type_name,
        COALESCE(s.station_name, '') AS station_name,
        COALESCE(sc.second_class_name, '') AS second_class_name,
        COALESCE(tc.third_class_name, '') AS third_class_name,
        COALESCE(dt.data_category_name, '') AS data_type_name,
        COALESCE(dc.data_name, '') AS data_name
      FROM ${schema}.cec_new_energy_measurement_points mp
      LEFT JOIN (SELECT DISTINCT type_code, type_name FROM ${schema}.cec_new_energy_type_dict WHERE if_delete = '0') t ON mp.type_code = t.type_code
      LEFT JOIN (SELECT DISTINCT station_code, station_name FROM ${schema}.cec_new_energy_station_dict WHERE if_delete = '0') s ON mp.station_code = s.station_code
      LEFT JOIN (SELECT second_class_code, second_class_name FROM ${schema}.cec_new_energy_second_class_type_dict WHERE if_delete = '0' AND second_class_code IS NOT NULL) sc ON mp.second_class_code = sc.second_class_code
      LEFT JOIN (SELECT third_class_code, third_class_name FROM ${schema}.cec_new_energy_third_class_dict WHERE if_delete = '0' AND third_class_code IS NOT NULL) tc ON mp.third_class_code = tc.third_class_code
      LEFT JOIN (SELECT data_category_code, data_category_name FROM ${schema}.cec_new_energy_code_dict WHERE if_delete = '0' AND data_category_code IS NOT NULL) dt ON mp.data_category_code = dt.data_category_code
      LEFT JOIN (SELECT data_category_code, data_code, data_name FROM ${schema}.cec_new_energy_code_dict WHERE if_delete = '0' AND data_code IS NOT NULL AND data_name IS NOT NULL) dc ON mp.data_category_code = dc.data_category_code AND mp.data_code = dc.data_code
      WHERE mp.code IN (${placeholders})
      ORDER BY mp.create_tm DESC`;

    console.log('Executing detail query...');
    console.time('detail');
    const r3 = await pool.query(detailSql, codes);
    console.log('Detail rows:', r3.rows.length);
    if (r3.rows.length > 0) console.log('First row:', JSON.stringify(r3.rows[0]));
    console.timeEnd('detail');
  } catch(err) { console.error('Error:', err.message); }
  finally { await pool.end(); }
}
main();
