---
model: gemini-3.7-flash
vendor: Google
family: Gemini
aliases: [gemini-3.7, gemini-3-7-flash, 3.7-flash, gemini-flash-3.7]
last_verified: 2026-08-14
status: current
---

# Gemini 3.7 Flash

## Reasoning / Thinking
- Typ: **String-Enum, kein Token-Budget**. `thinking_level` mit `low | medium | high`; Default ist `medium`. `minimal` ist hier ungültig („minimal is not supported and returns an error"). Bedeutung laut Doku: `low` = kürzere Time-to-Answer für latenzkritische Fälle, `medium` = beste Qualität für die meisten Aufgaben, `high` = maximales Denken/Tool-Nutzung.
- Familien-Bruch beachten: Der `medium`-Default für 3.7 Flash steht in „What's new in Gemini 3.7 Flash" und auf der Model Card. Die Formulierung „The default thinking effort is now `medium`, changed from `high` in Gemini 3 Flash Preview" stammt aus den Behavioral-Changes des Gemini-3-Guides und nennt 3.7 Flash nicht selbst. Andere 3.x-Modelle defaulten weiter auf `high` (Gemini 3.1 Pro, Gemini 3 Flash) bzw. `minimal` (Gemini 3.1 Flash-Lite).
- `thinking_budget` ist Legacy: „Replace `thinking_budget` with the string enum `thinking_level`". Es bleibt in Gemini 3 rückwärtskompatibel, darf aber nicht zusammen mit `thinking_level` im selben Request stehen; Level sind relative Allowances, keine Token-Garantien.
- Reasoning-State läuft über **Thought Signatures** (verschlüsselte Repräsentationen des internen Reasonings). Auf dem Legacy-`generateContent` muss „the full, unmodified conversation history (including thought signatures)" zurückgeschickt werden; die Interactions API erledigt das automatisch (`previous_interaction_id`).

## Prompting-Stil
- **Kurz und direkt**: „Be concise. Gemini 3.x responds best to direct, clear instructions." Ausdrückliche Warnung: „Verbose or complex prompt engineering techniques designed for older models may cause the model to over-analyze."
- Kein handgeschriebenes Chain-of-Thought — stattdessen `thinking_level: "medium"`/`"high"` mit einfacherem Prompt.
- Bei Long-Context/großen Datenmengen die konkrete Frage bzw. Instruktion **ans Ende nach dem Datenblock** stellen (Anker wie „Based on the preceding information...").
- Inline-Instruktionen mit `\n\n` formatieren (explizite Formatregel der Doku).
- Sampling: Temperature-Default `1.0` beibehalten („may lead to unexpected behavior, such as looping or degraded performance"); für 3.7 Flash geht die Doku weiter: „Strip `temperature`, `top_p`, and `top_k` from generation configs."
- Ton: „By default, Gemini 3 and 3.1 is less verbose and prefers direct, efficient answers." — konversationellen Stil explizit anfordern (Familien-Aussage; für 3.7 Flash nicht separat bestätigt). Für dichte Dokumente `media_resolution` pro Item setzen (`low|medium|high|ultra_high`); die Doku rät, bei PDFs `media_resolution_high` gegenzutesten („test the `media_resolution_high` setting to ensure continued accuracy").

## Stärken & Schwächen (prompt-relevant)
- Stärken: „Significantly higher quality on real-world software engineering and agentic benchmarks, improving issue resolution and reducing failed agent loops"; „higher-fidelity desktop and web application code directly from design mocks, with strong gains in design adherence". Model Card: 43,6 % auf FrontierCode 1.1, 97,0 % auf GDM-MRCR v2 (8-needle) bei 128k Kontext; Zielprofil agentische Workflows, Coding, Enterprise-Automation. Knowledge Cutoff: März 2026.
- Schwächen/Eigenheiten: allgemeine Foundation-Model-Limits inkl. Halluzinationen; „occasional slowness or timeout issues"; einzelne Domänen nur bis Januar 2025 abgedeckt; Jailbreak-Resistenz laut Google noch in Arbeit.
- Modalitäts-Lücken: keine Bildgenerierung, keine Audiogenerierung, Live API „Not supported". Bild-Segmentierung (Pixel-Masken) ist laut Familien-Doku für Gemini 3 Pro / Gemini 3 Flash nicht verfügbar — solche Workloads bei Gemini 2.5 Flash lassen; eine explizite Aussage speziell für 3.7 Flash fehlt (unbelegt).

## Output- & Format-Konventionen
- GA/stabil (Modellliste „New Stable", DeepMind Model Card vom 13.08.2026). Kontext: **1.048.576 Input-Tokens**, **65.536 Output-Tokens** (Doku-Kurzform: „a 1M token context window, 64k max output tokens").
- Input: Text, Bild, Video, Audio, PDF — Output: nur Text. Unterstützt: Structured Outputs, Function Calling, Caching, Batch API. Nicht unterstützt: Live API, Image-Gen, Audio-Gen.
- Structured Outputs lassen sich mit Built-in-Tools kombinieren: „Gemini 3 models allow you to combine Structured Outputs with built-in tools, including Grounding with Google Search, URL Context, Code Execution, and Function Calling." (Familien-Aussage für Gemini 3, nicht 3.7-Flash-spezifisch formuliert).
- **Kein Assistant-Prefill**: „Remove prefilled model turns"; ebenso „Remove `candidate_count`". Gewünschte Ausgabeform über Response-Schema oder System-Instruktion erzwingen.
- Preise (Paid Tier, pro 1 Mio. Tokens): Input $0.75 bis 31.12.2026, danach $1.50; Output $3.75 bzw. $7.50; Context Caching $0.075 bzw. $0.15; Batch zum halben Preis ($0.375 In / $1.875 Out bis 31.12.2026).

## Migrations-Hinweise
- **VON gemini-3.7-flash weg**: explizites Step-by-step-/CoT-Scaffolding wieder ergänzen; `thinking_level` in den Effort-/Budget-Knopf des Zielmodells übersetzen; Temperature wieder explizit setzen (der 1.0-Default ist keine portable Annahme); Thought-Signature-Plumbing entfernen; Konversationsverlauf client-seitig materialisieren, da `previous_interaction_id` keine Entsprechung hat; Prefill ist anderswo wieder erlaubt.
- **ZU gemini-3.7-flash migrieren**: `temperature`/`top_p`/`top_k` entfernen; `thinking_budget` → `thinking_level` (ein 2.5-Nullbudget wird `low`, **nicht** `minimal`); `candidate_count` entfernen; Prefill-Turns in Instruktion oder Response-Schema umschreiben; Multi-Turn auf `previous_interaction_id` (Interactions API, `store=true`) standardisieren; Inline-Instruktionen auf `\n\n` umstellen; verbose Prompts entschlacken und CoT in `thinking_level` auflösen; dichte PDFs mit `media_resolution_high` nachtesten; Function Calling prüfen — multimodale Inhalte gehören *in* die Function-Response-Parts, und Thought Signatures aus dem Tool-Turn müssen zurückgegeben werden. Bild-Segmentierungs-Prompts nicht hierher migrieren.

## Quellen
- https://ai.google.dev/gemini-api/docs/models — offizielle Modellliste; `gemini-3.7-flash` als neuestes Flash, markiert „New Stable"; bestätigt die exakte ID-Schreibweise.
- https://ai.google.dev/gemini-api/docs/latest-model — „What's new in Gemini 3.7 Flash": thinking_level-Werte + `medium`-Default, Migrations-Checkliste (temperature/top_p/top_k strippen, thinking_budget ersetzen, candidate_count und Prefill-Turns entfernen, previous_interaction_id), `\n\n`-Formatregel, Coding-/Agentic-/Web-Design-Verbesserungen, Einführungspreise.
- https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash — Model Card: GA-Status (Stand August 2026), 1.048.576 Input / 65.536 Output, Modalitäten, Structured Outputs / Function Calling / Caching / Batch unterstützt, Live API nicht, „minimal is not supported and returns an error".
- https://deepmind.google/models/model-cards/gemini-3-7-flash/ — DeepMind Model Card: veröffentlicht 13.08.2026; Knowledge Cutoff März 2026 (einzelne Domänen Januar 2025), 1M in / 64K out, FrontierCode 1.1 43,6 %, GDM-MRCR v2 (8-needle) @128k 97,0 %, dokumentierte Limitationen (Halluzinationen, „occasional slowness or timeout issues", „we are continually working to improve jailbreak resistance").
- https://ai.google.dev/gemini-api/docs/interactions/gemini-3 — Gemini-3-Entwicklerguide (Familienebene, nennt 3.7 Flash nicht namentlich): thinking_level-Defaults je Modell, „The default thinking effort is now `medium`, changed from `high` in Gemini 3 Flash Preview" (Behavioral Changes), Kürze-Guidance („Be concise. Gemini 3.x responds best to direct, clear instructions."), Instruktionsplatzierung am Ende bei Long Context, media_resolution-Stufen + `media_resolution_high`-Gegentest, „the full, unmodified conversation history (including thought signatures)", Regel für multimodale Function-Responses.
- https://ai.google.dev/gemini-api/docs/migrate-to-interactions — Interactions API als empfohlene Oberfläche („we recommend the Interactions API for all new development"), `previous_interaction_id` und `store=true`-Semantik.
- https://ai.google.dev/gemini-api/docs/pricing — exakte Input-/Output-/Caching-/Batch-Preise für gemini-3.7-flash inkl. Ablauf der Einführungspreise am 31.12.2026 (Caching $0.075 → $0.15, Batch $0.375/$1.875 → $0.75/$3.75).
- https://ai.google.dev/gemini-api/docs/gemini-3 — Familien-Guidance: Temperature-Default 1.0, thinking_budget-Rückwärtskompatibilität (nicht kombinierbar mit thinking_level), Gemini-2.5-Migrationspunkte, Structured Outputs kombinierbar mit Built-in-Tools, fehlende Bild-Segmentierung („not supported in Gemini 3 Pro or Gemini 3 Flash").
