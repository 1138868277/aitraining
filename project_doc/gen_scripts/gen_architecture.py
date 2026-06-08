#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成《总体架构设计文档》- 华电新能源测点编码管理平台
"""

import sys
sys.path.insert(0, '/Users/liuhaojun/Documents/AI培训/04 脚手架/aitraining/project_doc')
from docx_helper import *

def build_section_1(doc):
    """1. 架构概述"""
    add_heading1(doc, "1. 架构概述")

    add_heading2(doc, "1.1 架构设计目标")
    add_para(doc, "本系统架构设计围绕以下五大目标展开：")
    add_bullet(doc, "可扩展性（Scalability）：系统采用模块化设计，各业务模块解耦，支持独立开发、测试和部署。新增业务模块无需修改现有核心架构，通过统一的扩展机制即可集成。")
    add_bullet(doc, "可维护性（Maintainability）：遵循分层架构原则，每一层职责清晰，代码结构统一。采用TypeScript强类型语言，配合统一的编码规范和代码审查流程，降低维护成本。")
    add_bullet(doc, "安全性（Security）：采用多租户Schema级数据隔离，确保租户间数据互不可见。使用参数化SQL查询防止SQL注入，JWT令牌实现身份认证和授权，关键操作记录审计日志。")
    add_bullet(doc, "可测试性（Testability）：分层架构使得各层可以独立测试。Domain层可脱离HTTP上下文进行纯业务逻辑单元测试，Service层可模拟依赖进行集成测试，Controller层可进行端到端接口测试。")
    add_bullet(doc, "开发效率（Development Efficiency）：采用前后端分离架构，前后端团队可并行开发。共享类型定义包（@cec/contracts）确保前后端接口契约一致，减少联调成本。pnpm monorepo管理模式简化依赖管理和项目配置。")

    add_heading2(doc, "1.2 架构风格")
    add_para(doc, "本系统采用前后端分离 + 三层分层架构（Controller → Service → Domain）的架构风格。前后端通过标准RESTful API进行通信，后端内部遵循严格的三层职责划分。")
    add_para(doc, "前后端分离架构使得前端专注于用户界面和交互体验，后端专注于业务逻辑和数据管理。前端通过HTTP/HTTPS协议调用后端API，数据交换格式为JSON。后端三层架构中，Controller层负责请求接收和响应返回，Service层负责业务编排，Domain层负责核心业务规则和数据访问。")

    add_heading2(doc, "1.3 整体架构描述")
    add_para(doc, "系统整体架构以前端Vue 3 + TypeScript构建用户界面，后端Express + Node.js提供API服务，PostgreSQL作为数据存储层。前端通过Axios HTTP客户端与后端通信，后端采用三层架构（Controller → Service → Domain）组织代码，确保业务逻辑清晰、职责分明。")
    add_para(doc, "多租户方面，采用PostgreSQL Schema级数据隔离方案，每个租户拥有独立的数据库Schema，通过运行时动态切换Schema实现对不同租户数据的访问隔离。租户上下文通过AsyncLocalStorage机制在请求链路中传递，确保数据访问的正确路由。")
    add_para(doc, "缓存方面，字典树等高频读、低频写的数据采用内存缓存，配合TTL（Time-To-Live）机制确保数据时效性。草稿数据暂存于内存中，重启后丢失。所有持久化数据统一存储在PostgreSQL数据库中。")

def build_section_2(doc):
    """2. 技术架构"""
    add_heading1(doc, "2. 技术架构")

    add_heading2(doc, "2.1 技术栈总览")
    add_table(doc,
        ["层次", "技术选型", "版本"],
        [
            ["运行环境", "Node.js", "24.0+"],
            ["后端框架", "Express", "4.21"],
            ["后端语言", "TypeScript", "5.6+"],
            ["前端框架", "Vue 3 (Composition API)", "3.x"],
            ["前端语言", "TypeScript", "5.6+"],
            ["UI组件库", "Element Plus", "最新稳定版"],
            ["数据可视化", "ECharts 6 + vue-echarts", "6.x"],
            ["状态管理", "Pinia", "最新稳定版"],
            ["路由管理", "Vue Router 4", "4.x"],
            ["构建工具", "Vite", "最新稳定版"],
            ["数据库", "PostgreSQL", "16+"],
            ["包管理", "pnpm", "9+"],
            ["HTTP客户端", "Axios", "最新稳定版"],
        ]
    )

    add_heading2(doc, "2.2 后端技术栈")
    add_heading3(doc, "2.2.1 核心框架")
    add_para(doc, "后端基于Node.js 24.0+运行时，使用Express 4.21框架构建Web应用。项目采用TypeScript 5.6+作为开发语言，提供类型安全和更好的开发体验。所有业务代码均使用TypeScript编写，编译后生成JavaScript运行。")

    add_heading3(doc, "2.2.2 三层架构")
    add_para(doc, "后端代码严格遵循Controller → Service → Domain三层架构：")
    add_bullet(doc, "Controller层：负责路由注册、HTTP请求参数解析与校验、统一响应格式封装。Controller不包含任何业务逻辑，仅作为请求入口和响应出口。")
    add_bullet(doc, "Service层：负责业务编排和事务管理。Service协调多个Domain对象的协作，管理工作单元和事务边界，但不包含具体的业务规则。")
    add_bullet(doc, "Domain层：负责核心业务规则和数据访问。Domain对象封装了最细粒度的业务逻辑，通过数据访问对象（DAO）与数据库交互。这是系统中最稳定、复用价值最高的层次。")

    add_heading3(doc, "2.2.3 数据库访问")
    add_para(doc, "采用pg（node-postgres）原生数据库驱动，使用参数化SQL查询防止SQL注入攻击。不使用ORM框架，所有SQL语句由开发人员编写，确保对数据库操作的完全控制。连接池管理使用pg提供的Pool实现。")

    add_heading3(doc, "2.2.4 租户上下文传递")
    add_para(doc, "使用Node.js内置的AsyncLocalStorage（源自async_hooks模块）实现租户上下文的请求级传递。每个HTTP请求进入时，中间件从JWT令牌中解析租户信息，存入AsyncLocalStorage。后续任意层级的代码均可通过AsyncLocalStorage获取当前请求所属的租户，实现无侵入的上下文传递。")

    add_heading3(doc, "2.2.5 身份认证")
    add_para(doc, "使用Node.js内置的crypto模块实现JWT（JSON Web Token）的HS256签名。不引入额外的JWT库，利用crypto.createHmac进行签名和验签操作。Token中包含用户ID、租户编码、角色等必要信息，有效期由配置文件控制。")

    add_heading2(doc, "2.3 前端技术栈")
    add_heading3(doc, "2.3.1 核心框架")
    add_para(doc, "前端使用Vue 3 Composition API + TypeScript构建。Composition API提供了更好的逻辑复用和代码组织能力，TypeScript提供了类型安全。UI组件使用Element Plus组件库，它提供了丰富的企业级组件和一致的设计语言。")

    add_heading3(doc, "2.3.2 数据可视化")
    add_para(doc, "数据可视化使用ECharts 6 + vue-echarts组合。ECharts提供了丰富的图表类型和强大的渲染能力，vue-echarts提供了Vue 3的声明式集成。主要用于编码统计分析、趋势展示等数据可视化场景。")

    add_heading3(doc, "2.3.3 状态管理与路由")
    add_para(doc, "状态管理使用Pinia，它是Vue 3官方推荐的状态管理库，相比Vuex具有更简洁的API和更好的TypeScript支持。路由管理使用Vue Router 4，配合路由守卫实现登录状态检查、权限控制等功能。")

    add_heading3(doc, "2.3.4 构建工具与HTTP客户端")
    add_para(doc, "构建工具使用Vite，它利用ESM（ES Modules）实现极速的冷启动和热更新。HTTP客户端使用Axios，基于Promise的HTTP客户端，支持请求/响应拦截器，用于统一添加认证Token、处理错误响应等。")

    add_heading2(doc, "2.4 工程体系")
    add_para(doc, "项目采用pnpm monorepo管理模式，工作区定义在pnpm-workspace.yaml中。整个项目划分为三个核心包：")
    add_bullet(doc, "packages/contracts（@cec/contracts）：共享类型定义，包含API请求/响应结构、数据库实体类型、枚举常量等。前后端均依赖此包，确保接口契约的一致性和类型安全。")
    add_bullet(doc, "apps/backend（@cec/backend）：后端应用，包含完整的API服务实现。")
    add_bullet(doc, "apps/frontend（@cec/frontend）：前端应用，包含完整的用户界面实现。")
    add_para(doc, "此外，项目还可能包含packages/shared（@cec/shared）包，用于存放前端使用的共享工具函数，如数据格式化、校验规则等。")

    add_heading2(doc, "2.5 选型理由")
    add_table(doc,
        ["技术", "选型理由"],
        [
            ["Node.js + Express", "团队技术栈匹配，Express生态成熟，中间件机制灵活，适合构建RESTful API服务"],
            ["TypeScript", "提供静态类型检查，减少运行时错误，增强代码可维护性和可读性"],
            ["Vue 3 + Composition API", "响应式数据绑定，Composition API利于逻辑复用，社区活跃，学习成本低"],
            ["Element Plus", "企业级UI组件库，与Vue 3深度集成，组件丰富，文档完善"],
            ["PostgreSQL", "成熟的关系型数据库，支持Schema级隔离，支持JSON查询，性能优越"],
            ["pg原生驱动", "轻量无额外依赖，完全控制SQL执行，避免ORM的隐式行为和性能损耗"],
            ["ECharts 6", "功能强大的数据可视化库，图表类型丰富，支持大数据量渲染"],
            ["pnpm + monorepo", "依赖管理高效，workspace协议简化本地包引用，节省磁盘空间"],
            ["Vite", "开发服务器启动快速，热更新高效，构建配置简洁"],
        ]
    )


def build_section_3(doc):
    """3. 系统模块划分"""
    add_heading1(doc, "3. 系统模块划分")

    add_heading2(doc, "3.1 模块总览")
    add_table(doc,
        ["模块名称", "模块编码", "说明"],
        [
            ["认证管理", "auth", "用户登录、JWT令牌发放与验证、密码管理"],
            ["编码生成", "code-generation", "编码规则配置、单测点手动编码生成"],
            ["自动编码", "auto-code", "批量自动编码、Excel导入自动编码"],
            ["编码校验", "code-validation", "编码唯一性校验、格式校验、规则校验"],
            ["字典管理", "dict", "新能源测点字典项管理（CRUD）"],
            ["字典审批", "approval", "字典变更提交流审批流程、审批通过后入库"],
            ["场站管理", "station", "风电场、光伏站等场站信息管理"],
            ["统计分析", "statistics", "编码使用情况统计、趋势分析、图表展示"],
            ["时序规则", "tsr", "时序规则（Time Series Rules）管理"],
            ["数据源管理", "datasource", "外部数据源连接管理、数据同步配置"],
        ]
    )

    add_heading2(doc, "3.2 模块职责说明")

    modules = [
        ("auth", "apps/backend/src/modules/auth", "负责用户身份认证。Controller提供登录、退出、令牌刷新接口；Service处理认证逻辑、密码加密验证；Domain封装用户实体和认证规则。"),
        ("code-generation", "apps/backend/src/modules/code-generation", "负责编码规则的配置和单测点手动编码生成。Controller提供规则元数据CRUD和编码生成接口；Service协调规则验证与编码生成流程；Domain封装编码规则、编码算法等核心业务逻辑。"),
        ("auto-code", "apps/backend/src/modules/auto-code", "负责批量自动编码功能。Controller提供批量导入和批量生成接口；Service处理Excel解析、批量事务管理；Domain封装批量编码算法、数据校验规则。"),
        ("code-validation", "apps/backend/src/modules/code-validation", "负责编码的各类校验。Controller提供校验接口；Service协调各项校验的执行顺序；Domain封装唯一性校验、格式校验、规则匹配等具体的校验逻辑。"),
        ("dict", "apps/backend/src/modules/dict", "负责字典项的管理。Controller提供字典项的增删改查接口；Service处理业务规则校验、变更记录；Domain封装字典项实体、树形结构维护等核心逻辑。"),
        ("approval", "apps/backend/src/modules/approval", "负责字典变更的审批流管理。Controller提供提交审批、审批操作接口；Service处理审批流转逻辑、状态变更；Domain封装审批实体、审批规则。"),
        ("station", "apps/backend/src/modules/station", "负责场站信息管理。Controller提供场站CRUD接口；Service处理场站数据维护逻辑；Domain封装场站实体、场站层级关系等业务规则。"),
        ("statistics", "apps/backend/src/modules/statistics", "负责编码数据的统计分析。Controller提供统计查询接口；Service处理统计指标计算、数据聚合；Domain封装统计规则和计算逻辑。"),
        ("tsr", "apps/backend/src/modules/tsr", "负责时序规则管理。Controller提供时序规则CRUD接口；Service处理规则验证和执行逻辑；Domain封装时序规则实体和执行引擎。"),
        ("datasource", "apps/backend/src/modules/datasource", "负责外部数据源管理。Controller提供数据源配置CRUD和测试连接接口；Service处理数据源连接管理、数据同步调度；Domain封装数据源实体、连接配置规则。"),
    ]

    for idx, (module_code, module_dir, module_desc) in enumerate(modules, 1):
        add_heading3(doc, f"3.2.{idx} {module_code}模块")
        add_table(doc,
            ["项目", "说明"],
            [
                ["模块编码", module_code],
                ["模块目录", module_dir],
                ["职责描述", module_desc],
            ]
        )

    add_heading2(doc, "3.3 模块交互关系")
    add_para(doc, "各模块之间的交互关系如下：")
    add_bullet(doc, "auth模块是所有其他模块的前置依赖，其他模块的API请求均需要先通过auth模块的JWT认证中间件验证身份。")
    add_bullet(doc, "dict模块是核心基础模块，code-generation、auto-code、code-validation、statistics等模块均依赖dict模块提供的字典数据。")
    add_bullet(doc, "approval模块与dict模块紧密关联，字典变更提交审批后由approval模块处理审批流程，审批通过后回调dict模块更新字典数据。")
    add_bullet(doc, "station模块作为基础数据模块，为code-generation和statistics模块提供场站基本信息。")
    add_bullet(doc, "auto-code模块在批量编码过程中会调用code-generation模块的编码算法，调用code-validation模块的校验功能。")
    add_bullet(doc, "datasource模块为auto-code和statistics模块提供外部数据源接入能力。")
    add_bullet(doc, "statistics模块是数据消费端，从dict、station、code-generation等模块获取数据进行统计分析。代码组织上，各模块完全解耦，模块间通过Service接口调用，不直接依赖其他模块的内部实现。")


def build_section_4(doc):
    """4. 后端架构设计"""
    add_heading1(doc, "4. 后端架构设计")

    add_heading2(doc, "4.1 三层架构详解")

    add_heading3(doc, "4.1.1 Controller层")
    add_para(doc, "Controller层位于架构的最上层，直接面向HTTP请求。其主要职责包括：路由注册、HTTP请求参数解析与类型转换、入参校验、调用Service层方法、将Service层返回结果封装为统一响应格式。")
    add_para(doc, "Controller层不应包含任何业务逻辑，仅作为请求的入口和响应的出口。典型的Controller方法流程：解析路由参数和请求体 → 参数校验 → 调用Service方法 → 封装统一响应。统一响应格式为：")
    add_para(doc, '{ "code": 0, "message": "success", "data": { ... }, "timestamp": "2026-05-30T12:00:00.000Z" }', bold=False, indent=True)
    add_para(doc, "错误响应格式为：")
    add_para(doc, '{ "code": 40001, "message": "编码格式不正确", "data": null, "timestamp": "2026-05-30T12:00:00.000Z" }', bold=False, indent=True)

    add_heading3(doc, "4.1.2 Service层")
    add_para(doc, "Service层位于Controller层和Domain层之间，负责业务编排和事务管理。其主要职责包括：协调多个Domain对象的协作、管理工作单元和事务边界、跨模块的服务调用编排、缓存策略的执行。")
    add_para(doc, "Service层不包含具体的业务规则，而是将业务规则委托给Domain层执行。Service方法的典型模式：开启事务 → 调用Domain方法A → 调用Domain方法B → 提交/回滚事务 → 返回结果。")

    add_heading3(doc, "4.1.3 Domain层")
    add_para(doc, "Domain层是架构的核心，封装了最细粒度的业务规则和数据访问逻辑。Domain对象分为两类：业务实体（Entity）封装业务规则和方法，数据访问对象（DAO）封装数据库查询操作。")
    add_para(doc, "Domain层不依赖于Controller层和Service层，可以被独立的单元测试验证。Domain层的方法是幂等的、可组合的，多个Domain方法可以在Service层组合成复杂的业务流程。")

    add_heading2(doc, "4.2 中间件链")
    add_para(doc, "Express中间件按注册顺序形成中间件链，每个请求依次经过各中间件的处理。系统的中间件链配置如下：")
    add_table(doc,
        ["顺序", "中间件", "职责"],
        [
            ["1", "CORS中间件", "设置跨域请求头，允许指定来源的前端访问API"],
            ["2", "JSON解析中间件", "解析请求体中的JSON数据，限制大小为200MB"],
            ["3", "请求追踪ID中间件", "为每个请求生成唯一追踪ID（UUID），用于日志关联和问题追踪"],
            ["4", "请求日志中间件", "记录请求方法、路径、状态码、处理耗时等信息到日志文件"],
            ["5", "租户上下文中间件", "从JWT令牌中解析租户信息，通过AsyncLocalStorage设置租户上下文"],
            ["6", "路由中间件", "根据请求路径分发到对应的Controller处理函数"],
            ["7", "全局错误处理中间件", "捕获所有未被处理的错误，统一返回错误响应格式"],
        ]
    )

    add_heading2(doc, "4.3 统一响应格式")
    add_para(doc, "系统定义统一的API响应格式，确保所有接口的响应结构一致：")

    add_heading3(doc, "4.3.1 成功响应")
    add_para(doc, '成功响应包含业务数据，code为0，message为"success"。', bold=False, indent=True)
    add_para(doc, '示例：{ "code": 0, "message": "success", "data": { "id": 1, "name": "测点A" }, "timestamp": "2026-05-30T10:00:00.000Z" }')

    add_heading3(doc, "4.3.2 错误响应")
    add_para(doc, "错误响应包含错误码和错误描述，data为null。错误码由系统预设，不同的错误类型对应不同的错误码范围。", bold=False, indent=True)
    add_para(doc, '示例：{ "code": 40001, "message": "编码格式不正确", "data": null, "timestamp": "2026-05-30T10:00:00.000Z" }')

    add_heading2(doc, "4.4 统一错误处理")
    add_heading3(doc, "4.4.1 AppError类")
    add_para(doc, "系统定义AppError基类，继承自Error，包含code（错误码）、message（错误描述）、httpStatus（HTTP状态码）三个核心属性。业务代码中通过抛出AppError或其子类实例来触发错误处理流程。")

    add_heading3(doc, "4.4.2 全局错误处理中间件")
    add_para(doc, "全局错误处理中间件是Express中间件链的最后一环，通过4个参数的函数签名（err, req, res, next）识别。当任何中间件或路由处理函数中抛出错误时，错误会被传递到此中间件。")
    add_para(doc, "错误处理流程：捕获错误 → 判断错误类型 → 提取错误信息 → 记录错误日志 → 返回统一错误响应。如果是AppError实例，使用其code、message和httpStatus；如果是未知错误，返回500内部服务器错误。")

    add_heading2(doc, "4.5 多租户架构")

    add_heading3(doc, "4.5.1 租户配置")
    add_para(doc, "租户信息统一配置在config/tenants.ts文件中。系统预设三个租户：")
    add_table(doc,
        ["租户编码", "租户名称", "Schema名称", "说明"],
        [
            ["admin", "集团管理员", "liuhaojun", "集团级管理租户，连接远程数据库（10.1.1.113:7300），可管理所有租户"],
            ["yunnan", "云南分公司", "yunnan", "云南区域租户，连接本地数据库，数据隔离在yunnan Schema"],
            ["fujian", "福建分公司", "fujian", "福建区域租户，连接本地数据库，数据隔离在fujian Schema"],
        ]
    )

    add_heading3(doc, "4.5.2 数据库级+Schema级双重隔离")
    add_para(doc, "多租户采用数据库级+Schema级双重隔离方案。集团管理员（admin）连接远程数据库（10.1.1.113:7300/training_exercises），区域租户（yunnan/fujian）连接本地数据库（localhost/code_tools）。同一数据库内通过Schema实现逻辑隔离（liuhaojun, yunnan, fujian Schema），不同数据库实例之间实现物理隔离。默认连接池配置持久化于config/datasource.json文件中，支持运行时热切换。")

    add_heading3(doc, "4.5.3 租户上下文传递机制")
    add_para(doc, "租户上下文的传递采用AsyncLocalStorage实现：")
    add_bullet(doc, "tenantContextMiddleware中间件在每个请求进入时，从JWT令牌中解析租户编码。")
    add_bullet(doc, "解析后的租户信息存入AsyncLocalStorage的上下文存储中。")
    add_bullet(doc, "数据访问层通过queryAsTenant辅助函数，自动从AsyncLocalStorage获取当前租户，将SQL查询路由到对应的Schema。")
    add_para(doc, "这种机制的优点在于：对业务代码无侵入，开发者无需在每处代码中手动传递租户参数；租户上下文在请求级自动隔离，不存在跨请求污染的问题。")


def build_section_5(doc):
    """5. 前端架构设计"""
    add_heading1(doc, "5. 前端架构设计")

    add_heading2(doc, "5.1 前端架构层次")
    add_para(doc, "前端架构分为四个核心层次，各层职责明确、单向依赖：")

    add_table(doc,
        ["层次", "职责", "技术选型"],
        [
            ["View（视图层）", "Vue组件、页面布局、用户交互", "Vue 3 Composition API + Element Plus"],
            ["Service（服务层）", "HTTP API调用封装、请求/响应拦截", "Axios"],
            ["Store（状态管理层）", "全局状态管理、跨组件数据共享", "Pinia"],
            ["Router（路由层）", "页面路由管理、路由守卫", "Vue Router 4"],
        ]
    )

    add_para(doc, "View层通过Service层调用后端API获取数据，通过Store管理全局状态，通过Router实现页面导航。各层之间通过依赖注入或模块导入的方式建立联系，避免循环依赖。")

    add_heading2(doc, "5.2 路由设计")
    add_para(doc, "系统定义以下前端路由：")
    add_table(doc,
        ["路径", "页面名称", "组件", "说明"],
        [
            ["/login", "登录", "LoginView.vue", "用户登录页面"],
            ["/code-generate", "编码生成", "CodeGenerateView.vue", "单测点手动编码生成"],
            ["/auto-code", "自动编码", "AutoCodeView.vue", "批量自动编码"],
            ["/code-verify", "编码校验", "CodeVerifyView.vue", "编码验证"],
            ["/code-validate", "编码验证", "CodeValidateView.vue", "编码格式/规则校验"],
            ["/statistics", "统计分析", "StatisticsView.vue", "数据统计与图表展示"],
            ["/time-series-rules", "时序规则", "TimeSeriesRulesView.vue", "时序规则管理"],
            ["/system-settings", "系统设置", "SystemSettingsView.vue", "系统配置管理"],
        ]
    )

    add_heading2(doc, "5.3 状态管理")
    add_para(doc, "采用Pinia进行全局状态管理，主要Store包括：")
    add_bullet(doc, "authStore：管理用户认证状态，包括JWT Token、当前用户信息、登录状态等。提供login、logout、refreshToken等操作。")
    add_bullet(doc, "appStore：管理应用级状态，包括当前租户信息、侧边栏折叠状态、主题配置等。")

    add_heading2(doc, "5.4 路由守卫")
    add_para(doc, "Vue Router提供的beforeEach导航守卫用于实现登录认证检查。其工作流程如下：")
    add_para(doc, "用户在浏览器中访问某一路由 → beforeEach守卫触发 → 检查authStore中的登录状态 → 已登录：放行，进入目标页面 → 未登录：重定向到/login页面，并在URL中带上redirect参数，登录成功后跳回原目标页面。")
    add_para(doc, "对于不需要登录即可访问的页面（如/login），在路由配置中标记为public，守卫跳过认证检查。")

    add_heading2(doc, "5.5 组件与页面设计")
    add_para(doc, "页面采用统一布局模式：顶部导航栏显示系统名称和用户信息，左侧侧边栏显示菜单导航，右侧主内容区展示页面内容。所有业务页面遵循以下设计模式：")
    add_bullet(doc, "搜索/筛选区域：位于页面顶部，提供关键字搜索、下拉筛选等条件输入控件。")
    add_bullet(doc, "操作按钮区域：位于搜索区域下方，提供新增、导入、导出、批量操作等按钮。")
    add_bullet(doc, "数据展示区域：使用Element Plus的表格组件展示数据，支持分页、排序。")
    add_bullet(doc, "弹窗/抽屉区域：用于新增、编辑、详情查看等操作，以对话框或抽屉形式展示。")

def build_section_6(doc):
    """6. 数据架构"""
    add_heading1(doc, "6. 数据架构")

    add_heading2(doc, "6.1 数据流")

    add_heading3(doc, "6.1.1 编码生成数据流")
    add_para(doc, "用户在前端选择编码规则和参数 → 前端发送请求到后端编码生成接口（Controller） → Controller解析参数并调用Service → Service校验参数合法性并调用Domain编码算法 → Domain执行编码生成逻辑，查询字典数据 → 编码生成结果返回 → Service处理结果并记录日志 → Controller封装响应返回前端 → 前端展示生成的编码。")

    add_heading3(doc, "6.1.2 编码解析数据流")
    add_para(doc, "用户输入编码 → 前端发送解析请求 → Controller接收请求 → Service编排解析流程 → Domain解析编码各段含义（关联字典数据） → 返回解析结果 → 前端展示编码各段含义说明。")

    add_heading3(doc, "6.1.3 自动编码数据流")
    add_para(doc, "用户上传Excel文件 → multer中间件处理文件上传 → Controller调用Service → Service解析Excel数据 → 逐条调用编码生成逻辑 → 调用编码校验逻辑验证结果 → 汇总生成结果 → 生成结果Excel文件 → 流式返回给前端下载。")

    add_heading3(doc, "6.1.4 统计数据流")
    add_para(doc, "用户选择统计维度 → 前端请求统计数据 → Controller接收参数 → Service调用Domain执行聚合查询 → 数据从PostgreSQL中聚合返回 → Service缓存结果 → 返回统计结果 → 前端使用ECharts渲染图表展示。")

    add_heading2(doc, "6.2 多租户数据隔离策略")
    add_para(doc, "系统采用数据库级+Schema级双重隔离方案。admin连接远程数据库（10.1.1.113:7300/training_exercises），区域租户连接本地数据库（localhost/code_tools）。默认连接池配置持久化于config/datasource.json，支持运行时热切换。")
    add_table(doc,
        ["数据类型", "隔离级别", "说明"],
        [
            ["字典数据", "数据库+Schema隔离", "admin在远程库liuhaojun Schema，区域在本地库各自Schema"],
            ["编码数据", "数据库+Schema隔离", "编码记录按租户隔离存储"],
            ["场站数据", "数据库+Schema隔离", "场站信息按租户管理"],
            ["用户数据", "仅admin Schema", "cec_sys_user表仅存于admin Schema"],
            ["审批数据", "仅admin Schema", "审批数据统一存储在admin Schema，区域草稿存本地"],
            ["系统配置", "全局共享文件", "datasource.json配置文件全局共享"],
        ]
    )

    add_heading2(doc, "6.3 缓存策略")
    add_para(doc, "系统根据数据特性采用三级缓存策略：")

    add_table(doc,
        ["缓存级别", "存储位置", "数据类型", "TTL", "失效策略"],
        [
            ["内存缓存", "Node.js内存", "字典树、字典项", "可配置（默认5分钟）", "TTL到期自动失效"],
            ["草稿缓存", "Node.js内存", "未提交的编码草稿", "无TTL", "服务重启后丢失"],
            ["持久化存储", "PostgreSQL", "字典数据、编码记录、用户信息等", "永久", "数据变更主动更新"],
        ]
    )

    add_para(doc, "字典树等高频读取、低频写入的数据适合使用内存缓存，TTL机制确保数据在可接受的时间内保持最新。草稿数据（如未完成的编码单）暂存于内存中，优点是读写速度快，缺点是服务重启后丢失（不适用于重要数据）。所有持久化数据统一存储在PostgreSQL数据库中，确保数据的可靠性和一致性。")

    add_heading2(doc, "6.4 文件存储")
    add_para(doc, "Excel文件的导入和导出：Excel上传使用multer中间件处理multipart/form-data，支持流式读取避免内存溢出。Excel下载采用流式写入方式，生成文件后通过响应流直接发送给客户端，不落盘（如需存档则同时写入服务器临时目录）。")


def build_section_7(doc):
    """7. 部署架构"""
    add_heading1(doc, "7. 部署架构")

    add_heading2(doc, "7.1 部署拓扑")
    add_para(doc, "开发环境下的部署拓扑为：")
    add_para(doc, "Vite开发服务器（端口5173） → 代理转发 → Express应用服务器（端口3000） → PostgreSQL数据库（端口5432）")
    add_para(doc, "前端开发服务器（Vite）运行在端口5173，通过Vite配置的proxy选项将API请求代理转发到后端服务器（端口3000），从而避免跨域问题。后端服务器连接PostgreSQL数据库（端口5432），执行SQL查询。")

    add_heading2(doc, "7.2 多租户数据库配置")
    add_table(doc,
        ["租户", "数据库名", "Schema", "连接池"],
        [
            ["集团管理员", "training_exercises (远程10.1.1.113:7300)", "liuhaojun", "默认连接池（config/datasource.json配置）"],
            ["云南分公司", "code_tools (本地localhost)", "yunnan", "运行时动态切换"],
            ["福建分公司", "code_tools (本地localhost)", "fujian", "运行时动态切换"],
        ]
    )
    add_para(doc, "集团管理员连接远程数据库（10.1.1.113:7300/training_exercises），区域租户连接本地数据库（localhost/code_tools），通过不同的数据库实例加Schema实现双重数据隔离。默认连接池配置持久化于config/datasource.json文件中，支持运行时热切换。")

    add_heading2(doc, "7.3 本地运行方式")
    add_heading3(doc, "7.3.1 环境要求")
    add_bullet(doc, "Node.js 20 LTS 或更高版本")
    add_bullet(doc, "pnpm 9+（npm install -g pnpm）")
    add_bullet(doc, "PostgreSQL 16+")
    add_bullet(doc, "Git")

    add_heading3(doc, "7.3.2 安装与启动")
    add_bullet(doc, "安装依赖：在项目根目录执行 pnpm install")
    add_bullet(doc, "初始化数据库：执行 pnpm db:init（创建数据库、Schema、初始数据）")
    add_bullet(doc, "启动后端：在apps/backend目录执行 pnpm dev（启动Express服务，端口3000）")
    add_bullet(doc, "启动前端：在apps/frontend目录执行 pnpm dev（启动Vite开发服务器，端口5173）")
    add_bullet(doc, "访问系统：在浏览器中打开 http://localhost:5173")

    add_heading2(doc, "7.4 构建与部署")
    add_heading3(doc, "7.4.1 前端构建")
    add_para(doc, "前端使用Vite进行构建，执行 pnpm build 命令后，Vite会将Vue源码编译为静态HTML、CSS、JS文件，输出到dist目录。构建产物可直接部署到Nginx、Apache等静态Web服务器，或通过后端Express的static中间件提供访问。")

    add_heading3(doc, "7.4.2 后端构建")
    add_para(doc, "后端TypeScript代码通过tsc（TypeScript编译器）编译为JavaScript，输出到dist目录。编译后的代码可在纯Node.js环境中运行，无需TypeScript运行时依赖。")

    add_heading3(doc, "7.4.3 生产部署")
    add_para(doc, "生产部署支持两种方式：")
    add_bullet(doc, "直接部署：将构建后的前后端产物部署到服务器，前端静态文件由Nginx提供服务并反向代理后端API。")
    add_bullet(doc, "容器化部署：使用Docker构建镜像，通过Docker Compose编排多容器部署，实现弹性伸缩和环境一致性。")

    add_heading2(doc, "7.5 环境变量")
    add_table(doc,
        ["变量名", "说明", "默认值"],
        [
            ["PORT", "后端服务端口号", "3000"],
            ["DATABASE_URL", "PostgreSQL连接字符串", "postgresql://postgres:postgres@localhost:5432/cec_coding"],
            ["JWT_SECRET", "JWT签名密钥", "（必须自定义设置）"],
            ["JWT_EXPIRES_IN", "JWT令牌有效期", "8h"],
            ["CORS_ORIGIN", "允许的跨域来源", "http://localhost:5173"],
            ["LOG_LEVEL", "日志级别", "debug"],
            ["CACHE_TTL", "缓存TTL（秒）", "300"],
            ["NODE_ENV", "运行环境", "development"],
        ]
    )

def build_section_8(doc):
    """8. 关键设计决策（ADR）"""
    add_heading1(doc, "8. 关键设计决策（ADR）")

    add_heading2(doc, "8.1 ADR-001: 选择pg原生驱动而非ORM")
    add_heading3(doc, "8.1.1 决策")
    add_para(doc, "采用pg（node-postgres）原生数据库驱动，不引入ORM（如Prisma、TypeORM、Sequelize等）。")
    add_heading3(doc, "8.1.2 理由")
    add_bullet(doc, "SQL学习：团队成员可以保持和提升SQL编写能力，对数据库的理解更加深入。")
    add_bullet(doc, "轻量无依赖：不需要额外安装ORM库和其依赖，减少了包体积和潜在的兼容性问题。")
    add_bullet(doc, "完全控制：开发人员对执行的SQL有完全的控制权，不存在ORM隐式生成的性能问题。")
    add_bullet(doc, "多租户友好：动态Schema切换原生SQL更容易表达，ORM通常需要额外的租户插件或hack。")

    add_heading2(doc, "8.2 ADR-002: Schema级多租户隔离")
    add_heading3(doc, "8.2.1 决策")
    add_para(doc, "采用PostgreSQL Schema级隔离方案实现多租户，每个租户一个独立的Schema。")
    add_heading3(doc, "8.2.2 理由")
    add_bullet(doc, "数据隔离彻底：不同租户的数据存储在不同的Schema中，从数据库层面确保数据互不可见。")
    add_bullet(doc, "表结构一致：所有Schema中的表结构保持完全一致，代码逻辑无需针对不同租户做特殊处理。")
    add_bullet(doc, "备份恢复灵活：可以针对单个租户的Schema进行独立的备份和恢复操作。")
    add_bullet(doc, "扩展方便：新增租户时只需复制Schema模板并初始化数据，无需修改应用代码。")

    add_heading2(doc, "8.3 ADR-003: 内存缓存字典树")
    add_heading3(doc, "8.3.1 决策")
    add_para(doc, "字典树数据采用进程内存缓存，配合TTL机制确保时效性。")
    add_heading3(doc, "8.3.2 理由")
    add_bullet(doc, "高频读低频写：字典数据在编码生成和校验过程中被高频读取，但变更频率较低。")
    add_bullet(doc, "TTL机制：设置合理的TTL（如5分钟），在读性能和数据新鲜度之间取得平衡。")
    add_bullet(doc, "实现简单：使用Map对象即可实现，无需引入Redis等外部缓存组件，降低系统复杂度。")

    add_heading2(doc, "8.4 ADR-004: 运行时动态数据源切换")
    add_heading3(doc, "8.4.1 决策")
    add_para(doc, "数据源在运行时动态切换，无需重启服务即可切换目标数据库Schema。")
    add_heading3(doc, "8.4.2 理由")
    add_bullet(doc, "无需重启服务：新增租户或切换租户时不需要重启Node.js进程，保证服务的持续可用性。")
    add_bullet(doc, "连接池复用：所有租户共享同一个数据库连接池，通过设置search_path实现Schema切换，资源利用率更高。")
    add_bullet(doc, "部署简化：相比多数据库实例方案，单一数据库多Schema的管理和部署更加简单。")

    add_heading2(doc, "8.5 ADR-005: 前端路由守卫认证")
    add_heading3(doc, "8.5.1 决策")
    add_para(doc, "前端采用Vue Router的beforeEach守卫配合Pinia store实现轻量级认证方案。")
    add_heading3(doc, "8.5.2 理由")
    add_bullet(doc, "轻量级方案：不需要引入额外的认证库或框架，利用Vue Router原生能力即可实现。")
    add_bullet(doc, "用户体验好：用户访问受保护页面时，守卫自动检测登录态，未登录时平滑跳转到登录页面，登录后自动跳回目标页面。")
    add_bullet(doc, "前后端分离：认证状态在前端维护，后端通过JWT无状态认证，不依赖服务端会话。")


def main():
    """主函数：创建文档并填充所有章节"""
    doc = create_document("总体架构设计文档")
    add_cover(doc, "总体架构设计文档", "华电新能源测点编码管理平台", "V1.1", "2026-06-08")
    add_toc(doc)

    build_section_1(doc)
    build_section_2(doc)
    build_section_3(doc)
    build_section_4(doc)
    build_section_5(doc)
    build_section_6(doc)
    build_section_7(doc)
    build_section_8(doc)

    save_doc(doc, "总体架构设计文档.docx")


if __name__ == "__main__":
    main()

