import sys
sys.path.insert(0, '/Users/liuhaojun/Documents/AI培训/04 脚手架/aitraining/project_doc')
from docx_helper import *

# ============================================================
#  Helper: add a single API detail section
# ============================================================
def add_api_detail(doc, name, method, path, auth, request_params=None, response_params=None, request_title="请求参数：", response_title="响应参数："):
    """添加单个API接口详细说明"""
    add_heading3(doc, name)
    add_bullet(doc, "请求方式：" + method)
    add_bullet(doc, "请求路径：" + path)
    add_bullet(doc, "认证要求：" + auth)
    if request_params:
        add_para(doc, request_title)
        add_table(doc, ["参数名", "类型", "必填", "说明"], request_params)
    if response_params:
        add_para(doc, response_title)
        add_table(doc, ["参数名", "类型", "说明"], response_params)

def add_key_value_table(doc, title, headers, rows):
    """添加键值对表格（用于JSON示例说明）"""
    add_para(doc, title)
    add_table(doc, headers, rows)

# ============================================================
#  Helper: module summary table
# ============================================================
def add_module_summary(doc, rows):
    """添加接口概览汇总表"""
    add_heading3(doc, "接口概览")
    add_table(doc, ["接口名称", "请求方法", "请求路径", "说明"], rows)

# ============================================================
#  Section 1: 概述
# ============================================================
def add_section_overview(doc):
    add_heading1(doc, "概述")
    add_heading2(doc, "编写目的")
    add_para(doc, "本文档为华电新能源测点编码管理平台的接口设计规范与详细说明文档，旨在规范前后端开发过程中的接口调用方式，明确各模块接口的请求格式、响应结构及参数定义，供前端开发人员与后端开发人员联调使用。")
    add_heading2(doc, "接口设计原则")
    add_bullet(doc, "采用 RESTful 风格设计接口，以资源为中心组织URL路径")
    add_bullet(doc, "数据交换格式统一使用 JSON（文件上传除外）")
    add_bullet(doc, "统一响应格式，所有接口返回标准结构")
    add_bullet(doc, "基于 JWT（JSON Web Token）进行身份认证")
    add_bullet(doc, "接口版本化管理，保证向后兼容")
    add_heading2(doc, "通用约定")
    add_bullet(doc, "接口地址基础路径为：/api")
    add_bullet(doc, "时间格式统一使用 ISO 8601：yyyy-MM-dd HH:mm:ss")
    add_bullet(doc, "编码格式统一为 UTF-8")
    add_bullet(doc, "涉及金额、数量等数值类型，统一使用字符串传输以避免精度丢失")


# ============================================================
#  Section 2: 通用规范
# ============================================================
def add_section_general(doc):
    add_heading1(doc, "通用规范")
    add_heading2(doc, "请求方式")
    add_para(doc, "本平台接口统一使用以下HTTP请求方法：")
    add_table(doc, ["方法", "说明"], [
        ["GET", "查询资源"],
        ["POST", "创建资源 / 提交数据"],
        ["PUT", "更新资源"],
        ["DELETE", "删除资源"],
    ])

    add_heading2(doc, "通用请求头")
    add_para(doc, "所有接口请求需携带以下通用请求头：")
    add_table(doc, ["请求头", "说明"], [
        ["Content-Type", "application/json（普通请求）/ multipart/form-data（文件上传）"],
        ["Authorization", "Bearer <token>，登录后获取的JWT令牌，需要认证的接口必填"],
        ["x-session-id", "会话唯一标识（UUID），用于草稿管理等临时数据隔离"],
    ])

    add_heading2(doc, "通用响应结构")
    add_para(doc, "所有接口统一返回以下JSON格式数据：")
    add_para(doc, "成功响应格式：")
    add_para(doc, '{  "code": 0,  "message": "success",  "data": {},  "timestamp": "2026-05-30 12:00:00"  }')
    add_para(doc, "失败响应格式：")
    add_para(doc, '{  "code": "ERROR_CODE",  "message": "错误描述信息",  "data": null,  "timestamp": "2026-05-30 12:00:00"  }')
    add_para(doc, "分页响应格式：")
    add_para(doc, '{  "code": 0,  "message": "success",  "data": { "items": [], "total": 100, "pageNum": 1, "pageSize": 20 },  "timestamp": "2026-05-30 12:00:00"  }')

    add_heading2(doc, "分页参数")
    add_para(doc, "列表查询接口统一使用以下分页参数：")
    add_table(doc, ["参数", "类型", "默认值", "说明"], [
        ["pageNum", "number", "1", "当前页码，从1开始"],
        ["pageSize", "number", "20", "每页记录数，最大不超过100"],
    ])

    add_heading2(doc, "通用错误码")
    add_para(doc, "接口通用错误码定义如下：")
    add_table(doc, ["错误码", "消息", "HTTP状态码"], [
        ["AUTH_REQUIRED", "未登录或登录已过期", "401"],
        ["FORBIDDEN", "权限不足，拒绝访问", "403"],
        ["VALIDATION_ERROR", "参数校验失败", "400"],
        ["SYSTEM_ERROR", "系统内部异常", "500"],
        ["RESOURCE_NOT_FOUND", "请求的资源不存在", "404"],
    ])

    add_heading2(doc, "文件上传规范")
    add_bullet(doc, "请求方式：POST，Content-Type 为 multipart/form-data")
    add_bullet(doc, "文件字段名统一为 file")
    add_bullet(doc, "支持文件格式：.xlsx、.xls")
    add_bullet(doc, "普通文件大小限制：10MB")
    add_bullet(doc, "大文件（测点导入）大小限制：200MB")


# ============================================================
#  Section 3: 认证模块接口
# ============================================================
def add_section_auth(doc):
    add_heading1(doc, "认证模块接口")
    add_para(doc, "认证模块负责用户身份验证与权限管理，接口路径以 /api/auth 开头。")
    add_module_summary(doc, [
        ["用户登录", "POST", "/api/auth/login", "用户登录认证，获取访问令牌"],
        ["获取当前用户", "GET", "/api/auth/me", "获取当前登录用户信息"],
        ["获取用户列表", "GET", "/api/auth/users", "获取所有用户列表（仅admin）"],
        ["新增用户", "POST", "/api/auth/users", "新增系统用户（仅admin）"],
        ["更新用户", "PUT", "/api/auth/users/:username", "更新用户信息（仅admin）"],
        ["删除用户", "DELETE", "/api/auth/users/:username", "删除系统用户（仅admin）"],
    ])
    # 3.1 用户登录
    add_api_detail(doc,
        "用户登录", "POST", "/api/auth/login", "无需认证",
        request_params=[
            ["username", "string", "是", "用户名"],
            ["password", "string", "是", "密码"],
        ],
        response_params=[
            ["token", "string", "JWT访问令牌"],
            ["user.username", "string", "用户名"],
            ["user.displayName", "string", "显示名称"],
            ["user.region", "string", "所属区域"],
            ["user.tenant", "string", "所属租户"],
        ])
    # 3.2 获取当前用户
    add_api_detail(doc,
        "获取当前用户", "GET", "/api/auth/me", "需要登录",
        request_params=[
            ["Authorization", "string", "是", "Bearer <token>（请求头）"],
        ],
        response_params=[
            ["username", "string", "用户名"],
            ["displayName", "string", "显示名称"],
            ["region", "string", "所属区域"],
            ["tenant", "string", "所属租户"],
        ])
    # 3.3 获取用户列表
    add_api_detail(doc,
        "获取用户列表", "GET", "/api/auth/users", "需要管理员权限",
        response_params=[
            ["[].username", "string", "用户名"],
            ["[].displayName", "string", "显示名称"],
            ["[].region", "string", "所属区域"],
            ["[].tenant", "string", "所属租户"],
            ["[].lastLoginTime", "string", "最后登录时间"],
        ])
    # 3.4 新增用户
    add_api_detail(doc,
        "新增用户", "POST", "/api/auth/users", "需要管理员权限",
        request_params=[
            ["username", "string", "是", "用户名"],
            ["displayName", "string", "是", "显示名称"],
            ["region", "string", "是", "所属区域"],
            ["password", "string", "是", "密码"],
        ],
        response_params=[
            ["username", "string", "新建的用户名"],
        ])
    # 3.5 更新用户
    add_api_detail(doc,
        "更新用户", "PUT", "/api/auth/users/:username", "需要管理员权限",
        request_params=[
            ["displayName", "string", "否", "显示名称"],
            ["region", "string", "否", "所属区域"],
            ["password", "string", "否", "新密码"],
        ],
        response_params=[
            ["username", "string", "更新的用户名"],
        ])
    # 3.6 删除用户
    add_api_detail(doc,
        "删除用户", "DELETE", "/api/auth/users/:username", "需要管理员权限",
        response_params=[
            ["message", "string", "操作结果提示"],
        ])


# ============================================================
#  Section 4: 编码生成模块接口
# ============================================================
def add_section_codes(doc):
    add_heading1(doc, "编码生成模块接口")
    add_para(doc, "编码生成模块负责新能源测点编码的生成、草稿管理及历史记录查询，接口路径以 /api/codes 开头。")
    add_module_summary(doc, [
        ["单条生成编码", "POST", "/api/codes/generate", "根据编码规则单条生成测点编码"],
        ["批量生成编码", "POST", "/api/codes/batch-generate", "多个维度值自动笛卡尔积生成编码"],
        ["保存草稿", "POST", "/api/codes/draft", "将生成的编码保存为草稿"],
        ["获取草稿列表", "GET", "/api/codes/draft", "获取当前会话的草稿列表"],
        ["删除单条草稿", "DELETE", "/api/codes/draft/:id", "删除指定草稿记录"],
        ["清空草稿", "DELETE", "/api/codes/draft/batch", "清空当前会话所有草稿"],
        ["编码入库", "POST", "/api/codes", "将编码正式入库保存至数据库"],
        ["查询历史记录", "GET", "/api/codes", "分页查询已入库的编码历史记录"],
        ["删除单条记录", "DELETE", "/api/codes/:id", "删除指定编码记录"],
        ["批量删除记录", "DELETE", "/api/codes/batch", "批量删除编码记录"],
        ["导出历史记录", "GET", "/api/codes/export", "导出编码历史记录为Excel文件"],
        ["保存最近条件", "POST", "/api/codes/recent-conditions", "保存最近使用的查询条件"],
        ["获取最近条件", "GET", "/api/codes/recent-conditions", "获取最近使用的查询条件列表"],
    ])

    # 4.1 单条生成编码
    add_api_detail(doc,
        "单条生成编码", "POST", "/api/codes/generate", "需要登录",
        request_params=[
            ["stationCode", "string", "是", "场站代码"],
            ["typeCode", "string", "是", "类型代码"],
            ["secondClassCode", "string", "是", "二级类码"],
            ["thirdClassCode", "string", "是", "三级类码"],
            ["dataTypeCode", "string", "是", "数据类型码"],
            ["dataCode", "string", "是", "数据码"],
            ["secondExtCodeStart", "string", "否", "二级扩展码起始值"],
            ["secondExtCodeCount", "number", "否", "二级扩展码数量"],
            ["thirdExtCodeStart", "string", "否", "三级扩展码起始值"],
            ["thirdExtCodeCount", "number", "否", "三级扩展码数量"],
        ],
        response_params=[
            ["codes[].code", "string", "生成的31位编码"],
            ["codes[].name", "string", "编码名称"],
            ["codes[].generateTime", "string", "生成时间"],
        ])
    # 4.2 批量生成编码
    add_api_detail(doc,
        "批量生成编码", "POST", "/api/codes/batch-generate", "需要登录",
        request_params=[
            ["stationCodes", "string[]", "是", "场站代码列表（多个值自动笛卡尔积）"],
            ["typeCodes", "string[]", "是", "类型代码列表"],
            ["secondClassCodes", "string[]", "是", "二级类码列表"],
            ["thirdClassCodes", "string[]", "是", "三级类码列表"],
            ["dataTypeCodes", "string[]", "是", "数据类型码列表"],
            ["dataCodes", "string[]", "是", "数据码列表"],
            ["secondExtCodeStart", "string", "否", "二级扩展码起始值"],
            ["secondExtCodeCount", "number", "否", "二级扩展码数量"],
            ["thirdExtCodeStart", "string", "否", "三级扩展码起始值"],
            ["thirdExtCodeCount", "number", "否", "三级扩展码数量"],
        ],
        response_params=[
            ["codes[].code", "string", "生成的31位编码"],
            ["codes[].name", "string", "编码名称"],
            ["codes[].generateTime", "string", "生成时间"],
            ["totalCount", "number", "生成总数"],
        ])
    # 4.3 保存草稿
    add_api_detail(doc,
        "保存草稿", "POST", "/api/codes/draft", "需要登录",
        request_params=[
            ["codes[].code", "string", "是", "编码"],
            ["codes[].name", "string", "是", "编码名称"],
            ["x-session-id", "string", "是", "会话标识（请求头）"],
        ],
        response_params=[
            ["savedCount", "number", "成功保存的草稿数量"],
            ["totalCount", "number", "草稿总数量"],
        ])
    # 4.4 获取草稿列表
    add_api_detail(doc,
        "获取草稿列表", "GET", "/api/codes/draft", "需要登录",
        request_params=[
            ["x-session-id", "string", "是", "会话标识（请求头）"],
        ],
        response_params=[
            ["[].id", "number", "草稿ID"],
            ["[].code", "string", "编码"],
            ["[].name", "string", "编码名称"],
            ["[].generateTime", "string", "生成时间"],
        ])
    # 4.5 删除单条草稿
    add_api_detail(doc,
        "删除单条草稿", "DELETE", "/api/codes/draft/:id", "需要登录",
        request_params=[
            ["id", "number", "是", "草稿ID（路径参数）"],
        ],
        response_params=[
            ["message", "string", "操作结果提示"],
        ])
    # 4.6 清空草稿
    add_api_detail(doc,
        "清空草稿", "DELETE", "/api/codes/draft/batch", "需要登录",
        request_params=[
            ["x-session-id", "string", "是", "会话标识（请求头）"],
        ],
        response_params=[
            ["deletedCount", "number", "清除的草稿数量"],
        ])
    # 4.7 编码入库
    add_api_detail(doc,
        "编码入库", "POST", "/api/codes", "需要登录",
        request_params=[
            ["codes[].code", "string", "是", "31位编码"],
            ["codes[].name", "string", "是", "编码名称"],
            ["codes[].stationCode", "string", "否", "场站代码"],
            ["codes[].typeCode", "string", "否", "类型代码"],
            ["codes[].dataTypeCode", "string", "否", "数据类型码"],
            ["codes[].dataCode", "string", "否", "数据码"],
        ],
        response_params=[
            ["savedCount", "number", "成功入库数量"],
            ["totalCount", "number", "提交总数"],
        ])
    # 4.8 查询历史记录
    add_api_detail(doc,
        "查询历史记录", "GET", "/api/codes", "需要登录",
        request_params=[
            ["pageNum", "number", "否", "当前页码"],
            ["pageSize", "number", "否", "每页记录数"],
            ["typeCode", "string", "否", "类型代码筛选"],
            ["stationCode", "string", "否", "场站代码筛选"],
            ["secondClassCode", "string", "否", "二级类码筛选"],
        ],
        response_params=[
            ["items[].id", "number", "记录ID"],
            ["items[].code", "string", "编码"],
            ["items[].name", "string", "编码名称"],
            ["items[].generateTime", "string", "生成时间"],
            ["total", "number", "总记录数"],
            ["pageNum", "number", "当前页码"],
            ["pageSize", "number", "每页大小"],
        ])
    # 4.9 删除单条记录
    add_api_detail(doc,
        "删除单条记录", "DELETE", "/api/codes/:id", "需要登录",
        request_params=[
            ["id", "number", "是", "记录ID（路径参数）"],
        ],
        response_params=[
            ["message", "string", "操作结果提示"],
        ])
    # 4.10 批量删除记录
    add_api_detail(doc,
        "批量删除记录", "DELETE", "/api/codes/batch", "需要登录",
        request_params=[
            ["ids", "number[]", "是", "待删除的记录ID列表"],
        ],
        response_params=[
            ["deletedCount", "number", "成功删除数量"],
        ])
    # 4.11 导出历史记录
    add_api_detail(doc,
        "导出历史记录", "GET", "/api/codes/export", "需要登录",
        request_params=[
            ["typeCode", "string", "否", "类型代码筛选（Query）"],
            ["stationCode", "string", "否", "场站代码筛选（Query）"],
            ["secondClassCode", "string", "否", "二级类码筛选（Query）"],
        ],
        response_params=[
            ["file", "binary", "返回Excel文件（.xlsx）下载"],
        ])
    # 4.12 保存最近条件
    add_api_detail(doc,
        "保存最近条件", "POST", "/api/codes/recent-conditions", "需要登录",
        request_params=[
            ["conditions", "object", "是", "查询条件JSON对象"],
            ["summary", "string", "是", "条件摘要描述"],
        ],
        response_params=[
            ["id", "number", "保存的条件记录ID"],
        ])
    # 4.13 获取最近条件
    add_api_detail(doc,
        "获取最近条件", "GET", "/api/codes/recent-conditions", "需要登录",
        response_params=[
            ["[].id", "number", "条件记录ID"],
            ["[].conditionData", "object", "查询条件数据"],
            ["[].conditionSummary", "string", "条件摘要"],
            ["[].createTm", "string", "创建时间"],
        ])


# ============================================================
#  Section 5: 自动编码模块接口
# ============================================================
def add_section_auto_code(doc):
    add_heading1(doc, "自动编码模块接口")
    add_para(doc, "自动编码模块支持通过上传Excel文件，自动完成编码映射与生成流程，接口路径以 /api/auto-code 开头。")
    add_heading2(doc, "自动编码生成")
    add_module_summary(doc, [
        ["自动编码生成", "POST", "/api/auto-code/generate", "三步流程：上传文件→字段映射→编码生成"],
    ])
    add_api_detail(doc,
        "自动编码生成", "POST", "/api/auto-code/generate", "需要登录",
        request_params=[
            ["file", "file", "是", "上传的Excel文件（.xlsx/.xls），multipart/form-data"],
            ["config", "string", "是", "映射配置JSON字符串，包含字段映射关系"],
        ],
        response_params=[
            ["codes", "array", "生成的编码列表"],
            ["totalCount", "number", "待处理总数"],
            ["matchedCount", "number", "匹配成功数量"],
            ["failedCount", "number", "匹配失败数量"],
        ])

# ============================================================
#  Section 6: 编码校验模块接口
# ============================================================
def add_section_validate(doc):
    add_heading1(doc, "编码校验模块接口")
    add_para(doc, "编码校验模块提供编码解析与批量修正能力，接口路径以 /api/validate 开头。")
    add_module_summary(doc, [
        ["批量解析编码段", "POST", "/api/validate/resolve-codes", "批量解析31位编码的各个段位信息"],
        ["批量修正编码", "POST", "/api/validate/correct-codes", "批量修正编码中的错误段位"],
    ])
    # 6.1 批量解析编码段
    add_api_detail(doc,
        "批量解析编码段", "POST", "/api/validate/resolve-codes", "需要登录",
        request_params=[
            ["codes", "string[]", "是", "待解析的31位编码列表，最多1000条"],
        ],
        response_params=[
            ["[].rawCode", "string", "原始编码"],
            ["[].segments[].label", "string", "段位标签"],
            ["[].segments[].code", "string", "段位编码"],
            ["[].segments[].name", "string", "段位名称"],
            ["[].isValid", "boolean", "编码是否有效"],
            ["[].errorMessage", "string", "解析错误信息（无效时）"],
        ])
    # 6.2 批量修正编码
    add_api_detail(doc,
        "批量修正编码", "POST", "/api/validate/correct-codes", "需要登录",
        request_params=[
            ["items[].code", "string", "是", "原始编码"],
            ["items[].description", "string", "是", "编码描述"],
            ["items[].modification", "string", "是", "修正说明"],
        ],
        response_params=[
            ["items[].oldCode", "string", "原始编码"],
            ["items[].newCode", "string", "修正后的新编码"],
            ["items[].description", "string", "编码描述"],
            ["items[].modification", "string", "修正说明"],
            ["items[].changes[].segmentLabel", "string", "变更段位标签"],
            ["items[].changes[].oldValue", "string", "变更前值"],
            ["items[].changes[].newValue", "string", "变更后值"],
            ["items[].changes[].start", "number", "变更起始位置"],
            ["items[].changes[].length", "number", "变更长度"],
            ["items[].duplicate", "boolean", "是否存在重复"],
            ["items[].correctionTime", "string", "修正时间"],
            ["totalCount", "number", "处理总数"],
        ])


# ============================================================
#  Section 7: 字典管理模块接口
# ============================================================
def add_section_dict(doc):
    add_heading1(doc, "字典管理模块接口")
    add_para(doc, "字典管理模块维护测点编码体系中的各类字典数据，接口路径以 /api/dict 开头。")
    add_module_summary(doc, [
        ["解析编码", "POST", "/api/dict/parse-code", "解析31位编码为段位信息"],
        ["快速检索", "GET", "/api/dict/quick-search", "关键字快速检索字典数据"],
        ["获取字典树", "GET", "/api/dict/tree", "获取字典树结构（前三级）"],
        ["获取数据类码树", "GET", "/api/dict/tree/data-codes", "惰性加载数据码树结构"],
        ["获取最大数据码", "GET", "/api/dict/max-data-code", "获取当前最大数据码"],
        ["获取最大数据分类码", "GET", "/api/dict/max-data-category-code", "获取当前最大数据分类码"],
        ["获取字典列表", "GET", "/api/dict/:dictType", "分页获取指定类型的字典数据"],
        ["获取字典项列表", "GET", "/api/dict/:dictType/items", "获取指定字典类型的所有项"],
        ["获取数据类型筛选", "GET", "/api/dict/data-type/filter", "获取数据类型筛选选项"],
        ["按类型获取数据码", "GET", "/api/dict/data-code/:dataTypeCode", "按数据类型获取数据码列表"],
        ["按类型获取二级类码", "GET", "/api/dict/second-class/:typeCode", "按类型获取二级类码列表"],
        ["手动新增字典", "POST", "/api/dict/manual-code", "手动新增单条字典记录"],
        ["批量新增字典", "POST", "/api/dict/manual-code/batch", "批量新增字典记录"],
        ["字典手动统计", "GET", "/api/dict/manual-statistics", "分页查询手动新增的字典统计"],
        ["导出手动统计", "GET", "/api/dict/manual-statistics/export", "导出手动新增统计为Excel"],
    ])
    # 7.1 解析编码
    add_api_detail(doc,
        "解析编码", "POST", "/api/dict/parse-code", "需要登录",
        request_params=[
            ["code", "string", "是", "31位编码"],
        ],
        response_params=[
            ["rawCode", "string", "原始编码"],
            ["segments[].label", "string", "段位标签"],
            ["segments[].code", "string", "段位编码值"],
            ["segments[].name", "string", "段位名称"],
            ["isValid", "boolean", "编码是否有效"],
            ["errorMessage", "string", "错误信息"],
        ])
    # 7.2 快速检索
    add_api_detail(doc,
        "快速检索", "GET", "/api/dict/quick-search", "需要登录",
        request_params=[
            ["keyword", "string", "是", "检索关键字（Query）"],
            ["type", "string", "否", "筛选类型（Query）"],
        ],
        response_params=[
            ["[].typeCode", "string", "类型代码"],
            ["[].secondClassCode", "string", "二级类码"],
            ["[].secondClassName", "string", "二级类名称"],
            ["[].dataCategoryCode", "string", "数据分类码"],
            ["[].dataCategoryName", "string", "数据分类名称"],
            ["[].dataCode", "string", "数据码"],
            ["[].dataName", "string", "数据名称"],
            ["[].source", "string", "数据来源"],
        ])
    # 7.3 获取字典树
    add_api_detail(doc,
        "获取字典树", "GET", "/api/dict/tree", "需要登录",
        response_params=[
            ["code", "string", "节点编码"],
            ["name", "string", "节点名称"],
            ["type", "string", "节点类型"],
            ["childCount", "number", "子节点数量"],
            ["children", "array", "子节点列表（递归结构）"],
        ])
    # 7.4 获取数据类码树
    add_api_detail(doc,
        "获取数据类码树", "GET", "/api/dict/tree/data-codes", "需要登录",
        request_params=[
            ["typeDomainCode", "string", "否", "类型域代码（Query）"],
            ["secondClassCode", "string", "否", "二级类码（Query）"],
            ["dataCategoryCode", "string", "否", "数据分类码（Query）"],
        ],
        response_params=[
            ["[].code", "string", "数据码"],
            ["[].name", "string", "数据码名称"],
            ["[].hasChildren", "boolean", "是否有子节点"],
        ])
    # 7.5 获取最大数据码
    add_api_detail(doc,
        "获取最大数据码", "GET", "/api/dict/max-data-code", "需要登录",
        response_params=[
            ["maxDataCode", "string", "当前最大数据码"],
        ])
    # 7.6 获取最大数据分类码
    add_api_detail(doc,
        "获取最大数据分类码", "GET", "/api/dict/max-data-category-code", "需要登录",
        response_params=[
            ["maxCategoryCode", "string", "当前最大数据分类码"],
        ])
    # 7.7 获取字典列表
    add_api_detail(doc,
        "获取字典列表", "GET", "/api/dict/:dictType", "需要登录",
        request_params=[
            ["dictType", "string", "是", "字典类型代码（路径参数）"],
            ["pageNum", "number", "否", "当前页码"],
            ["pageSize", "number", "否", "每页记录数"],
        ],
        response_params=[
            ["items", "array", "字典项列表"],
            ["total", "number", "总记录数"],
            ["pageNum", "number", "当前页码"],
            ["pageSize", "number", "每页大小"],
        ])
    # 7.8 获取字典项列表
    add_api_detail(doc,
        "获取字典项列表", "GET", "/api/dict/:dictType/items", "需要登录",
        request_params=[
            ["dictType", "string", "是", "字典类型代码（路径参数）"],
        ],
        response_params=[
            ["[].code", "string", "字典项编码"],
            ["[].name", "string", "字典项名称"],
        ])
    # 7.9 获取数据类型筛选
    add_api_detail(doc,
        "获取数据类型筛选", "GET", "/api/dict/data-type/filter", "需要登录",
        response_params=[
            ["[].code", "string", "数据类型代码"],
            ["[].name", "string", "数据类型名称"],
            ["[].count", "number", "数量"],
        ])
    # 7.10 按类型获取数据码
    add_api_detail(doc,
        "按类型获取数据码", "GET", "/api/dict/data-code/:dataTypeCode", "需要登录",
        request_params=[
            ["dataTypeCode", "string", "是", "数据类型代码（路径参数）"],
        ],
        response_params=[
            ["[].code", "string", "数据码"],
            ["[].name", "string", "数据码名称"],
        ])
    # 7.11 按类型获取二级类码
    add_api_detail(doc,
        "按类型获取二级类码", "GET", "/api/dict/second-class/:typeCode", "需要登录",
        request_params=[
            ["typeCode", "string", "是", "类型代码（路径参数）"],
        ],
        response_params=[
            ["[].code", "string", "二级类码"],
            ["[].name", "string", "二级类名称"],
        ])
    # 7.12 手动新增字典
    add_api_detail(doc,
        "手动新增字典", "POST", "/api/dict/manual-code", "需要登录",
        request_params=[
            ["typeCode", "string", "是", "类型代码"],
            ["secondClassCode", "string", "是", "二级类码"],
            ["dataCategoryCode", "string", "是", "数据分类码"],
            ["dataCategoryName", "string", "是", "数据分类名称"],
            ["dataCode", "string", "是", "数据码"],
            ["dataName", "string", "是", "数据名称"],
        ],
        response_params=[
            ["id", "number", "新增记录ID"],
            ["message", "string", "操作结果提示"],
        ])
    # 7.13 批量新增字典
    add_api_detail(doc,
        "批量新增字典", "POST", "/api/dict/manual-code/batch", "需要登录",
        request_params=[
            ["[].typeCode", "string", "是", "类型代码"],
            ["[].secondClassCode", "string", "是", "二级类码"],
            ["[].dataCategoryCode", "string", "是", "数据分类码"],
            ["[].dataCategoryName", "string", "是", "数据分类名称"],
            ["[].dataCode", "string", "是", "数据码"],
            ["[].dataName", "string", "是", "数据名称"],
        ],
        response_params=[
            ["savedCount", "number", "成功新增数量"],
            ["totalCount", "number", "提交总数"],
        ])
    # 7.14 字典手动统计
    add_api_detail(doc,
        "字典手动统计", "GET", "/api/dict/manual-statistics", "需要登录",
        request_params=[
            ["pageNum", "number", "否", "当前页码"],
            ["pageSize", "number", "否", "每页记录数"],
            ["secondClassCode", "string", "否", "二级类码筛选（Query）"],
            ["typeCode", "string", "否", "类型代码筛选（Query）"],
        ],
        response_params=[
            ["items", "array", "统计列表"],
            ["total", "number", "总记录数"],
            ["pageNum", "number", "当前页码"],
            ["pageSize", "number", "每页大小"],
        ])
    # 7.15 导出手动统计
    add_api_detail(doc,
        "导出手动统计", "GET", "/api/dict/manual-statistics/export", "需要登录",
        response_params=[
            ["file", "binary", "返回Excel文件（.xlsx）下载"],
        ])


# ============================================================
#  Section 8: 字典审批模块接口
# ============================================================
def add_section_approval(doc):
    add_heading1(doc, "字典审批模块接口")
    add_para(doc, "字典审批模块支持字典数据的提交审批与审批流程管理，接口路径以 /api/approval 开头。")
    add_module_summary(doc, [
        ["提交审批", "POST", "/api/approval/submit", "提交字典数据审批申请"],
        ["我的提交记录", "GET", "/api/approval/my-submissions", "查询当前用户的审批提交记录"],
        ["待审批列表", "GET", "/api/approval/pending-list", "查询待审批列表（仅admin）"],
        ["审批通过", "POST", "/api/approval/:id/approve", "审批通过申请（仅admin）"],
        ["审批拒绝", "POST", "/api/approval/:id/reject", "审批拒绝申请（仅admin）"],
    ])
    # 8.1 提交审批
    add_api_detail(doc,
        "提交审批", "POST", "/api/approval/submit", "需要登录",
        request_params=[
            ["typeCode", "string", "是", "类型代码"],
            ["secondClassCode", "string", "是", "二级类码"],
            ["secondClassName", "string", "是", "二级类名称"],
            ["dataCategoryCode", "string", "是", "数据分类码"],
            ["dataCategoryName", "string", "是", "数据分类名称"],
            ["dataCode", "string", "是", "数据码"],
            ["dataName", "string", "是", "数据名称"],
        ],
        response_params=[
            ["id", "number", "审批申请ID"],
            ["status", "string", "审批状态"],
        ])
    # 8.2 我的提交记录
    add_api_detail(doc,
        "我的提交记录", "GET", "/api/approval/my-submissions", "需要登录",
        request_params=[
            ["pageNum", "number", "否", "当前页码"],
            ["pageSize", "number", "否", "每页记录数"],
            ["status", "string", "否", "审批状态筛选（Query）"],
        ],
        response_params=[
            ["items", "array", "提交记录列表"],
            ["total", "number", "总记录数"],
            ["pageNum", "number", "当前页码"],
            ["pageSize", "number", "每页大小"],
        ])
    # 8.3 待审批列表
    add_api_detail(doc,
        "待审批列表", "GET", "/api/approval/pending-list", "需要管理员权限",
        request_params=[
            ["pageNum", "number", "否", "当前页码"],
            ["pageSize", "number", "否", "每页记录数"],
            ["region", "string", "否", "区域筛选（Query）"],
        ],
        response_params=[
            ["items", "array", "待审批记录列表"],
            ["total", "number", "总记录数"],
            ["pageNum", "number", "当前页码"],
            ["pageSize", "number", "每页大小"],
        ])
    # 8.4 审批通过
    add_api_detail(doc,
        "审批通过", "POST", "/api/approval/:id/approve", "需要管理员权限",
        request_params=[
            ["id", "number", "是", "审批申请ID（路径参数）"],
        ],
        response_params=[
            ["message", "string", "操作结果提示"],
            ["distributedSchemas", "array", "数据分发到的租户Schema列表"],
        ])
    # 8.5 审批拒绝
    add_api_detail(doc,
        "审批拒绝", "POST", "/api/approval/:id/reject", "需要管理员权限",
        request_params=[
            ["id", "number", "是", "审批申请ID（路径参数）"],
            ["reason", "string", "是", "拒绝原因"],
        ],
        response_params=[
            ["message", "string", "操作结果提示"],
        ])

# ============================================================
#  Section 9: 场站管理模块接口
# ============================================================
def add_section_station(doc):
    add_heading1(doc, "场站管理模块接口")
    add_para(doc, "场站管理模块负责新能源场站信息的增删改查管理，接口路径以 /api/station 开头。")
    add_module_summary(doc, [
        ["获取场站列表", "GET", "/api/station/list", "分页查询场站列表"],
        ["新增场站", "POST", "/api/station", "新增单个场站"],
        ["批量新增场站", "POST", "/api/station/batch", "批量新增场站"],
        ["编辑场站", "PUT", "/api/station/:id", "编辑场站信息"],
        ["删除场站", "DELETE", "/api/station/:id", "删除单个场站"],
        ["清空场站", "DELETE", "/api/station/all", "清空所有场站数据"],
        ["导出场站", "GET", "/api/station/export", "导出Excel格式的场站列表"],
    ])
    # 9.1 获取场站列表
    add_api_detail(doc,
        "获取场站列表", "GET", "/api/station/list", "需要登录",
        request_params=[
            ["pageNum", "number", "否", "当前页码"],
            ["pageSize", "number", "否", "每页记录数"],
        ],
        response_params=[
            ["items", "array", "场站列表"],
            ["total", "number", "总记录数"],
            ["pageNum", "number", "当前页码"],
            ["pageSize", "number", "每页大小"],
        ])
    # 9.2 新增场站
    add_api_detail(doc,
        "新增场站", "POST", "/api/station", "需要登录",
        request_params=[
            ["code", "string", "是", "场站代码"],
            ["name", "string", "是", "场站名称"],
            ["region", "string", "否", "所属区域"],
            ["type", "string", "否", "场站类型"],
        ],
        response_params=[
            ["id", "number", "新建场站ID"],
            ["code", "string", "场站代码"],
            ["name", "string", "场站名称"],
        ])
    # 9.3 批量新增场站
    add_api_detail(doc,
        "批量新增场站", "POST", "/api/station/batch", "需要登录",
        request_params=[
            ["[].code", "string", "是", "场站代码"],
            ["[].name", "string", "是", "场站名称"],
            ["[].region", "string", "否", "所属区域"],
            ["[].type", "string", "否", "场站类型"],
        ],
        response_params=[
            ["savedCount", "number", "成功新增数量"],
            ["totalCount", "number", "提交总数"],
        ])
    # 9.4 编辑场站
    add_api_detail(doc,
        "编辑场站", "PUT", "/api/station/:id", "需要登录",
        request_params=[
            ["id", "number", "是", "场站ID（路径参数）"],
            ["name", "string", "否", "场站名称"],
            ["region", "string", "否", "所属区域"],
            ["type", "string", "否", "场站类型"],
        ],
        response_params=[
            ["message", "string", "操作结果提示"],
        ])
    # 9.5 删除场站
    add_api_detail(doc,
        "删除场站", "DELETE", "/api/station/:id", "需要登录",
        request_params=[
            ["id", "number", "是", "场站ID（路径参数）"],
        ],
        response_params=[
            ["message", "string", "操作结果提示"],
        ])
    # 9.6 清空场站
    add_api_detail(doc,
        "清空场站", "DELETE", "/api/station/all", "需要管理员权限",
        response_params=[
            ["deletedCount", "number", "清除的场站数量"],
        ])
    # 9.7 导出场站
    add_api_detail(doc,
        "导出场站", "GET", "/api/station/export", "需要登录",
        response_params=[
            ["file", "binary", "返回Excel文件（.xlsx）下载"],
        ])


# ============================================================
#  Section 10: 统计分析模块接口
# ============================================================
def add_section_statistics(doc):
    add_heading1(doc, "统计分析模块接口")
    add_para(doc, "统计分析模块提供编码生成统计与全量测点数据统计功能，接口路径以 /api/statistics 开头。")

    # --- 10.1 编码生成统计 ---
    add_heading2(doc, "编码生成统计")
    add_module_summary(doc, [
        ["生成概览", "GET", "/api/statistics/code-gen/overview", "编码生成总体概览"],
        ["类型分布", "GET", "/api/statistics/code-gen/by-type", "按能源类型统计分布"],
        ["二级类码分布", "GET", "/api/statistics/code-gen/by-second-class", "按二级类码统计分布"],
        ["场站分布", "GET", "/api/statistics/code-gen/by-station", "按场站统计分布"],
        ["生成记录列表", "GET", "/api/statistics/code-gen/list", "分页查询生成记录"],
        ["分组详情", "GET", "/api/statistics/code-gen/group-detail", "按批次号查询分组详情"],
        ["删除分组", "POST", "/api/statistics/code-gen/delete-groups", "删除指定批次分组"],
        ["生成趋势", "GET", "/api/statistics/code-gen/trend", "查询编码生成趋势数据"],
    ])
    # 10.1.1 生成概览
    add_api_detail(doc,
        "生成概览", "GET", "/api/statistics/code-gen/overview", "需要登录",
        response_params=[
            ["totalCodes", "number", "累计编码总数"],
            ["todayCodes", "number", "今日生成数量"],
            ["thisWeekCodes", "number", "本周生成数量"],
            ["thisMonthCodes", "number", "本月生成数量"],
        ])
    # 10.1.2 类型分布
    add_api_detail(doc,
        "类型分布", "GET", "/api/statistics/code-gen/by-type", "需要登录",
        response_params=[
            ["windCount", "number", "风电编码数量"],
            ["solarCount", "number", "光伏编码数量"],
            ["hydroCount", "number", "水电编码数量"],
            ["otherCount", "number", "其他类型编码数量"],
        ])
    # 10.1.3 二级类码分布
    add_api_detail(doc,
        "二级类码分布", "GET", "/api/statistics/code-gen/by-second-class", "需要登录",
        request_params=[
            ["type", "string", "否", "能源类型筛选（Query）"],
        ],
        response_params=[
            ["[].name", "string", "二级类码名称"],
            ["[].value", "number", "编码数量"],
        ])
    # 10.1.4 场站分布
    add_api_detail(doc,
        "场站分布", "GET", "/api/statistics/code-gen/by-station", "需要登录",
        response_params=[
            ["[].name", "string", "场站名称"],
            ["[].value", "number", "编码数量"],
        ])
    # 10.1.5 生成记录列表
    add_api_detail(doc,
        "生成记录列表", "GET", "/api/statistics/code-gen/list", "需要登录",
        request_params=[
            ["pageNum", "number", "否", "当前页码"],
            ["pageSize", "number", "否", "每页记录数"],
            ["typeCode", "string", "否", "类型代码筛选"],
            ["stationCode", "string", "否", "场站代码筛选"],
            ["startDate", "string", "否", "开始日期筛选"],
            ["endDate", "string", "否", "结束日期筛选"],
        ],
        response_params=[
            ["items", "array", "生成记录列表"],
            ["total", "number", "总记录数"],
            ["pageNum", "number", "当前页码"],
            ["pageSize", "number", "每页大小"],
        ])
    # 10.1.6 分组详情
    add_api_detail(doc,
        "分组详情", "GET", "/api/statistics/code-gen/group-detail", "需要登录",
        request_params=[
            ["batchNo", "string", "是", "批次号（Query）"],
        ],
        response_params=[
            ["batchNo", "string", "批次号"],
            ["items", "array", "该批次下的编码列表"],
            ["totalCount", "number", "批次内编码总数"],
        ])
    # 10.1.7 删除分组
    add_api_detail(doc,
        "删除分组", "POST", "/api/statistics/code-gen/delete-groups", "需要登录",
        request_params=[
            ["ids", "number[]", "是", "待删除的分组ID列表"],
        ],
        response_params=[
            ["deletedCount", "number", "成功删除数量"],
        ])
    # 10.1.8 生成趋势
    add_api_detail(doc,
        "生成趋势", "GET", "/api/statistics/code-gen/trend", "需要登录",
        request_params=[
            ["startDate", "string", "否", "开始日期（Query）"],
            ["endDate", "string", "否", "结束日期（Query）"],
        ],
        response_params=[
            ["[].date", "string", "日期"],
            ["[].count", "number", "生成数量"],
        ])

    # --- 10.2 全量测点统计 ---
    add_heading2(doc, "全量测点统计")
    add_module_summary(doc, [
        ["导入测点文件", "POST", "/api/statistics/measurement/import", "上传Excel导入全量测点数据"],
        ["查询导入状态", "GET", "/api/statistics/measurement/import-status", "查询当前导入进度"],
        ["取消导入", "POST", "/api/statistics/measurement/cancel-import", "取消正在进行的导入操作"],
        ["测点概览", "GET", "/api/statistics/measurement/overview", "全量测点概览统计"],
        ["二级类码分布", "GET", "/api/statistics/measurement/by-second-class", "按二级类码统计测点分布"],
        ["场站分布", "GET", "/api/statistics/measurement/by-station", "按场站统计测点分布"],
        ["测点列表", "GET", "/api/statistics/measurement/list", "分页查询测点列表"],
        ["筛选条件", "GET", "/api/statistics/measurement/filter-options", "获取测点筛选条件选项"],
        ["清空数据", "DELETE", "/api/statistics/measurement/clear", "清空所有测点数据"],
        ["批量检测编码", "POST", "/api/statistics/measurement/check-codes", "批量检测编码是否存在"],
    ])
    # 10.2.1 导入测点文件
    add_api_detail(doc,
        "导入测点文件", "POST", "/api/statistics/measurement/import", "需要登录",
        request_params=[
            ["file", "file", "是", "Excel文件（.xlsx/.xls），multipart/form-data，最大200MB"],
        ],
        response_params=[
            ["status", "string", "导入状态（processing/completed）"],
            ["batchId", "string", "导入批次号"],
            ["message", "string", "提示信息"],
        ])
    # 10.2.2 查询导入状态
    add_api_detail(doc,
        "查询导入状态", "GET", "/api/statistics/measurement/import-status", "需要登录",
        response_params=[
            ["importing", "boolean", "是否正在导入"],
            ["totalRows", "number", "总行数"],
            ["importedRows", "number", "已导入行数"],
            ["validRows", "number", "有效行数"],
            ["status", "string", "当前状态"],
        ])
    # 10.2.3 取消导入
    add_api_detail(doc,
        "取消导入", "POST", "/api/statistics/measurement/cancel-import", "需要登录",
        response_params=[
            ["message", "string", "操作结果提示"],
        ])
    # 10.2.4 测点概览
    add_api_detail(doc,
        "测点概览", "GET", "/api/statistics/measurement/overview", "需要登录",
        response_params=[
            ["totalPoints", "number", "测点总数"],
            ["windCount", "number", "风电测点数"],
            ["solarCount", "number", "光伏测点数"],
            ["otherCount", "number", "其他类型测点数"],
            ["lastImportTime", "string", "最后导入时间"],
        ])
    # 10.2.5 二级类码分布
    add_api_detail(doc,
        "二级类码分布", "GET", "/api/statistics/measurement/by-second-class", "需要登录",
        request_params=[
            ["type", "string", "否", "能源类型筛选（Query）"],
        ],
        response_params=[
            ["[].name", "string", "二级类码名称"],
            ["[].value", "number", "测点数量"],
        ])
    # 10.2.6 场站分布
    add_api_detail(doc,
        "场站分布", "GET", "/api/statistics/measurement/by-station", "需要登录",
        response_params=[
            ["[].name", "string", "场站名称"],
            ["[].value", "number", "测点数量"],
        ])
    # 10.2.7 测点列表
    add_api_detail(doc,
        "测点列表", "GET", "/api/statistics/measurement/list", "需要登录",
        request_params=[
            ["pageNum", "number", "否", "当前页码"],
            ["pageSize", "number", "否", "每页记录数"],
            ["typeCode", "string", "否", "类型筛选"],
            ["stationCode", "string", "否", "场站筛选"],
            ["secondClassCode", "string", "否", "二级类码筛选"],
        ],
        response_params=[
            ["items", "array", "测点列表"],
            ["total", "number", "总记录数"],
            ["pageNum", "number", "当前页码"],
            ["pageSize", "number", "每页大小"],
        ])
    # 10.2.8 筛选条件
    add_api_detail(doc,
        "筛选条件", "GET", "/api/statistics/measurement/filter-options", "需要登录",
        response_params=[
            ["types", "array", "可选的类型列表"],
            ["stations", "array", "可选的场站列表"],
            ["secondClasses", "array", "可选的二级类码列表"],
        ])
    # 10.2.9 清空数据
    add_api_detail(doc,
        "清空数据", "DELETE", "/api/statistics/measurement/clear", "需要管理员权限",
        response_params=[
            ["deletedCount", "number", "清除的测点数量"],
        ])
    # 10.2.10 批量检测编码
    add_api_detail(doc,
        "批量检测编码", "POST", "/api/statistics/measurement/check-codes", "需要登录",
        request_params=[
            ["codes", "string[]", "是", "待检测的31位编码列表，最多10000条"],
        ],
        response_params=[
            ["[].code", "string", "编码"],
            ["[].exists", "boolean", "编码是否存在"],
        ])


# ============================================================
#  Section 11: 时序规则模块接口
# ============================================================
def add_section_tsr(doc):
    add_heading1(doc, "时序规则模块接口")
    add_para(doc, "时序规则模块（Time Series Rules）负责时序数据库的连接、数据导入与规则生成导出，接口路径以 /api/tsr 开头。")
    add_module_summary(doc, [
        ["数据库连接测试", "GET", "/api/tsr/ping", "测试时序数据库连接是否正常"],
        ["获取租户信息", "GET", "/api/tsr/tenant", "获取当前租户的Schema等信息"],
        ["获取数据概览", "GET", "/api/tsr/overview", "获取场站与测点数据概览"],
        ["获取导入进度", "GET", "/api/tsr/import/progress", "查询当前数据导入进度"],
        ["取消导入", "POST", "/api/tsr/import/cancel", "取消正在进行的导入"],
        ["清空所有数据", "POST", "/api/tsr/clear", "清空所有时序规则数据"],
        ["导入场站数据", "POST", "/api/tsr/import/station", "上传Excel导入场站数据"],
        ["导入测点数据", "POST", "/api/tsr/import/measure", "上传Excel导入测点数据"],
        ["生成规则", "POST", "/api/tsr/generate", "开始生成四种类型的时序规则"],
        ["生成规则进度", "GET", "/api/tsr/generate/progress", "查询规则生成进度"],
        ["导出单类型总体", "GET", "/api/tsr/export/overall/:type", "导出指定类型的总体规则（sz/tb/yx/zd）"],
        ["导出全部类型总体", "GET", "/api/tsr/export/overall", "导出全部类型的总体规则ZIP包"],
        ["分批导出全部类型", "GET", "/api/tsr/export/split-all", "分批导出全部类型的规则"],
        ["分批导出单类型", "GET", "/api/tsr/export/split/:type", "分批导出指定类型的规则"],
        ["导出单类型ZIP", "GET", "/api/tsr/export/:type", "导出指定类型规则为ZIP包"],
        ["批量导出全部规则", "GET", "/api/tsr/export-all", "批量导出所有规则数据"],
    ])
    # 11.1 数据库连接测试
    add_api_detail(doc,
        "数据库连接测试", "GET", "/api/tsr/ping", "需要登录",
        response_params=[
            ["status", "string", "连接状态（ok/failed）"],
            ["latency", "number", "延迟（毫秒）"],
        ])
    # 11.2 获取租户信息
    add_api_detail(doc,
        "获取租户信息", "GET", "/api/tsr/tenant", "需要登录",
        response_params=[
            ["schema", "string", "租户Schema名称"],
            ["displayName", "string", "租户显示名称"],
        ])
    # 11.3 获取数据概览
    add_api_detail(doc,
        "获取数据概览", "GET", "/api/tsr/overview", "需要登录",
        response_params=[
            ["stationCount", "number", "场站数量"],
            ["measureCount", "number", "测点数量"],
        ])
    # 11.4 获取导入进度
    add_api_detail(doc,
        "获取导入进度", "GET", "/api/tsr/import/progress", "需要登录",
        response_params=[
            ["importing", "boolean", "是否正在导入"],
            ["stage", "string", "当前导入阶段"],
            ["progress", "number", "导入进度百分比（0-100）"],
        ])
    # 11.5 取消导入
    add_api_detail(doc,
        "取消导入", "POST", "/api/tsr/import/cancel", "需要登录",
        response_params=[
            ["message", "string", "操作结果提示"],
        ])
    # 11.6 清空所有数据
    add_api_detail(doc,
        "清空所有数据", "POST", "/api/tsr/clear", "需要管理员权限",
        response_params=[
            ["message", "string", "操作结果提示"],
        ])
    # 11.7 导入场站数据
    add_api_detail(doc,
        "导入场站数据", "POST", "/api/tsr/import/station", "需要登录",
        request_params=[
            ["file", "file", "是", "场站数据Excel文件，multipart/form-data"],
        ],
        response_params=[
            ["status", "string", "导入状态"],
            ["totalRows", "number", "总行数"],
            ["message", "string", "提示信息"],
        ])
    # 11.8 导入测点数据
    add_api_detail(doc,
        "导入测点数据", "POST", "/api/tsr/import/measure", "需要登录",
        request_params=[
            ["file", "file", "是", "测点数据Excel文件，multipart/form-data"],
        ],
        response_params=[
            ["status", "string", "导入状态"],
            ["totalRows", "number", "总行数"],
            ["message", "string", "提示信息"],
        ])
    # 11.9 生成规则
    add_api_detail(doc,
        "生成规则", "POST", "/api/tsr/generate", "需要登录",
        response_params=[
            ["status", "string", "生成状态（started）"],
            ["message", "string", "提示信息"],
        ])
    # 11.10 生成规则进度
    add_api_detail(doc,
        "生成规则进度", "GET", "/api/tsr/generate/progress", "需要登录",
        response_params=[
            ["generating", "boolean", "是否正在生成"],
            ["stage", "string", "当前生成阶段"],
            ["progress", "number", "生成进度百分比（0-100）"],
            ["typeProgress", "object", "各类型规则生成进度"],
        ])
    # 11.11 导出单类型总体
    add_api_detail(doc,
        "导出单类型总体", "GET", "/api/tsr/export/overall/:type", "需要登录",
        request_params=[
            ["type", "string", "是", "规则类型（sz=数值/tb=图表/yx=运行/zd=诊断）（路径参数）"],
        ],
        response_params=[
            ["file", "binary", "返回Excel文件下载"],
        ])
    # 11.12 导出全部类型总体
    add_api_detail(doc,
        "导出全部类型总体", "GET", "/api/tsr/export/overall", "需要登录",
        response_params=[
            ["file", "binary", "返回ZIP压缩包下载"],
        ])
    # 11.13 分批导出全部类型
    add_api_detail(doc,
        "分批导出全部类型", "GET", "/api/tsr/export/split-all", "需要登录",
        response_params=[
            ["file", "binary", "返回ZIP压缩包下载"],
        ])
    # 11.14 分批导出单类型
    add_api_detail(doc,
        "分批导出单类型", "GET", "/api/tsr/export/split/:type", "需要登录",
        request_params=[
            ["type", "string", "是", "规则类型（路径参数）"],
        ],
        response_params=[
            ["file", "binary", "返回ZIP压缩包下载"],
        ])
    # 11.15 导出单类型ZIP
    add_api_detail(doc,
        "导出单类型ZIP", "GET", "/api/tsr/export/:type", "需要登录",
        request_params=[
            ["type", "string", "是", "规则类型（路径参数）"],
        ],
        response_params=[
            ["file", "binary", "返回ZIP压缩包下载"],
        ])
    # 11.16 批量导出全部规则
    add_api_detail(doc,
        "批量导出全部规则", "GET", "/api/tsr/export-all", "需要登录",
        response_params=[
            ["file", "binary", "返回ZIP压缩包下载"],
        ])

# ============================================================
#  Section 12: 数据源管理模块接口
# ============================================================
def add_section_datasource(doc):
    add_heading1(doc, "数据源管理模块接口")
    add_para(doc, "数据源管理模块管理时序数据库的连接配置，接口路径以 /api/datasource 开头。")
    add_module_summary(doc, [
        ["获取配置", "GET", "/api/datasource/config", "获取当前数据源配置信息"],
        ["测试连接", "POST", "/api/datasource/test", "测试数据源连接是否可用"],
        ["保存配置", "PUT", "/api/datasource/config", "保存或更新数据源配置"],
    ])
    # 12.1 获取配置
    add_api_detail(doc,
        "获取配置", "GET", "/api/datasource/config", "需要登录",
        response_params=[
            ["host", "string", "数据库主机地址"],
            ["port", "number", "端口号"],
            ["dbName", "string", "数据库名称"],
            ["schema", "string", "Schema名称"],
            ["user", "string", "用户名"],
            ["ssl", "boolean", "是否启用SSL"],
        ])
    # 12.2 测试连接
    add_api_detail(doc,
        "测试连接", "POST", "/api/datasource/test", "需要登录",
        request_params=[
            ["host", "string", "是", "数据库主机地址"],
            ["port", "number", "是", "端口号"],
            ["dbName", "string", "是", "数据库名称"],
            ["schema", "string", "是", "Schema名称"],
            ["user", "string", "是", "用户名"],
            ["password", "string", "是", "密码"],
            ["ssl", "boolean", "否", "是否启用SSL"],
        ],
        response_params=[
            ["status", "string", "连接状态（ok/failed）"],
            ["message", "string", "提示信息"],
        ])
    # 12.3 保存配置
    add_api_detail(doc,
        "保存配置", "PUT", "/api/datasource/config", "需要登录",
        request_params=[
            ["host", "string", "是", "数据库主机地址"],
            ["port", "number", "是", "端口号"],
            ["dbName", "string", "是", "数据库名称"],
            ["schema", "string", "是", "Schema名称"],
            ["user", "string", "是", "用户名"],
            ["password", "string", "是", "密码"],
            ["ssl", "boolean", "否", "是否启用SSL"],
        ],
        response_params=[
            ["message", "string", "操作结果提示"],
        ])

# ============================================================
#  Section 13: 系统通用接口
# ============================================================
def add_section_system(doc):
    add_heading1(doc, "系统通用接口")
    add_para(doc, "系统通用接口提供健康检查、版本查询等基础功能。")
    add_module_summary(doc, [
        ["健康检查", "GET", "/api/health", "系统健康状态检测"],
        ["版本信息", "GET", "/api/version", "获取系统版本信息"],
        ["租户列表", "GET", "/api/tenants", "获取所有租户列表"],
    ])
    # 13.1 健康检查
    add_api_detail(doc,
        "健康检查", "GET", "/api/health", "无需认证",
        response_params=[
            ["status", "string", "系统状态（UP/DOWN）"],
            ["uptime", "number", "系统运行时间（秒）"],
        ])
    # 13.2 版本信息
    add_api_detail(doc,
        "版本信息", "GET", "/api/version", "无需认证",
        response_params=[
            ["version", "string", "系统版本号"],
            ["buildTime", "string", "构建时间"],
        ])
    # 13.3 租户列表
    add_api_detail(doc,
        "租户列表", "GET", "/api/tenants", "需要登录",
        response_params=[
            ["[].id", "string", "租户ID"],
            ["[].displayName", "string", "租户显示名称"],
        ])


# ============================================================
#  Section 14: 错误码定义
# ============================================================
def add_section_error_codes(doc):
    add_heading1(doc, "错误码定义")
    add_heading2(doc, "通用错误码")
    add_para(doc, "全局通用错误码定义如下：")
    add_table(doc, ["错误码", "HTTP状态码", "说明"], [
        ["VALIDATION_ERROR", "400", "参数校验失败，请求参数不符合规范"],
        ["AUTH_REQUIRED", "401", "未登录或登录已过期，需要重新登录"],
        ["FORBIDDEN", "403", "权限不足，当前用户无操作权限"],
        ["RESOURCE_NOT_FOUND", "404", "请求的资源不存在"],
        ["DUPLICATE_SUBMISSION", "409", "重复提交，资源已存在"],
        ["SYSTEM_ERROR", "500", "系统内部异常，请联系管理员"],
        ["REQUEST_TIMEOUT", "504", "请求超时，服务端处理时间过长"],
    ])

    add_heading2(doc, "业务错误码")
    add_para(doc, "各模块的业务错误码定义如下：")
    add_table(doc, ["错误码", "HTTP状态码", "所属模块", "消息"], [
        ["CODE_GEN_FAILED", "500", "编码生成", "编码生成失败，请检查参数"],
        ["CODE_PARSE_FAILED", "400", "字典管理", "编码解析失败，编码格式不正确"],
        ["CODE_EXISTS", "409", "字典管理", "编码已存在，不允许重复"],
        ["DRAFT_NOT_FOUND", "404", "编码生成", "草稿记录不存在"],
        ["IMPORT_IN_PROGRESS", "409", "统计分析", "导入操作正在进行中"],
        ["IMPORT_FILE_INVALID", "400", "统计分析", "导入文件格式不正确"],
        ["APPROVAL_NOT_FOUND", "404", "字典审批", "审批记录不存在"],
        ["APPROVAL_ALREADY_HANDLED", "409", "字典审批", "审批已被处理"],
        ["STATION_CODE_EXISTS", "409", "场站管理", "场站代码已存在"],
        ["TENANT_NOT_FOUND", "404", "数据源", "租户信息不存在"],
        ["CONNECTION_FAILED", "500", "数据源", "数据库连接失败"],
        ["RULE_GEN_IN_PROGRESS", "409", "时序规则", "规则正在生成中，请稍后"],
        ["EXPORT_TOO_LARGE", "413", "时序规则", "导出数据量过大，请使用分批导出"],
        ["FILE_SIZE_EXCEEDED", "413", "通用", "文件大小超过限制"],
        ["BATCH_TOO_LARGE", "400", "通用", "批量操作数量超过上限"],
    ])

    add_heading2(doc, "错误码分段")
    add_para(doc, "为便于错误码管理与扩展，错误码按模块范围进行分段：")
    add_table(doc, ["范围", "模块"], [
        ["AUTH_*", "认证模块"],
        ["CODE_*", "编码生成模块"],
        ["VALIDATE_*", "编码校验模块"],
        ["DICT_*", "字典管理模块"],
        ["APPROVAL_*", "字典审批模块"],
        ["STATION_*", "场站管理模块"],
        ["STAT_*", "统计分析模块"],
        ["TSR_*", "时序规则模块"],
        ["DS_*", "数据源管理模块"],
        ["SYS_*", "系统通用"],
    ])

# ============================================================
#  Main: build the document
# ============================================================
def build_doc():
    doc = create_document("接口文档")
    add_cover(doc, "接口文档", "华电新能源测点编码管理平台", "V1.1", "2026-06-08")

    add_section_overview(doc)
    add_section_general(doc)
    add_section_auth(doc)
    add_section_codes(doc)
    add_section_auto_code(doc)
    add_section_validate(doc)
    add_section_dict(doc)
    add_section_approval(doc)
    add_section_station(doc)
    add_section_statistics(doc)
    add_section_tsr(doc)
    add_section_datasource(doc)
    add_section_system(doc)
    add_section_error_codes(doc)

    save_doc(doc, "接口文档.docx")

if __name__ == "__main__":
    build_doc()
