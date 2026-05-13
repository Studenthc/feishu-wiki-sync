import "dotenv/config";

import { findPostBySlug, insertPost, PostStatus, updatePost } from "@/models/post";
import { getUuid } from "@/lib/hash";

interface SeedPost {
  slug: string;
  locale: "en" | "zh";
  title: string;
  description: string;
  content: string;
  author_name: string;
  created_at: Date;
}

const commonCover = "/preview.png";

const posts: SeedPost[] = [
  {
    slug: "what-is-nano-banana-free",
    locale: "en",
    title: "What Nano Banana Free is actually good for",
    description:
      "A practical overview of where Nano Banana Free fits best, who it helps, and when the free tier is enough.",
    author_name: "Nano Banana Team",
    created_at: new Date("2026-04-02T09:00:00Z"),
    content: `## Why this product exists

Many people arrive at Nano Banana Free through search terms like "nano banana free" or "free nano banana". That usually means they want to test image quality quickly, not sit through a complicated onboarding flow.

Nano Banana Free is built for that first step: open the site, describe an image, generate, and decide later whether the workflow is useful enough to keep using.

## Best-fit use cases

The product works best for lightweight but repeatable visual tasks:

- testing prompt ideas before a campaign
- creating early cover concepts for social content
- trying alternate looks for posters or product scenes
- quickly checking whether a reference image can be remixed into a usable direction

It is less about replacing a full design suite and more about reducing the time needed to get to the first usable draft.

## What the free tier is for

The free tier is designed for evaluation. New accounts receive a small amount of credits so users can judge image style, speed, and overall fit.

That matters because not every AI image workflow deserves a subscription. A useful tool should let people test first, then upgrade only when there is a real repeat-use case.

## When a paid plan becomes reasonable

A paid plan makes more sense when one of these is true:

1. you are generating repeatedly rather than occasionally
2. you need stronger models or faster queues
3. you want cleaner exports for real publishing work
4. the workflow is moving from testing into client, team, or storefront usage

## Bottom line

Nano Banana Free is most useful as a fast AI image workspace for early experiments and repeat content production. If you only need one quick try, the free tier is enough. If you are already producing assets every week, the paid path becomes much easier to justify.`,
  },
  {
    slug: "nano-banana-prompt-guide",
    locale: "en",
    title: "A simple prompt structure for better Nano Banana results",
    description:
      "Use this structure to get more consistent Nano Banana images without writing long or overly technical prompts.",
    author_name: "Nano Banana Team",
    created_at: new Date("2026-04-03T09:00:00Z"),
    content: `## The easiest way to improve outputs

Most weak generations come from prompts that are too vague. You do not need an extremely long prompt, but you do need enough structure to guide the model.

A practical format is:

\`subject + setting + style + lighting + purpose\`

## Example

Instead of writing:

\`banana poster\`

write:

\`a premium banana mascot on product packaging, clean studio backdrop, glossy commercial style, soft directional lighting, designed for an ecommerce hero banner\`

## Why this works

Each section reduces ambiguity:

- **subject** tells the model what the main object is
- **setting** tells it where the scene happens
- **style** tells it how polished, playful, realistic, or illustrative it should feel
- **lighting** affects mood and clarity
- **purpose** helps the model bias toward a composition that fits the final use

## Good prompt habits

- Start with one strong subject
- Add only one or two style ideas at first
- Mention the final use case, such as cover, banner, or poster
- Regenerate after small edits instead of rewriting everything

## When to use a reference image

Use a reference image when composition matters more than idea exploration. A reference helps when you already know the framing or product angle you want, but still need new visual treatment.

## Final advice

The best prompt is usually not the longest one. It is the one that gives the model a clear job. If you can describe the subject, scene, look, and intended output in one sentence, your results usually improve fast.`,
  },
  {
    slug: "how-nano-banana-credits-work",
    locale: "en",
    title: "How credits work in Nano Banana Free",
    description:
      "An overview of what credits are for, when they are consumed, and how to think about upgrading without wasting spend.",
    author_name: "Nano Banana Team",
    created_at: new Date("2026-04-04T09:00:00Z"),
    content: `## Credits are usage units

Nano Banana Free uses credits to measure paid usage. Different models or actions can consume different amounts depending on how expensive the task is.

This is a more predictable system than forcing every user into the same subscription pattern.

## Free credits

New accounts receive a small amount of free credits so people can test the workflow before purchasing. This keeps the entry barrier low and helps users decide whether the product fits their real work.

## Paid credits

Paid plans add more credits and can also unlock stronger model access, faster queues, and better export rights. In practice, the value is not just the number itself. It is the ability to keep working without interruption once the tool becomes part of your routine.

## When credits should not be charged

Failed requests should not be treated the same as completed billable actions. If an image request fails and nothing usable is returned, that should not behave like a successful generation.

## How to decide whether to upgrade

Ask these questions:

1. am I coming back repeatedly every week?
2. am I testing for fun, or producing assets for a real workflow?
3. do I need stronger models or better export rights?

If the answer is mostly no, stay on the free tier for now. If the answer is yes, credits become a workflow purchase rather than an impulse purchase.

## The healthy way to think about it

Credits are most valuable when they remove friction from a process you already know you need. They are less useful when you are still deciding whether the product itself is worth using.`,
  },
  {
    slug: "when-to-upgrade-from-free-tier",
    locale: "en",
    title: "When it makes sense to upgrade from the free tier",
    description:
      "A practical checklist for deciding whether Nano Banana Free is still in test mode or already part of real production work.",
    author_name: "Nano Banana Team",
    created_at: new Date("2026-04-05T09:00:00Z"),
    content: `## Do not upgrade too early

The free tier exists so people can test output quality, prompt control, and basic flow. That means upgrading should happen only after the product proves useful.

## Signs you are still in test mode

- you have only generated once or twice
- you are still learning what style of prompt works
- you are not yet using outputs in a real project

In this stage, stay free.

## Signs you are moving into real use

- you return to the generator every few days
- you need more than one or two polished outputs
- you want stronger models or faster response time
- you need cleaner exports for public-facing work

That is where upgrading becomes rational.

## Signs the tool is becoming part of a workflow

The biggest shift is not emotional, it is operational. Once the tool starts saving you time on recurring work like social covers, posters, or product visuals, the paid plan is no longer about curiosity. It is about keeping production moving.

## A simple decision rule

If Nano Banana Free has already helped you finish actual work, upgrading is easy to justify. If it is still only an experiment, keep testing first.`,
  },
  {
    slug: "reference-images-for-better-results",
    locale: "en",
    title: "When to use reference images instead of rewriting prompts",
    description:
      "A practical guide to deciding when a reference image will improve consistency faster than another round of prompt edits.",
    author_name: "Nano Banana Team",
    created_at: new Date("2026-04-06T09:00:00Z"),
    content: `## Prompting is not always enough

Text prompts are great for idea exploration, but they are not always the best tool for composition control. If you already know the angle, framing, or product layout you want, a reference image often gives better consistency than rewriting the same prompt over and over.

## Good times to use a reference image

Use a reference image when:

- composition matters more than exploration
- you want to preserve the overall shape of a product or object
- you already have a useful draft and need a different style treatment
- your prompt keeps drifting away from the layout you need

## What a reference image helps with

A strong reference image can stabilize:

- subject placement
- camera angle
- large shape relationships
- visual hierarchy

That usually makes the iteration process shorter.

## What it does not solve automatically

A reference image does not replace clear intent. You still need to specify the visual direction, such as premium, playful, retro, or commercial. The best results come from combining reference structure with a clear prompt goal.

## A simple decision rule

If the problem is "the image idea is unclear", improve the prompt.

If the problem is "the layout keeps changing", add a reference image.

## Bottom line

Reference images are most helpful when you are already close to the result and need more control, not when you are still exploring from zero.`,
  },
  {
    slug: "nano-banana-for-marketing-assets",
    locale: "en",
    title: "Using Nano Banana Free for covers, posters, and product visuals",
    description:
      "A practical breakdown of how Nano Banana Free fits common marketing-asset workflows without pretending to replace a full design suite.",
    author_name: "Nano Banana Team",
    created_at: new Date("2026-04-07T09:00:00Z"),
    content: `## A realistic use case

Nano Banana Free is most useful when you need fast first-pass visuals, not when you need final multi-layer design control. That makes it a good fit for marketing teams that need speed at the concept and draft stage.

## Covers

For content covers, the main advantage is speed. You can test multiple visual directions quickly before deciding which one deserves refinement in a more detailed tool.

## Posters

For posters, the product is useful for generating scene direction, mood, and layout inspiration. It is especially helpful when a team needs several looks quickly instead of waiting on a full bespoke design process for every variation.

## Product visuals

For product visuals, the workflow works best when you already know the item you want to present and need multiple style directions. Reference images become especially valuable here.

## Where it fits in a team workflow

This is not only a solo creator tool. It also helps teams reduce time wasted on vague visual ideation. Instead of discussing abstract ideas for too long, teams can generate a few candidate directions and react to something concrete.

## The right expectation

Nano Banana Free is strongest as an idea-to-draft accelerator. It helps teams get to an image direction quickly, then decide whether that output is ready to publish or needs more downstream editing.`,
  },
  {
    slug: "nano-banana-free-ru-men",
    locale: "zh",
    title: "Nano Banana Free 到底适合拿来做什么",
    description:
      "从真实使用场景出发，解释 Nano Banana Free 更适合哪些任务，以及什么时候免费层就够了。",
    author_name: "Nano Banana 团队",
    created_at: new Date("2026-04-02T09:00:00Z"),
    content: `## 这个产品最适合解决什么问题

很多用户并不是带着强烈购买意图来的，而是先搜索“nano banana free”这类关键词，想快速试一下效果。

Nano Banana Free 最适合承接这种需求：先快速生成，先判断效果，再决定要不要进入更重的工作流。

## 更适合的使用场景

它比较适合这些轻量但重复出现的任务：

- 社媒封面的早期视觉尝试
- 海报或商品图风格方向验证
- 参考图重绘和灵感改写
- 营销素材的第一版草图生成

它不是完整设计软件的替代品，而是一个更快抵达“第一张可用图”的工具。

## 免费层的意义

免费层的意义不是长期白嫖，而是让你先判断这个产品值不值得进入自己的工作流。

如果只是第一次试，免费额度足够。

## 什么情况下适合升级

当你出现下面这些情况时，升级会更合理：

1. 已经开始重复出图
2. 需要更高等级模型
3. 需要更快队列
4. 需要无水印导出或正式商用

## 结论

Nano Banana Free 最适合做“快速试错 + 轻量生产”的 AI 图片工作台。只想试一下，免费层足够；已经进入稳定出图阶段，升级就更有意义。`,
  },
  {
    slug: "nano-banana-ti-shi-ci-ji-qiao",
    locale: "zh",
    title: "一个更实用的 Nano Banana 提示词结构",
    description:
      "不用写很长的提示词，也能让 Nano Banana 出图更稳定。这篇文章给你一个简单可复用的结构。",
    author_name: "Nano Banana 团队",
    created_at: new Date("2026-04-03T09:00:00Z"),
    content: `## 为什么很多图生成得不稳定

最常见的问题不是模型不行，而是提示词太空。

比起堆很多形容词，一个更有效的方法是把提示词写成明确结构：

\`主体 + 场景 + 风格 + 光线 + 用途\`

## 一个例子

不要只写：

\`banana poster\`

更好的写法是：

\`高级感香蕉吉祥物站在商品摄影棚里，干净背景，商业海报风格，柔和定向光，适合电商首屏横幅\`

## 这样写的好处

- **主体** 决定图里最重要的对象
- **场景** 决定画面发生在哪里
- **风格** 决定它偏商业、插画、复古还是写实
- **光线** 决定氛围和清晰度
- **用途** 决定构图更偏封面、海报还是横幅

## 使用建议

- 一开始先只保留一个主体
- 风格词不要堆太多
- 直接写清楚最终用途
- 每次只改一两个变量，再重新生成

## 什么时候该用参考图

如果你已经知道自己想要什么构图，参考图比单纯增加提示词更有效。它更适合“我知道方向，只想换风格”这种场景。

## 最后一句建议

真正好用的提示词不一定长，而是任务足够清楚。只要模型能听懂你想生成什么、在哪里、什么风格、拿来做什么，结果通常就会明显更稳。`,
  },
  {
    slug: "credits-ji-fei-shuo-ming",
    locale: "zh",
    title: "Nano Banana Free 的 credits 是怎么计算的",
    description:
      "这篇文章解释免费额度、付费额度、失败请求是否扣费，以及怎样判断什么时候值得购买。",
    author_name: "Nano Banana 团队",
    created_at: new Date("2026-04-04T09:00:00Z"),
    content: `## credits 本质上是什么

Nano Banana Free 用 credits 来衡量可计费使用量。不同模型、不同任务，消耗会不一样。

这种方式比强行让所有用户都进统一订阅更合理，因为很多人一开始只是想先试。

## 免费额度

新用户注册后会获得少量免费额度，核心目的是让你先体验产品，而不是先付款后判断。

## 付费额度

购买套餐后，你会获得更多 credits，同时通常还会带来更高等级模型、更快队列和更适合正式出图的权限。

## 失败请求要不要扣费

从产品逻辑上说，失败请求不应该和成功生成一样扣费。如果没有得到可用结果，就不该按正常出图去消耗。

## 怎么判断自己该不该买

你可以问自己三个问题：

1. 我是不是每周都会回来用？
2. 我是在玩一下，还是已经开始真的做素材？
3. 我是不是已经需要更强模型或更快速度？

如果答案大多是否，那先继续免费体验。如果答案大多是肯定，credits 就不再是冲动消费，而是工作流成本。`,
  },
  {
    slug: "shen-me-shi-hou-gai-sheng-ji",
    locale: "zh",
    title: "什么情况下该从免费层升级",
    description:
      "不是所有用户都应该立刻付费。这篇文章给你一个更实际的升级判断标准。",
    author_name: "Nano Banana 团队",
    created_at: new Date("2026-04-05T09:00:00Z"),
    content: `## 不要太早升级

免费层存在的意义，就是让你先判断图像质量、提示词控制和整体流程是否适合自己。

如果你还在试，那就继续试。

## 还处于试用阶段的信号

- 只生成过一两次
- 还在摸索提示词怎么写
- 还没有把结果真正用到项目里

这些情况都不急着付费。

## 进入正式使用阶段的信号

- 每隔几天就会回来出图
- 需要多张可用素材，而不只是看效果
- 开始在意更高等级模型和更快速度
- 需要更干净的导出结果

这时候升级就更合理。

## 一个简单判断标准

如果 Nano Banana Free 已经帮你完成了真实工作，那升级通常是合理的；如果它还只是一个实验，那先继续用免费层就好。`,
  },
  {
    slug: "shen-me-shi-hou-yong-can-kao-tu",
    locale: "zh",
    title: "什么时候该用参考图，而不是继续改提示词",
    description:
      "如果你总觉得提示词已经写得差不多了，但构图还是不稳定，这篇文章会更有帮助。",
    author_name: "Nano Banana 团队",
    created_at: new Date("2026-04-06T09:00:00Z"),
    content: `## 不是所有问题都该靠改提示词解决

提示词适合探索想法，但不一定适合控制构图。如果你已经很清楚自己想要什么角度、摆位和主次关系，参考图通常比继续重写提示词更有效。

## 这些情况更适合上参考图

- 构图比创意发散更重要
- 你想保留商品或主体的大致形状
- 你已经有一张方向差不多的图，只想换风格
- 提示词每次生成出来的构图都飘得很厉害

## 参考图真正能帮你稳定什么

它更擅长帮助稳定：

- 主体位置
- 镜头角度
- 大轮廓关系
- 画面层次

这样你就不用一遍一遍地“靠运气碰构图”。

## 但它也不是万能的

参考图不能代替明确的视觉方向。你还是要告诉模型你想要商业风、复古风、插画风还是更高级的广告感。

## 一个简单判断方法

如果你的问题是“我还没想清楚该做什么”，那就继续改提示词。

如果你的问题是“我已经知道想要什么，但构图总变”，那就加参考图。

## 结论

参考图最适合“我已经接近结果，只差更稳定的控制”这个阶段，而不是从零探索阶段。`,
  },
  {
    slug: "ying-xiao-su-cai-chang-jing",
    locale: "zh",
    title: "Nano Banana Free 更适合哪些营销素材场景",
    description:
      "从封面、海报到商品图，解释 Nano Banana Free 在营销素材制作里更适合承担哪一段工作。",
    author_name: "Nano Banana 团队",
    created_at: new Date("2026-04-07T09:00:00Z"),
    content: `## 更现实的定位

Nano Banana Free 最适合的不是“替代所有设计软件”，而是帮你更快完成从想法到第一版视觉草图这一步。

## 封面图

在封面场景里，它最有价值的是帮你快速测试不同视觉方向。你不需要先做完整设计，就能先判断哪种风格更值得继续做下去。

## 海报

在海报场景里，它更适合用来生成氛围、构图方向和整体视觉基调。尤其是当团队需要短时间内看多个候选方向时，这种效率优势会很明显。

## 商品图

商品图场景下，如果你已经知道商品长什么样、主图角度大概是什么，配合参考图会更好用。它更适合帮助你做“多种视觉风格测试”，而不是精细到最终修图替代。

## 在团队里怎么用

这个产品不只是给个人玩的。对小团队来说，它的价值在于减少“空谈创意”的时间。先生成几个方向，再围绕具体画面讨论，效率会高很多。

## 一个正确预期

把 Nano Banana Free 当成“想法到初稿”的加速器，会比把它当成“最终设计软件”更容易发挥价值。`,
  },
  {
    slug: "how-to-write-better-cover-prompts",
    locale: "en",
    title: "How to write better prompts for AI covers and thumbnails",
    description:
      "A practical tutorial for turning vague thumbnail ideas into clearer prompts that produce stronger cover concepts.",
    author_name: "Nano Banana Team",
    created_at: new Date("2026-04-08T09:00:00Z"),
    content: `## Why cover prompts often fail

Cover images fail for a predictable reason: the prompt describes a topic, but not a composition.

For example, a prompt like "banana marketing cover" tells the model almost nothing about hierarchy. It does not say what the main object is, whether the image should feel playful or premium, or how much empty space is needed for headline text.

That is why many first attempts look busy, muddy, or unusable in real publishing.

## A better prompt structure for covers

For covers and thumbnails, use this structure:

\`main subject + visual mood + composition + background simplicity + publishing purpose\`

Example:

\`a confident banana mascot holding a product tag, bright editorial style, centered composition with clear empty space above, soft clean background, designed for a social media cover\`

This works better because it gives the model a layout job, not just a theme.

## What to specify every time

If the image is meant to become a cover, mention these details whenever possible:

- what the viewer should notice first
- whether the background should stay simple
- whether the subject should be centered, close-up, or off to one side
- whether the final image needs space for text
- whether the tone should feel commercial, playful, cinematic, or minimal

Most weak thumbnails come from missing one of those choices.

## A simple workflow that saves time

Use this sequence instead of rewriting from zero:

1. write one short prompt with a single clear subject
2. decide whether the problem is style, composition, or clutter
3. change only one variable on the next prompt
4. save the best direction and only then try more detailed variations

This keeps your iteration path understandable. Without that discipline, many prompt sessions become random.

## Common mistakes

Avoid these habits:

- asking for too many objects in one cover
- mixing premium, cute, realistic, retro, cinematic, and minimalist in the same line
- forgetting to mention text space
- trying to solve a composition problem with more adjectives

If the image is crowded, the solution is usually fewer instructions, not more.

## When to switch to a reference image

If the model understands the mood but keeps changing the framing, stop rewriting the prompt and use a reference image. Covers often depend on stable placement, and reference images help more than prompt length once layout becomes the main issue.

## Final takeaway

A strong cover prompt is not a long description. It is a clear instruction about focus, mood, and composition. When you treat the prompt as a layout brief rather than a word dump, the output improves much faster.`,
  },
  {
    slug: "common-ai-image-mistakes-and-fixes",
    locale: "en",
    title: "Common AI image mistakes and how to fix them faster",
    description:
      "A practical troubleshooting guide for crowded compositions, weak subjects, unstable styles, and other common AI image problems.",
    author_name: "Nano Banana Team",
    created_at: new Date("2026-04-09T09:00:00Z"),
    content: `## Most bad outputs are fixable

When an AI image looks wrong, users often assume the model is weak. In practice, the output usually failed for one of a few common reasons: unclear subject priority, conflicting style words, unstable composition, or a mismatch between prompt and use case.

The useful question is not "why is this model bad?" but "what exactly went wrong in this instruction?"

## Problem 1: the image feels crowded

This usually happens when the prompt asks for too many ideas at once.

Fix:

- reduce the number of important objects
- choose one clear subject
- simplify the background
- remove decorative words that do not change the core image

If every part of the image is trying to be important, nothing feels important.

## Problem 2: the subject is not clear

Sometimes the image is visually polished but emotionally weak because the viewer cannot tell what the main subject is.

Fix:

- name the main subject earlier in the prompt
- specify close-up, centered, or hero composition
- reduce side objects and scene noise

The earlier and clearer the subject appears in the prompt, the more stable the output usually becomes.

## Problem 3: the style is inconsistent

This happens when prompts combine too many competing aesthetics, such as premium + cartoon + retro + cinematic + minimalist.

Fix:

- keep one primary style
- keep one secondary modifier at most
- stop stacking trend words without purpose

A clear style direction almost always beats a fashionable but chaotic prompt.

## Problem 4: the composition keeps drifting

If the subject keeps moving around or the framing changes too much between generations, the problem is often structural rather than descriptive.

Fix:

- mention composition directly
- ask for centered, top-down, close-up, or side-view framing
- use a reference image if the layout matters a lot

This is the point where many users waste time making the text prompt longer when what they really need is a visual anchor.

## Problem 5: the image looks nice but is unusable

This is common in marketing work. The output can be attractive but still fail because there is no space for copy, the crop is awkward, or the tone does not fit the audience.

Fix:

- mention the final use case
- specify banner, cover, poster, or product visual
- ask for text-safe space when needed
- evaluate the image in the context of the final destination

An image is only successful if it works where it will be used.

## A fast troubleshooting checklist

Before generating again, ask:

1. is the main subject obvious?
2. am I mixing too many style directions?
3. is the layout issue better solved by a reference image?
4. did I mention the final use case clearly?

That checklist is often enough to fix the next generation.

## Final takeaway

Better AI image work comes from diagnosis, not random retries. If you can name the specific failure mode, the next prompt becomes much easier to improve.`,
  },
  {
    slug: "batch-visual-ideas-without-losing-consistency",
    locale: "en",
    title: "How to generate multiple visual directions without losing consistency",
    description:
      "A workflow for exploring several image directions while keeping subject identity, tone, and composition under control.",
    author_name: "Nano Banana Team",
    created_at: new Date("2026-04-10T09:00:00Z"),
    content: `## The real challenge is controlled variation

Generating one interesting image is not the hard part. The harder problem is creating several usable directions without making them feel unrelated.

This matters when you need options for a campaign, cover set, or product concept review. Random variety is easy. Controlled variety is the useful skill.

## Start with one stable base direction

Before making variants, first produce one image that gets three things mostly right:

- the subject
- the visual tone
- the composition

Do not branch too early. If the base is unstable, every variation becomes noise.

## Decide what is allowed to change

Most batch generation becomes messy because everything changes at once. Instead, choose one category at a time:

- only change background mood
- only change color treatment
- only change camera distance
- only change styling details

This creates a set of outputs that are easier to compare.

## Keep a short “constant block” in your prompt

Use one short section that stays fixed across iterations. For example:

\`same banana mascot, same centered composition, same clean commercial framing\`

Then append one variable section:

\`variant 1: warm retail lighting\`
\`variant 2: minimal monochrome backdrop\`
\`variant 3: playful studio props\`

This technique helps preserve the identity of the series.

## Use naming rules while iterating

Even if you are working alone, label your iterations by intent:

- composition variant
- color variant
- mood variant
- publishing variant

That makes it much easier to decide later which path produced the strongest direction.

## When to stop generating new variants

Stop once the variants stop teaching you something new. More outputs do not always mean better decisions. After a few strong candidates, the next useful step is comparison, not endless generation.

## A practical review method

When comparing several images, score each one on:

1. subject clarity
2. composition usefulness
3. fit for the final channel
4. distinctiveness

This makes the process more objective and prevents teams from choosing only based on novelty.

## Final takeaway

Good batch generation is not about maximum randomness. It is about structured variation. If one thing stays stable and one thing changes at a time, your options become easier to compare and more useful in real work.`,
  },
  {
    slug: "how-to-evaluate-ai-images-before-publishing",
    locale: "en",
    title: "How to evaluate AI images before you publish them",
    description:
      "A practical review checklist for deciding whether an AI image is ready for a cover, post, banner, or product-facing asset.",
    author_name: "Nano Banana Team",
    created_at: new Date("2026-04-11T09:00:00Z"),
    content: `## Generation is only half the job

Many people evaluate AI images too early by asking, "does this look cool?" That is not enough. A publishable image needs to survive a more practical test: does it work in the exact place where it will be used?

An image that feels exciting in isolation can still fail as a cover, a banner, or a product visual.

## Check 1: subject clarity

Can a viewer understand the main subject quickly?

If the answer is no, the image is probably not ready. Covers and promotional assets need fast readability. The eye should know where to land within a second.

## Check 2: composition fit

Look at the intended format:

- thumbnail
- social cover
- poster
- product banner

Then ask whether the current framing actually fits that format. A beautiful image can still fail if the crop becomes awkward, the focal point sits in the wrong place, or there is no room for copy.

## Check 3: visual noise

AI outputs often look rich but overloaded. Extra details, props, textures, and effects can reduce usefulness.

Ask:

- is the background helping or distracting?
- are there too many competing highlights?
- does the scene feel simpler or messier than the intended message?

Clean images usually perform better than merely busy ones.

## Check 4: style consistency

If the image will sit next to other assets, does it belong to the same world?

This matters in campaigns, carousel posts, and product sets. Even strong standalone images lose value if they feel disconnected from the rest of the visual system.

## Check 5: trust and polish

For customer-facing work, inspect:

- object shape accuracy
- text-safe areas
- unrealistic distortions
- strange details that break trust

The more commercial the context, the less tolerance you have for weird details.

## A simple publish / revise / reject rule

- **publish** if the image fits the use case with only minor downstream edits
- **revise** if the core idea works but composition, clutter, or style still need tuning
- **reject** if the image looks attractive but solves the wrong problem

This rule prevents teams from keeping images just because they were expensive to generate.

## Final takeaway

The right test is not "is this impressive?" It is "is this useful in context?" That shift leads to better decisions and stronger publishing outcomes.`,
  },
  {
    slug: "feng-mian-tu-ti-shi-ci-xie-fa",
    locale: "zh",
    title: "封面图和缩略图提示词到底该怎么写",
    description:
      "这是一篇更实操的封面提示词教程，重点不是堆词，而是让画面更适合真实发布场景。",
    author_name: "Nano Banana 团队",
    created_at: new Date("2026-04-08T09:00:00Z"),
    content: `## 为什么很多封面图不好用

很多提示词只描述了主题，却没有描述构图。

比如“banana marketing cover”这种写法，模型知道你想做营销封面，但不知道主体是谁、画面重点在哪、背景要不要干净、有没有给标题留空间。

结果通常就是：图不一定丑，但不适合真正拿去发。

## 更适合封面的提示词结构

做封面图和缩略图时，可以优先用这个结构：

\`主主体 + 氛围 + 构图 + 背景复杂度 + 发布用途\`

例如：

\`一只自信的香蕉吉祥物站在画面中心，明亮编辑风，中心构图，上方留出标题空间，背景干净，适合社媒封面图\`

这样写的好处是，模型接收到的是“版面任务”，而不是一个模糊主题。

## 每次最好明确写清楚的东西

如果目标是封面，建议至少写清楚这些点：

- 第一眼应该看到谁
- 背景要复杂还是简单
- 主体是近景、居中还是偏一侧
- 是否需要留标题区
- 整体是高级感、活泼感、商业感还是电影感

很多不好用的封面图，本质上就是这些问题没提前定义。

## 一个更省时间的流程

不要每次都从零重写。更稳的方式是：

1. 先写一个只有单一主体的基础提示词
2. 先判断问题是风格、构图还是杂乱
3. 下一轮只改一个变量
4. 找到方向后，再继续细化

这样你能知道是哪一步起作用，而不是一直盲试。

## 最常见的错误

这些问题很常见：

- 一个封面里塞太多对象
- 同时想要高级、可爱、复古、电影感、极简
- 忘记给文字留空间
- 构图不稳时还在继续加形容词

如果画面已经很乱，通常该做的是减法，而不是再加词。

## 什么时候该上参考图

如果你已经知道自己想要什么版式，但模型每次都把主体放到不同位置，这时就别一直改提示词了，直接加参考图更有效。

封面图很依赖稳定布局，而参考图在这方面通常比继续加字更有用。

## 最后的建议

好用的封面提示词，不是写得长，而是让模型清楚谁是重点、画面应该怎么安排、最后要用在哪里。只要你把这三件事说清楚，结果通常会明显更稳。`,
  },
  {
    slug: "ai-sheng-tu-chang-jian-wen-ti-pai-cha",
    locale: "zh",
    title: "AI 生图常见问题怎么排查会更快",
    description:
      "这篇文章专门讲画面拥挤、主体不清楚、风格不稳、构图飘等常见问题该怎么判断和修正。",
    author_name: "Nano Banana 团队",
    created_at: new Date("2026-04-09T09:00:00Z"),
    content: `## 很多失败并不是模型太差

AI 图生成得不好，很多时候不是模型本身不行，而是输入任务不够清楚。

最常见的失败原因就几种：主体不明确、风格词互相冲突、构图不稳定、以及提示词和真实用途不匹配。

真正有用的问题不是“模型怎么这么差”，而是“这次到底是哪一步说得不清楚”。

## 问题一：画面很挤

这通常说明你一次想让模型做太多事情。

解决方法：

- 减少重要对象数量
- 先只保留一个核心主体
- 让背景更简单
- 删掉对画面没有真正帮助的形容词

如果每个元素都在抢注意力，最后就没有重点。

## 问题二：主体不明显

有些图看起来不难看，但第一眼看不出主角是谁，所以不适合做封面、banner 或商品图。

解决方法：

- 把主体更早写进提示词
- 明确要求近景、居中或 hero 构图
- 减少陪衬元素

主体越明确，结果通常越稳。

## 问题三：风格很乱

这通常是因为提示词把太多审美方向塞在一起，比如高级、卡通、复古、电影感、极简一起写。

解决方法：

- 先保留一个主风格
- 最多再加一个辅助风格词
- 不要为了“显得专业”而堆很多趋势词

清晰的风格方向，几乎总比混乱的时髦词更有效。

## 问题四：构图总在飘

如果每次生成主体位置都变、镜头关系都变，那通常已经不是文字描述问题，而是结构控制问题。

解决方法：

- 直接写清楚构图
- 明确俯拍、近景、居中、侧视等镜头关系
- 如果布局很关键，就直接加参考图

很多人会在这里继续无意义地加文字，但真正有效的往往是视觉锚点。

## 问题五：图挺好看，但用不了

这在营销素材里非常常见。图可能挺吸引人，但没有标题空间、裁切不友好、或者整体调性不适合真实投放。

解决方法：

- 直接写明最终用途
- 明确是封面、海报、横幅还是商品图
- 需要文字区就提前说明
- 按最终发布场景判断图，而不是只看单张效果

真正有效的图，一定是“能用”的图。

## 一个更快的排查清单

下一次重新生成前，先问自己：

1. 主体够不够明确？
2. 风格是不是写得太杂？
3. 这是不是其实应该用参考图？
4. 我有没有写清楚最终用途？

这个清单通常就能帮你少走很多弯路。

## 结论

提高 AI 生图质量，关键不在于盲目多试几次，而在于先判断这次到底失败在哪。只要问题被说清楚，下一轮修改通常就会快很多。`,
  },
  {
    slug: "pi-liang-chu-tu-zen-yang-bao-chi-yi-zhi",
    locale: "zh",
    title: "批量出图时，怎样保持一组图的风格一致",
    description:
      "想做一组封面、海报或素材时，最难的是既有变化又不乱。这篇文章讲具体做法。",
    author_name: "Nano Banana 团队",
    created_at: new Date("2026-04-10T09:00:00Z"),
    content: `## 真正难的不是出一张图

出一张有意思的图不算太难，更难的是连续做出几张方向不同、但又明显属于同一组的图。

这在营销素材、系列封面、活动图里特别常见。随机关联很容易，受控变化才真正有价值。

## 先做出一个稳定底图

在批量出变体之前，先确保你有一张基础方向已经比较稳定的图，至少这三件事是对的：

- 主体对
- 气质对
- 构图大致对

如果基础图还不稳，就不要太早分叉，不然后面的变体只会越来越乱。

## 先规定什么不能变

批量出图最容易失控的原因，就是所有东西都在一起变。

更好的做法是每次只开放一种变化：

- 只改背景氛围
- 只改颜色处理
- 只改镜头远近
- 只改装饰元素

这样你最后得到的是“可比较的方案”，而不是一堆随机图。

## 给提示词保留一个固定区块

可以把一部分始终不变的描述固定下来，比如：

\`同一个香蕉吉祥物、同样的中心构图、同样的干净商业画面\`

然后每轮只改变量：

- 版本 A：暖色零售灯光
- 版本 B：极简单色背景
- 版本 C：更活泼的摄影棚道具

这样更容易保持一组图的统一性。

## 迭代时最好自己命名

哪怕是自己一个人做，也建议按意图命名：

- 构图版
- 色调版
- 氛围版
- 发布场景版

这样后面回看时，你会更容易知道哪条路径更值得继续。

## 什么时候该停

当新的变体已经不能提供新的判断信息时，就该停了。生成更多不一定带来更好决策，很多时候反而会让选择变得混乱。

## 一个更实用的筛选标准

可以直接从这四个维度打分：

1. 主体清晰度
2. 构图可用性
3. 与最终发布场景的匹配度
4. 视觉辨识度

这会比只凭“哪张更酷”来选更稳。

## 结论

好的批量出图，不是让模型无限随机，而是让“固定部分稳定、变化部分受控”。只要每次只改一个变量，一组素材就会更容易保持一致。`,
  },
  {
    slug: "fa-bu-qian-zen-yang-pan-duan-tu-neng-bu-neng-yong",
    locale: "zh",
    title: "发布前，怎么判断一张 AI 图到底能不能用",
    description:
      "这篇文章不是教你再生成一张，而是教你怎么判断当前这张图适不适合真正发布。",
    author_name: "Nano Banana 团队",
    created_at: new Date("2026-04-11T09:00:00Z"),
    content: `## 生成出来不等于能发布

很多人看 AI 图时只会问一句：“好不好看？”

但真正应该问的是：它能不能在真实场景里工作？

一张图单独看可能很吸引人，但放到封面、海报、banner 或商品页里，未必真的能用。

## 检查一：主体清不清楚

用户第一眼能不能迅速看懂重点？

如果不能，那这张图大概率还不适合发布。尤其是封面图、推广图这类场景，主体识别必须很快。

## 检查二：构图适不适合最终尺寸

你要先看它最终会被放在哪里：

- 缩略图
- 社媒封面
- 海报
- 商品横幅

然后再判断现在这张图的取景是不是适合那个版式。很多图单看没问题，但一到实际裁切就不行了。

## 检查三：有没有多余噪音

AI 图很容易“看起来丰富，但实际上太乱”。

你要问自己：

- 背景是在帮画面，还是在抢戏？
- 有没有太多高亮和细节在分散注意力？
- 这张图是更清晰了，还是更复杂了？

很多时候，干净比热闹更有用。

## 检查四：风格是不是和其他素材一致

如果这张图不是单独存在，而是要和一组内容一起发，那它就不能只看单张好不好看，还要看它是不是属于同一个视觉体系。

这一点在系列封面、活动页、社媒矩阵里尤其重要。

## 检查五：有没有会破坏信任的细节

如果是面向真实用户的素材，还要特别留意：

- 形体是否怪异
- 有没有奇怪的小细节
- 商品或主体是否失真
- 有没有影响标题摆放的区域

越接近商业投放场景，对这些问题的容忍度越低。

## 一个更实用的判断规则

- **可发布**：只需要少量后期就能用
- **可修改**：核心方向对，但构图、杂乱度或风格还要再调
- **直接放弃**：虽然好看，但根本没解决真实用途的问题

这样比单纯因为“它生成得很辛苦”而舍不得放弃更健康。

## 结论

判断一张 AI 图值不值得用，核心不是“它惊不惊艳”，而是“它在真实场景里是否有效”。只要把评估标准从审美转成用途，决策会清晰很多。`,
  },
];

async function upsertSeedPost(post: SeedPost) {
  const existing = await findPostBySlug(post.slug, post.locale);
  const basePayload = {
    title: post.title,
    slug: post.slug,
    locale: post.locale,
    status: PostStatus.Online,
    description: post.description,
    cover_url: commonCover,
    author_name: post.author_name,
    author_avatar_url: "",
    content: post.content,
  };

  if (existing?.uuid) {
    const hasChanged =
      existing.title !== basePayload.title ||
      existing.slug !== basePayload.slug ||
      existing.locale !== basePayload.locale ||
      existing.status !== basePayload.status ||
      existing.description !== basePayload.description ||
      existing.cover_url !== basePayload.cover_url ||
      existing.author_name !== basePayload.author_name ||
      (existing.author_avatar_url || "") !== basePayload.author_avatar_url ||
      (existing.content || "") !== basePayload.content;

    if (!hasChanged) {
      return `unchanged ${post.locale}/${post.slug}`;
    }

    await updatePost(existing.uuid, {
      ...basePayload,
      updated_at: new Date(),
    });
    return `updated ${post.locale}/${post.slug}`;
  }

  await insertPost({
    uuid: getUuid(),
    created_at: post.created_at,
    ...basePayload,
    updated_at: new Date(),
  });
  return `inserted ${post.locale}/${post.slug}`;
}

async function main() {
  for (const post of posts) {
    const result = await upsertSeedPost(post);
    console.log(result);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
