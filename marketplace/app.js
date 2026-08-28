// app.js — dashboard autore e vetrina visitatore

// il Navigator e' l'altra applicazione, gira su un'altra porta: da sistemare col deploy
const URL_NAVIGATOR = 'http://localhost:5173';

// gli item del museo aperto nel modale: la fetch li scarica una volta, i filtri ridisegnano
let itemsMuseo = [];

// id dell'item aperto nel form: null quando si crea, valorizzato quando si modifica
let itemInModifica = null;

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
        setupFormItem();
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
                        <button class="btn btn-sm btn-outline-success me-1" onclick="apriModalItems('${museo._id}')">
                            <i class="bi bi-images me-1"></i>Item
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

    const response = await fetch(`${API_URL}/visite/${visitaId}`);
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

function apriModalItems(museoId) {
    window.currentMuseoId = museoId;
    new bootstrap.Modal(document.getElementById('modalItems')).show();
    caricaItemsMuseo(museoId);
}

// Bootstrap non tiene aperte due modali insieme: chiudo questa e apro l'altra quando è sparita
function passaANuovoItem() {
    const modale = document.getElementById('modalItems');
    modale.addEventListener('hidden.bs.modal', () => apriModalNuovoItem(window.currentMuseoId), { once: true });
    bootstrap.Modal.getInstance(modale).hide();
}

function passaAModificaItem(itemId) {
    const item = itemsMuseo.find(o => o._id === itemId);
    const modale = document.getElementById('modalItems');
    modale.addEventListener('hidden.bs.modal', () => apriModalModificaItem(item), { once: true });
    bootstrap.Modal.getInstance(modale).hide();
}

async function caricaItemsMuseo(museoId) {
    const utente = getUtenteLoggato();
    const response = await fetch(`${API_URL}/items?museoId=${museoId}`);
    itemsMuseo = (await response.json()).filter(o => o.autoreId && o.autoreId._id === utente.userId);
    renderItemsMuseo();
}

// separata dalla fetch: i filtri ridisegnano senza richiamare il server
function renderItemsMuseo() {
    const container = document.getElementById('listaItemsMuseo');

    if (itemsMuseo.length === 0) {
        container.innerHTML = `<p class="text-muted text-center mb-0">Non hai ancora creato item in questo museo.</p>`;
        return;
    }

    const ricerca = document.getElementById('ricercaItemsMuseo').value.toLowerCase();
    const tipoScelto = document.getElementById('filtroTipoMuseo').value;
    const filtrati = itemsMuseo.filter(o =>
        o.titolo.toLowerCase().includes(ricerca) && (tipoScelto === '' || o.tipo === tipoScelto)
    );

    if (filtrati.length === 0) {
        container.innerHTML = `<p class="text-muted text-center mb-0">Nessun item corrisponde ai filtri.</p>`;
        return;
    }

    container.innerHTML = filtrati.map(o => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <span class="text-truncate me-2">
                <span class="fw-semibold">${o.titolo}</span>
                <small class="text-muted d-block">${o.tipo === 'approfondimento' ? 'Approfondimento' : 'Opera'} · ${o.operaId} · ${o.testi.length} ${o.testi.length === 1 ? 'testo' : 'testi'}</small>
            </span>
            <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline-secondary" onclick="passaAModificaItem('${o._id}')" aria-label="Modifica item">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminaItem('${o._id}', '${window.currentMuseoId}')" aria-label="Elimina item">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function eliminaItem(itemId, museoId) {
    if (!confirm("Eliminare questo item? Sparirà anche dai percorsi che lo contengono.")) return;

    const response = await fetchAuth(`${API_URL}/items/${itemId}`, { method: 'DELETE' });
    if (response.ok) {
        caricaItemsMuseo(museoId);
    } else {
        alert("Errore durante l'eliminazione dell'item.");
    }
}

function apriModalNuovoItem(museoId) {
    window.currentMuseoId = museoId;
    itemInModifica = null;
    document.getElementById('titoloModalItem').textContent = 'Aggiungi item';
    document.getElementById('formItem').reset();
    document.getElementById('testiContainer').innerHTML = '';
    aggiungiRigaTesto();
    new bootstrap.Modal(document.getElementById('modalNuovoItem')).show();
}

// stesso modale della creazione, con i campi riempiti con quello che c'e' gia' nel database
function apriModalModificaItem(item) {
    itemInModifica = item._id;
    document.getElementById('titoloModalItem').textContent = 'Modifica item';

    document.getElementById('itemTitolo').value = item.titolo;
    document.getElementById('itemTipo').value = item.tipo;
    document.getElementById('itemWikidata').value = item.operaId;
    document.getElementById('itemDescrizione').value = item.descrizione || '';
    document.getElementById('itemAutoreOpera').value = item.autoreOpera || '';
    document.getElementById('itemStile').value = item.stile || '';
    document.getElementById('itemImmagine').value = item.immagine || '';
    document.getElementById('itemLicenza').value = item.licenza;
    document.getElementById('itemPrezzo').value = item.prezzo;

    document.getElementById('testiContainer').innerHTML = '';
    item.testi.forEach(testo => aggiungiRigaTesto(testo));

    new bootstrap.Modal(document.getElementById('modalNuovoItem')).show();
}

// Aggiunge una riga "testo" (durata + livello + contenuto) all'editor del modal item.
// In modifica riceve il testo gia' salvato e lo rimette nei tre campi.
function aggiungiRigaTesto(testo) {
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

    if (testo) {
        riga.querySelector('.testo-durata').value = testo.durata;
        riga.querySelector('.testo-livello').value = testo.livello;
        riga.querySelector('.testo-contenuto').value = testo.testo;
    }
}

function setupFormItem() {
    const form = document.getElementById('formItem');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const testi = [...document.querySelectorAll('#testiContainer .testo-riga')].map(riga => ({
            durata: riga.querySelector('.testo-durata').value,
            livello: riga.querySelector('.testo-livello').value,
            testo: riga.querySelector('.testo-contenuto').value.trim()
        })).filter(t => t.testo);

        if (testi.length === 0) {
            alert("Aggiungi almeno un testo all'item.");
            return;
        }

        const payload = {
            operaId: document.getElementById('itemWikidata').value.trim(),
            tipo: document.getElementById('itemTipo').value,
            museoId: window.currentMuseoId,
            titolo: document.getElementById('itemTitolo').value.trim(),
            descrizione: document.getElementById('itemDescrizione').value.trim(),
            autoreOpera: document.getElementById('itemAutoreOpera').value.trim(),
            stile: document.getElementById('itemStile').value.trim(),
            immagine: document.getElementById('itemImmagine').value.trim(),
            licenza: document.getElementById('itemLicenza').value,
            prezzo: parseFloat(document.getElementById('itemPrezzo').value) || 0,
            testi
        };

        try {
            const response = await fetchAuth(
                itemInModifica ? `${API_URL}/items/${itemInModifica}` : `${API_URL}/items`,
                {
                    method: itemInModifica ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }
            );

            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById('modalNuovoItem')).hide();
                form.reset();
                alert(itemInModifica ? "Item modificato." : "Item creato.");
            } else {
                const data = await response.json();
                alert(data.message || "Errore durante il salvataggio dell'item.");
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