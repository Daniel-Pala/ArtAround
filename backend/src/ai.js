// Unico punto in cui il backend parla con la LLM.
// Usiamo la forma /chat/completions di OpenAI perché la espongono quasi tutti i
// fornitori (Gemini compreso, dal suo endpoint compatibile): per cambiare modello o
// fornitore bastano le tre righe AI_* nel .env, senza toccare il codice.
// Node 22 ha già fetch, quindi non serve nessuna libreria.

// Il testo arriva tutto insieme quando il modello ha finito di scriverlo, quindi da fuori
// "sta ancora scrivendo" e "non risponderà mai" sono uguali: l'unico modo di distinguerli
// è sapere quanto ci mette di solito. Chi chiama passa quei secondi, e se scadono si
// rinuncia e il Player mostra subito l'errore invece di girare a vuoto.
// Il 503 è il piano gratuito che dice "troppa gente in questo momento": spesso al secondo
// colpo passa, quindi finché resta tempo riprovo.
async function chiedi(messaggi, secondi) {
  const scadenza = Date.now() + secondi * 1000

  while (true) {
    let risposta
    try {
      risposta = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL,
          messages: messaggi,
          // i modelli recenti "ragionano" prima di rispondere, e quel ragionamento si paga
          // come il testo: qui non serve, la risposta viene uguale e costa la metà
          reasoning_effort: 'low'
        }),
        signal: AbortSignal.timeout(scadenza - Date.now())
      })
    } catch (err) {
      if (err.name === 'TimeoutError') throw new Error(`la LLM non ha risposto entro ${secondi} secondi`)
      throw err
    }

    if (risposta.status === 503 && scadenza - Date.now() > 2000) {
      await new Promise(r => setTimeout(r, 500))
      continue
    }
    if (!risposta.ok) {
      // il testo che manda il fornitore va riportato per intero: è lì dentro che
      // scrive quale modello usare quando quello nel .env non esiste più
      throw new Error(`la LLM ha risposto ${risposta.status}: ${await risposta.text()}`)
    }

    const dati = await risposta.json()
    return dati.choices[0].message.content.trim()
  }
}

module.exports = { chiedi }
