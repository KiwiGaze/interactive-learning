# Interactive Learning — Brainstorming & Design Record

**日期**: 2026-04-22
**状态**: 详细设计 §1–§5 全部 approved；待 user spec review → writing-plans
**作者**: brainstorming 对话整理

---

## 1. 项目定位

**是什么** — 一个通用、开源、本地运行的**交互式学习中间件**。它作为 MCP server 给本地 AI agent（Claude Code、Codex、Cursor 等）提供"声明式教育 UI"能力：agent 发出 UI 声明，中间件在本地浏览器里渲染高质量的教育组件（Quiz、FlashCard、StepByStep、Diagram…），用户交互事件通过 WebSocket 回流给 agent。

**解决什么** — 解耦**教育 UI 的生产者与消费者**：

- 生产者：内容创作者用自己的 agent 生成可分发的课程包（MDX + 元数据）
- 消费者：学习者用自己的 agent 加载课程包，与中间件的 UI 交互
- 中间件：只关心协议和渲染，与具体 agent 解耦

**为什么现在做** — 2026 年 MCP 协议和官方 TS SDK 已稳定（2025-11-25 规范），Claude Code / Codex / Cursor 都原生支持；生态具备条件；教育 UI 作为垂直领域 component vocabulary 天然"可枚举"，适合做高层语义组件库。

**Phase 1 范围** — 协议 + 中间件 + 核心组件库 + 至少一份样例 agent skill（Claude Code）。

**Phase 2 愿景** — 在用户本地（文件系统 + SQLite）持久化教育对话与学习记录，支持复习和整理。

---

## 2. 决策日志（Q&A）

以下六个问题按发生顺序排列。每个问题都决定了某一条架构轴。

### Q1 · Session 拓扑：一次学习 session 里有几个 agent？

| 选项 | 说明 |
|---|---|
| 单 agent + 浏览器 | 同一个 session 既驱动 UI 又接收交互 |
| 双 agent 协作（同 session） | 一个生成 UI，一个陪伴对话 |
| **✅ 异步创作 + 消费（跨 session）** | 创作者 agent 生产课程包 → 学习者 agent 加载并互动 |

**含义**：需要一个"课程包"格式作为跨 session 的交换物；中间件不需要维护跨 agent 的共享状态，但必须支持课程包加载。

---

### Q2 · Agent 参与度：学习者的 agent 怎么参与 session？

| 选项 | 说明 |
|---|---|
| **✅ 全程在线陪伴** | 每个交互事件都回传 agent；agent 动态反馈 / 生成新 UI / 调整难度 |
| 只在启动时参与 | agent 开场后撤场，课程靠内置逻辑运行 |
| 按需介入 | 默认课程自运行，特定组件才触发 agent 回归 |

**含义**：中间件是 **runtime**（不是纯渲染器）；课程包是"教案"，不必内置复杂逻辑；agent 必须在线。

---

### Q3 · UI 抽象层次：agent 声明的 UI 粒度？

| 选项 | 说明 |
|---|---|
| **✅ 高层语义组件库** | 预制 FlashCard / CodeEditor / Quiz / StepByStep / Diagram…；agent 按名字调用并填数据 |
| 基础组件 + 组合 | Box / Text / Input / Button primitives，agent 自由组合 |
| 混合 + escape hatch | 高层组件解决 90%，剩余给自由 HTML 片段 |

**含义**：**catalog + registry + spec** 模式（Vercel `json-render` 参考）；组件 schema 用 Zod 白名单定义；agent skill 教"什么时候叫哪个组件"而不是"怎么画 UI"。

---

### Q4 · Agent 协议：agent ↔ 中间件用什么协议？

| 选项 | 说明 |
|---|---|
| **✅ MCP** | 官方协议；Claude Code / Codex / Cursor 原生支持；其他 agent 实现 MCP client 即接入 |
| HTTP REST + SSE | 通用但 agent 需 shell/fetch 权限；skill 更重 |
| MCP 为主 + HTTP fallback | 最兼容，工作量翻倍 |

**含义**：中间件核心是 MCP server，暴露 tools / resources / prompts；插拔性等价于"MCP 生态"。

---

### Q5 · MVP 组件范围：第一版覆盖哪类内容？

| 选项 | 说明 |
|---|---|
| **✅ 通用跨学科基础** | Markdown/RichText + Quiz + FlashCard + StepByStep + Diagram(Mermaid) + Hint/Reveal |
| 编程学习优先 | 基础 + CodeEditor + 沙箱运行 |
| STEM 导向 | 基础 + Math(KaTeX) + Chart + Interactive Graph |
| 最小可行集 | 只 Markdown + Quiz + FlashCard |

**含义**：MVP 能覆盖大多数学科 60-70% 场景；不需要代码运行沙箱、音频、数学渲染（Phase 2 再扩）。

---

### Q6 · 实现栈：中间件的语言和分发？

| 选项 | 说明 |
|---|---|
| **✅ TypeScript + Node** | 前后端同构，MCP TS SDK 最成熟，`npx` 零门槛分发 |
| Python + React 前端 | AI 生态亲切，但前后端类型不同构 |
| Rust/Go + React 前端 | 单二进制，但 MCP SDK 年轻 |

**含义**：确定 monorepo 结构（pnpm workspaces）；mcp-server 与 ui 共享 protocol schema 包。

---

## 3. 技术调研摘要

三个调研 subagent 并行出报告，摘要如下：

### 3.1 "Agentui UI framework" 的真身 + Generative UI 生态

**澄清**："Agentui" 在 2026 年生态里没有一个官方项目恰好叫这个名字，最可能指 **AG-UI Protocol**（docs.ag-ui.com，CopilotKit 发起，~16 事件类型，支持 tool streaming + state delta + interrupt）。

**关键发现**：

- **MCP Apps 扩展（2026-01 官方标准化）** — Anthropic / OpenAI / MCP-UI 联合推出，是 MCP 协议下渲染 UI 的**唯一官方标准**（沙箱 iframe + `_meta.ui.resourceUri` + postMessage JSON-RPC）。已被 Postman / Shopify / Hugging Face / Goose / ElevenLabs 采用
- **Vercel `json-render`（2026-01 开源，13k+ star）** — "catalog + registry + spec" 三元模式最干净，Zod schema + 流式渐进渲染，教育场景（可枚举题型）高度契合
- **Vercel RSC `streamUI` 已 paused** — 别把架构下注在它上面；主推方向转为 `message.parts` + typed tool parts

**要规避的坑**：

- **A2UI schema 过冗长 → LLM 生成失败率高**；schema 要"白名单+有限"
- **generative UI 成本陷阱**：重复教学 UI 用模板 + 数据绑定，只有"个性化诊断卡片"走 generative
- **MCP 安全盲区**：2026 早期 60 天内 30 个 CVE，500+ 扫描服务器中 38% 完全无认证；沙箱 iframe + 白名单 catalog + 人工审批（`INTERRUPT`）三件套是下限

---

### 3.2 MCP TypeScript SDK 现状

**版本**：`@modelcontextprotocol/sdk` 稳定，协议 2025-11-25。Zod 从 peerDependencies 降为直接依赖，支持 Standard Schema（Zod v4 / Valibot / ArkType）。

**三原语边界**：

- **Tools**（模型控制、有副作用）← 本项目 "render_component / update_data" 归这里
- **Resources**（应用控制、只读）← "当前页面状态快照 / 组件目录" 归这里
- **Prompts**（用户控制、slash 暴露）← "生成某类教学 UI" 模板归这里

**重要约束**：

- ❌ **长阻塞 tool call 不可行** — 九个主流客户端（Claude Code / VS Code Copilot / Continue / LM Studio 等）有 ~60s 隐式超时
- ❌ **MCP Tasks primitive (SEP-1686)** SDK 支持但客户端尚未跟进，**不能依赖**
- ✅ **elicitation** Claude Code v2.1.76 (2026-03) 开始支持；Cursor 已稳定
- ✅ **progress notification / sampling** 普遍支持

**客户端差异**：

| | Claude Code | Codex CLI | Cursor |
|---|---|---|---|
| 配置文件 | `.mcp.json` / `~/.claude.json` | `~/.codex/config.toml` | `~/.cursor/mcp.json` |
| 格式 | JSON | **TOML** | JSON |
| Streamable HTTP | 原生 | 需要 `mcp-proxy` | 原生 |
| CLI 管理 | `claude mcp add` | `codex mcp` | GUI/JSON |

**跨 agent 安装**：没有官方"一键"标准，需要分发 JSON + TOML 两份配置片段。

**同进程 stdio + 浏览器 HTTP/WS** — 成熟模式，参考 `chrome-mcp-bridge`、`@mcp-b/websocket-bridge`、Microsoft "One MCP Server, Two Transports"。

**已知 bug**（需 prototype 验证）：

- `MCP_TOOL_TIMEOUT` 在 HTTP 调用时不被尊重（#17662）
- Claude Code 配置 `"type": "http"` 仍额外 spawn stdio 子进程（#29688）→ 端口必须可随机/可查询
- HTTP endpoint 必须严格回 `Accept: application/json, text/event-stream`，否则被误判为需要 auth

---

### 3.3 课程包格式 + 前端栈

**课程包**：**MDX + Zod frontmatter**，目录即课程包（`lessons/<id>/{index.mdx, meta.ts, assets/, quiz.yaml, flashcards.yaml}`）。

- 不采用 SCORM/xAPI/cmi5（对 localhost OSS 项目 overkill，除非接企业 LMS）
- 不采用 Jupyter `.ipynb`（agent 编辑嵌套 JSON 困难、需 kernel 运行时）
- 数据（quiz / flashcards）侧挂 YAML，便于 agent 只改数据不改代码

**UI 库**：**shadcn/ui + Tailwind v4 + Radix**。代码拥有、无主题锁；shadcn 2026 Visual Builder 稳定；Chakra/Mantine 主题耦合不适合 "agent 可自定义组件"。

**核心组件实现**：

| 组件 | 方案 |
|---|---|
| Markdown / MDX | `@mdx-js/mdx`（runtime 编译，支持用户课程包） |
| Quiz（单选/填空） | 自建 + shadcn（RadioGroup/Input/Form）+ Zod |
| FlashCard + SRS | **`ts-fsrs` v5.x (FSRS-6)** — Anki 2026 默认，~20-30% 少评审 vs SM-2 |
| StepByStep | 自建 + Radix Accordion / Collapsible |
| Diagram | `mermaid` v11 直用 |
| Hint / Reveal | 自建 + Radix Collapsible |

**前端状态**：**Zustand + TanStack Query**；Redux 过重，Jotai 按需再加。

**传输**（调研原推 SSE，但因双向交互事件需求，方案 A 最终采用 **WebSocket**）。

**OSS 参考**：Exercism（目录即课程）、freeCodeCamp（三层 hierarchy）、Docusaurus + MDX（自定义教学组件）、Anki（`.apkg` 结构）、v0/Bolt/Lovable（agent 生成回路）。

---

## 4. 架构选型

### 4.1 三个候选方案

| 方案 | 说明 | 优点 | 缺点 |
|---|---|---|---|
| **A. 独立浏览器 + stdio MCP + WS sidecar** | 单 Node 进程；stdio 讲 MCP、localhost HTTP/WS 讲浏览器 | 匹配原意、headroom 最大、插拔性最强 | 用户要在 terminal ↔ 浏览器切换 |
| B. MCP Apps 嵌入 host | 返回 `_meta.ui.resourceUri`，host 内嵌 iframe 渲染 | 同框、走官方标准 | host 支持度不齐、UI 复杂度有天花板、Codex 等 CLI agent 完全不渲染 |
| C. 双渲染路径 | A + B 同时支持 | 两头都不漏 | 工作量 ~1.5×，YAGNI |

### 4.2 选定：方案 A

**理由**：

1. **匹配原始意图**（"启动一个 localhost"），教育 UI 在独立窗口里 headroom 最大（数学、代码运行、多 tab、键盘深度控制）
2. **插拔性更强**：只要 agent 支持 MCP 就能接；方案 B 还要 host 也支持 MCP Apps，交集目前还小
3. **演进友好**：把组件做成"与宿主无关"的纯 React + Zod props schema + 纯事件，未来加 MCP Apps 适配器是加法而非重写

### 4.3 方案 A 的拓扑

```
┌─────────────────────┐                                  ┌─────────────────────────────┐
│  Claude Code / Codex │  stdio (JSON-RPC over MCP)      │       我们的 Node 进程        │
│     / Cursor         │◀───────────────────────────────▶│  (@interactive-learning/mcp)│
└─────────────────────┘                                  │                             │
                                                         │  ┌──────────────────────┐   │
                                                         │  │   MCP server         │   │
                                                         │  │  (tools/resources)   │   │
                                                         │  └─────────┬────────────┘   │
                                                         │            │ in-memory      │
                                                         │  ┌─────────▼────────────┐   │
                                                         │  │   SessionStore       │   │
                                                         │  │  (UI state + events) │   │
                                                         │  └─────────┬────────────┘   │
                                                         │            │                │
                                                         │  ┌─────────▼────────────┐   │
                                                         │  │ HTTP (Fastify) + WS  │   │
                                                         │  │    on 127.0.0.1:PORT │   │
                                                         │  └─────────┬────────────┘   │
                                                         └────────────┬────────────────┘
                                                                      │
                                                                      ▼
                                                           ┌──────────────────────┐
                                                           │   浏览器 tab (SPA)    │
                                                           │    React + shadcn    │
                                                           └──────────────────────┘
```

### 4.4 生命周期

- **启动**：agent 第一次调用任何 UI tool → MCP server 懒启动 HTTP/WS（端口从 49152-65535 随机找空闲；给一个固定 fallback 端口做 human-friendly URL）→ 自动 `open` 浏览器 tab
- **运行**：MCP server 与 HTTP/WS 共享 `SessionStore`（in-memory），充当 agent↔browser 双向事件桥
- **终止**：agent 断开 stdio → 进程退出 → 浏览器展示"会话已结束"页（带 Phase 2 的"导出会话"按钮）

---

## 5. 最终技术栈

### 5.1 选型总表

| 层 | 选择 | 版本/规模 | 选型理由 |
|---|---|---|---|
| 语言 | TypeScript + Node | Node 20 LTS | MCP 官方 TS SDK 最成熟；前后端同构共享 Zod schema |
| MCP SDK | `@modelcontextprotocol/sdk` | v1.x (stdio transport) | 官方、协议 2025-11-25、主流 agent 原生接 |
| HTTP server | Fastify | v5 | 比 Express 快 ~2×、TS 类型一流、插件生态健康 |
| WebSocket | `ws` | v8 | 事实标准、无多余抽象、稳定 |
| Schema | Zod | v4（Standard Schema 兼容） | MCP SDK 直接支持；前后端 + 课程包 frontmatter 统一 |
| 前端打包 | Vite | v6 + React 19 | 无 SSR 需求；比 Next.js 轻；HMR 体验好 |
| UI 库 | shadcn/ui + Tailwind | Tailwind v4 | 代码拥有、无主题锁、Radix 可访问性托底 |
| MDX 运行时 | `@mdx-js/mdx` + `gray-matter` | 最新 | 支持加载用户课程包（不依赖 build） |
| Diagram | `mermaid` | v11 | 稳、社区最广 |
| SRS 算法 | `ts-fsrs` | v5.x（FSRS-6） | Anki 2026 默认，少评审 ~20-30% vs SM-2 |
| 前端状态 | Zustand + TanStack Query | 最新 | Zustand 简洁；Redux 过重；Jotai 按需加 |
| 仓库结构 | pnpm workspaces monorepo | — | `packages/mcp-server` · `packages/ui` · `packages/protocol`（共享 Zod） |
| 分发 | `npx @interactive-learning/mcp` | — | 零安装，agent 的 `.mcp.json` 直接引用 |

### 5.2 关键决策与理由

| 决策 | 选择 | 否决项 & 理由 |
|---|---|---|
| 进程拓扑 | 单 Node 进程（stdio MCP + HTTP/WS 同进程） | 守护进程 + 桥接（YAGNI；MCP stdio 已天然绑定 agent 生命周期） |
| 浏览器传输 | WebSocket | SSE 只单向；交互事件要双向低延迟 |
| 前端框架 | Vite + React 19 | Next.js（没有 SSR / 路由 / ISR 需求，全部优势不成立） |
| UI 库 | shadcn/ui | Chakra/Mantine（主题耦合阻碍"agent 可自定义组件"） |
| Markdown 渲染 | MDX runtime | react-markdown（失去 JSX 能力，无法嵌入交互组件） |
| SRS 算法 | FSRS-6 | SM-2（已被 Anki 官方替代） |
| 课程包格式 | 目录 + MDX + Zod frontmatter | SCORM/cmi5（overkill）、Jupyter（agent 编辑困难） |
| 前端状态 | Zustand | Redux（过重）、Jotai（此规模不必） |
| 长阻塞 tool call | **避免**（短 tool + 长轮询 `wait_for_event ≤ 30s`） | 直接阻塞 tool（九个主流 agent 60s 硬超时） |

---

## 6. 详细设计 §2–§5

设计 §1（系统架构 + 进程拓扑 + 技术栈）已整合到 §4（架构选型）与 §5（最终技术栈）。本节覆盖协议表面、组件目录、agent skills、错误处理四大剩余模块。

---

### 6.1 MCP 协议表面（设计 §2）

#### Tool 清单（4 tools + 2 resources + 1 prompt）

**Tools**（agent → server，有副作用）

| Tool | Input | Output | 语义 |
|---|---|---|---|
| `render_component` | `{ slot_id?, type, props, replace? }` | `{ slot_id, cursor }` | 三种语义：(a) `slot_id` 缺省 → server 生成新 id 追加到根；(b) `slot_id` 已存在 + `replace=true` → 替换该 slot（version+1，丢弃旧 in-flight 事件）；(c) `slot_id` 已存在 + `replace` 缺省 / false → 返回 `INVALID_OPERATION` 错误并提示用 `update_component`。**立即返回**。 |
| `update_component` | `{ slot_id, patch }`（RFC 6902 JSON Patch） | `{ cursor }` | 对 slot 的 **props** 应用 JSON Patch（不触碰组件内部 state，那部分由组件自管）；适合改 quiz 里某题 explanation、flashcard 加新卡片等。失败回滚，不部分应用。 |
| `wait_for_event` | `{ since_cursor?, timeout_ms? }`（默认 25000，上限 30000） | `{ events: Event[], next_cursor }` | **长轮询**：有事件立即返回（events 非空，`next_cursor = last(events).event_id`）；timeout 期满无新事件返回 `events=[]` 且 `next_cursor === since_cursor`。agent skill 教它循环调用。 |
| `end_session` | `{ reason? }` | `{}` | agent 主动收尾；浏览器切到"会话已结束"页。 |

**Resources**（agent → server，只读）

| URI | 说明 |
|---|---|
| `catalog://components` | 组件目录：所有 type、props Zod schema（转 JSON Schema）、events schema。Agent 在 session 开始时 `read_resource` 一次做 discovery。 |
| `session://current/state` | 当前 session 快照：slot 树 + 最近事件 + cursor。用于 agent 恢复 / 调试 / 查询 UI 现状。 |

**Prompt**（user → agent，slash command）

| Prompt | 展开 |
|---|---|
| `/start_lesson <path>` | "读 `<path>/meta.ts` 和 `index.mdx`，先 read_resource `catalog://components`，然后 render_component 展示第一屏。" |

> **为什么只有 4 个 tools**：catalog + registry + spec 模式让组件设计面变宽（每个组件自带 schema），但 agent 看到的 tool 表保持小而稳定，降低 skill 复杂度 + token 开销。

#### 事件模型（envelope + 组件自定义 payload）

```ts
type Event = {
  event_id: string          // UUID v7，单调递增，cursor 依据
  timestamp: number         // Unix ms
  slot_id: string           // 事件源 slot
  slot_version: number      // 防止"旧 UI 的事件飘到新 UI"
  type: string              // "quiz.answer_submit" / "flashcard.rated" 等
  payload: unknown          // 每个组件在 catalog 里声明自己的 payload Zod schema
}
```

每个组件在 catalog 里声明自己能发的事件：

- `Quiz` → `quiz.answer_submitted` · `quiz.all_submitted` · `quiz.explanation_shown`
- `FlashCard` → `flashcard.flipped` · `flashcard.rated` · `flashcard.deck_completed`
- `StepByStep` → `step.expanded` · `step.collapsed` · `step.marked_done`

**事件过滤**：`slot_version` 保证渲染新组件后，旧组件残留的 in-flight 事件被丢弃。

**事件持久化**：ring buffer 保留最近 1000 条，超出淘汰最早。

**保留命名空间**：`component.*`（如 `component.render_error`）和 `session.*`（如 `session.uncaught_error`）由框架占用，与组件自定义事件（`quiz.*` / `flashcard.*`…）分开。

#### 规避 60s 长阻塞

Agent 侧循环（由 skill 强制教导）：

```
render_component(first)
while not session_done:
    r = wait_for_event(since_cursor, timeout_ms=25000)
    if r.events.empty():
        continue          # tool call 返回，agent 立刻再调一次
    for e in r.events:
        render_component(...) or update_component(...)
    since_cursor = r.next_cursor
```

关键参数：

| 参数 | 值 | 理由 |
|---|---|---|
| 单次 `wait_for_event` timeout | 25s | MCP 客户端 60s 硬超时，扣除 encode + RTT + GC 抖动，留 30-35s margin |
| Ring buffer 容量 | 1000 events | 避免内存膨胀；覆盖典型断连 + 重连窗口 |
| Cursor 语义 | `next_cursor > last event_id` | 下一次 call 用此 cursor，0 漏事件 0 重复事件 |

**不用 elicitation 作为 MVP 必须项**：Claude Code v2.1.76 刚加；不同 host UX 差异大。Phase 2 可作为优化路径叠加。

#### Session 状态模型

```ts
type Session = {
  id: string
  started_at: number
  slots: Map<slot_id, SlotState>   // slot 树（可嵌套）
  events: RingBuffer<Event>         // 最近 1000
  cursor: string                    // 最新 event_id
  browser_connected: boolean
  last_agent_tool_call: number
}

type SlotState = {
  slot_id: string
  version: number                   // render/replace 时 +1
  parent_slot?: string
  type: string
  props: unknown                    // 按 catalog schema 验证
  children?: slot_id[]
}
```

**超时**：30 分钟内既无 agent tool call 也无 browser event → 进程自终止。

#### 输入校验 & 错误

- 所有 tool input 过 Zod 校验；props 按组件 catalog schema 二次校验
- 错误返回 MCP JSON-RPC error，带 Zod issue 的 path + expected
- 不"善意填充缺失字段" —— 明确错误比隐式成功好

---

### 6.2 组件目录 & 课程包格式（设计 §3）

#### MVP 六件套组件

每个组件暴露三元组：**type** + **props schema**（Zod）+ **events schema**（Zod）。

**Markdown**

```ts
props: {
  content: z.string(),                           // MDX 源码
  id_prefix: z.string().optional(),
}
events: {
  "markdown.link_clicked": { url: z.string().url() },
  "markdown.code_copied":  { block_id: z.string() },
}
```

`content` 支持嵌入其他语义组件（`<Quiz>` / `<FlashCard>`…）—— runtime 编译时注入 catalog 里的 React 组件。

**Quiz**

```ts
props: {
  title: z.string().optional(),
  questions: z.array(z.object({
    id: z.string(),
    kind: z.enum(["single_choice", "multi_choice", "short_answer"]),
    prompt: z.string(),
    options: z.array(z.object({
      id: z.string(),
      label: z.string(),
      is_correct: z.boolean().optional(),
    })).optional(),
    correct_answer: z.union([z.string(), z.array(z.string())]).optional(),
    explanation: z.string().optional(),
  })),
  reveal_mode: z.enum(["immediate", "on_submit", "never"]).default("on_submit"),
  allow_retry: z.boolean().default(true),
}
events: {
  "quiz.answer_submitted":  { question_id, value: unknown },
  "quiz.all_submitted":     { answers: Record<string, unknown> },
  "quiz.explanation_shown": { question_id },
}
```

**FlashCard**

```ts
props: {
  deck_id: z.string(),                           // Phase 2 SRS 绑定 key
  cards: z.array(z.object({
    id: z.string(),
    front: z.string(),                           // MDX
    back:  z.string(),                           // MDX
    tags: z.array(z.string()).optional(),
  })),
  mode: z.enum(["study", "review"]).default("study"),
  show_progress: z.boolean().default(true),
}
events: {
  "flashcard.flipped":        { card_id },
  "flashcard.rated":          { card_id, rating: "again" | "hard" | "good" | "easy" },
  "flashcard.deck_completed": { card_ids_seen: string[] },
}
```

**StepByStep**

```ts
props: {
  title: z.string().optional(),
  steps: z.array(z.object({
    id: z.string(),
    heading: z.string(),
    content: z.string(),                         // MDX
    initially_open: z.boolean().default(false),
    required: z.boolean().default(false),
  })),
  navigation: z.enum(["free", "sequential"]).default("free"),
}
events: {
  "step.expanded":    { step_id },
  "step.collapsed":   { step_id },
  "step.marked_done": { step_id },
}
```

**Diagram**

```ts
props: {
  source: z.string(),                            // Mermaid 源码
  caption: z.string().optional(),
  allow_zoom: z.boolean().default(true),
  allow_download: z.boolean().default(false),
}
events: {
  "diagram.node_clicked": { node_id },
  "diagram.rendered":     { nodes: number, edges: number },
}
```

**Hint / Reveal**

```ts
props: {
  label: z.string().default("提示"),
  content: z.string(),                           // MDX
  style: z.enum(["inline", "modal"]).default("inline"),
}
events: {
  "hint.revealed": {},                           // 空 payload
}
```

#### 课程包目录约定

```
<lesson-id>/
├─ meta.ts              # Zod frontmatter（agent 必读）
├─ index.mdx            # 主教案（agent 必读）
├─ assets/              # 图片 / 音频 / 数据
│  └─ *.png|mp3|csv
├─ quiz.yaml            # 题库侧挂（可选）
├─ flashcards.yaml      # 卡片集侧挂（可选）
└─ README.md            # 人看的简介（可选）
```

**约定的用户侧路径**：`~/interactive-learning/courses/<author>/<lesson-id>/`

#### `meta.ts` Frontmatter Schema

```ts
export const LessonMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  objectives: z.array(z.string()).min(1),
  prereqs: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  est_minutes: z.number().int().positive(),
  language: z.string().default("zh-CN"),
  version: z.string().default("0.1.0"),           // semver，Phase 2 SRS key
  authors: z.array(z.object({
    name: z.string(),
    email: z.string().email().optional(),
  })).default([]),
  agent_hints: z.object({
    teaching_style: z.enum(["socratic", "direct", "example_first"]).optional(),
    suggested_flow: z.array(z.string()).optional(),
    key_moments: z.array(z.string()).optional(),
  }).optional(),
})
```

**为什么 `.ts` 不是 `.yaml`**：creator agent 能直接类型检查；可 import 共享 Zod schema；Phase 2 课程商店直接 `import` 做索引。

#### 数据侧挂（YAML）

`quiz.yaml` 示例：

```yaml
questions:
  - id: q1
    kind: single_choice
    prompt: "一个函数调用自身叫什么？"
    options:
      - { id: a, label: "迭代", is_correct: false }
      - { id: b, label: "递归", is_correct: true  }
    explanation: "递归（recursion）指函数在其定义中调用自身。"
```

在 `index.mdx` 里（**最终设计**：数据由 agent/CLI 读取并注入，不在浏览器侧读文件）：

```mdx
<Quiz questions={QUIZ_QUESTIONS} reveal_mode="on_submit" />
```

Agent（或创作者用的 `@interactive-learning/cli validate`）在加载课程包时读取 `quiz.yaml`、过 Zod 校验后，把 `questions` 作为字面量数据传入 `render_component`。浏览器侧 MDX runtime 经 AST 白名单后不具备文件读取能力，因此 **不提供** `importYaml` helper（出于 NFR-SEC-03：禁止任意 import / 浏览器文件读取）。早期草稿曾设想过 browser 侧 `importYaml` runtime helper，评审阶段被否决。

#### Agent 消费 course pack 的推荐流程

1. Read `<path>/meta.ts` — frame 会话
2. Read `<path>/index.mdx` — 教案内容
3. Read side-car data（若 index.mdx 引用）
4. Read `catalog://components` resource
5. `render_component(...)` 首屏（懒启动浏览器）
6. 进入 `wait_for_event` 循环

#### 分发 & 版本

- git / zip / 未来的 `npx create-interactive-lesson` 脚手架
- 命名：`<author>/<lesson-id>`
- 版本：`meta.ts.version` 走 semver；Phase 2 SRS state 按 `<lesson-id>@<major>` 键
- 不做 Phase 1 中心注册表

---

### 6.3 Agent Skills & 可插拔性（设计 §4）

#### Skill 包结构（单源 → 多格式）

```
@interactive-learning/skills/
├─ src/
│  └─ skill.md                             # 单一真相源
├─ dist/
│  ├─ claude-code/interactive-learning/SKILL.md
│  ├─ codex/interactive-learning.md
│  └─ cursor/.cursorrules
├─ install.ts                              # 自动探测 + 落盘
└─ package.json
```

构建脚本读 `src/skill.md` + 每个 agent 的 frontmatter 模板生成对应产物。加新 agent = 加一份模板。

分发一条命令：`npx @interactive-learning/install`（探测装了哪些 agent → 落盘 config + skill）。

#### Skill 内容骨架

```markdown
---
name: interactive-learning
description: 用于交互式学习——用户想系统学一个话题、跑一节课、创建/消费课程包时触发。
---

# Interactive Learning Skill

## 何时用 / 何时不用
用：要"交互式学 X"、跑一节课、/start_lesson、创建课程包
不用：纯对话解释、调试代码、一次性简单问答

## 消费者回路
1. 读 meta.ts → index.mdx → YAML 侧挂
2. 读一次 catalog://components
3. render_component 首屏
4. 循环：wait_for_event(timeout=25000) → 处理 events → render/update
5. end_session(reason)

## 创作者回路
1. 对齐 objectives
2. 写 meta.ts
3. 写 index.mdx（可嵌组件）
4. 抽题目/卡片到 YAML
5. npx @interactive-learning/validate <path> 校验

## 关键约束（反模式）
❌ 不在 tool call 间 tight-loop render
❌ 不重复读 catalog
❌ 不阻塞超过 25s
❌ 不发明 catalog 外的 component type
❌ 不吞 Zod 校验错

## 错误恢复
- Zod 失败：读 error.path → 修 props → 重试
- 浏览器断连：server 保状态，重新 render 最近视图
- session 30min 空闲：告知用户是否新开

## 教学风格（按 meta.ts.agent_hints）
socratic / direct（默认）/ example_first
```

#### 每个主流 agent 的安装流程

**Claude Code**

```bash
claude mcp add interactive-learning -- npx @interactive-learning/mcp
mkdir -p ~/.claude/skills/interactive-learning
cp dist/claude-code/interactive-learning/SKILL.md ~/.claude/skills/interactive-learning/
```

或手动编辑 `.mcp.json`：

```json
{
  "mcpServers": {
    "interactive-learning": {
      "command": "npx",
      "args": ["-y", "@interactive-learning/mcp"]
    }
  }
}
```

**Codex CLI**（注意 TOML）

```toml
[mcp_servers.interactive-learning]
command = "npx"
args = ["-y", "@interactive-learning/mcp"]
```

**Cursor**

```json
{
  "mcpServers": {
    "interactive-learning": {
      "command": "npx",
      "args": ["-y", "@interactive-learning/mcp"]
    }
  }
}
```

跨 agent 对照：

| | 配置格式 | 配置位置 | Skill 落点 |
|---|---|---|---|
| Claude Code | JSON | `~/.claude.json` · `.mcp.json` | `~/.claude/skills/<name>/SKILL.md` |
| Codex CLI | **TOML** | `~/.codex/config.toml` | `~/.codex/instructions/` · `AGENTS.md` |
| Cursor | JSON | `~/.cursor/mcp.json` · `.cursor/mcp.json` | `.cursorrules` · `.cursor/rules/*.mdc` |

installer.ts 用 `@iarna/toml` 处理 Codex 的 TOML 分支。

#### 加新 agent 的契约

PR 模板：

```
dist/<agent-name>/
├─ skill-template.md       # agent 自己的 frontmatter 格式
├─ install.md              # 人类可读的安装文档
└─ detect.ts               # 返回 boolean：这个 agent 是否已装
```

installer.ts 扫 `dist/*/` 目录自动注册，无需改核心。

#### Skill 迭代节奏

| 版本 | 范围 |
|---|---|
| v0.1 MVP | 只发 Claude Code skill；Codex/Cursor 仅手动安装说明 |
| v0.2 | 加 Codex TOML installer + 1-2 个 demo 课程包 |
| v0.3 | 开 community 通道接其他 agent PR |
| v1.0 | `npx install` 自动多 agent 一键装 |

---

### 6.4 错误处理 · Phase 2 hooks · 测试策略（设计 §5）

#### 错误处理（五类）

**A. Agent 侧调用错误（Zod / 未知组件 / 坏 patch）**

返回结构化 MCP JSON-RPC error：

```ts
{
  code: -32602,
  message: "Props validation failed for component 'Quiz'",
  data: {
    component: "Quiz",
    issues: [
      { path: ["questions", 0, "kind"],
        expected: "single_choice | multi_choice | short_answer",
        received: "boolean_choice" },
    ]
  }
}
```

Skill 教 agent 读 error.path → 修 props → 重试。

**B. 传输层断连**

| 断连 | 服务端行为 | 客户端行为 |
|---|---|---|
| agent stdio 断 | 进程退出 → HTTP/WS 关 | 浏览器 WS 1001 close → "会话已结束"页 |
| 浏览器 WS 断 | 保留 SessionStore（最多 5 min） | WS 指数退避重连 → 拉 `session://current/state` 全量 reconcile |
| 浏览器连错 session | 校验 session_id + agent pid 不一致 → 拒绝 | 显示"session 已换，请刷新" |

浏览器断连 ≠ agent 断连；服务端状态以 agent 侧为权威。

**C. 协议兼容（已知 Claude Code bug 兜底）**

| Bug | 兜底 |
|---|---|
| `Accept` header 缺失被当 auth（#42470） | 严格返回 `application/json, text/event-stream`，不启 auth |
| `MCP_TOOL_TIMEOUT` HTTP 不尊重（#17662） | 坚持 stdio；`wait_for_event` ≤ 25s 自保 |
| 多 session 抢端口（#29688） | 随机 49152-65535 + `~/interactive-learning/ports.lock` 记录 |
| `protocolVersion` 不一致 | echo client 版本；≤ 2 版本差按老版本；差距过大返回 initialize error |

**D. 浏览器侧错误**

| 情况 | 处理 |
|---|---|
| Tab 关闭 | 标记 `browser_connected=false`；agent 可通过 `session://current/state` 查知 |
| React 渲染错 | ErrorBoundary 包每个 slot → fallback UI + 推 `component.render_error` |
| Mermaid / MDX 解析错 | 组件级 fallback，显示原始 source + 错误；推 `component.render_error` |
| JS 未捕获异常 | `window.onerror` → 推 `session.uncaught_error`；session 不终止 |

**E. Session 生命周期**

| 情况 | 处理 |
|---|---|
| 30 min 空闲 | 25 min 时通过 `session://current/state` 更新 warn 标志；30 min 自终止 |
| 同 stdio 再建 session | 复用现有（幂等）；agent 可 `end_session` 显式清 |
| 端口全不可用 | 重试 5 次后 MCP initialize error |

#### Phase 2 Hooks（Phase 1 保留的抽象）

**Hook 1 — SessionStore 订阅点**

```ts
interface SessionStore {
  onEvent(cb: (e: Event) => void): Unsubscribe
  onSlotChange(cb: (slot: SlotState) => void): Unsubscribe
  onSessionLifecycle(cb: (kind: "start" | "end" | "timeout", s: Session) => void): Unsubscribe
}
```

Phase 1 有 1 个订阅者（WS broadcaster）；Phase 2 加第二个（SQLite writer）。不改接口。

**Hook 2 — 标准数据目录**

```
~/interactive-learning/
├─ courses/                    # Phase 1 只读
│  └─ <author>/<lesson-id>/
├─ state.db                    # Phase 2 SQLite
├─ sessions/                   # Phase 2 per-session JSON 归档
│  └─ <session-id>.json
└─ config.json                 # 通用配置
```

**Hook 3 — 稳定 id**（已在 §6.2 schema）

所有事件 payload 带 `deck_id` / `card_id` / `question_id` / `step_id`。Phase 2 SQLite schema 预览：

```sql
CREATE TABLE sessions (
  session_id   TEXT PRIMARY KEY,
  lesson_id    TEXT, lesson_version TEXT,
  started_at   INTEGER, ended_at INTEGER,
  agent_name   TEXT
);

CREATE TABLE events (
  event_id     TEXT PRIMARY KEY,
  session_id   TEXT REFERENCES sessions,
  timestamp    INTEGER,
  slot_id      TEXT, type TEXT, payload_json TEXT
);

CREATE TABLE fsrs_card_state (
  deck_id TEXT, card_id TEXT,
  due INTEGER, stability REAL, difficulty REAL,
  reps INTEGER, lapses INTEGER, state TEXT,
  last_review INTEGER,
  PRIMARY KEY (deck_id, card_id)
);

CREATE TABLE lesson_progress (
  lesson_id TEXT, lesson_version TEXT,
  completed_steps_json TEXT, last_visited INTEGER,
  PRIMARY KEY (lesson_id, lesson_version)
);
```

Phase 1 schema 与此一致。

**Hook 4 — 预留 tool / resource 命名**

Phase 2 会加：

- tool `export_session(format, path)`
- tool `get_review_queue({ deck_id?, limit? })`
- resource `history://sessions/<id>`
- resource `history://decks/<deck_id>/due`

Phase 1 不实现；不与现有 4 tools 冲突。

#### 测试策略（三层金字塔）

| 层 | 工具 | 覆盖 | 占比 |
|---|---|---|---|
| Unit | Vitest | Zod schema、SessionStore、cursor 逻辑 | ~60% |
| Integration | Vitest + MCP SDK client 内嵌 | tool 往返 → SessionStore → mock browser | ~30% |
| E2E | Playwright | chrome + MCP stdio 子进程 + 完整 loop | ~10% |

**必须覆盖的关键场景**：

1. 六个组件各 render + DOM 断言
2. 每个组件的事件触发 → SessionStore 收到 + cursor 递增 + slot_version 一致
3. Agent loop 端到端：render → 点击（Playwright）→ wait_for_event → render 响应
4. `wait_for_event` 假时钟推进，单次 ≤ 30s
5. Cursor 防丢防重：agent 漏 poll 后能 catch up
6. Slot version 过滤：替换 slot 后旧事件被丢
7. 浏览器断连重连：reconcile 等于原状态
8. 空闲超时：25/30 min 假时钟断言
9. Zod 校验失败返回结构化 error
10. 端口冲突兜底：重试 + 最终 initialize error

**Phase 1 不测**：

- 跨 agent 集成（Codex / Cursor）—— 手动 smoke + v0.2 再写
- SQLite —— Phase 2
- 视觉回归 —— Phase 2

**CI**：`pnpm test`（unit + integration，< 30s）· `pnpm test:e2e`（Playwright，~2min）· GitHub Actions push + PR，main 额外跑 Node 20/22 矩阵。

---

## 7. Phase 2 愿景（已约定，设计时预留 hook）

- 在用户本地（filesystem 或 SQLite）持久化：会话交互历史、FlashCard 的 FSRS review 记录、课程学习进度、agent 的"笔记"
- 复习 UI：基于 FSRS 的每日复习 queue
- 整理 UI：把零散对话整理成结构化笔记
- **设计约束**：Phase 1 的 SessionStore 暴露"事件流"抽象，Phase 2 只加订阅者（SQLite writer），不改核心架构

---

## 参考链接

### MCP

- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Apps Overview](https://modelcontextprotocol.io/extensions/apps/overview)
- [2026 MCP Roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/)

### Generative UI

- [AG-UI Protocol](https://docs.ag-ui.com/introduction)
- [Vercel json-render (InfoQ)](https://www.infoq.com/news/2026/03/vercel-json-render/)
- [CopilotKit Generative UI Guide 2026](https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026)

### 前端栈

- [shadcn/ui vs Base UI vs Radix 2026](https://www.pkgpulse.com/blog/shadcn-ui-vs-base-ui-vs-radix-components-2026)
- [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)
- [tRPC httpSubscriptionLink (SSE)](https://trpc.io/docs/client/links/httpSubscriptionLink)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)

### 参考实现

- [`@mcp-b/websocket-bridge`](https://www.npmjs.com/package/@mcp-b/websocket-bridge)
- [`chrome-mcp-bridge`](https://glama.ai/mcp/servers/ivoglent/chrome-mcp-bridge)
- [One MCP Server, Two Transports (Microsoft)](https://techcommunity.microsoft.com/blog/azuredevcommunityblog/one-mcp-server-two-transports-stdio-and-http/4443915)

---

## 附录 A：Agent ⇄ 用户回路的具体数据流

> 给"agent 真的在循环里吗？怎么收用户事件？怎么反应？"这个常见疑问一份具体回答。

### A.1 核心机制

中间件不是"agent 一次性渲染完就完了"，而是**让 LLM 持续在循环里**：

```text
agent → render UI → 等用户 → 拿到事件 → LLM 思考 → 决定下一步 → render UI → 等用户 → ...
```

每次用户点击/输入 = agent 的一个 reasoning turn。这是"AI 个性化辅导"和"电子书"的根本区别。

### A.2 完整 trace（Python decorators 场景）

学习者用 `~/courses/decorators` 课程包学 Python 装饰器，agent 渲染 3 题 Quiz：

```text
时刻         参与方        动作
─────────────────────────────────────────────────────────────────
t=0          学习者        "教我 Python decorators，用 ~/courses/decorators"
t=0.1        Claude Code   读 meta.ts + index.mdx + quiz.yaml
t=0.5        Claude Code   读 catalog://components（一次性，缓存到 session 末）
t=1          Claude Code   render_component({
                              type: "Quiz",
                              props: { questions: [q1,q2,q3], reveal_mode: "on_submit" }
                           })
t=1.05       中间件        创建 slot-1，懒启动 HTTP/WS，open 浏览器 tab
t=1.2        浏览器        渲染 Quiz UI
t=1.21       Claude Code   wait_for_event(since_cursor: "evt-0", timeout_ms: 25000)
                           ← 阻塞，等中间件返回

t=15         学习者        勾选答案，点"提交全部"
t=15.01      浏览器        WS 推送 {
                              type: "quiz.all_submitted",
                              slot_id: "slot-1", slot_version: 1,
                              payload: { answers: {q1:"b", q2:"a", q3:"c"} }
                           }
t=15.02      中间件        存为 evt-1，wait_for_event 解阻塞返回
                              { events: [evt-1], next_cursor: "evt-1" }
t=15.03      Claude Code   LLM 推理:
                           "q1 对、q2 错、q3 对。q2 学习者把 @staticmethod
                            当 @classmethod 用了，常见混淆。"
t=18         Claude Code   先 update 当前 Quiz 显示批改:
                           update_component({
                              slot_id: "slot-1",
                              patch: [{ op:"replace", path:"/reveal_mode", value:"immediate" }]
                           })
t=18.5       Claude Code   再 render 针对性 FlashCard:
                           render_component({
                              type: "FlashCard",
                              props: {
                                deck_id: "decorators-correction",
                                cards: [{
                                   id: "static-vs-class",
                                   front: "@staticmethod vs @classmethod 何时用？",
                                   back: "..."
                                }]
                              }
                           })
t=18.7       Claude Code   wait_for_event(since_cursor: "evt-1", ...)
                           ← 再等

t=30         学习者        翻 FlashCard，评 "good"
t=30.01      浏览器        推 evt-2 (flashcard.flipped) + evt-3 (flashcard.rated, "good")
t=30.02      中间件        wait_for_event 返回
                              { events: [evt-2, evt-3], next_cursor: "evt-3" }
t=30.03      Claude Code   推理: "已掌握，回主线给下一节"
t=33         Claude Code   render_component({ type: "StepByStep", ... })
...                        循环继续
```

### A.3 用户能做什么 → agent 收到什么事件

| 组件 | 用户操作 | 事件流 → agent |
|---|---|---|
| Quiz | 答题、提交、看解释 | `quiz.answer_submitted` / `quiz.all_submitted` / `quiz.explanation_shown` |
| FlashCard | 翻卡、4 级评分 | `flashcard.flipped` / `flashcard.rated` / `flashcard.deck_completed` |
| StepByStep | 展开 / 折叠 / 标记完成 | `step.expanded` / `step.collapsed` / `step.marked_done` |
| Diagram | 点节点 | `diagram.node_clicked` |
| Hint | 揭示 | `hint.revealed` |
| Markdown | 点链接、复制代码 | `markdown.link_clicked` / `markdown.code_copied` |

举例：agent 收到 `hint.revealed` 就知道"学习者卡住了，下一步多给一个例子"。

### A.4 端到端时序

| 环节 | 典型耗时 |
|---|---|
| 用户点击 → 浏览器 WS 发出 | <10ms |
| WS → 中间件 → `wait_for_event` 返回 | <50ms |
| MCP stdio 把 tool result 给 agent | <100ms |
| **LLM 推理 + 决定下一步** | **2-5s（主要瓶颈）** |
| Agent 发 `render_component` → 浏览器更新 | <100ms |

**端到端：用户点击到看见反馈 ≈ 3-6 秒**。辅导场景可接受（人类家教也差不多）。

### A.5 边界情况

| 情况 | 处理 |
|---|---|
| Agent 推理时用户继续点 | 事件入 ring buffer（1000），下次 wait 一次拿完 |
| 用户连续快点 | 同上；cursor 保证不漏不重 |
| Agent 卡 25s 没动作 | `wait_for_event` 自动 timeout 返回空；agent 必须再 poll，避免 60s 硬超时 |
| 新 UI 渲染时旧 UI 事件还在路上 | `slot_version` 过滤丢弃 |
| 用户关浏览器 | 中间件保留 5 min state；agent 可查 `session://current/state`；重开 reconcile |

### A.6 与传统"交互式课程"的本质区别

| | Anki / 电子书 | 我们的设计 |
|---|---|---|
| 答错的反馈 | 写死的解释 | LLM 现场推理混淆模式 + 针对性例子 |
| 学习路径 | 作者预定的线性 / 决策树 | LLM 实时调整难度、跳过已掌握、改风格 |
| 课程外的提问 | 不支持 | 直接 terminal 问 agent；agent 引用 `session://current/state` 看 UI 现状 |
| 内容生成 | 静态 | 课程包是教案；UI 由 agent 现场用 catalog 组件生成 |

### A.7 已知局限

1. **Agent 必须在线** —— 用户不能离线复习；agent 退出 = session 结束。Phase 2 的 SQLite 能恢复"上次到哪"，但纯静态复习需要别的形式
2. **每次反馈 3-6 s 延迟** —— LLM 推理不能压缩；要求 <1 s 的场景（打字测试、节奏游戏）不适合
3. **Token 成本随交互量线性涨** —— skill 必须教 agent 用 `update_component` 增量更新而非 `render_component` 全量重渲染，控制 prompt 重传
4. **Agent 可能误判** —— LLM 对错误模式识别不是 100%；课程包的 `agent_hints.key_moments` 用来给 agent 预先打补丁
