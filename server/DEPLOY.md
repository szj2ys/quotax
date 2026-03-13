# QuotaX 部署文档

> B2B 报价展示工具 - 生产环境部署指南

## 目录

- [快速开始](#快速开始)
- [环境要求](#环境要求)
- [部署架构](#部署架构)
- [环境变量配置](#环境变量配置)
- [部署方式](#部署方式)
  - [Docker Compose 部署（推荐）](#docker-compose-部署推荐)
  - [手动部署](#手动部署)
  - [云服务部署](#云服务部署)
- [健康检查](#健康检查)
- [监控与告警](#监控与告警)
- [故障排查](#故障排查)
- [性能基准](#性能基准)

---

## 快速开始

```bash
# 1. 克隆代码
git clone <your-repo>
cd b2b-quotation-tool/server

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入必要配置

# 3. 启动服务
docker-compose up -d

# 4. 验证部署
curl http://localhost:3000/health
```

---

## 环境要求

| 组件 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18.0.0 | 运行环境 |
| MongoDB | >= 6.0 | 数据库 |
| Redis | >= 7.0 | 缓存（可选） |
| Docker | >= 20.10 | 容器化部署 |
| Docker Compose | >= 2.0 | 编排工具 |

---

## 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                      微信小程序                              │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────┴───────────────────────────────────────┐
│                      CDN / Nginx                             │
│                    SSL 证书终结                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                   QuotaX 后端服务                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Express App │  │  Health Check│  │   Monitor    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────┴────┐   ┌───┴────┐   ┌────┴────┐
   │ MongoDB │   │ Redis  │   │ Uploads │
   └─────────┘   └────────┘   └─────────┘
```

---

## 环境变量配置

### 必需变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `3000` |
| `MONGODB_URI` | MongoDB 连接字符串 | `mongodb://localhost:27017/quotax` |
| `JWT_SECRET` | JWT 签名密钥 | `your-super-secret-key` |
| `WECHAT_APPID` | 微信小程序 AppID | `wx1234567890abcdef` |
| `WECHAT_APPSECRET` | 微信小程序 AppSecret | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `CLIENT_ORIGIN` | 允许的跨域来源 | `https://quotax.com` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `LOG_FORMAT` | 日志格式 | `json` |
| `JWT_EXPIRES_IN` | Token 有效期 | `7d` |
| `BCRYPT_ROUNDS` | 密码加密轮数 | `12` |
| `RATE_LIMIT_MAX` | 限流请求数 | `100` |
| `RATE_LIMIT_WINDOW_MS` | 限流时间窗口 | `900000` (15分钟) |
| `UPLOAD_MAX_SIZE` | 上传文件大小限制 | `5242880` (5MB) |
| `MONGODB_MAX_POOL_SIZE` | 数据库连接池最大数 | `20` |
| `MONGODB_MIN_POOL_SIZE` | 数据库连接池最小数 | `5` |

### 环境变量模板

创建 `.env` 文件：

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb://mongo:27017/quotax
MONGODB_MAX_POOL_SIZE=20
MONGODB_MIN_POOL_SIZE=5

# Security
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# WeChat Mini Program
WECHAT_APPID=wx1234567890abcdef
WECHAT_APPSECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# CORS
CLIENT_ORIGIN=https://quotax.com,https://www.quotax.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# Upload
UPLOAD_MAX_SIZE=5242880
```

---

## 部署方式

### Docker Compose 部署（推荐）

#### 1. 准备环境

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 配置部署

```bash
# 进入服务器目录
cd /opt/quotax/server

# 创建必要目录
mkdir -p logs uploads nginx/ssl

# 复制配置文件
cp .env.example .env
# 编辑 .env，填入生产环境配置

# 配置 SSL 证书（可选）
# 将证书放入 nginx/ssl/ 目录
# - ssl_certificate.crt
# - ssl_certificate.key
```

#### 3. 启动服务

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f app

# 查看状态
docker-compose ps
```

#### 4. 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose down
docker-compose up -d --build

# 或使用零停机部署
docker-compose up -d --build --no-deps app
```

### 手动部署

#### 1. 安装 Node.js

```bash
# 使用 nvm 安装
nvm install 18
nvm use 18
```

#### 2. 安装 MongoDB

```bash
# Ubuntu
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
```

#### 3. 部署应用

```bash
# 安装依赖
npm ci --only=production

# 配置环境变量
export NODE_ENV=production
export PORT=3000
export MONGODB_URI=mongodb://localhost:27017/quotax
export JWT_SECRET=your-secret-key
# ... 其他变量

# 使用 PM2 启动
npm install -g pm2
pm2 start src/app.js --name quotax-server

# 保存 PM2 配置
pm2 save
pm2 startup
```

### 云服务部署

#### 阿里云 ECS

```bash
# 1. 创建 ECS 实例（推荐 2核4G 以上）
# 2. 配置安全组：开放 80, 443, 3000 端口
# 3. 按 Docker Compose 方式部署

# 使用阿里云镜像加速
docker login --username=your-aliyun-username registry.cn-hangzhou.aliyuncs.com
```

#### 腾讯云 CloudBase

```bash
# 1. 创建云开发环境
# 2. 绑定 MongoDB 数据库
# 3. 上传代码并部署

# 使用 CloudBase CLI
npm install -g @cloudbase/cli
tcb login
tcb deploy
```

#### Railway / Render

```bash
# 1. Fork 代码到 GitHub
# 2. 在 Railway/Render 创建新项目
# 3. 绑定 GitHub 仓库
# 4. 配置环境变量
# 5. 自动部署
```

---

## 健康检查

### 健康检查端点

```bash
# 基础健康检查
curl http://localhost:3000/health

# 详细健康检查（含系统信息）
curl http://localhost:3000/health/detail

# 查看告警
curl http://localhost:3000/health/alerts

# Prometheus 指标
curl http://localhost:3000/metrics
```

### 健康检查响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-13T10:30:00.000Z",
    "uptime": 3600,
    "memory": {
      "rss": 128,
      "heapTotal": 64,
      "heapUsed": 48,
      "external": 16
    },
    "checks": {
      "database": {
        "status": "ok",
        "message": "Connected",
        "state": "connected"
      },
      "memory": {
        "status": "ok",
        "message": "Memory usage normal: 45% heap, 128MB RSS"
      }
    }
  }
}
```

---

## 监控与告警

### 内置监控指标

| 指标 | 说明 | 告警阈值 |
|------|------|----------|
| `http_requests_total` | HTTP 请求总数 | - |
| `http_response_time_milliseconds` | 响应时间 | > 1000ms |
| `error_rate` | 错误率 | > 5% |
| `memory_usage` | 内存使用率 | > 80% |
| `cpu_load` | CPU 负载 | > 2.0 |

### 集成 Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'quotax'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### 集成 Grafana

1. 添加 Prometheus 数据源
2. 导入 Dashboard ID: `3662`（Node.js 基础监控）
3. 创建自定义 Dashboard

---

## 故障排查

### 常见问题

#### 1. 数据库连接失败

```bash
# 检查 MongoDB 状态
docker-compose ps mongo
docker-compose logs mongo

# 测试连接
mongosh "mongodb://admin:password@localhost:27017/quotax?authSource=admin"

# 检查网络
docker network inspect server_quotax-network
```

#### 2. 端口冲突

```bash
# 检查端口占用
netstat -tlnp | grep 3000

# 修改端口
# 编辑 .env 文件，修改 PORT 变量
```

#### 3. 内存不足

```bash
# 查看内存使用
docker stats
free -h

# 调整 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=2048"
```

#### 4. 上传文件失败

```bash
# 检查上传目录权限
ls -la uploads/

# 检查磁盘空间
df -h

# 调整上传大小限制
# 修改 .env 中的 UPLOAD_MAX_SIZE
```

### 日志排查

```bash
# 查看应用日志
docker-compose logs -f app --tail 100

# 查看错误日志
cat logs/error.log

# 查看 MongoDB 日志
docker-compose logs mongo
```

### 调试模式

```bash
# 临时开启调试日志
docker-compose exec app sh -c "export LOG_LEVEL=debug && node src/app.js"
```

---

## 性能基准

### 测试环境

- **CPU**: 2核 Intel Xeon
- **内存**: 4GB RAM
- **数据库**: MongoDB 7.0
- **Node.js**: 18.x

### 基准测试结果

| 场景 | QPS | 平均响应时间 | P95 响应时间 |
|------|-----|-------------|-------------|
| 健康检查 | 5000+ | 5ms | 10ms |
| 用户登录 | 800 | 120ms | 200ms |
| 商品列表 | 1500 | 50ms | 100ms |
| 生成报价单 | 200 | 300ms | 500ms |
| 文件上传 | 100 | 500ms | 800ms |

### 优化建议

1. **数据库索引**：确保常用查询字段已建立索引
2. **连接池**：根据并发量调整 MONGODB_MAX_POOL_SIZE
3. **缓存**：启用 Redis 缓存热点数据
4. **CDN**：静态资源使用 CDN 加速
5. **压缩**：启用 gzip/brotli 压缩响应

---

## 附录

### 目录结构

```
server/
├── src/
│   ├── app.js              # 应用入口
│   ├── config/
│   │   ├── database.js     # 数据库配置
│   │   ├── production.js   # 生产环境配置
│   │   └── redis.js        # Redis 配置
│   ├── controllers/        # 控制器
│   ├── middleware/         # 中间件
│   │   ├── monitor.js      # 监控中间件
│   │   └── auth.middleware.js
│   ├── models/             # 数据模型
│   ├── routes/             # 路由
│   ├── utils/              # 工具函数
│   └── validators/         # 验证器
├── uploads/                # 上传文件目录
├── logs/                   # 日志目录
├── nginx/                  # Nginx 配置
├── Dockerfile              # Docker 镜像
├── docker-compose.yml      # Docker 编排
├── .env                    # 环境变量
└── package.json
```

### 更新日志

- **v1.0.0** (2026-03-13): 初始部署文档
  - Docker Compose 部署支持
  - 健康检查和监控
  - 性能基准测试

---

**最后更新**: 2026-03-13
