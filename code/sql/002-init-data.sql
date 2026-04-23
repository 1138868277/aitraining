-- 华电新能源测点编码管理工具 - 初始化示例数据
-- Schema: liuhaojun

SET search_path TO liuhaojun;

-- 场站字典
INSERT INTO cec_new_energy_station_dict (station_id, station_code, station_name, management_domain) VALUES
(1001, 'YN01', '云南风电场A', '云南区域'),
(1002, 'YN02', '云南风电场B', '云南区域'),
(1003, 'GZ01', '贵州光伏站A', '贵州区域'),
(1004, 'GZ02', '贵州光伏站B', '贵州区域'),
(1005, 'SC01', '四川水电站A', '四川区域');

-- 类型字典
INSERT INTO cec_new_energy_type_dict (type_id, type_code, type_name) VALUES
(2001, '01', '风力发电'),
(2002, '02', '光伏发电'),
(2003, '03', '水力发电'),
(2004, '04', '储能电站');

-- 前缀字典
INSERT INTO cec_new_energy_prefix_dict (prefix_id, prefix_no, prefix_name) VALUES
(3001, 'A', 'A类设备'),
(3002, 'B', 'B类设备'),
(3003, 'C', 'C类设备');

-- 项目期号&并网线路字典
INSERT INTO cec_new_energy_project_line_dict (project_line_id, project_line_code, project_line_name) VALUES
(4001, '001', '一期项目-线路A'),
(4002, '002', '二期项目-线路B'),
(4003, '003', '三期项目-线路C');

-- 标准编码字典（二级分类+数据类）
INSERT INTO cec_new_energy_code_dict (code_dict_id, type_domain_code, first_class_code, first_class_name, second_class_code, second_class_name, data_category_code, data_category_name, data_code, data_name) VALUES
-- 风力发电相关 (F)
(5001, 'F', '01', '发电设备', '001', '风力发电机', '01', '运行数据', '001', '电压'),
(5002, 'F', '01', '发电设备', '001', '风力发电机', '01', '运行数据', '002', '电流'),
(5003, 'F', '01', '发电设备', '001', '风力发电机', '01', '运行数据', '003', '功率'),
-- 光伏发电相关 (G)
(5004, 'G', '01', '发电设备', '002', '光伏组件', '01', '运行数据', '001', '电压'),
-- 通用设备 (Y)
(5005, 'Y', '02', '输电设备', '001', '变压器', '02', '状态数据', '001', '温度');

-- 数据类字典
INSERT INTO cec_new_energy_data_type_dict (data_type_id, data_type_code, data_type_name, data_code, data_name, second_class_code) VALUES
(6001, '01', '运行数据', '001', '电压', '001'),
(6002, '01', '运行数据', '002', '电流', '001'),
(6003, '01', '运行数据', '003', '功率', '001'),
(6004, '02', '状态数据', '001', '温度', '001'),
(6005, '02', '状态数据', '002', '振动', '001');

-- 二级类码类型关联表数据
INSERT INTO cec_new_energy_second_class_type_dict (id, type_code, second_class_code, second_class_name) VALUES
-- 类型01（风力发电）相关的二级类码
(7001, '01', '001', '风力发电机'),
(7002, '01', '002', '风力塔筒'),
(7003, '01', '003', '风力叶片'),
-- 类型02（光伏发电）相关的二级类码
(7004, '02', '002', '光伏组件'),
(7005, '02', '005', '光伏逆变器'),
(7006, '02', '006', '光伏支架'),
-- 类型03（水力发电）相关的二级类码
(7007, '03', '001', '水轮发电机'),
(7008, '03', '008', '水闸控制器'),
-- 类型04（储能电站）相关的二级类码
(7009, '04', '009', '储能电池'),
(7010, '04', '010', '储能逆变器');
