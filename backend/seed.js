// backend/seed.js — riempie il database con dati di presentazione.
// Si lancia a mano da dentro backend/: `cd backend && node seed.js` (il .env sta li').
// Cancella tutto e ricrea da zero.
//
// I codici delle opere sono i veri identificativi Wikidata (P195 = "collezione:
// Pinacoteca Nazionale di Bologna", Q1103550) e le immagini arrivano da Wikimedia
// Commons: la specifica chiede identificativi universali, non nomi inventati.
// Le stesse sigle sono le chiavi di `posizioni` in navigator/public/config/pinacoteca-bologna.json,
// che e' quello che permette al Player di disegnare i segnaposti sulla mappa.
//
// Dentro OPERE ci sono tre casi:
//  - l'item su un'opera esposta (la maggioranza);
//  - un SECONDO item sulla stessa opera, scritto da un altro autore e con un taglio
//    diverso: lo chiede la specifica ("multipli item per lo stesso oggetto di visita"),
//    e ha una `chiave` propria perche' il codice Wikidata da solo non li distingue;
//  - l'approfondimento (`tipo: 'approfondimento'`), che parla di un movimento o di un
//    artista e non di un oggetto esposto: il suo codice Wikidata e' quello del movimento
//    o della persona, quindi non compare fra le posizioni sulla mappa.

const path = require('path');
// come in index.js: il .env si cerca accanto al codice, non nella cartella corrente
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const Utente = require('./src/models/Utente');
const Museo = require('./src/models/Museo');
const Item = require('./src/models/Item');
const Visita = require('./src/models/Visita');

const img = (file) => `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=600`;

// Le 15 opere. `sala` serve solo a me per raggrupparle, nel database non finisce.
const OPERE = [
  {
    operaId: 'Q3907499', sala: 1, autore: 'autore1',
    titolo: 'Polittico di Bologna',
    descrizione: 'Giotto, 1333 circa. Tempera e oro su tavola, dalla chiesa di Santa Maria degli Angeli.',
    autoreOpera: 'Giotto', stile: 'Gotico',
    immagine: img('Giotto.%20Polyptych.%201330-35.%2091x340cm.%20Pinacoteca%2C%20Bologna..jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Un quadro tutto dorato, vecchio di settecento anni.' },
      { durata: '15s', livello: 'infantile', testo: 'Guarda quanto oro! Settecento anni fa non esisteva la vernice dorata: quello e\' oro vero, battuto finissimo e incollato sul legno. Al centro c\'e\' Maria con Gesu\' bambino.' },
      { durata: '1min', livello: 'medio', testo: 'E\' l\'unica opera firmata da Giotto conservata a Bologna, dipinta intorno al 1333 per la chiesa di Santa Maria degli Angeli. Un polittico e\' un dipinto composto da piu\' tavole affiancate: qui al centro c\'e\' la Madonna col Bambino, ai lati quattro santi. Il fondo d\'oro non e\' decorazione: nella pittura medievale rappresenta la luce divina, uno spazio senza luogo ne\' tempo. Giotto pero\' comincia a incrinare quella convenzione, dando ai volti un peso e un volume che i suoi contemporanei non dipingevano ancora.' },
      { durata: '4min', livello: 'specialistico', testo: 'Il polittico proviene dalla chiesa bolognese di Santa Maria degli Angeli e reca la firma OPUS MAGISTRI IOCTI DE FLORENTIA, formula che nella bottega giottesca indica la responsabilita\' del maestro piu\' che l\'esecuzione integrale: la critica vi riconosce da tempo un intervento consistente di collaboratori, in particolare nelle tavole laterali. La datazione al 1333 circa poggia su ragioni stilistiche e sul confronto con la coeva attivita\' padana. L\'impianto e\' ancora quello del polittico gotico a cuspidi, ma la costruzione dei volumi, l\'aggetto dei troni e la resa dei panneggi appartengono al linguaggio elaborato a Padova negli Scrovegni. Il fondo oro conserva la funzione simbolica tradizionale mentre le figure reclamano uno spazio misurabile: e\' questa tensione, non ancora risolta, il vero interesse storico dell\'opera.' }
    ]
  },
  {
    operaId: 'Q27345212', sala: 1, autore: 'autore1',
    titolo: 'San Giorgio e il drago',
    descrizione: 'Vitale da Bologna, 1330-1335. Tempera su tavola.',
    autoreOpera: 'Vitale da Bologna', stile: 'Gotico',
    immagine: img('Vitale%20da%20bologna%2C%20san%20giorgio%20libera%20la%20principessa%2C%201330-35%20ca.%2C%2001.jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Un cavaliere a cavallo che combatte un drago.' },
      { durata: '15s', livello: 'infantile', testo: 'Il cavallo si impenna, la lancia si spezza contro il drago e San Giorgio sta quasi per cadere. Il pittore lo ha dipinto nel momento piu\' pericoloso, non quando ha gia\' vinto.' },
      { durata: '1min', livello: 'elementare', testo: 'Vitale da Bologna dipinge questa tavola intorno al 1330. La storia e\' famosa: un drago terrorizza una citta\', San Giorgio arriva e lo affronta. Quasi tutti i pittori lo mostrano tranquillo, vincitore. Vitale invece sceglie l\'istante dello scontro: il cavallo si torce all\'indietro, la lancia si e\' gia\' spezzata, l\'equilibrio del cavaliere e\' precario. E\' un modo di dipingere pieno di movimento, insolito per l\'epoca, e per questo Vitale venne soprannominato "Vitale delle Madonne" solo piu\' tardi, quando cambio\' registro.' },
      { durata: '4min', livello: 'specialistico', testo: 'La tavola e\' il punto piu\' alto della fase giovanile di Vitale e uno dei documenti fondamentali della scuola bolognese del Trecento. La composizione rifiuta la staticita\' iconica del modello bizantino e adotta una torsione a spirale che coinvolge cavallo, cavaliere e drago in un unico moto: la lancia spezzata, dettaglio raro nell\'iconografia, sposta il racconto dal trionfo compiuto al conflitto in atto. La critica ha collegato questa scelta alla cultura figurativa d\'oltralpe che circolava a Bologna attraverso i manoscritti miniati, ambito in cui la citta\' era all\'avanguardia europea. Il risultato e\' un espressionismo gotico che non ha equivalenti nella coeva pittura toscana e che restera\' senza seguito diretto.' }
    ]
  },
  {
    operaId: 'Q3889219', sala: 1, autore: 'autore1',
    titolo: 'Pala dei Mercanti',
    descrizione: 'Francesco del Cossa, 1474. Tempera su tavola, dal Foro dei Mercanti.',
    autoreOpera: 'Francesco del Cossa', stile: 'Rinascimento',
    immagine: img('Francesco%20del%20Cossa%20025.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'Al centro la Madonna su un trono altissimo, di lato San Petronio che tiene in mano un modellino di Bologna: e\' il santo protettore della citta\'.' },
      { durata: '1min', livello: 'medio', testo: 'Dipinta nel 1474 per la sede della corporazione dei mercanti bolognesi. Francesco del Cossa viene da Ferrara e porta con se\' un gusto per l\'architettura dipinta quasi ossessivo: il trono e\' un monumento classico con colonne, cornici e marmi finti resi con precisione da scenografo. A sinistra San Petronio regge una Bologna in miniatura, con le due torri riconoscibili. In basso a destra, inginocchiato, c\'e\' il committente Alberto de\' Cattanei, ritratto dal vero.' },
      { durata: '4min', livello: 'specialistico', testo: 'La pala segna l\'approdo bolognese di Cossa dopo la rottura con la corte estense, documentata dalla nota lettera a Borso d\'Este del 1470. L\'apparato architettonico deriva dalla lezione di Piero della Francesca filtrata attraverso l\'esperienza di Schifanoia, ma la durezza metallica dell\'incarnato e la definizione grafica dei contorni restano inconfondibilmente ferraresi. Il modellino urbano retto da San Petronio ha valore documentario: registra lo stato delle torri prima degli interventi successivi. La figura del donatore, collocata nello stesso spazio prospettico dei santi e non in scala ridotta secondo l\'uso medievale, testimonia il mutato statuto sociale della committenza corporativa nella Bologna del secondo Quattrocento.' }
    ]
  },
  {
    operaId: 'Q3947685', sala: 1, autore: 'autore2',
    titolo: 'San Michele Arcangelo',
    descrizione: "Ercole de' Roberti, 1470 circa. Tempera su tavola.",
    autoreOpera: "Ercole de' Roberti", stile: 'Rinascimento',
    immagine: img('Ercole%20de%27%20roberti%2C%20san%20michele%20arcangelo.jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Un angelo con la spada e una bilancia in mano.' },
      { durata: '15s', livello: 'elementare', testo: 'San Michele tiene una bilancia perche\', secondo il racconto, pesa le anime. Guarda le ali: sono dipinte come quelle di un uccello vero, piuma per piuma.' },
      { durata: '1min', livello: 'medio', testo: "Ercole de' Roberti e' il piu' giovane dei grandi ferraresi e il piu' nervoso. Questo San Michele ha un corpo sottile, quasi tagliente, e una corazza resa con riflessi metallici durissimi. La bilancia allude alla pesatura delle anime nel giorno del giudizio. Rispetto ai suoi maestri, Roberti allunga le figure e carica ogni contorno di tensione: e' una pittura che sembra incisa piu' che stesa." },
      { durata: '4min', livello: 'specialistico', testo: "La tavola appartiene alla fase precoce dell'artista, quando il linguaggio di Cossa e Tura non e' ancora stato rielaborato in senso autonomo. L'anatomia allungata e la definizione lineare dei contorni derivano da Tura; l'attenzione al dettaglio metallico e la costruzione della corazza rimandano invece alla cultura fiamminga circolante a Ferrara attraverso la collezione estense. Il motivo della psicostasia, la pesatura delle anime, e' iconografia bizantina passata all'Occidente attraverso i cicli del Giudizio: qui viene isolata dal contesto narrativo e trasformata in attributo, secondo una tendenza tipica della devozione tardoquattrocentesca." }
    ]
  },
  {
    operaId: 'Q16038421', sala: 2, autore: 'autore1',
    titolo: 'Pala Bentivoglio',
    descrizione: 'Francesco Francia, 1498-1499. Olio su tavola, dalla cappella Bentivoglio in San Giacomo Maggiore.',
    autoreOpera: 'Francesco Francia', stile: 'Rinascimento',
    immagine: img('Francesco%20Francia%20-%20Adoration%20of%20the%20Child%20-%20WGA08169.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'Una scena calma e simmetrica: la Madonna al centro, i santi disposti a specchio, tutto in ordine. Era la pala della famiglia piu\' potente di Bologna.' },
      { durata: '1min', livello: 'medio', testo: 'Commissionata dai Bentivoglio, che governavano Bologna, per la loro cappella in San Giacomo Maggiore. Francesco Francia era orafo prima che pittore, e si vede: le superfici sono levigate, i colori smaltati, ogni dettaglio rifinito. La composizione e\' costruita sulla simmetria, con la Madonna esattamente al centro e i santi bilanciati ai lati. E\' la formula della "sacra conversazione", cioe\' santi di epoche diverse riuniti in un unico spazio silenzioso.' },
      { durata: '4min', livello: 'specialistico', testo: 'La pala e\' documento della politica culturale bentivolesca nel decennio precedente la caduta della signoria. Francia elabora un classicismo di mediazione fra la tradizione ferrarese, la lezione peruginesca e le suggestioni umbro-romane, costruendo un idioma che sara\' determinante per la formazione del giovane Raffaello. La qualita\' smaltata della stesura tradisce il tirocinio da orafo, mestiere che Francia non abbandono\' mai e che gli valse la direzione della zecca cittadina. L\'impianto simmetrico e la costruzione prospettica dell\'abside dipinta dichiarano l\'adesione al modello della sacra conversazione italiana centro-settentrionale.' }
    ]
  },
  {
    operaId: 'Q3213771', sala: 2, autore: 'autore2',
    titolo: 'Madonna in gloria e santi',
    descrizione: 'Pietro Perugino, 1500 circa. Olio su tavola, dalla chiesa di San Giovanni in Monte.',
    autoreOpera: 'Pietro Perugino', stile: 'Rinascimento',
    immagine: img('Pietro%20Perugino%20cat59.jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'La Madonna sta in cielo, i santi la guardano da sotto.' },
      { durata: '15s', livello: 'elementare', testo: 'Il quadro e\' diviso in due: sopra il cielo con la Madonna, sotto la terra con i santi. Guarda i loro volti: sono tutti tranquilli, nessuno si agita.' },
      { durata: '1min', livello: 'medio', testo: 'Perugino dipinge questa pala intorno al 1500, negli anni della sua massima fama. La composizione e\' divisa in due registri: la zona celeste in alto e quella terrestre in basso. La sua invenzione piu\' riconoscibile e\' l\'atmosfera: figure dai gesti misurati, teste leggermente inclinate, un paesaggio che sfuma in lontananza in azzurro. E\' questa dolcezza che il giovane Raffaello, suo allievo, studia e poi supera.' },
      { durata: '4min', livello: 'specialistico', testo: 'La tavola proviene da San Giovanni in Monte e appartiene alla stagione di massima diffusione della formula peruginesca, quando la bottega opera contemporaneamente fra Perugia, Firenze e Roma. La partizione in registri sovrapposti, il ritmo cadenzato delle figure e la resa atmosferica del fondale costituiscono un repertorio ormai codificato, che la critica cinquecentesca gia\' rimprovero\' come ripetitivo: Vasari parla esplicitamente di formule riusate. Il valore documentario dell\'opera sta pero\' proprio in questo, nel mostrare il modello su cui Raffaello si forma prima del soggiorno fiorentino e da cui prende congedo con la Deposizione Baglioni del 1507.' }
    ]
  },
  {
    operaId: 'Q1103801', sala: 2, autore: 'autore1',
    titolo: 'Estasi di santa Cecilia',
    descrizione: 'Raffaello Sanzio, 1514-1516. Olio su tavola trasportato su tela, dalla chiesa di San Giovanni in Monte.',
    autoreOpera: 'Raffaello Sanzio', stile: 'Rinascimento',
    immagine: img('Bologna%20Pinacoteca%20Nazionale%20-%20Rafa%C3%ABl%20Santi%20%281483-1520%29%20-%20Heilige%20Cecilia%20in%20extase%20met%20Paulus%2C%20Johannes%20%28evangelist%29%2C%20Augustinus%20en%20Maria%20Magdalena%20-%2026-04-2012%209-13-18.jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'La donna al centro ascolta una musica che noi non sentiamo.' },
      { durata: '15s', livello: 'infantile', testo: 'Guarda per terra: strumenti musicali rotti, buttati via. Cecilia li ha lasciati cadere perche\' ha sentito cantare gli angeli in cielo, e nessuna musica umana puo\' competere.' },
      { durata: '1min', livello: 'medio', testo: 'E\' il capolavoro della Pinacoteca. Raffaello lo dipinge intorno al 1515 per la chiesa bolognese di San Giovanni in Monte. Cecilia, patrona della musica, alza gli occhi verso un coro di angeli e lascia scivolare l\'organo portativo dalle mani; ai suoi piedi altri strumenti giacciono rotti. Il significato e\' preciso: la musica terrena tace davanti a quella celeste. Attorno a lei quattro santi reagiscono in modo diverso, e questa varieta\' di risposte a un unico evento e\' l\'invenzione piu\' moderna del quadro.' },
      { durata: '4min', livello: 'specialistico', testo: 'La pala fu commissionata da Elena Duglioli dall\'Olio per la sua cappella in San Giovanni in Monte e giunse a Bologna intorno al 1515. La natura morta di strumenti in primo piano e\' tradizionalmente attribuita a Giovanni da Udine, collaboratore di Raffaello specializzato in questo genere. La composizione articola quattro reazioni distinte all\'evento estatico: il raccoglimento di Paolo, lo sguardo diretto della Maddalena verso lo spettatore, il dialogo fra Giovanni e Agostino. Vasari registra l\'impressione profonda che l\'opera produsse sui pittori emiliani; Francesco Francia, secondo un aneddoto della tradizione, ne sarebbe rimasto talmente turbato da ammalarsi. L\'opera fu requisita dai francesi nel 1796, trasferita a Parigi e restituita nel 1815, occasione in cui subi\' il trasporto dalla tavola alla tela.' }
    ]
  },
  {
    operaId: 'Q3842737', sala: 2, autore: 'autore2',
    titolo: 'Madonna di Santa Margherita',
    descrizione: 'Parmigianino, 1529. Olio su tavola.',
    autoreOpera: 'Parmigianino', stile: 'Manierismo',
    immagine: img('Parmigianino%20-%20Madonna%20and%20Child%20with%20Saints%20Margaret%2C%20Jerome%2C%20Petronius%20and%20Michael.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'Le figure sono ammassate una sull\'altra e sembrano venirti addosso. Non e\' un errore: il pittore lo ha fatto apposta.' },
      { durata: '1min', livello: 'medio', testo: 'Parmigianino dipinge questa pala nel 1529, durante il soggiorno bolognese seguito al sacco di Roma. Rispetto alle sacre conversazioni ordinate del secolo precedente qui e\' cambiato tutto: le figure sono compresse in primo piano, i corpi si allungano, il Bambino si sporge verso Santa Margherita con un movimento che rompe l\'equilibrio. E\' il linguaggio che verra\' chiamato manierismo: l\'eleganza prende il posto della naturalezza, e la deviazione dalla regola diventa il punto.' },
      { durata: '4min', livello: 'specialistico', testo: 'Eseguita per la chiesa bolognese di Santa Margherita durante il soggiorno che segue la fuga da Roma del 1527. L\'opera documenta il passaggio dal classicismo raffaellesco assimilato negli anni romani a una sintassi deliberatamente instabile: compressione dello spazio, dilatazione delle proporzioni, torsione degli assi. Il confronto con l\'Estasi di santa Cecilia, presente nella stessa citta\' e nella stessa raccolta, e\' istruttivo perche\' misura in quindici anni la distanza percorsa dalla pittura italiana. Vale ricordare i rapporti documentati fra Parmigianino e Girolamo Mazzola Bedoli, suo parente e collaboratore, la cui produzione e\' anch\'essa rappresentata in questa raccolta.' }
    ]
  },
  {
    operaId: 'Q126599960', sala: 2, autore: 'autore2',
    titolo: 'Ritratto di frate',
    descrizione: 'Girolamo Mazzola Bedoli, meta\' del XVI secolo. Olio su tela.',
    autoreOpera: 'Girolamo Mazzola Bedoli', stile: 'Manierismo',
    immagine: img('Girolamo-Mazzola-Bedoli-San-Tommaso-dAquino.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'Un ritratto di frate. Non sappiamo con certezza chi fosse: il nome si e\' perso.' },
      { durata: '1min', livello: 'medio', testo: 'Girolamo Mazzola Bedoli era parente e collaboratore del Parmigianino, di cui adotto\' il linguaggio elegante attenuandone gli eccessi. Questo ritratto e\' un buon esempio del suo modo: la posa e\' sobria, l\'attenzione va tutta al volto e alle mani, e l\'identita\' del soggetto e\' stata proposta ma non dimostrata. E\' anche un caso utile per capire come funziona un museo: molte opere arrivano fino a noi senza un\'attribuzione certa del soggetto.' },
      { durata: '4min', livello: 'specialistico', testo: 'Bedoli rappresenta il canale principale di trasmissione del linguaggio parmigianinesco nella seconda meta\' del Cinquecento emiliano. Nella ritrattistica attenua la torsione manieristica a favore di un impianto piu\' misurato, che risponde alle esigenze della committenza ecclesiastica post-tridentina. L\'identificazione del soggetto resta ipotetica e la letteratura recente ha oscillato fra proposte diverse: e\' un caso in cui il dato certo e\' l\'attribuzione dell\'esecuzione, non quella del ritrattato. Per chi studia il Parmigianino, la produzione di Bedoli e\' termine di confronto obbligato proprio perche\' consente di isolare cio\' che nel linguaggio del maestro e\' invenzione e cio\' che e\' repertorio di bottega.' }
    ]
  },
  {
    operaId: 'Q3208041', sala: 3, autore: 'autore1',
    titolo: 'Ultima cena',
    descrizione: 'El Greco, 1568 circa. Olio su tavola.',
    autoreOpera: 'El Greco', stile: 'Manierismo',
    immagine: img('El%20Greco%20020.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'La stessa scena dipinta da Leonardo, ma piccolissima e con i colori accesi. E\' un\'opera giovanile di un pittore che poi diventera\' famosissimo in Spagna.' },
      { durata: '1min', livello: 'medio', testo: 'Domenikos Theotokopoulos, detto El Greco, dipinge questa tavoletta intorno al 1568, quando era ancora in Italia e stava studiando i veneziani. E\' un\'opera piccola e precoce, molto lontana dalle figure allungate e spettrali per cui sara\' celebre a Toledo. Qui si vede soprattutto Tintoretto: la scena in diagonale, la luce che taglia, il colore acceso. E\' interessante proprio perche\' mostra un artista che sta ancora imparando.' },
      { durata: '4min', livello: 'specialistico', testo: 'La tavoletta si colloca nella fase veneziana dell\'artista, dopo l\'abbandono di Candia e la formazione post-bizantina, e prima del soggiorno romano. L\'impianto obliquo e la gestione della luce dichiarano lo studio diretto di Tintoretto, mentre il trattamento del colore e la costruzione delle figure conservano tracce della cultura icona-dipendente delle origini. Il formato ridotto rimanda alla produzione destinata alla devozione privata o al mercato dei collezionisti. Il valore dell\'opera e\' documentario: consente di misurare quanto della maniera toledana sia elaborazione tarda e quanto invece derivi dal tirocinio italiano.' }
    ]
  },
  {
    operaId: 'Q3685503', sala: 3, autore: 'autore2',
    titolo: 'Comunione di san Girolamo',
    descrizione: 'Agostino Carracci, 1592-1593. Olio su tela, dalla Certosa di Bologna.',
    autoreOpera: 'Agostino Carracci', stile: 'Barocco',
    immagine: img('Agostino%20carracci%20ultima%20comunione%20san%20girolamo%20pinacoteca%20nazionale%20bologna.png'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'Un vecchio molto magro, sorretto dagli altri, riceve la comunione poco prima di morire.' },
      { durata: '1min', livello: 'medio', testo: 'Agostino Carracci dipinge questa tela per la Certosa di Bologna nel 1592. San Girolamo, ormai vecchissimo, viene sorretto per ricevere l\'ultima comunione. Il corpo emaciato e\' studiato dal vero, non idealizzato, ed e\' proprio questo il programma dei Carracci: tornare a guardare la realta\' dopo i virtuosismi del manierismo. Il quadro divenne un modello famoso, tanto che Domenichino ne fece una versione poi accusata di plagio.' },
      { durata: '4min', livello: 'specialistico', testo: 'L\'opera e\' uno dei manifesti della riforma carraccesca e occupa un posto preciso nella storiografia artistica per la celebre querelle sul plagio: la versione di Domenichino, oggi in Vaticano, scateno\' l\'accusa mossa da Lanfranco, episodio che Bellori discute a lungo. L\'anatomia del santo e\' costruita su studio dal naturale e risponde al programma antimanierista dell\'Accademia degli Incamminati; l\'impaginazione, per contro, resta debitrice della tradizione veneta nella gestione della luce e del colore. Il soggetto risponde ai dettami tridentini sulla rappresentazione dei sacramenti, e la committenza certosina ne conferma la destinazione controriformistica.' }
    ]
  },
  {
    operaId: 'Q2448678', sala: 3, autore: 'autore1',
    titolo: 'Strage degli innocenti',
    descrizione: 'Guido Reni, 1611. Olio su tela, dalla chiesa di San Domenico.',
    autoreOpera: 'Guido Reni', stile: 'Barocco',
    immagine: img('Guido%20Reni%20-%20Massacre%20of%20the%20Innocents%20-%20Pinacoteca%20Nazionale%20Bologna.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'E\' una scena terribile, il racconto biblico dei bambini uccisi per ordine di Erode. Il pittore la dipinge senza mostrare sangue.' },
      { durata: '1min', livello: 'medio', testo: 'Guido Reni affronta nel 1611 uno dei soggetti piu\' violenti della tradizione cristiana e sceglie di non mostrarne la violenza. Non c\'e\' sangue, i corpi non sono deformati, le madri gridano in pose che ricordano la scultura antica. Reni costruisce la scena come una piramide: le due madri in basso, i carnefici al centro, gli angeli con le palme del martirio in alto. Il dolore viene reso con la composizione, non con il dettaglio raccapricciante.' },
      { durata: '4min', livello: 'specialistico', testo: 'Eseguita per la cappella Berlo in San Domenico, la tela e\' il punto in cui Reni definisce il proprio classicismo in alternativa esplicita alla via caravaggesca. L\'impianto piramidale e la derivazione delle pose dalla statuaria antica e dai cartoni raffaelleschi rispondono a una teoria della bellezza ideale che Bellori codifichera\' poi come dottrina. La rinuncia al dettaglio cruento non e\' pudore ma scelta teorica: il decoro impone che il patetico sia veicolato dalla forma. L\'opera fu tra quelle requisite in eta\' napoleonica e la sua fortuna critica ottocentesca, poi il rovesciamento novecentesco del giudizio su Reni, ne fanno un caso esemplare per la storia del gusto.' }
    ]
  },
  {
    operaId: 'Q25217589', sala: 3, autore: 'autore1',
    titolo: 'Pala della Peste',
    descrizione: 'Guido Reni, 1630-1631. Olio su seta, dipinta per la peste che colpi\' Bologna.',
    autoreOpera: 'Guido Reni', stile: 'Barocco',
    immagine: img('Guido%20Reni%20061.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'Dipinta durante un\'epidemia di peste, per chiedere che finisse. Sotto ci sono le torri di Bologna.' },
      { durata: '1min', livello: 'medio', testo: 'Nel 1630 la peste devasta il nord Italia, la stessa epidemia raccontata dai Promessi Sposi. Bologna commissiona a Guido Reni uno stendardo da portare in processione: e\' dipinto su seta, non su tela, proprio perche\' doveva essere leggero e sfilare per le strade. In alto la Madonna con i santi protettori della citta\', in basso il profilo di Bologna con le torri. E\' un\'opera d\'arte che era anche un atto pubblico, un voto collettivo.' },
      { durata: '4min', livello: 'specialistico', testo: 'Il Pallione del Voto e\' documento della funzione civica dell\'immagine sacra nella Bologna del Seicento. Il supporto serico, scelto per la destinazione processionale, ha condizionato tecnica e conservazione, imponendo una stesura fluida e ponendo problemi di restauro peculiari. L\'iconografia allinea i patroni cittadini secondo una gerarchia che riflette la topografia devozionale locale; la veduta urbana in basso ha valore topografico. L\'opera si colloca nella fase tarda di Reni, quando la tavolozza si schiarisce progressivamente verso quella "maniera argentina" che caratterizza l\'ultimo decennio e che la critica ha letto ora come esito spirituale ora come conseguenza di una produzione di bottega accelerata.' }
    ]
  },
  {
    operaId: 'Q23008334', sala: 3, autore: 'autore2',
    titolo: "Il sogno di sant'Antonio",
    descrizione: 'Elisabetta Sirani, 1650 circa. Olio su tela.',
    autoreOpera: 'Elisabetta Sirani', stile: 'Barocco',
    immagine: img('Elisabetta%20Sirani%20-%20The%20Dream%20of%20St.%20Anthony.jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Questo quadro lo ha dipinto una ragazza giovanissima.' },
      { durata: '15s', livello: 'elementare', testo: 'Elisabetta Sirani aveva poco piu\' di vent\'anni quando lo ha dipinto, in un\'epoca in cui alle donne quasi non era permesso fare le pittrici. Ne dipinse duecento di quadri, e mori\' a ventisette anni.' },
      { durata: '1min', livello: 'medio', testo: 'Elisabetta Sirani e\' una figura eccezionale del Seicento bolognese: figlia d\'arte, prese in mano la bottega del padre da giovanissima, dipinse circa duecento opere documentate e apri\' una scuola di pittura per ragazze, cosa senza precedenti. Mori\' a ventisette anni, nel 1665, fra sospetti mai chiariti di avvelenamento. Questa tela mostra il suo debito verso Guido Reni nella dolcezza dei volti, ma anche una stesura piu\' rapida e una luce sua.' },
      { durata: '4min', livello: 'specialistico', testo: 'La produzione della Sirani e\' documentata con precisione insolita grazie al libro di nota che l\'artista teneva personalmente, fonte primaria per la ricostruzione del catalogo e per lo studio delle pratiche di bottega bolognesi. La sua scuola per allieve costituisce un unicum nel panorama europeo del Seicento e ha reso il caso centrale negli studi sulla professionalizzazione femminile in ambito artistico. Sul piano formale l\'adesione al reniano tardo e\' evidente nella tipologia dei volti e nella tavolozza schiarita, ma la conduzione del pennello e\' piu\' corsiva, in parte per necessita\' produttiva. Le circostanze della morte, con il processo che ne segui\', sono documentate negli atti e restano di interpretazione discussa.' }
    ]
  },
  {
    operaId: 'Q29997042', sala: 3, autore: 'autore2',
    titolo: 'Ritratto di neonata nella culla',
    descrizione: 'Lavinia Fontana, 1583 circa. Olio su tela.',
    autoreOpera: 'Lavinia Fontana', stile: 'Manierismo',
    immagine: img('Newborn%20Baby%20in%20a%20Crib%20%28c.%201583%2C%20PNB%29.jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Una neonata nella culla, vestita a festa.' },
      { durata: '15s', livello: 'infantile', testo: 'Guarda quanti gioielli su una bambina cosi\' piccola: collane, spille, ricami d\'oro. Non erano suoi, servivano a far vedere quanto era ricca la famiglia.' },
      { durata: '1min', livello: 'elementare', testo: 'Lavinia Fontana fu una delle prime donne in Europa a vivere del proprio lavoro di pittrice, con una bottega sua e committenti importanti fino a Roma. Qui ritrae una neonata coperta di gioielli: sembra strano, ma i ritratti di bambini servivano a mostrare la ricchezza e la continuita\' della famiglia. I gioielli sono dipinti uno per uno con enorme precisione, ed erano il pezzo forte del quadro.' },
      { durata: '4min', livello: 'specialistico', testo: 'Lavinia Fontana rappresenta il caso meglio documentato di professionalizzazione femminile nella pittura di eta\' moderna: attiva a Bologna e poi a Roma, con committenza aristocratica e pontificia, mantenne bottega propria e famiglia numerosa. La ritrattistica infantile risponde a esigenze dinastiche precise e l\'ostentazione dell\'apparato di gioielli va letta come inventario visivo del patrimonio familiare, secondo una funzione documentaria attestata anche dalle fonti notarili coeve. La resa analitica degli ornamenti riprende la tradizione ritrattistica emiliana e nord-europea; l\'identificazione della bambina e\' stata proposta in relazione a piu\' famiglie senatorie bolognesi senza approdo definitivo.' }
    ]
  },
  // --- Secondi item sulle stesse opere -------------------------------------
  // La specifica lo chiede espressamente: "Ogni visita puo' (dovrebbe!!!) avere
  // multipli item per lo stesso oggetto di visita". Stesso codice Wikidata, autore
  // diverso, taglio diverso: e' il caso in cui il visitatore sceglie chi ascoltare.
  // `chiave` serve solo qui dentro per distinguerli quando si montano le visite.
  {
    chiave: 'polittico-materiali', operaId: 'Q3907499', sala: 1, autore: 'autore2',
    titolo: 'Il Polittico di Giotto: oro, legno e bottega',
    descrizione: 'Giotto, 1333 circa. Come e\' fatto materialmente un polittico su tavola.',
    autoreOpera: 'Giotto', stile: 'Gotico',
    licenza: 'CC-BY', prezzo: 1.5,
    immagine: img('Giotto.%20Polyptych.%201330-35.%2091x340cm.%20Pinacoteca%2C%20Bologna..jpg'),
    testi: [
      { durata: '15s', livello: 'medio', testo: 'Non e\' un quadro solo: sono tavole di pioppo unite da una carpenteria di legno. Sopra il legno va uno strato di gesso, poi la foglia d\'oro, poi il colore stemperato nel tuorlo d\'uovo.' },
      { durata: '1min', livello: 'medio', testo: 'Un polittico nasce come un mobile. Il falegname assembla le tavole di pioppo e la cornice, poi la bottega stende sul legno strati sottilissimi di gesso e colla fino a ottenere una superficie liscia come un muro intonacato. Sopra si applica la foglia d\'oro, battuta fino a poche migliaia di millimetro, e la si lucida con una pietra dura finche\' non riflette la luce delle candele. Solo alla fine arriva il colore, macinato a mano e stemperato nel tuorlo d\'uovo, che asciuga in fretta e obbliga a dipingere per piccoli tratti sovrapposti. Quello che vedete non e\' quindi il lavoro di un uomo solo, ma di una squadra in cui Giotto firma e dirige.' },
      { durata: '4min', livello: 'specialistico', testo: 'La struttura del polittico va letta come un manufatto prima che come un dipinto. Il supporto e\' in pioppo, legno tenero e disponibile, tagliato in assi verticali e collegato da traverse; la carpenteria della cornice e\' solidale al supporto, non applicata dopo, ed e\' quella che determina la scansione degli scomparti e delle cuspidi. Sul legno si stende la preparazione: colla animale e gesso in piu\' passate, levigate fino a ottenere un piano che accolga la doratura senza granulosita\'. La foglia d\'oro viene posata su bolo armeno, l\'argilla rossastra che le da\' calore e ne permette la brunitura; sotto la doratura, in molti punti, si legge ancora l\'incisione preparatoria del disegno. La pittura e\' a tempera d\'uovo: il legante asciuga in pochi minuti e non consente ritocchi, quindi il modellato si costruisce per velature successive e per tratteggio, tecnica che spiega la resa quasi grafica degli incarnati. Il rapporto fra maestro e bottega, che la critica discute da tempo, si legge proprio qui: la coerenza dell\'impianto e la qualita\' delle teste centrali si accompagnano a passaggi laterali piu\' correnti nella stesura dei panneggi. Infine la storia conservativa: i polittici sono stati quasi tutti smembrati fra Sette e Ottocento, quando il mercato preferiva le tavole singole, e la ricomposizione che vedete e\' il risultato di un lavoro di ricerca museale.' }
    ]
  },
  {
    chiave: 'frate-volto', operaId: 'Q126599960', sala: 2, autore: 'autore1',
    titolo: 'Il frate di Bedoli: come si legge un volto',
    descrizione: 'Girolamo Mazzola Bedoli. Un ritratto letto a partire dallo sguardo e dalle mani.',
    autoreOpera: 'Girolamo Mazzola Bedoli', stile: 'Manierismo',
    licenza: 'CC0', prezzo: 0,
    immagine: null,
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Guarda le sue mani: stanno ferme sul libro.' },
      { durata: '15s', livello: 'elementare', testo: 'L\'uomo non ci guarda: gli occhi vanno un po\' di lato, come quando si sta pensando a qualcosa. Le mani appoggiate sul libro non lo stanno leggendo, lo stanno solo tenendo.' },
      { durata: '1min', livello: 'medio', testo: 'Un ritratto si legge partendo da tre cose: dove guarda la persona, cosa fanno le mani, e quanta aria c\'e\' intorno. Qui lo sguardo esce dal quadro ma non incrocia il nostro, e questo tiene il frate a distanza; le mani sono ferme sul libro, un gesto sospeso che non racconta un\'azione ma uno stato; lo spazio e\' stretto, il fondo scuro sta addosso alla figura e non lascia respiro. Sono scelte, non limiti del pittore: nello stesso momento altri ritrattisti allargano lo sfondo su paesaggi e finestre. Bedoli toglie tutto quello che potrebbe distrarre e lascia solo la tensione interna del personaggio.' }
    ]
  },
  {
    chiave: 'strage-composizione', operaId: 'Q2448678', sala: 3, autore: 'autore2',
    titolo: 'La Strage degli innocenti come una scena di teatro',
    descrizione: 'Guido Reni, 1611 circa. La costruzione della scena, non il suo racconto.',
    autoreOpera: 'Guido Reni', stile: 'Barocco',
    licenza: 'CC-BY-SA', prezzo: 2,
    immagine: null,
    testi: [
      { durata: '15s', livello: 'medio', testo: 'Le figure sono disposte come sul palco di un teatro: chi urla sta davanti, chi fugge sale verso il fondo, e in alto due angeli chiudono la scena con le palme dei martiri.' },
      { durata: '4min', livello: 'specialistico', testo: 'La tela e\' organizzata su tre registri sovrapposti che funzionano come i piani di un palcoscenico. In basso i corpi dei bambini e le madri inginocchiate costruiscono una fascia orizzontale che chiude la composizione e obbliga lo sguardo a risalire. Al centro il gruppo dei sicari e delle madri in fuga forma una diagonale che attraversa il campo da sinistra verso destra: e\' il vero motore della scena, e Reni la costruisce alternando braccia alzate e teste rovesciate in un ritmo quasi musicale. In alto, sopra l\'architettura appena accennata, i due angeli con le palme introducono il registro celeste e sciolgono l\'orrore in significato. La scelta che allontana Reni dal naturalismo dei suoi anni e\' la temperatura emotiva: nessuna figura e\' deformata dal dolore, i volti restano composti anche nell\'urlo, e il colore chiaro e smaltato tiene la scena a distanza. E\' la lezione classicista dell\'ambiente bolognese, che rifiuta di far coincidere la violenza del soggetto con la violenza della pittura. Il confronto obbligato e\' con le stesse scene dipinte a Roma negli stessi anni, dove il buio e il taglio ravvicinato cercano invece l\'urto diretto con chi guarda.' }
    ]
  },

  // --- Approfondimenti ------------------------------------------------------
  // "Gli item possono riferirsi sia agli oggetti della visita, sia a contenuti
  // associati (movimenti culturali, stili, artisti, eventi storici)". Questi non
  // sono oggetti esposti, quindi non stanno sulla mappa: il codice Wikidata e'
  // quello del movimento o della persona.
  {
    chiave: 'manierismo', operaId: 'Q131808', tipo: 'approfondimento', autore: 'autore2',
    titolo: 'Che cos\'e\' il Manierismo',
    descrizione: 'Il movimento a cui appartengono diverse opere di questa sala.',
    stile: 'Manierismo',
    licenza: 'CC-BY-SA', prezzo: 0,
    immagine: null,
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'E\' il modo di dipingere che viene dopo Raffaello: figure allungate, colori strani e pose difficili, fatte apposta per stupire.' },
      { durata: '1min', livello: 'medio', testo: 'Manierismo e\' il nome che si da\' alla pittura italiana del Cinquecento dopo la generazione di Raffaello e Michelangelo. Il problema di quei pittori e\' che i modelli erano gia\' perfetti: invece di ripeterli, hanno cominciato a forzarli. Le figure si allungano, le pose diventano difficili, i colori si fanno acidi e cangianti, e lo spazio smette di essere misurabile. Per secoli e\' stato giudicato un periodo di decadenza, proprio perche\' si allontanava dall\'equilibrio classico; oggi si legge al contrario, come una ricerca consapevole di eleganza e artificio. La parola viene da "maniera", che nel Cinquecento non significava affettazione ma stile personale riconoscibile.' },
      { durata: '4min', livello: 'specialistico', testo: 'Il termine nasce da Vasari, che usa "maniera" come categoria di qualita\' stilistica, e viene trasformato in etichetta storiografica solo nell\'Ottocento, con una connotazione negativa che il Novecento ha progressivamente smontato. Il fenomeno si colloca fra il terzo decennio del Cinquecento e la fine del secolo, e non e\' unitario: la linea fiorentina di Pontormo e Rosso lavora sulla dissonanza cromatica e sulla compressione spaziale; quella emiliana, che interessa direttamente questa raccolta, passa attraverso Parmigianino e la sua discendenza, con l\'allungamento delle proporzioni, la levigatezza degli incarnati e un\'eleganza che diventa fine a se stessa. Bedoli, cugino acquisito e collaboratore di Parmigianino, ne rappresenta la versione piu\' misurata e ritrattistica. Sul piano dei contenuti il Manierismo coincide con la crisi religiosa del secolo: la Riforma e poi il Concilio di Trento cambiano la committenza e le regole dell\'immagine sacra, e la ricerca formale si intreccia con la richiesta di decoro. Il superamento arrivera\' proprio da Bologna, con la riforma naturalistica dei Carracci.' }
    ]
  },
  {
    chiave: 'guido-reni', operaId: 'Q109061', tipo: 'approfondimento', autore: 'autore1',
    titolo: 'Guido Reni in breve',
    descrizione: 'Chi era il pittore di diverse opere della Sala 3.',
    autoreOpera: 'Guido Reni', stile: 'Barocco',
    licenza: 'CC-BY-SA', prezzo: 0,
    immagine: null,
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Un pittore bolognese famoso per i suoi cieli chiari.' },
      { durata: '15s', livello: 'medio', testo: 'Bolognese, 1575-1642. Formato nell\'Accademia dei Carracci, lavora fra Bologna e Roma e diventa il pittore piu\' pagato d\'Europa. La sua cifra e\' la luce chiara e le figure composte anche nelle scene tragiche.' },
      { durata: '1min', livello: 'medio', testo: 'Guido Reni nasce a Bologna nel 1575 e si forma nell\'Accademia dei Carracci, dove impara a disegnare dal vero prima che dai modelli antichi. A Roma incontra la pittura di Caravaggio e la rifiuta consapevolmente: prende il naturalismo dei corpi ma lo porta verso una luce alta e chiarissima, l\'opposto dei fondi neri. Torna a Bologna e diventa il pittore piu\' richiesto e piu\' pagato del suo tempo, con una bottega numerosa. La sua fama ottocentesca lo trasforma nel campione della grazia, la reazione novecentesca lo condanna come sdolcinato, e solo in tempi recenti se ne e\' riletta la costruzione intellettuale. Muore nel 1642, pieno di debiti di gioco.' }
    ]
  },
  {
    chiave: 'incamminati', operaId: 'Q2720193', tipo: 'approfondimento', autore: 'autore1',
    titolo: 'I Carracci e l\'Accademia degli Incamminati',
    descrizione: 'La scuola bolognese da cui esce buona parte delle opere del Seicento.',
    stile: 'Barocco',
    licenza: 'CC-BY-SA', prezzo: 0,
    immagine: null,
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'Tre parenti pittori, i Carracci, aprirono a Bologna una scuola dove si imparava disegnando dal vero invece che copiando gli altri quadri.' },
      { durata: '1min', livello: 'medio', testo: 'Verso il 1582 Ludovico Carracci e i cugini Agostino e Annibale aprono a Bologna una bottega-scuola che chiamano degli Incamminati, cioe\' di quelli che si sono messi in cammino. L\'idea e\' semplice e per l\'epoca radicale: si impara disegnando dal vero, dal modello vivo e dalla natura, invece di ripetere le formule dei manieristi. Da quella scuola escono Guido Reni, Domenichino, Guercino e l\'Albani, cioe\' quasi tutti i pittori che riempiono le sale del Seicento di questo museo. E\' anche il primo caso in Italia di una didattica organizzata dell\'arte, con lezioni di anatomia e di prospettiva: il modello delle accademie che si diffonderanno in tutta Europa nei due secoli successivi.' }
    ]
  }
];

// Le tre visite. Le tappe sono elencate per codice opera, nell'ordine del percorso.
const VISITE = [
  {
    nome: 'Capolavori della Pinacoteca',
    autore: 'autore1',
    pubblica: true,
    prezzo: 0,
    infoLogistiche: "Ingresso da via delle Belle Arti 56. Biglietto intero 6 euro, guardaroba gratuito a sinistra della biglietteria. Il percorso dura circa un'ora.",
    tappe: [
      { opera: 'Q3907499', indicazione: 'Dall\'ingresso sali la scala principale ed entra nella Sala 1: la tavola dorata e\' sulla parete di fronte.' },
      // stessa opera, un altro autore: chi vuole sapere com'e' fatta resta qui davanti
      { opera: 'polittico-materiali', indicazione: 'Resta davanti alla stessa tavola.', opzionale: true },
      { opera: 'Q27345212', indicazione: 'Stessa sala, sulla parete a sinistra.' },
      { opera: 'Q3889219', indicazione: 'Sempre in Sala 1, ultima parete a destra prima del passaggio.' },
      { opera: 'Q16038421', indicazione: 'Attraversa il passaggio ed entra in Sala 2: la pala e\' subito a sinistra.' },
      { opera: 'Q3213771', indicazione: 'Prosegui lungo la stessa parete.' },
      { opera: 'Q1103801', indicazione: 'Al centro della Sala 2, nella nicchia dedicata.' },
      { opera: 'Q3842737', indicazione: 'Sulla parete di destra della Sala 2.' },
      { opera: 'Q3208041', indicazione: 'Scendi in Sala 3 e gira a sinistra: e\' una tavola piccola, cercala ad altezza occhi.', opzionale: true },
      { opera: 'Q2448678', indicazione: 'Al centro della parete lunga della Sala 3.' },
      { opera: 'Q25217589', indicazione: 'A fianco della precedente, sulla destra.' }
    ]
  },
  {
    nome: 'Il Seicento bolognese',
    autore: 'autore2',
    pubblica: true,
    prezzo: 4.5,
    infoLogistiche: 'Percorso di approfondimento, circa un\'ora e mezza. Consigliato dopo aver visto le sale del Rinascimento. Sedute disponibili in Sala 3.',
    tappe: [
      { opera: 'Q3213771', indicazione: 'Parti dalla Sala 2, parete sinistra.' },
      { opera: 'Q1103801', indicazione: 'Al centro della Sala 2.' },
      { opera: 'Q3842737', indicazione: 'Sulla parete di destra.' },
      { opera: 'Q126599960', indicazione: 'A fianco della precedente, stessa parete.' },
      { opera: 'frate-volto', indicazione: 'Resta davanti al ritratto.', opzionale: true },
      { opera: 'manierismo', indicazione: 'Da ascoltare qui, guardando le due tavole di questa parete.', opzionale: true },
      { opera: 'Q3208041', indicazione: 'Scendi in Sala 3, prima parete a sinistra.' },
      { opera: 'Q3685503', indicazione: 'Prosegui sulla stessa parete.' },
      { opera: 'Q2448678', indicazione: 'Al centro della parete lunga.' },
      { opera: 'strage-composizione', indicazione: 'Resta davanti alla tela grande.', opzionale: true },
      { opera: 'guido-reni', indicazione: 'Da ascoltare in Sala 3, dove ci sono le sue opere.', opzionale: true },
      { opera: 'Q25217589', indicazione: 'Subito a destra della precedente.' },
      { opera: 'Q23008334', indicazione: 'Ancora a destra, verso il fondo della Sala 3.' },
      { opera: 'Q29997042', indicazione: 'Ultima parete della Sala 3, vicino all\'uscita.', opzionale: true }
    ]
  },
  {
    nome: 'La Pinacoteca raccontata alle scuole',
    autore: 'autore1',
    pubblica: false,
    prezzo: 0,
    infoLogistiche: 'Percorso per gruppi scolastici, circa quaranta minuti. Ritrovo nell\'atrio. Zaini in guardaroba, si entra in sala senza. Toilette vicino all\'ingresso, corridoio a sinistra.',
    tappe: [
      { opera: 'Q27345212', indicazione: 'Sali la scala ed entra in Sala 1: il cavaliere col drago e\' sulla parete a sinistra.' },
      { opera: 'Q3907499', indicazione: 'Girati verso la parete di fronte: e\' il quadro tutto dorato.' },
      { opera: 'Q3947685', indicazione: 'Stessa sala, verso il centro: l\'angelo con la bilancia.' },
      { opera: 'Q3889219', indicazione: 'Ultima parete della Sala 1, prima del passaggio.' },
      { opera: 'Q16038421', indicazione: 'Entra in Sala 2, subito a sinistra.', opzionale: true },
      { opera: 'Q3213771', indicazione: 'Prosegui sulla stessa parete.' },
      { opera: 'Q1103801', indicazione: 'Al centro della Sala 2.' },
      { opera: 'Q2448678', indicazione: 'Scendi in Sala 3, al centro della parete lunga.' },
      { opera: 'Q23008334', indicazione: 'Verso il fondo della stessa parete.' },
      { opera: 'Q29997042', indicazione: 'Ultima tappa, vicino all\'uscita della Sala 3.' },
      { opera: 'incamminati', indicazione: 'Da ascoltare seduti, prima di uscire.', opzionale: true }
    ]
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connesso al database.');

  await Promise.all([Utente.deleteMany({}), Museo.deleteMany({}), Item.deleteMany({}), Visita.deleteMany({})]);
  console.log('Collezioni svuotate.');

  // password uguale per tutti, come chiede la specifica. L'hash lo fa il pre-save di Utente.
  const utenti = {};
  for (const [username, ruolo] of [['autore1', 'autore'], ['autore2', 'autore'], ['visitatore1', 'visitatore'], ['visitatore2', 'visitatore']]) {
    utenti[username] = await new Utente({ username, password: '12345678', ruolo }).save();
  }
  console.log('Creati 4 utenti (password 12345678).');

  const museo = await new Museo({
    nome: 'Pinacoteca Nazionale di Bologna',
    citta: 'Bologna',
    configFile: 'pinacoteca-bologna.json'
  }).save();

  // gli id assegnati da Mongo: servono a montare le visite. La chiave e' il codice
  // dell'opera, tranne dove due item parlano della stessa opera e serve distinguerli
  const idPerItem = {};
  for (const o of OPERE) {
    const item = await new Item({
      operaId: o.operaId,
      tipo: o.tipo || 'opera',
      museoId: museo._id,
      titolo: o.titolo,
      descrizione: o.descrizione,
      autoreOpera: o.autoreOpera,
      stile: o.stile,
      immagine: o.immagine,
      testi: o.testi,
      autoreId: utenti[o.autore]._id,
      licenza: o.licenza || 'CC-BY-SA',
      prezzo: o.prezzo || 0
    }).save();
    idPerItem[o.chiave || o.operaId] = item._id;
  }
  console.log(`Creati ${OPERE.length} item.`);

  const visiteCreate = [];
  for (const v of VISITE) {
    const visita = await new Visita({
      nome: v.nome,
      museoId: museo._id,
      autoreId: utenti[v.autore]._id,
      items: v.tappe.map((t, i) => ({
        itemId: idPerItem[t.opera],
        ordine: i + 1,
        opzionale: Boolean(t.opzionale),
        indicazioneLogistica: t.indicazione
      })),
      infoLogistiche: v.infoLogistiche,
      pubblica: v.pubblica,
      prezzo: v.prezzo
    }).save();
    visiteCreate.push(visita);
  }
  console.log(`Create ${VISITE.length} visite.`);

  // visitatore1 ha gia' comprato le due visite pubbliche, visitatore2 non ha niente:
  // cosi' nel Navigator si vedono sia la lista piena sia il messaggio "non hai ancora sbloccato".
  utenti.visitatore1.acquisti = visiteCreate.filter(v => v.pubblica).map(v => v._id);
  await utenti.visitatore1.save();

  await mongoose.connection.close();
  console.log('Fatto.');
}

seed();
