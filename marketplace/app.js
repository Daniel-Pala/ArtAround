// =============================================================================
// app.js — Gestione Dashboard Autore e Visitatore (Versione Definitiva e Stabile)
// =============================================================================

console.log("App.js caricato correttamente");

if (typeof richiediLogin !== 'function') {
    console.error("ERRORE: sessione.js non è caricato correttamente!");
} else {
    richiediLogin();
}

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
        setupFormOpera();
    } else if (utente.ruolo === 'visitatore') {
        const sezVisitatore = document.getElementById('sezioneVisitatore');
        if (sezVisitatore) sezVisitatore.style.display = 'block';
        caricaMarketplaceVisitatore();
    }
});

function renderNavbar(utente) {
    const userBox = document.getElementById('userBox');
    if (!userBox) return;

    if (utente) {
        userBox.innerHTML = `
            <span class="text-light me-3">Ciao, <strong>${utente.username}</strong></span>
            <button class="btn btn-outline-light btn-sm" id="btnLogout">
                <i class="bi bi-box-arrow-right me-1"></i>Logout
            </button>
        `;
        document.getElementById('btnLogout').addEventListener('click', () => {
            localStorage.removeItem('utente');
            window.location.href = 'login.html';
        });
    } else {
        userBox.innerHTML = `<a href="login.html" class="btn btn-outline-light btn-sm">Accedi</a>`;
    }
}

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
                        <button class="btn btn-sm btn-outline-success me-1" onclick="apriModalNuovaOpera('${museo._id}')">
                            <i class="bi bi-plus-lg me-1"></i>Opera
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="apriModalVisite('${museo._id}')">
                            <i class="bi bi-collection me-1"></i>Percorsi
                        </button>
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
            fetch(`${API_URL}/visite`),
            fetchAuth(`${API_URL}/visite/mie-visite`)
        ]);

        const visite = await resVisite.json();
        let acquistiIds = [];
        
        if (resAcquisti.ok) {
            const acquistiRaw = await resAcquisti.json();
            // FORZATURA STRINGA: assicuriamoci che gli ID vengano salvati come stringhe semplici per poterli confrontare
            acquistiIds = acquistiRaw.map(a => {
                if (a && typeof a === 'object' && a._id) return String(a._id);
                return String(a);
            });
        }

        if (visite.length === 0) {
            listaVisite.innerHTML = `<div class="col-12 text-center text-muted">Nessun percorso disponibile.</div>`;
            return;
        }

        let htmlCards = '';
        visite.forEach(v => {
            // Confrontiamo forzando anche l'id del percorso a stringa
            const isAcquistata = acquistiIds.includes(String(v._id));
            const urlPlayer = `http://localhost:5173/player/${v._id}`;
            const prezzoLabel = v.prezzo > 0 ? `${v.prezzo} €` : 'Gratis';

            htmlCards += `
                <div class="col-md-4">
                    <article class="card card-interactive h-100">
                        <div class="card-body d-flex flex-column">
                            <div class="eyebrow mb-2">Percorso</div>
                            <h5 class="card-title mb-2">${v.nome}</h5>
                            <p class="card-text text-muted small flex-grow-1">${v.infoLogistiche || 'Nessuna informazione logistica.'}</p>
                            <div class="d-flex justify-content-between align-items-end pt-3 border-top">
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

function apriModalNuovaOpera(museoId) {
    window.currentMuseoId = museoId;
    document.getElementById('testiContainer').innerHTML = '';
    aggiungiRigaTesto();
    new bootstrap.Modal(document.getElementById('modalNuovaOpera')).show();
}

// Aggiunge una riga "testo" (durata + livello + contenuto) all'editor del modal opera.
function aggiungiRigaTesto() {
    const riga = document.createElement('div');
    riga.className = 'testo-riga border rounded p-2 mb-2';
    riga.innerHTML = `
        <div class="row g-2 mb-2 align-items-center">
            <div class="col">
                <select class="form-select form-select-sm testo-durata">
                    <option value="3s">3 secondi</option>
                    <option value="15s" selected>15 secondi</option>
                    <option value="1min">1 minuto</option>
                    <option value="4min">4 minuti</option>
                </select>
            </div>
            <div class="col">
                <select class="form-select form-select-sm testo-livello">
                    <option value="infantile">Infantile</option>
                    <option value="elementare">Elementare</option>
                    <option value="medio" selected>Medio</option>
                    <option value="specialistico">Specialistico</option>
                </select>
            </div>
            <div class="col-auto">
                <button type="button" class="btn btn-sm btn-link text-danger p-0" onclick="this.closest('.testo-riga').remove()" aria-label="Rimuovi testo">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        </div>
        <textarea class="form-control form-control-sm testo-contenuto" rows="2" placeholder="Testo della descrizione…"></textarea>
    `;
    document.getElementById('testiContainer').appendChild(riga);
}

function setupFormOpera() {
    const form = document.getElementById('formOpera');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const testi = [...document.querySelectorAll('#testiContainer .testo-riga')].map(riga => ({
            durata: riga.querySelector('.testo-durata').value,
            livello: riga.querySelector('.testo-livello').value,
            testo: riga.querySelector('.testo-contenuto').value.trim()
        })).filter(t => t.testo);

        if (testi.length === 0) {
            alert("Aggiungi almeno un testo all'opera.");
            return;
        }

        const payload = {
            operaId: document.getElementById('operaWikidata').value.trim(),
            museoId: window.currentMuseoId,
            titolo: document.getElementById('operaTitolo').value.trim(),
            licenza: document.getElementById('operaLicenza').value,
            prezzo: parseFloat(document.getElementById('operaPrezzo').value) || 0,
            testi
        };

        try {
            const response = await fetchAuth(`${API_URL}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById('modalNuovaOpera')).hide();
                form.reset();
                alert("Opera creata.");
            } else {
                const data = await response.json();
                alert(data.message || "Errore durante il salvataggio dell'opera.");
            }
        } catch (error) {
            alert("Errore di connessione al server.");
        }
    });
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