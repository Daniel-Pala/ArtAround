// =============================================================================
// qr.js — foglio di QR code da stampare e appendere di fianco alle opere
// =============================================================================
// Dentro ogni QR c'e' solo il codice Wikidata dell'opera (es. Q12418): il QR non
// e' un codice registrato da nessuna parte, e' il disegno di una stringa, quindi
// ci mettiamo quella che il progetto usa gia' per identificare le opere.
// Il PNG lo genera il backend (GET /api/items/qr/:operaId), qui basta un <img>.
// =============================================================================

richiediLogin();

document.addEventListener('DOMContentLoaded', async () => {
    const museoId = new URLSearchParams(window.location.search).get('id');
    if (!museoId) {
        window.location.href = 'index.html';
        return;
    }

    const museo = await (await fetch(`${API_URL}/musei/${museoId}`)).json();
    document.getElementById('titoloPagina').textContent = `QR code — ${museo.nome}`;

    const items = await (await fetch(`${API_URL}/items?museoId=${museoId}`)).json();
    const lista = document.getElementById('listaQr');

    if (items.length === 0) {
        lista.innerHTML = `<p class="text-muted">Questo museo non ha ancora item.</p>`;
        return;
    }

    // Piu' opere possono raccontare la stessa cosa (una descrizione base e un
    // approfondimento hanno lo stesso operaId): di cartellini ne serve uno solo.
    const opere = new Map();
    items.forEach(item => {
        if (!opere.has(item.operaId)) opere.set(item.operaId, item.titolo);
    });

    lista.innerHTML = [...opere].map(([operaId, titolo]) => `
        <div class="col-6 col-md-4 col-lg-3">
            <div class="cartellino h-100">
                <img src="${API_URL}/items/qr/${operaId}" alt="QR code di ${titolo}">
                <div class="fw-semibold mt-2 small">${titolo}</div>
                <div class="text-muted" style="font-size:.75rem">${operaId}</div>
            </div>
        </div>`).join('');
});
