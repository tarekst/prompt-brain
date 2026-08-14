---
model: mistral-large-3
vendor: Mistral AI
family: Mistral
aliases: [mistral-large, mistral-large-latest, mistral-large-2512, large-3, large3, Mistral-Large-3-675B-Instruct-2512]
last_verified: 2026-08-14
status: current
---

# Mistral Large 3

## Reasoning / Thinking
- Typ: **kein Reasoning-Modus**. Die Vendor-Card nennt unter „Limitations" wörtlich „Not a dedicated reasoning model"; die Doku-Model-Card listet weder einen `reasoning_effort`- noch einen Thinking-Parameter. Die Ankündigung sagt „A reasoning version is coming soon!" — also nicht in diesem Modell enthalten.
- Tiefe kommt daher **ausschließlich aus dem Prompt**: explizites Step-by-step / Chain-of-Thought im System- oder User-Prompt. Es gibt keinen Regler, den man hochdrehen kann.
- Verwechslungsgefahr im selben Haus: **Mistral Medium 3.5** hat laut Changelog „adjustable reasoning via the `reasoning_effort` parameter" — Large 3 nicht. Ein Prompt, der auf `reasoning_effort` baut, stammt nicht von Large 3.
- Statt Reasoning-Regler wird Sampling gesteuert: „Use a temperature below 0.1 for daily-driver and production environments"; höhere Temperaturen nur für kreative Fälle.

## Prompting-Stil
- **System-Prompt ist die primäre Steuerfläche**: „Define a clear environment and use case, including guidance on how to effectively leverage tools in agentic systems."
- Rollen-zuerst-Framing aus der offiziellen Prompting-Doku: „You are a <role>, your task is to <task>." Anweisungen hierarchisch in Sektionen/Subsektionen gliedern und so schreiben, als „you're writing for someone with no prior context".
- Struktur über **Markdown und/oder XML-artige Tags** (begründet mit „Readable", „Parsable", „Familiar"). Few-Shot entweder als „Examples"-Sektion oder als künstliche user/assistant-Turns. System = genereller Kontext, User = Kontext der aktuellen Interaktion; ohne System-Rolle beides in den User-Turn konkatenieren.
- **Tools knapp halten**: „limit their number to the minimum required for the use case", „Avoiding overloading the model with an excessive number of tools."
- Bilder: Seitenverhältnis nahe **1:1** halten, sehr schmale/breite Bilder vorher zuschneiden.
- Dokumentierte Anti-Patterns: unscharfe quantitative Adjektive („too long", „too short", „many", „few") und schwammige Wörter („things", „stuff", „interesting", „better"), widersprüchliche Anweisungen (stattdessen Entscheidungsbäume), das Modell zählen lassen (Zeichen-/Token-Zahlen als Input mitgeben), unnötige Output-Tokens, numerische 1–5-Skalen (stattdessen Wortskalen wie „Very Good", „Neutral").

## Stärken & Schwächen (prompt-relevant)
- Stärken: „state-of-the-art, open-weight, general-purpose multimodal model" unter Apache 2.0; laut Ankündigung „our most capable model to date" und „one of the best permissive open weight models in the world", mit Bildverständnis, „best-in-class performance on multilingual conversations" über „40+ native languages" und Platz „#2 in the OSS non-reasoning models category" auf LMArena. Der vom Vendor bereitgestellte optimierte Checkpoint läuft laut Ankündigung auf einem einzelnen 8×A100- oder 8×H100-Node via vLLM. Günstig für die Klasse: $0.5/M Input, $1.5/M Output.
- Architektur: granulares MoE mit 675B Gesamt- und 41B aktiven Parametern (673B/39B Sprachmodell + 2.5B Vision-Encoder).
- Schwächen: „Not a dedicated reasoning model" und „Behind vision-first models in multimodal tasks"; die sehr niedrige Temperatur-Empfehlung (<0.1) erzwingt Neu-Kalibrierung kreativer Setups.
- Stolperfalle beim Upgrade-Pfad: Mistrals eigene Legacy-Tabelle verweist **Mistral Large 2.1 (`mistral-large-2411`) auf Mistral Medium 3.5**, nicht auf Large 3 (Deprecation 2/27/2026, Retirement 5/31/2026). Nur Large 2.0 (`mistral-large-2407`) und Large 1.0 (`mistral-large-2402`) zeigen auf Large 3.

## Output- & Format-Konventionen
- **256k Kontextfenster** (Doku-Model-Card und Vendor-Card übereinstimmend). Ein **maximales Output-Token-Limit ist offiziell nicht dokumentiert (unbelegt)**; der einzige vom Vendor gezeigte Wert ist `max_tokens = 262144` (Konstante `MAX_TOK`) im Beispielcode der Vendor-Card.
- Unterstützte Features laut Model Card: Function Calling, Structured Outputs, Chat Completions (`/v1/chat/completions`), Document QnA, Prefix (Assistant-Prefill), Batching, Agents & Conversations, Built-In Tools.
- Multimodaler Input (Text + Bild) wird unterstützt; Format-Treue über Structured Outputs oder Prefix-Prefill erzwingen statt über Prosa-Bitten.
- Produktions-API-Id: `mistral-large-2512`. Worauf `mistral-large-latest` aktuell zeigt, sagt die Doku nicht (unbelegt).

## Migrations-Hinweise
- **VON Mistral Large 3 weg**: Bild-Content-Parts für reine Text-Ziele entfernen; Prompt-Budget neu planen, wenn das Ziel unter 256k Kontext liegt; Temperatur nach oben re-kalibrieren (die meisten Ziele gehen von Defaults deutlich über 0.1 aus); Mistral-Spezifika wie Prefix-Prefill, Built-In Tools und `/v1/conversations` durch Ziel-Äquivalente ersetzen; der Apache-2.0-Selfhosting-Pfad entfällt bei Closed-Weight-Zielen.
- **ZU Mistral Large 3 migrieren**: Modell-Id auf `mistral-large-2512` setzen (vom Vendor vorgesehener Pfad ab `mistral-large-2407`/`mistral-large-2402`); Kontext wächst auf 256k, Chunking/RAG-Splitting darf entsprechend gelockert werden; externes OCR/Vision-Preprocessing entfällt, Bilder direkt als Content-Parts mit ~1:1-Seitenverhältnis übergeben; Temperatur für Produktion auf <0.1 senken; Umgebungs-, Use-Case- und Tool-Anweisungen in den System-Prompt verschieben und die Tool-Anzahl reduzieren; **keine** Thinking-/Reasoning-Parameter oder „reasoning effort"-Formulierungen ergänzen — stattdessen explizites Chain-of-Thought-Prompting; Legacy-`[INST]`-Handtemplating aus der Large-2-Ära entfernen und über die API normale Chat-Messages nutzen (welches Chat-Template Large 3 beim Selfhosting erwartet, ist hier nicht belegt — Tokenizer/Template des offiziellen Repos verwenden).

## Quellen
- https://docs.mistral.ai/models/model-cards/mistral-large-3-25-12 — offizielle Model Card: API-Id `mistral-large-2512`, v25.12, 2. Dezember 2025, Apache 2.0, 256k Kontext, 41B aktiv / 675B gesamt, $0.5/M in und $1.5/M out, Feature-Liste; kein Reasoning-Parameter, keine Max-Output-Angabe.
- https://huggingface.co/mistralai/Mistral-Large-3-675B-Instruct-2512 — offizielle Vendor-Card: Temperatur <0.1, System-Prompt- und Tool-Anzahl-Guidance, 1:1-Bildverhältnis, 256k Kontext, `max_tokens=262144` im Beispielcode, MoE 673B/39B + 2.5B Vision-Encoder, Limitations „Not a dedicated reasoning model" / „Behind vision-first models in multimodal tasks".
- https://docs.mistral.ai/capabilities/completion/prompting_capabilities — offizielle Prompting-Guidance: Rollen-Framing, hierarchische Struktur, Markdown/XML-Tags, Few-Shot, System-vs-User-Split, Anti-Pattern-Liste.
- https://docs.mistral.ai/getting-started/models/models_overview/ — aktuelles Line-up (Large 3, Apache 2.0, v25.12, „open-weight, general-purpose multimodal") und Legacy-Tabelle: 2407/2402 → Large 3, 2411 → Medium 3.5 (2/27/2026, 5/31/2026).
- https://docs.mistral.ai/getting-started/changelog — Release-Eintrag „We released Mistral Large 3 (`mistral-large-2512`)" und die Medium-3.5-Zeile „with adjustable reasoning via the `reasoning_effort` parameter".
- https://mistral.ai/news/mistral-3/ — Ankündigung: „most capable model to date", 40+ Sprachen, Bildverständnis, Apache 2.0, 8×A100/8×H100 via vLLM, LMArena #2 OSS non-reasoning, „A reasoning version is coming soon!".
