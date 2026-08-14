---
model: deepseek-v3
vendor: DeepSeek
family: DeepSeek
aliases: [deepseek-chat, v3, deepseek-v3-base, deepseek-v3-0324, deepseek-v3-chat]
last_verified: 2026-06-13
status: legacy
successor: deepseek-v4-flash
---

# DeepSeek-V3

## Reasoning / Thinking
- **Typ: keins** (Non-Reasoning-Chat-Modell). DeepSeek-V3 ist das instruktionsgetunte Chat-Modell der V3-Serie und wurde historisch über die Model-ID `deepseek-chat` angesprochen. Es ist **kein** dediziertes Reasoning-Modell wie DeepSeek-R1 und gibt keine separate `reasoning_content`-Spur zurück.
- V3 wurde per **Knowledge Distillation aus DeepSeek-R1** trainiert und hat dadurch verbesserte Reasoning-Fähigkeiten geerbt, „though it is not itself a reasoning model like R1" — die Chain-of-Thought ist also implizit antrainiert, aber nicht als eigener Denkmodus exponiert.
- **Schritt-für-Schritt-Denken anstoßen:** Da V3 keinen eingebauten Thinking-Modus hat, muss Schritt-für-Schritt-Denken explizit über den Prompt erzwungen werden — z. B. „Denke Schritt für Schritt", strukturierte/hierarchische Markdown-Prompts oder das Vorgeben einer Gliederung (Problem → Lösungsschritte → Ergebnis). Anders als bei R1 darf und soll bei V3 der **System-Prompt** zur Verhaltenssteuerung genutzt werden.
- **Abgrenzung zu R1 (`deepseek-reasoner`):** R1 produziert eine separate, verborgene Chain-of-Thought (`reasoning_content`) und unterstützt im Original keinen System-Prompt; V3 verhält sich dagegen wie ein klassisches Chat-Modell und befolgt System-Prompts. (Hinweis: In der aktuellen DeepSeek-API sind die IDs `deepseek-chat` und `deepseek-reasoner` mittlerweile auf `deepseek-v4-flash` umgemappt und werden zum 2026/07/24 deprecatet; die V3-Gewichte bleiben über die Open-Weights-Releases verfügbar.)

## Prompting-Stil
- **Präskriptivität:** mittel-hoch. V3 „behaves more like traditional chat models, responds well to system prompts" und reagiert gut auf präzise, strukturierte Anweisungen. Klare, hierarchisch gegliederte Markdown-Prompts werden empfohlen.
- **System-Prompt-Treue / Instruktionsbefolgung:** Gut — anders als bei R1 wird der System-Prompt aktiv zur Verhaltensfixierung genutzt. Die offizielle V3-0324-Vorlage für den System-Prompt lautet: `该助手为DeepSeek Chat，由深度求索公司创造。今天是{current date}。`. Das Einsetzen des aktuellen Datums im System-Prompt wird offiziell vorgesehen.
- **Temperatur-Empfehlungen (offiziell, nach Anwendungsfall):**
  - Coding / Math: **0.0**
  - Data Cleaning / Data Analysis: **1.0**
  - General Conversation: **1.3**
  - Translation: **1.3**
  - Creative Writing / Poetry: **1.5**
  - Default der API: **1.0**.
- **Bekannte Eigenheit — API-Temperatur-Mapping:** Die DeepSeek-API skaliert den `temperature`-Wert intern. Laut V3-0324-Modelkarte gilt: für API-Temperaturen 0–1.0 ist `T_model = T_api × 0.3`, für 1.0–2.0 gilt `T_model = T_api − 0.7`. Konkret: API-`temperature=1.0` entspricht der Modell-Temperatur **0.3**. Wer die Open-Weights lokal betreibt, umgeht dieses Mapping und sollte direkt mit den niedrigeren Roh-Temperaturen arbeiten (Referenz-`generate.py` nutzt z. B. `--temperature 0.7`).

## Stärken & Schwächen (prompt-relevant)
- **Stärken:** Starkes MoE-Modell für Math, Code und mehrsprachige Aufgaben; gut bei strukturierten Ausgaben und beim Befolgen komplexer System-Instruktionen. V3-0324 brachte messbare Verbesserungen (AIME +19.8, GPQA +9.3, MMLU-Pro +5.3) sowie „improved function calling accuracy".
- **Reasoning implizit, nicht exponiert:** Profitiert von der R1-Distillation, liefert aber keine separat sichtbare Denkspur — für nachvollziehbares Schritt-für-Schritt-Reasoning muss man es im Prompt anfordern (oder gleich R1 wählen).
- **Schwäche / Stolperfalle:** Das versteckte Temperatur-Mapping der API führt leicht zu unerwartet „kreativeren" oder deterministischeren Ergebnissen als der gesetzte Wert vermuten lässt — die effektive Modell-Temperatur ist deutlich niedriger als der API-Wert.

## Output- & Format-Konventionen
- **Funktionsumfang (`deepseek-chat`/V3):** Function Calling, JSON-Mode/JSON-Output, Prefix Completions (Beta) und Fill-in-the-Middle (FIM) für Code-Editing.
- **Function Calling:** offiziell unterstützt; das Beispiel der API-Doku nutzt das Modell `deepseek-chat`. Der `strict`-Modus ist als **Beta** gekennzeichnet.
- **Chat-Template:** V3 nutzt ein definiertes Chat-Template; System-/User-/Assistant-Rollen werden unterstützt.
- **Strukturierte Ausgaben:** Gut steuerbar über JSON-Mode und explizite Format-Vorgaben im Prompt (Markdown-Gliederungen, Tabellen, Codeblöcke).
- **Spezialvorlagen (V3-0324):** Eigene Prompt-Templates für File-Upload (`{file_name}`, `{file_content}`, `{question}`) und Web-Search.

## Migrations-Hinweise
- **VON DeepSeek-V3 weg migrieren:**
  - Zu **R1 / `deepseek-reasoner`**: System-Prompt-basierte Steuerung reduzieren bzw. Instruktionen in die User-Rolle verlagern; mit separatem `reasoning_content` rechnen; explizite „Denke-Schritt-für-Schritt"-Anweisungen entfernen, da R1 ohnehin reasoned.
  - Zu **anderen Vendoren (OpenAI/Anthropic/Gemini)**: Das implizite Temperatur-Mapping fällt weg — Temperaturwerte neu kalibrieren (ein V3-„API 1.0" entsprach Modell-0.3).
- **ZU DeepSeek-V3 migrieren:**
  - System-Prompt aktiv zur Verhaltensfixierung einsetzen und ggf. das DeepSeek-Datumsmuster im System-Prompt ergänzen.
  - **Temperatur an die offizielle Use-Case-Tabelle anpassen** und das API-Mapping einkalkulieren: für deterministischen Code `temperature=0.0`, für Kreativtexte bis `1.5`; bei lokalem Open-Weights-Betrieb mit niedrigeren Roh-Werten arbeiten.
  - Hierarchische, strukturierte Markdown-Prompts und klare Step-by-Step-Gliederungen nutzen, um Schritt-für-Schritt-Verhalten zu aktivieren, da V3 keinen automatischen Thinking-Modus besitzt.

## Quellen
- https://api-docs.deepseek.com/quick_start/parameter_settings — offizielle Temperatur-Empfehlungen nach Anwendungsfall (Coding 0.0, Conversation/Translation 1.3, Creative 1.5; Default 1.0).
- https://huggingface.co/deepseek-ai/DeepSeek-V3 — Modellkarte: MoE, 671B total / 37B aktiviert, 128K Kontext, Chat- vs. Base-Variante, R1-Distillation, kein dediziertes Reasoning-Modell.
- https://github.com/deepseek-ai/DeepSeek-V3 — offizielles Repo: Architektur (MLA, DeepSeekMoE), Chat-/Instruct-Charakter, Referenz-`generate.py` mit Temperatur-Beispiel (0.7).
- https://huggingface.co/deepseek-ai/DeepSeek-V3-0324 — System-Prompt-Vorlage, empfohlene Temperatur 0.3, API-Temperatur-Mapping, Verbesserungen ggü. V3, File-/Web-Search-Templates.
- https://api-docs.deepseek.com/guides/function_calling — Function Calling für `deepseek-chat` offiziell unterstützt; `strict`-Modus als Beta.
- https://api-docs.deepseek.com/quick_start/pricing — aktueller API-Status: `deepseek-chat`/`deepseek-reasoner` mappen jetzt auf `deepseek-v4-flash` und werden zum 2026/07/24 deprecatet.
