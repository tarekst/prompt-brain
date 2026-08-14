---
model: llama-4-maverick
vendor: Meta
family: Llama
aliases: [llama4-maverick, llama-4-maverick-17b, llama-4-maverick-17b-128e-instruct, llama4:maverick]
last_verified: 2026-06-13
---

# Llama 4 Maverick

## Reasoning / Thinking
- Typ: **keins** (kein dediziertes Reasoning-/Thinking-Modell). Die offizielle Doku und die Modellkarte beschreiben Maverick als instruktions-getuntes, nativ multimodales Modell ohne extended-thinking- oder dedizierten Chain-of-Thought-Modus. Es werden keine Thinking-Tokens oder ein separater Reasoning-Kanal dokumentiert.
- MoE-Architektur: **Mixture-of-Experts** mit **17 Mrd. aktiven Parametern**, **128 Experten** und **400 Mrd. Gesamtparametern**. Pro Token werden immer nur ~17B aktive Parameter berechnet, was Inferenz-/Trainingslatenz reduziert. Kontextfenster: **1 Mio. Tokens**.
- Schritt-für-Schritt-Denken anstoßen: Da kein nativer Reasoning-Modus existiert, muss Chain-of-Thought klassisch per Prompt erzwungen werden (z. B. „Denke Schritt für Schritt", explizite Zwischenschritte/Begründungen anfordern). Genaue Best-Practice-Formulierungen sind (unbelegt) — die Primärquellen dokumentieren keine spezifische CoT-Anstoß-Formulierung.

## Prompting-Stil
- Präskriptivität: Mittel. Maverick ist als **„steerable" (gut steuerbar)** ausgelegt — Antworten lassen sich laut Modellkarte „leicht an spezifische Developer-Ziele anpassen". Ein wirksamer System-Prompt reduziert Fehl-Refusals und „templated language".
- Offizielles Prompt-Format / Chat-Template (Header-Tokens):
  - `<|begin_of_text|>` — Beginn des Prompts.
  - `<|header_start|>` … `<|header_end|>` — umschließen die Rolle einer Nachricht.
  - `<|eot|>` — End of Turn; signalisiert, dass das Modell den Turn beendet hat.
  - `<|end_of_text|>` — Modell stoppt die Token-Generierung.
  - Unterstützte Rollen: `system`, `user`, `assistant`, `tool` (im Prompt als `ipython` bezeichnet).
  - Beispiel-Turn-Struktur (verbatim aus der Doku):
    ```
    <|begin_of_text|><|header_start|>system<|header_end|>
    [system content]<|eot|><|header_start|>user<|header_end|>
    [user content]<|eot|><|header_start|>assistant<|header_end|>
    ```
- System-Prompt-Stil: Der empfohlene System-Prompt beginnt verbatim mit „You are an expert conversationalist who responds to the best of your ability…" und schließt mit „You are Llama 4. Your knowledge cutoff date is August 2024. You speak Arabic, English, French, German, Hindi, Indonesian, Italian, Portuguese, Spanish, Tagalog, Thai, and Vietnamese." Empfehlung: diesen Basis-Prompt für eigene Use-Cases anpassen.
- Instruktionsbefolgung / Eigenheiten: Der System-Prompt rät explizit davon ab, „templated language" oder Floskeln mit moralischem Autoritätsanspruch („it's important to", „it's crucial to") zu verwenden; das Modell soll politische Prompts nicht verweigern. Diese Steuerung dient nachweislich der Reduktion von Fehl-Refusals.

## Stärken & Schwächen (prompt-relevant)
- Stärken:
  - Nativ multimodal (Text + Bild als Eingabe, reine Text-Ausgabe); laut Meta „bestes multimodales Modell seiner Klasse".
  - Starke Benchmark-Werte laut Modellkarte: MMLU Pro 80.5, MATH 61.2, MBPP (Code) 77.6 — gut für Coding-, Mathematik- und Wissensaufgaben.
  - Effizientes MoE-Design (nur 17B aktiv) → niedrigere Latenz bei großer Gesamtkapazität; sehr großes 1-Mio-Token-Kontextfenster.
- Schwächen:
  - Mehrsprachige Performance mit Lücken (z. B. TydiQA 31.7 vs. Llama 3.1 405B 34.3).
  - Bildverständnis nur auf Englisch; nur bis zu **5 Bilder** pro Eingabe getestet — darüber hinaus liegt die Risikominderung in Developer-Verantwortung.
  - Kein nativer Reasoning-Modus → komplexe mehrschrittige Logik muss per Prompt strukturiert werden.

## Output- & Format-Konventionen
- Reine Text-Ausgabe (kein Bild-Output). Eingabe darf Text + Bild kombinieren.
- Bild-Eingabe: bis zu 5 Bilder; dynamisches Tiling in 336×336-Pixel-Kacheln mit Separator-Tokens `<|tile_x_separator|>` und `<|tile_y_separator|>`.
- Tool-/Function-Calling-Formate (zwei Varianten):
  - Python-Stil: `[get_weather(city="San Francisco"), get_weather(city="Seattle")]`
  - JSON-Stil: `[{"name": "get_weather", "parameters": {"city": "San Francisco"}}]`
  - Tool-Outputs werden über die `ipython`-Rolle zurückgegeben.
  - Funktionsdefinitionen gehören in die **System-Message**.
  - Harte Regel (verbatim): **„NEVER combine text and function calls in the same response"** — also entweder Fließtext oder ein Function-Call, nie beides in einer Antwort.
- Mehrsprachigkeit (Text): Arabisch, Englisch, Französisch, Deutsch, Hindi, Indonesisch, Italienisch, Portugiesisch, Spanisch, Tagalog, Thai, Vietnamesisch.
- Knowledge-Cutoff: August 2024.

## Migrations-Hinweise
- Typische Änderungen, wenn man VON diesem Modell wegmigriert:
  - Beim Wechsel zu einem Reasoning-Modell entfallen ggf. manuell erzwungene CoT-Anweisungen; ggf. müssen Prompts entschlackt werden.
  - Header-Token-Format (`<|header_start|>`/`<|eot|>`) ist Llama-4-spezifisch und muss auf das Chat-Template der Zielfamilie umgestellt werden.
  - Die strikte Regel „kein Text + Function-Call gemischt" gilt evtl. nicht beim Zielmodell — Tool-Handling-Logik prüfen.
- Typische Änderungen, wenn man ZU diesem Modell migriert:
  - Vom Llama-3-Format auf das Llama-4-Format (`<|header_start|>`/`<|header_end|>`/`<|eot|>`) umstellen — die Token-Namen unterscheiden sich (Llama-3-Tokennamen hier (unbelegt) aus den Primärquellen).
  - Empfohlenen „expert conversationalist"-System-Prompt übernehmen/anpassen, um Fehl-Refusals und Floskeln zu reduzieren.
  - Function-Definitionen in die System-Message verlagern; sicherstellen, dass Tool-Calls nie mit Fließtext in derselben Antwort gemischt werden.
  - Multimodale Eingaben über `apply_chat_template` bzw. `AutoProcessor` strukturieren; auf max. 5 Bilder und englisches Bildverständnis achten.

## Quellen
- https://www.llama.com/docs/model-cards-and-prompt-formats/llama4/ — offizielles Prompt-Format: Header-Tokens, Rollen inkl. `ipython`, Turn-Struktur, Function-Calling-Formate und Regel „NEVER combine text and function calls", empfohlener System-Prompt, Tiling-Separator-Tokens, Sprachen, kein Reasoning-Modus.
- https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct — offizielle Meta-Modellkarte: MoE-Architektur (17B aktiv / 400B gesamt / 128 Experten), 1-Mio-Token-Kontext, Knowledge-Cutoff August 2024, Steerability/System-Prompt, Benchmark-Stärken und mehrsprachige Schwächen, multimodale Bild-Eingabe (bis 5 Bilder), `apply_chat_template`/`AutoProcessor`.
- https://ai.meta.com/blog/llama-4-multimodal-intelligence/ — Meta-Ankündigung „The Llama 4 herd": Positionierung Maverick, MoE-Größenangaben, Modellfamilie (Scout/Maverick).
