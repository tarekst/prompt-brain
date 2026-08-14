---
model: claude-sonnet-5
vendor: Anthropic
family: Claude
aliases: [sonnet, sonnet-5, claude-sonnet5, sonnet5]
last_verified: 2026-08-14
status: current
---

# Claude Sonnet 5

## Reasoning / Thinking
- Typ: **adaptiv, per Default an**. Requests ohne `thinking`-Feld denken — Änderung gegenüber Sonnet 4.6, wo dieselben Requests ohne Thinking liefen. Abschalten mit `thinking: {type: "disabled"}` (ohne effort-Deckel, anders als bei Opus 5).
- `thinking: {type: "enabled", budget_tokens: N}` ist entfernt (400) — auf Sonnet 4.6 nur deprecated, hier keine Übergangslösung mehr. Tiefe über `output_config.effort`.
- effort-Stufen `low | medium | high | xhigh | max`, Default `high` (wie Sonnet 4.6); `xhigh` ist neu in der Sonnet-Klasse. Grobe Migrations-Zuordnung: Sonnet 5 auf `medium` ≈ Sonnet 4.6 auf `high`; Sonnet 5 auf `high` ≈ Sonnet 4.6 auf `max`.
- Effort-Stufen werden strikt befolgt, besonders am unteren Ende: bei `low`/`medium` bearbeitet das Modell nur das Verlangte. Bei flachem Reasoning effort erhöhen statt darum herum zu prompten.
- Sampling-Parameter `temperature`/`top_p`/`top_k` auf Nicht-Default-Werten → 400 (neu für die Sonnet-Klasse).
- `max_tokens` deckelt Thinking **plus** Antworttext: bei knappem Budget droht eine fast nur aus Thinking bestehende, abgeschnittene Antwort mit `stop_reason: "max_tokens"`.

## Prompting-Stil
- **Wörtliches Instruction-Following**, besonders bei niedrigem effort: keine stillschweigende Generalisierung, keine Ableitung ungestellter Anforderungen. Soll eine Regel breit gelten, den Geltungsbereich ausschreiben („auf jeden Abschnitt, nicht nur den ersten").
- **Verbosity ist aufgabenkalibriert** statt fix — kurze Antworten auf einfache Lookups, lange auf offene Analysen. Für feste Produktlängen explizit prompten; positive Beispiele der gewünschten Knappheit wirken besser als Negativ-Anweisungen.
- **Progress-Scaffolding streichen**: erzwungene Zwischenstands-Meldungen („nach je 3 Tool-Calls zusammenfassen") sind überflüssig; passt die Form nicht, Updates explizit beschreiben und Beispiele geben.
- **Tool-Nutzung**: von Haus aus agentischer als Sonnet 4.6 (greift bereitwilliger zu Tools und Self-Verification-Schleifen). **Mit abgeschaltetem Thinking** greift es seltener zu Tools — dann expliziten Nudge im System-Prompt ergänzen. `high`/`xhigh` erhöhen die Tool-Nutzung deutlich.
- **Adaptive-Thinking-Trigger ist steuerbar**: bei zu häufigen Thinking-Blöcken (kommt bei großen/komplexen System-Prompts vor) per Prompt gegensteuern und die Wirkung messen.
- **Tonalität**: Prosastil verschiebt sich gegenüber 4.6; Style-Prompts gegen die neue Baseline neu bewerten. Wer bisher `temperature` für stilistische Varianz nutzte, muss auf System-Prompt-Anweisungen umstellen.
- **Frontend/Design**: neigt bei offenen Briefs zu einem festen Default-Stil. Generische Verbote verschieben ihn nur; wirksam sind entweder eine konkrete Spezifikation (Palette, Typo, Layout) oder „erst 4 Richtungen vorschlagen, dann eine umsetzen" — Letzteres ist mangels `temperature` der empfohlene Weg zu Varianz.
- **Interaktive Coding-Produkte**: `xhigh`/`high`, autonome Modi ergänzen und nötige Nutzerinteraktionen reduzieren; Aufgabe, Absicht und Constraints im ersten Turn vollständig angeben.

## Stärken & Schwächen (prompt-relevant)
- Stärken: Coding und agentische Aufgaben (größter Zuwachs gegenüber Sonnet 4.6); läuft auf bestehenden Sonnet-4.6-Prompts out of the box; hochauflösende Vision; Computer Use mit `computer_20251124` bis 2576px / 3,75 MP (1080p als guter Performance-/Kosten-Kompromiss, 720p oder 1366×768 für kostensensible Fälle).
- Schwächen/Eigenheiten: Severity-Filter im Review-Prompt („nur high-severity", „be conservative") werden treuer befolgt als früher — Precision steigt, gemessener Recall kann sinken, obwohl die Bug-Findung besser ist. Gegenmittel: alles melden lassen (mit Confidence + Severity) und in einem separaten Schritt filtern.
- Risiko des Under-Thinking bei `low` auf mittelschweren Aufgaben.

## Output- & Format-Konventionen
- 1M-Kontextfenster, 128k Output-Tokens; über die Message-Batches-API bis 300k Output mit Beta-Header `output-300k-2026-03-24`.
- **Neuer Tokenizer**: derselbe Text ergibt rund 30 % mehr Tokens als auf Sonnet 4.6 (inhaltsabhängig). Für 4.6 getunte `max_tokens`-Limits können äquivalente Ausgaben abschneiden; Token-Zählungen und Kosten-Baselines neu erheben.
- `thinking.display` steht per Default auf `"omitted"` (Sonnet 4.6: `"summarized"`) — wer Reasoning streamt, muss `display: "summarized"` explizit setzen.
- Kein Assistant-Prefill — Structured Outputs (`output_config.format`) oder System-Prompt-Anweisungen nutzen.
- Preis laut Modelltabelle $2 / MTok Input, $10 / MTok Output; Reliable Knowledge Cutoff Januar 2026.
- Mid-Conversation-System-Messages (`role: "system"` innerhalb von `messages`) werden auf Sonnet 5 **nicht** unterstützt — dort bleibt der Top-Level-`system`-Prompt der Weg. (unbelegt: konkretes Fehlerbild)

## Migrations-Hinweise
- **VON Sonnet 5 weg**: Geltungsbereiche, die wegen der Wörtlichkeit ausgeschrieben wurden, können beim Zielmodell wieder knapper sein; Tonalitäts- und Varianz-Instruktionen neu bewerten (ggf. wieder `temperature` statt Prompt); Tokenizer-abhängige `max_tokens`-Werte neu bemessen; `xhigh` ist außerhalb der aktuellen Generation oft nicht verfügbar.
- **ZU Sonnet 5 migrieren**: `budget_tokens` durch adaptives Thinking + `effort` ersetzen; `temperature`/`top_p`/`top_k` entfernen und Tonalität/Varianz per Prompt steuern; Assistant-Prefill ersetzen; beachten, dass ein Request ohne `thinking`-Feld jetzt denkt (`max_tokens` prüfen, oder explizit `disabled` setzen); `display: "summarized"` setzen, falls Reasoning angezeigt wird; Token-Baselines wegen ~30 % mehr Tokens neu erheben; Progress-Scaffolding streichen; Review-Harness von Severity-Filtern auf „alles melden, später filtern" umstellen; bei bisher thinking-freien Setups Thinking an mit niedrigerem effort testen. Auf Amazon Bedrock erzwungenes `tool_choice` zusammen mit `thinking: {type: "disabled"}` senden. (unbelegt: Bedrock-Detail nicht auf den geprüften Seiten bestätigt)

## Quellen
- https://platform.claude.com/docs/en/about-claude/models/overview — belegt id `claude-sonnet-5`, 1M Kontext, 128k Output, $2/$10, Knowledge Cutoff Januar 2026, kein `thinking.type: "enabled"`, adaptives Thinking, effort-Default `high`, 300k-Output-Beta auf der Batches-API.
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5 — adaptives Thinking per Default, `budget_tokens` → 400, Sampling-Parameter → 400, ~30 % mehr Tokens durch neuen Tokenizer, effort-Zuordnung zu Sonnet 4.6, Wörtlichkeit, Verbosity, Tool-Triggering (auch mit Thinking off), Progress-Updates, Tonalität, Design-Defaults, Code-Review-Recall, Computer Use `computer_20251124` bis 2576px.
- https://platform.claude.com/docs/en/build-with-claude/effort — effort-Stufen inkl. `xhigh`/`max` für Sonnet 5, Default `high`, Empfehlungen je Stufe, effort bricht Prompt-Cache bei Wechsel.
- https://platform.claude.com/docs/en/about-claude/models/migration-guide — Migrationspfad Sonnet 4.6 → Sonnet 5 (Abschnitt `#migrating-from-claude-sonnet-4-6-to-claude-sonnet-5`).
