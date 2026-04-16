document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const museoId = urlParams.get('id');

    if (!museoId) {
        window.location.href = 'index.html';
        return;
    }

    // Titolo di default in attesa del caricamento
    const titoloElement = document.getElementById('titoloMuseo');
    const infoElement = document.getElementById('infoMuseo');
    const containerOpere = document.getElementById('listaOpere');

    try {
        // 1. Recupero i dettagli del Museo
        const museoResponse = await fetch(`http://localhost:3000/api/musei/${museoId}`);
        if (museoResponse.ok) {
            const museo = await museoResponse.json();
            titoloElement.innerText = `Configurazione: ${museo.nome}`;
            infoElement.innerText = `Sede di ${museo.citta || 'N/A'}.`;
        }

        // 2. Recupero le opere (items) filtrate per questo museo
        const opereResponse = await fetch(`http://localhost:3000/api/items?museoId=${museoId}`);
        
        if (opereResponse.ok) {
            const opere = await opereResponse.json();
            
            // Puliamo il contenitore (togliamo l'alert azzurro)
            containerOpere.className = "mt-3"; 
            
            if (opere.length === 0) {
                containerOpere.innerHTML = `
                    <div class="alert alert-warning shadow-sm">
                        Nessuna opera presente in questo museo per ora.
                    </div>`;
            } else {
                let htmlLista = '<ul class="list-group shadow-sm">';
                
                opere.forEach(opera => {
                    const nomeAutore = opera.autoreId ? opera.autoreId.username : 'Autore sconosciuto';
                    
                    htmlLista += `
                        <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                            <div>
                                <h6 class="mb-0 text-dark">🎨 ${opera.titolo || 'Opera senza titolo'}</h6>
                                <small class="text-muted">Autore: ${nomeAutore}</small>
                            </div>
                            <button class="btn btn-sm btn-outline-success px-3 rounded-pill" onclick="aggiungiAVisita('${opera._id}')">
                                + Aggiungi a Visita
                            </button>
                        </li>
                    `;
                });
                
                htmlLista += '</ul>';
                containerOpere.innerHTML = htmlLista;
            }
        }
    } catch (error) {
        console.error("Errore nel caricamento dati:", error);
        titoloElement.innerText = "Errore di connessione";
        infoElement.innerText = "Controlla che il server sia attivo.";
    }
});

// Funzione placeholder per il futuro
function aggiungiAVisita(operaId) {
    console.log("Opera aggiunta alla visita:", operaId);
    alert("Opera selezionata! In futuro la aggiungeremo al percorso della visita.");
}