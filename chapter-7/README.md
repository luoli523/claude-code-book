# 第七章：GitHub 工作流集成

前几章的 Claude Code 都在你的本地电脑上工作——你启动它，它帮你干活。

这一章换个角度：**让 Claude Code 住进你的 GitHub 仓库，自动参与每一个 PR 和 Issue。**

不需要你手动触发，不需要你开着终端。有人提了 Issue，Claude 自动去实现；有人发了 PR，Claude 自动去 review；半夜跑完的 CI 失败了，Claude 自动去分析原因。

这是从"工具"到"团队成员"的跨越。

---

## 本章内容

- [7.1 认识 Claude Code GitHub Actions](./7.1-github-actions-intro.md)
- [7.2 安装与配置](./7.2-setup.md)
- [7.3 自动代码审查](./7.3-code-review.md)
- [7.4 Issue 驱动开发](./7.4-issue-driven.md)
- [7.5 高级 Workflow 配置](./7.5-advanced-workflows.md)

## 本章结束后，你能做到

- 在 GitHub 仓库里安装并配置 Claude Code Actions
- 让每个 PR 自动获得 AI 代码审查
- 用 `@claude` 在 Issue 里触发功能实现
- 配置定时任务和多种触发条件
