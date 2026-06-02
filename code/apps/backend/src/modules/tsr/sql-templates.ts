/**
 * 规则生成 SQL 模板
 * __schema__ → 当前租户 schema
 * __标准表__ → tsr_standard_list
 * 完全对标 Python 脚本 (sql_scripts/) 的 SQL 逻辑
 */

export interface RuleSqlDef {
  module: string;       // 分级诊断 / 功率预测
  energy: string;       // 风电 / 光伏
  ruleType: string;     // sz / tb / yx / zd
  sql: string;
}

/** 能源过滤：风电统一用 F/Y01，光伏统一用 G/Y02 */
function energyFilter(energy: string): string {
  return energy === '光伏'
    ? "(SUBSTRING(cd_code,5,1)='G' OR SUBSTRING(cd_code,5,3)='Y02')"
    : "(SUBSTRING(cd_code,5,1)='F' OR SUBSTRING(cd_code,5,3)='Y01')";
}

/** 时间区间：光伏 8:00-18:00，其他 0:00-23:59 */
function timeRange(energy: string): { begin: string; end: string } {
  return energy === '光伏'
    ? { begin: '8:00', end: '18:00' }
    : { begin: '0:00', end: '23:59' };
}

/** 规则后缀 */
function ruleLabel(ruleType: string): string {
  const map: Record<string, string> = { sz: '死值', tb: '跳变', yx: '越限', zd: '中断' };
  return map[ruleType] || ruleType;
}

/**
 * 构建 cd_data CTE
 * 分级诊断/光伏：特殊 UNION ALL + right(cd_code,5)，完全对标 Python 脚本
 */
function cdDataSql(moduleSource: string, energy: string, secondCodes: string[]): string {
  const ef = energyFilter(energy);
  const scList = secondCodes.map(c => `'${c}'`).join(',');

  // 分级诊断/光伏：对标 Python 脚本的 UNION ALL + right(cd_code,5) + extra_code 过滤
  if (moduleSource === '分级诊断' && energy === '光伏') {
    return `
      SELECT cd_code, cd_name,
        LEFT(cd_code,4) AS station_code,
        SUBSTRING(cd_code,5,1) AS energy_type,
        RIGHT(cd_code,5) AS measure_code,
        SUBSTRING(cd_code,13,3) AS second_code
      FROM __schema__.tsr_measure_data
      WHERE ${ef}
        AND SUBSTRING(cd_code,13,3)='002'
        AND SUBSTRING(cd_code,20,3) IN ('003','005')
      UNION ALL
      SELECT cd_code, cd_name,
        LEFT(cd_code,4) AS station_code,
        SUBSTRING(cd_code,5,1) AS energy_type,
        RIGHT(cd_code,5) AS measure_code,
        SUBSTRING(cd_code,13,3) AS second_code
      FROM __schema__.tsr_measure_data
      WHERE ${ef}
        AND SUBSTRING(cd_code,13,3)='004'`;
  }

  // 其他：标准 cd_data，用 pre-computed 列
  return `
      SELECT cd_code, cd_name, station_code, energy_type, measure_code, second_code
      FROM __schema__.tsr_measure_data
      WHERE ${ef}
        AND SUBSTRING(cd_code,13,3) IN (${scList})`;
}

/** 生成完整的 rule SQL */
function genRuleSql(moduleSource: string, energy: string, ruleType: string, secondCodes: string[]): string {
  const label = ruleLabel(ruleType);
  const tr = timeRange(energy);
  const table = `tsr_import_list_${ruleType}`;

  // 每类规则特有的字段
  let selectFields: string;
  let whereField: string;

  switch (ruleType) {
    case 'sz':
      selectFields = `
      COALESCE(ss_threshold::FLOAT,0) AS sz_threshold,
      ss_windows::FLOAT AS sz_windows,
      ss_windows::FLOAT/2 AS sliding_step,`;
      whereField = 'ss_windows';
      break;
    case 'tb':
      selectFields = `
      tb_windows::FLOAT AS tb_windows,
      tb_windows::FLOAT AS sliding_step,
      k_coefficient::FLOAT AS k_coefficient,`;
      whereField = 'tb_windows';
      break;
    case 'yx':
      selectFields = `
      SPLIT_PART(REPLACE(REPLACE(yx_range,'[',''),']',''),',',2)::FLOAT AS upper_range,
      SPLIT_PART(REPLACE(REPLACE(yx_range,'[',''),']',''),',',1)::FLOAT AS lower_range,`;
      whereField = `yx_range LIKE '[%,%]'`;
      break;
    case 'zd':
      selectFields = `
      zd_duration::FLOAT AS zd_duration,`;
      whereField = 'zd_duration';
      break;
    default:
      throw new Error(`Unknown rule type: ${ruleType}`);
  }

  // 越限的 WHERE 条件直接写在字段里
  const whereClause = ruleType === 'yx' ? whereField : `${whereField} != ''`;

  return `
    INSERT INTO __schema__.${table}
    (module_source, energy_type, standard_name, ${ruleType === 'yx' ? 'upper_range, lower_range' : ruleType === 'zd' ? 'zd_duration' : ruleType === 'sz' ? 'sz_threshold, sz_windows, sliding_step' : 'tb_windows, sliding_step, k_coefficient'}, begin_time, end_time, measure_name, cd_code)
    WITH cd_data AS (${cdDataSql(moduleSource, energy, secondCodes)}
    ),
    standard_data AS (
      SELECT * FROM __标准表__
      WHERE module_source = '${moduleSource}' AND energy_type = '${energy}'
    ),
    final_data AS (
      SELECT t1.cd_name, t1.cd_code, t3.station_name,
        t2.second_name, t2.measure_code, t2.measure_name,
        t2.module_source, t2.energy_type,
        tb_windows, ss_windows, ss_threshold, yx_range, zd_duration, k_coefficient
      FROM cd_data t1
      INNER JOIN standard_data t2 ON t1.measure_code = t2.measure_code AND t1.second_code = t2.second_code
      INNER JOIN __schema__.tsr_station t3 ON t1.station_code = t3.station_code
    )
    SELECT DISTINCT
      module_source, energy_type,
      CONCAT(station_name, '_', module_source, '_', second_name, '_', measure_name, '_${label}') AS standard_name,
      ${selectFields}
      '${tr.begin}' AS begin_time, '${tr.end}' AS end_time,
      measure_name, cd_code
    FROM final_data
    WHERE ${whereClause}
    ORDER BY measure_name
    RETURNING standard_name;`.trim();
}

export function getAllRuleSqls(): RuleSqlDef[] {
  const configs: { module: string; energy: string; secondCodes: string[] }[] = [
    { module: '分级诊断', energy: '风电', secondCodes: ['002'] },
    { module: '分级诊断', energy: '光伏', secondCodes: ['002', '004'] },
    { module: '功率预测', energy: '风电', secondCodes: ['001', '002', '004'] },
    { module: '功率预测', energy: '光伏', secondCodes: ['001', '002', '004'] },
  ];

  const ruleTypes = ['sz', 'tb', 'yx', 'zd'] as const;
  const results: RuleSqlDef[] = [];

  for (const cfg of configs) {
    for (const rt of ruleTypes) {
      results.push({
        module: cfg.module,
        energy: cfg.energy,
        ruleType: rt,
        sql: genRuleSql(cfg.module, cfg.energy, rt, cfg.secondCodes),
      });
    }
  }

  return results;
}

/**
 * 获取列合并配置（用于导出 Excel 时的层级合并）
 */
export function getMergeConfig(ruleType: string): { headers: Record<string, string>; mergeColumns: string[]; customFields: string[] } {
  const common: Record<string, string> = {
    module_source: '模块来源',
    energy_type: '能源类型',
    standard_name: '标准化名称',
    begin_time: '生效开始时间',
    end_time: '生效结束时间',
    measure_name: '描述',
    cd_code: '组合31位码',
  };

  switch (ruleType) {
    case 'sz':
      return {
        headers: { ...common, sz_threshold: '方差阈值', sz_windows: '窗口大小(秒)', sliding_step: '滑动步长(秒)' },
        mergeColumns: ['standard_name', 'sz_threshold', 'sz_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name'],
        customFields: ['module_source', 'energy_type', 'standard_name', 'sz_threshold', 'sz_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
      };
    case 'tb':
      return {
        headers: { ...common, tb_windows: '窗口大小(秒)', sliding_step: '滑动步长(秒)', k_coefficient: 'K值' },
        mergeColumns: ['standard_name', 'tb_windows', 'sliding_step', 'begin_time', 'end_time', 'measure_name', 'k_coefficient'],
        customFields: ['module_source', 'energy_type', 'standard_name', 'tb_windows', 'sliding_step', 'k_coefficient', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
      };
    case 'yx':
      return {
        headers: { ...common, lower_range: '下限', upper_range: '上限' },
        mergeColumns: ['standard_name', 'lower_range', 'upper_range', 'begin_time', 'end_time', 'measure_name'],
        customFields: ['module_source', 'energy_type', 'standard_name', 'lower_range', 'upper_range', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
      };
    case 'zd':
      return {
        headers: { ...common, zd_duration: '中断时长(分钟)' },
        mergeColumns: ['standard_name', 'zd_duration', 'begin_time', 'end_time', 'measure_name'],
        customFields: ['module_source', 'energy_type', 'standard_name', 'zd_duration', 'begin_time', 'end_time', 'measure_name', 'cd_code'],
      };
    default:
      return { headers: common, mergeColumns: ['standard_name'], customFields: [] };
  }
}
