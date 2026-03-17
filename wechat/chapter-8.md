---
title: "《跟鬼哥玩转 Claude Code》第八章：Hooks 深度指南"
author: 鬼哥
coverImage: "/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-8/8.1-philosophy.png"
---

> 📖 **跟鬼哥玩转 Claude Code**

# 第八章：Hooks 深度指南

# 8.1 Hooks 的设计哲学

![8.1 Hooks 的设计哲学](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-8/8.1-philosophy.png)


## AI 是概率性的，这是它的本质

你在 CLAUDE.md 里写："提交前必须跑 lint"。

Claude Code 看到这条规则，大概率会遵守。但"大概率"不是"一定"——它可能判断某次提交太小不值得跑，可能上下文太长忘记了这条规则，可能就是出了个什么幺蛾子。

这不是 bug，这是 LLM 的本质特性：**它是概率性的，不是确定性的。**

对于"写出好代码"这类任务，概率性没问题——偶尔的小偏差你 review 一下就发现了。

但对于"提交前必须跑 lint"、"不能修改 .env 文件"、"每次文件改动都要记录日志"这类**必须百分之百执行的规则**，概率性就不够用了。

**这就是 Hooks 存在的理由。**

---

## Hooks 是确定性的

Hook 是一个 shell 命令，在 Claude Code 的生命周期特定时间点**强制执行**。

不管 AI 做了什么判断，不管上下文里有没有相关规则，**只要事件触发，Hook 就跑**。

Claude Code 不能"选择"不执行 Hook，就像你的 git pre-commit hook 不管你愿不愿意都会跑一样。

---

## 三种机制的本质区别

学到这里，你手里有三种影响 Claude Code 行为的方式，它们的本质完全不同：

| 机制 | 本质 | 可靠性 |
|------|------|-------|
| **CLAUDE.md** | 给 AI 看的文字指令 | 概率性，AI 可能不遵守 |
| **Skills** | 给 AI 看的工作流程 | 概率性，AI 可能走偏 |
| **Hooks** | 强制执行的 shell 脚本 | 确定性，一定执行 |

不是说 CLAUDE.md 和 Skills 没用——它们对于引导 AI 的判断非常有效。但**对于不允许出错的规则，只有 Hooks 才能真正保证**。

---

## 什么时候用 Hooks

**用 Hooks 的场景：**

- ✅ 必须 100% 执行的操作（格式化、lint、保护文件）
- ✅ 和 AI 判断无关的纯机械操作（记录日志、发通知）
- ✅ 安全边界（阻止某些危险操作）
- ✅ 上下文压缩后的信息恢复

**不需要用 Hooks 的场景：**

- ❌ 需要 AI 判断的操作（"如果代码质量差就拒绝提交"——这需要理解，不是规则）
- ❌ 偶尔为之的任务（一次性的操作用 Skill 就够了）
- ❌ 已经用 CLAUDE.md 写了且 AI 一直遵守的规则（没必要重复保障）

---

## 一个帮助判断的问题

每次考虑要不要写 Hook 时，问自己：

> **"如果 Claude Code 这次没做这件事，会发生什么严重后果？"**

如果答案是"会有 bug 漏进代码库"、"敏感文件可能被修改"、"团队收不到通知"——写 Hook。

如果答案是"有点不方便，但不严重"——CLAUDE.md 就够了。

---

下一节，我们来看 Hooks 的四种事件类型，以及如何用它们控制 Claude Code 的每个关键时间点。

---

# 8.2 Hook 事件类型详解

![8.2 Hook 事件类型详解](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-8/8.2-event-types.png)


## 四个时间点，四种控制方式

Claude Code 提供四个 Hook 事件，覆盖了会话的关键时间点：

```
会话开始
    ↓
[SessionStart Hook]
    ↓
Claude 决定调用某个工具
    ↓
[PreToolUse Hook] ← 可以在这里阻止
    ↓
工具执行
    ↓
[PostToolUse Hook] ← 可以在这里处理结果
    ↓
Claude 等待你输入
    ↓
[Notification Hook] ← 可以在这里发通知
```

---

## PreToolUse — 工具调用前拦截

**触发时机：** Claude Code 准备调用一个工具，但还没调用

**最强大的事件**，因为你可以在这里：
- 检查工具参数，决定是否允许执行
- 修改传入的参数（通过 stdout 输出新参数）
- **直接阻止这次工具调用**（exit code 2）

**Hook 收到的 JSON 输入（通过 stdin）：**

```json
{
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "old_string": "...",
    "new_string": "..."
  }
}
```

**常见用途：**
- 阻止修改 `.env`、`package-lock.json` 等敏感文件
- 阻止运行危险命令（`rm -rf`、`git push --force`）
- 记录每次文件修改的审计日志

---

## PostToolUse — 工具调用后处理

**触发时机：** 工具执行完毕之后

**收到的 JSON 输入：**

```json
{
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/path/to/file.ts"
  },
  "tool_response": {
    "success": true
  }
}
```

**常见用途：**
- 文件修改后自动格式化（Prettier、gofmt、black）
- 文件修改后自动运行相关测试
- 记录操作日志

---

## Notification — 等待输入时触发

**触发时机：** Claude Code 完成了一段工作，正在等待你的输入或确认

**常见用途：**
- 发桌面通知（你离开了屏幕，它做完了叫你回来看）
- 发 Slack 消息
- 播放提示音

这个 Hook 没有 JSON 输入，不需要解析参数，只是一个"叫你回来"的信号。

---

## SessionStart — 会话开始时触发

**触发时机：** 两种情况
1. 新会话启动时
2. 上下文压缩（compaction）完成后恢复时

**重要：** 上下文压缩会丢失对话历史，但 SessionStart Hook 可以在压缩后自动重新注入关键信息。

**常见用途：**
- 压缩后重新注入关键上下文（"这是一个 TypeScript 项目，不要用 any"）
- 会话开始时打印项目状态摘要
- 检查环境变量是否设置正确

---

## Hook 配置格式

所有 Hook 配置都写在 `settings.json` 里：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "你的脚本命令"
          }
        ]
      }
    ],
    "PostToolUse": [...],
    "Notification": [...],
    "SessionStart": [...]
  }
}
```

**`matcher` 字段：** 用正则或工具名过滤，只对匹配的工具触发
- `"Edit|Write"`：只对文件编辑/写入触发
- `"Bash"`：只对命令执行触发
- `""`（空字符串）：对所有工具触发

---

## Exit Code 的含义

Hook 脚本的退出码决定了 Claude Code 的行为：

| Exit Code | 含义 | 适用事件 |
|-----------|------|---------|
| `0` | 成功，继续执行 | 所有事件 |
| `2` | **阻止这次操作** | 只有 PreToolUse |
| 其他非零值 | 报告错误，但继续执行 | 所有事件 |

Exit code 2 是最关键的——它让你的 Hook 有能力说"不"。

**用 stderr 给 Claude 解释原因：**

```bash
echo "Blocked: .env files cannot be modified" >&2
exit 2
```

Claude Code 会把 stderr 的内容告诉 AI，让它知道为什么被阻止，从而调整方案。

---

下一节，动手写几个真实可用的 Hook。

---

# 8.3 编写第一个 Hook

![8.3 编写第一个 Hook](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-8/8.3-first-hook.png)


## 从最简单的开始：桌面通知

这个 Hook 做一件事：当 Claude Code 完成工作、在等你输入的时候，发一个桌面通知。

为什么先从这个开始？因为它：
- 不涉及文件操作，不会有副作用
- 能立刻看到效果，验证 Hook 是否生效
- 三个平台的命令都不一样，顺便演示怎么处理跨平台

---

## 配置文件在哪里

Hook 配置写在 `~/.claude/settings.json`（用户级，所有项目共享）或 `.claude/settings.json`（项目级）。

如果文件不存在，新建一个：

```bash
mkdir -p ~/.claude
touch ~/.claude/settings.json
```

---

## 桌面通知 Hook

打开 `~/.claude/settings.json`，添加：

**macOS：**

```json
{
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
  }
}
```

**Linux（需要 `libnotify-bin`）：**

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "notify-send 'Claude Code' 'Claude Code needs your attention'"
          }
        ]
      }
    ]
  }
}
```

**Windows（PowerShell）：**

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell.exe -Command \"[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('Claude Code needs your attention', 'Claude Code')\""
          }
        ]
      }
    ]
  }
}
```

保存之后，新启动一个 Claude Code 会话，让它做点什么，然后离开屏幕去喝杯水——做完了你就会收到通知。

---

## 验证 Hook 已生效

在 Claude Code 会话里输入：

```
/hooks
```

会打开一个交互式界面，显示所有已配置的 Hook 事件和对应的命令。找到 `Notification`，确认你的命令在列表里。

---

## 第二个 Hook：自动格式化

文件改完自动跑 Prettier，不用再手动格式化。

这个 Hook 用到了 `jq` 来解析 JSON 输入（从 stdin 读取工具参数）——确认安装了：

```bash
# macOS
brew install jq

# Ubuntu/Debian
apt-get install jq
```

在 `.claude/settings.json`（项目级）里添加：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs -I {} sh -c 'npx prettier --write \"{}\" 2>/dev/null || true'"
          }
        ]
      }
    ]
  }
}
```

这个 Hook 在每次 `Edit` 或 `Write` 工具调用后触发，从 JSON 里提取文件路径，传给 Prettier 格式化。

**注意末尾的 `|| true`**：Prettier 对不支持的文件类型会报错，加上 `|| true` 确保 Hook 不会因为 Prettier 报错而让整个操作失败。

---

## 如果你有多个 Hook 事件

同一个 `settings.json` 里可以配置多个事件，合并到一个 `hooks` 对象里：

```json
{
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
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs -I {} sh -c 'npx prettier --write \"{}\" 2>/dev/null || true'"
          }
        ]
      }
    ]
  }
}
```

不要创建两个分开的 `hooks` 字段——JSON 里重复的键只有最后一个生效。

---

下一节，更复杂的实战案例：保护敏感文件、审计日志、上下文重注入。

---

# 8.4 实战案例集

![8.4 实战案例集](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-8/8.4-examples.png)


## 案例一：保护敏感文件

`.env` 文件、`package-lock.json`、数据库迁移文件——这些你永远不想让 AI 随手改掉。

**思路：** 用 `PreToolUse` 拦截 `Edit` 和 `Write`，检查目标文件路径，如果命中黑名单就 exit 2 阻止。

**第一步：创建保护脚本**

```bash
mkdir -p .claude/hooks
cat > .claude/hooks/protect-files.sh << 'EOF'
#!/bin/bash

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# 如果没有 file_path（比如不是文件操作工具），直接放行
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# 受保护的文件模式
PROTECTED_PATTERNS=(
  ".env"
  ".env.local"
  ".env.production"
  "package-lock.json"
  "yarn.lock"
  ".git/"
  "db/migrations/"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "🔒 Blocked: '$FILE_PATH' matches protected pattern '$pattern'" >&2
    echo "If you need to modify this file, please do it manually." >&2
    exit 2
  fi
done

exit 0
EOF

chmod +x .claude/hooks/protect-files.sh
```

**第二步：注册 Hook**

在 `.claude/settings.json` 里添加：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh"
          }
        ]
      }
    ]
  }
}
```

`$CLAUDE_PROJECT_DIR` 是 Claude Code 自动设置的环境变量，指向项目根目录。

**效果：** 当 Claude Code 尝试修改 `.env` 文件时，会被阻止，并收到一条解释——然后它会想别的办法，或者告诉你"这个操作需要你手动做"。

---

## 案例二：上下文压缩后重注入关键信息

长会话里，上下文压缩（compaction）会把对话历史摘要化，细节会丢失。如果你有一些"无论如何 Claude 都必须知道"的信息，可以用 `SessionStart` Hook 在压缩后重新注入。

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "cat .claude/critical-context.md"
          }
        ]
      }
    ]
  }
}
```

Hook 脚本输出到 stdout 的内容，会被自动注入到 Claude Code 的上下文里。

创建 `.claude/critical-context.md`：

```markdown
# 关键上下文（压缩后恢复）

## 当前任务
正在重构支付模块，目标是把 Stripe 和 PayPal 分离成独立的 Strategy 类。

## 绝对不能做的
- 不要修改 PaymentService 的公共接口（有 15 个调用方）
- 不要改 src/types/payment.ts 里的类型定义（等重构完再统一更新）

## 当前进度
- [x] 创建了 PaymentStrategy 接口
- [x] 实现了 StripeStrategy
- [ ] 还没实现 PayPalStrategy
- [ ] 还没更新 PaymentService 使用新的 Strategy
```

压缩发生后，这些关键信息会立刻重新出现在上下文里，Claude Code 不会"忘记"任务状态。

---

## 案例三：审计日志

记录 Claude Code 的每次文件改动——什么时候改了哪个文件，原始内容是什么。

```bash
cat > .claude/hooks/audit-log.sh << 'EOF'
#!/bin/bash

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // "N/A"')
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# 追加到审计日志
echo "[$TIMESTAMP] $TOOL -> $FILE" >> .claude/audit.log

exit 0
EOF

chmod +x .claude/hooks/audit-log.sh
```

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/audit-log.sh"
          }
        ]
      }
    ]
  }
}
```

`.claude/audit.log` 会记录：

```
[2026-03-15 20:30:12] Edit -> src/services/PaymentService.ts
[2026-03-15 20:30:45] Bash -> N/A
[2026-03-15 20:31:03] Write -> src/services/StripeStrategy.ts
```

把 `audit.log` 加进 `.gitignore`，不进版本控制。

---

## 案例四：提交前自动跑 Lint

在 Claude Code 执行 `git commit` 之前，强制跑 lint。

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'CMD=$(echo \"$1\" | jq -r \".tool_input.command\"); if [[ \"$CMD\" == git\\ commit* ]]; then npm run lint || (echo \"Lint failed. Fix errors before committing.\" >&2; exit 2); fi' -- "
          }
        ]
      }
    ]
  }
}
```

这个 Hook 检查 Bash 工具要执行的命令，如果是 `git commit` 开头的，就先跑 lint，失败了就阻止提交。

> 💡 复杂的逻辑建议写成独立的 shell 脚本，而不是把所有命令塞在一行 JSON 里，可读性差很多。

---

## 案例五：完成任务后通知 Slack

Claude Code 完成一段工作在等你的时候，自动往 Slack 发条消息：

```bash
cat > ~/.claude/hooks/slack-notify.sh << 'EOF'
#!/bin/bash

# 需要设置 SLACK_WEBHOOK_URL 环境变量
if [ -z "$SLACK_WEBHOOK_URL" ]; then
  exit 0
fi

curl -s -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-type: application/json' \
  -d "{\"text\": \"🤖 Claude Code needs your attention in: $(pwd)\"}" \
  > /dev/null

exit 0
EOF

chmod +x ~/.claude/hooks/slack-notify.sh
```

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/slack-notify.sh"
          }
        ]
      }
    ]
  }
}
```

在 `~/.zshrc` 里设置环境变量：

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxx/yyy/zzz"
```

---

## 脚本放哪里最好

| 位置 | 适合什么 |
|------|---------|
| `.claude/hooks/` | 项目级，进版本控制，团队共享 |
| `~/.claude/hooks/` | 用户级，个人所有项目使用 |

脚本文件记得加执行权限：

```bash
chmod +x .claude/hooks/your-hook.sh
```

这是最常见的"Hook 不执行"原因之一，下一节会详细讲调试方法。

---

# 8.5 常见错误与调试

![8.5 常见错误与调试](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-8/8.5-debugging.png)


## Hook 不生效？先过这个清单

Hook 写完发现没有反应，90% 的情况是以下几个原因之一。

---

## 问题一：脚本没有执行权限

最常见的问题，没有之一。

```bash
# 检查权限
ls -la .claude/hooks/

# 应该看到 -rwxr-xr-x，如果是 -rw-r--r-- 就说明没有执行权限
# 修复：
chmod +x .claude/hooks/your-hook.sh
```

---

## 问题二：`jq` 没有安装

很多 Hook 脚本用 `jq` 解析 JSON 输入，如果没装，脚本会悄悄失败。

```bash
# 检查是否安装
which jq

# 安装
brew install jq          # macOS
apt-get install jq       # Ubuntu/Debian
```

---

## 问题三：settings.json 格式错误

JSON 格式错误会导致整个配置不加载，所有 Hook 都不生效。

```bash
# 验证 JSON 格式是否正确
cat ~/.claude/settings.json | jq .

# 如果报错，说明有格式问题
# 常见错误：多了/少了逗号，引号不匹配，嵌套括号不对
```

---

## 问题四：`matcher` 没匹配上

Hook 有 `matcher` 字段，只有工具名匹配的调用才会触发。

```bash
# 检查你的 matcher 是否正确
# "Edit|Write" 匹配 Edit 和 Write 工具
# "Bash" 匹配 Bash 工具
# "" 空字符串匹配所有工具

# 临时改成空字符串测试是否是 matcher 问题
```

---

## 用 `/hooks` 命令检查配置

在 Claude Code 会话里输入：

```
/hooks
```

会打开一个交互式界面，显示所有已加载的 Hook：
- 事件类型
- matcher
- 命令内容
- 来自哪个 settings.json 文件

如果你的 Hook 没有出现在列表里，说明配置没有被正确加载（通常是 JSON 格式错误或文件路径问题）。

---

## 用 stderr 输出调试信息

Hook 脚本输出到 stderr 的内容，Claude Code 会直接展示出来（和 AI 的对话一起显示）。

在脚本里加调试输出：

```bash
#!/bin/bash

# 调试：打印收到的完整输入
INPUT=$(cat)
echo "DEBUG: received input: $INPUT" >&2

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
echo "DEBUG: file_path = $FILE_PATH" >&2

# ... 实际逻辑
```

确认问题修复后删掉这些 `echo` 行。

---

## Hook 超时

默认情况下，如果 Hook 脚本运行超过 60 秒，Claude Code 会超时并继续执行（不会等 Hook 完成）。

如果你的 Hook 需要更长时间（比如调用一个慢速的外部 API），考虑改成异步模式——让脚本后台执行，立刻返回：

```bash
#!/bin/bash

# 后台执行慢速操作，立刻返回
{
  # 这里是慢速操作
  curl -s "https://slow-api.example.com/notify" > /dev/null 2>&1
} &

exit 0   # 立刻返回，不等后台任务
```

---

## 手动测试 Hook 脚本

不用在 Claude Code 里触发，可以直接在终端手动测试脚本：

```bash
# 模拟 PreToolUse 的输入，测试文件保护脚本
echo '{"tool_name": "Edit", "tool_input": {"file_path": "/project/.env"}}' \
  | .claude/hooks/protect-files.sh

echo "Exit code: $?"   # 应该是 2（被阻止）
```

```bash
# 测试放行的情况
echo '{"tool_name": "Edit", "tool_input": {"file_path": "/project/src/app.ts"}}' \
  | .claude/hooks/protect-files.sh

echo "Exit code: $?"   # 应该是 0（放行）
```

这样可以在不启动 Claude Code 的情况下，快速验证脚本逻辑是否正确。

---

## 一个检查清单

Hook 不工作时，按这个顺序排查：

```
□ 脚本文件有执行权限（chmod +x）
□ settings.json 是合法的 JSON（jq . 验证）
□ /hooks 命令里能看到这个 Hook
□ matcher 设置正确（临时改成 "" 测试）
□ jq 已安装（如果脚本用了 jq）
□ 手动测试脚本能正确执行（echo "..." | ./script.sh）
□ 脚本的 shebang 行正确（#!/bin/bash）
□ 脚本路径是绝对路径或用了 $CLAUDE_PROJECT_DIR
```

---

## 第八章小结

Hooks 是 Claude Code 里最"硬核"的部分，也是最可靠的部分：

- **设计哲学**：LLM 是概率性的，Hooks 提供确定性保障
- **四个事件**：Pre/PostToolUse 处理工具调用，Notification 发通知，SessionStart 恢复上下文
- **Exit code 2**：PreToolUse 里用它阻止危险操作
- **stderr**：给 Claude Code 解释为什么阻止，让它调整方案

从通知开始，一个一个加——每加一个都是对你工作流的一次加固。

下一章，最后一个主题：用 SDK 把 Claude Code 嵌进你的脚本和 CI/CD 流程。

---

> 本文节选自《跟鬼哥玩转 Claude Code》，原文：https://luoli523.github.io/claude-code-book
