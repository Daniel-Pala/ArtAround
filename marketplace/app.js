// =============================================================================
// app.js — Gestione Dashboard Autore e Visitatore (Versione Corretta + Player)
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
                    <td class="ps-4 fw-bold text-dark">🏛️ ${museo.nome}</td>
                    <td><span class="badge bg-secondary">${museo.citta || 'N/A'}</span></td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="apriModalNuovaOpera('${museo._id}')">
                            <i class="bi bi-plus-lg me-1"></i>Opera
                        </button>
                        <a href="configura.html?id=${museo._id}" class="btn btn-sm btn-outline-secondary">
                            <i class="bi bi-gear me-1"></i>Configura
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
        // Interroghiamo il database per tutte le visite e per quelle già sbloccate (Logica di Daniel)
        const [resVisite, resAcquisti] = await Promise.all([
            fetch(`${API_URL}/visite`),
            fetchAuth(`${API_URL}/visite/mie-visite`)
        ]);

        const visite = await resVisite.json();
        let acquistiIds = [];
        if (resAcquisti.ok) {
            const acquistiRaw = await resAcquisti.json();
            // Estraiamo solo gli ID delle visite acquistate
            acquistiIds = acquistiRaw.map(a => typeof a === 'object' ? a._id : a);
        }

        if (visite.length === 0) {
            listaVisite.innerHTML = `<div class="col-12 text-center text-muted">Nessun percorso disponibile.</div>`;
            return;
        }

        let htmlCards = '';
        visite.forEach(v => {
            const isAcquistata = acquistiIds.includes(v._id);
            const urlPlayer = `http://localhost:5173/player/${v._id}`;
            
            htmlCards += `
                <div class="col-md-4 mb-4">
                    <div class="card card-museo shadow-sm h-100">
                        <div class="card-body">
                            <h5 class="card-title fw-bold">🗺️ ${v.nome}</h5>
                            <p class="card-text text-muted small">${v.infoLogistiche || 'Nessuna informazione aggiuntiva.'}</p>
                            <hr class="mt-auto mb-3 text-muted">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="fw-bold text-dark">${v.prezzo} €</span>
                                <div>
                                    ${isAcquistata 
                                        ? `<a href="${urlPlayer}" target="_blank" class="btn btn-sm btn-success text-white shadow-sm fw-bold">▶ Avvia Player</a>`
                                        : `<button class="btn btn-sm btn-primary shadow-sm" onclick="acquistaVisita('${v._id}')">Acquista</button>`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        });
        listaVisite.innerHTML = htmlCards;
    } catch (error) {
        listaVisite.innerHTML = `<div class="col-12 text-center text-danger">Impossibile caricare i percorsi.</div>`;
    }
}

// Funzione che comunica con il backend di Daniel
async function acquistaVisita(visitaId) {
    try {
        const response = await fetchAuth(`${API_URL}/visite/${visitaId}/acquista`, {
            method: 'POST'
        });

        if (response.ok) {
            caricaMarketplaceVisitatore(); // Ricarica e mostra il player
        } else {
            const data = await response.json();
            alert(data.message || "Errore durante l'acquisto");
        }
    } catch (error) {
        console.error(error);
    }
}

function apriModalNuovaOpera(museoId) {
    window.currentMuseoId = museoId;
    const modal = new bootstrap.Modal(document.getElementById('modalNuovaOpera'));
    modal.show();
}