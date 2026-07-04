# DESIGN.md — ArtAround

Direzione visiva unica per i due moduli del progetto (marketplace vanilla + Bootstrap,
navigator React + Bootstrap). Questi token e queste regole valgono per entrambi:
i due moduli devono sembrare lo stesso prodotto anche se la tecnologia è diversa.

La direzione è GIÀ DECISA. Raffinala, non reinventarla. Se ti accorgi di star
proponendo un'altra estetica (altri font, altri colori, dark mode), fermati:
la linea è questa.

## Concept

Galleria d'arte contemporanea / catalogo di mostra. Carta e inchiostro con un
accento vermiglio. Sobrio, editoriale, molta aria. Le opere e i dati sono i
protagonisti; l'interfaccia sta indietro e lascia spazio.

## Palette (valori esatti, non cambiarli)

- Sfondo (carta):        #F4F1E9
- Testo (inchiostro):     #1B1917
- Bordi:                  #E4DDD0
- Accento (vermiglio):    #C63A24   → azione principale, link, dettagli
- Verde smorzato:         #4C6B4F   → azioni "aggiungi/conferma"
- Mattone (danger):       #9E2B20   → elimina/errori
- Superficie righe/box:   #EEE8DC

Nessun'altra famiglia di colore. Un solo accento saturo (il vermiglio), usato
con parsimonia. Niente blu, niente viola, niente gradienti.

## Tipografia

- Titoli (h1–h6, titoli card, brand): **Fraunces** (serif con carattere), Georgia fallback
- Testo e UI:                          **Work Sans**, system-ui fallback
- Etichette/label piccole: maiuscoletto, letter-spacing leggero (.05em)

Il serif nei titoli è parte dell'identità. Non sostituirlo con un sans.

## Forme e superfici

- Angoli poco arrotondati: radius base .25rem, mai pill/molto tondo
- **Bordi sottili 1px (colore --bs-border-color) al posto delle ombre**
- Niente box-shadow morbide diffuse (stilema riconoscibile): superfici piatte,
  separate da bordi e da spazio, non da ombre
- Focus non azzurro: bordo caldo + alone vermiglio tenue

## Composizione (la parte da migliorare davvero)

- **Proporziona i contenitori ai dati.** Un numero piccolo NON va in una card
  gigante mezza vuota. Se il dato è "2 musei", il contenitore è discreto, non
  una stat-card da dashboard SaaS con numerone.
- Gerarchia editoriale: titoli serif generosi, corpo tranquillo, tanto spazio
  bianco. Pensa a una pagina di catalogo, non a un pannello di controllo.
- Griglia pulita, allineamenti coerenti. Elementi di peso diverso devono
  dialogare (evita il bottone enorme contrapposto alla card enorme).
- Le immagini delle opere, quando ci sono, sono protagoniste e grandi;
  il resto sobrio attorno.
- Label comprensibili accanto ai dati formalizzati (es. non mostrare un ID
  grezzo senza etichetta).

## Vietato (stilemi-spia da evitare)

- Dark mode
- Gradienti, glow, ombre luminose
- Ombre morbide sotto ogni card
- Bordi molto arrotondati / pill
- **Emoji come icone** (es. 🏛️): usa vere icone (Bootstrap Icons già disponibili)
- Font di sistema o Inter come display
- Card-metrica gigante con numerone per dati minuscoli
- Hero centrata generica con sottotitolo grigio

## Note tecniche per modulo

- **Marketplace** (vanilla + Bootstrap): personalizza via variabili `--bs-*`
  come già fatto in stile.css. In Bootstrap 5.3 i bottoni hanno variabili
  proprie (`--bs-btn-*`), vanno ridefiniti per colore, non basta `--bs-primary`.
- **Navigator** (React + Bootstrap): Bootstrap SOLO come classi CSS. Il
  comportamento (modal, dropdown) lo gestisce React con lo stato, non il JS
  di Bootstrap (`new bootstrap.Modal()` è vietato qui). Riusa gli stessi font
  e colori di questo file per coerenza col marketplace.