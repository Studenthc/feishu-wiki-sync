# Align Daily Main Opportunity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the daily opportunity radar and case-study report use the same code-selected main opportunity, so model output cannot choose a different headline opportunity.

**Architecture:** Centralize the main-opportunity selection contract around `selectAllOpportunities()`. `buildOpportunityRadar()` and `buildCaseStudyReport()` will both compute the same preferred opportunity, pass it to the model, and normalize model output so the first/top item is always that preferred opportunity. Local fallback behavior remains the source of truth.

**Tech Stack:** TypeScript, `tsx`, existing provider abstraction in `scripts/lib/chinese.ts`, existing PH/HN types and formatter tests.

---

## File Structure

- Modify `scripts/lib/opportunity.ts`
  - Add a preferred-opportunity conversion path for radar.
  - Pass `preferredOpportunity` into the model prompt.
  - Normalize successful model output with a deterministic preferred first item.
- Modify `scripts/lib/case-study.ts`
  - Normalize successful model output so the first case always matches the preferred opportunity.
  - Keep model-created rich prose only when it matches the preferred opportunity.
- Modify `scripts/lib/opportunity.test.ts`
  - Add a regression test that imported model radar output choosing the wrong title gets corrected to the preferred opportunity in formatted output.
- Modify `scripts/lib/case-study.test.ts`
  - Add a regression test that model case output choosing another case gets corrected to the preferred opportunity.
- No change to GitHub Actions, auth, model provider, or Feishu write code.

---

### Task 1: Lock Opportunity Radar Main Pick

**Files:**
- Modify: `scripts/lib/opportunity.ts`
- Test: `scripts/lib/opportunity.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test in `scripts/lib/opportunity.test.ts` that builds a radar object whose first model-generated opportunity is wrong, then normalizes it through the new helper.

```ts
import { normalizeOpportunityRadarForTest } from "./opportunity";
import { selectAllOpportunities } from "./opportunity-selector";
```

Use PH/HN fixtures where the selector clearly prefers VPN:

```ts
const vpnStory = {
  id: 99,
  title: "European Digital Identity Wallet is a gift to Google and Apple",
  titleZh: "欧洲数字身份钱包是送给谷歌和苹果的礼物",
  url: "https://example.com/eu-wallet",
  by: "privacy",
  score: 52,
  descendants: 18,
  time: 1_782_662_400,
  summary: "Privacy-focused discussion about trust, VPN alternatives, and platform lock-in.",
  summaryZh: "围绕隐私、信任和 VPN 替代品的讨论。",
  siteName: "example.com",
};

const databoxProduct = {
  id: "databox",
  name: "Databox Skills Marketplace",
  tagline: "AI analytics report skills",
  description: "A marketplace for analytics reports and AI skills.",
  url: "https://example.com/databox",
  thumbnail: { url: "" },
  reviewsCount: 2,
  commentsCount: 10,
};

const preferred = selectAllOpportunities({
  products: [databoxProduct],
  stories: [vpnStory],
})[0];

const normalized = normalizeOpportunityRadarForTest(
  {
    date: "2026-06-30",
    dailyBrief: "今日主机会是 Databox 的 AI 分析技能库。",
    topPicks: [
      {
        title: "AI 分析技能库教程与模板站",
        why: "模型错误选择了另一个机会。",
        actionToday: "搜索 AI analytics report template。",
      },
    ],
    topOpportunities: [
      {
        title: "AI 分析技能库教程与模板站",
        source: "Product Hunt",
        originalName: "Databox Skills Marketplace",
        summary: "Databox 技能市场。",
        demand: "营销人员需要报告模板。",
        targetUsers: "营销人员",
        monetization: "广告或模板售卖",
        seoKeywords: ["AI analytics report template"],
        siteIdeas: ["AI 报告模板站"],
        scoreBreakdown: {
          painEvidence: 1,
          searchIntent: 1,
          monetizationProof: 0,
          mvpFit: 1,
          contentFit: 1,
        },
        opportunityScore: 4,
        scoreReason: "模型给出的错误主机会。",
        evidenceLevel: "中证据",
        followUpDecision: "验证",
        nextValidationStep: "搜索关键词。",
        actionToday: ["搜索 AI analytics report template。"],
        missingEvidence: ["缺少付费证据。"],
        contentAngle: "报告模板怎么做。",
        buildAngle: "教程页。",
        shortVideoAngle: "讲报告模板。",
        url: "https://example.com/databox",
      },
    ],
    keywordClusters: [],
    avoidList: [],
    weeklyExperiments: [],
  },
  preferred,
  {
    date: "2026-06-30",
    products: [databoxProduct],
    stories: [vpnStory],
    maxItems: 3,
  }
);

assert.equal(normalized.topPicks[0]?.title, preferred?.title);
assert.equal(normalized.topOpportunities[0]?.title, preferred?.title);
assert.match(normalized.dailyBrief, /VPN 信任度与替代品对比/);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm test:opportunity
```

Expected: FAIL because `normalizeOpportunityRadarForTest` is not exported.

- [ ] **Step 3: Implement radar normalization**

In `scripts/lib/opportunity.ts`, add:

```ts
export function normalizeOpportunityRadarForTest(
  radar: OpportunityRadar,
  preferredOpportunity: SelectedOpportunity | undefined,
  input: OpportunityInput
): OpportunityRadar {
  return normalizeOpportunityRadar(radar, preferredOpportunity, input);
}
```

Add private helpers:

```ts
function normalizeOpportunityRadar(
  radar: OpportunityRadar,
  preferredOpportunity: SelectedOpportunity | undefined,
  input: OpportunityInput
): OpportunityRadar {
  const normalized = ensureUsefulRadar(radar, input);
  if (!preferredOpportunity) {
    return normalized;
  }

  const preferredItem = toOpportunityItem(preferredOpportunity);
  const rest = normalized.topOpportunities.filter(
    (item) =>
      item.title !== preferredItem.title &&
      item.originalName !== preferredItem.originalName
  );
  const topOpportunities = [preferredItem, ...rest].slice(0, input.maxItems);

  return {
    ...normalized,
    dailyBrief: `今天主机会是「${preferredItem.title}」。先用 30 分钟验证搜索、竞品变现和用户痛点；其他热点只当素材，不要分散开做。`,
    topPicks: [
      {
        title: preferredItem.title,
        why: `${preferredItem.evidenceLevel}，${preferredItem.scoreReason}`,
        actionToday: preferredItem.actionToday[0],
      },
    ],
    topOpportunities,
  };
}
```

Update `buildOpportunityRadar()`:

```ts
const preferredOpportunity = selectAllOpportunities(input)[0];
```

Pass it to model input:

```ts
preferredOpportunity,
```

Add prompt lines:

```ts
"如果输入里有 preferredOpportunity，dailyBrief、topPicks[0] 和 topOpportunities[0] 必须围绕它；不要自行改主机会。",
"preferredOpportunity 是代码层面选出的今日主机会，模型只能补充表达和细节。",
```

Change `.then((radar) => ensureUsefulRadar(radar, input))` to:

```ts
.then((radar) => normalizeOpportunityRadar(radar, preferredOpportunity, input))
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm test:opportunity
```

Expected: PASS.

- [ ] **Step 5: Commit**

Do not commit yet if Task 2 is still pending. Commit both tasks together after full validation.

---

### Task 2: Lock Case Study Main Case

**Files:**
- Modify: `scripts/lib/case-study.ts`
- Test: `scripts/lib/case-study.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test in `scripts/lib/case-study.test.ts`:

```ts
import { normalizeCaseStudyReportForTest } from "./case-study";
import { selectAllOpportunities } from "./opportunity-selector";
```

Use the same VPN-vs-Databox fixtures and a report where the model chooses Databox first:

```ts
const preferredCaseOpportunity = selectAllOpportunities({
  products: [databoxProduct],
  stories: [vpnStory],
})[0];

const normalizedCaseReport = normalizeCaseStudyReportForTest(
  {
    date: "2026-06-30",
    summary: "本次分析围绕 Databox 展开。",
    cases: [
      {
        title: "Databox AI 报告模板站",
        source: "Product Hunt",
        originalName: "Databox Skills Marketplace",
        productName: "Databox",
        url: "https://example.com/databox",
        launchTime: "未验证",
        paidGrowthSignal: "未验证；当前只有 PH 热度。",
        evidenceLevel: "中证据",
        whySelected: "模型错误选择 Databox。",
        problem: "需要报告模板。",
        users: "营销人员",
        paymentReason: "节省报告制作时间。",
        technicalPrinciple: "模板整理。",
        copyStrategy: "做报告模板站。",
        smallTeamWedges: ["报告模板"],
        minimumMvp: "一页模板目录。",
        validationActions: ["搜索 AI analytics report template。"],
        growthReason: "报告需求。",
        monetizationPath: "广告。",
        risks: ["不要编造付费数据。"],
        contentAngle: "报告模板。",
        missingEvidence: ["缺少付费证据。"],
        copyThis: "做报告模板站。",
        doNotCopy: "不要做完整 BI。",
        todayExecutionPlan: ["搜索关键词。"],
        killCriteria: ["没有商业页面就放弃。"],
      },
    ],
    rejected: [],
  },
  preferredCaseOpportunity,
  {
    date: "2026-06-30",
    products: [databoxProduct],
    stories: [vpnStory],
    maxCases: 1,
  }
);

assert.equal(normalizedCaseReport.cases[0]?.productName, preferredCaseOpportunity?.title);
assert.match(normalizedCaseReport.summary, /VPN 信任度与替代品对比/);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm test:case-study
```

Expected: FAIL because `normalizeCaseStudyReportForTest` is not exported.

- [ ] **Step 3: Implement case-study normalization**

In `scripts/lib/case-study.ts`, add:

```ts
export function normalizeCaseStudyReportForTest(
  report: CaseStudyReport,
  preferredOpportunity: SelectedOpportunity | undefined,
  input: CaseStudyInput
): CaseStudyReport {
  return normalizeCaseStudyReport(report, preferredOpportunity, input);
}
```

Add private helper:

```ts
function normalizeCaseStudyReport(
  report: CaseStudyReport,
  preferredOpportunity: SelectedOpportunity | undefined,
  input: CaseStudyInput
): CaseStudyReport {
  const normalized = ensureUsefulCaseStudyReport(report, input);
  if (!preferredOpportunity) {
    return normalized;
  }

  const preferredCase = buildFallbackOpportunityCase(preferredOpportunity);
  const rest = normalized.cases.filter(
    (item) =>
      item.productName !== preferredCase.productName &&
      item.originalName !== preferredCase.originalName
  );
  const cases = [preferredCase, ...rest].slice(0, input.maxCases);

  return {
    ...normalized,
    summary: `今天只深拆「${preferredOpportunity.title}」。先验证搜索、竞品变现和用户痛点，不要直接开做完整产品。`,
    cases,
  };
}
```

Change `.then((report) => ensureUsefulCaseStudyReport(report, input))` to:

```ts
.then((report) => normalizeCaseStudyReport(report, preferredOpportunity, input))
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm test:case-study
```

Expected: PASS.

- [ ] **Step 5: Commit**

Do not commit yet. Commit after full validation.

---

### Task 3: Validate End-To-End Dry Run

**Files:**
- No source changes expected.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
corepack pnpm typecheck
corepack pnpm test:selector
corepack pnpm test:opportunity
corepack pnpm test:case-study
corepack pnpm test:formatter
corepack pnpm test:lark-doc-xml
```

Expected: all PASS.

- [ ] **Step 2: Run no-provider dry-run for radar and case**

Run:

```bash
APIMART_TEXT_API_KEY= APIMART_API_KEY= GRSAI_API_KEY= GEMINI_API_KEY= OPENAI_API_KEY= corepack pnpm sync:daily -- --opportunity-only --max-opportunity-items=3 --dry-run
APIMART_TEXT_API_KEY= APIMART_API_KEY= GRSAI_API_KEY= GEMINI_API_KEY= OPENAI_API_KEY= corepack pnpm sync:daily -- --case-study-only --max-case-studies=1 --dry-run
```

Expected: both commands exit 0 and print `每日同步完成!`. In current fallback mode both reports should choose the same first opportunity.

- [ ] **Step 3: Check diff**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only planned files changed.

- [ ] **Step 4: Commit and push**

Run:

```bash
git add scripts/lib/opportunity.ts scripts/lib/opportunity.test.ts scripts/lib/case-study.ts scripts/lib/case-study.test.ts docs/superpowers/plans/2026-06-30-align-daily-main-opportunity.md
git commit -m "fix: lock daily main opportunity"
git push origin main
```

Expected: commit succeeds and pushes to `main`.

---

## Self-Review

- Spec coverage: The plan fixes the observed 2026-06-30 mismatch by forcing radar and case study to share the same selected opportunity. It does not add new data sources, matching the user's instruction.
- Placeholder scan: No `TBD`, `TODO`, or unresolved steps remain.
- Type consistency: `SelectedOpportunity`, `OpportunityRadar`, `OpportunityItem`, `CaseStudyReport`, and `ProductCaseStudy` signatures match existing code.
