// items.js — la pagina degli item di un museo
// Elenco a sinistra, form a destra. Prima erano due finestrelle dentro la
// dashboard: con qualche centinaio di contenuti una finestrella non si sfoglia, e
// la specifica chiede che sia facile "analizzarli, sceglierli, aggiungerli,
// scartarli".
// L'elenco mostra gli item di TUTTI gli autori del museo, perché è lì che si
// vede cosa è già stato scritto su un'opera e a che prezzo; la matita e il
// cestino compaiono solo sui propri.

richiediLogin();

let museoId = null;
let items = [];
let itemInModifica = null;   // null = il form sta creando, altrimenti l'id che modifica

document.addEventListener('DOMContentLoaded', async () => {
    renderNavbar(getUtenteLoggato());

    museoId = new URLSearchParams(window.location.search).get('id');
    if (!museoId) {
        window.location.href = 'index.html';
        return;
    }

    const museo = await (await fetch(`${API_URL}/musei/${museoId}`)).json();
    document.getElementById('titoloPagina').textContent = `Item della ${museo.nome}`;

    await caricaItems();
    setupFormItem();
});

async function caricaItems() {
    // fetchAuth e non fetch: da quando GET /items chiede il token, una fetch nuda prende 401
    const risposta = await fetchAuth(`${API_URL}/items?museoId=${museoId}`);
    items = await risposta.json();
    renderLista();
}

// separata dalla fetch: i filtri ridisegnano senza richiamare il server
function renderLista() {
    const contenitore = document.getElementById('lista');
    const utente = getUtenteLoggato();

    const ricerca = document.getElementById('ricerca').value.toLowerCase();
    const tipoScelto = document.getElementById('filtroTipo').value;
    const soloMiei = document.getElementById('filtroAutore').value === 'miei';

    const filtrati = items.filter(i =>
        i.titolo.toLowerCase().includes(ricerca)
        && (tipoScelto === '' || i.tipo === tipoScelto)
        && (!soloMiei || i.autoreId?._id === utente.userId)
    );

    if (filtrati.length === 0) {
        contenitore.innerHTML = `<p class="text-muted">Nessun item corrisponde ai filtri.</p>`;
        return;
    }

    contenitore.innerHTML = filtrati.map(i => {
        const mio = i.autoreId?._id === utente.userId;
        const generati = i.testi.filter(t => t.generatoDa).length;
        const lingue = [...new Set(i.testi.map(t => t.lingua || 'it'))];
        return `
        <div class="riga-item ${i._id === itemInModifica ? 'scelto' : ''}">
            <div class="d-flex justify-content-between align-items-start gap-2">
                <div>
                    <div class="fw-semibold">${i.titolo}</div>
                    <div class="small text-muted">
                        ${i.tipo === 'approfondimento' ? 'Approfondimento' : 'Opera'} ·
                        <span class="dato">ID:</span> ${i.operaId} ·
                        <span class="dato">Testi:</span> ${i.testi.length}${generati ? ` (${generati} generati)` : ''} ·
                        <span class="dato">Lingue:</span> ${lingue.join(', ')}
                    </div>
                    <div class="small text-muted">
                        <span class="dato">Autore item:</span> ${i.autoreId?.username || 'sconosciuto'} ·
                        <span class="dato">Licenza:</span> ${i.licenza} ·
                        <span class="dato">Prezzo:</span> ${i.prezzo > 0 ? i.prezzo.toFixed(2) + ' €' : 'gratis'} ·
                        <span class="dato">Creato:</span> ${new Date(i.createdAt).toLocaleDateString('it-IT')}
                    </div>
                </div>
                ${mio ? `
                <div class="d-flex gap-1 flex-shrink-0">
                    <button class="btn btn-sm btn-outline-dark" onclick="modificaItem('${i._id}')" aria-label="Modifica item">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminaItem('${i._id}')" aria-label="Elimina item">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>` : ''}
            </div>
        </div>`;
    }).join('');
}

// il form torna a essere quello della creazione
function svuotaForm() {
    itemInModifica = null;
    document.getElementById('titoloForm').textContent = 'Nuovo item';
    document.getElementById('bottoneAnnulla').classList.add('d-none');
    document.getElementById('formItem').reset();
    document.getElementById('testiContainer').innerHTML = '';
    aggiungiRigaTesto();
    mostraAnteprima();
    renderLista();
}

// stesso form della creazione, con i campi riempiti con quello che c'è già nel database
function modificaItem(itemId) {
    const item = items.find(i => i._id === itemId);
    itemInModifica = item._id;
    document.getElementById('titoloForm').textContent = 'Modifica item';
    document.getElementById('bottoneAnnulla').classList.remove('d-none');

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

    mostraAnteprima();
    renderLista();
    document.getElementById('itemTitolo').scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// L'indirizzo dell'immagine si controlla qui: senza anteprima ci si accorge di un link
// sbagliato solo aprendo la visita nel Navigator.
function mostraAnteprima() {
    const indirizzo = document.getElementById('itemImmagine').value.trim();
    const anteprima = document.getElementById('anteprimaImmagine');
    anteprima.classList.toggle('d-none', !indirizzo);
    if (indirizzo) anteprima.src = indirizzo;
}

async function eliminaItem(itemId) {
    if (!confirm("Eliminare questo item? Sparirà anche dai percorsi che lo contengono.")) return;

    const risposta = await fetchAuth(`${API_URL}/items/${itemId}`, { method: 'DELETE' });
    if (risposta.ok) {
        if (itemInModifica === itemId) svuotaForm();
        caricaItems();
    } else {
        alert("Errore durante l'eliminazione dell'item.");
    }
}

const NOMI_LINGUA = { it: 'italiano', en: 'inglese', fr: 'francese', es: 'spagnolo', de: 'tedesco' };

// Aggiunge una riga "testo" (durata + livello + contenuto) all'editor del modal item.
// In modifica riceve il testo già salvato e lo rimette nei tre campi.
// I testi che ha scritto il modello portano il suo nome: il curatore deve sapere da
// dove viene quello che sta pubblicando. Al visitatore invece non si dice, perché la
// specifica chiede che i contenuti generati non siano distinguibili dagli altri.
// La lingua non ha un campo suo: qui non si sceglie, la chiede il Player quando gli
// serve. Ma va tenuta da parte e va scritta sopra alla riga, se no la stessa descrizione
// in tre lingue sembrano tre righe uguali e la si cancella per sbaglio.
function aggiungiRigaTesto(testo) {
    const riga = document.createElement('div');
    riga.className = 'testo-riga border rounded p-2 mb-2';
    riga.dataset.generatoDa = testo?.generatoDa || '';
    riga.dataset.testoOriginale = testo?.testo || '';
    riga.dataset.lingua = testo?.lingua || 'it';

    const note = [];
    if (riga.dataset.lingua !== 'it') note.push(`In ${NOMI_LINGUA[riga.dataset.lingua] || riga.dataset.lingua}`);
    if (testo?.generatoDa) note.push(`testo generato da ${testo.generatoDa}`);
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
        ${note.length ? `<div class="small text-muted mb-1">${note.join(' · ')}</div>` : ''}
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

        const testi = [...document.querySelectorAll('#testiContainer .testo-riga')].map(riga => {
            const testo = riga.querySelector('.testo-contenuto').value.trim();
            return {
                durata: riga.querySelector('.testo-durata').value,
                livello: riga.querySelector('.testo-livello').value,
                testo,
                // il form ricostruisce i testi leggendo il DOM, quindi quello che non ha
                // un campo a schermo va riportato a mano o si perde: la lingua tornerebbe
                // al suo default ('it') e un testo francese risulterebbe italiano.
                lingua: riga.dataset.lingua,
                // stessa storia per la provenienza. Se però il curatore ha riscritto il
                // testo, quel testo è suo e la provenienza cade apposta.
                generatoDa: testo === riga.dataset.testoOriginale ? riga.dataset.generatoDa : ''
            };
        }).filter(t => t.testo);

        if (testi.length === 0) {
            alert("Aggiungi almeno un testo all'item.");
            return;
        }

        const payload = {
            operaId: document.getElementById('itemWikidata').value.trim(),
            tipo: document.getElementById('itemTipo').value,
            museoId,
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
                // l'elenco a fianco deve mostrare subito quello che si è appena salvato
                await caricaItems();
                svuotaForm();
            } else {
                const data = await response.json();
                alert(data.message || "Errore durante il salvataggio dell'item.");
            }
        } catch (error) {
            alert("Errore di connessione al server.");
        }
    });
}
