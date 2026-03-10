# API 接口文档

## 基础信息

- **Base URL**: `https://api.quotax.com/v1`
- **认证方式**: Bearer Token (JWT)
- **请求格式**: JSON
- **响应格式**: JSON

## 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

**错误码定义**：

| 错误码 | 说明 |
|-------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 认证相关

### 微信登录

```http
POST /auth/login
```

**请求参数**：

```json
{
  "code": "string",  // 微信登录 code
  "userInfo": {
    "nickName": "string",
    "avatarUrl": "string"
  }
}
```

**响应数据**：

```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "string",
      "openid": "string",
      "nickName": "string",
      "avatarUrl": "string",
      "companyName": "string",
      "contactName": "string",
      "contactPhone": "string"
    }
  }
}
```

### 更新用户信息

```http
PUT /auth/profile
```

**请求头**：
```
Authorization: Bearer <token>
```

**请求参数**：

```json
{
  "companyName": "string",
  "contactName": "string",
  "contactPhone": "string",
  "companyLogo": "string"
}
```

---

## 产品管理

### 获取产品列表

```http
GET /products
```

**请求头**：
```
Authorization: Bearer <token>
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20 |
| categoryId | string | 否 | 分类ID筛选 |
| keyword | string | 否 | 关键词搜索 |
| status | string | 否 | 状态筛选：on/off |

**响应数据**：

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "images": ["string"],
        "categoryId": "string",
        "categoryName": "string",
        "price": 99.99,
        "priceType": "wholesale",
        "specs": [
          { "name": "规格", "value": "值" }
        ],
        "unit": "件",
        "stock": 100,
        "status": "on",
        "createdAt": "2026-03-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 获取产品详情

```http
GET /products/:id
```

**响应数据**：

```json
{
  "code": 200,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "images": ["string"],
    "categoryId": "string",
    "categoryName": "string",
    "price": 99.99,
    "priceType": "wholesale",
    "specs": [
      { "name": "规格", "value": "值" }
    ],
    "unit": "件",
    "stock": 100,
    "status": "on",
    "createdAt": "2026-03-10T10:00:00Z",
    "updatedAt": "2026-03-10T10:00:00Z"
  }
}
```

### 创建产品

```http
POST /products
```

**请求参数**：

```json
{
  "name": "string",
  "description": "string",
  "images": ["string"],
  "categoryId": "string",
  "price": 99.99,
  "priceType": "wholesale",
  "specs": [
    { "name": "规格", "value": "值" }
  ],
  "unit": "件",
  "stock": 100
}
```

### 更新产品

```http
PUT /products/:id
```

**请求参数**：同创建产品

### 删除产品

```http
DELETE /products/:id
```

### 批量导入产品

```http
POST /products/import
```

**请求参数**：

```json
{
  "fileUrl": "string"  // Excel 文件 URL
}
```

**响应数据**：

```json
{
  "code": 200,
  "data": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "errors": [
      { "row": 3, "message": "价格格式错误" }
    ]
  }
}
```

---

## 分类管理

### 获取分类列表

```http
GET /categories
```

**响应数据**：

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "string",
        "name": "string",
        "sort": 1,
        "productCount": 10
      }
    ]
  }
}
```

### 创建分类

```http
POST /categories
```

**请求参数**：

```json
{
  "name": "string",
  "sort": 1
}
```

### 更新分类

```http
PUT /categories/:id
```

### 删除分类

```http
DELETE /categories/:id
```

---

## 购物车

### 获取购物车

```http
GET /cart
```

**响应数据**：

```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "productId": "string",
        "productName": "string",
        "productImage": "string",
        "price": 99.99,
        "quantity": 2,
        "specs": [{ "name": "规格", "value": "值" }]
      }
    ],
    "totalCount": 5,
    "totalAmount": 499.95
  }
}
```

### 添加商品到购物车

```http
POST /cart/items
```

**请求参数**：

```json
{
  "productId": "string",
  "quantity": 1
}
```

### 更新购物车商品数量

```http
PUT /cart/items/:productId
```

**请求参数**：

```json
{
  "quantity": 2
}
```

### 删除购物车商品

```http
DELETE /cart/items/:productId
```

### 清空购物车

```http
DELETE /cart
```

---

## 收藏夹

### 获取收藏列表

```http
GET /favorites
```

**响应数据**：

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "productId": "string",
        "productName": "string",
        "productImage": "string",
        "price": 99.99,
        "createdAt": "2026-03-10T10:00:00Z"
      }
    ]
  }
}
```

### 添加收藏

```http
POST /favorites
```

**请求参数**：

```json
{
  "productId": "string"
}
```

### 取消收藏

```http
DELETE /favorites/:productId
```

---

## 报价单（公开接口）

### 获取报价单

```http
GET /quotations/:userId
```

**说明**：此接口无需认证，用于客户查看报价

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| categoryId | string | 否 | 分类筛选 |
| keyword | string | 否 | 关键词搜索 |

**响应数据**：

```json
{
  "code": 200,
  "data": {
    "company": {
      "name": "string",
      "logo": "string",
      "contactName": "string",
      "contactPhone": "string"
    },
    "categories": [
      {
        "id": "string",
        "name": "string"
      }
    ],
    "products": [
      {
        "id": "string",
        "name": "string",
        "images": ["string"],
        "price": 99.99,
        "specs": [{ "name": "规格", "value": "值" }],
        "unit": "件"
      }
    ]
  }
}
```

---

## 订货单导出

### 导出订货单

```http
POST /orders/export
```

**请求参数**：

```json
{
  "format": "pdf",  // pdf 或 excel
  "items": [
    {
      "productId": "string",
      "quantity": 2
    }
  ],
  "remark": "string"
}
```

**响应数据**：

```json
{
  "code": 200,
  "data": {
    "downloadUrl": "https://xxx.com/orders/xxx.pdf"
  }
}
```

---

## 小程序码

### 生成报价单小程序码

```http
POST /qrcode/quotation
```

**响应数据**：

```json
{
  "code": 200,
  "data": {
    "qrCodeUrl": "https://xxx.com/qrcode/xxx.png"
  }
}
```

---

## 数据统计

### 获取统计数据

```http
GET /statistics
```

**响应数据**：

```json
{
  "code": 200,
  "data": {
    "overview": {
      "totalProducts": 100,
      "totalViews": 1000,
      "totalCartAdd": 50,
      "totalFavorites": 30
    },
    "trend": [
      {
        "date": "2026-03-10",
        "views": 100,
        "cartAdd": 5
      }
    ]
  }
}
```

---

*文档版本：v1.0*  
*更新日期：2026-03-10*
