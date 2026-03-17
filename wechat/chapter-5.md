---
title: "《跟鬼哥玩转 Claude Code》第五章：自定义命令与自动化"
author: 鬼哥
coverImage: "/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-5/5.1-what-is-skills.png"
---

> 📖 **跟鬼哥玩转 Claude Code**

# 第五章：自定义命令与自动化

# 5.1 什么是 Skills

![5.1 什么是 Skills](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-5/5.1-what-is-skills.png)


## 从"每次都要解释"到"一个命令搞定"

用 Claude Code 一段时间之后，你会发现两类任务：

**第一类：每次都不一样的任务**
修 bug、写新功能、探索陌生代码——这类任务每次都有不同的上下文，需要你即兴描述。

**第二类：每次都差不多的任务**
代码审查、生成 changelog、部署流程、提交前检查——这类任务有固定的流程和规范，你每次都要重复说一遍同样的要求。

**Skills 就是为第二类任务设计的。**

它让你把重复的指令打包成一个可以复用的命令，直接用 `/命令名` 调用。

---

## Skills 是什么，本质上

一个 Skill 就是一个 Markdown 文件，里面写着"当这个命令被调用时，Claude Code 应该做什么"。

就这么简单。

比如一个代码审查的 Skill，文件内容可能是这样的：

```markdown
---
name: review
description: Review code changes following our team standards
---

Review the current code changes (git diff or specified files).

Check for:
1. Logic errors and potential bugs
2. Security vulnerabilities (SQL injection, XSS, auth issues)
3. Performance issues (N+1 queries, unnecessary loops)
4. Test coverage for new or changed functionality
5. Adherence to our coding standards in CLAUDE.md

Format the review as:
- **Critical**: must fix before merge
- **Suggestion**: nice to have
- **Nitpick**: minor style issues

End with an overall recommendation: Approve / Request Changes / Needs Discussion
```

保存好这个文件，以后每次 review 代码，直接输入：

```
/review
```

不需要再重复说那一大段要求了。

---

## Skills vs CLAUDE.md：傻傻分不清楚？

这是最常见的困惑，一张表说清楚：

| | CLAUDE.md | Skills |
|--|-----------|--------|
| **加载方式** | 每次会话自动加载 | 只在你调用时加载 |
| **适合放什么** | 永远要遵守的规则 | 特定任务的流程和指令 |
| **调用方式** | 不需要调用，自动生效 | `/命令名` 显式调用 |
| **消耗上下文** | 每次会话都占用 | 只在调用时占用 |
| **能触发工作流吗** | 不能 | 可以 |

**判断标准：**
- "Claude 在任何情况下都应该知道这个" → CLAUDE.md
- "只有在做某件特定事情的时候才需要这个" → Skill

举例：
- "我们用 pnpm，不用 npm" → CLAUDE.md（每次都要知道）
- "帮我 review 这个 PR，按照这个清单检查" → Skill（只有 review 时才用）

---

## Skills 的两种类型

**参考型 Skills（Reference Skills）**

存储背景知识，Claude Code 在工作时自动参考。比如你的 API 风格指南、数据库 schema、团队词汇表。

```markdown
---
name: api-style
description: Our API design conventions and examples
---

# API Style Guide

All API endpoints follow REST conventions:
- Use plural nouns: /users not /user
- Version prefix: /api/v1/
- Response format: { data: ..., error: null } or { data: null, error: ... }

[详细的 API 规范...]
```

这类 Skill 通常不需要主动调用，Claude Code 在写 API 相关代码时会自动找到并参考它。

**动作型 Skills（Action Skills）**

定义一套可触发的工作流，用 `/命令名` 调用。这是更常用的类型，下一节详细讲怎么创建。

---

## Skill 文件放在哪里

| 位置 | 作用范围 | 适合放什么 |
|------|---------|---------|
| `.claude/skills/` | 当前项目 | 项目特定的流程（部署、测试规范）|
| `~/.claude/skills/` | 你的所有项目 | 个人习惯（你的代码审查标准）|

项目级 Skill 和 CLAUDE.md 一起 check in 到 git，团队所有人都能用。用户级 Skill 只对你自己生效，不进版本控制。

---

下一节，我们动手创建第一个 Skill。

---

# 5.2 创建你的第一个自定义命令

![5.2 创建你的第一个自定义命令](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-5/5.2-create-commands.png)


## 动手做一个 `/commit` 命令

我们从一个高频需求开始：生成 git commit message。

很多团队有自己的 commit 规范——比如 Conventional Commits（`feat:`, `fix:`, `chore:` 这套）。每次提交都要想措辞，还要符合规范，有点烦。把它做成一个命令。

---

## 第一步：创建文件

在项目根目录下创建 `.claude/skills/` 目录和命令文件：

```bash
mkdir -p .claude/skills
touch .claude/skills/commit.md
```

---

## 第二步：写命令内容

用你喜欢的编辑器打开 `.claude/skills/commit.md`，写入：

```markdown
---
name: commit
description: Create a git commit following Conventional Commits format
---

Review the staged changes with `git diff --cached`.
If nothing is staged, check unstaged changes with `git diff`.

Create a commit message following Conventional Commits:

Format: <type>(<scope>): <short description>

Types:
- feat: new feature
- fix: bug fix
- docs: documentation only
- style: formatting, no logic change
- refactor: code restructure, no behavior change
- test: adding or updating tests
- chore: build process, dependency updates

Rules:
- Subject line: max 72 characters, lowercase, no period at end
- If changes are complex, add a blank line then a body explaining WHY
- Reference issue numbers at the bottom if relevant: "Closes #123"

After showing the proposed message, ask for confirmation before committing.
```

---

## 第三步：使用它

在 Claude Code 会话里，staged 一些改动之后，直接输入：

```
/commit
```

Claude Code 会读取 `git diff --cached`，分析改动，按照你定义的规范生成 commit message，然后等你确认。

---

## 文件结构解析

一个 Skill 文件由两部分组成：

```markdown
---
name: commit          ← 命令名，/commit 调用这个
description: ...      ← 什么时候使用这个 Skill（Claude 自动判断时参考）
---

[这里是 Skill 的正文，告诉 Claude Code 收到命令后要做什么]
```

**frontmatter（`---` 之间的部分）：**
- `name`：命令名，必填，影响用 `/xxx` 调用的名字
- `description`：描述这个命令的用途，建议写清楚，Claude Code 在自动决策时会参考这个

**正文：**
就是普通的 Markdown 文本，写什么、用什么格式都行。越清楚，执行越准确。

---

## 传入参数

自定义命令还支持接受参数。比如你想让 `/review` 接受一个文件路径：

```
/review src/services/PaymentService.ts
```

在 Skill 文件里用 `$ARGUMENTS` 接收：

```markdown
---
name: review
description: Review a specific file or the current diff
---

Review the code in: $ARGUMENTS

If $ARGUMENTS is empty, review the current git diff instead.

Check for: [审查清单...]
```

`$ARGUMENTS` 会被替换成你在命令后面输入的内容。

---

## 几个提升 Skill 效果的写法技巧

**1. 明确输出格式**

不要只说"分析一下"，要说"用这个格式输出"：

```markdown
Output format:
## Summary
[one paragraph]

## Issues Found
- [issue 1]: [description] (file:line)
- [issue 2]: ...

## Recommendation
[approve / request changes]
```

**2. 加上"做完后做什么"**

```markdown
After completing the review:
1. Show the full report
2. Ask if any issue needs immediate fixing
3. If yes, switch to fix mode and address it
```

**3. 给边界条件**

```markdown
If there are no staged changes, say so and ask
whether to review the last commit instead.
```

**4. 引用外部文件**

```markdown
Follow the coding standards defined in @CLAUDE.md
and the API conventions in @docs/api-guide.md
```

---

## 测试你的 Skill

创建好之后，在 Claude Code 里输入 `/` 可以看到所有可用命令的列表，确认你的命令出现了。

然后实际触发一次，看看执行结果是否符合预期。如果不符合，直接编辑 Skill 文件调整，不需要重启 Claude Code——下次调用就会用新版本。

---

下一节，我们来把 Skill 放进版本控制，让整个团队都能用。

---

# 5.3 团队共享命令库

![5.3 团队共享命令库](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-5/5.3-team-sharing.png)


## 一个人写，所有人用

Skills 最大的价值不是让你自己省事，而是**把团队的最佳实践编码化**。

你们团队有代码审查规范？写成 `/review`。
有固定的部署流程？写成 `/deploy`。
有 release note 格式要求？写成 `/changelog`。

这些规范以前写在 Wiki 里，总是有人不看；写进 Skills，每次工作流自然就强制执行了。

---

## 把 Skills 放进版本控制

项目级 Skills 放在 `.claude/skills/` 目录下，和代码一起 check in 到 git：

```bash
# 提交 Skills 到版本控制
git add .claude/skills/
git commit -m "chore: add team Claude Code skills"
git push
```

团队其他成员 `git pull` 之后，这些命令立刻就可以用了——不需要安装任何东西，不需要额外配置。

---

## 推荐的目录结构

```
your-project/
├── .claude/
│   ├── CLAUDE.md           ← 可以放在这里或项目根目录
│   ├── skills/
│   │   ├── review.md       ← 代码审查
│   │   ├── commit.md       ← 生成 commit message
│   │   ├── changelog.md    ← 生成 changelog
│   │   ├── deploy.md       ← 部署流程
│   │   └── check.md        ← 提交前检查清单
│   └── rules/
│       ├── frontend.md     ← 前端规则
│       └── backend.md      ← 后端规则
```

这个结构的好处是：所有 AI 相关的配置都在 `.claude/` 目录下，清晰、集中、好维护。

---

## 让 Claude Code 帮你维护 Skills

有个很方便的做法：**让 Claude Code 自己来更新 Skills**。

当你发现某个命令的执行结果不够好的时候：

```
the /review skill is missing checks for our error handling conventions.
update .claude/skills/review.md to also check:
- all async functions have proper try/catch
- errors are logged before being rethrown
- user-facing error messages don't expose internal details
```

它会直接修改文件，你 review 一下，满意了就提交。

---

## 版本控制 Skills 的注意事项

**不要在 Skills 里写敏感信息**

Skills 文件会进 git 仓库，不要在里面写 API key、密码、内网地址这类东西。需要的话用环境变量，或者在 Skill 里说"从环境变量 `$DEPLOY_KEY` 读取"。

**和 CLAUDE.md 一起维护**

如果 CLAUDE.md 里的规范更新了，相关的 Skills 也要跟着更新，保持一致。可以在 Skill 文件里用 `@CLAUDE.md` 引用，避免重复：

```markdown
---
name: review
description: Review code following our team standards
---

Review the staged changes.

Follow all standards defined in @CLAUDE.md.

Additionally check:
[Skill 特有的检查项...]
```

**给 Skills 加上注释说明**

当团队成员不知道某个命令是干什么的时候，他们可以输入 `/help` 或者直接看文件。在文件开头加个简短的说明：

```markdown
---
name: deploy
description: Deploy to staging environment with pre-flight checks
---

<!-- 
使用场景：部署到 staging 之前
触发方式：/deploy 或 /deploy staging
注意：不用于生产环境，生产部署走 CI/CD
-->

[部署流程...]
```

---

## 建立团队 Skills 的好时机

不需要一开始就把所有流程都写成 Skills。**最好的时机是当你第三次说同一段话的时候。**

第一次：正常描述任务
第二次：意识到这是个规律
第三次：停下来，写成 Skill

这样积累出来的 Skills 都是真实需要的，而不是为了"有 Skills 而有 Skills"。

---

下一节，给你一套可以直接用的实用命令模板。

---

# 5.4 实用命令模板集

![5.4 实用命令模板集](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-5/5.4-templates.png)


以下是一套可以直接拿去用的 Skill 模板，覆盖日常开发最常见的场景。

根据你的项目情况调整细节，然后保存到 `.claude/skills/` 目录下即可。

---

## `/review` — 代码审查

```markdown
---
name: review
description: Review code changes following team standards
---

Review the changes in: $ARGUMENTS
If no argument provided, review the current git diff (staged + unstaged).

Perform a thorough code review checking:

**Correctness**
- Logic errors or edge cases not handled
- Off-by-one errors, null/undefined handling
- Async/await issues, unhandled promise rejections

**Security**
- SQL injection, XSS, CSRF vulnerabilities
- Authentication and authorization checks
- Sensitive data exposure (tokens, passwords in logs)
- Input validation and sanitization

**Performance**
- N+1 query problems
- Unnecessary re-renders or re-computations
- Missing indexes for database queries
- Large payload sizes

**Maintainability**
- Functions doing too many things (> 30 lines is a smell)
- Duplicated logic that could be extracted
- Missing or misleading comments on complex logic

**Tests**
- Are new/changed behaviors covered by tests?
- Are edge cases tested?

Format output as:
### 🔴 Critical (must fix)
### 🟡 Suggestions (should fix)
### 🔵 Nitpicks (optional)
### ✅ Overall: [Approve / Request Changes]
```

---

## `/commit` — 生成 Commit Message

```markdown
---
name: commit
description: Generate a conventional commit message and commit
---

Review staged changes with `git diff --cached`.
If nothing is staged, show unstaged changes and ask which files to stage.

Generate a commit message following Conventional Commits specification:

**Format:** `<type>(<scope>): <description>`

**Types:** feat | fix | docs | style | refactor | test | chore | perf | ci

**Rules:**
- Description: imperative mood, lowercase, no period, max 72 chars
- Scope: the module/component affected (optional but recommended)
- Body: explain WHY if the change is non-obvious (separate with blank line)
- Footer: reference issues with "Closes #123" or "Fixes #456"

Show the proposed message and wait for approval before committing.
After committing, show the commit hash.
```

---

## `/changelog` — 生成 Changelog

```markdown
---
name: changelog
description: Generate changelog entries from recent commits
---

Generate changelog entries for: $ARGUMENTS
If no argument, use commits since the last git tag.

Run `git log <last-tag>..HEAD --oneline` to get recent commits.

Group changes into sections:
## Added
## Changed  
## Fixed
## Deprecated
## Removed
## Security

Follow Keep a Changelog format (https://keepachangelog.com).

Rules:
- Write for humans, not machines (summarize intent, not implementation)
- Skip chore/style/refactor commits unless user-facing
- Merge related commits into single entries
- Use present tense: "Add", "Fix", "Update"

Output ready-to-paste markdown. Ask if I want to append it to CHANGELOG.md.
```

---

## `/check` — 提交前检查

```markdown
---
name: check
description: Run pre-commit checks before pushing
---

Run the full pre-commit checklist:

1. **Lint**: run `npm run lint` (or equivalent from CLAUDE.md)
   - If errors: fix them automatically where possible
   - Report anything that needs manual attention

2. **Type check**: run `npx tsc --noEmit`
   - Fix type errors, do not use `any` as a shortcut

3. **Tests**: run `npm test`
   - If failures: investigate and fix
   - Report if a test failure is pre-existing (not caused by current changes)

4. **Security scan**: check for common issues
   - Hardcoded secrets or API keys
   - console.log statements that shouldn't be in production
   - TODO/FIXME comments in new code

5. **Diff review**: show a summary of all changes
   - Anything that looks unintentional?

Report results for each step. Only proceed to the next if the current one passes.
Final summary: ✅ Ready to push / ❌ Issues found.
```

---

## `/deploy` — 部署到 Staging

```markdown
---
name: deploy
description: Deploy to staging environment with pre-flight checks
---

Deploy the current branch to staging. Steps:

1. **Pre-flight checks**
   - Confirm current branch is not `main` or `master`
   - Run `/check` to verify code quality
   - Check for any pending database migrations

2. **Build**
   - Run `npm run build`
   - Verify build succeeds without warnings

3. **Deploy**
   - Run the deployment command: `[your deploy command here]`
   - Tail the deployment logs

4. **Smoke test**
   - Hit the health check endpoint
   - Verify the deployed version matches the current commit

5. **Report**
   - Deployment URL
   - Commit hash deployed
   - Any issues encountered

If any step fails, stop and report the error. Do not proceed to the next step.

⚠️ This skill is for staging only. Production deployments go through CI/CD.
```

---

## `/explain` — 解释复杂代码

```markdown
---
name: explain
description: Explain a piece of code in plain language
---

Explain the code in: $ARGUMENTS

Structure the explanation as:

**What it does** (1-2 sentences, no jargon)

**How it works** (step by step, like explaining to a junior dev)

**Why it's written this way** (design decisions, tradeoffs)

**Potential gotchas** (things that might trip someone up)

If the code has known issues or smells, mention them at the end
but don't fix them unless asked.
```

---

## `/standup` — 生成每日站会摘要

```markdown
---
name: standup
description: Generate a daily standup summary from recent git activity
---

Generate a standup summary based on my recent work.

Run:
- `git log --author="$(git config user.name)" --since="yesterday" --oneline`
- `git diff --stat HEAD~5..HEAD`

Format as:

**Yesterday**
[what I completed, based on commits]

**Today**  
[what's in progress or next up, based on open branches/uncommitted work]

**Blockers**
[anything that looks stuck or needs attention]

Keep it concise — this is for a 15-minute standup, not a novel.
```

---

## 用好这些模板的建议

1. **先直接用，再按需修改** — 这些模板是起点，不是终点
2. **把你们团队特有的规范补进去** — 比如你们的部署命令、你们的代码规范
3. **用 `@CLAUDE.md` 引用团队规范** — 避免在每个 Skill 里重复写
4. **给每个 Skill 加一行 `<!-- 最后更新：日期 -->` 注释** — 方便团队知道是否还有效

---

## 第五章小结

Skills 是让 Claude Code 真正融入你工作流的关键：

- **CLAUDE.md** 管"永远要遵守的规则"
- **Skills** 管"特定任务的执行流程"
- **项目级 Skills** 进 git，团队共享
- **用户级 Skills** 留本地，个人偏好

模板拿去用，出了效果记得回来改进它 🐾

下一章，我们来聊 MCP——让 Claude Code 连接外部世界的方式。

---

> 本文节选自《跟鬼哥玩转 Claude Code》，原文：https://luoli523.github.io/claude-code-book
