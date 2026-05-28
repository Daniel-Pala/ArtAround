export function getUtenteLoggato() {
  const raw = localStorage.getItem('utente');
  return raw ? JSON.parse(raw) : null;
}

export async function fetchAuth(endpoint, options = {}) {
  const utente = getUtenteLoggato();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  
  if (utente && utente.token) {
    headers['Authorization'] = `Bearer ${utente.token}`;
  }

  // Se l'endpoint inizia già con /api non lo duplichiamo
  const targetUrl = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;

  // Il proxy di Vite intercetta il prefisso ed esegue il routing verso localhost:3000
  const res = await fetch(targetUrl, { ...options, headers });
  
  if (res.status === 401) {
    localStorage.removeItem('utente');
    window.location.href = '/login';
  }
  
  return res;
}