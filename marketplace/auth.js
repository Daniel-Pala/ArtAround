// =============================================================================
// auth.js — gestione sessione utente lato client
// =============================================================================
// Questo file fa due cose:
//   1) gestisce i form di login/register su login.html
//   2) esporta funzioni che le ALTRE pagine (index.html, configura.html)
//      possono usare per sapere chi è loggato e fare chiamate autenticate.
// =============================================================================


// -----------------------------------------------------------------------------
// COSTANTI: l'URL del backend in un punto solo, così se cambia lo cambi qui.
// -----------------------------------------------------------------------------
const API_URL = 'http://localhost:3000/api';


// -----------------------------------------------------------------------------
// FUNZIONI DI SESSIONE — usabili da qualsiasi pagina che includa auth.js
// -----------------------------------------------------------------------------

// Salva i dati dell'utente loggato nel localStorage del browser.
// localStorage accetta solo stringhe, quindi serializziamo con JSON.stringify.
function salvaUtente(utente) {
    localStorage.setItem('utente', JSON.stringify(utente));
}

// Legge l'utente loggato dal localStorage.
// Ritorna null se non c'è nessuno, altrimenti l'oggetto { userId, username, ruolo, token }.
function getUtenteLoggato() {
    const raw = localStorage.getItem('utente');
    if (!raw) return null;
    return JSON.parse(raw);  // riconverte la stringa JSON in oggetto JS
}

// Cancella la sessione e riporta al login.
function logout() {
    localStorage.removeItem('utente');
    window.location.href = 'login.html';
}

// "Guardia" da chiamare in cima alle pagine protette (index, configura).
// Se non c'è utente loggato, redirige al login.
function richiediLogin() {
    if (!getUtenteLoggato()) {
        window.location.href = 'login.html';
    }
}

// fetch con header Authorization: Bearer <token> automatico.
// Usalo per qualsiasi POST/PUT/DELETE che colpisce route protette del backend.
// Se il backend ritorna 401 (token scaduto/non valido) facciamo logout d'ufficio.
async function fetchAuth(url, options = {}) {
    const utente = getUtenteLoggato();
    const headers = { ...(options.headers || {}) };
    if (utente && utente.token) {
        headers['Authorization'] = `Bearer ${utente.token}`;
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
        // token mancante o scaduto: butta fuori l'utente
        logout();
    }
    return res;
}


// -----------------------------------------------------------------------------
// HELPER UI: mostra un messaggio di errore o successo nel box #messaggio
// -----------------------------------------------------------------------------
function mostraMessaggio(testo, tipo) {
    // tipo può essere 'success' o 'danger' (sono classi Bootstrap)
    const box = document.getElementById('messaggio');
    if (!box) return;  // se la pagina non ha il box, esci silenziosamente
    box.innerHTML = `<div class="alert alert-${tipo} py-2">${testo}</div>`;
}


// -----------------------------------------------------------------------------
// LOGICA SPECIFICA DELLA PAGINA login.html
// -----------------------------------------------------------------------------
// Tutto quello che riguarda i form sta dentro questo blocco "if",
// così se carichiamo auth.js da index.html (dove i form non esistono)
// non esplode.
// -----------------------------------------------------------------------------

const formLogin = document.getElementById('formLogin');
const formRegister = document.getElementById('formRegister');

if (formLogin) {
    // Se l'utente è GIÀ loggato e arriva su login.html, mandalo subito alla dashboard.
    if (getUtenteLoggato()) {
        window.location.href = 'index.html';
    }

    // ============ HANDLER LOGIN ============
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                mostraMessaggio(data.message || 'Errore di login', 'danger');
                return;
            }

            // Login riuscito: il backend ci ha mandato { userId, username, ruolo, token }.
            salvaUtente({
                userId: data.userId,
                username: data.username,
                ruolo: data.ruolo,
                token: data.token
            });

            window.location.href = 'index.html';

        } catch (err) {
            console.error(err);
            mostraMessaggio('Server non raggiungibile. Avvia il backend.', 'danger');
        }
    });
}

if (formRegister) {
    // ============ HANDLER REGISTRAZIONE ============
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const ruolo = document.getElementById('regRuolo').value;

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, ruolo })
            });

            const data = await response.json();

            if (!response.ok) {
                mostraMessaggio(data.message || 'Errore in registrazione', 'danger');
                return;
            }

            // Register ok → facciamo subito login per ottenere il token.
            mostraMessaggio('Account creato! Accesso in corso...', 'success');

            const loginResp = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const loginData = await loginResp.json();

            salvaUtente({
                userId: loginData.userId,
                username: loginData.username,
                ruolo: loginData.ruolo,
                token: loginData.token
            });

            window.location.href = 'index.html';

        } catch (err) {
            console.error(err);
            mostraMessaggio('Server non raggiungibile.', 'danger');
        }
    });
}
