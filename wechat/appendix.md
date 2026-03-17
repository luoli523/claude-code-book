---
title: "《跟鬼哥玩转 Claude Code》附录"
author: 鬼哥
coverImage: "/Users/li.luo/dev/git/claude-code-book/originals/images/appendix/cli-reference.png"
---

> 📖 **跟鬼哥玩转 Claude Code**

# 附录

# 附录 A：CLI 命令速查表

![附录 A：CLI 命令速查表](/Users/li.luo/dev/git/claude-code-book/originals/images/appendix/cli-reference.png)


> 把这页加书签。遇到不记得的标志，来这里找。

## 启动方式

```bash
claude                    # 交互式会话（最常用）
claude -p "prompt"        # 非交互模式，直接给 prompt
claude --continue         # 续接上次会话（交互式）
claude --resume <id>      # 续接指定 session ID
claude -p "..." --continue   # 非交互模式续接
```

## 核心标志

| 标志 | 简写 | 说明 |
|------|------|------|
| `--print` | `-p` | 非交互模式，直接输出结果 |
| `--continue` | `-c` | 续接最近一次会话 |
| `--resume <id>` | | 续接指定 session ID |
| `--output-format <fmt>` | | 输出格式：`text`（默认）/ `json` / `stream-json` |
| `--json-schema <schema>` | | 强制结构化输出，配合 `--output-format json` 使用 |
| `--max-turns <n>` | | 最大工具调用轮次（控制成本） |
| `--verbose` | | 显示详细输出（工具调用、token 用量等） |
| `--include-partial-messages` | | 流式模式下包含中间消息 |

## 工具与权限控制

| 标志 | 说明 |
|------|------|
| `--allowedTools <list>` | 预先授权的工具列表（逗号分隔） |
| `--disallowedTools <list>` | 禁止使用的工具列表 |
| `--dangerously-skip-permissions` | ⚠️ 跳过所有权限确认（仅用于受控环境） |

工具名示例：
```bash
# 只允许读文件
--allowedTools "Read"

# 允许读写和 Bash（所有命令）
--allowedTools "Read,Edit,Write,Bash"

# 精细控制 Bash 子命令
--allowedTools "Read,Bash(git status *),Bash(git commit *)"
```

## System Prompt 控制

| 标志 | 说明 |
|------|------|
| `--system-prompt <text>` | 完全替换默认 system prompt |
| `--append-system-prompt <text>` | 在默认 prompt 后追加 |

```bash
# 让 Claude 以安全工程师身份工作
claude -p "Review this PR" \
  --append-system-prompt "You are a senior security engineer. Be strict."
```

## 输入/输出

| 标志 | 说明 |
|------|------|
| `--input-format <fmt>` | 输入格式：`text`（默认）/ `stream-json` |
| `--output-format <fmt>` | 输出格式：`text` / `json` / `stream-json` |

```bash
# 从 stdin 读 prompt，输出 JSON
echo "Summarize this project" | claude -p --output-format json

# Git diff 管道 + 安全角色审查
git diff HEAD~1 | claude -p \
  --append-system-prompt "Focus on security vulnerabilities only." \
  --output-format json | jq -r '.result'
```

## 配置与环境

| 标志 / 环境变量 | 说明 |
|----------------|------|
| `--config <path>` | 指定配置文件路径（覆盖默认位置） |
| `--cwd <path>` | 指定工作目录 |
| `ANTHROPIC_API_KEY` | API 密钥（CI 环境推荐） |
| `CLAUDE_CODE_USE_BEDROCK=1` | 使用 Amazon Bedrock |
| `CLAUDE_CODE_USE_VERTEX=1` | 使用 Google Vertex AI |
| `CLAUDE_CODE_USE_FOUNDRY=1` | 使用 Azure AI Foundry |

## 认证命令

```bash
claude auth login          # 登录（OAuth，开浏览器）
claude auth logout         # 退出登录
claude auth status         # 查看当前认证状态
```

## 会话内命令（交互式模式专用）

在交互式会话里输入，以 `/` 开头：

| 命令 | 说明 |
|------|------|
| `/help` | 显示帮助 |
| `/clear` | 清除对话历史 |
| `/compact` | 手动触发 context 压缩 |
| `/hooks` | 查看已配置的 hook 列表 |
| `/agents` | 查看和管理子 agent |
| `/memory` | 查看 Auto Memory 内容 |
| `/permissions` | 查看当前权限设置 |
| `/status` | 查看会话状态（token 用量等） |
| `/model <name>` | 切换模型 |
| `Esc` | 取消当前操作 |
| `Ctrl+C` | 中断 Claude（两次退出会话） |

## Plan Mode

```bash
# 命令行启动时开启 Plan Mode
claude --plan

# 交互式会话里切换
/plan on
/plan off
```

Plan Mode 下 Claude 只分析不执行——给你看计划，确认后才动手。

## 子 Agent 管理

```bash
claude agents              # 列出所有可用的子 agent
# 交互式管理：
/agents                    # 打开 agent 管理界面
```

## JSON 输出结构参考

`--output-format json` 的响应字段：

```json
{
  "result": "Claude 的回答（纯文本）",
  "session_id": "sess_abc123...",
  "cost_usd": 0.0032,
  "duration_ms": 4200,
  "num_turns": 2,
  "is_error": false,
  "structured_output": { ... }  // 仅当使用 --json-schema 时
}
```

## 常用命令组合

```bash
# 分析项目并拿 JSON 结果
claude -p "Summarize the architecture of this project" \
  --allowedTools "Read,Bash(find *)" \
  --output-format json | jq -r '.result'

# PR diff 安全审查
gh pr diff 42 | claude -p \
  --append-system-prompt "Security review only. Be concise." \
  --output-format json | jq -r '.result'

# 批量提交生成
git diff --staged | claude -p "Write a conventional commit message for these changes"

# 续接会话做深度分析
SESSION=$(claude -p "Analyze the auth module" --output-format json | jq -r '.session_id')
claude -p "Now check for security vulnerabilities in what you just analyzed" \
  --resume "$SESSION" --output-format json | jq -r '.result'
```

---

# 附录 B：配置文件模板

![附录 B：配置文件模板](/Users/li.luo/dev/git/claude-code-book/originals/images/appendix/config-templates.png)


> 开箱即用的配置模板，复制粘贴，按需改动。

---

## settings.json 模板

### 个人全局配置（`~/.claude/settings.json`）

适合放个人偏好，不针对特定项目：

```json
{
  "permissions": {
    "allow": [
      "Bash(git status)",
      "Bash(git log *)",
      "Bash(git diff *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(npm run *)",
      "Bash(yarn *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force*)"
    ]
  },
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code needs your attention\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  },
  "env": {
    "CLAUDE_TELEMETRY": "off"
  }
}
```

> **Linux 通知替代**：把 `osascript` 那行换成 `notify-send 'Claude Code' 'Needs your attention'`

---

### 项目级配置（`.claude/settings.json`）

放在项目根目录，可以提交 Git 让团队共享：

**前端项目（Node.js / React / Vue）：**

```json
{
  "permissions": {
    "allow": [
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(node *)",
      "Bash(git *)"
    ],
    "deny": [
      "Bash(npm publish)",
      "Bash(npm deprecate *)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(jq -r '.tool_input.file_path // empty'); echo \"$FILE\" | grep -qE '\\.(js|ts|jsx|tsx|css|json)$' && npx prettier --write \"$FILE\" || true"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(jq -r '.tool_input.file_path // empty'); case \"$FILE\" in *.env*|*package-lock.json*) echo \"Protected: $FILE\" >&2; exit 2;; esac"
          }
        ]
      }
    ]
  }
}
```

**Python 后端项目：**

```json
{
  "permissions": {
    "allow": [
      "Bash(python *)",
      "Bash(pip *)",
      "Bash(pytest *)",
      "Bash(black *)",
      "Bash(ruff *)",
      "Bash(git *)"
    ],
    "deny": [
      "Bash(pip install --user *)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(jq -r '.tool_input.file_path // empty'); echo \"$FILE\" | grep -q '\\.py$' && black \"$FILE\" 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

**严格安全模式（生产系统维护）：**

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ],
    "deny": [
      "Bash",
      "Edit",
      "Write"
    ]
  }
}
```

> 这个配置让 Claude 只能读文件和查 git 历史，完全不能修改任何内容——适合只想让 Claude 分析、不想让它动手的场景。

---

## CLAUDE.md 模板

### 通用 Web 项目

```markdown
# Project: [项目名]

## Tech Stack
- Runtime: Node.js 20
- Framework: Express 5
- Database: PostgreSQL (via Prisma)
- Testing: Jest + Supertest
- Linting: ESLint + Prettier

## Project Structure
- `src/` — 业务逻辑
  - `routes/` — API 路由
  - `services/` — 业务服务层
  - `models/` — 数据模型
  - `middleware/` — 中间件
- `tests/` — 测试文件（镜像 src 结构）
- `migrations/` — 数据库迁移

## Development Commands
- `npm run dev` — 启动开发服务器（热重载）
- `npm test` — 运行测试套件
- `npm run lint` — 代码检查
- `npm run db:migrate` — 运行数据库迁移

## Code Conventions
- 使用 async/await，不用 .then() 链式调用
- 错误处理统一通过 `src/middleware/errorHandler.js`
- API 响应格式：`{ success: true/false, data: ..., error: ... }`
- 变量命名：camelCase；数据库字段：snake_case
- 每个 service 函数必须有对应的单元测试

## Before Committing
1. 运行 `npm test`，确保所有测试通过
2. 运行 `npm run lint`，确保无 lint 错误
3. 检查是否有 `console.log` 遗留（应使用 logger）

## Do Not
- 不要修改 `package-lock.json`（让 npm 管理）
- 不要在代码里硬编码任何密钥或配置值（使用 .env）
- 不要直接操作数据库，通过 Prisma ORM 访问
```

---

### Python 后端项目

```markdown
# Project: [项目名]

## Tech Stack
- Python 3.12
- FastAPI + Uvicorn
- SQLAlchemy 2.0 (async)
- Alembic（数据库迁移）
- Pytest

## Project Structure
- `app/` — 主应用目录
  - `api/` — 路由和端点
  - `core/` — 配置、依赖注入
  - `models/` — SQLAlchemy 模型
  - `schemas/` — Pydantic schemas
  - `services/` — 业务逻辑
- `tests/` — 测试（镜像 app 结构）
- `alembic/` — 数据库迁移

## Commands
- `uvicorn app.main:app --reload` — 开发服务器
- `pytest` — 运行测试
- `black .` — 代码格式化
- `ruff check .` — linting
- `alembic upgrade head` — 运行迁移

## Conventions
- 所有数据库操作使用 async session
- Pydantic schemas 用于 API 层，SQLAlchemy models 用于数据库层
- 依赖注入通过 FastAPI Depends()
- 异常统一通过 `app/core/exceptions.py` 的自定义异常

## Do Not
- 不要在 schema 里直接访问数据库
- 不要在路由层写业务逻辑（放 services）
- 不要同步调用数据库（必须 async/await）
```

---

### 极简版（快速上手）

```markdown
# [项目名]

## Stack
[填入你的技术栈]

## Run & Test
- 启动：`[启动命令]`
- 测试：`[测试命令]`

## Important Conventions
- [关键约定 1]
- [关键约定 2]

## Do Not
- [禁止事项 1]
```

---

## Hook 脚本模板

以下脚本放在 `.claude/hooks/` 目录，记得 `chmod +x`。

### protect-files.sh — 敏感文件保护

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[ -z "$FILE_PATH" ] && exit 0

PROTECTED=(".env" ".env.local" ".env.production" "package-lock.json" ".git/" "*.pem" "*.key")

for pattern in "${PROTECTED[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Protected file: $FILE_PATH (matches '$pattern')" >&2
    exit 2
  fi
done

exit 0
```

### auto-format.sh — 自动格式化

```bash
#!/bin/bash
FILE_PATH=$(jq -r '.tool_input.file_path // empty')

[ -z "$FILE_PATH" ] && exit 0

# 根据文件类型选格式化工具
case "$FILE_PATH" in
  *.js|*.ts|*.jsx|*.tsx|*.css|*.json)
    npx prettier --write "$FILE_PATH" 2>/dev/null
    ;;
  *.py)
    black "$FILE_PATH" 2>/dev/null
    ;;
  *.go)
    gofmt -w "$FILE_PATH" 2>/dev/null
    ;;
esac

exit 0
```

### audit-log.sh — 操作审计日志

```bash
#!/bin/bash
INPUT=$(cat)
LOG="$HOME/.claude/audit.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
SESSION=$(echo "$INPUT" | jq -r '.session_id // "?"' | cut -c1-8)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "?"')
TARGET=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.command // ""' | head -c 80)

echo "[$TIMESTAMP] [$SESSION] $TOOL: $TARGET" >> "$LOG"
exit 0
```

---

## 子 Agent 模板

### security-reviewer.md

放在 `.claude/agents/` 或 `~/.claude/agents/`：

```markdown
---
name: security-reviewer
description: Reviews code for security vulnerabilities including SQL injection, XSS, hardcoded secrets, and insecure auth patterns. Use when asked to audit security, check for vulnerabilities, or review authentication code.
model: claude-haiku-4-5
tools:
  - Read
  - "Bash(grep *)"
  - "Bash(find *)"
---

You are a security-focused code reviewer specializing in web application security.

When reviewing code, check for:
1. SQL injection (string concatenation in queries)
2. XSS vulnerabilities (unescaped user input in HTML)
3. Hardcoded secrets, API keys, or passwords
4. Insecure authentication (weak hashing, no rate limiting)
5. Missing input validation or sanitization
6. Insecure direct object references (IDOR)

Format findings as:
- [CRITICAL/WARNING/INFO] filename:line — description — suggested fix
```

### quick-explorer.md

```markdown
---
name: quick-explorer
description: Rapidly explores and maps unfamiliar codebases. Use when asked to understand project structure, find where specific functionality lives, or get an overview of a large codebase.
model: claude-haiku-4-5
tools:
  - Read
  - "Bash(find *)"
  - "Bash(grep *)"
  - "Bash(wc *)"
---

You are a codebase navigator. When exploring a project:
1. Start with package.json / requirements.txt / go.mod to understand dependencies
2. Find the entry point (main.js, app.py, main.go, etc.)
3. Map the top-level directory structure
4. Identify key modules and their responsibilities

Be concise. Produce a structured map, not a wall of text.
```

---

# 附录 C：常见问题解答

![附录 C：常见问题解答](/Users/li.luo/dev/git/claude-code-book/originals/images/appendix/faq.png)


> 遇到问题先来这里找答案。按分类整理，Ctrl+F 搜关键词。

---

## 安装与启动

**Q：`npm install -g @anthropic-ai/claude-code` 报权限错误怎么办？**

不要用 `sudo npm install -g`，这会产生权限混乱。推荐做法：

```bash
# 方案一：用 nvm 管理 Node，自带正确权限
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
npm install -g @anthropic-ai/claude-code

# 方案二：配置 npm 全局目录到用户目录
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g @anthropic-ai/claude-code
```

---

**Q：输入 `claude` 提示 `command not found`？**

Node 全局包的 bin 目录没在 PATH 里。检查：

```bash
npm bin -g           # 看全局 bin 在哪
echo $PATH           # 看 PATH 里有没有
```

把输出的目录加到 `~/.bashrc` 或 `~/.zshrc` 的 PATH 里：

```bash
export PATH="$(npm bin -g):$PATH"
```

---

**Q：`claude auth login` 打不开浏览器怎么办？**

在远程服务器或无 GUI 环境里，浏览器打不开。解决方案：

```bash
# 本地登录拿到 API key，然后在服务器上设环境变量
export ANTHROPIC_API_KEY="sk-ant-..."

# 或者用 claude.ai 控制台生成 API key，直接配置
```

---

**Q：安装后 `claude --version` 正常，但启动就闪退？**

检查 Node 版本：

```bash
node --version   # 需要 18+，推荐 20+
```

如果版本太低，升级 Node 或用 nvm 切换版本。

---

## 认证与 API

**Q：用 claude.ai 账号登录后，为什么还是在扣 API 费用？**

Claude Code 有两种认证方式：
- **claude.ai 订阅**（Pro/Max/Team）：按订阅计费，有每月用量限制
- **API key**：按 token 量计费，无月费但要单独付费

确认你的认证方式：

```bash
claude auth status
```

---

**Q：提示 "rate limit exceeded" 怎么办？**

达到了 API 调用频率限制，等一会儿再试。或者：

- 使用 `--max-turns` 减少每次调用的工具轮次
- 避免同时运行多个 Claude 会话
- 考虑升级 API 套餐的 tier

---

**Q：在 CI 环境里认证失败？**

确保设置了环境变量，且格式正确：

```bash
# 正确
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# 常见错误：key 里有多余的引号或空格
export ANTHROPIC_API_KEY=sk-ant-api03-...  # 也可以不加引号
```

GitHub Actions 里：

```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

确认 Secret 名称拼写完全一致（区分大小写）。

---

## Context 与 Token

**Q：对话进行到一半，Claude 突然"忘记"了之前说的事？**

Context window 满了，触发了自动压缩（compaction）。压缩会保留摘要，但细节会丢失。

预防方法：
- 用 CLAUDE.md 把关键信息固化，不依赖对话历史
- 开启 Auto Memory（`/memory`），让 Claude 把重要内容写进记忆文件
- 手动 `/compact` 触发压缩，在关键时刻前主动压缩

---

**Q：怎么知道当前 token 用了多少？**

```
/status
```

会显示当前会话的 token 用量、context window 占用百分比等。

---

**Q：CLAUDE.md 太长了，会不会影响性能？**

会的。CLAUDE.md 在每次对话开始时都会完整加载进 context。建议：
- 控制在 500 行以内
- 删掉不常用的部分，按需加回来
- 用 `@import` 引用子文件（按需加载）

---

**Q：`@文件名` 引用的文件没有被 Claude 读到？**

检查：
- 文件路径是否正确（相对于当前工作目录）
- 文件是否在 `.gitignore` 里（`.gitignore` 的文件会被跳过）
- 文件大小是否超限（单文件有大小限制）

---

## 权限与工具

**Q：每次都要手动确认工具使用，很烦，怎么预先授权？**

三种方式，灵活度递增：

```bash
# 1. 启动时通过标志授权（一次性）
claude -p "..." --allowedTools "Read,Edit,Bash(git *)"

# 2. 在 settings.json 里配置（持久）
{
  "permissions": {
    "allow": ["Bash(git *)", "Bash(npm run *)"]
  }
}

# 3. 会话中输入 /permissions 调整
```

---

**Q：Claude 修改了我不想让它动的文件怎么办？**

事后用 git 恢复：

```bash
git diff          # 看改了什么
git checkout -- src/that-file.js  # 恢复单个文件
git restore .     # 恢复所有未提交的修改
```

事前用 `settings.json` 的 `permissions.deny` 或 PreToolUse hook 保护文件（见附录 B）。

---

**Q：`--dangerously-skip-permissions` 安全吗？**

这个标志跳过所有权限确认，Claude 可以不受限制地读写文件、执行命令。**仅在以下场景使用**：
- 受控的 Docker 容器里
- 没有敏感文件的临时测试环境
- 完全了解风险且接受后果

不要在本机日常使用加这个标志。

---

## 功能使用

**Q：Plan Mode 里 Claude 给了计划，我同意了，但它又问了一遍？**

Plan Mode 下需要明确告诉 Claude "go ahead" 或 "proceed"——含糊的回复它可能当作继续讨论。试试：

```
Yes, proceed with the plan.
```

或者直接：

```
Go ahead.
```

---

**Q：自定义 slash 命令写好了，但 Claude 不执行，只是解释了一下？**

检查命令文件：
- 文件在 `.claude/commands/` 目录里（项目级）或 `~/.claude/commands/`（全局）
- 文件扩展名是 `.md`
- 文件名就是命令名（`review-pr.md` → `/review-pr`）

常见问题：命令文件的 prompt 太模糊，Claude 不知道要做什么。在命令文件里写明具体步骤。

---

**Q：MCP 服务器连接失败怎么排查？**

```bash
# 检查 MCP 服务器是否正确启动
claude mcp list

# 查看详细错误
claude --debug mcp list

# 手动测试 MCP 服务器
npx @modelcontextprotocol/inspector <server-command>
```

常见原因：
- `command` 路径写错（用绝对路径试试）
- MCP server 的依赖没装
- 服务器端口被占用（HTTP 类 MCP）

---

**Q：Hook 配置了但没有效果？**

排查清单：

```bash
# 1. 验证 JSON 格式
jq . ~/.claude/settings.json
jq . .claude/settings.json

# 2. 查看 hook 是否被读取
/hooks    # 在 Claude Code 会话里输入

# 3. 检查脚本权限
ls -la .claude/hooks/
chmod +x .claude/hooks/*.sh

# 4. 手动测试脚本
echo '{"tool_name":"Edit","tool_input":{"file_path":"test.js"}}' | .claude/hooks/your-script.sh
echo "Exit code: $?"
```

---

## 网络与代理

**Q：公司网络要走代理，Claude Code 怎么配置？**

```bash
export HTTPS_PROXY="http://proxy.company.com:8080"
export HTTP_PROXY="http://proxy.company.com:8080"
export NO_PROXY="localhost,127.0.0.1"
```

加到 shell 配置文件（`~/.bashrc` / `~/.zshrc`）让它持久生效。

---

**Q：连接 Anthropic API 超时？**

可能是网络问题，也可能是防火墙拦截了 `api.anthropic.com`。

```bash
# 测试连通性
curl -v https://api.anthropic.com/v1/models \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

如果公司网络有限制，考虑配置代理或使用 Amazon Bedrock / Google Vertex AI 作为替代后端。

---

## 成本控制

**Q：怎么知道我用了多少钱？**

- **交互模式**：`/status` 查看当前会话用量
- **非交互模式**：`--output-format json` 的响应里有 `cost_usd` 字段
- **控制台**：[console.anthropic.com](https://console.anthropic.com) 查看历史用量和账单

---

**Q：用量超预期怎么控制？**

```bash
# 限制工具调用轮次
claude -p "..." --max-turns 3

# 只做分析，不让 Claude 读整个项目
claude -p "Review src/auth.js" --allowedTools "Read"

# 使用更小的模型做简单任务（在 settings.json 里配置）
```

---

**Q：团队使用，怎么控制每人的用量？**

- 申请企业账号，在 Anthropic 控制台里设置用量限额
- 或者用 Amazon Bedrock / Vertex AI 部署，利用云平台的成本控制工具

---

*还有其他问题？去 [官方文档](https://code.claude.com/docs) 或 [Discord 社区](https://discord.com/invite/anthropic) 找答案。*

---

# 附录 D：推荐资源

![附录 D：推荐资源](/Users/li.luo/dev/git/claude-code-book/originals/images/appendix/resources.png)


> 读完这本书，接下来去哪里继续学？

---

## 官方文档

这是最权威的资料，遇到新功能或行为不确定时，第一时间来这里查。

| 资源 | 链接 | 说明 |
|------|------|------|
| Claude Code 主文档 | [code.claude.com/docs](https://code.claude.com/docs) | 完整文档，持续更新 |
| CLI 参考 | [/en/cli-reference](https://code.claude.com/docs/en/cli-reference) | 所有命令和标志的完整列表 |
| Hooks 参考 | [/en/hooks](https://code.claude.com/docs/en/hooks) | Hook 事件的完整 schema |
| MCP 协议规范 | [modelcontextprotocol.io](https://modelcontextprotocol.io) | MCP 的官方协议文档 |
| Agent SDK 文档 | [platform.claude.com/docs/en/agent-sdk](https://platform.claude.com/docs/en/agent-sdk/overview) | Python/TypeScript SDK 完整文档 |
| Anthropic 控制台 | [console.anthropic.com](https://console.anthropic.com) | API key 管理、用量查看、账单 |

---

## 官方 GitHub 仓库

```bash
# Claude Code 示例和最佳实践
https://github.com/anthropics/claude-code

# Agent SDK 示例 Agent 合集
https://github.com/anthropics/claude-agent-sdk-demos

# MCP 服务器官方示例
https://github.com/modelcontextprotocol/servers

# Claude Code Action（GitHub Actions 集成）
https://github.com/anthropics/claude-code-action
```

---

## 社区

**官方 Discord**
加入 [Anthropic Discord](https://discord.com/invite/anthropic)，有专门的 Claude Code 频道。遇到 bug、新功能讨论、奇技淫巧分享，这里最快。

**Reddit**
[r/ClaudeAI](https://reddit.com/r/ClaudeAI) —— 用户经验分享，包括 Claude Code 的实战用法。

**X / Twitter**
关注 [@AnthropicAI](https://twitter.com/AnthropicAI) 获取新功能发布通知。

---

## 精选 MCP 服务器

MCP 的生态正在快速发展。以下是目前最常用的几个：

| 服务器 | 功能 | 适合场景 |
|--------|------|----------|
| `@modelcontextprotocol/server-filesystem` | 文件系统访问 | 跨目录操作 |
| `@modelcontextprotocol/server-github` | GitHub API | PR、Issue、代码搜索 |
| `@modelcontextprotocol/server-postgres` | PostgreSQL | 数据库查询分析 |
| `@modelcontextprotocol/server-sqlite` | SQLite | 本地数据库 |
| `@modelcontextprotocol/server-brave-search` | Brave 搜索 | 网页搜索 |
| `@modelcontextprotocol/server-puppeteer` | 浏览器自动化 | 爬虫、测试 |
| `@modelcontextprotocol/server-slack` | Slack | 发消息、查频道 |

完整列表：[github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

---

## 进阶阅读

**理解 AI Agent 架构**

- [Building effective agents](https://anthropic.com/research/building-effective-agents)（Anthropic 官方博客）——理解 agent loop 的设计思想，对用好 Claude Code 很有帮助

**Prompt 工程**

- [Anthropic Prompt Engineering Guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)——怎么写出更好的 prompt，直接影响 Claude Code 的输出质量

**MCP 深度理解**

- [MCP 规范](https://spec.modelcontextprotocol.io)——如果你想自己写 MCP server，从这里开始
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

## 配套工具

这些工具和 Claude Code 配合使用效果很好：

**Git 工具**
- [GitHub CLI (`gh`)](https://cli.github.com/) —— 在命令行管理 PR、Issue，和 `claude -p` 搭配实现自动化
- [lazygit](https://github.com/jesseduffield/lazygit) —— 终端里的 git TUI，让你快速 review Claude 的改动

**代码格式化**
- [Prettier](https://prettier.io/) —— 最常见的 PostToolUse hook 配套工具
- [ESLint](https://eslint.org/) / [Ruff](https://docs.astral.sh/ruff/) —— 代码质量检查

**终端增强**
- [jq](https://jqlang.github.io/jq/) —— 处理 Claude Code JSON 输出的必备工具
- [fzf](https://github.com/junegunn/fzf) —— 模糊搜索，和 claude 脚本配合使用体验很好

---

## 版本追踪

Claude Code 更新很快，新功能经常出现。追踪更新的方式：

```bash
# 查看当前版本
claude --version

# 更新到最新版
npm update -g @anthropic-ai/claude-code

# 查看 changelog
# https://code.claude.com/docs/en/changelog
```

建议每隔两周更新一次，避免用到已废弃的功能。

---

## 反馈与贡献

发现这本书有错误，或者想补充新内容？

- 到书的 GitHub 仓库提 Issue 或 PR
- 加入社区讨论

Claude Code 的生态还在快速成长，最好的学习方式是动手用——打开终端，找个真实项目，开始和 Claude 对话。

> *工具是死的，用法是活的。最好的实践，来自你在真实项目里踩过的那些坑。*

---

> 本文节选自《跟鬼哥玩转 Claude Code》，原文：https://luoli523.github.io/claude-code-book
