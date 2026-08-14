---
model: deepseek-r1
vendor: DeepSeek
family: DeepSeek
aliases: [deepseek-reasoner, r1]
last_verified: 2026-06-13
---

# DeepSeek-R1

## Reasoning / Thinking
- **Typ: immer an (Reasoning-Modell).** DeepSeek-R1 ist ein dediziertes Reasoning-Modell, das vor der eigentlichen Antwort eine Chain-of-Thought (CoT) in einem `<think>...</think>`-Block erzeugt. Es gibt keinen Schalter zum vollständigen Abschalten des Thinkings.
- **Kein System-Prompt.** Offizielle Empfehlung: „Avoid adding a system prompt; all instructions should be contained within the user prompt." Sämtliche Anweisungen gehören also in den User-Prompt, nicht in eine System-Rolle.
- **Kein few-shot.** Laut Paper ist R1 promptsensitiv: „Few-shot prompting consistently degrades its performance." Empfehlung: „We recommend users directly describe the problem and specify the output format using a zero-shot setting for optimal results."
- **Temperatur-Empfehlung: 0.5–0.7, empfohlen 0.6** („to prevent endless repetitions or incoherent outputs"); im Paper wird zur Evaluation `temperature = 0.6` und `top_p = 0.95` verwendet.
- **`<think>`-Start erzwingen.** „To ensure that the model engages in thorough reasoning, we recommend enforcing the model to initiate its response with `<think>\n` at the beginning of every output." Hintergrund: Die R1-Serie umgeht teils das Thinking, indem sie einen leeren Block (`<think>\n\n</think>`) ausgibt, was die Leistung verschlechtert.
- **Mathe-Prompts.** Für mathematische Aufgaben wird ein expliziter Hinweis empfohlen: „Please reason step by step, and put your final answer within `\boxed{}`."
- **API: `reasoning_content`.** Über die API (Modellname `deepseek-reasoner`) liefert das Modell die CoT separat im Feld `reasoning_content` (gleiche Strukturebene wie `content`, das die finale Antwort enthält). In Folge-Runden wird die CoT der Vorrunden NICHT in den Kontext übernommen; das Feld `reasoning_content` muss vor dem nächsten Request aus der Message entfernt werden, sonst gibt es einen 400-Fehler.
- **Hinweis zur API-Identität (Stand 2026-06-13):** Der API-Name `deepseek-reasoner` wird laut DeepSeek-Pricing-Seite am 2026/07/24 deprecated und entspricht aus Kompatibilitätsgründen dem Thinking-Mode von `deepseek-v4-flash`. Das ursprüngliche Open-Weights-Modell „DeepSeek-R1" (arXiv 2501.12948, HF-Modelkarte) ist davon zu unterscheiden; die obigen Reasoning-Empfehlungen stammen aus dessen Modelkarte/Paper.

## Prompting-Stil
- **Mäßig präskriptiv, aber mit klaren Regeln.** DeepSeek gibt wenige, dafür harte Vorgaben: kein System-Prompt, kein few-shot, Temperatur im engen Band 0.6, Ausgabeformat explizit im User-Prompt verlangen.
- **Empfohlen:** Aufgabe direkt und in einfacher Sprache beschreiben (zero-shot); gewünschtes Ausgabeformat ausdrücklich angeben; bei Mathe `\boxed{}`-Direktive ergänzen; Antwort mit `<think>\n` beginnen lassen.
- **Abgeraten:** Few-shot-Beispiele („consistently degrades performance"), System-Prompts, sehr hohe oder sehr niedrige Temperatur (außerhalb 0.5–0.7).
- **Evaluation:** Mehrere Durchläufe fahren und mitteln, da das Modell promptsensitiv ist.

## Stärken & Schwächen (prompt-relevant)
- **Stärken:** Starkes mehrstufiges Reasoning (Mathematik, Code, Logik) dank RL-Training; profitiert von schlanken, direkten Zero-Shot-Anweisungen; liefert nachvollziehbare CoT, die über `reasoning_content` getrennt abgreifbar ist.
- **Schwächen / Fallstricke:** Promptsensitiv — few-shot und überladener Kontext schaden eher; neigt bei manchen Anfragen dazu, das Thinking zu überspringen (leerer `<think>`-Block); kann bei Temperatur außerhalb 0.5–0.7 in Wiederholungen/Inkohärenz kippen; kein System-Prompt-Kanal im Originalmodell.
- **API-Einschränkungen:** Kein Function Calling, kein FIM (Beta); `logprobs`/`top_logprobs` führen zum Fehler (gilt laut Reasoning-Doku für `deepseek-reasoner`).

## Output- & Format-Konventionen
- **`<think>...</think>` + Antwort.** Roh-Output enthält den CoT-Block, gefolgt von der finalen Antwort. Über die API wird die CoT als `reasoning_content` ausgeliefert, die Endantwort als `content`.
- **`max_tokens`** umfasst die CoT mit. Default 32K Tokens, Maximum 64K Tokens (API `deepseek-reasoner`).
- **Kontextlänge** des Modells: 128K Tokens (HF-Modelkarte).
- **Mathe-Ausgabe** in `\boxed{}`, wenn per Direktive angefordert.
- **Nicht wirksame Sampling-Parameter über die API:** `temperature`, `top_p`, `presence_penalty`, `frequency_penalty` lösen keinen Fehler aus, haben aber keine Wirkung; `logprobs`, `top_logprobs` lösen einen Fehler aus. (Die Temperatur-Empfehlung 0.6 gilt für lokale/Open-Weights-Nutzung bzw. Drittanbieter-Inferenz.)

## Migrations-Hinweise
- **WEG von DeepSeek-R1 (zu Nicht-Reasoning-/Instruct-Modellen):**
  - System-Prompt wieder einführen: Bei Zielmodellen mit System-Rolle Anweisungen aus dem User-Prompt in einen System-Prompt heben.
  - Few-shot reaktivieren: Bei vielen Instruct-Modellen helfen Beispiele wieder.
  - Thinking-Spezifika entfernen: `<think>\n`-Erzwingung, `\boxed{}`-Direktive und das Parsen von `reasoning_content` entfernen bzw. anpassen.
  - Temperatur neu wählen: Das enge Band 0.6 ist R1-spezifisch; Zielmodell nach dessen eigenen Defaults konfigurieren.
- **ZU DeepSeek-R1 (von Instruct-/Chat-Modellen):**
  - System-Prompt auflösen: Inhalte des System-Prompts in den User-Prompt verschieben (R1-Original unterstützt keinen System-Prompt).
  - Few-shot entfernen: Beispielblöcke streichen, stattdessen Aufgabe + Ausgabeformat direkt (zero-shot) beschreiben.
  - Temperatur auf 0.5–0.7 (0.6) setzen, top_p ~0.95.
  - Output mit `<think>\n` beginnen lassen; bei Mathe `\boxed{}`-Direktive ergänzen.
  - Mehrrunden-Handling anpassen: `reasoning_content` vor dem nächsten API-Call entfernen (sonst 400); CoT der Vorrunde nicht in den Kontext zurückspielen.
  - Function Calling / FIM nicht nutzen; falls genutzt, durch Prompt-Formatierung ersetzen.

## Quellen
- https://huggingface.co/deepseek-ai/DeepSeek-R1 — Offizielle Modelkarte: Usage Recommendations (kein System-Prompt, Temperatur 0.5–0.7/0.6, `<think>\n`-Erzwingung, leerer-Think-Block-Hinweis, `\boxed{}`-Direktive), Kontextlänge 128K.
- https://github.com/deepseek-ai/DeepSeek-R1/blob/main/README.md — Identischer Usage-Recommendations-Abschnitt im offiziellen Repo.
- https://arxiv.org/html/2501.12948v1 — DeepSeek-R1-Paper (§5): „it is sensitive to prompts", „Few-shot prompting consistently degrades its performance", zero-shot-Empfehlung; Evaluations-Setup: `temperature = 0.6`, `top_p = 0.95`.
- https://api-docs.deepseek.com/guides/reasoning_model — Offizielle API-Doku zum `deepseek-reasoner`: `reasoning_content` vs. `content`, Mehrrunden-Verhalten, nicht wirksame/fehlerauslösende Parameter, `max_tokens` inkl. CoT (Default 32K, max 64K), kein Function Calling/FIM.
- https://api-docs.deepseek.com/quick_start/pricing — Mapping/Deprecation: `deepseek-reasoner` wird am 2026/07/24 deprecated und entspricht dem Thinking-Mode von `deepseek-v4-flash`.
