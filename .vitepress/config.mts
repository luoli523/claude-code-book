import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/claude-code-book/',
  title: 'Claude Code 实战指南',
  description: '从零到精通 Anthropic Claude Code — 面向开发者的完整参考书',
  lang: 'zh-CN',

  themeConfig: {
    logo: '🤖',
    nav: [
      { text: '开始阅读', link: '/preface' },
      { text: '官方文档', link: 'https://code.claude.com/docs' },
      { text: 'GitHub', link: 'https://github.com' },
    ],

    sidebar: [
      {
        text: '前言',
        items: [
          { text: '关于本书', link: '/README' },
          { text: '前言', link: '/preface' },
        ]
      },
      {
        text: '基础篇',
        collapsed: false,
        items: [
          {
            text: '第一章：Claude Code 是什么',
            collapsed: true,
            items: [
              { text: '1.1 AI 编程助手的兴起', link: '/chapter-1/1.1-ai-coding-assistant' },
              { text: '1.2 核心架构', link: '/chapter-1/1.2-architecture' },
              { text: '1.3 环境与 IDE 集成', link: '/chapter-1/1.3-environments' },
              { text: '1.4 与其他工具的对比', link: '/chapter-1/1.4-comparison' },
            ]
          },
          {
            text: '第二章：安装与配置',
            collapsed: true,
            items: [
              { text: '2.1 安装 Claude Code', link: '/chapter-2/2.1-installation' },
              { text: '2.2 账号与认证', link: '/chapter-2/2.2-authentication' },
              { text: '2.3 第一个会话', link: '/chapter-2/2.3-first-session' },
              { text: '2.4 初识 CLAUDE.md', link: '/chapter-2/2.4-claude-md-intro' },
            ]
          },
        ]
      },
      {
        text: '进阶篇',
        collapsed: false,
        items: [
          {
            text: '第三章：上下文管理',
            collapsed: true,
            items: [
              { text: '3.1 理解上下文窗口', link: '/chapter-3/3.1-context-window' },
              { text: '3.2 CLAUDE.md 详解', link: '/chapter-3/3.2-claude-md' },
              { text: '3.3 Auto Memory', link: '/chapter-3/3.3-auto-memory' },
              { text: '3.4 上下文控制策略', link: '/chapter-3/3.4-context-strategies' },
            ]
          },
          {
            text: '第四章：实战工作流',
            collapsed: true,
            items: [
              { text: '4.1 探索新代码库', link: '/chapter-4/4.1-explore-codebase' },
              { text: '4.2 修复 Bug', link: '/chapter-4/4.2-fix-bugs' },
              { text: '4.3 代码重构', link: '/chapter-4/4.3-refactoring' },
              { text: '4.4 编写测试', link: '/chapter-4/4.4-writing-tests' },
              { text: '4.5 Plan Mode', link: '/chapter-4/4.5-plan-mode' },
            ]
          },
          {
            text: '第五章：自定义命令',
            collapsed: true,
            items: [
              { text: '5.1 什么是 Skills', link: '/chapter-5/5.1-what-is-skills' },
              { text: '5.2 创建自定义命令', link: '/chapter-5/5.2-create-commands' },
              { text: '5.3 团队共享命令库', link: '/chapter-5/5.3-team-sharing' },
              { text: '5.4 实用命令模板', link: '/chapter-5/5.4-templates' },
            ]
          },
        ]
      },
      {
        text: '高级篇',
        collapsed: false,
        items: [
          {
            text: '第六章：MCP 服务器集成',
            collapsed: true,
            items: [
              { text: '6.1 什么是 MCP', link: '/chapter-6/6.1-what-is-mcp' },
              { text: '6.2 连接常用服务', link: '/chapter-6/6.2-popular-servers' },
              { text: '6.3 配置与管理', link: '/chapter-6/6.3-configuration' },
              { text: '6.4 自定义 MCP 服务器', link: '/chapter-6/6.4-custom-server' },
            ]
          },
          {
            text: '第七章：GitHub 工作流',
            collapsed: true,
            items: [
              { text: '7.1 GitHub Actions 介绍', link: '/chapter-7/7.1-github-actions-intro' },
              { text: '7.2 安装与配置', link: '/chapter-7/7.2-setup' },
              { text: '7.3 自动代码审查', link: '/chapter-7/7.3-code-review' },
              { text: '7.4 Issue 驱动开发', link: '/chapter-7/7.4-issue-driven' },
              { text: '7.5 高级 Workflow', link: '/chapter-7/7.5-advanced-workflows' },
            ]
          },
          {
            text: '第八章：Hooks 深度指南',
            collapsed: true,
            items: [
              { text: '8.1 设计哲学', link: '/chapter-8/8.1-philosophy' },
              { text: '8.2 事件类型详解', link: '/chapter-8/8.2-event-types' },
              { text: '8.3 第一个 Hook', link: '/chapter-8/8.3-first-hook' },
              { text: '8.4 实战案例集', link: '/chapter-8/8.4-examples' },
              { text: '8.5 调试技巧', link: '/chapter-8/8.5-debugging' },
            ]
          },
          {
            text: '第九章：SDK 与编程化控制',
            collapsed: true,
            items: [
              { text: '9.1 非交互模式', link: '/chapter-9/9.1-headless-mode' },
              { text: '9.2 结构化输出', link: '/chapter-9/9.2-structured-output' },
              { text: '9.3 CI/CD 集成', link: '/chapter-9/9.3-cicd' },
              { text: '9.4 Python/TypeScript SDK', link: '/chapter-9/9.4-sdk' },
              { text: '9.5 构建 Agent 团队', link: '/chapter-9/9.5-agent-teams' },
            ]
          },
        ]
      },
      {
        text: '附录',
        items: [
          { text: 'A. CLI 命令速查', link: '/appendix/cli-reference' },
          { text: 'B. 配置模板', link: '/appendix/config-templates' },
          { text: 'C. 常见问题', link: '/appendix/faq' },
          { text: 'D. 推荐资源', link: '/appendix/resources' },
        ]
      }
    ],

    search: { provider: 'local' },
    editLink: {
      pattern: 'https://github.com/your-username/claude-code-book/edit/main/:path',
      text: '在 GitHub 上编辑此页'
    },
    lastUpdated: { text: '最后更新' },
    footer: {
      message: '基于 CC BY-NC-SA 4.0 协议发布',
      copyright: 'Copyright © 2026'
    }
  }
})
