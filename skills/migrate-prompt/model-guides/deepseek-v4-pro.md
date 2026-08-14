---
model: deepseek-v4-pro
vendor: DeepSeek
family: DeepSeek
aliases: [v4-pro, deepseek-pro, deepseek-v4-pro-0813]
last_verified: 2026-08-14
status: current
---

# DeepSeek-V4-Pro

## Reasoning / Thinking
- Hybrid-Modell mit einer Model-ID: Thinking ist **per Default aktiv** mit Effort `high`. OpenAI-Format: `thinking: {"type": "enabled"|"disabled"}` (via `extra_body`) plus `reasoning_effort` `low|high|max` (`medium`/`xhigh` werden auf `high` gemappt); Anthropic-Format: `reasoning: {"effort": "none|low|high|max"}` (`none` deaktiviert, `budget_tokens` wird ignoriert). Modellkarte nennt die Stufen Non-Think / Think High / Think Max; **für Think Max wird ein Kontextfenster von mindestens 384K Tokens empfohlen** und dem System-Prompt wird ein Präfix vorangestellt („Reasoning Effort: Absolute maximum with no shortcuts permitted. You MUST be very thorough in your thinking …") — der Prompt konkurriert dann mit einer Gründlichkeits-Anweisung; knappe Antworten explizit verlangen.
- `reasoning_content` wird neben `content` zurückgegeben. Im reinen Multi-Turn darf er weggelassen werden (die API ignoriert ihn), über **Tool-Call-Turns hinweg muss** er zurückgereicht werden.
- Thinking-Modus ignoriert `temperature`, `top_p`, `presence_penalty`, `frequency_penalty` — Tiefensteuerung ausschließlich über die Effort-Stufe.

## Prompting-Stil
- Prompting-Vertrag identisch zu V4-Flash (gleiche API-Guides, gleiches Chat-Template). System-Prompt wird direkt nach BOS kodiert: `<｜begin▁of▁sentence｜>{system}<｜User｜>{user}<｜Assistant｜>` — System-Anweisungen stehen ganz vorn und sind kein Sonderblock.
- Prefix-Caching läuft automatisch und trifft nur bei **vollständigem** Präfix-Match einer Cache-Unit (Best-Effort, keine Trefferquote garantiert): stabile Instruktionen und Referenzmaterial nach vorn, variablen Input ans Ende.
- JSON: `response_format: json_object` **plus** das Literal „json" und ein Beispiel-JSON im System- oder User-Prompt; `max_tokens` großzügig setzen. Kein `json_schema`-Typ dokumentiert — Struktur ist prompt-geführt, nicht schema-erzwungen.
- Prefill über Chat Prefix Completion: letzte Message `role: "assistant"` + `prefix: True` gegen `https://api.deepseek.com/beta`, optional mit `stop`. Lokales Deployment: `temperature = 1.0`, `top_p = 1.0`.
- Tool-Calls werden in DSML-Markup emittiert (`<｜DSML｜tool_calls>` / `<｜DSML｜invoke>`) mit `string="true"` für Roh-Strings und `string="false"` für JSON-typisierte Werte. Pro ist die agentische Stufe („Open-source SOTA in Agentic Coding benchmarks") — lange Tool-Loops, mehrstufige Pläne und wissensintensive Aufgaben rechtfertigen sie gegenüber Flash.

## Stärken & Schwächen (prompt-relevant)
- Stärken: Frontier-Stufe (MoE 1.6T total / 49B aktiv, Hybrid Attention aus Compressed Sparse Attention + Heavily Compressed Attention, Manifold-Constrained Hyper-Connections, Muon-Optimizer, >32T Trainings-Tokens). Benchmarks (Think Max): LiveCodeBench 93.5, Codeforces 3206, IMOAnswerBench 89.8, GPQA Diamond 90.1, MMLU-Pro 87.5, SimpleQA-Verified 57.9, MRCR 1M 83.5 — stark bei Coding, Wettbewerbsmathe/-naturwissenschaft, Faktenwissen und 1M-Retrieval. Effizienz: 27 % der Single-Token-Inferenz-FLOPs und 10 % des KV-Caches von V3.2 bei 1M-Kontext.
- Schwächen/Eigenheiten: Durchsatz und Preis statt Fähigkeit — $0.435 / $0.87 pro 1M Input(Cache-Miss)/Output-Tokens (ca. 3× Flash beim Input) und nur 500 statt 2500 parallele Requests. JSON-Modus liefert gelegentlich leeren `content`; FIM-Completion nur im Non-Thinking-Modus; Anthropic-Endpoint ohne Image-/Document-Blöcke, ohne `anthropic-beta`/`anthropic-version`-Header, ohne `top_k`, MCP und Container. Die Modellkarte nennt keinen expliziten Limitations-Abschnitt.

## Output- & Format-Konventionen
- 1M Kontextfenster, bis zu 384K Output-Tokens. Aktuelle Version hinter der ID: DeepSeek-V4-Pro-0813 (GA am 2026-08-13 für APP, Web und API); Aufrufweg unverändert — für die jeweils neueste Version weiter `deepseek-v4-pro` verwenden.
- Base URLs: `https://api.deepseek.com` (OpenAI-SDK), `https://api.deepseek.com/anthropic` (Anthropic-SDK, `claude-opus*` → `deepseek-v4-pro`), `https://api.deepseek.com/beta` (Prefill); Responses API nativ (für Codex adaptiert).
- `response_format` `text|json_object`; bis 128 Tool-Funktionen; `tool_choice` none/auto/required/spezifisch; bis 16 Stop-Sequenzen; `top_logprobs` 0–20; `temperature` 0–2 (Default 1), `top_p` 0–1 (Default 1); `frequency_penalty`/`presence_penalty` deprecated und wirkungslos. Peak/Off-Peak-Abrechnung ab 2026-08-16 16:00 UTC (Off-Peak = halber Peak-Preis).

## Migrations-Hinweise
- **VON DeepSeek-V4-Pro weg**: `thinking`/`reasoning_effort` und die gesamte `reasoning_content`-Verkabelung entfernen; falls das Ziel keinen nativen Reasoning-Modus hat, explizite CoT-Anweisungen wieder in den Prompt schreiben; unterstützt das Ziel `json_schema`, das In-Prompt-JSON-Beispiel zu einem echten Schema hochziehen und das Pflicht-Literal „json" streichen; DSML-Tool-Call-Beispiele in das Tool-Format des Ziels übersetzen; `prefix: True` durch Prefill- oder Stop-Sequenz-Äquivalent ersetzen; 1M/384K sind nicht portabel — Chunking wieder einplanen.
- **ZU DeepSeek-V4-Pro migrieren**: von `deepseek-chat`/`deepseek-reasoner` (seit 2026-07-24 15:59 UTC abgeschaltet) gilt „base_url behalten, nur `model` auf `deepseek-v4-pro` setzen" — die Legacy-IDs routeten allerdings auf **Flash**, Pro ist also ein bewusstes Upgrade. Prompt-Deltas: (1) ex-`deepseek-chat`-Prompts brauchen jetzt explizit `thinking: {"type": "disabled"}`, da Thinking default an ist; (2) `frequency_penalty`/`presence_penalty` entfernen; (3) Temperature-/top_p-Tuning aus Reasoning-Prompts streichen — im Thinking-Modus toter Text; (4) in Tool-Loops `reasoning_content` zurückreichen statt CoT zu strippen; (5) Chunking-/Map-Reduce-Gerüste für alte V3/R1-Fenster löschen und ganze Dokumente übergeben; (6) statische Instruktionen nach vorn ziehen (Prefix-Caching); (7) Tiefenformulierungen im Prompttext („think step by step", „be thorough") in `reasoning_effort: low|high|max` überführen.
- **Pro ↔ Flash**: kein Prompt-Rewrite nötig — gleiche Parameter, gleicher Kontext, gleiches Output-Limit, gleiches Template. Zu Pro wechseln für wissensintensive oder agentische Coding-Arbeit (SimpleQA-Verified 57.9 laut Pro-Modellkarte; Flash liegt bei den Agent-Benchmarks darunter), zurück zu Flash für Volumen (ca. 3× günstiger im Input, 2500 statt 500 parallele Requests).

## Quellen
- https://api-docs.deepseek.com/quick_start/pricing — Model-ID, Version DeepSeek-V4-Pro-0813, 1M Kontext, 384K Output, Thinking default, Feature-Matrix (FIM nur non-thinking), $0.435/$0.87, 500 Concurrency, Peak/Off-Peak ab 2026-08-16.
- https://api-docs.deepseek.com/updates — GA am 2026-08-13 für APP/Web/API, Effort-Stufen low/high/max, native Responses API (Codex), Legacy-ID-Deprecation, Peak/Off-Peak-Termin.
- https://api-docs.deepseek.com/news/news260424/ — V4-Ankündigung: Agentic-Coding-SOTA und World-Class-Reasoning-Claims, 1M Kontext als Default, Retirement-Datum, „base_url behalten"-Migrationsanweisung.
- https://api-docs.deepseek.com/guides/thinking_mode — Thinking-Toggle in beiden Formaten, Default `high`, Effort-Mapping, `reasoning_content`-Regeln (Multi-Turn vs. Tool-Calls), ignorierte Sampling-Parameter.
- https://api-docs.deepseek.com/api/create-chat-completion — Parameterbereiche und Defaults, `response_format` text/json_object, `thinking.type` und `reasoning_effort`-Enums, 128 Tools, logprobs, deprecated Penalties.
- https://api-docs.deepseek.com/guides/json_mode — nur `json_object`, Pflicht-Literal „json", Beispiel im Prompt, `max_tokens`-Hinweis, Known Issue leerer content.
- https://api-docs.deepseek.com/guides/chat_prefix_completion — Prefill über assistant-Rolle + `prefix: True` auf der `/beta`-Base-URL, Zusammenspiel mit `stop`.
- https://api-docs.deepseek.com/guides/kv_cache — automatisches Caching, vollständiger Präfix-Match, Best-Effort, `prompt_cache_hit_tokens`/`prompt_cache_miss_tokens`.
- https://api-docs.deepseek.com/guides/anthropic_api — `claude-opus*` → `deepseek-v4-pro`, ignoriertes `budget_tokens`, fehlende Image-/Document-Blöcke, Header, `top_k`, MCP und Container.
- https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro — Modellkarte: 1.6T/49B MoE, Hybrid Attention, Muon-Optimizer, 1M Kontext, Non-Think/Think High/Think Max (für Max ≥384K Kontext empfohlen), Benchmark-Scores inkl. Flash-vs-Pro-Vergleich (SWE Verified 79.0/80.6, Terminal Bench 2.0 56.9/67.9), temperature 1.0 / top_p 1.0, 27 % FLOPs und 10 % KV-Cache vs. V3.2, kein Limitations-Abschnitt.
- https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/encoding/README.md — Chat-Template und System-Prompt-Position, `<think>`-Kodierung, DSML-Tool-Call-Markup mit `string`-Attribut, Prefix-String bei `reasoning_effort=max`.
- https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash/blob/main/encoding/README.md — Beleg für „Chat-Template identisch zu V4-Flash": gleicher BOS/`<｜User｜>`/`<｜Assistant｜>`-Aufbau, gleiche DSML-Tokens.
