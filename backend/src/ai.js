// Unico punto in cui il backend parla con la LLM.
// Usiamo la forma /chat/completions di OpenAI (come impostato originariamente).
// Node 22 ha già fetch, quindi non serve nessuna libreria.

async function chiedi(messaggi) {
  // Aggiungiamo solo un controller per il Timeout per evitare l'errore 502 da crash
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); 

  try {
    const risposta = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        messages: messaggi,
        // Daniel lo aveva impostato per risparmiare token sul 3.6-flash
        reasoning_effort: 'low'
      }),
      signal: controller.signal 
    });

    clearTimeout(timeoutId); 

    if (!risposta.ok) {
      // il testo che manda il fornitore va riportato per intero
      throw new Error(`la LLM ha risposto ${risposta.status}: ${await risposta.text()}`);
    }

    const dati = await risposta.json();
    return dati.choices[0].message.content.trim();
    
  } catch (errore) {
    clearTimeout(timeoutId);
    if (errore.name === 'AbortError') {
      throw new Error("Timeout: il modello LLM ha impiegato troppo tempo per rispondere.");
    }
    throw errore;
  }
}

module.exports = { chiedi }