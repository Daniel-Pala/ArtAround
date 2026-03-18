# ArtAround API

Base URL: `http://localhost:3000`

---

## Auth

**Registrazione**
```
POST /api/auth/register
{ "username": "autore1", "password": "12345678", "ruolo": "autore" }
```

**Login**
```
POST /api/auth/login
{ "username": "autore1", "password": "12345678" }
→ risposta: { userId, username, ruolo }
```

---

## Musei

```
GET    /api/musei       → lista tutti i musei
POST   /api/musei       → crea museo { nome, citta, configFile }
DELETE /api/musei/:id   → elimina museo
```

---

## Item

```
GET    /api/items               → lista tutti gli item
GET    /api/items?museoId=xxx   → filtra per museo
GET    /api/items/:id           → un item specifico
POST   /api/items               → crea item
PUT    /api/items/:id           → modifica item
DELETE /api/items/:id           → elimina item
```

**Body POST item:**
```json
{
  "operaId": "Q126599960",
  "museoId": "id-museo",
  "titolo": "Nome opera",
  "testi": [
    { "durata": "3s", "livello": "medio", "testo": "..." },
    { "durata": "15s", "livello": "medio", "testo": "..." }
  ],
  "autoreId": "id-utente",
  "licenza": "CC-BY",
  "prezzo": 0
}
```

Valori possibili per `durata`: `3s`, `15s`, `1min`, `4min`
Valori possibili per `livello`: `infantile`, `elementare`, `medio`, `specialistico`

---

## Visite

```
GET    /api/visite              → lista tutte le visite
GET    /api/visite?museoId=xxx  → filtra per museo
GET    /api/visite/:id          → una visita con tutti gli item popolati
POST   /api/visite              → crea visita
PUT    /api/visite/:id          → modifica visita
DELETE /api/visite/:id          → elimina visita
```

**Body POST visita:**
```json
{
  "nome": "Visita classica",
  "museoId": "id-museo",
  "autoreId": "id-utente",
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
