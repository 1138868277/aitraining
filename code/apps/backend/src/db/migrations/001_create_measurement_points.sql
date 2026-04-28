-- 全量测点编码表
-- 存储从Excel导入的全量测点31位编码，并预解析各段以便高效统计
CREATE TABLE IF NOT EXISTS ${schema}.cec_new_energy_measurement_points (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(31) NOT NULL,
  -- 解析段（从31位编码中截取）
  station_code VARCHAR(4),
  type_code VARCHAR(2),
  project_line_code VARCHAR(3),
  prefix_no VARCHAR(1),
  first_class_code VARCHAR(2),
  second_class_code VARCHAR(3),
  second_ext_code VARCHAR(4),
  third_class_code VARCHAR(3),
  third_ext_code VARCHAR(4),
  data_category_code VARCHAR(2),
  data_code VARCHAR(3),
  -- 导入信息
  import_batch_id VARCHAR(50),
  creator VARCHAR(50) DEFAULT 'system',
  create_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modify_tm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  if_delete CHAR(1) DEFAULT '0'
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_mp_station ON ${schema}.cec_new_energy_measurement_points (station_code);
CREATE INDEX IF NOT EXISTS idx_mp_type ON ${schema}.cec_new_energy_measurement_points (type_code);
CREATE INDEX IF NOT EXISTS idx_mp_second_class ON ${schema}.cec_new_energy_measurement_points (second_class_code);
CREATE INDEX IF NOT EXISTS idx_mp_third_class ON ${schema}.cec_new_energy_measurement_points (third_class_code);
CREATE INDEX IF NOT EXISTS idx_mp_data_category ON ${schema}.cec_new_energy_measurement_points (data_category_code);
CREATE INDEX IF NOT EXISTS idx_mp_data_code ON ${schema}.cec_new_energy_measurement_points (data_code);
CREATE INDEX IF NOT EXISTS idx_mp_import_batch ON ${schema}.cec_new_energy_measurement_points (import_batch_id);
CREATE INDEX IF NOT EXISTS idx_mp_code ON ${schema}.cec_new_energy_measurement_points (code);
CREATE INDEX IF NOT EXISTS idx_mp_if_delete ON ${schema}.cec_new_energy_measurement_points (if_delete);
CREATE INDEX IF NOT EXISTS idx_mp_create_tm ON ${schema}.cec_new_energy_measurement_points (create_tm DESC);
CREATE INDEX IF NOT EXISTS idx_mp_ifdel_crtm ON ${schema}.cec_new_energy_measurement_points (if_delete, create_tm DESC);
