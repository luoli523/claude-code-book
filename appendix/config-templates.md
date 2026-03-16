# 附录 B：配置文件模板

![附录 B：配置文件模板](/images/appendix/config-templates.png)


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
