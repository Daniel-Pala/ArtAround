document.addEventListener('DOMContentLoaded', () => {
    console.log("App.js caricato: provo a recuperare i musei...");
    caricaMusei();

    // Colleghiamo la funzione di creazione al form dell'HTML
    const formCreaMuseo = document.getElementById('formCreaMuseo');
    if (formCreaMuseo) {
        formCreaMuseo.addEventListener('submit', creaMuseo);
    }
});

async function caricaMusei() {
    const tableBody = document.getElementById('tabella-musei');
    
    try {
        const response = await fetch('http://localhost:3000/api/musei');
        
        if (!response.ok) {
            throw new Error(`Errore dal server: ${response.status}`);
        }
        
        const musei = await response.json();
        console.log("Musei recuperati con successo:", musei);

        tableBody.innerHTML = ''; // Svuota la scritta "Caricamento in corso..."

        if (musei.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Nessun museo presente. Aggiungine uno!</td></tr>';
            return;
        }

        musei.forEach(museo => {
            const row = `
                <tr>
                    <td class="align-middle"><strong>${museo.nome}</strong></td>
                    <td class="align-middle">${museo.citta || 'N/D'}</td>
                    <td class="text-end">
                        <button class="btn btn-primary btn-sm me-2" onclick="selezionaMuseo('${museo._id}')">
                            Configura Visita
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="eliminaMuseo('${museo._id}')">
                            🗑️ Elimina
                        </button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Ops! C'è stato un problema nella fetch:", error);
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger fw-bold">Errore di connessione al backend. Assicurati che il server sia acceso (npm start).</td></tr>';
    }
}

function selezionaMuseo(id) {
    window.location.href = `configura.html?id=${id}`;
}

async function eliminaMuseo(id) {
    if (confirm("Sei sicuro di voler eliminare questo museo in modo definitivo?")) {
        try {
            const response = await fetch(`http://localhost:3000/api/musei/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log("Museo eliminato correttamente.");
                caricaMusei(); // Ricarica la tabella da zero
            } else {
                alert("Errore durante l'eliminazione dal database.");
            }
        } catch (error) {
            console.error("Errore nella richiesta di eliminazione:", error);
            alert("Impossibile connettersi al server per eliminare.");
        }
    }
}

async function creaMuseo(event) {
    // Evita che la pagina si ricarichi quando si clicca "Salva"
    event.preventDefault(); 

    const nome = document.getElementById('nomeMuseo').value;
    const citta = document.getElementById('cittaMuseo').value;

    if (!nome) {
        alert("Inserisci almeno il nome!");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/musei', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, citta })
        });

        if (response.ok) {
            console.log("Nuovo museo creato con successo!");
            // Chiude la finestra popup usando l'ID corretto del tuo HTML
            const modalElement = document.getElementById('modalNuovoMuseo');
            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modal.hide();
            
            // Resetta i campi testuali
            document.getElementById('nomeMuseo').value = '';
            document.getElementById('cittaMuseo').value = '';
            
            caricaMusei(); // Ricarica la tabella
        } else {
            alert("Errore dal server durante la creazione.");
        }
    } catch (error) {
        console.error("Errore creazione museo:", error);
        alert("Impossibile connettersi al server per creare il museo.");
    }
}