---
model: grok-4
vendor: xAI
family: Grok
aliases: [grok4, grok-4-latest, grok-4-0709, xai.grok-4]
last_verified: 2026-06-13
---

# Grok 4

## Reasoning / Thinking
- **Typ: immer an (reasoning-only).** Grok 4 ist ein reines Reasoning-Modell und besitzt keinen Non-Reasoning-Modus — das Modell „denkt" grundsätzlich vor jeder Antwort.
- **Tiefensteuerung: nicht parametrisierbar.** Das ursprüngliche `grok-4` unterstützt **kein** `reasoning_effort`. Wird der Parameter über die API gesendet, liefert das Modell eine Fehlerantwort. (Hinweis: `reasoning_effort` mit Stufen `none`/`low`/`medium`/`high` existiert bei xAI nur für andere Modelle wie `grok-3-mini`, `grok-4-fast-reasoning` und die Nachfolger `grok-4.3`/`grok-4.20` — nicht für `grok-4`.)
- **Praktische Tiefensteuerung:** Da kein Effort-Schalter existiert, regelt man die Reasoning-Tiefe indirekt über das Output-Budget — für anspruchsvolle Reasoning-Aufgaben das `max_tokens`/Maximum-Output-Limit erhöhen, damit genügend Spielraum für interne Thinking-Tokens bleibt.
- **Thinking-Traces nicht abrufbar:** Grok 4 legt seinen internen Denkprozess nicht offen; es gibt kein separates `reasoning_content`-/Chain-of-Thought-Feld in der API-Antwort, nur die finale Antwort.

## Prompting-Stil
- **Tool-augmentiertes Reasoning ist nativ.** Grok 4 wurde per Reinforcement Learning darauf trainiert, beim Denken Tools zu nutzen — u. a. einen Code-Interpreter und einen Web-Browser — und dabei autonom eigene Suchanfragen zu formulieren. Prompts sollten dem Modell daher klar sagen, *welche* Tools/Quellen es nutzen darf, statt jeden Zwischenschritt vorzuschreiben.
- **Live Search ist opt-in, nicht automatisch.** Web-Suche läuft über den Tools-Parameter (z. B. `tools=[web_search()]` im xAI-SDK bzw. `{"type": "web_search"}` in der OpenAI-kompatiblen Responses-API). Ohne aktiviertes Such-Tool greift das Modell nicht live auf das Web zu. Bei aktiviertem Tool entscheidet das Modell selbst, ob und mit welchen Queries es sucht.
- **Funktionsumfang:** Function Calling und Structured Outputs werden unterstützt; multimodaler Input aus Text und Bildern (Output: Text).
- **System-Prompt-Eigenheiten:** Spezifische, von xAI dokumentierte Aussagen zu System-Prompt-Treue oder Instruktionsbefolgung *für grok-4 konkret* liegen aus Primärquellen nicht vor (unbelegt). xAI hebt sehr strenge Prompt-Adhärenz und niedrige Halluzinationsraten erst für die Nachfolgemodelle (Grok 4.20/4.3) explizit hervor — nicht rückwirkend für grok-4.

## Stärken & Schwächen (prompt-relevant)
- **Stärken:** Starkes mehrstufiges Reasoning, multimodales Verständnis und Zugriff auf aktuelle Informationen (via Tool-/Web-Integration); agentische Nutzung möglich, da das Modell wiederholt Aktionen Richtung Ziel ausführen kann (autonomer Code-Interpreter + Browser). Trainiert auf verifizierbaren Daten in viele Domänen.
- **Schwächen / Einschränkungen (prompt-relevant):**
  - Keine Feinsteuerung der Denktiefe (`reasoning_effort` nicht verfügbar) — weniger Kontrolle über Latenz vs. Gründlichkeit als bei den Nachfolgern.
  - Kein einsehbarer Reasoning-Trace → schwerer zu debuggen.
  - `presence_penalty`, `frequency_penalty` und `stop` sind bei xAI-Reasoning-Modellen nicht nutzbar — entsprechend nicht für die Output-Steuerung von grok-4 einplanen.
  - Wissensstichtag November 2024; für neuere Fakten ist das Such-Tool nötig.

## Output- & Format-Konventionen
- Liefert ausschließlich die finale Antwort (kein Thinking-Feld). Strukturierte Ausgaben über Structured Outputs (z. B. via Pydantic-/JSON-Schema in der OpenAI-kompatiblen API) statt über manuell geparste Freitext-Formate anfordern.
- Formatvorgaben (Tabelle, JSON, Länge) gehören explizit in den Prompt; zur Begrenzung der Antwortlänge `max_tokens` nutzen, da `stop`-Sequenzen nicht zur Verfügung stehen.
- **Kontextfenster:** Laut xAI-Ankündigung verarbeitet Grok 4 bis zu **256.000 Tokens** (Text + Bilder). Hinweis: Auf manchen Drittplattformen ist das nutzbare Fenster niedriger angegeben — z. B. nennt Oracle OCI für `xai.grok-4` „128.000 Tokens"; das ist eine plattformspezifische Grenze, nicht zwingend das native Limit.

## Migrations-Hinweise
- **WEG von Grok 4 (z. B. zu Grok 4.3 / 4.20):**
  - `reasoning_effort` wird in den Nachfolgern unterstützt — Denktiefe lässt sich dort über `none`/`low`/`medium`/`high` (Default `low`) steuern.
  - Deutlich größeres Kontextfenster verfügbar (Nachfolger bis zu 1.000.000 Tokens).
  - xAI bewirbt für die Nachfolger striktere Prompt-Adhärenz und niedrigere Halluzinationsraten → bestehende, defensiv formulierte Prompts können oft verschlankt werden.
  - **Pflicht-Migration:** `grok-4` wurde am 15. Mai 2026 deprecatet und wird am 15. August 2026 abgeschaltet.
- **ZU Grok 4 (von einem Nicht-Reasoning- oder älteren Grok-Modell):**
  - Modell denkt immer — keine Annahme treffen, einen Effort-/Thinking-Schalter setzen zu können; `reasoning_effort` führt zum Fehler und muss aus Requests entfernt werden.
  - `presence_penalty`/`frequency_penalty`/`stop` aus bestehenden Requests entfernen (bei Reasoning-Modellen nicht erlaubt).
  - Für Live-Web-Zugriff das Such-Tool explizit aktivieren; nicht auf automatisches Browsen verlassen.
  - Prompts können knapper/zielorientierter werden (Ziel statt Schritt-für-Schritt-Mikromanagement), da das Modell Tool-Auswahl und Suchqueries selbst übernimmt.

## Quellen
- https://x.ai/news/grok-4 — offizielle Grok-4-Ankündigung: RL-Training zur autonomen Tool-Nutzung, 256k-Kontext, Reasoning-Fokus. (Beim Abruf 403; Inhalte über xAI-Websuche-Snippets bestätigt — SOURCE PARTIALLY UNAVAILABLE.)
- https://docs.x.ai/docs/guides/reasoning — xAI-Reasoning-Doku: `reasoning_effort`-Stufen gelten für Nachfolgemodelle, nicht für grok-4; Verbot von `presence_penalty`/`frequency_penalty`/`stop` bei Reasoning-Modellen.
- https://docs.x.ai/docs/guides/live-search — Web-Suche opt-in über Tools-Parameter (`web_search`), Modell ruft Suche autonom mit eigenen Queries auf.
- https://docs.x.ai/docs/models — Modellübersicht: bestätigt `grok-4-0709`, `grok-4`, `grok-4-latest`, Function Calling + Structured Outputs, Input `text, image → text`.
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/xai-grok-4.htm — Oracle-OCI-Doku: Reasoning ja, `reasoning_effort` nicht unterstützt (Fehler bei Übergabe), Function Calling + Structured Outputs, Wissensstichtag November 2024, plattformseitig 128k, Deprecation 15.05.2026 / Retirement 15.08.2026.
- https://www.datacamp.com/tutorial/grok-4-api — Sekundärquelle: reasoning-only/kein Non-Reasoning-Modus, keine offengelegten Reasoning-Traces, 256k-Kontext, Function Calling + Structured Outputs.
