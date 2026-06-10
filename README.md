# Feishu Wiki Sync

每天抓取 Product Hunt 和 HackerNews 内容，整理成 Markdown 后创建到飞书知识库。

## 本地运行

```bash
pnpm install
pnpm sync:daily -- --dry-run
```

`--dry-run` 只预览内容，不会创建飞书文档。

本地可以把 token 放到 `.env.local`：

```bash
PH_TOKEN=你的_access_token
GEMINI_API_KEY=你的_gemini_key
```

正式写入飞书前，需要先登录：

```bash
lark-cli auth login
pnpm sync:daily
```

## GitHub Actions 配置

定时任务在 `.github/workflows/feishu-daily-sync.yml`，当前配置为每天 UTC 00:00 运行一次，也就是北京时间 08:00。

需要在 GitHub 仓库的 `Settings -> Secrets and variables -> Actions` 添加：

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_SPACE_ID`
- `PH_TOKEN`，可选；不配置时会跳过 Product Hunt，只同步 HackerNews
- `GEMINI_API_KEY`，推荐；配置后会把产品/新闻的标题、简介、描述改写成中文
- `OPENAI_API_KEY`，可选；没有 Gemini key 时作为中文化备用 provider

可选添加仓库变量：

- `GEMINI_MODEL`，默认 `gemini-2.0-flash-lite`；Gemini 临时高峰不可用时，脚本会自动重试并尝试备用模型
- `CHINESE_BATCH_SIZE`，默认 `8`；控制每次发给模型的产品/新闻条数，调小更稳，调大更快
- `OPENAI_MODEL`，默认使用脚本内置模型；需要切换模型时再配置

GitHub Actions 里默认设置了 `REQUIRE_CHINESE=true`。如果没有配置 `GEMINI_API_KEY` / `OPENAI_API_KEY`，或中文化在自动重试和备用模型后仍然失败，定时任务会直接失败，避免把英文内容写进知识库。

CI 里使用飞书应用的 bot 身份写入知识库。需要确保飞书应用已经开通文档/知识库写入权限，并且 bot 对目标知识库空间有创建文档权限。

## Product Hunt Token

Product Hunt API v2 使用 GraphQL endpoint：

```text
https://api.producthunt.com/v2/api/graphql
```

官方文档说明，普通脚本不需要完整 OAuth 流，可以在 Product Hunt API dashboard 里拿 `developer_token`，这个 token 不会过期并绑定到你的账号。拿到后，把它保存为 GitHub Actions Secret：`PH_TOKEN`。

参考官方文档：https://api.producthunt.com/v2/docs

## 内容格式

每次同步会生成最多四篇文档：

- Product Hunt 热门产品
- Product Hunt 今日新品
- HackerNews 热门新闻
- HackerNews 最新新闻

每个产品/新闻都会包含一段 `简介`：

- Product Hunt：基于产品名称、tagline、description 自动整理；配置 `GEMINI_API_KEY` 后会输出中文标语、中文描述和中文简介。
- HackerNews：优先读取原文网页的 `og:description` / `description`；配置 `GEMINI_API_KEY` 后会输出中文标题和中文简介。

## 机会雷达

除了普通 PH/HN 列表，也可以生成面向上站赚钱的机会分析文档：

```bash
pnpm sync:daily -- --date=2026-05-14 --source=all --opportunity
```

只生成机会雷达，不生成普通列表：

```bash
pnpm sync:daily -- --date=2026-05-14 --source=ph --opportunity-only
```

控制分析条数：

```bash
pnpm sync:daily -- --source=all --opportunity --max-opportunity-items=8
```

机会雷达会输出：

- 今日最值得跟进的 1-3 个机会
- 每个产品/新闻的一句话简介
- 今日最值得研究的需求机会
- 目标用户
- 建站机会
- 变现方式
- SEO 关键词
- 机会评分和 5 项评分拆解
- 是否值得跟进
- 本周验证动作
- 短视频脚本角度

评分拆解固定为 5 个 0/1 分项：

- 真实痛点
- 搜索需求
- MVP 难度
- 可变现
- 内容传播性

这篇文档的目标不是搬运新闻，而是把 PH/HN 信息转成可以用于建站、SEO、affiliate、SaaS 小 MVP 和自媒体选题的中文判断。

GitHub Actions 当前会每天运行：

```bash
pnpm sync:daily -- --opportunity
```

因此每天会创建普通内容列表，并额外创建一篇 `每日机会雷达 - YYYY-MM-DD`。
