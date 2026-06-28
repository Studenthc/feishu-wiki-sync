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
APIMART_TEXT_API_KEY=你的_apimart_key
GRSAI_API_KEY=你的_grsai_key
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
- `APIMART_TEXT_API_KEY`，推荐；配置后优先使用 APIMart 的 `deepseek-v4-flash` 做中文总结和机会分析
- `APIMART_API_KEY`，可选；没有 `APIMART_TEXT_API_KEY` 时作为 APIMart 文本备用 key
- `GRSAI_API_KEY`，推荐；配置后优先使用 GrsAI 的 OpenAI 兼容接口调用 Gemini Flash 做中文总结和机会分析
- `GEMINI_API_KEY`，推荐；配置后会把产品/新闻的标题、简介、描述改写成中文
- `OPENAI_API_KEY`，可选；没有 Gemini key 时作为中文化备用 provider

可选添加仓库变量：

- `APIMART_TEXT_MODEL`，默认 `deepseek-v4-flash`
- `APIMART_TEXT_API_URL`，默认 `https://api.apimart.ai/api/v1/chat/completions`
- `APIMART_TEXT_MAX_TOKENS`，默认 `6000`
- `APIMART_TEXT_TIMEOUT_MS`，默认 `120000`
- `GRSAI_MODEL`，默认 `gemini-2.5-flash`
- `GRSAI_API_URL`，默认 `https://api.grsai.com/v1/chat/completions`
- `GRSAI_MAX_TOKENS`，默认 `6000`
- `GRSAI_TIMEOUT_MS`，默认 `30000`
- `GEMINI_MODEL`，默认 `gemini-2.0-flash-lite`；Gemini 临时高峰不可用时，脚本会自动重试并尝试备用模型
- `CHINESE_BATCH_SIZE`，默认 `30`；控制每次发给模型的产品/新闻条数，调小更稳，调大更快
- `OPENAI_MODEL`，默认使用脚本内置模型；需要切换模型时再配置

GitHub Actions 里默认设置了 `REQUIRE_CHINESE=true`。如果没有配置 `APIMART_TEXT_API_KEY` / `APIMART_API_KEY` / `GRSAI_API_KEY` / `GEMINI_API_KEY` / `OPENAI_API_KEY`，或中文化在自动重试和备用模型后仍然失败，定时任务会直接失败，避免把英文内容写进知识库。

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
pnpm sync:daily -- --source=all --opportunity --max-opportunity-items=3
```

机会雷达会输出：

- 今日最值得验证的 1-3 个机会
- 每个产品/新闻的一句话简介
- 需求判断和目标用户
- 最小建站角度，不默认建议做完整 SaaS
- 内容选题角度和短视频脚本角度
- SEO 关键词
- 变现方式，但会标明是否只是推测
- 机会评分、证据等级和 5 项评分拆解
- 是否值得跟进：`验证` / `观察` / `放弃`
- 今日动作：2-4 个 30 分钟内能完成的验证动作
- 缺少证据：还需要查搜索量、竞品变现、用户反馈或 affiliate 可能性
- 本周验证实验

评分拆解固定为 5 个 0/1 分项：

- 痛点证据
- 搜索意图
- 变现证据
- MVP 适配
- 内容适配

`机会评分` 是证据评分，不是直接开做评分。`验证` 的意思是值得做当天验证动作，不代表已经适合注册域名或开发完整产品。

这篇文档的目标不是搬运新闻，而是把 PH/HN 信息转成可以用于建站、SEO、affiliate、SaaS 小 MVP 和自媒体选题的中文判断。默认只保留 3 条候选，避免每天堆出一篇需要人工再筛的泛列表。

建议先本地预览质量，再决定是否写入飞书：

```bash
pnpm sync:daily -- --source=all --opportunity-only --max-opportunity-items=3 --dry-run
```

如果输出里出现泛泛的 "注册域名"、"搭建完整网站"、"做 SaaS" 但没有搜索词、竞品、变现证据和当天验证动作，需要继续收紧 prompt 或把该机会降级为 `观察` / `放弃`。

## 可抄作业产品案例拆解

除了机会雷达，也可以生成更像付费产品案例研究的深度文档：

```bash
pnpm sync:daily -- --source=all --case-study-only --max-case-studies=1 --dry-run
```

这篇文档会把 PH/HN 候选拆成类似「可以抄作业的闷声发财产品」的结构：

- 今天只看这一个
- 直接抄这个 / 不要抄这个
- 今天 30 分钟执行
- 放弃标准
- 名字、网址、上线时间
- 上月付费行为陡增
- 解决什么问题
- 用户是谁
- 用户为什么付费
- 技术原理是什么
- 小团队怎么抄
- 今天怎么验证
- 付费陡增的原因
- 风险：不要踩什么坑

注意：PH/HN 本身没有真实「上月付费行为陡增」数据，所以文档会把该字段标为 `未验证`，不会编造增长百分比。它的价值是把热点拆成更接近付款动作的产品案例，而不是证明这些产品已经赚钱。默认每天只深拆 1 个，核心是帮你决定「今天做不做这个切口」，不是继续扩充阅读材料。

GitHub Actions 当前会每天运行：

```bash
pnpm sync:daily -- --opportunity --case-study --max-opportunity-items=3 --max-case-studies=1
```

因此每天会创建普通内容列表，并额外创建：

- `每日机会雷达 - YYYY-MM-DD`
- `可抄作业产品案例拆解 - YYYY-MM-DD`
