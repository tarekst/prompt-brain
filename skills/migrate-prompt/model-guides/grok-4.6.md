---
model: grok-4.6
vendor: xAI
family: Grok
aliases: [grok4.6, grok-4.6-latest, grok46, grok-4-6, grok4-6]
last_verified: 2026-08-14
status: current
---

# Grok 4.6

## Reasoning / Thinking
- Typ: **immer an**. Für `grok-4.6` (und `grok-4.5`) gilt laut Doku „Reasoning cannot be disabled" — es gibt kein `none`. Tiefe ausschließlich über `reasoning_effort` (Chat Completions) bzw. `reasoning.effort` (Responses API): `low | medium | high | xhigh`, Default `high`.
- Einsatz laut Doku: `low` für latenzsensitive Agentic-Loops und einfaches Tool-Calling, `medium` für komplexe Datenanalyse und Long-Context-Reasoning, `high` für sehr schwere Probleme/Mathe/Multi-Step-Logik, `xhigh` für die härtesten Fälle, wenn Qualität vor Antwortzeit geht.
- Unter den gelisteten Reasoning-Modellen ist `grok-4.6` das einzige, bei dem `xhigh` echte Denktiefe steuert (`grok-4.20-multi-agent` kennt `xhigh` ebenfalls, regelt damit aber die Agentenzahl). Auf Modellen ohne Support (z. B. `grok-4.5`) wird `xhigh` **still als `high` behandelt** — kein Fehler, nur weniger Denkzeit.
- Reasoning-Tokens werden mitberechnet und erscheinen als `reasoning_tokens` in `usage`. Beim Streaming gibt es zusammengefasstes Reasoning als Deltas (`response.reasoning_summary_text.delta`); über `include: ["reasoning.encrypted_content"]` lässt sich verschlüsseltes Reasoning über Turns hinweg mitführen. Ausgeliefert werden also nur Zusammenfassung und verschlüsselter Carry-over; eine Rückgabe der rohen Chain-of-Thought ist nirgends dokumentiert (unbelegt).
- `presence_penalty`, `frequency_penalty` und `stop` sind mit Reasoning-Modellen **nicht kombinierbar** — Requests damit liefern einen Fehler (Doku schreibt sie als `presencePenalty`/`frequencyPenalty`).

## Prompting-Stil
- Positionierung: „frontier model built for coding, agentic tasks, and knowledge work"; von xAI für Code und Chat empfohlen. Trainiert auf agentischen RL-Tasks (Knowledge Work, allgemeines Coding, Kernel-Optimierung, Web-Entwicklung, CAD).
- Auf **Zielebene** prompten statt Schritt für Schritt: laut Ankündigung stark darin, eine grobe Produktidee in eine erste lauffähige Version zu überführen (unbekannte Domäne recherchieren, App strukturieren, Kernfeatures bauen) und über lange Task-Ketten „more self-testing and verification" zu betreiben — Planung und Selbstprüfung also dem Modell überlassen.
- **Caching ist die zentrale operative Prompt-Regel**: `prompt_cache_key` (Responses API) oder Header `x-grok-conv-id` (Chat Completions) setzen, damit Requests auf denselben Server routen — sonst „you often pay full input price" auf einem cache-kalten Server. Prompt-Präfix daher stabil halten.
- Für lange Agent-Loops zusätzlich Context Compaction einplanen; server-seitige Tools (Function Calling, Web Search, X Search, Code Execution) sind auf beiden APIs verfügbar, müssen aber explizit aktiviert werden.
- Über diese dokumentierten Punkte hinaus veröffentlicht xAI keinen Prompt-Engineering-Leitfaden für dieses Modell — weitergehende Stilregeln sind (unbelegt).

## Stärken & Schwächen (prompt-relevant)
- Stärken: agentisches Coding und Knowledge Work in der Spitzengruppe; Artificial Analysis Intelligence Index 61 (Fable 5 Max führt die Tabelle der Ankündigung mit 62 an); bester gelisteter Wert auf Harvey LAB (15,8 %); Recherche in unbekannten Domänen; sehr hoher Durchsatz (150 rps / 50 Mio. Tokens pro Minute).
- Schwächen/Eigenheiten: Reasoning nicht abschaltbar → feste Latenz- und Kostenuntergrenze; auf den Coding-Benchmarks der Ankündigung führen andere Modelle (DeepSWE v1.1 65,9 % vs. GPT-5.6 Sol Max 73 %; FrontierCode v1.1 61,3 % vs. Fable 5 Max 63,6 %; CursorBench v3.2 69,9 % vs. Fable 5 Max 70,5 %).
- **200k-Preisklippe**: sobald der Prompt 200k Tokens erreicht, wird der gesamte Request (Input *und* Output) zum doppelten Satz abgerechnet — Kontext bewusst unter der Grenze halten.
- 500k Kontext ist nur die Hälfte von `grok-4.3` (1M); Regionen nur `us-east-1` und `us-west-2` — keine EU-Region (die hat `grok-4.3` mit `eu-west-1`).

## Output- & Format-Konventionen
- Kontextfenster 500.000 Tokens; Input Text + Bild, Output nur Text. Wissensstand 1. Februar 2026. Function Calling, Structured Outputs und Reasoning: jeweils ja.
- Output-Limit: die Doku nennt ausdrücklich „No text output limit"; eine Max-Output-Zahl wird nicht publiziert. Länge daher über Max-Tokens begrenzen — `stop`-Sequenzen sind hier nicht erlaubt.
- Preise pro 1M Tokens: Input $2,00 (<200k) / $4,00 (≥200k), Cached Input $0,50 / $1,00, Output $6,00 / $12,00. Die Ankündigung nennt zusätzlich eine „fast variant" zum doppelten Preis.
- Alias-Konvention: `<modelname>` = neueste stabile Version, `<modelname>-latest` = neueste Version, `<modelname>-<date>` = fixierte Release. Für Grok 4.6 ist weder eine datierte ID noch ein `-latest`-Alias publiziert; die blanke ID `grok-4.6` ist die einzige belegte Adresse.

## Migrations-Hinweise
- **VON Grok 4.6 weg**: `xhigh` entfernen — auf `grok-4.5` und älter wird es kommentarlos zu `high` degradiert, ein auf xhigh getunter Prompt bekommt also still weniger Reasoning; nicht auf zusammengefasstes/verschlüsseltes Reasoning bauen; Ziel `grok-4.3` bringt 1M Kontext, ein `none`-Effort-Level und `eu-west-1`, verlässt aber die Frontier-Coding-Stufe; `prompt_cache_key`/`x-grok-conv-id`-Annahmen prüfen.
- **ZU Grok 4.6 migrieren** (typisch von `grok-4`, das seit 15.05.2026 12:00 PT abgekündigt ist und auf `grok-4.3` mit `low` Effort umgeleitet wird): (1) `reasoning_effort` explizit setzen statt Denktiefe indirekt über max_tokens zu budgetieren — Default ist `high`, `low` für Tool-Loops, `xhigh` für Maximaltiefe. (2) Lange Prompts um die 200k-Preisklippe herum strukturieren, obwohl 500k Kontext verfügbar sind. (3) `prompt_cache_key` bzw. `x-grok-conv-id` sowie Context Compaction für lange Agent-Läufe ergänzen — neue operative Fläche. (4) Reasoning ist jetzt teilweise beobachtbar (Streaming-Zusammenfassung, verschlüsselter Carry-over) und kann fürs Debugging genutzt werden. (5) `presence_penalty`/`frequency_penalty`/`stop` aus den Requests halten. (6) Web/X-Search und Code Execution sind server-seitige Tools, die weiterhin explizit angefordert werden müssen. (7) Über-präskriptive Schrittlisten abbauen; stattdessen Ziel + Constraints, das Modell verifiziert selbst.

## Quellen
- https://docs.x.ai/developers/models/grok-4.6 — Modell-Spec: ID `grok-4.6`, 500k Kontext, Text+Bild→Text, Function Calling/Structured Outputs/Reasoning, vollständige Preistabelle inkl. 200k-Klippe, 150 rps / 50M tpm, Regionen us-east-1 und us-west-2.
- https://docs.x.ai/developers/grok-4-6 — Entwicklerseite: Positionierungs-Blurb, `reasoning_effort` low/medium/high (Default)/xhigh, Wissensstand 1. Februar 2026, „No text output limit", Caching via `prompt_cache_key` / `x-grok-conv-id`, Context Compaction, server-seitige Tools auf Responses API und Chat Completions.
- https://docs.x.ai/developers/model-capabilities/text/reasoning — Reasoning-Vertrag: nicht abschaltbar, Effort-Support pro Modell (nur grok-4.6/4.5/4.20-multi-agent gelistet), `xhigh` still zu `high` degradiert, Effort-Empfehlungen, `reasoning_tokens`, nicht unterstützte Sampling-Parameter (`presencePenalty`/`frequencyPenalty`/`stop`).
- https://docs.x.ai/docs/guides/reasoning — Spiegel des Reasoning-Vertrags: `reasoning.effort` (Responses API) vs. `reasoning_effort` (Chat Completions), zusammengefasstes Reasoning beim Streaming, `include: ["reasoning.encrypted_content"]` samt Carry-over. Eine Aussage zur rohen Chain-of-Thought fehlt dort.
- https://docs.x.ai/developers/models — Alias-Konvention (`-latest`, `-<date>`) und aktuelle Text-Modell-Liste ohne `grok-4`; für grok-4.6 weder datierte ID noch `-latest`-Alias gelistet.
- https://docs.x.ai/docs/models — Modellübersicht: grok-4.6 für Code und Chat empfohlen, 500k Kontext, Cutoff 1. Februar 2026; kein Output-Limit gelistet.
- https://docs.x.ai/developers/models/grok-4.3 — Vergleichsmodell: `grok-4.3` mit 1M Kontext und Region `eu-west-1`.
- https://x.ai/news/grok-4-6 — Ankündigung (12.08.2026): agentisches RL-Training (Knowledge Work, Coding, Kernel-Optimierung, Web, CAD), „more self-testing and verification" über lange Task-Ketten, Produktidee→erste Version, Intelligence Index 61 (Fable 5 Max 62), Harvey LAB 15,8 % (bester Wert), DeepSWE/FrontierCode/CursorBench-Vergleich, $2/$6 pro 1M Tokens plus „fast variant" zum doppelten Preis.
- https://docs.x.ai/developers/migration/may-15-retirement — Retirement-Tabelle: `grok-4-0709` am 15.05.2026 12:00 PT abgekündigt, Routing auf `grok-4.3` mit `low` Effort; `none`-Effort für andere Umleitungsziele belegt.
