# 第八章：Hooks 深度指南

> 给 Claude 装上"绊绳"——它每动一步，都可以触发你的规则。

你有没有遇到过这种情况：

- Claude 帮你改了代码，但格式乱得一塌糊涂，你还要手动跑一遍 `prettier`
- Claude 在你不注意的时候悄悄修改了 `.env` 文件
- Claude 花了 5 分钟写代码，你在旁边干等，完全不知道它搞定了没有

这些问题，**Hooks** 都能解决。

## 什么是 Hooks？

Hooks 是你在 Claude Code 生命周期关键节点插入的"钩子"——本质上就是 shell 命令，但能精确控制**什么时候运行**、**针对什么工具**。

```
用户发送 prompt
      ↓
UserPromptSubmit hook（可拦截）
      ↓
Claude 决定调用工具
      ↓
PreToolUse hook（可阻止）
      ↓
工具实际执行（写文件、运行命令...）
      ↓
PostToolUse hook（可后处理）
      ↓
Claude 完成响应
      ↓
Stop hook（可执行收尾动作）
```

不像 CLAUDE.md 是"建议"，Hooks 是**确定性的**——不管 Claude 有没有心情，只要触发条件满足，hook 就会执行。

## 本章内容

| 章节 | 内容 |
|------|------|
| [8.1 Hooks 的设计哲学](./8.1-philosophy.md) | 为什么需要 Hooks，确定性 vs 概率性 |
| [8.2 Hook 事件类型详解](./8.2-event-types.md) | 四大事件：PreToolUse / PostToolUse / Notification / Stop |
| [8.3 编写第一个 Hook](./8.3-first-hook.md) | 从零配置，实战 prettier 自动格式化 |
| [8.4 实战案例集](./8.4-examples.md) | 文件保护、危险命令拦截、任务通知、自动提交 |
| [8.5 常见错误与调试](./8.5-debugging.md) | 排查 Hook 不生效的完整清单 |

## 适合谁读？

- 想把 Claude Code 深度整合进开发流程的工程师
- 需要在团队中统一 Claude 行为规范的 Tech Lead
- 对"AI 自动化"上瘾、想把重复工作彻底消灭的人

> **注意**：Hooks 执行的是真实 shell 命令，有一定安全风险。不要在 hook 里运行来路不明的脚本，也不要把 hook 配置提交到公开仓库（除非内容完全安全）。
