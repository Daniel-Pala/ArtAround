# ArtAround API

Base URL: `http://localhost:3000`

Le rotte protette vogliono l'header `Authorization: Bearer <token>`.
Chi non lo manda prende `401`; chi lo manda ma non è `autore` prende `403`.
Sulle modifiche di item e visite c'è anche il controllo di proprietà: se `autoreId` non
coincide con l'utente del token → `403`.

---

## Auth

**Registrazione** — pubblica. Non restituisce il token: dopo il register bisogna fare login.
```
POST /api/auth/register
{ "username": "autore1", "password": "12345678", "ruolo": "autore" }
→ 201 { "message": "Utente creato con successo" }
```

**Login** — pubblica.
```
POST /api/auth/login
{ "username": "autore1", "password": "12345678" }
→ { userId, username, ruolo, token }
```
Il token è firmato con `JWT_SECRET` e **non ha scadenza**.
Payload: `{ userId, ruolo, username }`.

---

## Musei

Nessun proprietario: qualsiasi `autore` può modificare o eliminare qualsiasi museo.

```
GET    /api/musei       → lista tutti i musei                    (pubblica)
GET    /api/musei/:id   → un museo                               (pubblica)
POST   /api/musei       → crea museo                             (autore)
PUT    /api/musei/:id   → modifica museo                         (autore)
DELETE /api/musei/:id   → elimina museo                          (autore)
```

**Body museo:**
```json
{
  "nome": "Pinacoteca Nazionale di Bologna",
  "citta": "Bologna",
  "configFile": "pinacoteca-bologna.json"
}
```
`configFile` è il nome del file dentro `navigator/public/config/`: il Player lo usa per
caricare mappa, posizioni delle opere e informazioni logistiche del museo.

---

## Item

```
GET    /api/items                 → lista tutti gli item          (pubblica)
GET    /api/items?museoId=xxx     → filtra per museo
GET    /api/items?livello=medio   → filtra per livello dei testi
GET    /api/items/:id             → un item                       (pubblica)
POST   /api/items                 → crea item                     (autore)
PUT    /api/items/:id             → modifica item                 (autore proprietario)
DELETE /api/items/:id             → elimina item                  (autore proprietario)
```

**Body POST item** — `autoreId` NON va mandato, lo mette il server dal token:
```json
{
  "operaId": "Q126599960",
  "museoId": "id-museo",
  "titolo": "Nome opera",
  "descrizione": "…",
  "immagine": "https://…",
  "testi": [
    { "durata": "3s", "livello": "medio", "testo": "..." },
    { "durata": "15s", "livello": "medio", "testo": "..." }
  ],
  "licenza": "CC-BY",
  "prezzo": 0
}
```

Valori possibili per `durata`: `3s`, `15s`, `1min`, `4min`
Valori possibili per `livello`: `infantile`, `elementare`, `medio`, `specialistico`

> Manca ancora il filtro `?operaId=`, che servirà per la lookup da QR code (Estensione 2).

---

## Visite

```
GET    /api/visite              → lista tutte le visite            (pubblica)
GET    /api/visite?museoId=xxx  → filtra per museo
GET    /api/visite/mie-visite   → le visite acquistate dall'utente (loggato)
GET    /api/visite/:id          → una visita con gli item popolati (pubblica)
POST   /api/visite              → crea visita                      (autore)
POST   /api/visite/:id/acquista → sblocca la visita per l'utente   (loggato)
PUT    /api/visite/:id          → modifica visita                  (autore proprietario)
DELETE /api/visite/:id          → elimina visita                   (autore proprietario)
```

> `GET /api/visite` restituisce **anche le visite con `pubblica: false`**. Il filtro non è
> implementato: per ora è il client a dover decidere cosa mostrare (e non lo fa — vedi TODO).

**Body POST visita** — `autoreId` lo mette il server dal token:
```json
{
  "nome": "Visita classica",
  "museoId": "id-museo",
  "items": [
    {
      "itemId": "id-item",
      "ordine": 1,
      "opzionale": false,
      "indicazioneLogistica": "Sala 1, parete sinistra"
    }
  ],
  "infoLogistiche": "Entrata da via Belle Arti 56",
  "pubblica": true,
  "prezzo": 0
}
```

**`GET /api/visite/:id`** popola `autoreId` (solo `username`), `museoId` (`nome`, `configFile`)
e ogni `items.itemId` con l'item completo — è la chiamata che usa il Player del Navigator.

**`POST /api/visite/:id/acquista`** aggiunge l'id della visita a `utente.acquisti[]`.
Non c'è nessun pagamento: è un checkout finto. Se la visita è già stata sbloccata → `400`.
```
→ { "message": "Percorso sbloccato con successo!", "acquisti": [ ...ids ] }
```

---

## Socket.io (Estensione 1 — solo lato server, nessun client lo usa ancora)

Stessa porta dell'API (`3000`). Le sessioni stanno in una `Map` in RAM: si perdono al riavvio.
CORS accetta solo `http://localhost:5173`.

**Eventi che il client manda:**
```
docente:crea         { visitaId }              → crea la stanza, ritorna un codice di 6 caratteri
docente:vaiA         { codice, indice }        → sposta tutta la classe sull'opera N
docente:avviaQuiz    { codice, domande }       → domande ignorate, vedi nota
docente:chiudi       { codice }                → chiude la stanza
studente:entra       { codice, nome }          → entra nella stanza
studente:cambiaLivello { codice, livello, durata }
```

**Eventi che il server emette:**
```
sessione:creata      { codice }                → solo al docente
stato:opera          { indice }                → a tutta la stanza (e al singolo che entra)
sessione:studenti    [ { nome, livello, durata, risposte } ]   → a tutta la stanza
quiz:inizio          —
sessione:fine        —
```

> Il quiz non è implementato: `docente:avviaQuiz` scarta le domande ricevute e nessuna risposta
> viene mai salvata. Manca l'evento con cui lo studente risponde.

---

## Dati nel DB (sviluppo)

**Utenti**
| Username | Password | Ruolo | ID |
|----------|----------|-------|----|
| autore1 | 12345678 | autore | 69ba9713f58ec6058b7866e1 |
| visitatore1 | 12345678 | visitatore | (vedi Atlas) |

**Musei**
| Nome | ID |
|------|----|
| Pinacoteca Nazionale di Bologna | 69ba9857ae602e2be7e0c331 |

**Item**
| Titolo | ID |
|--------|----|
| Ritratto di frate in veste di San Tommaso d'Aquino | 69ba9a141ac08a21e1684f9e |
