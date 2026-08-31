// Unico punto in cui il backend parla con la LLM.
// Usiamo la forma /chat/completions di OpenAI perche' la espongono quasi tutti i
// fornitori (Gemini compreso, dal suo endpoint compatibile): per cambiare modello o
// fornitore bastano le tre righe AI_* nel .env, senza toccare il codice.
// Node 22 ha gia' fetch, quindi non serve nessuna libreria.

async function chiedi(messaggi) {
  const risposta = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL,
      messages: messaggi,
      // i modelli recenti "ragionano" prima di rispondere, e quel ragionamento si paga
      // come il testo: qui non serve, la risposta viene uguale e costa la meta'
      reasoning_effort: 'low'
    })
  })

  if (!risposta.ok) {
    // il testo che manda il fornitore va riportato per intero: e' li' dentro che
    // scrive quale modello usare quando quello nel .env non esiste piu'
    throw new Error(`la LLM ha risposto ${risposta.status}: ${await risposta.text()}`)
  }

  const dati = await risposta.json()
  return dati.choices[0].message.content.trim()
}

module.exports = { chiedi }
