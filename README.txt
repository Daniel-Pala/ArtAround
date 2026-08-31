# Insegnamento di Tecnologie Web
# CdS In Informatica   
# (A.A. 2025-26)

# Progetto ArtAround 18-33  
 
# READ ME DEL PROGETTO ARTAROUND
_una copia IDENTICA di questo file deve trovarsi nella directory del progetto_

## Nome del gruppo: 
Typescrpt

## Membri del gruppo 

* Nome e cognome: Mattia Monaco, matricola: 0001181478, mail: mattia.monaco3@studio.unibo.it
* Nome e cognome: Daniel Palamarciuc, matricola: 0001173020, mail: danielpalamarciuc@studio.unibo.it
* LLM (nome e versione e licenza): Claude Opus 5, licenza proprietaria/commerciale. Google Gemini 3.1 Pro, licenza proprietaria.

_Il primo membro della lista verrà considerato come punto di contatto primario. Sarà la persona 
incaricata di spedire mail (sempre e solo dall'indirizzo studio.unibo.it) e tenere contatti con i docenti. Ogni mail deve sempre includere tutti i componenti del gruppo in cc, e deve essere indirizzata a tutti i docenti del corso:_ 

* fabio.vitali@unibo.it
* andrea.schimmenti2@unibo.it
* gianmarco.spinaci2@unibo.it
* remo.grillo@unibo.it

## Tipo progetto
18-33

## Data di disponibilità delle applicazioni
8 Settembre 2026

## Locazione del progetto:

-> URI del marketplace: https://site252634.tw.cs.unibo.it/
-> URI del navigator: https://site252634.tw.cs.unibo.it/navigator/
-> Altri URI rilevanti:

## Organizzazione dei sorgenti
I sorgenti stanno in html/source, in tre directory, una per applicazione.
Sono esclusi node_modules e il file .env, che contiene le credenziali.

-> backend, l'applicazione server-side.
   src/index.js, avvio del server HTTP, montaggio delle rotte, server Socket.io della visita
   sincrona e pubblicazione dei file delle due applicazioni client.
   src/models, gli schemi Mongoose delle quattro entita', ovvero Utente, Museo, Item, Visita.
   src/routes, una rotta per entita' (autenticazione, musei, items, visite) piu' ai.js, che
   raccoglie le chiamate al modello linguistico usate dall'estensione.
   src/ai.js, l'unico punto del progetto che parla con l'API del modello.
   src/middleware/autorizzazione.js, verifica del token e del ruolo dell'utente.
   seed.js, popolamento del database con i dati di presentazione.

-> marketplace, l'applicazione dell'editor e del negozio, una pagina per funzione con il suo
   script: index.html e app.js per i musei dell'autore e la vetrina del visitatore, items.html
   e items.js per i contenuti di un museo, configura.html e configura.js per la composizione di
   una visita e del quiz, qr.html e qr.js per il foglio dei codici QR da stampare, login.html.
   sessione.js tiene la sessione dell'utente e le chiamate autenticate ed e' condiviso da tutte
   le pagine, stile.css e' il foglio di stile comune.

-> navigator, l'applicazione della visita.
   src/pages, le schermate: Player.jsx, Dashboard.jsx, Login.jsx, Docente.jsx e Studente.jsx.
   src/components, src/auth.js e src/traduzioni.js, barra di navigazione, sessione ed etichette
   dell'interfaccia nelle lingue offerte.
   public/config, il file di configurazione del museo con la mappa in formato SVG, le posizioni
   delle opere e le informazioni logistiche.
  
## Tecnologie utilizzate

#### Server-side
-> Linguaggi: JavaScript (Node.js 22)
-> Framework: Express 5
-> Database: MongoDB, con Mongoose 9
-> Pacchetti npm: socket.io 4 (visita sincrona), bcrypt 6 (cifratura delle password),
  jsonwebtoken 9 (autenticazione), qrcode 1.5 (generazione dei codici QR), cors, dotenv
-> Modello LLM utilizzato per l'estensione: Google Gemini 3.5 Flash Lite

#### Applicazione marketplace
-> Linguaggi: JavaScript, HTML, CSS
-> Grafica: Bootstrap 5.3 e Bootstrap Icons

#### Applicazione navigator
-> Linguaggi: JavaScript / JSX
-> Framework: React 19, compilato con Vite 8
-> Pacchetti npm: react-router-dom 7, socket.io-client 4 , qr-scanner 1.4
-> Grafica: Bootstrap 5.3 e Bootstrap Icons
-> API native: Web Speech API (SpeechSynthesis per la lettura ad alta voce, SpeechRecognition per
  i comandi vocali), MediaDevices per la fotocamera

## Contributo individuale
#### Mattia Monaco:
-> Parte server: implementazione del server Socket.io in src/index.js per la gestione in tempo reale della visita sincrona (creazione stanze, ingresso studenti, sincronizzazione dello stato). Aggiornamento degli schemi Mongoose, in particolare il tracciamento dello storico delle sessioni live e la gestione del codiceMnemonico nel modello Visita. Creazione dell'endpoint API per il salvataggio dei voti del quiz nel database.
-> Marketplace: sviluppo di interfacce frontend e gestione della logica di configurazione della visita per il docente, inclusa la serializzazione dei dati del quiz e delle opzioni logistiche.
-> Navigator: sviluppo frontend dell'applicazione e del modulo per le visite scolastiche guidate (Docente.jsx e Studente.jsx). Realizzazione della dashboard dell'insegnante per il controllo dell'avanzamento della classe, forzatura della riproduzione audio sui client, feed delle attività in tempo reale, erogazione del test a risposta multipla e visualizzazione/salvataggio dei risultati finali. Allineamento dello stato di connessione in caso di caduta di rete degli studenti.

#### Daniel Palamarciuc: 
-> Parte server: schemi dei dati, autenticazione con token JWT, CRUD di musei, item e visite
   con controllo di proprieta', generazione dei codici QR, rotte per le chiamate al modello
   linguistico che scrivono i testi mancanti, li traducono, riconducono i comandi vocali detti
   a parole proprie a quelli previsti e compongono le visite su misura a partire dal form,
   script di popolamento del database.
-> Marketplace: pagina dei musei dell'autore, vetrina e acquisto per il visitatore, pagina dei
   contenuti di un museo con creazione e modifica degli item, foglio dei codici QR da stampare,
   impianto grafico condiviso dalle due applicazioni.
-> Navigator: parte del Player della visita, comandi vocali su vocabolario controllato, pannello
   delle informazioni logistiche, mappa del museo con salto diretto alla tappa, lettura del
   codice QR dalla fotocamera, scelta della lingua, Dashboard delle visite dell'utente con il
   form del percorso su misura, file delle traduzioni dell'interfaccia.

#### LLM: 
File di traduzione delle etichette, script di seed, generazione di elementi grafici sotto istruzioni dettagliate e consultazioni per scelte implementative, revisione generale del codice per garantire coerenza stilistica e risolvere incongruenze di nomenclatura, supporto mirato nel debugging e correzione di errori/bug, rotta che disegna il codice QR di un'opera a partire dal suo identificativo e pagina che li dispone in un foglio da stampare, integrazione dell'API del modello linguistico.