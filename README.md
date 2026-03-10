# B2B 报价展示工具 - QuotaX

> 让 B2B 报价像淘宝购物一样简单

## 项目简介

QuotaX 是一款专为 B2B 供应商设计的轻量级报价展示工具。将传统的 Excel/PDF 报价单转换为可视化、可交互的商品展示页面，提升客户体验，提高成交效率。

## 核心价值

- **提升形象**：专业的可视化展示，告别丑陋的 Excel
- **提高效率**：一键生成报价单，节省 80% 时间
- **增强互动**：客户可收藏、对比、直接下单
- **数据洞察**：追踪客户行为，精准跟进

## 目标用户

- 批发商、经销商
- 工业品供应商
- 建材、五金、电子元器件供应商
- 年营业额 100万-5000万的中小 B2B 企业

## MVP 功能范围

### 1. 报价单管理
- [ ] Excel 导入产品数据
- [ ] 手动添加/编辑产品
- [ ] 产品分类管理
- [ ] 价格分级（零售价/批发价/代理价）

### 2. 可视化展示
- [ ] 商品卡片展示（图片+价格+规格）
- [ ] 分类浏览
- [ ] 搜索筛选
- [ ] 响应式布局（移动端优先）

### 3. 分享传播
- [ ] 生成小程序码
- [ ] 微信分享
- [ ] 链接分享

### 4. 客户互动
- [ ] 购物车功能
- [ ] 收藏夹功能
- [ ] 一键询价
- [ ] 导出订货单（PDF/Excel）

### 5. 用户系统
- [ ] 微信登录
- [ ] 基础账户管理

## 技术栈

- **前端**：微信小程序原生 + Taro 3.x
- **后端**：Node.js + Express
- **数据库**：MongoDB
- **缓存**：Redis
- **存储**：阿里云 OSS
- **部署**：阿里云/腾讯云

## 项目结构

```
b2b-quotation-tool/
├── client/                 # 小程序前端
│   ├── src/
│   │   ├── pages/         # 页面
│   │   ├── components/    # 组件
│   │   ├── utils/         # 工具函数
│   │   └── api/           # API 接口
│   └── package.json
├── server/                 # 后端服务
│   ├── src/
│   │   ├── routes/        # 路由
│   │   ├── models/        # 数据模型
│   │   ├── controllers/   # 控制器
│   │   └── middleware/    # 中间件
│   └── package.json
├── docs/                   # 文档
│   ├── PRD.md             # 产品需求文档
│   ├── API.md             # 接口文档
│   └── DESIGN.md          # 设计文档
└── README.md
```

## 开发计划

### Phase 1: 基础框架（Week 1）
- [ ] 项目初始化
- [ ] 数据库设计
- [ ] 微信登录接入
- [ ] 基础 API 开发

### Phase 2: 核心功能（Week 2-3）
- [ ] 产品管理模块
- [ ] Excel 导入功能
- [ ] 报价单展示页面
- [ ] 购物车/收藏夹

### Phase 3: 分享与导出（Week 4）
- [ ] 分享功能
- [ ] 订货单导出
- [ ] 小程序码生成

### Phase 4: 优化与测试（Week 5-6）
- [ ] UI 优化
- [ ] 性能优化
- [ ] 测试与 Bug 修复

## 快速开始

### 环境要求
- Node.js >= 16
- MongoDB >= 5.0
- 微信开发者工具

### 安装依赖

```bash
# 后端
cd server
npm install

# 前端
cd client
npm install
```

### 配置环境变量

```bash
cp server/.env.example server/.env
# 编辑 .env 文件，配置数据库、微信等参数
```

### 启动开发服务器

```bash
# 启动后端
cd server
npm run dev

# 启动前端（使用微信开发者工具打开 client 目录）
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License

## 联系方式

- 项目地址：https://github.com/yourname/b2b-quotation-tool
- 问题反馈：issues
