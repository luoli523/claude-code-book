# 附录 D：推荐资源

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
