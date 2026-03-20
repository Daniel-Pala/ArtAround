// Appena la pagina si carica, eseguiamo questa funzione
document.addEventListener('DOMContentLoaded', () => {
    caricaMusei();
});

// Funzione che chiama l'API costruita da Daniel
async function caricaMusei() {
    try {
        // Facciamo una chiamata GET alla rotta creata da Daniel
        const response = await fetch('http://localhost:3000/api/musei');
        
        if (!response.ok) throw new Error("Errore nella risposta del server");
        
        const musei = await response.json(); // Trasformiamo la risposta in JSON
        disegnaTabella(musei);

    } catch (error) {
        console.error('Errore durante il caricamento:', error);
        document.getElementById('tabella-musei').innerHTML = `
            <tr><td colspan="3" class="text-danger">Impossibile collegarsi al database. Assicurati che il backend sia acceso.</td></tr>
        `;
    }
}

// Funzione che prende i dati JSON e costruisce le righe HTML
function disegnaTabella(musei) {
    const tbody = document.getElementById('tabella-musei');
    tbody.innerHTML = ''; // Svuotiamo la scritta "Caricamento in corso..."

    if (musei.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Nessun museo trovato nel database.</td></tr>';
        return;
    }

    // Per ogni museo, creiamo una riga (<tr>) e la aggiungiamo alla tabella
    musei.forEach(museo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${museo.nome}</strong></td>
            <td>${museo.citta || 'Non specificata'}</td>
            <td>
                <button class="btn btn-success btn-sm" onclick="selezionaMuseo('${museo._id}')">
                    Configura Visita
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function selezionaMuseo(id) {
    // In futuro, questo manderà alla pagina della singola visita
    alert("Hai cliccato il museo con ID: " + id);
}