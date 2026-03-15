# 附录 C：常见问题解答

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
