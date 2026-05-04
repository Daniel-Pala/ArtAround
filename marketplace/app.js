// =============================================================================
// app.js — dashboard musei (index.html)
// =============================================================================
// Lo <script src="app.js"> sta in fondo al <body> di index.html, quindi quando
// questo file parte il DOM è già completo. Non serve DOMContentLoaded.
// =============================================================================


// --- GUARDIA DI ACCESSO ---------------------------------------------------
// richiediLogin() vive in auth.js: se non c'è utente in localStorage redirige
// a login.html e tutto quello che c'è sotto non viene eseguito.
richiediLogin();


// --- NAVBAR: saluto utente + logout ---------------------------------------
// Sostituiamo il contenuto di #userBox (che nell'HTML contiene già il bottone
// Logout) aggiungendo il saluto. Poi riattacchiamo il listener al bottone
// nuovo (quello vecchio è stato distrutto dall'innerHTML).
const utente = getUtenteLoggato();
document.getElementById('userBox').innerHTML = `
    <span class="navbar-text text-light me-3">
        Ciao, <strong>${utente.username}</strong>
    </span>
    <button class="btn btn-outline-light btn-sm" id="btnLogout">
        <i class="bi bi-box-arrow-right me-1"></i>Logout
    </button>
`;
document.getElementById('btnLogout').addEventListener('click', logout);


// --- CARICAMENTO INIZIALE -------------------------------------------------
getMusei();


// --- FUNZIONI -------------------------------------------------------------

async function getMusei() {
    try {
        const response = await fetch('http://localhost:3000/api/musei');
        const musei = await response.json();

        // Aggiorna il contatore in alto
        document.getElementById('countMusei').innerText = musei.length;

        const container = document.getElementById('listaMusei');
        container.innerHTML = '';

        if (musei.length === 0) {
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
        console.error("Errore nel caricamento:", error);
    }
}

document.getElementById('formMuseo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nomeMuseo').value;
    const citta = document.getElementById('cittaMuseo').value;

    try {
        const response = await fetch('http://localhost:3000/api/musei', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, citta })
        });

        if (response.ok) {
            location.reload();
        }
    } catch (error) {
        alert("Errore durante il salvataggio");
    }
});

async function eliminaMuseo(id) {
    if (!confirm("Sei sicuro di voler eliminare questo museo?")) return;

    try {
        const response = await fetch(`http://localhost:3000/api/musei/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            getMusei();
        } else {
            alert("Errore durante l'eliminazione");
        }
    } catch (error) {
        console.error("Errore:", error);
    }
}
