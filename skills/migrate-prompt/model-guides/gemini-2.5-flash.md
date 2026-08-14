---
model: gemini-2.5-flash
vendor: Google
family: Gemini
aliases: [gemini25flash, gemini-25-flash, gemini2.5flash]
last_verified: 2026-06-13
status: legacy
successor: gemini-3.7-flash
---

# Gemini 2.5 Flash

## Reasoning / Thinking
- Typ: **adaptiv / abschaltbar**. Gemini 2.5 Flash ist das erste Flash-Modell mit Thinking-Fähigkeit; standardmäßig läuft „Dynamic Thinking" (das Modell entscheidet selbst über die Denktiefe je nach wahrgenommener Aufgabenkomplexität).
- Steuerung über den Parameter `thinkingBudget` (Tokens). Gültiger Bereich für 2.5 Flash: **0 bis 24576**.
  - `thinkingBudget = 0` → **Thinking vollständig deaktiviert** (kein Thought-Content).
  - `thinkingBudget = -1` → **Dynamic Thinking** (Modell passt das Budget selbst an die Komplexität an).
  - Positiver Integer → festes Budget; höhere Werte erlauben tieferes Reasoning für komplexe Aufgaben.
  - Default (Parameter nicht gesetzt) → Dynamic Thinking.
- Unterschied zu **Gemini 2.5 Pro**: Pro-Bereich ist **128 bis 32768** und Thinking **kann bei Pro nicht abgeschaltet werden**; 2.5 Flash kann via Budget 0 vollständig ohne Thinking laufen. Pro ist für höchste Intelligenz/komplexes Reasoning gedacht, Flash für Preis-Leistung bei Low-Latency-/High-Volume-Aufgaben.
- Abrechnung: Thinking-Tokens werden mitberechnet — „response pricing is the sum of output tokens and thinking tokens". Thought-Summaries sind in Free- und Paid-Tier verfügbar.

## Prompting-Stil
- Mäßig präskriptiv, aber struktur- und kontextsensitiv: Google empfiehlt **klare, spezifische Instruktionen** mit definiertem Input-Typ, Constraints (Längen-/Scope-Grenzen), Antwortformat und nötigem Kontext direkt im Prompt.
- **System-Instructions** dienen für Rolle/Persona, Output-Format, Tonalität und Constraints; XML-Tags wie `<role>`, `<constraints>`, `<task>` werden als Strukturierungshilfen empfohlen.
- **Few-Shot-Beispiele**: „We recommend to always include few-shot examples in your prompts." Beispiele sollten spezifisch, variantenreich und konsistent formatiert sein; Überfrachtung mit Beispielen reduziert die Wirkung (Overfitting-Gefahr).
- Komplexe Aufgaben zerlegen über Separate Instructions, Chaining (Output→nächster Schritt) oder Aggregation (parallele Teiloperationen).
- **Kosten-/Latenz-Fokus**: Für einfache Tasks (Faktenabruf, Klassifikation) ist Thinking nicht nötig — `thinkingBudget = 0` hält Kosten und Latenz minimal. Will man lange Outputs, sollte man die Denktiefe per Prompt begrenzen, um mehr Tokens für die Antwort zu reservieren.

## Stärken & Schwächen (prompt-relevant)
- **Stärken**: Bestes Preis-Leistungs-Verhältnis für Low-Latency-, High-Volume- und agentische Aufgaben mit Reasoning; 1.048.576 Tokens Kontextfenster (Long-Context: gesamten Kontext zuerst, Frage am Ende); Structured Output und Function Calling unterstützt; Thinking optional zuschaltbar.
- **Schwächen / prompt-relevante Eigenheiten**: Für höchste Intelligenz/komplexes Reasoning ist 2.5 Pro überlegen. Bei aktivem Thinking erhöhen sich Kosten und Latenz (Thinking-Tokens zählen mit). Praxisberichte über nicht respektierte `max_output_tokens` bzw. Token-Wiederholungen bei Structured Output existieren in Community-Foren — (unbelegt; keine Primärquelle).

## Output- & Format-Konventionen
- Unterstützte Eingaben: **Text, Bilder, Video, Audio** (Kontextfenster 1.048.576 Tokens). Ausgabe: **Text** (max. **65.536** Output-Tokens).
- Format-Steuerung: natürlichsprachliche Formatvorgaben, Completion-Strategie (Teil-Output vorgeben), **Structured Output** (JSON-Schema) sowie Delimiter via XML-Tags/Markdown-Header. Function Calling wird unterstützt.
- Wissensstand (Knowledge Cutoff): **Januar 2025**.

## Migrations-Hinweise
- **WEG von 2.5 Flash** (z. B. zu 2.5 Pro): Thinking lässt sich dort **nicht mehr abschalten** (Mindestbudget 128, Bereich bis 32768); für komplexes Reasoning/Coding/agentisch sinnvoll, aber höhere Kosten/Latenz. Output-Limit und Verhalten neu prüfen.
- **ZU 2.5 Flash**: Aus älteren Previews auf den stabilen Alias `gemini-2.5-flash` wechseln. Bei Migration von 2.0 Flash: Thinking ist neu; für gleiche Kosten/Latenz wie 2.0 ggf. `thinkingBudget = 0` setzen. Für reine Kostensenkung als Alternative 2.5 Flash-Lite erwägen.

## Quellen
- https://ai.google.dev/gemini-api/docs/thinking — Thinking-Budget-Bereich 2.5 Flash (0–24576), 0 deaktiviert Thinking, -1 = Dynamic Thinking, Default Dynamic; 2.5 Pro 128–32768 und nicht abschaltbar; Thinking-Tokens in Abrechnung; Thought-Summaries.
- https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash — Modell-ID, Kontextfenster 1.048.576, Output-Limit 65.536, Eingaben Text/Bild/Video/Audio, Knowledge Cutoff Januar 2025, Structured Output und Function Calling unterstützt.
- https://ai.google.dev/gemini-api/docs/prompting-strategies — Prompting-Stil: klare/spezifische Instruktionen, System-Instructions mit XML-Tags, Few-Shot-Empfehlung, Aufgabenzerlegung, Output-Format-Steuerung, Long-Context-Reihenfolge.
- https://developers.googleblog.com/en/start-building-with-gemini-25-flash/ — Budget 0 für niedrigste Kosten/Latenz vs. 2.0 Flash; einfache Tasks ohne Thinking; lange Outputs durch Denktiefe-Begrenzung.
- https://developers.googleblog.com/en/gemini-2-5-thinking-model-updates/ — GA-Status, neue Preisstruktur (einheitlicher Tarif), Migrationspfad zu `gemini-2.5-flash`/Flash-Lite, Pro für höchste Intelligenz.
