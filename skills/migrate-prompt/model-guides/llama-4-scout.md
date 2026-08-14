---
model: llama-4-scout
vendor: Meta
family: Llama
aliases: [llama4-scout, llama-4-scout-17b-16e, llama-4-scout-17b-16e-instruct, meta-llama-4-scout]
last_verified: 2026-06-13
status: current
---

# Llama 4 Scout

## Reasoning / Thinking
- **Typ: keins (kein dediziertes Reasoning-/Thinking-Modell).** Die offiziellen Modellkarten und Prompt-Formate führen keinen extended-/adaptive-Thinking-Modus und keine Thinking-Tokens auf; Llama 4 Scout ist ein natively multimodales, instruction-tuned Standardmodell ohne separaten Denkmodus.
- **Architektur: Mixture-of-Experts (MoE).** 17 Mrd. aktive Parameter, 109 Mrd. Gesamtparameter, 16 Experten. Pro Token sind immer nur 17B Parameter aktiv. Verwendet eine `iRoPE`-Architektur sowie eine skalierte Softmax (Inference-Time Temperature Scaling) zur Längen-Generalisierung.
- **Sehr langer Kontext:** Die Instruct-Variante unterstützt bis zu 10 Mio. Tokens Kontext (das Basismodell ist auf 256K vortrainiert). Diese Reichweite eignet sich für Multi-Dokument-Analyse, sehr große Codebasen und lange Verläufe.
- **Schritt-für-Schritt-Denken anstoßen:** Da kein nativer Thinking-Modus existiert, wird Chain-of-Thought über klassisches Prompting erreicht — also explizit im System- oder User-Prompt anweisen (z. B. „Denke das Problem Schritt für Schritt durch, bevor du antwortest"). Auf Reasoning-Benchmarks erreicht Scout u. a. 74,3 % MMLU Pro und 57,2 % GPQA Diamond.

## Prompting-Stil
- **Präskriptivität: mittel bis hoch über das System-Prompt.** Meta empfiehlt ausdrücklich ein gut gestaltetes System-Prompt, um falsche Verweigerungen („false refusals") und belehrenden („preachy") Ton zu reduzieren.
- **Offizielles Prompt-Format / Chat-Template** mit Spezial-Tokens:
  - `<|begin_of_text|>` — Markiert den Prompt-Anfang.
  - `<|header_start|>{role}<|header_end|>` — Umschließt die Rolle (`system`, `user`, `assistant`, `ipython` für Tool-Antworten).
  - `<|eot|>` — End-of-Turn, signalisiert das Ende einer Nachricht/Antwort.
  - `<|end_of_text|>` — wird nur vom Basismodell (pretrained) erzeugt.
  - Beispielstruktur: `<|begin_of_text|><|header_start|>system<|header_end|>{system_prompt}<|eot|><|header_start|>user<|header_end|>{prompt}<|eot|><|header_start|>assistant<|header_end|>`
- **Offizielles System-Prompt-Template (Auszug):** „You are an expert conversationalist who responds to the best of your ability…" Das Template rät, Phrasen mit moralischer Überlegenheit zu vermeiden (z. B. „it's important to", „it's crucial to"), nicht zu belehren und Prompts zu politischen/gesellschaftlichen Themen nicht zu verweigern.
- **Instruktionsbefolgung:** Instruction-tuned über lightweight SFT → online RL → lightweight DPO. Gute Steuerbarkeit von Ton und Format über das System-Prompt.
- **Bekannte Eigenheiten:** Ohne gutes System-Prompt neigt das Modell zu standardisierter/belehrender Sprache. Bildverständnis ist nur für Englisch validiert, obwohl das Modell mehrsprachig ist.
- **Unterschiede zu Maverick:** Beide teilen 17B aktive Parameter und dasselbe Prompt-Format. Scout = 16 Experten / 109B gesamt / bis 10M Kontext / läuft auf einer einzelnen GPU (INT4-quantisiert auf 1× H100); Maverick = 128 Experten / 400B gesamt / 1M Kontext / höhere Reasoning-Performance, benötigt mehrere GPUs. Für reines Prompting sind sie austauschbar; Maverick liefert tendenziell stärkere Reasoning-Ergebnisse, Scout punktet mit längerem Kontext und Ressourceneffizienz.

## Stärken & Schwächen (prompt-relevant)
- **Stärken:**
  - Extrem langer Kontext (bis 10M Tokens, Instruct) — Prompts können sehr große Eingaben enthalten.
  - Native Multimodalität (early fusion): Text + bis zu 5 Bilder im Input getestet. „Best-in-class" bei Image Grounding / visueller Lokalisierung.
  - Stark mehrsprachig (Pre-Training auf 200 Sprachen, davon >100 mit je >1 Mrd. Tokens).
  - Effizient: läuft auf einer einzelnen Server-GPU.
- **Schwächen / Einschränkungen:**
  - Output ist **nur Text** (keine Bild-/Audio-Ausgabe).
  - Bildverständnis offiziell nur für **Englisch** validiert.
  - Kein nativer Reasoning-Modus — komplexe mehrstufige Aufgaben erfordern explizites CoT-Prompting; auf reinen Reasoning-Benchmarks unter Maverick.
  - Wissensstand bis **August 2024** (Knowledge Cutoff).
  - Ohne System-Prompt-Tuning Risiko von belehrendem Ton / unnötigen Verweigerungen.

## Output- & Format-Konventionen
- **Output-Modalität:** ausschließlich Text. Antworten enden mit `<|eot|>`.
- **Function/Tool-Calling:** zwei offizielle Formate: Python-/Listen-Format (`[get_weather(city="San Francisco")]`) und JSON-Format. Tool-Ergebnisse werden über die Rolle `ipython` zurückgegeben.
- **Bild-Input-Konventionen:** Bilder werden in 336×336-Pixel-Kacheln zerlegt; große Bilder nutzen Kachel-Separator-Tokens (`<|tile_x_separator|>`, `<|tile_y_separator|>`), kleine Bilder unter 336×336 benötigen keine Separatoren.
- **Strukturierte Ausgaben** (JSON, Markdown, Tabellen) werden zuverlässig über das System-/User-Prompt gesteuert; spezifische empfohlene Sampling-Parameter (z. B. Temperature) gibt Meta in der Modellkarte nicht vor (unbelegt für konkrete Temperature-Werte). Code-Beispiele nutzen `bfloat16` und `attn_implementation="flex_attention"`.

## Migrations-Hinweise
- **Typische Änderungen, wenn man VON Llama 4 Scout wegmigriert:**
  - Zu Maverick: gleiches Prompt-Format und gleiche aktive Parameterzahl — kein Template-Umbau nötig; jedoch Kontextlimit von 10M auf 1M beachten und Hardware-Bedarf einplanen. Reasoning-lastige Prompts profitieren.
  - Zu einem dedizierten Reasoning-Modell: explizite CoT-Instruktionen aus dem Prompt entfernen oder anpassen; Prompt-Format/Spezial-Tokens unterscheiden sich vollständig.
  - Lange-Kontext-Workflows (>1M Tokens) sind außerhalb von Scout schwer zu ersetzen — Kontext ggf. durch Chunking/Retrieval kompensieren.
- **Typische Änderungen, wenn man ZU Llama 4 Scout migriert:**
  - Von Llama 3: Umstellung des Prompt-Formats auf die Llama-4-Tokens (`<|header_start|>`/`<|header_end|>`/`<|eot|>`); Kontext steigt von 128K (Llama 3) auf bis zu 10M.
  - System-Prompt nach Metas Template gestalten, um belehrenden Ton / False Refusals zu vermeiden.
  - Multimodale Inputs (bis 5 Bilder) sind möglich; Bild-Prompts möglichst auf Englisch formulieren.
  - Für mehrstufiges Reasoning explizite Schritt-für-Schritt-Anweisungen ergänzen (kein Auto-Thinking).
  - Knowledge Cutoff August 2024 berücksichtigen; aktuelle Fakten via Tool-/RAG-Kontext zuführen.

## Quellen
- https://www.llama.com/docs/model-cards-and-prompt-formats/llama4/ — offizielles Prompt-Format, Spezial-Tokens, Rollen inkl. `ipython`, System-Prompt-Template, Function-Calling-Formate, Bild-Kachelung/Separator-Tokens, Knowledge Cutoff August 2024, kein Reasoning-Modus.
- https://ai.meta.com/blog/llama-4-multimodal-intelligence/ — MoE-Architektur (17B aktiv, 16 Experten, 109B gesamt für Scout), 10M-Token-Kontext, iRoPE, early-fusion-Multimodalität, Mehrsprachigkeit, Bildanzahl, Image Grounding, Trainingsmethodik, Einzel-GPU-Fähigkeit.
- https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct — offizielle Modellkarte: kein Reasoning-Modus, System-Prompt-Empfehlung, 10M-Kontext, MoE-Werte, unterstützte Sprachen, bis 5 Bilder, Knowledge Cutoff August 2024, Code-Hinweise (`flex_attention`, `bfloat16`).
- https://huggingface.co/blog/llama4-release — Kontextlängen Instruct vs. Base (Scout 10M vs. 256K), Reasoning-Benchmark-Werte (74,3 % MMLU Pro / 57,2 % GPQA Diamond), Unterschiede Scout/Maverick für Prompting.
