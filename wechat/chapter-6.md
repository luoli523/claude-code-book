---
title: "《跟鬼哥玩转 Claude Code》第六章：MCP 服务器集成"
author: 鬼哥
coverImage: "/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-6/6.1-what-is-mcp.png"
---

> 📖 **跟鬼哥玩转 Claude Code**

# 第六章：MCP 服务器集成

# 6.1 什么是 MCP

![6.1 什么是 MCP](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-6/6.1-what-is-mcp.png)


## 一个让 Claude Code 长出"手臂"的协议

想象一下这个场景：

你在修一个 bug，需要知道这个问题在 GitHub 上有没有对应的 issue；顺便还想查一下生产数据库里这个错误出现了多少次；修完之后想在 Slack 里通知团队。

以前，这些操作你需要自己手动去做——切到浏览器，打开 GitHub，搜索 issue；再开一个终端，连上数据库，跑查询；再打开 Slack，发消息。

**有了 MCP，这些全可以直接告诉 Claude Code：**

```
check if there's an open GitHub issue for this bug,
then query the production DB to see how many users are affected,
then draft a Slack message to #eng-alerts summarizing the issue
```

它自己去做。

---

## MCP 是什么

MCP 全称 **Model Context Protocol**（模型上下文协议），是 Anthropic 主导开发的一个开放标准。

它解决的问题是：**AI 怎么安全、标准化地连接到外部工具和数据源。**

工作原理：

```
Claude Code
    ↕（MCP 协议）
MCP Server（中间层）
    ↕（原生 API）
外部服务（GitHub / Slack / 数据库 / 任何东西）
```

MCP Server 是一个中间层程序，它把外部服务的能力"翻译"成 Claude Code 能理解的工具调用格式。Claude Code 通过调用这些工具来间接操作外部服务。

---

## 和直接写代码调用 API 有什么区别

你可能会想：让 Claude Code 自己写个 `curl` 命令不也能调 GitHub API 吗？

可以，但 MCP 有几个优势：

| | 直接写脚本/命令 | MCP |
|--|----------------|-----|
| **权限控制** | 全量 shell 权限 | 只暴露指定的操作 |
| **可重用性** | 每次任务都要写 | 配置一次，永久可用 |
| **跨项目** | 每个项目单独配 | 用户级配置全项目共享 |
| **安全性** | Claude Code 可以执行任意命令 | 只能调用 MCP 定义的接口 |
| **上下文感知** | 需要你描述数据结构 | MCP Server 直接提供结构化数据 |

简单说：MCP 是**有边界的、可重用的外部能力**，比裸调 API 更安全、更稳定。

---

## 官方 MCP Registry：现成可用的服务

Anthropic 维护了一个 MCP Registry，里面有大量官方和第三方已经做好的 MCP Server，直接安装就能用：

**开发工具类：**
- GitHub — issue、PR、仓库操作
- GitLab — 同上，GitLab 版
- Jira — 看板、工单管理
- Linear — 现代项目管理工具

**沟通协作类：**
- Slack — 读消息、发消息、搜索
- Notion — 读写文档和数据库

**数据类：**
- PostgreSQL — 直接查询 PG 数据库
- MySQL — 同上，MySQL 版
- SQLite — 本地数据库

**设计类：**
- Figma — 读取设计稿和组件

**基础设施类：**
- AWS — S3、Lambda 等服务操作
- Cloudflare — Workers、KV 操作
- Puppeteer / Playwright — 浏览器自动化

完整列表见官方 Registry：`https://api.anthropic.com/mcp-registry/docs`

> ⚠️ **安全提示**：MCP Registry 里的第三方服务器 Anthropic 没有全部验证过。使用前确认来源可靠，不要轻易给陌生的 MCP Server 授权访问你的数据。

---

下一节，我们实际动手接入几个最常用的服务。

---

# 6.2 连接常用服务

![6.2 连接常用服务](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-6/6.2-popular-servers.png)


## 安装 MCP Server 的统一方式

所有 MCP Server 的安装命令格式都一样：

```bash
claude mcp add <名称> --transport <协议> [-- <命令或URL>]
```

安装后立即生效，不需要重启 Claude Code。

下面逐个介绍最常用的几个。

---

## GitHub MCP

**能做什么：**
直接操作 GitHub 仓库——搜索 issue、读 PR 内容、查看 CI 状态、创建 issue、发表评论。

**安装：**

```bash
claude mcp add github --transport stdio \
  --env GITHUB_PERSONAL_ACCESS_TOKEN=<你的token> \
  -- npx -y @modelcontextprotocol/server-github
```

在 [github.com/settings/tokens](https://github.com/settings/tokens) 生成一个 Personal Access Token，勾选 `repo` 和 `issues` 权限。

**安装后能做的事：**

```
search for open issues labeled "bug" in the repo,
find the 3 most recently commented ones and summarize them
```

```
check the CI status of the latest commit on the main branch.
if any checks are failing, show me the error logs
```

```
look at PR #142, summarize the changes, and check if
there are any review comments I haven't responded to
```

```
create a GitHub issue for the bug we just fixed:
title should describe the root cause, body should include
the fix summary and link to the commit
```

---

## Slack MCP

**能做什么：**
读取频道消息、发送消息、搜索历史、查看未读通知。

**安装：**

```bash
claude mcp add slack --transport stdio \
  --env SLACK_BOT_TOKEN=<你的bot-token> \
  --env SLACK_TEAM_ID=<你的team-id> \
  -- npx -y @modelcontextprotocol/server-slack
```

Slack Bot Token 在 [api.slack.com/apps](https://api.slack.com/apps) 创建应用后获取，需要 `channels:read`、`chat:write`、`channels:history` 权限。

**安装后能做的事：**

```
check #eng-alerts for any new alerts since yesterday morning,
summarize the critical ones
```

```
post a message to #deployments:
"Deployed v2.3.1 to staging — includes the payment fix from PR #142.
Please test before EOD."
```

```
search Slack for any discussion about the "user session timeout" bug
we're working on — what context is there?
```

---

## PostgreSQL MCP

**能做什么：**
直接对 PostgreSQL 数据库执行查询（只读，不执行写操作——除非你明确配置允许）。

**安装：**

```bash
claude mcp add postgres --transport stdio \
  -- npx -y @modelcontextprotocol/server-postgres \
  "postgresql://user:password@localhost:5432/dbname"
```

> ⚠️ **强烈建议使用只读数据库账号**，不要把有写权限的连接字符串给 MCP。

**安装后能做的事：**

```
show me the database schema — what tables exist and
what are the relationships between them?
```

```
how many users signed up in the last 7 days?
break it down by day and show the trend
```

```
find all orders from the last 24 hours that are in
"pending" status for more than 2 hours.
these might be stuck — show me the order IDs and amounts
```

```
the checkout error we're debugging — query the logs table
for any errors with code "PAYMENT_FAILED" from today,
show the most recent 10 with their user IDs
```

---

## Figma MCP

**能做什么：**
读取 Figma 文件的设计内容、组件结构、样式定义。

**安装：**

```bash
claude mcp add figma --transport http \
  https://figma.com/api/mcp
```

> 注意：Figma MCP 需要你在 [figma.com](https://www.figma.com) 的设置里先开启 MCP 访问权限，并获取你的专属 URL。

**安装后能做的事：**

```
look at the new dashboard design in Figma,
and update the React components in src/components/Dashboard/
to match the latest design. focus on the card layout and color changes.
```

```
extract all the color tokens from our Figma design system
and update the tailwind.config.js to match
```

---

## 组合使用：真正的威力在这里

单独用每个 MCP 已经很有用了，但**组合使用才是真正改变工作流的地方**：

```
I just fixed the payment timeout bug.

1. check the GitHub issue #89 to confirm this fix addresses
   all the reported scenarios

2. query the production DB to find out how many users
   were affected by this bug in the last 7 days

3. update the GitHub issue with a comment summarizing
   the fix and the impact numbers

4. post to #product-updates Slack channel:
   "Payment timeout bug fixed. Affected X users over 7 days.
   Fix deployed to staging, production rollout tomorrow."
```

一条指令，Claude Code 跨四个系统完成任务。这就是为什么说 MCP 是 Claude Code 进入"真正有用"阶段的关键。

---

## 验证 MCP 连接是否正常

安装完之后，可以测试一下连接：

```bash
# 列出所有已安装的 MCP Server
claude mcp list

# 查看某个 Server 的详细信息
claude mcp get github
```

在 Claude Code 会话里，输入：

```
list all the tools available from the github MCP server
```

它会列出所有可用的工具，确认连接正常。

---

下一节，我们来看 MCP 的配置文件结构，以及管理多个 MCP Server 的最佳实践。

---

# 6.3 配置与管理 MCP 服务器

![6.3 配置与管理 MCP 服务器](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-6/6.3-configuration.png)


## MCP 配置存在哪里

用 `claude mcp add` 命令添加的 MCP Server，配置会自动写入：

```
~/.claude/settings.json        ← 用户级（所有项目共享）
.claude/settings.json          ← 项目级（只对当前项目生效）
```

打开看看里面长什么样：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:pass@localhost:5432/mydb"
      ]
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-xxxxxxxxxxxx",
        "SLACK_TEAM_ID": "TXXXXXXXX"
      }
    }
  }
}
```

你可以直接编辑这个 JSON 文件，效果和用命令行一样。

---

## 三种传输协议

添加 MCP Server 时需要指定传输协议（`--transport`），有三种：

### Stdio（进程标准输入输出）

```bash
claude mcp add myserver --transport stdio -- npx -y some-mcp-package
```

Claude Code 会在本地启动一个进程，通过标准输入输出通信。

**适合：** 本地运行的服务，比如数据库客户端、文件系统工具
**特点：** 低延迟，进程跟随 Claude Code 会话启动和退出

### HTTP（Streamable HTTP）

```bash
claude mcp add myserver --transport http https://your-mcp-server.com/mcp
```

连接到远程运行的 HTTP 服务。

**适合：** 云端服务，比如 Figma、第三方 SaaS 集成
**特点：** 服务器独立运行，连接稳定性依赖网络

### SSE（Server-Sent Events）

```bash
claude mcp add myserver --transport sse https://your-mcp-server.com/sse
```

一种特殊的 HTTP 长连接，服务器可以主动推送事件。

**适合：** 需要实时更新的场景
**特点：** 比 Stdio 延迟稍高，但比轮询高效

---

## 用户级 vs 项目级

**用户级配置（`~/.claude/settings.json`）**

添加时不加任何项目路径标志，就写入用户级：

```bash
claude mcp add github --transport stdio ...
```

所有项目都能用这个配置。适合：GitHub、Slack 这类和项目无关的通用服务。

**项目级配置（`.claude/settings.json`）**

添加时加 `--scope project` 标志：

```bash
claude mcp add postgres --scope project --transport stdio ...
```

只对当前项目生效。适合：数据库连接（每个项目数据库不同）、项目特定的 API。

> 💡 项目级的 `.claude/settings.json` 可以 check in 到 git，但**不要把含有密钥的配置提交**——用环境变量替代明文写在文件里。

---

## 用环境变量管理密钥

不要把 token 直接写进配置文件，用环境变量：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

然后在你的 shell 配置文件（`~/.zshrc` 或 `~/.bashrc`）里设置环境变量：

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
```

这样配置文件可以安全地进入版本控制，密钥不会泄露。

---

## 常用管理命令

```bash
# 列出所有已配置的 MCP Server
claude mcp list

# 查看某个 Server 的配置详情
claude mcp get github

# 删除一个 MCP Server
claude mcp remove github

# 重置（删除所有）MCP 配置
claude mcp reset-project-choice
```

---

## 安全注意事项

MCP 是个强大的能力，也是个潜在的攻击面。几条必须记住的原则：

**1. 只安装你信任的 MCP Server**

第三方 MCP Server 的代码在你的机器上运行，能访问你授权给它的所有资源。安装前查看源码或确认来源可靠。

**2. 最小权限原则**

给 MCP Server 的权限要最小化：
- 数据库 MCP 用只读账号
- GitHub MCP 只给需要的 scope（能不给 `write` 就不给）
- Slack MCP 只给需要的频道权限

**3. 项目配置谨慎提交**

项目级的 `.claude/settings.json` 如果包含服务地址，可以提交；但绝对不要把 token 明文提交。在 `.gitignore` 里加一个保险：

```
# .gitignore
.claude/settings.local.json   ← 这个文件放本地密钥，不进 git
```

**4. 定期轮换 Token**

给 MCP 用的 API Token 定期换新，并且和你个人用的 Token 分开管理。

---

下一节，如果现成的 MCP Server 都不满足你的需求，我们来看看怎么自己写一个。

---

# 6.4 构建自己的 MCP 服务器

![6.4 构建自己的 MCP 服务器](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-6/6.4-custom-server.png)


## 什么时候需要自己写

官方 Registry 里已经有几十个现成的 MCP Server，大多数常见需求都能覆盖。

但有些情况下你需要自己动手：

- **公司内部系统**：内部 API、私有数据库、自研工具——不可能有现成的
- **定制化行为**：需要把多个系统封装成一个简化的接口
- **特殊认证方式**：公司 SSO、内网证书等标准工具处理不了的
- **降低复杂度**：把一个复杂的操作序列包装成一个简单的工具

---

## 最简单的 MCP Server（TypeScript）

一个 MCP Server 的核心就是：**定义工具，处理调用，返回结果。**

下面是一个完整的最小示例，提供一个 `get_deploy_status` 工具，查询内部部署系统的状态：

```typescript
// deploy-status-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 1. 创建 Server 实例
const server = new Server(
  { name: "deploy-status", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// 2. 声明提供哪些工具
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_deploy_status",
      description: "Get the current deployment status for an environment",
      inputSchema: {
        type: "object",
        properties: {
          environment: {
            type: "string",
            enum: ["staging", "production"],
            description: "The environment to check",
          },
        },
        required: ["environment"],
      },
    },
  ],
}));

// 3. 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_deploy_status") {
    const env = request.params.arguments?.environment as string;

    // 调用你的内部 API
    const status = await fetchInternalDeployStatus(env);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// 4. 启动 Server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();

// 你的内部 API 调用逻辑
async function fetchInternalDeployStatus(env: string) {
  const response = await fetch(
    `${process.env.INTERNAL_API_URL}/deploys/${env}/status`,
    { headers: { Authorization: `Bearer ${process.env.INTERNAL_API_TOKEN}` } }
  );
  return response.json();
}
```

就这些。一个完整的、可用的 MCP Server。

---

## 安装依赖和构建

```bash
# 初始化项目
npm init -y
npm install @modelcontextprotocol/sdk

# 编译
npx tsc deploy-status-server.ts --outDir dist

# 测试运行
node dist/deploy-status-server.js
```

---

## 注册到 Claude Code

```bash
claude mcp add deploy-status --transport stdio \
  --env INTERNAL_API_URL=https://deploy.internal.company.com \
  --env INTERNAL_API_TOKEN=your-token \
  -- node /path/to/dist/deploy-status-server.js
```

注册后，在 Claude Code 里就能用了：

```
check the current deployment status for both staging and production.
if there's a version mismatch, tell me which commit is on each
```

---

## 设计好用的 MCP 工具的几条原则

**工具名要动词+名词**

好：`get_user_by_email`、`create_jira_issue`、`list_recent_errors`
差：`user`、`jira`、`errors`

**description 要说清楚"什么时候用"**

Claude Code 通过 description 判断应该调用哪个工具。写清楚适用场景比写功能描述更有用：

```typescript
description: "Use this when you need to look up a user's account details.
  Returns profile, subscription status, and recent activity.
  Do NOT use for bulk lookups — call individually for each user."
```

**错误信息要对人友好**

```typescript
// 不好
throw new Error("404");

// 好
throw new Error(
  `User ${userId} not found. Make sure the user ID is a valid UUID format.`
);
```

**返回结构化数据，加上解释**

```typescript
return {
  content: [{
    type: "text",
    text: `Deploy status for ${env}:
- Version: ${status.version}
- Deployed at: ${status.deployedAt}
- Status: ${status.healthy ? "✅ Healthy" : "❌ Unhealthy"}
- Last deploy by: ${status.deployedBy}

Raw data:
${JSON.stringify(status, null, 2)}`
  }]
};
```

---

## 分发给团队

如果你写的 MCP Server 要给整个团队用，有两种方式：

**方式一：发布到 npm**

```bash
npm publish --access public
```

团队成员安装时：
```bash
claude mcp add deploy-status --transport stdio \
  -- npx -y @yourcompany/deploy-status-mcp
```

**方式二：放进公司内部 git 仓库**

把 MCP Server 的代码放进公司的内部 git，在 README 里写清楚怎么安装和配置。团队成员 clone 下来，`npm install`，然后用绝对路径注册。

---

## 第六章小结

MCP 是 Claude Code 从"编程助手"升级为"开发平台"的关键：

- **官方 Registry** 里有几十个现成服务，GitHub / Slack / 数据库 装了就能用
- **组合使用**多个 MCP 才是真正的威力所在
- **安全第一**：最小权限，密钥不进 git
- **自定义 MCP** 处理公司内部系统，核心就是"定义工具 + 处理调用"

下一章，我们把 Claude Code 接入 GitHub 工作流，让 AI 自动参与你的 PR 和 Issue 流程。

---

> 本文节选自《跟鬼哥玩转 Claude Code》，原文：https://luoli523.github.io/claude-code-book
