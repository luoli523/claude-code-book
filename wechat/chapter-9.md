---
title: "《跟鬼哥玩转 Claude Code》第九章：SDK 与编程化控制"
author: 鬼哥
coverImage: "/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-9/9.1-headless-mode.png"
---

> 📖 **跟鬼哥玩转 Claude Code**

# 第九章：SDK 与编程化控制

# 9.1 非交互模式（`-p` 标志）

![9.1 非交互模式（`-p` 标志）](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-9/9.1-headless-mode.png)


> 一个标志，让 Claude Code 变成可脚本化的命令行工具。

## 什么是 `-p`？

正常用 Claude Code，你需要打开一个交互式会话，来回对话。但加上 `-p`（`--print`）标志，Claude Code 就变成了一个"一问一答"的命令行工具——问完就退出，结果打印到 stdout。

```bash
# 交互模式：打开会话，等待输入
claude

# 非交互模式：直接给 prompt，拿结果，退出
claude -p "What does the auth module do?"
```

这个模式以前叫 headless mode，现在官方叫它 Agent SDK CLI。不管叫什么，`-p` 是核心。

## 基本用法

```bash
# 最简单的形式：问一个问题
claude -p "Summarize this project in 3 bullet points"

# 限制可用工具（避免 Claude 乱改文件）
claude -p "Find all TODO comments in the codebase" \
  --allowedTools "Read,Bash(grep *)"

# 只读分析，不允许任何写操作
claude -p "Review src/auth.js for security issues" \
  --allowedTools "Read"
```

## 从 stdin 读 prompt

`-p` 可以从 stdin 读 prompt，这让它可以和其他命令组合使用：

```bash
# 把文件内容通过 stdin 传给 Claude
cat error.log | claude -p "Analyze this error log and suggest fixes"

# 把 git diff 传给 Claude 做 code review
git diff HEAD~1 | claude -p "Review these changes for potential issues"

# 结合 grep 筛选后传入
grep -r "TODO" src/ | claude -p "Prioritize these TODOs by importance"
```

还可以结合 `--append-system-prompt` 加角色设定：

```bash
# 让 Claude 以安全工程师身份审查 PR
gh pr diff 42 | claude -p \
  --append-system-prompt "You are a security engineer. Focus on vulnerabilities." \
  --allowedTools "Read"
```

## 自动授权工具

非交互模式下，Claude 遇到需要权限的操作会……卡住等确认，而你的脚本根本没法输入。所以要用 `--allowedTools` 预先授权：

```bash
# 允许读文件和执行 Bash
claude -p "Run the test suite and report failures" \
  --allowedTools "Read,Bash"

# 细粒度控制：只允许特定 git 命令
claude -p "Create a commit for my staged changes" \
  --allowedTools "Bash(git status *),Bash(git diff *),Bash(git commit *)"
```

`--allowedTools` 的值和 `settings.json` 里 `permissions.allow` 的语法一样——支持 `工具名(前缀 *)` 格式的前缀匹配。

## 多轮对话：续接会话

非交互模式也支持多轮对话，通过 `--continue` 或 `--resume` 续接上次的会话：

```bash
# 第一轮
claude -p "Review this codebase for performance issues"

# 续接最近一次对话
claude -p "Now focus on the database query part" --continue

# 续接指定 session ID（适合并发场景）
SESSION=$(claude -p "Start the review" --output-format json | jq -r '.session_id')
claude -p "Give me a summary" --resume "$SESSION"
```

`--continue` 用的是最近一次会话，`--resume` 用的是你指定的 session ID——当你同时跑多个 claude 进程时，`--resume` 更安全。

## 退出码与错误处理

脚本里用 claude，要关注退出码：

| 退出码 | 含义 |
|--------|------|
| `0` | 成功 |
| `1` | 一般错误（网络、认证等） |
| `2` | 工具调用被拒绝 |

在 shell 脚本里：

```bash
#!/bin/bash
set -e  # 遇到错误就退出

RESULT=$(claude -p "Check if there are any syntax errors in src/" \
  --allowedTools "Read,Bash(node --check *)" \
  --output-format json)

if [ $? -ne 0 ]; then
  echo "Claude failed to run" >&2
  exit 1
fi

echo "$RESULT" | jq -r '.result'
```

## 控制 token 消耗

非交互模式下，Claude 可能会"超发"——绕好几个弯子才给你答案。用 `--max-turns` 限制轮次：

```bash
# 最多跑 3 轮工具调用就给出结论
claude -p "Review src/app.js for bugs" \
  --max-turns 3 \
  --allowedTools "Read"
```

轮次到了之后，Claude 会给出截至目前的结论，不会突然中断。

---

## 完整脚本示例：批量分析文件

```bash
#!/bin/bash
# batch-review.sh — 逐个分析 src/ 下的 JS 文件

REPORT_FILE="review-report.md"
echo "# Code Review Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"

for file in src/**/*.js; do
  echo "Reviewing $file..."
  
  RESULT=$(claude -p "Review $file for bugs, security issues, and code quality. Be concise." \
    --allowedTools "Read" \
    --output-format json \
    --max-turns 2)
  
  echo "" >> "$REPORT_FILE"
  echo "## $file" >> "$REPORT_FILE"
  echo "$RESULT" | jq -r '.result' >> "$REPORT_FILE"
done

echo "Done. Report saved to $REPORT_FILE"
```

---

下一节，我们深入看结构化 JSON 输出——让 Claude 的回答变成机器可读的格式 ↓

---

# 9.2 结构化输出

![9.2 结构化输出](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-9/9.2-structured-output.png)


> 让 Claude 说"人话"之外，还能说"机器话"——输出 JSON，接进你的流水线。

## 为什么需要结构化输出？

`claude -p "Review this file"` 默认返回的是自然语言文本——人读没问题，但脚本处理就头疼了。你不知道哪里是"严重问题"，哪里是"建议"，更没法直接 parse 出 issue 列表。

`--output-format` 解决这个问题。

## 三种输出格式

```bash
# 默认：纯文本
claude -p "Summarize the project" --output-format text

# JSON：带元数据的结构化响应
claude -p "Summarize the project" --output-format json

# stream-json：实时流式 JSON（逐 token 输出）
claude -p "Summarize the project" --output-format stream-json
```

### `--output-format json` 的响应结构

```json
{
  "result": "This is a Node.js web application using Express...",
  "session_id": "sess_abc123def456",
  "cost_usd": 0.0032,
  "duration_ms": 4200,
  "num_turns": 2,
  "is_error": false
}
```

关键字段：
- `result`：Claude 的回答（纯文本）
- `session_id`：会话 ID，可用于 `--resume` 续接
- `cost_usd`：这次调用的费用（排查超支很有用）
- `is_error`：是否出错

### 用 `jq` 提取字段

```bash
# 只要结果文本
claude -p "What is the main function of auth.js?" \
  --allowedTools "Read" \
  --output-format json | jq -r '.result'

# 拿到 session_id 备用
SESSION=$(claude -p "Review the codebase" \
  --output-format json | jq -r '.session_id')

# 检查是否出错
RESPONSE=$(claude -p "Run tests" --allowedTools "Bash" --output-format json)
if [ "$(echo "$RESPONSE" | jq -r '.is_error')" = "true" ]; then
  echo "Claude encountered an error"
  exit 1
fi
```

---

## JSON Schema 输出：让 Claude 按你的格式回答

最强大的功能：用 `--json-schema` 强制 Claude 按指定结构输出，结果放在 `structured_output` 字段里。

```bash
claude -p "Extract the main function names from src/auth.js" \
  --allowedTools "Read" \
  --output-format json \
  --json-schema '{
    "type": "object",
    "properties": {
      "functions": {
        "type": "array",
        "items": { "type": "string" }
      }
    },
    "required": ["functions"]
  }'
```

响应：
```json
{
  "result": "...",
  "structured_output": {
    "functions": ["login", "logout", "verifyToken", "refreshToken"]
  },
  "session_id": "...",
  "cost_usd": 0.0018
}
```

```bash
# 直接拿函数列表
claude -p "..." --output-format json --json-schema '...' \
  | jq '.structured_output.functions[]'
```

### 实战：代码审查输出结构化报告

```bash
SCHEMA='{
  "type": "object",
  "properties": {
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "severity": { "type": "string", "enum": ["critical", "warning", "info"] },
          "file": { "type": "string" },
          "line": { "type": "number" },
          "description": { "type": "string" },
          "suggestion": { "type": "string" }
        },
        "required": ["severity", "file", "description"]
      }
    },
    "summary": { "type": "string" }
  },
  "required": ["issues", "summary"]
}'

claude -p "Review src/ for bugs and security issues. Return structured results." \
  --allowedTools "Read" \
  --output-format json \
  --json-schema "$SCHEMA" | jq '.structured_output'
```

输出：
```json
{
  "issues": [
    {
      "severity": "critical",
      "file": "src/auth.js",
      "line": 42,
      "description": "SQL injection vulnerability: user input not sanitized",
      "suggestion": "Use parameterized queries or an ORM"
    },
    {
      "severity": "warning",
      "file": "src/utils.js",
      "line": 17,
      "description": "Synchronous file read blocking event loop",
      "suggestion": "Use fs.promises.readFile instead"
    }
  ],
  "summary": "Found 1 critical security issue and 1 performance warning."
}
```

这个结构化输出可以直接：
- 用 `jq` 筛选 critical 级别的问题
- 写进 GitHub PR comment
- 推送到 Slack 告警
- 存进数据库做趋势分析

---

## 流式输出：实时看 Claude 的思考过程

`stream-json` 模式下，每个 token 生成后立刻输出一行 JSON——适合长时间任务、需要实时进度反馈的场景。

```bash
claude -p "Write a comprehensive test suite for auth.js" \
  --allowedTools "Read" \
  --output-format stream-json \
  --verbose \
  --include-partial-messages
```

输出是一连串 JSON 行：

```json
{"type": "stream_event", "event": {"type": "message_start", ...}}
{"type": "stream_event", "event": {"delta": {"type": "text_delta", "text": "I'll"}, ...}}
{"type": "stream_event", "event": {"delta": {"type": "text_delta", "text": " start"}, ...}}
{"type": "stream_event", "event": {"delta": {"type": "text_delta", "text": " by"}, ...}}
...
{"type": "result", "result": "...", "session_id": "..."}
```

**用 `jq` 实时显示文字流：**

```bash
claude -p "Explain how the auth module works" \
  --output-format stream-json \
  --verbose \
  --include-partial-messages | \
  jq -rj 'select(.type == "stream_event" and .event.delta.type? == "text_delta") | .event.delta.text'
```

这个管道会实时把文字打印出来，像正常的 claude 交互体验，但底层是结构化的流式 JSON。

---

## 实用的 jq 备忘

```bash
# 提取纯文本结果
jq -r '.result'

# 提取 session_id
jq -r '.session_id'

# 检查是否出错
jq -r '.is_error'

# 提取 structured_output（配合 --json-schema）
jq '.structured_output'

# 只显示 critical 问题
jq '.structured_output.issues[] | select(.severity == "critical")'

# 统计问题数量
jq '.structured_output.issues | length'
```

---

结构化输出是把 Claude 从"对话工具"变成"数据管道"的关键——下一节，我们把它接进 CI/CD ↓

---

# 9.3 在 CI/CD 中使用

![9.3 在 CI/CD 中使用](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-9/9.3-cicd.png)


> 把 Claude Code 接进 GitHub Actions，让每个 PR 都有 AI 帮你把关。

## 为什么在 CI 里用 Claude？

人工 code review 有几个现实问题：
- 忘了 review，PR 积压
- review 质量参差不齐，取决于 reviewer 当天的状态
- 跨时区团队等 review 要等很久

Claude Code 可以作为**第一道关卡**：每个 PR 提交时自动跑一遍，找出明显的 bug、安全问题、不符合规范的地方，生成 review comment——人类 reviewer 再在此基础上做判断。

## 认证：在 CI 里怎么登录？

本地开发用 `claude auth login` 走 OAuth，CI 环境用环境变量：

```bash
# CI 里设置环境变量
export ANTHROPIC_API_KEY="sk-ant-..."
```

Claude Code 会自动检测 `ANTHROPIC_API_KEY`，不需要任何额外的登录步骤。

在 GitHub Actions 里，把 API key 存在仓库 Secrets（Settings → Secrets → New repository secret），然后在 workflow 里引用：

```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## GitHub Actions 基础模板

```yaml
# .github/workflows/claude-review.yml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  claude-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 需要完整历史才能 diff

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Run Claude Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # 获取 PR 的变更文件
          CHANGED_FILES=$(git diff --name-only origin/${{ github.base_ref }}...HEAD)
          
          # 让 Claude 审查变更
          REVIEW=$(claude -p "Review the following changed files for bugs, security issues, and code quality. 
          Changed files: $CHANGED_FILES
          Focus on the diff between origin/${{ github.base_ref }} and HEAD." \
            --allowedTools "Read,Bash(git diff *)" \
            --output-format json \
            --max-turns 5 | jq -r '.result')
          
          echo "$REVIEW"

      - name: Post Review Comment
        uses: actions/github-script@v7
        with:
          script: |
            const review = process.env.CLAUDE_REVIEW;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🤖 Claude Code Review\n\n${review}`
            });
        env:
          CLAUDE_REVIEW: ${{ env.REVIEW }}
```

## 进阶：结构化输出 + 条件失败

更实用的版本——Claude 输出结构化报告，如果有 critical 问题就让 CI 失败：

```yaml
- name: Run Claude Security Review
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: |
    SCHEMA='{
      "type": "object",
      "properties": {
        "issues": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "severity": {"type": "string", "enum": ["critical", "warning", "info"]},
              "description": {"type": "string"},
              "file": {"type": "string"}
            }
          }
        },
        "passed": {"type": "boolean"}
      }
    }'
    
    RESPONSE=$(claude -p "Security review the changed files. Check for SQL injection, XSS, hardcoded secrets, and insecure dependencies." \
      --allowedTools "Read,Bash(git diff *)" \
      --output-format json \
      --json-schema "$SCHEMA" \
      --max-turns 5)
    
    # 提取结构化输出
    STRUCTURED=$(echo "$RESPONSE" | jq '.structured_output')
    CRITICAL_COUNT=$(echo "$STRUCTURED" | jq '[.issues[] | select(.severity == "critical")] | length')
    
    # 打印报告
    echo "$STRUCTURED" | jq -r '.issues[] | "[\(.severity | ascii_upcase)] \(.file): \(.description)"'
    
    # 如果有 critical 问题，让 CI 失败
    if [ "$CRITICAL_COUNT" -gt 0 ]; then
      echo "::error::Found $CRITICAL_COUNT critical security issue(s). PR blocked."
      exit 1
    fi
```

## 成本控制

CI 里每个 PR 都跑 Claude，成本可能失控。几个控制手段：

**1. 限制 token 消耗**

```bash
# 限制最多跑 3 轮工具调用
claude -p "..." --max-turns 3

# 只分析 diff，不分析整个仓库
git diff origin/main...HEAD | claude -p "Review these specific changes"
```

**2. 只在特定条件下触发**

```yaml
on:
  pull_request:
    types: [opened, synchronize]
    # 只在这些目录有变化时才触发
    paths:
      - 'src/**'
      - 'lib/**'
      # 忽略文档、配置文件
      - '!**.md'
      - '!**.json'
```

**3. 手动触发（workflow_dispatch）**

```yaml
on:
  # 正常 PR 事件
  pull_request:
    types: [opened]
  # 也支持手动触发
  workflow_dispatch:
    inputs:
      pr_number:
        description: 'PR number to review'
        required: true
```

**4. 给低优先级分支跳过**

```yaml
- name: Skip draft PRs
  if: github.event.pull_request.draft == false
  run: claude -p "..."
```

## 在 GitLab CI 中使用

GitLab 同理，把 API key 存在 CI/CD Variables：

```yaml
# .gitlab-ci.yml
claude-review:
  stage: review
  image: node:20
  before_script:
    - npm install -g @anthropic-ai/claude-code
  script:
    - |
      claude -p "Review the changes in this MR for bugs and code quality" \
        --allowedTools "Read,Bash(git diff *)" \
        --output-format json \
        --max-turns 4 | jq -r '.result'
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY  # 从 CI/CD Variables 取
  only:
    - merge_requests
```

## 注意事项

**权限控制要严格**：CI 里的 Claude 绝对不能有写生产环境的权限。用 `--allowedTools` 明确白名单，只给 `Read` 和受限的 `Bash` 命令。

**不要信任 Claude 的 CI 判断作为唯一门禁**：Claude 可能漏报，也可能误报。把它当"辅助 reviewer"，不要替代 CI 测试或人工 review。

**注意 context window**：大型 PR（几百个文件变更）可能超出 context window。用 `git diff --stat` 先做概要，再针对核心文件做深度分析。

---

`claude -p` + CI/CD 的组合，让 AI review 变成了每个项目都能用的标配。下一节，我们看 Python 和 TypeScript SDK，实现更完整的编程化控制 ↓

---

# 9.4 Python / TypeScript SDK

![9.4 Python / TypeScript SDK](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-9/9.4-sdk.png)


> 从命令行脚本升级到真正的编程——用代码驱动 Claude Code 的完整能力。

## SDK 简介

`claude -p` 已经很强了，但它有一个根本限制：**只能调用一次，拿一个结果**。如果你需要：

- 根据 Claude 的中间输出动态调整后续 prompt
- 在 Python/TypeScript 代码里处理流式响应
- 给 Claude 注册自定义的 hook 回调函数
- 构建有状态的多轮对话应用

那你需要的是 **Claude Agent SDK**（以前叫 Claude Code SDK）。

> **包名变化**：SDK 最近从 `@anthropic-ai/claude-code` 改名为 `@anthropic-ai/claude-agent-sdk`（Python 对应 `claude-agent-sdk`）。功能完全一样，只是名字变了。

## 安装

```bash
# TypeScript / JavaScript
npm install @anthropic-ai/claude-agent-sdk

# Python
pip install claude-agent-sdk
```

设置 API key：

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

## 基本用法

SDK 的核心 API 是 `query()`——接收 prompt，返回一个异步迭代器，逐条产出消息。

**TypeScript：**

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in src/auth.js",
  options: {
    allowedTools: ["Read", "Edit", "Bash"]
  }
})) {
  // 每条消息都打印出来
  console.log(message);
}
```

**Python：**

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="Find and fix the bug in src/auth.js",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Bash"]
        )
    ):
        print(message)

asyncio.run(main())
```

## 消息类型

`query()` 产出的消息有几种类型，用 `hasattr`（Python）或 `"result" in message`（TS）判断：

**TypeScript：**

```typescript
import { query, ResultMessage, AssistantMessage } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({ prompt: "Summarize the project" })) {
  if ("result" in message) {
    // 最终结果
    console.log("Final result:", message.result);
    console.log("Cost:", message.cost_usd, "USD");
    console.log("Session:", message.session_id);
  } else if ("content" in message) {
    // 中间消息（Claude 的思考过程、工具调用等）
    console.log("Intermediate:", message.content);
  }
}
```

**Python：**

```python
from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage

async for message in query(prompt="Summarize the project"):
    if hasattr(message, "result"):
        # 最终结果
        print(f"Result: {message.result}")
        print(f"Cost: ${message.cost_usd:.4f}")
    elif hasattr(message, "content"):
        # 中间消息
        print(f"Thinking: {message.content}")
```

## 常用配置选项

```typescript
const response = query({
  prompt: "...",
  options: {
    // 允许的工具白名单
    allowedTools: ["Read", "Bash(git *)", "Edit"],
    
    // 最大对话轮次（控制成本）
    maxTurns: 5,
    
    // 追加 system prompt
    appendSystemPrompt: "You are a security-focused reviewer. Be strict.",
    
    // 续接上次会话
    sessionId: "sess_abc123",
    
    // 工作目录
    cwd: "/path/to/project",
  }
});
```

## SDK Hooks：用回调函数控制行为

SDK 里的 hook 不是 shell 命令，而是**回调函数**——更灵活，能直接访问 Python/TypeScript 的生态。

**Python 示例：记录所有文件修改**

```python
import asyncio
from datetime import datetime
from claude_agent_sdk import query, ClaudeAgentOptions, HookMatcher

async def log_file_change(input_data, tool_use_id, context):
    file_path = input_data.get("tool_input", {}).get("file_path", "unknown")
    with open("./audit.log", "a") as f:
        f.write(f"{datetime.now()}: modified {file_path}\n")
    return {}  # 空 dict = 放行

async def block_env_files(input_data, tool_use_id, context):
    file_path = input_data.get("tool_input", {}).get("file_path", "")
    if ".env" in file_path:
        return {"decision": "block", "reason": "Cannot modify .env files"}
    return {}

async def main():
    async for message in query(
        prompt="Refactor utils.py for better readability",
        options=ClaudeAgentOptions(
            permission_mode="acceptEdits",
            hooks={
                "PostToolUse": [
                    HookMatcher(matcher="Edit|Write", hooks=[log_file_change])
                ],
                "PreToolUse": [
                    HookMatcher(matcher="Edit|Write", hooks=[block_env_files])
                ]
            }
        )
    ):
        if hasattr(message, "result"):
            print(message.result)

asyncio.run(main())
```

## 实战：批量处理多个文件

**场景**：对 `src/` 下的所有 JS 文件逐一做安全审查，汇总报告。

**TypeScript 版本：**

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { glob } from "glob";
import fs from "fs";

interface SecurityIssue {
  file: string;
  issues: string;
}

async function reviewFile(filePath: string): Promise<string> {
  let result = "";
  
  for await (const message of query({
    prompt: `Security review ${filePath}. Check for: SQL injection, XSS, hardcoded secrets, insecure dependencies. Be concise.`,
    options: {
      allowedTools: ["Read"],
      maxTurns: 2,
      cwd: process.cwd(),
    }
  })) {
    if ("result" in message) {
      result = message.result ?? "";
    }
  }
  
  return result;
}

async function main() {
  const files = await glob("src/**/*.js");
  const report: SecurityIssue[] = [];
  
  console.log(`Reviewing ${files.length} files...`);
  
  for (const file of files) {
    console.log(`  → ${file}`);
    const review = await reviewFile(file);
    report.push({ file, issues: review });
  }
  
  // 写入报告
  const reportMd = report
    .map(r => `## ${r.file}\n\n${r.issues}`)
    .join("\n\n---\n\n");
  
  fs.writeFileSync("security-report.md", `# Security Review\n\n${reportMd}`);
  console.log("Report saved to security-report.md");
}

main().catch(console.error);
```

**Python 版本（并发提速）：**

```python
import asyncio
import glob
from claude_agent_sdk import query, ClaudeAgentOptions

async def review_file(file_path: str) -> dict:
    result = ""
    async for message in query(
        prompt=f"Security review {file_path}. Check for SQL injection, XSS, hardcoded secrets. Be concise.",
        options=ClaudeAgentOptions(
            allowed_tools=["Read"],
            max_turns=2
        )
    ):
        if hasattr(message, "result") and message.result:
            result = message.result
    
    return {"file": file_path, "review": result}

async def main():
    files = glob.glob("src/**/*.py", recursive=True)
    print(f"Reviewing {len(files)} files...")
    
    # 并发审查（最多 3 个同时跑，避免超 rate limit）
    semaphore = asyncio.Semaphore(3)
    
    async def review_with_limit(f):
        async with semaphore:
            return await review_file(f)
    
    results = await asyncio.gather(*[review_with_limit(f) for f in files])
    
    # 写入报告
    with open("security-report.md", "w") as f:
        f.write("# Security Review Report\n\n")
        for r in results:
            f.write(f"## {r['file']}\n\n{r['review']}\n\n---\n\n")
    
    print("Report saved to security-report.md")

asyncio.run(main())
```

---

## 什么时候用 SDK vs `claude -p`？

| 需求 | 推荐 |
|------|------|
| 简单脚本、shell pipeline | `claude -p` |
| 需要处理中间消息/流式输出 | SDK |
| 动态调整多轮对话逻辑 | SDK |
| 注册自定义 hook 回调 | SDK |
| 构建有状态的 Agent 应用 | SDK |
| CI/CD 一次性任务 | `claude -p` |

---

掌握了 SDK，下一节我们看最高阶的玩法——让多个 agent 协作分工，处理复杂任务 ↓

---

# 9.5 构建 AI Agent 团队

![9.5 构建 AI Agent 团队](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-9/9.5-agent-teams.png)


> 一个 Claude 不够用？那就多来几个，各司其职。

## 为什么需要多个 Agent？

单个 Claude Code 会话有一个根本限制：**context window**。当项目足够大，任务足够复杂，一个 agent 的上下文会很快装满——它既要记住整个对话历史，又要读代码、分析问题、生成输出。

子 agent（Sub-agent）的核心思想是**分治**：
- 把大任务拆成小任务
- 每个子 agent 在自己独立的 context window 里处理一个小任务
- 主 agent 负责协调、汇总

这样既保持了每个 agent 的专注度，也避免了 context 爆炸。

## 内置子 Agent

Claude Code 自带几个内置子 agent，会在合适的时机自动调用：

| Agent | 模型 | 作用 |
|-------|------|------|
| **Explore** | Haiku（快速低延迟） | 搜索、探索代码库，只读 |
| **Plan** | 继承主会话 | Plan Mode 下做背景调研，只读 |
| **General-purpose** | 继承主会话 | 复杂多步骤任务，可读写 |

比如当你问 Claude "帮我分析整个 src 目录的结构"，它可能会把探索任务委托给 **Explore** agent——结果注入回主会话，但不占用主 context 太多空间。

这些内置 agent 不需要你手动配置，Claude 会自动决定什么时候用它们。

## 创建自定义子 Agent

子 agent 是一个 Markdown 文件，头部是 YAML 配置（frontmatter），正文是 system prompt。

### 文件格式

```markdown
---
name: security-reviewer
description: Reviews code changes for security vulnerabilities. Use when asked to audit code security, check for injection risks, or review auth implementations.
model: claude-haiku-4-5
tools:
  - Read
  - Bash
allowed_tools:
  - Read
  - "Bash(grep *)"
  - "Bash(find *)"
---

You are a security-focused code reviewer specializing in web application security.

When reviewing code, always check for:
1. SQL injection vulnerabilities
2. XSS attack vectors
3. Hardcoded secrets or credentials
4. Insecure authentication patterns
5. Missing input validation

Be concise but thorough. Report each issue with: severity (critical/warning/info), location, and a specific fix suggestion.
```

### 存放位置

| 位置 | 作用范围 | 适合 |
|------|----------|------|
| `.claude/agents/your-agent.md` | 当前项目 | 项目专属 agent，可提交 Git |
| `~/.claude/agents/your-agent.md` | 所有项目 | 个人通用 agent |

### 用 `/agents` 命令管理

在 Claude Code 里输入 `/agents`，打开交互式管理界面：
- 查看所有可用 agent（内置 + 用户自定义 + 项目级）
- 创建新 agent（可以让 Claude 帮你生成 system prompt）
- 编辑、删除现有 agent

```bash
# 从命令行列出所有 agent（不进入交互式界面）
claude agents
```

### 调用自定义 Agent

配置好后，直接在对话里描述任务，Claude 会根据 agent 的 `description` 字段自动判断是否委托：

```
You: Review the auth module for security vulnerabilities
Claude: [delegates to security-reviewer agent]
       → security-reviewer: Found 2 issues...
```

或者明确指定：

```
You: Use the security-reviewer agent to check src/auth.js
```

## Orchestrator + Worker 模式

最常用的多 agent 架构：一个**主 agent（Orchestrator）**负责规划和协调，多个**工作 agent（Worker）**负责执行具体任务。

### 场景：大型项目全面审查

```markdown
---
name: code-auditor
description: Comprehensive code audit coordinator. Use when asked to audit an entire codebase or run a multi-faceted review.
model: claude-sonnet-4-5
tools:
  - Bash
  - Read
---

You are a code audit coordinator. When asked to audit a codebase:

1. First, explore the project structure to understand what's there
2. Then delegate specialized reviews to appropriate sub-agents:
   - Security review → use the security-reviewer agent
   - Performance analysis → use the performance-analyzer agent  
   - Test coverage → use the test-coverage agent
3. Collect all results and compile a unified report

Always present findings organized by severity: Critical → Warning → Info.
```

配套的专业 worker：

```markdown
---
name: performance-analyzer  
description: Analyzes code for performance bottlenecks, N+1 queries, memory leaks, and inefficient algorithms.
model: claude-haiku-4-5
tools:
  - Read
  - "Bash(grep *)"
---

You are a performance specialist. Analyze code for:
- N+1 database query patterns
- Synchronous I/O in async code
- Memory leaks (event listeners not cleaned up, circular refs)
- O(n²) or worse algorithms where O(n) is possible
- Missing caching opportunities

Report each issue with estimated performance impact (high/medium/low).
```

使用时，你只需要告诉 Orchestrator：

```
You: Run a comprehensive audit of the entire src/ directory
```

它会自动协调各个 worker，最终汇总一份完整报告。

## 注意事项

### 子 agent 不能再生 agent

为了防止无限递归，子 agent **不能再委托给其他子 agent**。这是设计上的限制。如果你需要多层嵌套，用 SDK 的编程式调用来实现。

### 权限继承

子 agent 继承父会话的权限，**再加上自己的限制**。也就是说，子 agent 只能做父 agent 允许的事情的子集。

```markdown
# agent 配置里的 tools 进一步限制权限
tools:
  - Read          # 只能读文件
  # 不加 Edit/Write/Bash，就不能写文件或执行命令
```

### 模型选择与成本

不同 agent 可以用不同模型——用 Haiku 做轻量探索，用 Sonnet 做复杂分析：

```markdown
---
name: quick-explorer
model: claude-haiku-4-5  # 快、便宜，适合只读探索
---

---
name: deep-refactor
model: claude-sonnet-4-5  # 更强，适合复杂重构
---
```

这样可以在成本和能力之间取得平衡。

### description 写好是关键

Claude 根据 `description` 字段决定什么时候委托给子 agent。描述要**具体、有场景**：

```markdown
# ❌ 太模糊
description: Helps with code

# ✅ 清晰有场景
description: Reviews TypeScript code for type safety issues, incorrect generics usage, and missing type annotations. Use when asked to check types, fix TypeScript errors, or improve type coverage.
```

---

## 完整示例：CI 里的多 Agent 流水线

结合 SDK + 多个子 agent，在 CI 里实现并行审查：

```python
# multi-agent-review.py
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def run_security_review():
    """委托给 security-reviewer agent"""
    async for message in query(
        prompt="Use the security-reviewer agent to audit src/ for vulnerabilities",
        options=ClaudeAgentOptions(allowed_tools=["Read", "Bash"])
    ):
        if hasattr(message, "result"):
            return message.result
    return ""

async def run_performance_review():
    """委托给 performance-analyzer agent"""
    async for message in query(
        prompt="Use the performance-analyzer agent to check src/ for performance issues",
        options=ClaudeAgentOptions(allowed_tools=["Read", "Bash"])
    ):
        if hasattr(message, "result"):
            return message.result
    return ""

async def main():
    # 并行运行两个 agent
    security, performance = await asyncio.gather(
        run_security_review(),
        run_performance_review()
    )
    
    print("## Security Review\n", security)
    print("## Performance Review\n", performance)

asyncio.run(main())
```

---

到这里，你已经掌握了 Claude Code 从基础到高阶的完整体系：

- 用 `-p` 把 Claude 变成脚本工具
- 用 `--output-format json` 拿结构化输出
- 接进 CI/CD 流水线做自动审查
- 用 SDK 构建有状态的 Agent 应用
- 用多 agent 协作处理大型复杂任务

最后一章是附录——CLI 参考、配置模板、常见 FAQ，当字典用。

---

> 本文节选自《跟鬼哥玩转 Claude Code》，原文：https://luoli523.github.io/claude-code-book
