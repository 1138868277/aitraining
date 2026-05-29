-- 为场站字典表增加"场站类型"字段
ALTER TABLE ${schema}.cec_new_energy_station_dict
  ADD COLUMN IF NOT EXISTS station_type VARCHAR(2);
