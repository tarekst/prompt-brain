---
model: mistral-large-2
vendor: Mistral AI
family: Mistral
aliases: [mistral-large, mistral-large-2407, mistral-large-latest, mistral-large-2.0]
last_verified: 2026-06-13
---

# Mistral Large 2

## Reasoning / Thinking
- Typ: **keins** (kein dediziertes Reasoning-/Thinking-Modell). Mistral Large 2 (mistral-large-2407) ist ein klassisches Instruct-Modell ohne separaten „extended thinking"-Modus, ohne sichtbare/versteckte Reasoning-Token und ohne adaptive Denk-Budgets.
- Schritt-für-Schritt-Denken wird klassisch per Prompt angestoßen: explizit Chain-of-Thought anfordern (z. B. „Denke Schritt für Schritt", „Begründe zuerst, antworte am Ende"). Mistral empfiehlt generell, Anweisungen klar zu strukturieren und ggf. Few-Shot-Beispiele mit dem gewünschten Denkpfad zu liefern.
- Das Modell wurde gezielt auf **stärkeres mathematisches und logisches Reasoning** sowie Code trainiert — das ist aber Trainingsqualität, kein eigener Reasoning-Modus.
- Halluzinations-Verhalten: Das Modell wurde „fine-tuned to be more cautious and discerning" und trainiert, anzuerkennen, „when it cannot find solutions or does not have sufficient information".

## Prompting-Stil
- **Präskriptivität / System-Prompt-Treue:** Mistral hebt explizit die „drastically improved instruction-following and conversational capabilities" hervor, mit besonderer Stärke beim „following precise instructions and handling long multi-turn conversations".
- **Empfohlene Prompt-Struktur (offiziell):** Rolle zuerst definieren („You are a <role>, your task is…"), Anweisungen hierarchisch in klare Abschnitte/Unterabschnitte gliedern, vollständig formulieren („als ob der Leser keinerlei Vorwissen hat"). Als Auszeichnung werden **Markdown oder XML-artige Tags** empfohlen.
- **System- vs. User-Prompt:** Der `system`-Prompt liefert grundlegenden Kontext und Verhaltensregeln, der `user`-Prompt die aufgabenspezifische Anweisung. Ist keine System-Rolle verfügbar, kann man die Instruktionen direkt in die User-Message konkatenieren.
- **Offizielles Prompt-Format / [INST]-Konvention:** Mistral Large 2 nutzt den **Tokenizer V3**. Das dokumentierte Roh-Template lautet:
  `<s>[INST] user message[/INST] assistant message</s>[INST] new user message[/INST]`
  — mit `<s>`/`</s>` als BOS/EOS, `[INST]`/`[/INST]` als Kontroll-Token und je einem Leerzeichen nach `[INST]` und `[/INST]`. Der **System-Prompt wird standardmäßig der letzten User-Message vorangestellt** (gefolgt von zwei Zeilenumbrüchen). Über die API/`mistral_common` wird dieses Format automatisch erzeugt — manuelles Templating ist nur bei Self-Hosting nötig.
- **Bekannte Eigenheiten:** Mistral warnt davor, subjektive Begriffe ohne Definition zu verwenden, Widersprüche in langen Prompts einzubauen (besser Entscheidungsbäume), das Modell Token zählen zu lassen, oder rein numerische Skalen zu nutzen (worded scales performen besser).
- **Tool-Use / Function-Calling:** Verbessertes Function-Calling, inkl. **paralleler und sequenzieller** Funktionsaufrufe. Über die API werden `tools` und der `tool_choice`-Parameter unterstützt (`tool_choice="any"` erzwingt einen Aufruf); parallele Aufrufe können in beliebiger Reihenfolge zurückkommen.

## Stärken & Schwächen (prompt-relevant)
- **Stärken:**
  - Sehr gute, präzise **Instruktionsbefolgung** und stabile **lange Multi-Turn-Konversationen**.
  - **Code (80+ Sprachen)** und **Mathematik/Reasoning** auf hohem Niveau.
  - **Mehrsprachig** (u. a. Französisch, Deutsch, Spanisch, Italienisch, Portugiesisch, Arabisch, Hindi, Russisch, Chinesisch, Japanisch, Koreanisch).
  - **Großes Kontextfenster: 128k Token.**
  - **Zuverlässiges Function-Calling** (parallel + sequenziell).
  - Auf **Knappheit trainiert** — folgt Kürze-Anforderungen gut.
- **Schwächen / Beachten:**
  - Kein nativer Reasoning-Modus — komplexe mehrstufige Logik muss per CoT/Prompt-Struktur ausgelöst werden (unbelegt, ob dies an aktuelle dedizierte Reasoning-Modelle heranreicht).
  - Wie alle LLMs anfällig für Fehler bei zähl-/token-basierten Aufgaben; Mistral rät hier explizit ab.
  - Widersprüchliche/lange unstrukturierte Prompts verschlechtern die Befolgung — klare Hierarchie nötig.

## Output- & Format-Konventionen
- **Konziseness als Designziel:** Mistral betont „conciseness is paramount". Outputs fallen tendenziell knapp aus; ausführliche Antworten ggf. explizit anfordern.
- **Strukturierte Outputs / JSON:** Für maschinenlesbare Ausgaben empfiehlt Mistral JSON-Output und bietet eine **Structured-Outputs**-Funktion zur Erzwingung konsistenter JSON-Schemata.
- **Formatierungsstandard:** Markdown bzw. XML-artige Tags zur Strukturierung von Ein- und Ausgaben werden offiziell empfohlen.
- **Few-Shot:** Beispiel-Dialoge (alternierende user/assistant-Messages) verbessern Format- und Verhaltenstreue.
- Vision/Multimodalität: für mistral-large-2407 in der Modellkarte **nicht** als Capability ausgewiesen (Text-Modell).

## Migrations-Hinweise
- **Typische Änderungen, wenn man VON Mistral Large 2 (2407) wegmigriert:**
  - Direkter Nachfolger ist **Mistral Large 2.1 (`mistral-large-2411`)**, danach **Mistral Large 3**; `mistral-large-latest` zeigt nicht mehr auf 2407. Für Reproduzierbarkeit die explizite ID `mistral-large-2407` pinnen statt `-latest`.
  - Retirement von 2407 laut Modellkarte: **30. März 2025** — produktive Pipelines auf eine aktuelle Version umstellen.
  - Beim Wechsel zu einem **dedizierten Reasoning-Modell** ggf. explizite CoT-Anweisungen entfernen (unbelegt).
- **Typische Änderungen, wenn man ZU Mistral Large 2 migriert:**
  - **[INST]-Format / Tokenizer V3** beachten, falls self-hosted: System-Prompt wird der letzten User-Message vorangestellt; bei API-Nutzung übernimmt `mistral_common` das automatisch.
  - Function-Calling auf das Mistral-Schema umstellen (`tools` + `tool_choice`, parallele Aufrufe möglich, Reihenfolge nicht garantiert).
  - Da das Modell auf **Knappheit** trainiert ist: wenn vom vorherigen Modell ausführliche Antworten erwartet wurden, Output-Länge ggf. explizit nachfordern.
  - Prompts auf **klare Hierarchie + Markdown/XML-Tags** umstellen.
  - 128k-Kontext erlaubt es, RAG-/Chunking-Strategien zu vereinfachen.

## Quellen
- https://mistral.ai/news/mistral-large-2407/ — Offizielle Ankündigung „Large Enough": 123B Parameter, 128k Kontext, Sprachen/Code-Sprachen, verbesserte Instruktionsbefolgung & Multi-Turn, Function-Calling (parallel/sequenziell), Konziseness-Designziel, Halluzinations-Reduktion.
- https://docs.mistral.ai/models/mistral-large-2-0-24-07 — Offizielle Modellkarte: API-ID `mistral-large-2407`, 128k Kontext, 123B Parameter, Retirement-Datum 30.03.2025, Ersatz Mistral Large 3, keine Vision-Capability.
- https://docs.mistral.ai/capabilities/completion/prompting_capabilities — Offizielle Prompting-Empfehlungen: Rollendefinition, Hierarchie, System- vs. User-Prompt, Markdown/XML-Tags, Few-Shot, JSON/Structured Outputs, Anti-Patterns.
- https://docs.mistral.ai/cookbooks/concept-deep-dive-tokenization-chat_templates — Tokenizer V3 Chat-Template: `[INST]/[/INST]`-Konvention, `<s>`/`</s>`, Platzierung des System-Prompts.
- https://docs.mistral.ai/getting-started/changelog — Changelog: Release 24.07.2024, Alias `mistral-large-latest`, Nachfolger `mistral-large-2411`.
- https://docs.mistral.ai/resources/cookbooks/mistral-function_calling-function_calling — Function-Calling-Details: `tool_choice` (inkl. `"any"`), parallele Tool-Calls.
