# Calendar Booking

让商家连接 Google Calendar，客户在其网站上查看空闲时段并直接预约。

## 架构

```
客户浏览器  ──→  API Server (Express)  ──→  Nylas v3 API  ──→  Google Calendar
                      │
                   SQLite
              (grant_id / 预约记录)
```

Phase 1 通过 Nylas 代理 Google OAuth，无需 GCP 验证，直接上线。

## 项目结构

```
├── server/             # Express API
│   ├── index.js        # 入口
│   ├── db.js           # SQLite
│   ├── routes/         # auth / availability / booking
│   └── lib/            # nylas 封装 / 时段计算
│
└── widget/             # 可嵌入预约组件
    ├── src/            # Vanilla JS
    └── dist/           # 构建产物
```

## API

```
GET  /auth/google            连接 Google Calendar（跳转 Nylas 认证）
GET  /auth/google/callback   认证回调
GET  /api/availability       查询可用时段 (?owner_id=X&date=YYYY-MM-DD)
POST /api/book               创建预约
```

## 本地开发

```bash
# server
cd server
cp .env.example .env        # 填入 Nylas credentials
npm install
npm run dev                 # http://localhost:3000

# widget
cd widget
open index.html             # 或任意静态服务器
```

环境变量见 `server/.env.example`。

## Nylas 配置

首次使用需要配置 Nylas 和 Google。详见 [docs/nylas-setup.md](docs/nylas-setup.md)。
