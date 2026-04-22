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

-- 标准编码字典（多级联动）
INSERT INTO cec_new_energy_code_dict (code_dict_id, first_class_code, first_class_name, second_class_code, second_class_name, second_ext_code, second_ext_name, third_class_code, third_class_name, third_ext_code, third_ext_name) VALUES
(5001, '01', '发电设备', '001', '风力发电机', '0001', '直驱风机', '001', '变桨系统', '0001', '桨叶1'),
(5002, '01', '发电设备', '001', '风力发电机', '0001', '直驱风机', '001', '变桨系统', '0002', '桨叶2'),
(5003, '01', '发电设备', '001', '风力发电机', '0002', '双馈风机', '001', '齿轮箱', '0001', '高速轴'),
(5004, '01', '发电设备', '002', '光伏组件', '0001', '单晶硅', '001', '电池片', '0001', 'A级片'),
(5005, '02', '输电设备', '001', '变压器', '0001', '升压变', '001', '绕组', '0001', '高压绕组');

-- 数据类字典
INSERT INTO cec_new_energy_data_type_dict (data_type_id, data_type_code, data_type_name, data_code, data_name, second_class_code) VALUES
(6001, '01', '运行数据', '001', '电压', '001'),
(6002, '01', '运行数据', '002', '电流', '001'),
(6003, '01', '运行数据', '003', '功率', '001'),
(6004, '02', '状态数据', '001', '温度', '001'),
(6005, '02', '状态数据', '002', '振动', '001');
