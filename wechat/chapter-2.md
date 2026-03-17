---
title: "《跟鬼哥玩转 Claude Code》第二章：安装与环境配置"
author: 鬼哥
coverImage: "/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-2/2.1-installation.png"
---

> 📖 **跟鬼哥玩转 Claude Code**

# 第二章：安装与环境配置

# 2.1 安装 Claude Code

![2.1 安装 Claude Code](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-2/2.1-installation.png)


## 一条命令的事

Claude Code 的安装没什么神秘的，就是在终端里跑一条命令。

根据你的操作系统选对应的：

### macOS / Linux / WSL（Windows 的 Linux 子系统）

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### Windows（PowerShell）

```powershell
irm https://claude.ai/install.ps1 | iex
```

### Windows（CMD）

```batch
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

> ⚠️ **Windows 用户注意**：需要先装 [Git for Windows](https://git-scm.com/downloads/win)，没装的话先去装，不然后面会出问题。

安装完之后，重新打开一个终端窗口，运行：

```bash
claude --version
```

看到版本号就说明装好了。比如：

```
Claude Code 1.x.x
```

---

## 也可以用 Homebrew（macOS）

如果你习惯用 Homebrew 管理软件包：

```bash
brew install --cask claude-code
```

> 💡 Homebrew 安装的版本**不会自动更新**，需要手动运行 `brew upgrade claude-code` 来升级。原生安装脚本装的版本会在后台自动更新，省事一些。

---

## 如何更新

原生安装的版本会自动更新，一般不需要手动管。如果你想强制更新到最新版：

```bash
claude update
```

---

## 如何卸载

如果哪天你不想用了（很难想象，但万一呢）：

```bash
claude uninstall
```

---

## 🚨 踩坑指南：作者从屎坑里趟出来的经验

> *以下内容来自真实踩坑经历。写出来不是为了让你笑，是为了让你少痛苦半小时。*

---

**坑 1：M1/M2/M3 Mac 上 `command not found`**

安装脚本跑完了，但输入 `claude` 提示"command not found"。

**原因**：安装路径没加进 `PATH`。
**解法**：关掉终端，重新打开一个新窗口再试。还不行的话，手动加路径：

```bash
# 找一下 claude 装在哪了
which claude || ls ~/.local/bin/claude

# 把这行加到你的 ~/.zshrc 或 ~/.bashrc 末尾
export PATH="$HOME/.local/bin:$PATH"

# 重新加载配置
source ~/.zshrc
```

---

**坑 2：Windows 上 PowerShell 提示"执行策略"错误**

```
cannot be loaded because running scripts is disabled on this system
```

**原因**：Windows 默认禁止运行从网络下载的脚本。
**解法**：用管理员身份打开 PowerShell，先运行：

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

然后再跑安装命令。

---

**坑 3：WSL 里装了，但 Windows 这边找不到**

WSL（Windows Subsystem for Linux）里的 Claude Code 和 Windows 本体是隔离的。在 WSL 终端里装，就只能在 WSL 里用；在 Windows PowerShell 里装，就只能在 Windows 里用。

**建议**：如果你主要在 WSL 里开发，就在 WSL 里装；如果你用 VS Code + WSL Remote，在 WSL 里装就够了。

---

**坑 4：网络超时/安装卡住**

国内网络访问 `claude.ai` 可能不稳定，下载脚本会卡住或报错。

**解法**：挂代理后再跑安装命令。如果你用的是终端代理，确认一下代理对当前终端会话生效：

```bash
# 检查代理是否生效
echo $https_proxy
curl -I https://claude.ai
```

---

*好了，坑介绍完了。大部分人顺顺当当一条命令就过了，上面这些只是以防万一。*

下一节，装好了之后登录账号。

---

# 2.2 账号与认证

![2.2 账号与认证](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-2/2.2-authentication.png)


## 先说坏消息：Claude Code 不是免费的

装完之后你可能会跃跃欲试地输入 `claude`，然后发现它要你登录——而且需要付费账号。

这里直接说清楚，省得你到时候懵：

| 账号类型 | 适合谁 | 备注 |
|---------|-------|------|
| **Claude Pro**（个人订阅）| 个人开发者，日常使用 | 月费约 $20，最推荐的入门选择 |
| **Claude Max** | 重度用户，用量较大 | 比 Pro 贵，但 token 限制宽松很多 |
| **Claude Teams / Enterprise** | 公司团队 | 有管理后台、用量统计 |
| **Console API** | 想按量付费的开发者 | 充值后直接消耗 API credit |

> 💡 如果你只是想先体验一下再决定要不要用，Claude Pro 是性价比最高的起点。

---

## 首次登录

安装好之后，在任意目录运行：

```bash
claude
```

第一次运行会进入登录流程，按提示操作就行——它会打开浏览器，让你在网页上完成授权，然后自动把认证信息存到本地。

整个过程大概 30 秒。

登录完成后，你的凭证会保存在本地，下次启动不需要再登录。

---

## 切换账号

如果你有多个账号（比如个人账号和公司账号），可以随时切换：

在 Claude Code 会话里输入：

```
/login
```

它会重新走一遍认证流程，覆盖当前登录的账号。

---

## 企业用户：第三方云平台接入

如果你的公司通过 AWS Bedrock、Google Vertex AI 或 Microsoft Foundry 使用 Claude，Claude Code 也支持这些接入方式。具体配置稍微复杂一点，需要设置对应的环境变量和 IAM 权限，一般由公司 IT/DevOps 团队来配置——你直接问他们拿配置参数就行，不需要自己折腾。

---

## 确认登录状态

不确定有没有登录成功？运行一下：

```bash
claude --version
```

或者直接启动一个会话，如果能正常对话，就是登录好了。

下一节，正式开始第一个会话。

---

# 2.3 第一个会话：5 步上手

![2.3 第一个会话：5 步上手](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-2/2.3-first-session.png)


## 用一个真实项目来演示

空口讲不直观，我们用一个真实项目来走一遍完整流程。

这里用的是 [**expressjs/express**](https://github.com/expressjs/express)——Node.js 最流行的 Web 框架之一，代码结构清晰，非常适合练手。你不需要懂它的每行代码，我们只是用它来演示 Claude Code 的基本操作。

先把项目克隆下来：

```bash
git clone https://github.com/expressjs/express.git
cd express
```

---

## 第一步：启动 Claude Code

进入项目目录后，直接运行：

```bash
claude
```

你会看到一个欢迎界面，显示当前会话信息、最近的对话历史和版本更新。

然后就是一个输入框，等你说话。

---

## 第二步：让它介绍这个项目

第一件事，让 Claude Code 读懂这个项目。输入：

```
这个项目是做什么的？有哪些主要模块？
```

Claude Code 会开始读取文件——你能看到它在扫描目录结构、打开 `package.json`、读 `README.md`、浏览 `lib/` 目录……

几秒钟后，它会给你一个概述，大概像这样：

> *Express 是一个轻量的 Node.js Web 框架。主要模块包括：路由系统（`lib/router/`）、中间件管理（`lib/middleware/`）、请求/响应扩展（`lib/request.js` / `lib/response.js`）……*

这就是 Agentic Loop 的第一阶段：**收集上下文**。它不需要你解释项目，自己去读。

> 💡 **试试这几个问题，都很有用：**
> ```
> 这个项目用了什么测试框架？怎么运行测试？
> 入口文件在哪里？
> 有 TypeScript 类型定义吗？
> ```

---

## 第三步：让它改一行代码

光聊不过瘾，让它动手改点东西。我们让它给 `lib/application.js` 加一行注释：

```
在 lib/application.js 的文件开头加一段注释，说明这个文件的主要职责，用中文写
```

Claude Code 会：
1. 读取 `lib/application.js`
2. 在开头生成一段注释
3. **在修改文件之前，给你看 diff，问你确不确认**

你会看到类似这样的提示：

```
Edit lib/application.js? [y/n]
```

这是 Claude Code 的权限机制——**它不会悄悄改你的代码，改之前一定会问你**。

按 `y` 确认，文件就改了。

> 💡 如果你在这个会话里要做很多改动，可以输入 `/acceptedits` 或按 `Shift+Tab` 切换到自动接受模式，省掉每次确认的步骤。

---

## 第四步：提交这次改动

改完了，让它提交：

```
把这次改动提交到 git，写一个合适的 commit message
```

Claude Code 会：
1. 运行 `git diff` 看看改了什么
2. 运行 `git add` 暂存文件
3. 写一条 commit message
4. 运行 `git commit`
5. 告诉你提交成功，附上 commit hash

整个过程就是它自己在终端里敲命令，你只是看着。

---

## 第五步：退出会话

任务做完了，退出方式有两种：

```bash
exit        # 输入 exit
# 或者
Ctrl+C      # 键盘快捷键
```

---

## 常用命令速查

你在 Claude Code 会话里能用的命令不多，但这些必须记住：

| 命令 | 干什么 |
|------|-------|
| `/help` | 显示所有可用命令 |
| `/clear` | 清空当前对话历史（省 token 用） |
| `/model` | 切换 AI 模型（Sonnet / Opus）|
| `/login` | 重新登录 / 切换账号 |
| `/acceptedits` | 本会话内自动接受所有文件改动 |
| `/permissions` | 查看和管理权限规则 |
| `/init` | 生成 CLAUDE.md |
| `exit` | 退出 |

---

## 非交互模式：不进对话，直接出结果

有时候你不想开一个对话，只想快速完成一个任务。用 `-p` 参数：

```bash
# 直接运行，打印结果，退出
claude -p "这个项目用什么测试框架？"

# 继续上一个会话
claude -p "继续分析刚才的问题" --continue
```

这个模式在写脚本、接 CI/CD 的时候特别有用，后面章节会详细讲。

---

## 键盘快捷键

| 快捷键 | 作用 |
|-------|------|
| `↑ / ↓` | 翻历史命令 |
| `Shift+Tab` | 切换权限模式（普通 → 自动接受 → 规划模式）|
| `Ctrl+G` | 在编辑器里打开当前计划 |
| `Ctrl+C` | 打断当前操作 |
| `?` | 显示所有快捷键 |

---

走完这五步，你已经完成了一次完整的 Claude Code 使用流程：**理解项目 → 修改代码 → 提交 git**。

下一节，我们来解决一个让很多人觉得麻烦的问题：每次开新会话，都要重新介绍一遍项目吗？

---

# 2.4 初识 CLAUDE.md：让它记住你的项目

![2.4 初识 CLAUDE.md：让它记住你的项目](/Users/li.luo/dev/git/claude-code-book/originals/images/chapter-2/2.4-claude-md-intro.png)


## 一个让人抓狂的问题

用了几次 Claude Code 之后，你可能会发现一件烦人的事：

**每次开新会话，它都不记得上次说过什么。**

上次你花了五分钟告诉它"这个项目用 pnpm 不用 npm，测试用 vitest，提交前必须跑 lint"……新会话开起来，你又要说一遍。

这不是 bug，这是正常的——每个会话都有独立的上下文窗口，关掉就清空了。

但这个问题有解决方法，叫做 **CLAUDE.md**。

---

## CLAUDE.md 是什么？

简单说：**它是你写给 Claude Code 的"项目说明书"**，放在项目根目录里，每次会话开始时自动加载。

不需要你每次都说"这个项目用什么"、"提交前要做什么"，写在 CLAUDE.md 里，它自动知道。

就像新员工入职第一天会看的那份内部文档——只不过 Claude Code 每次上班都会重新读一遍，不会忘。

---

## 用 `/init` 自动生成

不用从零开始写，Claude Code 可以帮你生成一份初稿。

在项目目录里启动 Claude Code，输入：

```
/init
```

它会分析你的项目结构——读 `package.json`、扫描目录、找到测试配置、检测用的是什么包管理器……然后生成一份 `CLAUDE.md`。

在 express 项目里跑完 `/init`，生成的内容大概长这样：

```markdown
# CLAUDE.md

## 项目概述
Express.js — Node.js Web 框架

## 开发命令
- 安装依赖：`npm install`
- 运行测试：`npm test`
- 运行单个测试：`npx mocha test/xxx.js`

## 代码规范
- 使用 CommonJS（require/module.exports）
- 2 个空格缩进
- 测试框架：Mocha + should.js

## 注意事项
- 不要修改 `History.md`（自动生成）
- PR 前请确保所有测试通过
```

当然，自动生成的内容不会完全准确，需要你手动核对和补充——尤其是项目里的特殊约定、你的个人偏好这类 AI 猜不到的东西。

---

## 看懂 CLAUDE.md 的结构

一份好的 CLAUDE.md 一般包含几类信息：

**常用命令**——它怎么运行、怎么测试、怎么构建：
```markdown
## 命令
- 启动开发服务器：`npm run dev`
- 运行测试：`npm test`
- 构建：`npm run build`
```

**代码规范**——这个项目的风格约定：
```markdown
## 代码规范
- 用 TypeScript，不用 any
- 组件文件用 PascalCase 命名
- 用 pnpm，不用 npm 或 yarn
```

**架构说明**——关键目录和模块是做什么的：
```markdown
## 目录结构
- `src/api/` — API 路由处理
- `src/db/` — 数据库查询层
- `src/utils/` — 工具函数
```

**特殊规则**——那些只有在这个项目里才适用的要求：
```markdown
## 注意事项
- 提交前必须跑 `npm run lint`
- 不要直接修改 `dist/` 目录下的文件
- 数据库迁移文件不要手动改
```

---

## 先有个概念就行，详细的留到后面

CLAUDE.md 看起来简单，但写好它其实有不少门道——写太长会适得其反，写错了会让它产生误解，还有怎么拆分成多个文件、怎么让它只对某类文件生效……

这些我们放到**第三章**专门讲。

现在你只需要知道：`/init` 生成一份，大概看一眼，不报错就好。

---

## 第二章小结

安装好了，登录好了，跑了第一个会话，知道了 CLAUDE.md 是什么——**你正式是 Claude Code 用户了**。🎉

接下来，第三章我们深入讲上下文管理：CLAUDE.md 怎么写才有效，Auto Memory 是什么，以及为什么上下文窗口是你最应该关心的资源。

---

> 本文节选自《跟鬼哥玩转 Claude Code》，原文：https://luoli523.github.io/claude-code-book
