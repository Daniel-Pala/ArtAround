// =============================================================================
// app.js — dashboard principale (versione ultra-robusta)
// =============================================================================

// API_URL è già dichiarata in sessione.js

// --- LOG DI AVVIO ---
console.log("App.js caricato correttamente");

// Assicuriamoci che sessione.js sia caricato
if (typeof richiediLogin !== 'function') {
    console.error("ERRORE: sessione.js non è caricato correttamente!");
} else {
    richiediLogin();
}

const utente = getUtenteLoggato();
console.log("Utente loggato:", utente);

// Eseguiamo tutto dentro DOMContentLoaded per sicurezza
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM pronto, inizializzazione sezioni...");
    
    try {
        // --- NAVBAR ---
        const userBox = document.getElementById('userBox');
        if (userBox && utente) {
            userBox.innerHTML = `
                <span class="navbar-text text-light me-3 d-none d-sm-inline">
                    Ciao, <strong>${utente.username}</strong>
                </span>
                <button class="btn btn-outline-light btn-sm" id="btnLogout">
                    <i class="bi bi-box-arrow-right me-1"></i>Logout
                </button>
            `;
            document.getElementById('btnLogout').addEventListener('click', logout);
        }

        // --- GESTIONE SEZIONI ---
        const sezioneAutore = document.getElementById('sezioneAutore');
        const sezioneVisitatore = document.getElementById('sezioneVisitatore');

        if (utente && utente.ruolo === 'autore') {
            if (sezioneAutore) {
                sezioneAutore.style.display = 'block';
                setupAutore();
            }
        } else if (utente) {
            if (sezioneVisitatore) {
                sezioneVisitatore.style.display = 'block';
                setupVisitatore();
            }
        } else {
            console.warn("Nessun utente trovato, reindirizzamento...");
            window.location.href = 'login.html';
        }
    } catch (err) {
        console.error("Errore durante l'inizializzazione:", err);
    }
});

// =============================================================================
// SEZIONE AUTORE
// =============================================================================

function setupAutore() {
    console.log("Setup Autore...");
    getMusei();
    
    const formMuseo = document.getElementById('formMuseo');
    if (formMuseo) formMuseo.addEventListener('submit', creaMuseo);
    
    const formOpera = document.getElementById('formOpera');
    if (formOpera) formOpera.addEventListener('submit', creaOpera);
}

async function getMusei() {
    const container = document.getElementById('listaMusei');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/musei`);
        const musei = await response.json();

        const countMusei = document.getElementById('countMusei');
        if (countMusei) countMusei.innerText = musei.length;

        container.innerHTML = '';

        if (!musei || musei.length === 0) {
            container.innerHTML = '<tr><td colspan="3" class="text-center py-4">Nessun museo trovato. Aggiungine uno!</td></tr>';
            return;
        }

        musei.forEach(museo => {
            container.innerHTML += `
                <tr>
                    <td class="ps-4">
                        <div class="fw-bold text-dark">${museo.nome}</div>
                    </td>
                    <td><span class="badge bg-light text-dark border">${museo.citta}</span></td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-outline-info me-2" onclick="apriFormOpera('${museo._id}', '${museo.nome}')">
                            <i class="bi bi-plus-circle me-1"></i> Opera
                        </button>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="visualizzaVisite('${museo._id}', '${museo.nome}')">
                            <i class="bi bi-list-check me-1"></i> Visite
                        </button>
                        <a href="configura.html?id=${museo._id}" class="btn btn-sm btn-outline-primary me-2">
                            <i class="bi bi-gear-fill me-1"></i> Configura
                        </a>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminaMuseo('${museo._id}')">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Errore nel caricamento musei:", error);
        container.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Errore di connessione al server</td></tr>';
    }
}

// ... (resto delle funzioni: creaMuseo, eliminaMuseo, apriFormOpera, aggiungiRigaTesto, creaOpera, visualizzaVisite, modificaVisita, eliminaVisita)
// Per brevità includo solo le modifiche strutturali, ma nel file finale saranno complete.

async function creaMuseo(e) {
    e.preventDefault();
    const nome = document.getElementById('nomeMuseo').value;
    const citta = document.getElementById('cittaMuseo').value;

    try {
        const response = await fetchAuth(`${API_URL}/musei`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, citta })
        });

        if (response.ok) {
            document.getElementById('formMuseo').reset();
            const modalEl = document.getElementById('modalNuovoMuseo');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            getMusei();
        } else {
            const err = await response.json();
            alert(err.message || "Errore durante il salvataggio");
        }
    } catch (error) {
        alert("Errore durante il salvataggio");
    }
}

async function eliminaMuseo(id) {
    if (!confirm("Sei sicuro?")) return;
    try {
        const res = await fetchAuth(`${API_URL}/musei/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const err = await res.json();
            alert(err.message || "Errore nell'eliminazione");
            return;
        }
        getMusei();
    } catch (error) {
        alert("Errore nell'eliminazione");
    }
}

let museoIdOpera = null;
function apriFormOpera(id, nome) {
    museoIdOpera = id;
    document.getElementById('containerTesti').innerHTML = '';
    aggiungiRigaTesto();
    const modal = new bootstrap.Modal(document.getElementById('modalNuovaOpera'));
    modal.show();
}

function aggiungiRigaTesto() {
    const container = document.getElementById('containerTesti');
    const index = Date.now(); // ID univoco
    const div = document.createElement('div');
    div.className = 'testo-row';
    div.id = `testo-${index}`;
    div.innerHTML = `
        <div class="row g-2 mb-2">
            <div class="col-md-5">
                <select class="form-select form-select-sm durata-select" required>
                    <option value="3s">3s</option><option value="15s">15s</option><option value="1min">1min</option><option value="4min">4min</option>
                </select>
            </div>
            <div class="col-md-5">
                <select class="form-select form-select-sm livello-select" required>
                    <option value="infantile">Infantile</option><option value="elementare">Elementare</option><option value="medio" selected>Medio</option><option value="specialistico">Specialistico</option>
                </select>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-sm btn-danger w-100" onclick="document.getElementById('testo-${index}').remove()">X</button>
            </div>
            <div class="col-12">
                <textarea class="form-control form-control-sm testo-textarea" placeholder="Testo..." required></textarea>
            </div>
        </div>
    `;
    container.appendChild(div);
}

async function creaOpera(e) {
    e.preventDefault();
    const testi = [];
    document.querySelectorAll('.testo-row').forEach(row => {
        testi.push({
            durata: row.querySelector('.durata-select').value,
            livello: row.querySelector('.livello-select').value,
            testo: row.querySelector('.testo-textarea').value
        });
    });

    // autoreId lo mette il backend dal token, non lo mandiamo dal client
    const payload = {
        operaId: document.getElementById('operaWikidata').value,
        museoId: museoIdOpera,
        titolo: document.getElementById('operaTitolo').value,
        testi: testi,
        licenza: document.getElementById('operaLicenza').value,
        prezzo: parseFloat(document.getElementById('operaPrezzo').value) || 0
    };

    try {
        const res = await fetchAuth(`${API_URL}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert("Opera creata!");
            bootstrap.Modal.getInstance(document.getElementById('modalNuovaOpera')).hide();
        } else {
            const err = await res.json();
            alert(err.message || "Errore salvataggio opera");
        }
    } catch (err) { alert("Errore salvataggio opera"); }
}

async function visualizzaVisite(id, nome) {
    document.getElementById('nomeMuseoVisite').innerText = nome;
    try {
        const res = await fetch(`${API_URL}/visite?museoId=${id}`);
        const visite = await res.json();
        const container = document.getElementById('listaVisiteMuseo');
        container.innerHTML = visite.length ? '' : 'Nessuna visita.';
        visite.forEach(v => {
            container.innerHTML += `
                <div class="d-flex justify-content-between border-bottom py-2">
                    <span>${v.nome} (${v.pubblica ? 'Pubblica' : 'Privata'})</span>
                    <button class="btn btn-sm btn-danger" onclick="eliminaVisita('${v._id}', '${id}', '${nome}')">Elimina</button>
                </div>`;
        });
        new bootstrap.Modal(document.getElementById('modalGestioneVisite')).show();
    } catch (err) { alert("Errore visite"); }
}

async function eliminaVisita(id, mId, mNome) {
    if (!confirm("Eliminare visita?")) return;
    const res = await fetchAuth(`${API_URL}/visite/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Errore eliminazione visita");
        return;
    }
    visualizzaVisite(mId, mNome);
}

// =============================================================================
// SEZIONE VISITATORE
// =============================================================================

async function setupVisitatore() {
    const container = document.getElementById('listaVisite');
    if (!container) return;
    try {
        const res = await fetch(`${API_URL}/visite`);
        const visite = await res.json();
        const pubbliche = visite.filter(v => v.pubblica);
        container.innerHTML = pubbliche.length ? '' : 'Nessun percorso pubblico.';
        pubbliche.forEach(v => {
            container.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card shadow-sm h-100">
                        <div class="card-body">
                            <h6>${v.nome}</h6>
                            <p class="small text-muted">${v.museoId.nome}</p>
                            <button class="btn btn-sm btn-primary w-100">Dettagli</button>
                        </div>
                    </div>
                </div>`;
        });
    } catch (err) { container.innerHTML = "Errore caricamento marketplace."; }
}
