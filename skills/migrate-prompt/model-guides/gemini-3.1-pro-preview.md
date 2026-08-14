---
model: gemini-3.1-pro-preview
vendor: Google
family: Gemini
aliases: [gemini-3.1-pro, gemini-3.1, 3.1-pro, gemini-pro-3.1]
last_verified: 2026-08-14
status: current
---

# Gemini 3.1 Pro Preview

## Reasoning / Thinking
- Typ: **immer an, Tiefe über `thinking_level`** (`low | medium | high`; Default `high`, dynamisch). Kein Deaktivieren dokumentiert. `high` = „Maximizes reasoning depth" — deutlich längere Zeit bis zum ersten Nicht-Thinking-Token, dafür sorgfältiger durchdachter Output.
- `minimal` existiert familienweit, ist aber in der Per-Modell-Tabelle (`interactions/gemini-3`) für Gemini 3.1 Pro ausdrücklich als **„Not supported"** markiert → auf Pro ist **`low` die Untergrenze** („Minimizes latency and cost. Best for simple instruction following, chat, or high-throughput applications").
- `thinking_budget` wird nur noch aus Rückwärtskompatibilität akzeptiert; Google empfiehlt die Migration auf `thinking_level`. Beide Parameter dürfen nicht gemeinsam gesetzt werden, und die Level sind „relative allowances for thinking rather than strict token guarantees" — keine Token-Garantie.
- **Thought Signatures**: bei Function Calling strikt validiert — „The 'Current Turn' includes all Model (functionCall) and User (functionResponse) steps that occurred since the last standard User text message"; fehlende Signaturen → 400. Bei reinem Text/Chat nicht erzwungen, aber zum Erhalt der Reasoning-Qualität über Folgeturns empfohlen.

## Prompting-Stil
- **Knapp und direkt.** Gemini 3.x belohnt „direct, clear instructions" statt ausführlichem Prompt-Engineering; verbose Scaffolding schadet eher.
- Bei großen Datenkontexten die eigentliche Frage/Anweisung **ans Ende** setzen, nach dem Datenblock.
- Hand-geschriebene Chain-of-Thought („think step by step") ersetzen durch `thinking_level: "high"` — natives Reasoning statt Prompt-Scaffolding.
- **`temperature` bei Default 1.0 lassen**: „For all Gemini 3 models, we strongly recommend keeping the temperature parameter at its default value of 1.0"; Werte < 1.0 können Loops oder degradierte Leistung bei komplexen Reasoning-/Mathe-Aufgaben auslösen. Zu `top_p`/`top_k` gibt es auf den Pro-Seiten keine Empfehlung (unbelegt).
- Der Default-Ton ist direkt/nüchtern — konversationellen Stil ggf. explizit anfordern.
- `media_resolution` pro Inhaltstyp setzen: Bilder → `media_resolution_high` (max. 1120 Tokens), PDFs → `media_resolution_medium` (560 Tokens, mehr bringt selten Gewinn), Video → `low`/`medium` (70 Tokens/Frame), `high` (280 Tokens/Frame) nur bei textlastigem Video.

## Stärken & Schwächen (prompt-relevant)
- Stärken laut API-Modellkarte: „optimized for software engineering behavior and usability, as well as agentic workflows requiring precise tool usage and reliable multi-step execution"; laut DeepMind-Karte geeignet für „agentic performance, advanced coding, long context and/or multimodal understanding, algorithmic development". Benchmarks: ARC-AGI-2 77,1 %, LiveCodeBench Pro 2887 Elo, MMMLU 92,6 %.
- **Preview, nicht GA** (API-Modellseite und Modellliste führen `gemini-3.1-pro-preview` unter „Preview") — kein stabiler Produktionsvertrag; ID/Verhalten können sich ändern. Für einen stabilen Google-Zielpunkt sind GA-Modelle die sicherere Wahl.
- Knowledge Cutoff: Jan 2025 (Modelltabelle im Familien-Guide).
- Nicht unterstützt: Live API, Bildgenerierung, Audiogenerierung. Zur Image Segmentation sagt der Familien-Guide: „Image segmentation capabilities (returning pixel-level masks for objects) are not supported in Gemini 3 Pro or Gemini 3 Flash" — 3.1 Pro wird dort nicht namentlich genannt, basiert laut Modellkarte aber auf Gemini 3 Pro (Übertragung unbelegt) → solche Workloads auf Gemini 2.5 belassen.
- Long-Context bleibt fehleranfällig: MRCR v2 erreicht laut DeepMind-Karte 84,9 % im 128k-Mittel, aber nur 26,3 % bei 1M pointwise — 1M Kontext heißt nicht 1M zuverlässiger Recall.
- Detaillierte Limitationen verweist die DeepMind-Karte auf die Gemini-3-Pro-Karte; inline werden keine genannt.

## Output- & Format-Konventionen
- Exakte ID `gemini-3.1-pro-preview`; eine GA-/Stable-ID `gemini-3.1-pro` ist auf ai.google.dev nicht dokumentiert.
- Kontext: **1.048.576 Input-Tokens**, **65.536 Output-Tokens** (DeepMind-Karte: „up to 1M" / „64K token output").
- Input: Text, Image, Video, Audio, PDF. Output: nur Text.
- Unterstützt: Caching, Code Execution, Function Calling, Structured Outputs, Thinking, Batch API, Search- und Maps-Grounding. **Structured Outputs lassen sich mit Built-in-Tools kombinieren** (Google Search, URL Context, Code Execution, Function Calling) — das ging vorher nicht.
- Preis ist kontextlängen-gestaffelt (Paid Tier, pro 1M Tokens): Input $2.00 (≤ 200k) / $4.00 (> 200k), Output $12.00 (≤ 200k) / $18.00 (> 200k), Context Caching $0.20 / $0.40 plus $4.50 pro 1M Tokens/Stunde Storage; Batch = 50 % Rabatt. Die **200k-Schwelle** ist die relevante Kostenkante beim Prompt-Design.
- `candidate_count` soll beim Umstieg entfernt werden (unbelegt — auf den geprüften Seiten nicht auffindbar; vor Übernahme selbst verifizieren).

## Migrations-Hinweise
- **VON gemini-3.1-pro-preview weg**: explizite Reasoning-Anweisungen wieder ergänzen und eine explizite `temperature` setzen (die 1.0-Default-Annahme ist Gemini-spezifisch); `thinking_level` auf den Effort-/Budget-Regler des Ziels mappen; Thought-Signature- und `media_resolution`-Plumbing entfernen; die Annahme „Structured Outputs + Built-in-Tools gleichzeitig" fallenlassen, falls das Ziel JSON-Modus nicht mit Search/Code-Execution mischen kann.
- **ZU gemini-3.1-pro-preview migrieren** (v. a. von `gemini-2.5-pro`): (1) hand-gebautes Chain-of-Thought-Scaffolding löschen, stattdessen `thinking_level: "high"` (bzw. `medium`/`low` als Kosten-Trade-off); (2) explizite Low-Temperature-Settings entfernen — Default 1.0 halten, sonst Loop-/Degradationsrisiko; (3) `thinking_budget` durch `thinking_level` ersetzen (relative Allowance, keine Token-Garantie, nie beide zugleich); (4) dichte Dokument-Pipelines mit `media_resolution_high` (Bilder) / `media_resolution_medium` (PDFs) neu testen; (5) Thought Signatures durch **jeden** Function-Calling-Turn durchreichen — alle seit der letzten User-Text-Nachricht akkumulierten Signaturen zurückgeben, sonst 400; (6) Token-Verbrauch ändert sich (PDFs teurer, Video günstiger) → Kosten gegen die 200k-Preisstufe neu baselinen; (7) Image-Segmentation-Workloads **nicht** migrieren; (8) Preview-Status bei der Zielwahl einkalkulieren.

## Quellen
- https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview — exakte ID, Preview-Status, 1.048.576 / 65.536 Tokens, Modalitäten, Feature-Matrix (inkl. nicht unterstützt: Live API / Bild / Audio), Optimierungs-Zitat zu Software-Engineering und agentischen Workflows.
- https://ai.google.dev/gemini-api/docs/generate-content/gemini-3 — `thinking_level`-Werte und `high`-Default, Thought-Signature-Validierung („Current Turn"), Temperature-1.0-Empfehlung, `media_resolution` je Modalität mit Token-Zahlen, Structured Outputs mit Built-in-Tools, Prompting-Regeln (Kürze, Instruktion ans Ende), 2.5→3-Migrationscheckliste.
- https://ai.google.dev/gemini-api/docs/gemini-3 — Default `high` (dynamisch) für Gemini 3.1 Pro, `thinking_budget`-Rückwärtskompatibilität und Verbot der Kombination, Temperature-Warnung, Knowledge Cutoff Jan 2025, „image segmentation … not supported".
- https://ai.google.dev/gemini-api/docs/interactions/gemini-3 — Per-Modell-Tabelle: für Gemini 3.1 Pro ist `minimal` „Not supported"; `low`/`medium`/`high` unterstützt, Default `high` (dynamisch).
- https://deepmind.google/models/model-cards/gemini-3-1-pro/ — offizielle Modellkarte (19. Februar 2026): 1M Input / 64K Output, Intended Uses, ARC-AGI-2 77,1 %, LiveCodeBench Pro 2887 Elo, MMMLU 92,6 %, MRCR v2 84,9 % (128k) / 26,3 % (1M pointwise), „based on Gemini 3 Pro", Verweis auf die Gemini-3-Pro-Karte für Limitationen.
- https://ai.google.dev/gemini-api/docs/pricing — kontextlängen-gestaffelte Preise mit 200k-Schwelle, Caching-Raten inkl. Storage, 50 % Batch-Rabatt.
- https://ai.google.dev/gemini-api/docs/models — offizielle Modellliste; `gemini-3.1-pro-preview` steht unter den Preview-Modellen, keine GA-Pro-ID der 3.x-Reihe gelistet.
