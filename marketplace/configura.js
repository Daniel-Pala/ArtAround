// =============================================================================
// configura.js — configuratore di visite per autori
// Permette di selezionare items e creare/modificare percorsi
// =============================================================================

let itemsDisponibili = [];
let itemsSelezionati = [];
let museoIdAttuale = null;
let visitaIdAttuale = null; // Per modifiche di visite esistenti

// API_URL è già dichiarata in sessione.js

richiediLogin();

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    museoIdAttuale = urlParams.get('id');
    visitaIdAttuale = urlParams.get('visitaId'); // Se presente, siamo in modalità modifica

    if (!museoIdAttuale) {
        window.location.href = 'index.html';
        return;
    }

    // Gestione visibilità in base al ruolo
    const utente = getUtenteLoggato();
    if (utente.ruolo === 'autore') {
        document.getElementById('saveSection').style.display = 'block';
    } else {
        document.getElementById('readOnlySection').style.display = 'block';
    }

    const titoloElement = document.getElementById('titoloMuseo');
    const infoElement = document.getElementById('infoMuseo');

    try {
        const museoResponse = await fetch(`${API_URL}/musei/${museoIdAttuale}`);
        if (museoResponse.ok) {
            const museo = await museoResponse.json();
            titoloElement.innerText = museo.nome;
        }

        const itemsResponse = await fetch(`${API_URL}/items?museoId=${museoIdAttuale}`);
        if (itemsResponse.ok) {
            itemsDisponibili = await itemsResponse.json();
            renderItemsDisponibili();
        }

        // Se siamo in modalità modifica, carica la visita esistente
        if (visitaIdAttuale) {
            await caricaVisitaEsistente();
        }
    } catch (error) {
        console.error("Errore:", error);
        titoloElement.innerText = "Errore di connessione";
        infoElement.innerText = "Controlla che il server sia attivo (npm start).";
    }
});

// --- CARICAMENTO VISITA ESISTENTE (MODIFICA) --------------------------------

async function caricaVisitaEsistente() {
    try {
        const response = await fetch(`${API_URL}/visite/${visitaIdAttuale}`);
        if (!response.ok) return;

        const visita = await response.json();
        
        // Popola il nome della visita
        document.getElementById('nomeVisita').value = visita.nome;
        
        // Popola le informazioni logistiche se presenti
        const infoLogisticheField = document.getElementById('infoLogistiche');
        if (infoLogisticheField) {
            infoLogisticheField.value = visita.infoLogistiche || '';
        }

        // Popola il prezzo
        const prezzoField = document.getElementById('prezzoVisita');
        if (prezzoField) {
            prezzoField.value = visita.prezzo || 0;
        }

        // Popola lo stato di pubblicazione
        const pubblicaCheckbox = document.getElementById('pubblicaVisita');
        if (pubblicaCheckbox) {
            pubblicaCheckbox.checked = visita.pubblica || false;
        }

        // Carica le tappe del percorso: dell'item mi servono id e titolo, il resto
        // (indicazione e opzionale) sta sulla tappa, non sull'item
        itemsSelezionati = visita.items.map(tappa => ({
            _id: tappa.itemId._id,
            titolo: tappa.itemId.titolo,
            autoreId: tappa.itemId.autoreId,
            // le visite salvate prima di questa funzione non hanno il campo:
            // senza il fallback in pagina comparirebbe la scritta "undefined"
            indicazioneLogistica: tappa.indicazioneLogistica || '',
            opzionale: tappa.opzionale
        }));

        renderItemsDisponibili();
        renderCarrello();
    } catch (error) {
        console.error("Errore nel caricamento della visita:", error);
    }
}

// --- RICERCA E RENDERING OPERE -----------------------------------------------

function renderItemsDisponibili() {
    const containerItems = document.getElementById('listaItems');
    const termineRicerca = document.getElementById('cercaItem').value.toLowerCase();

    const itemsFiltrati = itemsDisponibili.filter(item => {
        const titolo = item.titolo ? item.titolo.toLowerCase() : '';
        return titolo.includes(termineRicerca);
    });

    if (itemsDisponibili.length === 0) {
        containerItems.innerHTML = `<div class="text-muted py-3">Nessun item presente in questo museo per ora.</div>`;
        return;
    }

    if (itemsFiltrati.length === 0) {
        containerItems.innerHTML = `<div class="text-muted py-3">Nessun item corrisponde a "${termineRicerca}".</div>`;
        return;
    }

    let htmlLista = '<ul class="list-group">';

    itemsFiltrati.forEach(item => {
        const nomeAutore = item.autoreId ? item.autoreId.username : 'Autore sconosciuto';
        const giaSelezionata = itemsSelezionati.some(sel => sel._id === item._id);

        const bottoneHtml = giaSelezionata
            ? `<button class="btn btn-sm btn-secondary" disabled><i class="bi bi-check-lg me-1"></i>Aggiunto</button>`
            : `<button class="btn btn-sm btn-outline-success" onclick="aggiungiAVisita('${item._id}')"><i class="bi bi-plus-lg me-1"></i>Aggiungi</button>`;

        htmlLista += `
            <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                <div>
                    <h6 class="mb-0">${item.titolo || 'Item senza titolo'}</h6>
                    <small class="text-muted">di ${nomeAutore}</small>
                </div>
                ${bottoneHtml}
            </li>
        `;
    });

    htmlLista += '</ul>';
    containerItems.innerHTML = htmlLista;
}

function aggiungiAVisita(itemId) {
    const item = itemsDisponibili.find(o => o._id === itemId);
    if (item && !itemsSelezionati.some(o => o._id === itemId)) {
        itemsSelezionati.push({ ...item, indicazioneLogistica: '', opzionale: false });
        renderItemsDisponibili();
        renderCarrello();
    }
}

function rimuoviDaVisita(itemId) {
    itemsSelezionati = itemsSelezionati.filter(o => o._id !== itemId);
    renderItemsDisponibili();
    renderCarrello();
}

// --- RENDERING CARRELLO -------------------------------------------------------

function renderCarrello() {
    const carrelloContainer = document.getElementById('carrelloVisita');
    const btnSalva = document.getElementById('btnSalvaVisita');

    if (itemsSelezionati.length === 0) {
        carrelloContainer.innerHTML = '<li class="list-group-item text-muted text-center">Nessun item selezionato.</li>';
        btnSalva.disabled = true;
        return;
    }

    btnSalva.disabled = false;
    let htmlCarrello = '';

    itemsSelezionati.forEach((item, index) => {
        htmlCarrello += `
            <li class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-truncate" style="max-width: 200px;">
                        <small><span class="fw-semibold">${index + 1}.</span> ${item.titolo}</small>
                    </span>
                    <button class="btn btn-sm btn-link text-danger p-0 text-decoration-none" onclick="rimuoviDaVisita('${item._id}')" aria-label="Rimuovi item">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <input type="text" class="form-control form-control-sm mt-2"
                       placeholder="Come ci si arriva…"
                       value="${escapeAttr(item.indicazioneLogistica)}"
                       oninput="aggiornaIndicazione(${index}, this.value)">
                <div class="form-check mt-1">
                    <input class="form-check-input" type="checkbox" id="opzionale${index}"
                           ${item.opzionale ? 'checked' : ''}
                           onchange="aggiornaOpzionale(${index}, this.checked)">
                    <label class="form-check-label small text-muted" for="opzionale${index}">
                        Opzionale (se rimane tempo)
                    </label>
                </div>
            </li>
        `;
    });

    carrelloContainer.innerHTML = htmlCarrello;
}

// le virgolette dentro il testo romperebbero l'attributo value
function escapeAttr(testo) {
    return String(testo).replace(/"/g, '&quot;');
}

// NON ridisegno il carrello: perderei il focus del campo a ogni lettera
function aggiornaIndicazione(indice, valore) {
    itemsSelezionati[indice].indicazioneLogistica = valore;
}

function aggiornaOpzionale(indice, valore) {
    itemsSelezionati[indice].opzionale = valore;
}

// --- SALVATAGGIO VISITA -------------------------------------------------------

async function salvaVisita() {
    if (itemsSelezionati.length === 0) return;

    const nomeVisita = document.getElementById('nomeVisita').value.trim();
    if (!nomeVisita) {
        alert("Per favore, inserisci un nome per questa visita.");
        return;
    }

    // autoreId lo mette il backend dal token, non lo mandiamo dal client
    const infoLogistiche = document.getElementById('infoLogistiche')?.value || '';
    const prezzo = parseFloat(document.getElementById('prezzoVisita')?.value) || 0;
    const pubblica = document.getElementById('pubblicaVisita')?.checked || false;

    const payload = {
        nome: nomeVisita,
        museoId: museoIdAttuale,
        items: itemsSelezionati.map((item, index) => ({
            itemId: item._id,
            ordine: index + 1,
            indicazioneLogistica: item.indicazioneLogistica,
            opzionale: item.opzionale
        })),
        infoLogistiche,
        prezzo,
        pubblica
    };

    try {
        let response;
        let method;
        let endpoint;

        if (visitaIdAttuale) {
            // Modalità modifica
            method = 'PUT';
            endpoint = `${API_URL}/visite/${visitaIdAttuale}`;
        } else {
            // Modalità creazione
            method = 'POST';
            endpoint = `${API_URL}/visite`;
        }

        response = await fetchAuth(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            const azione = visitaIdAttuale ? 'aggiornata' : 'salvata';
            alert(`Visita "${data.nome}" ${azione} con successo!`);
            
            // Reset e torna alla dashboard
            itemsSelezionati = [];
            document.getElementById('nomeVisita').value = '';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } else {
            const errorData = await response.json();
            alert("Errore durante il salvataggio: " + (errorData.message || "Errore generico"));
        }
    } catch (error) {
        console.error("Errore di rete:", error);
        alert("Errore di connessione al server.");
    }
}
