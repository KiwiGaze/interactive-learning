# Interactive Learning — Requirements & Product Document (RPD)

**版本**: v0.1 (Phase 1 MVP)
**日期**: 2026-04-23
**状态**: 待 review → 锁定后进入 writing-plans
**来源**: 基于 [BRAINSTORMING.md](BRAINSTORMING.md) §1–§7 + 附录 A 蒸馏
**约定**: 本文档定义"必须做什么"。"为什么这样选"见 BRAINSTORMING.md。

---

## 1. 产品概述

### 1.1 一句话定义

一个本地运行的 **MCP server 中间件**，给本地 AI agent（Claude Code / Codex / Cursor 等）提供"声明式教育 UI"能力：agent 通过 MCP 工具声明 UI，浏览器中渲染高质量教育组件，用户交互事件双向回流给 agent，使 agent 能在循环中持续教学。

### 1.2 核心价值主张

| 角色 | 痛点 | 本产品提供 |
|---|---|---|
| **学习者** | LLM 对话学习是单线文本，缺交互；电子书/Anki 不能动态适应 | LLM 在线辅导 + 高质量交互组件 + 实时反馈调整 |
| **课程创作者** | 没有标准格式让 agent 既能产出又能消费教学内容 | 标准课程包（MDX + Zod frontmatter），agent 可读可写 |
| **Agent 生态** | 缺少教育垂直领域的 generative UI 标准 | MCP 协议下的可枚举组件目录，跨 agent 通用 |

### 1.3 范围定位

- **Phase 1 (本 RPD)**：协议 + 中间件 + 6 件套组件 + Claude Code skill + 至少 1 份样例课程包
- **Phase 2 (规划)**：本地持久化（SQLite + 文件系统）、复习队列 UI、笔记整理 UI、跨 agent 一键安装
- **明确不做**：企业 LMS（SCORM/xAPI/cmi5）、代码沙箱运行、音频/视频生产、付费分发市场、云端同步

---

## 2. 目标 & 非目标

### 2.1 Phase 1 必达目标

| ID | 目标 | 验证方式 |
|---|---|---|
| G1 | Claude Code 用户 1 行命令安装即可使用 | `claude mcp add` + skill 落盘脚本 ≤ 30s |
| G2 | Agent 在 ≤ 5 个 tool/resource 内完成首屏渲染 | Trace: meta → mdx → catalog → render |
| G3 | 用户从点击到看到 agent 反馈端到端 ≤ 6s | 浏览器 instrumentation + agent 日志 |
| G4 | 6 件套组件覆盖通用学科 60-70% 教学场景 | 至少 3 份不同学科样例课程包通过验收 |
| G5 | 不被 MCP 客户端 60s 硬超时击中 | 长轮询 ≤ 25s + ring buffer 测试 |
| G6 | 课程包格式可被 agent 自主读写 | Creator agent 能用同一 schema 既生成又消费 |

### 2.2 非目标（Phase 1 显式不做）

- ❌ 离线学习（agent 必须在线，见附录 A.7）
- ❌ < 1s 反馈场景（打字测试、节奏游戏等）
- ❌ 多用户协作 / 实时协同
- ❌ 云端账号、数据同步
- ❌ 课程付费 / DRM / 中心注册表
- ❌ MCP Apps 嵌入 host UI 路径（评估为方案 B，已否决）
- ❌ 视觉回归测试、跨浏览器矩阵（仅承诺最新 Chrome / Edge / Safari）

---

## 3. 用户与场景

### 3.1 主要 Persona

| Persona | 描述 | 与产品的关系 |
|---|---|---|
| **学习者 L** | 已装 Claude Code/Codex/Cursor 的开发者或学生；想"系统学一个话题" | 主用户；触发课程消费回路 |
| **课程创作者 C** | 想把自己的领域知识产出成可分发资产的人 | 触发课程创作回路 |
| **Agent 集成方 I** | 想给自家 agent 加教育能力的开发者 | 实现 MCP client + 安装 skill |

### 3.2 关键用户故事（必须支持）

**US-1（消费者主路径）**：L 在 terminal 输入"教我 Python 装饰器，用 ~/courses/decorators"，agent 自动加载课程包，浏览器自动开 tab，L 在 UI 里答题、翻卡、看图，agent 根据 L 的反应实时调整教学节奏。

**US-2（创作者主路径）**：C 让 agent "为'递归'这个主题做一份课程包到 ~/courses/recursion"，agent 自动产出符合 schema 的 MDX + meta.ts + quiz.yaml，C 用 `npx @interactive-learning/validate` 校验通过。

**US-3（断连恢复）**：L 学到一半关了浏览器 tab，agent 仍在线；L 重开 tab，UI 恢复到关闭时刻状态，可继续交互。

**US-4（创作-消费闭环）**：C 产出的课程包 zip 给 L，L 解压到 `~/courses/`，正常加载消费；中间无需任何中心服务。

**US-5（多 agent 兼容）**：同一课程包能在 Claude Code、Codex、Cursor 中无差异加载（Phase 1 v0.1 仅 Claude Code 一键装；其他靠手动 config + 文档）。

---

## 4. 功能需求

> 命名：`FR-<域>-<编号>`。每条要求对应至少一条可验证的验收标准。

### 4.1 MCP Server 接口（FR-MCP-*）

#### FR-MCP-01 · Tool 表面（4 个 tools）

Server 必须暴露且仅暴露以下 4 个 tools；输入 / 输出 schema 见 BRAINSTORMING §6.1。

| Tool | 必须行为 |
|---|---|
| `render_component` | 三种语义：新增 slot / 替换 slot（`replace=true`）/ 拒绝重复 id；立即返回（不阻塞）；返回 `{ slot_id, cursor }` |
| `update_component` | 对已有 slot.props 应用 RFC 6902 JSON Patch；必须先计算 next props → 过组件 Zod schema 校验 → 通过后才提交 state、追加 `component.updated` 事件、推进 cursor；校验或 patch 失败不得部分应用、不得发出事件、不得推进 cursor |
| `wait_for_event` | 长轮询；timeout 上限 30000ms 默认 25000ms；有事件立即返回；超时返回 `events=[]` 且 `next_cursor === since_cursor` |
| `end_session` | 主动收尾；浏览器切到"会话已结束"页 |

**验收**：自动化测试覆盖三种 `render_component` 语义、`update_component` 回滚、`wait_for_event` 阻塞 / 超时 / 立即返回三条路径。

#### FR-MCP-02 · Resource 表面（2 个 resources）

| URI | 行为 |
|---|---|
| `catalog://components` | 返回所有组件 type、props JSON Schema、events schema；session 内稳定 |
| `session://current/state` | 返回 slot 树 + 最近事件 + cursor 的 JSON 快照 |

**验收**：`catalog://components` 返回的 JSON Schema 必须能让 agent 通过 schema 自校验 props（不依赖运行时报错）；`session://current/state` 在 browser 重连时能完全 reconcile UI。

#### FR-MCP-03 · Prompt 表面（1 个 prompt）

`/start_lesson <path>` 展开为指导 agent 读 `<path>/meta.ts`、`index.mdx`、`catalog://components` 然后渲染首屏的指令模板。

**验收**：在 Claude Code 中 `/start_lesson` 触发后，agent 调用顺序符合预期。

#### FR-MCP-04 · 事件模型与游标

- 所有事件必须携带 `event_id` (UUID v7) / `timestamp` / `slot_id` / `slot_version` / `type` / `payload`
- `slot_version` 必须用于过滤旧 slot 的 in-flight 事件
- Server 维护 ring buffer 容量恰好 1000 条，超出淘汰最早
- Cursor 单调递增，保证 0 漏 0 重
- **Cursor 过期语义**：当 `since_cursor` 已被 ring buffer 淘汰（或不存在于缓冲区），`wait_for_event` / `eventsAfter` 必须返回结构化 `CURSOR_EXPIRED` 错误（而不是空事件数组），提示调用方读 `session://current/state` 做全量 reconcile。

**验收**：自动化测试 — 替换 slot 后旧事件被丢弃；agent 漏 poll 后能 catch up；buffer 满时最早事件被淘汰；cursor 落在已淘汰区间时返回 `CURSOR_EXPIRED` 而非空数组。

#### FR-MCP-05 · 输入校验

- 所有 tool input 必须过 Zod 校验
- `render_component` / `update_component` 的 props 必须按 catalog schema 二次校验
- 校验失败必须返回结构化 MCP JSON-RPC error（含 `path` + `expected` + `received`）
- 禁止"善意填充"缺失字段

**验收**：传入非法 props（含枚举越界、缺必填、类型不符）必须返回带具体 path 的错误，agent skill 能据此修正重试。

#### FR-MCP-06 · 命名空间保留

- `component.*`（如 `component.render_error`）和 `session.*`（如 `session.uncaught_error`）由框架占用
- 组件自定义事件不得使用上述前缀

**验收**：catalog 注册时如有命名空间冲突必须在 server 启动期失败，不得静默通过。

---

### 4.2 进程拓扑与传输（FR-PROC-*）

#### FR-PROC-01 · 单进程拓扑

- 一个 Node 进程同时承载 stdio MCP server + Fastify HTTP + WebSocket
- 三者共享同一个 in-memory `SessionStore`
- 不引入守护进程、不跨进程 IPC

#### FR-PROC-02 · 端口管理

- 监听 `127.0.0.1`，**仅** localhost
- 端口策略：先尝试固定 fallback 端口（用于 human-friendly URL）→ 失败则在 `49152-65535` 随机
- 重试上限 5 次后 MCP `initialize` 阶段返回 error
- 用 `~/interactive-learning/ports.lock` 防止多实例抢端口

#### FR-PROC-03 · 懒启动

- HTTP/WS 必须在 agent 第一次调用 UI tool 时才启动
- 启动后自动 `open` 浏览器 tab 一次（同一 session 内不重复）

#### FR-PROC-04 · 生命周期

| 触发 | 行为 |
|---|---|
| stdio 断开 | 进程退出；HTTP/WS 同步关闭 |
| 浏览器 WS 断开 | 保留 SessionStore 至多 5 分钟，等待重连 |
| 30 分钟内既无 agent tool call 也无 browser event | 进程自终止；25 分钟时通过 `session://current/state` 标记 warn |
| 同一 stdio 再建 session | 复用现有（幂等） |

**验收**：假时钟测试 25/30 分钟边界；端口冲突 5 次重试后失败；stdio 断 → 进程退出 ≤ 1s。

---

### 4.3 组件库（FR-CMP-*）

#### FR-CMP-01 · MVP 六件套

必须实现且仅实现以下 6 个组件，schema 见 BRAINSTORMING §6.2：

1. **Markdown**（含 MDX runtime + 嵌套语义组件能力）
2. **Quiz**（single_choice / multi_choice / short_answer）
3. **FlashCard**（含 `deck_id` + 4 级评分；Phase 1 不接 SRS 算法但事件 schema 已留 hook）
4. **StepByStep**（free / sequential 两种导航）
5. **Diagram**（Mermaid v11）
6. **Hint / Reveal**（inline / modal）

**验收**：每个组件自动化测试覆盖 (a) render + DOM 断言 (b) 至少一条事件触发 → SessionStore 收到。

#### FR-CMP-02 · 组件契约

- 每个组件必须暴露三元组：`type` + `props` Zod schema + `events` Zod schema
- 组件内部状态由组件自管，不通过 `update_component` 触碰
- 所有事件 payload 必须带稳定 id（`question_id` / `card_id` / `step_id` / `deck_id`）— 为 Phase 2 SQLite 留 hook

#### FR-CMP-03 · 渲染错误隔离

- 每个 slot 用 React ErrorBoundary 包裹
- 渲染异常必须显示 fallback UI 并推送 `component.render_error` 事件
- 单个 slot 崩溃不得影响其他 slot

**验收**：故意传入坏 Mermaid / 坏 MDX，对应 slot 显示 fallback，其他 slot 正常，agent 收到 `component.render_error`。

#### FR-CMP-04 · 可访问性下限

- 所有交互组件（Quiz / FlashCard / StepByStep / Hint）必须键盘可达（Tab / Enter / Esc）
- 焦点管理符合 Radix 默认

**验收**：手动 a11y 检查清单通过；Phase 1 不做自动化 a11y 测试。

---

### 4.4 课程包格式（FR-PKG-*）

#### FR-PKG-01 · 目录约定

```
<lesson-id>/
├─ meta.ts              # 必需
├─ index.mdx            # 必需
├─ assets/              # 可选
├─ quiz.yaml            # 可选
├─ flashcards.yaml      # 可选
└─ README.md            # 可选
```

用户侧根目录约定：`~/interactive-learning/courses/<author>/<lesson-id>/`

#### FR-PKG-02 · `meta.ts` Schema

实现 `LessonMetaSchema`（见 BRAINSTORMING §6.2）；`id` / `title` / `summary` / `objectives`(min 1) / `est_minutes` 为必填。

#### FR-PKG-03 · MDX runtime 编译（受限）

- 用 `@mdx-js/mdx` 在浏览器侧 runtime 编译（不依赖构建步）
- **AST 白名单**：编译前 remark 阶段拒绝 `mdxjsEsm`（import/export）、`mdxFlowExpression` / `mdxTextExpression`（任意 `{…}` JS 表达式）、以及不在 catalog 中的 JSX 标签；遇到上述节点抛结构化错误，组件显示 fallback。
- MDX 中 `<Quiz>` / `<FlashCard>` 等必须能从 catalog 注入
- **不提供** 浏览器侧文件读取 helper（含 `importYaml`）；所有结构化数据（quiz / flashcards 等）由 agent/CLI 读取 YAML、Zod 校验后作为 props 直接传入 `<Quiz questions={...} />`。MDX 仅承载受限标记与白名单组件。

#### FR-PKG-04 · 校验工具

提供 `npx @interactive-learning/validate <path>` CLI：
- 校验 meta.ts 通过 Zod
- 校验 quiz.yaml / flashcards.yaml schema
- 解析 index.mdx 检查嵌入组件 props 合法
- 报告人类可读的错误（含文件 + 行号）

**验收**：CLI 在 3 份样例课程包（含 1 份故意有错的）上输出预期结果。

---

### 4.5 浏览器 UI（FR-WEB-*）

#### FR-WEB-01 · SPA 拓扑

- Vite + React 19 单页应用
- 路径 `/` 渲染当前 session 的 slot 树
- 路径 `/closed` 显示"会话已结束"页（带 Phase 2 占位的"导出会话"按钮）

#### FR-WEB-02 · 双向通信

- WebSocket 连接到本地 server
- 断线指数退避重连（initial 500ms，cap 10s）
- 重连后立即拉 `session://current/state` 全量 reconcile
- 所有用户事件经 WS 上报 server

#### FR-WEB-03 · 全局错误捕获

- `window.onerror` / `unhandledrejection` 必须推送 `session.uncaught_error`，但不终止 session
- ErrorBoundary 见 FR-CMP-03

#### FR-WEB-04 · 视觉规范

- shadcn/ui + Tailwind v4
- 默认浅色主题；提供 `prefers-color-scheme` 跟随
- Phase 1 不做主题切换 UI

---

### 4.6 Agent Skills & 安装（FR-SKILL-*）

#### FR-SKILL-01 · Skill 单源多格式

- `src/skill.md` 为单一真相源
- 构建产出 `dist/<agent>/` 各自格式（claude-code / codex / cursor）
- 加新 agent = 加一份 `dist/<agent>/` 模板，无需改核心

#### FR-SKILL-02 · Skill 内容必须教导

- 消费者循环（render → wait_for_event 25s → 处理 → 重复）
- 创作者循环（meta → mdx → yaml → validate）
- 反模式：tight-loop、重复读 catalog、阻塞 > 25s、发明 catalog 外组件
- 错误恢复：Zod 失败读 path → 修 props → 重试

#### FR-SKILL-03 · 安装命令（Phase 1 v0.1）

| Agent | 必须支持 |
|---|---|
| Claude Code | `claude mcp add interactive-learning -- npx @interactive-learning/mcp` + skill 一键拷贝脚本 |
| Codex CLI | 提供 TOML 片段 + 文档 |
| Cursor | 提供 JSON 片段 + 文档 |

Phase 1 v0.1 Codex / Cursor 可手动；v0.2 提供 `npx @interactive-learning/install` 自动探测多 agent。

#### FR-SKILL-04 · MCP 分发

- 主包发布为 `@interactive-learning/mcp`，支持 `npx -y` 零安装运行
- 启动时间（首次 npx 拉取除外）≤ 1s

**验收**：clean 环境下 `npx -y @interactive-learning/mcp` 能起进程并响应 MCP `initialize`。

---

### 4.7 错误处理（FR-ERR-*）

按 BRAINSTORMING §6.4 五类错误，每类必须有显式行为：

| ID | 类别 | 必须行为 |
|---|---|---|
| FR-ERR-A | Agent 调用错误 | 返回结构化 JSON-RPC error 含 path |
| FR-ERR-B | 传输断连 | 见 FR-PROC-04；浏览器断连 5 min state 保留 |
| FR-ERR-C | MCP 客户端已知 bug | `Accept` header 严格、坚持 stdio、端口随机 + lockfile、`protocolVersion` 兜底 |
| FR-ERR-D | 浏览器侧错误 | ErrorBoundary + `component.render_error` + `session.uncaught_error` |
| FR-ERR-E | Session 生命周期 | 见 FR-PROC-04 |

---

## 5. 非功能需求

### 5.1 性能（NFR-PERF-*）

| ID | 指标 | 目标 |
|---|---|---|
| NFR-PERF-01 | `render_component` p95 延迟 | ≤ 100ms（不含浏览器渲染） |
| NFR-PERF-02 | `wait_for_event` 空轮询 RTT | ≤ 50ms |
| NFR-PERF-03 | 用户点击 → agent 收到事件 | ≤ 100ms（不含 LLM 推理） |
| NFR-PERF-04 | Server 启动到 MCP `initialize` 完成 | ≤ 1s（已 npx 缓存） |
| NFR-PERF-05 | 浏览器 SPA 首屏 TTI | ≤ 1.5s |
| NFR-PERF-06 | 端到端用户感知（点击→可见反馈） | ≤ 6s（含 LLM 推理） |

### 5.2 安全（NFR-SEC-*）

| ID | 要求 |
|---|---|
| NFR-SEC-01 | 仅监听 `127.0.0.1`，不可被远程访问 |
| NFR-SEC-02 | MCP server 不暴露 file system / shell 能力（catalog 之外的 tool 一律不允许） |
| NFR-SEC-03 | MDX 运行时在 remark 阶段拒绝 `mdxjsEsm` / `mdxFlowExpression` / `mdxTextExpression` 与 catalog 之外的 JSX 标签；禁止 `<script>` / `<iframe>` / `<object>` 以及 `eval` / `Function` / 任意 `import`；违规节点抛错由 ErrorBoundary 兜住 |
| NFR-SEC-04 | 课程包资源（assets/）只允许从 lesson 目录内加载，禁止 `..` 越界 |
| NFR-SEC-05 | WebSocket 必须校验 `Origin` header，拒绝非自身 SPA 的连接 |

### 5.3 兼容性（NFR-COMPAT-*）

| ID | 要求 |
|---|---|
| NFR-COMPAT-01 | Node 20 LTS / 22 双矩阵 CI 通过 |
| NFR-COMPAT-02 | macOS / Linux / Windows 三平台基本可运行（Windows 端口 / 路径优先靠 CI 矩阵） |
| NFR-COMPAT-03 | 浏览器：最新两版 Chrome / Edge / Safari |
| NFR-COMPAT-04 | MCP 协议版本 2025-11-25；与 client 不一致时 echo client 版本，差距 > 2 拒绝 |
| NFR-COMPAT-05 | Phase 1 v0.1 必须在 Claude Code 通过端到端 demo |

### 5.4 可观测性（NFR-OBS-*）

| ID | 要求 |
|---|---|
| NFR-OBS-01 | 所有 tool call / event 在 server 端结构化日志（pino） |
| NFR-OBS-02 | 日志默认输出 stderr，不污染 stdio JSON-RPC channel |
| NFR-OBS-03 | 提供 `DEBUG=interactive-learning:*` 详细日志 |
| NFR-OBS-04 | session id 贯穿日志 + 浏览器 console |

### 5.5 可维护性（NFR-MAINT-*）

| ID | 要求 |
|---|---|
| NFR-MAINT-01 | TypeScript strict mode；禁止 `any` |
| NFR-MAINT-02 | 单测 + 集成测覆盖率 ≥ 80%（按行） |
| NFR-MAINT-03 | E2E 关键场景 ≥ 10 条（见 §7.3） |
| NFR-MAINT-04 | 所有公共 API 必须 export TypeScript 类型 |

---

## 6. 系统架构（高层）

### 6.1 拓扑

```
agent (stdio JSON-RPC) ⇄ Node 进程 (MCP server + SessionStore + Fastify + WS) ⇄ 浏览器 SPA (React + shadcn)
                                              │
                                              └─ 读 ~/interactive-learning/courses/...
```

详细图见 BRAINSTORMING §4.3。

### 6.2 仓库结构（pnpm workspaces）

```
packages/
├─ protocol/       # 共享 Zod schema、事件类型、catalog 接口
├─ mcp-server/     # stdio MCP server + Fastify + WS + SessionStore
├─ ui/             # Vite + React SPA + 6 件套组件
├─ skills/         # 单源 skill.md + 多 agent dist 构建
├─ cli/            # validate / install CLI
└─ examples/       # 至少 3 份样例课程包
```

### 6.3 关键数据结构

`Session` / `SlotState` / `Event` 见 BRAINSTORMING §6.1。

### 6.4 Phase 2 预留 Hook

| Hook | Phase 1 行为 | Phase 2 用途 |
|---|---|---|
| `SessionStore.onEvent / onSlotChange / onSessionLifecycle` | 仅 WS broadcaster 一个订阅者 | 加 SQLite writer 订阅者 |
| `~/interactive-learning/state.db` 路径 | 不创建 | SQLite 文件位置 |
| 事件 payload 稳定 id | 已实现 | SQLite schema 主键 |
| 保留 tool 名 `export_session` / `get_review_queue` | 不实现 | Phase 2 加入 |

---

## 7. 验收标准（汇总）

> 每条 FR 的验收已嵌入；本节列出**端到端**必过关卡。

### 7.1 Demo 验收（Phase 1 v0.1 发版门槛）

- [ ] Clean 机器：`npm install -g @anthropic-ai/claude-code` → `claude mcp add ...` → `/start_lesson ~/courses/decorators` → 浏览器自动开 → Quiz 渲染 → 答题 → agent 反馈 → FlashCard 出现 → 翻卡评分 → StepByStep 出现，全程无人工干预
- [ ] 同一 demo 在关浏览器再开后能 reconcile
- [ ] 同一课程包在 Codex CLI（手动 config）能完成相同流程

### 7.2 自动化测试（CI 必过）

- [ ] Unit + Integration 覆盖率 ≥ 80%，运行 < 30s
- [ ] E2E（Playwright）≥ 10 场景，运行 ≤ 2 min（见 BRAINSTORMING §6.4 测试策略）
- [ ] CI 矩阵：Node 20/22，macOS/Ubuntu

### 7.3 必须覆盖的关键 E2E 场景

1. 6 件套各 render + DOM 断言
2. 每个组件至少一条事件触发 → SessionStore 收到 + cursor 递增 + slot_version 一致
3. Agent loop 端到端：render → 点击（Playwright）→ wait_for_event → render 响应
4. `wait_for_event` 假时钟单次 ≤ 30s，超时返回空
5. Cursor 防丢防重：模拟漏 poll 后 catch up
6. Slot version 过滤：替换 slot 后旧事件被丢
7. 浏览器断连重连：reconcile 等于原状态
8. 25/30 min 空闲超时假时钟断言
9. Zod 校验失败返回结构化 error
10. 端口冲突兜底：5 次重试后 initialize error

---

## 8. 风险 & 缓解

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| MCP 客户端实现差异（已知 6 个 bug） | 高 | 中 | FR-ERR-C 显式兜底；Claude Code 优先打通 |
| LLM 推理延迟使 ≤ 6s 目标不达 | 中 | 中 | NFR-PERF 仅承诺中间件部分；skill 教 agent 用 `update_component` 增量更新降 token |
| MDX runtime 安全漏洞 | 中 | 高 | NFR-SEC-03 严格白名单；课程包来自不可信源时给用户警告 |
| 课程包格式被滥用为通用 SPA | 低 | 中 | 文档 + lint 限制；不支持自定义 React 组件注入 |
| `npx` 冷启动慢导致首启体验差 | 中 | 低 | 文档建议预先 `npm i -g`；记录首启耗时 |
| Anki/电子书用户期待离线复习 | 高 | 中 | 明确 Phase 1 限制（附录 A.7）；Phase 2 SQLite 解决 |

---

## 9. Phase 2 规划（仅备忘，不锁定）

- 本地持久化（SQLite + 文件系统）：会话历史、FSRS review、课程进度、agent 笔记
- FSRS-6 复习 queue UI（接 `ts-fsrs`）
- 笔记整理 UI：把零散对话归档为结构化笔记
- `npx @interactive-learning/install` 多 agent 自动探测
- 跨 agent 一键安装 + Codex / Cursor 一等公民支持
- `export_session` / `get_review_queue` 等 Phase 2 tool

详见 BRAINSTORMING §7。

---

## 10. 待决策 / 待确认

> Lock RPD 前需 user 拍板的项。

| ID | 问题 | 默认建议 |
|---|---|---|
| OQ-1 | 包命名空间 `@interactive-learning/*` 是否最终命名？是否抢注 npm? | 是；尽快抢注 |
| OQ-2 | Fallback 端口选哪个？（影响 human-friendly URL） | 建议 `7654`（少冲突） |
| OQ-3 | 默认课程包根目录 `~/interactive-learning/courses/` 是否可接受？Windows 用 `%USERPROFILE%\interactive-learning\courses\` | 接受 |
| OQ-4 | Phase 1 是否承诺 Windows 兼容？（影响测试矩阵） | 承诺基本可运行；Windows 路径用 `path.join` |
| OQ-5 | 6 件套之外，第一版是否再加 1 个 STEM 必备组件（如 Math/KaTeX）？ | 不加，Phase 2 再说 |
| OQ-6 | 样例课程包覆盖哪 3 个学科？ | 建议：编程基础（Python decorators）、文科（一段历史）、STEM（基础几何） |
| OQ-7 | Skill 文档语言：中文 / 英文 / 双语？ | 建议英文为主（agent prompt 习惯），中文 README |
| OQ-8 | Phase 1 是否做最简的 telemetry（opt-in）了解使用量？ | 不做，避免隐私争议 |

---

## 11. 文档地图

| 文档 | 状态 | 内容 |
|---|---|---|
| BRAINSTORMING.md | ✅ Approved | 决策日志 + 调研 + 详细设计 + 数据流附录 |
| **RPD.md (本文)** | 🔄 Draft | "做什么" — 需求、目标、验收 |
| 待写 PLAN.md | ⏳ | "怎么做" — 实现计划、拆任务、文件清单 |
| 待写 README.md | ⏳ | 用户文档（安装 / 使用 / 创作） |
| 待写 CONTRIBUTING.md | ⏳ | 开发者文档 |

---

**下一步**：
1. User review 本 RPD，确认 §10 待决策项
2. Lock RPD → 调用 `superpowers:writing-plans` skill 产出 PLAN.md
3. 进入 `subagent-driven-development` 或 `executing-plans` 实施
