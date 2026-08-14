---
model: gemma-3
vendor: Google
family: Gemma
aliases: [gemma3, gemma-3-27b, gemma-3-27b-it, gemma-3-12b-it, gemma3-27b, gemma_3]
last_verified: 2026-06-13
status: current
---

# Gemma 3

## Reasoning / Thinking
- Typ: **keins** (kein dediziertes „Thinking"- oder Reasoning-Modus). Gemma 3 ist ein open-weight Modell (frei verfügbare Gewichte, pre-trained und instruction-tuned) und besitzt keinen eingebauten Chain-of-Thought-/Thinking-Schalter wie neuere „thinking"-Modelle.
- Schritt-für-Schritt-Denken muss klassisch über das Prompting angestoßen werden: explizite Anweisungen wie „Denke Schritt für Schritt" / „Begründe deine Antwort vor dem Ergebnis" bzw. Few-shot-Beispiele. Die offizielle Prompt-Formatting-Dokumentation erwähnt **weder** Chain-of-Thought **noch** Zero-/Few-shot-Techniken ausdrücklich (unbelegt, ob ein spezielles CoT-Format empfohlen wird).
- Verfügbare instruction-tuned Größen: 1B, 4B, 12B, 27B. Als Referenzvariante dient hier **gemma-3-27b-it** (größtes instruction-tuned Modell); das Prompt-/Turn-Format ist über alle Größen hinweg identisch.

## Prompting-Stil
- **Mäßig präskriptiv, aber formatgebunden.** Das instruction-tuned Modell ist auf ein festes Turn-Format feinjustiert; die Control-Tokens sind „reserved in and specific to our tokenizer" und müssen exakt verwendet werden.
- Offizielles Chat-/Prompt-Format (Turn-Tokens):
  - `<start_of_turn>` leitet einen Turn ein, `<end_of_turn>` beendet ihn.
  - Rollen-Marker direkt nach `<start_of_turn>`: `user` bzw. `model`.
  - Aufbau:
    ```
    <start_of_turn>user
    [Inhalt]<end_of_turn>
    <start_of_turn>model
    ```
  - Der letzte Turn endet mit `<start_of_turn>model` **ohne** schließendes Tag, damit das Modell generiert.
- **System-Prompt-Handhabung:** Es gibt **keine** dedizierte `system`-Rolle / keinen System-Turn — „the `system` role or a system turn is not supported." System-/Persona-Anweisungen werden stattdessen **an den Anfang der ersten User-Nachricht** gesetzt (offizielles Beispiel: „Only reply like a pirate. What is the answer to life the universe and everything?"). Manche HuggingFace-Chat-Templates akzeptieren technisch ein `system`-Feld, das aber intern in die erste User-Nachricht eingefügt wird; die Google-Doku bleibt maßgeblich.
- **Instruktionsbefolgung:** gut genug, dass System-Level-Anweisungen direkt im User-Prompt zuverlässig interpretiert werden — eine separate System-Rolle ist deshalb nicht nötig.
- **Bekannte Eigenheit (BOS-Token):** Die Tokenizer-Pipeline fügt typischerweise ein `<bos>`-Token am Sequenzanfang hinzu; die offizielle Formatting-Seite zeigt `<bos>` in ihren Beispielen jedoch **nicht** explizit. Bei Roh-Inferenz (ohne `apply_chat_template`) darauf achten, das BOS-Token nicht doppelt einzufügen (unbelegt im Detail).

## Stärken & Schwächen (prompt-relevant)
- **Stärken:**
  - Multimodal: Verarbeitet Text **und** Bild als Eingabe, erzeugt Text als Ausgabe (Bilder werden auf 896×896 normalisiert und zu je 256 Tokens kodiert) — gilt für 4B/12B/27B.
  - Mehrsprachig: Unterstützung für über 140 Sprachen → Prompts müssen nicht zwingend auf Englisch sein.
  - Langer Kontext: 128K Tokens (4B/12B/27B), 32K Tokens beim 1B-Modell.
  - Starke Leistung bei multilingualen, STEM- und multimodalen Benchmarks.
- **Schwächen:**
  - Kann subtile Nuancen, Sarkasmus oder bildhafte Sprache schlecht erfassen → für solche Fälle im Prompt explizit machen.
  - Kann faktisch falsche oder veraltete Aussagen erzeugen (Halluzinationen) → kritische Fakten extern verifizieren / im Prompt Quellenbindung verlangen.
  - Kein eingebautes Reasoning → bei komplexen Aufgaben CoT/Few-shot manuell vorgeben.

## Output- & Format-Konventionen
- Reines Text-Output; das Modell schließt seinen Turn mit `<end_of_turn>` ab.
- Strukturierte Ausgabe (JSON, Tabellen, Markdown) zuverlässig über explizite Format-Anweisungen im User-Prompt erreichbar (allgemeine Instruktionsbefolgung; spezielles JSON-Schema-/Structured-Output-Feature in den primären Quellen nicht dokumentiert — unbelegt).
- Empfohlene Sampling-/Generierungsparameter: temperature = 1.0, top_k = 64, top_p = 0.95, min_p = 0.0 (optional 0.01). Diese Werte stammen aus dem Unsloth-„How to Run"-Guide bzw. entsprechen den AI-Studio-Defaults; die **offizielle** Google-/Model-Card-Doku beschreibt die Parameter nur qualitativ und nennt **keine** verbindlichen Zahlenwerte.

## Migrations-Hinweise
- **Typische Änderungen, wenn man VON Gemma 3 wegmigriert:**
  - Zu Modellen mit dediziertem `system`-Feld (z. B. OpenAI/Anthropic): Die in die erste User-Nachricht eingebetteten System-Anweisungen wieder in ein echtes System-Prompt-Feld auslagern.
  - Gemma-spezifische Control-Tokens (`<start_of_turn>`, `<end_of_turn>`) entfernen — andere Modelle nutzen eigene Templates (z. B. `<|im_start|>`).
  - Sampling-Defaults anpassen: temperature 1.0 ist für viele andere Modelle zu hoch; übliche Zielwerte 0.2–0.7.
- **Typische Änderungen, wenn man ZU Gemma 3 migriert:**
  - Separate `system`-Messages auflösen und an den **Anfang der ersten User-Nachricht** verschieben (keine System-Rolle verfügbar).
  - Auf das exakte Turn-Token-Format umstellen bzw. `apply_chat_template()` der Transformers-Bibliothek nutzen, statt Tokens manuell zu setzen (vermeidet u. a. doppeltes `<bos>`).
  - Kein Thinking-Modus erwarten — explizites CoT-/Few-shot-Prompting für Reasoning-Aufgaben ergänzen.
  - Sampling auf temperature = 1.0, top_k = 64, top_p = 0.95 setzen (Gemma-typische Defaults).
  - Bild-Eingaben sind möglich (4B/12B/27B), aber 1B ist textonly.

## Quellen
- https://ai.google.dev/gemma/docs/core/prompt-structure — offizielle Turn-Token-Struktur (`<start_of_turn>`/`<end_of_turn>`, `user`/`model`), fehlende `system`-Rolle, Einbettung der System-Anweisung in die erste User-Nachricht, Tokenizer-spezifische Control-Tokens.
- https://huggingface.co/google/gemma-3-27b-it — Model Card: Größen 1B/4B/12B/27B, 128K Kontext, multimodal (896×896 / 256 Tokens), 140+ Sprachen, kein dokumentierter Thinking-Modus, Schwächen (Sarkasmus/bildhafte Sprache, Faktenfehler), bfloat16/`device_map="auto"`.
- https://huggingface.co/blog/gemma3 — Kontextgrößen pro Modell (1B = 32k; 4B/12B/27B = 128k), multimodal/multilingual/long-context-Charakterisierung, „very short system prompts followed by user prompts".
- https://huggingface.co/google/gemma-3-27b-it/discussions/84 — Google-Mitarbeiter erläutert die Sampling-Parameter qualitativ, ohne verbindliche Zahlenwerte.
- https://unsloth.ai/docs/models/gemma-3-how-to-run-and-fine-tune — empfohlene Sampling-Hyperparameter temperature = 1.0, top_k = 64, top_p = 0.95, min_p = 0.0 (Sekundärquelle für die in den offiziellen Docs fehlenden Zahlenwerte).
