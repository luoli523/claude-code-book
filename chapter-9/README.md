# 第九章：SDK 与编程化控制

> 从"聊天工具"到"可编程组件"——把 Claude Code 嵌进你的工作流、脚本和 CI 流水线。

大多数人用 Claude Code 的方式是：打开终端，输入需求，等结果，来回对话。这没有问题，但 Claude Code 的能力远不止于此。

它还可以：
- 作为一个**命令行工具**，被其他脚本调用
- 接收 stdin 输入，把结果输出成结构化 JSON
- 嵌进 GitHub Actions，在 PR 触发时自动运行
- 通过 Python/TypeScript SDK 完全编程化控制
- 被分解成多个**子 agent**，并行处理复杂任务

这一章，我们系统地把这些玩法都走一遍。

## 本章内容

| 章节 | 内容 |
|------|------|
| [9.1 非交互模式（-p 标志）](./9.1-headless-mode.md) | `-p` 的基本用法、管道、会话续接 |
| [9.2 结构化输出](./9.2-structured-output.md) | JSON Schema 输出、jq 解析、流式响应 |
| [9.3 在 CI/CD 中使用](./9.3-cicd.md) | GitHub Actions 集成、认证、成本控制 |
| [9.4 Python / TypeScript SDK](./9.4-sdk.md) | SDK 安装与调用、流式输出、批处理脚本 |
| [9.5 构建 AI Agent 团队](./9.5-agent-teams.md) | 子 agent 配置、内置 agent、Orchestrator 模式 |

## 什么时候用编程化模式？

| 场景 | 推荐方式 |
|------|----------|
| 一次性任务，需要快速结果 | 交互式 CLI |
| 脚本里调用 Claude 做分析 | `claude -p` |
| CI 流水线里自动审查代码 | `claude -p` + GitHub Actions |
| 需要结构化 JSON 输出 | `--output-format json` |
| 复杂多步骤自动化 | Python/TypeScript SDK |
| 并行处理多个子任务 | Sub-agents |
