# QuotaX CEO Strategic Plan

## 摸底总结 (Completed)

### 产品现状
- **产品名称**: QuotaX - B2B报价展示工具
- **Slogan**: "让 B2B 报价像淘宝购物一样简单"
- **目标用户**: B2B供应商（批发商、经销商、工业品供应商）
- **技术栈**: Taro 3.x + React + Node.js + Express + MongoDB

### 功能完成度评估
| 模块 | 完成度 | 状态 |
|-----|-------|------|
| 用户系统（微信登录/JWT）| 100% | ✅ 生产就绪 |
| 产品管理（CRUD/分类/规格）| 100% | ✅ 生产就绪 |
| 购物车/收藏夹 | 100% | ✅ 已合并 |
| 分享传播（微信/二维码）| 100% | ✅ 已合并 |
| 导出功能（PDF/Excel）| 100% | ✅ 已合并 |
| 数据分析（访问统计）| 90% | ⚠️ 缺可视化 |
| 线索捕获 | 100% | ✅ 已合并 |
| 邮件摘要 | 100% | ✅ 已合并 |

### 关键技术债务
1. **测试覆盖率**: 仅1个测试文件 (analytics.test.js) - 风险极高
2. **CI/CD**: 完全缺失 - 部署风险
3. **监控告警**: 完全缺失 - 运营盲区
4. **数据备份**: 无策略 - 灾难风险
5. **搜索UI**: 后端有索引，前端实现待确认

---

## Step 2 · 定方向: P0 增长计划

### 核心判断
产品功能已达MVP标准，当前最大风险是**技术债务阻碍增长**和**缺乏增长飞轮**。必须平衡稳定性与增长。

### 今日P0任务清单 (≤5个)

| 优先级 | 任务 | 用户价值 | 增长杠杆 | 风险 |
|-------|-----|---------|---------|------|
| **P0** | 测试覆盖提升 | 产品质量信心 | 留存 | 高技术债 |
| **P0** | CI/CD流水线 | 快速迭代能力 | 效率 | 部署风险 |
| **P0** | 产品搜索完整实现 | 核心用户体验 | 转化 | 功能缺口 |
| **P1** | 增长分析埋点 | 数据驱动决策 | 增长 | 运营盲区 |
| **P1** | 用户反馈机制 | 产品迭代输入 | 留存 | 信息孤岛 |

### Step 2.5 · Kill List (今天不做)

#### 🗑️ 删除清单

| 项目 | 原因 |
|-----|------|
| ❌ P1功能（Excel导入/客户标签）| MVP未稳定，不扩展 |
| ❌ 多模板系统 | 过早优化 |
| ❌ 营销工具（优惠券）| 无用户基础 |
| ❌ 高级权限管理 | 单用户场景 |
| ❌ H5/PC端适配 | 聚焦微信小程序 |

---

## Step 3 · 拆战役: Phase规划

### Phase分层

```
Phase 0 (地基): CI/CD + 测试框架 → 无依赖，最先合入
Phase 1 (核心): 测试覆盖 + 搜索功能 → 依赖Phase 0
Phase 2 (上层): 埋点分析 + 反馈机制 → 依赖Phase 1
```

### 依赖分析
- **T0-ci-cd**: 独立，可并行
- **T1-testing**: 依赖T0 (需要CI验证)
- **T2-search**: 独立前端改动，可并行
- **T3-analytics**: 依赖T1 (埋点需要测试)

### 冲突预检
- T0-ci-cd 与 T1-testing 都改 `.github/workflows/` → 顺序执行
- T2-search 仅改 client → 与T0/T1零冲突

---

## Step 4 · 分兵力: Worktree架构

### Worktree分配

| Worktree | Phase | 任务 | 依赖 |
|---------|-------|-----|------|
| T0-ci-cd | Phase 0 | GitHub Actions CI/CD + 自动部署 | 无 |
| T1-testing | Phase 1 | 后端API测试覆盖 + 前端组件测试 | T0合入后 |
| T2-search | Phase 1 | 产品搜索功能完整实现 | 无 (并行) |
| T3-monitoring | Phase 2 | 基础监控告警 + 健康检查 | T1合入后 |

### 目录结构
```
.worktrees/
├── T0-ci-cd/          # Phase 0 - 基础设施
├── T1-testing/        # Phase 1 - 测试覆盖
├── T2-search/         # Phase 1 - 搜索功能
└── T3-monitoring/     # Phase 2 - 监控告警
```

---

## Step 5 · 执行: 启动命令

### 执行顺序

```bash
# Phase 0 - 立即执行
cd /Users/szj/Downloads/tmp/b2b-quotation-tool/.worktrees/T0-ci-cd
# → 创建CI/CD流水线
# → 合入main

# Phase 1 - 并行执行 (T2与T0并行，T1依赖T0)
cd /Users/szj/Downloads/tmp/b2b-quotation-tool/.worktrees/T2-search
# → 实现搜索功能

# (等待T0合入后)
cd /Users/szj/Downloads/tmp/b2b-quotation-tool/.worktrees/T1-testing
# → 补充测试覆盖

# Phase 2 - 依赖Phase 1
cd /Users/szj/Downloads/tmp/b2b-quotation-tool/.worktrees/T3-monitoring
# → 监控告警
```

---

## 任务详细规格

### T0-ci-cd · CI/CD流水线
**目标**: 实现自动化测试、构建、部署

**Tasks**:
1. GitHub Actions workflow (test + build)
2. Docker镜像自动构建
3. 部署脚本优化

**验收**:
- [ ] PR触发自动测试
- [ ] main分支自动构建镜像
- [ ] 部署文档完整

### T1-testing · 测试覆盖
**目标**: 核心API测试覆盖≥80%

**Tasks**:
1. 用户认证API测试
2. 产品CRUD API测试
3. 购物车/收藏API测试
4. 导出功能测试

**验收**:
- [ ] API测试≥20个
- [ ] 测试通过率100%
- [ ] CI集成通过

### T2-search · 搜索功能
**目标**: 完整的产品搜索体验

**Tasks**:
1. 搜索栏UI组件
2. 搜索API联调
3. 搜索结果页
4. 搜索历史

**验收**:
- [ ] 支持关键词搜索
- [ ] 支持分类筛选
- [ ] 搜索结果可加入购物车

### T3-monitoring · 监控告警
**目标**: 基础可观测性

**Tasks**:
1. 健康检查接口
2. 基础日志规范
3. 错误监控

**验收**:
- [ ] /health 端点可用
- [ ] 错误日志可追溯
- [ ] 关键指标可观测

---

## 成功指标

### 技术指标
- 测试覆盖率: 从<5% → ≥60%
- CI/CD: 0 → 完整流水线
- 部署时间: 手动 → <5分钟自动

### 业务指标
- 搜索功能: 缺失 → 完整
- 故障发现时间: 未知 → <5分钟
- 迭代周期: 天级 → 小时级

---

*Plan created by CEO agent workflow*
*Date: 2026-03-14*
