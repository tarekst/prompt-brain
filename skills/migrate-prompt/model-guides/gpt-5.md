---
model: gpt-5
vendor: OpenAI
family: GPT
aliases: [gpt5, openai-gpt-5, openai-gpt5]
last_verified: 2026-06-13
status: legacy
successor: gpt-5.6-sol
---

# GPT-5

## Reasoning / Thinking
- Typ: **adaptiv / steuerbar**. GPT-5 ist ein Reasoning-Modell, dessen Denktiefe über den Parameter `reasoning.effort` (in der Responses-API) bzw. `reasoning_effort` gesteuert wird. Unterstützte Werte: `minimal`, `low`, `medium`, `high`; Default ist `medium`, wenn nichts gesetzt ist. ([Modell-Doku](https://developers.openai.com/api/docs/models/gpt-5), [New Params & Tools](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_new_params_and_tools))
- `minimal` läuft „mit wenigen oder gar keinen Reasoning-Tokens, um Latenz zu minimieren" und eignet sich für deterministische, leichtgewichtige Aufgaben wie Extraktion, Formatierung, kurze Rewrites und einfache Klassifikation. Höhere Werte maximieren Qualität, niedrigere maximieren Geschwindigkeit. ([Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide), [New Params & Tools](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_new_params_and_tools))
- Tiefe lässt sich zusätzlich über den Prompt steuern: explizite Explorationskriterien, feste Tool-Call-Budgets (z. B. „maximal 2 Tool-Calls") gegen Over-Eagerness, bzw. Persistenz-Anweisungen („keep going until the user's query is completely resolved") gegen Under-Eagerness. ([Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide))
- In ChatGPT ist GPT-5 als unified system mit einem Echtzeit-Router umgesetzt, der zwischen einem schnellen Modell und einem tieferen Reasoning-Modell wählt (basierend auf Komplexität, Tool-Bedarf und explizitem Intent). ([System Card](https://openai.com/index/gpt-5-system-card/))

## Prompting-Stil
- Sehr präskriptiv und instruktionstreu: GPT-5 folgt Prompt-Anweisungen mit „surgical precision" und ist „extraordinarily receptive to prompt instructions surrounding verbosity, tone, and tool calling behavior". ([Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide))
- Eigenheit / Risiko: Genau diese Treue macht widersprüchliche oder vage Prompts schädlicher als bei anderen Modellen — GPT-5 „verbraucht Reasoning-Tokens, um die Widersprüche aufzulösen". Prompts sollten daher konfliktfrei und eindeutig sein. ([Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide))
- Empfehlung: Mit dem kleinsten Prompt starten, der den Produkt-Kontrakt erhält, und dann reasoning effort, verbosity, Tool-Beschreibungen und Output-Format gegen repräsentative Beispiele tunen. ([Prompt-Guidance](https://developers.openai.com/api/docs/guides/prompt-guidance), [Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide))
- Agentic-Steuerung: GPT-5 liefert standardmäßig „tool preambles" (Plan-/Fortschrittsupdates); Häufigkeit und Stil sind per Prompt steuerbar (z. B. „Always begin by rephrasing the user's goal … outline a structured plan"). „Escape hatches" (Handeln erlauben, „even if it might not be fully correct") reduzieren übermäßiges Nachfragen. ([Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide))

## Stärken & Schwächen (prompt-relevant)
- Stärken: starke Coding-Fähigkeiten über große Codebases und Multi-File-Refactors; überlegene agentic-Performance und Tool-Calling; verbessertes Long-Context-Verständnis (Kontextfenster 400.000 Tokens); hohe Steuerbarkeit über Prompts; bessere Instruktionsbefolgung als Vorgänger. ([Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide), [Modell-Doku](https://developers.openai.com/api/docs/models/gpt-5))
- Reduzierte Halluzinationen, verbesserte Instruktionsbefolgung und geringere Sycophancy gegenüber Vorgängermodellen; „safe completions" statt harter Refusals bei sensiblen Themen. ([System Card](https://openai.com/index/gpt-5-system-card/))
- Schwächen: tendenziell ausführliche Outputs (über `verbosity` steuerbar); Neigung zu unnötigem Over-Exploring des Kontexts; gelegentliche Über-Rückfragen bei längeren Aufgaben; Performance-Varianz bei `minimal` reasoning abhängig von der Prompt-Qualität. ([Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide))

## Output- & Format-Konventionen
- `verbosity` (in der Responses-API als `text={"verbosity": ...}`) steuert die Länge der finalen Antwort (nicht die Denkdauer). Werte: `low` (terse UX, minimal prose), `medium` (Default, balanced detail), `high` (verbose, für Audits/Teaching/Hand-offs). Per Natural-Language-Override im Prompt kontextabhängig übersteuerbar (z. B. „Use high verbosity for writing code and code tools"). ([New Params & Tools](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_new_params_and_tools), [Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide))
- Standardmäßig nutzt GPT-5 in API-Antworten **kein** Markdown („for maximum compatibility"); Markdown muss explizit angefordert werden (z. B. „Use backticks to format file, directory, function, and class names"). Markdown-Treue kann über lange Konversationen nachlassen — Instruktionen alle 3–5 Nachrichten auffrischen. ([Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide))
- Unterstützt: Streaming, Function Calling, Structured Outputs. Max. Output: 128.000 Tokens; Knowledge-Cutoff: 30. September 2024. ([Modell-Doku](https://developers.openai.com/api/docs/models/gpt-5))
- Neue Tooling-Features: Custom Tools (`"type": "custom"`) für rohe Text-Payloads (Python, SQL, Shell) ohne JSON-Wrapping (kein paralleles Calling); Context-Free Grammar (CFG) zur Output-Beschränkung via `"format": {"type": "grammar", "syntax": "lark"|"regex", "definition": "..."}`, sodass nur grammatikkonforme Strings emittiert werden. ([New Params & Tools](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_new_params_and_tools))

## Migrations-Hinweise
- ZU GPT-5 migrieren:
  - Empfohlener erster Schritt: Modell wechseln, Prompt zunächst funktional unverändert lassen, dann `reasoning_effort` an das Latenz-/Tiefenprofil des Vormodells angleichen und gegen die Eval-Suite testen. ([Prompt-Migration](https://developers.openai.com/cookbook/examples/prompt_migration_guide))
  - Von GPT-4.1 kommend: `minimal` reasoning ist das beste Upgrade für latenzsensible Nutzer; Prompting-Muster ähnlich GPT-4.1 funktionieren gut (Few-Shot, hochwertige/maximal eindeutige Tool-Beschreibungen, explizite agentic-Persistenz, Upfront-Planung, kurze Zusammenfassung des Gedankengangs zu Antwortbeginn). ([Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide))
  - Widersprüchliche/vage Alt-Prompts vor der Migration bereinigen — GPT-5 reagiert darauf empfindlicher als Vorgänger. ([Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide))
  - Responses-API wird empfohlen: behält Reasoning-Kontext über Tool-Calls hinweg (`previous_response_id`) und liefert messbar bessere Ergebnisse (z. B. Tau-Bench Retail 73,9 % → 78,2 %). ([Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide))
- VON GPT-5 wegmigrieren: Auf Modellen ohne `reasoning_effort`/`verbosity` müssen diese Steuerungen durch Prompt-Anweisungen ersetzt werden (explizite Längen-/Format-/Tiefenvorgaben); Custom Tools und CFG-Grammar-Constraints sind ggf. nicht verfügbar und müssen durch klassisches JSON-Function-Calling plus Post-Validierung ersetzt werden. (unbelegt — keine primärquellenbasierte Wegmigrations-Checkliste auffindbar; abgeleitet aus den GPT-5-spezifischen Parametern in [New Params & Tools](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_new_params_and_tools))

## Quellen
- https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide — offizieller GPT-5 Prompting Guide: reasoning_effort (inkl. minimal), verbosity-Overrides, Instruktionstreue/Eigenheiten, Over-/Under-Eagerness, Tool-Preambles, Markdown-Verhalten, Stärken/Schwächen, GPT-4.1-Migration, Responses-API
- https://developers.openai.com/api/docs/models/gpt-5 — GPT-5 Modell-Doku: reasoning.effort-Werte, Kontextfenster (400k), Max-Output (128k), Knowledge-Cutoff, Streaming/Function Calling/Structured Outputs
- https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_new_params_and_tools — neue Parameter & Tools: verbosity-Werte und Default, minimal reasoning, Custom Tools, Context-Free Grammar (Lark/Regex)
- https://developers.openai.com/cookbook/examples/prompt_migration_guide — Prompt-Migrationsleitfaden: Modellwechsel zuerst, reasoning_effort angleichen, Eval-Suite
- https://developers.openai.com/api/docs/guides/prompt-guidance — Prompt-Guidance: mit kleinstem tragfähigem Prompt starten und gegen Beispiele tunen
- https://openai.com/index/gpt-5-system-card/ — GPT-5 System Card: unified system mit Router, safe completions, reduzierte Halluzinationen/Sycophancy, verbesserte Instruktionsbefolgung (Direktabruf HTTP 403 — Inhalt aus Suchindex-Snippet; SOURCE PARTIALLY UNAVAILABLE)
