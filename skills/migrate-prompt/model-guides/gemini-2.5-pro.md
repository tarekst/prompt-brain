---
model: gemini-2.5-pro
vendor: Google
family: Gemini
aliases: [gemini-2.5-pro-preview-06-05, gemini25pro, gemini-25-pro, gemini2.5pro]
last_verified: 2026-06-13
status: legacy
successor: gemini-3.1-pro-preview
---

# Gemini 2.5 Pro

## Reasoning / Thinking
- **Typ: immer an (Thinking-Modell, nicht abschaltbar).** Gemini 2.5 Pro ist ein „thinking model"; das Denken kann nicht deaktiviert werden — in der Konfigurationstabelle steht ausdrücklich „N/A: Cannot disable thinking". `thinkingBudget = 0` wird nicht unterstützt.
- **Tiefensteuerung über `thinkingBudget`** (Teil von `generationConfig` / `thinkingConfig`): Wertebereich für 2.5 Pro **128 bis 32.768 Tokens**. Der Default ist **dynamisches Denken** (`thinkingBudget = -1`): das Modell passt den Aufwand automatisch an die Komplexität der Anfrage an. Das Budget ist eine Richtgröße, kein hartes Limit.
- **Gedanken-Zusammenfassungen über `includeThoughts: true`**: liefert „thought summaries" — aufbereitete, mit Überschriften und Schlüsseldetails strukturierte Versionen der internen Überlegungen (inkl. Hinweisen auf Tool-Nutzung). Zugriff im Response über die `parts`, die das boolesche Feld `thought` tragen. Die rohen Gedanken werden nicht offengelegt.
- **Thought Signatures**: verschlüsselte Repräsentationen des internen Denkprozesses. Bei 2.5 Pro werden sie zurückgegeben, wenn Thinking aktiv ist und die Anfrage Function Calling mit Function Declarations enthält. Beim Bearbeiten der Konversationshistorie oder bei Nutzung der REST-API müssen die Signaturen manuell zurückgegeben werden, um den Denk-Kontext über mehrere Turns zu erhalten; das Google-GenAI-SDK übernimmt dies automatisch.
- **Deep Think**: ein erweiterter Reasoning-Modus, der mehrere Hypothesen vor der Antwort abwägt (für hochkomplexe Mathe-/Coding-Fälle); separat verfügbar (Trusted-Tester / Vertex AI), nicht der Standard-API-Modus von 2.5 Pro.

## Prompting-Stil
- **Mäßig präskriptiv, instruktionstreu.** Google empfiehlt „clear and specific instructions" als Fundament; Anweisungen als Frage/Aufgabe/Entitäts-Operation formulieren, vage Anfragen vermeiden.
- **System Instructions** für Rolle, Constraints und Output-Format nutzen; im empfohlenen Prompt-Aufbau steht die System-Instruction zuerst, danach Kontext/Hintergrund, dann Few-Shot-Beispiele, dann die konkrete Aufgabe, abschließend eine klärende Anweisung.
- **Few-Shot-Beispiele sind ausdrücklich kritisch**: „always include few-shot examples … Prompts without few-shot examples are likely to be less effective." Empfohlen werden 2–5 variierte, spezifische Beispiele mit **identischer Formatierung** über alle Beispiele hinweg.
- **Struktur über Delimiter**: XML-Tags (z. B. `<context>`, `<task>`) oder Markdown-Überschriften zum Trennen der Prompt-Bestandteile; Konsistenz ist wichtiger als die konkrete Formatwahl.
- **Sehr großer Kontext:** Input-Token-Limit **1.048.576 Tokens** (≈1M). Bei langem Kontext große Kontextblöcke zuerst platzieren und die eigentliche Frage ans Ende stellen; Übergangsformulierungen wie „Based on the information above…" verwenden.
- **Bekannte Eigenheit (Knowledge-Cutoff):** Da der Cutoff bei Januar 2025 liegt, empfiehlt Google für faktische Genauigkeit, das aktuelle Datum und ggf. den Cutoff explizit in die System-Instruction zu schreiben und striktes Verlassen auf den bereitgestellten Kontext zu betonen.
- Hinweis: Eine Warnung gegen das Absenken der Temperature unter den Default bezieht sich in den Docs ausdrücklich auf **Gemini 3.x**, nicht auf 2.5 Pro; Übertragbarkeit auf 2.5 Pro (unbelegt).

## Stärken & Schwächen (prompt-relevant)
- **Stärken:** „state-of-the-art thinking model" für komplexes Reasoning in Code, Mathe und STEM sowie für die Analyse großer Datensätze, Codebases und Dokumente über langen Kontext. Coding und agentische Aufgaben gelten als Kern-Use-Cases. Multimodaler Input (Text, Bild, Audio, Video, PDF).
- **Schwächen / Grenzen:** Thinking ist nicht abschaltbar → für sehr einfache/latenzkritische Tasks entstehen unvermeidlich Thinking-Tokens (Kosten/Latenz); für solche Fälle ist eher Flash/Flash-Lite vorgesehen (unbelegt, abgeleitet aus der Familienpositionierung). Kein Image-/Audio-Output (Output ausschließlich Text); Wissens-Cutoff Januar 2025 → Ereignisse danach müssen via Kontext/Grounding bereitgestellt werden.

## Output- & Format-Konventionen
- **Output ausschließlich Text** (kein Bild/Audio-Output). Output-Token-Limit **65.536 Tokens**.
- **Strukturierte Outputs / JSON** werden unterstützt — Format am besten per Beispiel demonstrieren statt nur zu beschreiben; gewünschte Formatierung über Few-Shot-Beispiele bzw. Completion-Style-Prompts vorgeben.
- Constraints explizit nennen: Längenvorgaben („summarize in one sentence"), Format (Tabelle, Liste, JSON), Scope und was **nicht** getan werden soll.
- Unterstützte Funktionen u. a.: Function Calling, Code Execution, Structured Outputs, Caching, Batch API, Search Grounding, URL Context, File Search.

## Migrations-Hinweise
- **Nachfolger-Caveat:** Der im Frontmatter genannte `successor` `gemini-3.1-pro-preview` ist ein **Preview-Modell**; eine GA-Id der Form `gemini-3.1-pro` existiert nicht (404 auf der Modellseite). Gemini 2.5 Pro bleibt damit das aktuell einzige GA-Pro-Modell — der Nachfolger ist der dokumentierte Weiterentwicklungspfad, aber kein stabiles Migrationsziel für Produktion.
- **WEG von Gemini 2.5 Pro (z. B. zu Gemini 3.x):** Modell-spezifische Prompt-Hinweise prüfen — bei Gemini 3.x warnt Google ausdrücklich davor, die Temperature unter den Default zu senken. Thinking-Steuerung kann sich zwischen Generationen unterscheiden (Parameter/Defaults neu verifizieren). Höhere Output-Limits und Cutoff-Daten der Zielmodelle prüfen.
- **HIN zu Gemini 2.5 Pro (z. B. von einem Nicht-Thinking-Modell):** Damit rechnen, dass standardmäßig **dynamisches Denken** aktiv ist und Thinking nicht abschaltbar ist — Kosten/Latenz durch Thinking-Tokens einplanen oder `thinkingBudget` (128–32.768) setzen. Bei Function Calling auf **Thought Signatures** achten und sie über REST/eigene Historienverwaltung zurückgeben. Für Format-Treue Few-Shot-Beispiele ergänzen; großen Kontext (bis ~1M Tokens) nutzen, dabei Frage ans Ende stellen. Knowledge-Cutoff Januar 2025 berücksichtigen (aktuelles Datum/Grounding in System-Instruction).

## Quellen
- https://ai.google.dev/gemini-api/docs/models/gemini-2.5-pro — Modell-Code, Input-Limit 1.048.576, Output-Limit 65.536, Knowledge-Cutoff Januar 2025, Inputs (Audio/Bild/Video/Text/PDF), Output Text, unterstützte Features, Positionierung als Thinking-Modell.
- https://ai.google.dev/gemini-api/docs/thinking — Thinking nicht abschaltbar bei 2.5 Pro, `thinkingBudget` 128–32.768, Default dynamisch (-1), `includeThoughts`/Thought Summaries, Thought Signatures bei Function Calling.
- https://ai.google.dev/gemini-api/docs/prompting-strategies — Prompt-Design: klare Instruktionen, Few-Shot-Pflicht, Delimiter/Struktur, Prompt-Aufbau, langer Kontext (Frage ans Ende), Datum/Cutoff in System-Instruction, Gemini-3.x-Temperature-Warnung.
- https://developers.googleblog.com/en/gemini-2-5-thinking-model-updates/ — Thinking-Budget-Steuerung als Familienmerkmal, Coding/agentische Aufgaben als Kern-Use-Case, 06-05 stabil.
- https://blog.google/innovation-and-ai/models-and-research/google-deepmind/google-gemini-updates-io-2025/ — Deep-Think-Modus (mehrere Hypothesen), GA-Positionierung von 2.5 Pro.
