-- 字典树查询性能优化：添加覆盖索引
-- Schema: liuhaojun
-- 覆盖 WHERE if_delete + ORDER BY type_domain_code, second_class_code, data_category_code, data_code

SET search_path TO liuhaojun;

CREATE INDEX IF NOT EXISTS idx_code_dict_tree_query
  ON cec_new_energy_code_dict(if_delete, type_domain_code, second_class_code, data_category_code, data_code);

SELECT '字典树查询索引已添加' AS message;
