---
title: "《跟鬼哥玩转 Claude Code》第四章：实战工作流"
author: 鬼哥
coverImage: "/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-4/4.1-explore-codebase.png"
---

> 📖 **跟鬼哥玩转 Claude Code**

# 第四章：实战工作流

# 4.1 探索陌生代码库

![4.1 探索陌生代码库](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-4/4.1-explore-codebase.png)


## 接手别人的代码，是一种什么体验

每个开发者都经历过这个场景：

打开一个从没见过的代码库，里面有几百个文件，没有文档，上一个维护者已经离职，你需要在三天内搞清楚它是怎么工作的，然后修一个 bug。

以前这叫"痛苦"。有了 Claude Code，这叫"一个下午的事"。

---

## 探索的正确姿势：从宏观到微观

不要一上来就问某个具体文件是干什么的——先建立全局认知，再往下钻。

**第一层：整体概览**

```
give me an overview of this codebase — what does it do,
what's the tech stack, and how is it structured?
```

```
explain the main architecture patterns used in this project
```

Claude Code 会读取 `README`、`package.json`、目录结构，给你一个整体描述。这一步建立的是"地图"。

**第二层：找关键路径**

```
where is the main entry point? trace the request flow
from the entry point through the key modules
```

```
what are the core data models? show me how they relate to each other
```

```
how is authentication handled? which files are involved?
```

这一步找的是"主干道"——最重要的几条执行路径。

**第三层：深入具体模块**

```
explain how the payment module works in detail.
walk me through the code flow when a user makes a purchase
```

```
what does src/services/UserService.ts do?
are there any parts that look risky or poorly implemented?
```

这一步才到具体文件和函数。

---

## 接手项目的标准 prompt 清单

以下是一套可以直接用的 prompt，按顺序执行，基本能覆盖一个项目的核心认知：

```
# 1. 整体认知
what does this project do? summarize in 3-5 sentences

# 2. 技术栈
what technologies, frameworks, and libraries does this project use?

# 3. 目录结构
explain the folder structure. what is each main directory responsible for?

# 4. 如何运行
how do I run this project locally? what are the setup steps?

# 5. 如何测试
what testing framework is used? how do I run the tests?
are there any known flaky tests I should be aware of?

# 6. 找到核心
what are the most important files in this codebase?
which files would I need to understand first?

# 7. 找隐患
looking at the codebase, what areas seem most risky or brittle?
what would you flag for a new developer joining this project?
```

最后一个 prompt 特别有价值——让它从"新人视角"扫一遍，往往能发现一些老代码库里埋藏多年的地雷。

---

## 用 `@` 引用特定文件

探索过程中，如果你想让它专注于某个特定文件：

```
look at @src/core/Engine.ts and explain what it does.
why does it use this pattern instead of a simpler approach?
```

```
compare @src/auth/JWTStrategy.ts and @src/auth/OAuthStrategy.ts.
what are the key differences?
```

`@` 引用会让 Claude Code 优先读取这些文件，而不是让它自己决定从哪里开始。

---

## 探索完之后做什么

探索阶段结束后，有两件事值得做：

**1. 让它帮你生成 CLAUDE.md**

如果这个项目还没有 CLAUDE.md，或者现有的 CLAUDE.md 不完整，在你理解了项目之后让它生成：

```
based on what you've learned about this project,
generate a CLAUDE.md that would help future developers
(including yourself in a new session) get up to speed quickly.
include build commands, key architectural decisions, and gotchas.
```

**2. 用 `/clear` 重置上下文**

探索阶段会产生大量上下文（读了很多文件），但这些文件的原始内容在接下来的任务里不一定用得上。探索完之后 `/clear`，保留你从 CLAUDE.md 里能恢复的基础背景，开始正式的开发任务。

---

# 4.2 修复 Bug

![4.2 修复 Bug](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-4/4.2-fix-bugs.png)


## 修 bug 是 Claude Code 最擅长的事之一

原因很简单：修 bug 是一个有明确输入（报错/问题描述）、明确输出（测试通过）的任务，非常适合 Agentic Loop 的工作方式。

但效果好不好，很大程度上取决于**你给它的上下文够不够**。

---

## 情况一：有明确报错信息

这是最理想的情况。直接把报错信息粘进去：

```
I'm getting this error when I run the test suite:

TypeError: Cannot read properties of undefined (reading 'id')
    at UserService.getProfile (src/services/UserService.ts:47:23)
    at async ProfileController.show (src/controllers/ProfileController.ts:23:18)

the error happens when fetching a profile for a user who has
never logged in before. fix it and verify the fix with tests.
```

注意 prompt 里做了几件事：
1. **粘贴了完整的报错和调用栈**——让它知道错误在哪里
2. **描述了复现条件**——"从未登录过的用户"
3. **明确了验收标准**——"用测试验证"

Claude Code 会根据调用栈找到 `UserService.ts` 第 47 行，读取前后逻辑，判断为什么 `user` 可能是 `undefined`，修复，然后跑测试确认。

---

## 情况二：没有报错，只有"行为不对"

这类 bug 更难描述，需要你说清楚"期望行为"和"实际行为"：

```
there's a bug in the shopping cart: when a user adds the same item
twice, the quantity should increase by 1, but instead a duplicate
item is added.

expected: cart shows item with quantity 2
actual: cart shows two separate items with quantity 1 each

the relevant code is probably in src/store/cartSlice.ts.
reproduce the issue, find the root cause, and fix it.
```

关键结构：
- **是什么行为**（adding the same item twice）
- **期望什么结果**（quantity increases）
- **实际得到什么**（duplicate items）
- **可能在哪里**（给它一个方向，不是必须的但能省时间）
- **要求它自己复现**（不只是猜，要找到根因）

---

## 真实演示：在 express 项目里修一个 bug

我们继续用 express 仓库来演示。假设我们发现一个问题：路由匹配对于带有多余斜杠的路径行为不一致。

```
I noticed that Express routes behave inconsistently with trailing slashes.
For example, a route defined as /users/:id matches /users/123 but not
/users/123/.

look at the router implementation in lib/router/ and check if this
is expected behavior or a bug. if it's a bug, propose a fix.
if it's by design, explain why.
```

这个 prompt 的好处是它没有假设"一定是 bug"——让 Claude Code 先判断，再决定怎么处理。有时候"行为不符合你的预期"其实是 by design，强行改反而会破坏其他东西。

---

## 修完了，你要做的事

Claude Code 修完 bug 之后，**不要无脑点 Accept**。

你需要：

**1. 看 diff，理解它改了什么**

```
explain the changes you made and why this fixes the issue.
are there any edge cases this fix might not handle?
```

**2. 确认测试真的覆盖了这个 bug**

```
does the test you wrote actually reproduce the original bug before the fix?
run the test against the unfixed version to confirm it fails,
then verify it passes after the fix.
```

这个验证步骤很重要——AI 有时候会写一个"通过但没有真正测试这个 bug"的测试。

**3. 想想有没有相关的隐患**

```
are there similar patterns elsewhere in the codebase that might
have the same bug? do a quick scan.
```

---

## 一条反直觉的建议

遇到 bug 的时候，很多人的第一反应是：直接告诉 Claude Code "帮我修这个 bug"。

但有时候更好的做法是先问：

```
before fixing anything, analyze this bug:
what is the root cause? what are my options for fixing it?
what are the tradeoffs of each approach?
```

让它先分析，再动手——尤其是在复杂系统里，第一个想到的修法往往不是最好的修法。

---

## 常见 bug 场景的 prompt 模板

**异步/Promise 问题：**
```
I'm getting an unhandled promise rejection in production logs:
[paste error]
the code is in [file path]. trace the async flow and fix the issue.
make sure error handling is added at the right level.
```

**性能问题：**
```
this API endpoint is taking 3+ seconds to respond.
the endpoint is in [file path].
profile it, identify the bottleneck, and suggest optimizations.
don't change behavior, only improve performance.
```

**类型错误（TypeScript）：**
```
TypeScript is throwing this error: [paste error]
I don't want to just suppress it with 'as any' or '@ts-ignore'.
find the real cause and fix the types properly.
```

---

# 4.3 代码重构

![4.3 代码重构](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-4/4.3-refactoring.png)


## 重构是危险的——如果你没有计划

重构的本质是"改变结构，不改变行为"。听起来很合理，但实际操作中极容易出现"改了结构，也顺便改了行为，还不知道"的情况。

Claude Code 在重构上能提供很大帮助，但有一个原则必须先说清楚：

**重构之前，先规划。永远先规划。**

---

## 重构的黄金三步

### 第一步：探索现状（Plan Mode）

进入 Plan Mode，让 Claude Code 先读懂要重构的部分，不做任何改动：

```
enter plan mode. analyze the authentication module in src/auth/.
I want to understand:
1. what is the current structure?
2. what are the dependencies — what does this module depend on,
   and what depends on it?
3. what would break if I change the interface?
```

这一步的目标是建立"改之前的全貌"。很多重构失败是因为改的时候才发现有个东西依赖了你以为没人用的接口。

### 第二步：制定计划

还在 Plan Mode 里，让它制定重构方案：

```
I want to refactor src/auth/ to separate the JWT logic from the
OAuth logic into distinct strategy classes using the Strategy pattern.

create a detailed migration plan:
- what new files need to be created?
- what existing files need to change?
- what is the safest order to make these changes?
- are there any breaking changes for callers of this module?
```

拿到计划之后，**按 `Ctrl+G` 在编辑器里打开，仔细看**。

这是一个被严重低估的功能——你可以直接在编辑器里修改这份计划：删掉你不认可的步骤，加上约束条件，注明某个地方要特别小心。Claude Code 执行的时候会尊重你的修改。

### 第三步：分批执行

计划确认后，退出 Plan Mode，**分批执行**，不要一次性让它把所有改动都做完：

```
start with step 1 of the plan: create the base AuthStrategy interface
and the JWTStrategy class. don't touch any existing files yet.
run the tests after each new file is added to make sure nothing breaks.
```

每一批做完，跑测试，确认没问题，再继续下一批。

---

## 为什么要分批，不要一次性完成

一次性大重构的问题：

- 如果测试失败了，你不知道是哪一步引入的问题
- diff 太大，review 起来很痛苦
- 一旦出问题，回滚代价很高

分批执行的好处：

- 每批的 diff 小，出问题立刻能定位
- 每批都跑测试，问题在最小范围内暴露
- 任何时候都可以停下来，已完成的部分不受影响

---

## 测试先行：重构的安全网

在开始重构之前，先确认测试覆盖到位：

```
before we start refactoring, check the test coverage for src/auth/.
what scenarios are not covered by existing tests?
add the missing tests first, so we have a safety net during refactoring.
```

没有测试的重构就是在走钢丝。Claude Code 可以帮你补测试，但这件事要在重构之前做，不是之后。

---

## 现代化老代码的 prompt 模板

**升级异步风格（callback → async/await）：**
```
refactor src/utils/fileHelper.js to replace all callback-style
async code with async/await. maintain the same external API.
run the existing tests after each function is refactored
to confirm behavior is unchanged.
```

**拆分过大的文件：**
```
UserController.ts is 800 lines and handles too many concerns.
analyze it and propose how to split it into smaller,
more focused controllers. don't change any logic, just restructure.
```

**消除重复代码：**
```
find duplicated logic across the service files in src/services/.
identify the top 3 most duplicated patterns and propose
how to extract them into shared utilities. show me the plan first.
```

**引入 TypeScript 严格模式：**
```
I want to enable strict mode in TypeScript for this project.
first, run tsc --strict in dry-run mode and show me all the errors.
then fix them one file at a time, starting with the most critical ones.
don't use 'any' as a shortcut — fix the actual type issues.
```

---

## 一个容易踩的坑

你告诉 Claude Code "重构这个模块"，它可能会在重构的过程中顺便"改进"一些它觉得不好的地方——改一个算法、优化一个逻辑、重命名一个变量。

这些改动可能是好的，但它们不是你要求的，也没有被测试覆盖。

**防止这个情况的 prompt 写法：**

```
refactor the structure only. do not change any logic, algorithms,
or behavior. if you see something that could be improved separately,
note it in a comment but don't change it.
```

把边界说清楚，它就不会越界。

---

# 4.4 编写测试

![4.4 编写测试](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-4/4.4-writing-tests.png)


## 写测试是最适合外包给 AI 的工作之一

写测试这件事有个有趣的特点：**你知道它该怎么做，但就是不想做。**

不是不会写，就是枯燥——大量的 `expect(xxx).toBe(yyy)`，大量的 mock，大量的重复结构……每次都要从头写，费时费力，而且容易漏。

这种"正确但无聊"的工作，正是 Claude Code 最擅长的。

---

## 第一步：找出没被测到的地方

别猜，让它扫：

```
analyze the test coverage for src/services/OrderService.ts.
which functions and branches are not covered by existing tests?
list them with a brief explanation of what each untested scenario does.
```

或者范围更大的：

```
scan the entire src/services/ directory.
identify the top 5 functions or modules with the lowest test coverage
or no tests at all. prioritize by business criticality.
```

拿到清单之后，你来决定先补哪些——业务核心逻辑优先，工具函数次之。

---

## 第二步：生成测试

```
write comprehensive tests for the checkout flow in
src/services/CheckoutService.ts.

cover:
- happy path: successful checkout
- payment failure: what happens when the payment gateway returns an error
- inventory check: what happens when an item goes out of stock during checkout
- discount code: valid codes, expired codes, already-used codes

use the existing test style in src/services/__tests__/
as a reference for structure and conventions.
```

注意最后一行：**让它参考现有的测试风格**。这样生成的测试在命名方式、mock 风格、断言写法上会和你的项目保持一致，不会突然出现一种全新的风格。

---

## 第三步：专门找 Edge Case

生成完基础测试之后，让它再想想边界条件：

```
for the tests you just wrote, what edge cases did you miss?
think about:
- null and undefined inputs
- empty arrays and strings
- extreme numeric values (0, negative numbers, very large numbers)
- concurrent calls (race conditions)
- what happens right at the boundary of a validation rule

add tests for the most important missing edge cases.
```

这一步往往能挖出真正有价值的测试——不是"系统正常工作时的验证"，而是"系统在压力下还对不对"。

---

## 第四步：审查生成的测试

生成的测试不能无脑接受，要检查几件事：

**它真的测试了行为，而不只是实现？**

差的测试：
```typescript
// 只测了内部实现细节
expect(service.internalCache).toHaveLength(1)
```

好的测试：
```typescript
// 测试了外部可观测的行为
const result = await service.getUser(id)
expect(result.name).toBe('Alice')
```

如果测试和内部实现高度耦合，一次重构就会让所有测试红掉，测试本身成了负担。

**Mock 的位置对不对？**

```
review the tests you wrote.
are there any cases where you're mocking too much?
mocking internal implementation details makes tests brittle.
focus mocks on external dependencies (database, API calls, file system).
```

**测试能真正发现 bug 吗？**

```
for the test cases you wrote, if I introduced a bug in the function
(for example, reversed the conditional logic), would the tests catch it?
identify any tests that are "always green" regardless of the implementation.
```

---

## 把测试约定写进 CLAUDE.md

如果你的项目有特定的测试约定，写进 CLAUDE.md，避免每次都要重新说：

```markdown
## 测试规范

- 测试框架：Vitest
- 单个测试文件：`npx vitest run path/to/test.ts`
- 命名规范：`describe('FunctionName')` + `it('should [behavior] when [condition]')`
- Mock 原则：只 mock 外部依赖（数据库、第三方 API），不 mock 内部模块
- 测试文件位置：和源文件同目录，命名 `xxx.test.ts`
```

---

## 快速补测试的完整流程

```
# 1. 找出测试缺口
find untested functions in src/services/PaymentService.ts

# 2. 生成测试骨架
write test cases for the processPayment function.
follow the test style in src/services/__tests__/UserService.test.ts

# 3. 运行确认
run the new tests and fix any failures

# 4. 找边界条件
what edge cases are missing from the tests you wrote?
add the 3 most important ones.

# 5. 检查测试质量
would these tests catch a bug if I accidentally swapped
the success and failure response handling?
```

把这个流程走一遍，一个函数的测试覆盖基本就齐了。

---

# 4.5 Plan Mode 深度指南

![4.5 Plan Mode 深度指南](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-4/4.5-plan-mode.png)


## 先想清楚，再动手

Plan Mode 是 Claude Code 里最容易被忽视的功能之一——很多人装了很久都不知道它的存在。

但一旦你用过，你会发现它对复杂任务来说几乎是必须的。

---

## Plan Mode 是什么

Plan Mode 下，Claude Code 进入**只读状态**：

- ✅ 可以读取文件、搜索代码、分析结构
- ✅ 可以回答问题、提出建议、制定计划
- ❌ 不能修改任何文件
- ❌ 不能运行任何命令

你可以把它理解为"先开会讨论方案，再开始施工"。

---

## 三种开启方式

**方式一：启动时进入**

```bash
claude --permission-mode plan
```

**方式二：会话中切换**

在会话里按 `Shift+Tab`，会在三种模式之间循环：
```
普通模式 → 自动接受模式 → Plan Mode → 普通模式
```

底部状态栏会显示当前模式：
- 普通模式：无特殊标识
- 自动接受：`⏵⏵ accept edits on`
- Plan Mode：`⏸ plan mode on`

**方式三：设为默认**

在 `.claude/settings.json` 里设置：

```json
{
  "permissions": {
    "defaultMode": "plan"
  }
}
```

适合谨慎的场景，比如在生产代码库里工作，每次任务都先强制规划。

---

## Plan Mode 的三个核心使用场景

### 场景一：复杂任务前规划

任何需要改动 3 个以上文件的任务，都建议先进 Plan Mode：

```
I need to add rate limiting to all API endpoints.
analyze the current routing structure and create a plan:
- which files need to change?
- where should the rate limiting middleware be added?
- how should different endpoints have different limits?
- what's the safest order to make these changes?
```

拿到计划之后，你来决定是否认可，再切回普通模式执行。

### 场景二：探索陌生代码库

Plan Mode 是安全的探索模式——它只读不写，特别适合刚接手项目的时候：

```
explore the entire codebase. understand the architecture,
find the key modules, and identify any potential issues.
don't make any changes — just report what you find.
```

用 Plan Mode 探索，不用担心它"手滑"改了什么。

### 场景三：代码审查（不改动，只分析）

```
review the recent changes in git (last 5 commits).
analyze for: code quality issues, potential bugs, security concerns,
and missing test coverage. give me a detailed report.
do not make any changes.
```

---

## `Ctrl+G`：在编辑器里编辑计划

这是 Plan Mode 里最强大、也最少人知道的功能。

当 Claude Code 生成了一份计划，你在 Plan Mode 下按 `Ctrl+G`，这份计划会在你的默认编辑器（VS Code、vim、nano……）里打开，你可以**直接编辑它**。

你可以做的事：
- 删掉你不认可的步骤
- 修改执行顺序
- 加上额外的约束（"这一步不要改 API 接口"）
- 注明某个地方要特别小心（"这个函数有三个调用方"）

编辑完保存，关掉编辑器，Claude Code 会按照你修改后的计划来执行。

**这实际上是一种"人机协作规划"**——AI 生成草稿，你来审核和修改，然后 AI 执行。比你从零写计划快，比 AI 独自执行可控。

---

## 什么时候不该用 Plan Mode

Plan Mode 有价值，但也有开销——它会增加一轮"先分析再执行"的往返。

**可以跳过 Plan Mode 的情况：**

- 任务很简单，一两个文件的小改动
- 你已经很熟悉这段代码，知道要改什么
- 修 bug 时已经有明确的报错和调用栈
- 添加一行日志、修改一个配置值这类微操作

**一个经验规则：** 如果你能用一句话描述清楚要改的 diff，就不需要 Plan Mode。如果你需要一段话才能说清楚，Plan Mode 就值得用。

---

## 让 Claude Code 帮你判断

如果你不确定要不要用 Plan Mode，可以直接问它：

```
I want to add OAuth2 support to this app. is this complex enough
to warrant using plan mode first, or can we just do it directly?
```

它会根据任务的复杂度给你建议。

---

## 第四章小结

这一章覆盖了日常开发里最常见的五类任务：

| 任务 | 关键点 |
|------|-------|
| 探索代码库 | 从宏观到微观，用 `@` 聚焦具体文件，最后生成 CLAUDE.md |
| 修复 bug | 给完整上下文（报错+复现步骤+验收标准），改完要 review |
| 代码重构 | 三步走：探索 → 计划（Ctrl+G 编辑）→ 分批执行 |
| 编写测试 | 先找缺口，再生成，再找 edge case，最后审查质量 |
| Plan Mode | 先想清楚再动手，Ctrl+G 让你直接编辑计划 |

下一章，我们来聊怎么把重复的工作打包成命令，一次设置，永久省事。

---

> 本文节选自《跟鬼哥玩转 Claude Code》，原文：https://luoli523.github.io/claude-code-book
