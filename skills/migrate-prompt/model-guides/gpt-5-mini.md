---
model: gpt-5-mini
vendor: OpenAI
family: GPT
aliases: [gpt5-mini, gpt-5mini, gpt-5-mini-2025-08-07, gpt5mini]
last_verified: 2026-06-13
status: legacy
successor: gpt-5.6-terra
---

# GPT-5 mini

## Reasoning / Thinking
- **Typ: extended / adaptive Reasoning (immer reasoning-fähig).** gpt-5-mini ist ein Reasoning-Modell mit „Reasoning token support" und nutzt — wie die ganze GPT-5-Familie — interne Reasoning-Tokens, bevor die sichtbare Antwort kommt. Das Modell denkt adaptiv: weniger Tokens bei einfachen, mehr bei komplexen Aufgaben.
- **Tiefensteuerung über `reasoning_effort`.** Unterstützte Werte für die GPT-5-Familie: `minimal`, `low`, `medium` (Default), `high`. `minimal` erzeugt sehr wenige bis keine Reasoning-Tokens für minimale Time-to-First-Token, ist aber laut OpenAI für mehrstufige Planung oder tool-lastige Workflows zu vermeiden. Höhere Stufen verbessern Qualität bei komplexen, mehrstufigen Aufgaben, kosten aber mehr Tokens und Latenz. `reasoning_effort` ist als „Tuning-Knopf" gedacht, nicht als primärer Hebel zur Qualitätsrettung.
- **`reasoning_effort: "none"` wird von gpt-5-mini nicht unterstützt** (laut Community-/Test-Berichten akzeptiert die API nur `minimal`/`low`/`medium`/`high`) — (teilweise unbelegt: nicht in einer primären OpenAI-Doc explizit bestätigt; das offizielle Model-Card listet nur „Reasoning: High" als Fähigkeitsstufe).
- **Zweite Steuerachse `verbosity`** (low | medium | high) beeinflusst die Länge der *finalen Antwort*, nicht die Länge des Denkens — ist also unabhängig von `reasoning_effort`.
- **Reasoning-Tokens werden zwischen API-Calls nicht im Kontext gehalten.** Für agentische Multi-Step-Workflows empfiehlt OpenAI, Reasoning-Items über die Responses API (`previous_response_id`) zurückzugeben, damit das Modell auf frühere Reasoning-Traces zugreift (effizienter, weniger Token-Verbrauch).

## Prompting-Stil
- **Sehr präskriptiv steuerbar / hohe Instruktionstreue.** GPT-5 (inkl. mini) folgt Instruktionen mit „surgical precision" und ist „extraordinarily receptive" für Anweisungen zu Verbosity, Ton und Tool-Calling. Genau deshalb leidet das Modell stärker als ältere Modelle unter schlecht gebauten Prompts.
- **Widersprüchliche Instruktionen sind die teuerste Fehlerquelle:** Das Modell verbraucht Reasoning-Tokens darauf, Konflikte zu versöhnen, statt optimal zu entscheiden. Instruktions-Hierarchie explizit auflösen; Prompts auf Widersprüche prüfen (ggf. OpenAI Prompt Optimizer nutzen).
- **System-/Developer-Message-Treue:** Die Reasoning-Doc empfiehlt, dem Modell „task, constraints, and desired output format" zu geben und **keine** Zwischenschritte vorzuschreiben. Wichtig: **nicht** gleichzeitig System- *und* Developer-Message im selben Request verwenden.
- **Eagerness gezielt regeln.** Weniger Eagerness: niedrigeres `reasoning_effort`, klare Explorationskriterien, feste Tool-Call-Budgets (z. B. „maximum of 2 tool calls"), Escape-Hatches. Mehr Eagerness: höheres `reasoning_effort`, Persistenz-Instruktionen („keep going until the user's query is completely resolved").
- **Unterschiede zum großen GPT-5:** gpt-5-mini ist die kleinere, günstigere, latenzärmere Variante und glänzt vor allem bei **gut definierten Aufgaben und präzisen Prompts**; bei vagen, offen explorativen oder besonders komplexen mehrstufigen Aufgaben ist das volle gpt-5 robuster. gpt-5-mini braucht daher tendenziell präzisere, eindeutigere Prompts. API-Shape ist identisch zu gpt-5; dieselben neuen Tools (custom tools, CFG) werden unterstützt.
- **Bei `minimal` reasoning** braucht gpt-5-mini stärkeres Prompting: kurze Zusammenfassung des Vorgehens am Anfang anfordern, ausführliche Tool-Preambles, explizite Persistenz-Reminder gegen vorzeitigen Abbruch, und Aufgaben in alle nötigen Teilanfragen zerlegen (näher an GPT-4.1-Prompting).

## Stärken & Schwächen (prompt-relevant)
- **Stärken:** „Near-frontier intelligence" zu niedrigen Kosten und Latenz; sehr hohe Steuerbarkeit über `reasoning_effort` + `verbosity` ohne Prompt-Umschreiben; starke Instruktionstreue; ideal für hochvolumige, gut definierte, präzise formulierte Tasks; unterstützt Streaming, Function Calling, Structured Outputs, custom/freeform Tools und Context-Free Grammar (Lark/Regex).
- **Schwächen:** Empfindlich gegenüber widersprüchlichen/unsauberen Prompts (Reasoning-Token-Verschwendung); bei `minimal` reasoning ist es kein guter Planer für tool-lastige Multi-Step-Workflows; **kein** Fine-Tuning, **keine** Predicted Outputs; kein Audio/Video; Markdown-Treue kann in langen Konversationen nachlassen (Format-Instruktionen alle 3–5 User-Nachrichten auffrischen).

## Output- & Format-Konventionen
- **Standardmäßig kein Markdown** in der finalen Antwort über die API. Markdown gezielt aktivieren mit semantischer Instruktion, z. B.: „Use Markdown **only where semantically correct** (e.g., `inline code`, code fences, lists, tables)."
- **Antwortlänge über `verbosity`** statt über Prompt-Umschreiben steuern: low = terse UX/minimal prose, medium = balanced (Default), high = verbose (gut für Audits/Lehre/Hand-offs). Prompts können den globalen Verbosity-Default kontextspezifisch überschreiben.
- **Tool-Preambles:** trainiert, Upfront-Pläne und Fortschritts-Updates zu liefern; Häufigkeit/Stil per Prompt steuerbar.
- **Modalitäten:** Text-Input + Text-Output, Bild-Input; **kein** Audio, **kein** Video.
- **Limits:** Kontextfenster 400.000 Tokens, max. Output 128.000 Tokens. Strukturierte Ausgaben werden unterstützt.

## Migrations-Hinweise
- **WEG von gpt-5-mini:**
  - Zu **gpt-5** wechseln, wenn Aufgaben komplexer/mehrstufig/explorativ werden oder höhere Qualität nötig ist (gleiche API-Shape, meist nur Modellname ändern); Kosten/Latenz steigen.
  - Beim Wechsel zu kleineren/nicht-reasoning Modellen (z. B. gpt-5-nano): Prompts präziser und expliziter machen, da weniger Reasoning-Spielraum.
- **ZU gpt-5-mini:**
  - Von größeren GPT-5-Modellen: Prompts schärfen/eindeutiger machen, Aufgaben gut definieren; widersprüchliche Instruktionen entfernen.
  - Von Nicht-Reasoning-Modellen (z. B. GPT-4.1/4o): `reasoning_effort` und `verbosity` als neue Steuerachsen einführen; bei `minimal` reasoning GPT-4.1-artiges, explizites Prompting beibehalten. Keine Zwischenschritte vorschreiben, sondern Task + Constraints + Output-Format liefern.
  - Für agentische Workflows auf die **Responses API** umstellen (Reasoning-Persistenz via `previous_response_id`); nicht System- und Developer-Message gleichzeitig senden.

## Quellen
- https://developers.openai.com/api/docs/models/gpt-5-mini — Model-Card: Kontextfenster (400k), max. Output (128k), Reasoning-Support, Modalitäten, unterstützte Features, Einordnung als günstige/latenzarme Variante für gut definierte Tasks.
- https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide — Prompting-Guide: `reasoning_effort`-Stufen, Eagerness-Steuerung, `verbosity`, Instruktionstreue/„surgical precision", Problem widersprüchlicher Instruktionen, Tool-Preambles, Markdown-Default-Verhalten, Minimal-Reasoning-Guidance, Responses-API-Empfehlung.
- https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_new_params_and_tools — Exakte Werte für `reasoning_effort` (minimal/medium-Default) und `verbosity` (low/medium/high), custom/freeform Tools und CFG; unterstützte Modelle inkl. gpt-5-mini.
- https://developers.openai.com/api/docs/guides/reasoning — Reasoning-Guide: Reasoning-Tokens nicht zwischen Calls gehalten, `previous_response_id`, Effort als Tuning-Knopf, Task/Constraints/Output-Format statt Zwischenschritte.
- https://openai.com/index/introducing-gpt-5-for-developers/ — Ankündigung: drei API-Größen (gpt-5, gpt-5-mini, gpt-5-nano), gpt-5-mini als schnellere/günstigere Variante, `reasoning_effort: minimal`, Responses-API-Empfehlung. (Seite beim Abruf HTTP 403 — Inhalt aus OpenAI-Suchindex-Snippet; SOURCE PARTIALLY UNAVAILABLE.)
