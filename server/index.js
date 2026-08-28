import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const sessioni = new Map();

function generaCodiceDefault() {
  return 'VISITA-' + Math.floor(1000 + Math.random() * 9000);
}

io.on('connection', (socket) => {
  // DOCENTE: Crea la sessione con codice mnemonico/personalizzato
  socket.on('docente:crea', ({ visitaId, codicePersonalizzato }) => {
    const codice = (codicePersonalizzato && codicePersonalizzato.trim() !== '') 
      ? codicePersonalizzato.trim().toUpperCase() 
      : generaCodiceDefault();

    sessioni.set(codice, {
      visitaId,
      docenteId: socket.id,
      studenti: [],
      indiceAttuale: 0,
      registroAttivita: [],
      risultatiQuiz: {}
    });
    
    socket.join(codice); 
    socket.emit('sessione:creata', { codice });
  });

  // STUDENTE: Ingresso nella sessione
  socket.on('studente:entra', ({ codice, nome }) => {
    const sessione = sessioni.get(codice.toUpperCase());
    if (sessione) {
      socket.join(codice.toUpperCase());
      const nuovoStudente = { id: socket.id, nome: nome || 'Studente Anonimo' };
      sessione.studenti.push(nuovoStudente);
      
      socket.emit('stato:item', { 
        indice: sessione.indiceAttuale, 
        visitaId: sessione.visitaId 
      });

      io.to(sessione.docenteId).emit('sessione:studenti', sessione.studenti);
    } else {
      socket.emit('sessione:errore', 'Codice sessione non valido');
    }
  });

  // DOCENTE: Navigazione tappe
  socket.on('docente:vaiA', ({ codice, indice }) => {
    const sessione = sessioni.get(codice);
    if (sessione && sessione.docenteId === socket.id) {
      sessione.indiceAttuale = indice;
      io.to(codice).emit('stato:item', { 
        indice: sessione.indiceAttuale, 
        visitaId: sessione.visitaId 
      });
    }
  });

  // MONITORAGGIO: Lo studente traccia le sue interazioni (durata, livello, domande vocali)
  socket.on('studente:azione', ({ codice, nome, tipo, dettaglio }) => {
    const sessione = sessioni.get(codice.toUpperCase());
    if (sessione) {
      const evento = { nome, tipo, dettaglio, orario: new Date().toLocaleTimeString() };
      sessione.registroAttivita.unshift(evento);
      io.to(sessione.docenteId).emit('docente:nuovaAttivita', evento);
    }
  });

  // QUIZ: Il docente lancia il quiz alla classe
  socket.on('docente:avviaQuiz', ({ codice, domande }) => {
    const sessione = sessioni.get(codice);
    if (sessione && sessione.docenteId === socket.id) {
      io.to(codice).emit('quiz:avvia', { domande });
    }
  });

  // QUIZ: Invio risposte da parte dello studente
  socket.on('studente:inviaQuiz', ({ codice, nome, punteggio, totale }) => {
    const sessione = sessioni.get(codice.toUpperCase());
    if (sessione) {
      const voto = Math.round((punteggio / totale) * 10);
      sessione.risultatiQuiz[socket.id] = { nome, punteggio, totale, voto };
      io.to(sessione.docenteId).emit('docente:risultatiQuiz', Object.values(sessione.risultatiQuiz));
    }
  });

  // DISCONNESSIONI
  socket.on('disconnect', () => {
    for (const [codice, sessione] of sessioni.entries()) {
      if (sessione.docenteId !== socket.id) {
        const index = sessione.studenti.findIndex(s => s.id === socket.id);
        if (index !== -1) {
          sessione.studenti.splice(index, 1);
          io.to(sessione.docenteId).emit('sessione:studenti', sessione.studenti);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server attivo su porta ${PORT}`));