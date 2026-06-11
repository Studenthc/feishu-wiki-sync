# Grounded Opportunity Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current PH/HN opportunity radar from broad AI-generated business ideas into a conservative, grounded daily workflow that outputs what to film, what to write, what to validate, and what to avoid.

**Architecture:** Keep the existing single-document Feishu sync flow. Refine the opportunity schema, prompt, validation, fallback output, formatter, tests, and docs so every recommendation carries evidence level, verification actions, and a clear "do not build yet" gate. No new external API is added in this plan.

**Tech Stack:** TypeScript, tsx, Node.js, `pnpm`, current `ChineseJsonProvider` stack, existing `lark-cli` Feishu write path.

---

## Scope

This plan improves the existing `每日机会雷达` document only. It does not add Google Trends, keyword-volume APIs, competitor scraping, Reddit scraping, or a new UI. The output must be useful for the user's stated goal: find PH/HN-derived product/news angles that can become content, SEO pages, affiliate pages, or tiny MVP validation experiments.

The key product decision: **no opportunity should be presented as directly buildable unless it has at least one concrete validation action and no blocking evidence gap.** PH/HN heat is treated as a signal, not proof.

## File Structure

- Modify: `scripts/lib/opportunity.ts`
  - Extend `OpportunityItem` with grounded fields.
  - Tighten the model prompt so it stops inventing easy business ideas.
  - Validate grounded fields in `isUsefulOpportunityItem`.
  - Update Markdown output to prioritize "today's action" and "missing evidence".
  - Update fallback output so no-provider mode is conservative.

- Modify: `scripts/lib/opportunity.test.ts`
  - Update the fixture to include the new grounded fields.
  - Assert the Markdown contains practical sections and conservative gates.
  - Add tests for "not ready to build" wording through formatter output.

- Modify: `README.md`
  - Document the new opportunity radar behavior.
  - Explain that "yes" means "validate next", not "build a full product".
  - Add the recommended local dry-run command for reviewing quality before writing to Feishu.

- No new files are required for the implementation.

## Target Output Shape

The daily Feishu document should stop looking like this:

```text
今日动作: 注册域名 ai-agent-safety.com，搭建一个包含失控案例、检查清单和监控工具推荐的页面。
```

It should look closer to this:

```text
今日动作:
1. 搜索 "Claude Code permissions"、"MCP security"、"AI agent file access"。
2. 找 5 个已有页面，看是否有广告、affiliate、定价页或工具入口。
3. 写 1 条 45 秒短视频：AI 编程工具为什么不能随便开全权限。

证据等级: 弱证据
缺口: 只有 HN 热度，还没有搜索量、竞品变现和中文用户需求证据。
建议: 先拍内容和做关键词验证，不直接建完整站。
```

## Task 1: Extend Opportunity Schema With Grounded Fields

**Files:**
- Modify: `scripts/lib/opportunity.ts`
- Test: `scripts/lib/opportunity.test.ts`

- [ ] **Step 1: Write the failing test fixture update**

Replace the first item inside `topOpportunities` in `scripts/lib/opportunity.test.ts` with this complete object:

```ts
    {
      title: "AI 会议记忆工具",
      source: "Product Hunt",
      originalName: "Spellar 3.0",
      summary: "一个帮助团队记录会议、追踪决策和待办的 AI 工具。",
      demand: "团队需要跨会议追踪决策和待办。",
      targetUsers: "销售、咨询顾问、远程团队",
      monetization: "SaaS 订阅或会议模板售卖",
      seoKeywords: ["AI 会议助手", "会议纪要工具", "销售会议记录"],
      siteIdeas: ["AI 会议助手对比页", "会议纪要模板下载"],
      scoreBreakdown: {
        painEvidence: 1,
        searchIntent: 1,
        monetizationProof: 1,
        mvpFit: 1,
        contentFit: 0,
      },
      opportunityScore: 4,
      scoreReason: "痛点明确，付费用户清晰，但还需要确认中文搜索需求。",
      evidenceLevel: "中证据",
      followUpDecision: "验证",
      nextValidationStep: "做一页会议工具对比并发给 10 个销售或咨询从业者收反馈。",
      actionToday: [
        "搜索 AI 会议助手、会议纪要工具、销售会议记录 这 3 个关键词。",
        "找 5 个竞品页面，记录是否有定价页、广告、联盟计划或模板售卖。",
        "写 1 条 45 秒短视频，讲清楚销售团队为什么需要跨会议记忆。",
      ],
      missingEvidence: [
        "没有搜索量数据。",
        "没有确认中文用户是否主动搜索。",
        "没有确认 affiliate 或模板售卖能否成交。",
      ],
      contentAngle: "销售团队开完会最怕的不是没纪要，而是下次完全接不上上次承诺。",
      buildAngle: "先做会议助手对比页和会议纪要模板页，不做完整 SaaS。",
      shortVideoAngle: "用 45 秒讲清楚为什么销售团队需要跨会议记忆，再引出工具站机会。",
      url: "https://example.com/spellar",
    },
```

- [ ] **Step 2: Update expected assertions so the test fails**

Add these assertions near the existing formatter assertions:

```ts
assert.match(markdown, /证据等级\*\*: 中证据/);
assert.match(markdown, /今日动作/);
assert.match(markdown, /搜索 AI 会议助手、会议纪要工具、销售会议记录/);
assert.match(markdown, /缺少证据/);
assert.match(markdown, /没有搜索量数据/);
assert.match(markdown, /先做会议助手对比页和会议纪要模板页，不做完整 SaaS/);
assert.match(markdown, /是否值得跟进\*\*: 验证/);
```

- [ ] **Step 3: Run the test to verify it fails**

Run:

```bash
pnpm test:opportunity
```

Expected: TypeScript fails because `scoreBreakdown.realPain`, `searchDemand`, `easyMvp`, `monetizable`, and `contentPotential` no longer match the fixture, and because new fixture fields are not yet defined in `OpportunityItem`.

- [ ] **Step 4: Extend TypeScript interfaces**

In `scripts/lib/opportunity.ts`, replace the `scoreBreakdown` field in `OpportunityItem` with:

```ts
  scoreBreakdown: {
    painEvidence: number;
    searchIntent: number;
    monetizationProof: number;
    mvpFit: number;
    contentFit: number;
  };
```

Then add these fields after `scoreReason`:

```ts
  evidenceLevel: "强证据" | "中证据" | "弱证据";
```

Replace the current follow-up decision type:

```ts
  followUpDecision: "是" | "观察" | "否";
```

with:

```ts
  followUpDecision: "验证" | "观察" | "放弃";
```

Add these fields after `nextValidationStep`:

```ts
  actionToday: string[];
  missingEvidence: string[];
  contentAngle: string;
  buildAngle: string;
```

- [ ] **Step 5: Run the test to verify the interface errors are reduced**

Run:

```bash
pnpm test:opportunity
```

Expected: the test still fails, but errors now point to formatter and helper functions that still expect old score keys and old decision labels.

- [ ] **Step 6: Commit the schema test change**

```bash
git add scripts/lib/opportunity.ts scripts/lib/opportunity.test.ts
git commit -m "test: define grounded opportunity radar schema"
```

## Task 2: Update Scoring Helpers And Validation

**Files:**
- Modify: `scripts/lib/opportunity.ts`
- Test: `scripts/lib/opportunity.test.ts`

- [ ] **Step 1: Update score validation**

In `scripts/lib/opportunity.ts`, replace `isValidScoreBreakdown` with:

```ts
function isValidScoreBreakdown(value: unknown): value is OpportunityItem["scoreBreakdown"] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const breakdown = value as Record<string, unknown>;
  return [
    breakdown.painEvidence,
    breakdown.searchIntent,
    breakdown.monetizationProof,
    breakdown.mvpFit,
    breakdown.contentFit,
  ].every((score) => score === 0 || score === 1);
}
```

- [ ] **Step 2: Update score sum helper**

Replace `getScoreFromBreakdown` with:

```ts
function getScoreFromBreakdown(
  breakdown: OpportunityItem["scoreBreakdown"]
): number {
  const score =
    breakdown.painEvidence +
    breakdown.searchIntent +
    breakdown.monetizationProof +
    breakdown.mvpFit +
    breakdown.contentFit;

  return Math.max(1, score);
}
```

- [ ] **Step 3: Update useful item validation**

In `isUsefulOpportunityItem`, replace the follow-up decision check:

```ts
    ["是", "观察", "否"].includes(item.followUpDecision) &&
    isUsefulText(item.nextValidationStep) &&
    isUsefulText(item.shortVideoAngle)
```

with:

```ts
    ["验证", "观察", "放弃"].includes(item.followUpDecision) &&
    ["强证据", "中证据", "弱证据"].includes(item.evidenceLevel) &&
    isUsefulText(item.nextValidationStep) &&
    Array.isArray(item.actionToday) &&
    item.actionToday.length > 0 &&
    item.actionToday.every(isUsefulText) &&
    Array.isArray(item.missingEvidence) &&
    item.missingEvidence.length > 0 &&
    item.missingEvidence.every(isUsefulText) &&
    isUsefulText(item.contentAngle) &&
    isUsefulText(item.buildAngle) &&
    isUsefulText(item.shortVideoAngle)
```

- [ ] **Step 4: Update fallback score helper**

Replace `buildFallbackScoreBreakdown` with:

```ts
function buildFallbackScoreBreakdown(
  score: number
): OpportunityItem["scoreBreakdown"] {
  return {
    painEvidence: score >= 1 ? 1 : 0,
    searchIntent: score >= 2 ? 1 : 0,
    monetizationProof: score >= 4 ? 1 : 0,
    mvpFit: score >= 3 ? 1 : 0,
    contentFit: score >= 5 ? 1 : 0,
  };
}
```

- [ ] **Step 5: Update follow-up decision helper**

Replace `getFollowUpDecision` with:

```ts
function getFollowUpDecision(score: number): OpportunityItem["followUpDecision"] {
  if (score >= 4) {
    return "验证";
  }

  if (score === 3) {
    return "观察";
  }

  return "放弃";
}
```

- [ ] **Step 6: Add evidence-level helper**

Add this helper after `getFollowUpDecision`:

```ts
function getEvidenceLevel(score: number): OpportunityItem["evidenceLevel"] {
  if (score >= 5) {
    return "强证据";
  }

  if (score >= 3) {
    return "中证据";
  }

  return "弱证据";
}
```

- [ ] **Step 7: Run the test**

Run:

```bash
pnpm test:opportunity
```

Expected: the test still fails in formatter assertions because Markdown output has not been updated yet.

- [ ] **Step 8: Commit validation changes**

```bash
git add scripts/lib/opportunity.ts scripts/lib/opportunity.test.ts
git commit -m "feat: validate grounded opportunity signals"
```

## Task 3: Tighten The LLM Prompt So It Stops Overclaiming

**Files:**
- Modify: `scripts/lib/opportunity.ts`
- Test: `scripts/lib/opportunity.test.ts`

- [ ] **Step 1: Replace the analysis instructions**

In `buildOpportunityRadar`, replace the current Chinese instruction array with this content:

```ts
      [
        "你是一个面向独立开发者、内容站站长和短视频创作者的需求验证分析师。",
        "请从 Product Hunt 和 HackerNews 数据中找可验证的机会，不要把热点直接包装成确定能赚钱的项目。",
        "输出必须是中文 JSON，不能包含 Markdown。",
        "核心原则：PH/HN 热度只是线索，不是需求证明。没有搜索量、竞品变现、用户抱怨或付费场景时，必须标为弱证据或观察。",
        "输出要服务四个目的：1) 今天拍什么短视频；2) 今天写什么 SEO 内容；3) 今天验证什么小工具；4) 今天明确不该做什么。",
        "不要建议直接注册域名或搭建完整网站，除非 evidenceLevel 是 强证据。",
        "每个机会都必须包含 missingEvidence，明确写出还缺什么证据。",
        "actionToday 必须是 2 到 4 个 30 分钟内能完成的动作，例如搜关键词、找竞品、看定价页、看 affiliate、写一条脚本、发一个帖子收反馈。",
        "buildAngle 必须是最小站点形态，例如对比页、计算器、模板页、检查清单、目录页、教程页。不要默认做 SaaS。",
        "contentAngle 必须像真人短视频选题，讲具体冲突、具体人群、具体场景，不要写泛泛的商业术语。",
        "评分标准是证据评分，不是想象空间评分。",
        "opportunityScore 必须是 1 到 5 的整数，5 代表最值得本周验证，不代表直接开做完整产品。",
        "scoreBreakdown 是 5 个 0/1 分项：painEvidence, searchIntent, monetizationProof, mvpFit, contentFit。",
        "painEvidence=1 表示输入里能看到具体痛点或强讨论；searchIntent=1 表示能推导出明确搜索词；monetizationProof=1 表示有清晰付费、广告、affiliate、模板或工具变现路径；mvpFit=1 表示一周内能做出轻量页面或工具；contentFit=1 表示适合拍成普通人听得懂的短视频或图文。",
        "opportunityScore 必须等于 scoreBreakdown 五项之和；如果总分为 0，opportunityScore 输出 1。",
        "evidenceLevel 只能是 强证据、中证据、弱证据。只有同时具备痛点、搜索意图、变现证据时才能是强证据。",
        "followUpDecision 只能是 验证、观察、放弃。4-5 分一般是 验证，3 分一般是 观察，1-2 分一般是 放弃。",
        "topPicks 输出 1 到 3 个今日最推荐验证的机会，必须来自 topOpportunities。",
        "topPicks.actionToday 必须是当天最小动作，不允许写注册域名、搭建完整网站、做完整 SaaS。",
        "weeklyExperiments 给 3 个本周可做的验证实验，每个实验必须能用手工或单页完成。",
        "必须使用英文 JSON 键名：date, dailyBrief, topPicks, topOpportunities, keywordClusters, avoidList, weeklyExperiments。",
        "topPicks 每一项必须包含这些英文键名：title, why, actionToday。",
        "topOpportunities 每一项必须包含这些英文键名：title, source, originalName, summary, demand, targetUsers, monetization, seoKeywords, siteIdeas, scoreBreakdown, opportunityScore, scoreReason, evidenceLevel, followUpDecision, nextValidationStep, actionToday, missingEvidence, contentAngle, buildAngle, shortVideoAngle, url。",
        "keywordClusters 每一项必须包含这些英文键名：cluster, keywords, why。",
        "avoidList 每一项必须包含这些英文键名：name, reason。",
        "weeklyExperiments 每一项必须包含这些英文键名：idea, landingPageAngle, validationStep。",
        "只要输入 products 或 stories 非空，topOpportunities 至少输出 5 项，keywordClusters 至少输出 3 项，avoidList 至少输出 2 项，weeklyExperiments 至少输出 3 项。",
        "严格按这个 JSON 形状输出：",
        '{"date":"YYYY-MM-DD","dailyBrief":"中文今日总览","topPicks":[{"title":"中文机会标题","why":"中文推荐理由","actionToday":"中文今日最小动作"}],"topOpportunities":[{"title":"中文机会标题","source":"Product Hunt","originalName":"原产品或新闻名","summary":"中文一句话简介","demand":"中文需求判断","targetUsers":"中文目标用户","monetization":"中文变现方式","seoKeywords":["中文关键词"],"siteIdeas":["中文页面或工具想法"],"scoreBreakdown":{"painEvidence":1,"searchIntent":1,"monetizationProof":0,"mvpFit":1,"contentFit":1},"opportunityScore":4,"scoreReason":"中文评分理由","evidenceLevel":"中证据","followUpDecision":"验证","nextValidationStep":"中文验证动作","actionToday":["中文今日动作1","中文今日动作2"],"missingEvidence":["中文缺失证据1"],"contentAngle":"中文内容选题角度","buildAngle":"中文最小建站角度","shortVideoAngle":"中文短视频讲法","url":"https://example.com"}],"keywordClusters":[{"cluster":"中文集群名","keywords":["中文关键词"],"why":"中文理由"}],"avoidList":[{"name":"中文名称","reason":"中文理由"}],"weeklyExperiments":[{"idea":"中文实验","landingPageAngle":"中文落地页角度","validationStep":"中文验证动作"}]}',
      ].join("\n"),
```

- [ ] **Step 2: Run the existing formatter test**

Run:

```bash
pnpm test:opportunity
```

Expected: prompt changes compile, but the formatter test still fails until Task 4.

- [ ] **Step 3: Commit prompt changes**

```bash
git add scripts/lib/opportunity.ts
git commit -m "feat: make opportunity prompt evidence-first"
```

## Task 4: Update Markdown Formatter For Practical Daily Use

**Files:**
- Modify: `scripts/lib/opportunity.ts`
- Test: `scripts/lib/opportunity.test.ts`

- [ ] **Step 1: Update top-pick wording**

In `formatOpportunityRadar`, replace:

```ts
  md += `## 今日最值得跟进\n\n`;
```

with:

```ts
  md += `## 今日最值得验证\n\n`;
```

Replace the empty state:

```ts
    md += `今天没有明显高分机会，建议只观察关键词和讨论方向。\n\n`;
```

with:

```ts
    md += `今天没有明显值得马上验证的机会，建议只观察关键词和讨论方向。\n\n`;
```

Replace:

```ts
      md += `   - 今日动作: ${pick.actionToday}\n`;
```

with:

```ts
      md += `   - 今日最小动作: ${pick.actionToday}\n`;
```

- [ ] **Step 2: Update opportunity item Markdown**

Inside the `radar.topOpportunities.forEach` block, replace the current scoring and action lines:

```ts
    md += `- **评分拆解**: 真实痛点 ${item.scoreBreakdown.realPain}/1，搜索需求 ${item.scoreBreakdown.searchDemand}/1，MVP 难度 ${item.scoreBreakdown.easyMvp}/1，可变现 ${item.scoreBreakdown.monetizable}/1，内容传播 ${item.scoreBreakdown.contentPotential}/1\n`;
    md += `- **机会评分**: ${item.opportunityScore}/5，${item.scoreReason}\n`;
    md += `- **是否值得跟进**: ${item.followUpDecision}\n`;
    md += `- **本周验证**: ${item.nextValidationStep}\n`;
    md += `- **短视频脚本角度**: ${item.shortVideoAngle}\n`;
```

with:

```ts
    md += `- **评分拆解**: 痛点证据 ${item.scoreBreakdown.painEvidence}/1，搜索意图 ${item.scoreBreakdown.searchIntent}/1，变现证据 ${item.scoreBreakdown.monetizationProof}/1，MVP 适配 ${item.scoreBreakdown.mvpFit}/1，内容适配 ${item.scoreBreakdown.contentFit}/1\n`;
    md += `- **机会评分**: ${item.opportunityScore}/5，${item.scoreReason}\n`;
    md += `- **证据等级**: ${item.evidenceLevel}\n`;
    md += `- **是否值得跟进**: ${item.followUpDecision}\n`;
    md += `- **最小建站角度**: ${item.buildAngle}\n`;
    md += `- **内容选题角度**: ${item.contentAngle}\n`;
    md += `- **本周验证**: ${item.nextValidationStep}\n`;
    md += `- **今日动作**:\n`;
    item.actionToday.forEach((action) => {
      md += `  - ${action}\n`;
    });
    md += `- **缺少证据**:\n`;
    item.missingEvidence.forEach((evidence) => {
      md += `  - ${evidence}\n`;
    });
    md += `- **短视频脚本角度**: ${item.shortVideoAngle}\n`;
```

- [ ] **Step 3: Update formatter assertions**

In `scripts/lib/opportunity.test.ts`, replace:

```ts
assert.match(markdown, /今日最值得跟进/);
```

with:

```ts
assert.match(markdown, /今日最值得验证/);
```

Replace:

```ts
assert.match(markdown, /评分拆解\*\*: 真实痛点 1\/1，搜索需求 1\/1/);
```

with:

```ts
assert.match(markdown, /评分拆解\*\*: 痛点证据 1\/1，搜索意图 1\/1，变现证据 1\/1/);
```

- [ ] **Step 4: Run the formatter test**

Run:

```bash
pnpm test:opportunity
```

Expected: PASS.

- [ ] **Step 5: Commit formatter changes**

```bash
git add scripts/lib/opportunity.ts scripts/lib/opportunity.test.ts
git commit -m "feat: format grounded opportunity radar"
```

## Task 5: Make Fallback Output Conservative

**Files:**
- Modify: `scripts/lib/opportunity.ts`
- Test: `scripts/lib/opportunity.test.ts`

- [ ] **Step 1: Add fallback action helper**

Add this helper before `buildFallbackRadar`:

```ts
function buildFallbackActions(keywords: string[]): string[] {
  const keywordText = keywords.filter(Boolean).slice(0, 3).join("、");
  return [
    `搜索 ${keywordText}，记录前 10 个结果是否有工具页、对比页、广告或定价页。`,
    "找 5 个竞品或相邻页面，记录它们靠订阅、广告、联盟、模板还是咨询变现。",
    "写 1 条 45 秒短视频脚本，只讲一个具体痛点和一个最小验证动作。",
  ];
}
```

- [ ] **Step 2: Add fallback missing-evidence helper**

Add this helper after `buildFallbackActions`:

```ts
function buildFallbackMissingEvidence(): string[] {
  return [
    "还没有搜索量数据。",
    "还没有确认竞品是否真实变现。",
    "还没有从目标用户处拿到直接反馈。",
  ];
}
```

- [ ] **Step 3: Update fallback product items**

Inside the `productItems` object in `buildFallbackRadar`, add these fields after `scoreReason`:

```ts
    evidenceLevel: getEvidenceLevel(
      Math.min(5, Math.max(1, Math.ceil((product.commentsCount || 1) / 30)))
    ),
```

Add these fields after `nextValidationStep`:

```ts
    actionToday: buildFallbackActions([
      product.name,
      product.taglineZh || product.tagline,
      `${product.name} 替代品`,
    ]),
    missingEvidence: buildFallbackMissingEvidence(),
    contentAngle: `用一个具体场景讲清楚 ${product.name} 背后的痛点，而不是介绍产品本身。`,
    buildAngle: `${product.name} 替代品页、对比页或模板页，先不做完整 SaaS。`,
```

- [ ] **Step 4: Update fallback story items**

Inside the `storyItems` object in `buildFallbackRadar`, add these fields after `scoreReason`:

```ts
    evidenceLevel: getEvidenceLevel(
      Math.min(5, Math.max(1, Math.ceil((story.descendants || 1) / 80)))
    ),
```

Add these fields after `nextValidationStep`:

```ts
    actionToday: buildFallbackActions([
      story.titleZh || story.title,
      `${story.siteName || "相关"} 工具`,
      "替代方案",
    ]),
    missingEvidence: buildFallbackMissingEvidence(),
    contentAngle: `用这条讨论里的冲突切入，讲清楚谁在痛、为什么现在痛。`,
    buildAngle: "先做解读页、工具清单或检查清单，不做完整平台。",
```

- [ ] **Step 5: Update fallback top-pick text**

Replace the fallback `topPicks` mapping:

```ts
      .map((item) => ({
        title: item.title,
        why: item.scoreReason,
        actionToday: item.nextValidationStep,
      })),
```

with:

```ts
      .map((item) => ({
        title: item.title,
        why: `${item.evidenceLevel}，${item.scoreReason}`,
        actionToday: item.actionToday[0],
      })),
```

- [ ] **Step 6: Run typecheck and formatter test**

Run:

```bash
pnpm typecheck
pnpm test:opportunity
```

Expected: both PASS.

- [ ] **Step 7: Commit fallback changes**

```bash
git add scripts/lib/opportunity.ts
git commit -m "feat: make fallback radar conservative"
```

## Task 6: Update README With New Meaning Of The Radar

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the opportunity radar bullet list**

In `README.md`, replace the current list under "机会雷达会输出：" with:

```md
机会雷达会输出：

- 今日最值得验证的 1-3 个机会
- 每个产品/新闻的一句话简介
- 需求判断和目标用户
- 最小建站角度，不默认建议做完整 SaaS
- 内容选题角度和短视频脚本角度
- SEO 关键词和可能的页面形态
- 变现方式，但会标明是否只是推测
- 机会评分、证据等级和 5 项评分拆解
- 是否值得跟进：`验证` / `观察` / `放弃`
- 今日动作：2-4 个 30 分钟内能完成的验证动作
- 缺少证据：还需要查搜索量、竞品变现、用户反馈或 affiliate 可能性
- 本周验证实验
```

- [ ] **Step 2: Replace the scoring explanation**

Replace the current scoring section:

```md
评分拆解固定为 5 个 0/1 分项：

- 真实痛点
- 搜索需求
- MVP 难度
- 可变现
- 内容传播性
```

with:

```md
评分拆解固定为 5 个 0/1 分项：

- 痛点证据
- 搜索意图
- 变现证据
- MVP 适配
- 内容适配

`机会评分` 是证据评分，不是直接开做评分。`验证` 的意思是值得做当天验证动作，不代表已经适合注册域名或开发完整产品。
```

- [ ] **Step 3: Add local quality-review command**

After the paragraph that starts with "这篇文档的目标不是搬运新闻", add:

```md
建议先本地预览质量，再决定是否写入飞书：

```bash
pnpm sync:daily -- --source=all --opportunity-only --max-opportunity-items=3 --dry-run
```

如果输出里出现泛泛的 "注册域名"、"搭建完整网站"、"做 SaaS" 但没有搜索词、竞品、变现证据和当天验证动作，需要继续收紧 prompt 或把该机会降级为 `观察` / `放弃`。
```

- [ ] **Step 4: Run a README grep check**

Run:

```bash
rg -n "证据等级|缺少证据|机会评分.*不是直接开做|opportunity-only --max-opportunity-items=3 --dry-run" README.md
```

Expected: all four phrases appear.

- [ ] **Step 5: Commit README update**

```bash
git add README.md
git commit -m "docs: explain grounded opportunity radar"
```

## Task 7: End-To-End Verification

**Files:**
- No edits expected unless verification finds a defect.

- [ ] **Step 1: Run static checks**

Run:

```bash
pnpm typecheck
pnpm test:opportunity
```

Expected:

```text
opportunity formatter test passed
```

and typecheck exits with code 0.

- [ ] **Step 2: Run a dry-run preview with real providers**

Run:

```bash
pnpm sync:daily -- --source=all --opportunity-only --max-opportunity-items=3 --dry-run
```

Expected:

- The output contains `今日最值得验证`.
- Each listed opportunity contains `证据等级`.
- Each listed opportunity contains `今日动作`.
- Each listed opportunity contains `缺少证据`.
- No top-pick action tells the user to directly register a domain or build a full SaaS.

- [ ] **Step 3: If dry-run quality is too generic, inspect only the prompt and formatter**

If the preview still outputs broad actions such as "搭建完整网站" without evidence, tighten only the prompt lines in `scripts/lib/opportunity.ts` that define `actionToday`, `buildAngle`, `missingEvidence`, and `followUpDecision`. Do not add new data sources in this plan.

- [ ] **Step 4: Run one real Feishu write after dry-run passes**

Run:

```bash
pnpm sync:daily -- --source=all --opportunity-only --max-opportunity-items=3
```

Expected:

- Command exits with code 0.
- Output includes `创建成功: 每日机会雷达 - YYYY-MM-DD`.
- The Feishu document contains `今日最值得验证`, `证据等级`, `今日动作`, and `缺少证据`.

- [ ] **Step 5: Commit any verification fixes**

If Step 3 required changes, run:

```bash
git add scripts/lib/opportunity.ts scripts/lib/opportunity.test.ts README.md
git commit -m "fix: tighten grounded radar output quality"
```

If no changes were required, do not create an empty commit.

## Self-Review

### Spec Coverage

- The plan addresses the user's concern that the current output is not directly actionable by adding evidence level, missing evidence, and today's validation actions.
- The plan keeps the current PH + HN workflow and Feishu sync, matching the existing product direction.
- The plan avoids new data-source scope and keeps this iteration small enough to test quickly.
- The plan changes docs so future users understand that "验证" is not "直接开做".

### Placeholder Scan

No steps use unresolved placeholders. Each code-changing step includes concrete code blocks or exact replacement text. The only conditional path is the verification fix path, and it is bounded to existing prompt and formatter lines.

### Type Consistency

The plan consistently uses:

- `painEvidence`, `searchIntent`, `monetizationProof`, `mvpFit`, `contentFit`
- `evidenceLevel`
- `actionToday`
- `missingEvidence`
- `contentAngle`
- `buildAngle`
- `followUpDecision: "验证" | "观察" | "放弃"`

All formatter and test references match these names.

## Execution Notes

Implement in the task order above. Do not batch all tasks into one commit. The safest flow is schema test, validation, prompt, formatter, fallback, docs, then end-to-end verification.
