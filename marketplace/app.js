const API_URL = 'http://localhost:3000/api/musei';

// 1. Caricamento iniziale
document.addEventListener('DOMContentLoaded', () => {
    caricaMusei();
});

// 2. Funzione per LEGGERE i musei (GET)
async function caricaMusei() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Errore nel server");
        
        const musei = await response.json();
        disegnaTabella(musei);
    } catch (error) {
        console.error('Errore:', error);
        document.getElementById('tabella-musei').innerHTML = `
            <tr><td colspan="3" class="text-center text-danger">Errore di connessione al backend.</td></tr>
        `;
    }
}

// 3. Funzione per mostrare i dati nella tabella
function disegnaTabella(musei) {
    const tbody = document.getElementById('tabella-musei');
    tbody.innerHTML = '';

    if (musei.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Nessun museo in archivio.</td></tr>';
        return;
    }

    musei.forEach(museo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${museo.nome}</strong></td>
            <td>${museo.citta || 'N/A'}</td>
            <td class="text-end">
                <button class="btn btn-outline-primary btn-sm" onclick="selezionaMuseo('${museo._id}')">
                    Configura Visita
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 4. Funzione per CREARE un museo (POST)
document.getElementById('formCreaMuseo').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        nome: document.getElementById('nomeMuseo').value,
        citta: document.getElementById('cittaMuseo').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Museo creato!');
            // Chiudi il modal e resetta
            const modalEl = document.getElementById('modalNuovoMuseo');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            document.getElementById('formCreaMuseo').reset();
            
            // Aggiorna la lista subito
            caricaMusei();
        }
    } catch (error) {
        alert('Errore durante il salvataggio.');
    }
});

function selezionaMuseo(id) {
    alert("Hai selezionato il museo ID: " + id);
}