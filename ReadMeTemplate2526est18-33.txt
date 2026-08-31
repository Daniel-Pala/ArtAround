# Insegnamento di Tecnologie Web
# CdS In Informatica   
# (A.A. 2025-26)

# Progetto ArtAround 18-33  
 
# READ ME DEL PROGETTO ARTAROUND
_una copia IDENTICA di questo file deve trovarsi nella directory del progetto_

## Nome del gruppo: 
[Inserire nome del gruppo qui]

## Membri del gruppo 

* Nome e cognome: Mattia Monaco, matricola: 0001181478, mail: mattia.monaco3@studio.unibo.it
* Nome e cognome: [Nome e Cognome Daniel], matricola: [Matricola Daniel], mail: [Mail Istituzionale Daniel]
* LLM (nome e versione e licenza): Gemini 1.5 Pro (Google) - Licenza Proprietaria

_Il primo membro della lista verrà considerato come punto di contatto primario. Sarà la persona 
incaricata di spedire mail (sempre e solo dall'indirizzo studio.unibo.it) e tenere contatti con i docenti. Ogni mail deve sempre includere tutti i componenti del gruppo in cc, e deve essere indirizzata a tutti i docenti del corso:_ 

* fabio.vitali@unibo.it
* andrea.schimmenti2@unibo.it
* gianmarco.spinaci2@unibo.it
* remo.grillo@unibo.it

## Tipo progetto
18-33

## Data di disponibilità delle applicazioni
[Inserire data esatta, es: 10 Settembre 2026]

## Locazione del progetto:

* URI del marketplace: [Inserire URI di deploy se presente, o localhost]
* URI del navigator: [Inserire URI di deploy se presente, o localhost]
* Altri URI rilevanti: [Inserire URI della repository GitHub]

## Organizzazione dei sorgenti
* `html/source/server`: Applicazione server-side, contiene i controller per l'LLM, logica di tracciamento e gestione database.
* `html/source/marketplace`: Applicazione client React dedicata all'acquisto e gestione delle visite.
* `html/source/navigator`: Applicazione client React dedicata al Player della visita e alla mappa interattiva.
  
## Tecnologie utilizzate

#### Server-side
* Linguaggio: JavaScript / Node.js
* Framework: Express
* Database: MongoDB
* Altro: [Daniel può aggiungere librerie per chiamate LLM, es: openai/gemini sdk se usati lato server]

#### Applicazione marketplace
* Linguaggio: JavaScript / JSX
* Framework: React
* Pacchetti: React Router

#### Applicazione navigator
* Linguaggio: JavaScript / JSX
* Framework: React
* API Native: Web Speech API (sintesi vocale e riconoscimento comandi)

## Contributo individuale
#### Mattia Monaco: 
Gestione delle funzionalità del Navigator (estensione 18-24): rendering dinamico della mappa SVG, interfacciamento dei comandi vocali con il sistema di navigazione e gestione del fallback a due livelli (riconoscimento locale hardcoded e rete di sicurezza tramite classificazione semantica LLM).

#### [Nome e Cognome Daniel]: 
[Nota per Daniel: Puoi incollare qui il recap dei tuoi commit recenti, come la gestione dei percorsi su misura nella Dashboard, la UI/UX del Marketplace, la generazione e traduzione dei testi mancanti tramite server LLM e il blocco di sincronizzazione live per l'estensione 18-27.]

#### LLM: 
Supporto generale al debug, refactoring dei componenti di navigazione React, validazione del flusso logico per i controlli condizionali del text-to-speech e assistenza per la classificazione dei comandi vocali non standard.