// app.js — dashboard autore e vetrina visitatore

// il Navigator e' l'altra applicazione e gira su un'altra porta, ma sempre sulla
// stessa macchina: prendendo l'host dalla pagina il link regge anche quando il
// marketplace lo si apre dal telefono via IP di rete. La porta resta da sistemare col deploy.
const URL_NAVIGATOR = `http://${location.hostname}:5173`;

richiediLogin();

document.addEventListener('DOMContentLoaded', () => {
    const utente = getUtenteLoggato();
    renderNavbar(utente);

    if (!utente) {
        window.location.href = 'login.html';
        return;
    }

    if (utente.ruolo === 'autore') {
        const sezAutore = document.getElementById('sezioneAutore');
        if (sezAutore) sezAutore.style.display = 'block';
        caricaDashboardAutore();
        setupFormMuseo();
    } else if (utente.ruolo === 'visitatore') {
        const sezVisitatore = document.getElementById('sezioneVisitatore');
        if (sezVisitatore) sezVisitatore.style.display = 'block';
        caricaMarketplaceVisitatore();
    }
});

async function caricaDashboardAutore() {
    const listaMusei = document.getElementById('listaMusei');
    const countMusei = document.getElementById('countMusei');
    if (!listaMusei) return;

    try {
        const response = await fetchAuth(`${API_URL}/musei`);
        if (!response.ok) throw new Error("Impossibile caricare i musei");

        const musei = await response.json();
        if (countMusei) countMusei.innerText = musei.length;

        if (musei.length === 0) {
            listaMusei.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">Non gestisci ancora nessun museo.</td></tr>`;
            return;
        }

        let htmlRighe = '';
        musei.forEach(museo => {
            htmlRighe += `
                <tr>
                    <td class="ps-4 fw-semibold">${museo.nome}</td>
                    <td class="text-muted">${museo.citta || '—'}</td>
                    <td class="text-end pe-4">
                        <a href="items.html?id=${museo._id}" class="btn btn-sm btn-outline-dark me-1">Item</a>
                        <button class="btn btn-sm btn-outline-dark me-1" onclick="apriModalVisite('${museo._id}')">Percorsi</button>
                        <a href="qr.html?id=${museo._id}" class="btn btn-sm btn-outline-dark">
                            <i class="bi bi-qr-code me-1"></i>QR
                        </a>
                    </td>
                </tr>`;
        });
        listaMusei.innerHTML = htmlRighe;
    } catch (error) {
        listaMusei.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-4">Errore durante il caricamento dati.</td></tr>`;
    }
}

function setupFormMuseo() {
    const form = document.getElementById('formMuseo');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nomeMuseo').value.trim();
        const citta = document.getElementById('cittaMuseo').value.trim();

        try {
            const response = await fetchAuth(`${API_URL}/musei`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, citta })
            });

            if (response.ok) {
                const modalEl = document.getElementById('modalNuovoMuseo');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                form.reset();
                caricaDashboardAutore(); 
            } else {
                alert("Errore durante il salvataggio del museo.");
            }
        } catch (error) {
            console.error(error);
        }
    });
}

// --- LOGICA VISITATORE (MARKETPLACE FULL-STACK) ---
async function caricaMarketplaceVisitatore() {
    const listaVisite = document.getElementById('listaVisite');
    if (!listaVisite) return;

    try {
        const [resVisite, resAcquisti] = await Promise.all([
            fetch(`${API_URL}/visite?pubblica=true`),
            fetchAuth(`${API_URL}/visite/mie-visite`)
        ]);

        const visite = await resVisite.json();
        let acquistiIds = [];
        
        if (resAcquisti.ok) {
            const acquistiRaw = await resAcquisti.json();
            // la rotta restituisce le visite popolate, ma in altri punti sono solo id: normalizzo a stringa
            acquistiIds = acquistiRaw.map(a => String(a._id || a));
        }

        if (visite.length === 0) {
            listaVisite.innerHTML = `<div class="col-12 text-center text-muted">Nessun percorso disponibile.</div>`;
            return;
        }

        let htmlCards = '';
        visite.forEach(v => {
            // Confrontiamo forzando anche l'id del percorso a stringa
            const isAcquistata = acquistiIds.includes(String(v._id));
            const urlPlayer = `${URL_NAVIGATOR}/player/${v._id}`;
            const prezzoLabel = v.prezzo > 0 ? `${v.prezzo} €` : 'Gratis';

            htmlCards += `
                <div class="col-md-4">
                    <article class="card card-interactive h-100" style="cursor: pointer;" onclick="mostraTappe('${v._id}')">
                        <div class="card-body d-flex flex-column">
                            <div class="eyebrow mb-2">${v.museoId?.nome || ''}</div>
                            <h5 class="card-title mb-2">${v.nome}</h5>
                            <p class="card-text text-muted small flex-grow-1">${v.infoLogistiche || 'Nessuna informazione logistica.'}</p>
                            <div class="text-muted small mb-2">${v.items.length} ${v.items.length === 1 ? 'tappa' : 'tappe'}</div>
                            <div class="d-flex justify-content-between align-items-end pt-3 border-top" onclick="event.stopPropagation()">
                                <div>
                                    <div class="price-label">Prezzo</div>
                                    <div class="price">${prezzoLabel}</div>
                                </div>
                                ${isAcquistata
                                    ? `<a href="${urlPlayer}" target="_blank" class="btn btn-sm btn-success"><i class="bi bi-play-fill me-1"></i>Avvia</a>`
                                    : `<button class="btn btn-sm btn-primary" onclick="acquistaVisita('${v._id}')">Acquista</button>`
                                }
                            </div>
                        </div>
                    </article>
                </div>`;
        });
        listaVisite.innerHTML = htmlCards;
    } catch (error) {
        listaVisite.innerHTML = `<div class="col-12 text-center text-danger">Impossibile caricare i percorsi.</div>`;
    }
}

// L'elenco delle tappe non arriva con la vetrina: la rotta ?pubblica=true tiene gli item
// come riferimenti, quindi lo chiedo alla rotta della singola visita, che li popola.
// Il nome lo leggo dalla risposta invece di passarlo nell'onclick: cosi' gli apostrofi
// nei titoli non spezzano l'attributo.
async function mostraTappe(visitaId) {
    const elenco = document.getElementById('elencoTappe');
    elenco.innerHTML = '';
    new bootstrap.Modal(document.getElementById('modalTappe')).show();

    const response = await fetchAuth(`${API_URL}/visite/${visitaId}`);
    const visita = await response.json();

    document.getElementById('titoloTappe').textContent = visita.nome;
    elenco.innerHTML = visita.items
        .filter(tappa => tappa.itemId)
        .map(tappa => `<li class="mb-1">${tappa.itemId.titolo}${tappa.opzionale ? ' <span class="badge text-bg-secondary fw-normal">Opzionale</span>' : ''}</li>`)
        .join('');
}

async function acquistaVisita(visitaId) {
    try {
        const response = await fetchAuth(`${API_URL}/visite/${visitaId}/acquista`, {
            method: 'POST'
        });

        if (response.ok) {
            alert("Percorso sbloccato.");
            caricaMarketplaceVisitatore(); // Ricarica la lista per mostrare il bottone Avvia
        } else {
            const data = await response.json();
            alert(data.message || "Errore durante l'acquisto");
        }
    } catch (error) {
        console.error(error);
        alert("Si è verificato un errore di rete.");
    }
}

function apriModalVisite(museoId) {
    document.getElementById('btnNuovoPercorso').href = `configura.html?id=${museoId}`;
    new bootstrap.Modal(document.getElementById('modalVisite')).show();
    caricaVisiteMuseo(museoId);
}

async function caricaVisiteMuseo(museoId) {
    const container = document.getElementById('listaVisiteMuseo');
    const utente = getUtenteLoggato();

    const response = await fetch(`${API_URL}/visite?museoId=${museoId}`);
    const visite = (await response.json()).filter(v => v.autoreId && v.autoreId._id === utente.userId);

    if (visite.length === 0) {
        container.innerHTML = `<p class="text-muted text-center mb-0">Non hai ancora creato percorsi in questo museo.</p>`;
        return;
    }

    container.innerHTML = visite.map(v => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <span class="fw-semibold text-truncate me-2">${v.nome}</span>
            <span class="text-nowrap">
                <a href="${URL_NAVIGATOR}/player/${v._id}" target="_blank" class="btn btn-sm btn-outline-success me-1">
                    <i class="bi bi-play-fill me-1"></i>Avvia
                </a>
                <a href="configura.html?id=${museoId}&visitaId=${v._id}" class="btn btn-sm btn-outline-secondary me-1">
                    <i class="bi bi-pencil me-1"></i>Modifica
                </a>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminaVisita('${v._id}', '${museoId}')" aria-label="Elimina percorso">
                    <i class="bi bi-trash"></i>
                </button>
            </span>
        </div>
    `).join('');
}

async function eliminaVisita(visitaId, museoId) {
    if (!confirm("Eliminare questo percorso?")) return;

    const response = await fetchAuth(`${API_URL}/visite/${visitaId}`, { method: 'DELETE' });
    if (response.ok) {
        caricaVisiteMuseo(museoId);
    } else {
        alert("Errore durante l'eliminazione del percorso.");
    }
}