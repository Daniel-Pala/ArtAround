# ArtAround

Progetto di Tecnologie Web, A.A. 2025/26, Università di Bologna.

Un'audioguida per musei in due applicazioni. Il **marketplace** è dove i curatori scrivono i
contenuti sulle opere e compongono le visite, e dove i visitatori le comprano. Il **navigator** è
l'applicazione che si usa dentro al museo: legge o pronuncia i testi al livello e alla durata
scelti, risponde ai comandi vocali, mostra la mappa e riconosce i codici QR appesi alle opere.

## Com'è fatto

```
backend/       Node.js, Express, MongoDB e Socket.io: le API, la visita guidata in tempo
               reale, e la pubblicazione dei file delle due applicazioni
marketplace/   HTML, CSS e JavaScript senza framework, una pagina per funzione
navigator/     React e Vite
```

In produzione un solo processo Express serve tutto: le API sotto `/api`, il marketplace alla
radice e il navigator compilato sotto `/navigator`.

## Avvio in locale

Serve Node.js 22 e un database MongoDB.

**Backend.** Dentro `backend/` copia `.env.example` in `.env` e riempilo: la stringa di
collegamento a MongoDB, una stringa qualsiasi come `JWT_SECRET`, e una chiave di un fornitore
compatibile con l'API di OpenAI per le tre righe `AI_*` (quella preimpostata è Google Gemini).

```
cd backend
npm install
node seed.js        # cancella il database e lo riempie con i dati di prova
npm run dev         # porta 3000
```

Il marketplace è su `http://localhost:3000/login.html`.

**Navigator.** In un secondo terminale:

```
cd navigator
npm install
npm run dev         # porta 5173, gira le chiamate /api al backend sulla 3000
```

Il navigator è su `http://localhost:5173`. Per i comandi vocali serve Chrome o Safari: Firefox
non ha il riconoscimento vocale.

## Account di prova

Dopo `node seed.js`, tutti con password `12345678`:

| utente | ruolo |
|---|---|
| `autore1`, `autore2` | curatori: scrivono item e compongono visite |
| `visitatore1` | ha già comprato le due visite pubbliche |
| `visitatore2` | non ha ancora comprato niente |

## Documentazione

Le rotte dell'API sono descritte in [`API.md`](API.md).
