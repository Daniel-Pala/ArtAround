// =============================================================================
// configura.js — configuratore di visite per autori
// Permette di selezionare opere e creare/modificare percorsi
// =============================================================================

let opereDisponibili = [];
let opereSelezionate = [];
let museoIdAttuale = null;
let visitaIdAttuale = null; // Per modifiche di visite esistenti

// API_URL è già dichiarata in auth.js

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
            titoloElement.innerText = `Configurazione: ${museo.nome}`;
            infoElement.innerText = `Sede di ${museo.citta || 'N/A'}.`;
        }

        const opereResponse = await fetch(`${API_URL}/items?museoId=${museoIdAttuale}`);
        if (opereResponse.ok) {
            opereDisponibili = await opereResponse.json();
            renderOpereDisponibili();
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

        // Carica le opere selezionate
        opereSelezionate = visita.items.map(item => ({
            _id: item.itemId._id,
            titolo: item.itemId.titolo,
            autoreId: item.itemId.autoreId,
            ordine: item.ordine
        })).sort((a, b) => a.ordine - b.ordine);

        renderOpereDisponibili();
        renderCarrello();
    } catch (error) {
        console.error("Errore nel caricamento della visita:", error);
    }
}

// --- RICERCA E RENDERING OPERE -----------------------------------------------

function renderOpereDisponibili() {
    const containerOpere = document.getElementById('listaOpere');
    const termineRicerca = document.getElementById('cercaOpera').value.toLowerCase();

    const opereFiltrate = opereDisponibili.filter(opera => {
        const titolo = opera.titolo ? opera.titolo.toLowerCase() : '';
        return titolo.includes(termineRicerca);
    });

    if (opereDisponibili.length === 0) {
        containerOpere.innerHTML = `<div class="alert alert-warning shadow-sm">Nessuna opera presente in questo museo per ora.</div>`;
        return;
    }

    if (opereFiltrate.length === 0) {
        containerOpere.innerHTML = `<div class="alert alert-info shadow-sm">Nessuna opera corrisponde alla ricerca "${termineRicerca}".</div>`;
        return;
    }

    let htmlLista = '<ul class="list-group shadow-sm">';
    
    opereFiltrate.forEach(opera => {
        const nomeAutore = opera.autoreId ? opera.autoreId.username : 'Autore sconosciuto';
        const giaSelezionata = opereSelezionate.some(sel => sel._id === opera._id);
        
        const bottoneHtml = giaSelezionata 
            ? `<button class="btn btn-sm btn-secondary px-3 rounded-pill" disabled>✓ Aggiunta</button>`
            : `<button class="btn btn-sm btn-outline-success px-3 rounded-pill" onclick="aggiungiAVisita('${opera._id}')">+ Aggiungi</button>`;

        htmlLista += `
            <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                <div>
                    <h6 class="mb-0 text-dark">🎨 ${opera.titolo || 'Opera senza titolo'}</h6>
                    <small class="text-muted">Autore: ${nomeAutore}</small>
                </div>
                ${bottoneHtml}
            </li>
        `;
    });
    
    htmlLista += '</ul>';
    containerOpere.innerHTML = htmlLista;
}

function aggiungiAVisita(operaId) {
    const opera = opereDisponibili.find(o => o._id === operaId);
    if (opera && !opereSelezionate.some(o => o._id === operaId)) {
        opereSelezionate.push(opera);
        renderOpereDisponibili();
        renderCarrello();
    }
}

function rimuoviDaVisita(operaId) {
    opereSelezionate = opereSelezionate.filter(o => o._id !== operaId);
    renderOpereDisponibili();
    renderCarrello();
}

// --- RENDERING CARRELLO -------------------------------------------------------

function renderCarrello() {
    const carrelloContainer = document.getElementById('carrelloVisita');
    const btnSalva = document.getElementById('btnSalvaVisita');

    if (opereSelezionate.length === 0) {
        carrelloContainer.innerHTML = '<li class="list-group-item text-muted text-center">Nessuna opera selezionata.</li>';
        btnSalva.disabled = true;
        return;
    }

    btnSalva.disabled = false;
    let htmlCarrello = '';

    opereSelezionate.forEach((opera, index) => {
        htmlCarrello += `
            <li class="list-group-item d-flex justify-content-between align-items-center bg-light">
                <span class="text-truncate" style="max-width: 200px;">
                    <small><b>${index + 1}.</b> ${opera.titolo}</small>
                </span>
                <button class="btn btn-sm btn-link text-danger p-0 text-decoration-none" onclick="rimuoviDaVisita('${opera._id}')">❌</button>
            </li>
        `;
    });

    carrelloContainer.innerHTML = htmlCarrello;
}

// --- SALVATAGGIO VISITA -------------------------------------------------------

async function salvaVisita() {
    if (opereSelezionate.length === 0) return;

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
        items: opereSelezionate.map((opera, index) => ({
            itemId: opera._id,
            ordine: index + 1
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
            opereSelezionate = [];
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
