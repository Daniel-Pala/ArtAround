// Variabili globali
let opereDisponibili = [];
let opereSelezionate = [];
let museoIdAttuale = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    museoIdAttuale = urlParams.get('id');

    if (!museoIdAttuale) {
        window.location.href = 'index.html';
        return;
    }

    const titoloElement = document.getElementById('titoloMuseo');
    const infoElement = document.getElementById('infoMuseo');

    try {
        const museoResponse = await fetch(`http://localhost:3000/api/musei/${museoIdAttuale}`);
        if (museoResponse.ok) {
            const museo = await museoResponse.json();
            titoloElement.innerText = `Configurazione: ${museo.nome}`;
            infoElement.innerText = `Sede di ${museo.citta || 'N/A'}.`;
        }

        const opereResponse = await fetch(`http://localhost:3000/api/items?museoId=${museoIdAttuale}`);
        if (opereResponse.ok) {
            opereDisponibili = await opereResponse.json();
            renderOpereDisponibili();
        }
    } catch (error) {
        console.error("Errore:", error);
        titoloElement.innerText = "Errore di connessione";
        infoElement.innerText = "Controlla che il server sia attivo (npm start).";
    }
});

// Funzione AGGIORNATA per gestire la ricerca
function renderOpereDisponibili() {
    const containerOpere = document.getElementById('listaOpere');
    const termineRicerca = document.getElementById('cercaOpera').value.toLowerCase();

    // Filtriamo le opere in base a quello che c'è scritto nella barra
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

async function salvaVisita() {
    if (opereSelezionate.length === 0) return;
    const opereIds = opereSelezionate.map(o => o._id);
    console.log("Dati pronti per il database:", { museoId: museoIdAttuale, opere: opereIds });
    alert(`Ottimo lavoro! Hai preparato un percorso con ${opereSelezionate.length} opere.\nAdesso manca solo l'API di Daniel per salvare davvero la visita nel database!`);
}