document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const museoId = urlParams.get('id');

    if (!museoId) {
        window.location.href = 'index.html';
        return;
    }

    // Mostriamo l'ID di default, così se il fetch fallisce l'utente vede comunque qualcosa
    document.getElementById('titoloMuseo').innerText = `Configurazione Museo: ${museoId}`;

    try {
        const response = await fetch(`http://localhost:3000/api/musei/${museoId}`);
        
        // Se Daniel ha implementato la rotta, allora prendiamo il nome vero
        if (response.ok) {
            const museo = await response.json();
            document.getElementById('titoloMuseo').innerText = `Configurazione: ${museo.nome}`;
            document.getElementById('infoMuseo').innerText = `Sede di ${museo.citta || 'N/A'}.`;
        } else {
            // Se la rotta non esiste ancora, scriviamo un messaggio gentile
            console.log("Nota: Il backend non ha ancora la rotta per i dettagli singoli.");
            document.getElementById('infoMuseo').innerText = "Dettagli del museo in attesa di sincronizzazione dal database.";
        }
    } catch (error) {
        // Se il server è proprio spento, non blocchiamo la pagina
        console.log("Server offline o rotta mancante.");
        document.getElementById('infoMuseo').innerText = "Dettagli non disponibili (Server Offline).";
    }
});