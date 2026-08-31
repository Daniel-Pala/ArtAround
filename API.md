# ArtAround — le rotte

Tutte sotto `/api`, servite dallo stesso processo che serve le due applicazioni.

Legenda della colonna accesso:
- **libera** — nessun token
- **loggato** — serve `Authorization: Bearer <token>`, qualsiasi ruolo
- **autore** — serve il token e il ruolo `autore`
- **proprietario** — serve il token e l'`autoreId` della risorsa deve essere l'utente del token

Senza token → `401`. Con token ma ruolo sbagliato → `403`. Risorsa di un altro → `403`.

---

## Autenticazione

| | rotta | accesso |
|---|---|---|
| POST | `/api/auth/register` | libera |
| POST | `/api/auth/login` | libera |

```
POST /api/auth/register   { username, password, ruolo }   → 201, non ritorna il token
POST /api/auth/login      { username, password }          → { userId, username, ruolo, token }
```
Il token è firmato con `JWT_SECRET` e non scade. Payload: `{ userId, ruolo, username }`.

---

## Musei

Non hanno un proprietario: qualsiasi autore può modificarli.

| | rotta | accesso |
|---|---|---|
| GET | `/api/musei` | libera |
| GET | `/api/musei/:id` | libera |
| POST | `/api/musei` | autore |
| PUT | `/api/musei/:id` | autore |
| DELETE | `/api/musei/:id` | autore |

```json
{ "nome": "Pinacoteca Nazionale di Bologna", "citta": "Bologna", "configFile": "pinacoteca-bologna.json" }
```
`configFile` è il file dentro `navigator/public/config/` da cui il Player prende mappa,
posizioni delle opere e informazioni logistiche.

---

## Item

| | rotta | accesso |
|---|---|---|
| GET | `/api/items` | libera |
| GET | `/api/items/:id` | libera |
| GET | `/api/items/qr/:operaId` | libera |
| POST | `/api/items` | autore |
| PUT | `/api/items/:id` | proprietario |
| DELETE | `/api/items/:id` | proprietario |

Filtri sull'elenco: `?museoId=`, `?livello=`, `?operaId=` (il codice Wikidata dentro al QR).
`GET /api/items/qr/:operaId` restituisce direttamente il **PNG** del codice QR.
La DELETE toglie l'item anche dalle visite che lo contengono.

```json
{
  "operaId": "Q126599960",
  "tipo": "opera | approfondimento",
  "museoId": "…",
  "titolo": "…",
  "descrizione": "didascalia da cartellino",
  "autoreOpera": "…",
  "stile": "…",
  "immagine": "https://…",
  "licenza": "CC-BY",
  "prezzo": 0,
  "testi": [ { "durata": "15s", "livello": "medio", "lingua": "it", "testo": "…", "generatoDa": "" } ]
}
```
`durata`: `3s`, `15s`, `1min`, `4min` · `livello`: `infantile`, `elementare`, `medio`,
`specialistico` · `lingua`: `it`, `en`, `fr`, `es`, `de` (assente = italiano) ·
`generatoDa`: il nome del modello, vuoto se l'ha scritto una persona.
`autoreId` non va mandato: lo mette il server dal token.

---

## Visite

| | rotta | accesso |
|---|---|---|
| GET | `/api/visite` | libera |
| GET | `/api/visite/mie-visite` | loggato |
| GET | `/api/visite/:id` | loggato |
| POST | `/api/visite` | autore |
| POST | `/api/visite/:id/acquista` | loggato |
| PUT | `/api/visite/:id` | proprietario |
| DELETE | `/api/visite/:id` | proprietario |

Filtri sull'elenco: `?museoId=`, `?pubblica=true`. L'elenco non mostra mai i percorsi su misura.

`GET /api/visite/mie-visite` — le visite che l'utente può avviare: quelle acquistate più quelle
scritte da lui. Se il token è valido ma l'utente non esiste più → `401`, non `404`.

`GET /api/visite/:id` — popola autore, museo e le tappe. **Gli item completi arrivano solo a chi
ha acquistato la visita o ne è l'autore**, agli altri arriva il solo titolo di ogni tappa.

`POST /api/visite/:id/acquista` — aggiunge l'id a `utente.acquisti`, nessun pagamento.
Se la visita è già sbloccata → `400`.

```json
{
  "nome": "Capolavori della Pinacoteca",
  "museoId": "…",
  "items": [ { "itemId": "…", "ordine": 1, "opzionale": false, "indicazioneLogistica": "Sala 1, parete sinistra" } ],
  "infoLogistiche": "Ingresso da via Belle Arti 56",
  "pubblica": true,
  "prezzo": 0,
  "quiz": [ { "quesito": "…", "opzioni": ["…"], "rispostaCorretta": 0 } ]
}
```

---

## Intelligenza artificiale

Tutte loggate. Rispondono `502` se la chiamata al modello fallisce.

| | rotta | cosa fa |
|---|---|---|
| POST | `/api/ai/testo` | scrive la versione mancante di un testo e la salva nell'item |
| POST | `/api/ai/comando` | riconduce una frase detta a parole proprie a uno dei comandi |
| POST | `/api/ai/visita` | compone un percorso su misura |
| GET | `/api/ai/interessi` | gli stili delle opere che l'utente può già leggere |

```
POST /api/ai/testo    { itemId, livello, durata, lingua }   → l'item aggiornato
POST /api/ai/comando  { frase, comandi: [nomi] }            → { comando: "Prossimo" | null }
POST /api/ai/visita   { minuti, compagnia, interessi[] }    → 201, la visita creata
```

`/api/ai/testo` vuole gli stessi permessi del dettaglio della visita: l'item deve essere in una
visita acquistata, oppure essere dell'utente. Se la combinazione esiste già la ritorna senza
chiamare il modello.

`/api/ai/comando` risponde solo con uno dei nomi che ha ricevuto, mai con testo libero.

`/api/ai/visita` sceglie fra le sole opere che l'utente può già leggere, `minuti` vale
`30`, `60` o `120`, `compagnia` vale `solo`, `coppia`, `bambini` o `gruppo`.

---

## Voti della lezione sincrona

```
POST /api/visite/:visitaId/voti   { codiceSessione, risultati }   → salva lo storico sulla visita
```

---

## Socket.io (lezione sincrona)

Stessa origine dell'API. Le sessioni stanno in una `Map` in RAM e si perdono al riavvio.

**Dal client:**
```
docente:crea           { visitaId, codiceMnemonico }
docente:vaiA           { codice, indice }
docente:forzaAudio     { codice }
docente:avviaQuiz      { codice, domande }
docente:chiudi         { codice }
studente:entra         { codice, nome }
studente:cambiaLivello { codice, livello, durata }
studente:invioQuiz     { codice, risposte, totaleDomande, corrette }
```

**Dal server:**
```
sessione:creata        { codice }                 al solo docente
stato:item             { indice, visitaId }       a tutta la stanza
sessione:studenti      [ { nome, livello, durata, voto, online } ]
docente:nuovaAttivita  { nome, tipo, dettaglio, orario }
docente:risultatiQuiz  [ { nome, punteggio, totale, voto } ]
quiz:inizio            { quiz }
studente:playAudio     —
sessione:fine          —
errore                 { messaggio }
```

---

## Utenti del seed

`autore1`, `autore2`, `visitatore1`, `visitatore2`, tutti con password `12345678`.
`visitatore1` ha già acquistato le due visite pubbliche, `visitatore2` no.
