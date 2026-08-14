---
model: gpt-4.1
vendor: OpenAI
family: GPT
aliases: [gpt4.1, gpt-4-1, gpt41, gpt-4.1-2025-04-14]
last_verified: 2026-06-13
status: legacy
---

# GPT-4.1

## Reasoning / Thinking
- **Typ: keins.** GPT-4.1 ist KEIN Reasoning-Modell — OpenAI bezeichnet es ausdrücklich als „smartest non-reasoning model" und empfiehlt für Aufgaben, die von eigenständigem Reasoning profitieren, mit GPT-5 zu starten. Es gibt keinen internen Thinking-/Scratchpad-Schritt vor der Antwort.
- Schritt-für-Schritt-Denken muss daher **explizit per Prompt angestoßen** werden („induced chain-of-thought"). Das hebt die Output-Qualität, kostet aber zusätzliche Tokens und Latenz.
- Konkrete Anstöße aus dem OpenAI-Prompting-Guide:
  - Generischer Starter: „First, think carefully step by step about what documents are needed to answer the query."
  - Optionaler Planning-Reminder für agentische Abläufe: „You MUST plan extensively before each function call, and reflect extensively on the outcomes of the previous function calls."
- Empfohlenes Vorgehen: Reasoning-Strategie iterativ aus beobachteten Fehlern ableiten und im Prompt fest kodifizieren („audit failures and codify effective reasoning strategies"). Typische Fehlerquellen, die durch explizites Reasoning entschärft werden: Missverständnis der User-Intention, unvollständiges Context-Gathering, fehlerhafte schrittweise Ableitung.

## Prompting-Stil
- **Sehr präskriptiv / literal.** GPT-4.1 „is trained to follow instructions more closely and more literally than its predecessors". Konsequenzen:
  - Implizite Regelableitung ist reduziert — alles muss **explizit** spezifiziert werden; das Modell „liest" weniger zwischen den Zeilen als GPT-4o.
  - Weicht das Verhalten ab, genügt fast immer eine einzige, klare Korrektursatz: „a single sentence firmly and unequivocally clarifying your desired behavior is almost always sufficient".
  - Übersteuerte Absolut-Anweisungen können nach hinten losgehen: Sagt man z. B. „immer ein Tool aufrufen", erfindet (halluziniert) das Modell ggf. Tool-Calls, wenn Informationen fehlen. Fix: Eskalationsklausel ergänzen, z. B. „If you don't have enough information, ask the user for what you need."
- **System-Message-Treue:** Das Modell hält sich in agentischen Settings eng an User- *und* System-Prompt. Bei widersprüchlichen Anweisungen folgt es tendenziell denen **näher am Ende** des Prompts.
- **Agentic-Prompting:** OpenAI empfiehlt drei feste Reminder im Agenten-Systemprompt; sie steigerten intern den SWE-bench-Verified-Score um ~20 %:
  - *Persistence:* „You are an agent - please keep going until the user's query is completely resolved, before ending your turn and yielding back to the user."
  - *Tool-Calling:* „If you are not sure about file content or codebase structure pertaining to the user's request, use your tools to read files and gather the relevant information: do NOT guess or make up an answer."
  - *Planning (optional):* „You MUST plan extensively before each function call, and reflect extensively on the outcomes of the previous function calls."
- **Tools immer über das `tools`-API-Feld** übergeben, nicht als Textbeschreibung in den Prompt injizieren („exclusively use the tools field"): hält das Modell in-distribution und brachte intern +2 % auf SWE-bench Verified. Klare Namen und ausführliche Beschreibungen für Tools und Parameter verwenden.
- **Lange Kontexte:** effektiv bis ~1 Mio. Tokens nutzbar. Bei langen Kontexten Instruktionen **am Anfang UND am Ende** platzieren („at both the beginning and end of the provided context") — das schlägt einmalige Platzierung. Die Performance fällt mit steigender Retrieval-Komplexität bzw. bei graph-search-artigem Reasoning über viele verstreute Fakten.

## Stärken & Schwächen (prompt-relevant)
- **Stärken:**
  - Sehr starke, präzise Instruction-Following-Fähigkeit — Outputs lassen sich eng steuern.
  - Coding/agentic: deutlich besser als GPT-4o (lt. OpenAI +21,4 % auf SWE-bench Verified gegenüber GPT-4o); zuverlässiges Befolgen von Diff-Formaten, weniger überflüssige Edits, konsistente Tool-Nutzung.
  - Sehr großes Kontextfenster (1.047.576 Tokens) mit gutem Verständnis langer Dokumente.
- **Schwächen (prompt-relevant):**
  - Literalität ist ein zweischneidiges Schwert: unter- oder widersprüchlich spezifizierte Prompts führen schneller zu unerwünschtem Verhalten als bei „interpretierfreudigeren" Vorgängern.
  - Halluzinierte Tool-Calls bei zu absoluten Anweisungen ohne Eskalationspfad.
  - Wiederholte Beispiel-Phrasen werden wörtlich übernommen → ggf. repetitiv; Fix: „instruct model to vary phrases as necessary".
  - Hang zu ausschweifender Erklär-Prosa / übermäßigem Formatting, wenn nicht explizit knapp gehalten.
  - Kein eingebautes Reasoning → komplexe mehrstufige Logik muss per Prompt erzwungen werden.

## Output- & Format-Konventionen
- **Delimiter / Strukturierung** (empfohlene Reihenfolge zum Ausprobieren):
  - **Markdown** (Startpunkt): Section-Titel, Code in Backticks.
  - **XML**: funktioniert sehr gut, erlaubt präzises Wrapping/Nesting von Inhalten.
  - **JSON**: verbose und schnitt in Long-Context-Tests schlecht ab → für große Dokumentsammlungen meiden.
  - Für Dokumentsammlungen schlugen **XML** und das Format `ID|TITLE|CONTENT` das JSON-Format.
- **Empfohlene Prompt-Struktur** (Sektionen nach Bedarf hinzufügen/entfernen): Role and Objective → Instructions (mit Unterkategorien) → Reasoning Steps → Output Format → Examples → Context → abschließende „think step by step"-Instruktion.
- **Diff-Formate (Coding):** empfohlen wird das **V4A-Format** — kontextbasierte Identifikation **ohne Zeilennummern**, mit klaren Vorher/Nachher-Delimitern. Ebenfalls gut: **SEARCH/REPLACE** und Pseudo-XML — beide ohne Zeilennummern und mit klarer Alt/Neu-Abgrenzung.

## Migrations-Hinweise
- **Wenn man VON GPT-4.1 wegmigriert:**
  - Zu einem **Reasoning-Modell** (z. B. GPT-5 / o-Serie): manuell injizierte „think step by step"-Anweisungen und explizite Planning-Reminder können entfallen oder reduziert werden, da das Reasoning intern erfolgt; ggf. stattdessen Reasoning-Effort/-Parameter steuern (modellabhängig).
  - Prompts, die stark auf GPT-4.1s wörtliche Literalität getrimmt sind (sehr enge Absolut-Anweisungen), auf dem Zielmodell neu evaluieren — andere Modelle interpretieren freier.
- **Wenn man ZU GPT-4.1 migriert:**
  - Für ältere Modelle (z. B. GPT-4o) optimierte Prompts können Anpassung erfordern, da GPT-4.1 wörtlicher folgt: „prompts optimized for prior models may require migration."
  - Implizite Annahmen explizit machen; vages Verhalten mit einem klaren Korrektursatz nachschärfen.
  - Tool-Beschreibungen aus dem Prompt-Text ins `tools`-API-Feld überführen.
  - Bei langen Kontexten Instruktionen an Anfang UND Ende duplizieren.
  - Da kein Reasoning eingebaut ist: explizite Step-by-step-/Planning-Anweisungen ergänzen, wo zuvor ein Reasoning-Modell die Logik selbst übernahm.
- **Allgemein:** OpenAI betont „AI engineering is inherently an empirical discipline" — bei jeder Migration informative Evals aufbauen und iterieren; parallele Tool-Calls testen und bei Problemen ggf. deaktivieren.

## Quellen
- https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide — offizieller GPT-4.1 Prompting Guide (OpenAI Cookbook): literale Instruktionsbefolgung, drei agentische Reminder (Persistence/Tool-Calling/Planning), `tools`-Feld statt Prompt-Injektion, Long-Context-Platzierung am Anfang/Ende, induced Chain-of-Thought, empfohlene Prompt-Struktur, Delimiter (Markdown/XML/JSON), Diff-Formate (V4A/SEARCH-REPLACE/Pseudo-XML), Failure-Modes & Fixes.
- https://developers.openai.com/api/docs/models/gpt-4.1 — offizielle Modell-Spezifikation: Kontextfenster 1.047.576 Tokens, max. Output 32.768 Tokens, Knowledge Cutoff 1. Juni 2024, Einstufung als „smartest non-reasoning model", Snapshot gpt-4.1-2025-04-14.
- https://openai.com/index/gpt-4-1/ — offizielle Ankündigung „Introducing GPT-4.1 in the API": Modellfamilie, Coding/Instruction-Following/Long-Context-Stärken, +21,4 % auf SWE-bench Verified vs. GPT-4o. (Direktabruf HTTP 403; Inhalte über OpenAI-Suchsnippets verifiziert.)
