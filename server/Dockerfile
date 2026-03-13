# 多阶段构建 Dockerfile
# Multi-stage build for production

# ==========================================
# 阶段 1: 依赖安装
# ==========================================
FROM node:18-alpine AS dependencies

# 安装构建依赖
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# ==========================================
# 阶段 2: 应用运行
# ==========================================
FROM node:18-alpine AS production

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 安装必要的运行时依赖（canvas 等原生模块需要）
RUN apk add --no-cache \
    cairo \
    pango \
    libjpeg-turbo \
    libpng \
    giflib \
    librsvg \
    python3

WORKDIR /app

# 复制生产依赖
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# 复制应用代码
COPY --chown=nodejs:nodejs . .

# 创建日志目录
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# 创建上传目录
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动命令
CMD ["node", "src/app.js"]
