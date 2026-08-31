// qr.js — codici QR delle opere di un museo, da stampare e appendere ai quadri
// Dentro ogni QR c'e' solo il codice Wikidata dell'opera (es. Q3907499): il QR non
// e' un codice registrato da nessuna parte, e' il disegno di una stringa, quindi ci
// mettiamo quella che il progetto usa gia' per identificare le opere.
// Il PNG lo genera il backend (GET /api/items/qr/:operaId), qui basta un <img>.

richiediLogin();

let opere = [];   // [operaId, titolo] — un'opera sola anche se ha piu' item

document.addEventListener('DOMContentLoaded', async () => {
    const museoId = new URLSearchParams(window.location.search).get('id');
    if (!museoId) {
        window.location.href = 'index.html';
        return;
    }

    const museo = await (await fetch(`${API_URL}/musei/${museoId}`)).json();
    document.getElementById('titoloPagina').textContent = `Codici QR della ${museo.nome}`;

    const items = await (await fetch(`${API_URL}/items?museoId=${museoId}`)).json();

    // Piu' item possono parlare della stessa opera (una descrizione base e un
    // approfondimento hanno lo stesso operaId): di cartellini ne serve uno solo.
    const perOpera = new Map();
    items.forEach(item => {
        if (!perOpera.has(item.operaId)) perOpera.set(item.operaId, item.titolo);
    });
    opere = [...perOpera];

    disegna(opere);
});

function disegna(elenco) {
    document.getElementById('listaQr').innerHTML = elenco.map(([operaId, titolo]) => `
        <div class="col-6 col-md-4 col-lg-3 col-cartellino" id="col-${operaId}">
            <div class="cartellino">
                <button class="btn btn-sm btn-light border btn-stampa"
                        onclick="stampaUno('${operaId}')" aria-label="Stampa il cartellino di ${titolo}">
                    <i class="bi bi-printer"></i>
                </button>
                <img src="${API_URL}/items/qr/${operaId}" alt="Codice QR di ${titolo}">
                <div class="titolo">${titolo}</div>
                <div class="codice">${operaId}</div>
            </div>
        </div>`).join('');

    document.getElementById('nessunRisultato').classList.toggle('d-none', elenco.length > 0);
}

// Stampa un cartellino solo: nasconde gli altri, apre la stampa e rimette a posto.
// Dalla finestra di stampa si puo' anche scegliere "Salva come PDF".
function stampaUno(operaId) {
    document.body.classList.add('solo-uno');
    document.getElementById(`col-${operaId}`).classList.add('da-stampare');
    window.print();
}

window.addEventListener('afterprint', () => {
    document.body.classList.remove('solo-uno');
    document.querySelector('.da-stampare')?.classList.remove('da-stampare');
});

document.getElementById('ricerca').addEventListener('input', (e) => {
    const cercato = e.target.value.trim().toLowerCase();
    disegna(opere.filter(([, titolo]) => titolo.toLowerCase().includes(cercato)));
});
