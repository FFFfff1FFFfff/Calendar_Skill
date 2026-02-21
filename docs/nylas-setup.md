# Nylas + Google Calendar 配置指南

注册完 Nylas 账号后，跟着下面一步步来。

---

## 第一步：创建 Nylas Application

1. 登录 [Nylas Dashboard](https://dashboard.nylas.com)
2. 点 **Create Application**，起个名字（比如 "Calendar Booking"）
3. 创建完成后，进入应用页面，记下：
   - **Client ID** — 在应用设置里
   - **API Key** — 在左侧导航 **API Keys** 里生成一个

把这两个值先存好，后面要用。

## 第二步：创建 Google Cloud 项目

Nylas 需要你自己的 Google OAuth credentials 来连接用户的 Google Calendar。

1. 打开 [Google Cloud Console](https://console.cloud.google.com)
2. 创建一个新项目（或用已有的）
3. 确保项目已启用以下 API（在 **APIs & Services > Library** 里搜索并启用）：
   - **Google Calendar API**

## 第三步：配置 OAuth 同意屏幕

1. 进入 **APIs & Services > OAuth consent screen**
2. User Type 选 **External**，点 Create
3. 填写：
   - App name：你的应用名
   - User support email：你的邮箱
   - Authorized domains：填 `nylas.com`（因为用 Nylas hosted auth）
   - Developer contact email：你的邮箱
4. 点 **Save and Continue**
5. **Scopes** 页面，点 **Add or Remove Scopes**，添加：
   - `https://www.googleapis.com/auth/calendar` （读写日历）
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `openid`
6. 保存并继续，跳过 Test users
7. 回到 OAuth consent screen，点 **Publish App**（从 Testing 切到 Production）

> **注意**：如果暂时不 publish，处于 Testing 模式的 token 每 7 天过期。建议尽早 publish。Calendar 权限属于 "sensitive" 级别，发布后 Google 会要求验证，但这是免费的，不需要 $15k 的 CASA 安全评估。

## 第四步：创建 OAuth Credentials

1. 进入 **APIs & Services > Credentials**
2. 点 **Create Credentials > OAuth client ID**
3. Application type 选 **Web application**
4. 名字随意
5. **Authorized redirect URIs** 添加：
   - `https://api.us.nylas.com/v3/connect/callback`（Nylas 的回调地址）
6. 点 **Create**
7. 记下生成的 **Client ID** 和 **Client Secret**

## 第五步：在 Nylas Dashboard 配置 Google Connector

1. 回到 [Nylas Dashboard](https://dashboard.nylas.com)
2. 左侧导航选 **Connectors**
3. 点 **Add Connector**，选 **Google**
4. 填入刚才在 Google Cloud 创建的：
   - **Client ID**
   - **Client Secret**
5. Scopes 确保包含 `https://www.googleapis.com/auth/calendar`
6. 保存

## 第六步：设置 Callback URI

Nylas 认证完成后会把用户重定向到你的 Callback URI。因为开发服务器没有公网 IP，需要用 ngrok 暴露端口。

### 开发环境（ngrok）

1. 安装 ngrok：去 [ngrok.com](https://ngrok.com) 注册并下载，或 `npm install -g ngrok`
2. 启动你的 Express server：`cd server && node index.js`（监听 3000 端口）
3. 另开终端，启动 ngrok：`ngrok http 3000`
4. 你会看到类似这样的输出：
   ```
   Forwarding  https://a1b2c3d4.ngrok-free.app → http://localhost:3000
   ```
5. 在 Nylas Dashboard 的应用设置里，把 **Callback URI** 设为：
   - `https://a1b2c3d4.ngrok-free.app/auth/google/callback`

> ngrok 免费版每次重启 URL 会变，需要重新更新 Nylas Dashboard。付费版可以固定子域名。

### 生产环境（Vercel）

部署到 Vercel 后，Callback URI 改为：
- `https://your-app.vercel.app/auth/google/callback`

> Nylas 支持多个 Callback URI，可以同时保留 ngrok 和 Vercel 的地址。

## 第七步：填入环境变量

把收集到的值填入 `server/.env`：

```
NYLAS_CLIENT_ID=你的_nylas_client_id
NYLAS_API_KEY=你的_nylas_api_key
NYLAS_CALLBACK_URI=https://你的ngrok地址.ngrok-free.app/auth/google/callback
POSTGRES_URL=你的_vercel_postgres_连接串
```

## 验证

1. 确保 ngrok 正在运行且 URL 已填入 Nylas Dashboard
2. 启动 server，访问 `http://localhost:3000/auth/google`
3. 应该会跳转到 Google 登录页面，授权后通过 ngrok 回到你的 callback 地址

---

## 可选：添加 Nylas Support 到 GCP 项目

Nylas 建议把他们的支持团队加为项目成员，方便排查问题：

1. Google Cloud Console → **IAM & Admin > IAM**
2. 添加 `support@nylas.com`，角色选 **Owner**
3. 保存

---

## 常见问题

**Q: OAuth consent screen 显示的是 "Nylas" 而不是我的品牌？**
A: 这是 Nylas Hosted Auth 的特点。用户看到的是 Nylas 的认证页面。Phase 1 可以接受，Phase 2 迁移到 Google 直连后就是你自己的品牌了。

**Q: Testing 模式和 Production 模式有什么区别？**
A: Testing 模式下 token 7 天过期，只能添加测试用户（最多 100 人）。Production 模式没有这些限制，但需要 Google 验证（2-8 周）。

**Q: 需要付费吗？**
A: Nylas 有免费试用额度。正式使用 Calendar 计划 $10/月起，包含 5 个连接账号，每多一个 $1/月。

## 参考链接

- [Nylas v3 Auth 文档](https://developer.nylas.com/docs/v3/auth/)
- [Nylas Hosted OAuth (API Key 方式)](https://developer.nylas.com/docs/v3/auth/hosted-oauth-apikey/)
- [Nylas Google Provider 指南](https://developer.nylas.com/docs/dev-guide/provider-guides/google/)
- [创建 Google Auth App](https://developer.nylas.com/docs/provider-guides/google/create-google-app/)
- [Google 验证指南](https://developer.nylas.com/docs/provider-guides/google/google-verification-security-assessment-guide/)
