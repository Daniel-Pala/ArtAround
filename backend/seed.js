// backend/seed.js — riempie il database con dati di presentazione.
// Cancella tutto e ricrea da zero. Si usa in due modi:
//  - in locale, a mano: `cd backend && node seed.js`;
//  - sul server del dipartimento, dove il database si raggiunge solo da dentro il cluster,
//    attraverso la rotta POST /api/admin/seed (routes/admin.js).
//
// Due musei: la Pinacoteca Nazionale e Palazzo Pepoli Campogrande, la sua seconda sede.
// I codici delle opere sono i veri identificativi Wikidata e le immagini arrivano da
// Wikimedia Commons: la specifica chiede identificativi universali, non nomi inventati.
// Le stesse sigle sono le chiavi di `posizioni` nel file di configurazione di ciascun museo
// (navigator/public/config/), ed è quello che permette al Player di disegnare i segnaposti.
//
// Dentro OPERE ci sono tre casi:
//  - l'item su un'opera esposta (la maggioranza);
//  - un SECONDO item sulla stessa opera, scritto da un altro autore e con un taglio
//    diverso: lo chiede la specifica ("multipli item per lo stesso oggetto di visita"),
//    e ha una `chiave` propria perché il codice Wikidata da solo non li distingue;
//  - l'approfondimento (`tipo: 'approfondimento'`), che parla di un movimento o di un
//    artista e non di un oggetto esposto: il suo codice Wikidata è quello del movimento
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
      { durata: '15s', livello: 'infantile', testo: 'Guarda quanto oro! Settecento anni fa non esisteva la vernice dorata: quello è oro vero, battuto finissimo e incollato sul legno. Al centro c\'è Maria con Gesù bambino.' },
      { durata: '1min', livello: 'medio', testo: 'È l\'unica opera firmata da Giotto conservata a Bologna, dipinta intorno al 1333 per la chiesa di Santa Maria degli Angeli. Un polittico è un dipinto composto da più tavole affiancate: qui al centro c\'è la Madonna col Bambino, ai lati quattro santi. Il fondo d\'oro non è decorazione: nella pittura medievale rappresenta la luce divina, uno spazio senza luogo né tempo. Giotto però comincia a incrinare quella convenzione, dando ai volti un peso e un volume che i suoi contemporanei non dipingevano ancora.' },
      { durata: '4min', livello: 'specialistico', testo: 'Il polittico proviene dalla chiesa bolognese di Santa Maria degli Angeli e reca la firma OPUS MAGISTRI IOCTI DE FLORENTIA, formula che nella bottega giottesca indica la responsabilità del maestro più che l\'esecuzione integrale: la critica vi riconosce da tempo un intervento consistente di collaboratori, in particolare nelle tavole laterali. La datazione al 1333 circa poggia su ragioni stilistiche e sul confronto con la coeva attività padana. L\'impianto è ancora quello del polittico gotico a cuspidi, ma la costruzione dei volumi, l\'aggetto dei troni e la resa dei panneggi appartengono al linguaggio elaborato a Padova negli Scrovegni. Il fondo oro conserva la funzione simbolica tradizionale mentre le figure reclamano uno spazio misurabile: è questa tensione, non ancora risolta, il vero interesse storico dell\'opera.' }
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
      { durata: '15s', livello: 'infantile', testo: 'Il cavallo si impenna, la lancia si spezza contro il drago e San Giorgio sta quasi per cadere. Il pittore lo ha dipinto nel momento più pericoloso, non quando ha già vinto.' },
      { durata: '1min', livello: 'elementare', testo: 'Vitale da Bologna dipinge questa tavola intorno al 1330. La storia è famosa: un drago terrorizza una città, San Giorgio arriva e lo affronta. Quasi tutti i pittori lo mostrano tranquillo, vincitore. Vitale invece sceglie l\'istante dello scontro: il cavallo si torce all\'indietro, la lancia si è già spezzata, l\'equilibrio del cavaliere è precario. È un modo di dipingere pieno di movimento, insolito per l\'epoca, e per questo Vitale venne soprannominato "Vitale delle Madonne" solo più tardi, quando cambiò registro.' },
      { durata: '4min', livello: 'specialistico', testo: 'La tavola è il punto più alto della fase giovanile di Vitale e uno dei documenti fondamentali della scuola bolognese del Trecento. La composizione rifiuta la staticità iconica del modello bizantino e adotta una torsione a spirale che coinvolge cavallo, cavaliere e drago in un unico moto: la lancia spezzata, dettaglio raro nell\'iconografia, sposta il racconto dal trionfo compiuto al conflitto in atto. La critica ha collegato questa scelta alla cultura figurativa d\'oltralpe che circolava a Bologna attraverso i manoscritti miniati, ambito in cui la città era all\'avanguardia europea. Il risultato è un espressionismo gotico che non ha equivalenti nella coeva pittura toscana e che resterà senza seguito diretto.' }
    ]
  },
  {
    operaId: 'Q3889219', sala: 1, autore: 'autore1',
    titolo: 'Pala dei Mercanti',
    descrizione: 'Francesco del Cossa, 1474. Tempera su tavola, dal Foro dei Mercanti.',
    autoreOpera: 'Francesco del Cossa', stile: 'Rinascimento',
    immagine: img('Francesco%20del%20Cossa%20025.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'Al centro la Madonna su un trono altissimo, di lato San Petronio che tiene in mano un modellino di Bologna: è il santo protettore della città.' },
      { durata: '1min', livello: 'medio', testo: 'Dipinta nel 1474 per la sede della corporazione dei mercanti bolognesi. Francesco del Cossa viene da Ferrara e porta con sé un gusto per l\'architettura dipinta quasi ossessivo: il trono è un monumento classico con colonne, cornici e marmi finti resi con precisione da scenografo. A sinistra San Petronio regge una Bologna in miniatura, con le due torri riconoscibili. In basso a destra, inginocchiato, c\'è il committente Alberto de\' Cattanei, ritratto dal vero.' },
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
      { durata: '15s', livello: 'elementare', testo: 'San Michele tiene una bilancia perché, secondo il racconto, pesa le anime. Guarda le ali: sono dipinte come quelle di un uccello vero, piuma per piuma.' },
      { durata: '1min', livello: 'medio', testo: "Ercole de' Roberti è il più giovane dei grandi ferraresi e il più nervoso. Questo San Michele ha un corpo sottile, quasi tagliente, e una corazza resa con riflessi metallici durissimi. La bilancia allude alla pesatura delle anime nel giorno del giudizio. Rispetto ai suoi maestri, Roberti allunga le figure e carica ogni contorno di tensione: è una pittura che sembra incisa più che stesa." },
      { durata: '4min', livello: 'specialistico', testo: "La tavola appartiene alla fase precoce dell'artista, quando il linguaggio di Cossa e Tura non è ancora stato rielaborato in senso autonomo. L'anatomia allungata e la definizione lineare dei contorni derivano da Tura; l'attenzione al dettaglio metallico e la costruzione della corazza rimandano invece alla cultura fiamminga circolante a Ferrara attraverso la collezione estense. Il motivo della psicostasia, la pesatura delle anime, è iconografia bizantina passata all'Occidente attraverso i cicli del Giudizio: qui viene isolata dal contesto narrativo e trasformata in attributo, secondo una tendenza tipica della devozione tardoquattrocentesca." }
    ]
  },
  {
    operaId: 'Q16038421', sala: 2, autore: 'autore1',
    titolo: 'Pala Bentivoglio',
    descrizione: 'Francesco Francia, 1498-1499. Olio su tavola, dalla cappella Bentivoglio in San Giacomo Maggiore.',
    autoreOpera: 'Francesco Francia', stile: 'Rinascimento',
    immagine: img('Francesco%20Francia%20-%20Adoration%20of%20the%20Child%20-%20WGA08169.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'Una scena calma e simmetrica: la Madonna al centro, i santi disposti a specchio, tutto in ordine. Era la pala della famiglia più potente di Bologna.' },
      { durata: '1min', livello: 'medio', testo: 'Commissionata dai Bentivoglio, che governavano Bologna, per la loro cappella in San Giacomo Maggiore. Francesco Francia era orafo prima che pittore, e si vede: le superfici sono levigate, i colori smaltati, ogni dettaglio rifinito. La composizione è costruita sulla simmetria, con la Madonna esattamente al centro e i santi bilanciati ai lati. È la formula della "sacra conversazione", cioè santi di epoche diverse riuniti in un unico spazio silenzioso.' },
      { durata: '4min', livello: 'specialistico', testo: 'La pala è documento della politica culturale bentivolesca nel decennio precedente la caduta della signoria. Francia elabora un classicismo di mediazione fra la tradizione ferrarese, la lezione peruginesca e le suggestioni umbro-romane, costruendo un idioma che sarà determinante per la formazione del giovane Raffaello. La qualità smaltata della stesura tradisce il tirocinio da orafo, mestiere che Francia non abbandonò mai e che gli valse la direzione della zecca cittadina. L\'impianto simmetrico e la costruzione prospettica dell\'abside dipinta dichiarano l\'adesione al modello della sacra conversazione italiana centro-settentrionale.' }
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
      { durata: '15s', livello: 'elementare', testo: 'Il quadro è diviso in due: sopra il cielo con la Madonna, sotto la terra con i santi. Guarda i loro volti: sono tutti tranquilli, nessuno si agita.' },
      { durata: '1min', livello: 'medio', testo: 'Perugino dipinge questa pala intorno al 1500, negli anni della sua massima fama. La composizione è divisa in due registri: la zona celeste in alto e quella terrestre in basso. La sua invenzione più riconoscibile è l\'atmosfera: figure dai gesti misurati, teste leggermente inclinate, un paesaggio che sfuma in lontananza in azzurro. È questa dolcezza che il giovane Raffaello, suo allievo, studia e poi supera.' },
      { durata: '4min', livello: 'specialistico', testo: 'La tavola proviene da San Giovanni in Monte e appartiene alla stagione di massima diffusione della formula peruginesca, quando la bottega opera contemporaneamente fra Perugia, Firenze e Roma. La partizione in registri sovrapposti, il ritmo cadenzato delle figure e la resa atmosferica del fondale costituiscono un repertorio ormai codificato, che la critica cinquecentesca già rimproverò come ripetitivo: Vasari parla esplicitamente di formule riusate. Il valore documentario dell\'opera sta però proprio in questo, nel mostrare il modello su cui Raffaello si forma prima del soggiorno fiorentino e da cui prende congedo con la Deposizione Baglioni del 1507.' }
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
      { durata: '15s', livello: 'infantile', testo: 'Guarda per terra: strumenti musicali rotti, buttati via. Cecilia li ha lasciati cadere perché ha sentito cantare gli angeli in cielo, e nessuna musica umana può competere.' },
      { durata: '1min', livello: 'medio', testo: 'È il capolavoro della Pinacoteca. Raffaello lo dipinge intorno al 1515 per la chiesa bolognese di San Giovanni in Monte. Cecilia, patrona della musica, alza gli occhi verso un coro di angeli e lascia scivolare l\'organo portativo dalle mani; ai suoi piedi altri strumenti giacciono rotti. Il significato è preciso: la musica terrena tace davanti a quella celeste. Attorno a lei quattro santi reagiscono in modo diverso, e questa varietà di risposte a un unico evento è l\'invenzione più moderna del quadro.' },
      { durata: '4min', livello: 'specialistico', testo: 'La pala fu commissionata da Elena Duglioli dall\'Olio per la sua cappella in San Giovanni in Monte e giunse a Bologna intorno al 1515. La natura morta di strumenti in primo piano è tradizionalmente attribuita a Giovanni da Udine, collaboratore di Raffaello specializzato in questo genere. La composizione articola quattro reazioni distinte all\'evento estatico: il raccoglimento di Paolo, lo sguardo diretto della Maddalena verso lo spettatore, il dialogo fra Giovanni e Agostino. Vasari registra l\'impressione profonda che l\'opera produsse sui pittori emiliani; Francesco Francia, secondo un aneddoto della tradizione, ne sarebbe rimasto talmente turbato da ammalarsi. L\'opera fu requisita dai francesi nel 1796, trasferita a Parigi e restituita nel 1815, occasione in cui subì il trasporto dalla tavola alla tela.' }
    ]
  },
  {
    operaId: 'Q3842737', sala: 2, autore: 'autore2',
    titolo: 'Madonna di Santa Margherita',
    descrizione: 'Parmigianino, 1529. Olio su tavola.',
    autoreOpera: 'Parmigianino', stile: 'Manierismo',
    immagine: img('Parmigianino%20-%20Madonna%20and%20Child%20with%20Saints%20Margaret%2C%20Jerome%2C%20Petronius%20and%20Michael.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'Le figure sono ammassate una sull\'altra e sembrano venirti addosso. Non è un errore: il pittore lo ha fatto apposta.' },
      { durata: '1min', livello: 'medio', testo: 'Parmigianino dipinge questa pala nel 1529, durante il soggiorno bolognese seguito al sacco di Roma. Rispetto alle sacre conversazioni ordinate del secolo precedente qui è cambiato tutto: le figure sono compresse in primo piano, i corpi si allungano, il Bambino si sporge verso Santa Margherita con un movimento che rompe l\'equilibrio. È il linguaggio che verrà chiamato manierismo: l\'eleganza prende il posto della naturalezza, e la deviazione dalla regola diventa il punto.' },
      { durata: '4min', livello: 'specialistico', testo: 'Eseguita per la chiesa bolognese di Santa Margherita durante il soggiorno che segue la fuga da Roma del 1527. L\'opera documenta il passaggio dal classicismo raffaellesco assimilato negli anni romani a una sintassi deliberatamente instabile: compressione dello spazio, dilatazione delle proporzioni, torsione degli assi. Il confronto con l\'Estasi di santa Cecilia, presente nella stessa città e nella stessa raccolta, è istruttivo perché misura in quindici anni la distanza percorsa dalla pittura italiana. Vale ricordare i rapporti documentati fra Parmigianino e Girolamo Mazzola Bedoli, suo parente e collaboratore, la cui produzione è anch\'essa rappresentata in questa raccolta.' }
    ]
  },
  {
    operaId: 'Q126599960', sala: 2, autore: 'autore2',
    titolo: 'Ritratto di frate',
    descrizione: 'Girolamo Mazzola Bedoli, metà del XVI secolo. Olio su tela.',
    autoreOpera: 'Girolamo Mazzola Bedoli', stile: 'Manierismo',
    immagine: img('Girolamo-Mazzola-Bedoli-San-Tommaso-dAquino.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'Un ritratto di frate. Non sappiamo con certezza chi fosse: il nome si è perso.' },
      { durata: '1min', livello: 'medio', testo: 'Girolamo Mazzola Bedoli era parente e collaboratore del Parmigianino, di cui adottò il linguaggio elegante attenuandone gli eccessi. Questo ritratto è un buon esempio del suo modo: la posa è sobria, l\'attenzione va tutta al volto e alle mani, e l\'identità del soggetto è stata proposta ma non dimostrata. È anche un caso utile per capire come funziona un museo: molte opere arrivano fino a noi senza un\'attribuzione certa del soggetto.' },
      { durata: '4min', livello: 'specialistico', testo: 'Bedoli rappresenta il canale principale di trasmissione del linguaggio parmigianinesco nella seconda metà del Cinquecento emiliano. Nella ritrattistica attenua la torsione manieristica a favore di un impianto più misurato, che risponde alle esigenze della committenza ecclesiastica post-tridentina. L\'identificazione del soggetto resta ipotetica e la letteratura recente ha oscillato fra proposte diverse: è un caso in cui il dato certo è l\'attribuzione dell\'esecuzione, non quella del ritrattato. Per chi studia il Parmigianino, la produzione di Bedoli è termine di confronto obbligato proprio perché consente di isolare ciò che nel linguaggio del maestro è invenzione e ciò che è repertorio di bottega.' }
    ]
  },
  {
    operaId: 'Q3208041', sala: 3, autore: 'autore1',
    titolo: 'Ultima cena',
    descrizione: 'El Greco, 1568 circa. Olio su tavola.',
    autoreOpera: 'El Greco', stile: 'Manierismo',
    immagine: img('El%20Greco%20020.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'La stessa scena dipinta da Leonardo, ma piccolissima e con i colori accesi. È un\'opera giovanile di un pittore che poi diventerà famosissimo in Spagna.' },
      { durata: '1min', livello: 'medio', testo: 'Domenikos Theotokopoulos, detto El Greco, dipinge questa tavoletta intorno al 1568, quando era ancora in Italia e stava studiando i veneziani. È un\'opera piccola e precoce, molto lontana dalle figure allungate e spettrali per cui sarà celebre a Toledo. Qui si vede soprattutto Tintoretto: la scena in diagonale, la luce che taglia, il colore acceso. È interessante proprio perché mostra un artista che sta ancora imparando.' },
      { durata: '4min', livello: 'specialistico', testo: 'La tavoletta si colloca nella fase veneziana dell\'artista, dopo l\'abbandono di Candia e la formazione post-bizantina, e prima del soggiorno romano. L\'impianto obliquo e la gestione della luce dichiarano lo studio diretto di Tintoretto, mentre il trattamento del colore e la costruzione delle figure conservano tracce della cultura icona-dipendente delle origini. Il formato ridotto rimanda alla produzione destinata alla devozione privata o al mercato dei collezionisti. Il valore dell\'opera è documentario: consente di misurare quanto della maniera toledana sia elaborazione tarda e quanto invece derivi dal tirocinio italiano.' }
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
      { durata: '1min', livello: 'medio', testo: 'Agostino Carracci dipinge questa tela per la Certosa di Bologna nel 1592. San Girolamo, ormai vecchissimo, viene sorretto per ricevere l\'ultima comunione. Il corpo emaciato è studiato dal vero, non idealizzato, ed è proprio questo il programma dei Carracci: tornare a guardare la realtà dopo i virtuosismi del manierismo. Il quadro divenne un modello famoso, tanto che Domenichino ne fece una versione poi accusata di plagio.' },
      { durata: '4min', livello: 'specialistico', testo: 'L\'opera è uno dei manifesti della riforma carraccesca e occupa un posto preciso nella storiografia artistica per la celebre querelle sul plagio: la versione di Domenichino, oggi in Vaticano, scatenò l\'accusa mossa da Lanfranco, episodio che Bellori discute a lungo. L\'anatomia del santo è costruita su studio dal naturale e risponde al programma antimanierista dell\'Accademia degli Incamminati; l\'impaginazione, per contro, resta debitrice della tradizione veneta nella gestione della luce e del colore. Il soggetto risponde ai dettami tridentini sulla rappresentazione dei sacramenti, e la committenza certosina ne conferma la destinazione controriformistica.' }
    ]
  },
  {
    operaId: 'Q2448678', sala: 3, autore: 'autore1',
    titolo: 'Strage degli innocenti',
    descrizione: 'Guido Reni, 1611. Olio su tela, dalla chiesa di San Domenico.',
    autoreOpera: 'Guido Reni', stile: 'Barocco',
    immagine: img('Guido%20Reni%20-%20Massacre%20of%20the%20Innocents%20-%20Pinacoteca%20Nazionale%20Bologna.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'È una scena terribile, il racconto biblico dei bambini uccisi per ordine di Erode. Il pittore la dipinge senza mostrare sangue.' },
      { durata: '1min', livello: 'medio', testo: 'Guido Reni affronta nel 1611 uno dei soggetti più violenti della tradizione cristiana e sceglie di non mostrarne la violenza. Non c\'è sangue, i corpi non sono deformati, le madri gridano in pose che ricordano la scultura antica. Reni costruisce la scena come una piramide: le due madri in basso, i carnefici al centro, gli angeli con le palme del martirio in alto. Il dolore viene reso con la composizione, non con il dettaglio raccapricciante.' },
      { durata: '4min', livello: 'specialistico', testo: 'Eseguita per la cappella Berlo in San Domenico, la tela è il punto in cui Reni definisce il proprio classicismo in alternativa esplicita alla via caravaggesca. L\'impianto piramidale e la derivazione delle pose dalla statuaria antica e dai cartoni raffaelleschi rispondono a una teoria della bellezza ideale che Bellori codificherà poi come dottrina. La rinuncia al dettaglio cruento non è pudore ma scelta teorica: il decoro impone che il patetico sia veicolato dalla forma. L\'opera fu tra quelle requisite in età napoleonica e la sua fortuna critica ottocentesca, poi il rovesciamento novecentesco del giudizio su Reni, ne fanno un caso esemplare per la storia del gusto.' }
    ]
  },
  {
    operaId: 'Q25217589', sala: 3, autore: 'autore1',
    titolo: 'Pala della Peste',
    descrizione: 'Guido Reni, 1630-1631. Olio su seta, dipinta per la peste che colpì Bologna.',
    autoreOpera: 'Guido Reni', stile: 'Barocco',
    immagine: img('Guido%20Reni%20061.jpg'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'Dipinta durante un\'epidemia di peste, per chiedere che finisse. Sotto ci sono le torri di Bologna.' },
      { durata: '1min', livello: 'medio', testo: 'Nel 1630 la peste devasta il nord Italia, la stessa epidemia raccontata dai Promessi Sposi. Bologna commissiona a Guido Reni uno stendardo da portare in processione: è dipinto su seta, non su tela, proprio perché doveva essere leggero e sfilare per le strade. In alto la Madonna con i santi protettori della città, in basso il profilo di Bologna con le torri. È un\'opera d\'arte che era anche un atto pubblico, un voto collettivo.' },
      { durata: '4min', livello: 'specialistico', testo: 'Il Pallione del Voto è documento della funzione civica dell\'immagine sacra nella Bologna del Seicento. Il supporto serico, scelto per la destinazione processionale, ha condizionato tecnica e conservazione, imponendo una stesura fluida e ponendo problemi di restauro peculiari. L\'iconografia allinea i patroni cittadini secondo una gerarchia che riflette la topografia devozionale locale; la veduta urbana in basso ha valore topografico. L\'opera si colloca nella fase tarda di Reni, quando la tavolozza si schiarisce progressivamente verso quella "maniera argentina" che caratterizza l\'ultimo decennio e che la critica ha letto ora come esito spirituale ora come conseguenza di una produzione di bottega accelerata.' }
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
      { durata: '15s', livello: 'elementare', testo: 'Elisabetta Sirani aveva poco più di vent\'anni quando lo ha dipinto, in un\'epoca in cui alle donne quasi non era permesso fare le pittrici. Ne dipinse duecento di quadri, e morì a ventisette anni.' },
      { durata: '1min', livello: 'medio', testo: 'Elisabetta Sirani è una figura eccezionale del Seicento bolognese: figlia d\'arte, prese in mano la bottega del padre da giovanissima, dipinse circa duecento opere documentate e aprì una scuola di pittura per ragazze, cosa senza precedenti. Morì a ventisette anni, nel 1665, fra sospetti mai chiariti di avvelenamento. Questa tela mostra il suo debito verso Guido Reni nella dolcezza dei volti, ma anche una stesura più rapida e una luce sua.' },
      { durata: '4min', livello: 'specialistico', testo: 'La produzione della Sirani è documentata con precisione insolita grazie al libro di nota che l\'artista teneva personalmente, fonte primaria per la ricostruzione del catalogo e per lo studio delle pratiche di bottega bolognesi. La sua scuola per allieve costituisce un unicum nel panorama europeo del Seicento e ha reso il caso centrale negli studi sulla professionalizzazione femminile in ambito artistico. Sul piano formale l\'adesione al reniano tardo è evidente nella tipologia dei volti e nella tavolozza schiarita, ma la conduzione del pennello è più corsiva, in parte per necessità produttiva. Le circostanze della morte, con il processo che ne seguì, sono documentate negli atti e restano di interpretazione discussa.' }
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
      { durata: '15s', livello: 'infantile', testo: 'Guarda quanti gioielli su una bambina così piccola: collane, spille, ricami d\'oro. Non erano suoi, servivano a far vedere quanto era ricca la famiglia.' },
      { durata: '1min', livello: 'elementare', testo: 'Lavinia Fontana fu una delle prime donne in Europa a vivere del proprio lavoro di pittrice, con una bottega sua e committenti importanti fino a Roma. Qui ritrae una neonata coperta di gioielli: sembra strano, ma i ritratti di bambini servivano a mostrare la ricchezza e la continuità della famiglia. I gioielli sono dipinti uno per uno con enorme precisione, ed erano il pezzo forte del quadro.' },
      { durata: '4min', livello: 'specialistico', testo: 'Lavinia Fontana rappresenta il caso meglio documentato di professionalizzazione femminile nella pittura di età moderna: attiva a Bologna e poi a Roma, con committenza aristocratica e pontificia, mantenne bottega propria e famiglia numerosa. La ritrattistica infantile risponde a esigenze dinastiche precise e l\'ostentazione dell\'apparato di gioielli va letta come inventario visivo del patrimonio familiare, secondo una funzione documentaria attestata anche dalle fonti notarili coeve. La resa analitica degli ornamenti riprende la tradizione ritrattistica emiliana e nord-europea; l\'identificazione della bambina è stata proposta in relazione a più famiglie senatorie bolognesi senza approdo definitivo.' }
    ]
  },
  // Secondi item sulle stesse opere
  // La specifica lo chiede espressamente: "Ogni visita può (dovrebbe!!!) avere
  // multipli item per lo stesso oggetto di visita". Stesso codice Wikidata, autore
  // diverso, taglio diverso: è il caso in cui il visitatore sceglie chi ascoltare.
  // `chiave` serve solo qui dentro per distinguerli quando si montano le visite.
  {
    chiave: 'polittico-materiali', operaId: 'Q3907499', sala: 1, autore: 'autore2',
    titolo: 'Il Polittico di Giotto: oro, legno e bottega',
    descrizione: 'Giotto, 1333 circa. Come è fatto materialmente un polittico su tavola.',
    autoreOpera: 'Giotto', stile: 'Gotico',
    licenza: 'CC-BY', prezzo: 1.5,
    immagine: img('Giotto.%20Polyptych.%201330-35.%2091x340cm.%20Pinacoteca%2C%20Bologna..jpg'),
    testi: [
      { durata: '15s', livello: 'medio', testo: 'Non è un quadro solo: sono tavole di pioppo unite da una carpenteria di legno. Sopra il legno va uno strato di gesso, poi la foglia d\'oro, poi il colore stemperato nel tuorlo d\'uovo.' },
      { durata: '1min', livello: 'medio', testo: 'Un polittico nasce come un mobile. Il falegname assembla le tavole di pioppo e la cornice, poi la bottega stende sul legno strati sottilissimi di gesso e colla fino a ottenere una superficie liscia come un muro intonacato. Sopra si applica la foglia d\'oro, battuta fino a poche migliaia di millimetro, e la si lucida con una pietra dura finché non riflette la luce delle candele. Solo alla fine arriva il colore, macinato a mano e stemperato nel tuorlo d\'uovo, che asciuga in fretta e obbliga a dipingere per piccoli tratti sovrapposti. Quello che vedete non è quindi il lavoro di un uomo solo, ma di una squadra in cui Giotto firma e dirige.' },
      { durata: '4min', livello: 'specialistico', testo: 'La struttura del polittico va letta come un manufatto prima che come un dipinto. Il supporto è in pioppo, legno tenero e disponibile, tagliato in assi verticali e collegato da traverse; la carpenteria della cornice è solidale al supporto, non applicata dopo, ed è quella che determina la scansione degli scomparti e delle cuspidi. Sul legno si stende la preparazione: colla animale e gesso in più passate, levigate fino a ottenere un piano che accolga la doratura senza granulosità. La foglia d\'oro viene posata su bolo armeno, l\'argilla rossastra che le dà calore e ne permette la brunitura; sotto la doratura, in molti punti, si legge ancora l\'incisione preparatoria del disegno. La pittura è a tempera d\'uovo: il legante asciuga in pochi minuti e non consente ritocchi, quindi il modellato si costruisce per velature successive e per tratteggio, tecnica che spiega la resa quasi grafica degli incarnati. Il rapporto fra maestro e bottega, che la critica discute da tempo, si legge proprio qui: la coerenza dell\'impianto e la qualità delle teste centrali si accompagnano a passaggi laterali più correnti nella stesura dei panneggi. Infine la storia conservativa: i polittici sono stati quasi tutti smembrati fra Sette e Ottocento, quando il mercato preferiva le tavole singole, e la ricomposizione che vedete è il risultato di un lavoro di ricerca museale.' }
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
      { durata: '1min', livello: 'medio', testo: 'Un ritratto si legge partendo da tre cose: dove guarda la persona, cosa fanno le mani, e quanta aria c\'è intorno. Qui lo sguardo esce dal quadro ma non incrocia il nostro, e questo tiene il frate a distanza; le mani sono ferme sul libro, un gesto sospeso che non racconta un\'azione ma uno stato; lo spazio è stretto, il fondo scuro sta addosso alla figura e non lascia respiro. Sono scelte, non limiti del pittore: nello stesso momento altri ritrattisti allargano lo sfondo su paesaggi e finestre. Bedoli toglie tutto quello che potrebbe distrarre e lascia solo la tensione interna del personaggio.' }
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
      { durata: '4min', livello: 'specialistico', testo: 'La tela è organizzata su tre registri sovrapposti che funzionano come i piani di un palcoscenico. In basso i corpi dei bambini e le madri inginocchiate costruiscono una fascia orizzontale che chiude la composizione e obbliga lo sguardo a risalire. Al centro il gruppo dei sicari e delle madri in fuga forma una diagonale che attraversa il campo da sinistra verso destra: è il vero motore della scena, e Reni la costruisce alternando braccia alzate e teste rovesciate in un ritmo quasi musicale. In alto, sopra l\'architettura appena accennata, i due angeli con le palme introducono il registro celeste e sciolgono l\'orrore in significato. La scelta che allontana Reni dal naturalismo dei suoi anni è la temperatura emotiva: nessuna figura è deformata dal dolore, i volti restano composti anche nell\'urlo, e il colore chiaro e smaltato tiene la scena a distanza. È la lezione classicista dell\'ambiente bolognese, che rifiuta di far coincidere la violenza del soggetto con la violenza della pittura. Il confronto obbligato è con le stesse scene dipinte a Roma negli stessi anni, dove il buio e il taglio ravvicinato cercano invece l\'urto diretto con chi guarda.' }
    ]
  },

  // Approfondimenti
  // "Gli item possono riferirsi sia agli oggetti della visita, sia a contenuti
  // associati (movimenti culturali, stili, artisti, eventi storici)". Questi non
  // sono oggetti esposti, quindi non stanno sulla mappa: il codice Wikidata è
  // quello del movimento o della persona.
  {
    chiave: 'manierismo', operaId: 'Q131808', tipo: 'approfondimento', autore: 'autore2',
    titolo: 'Che cos\'è il Manierismo',
    descrizione: 'Il movimento a cui appartengono diverse opere di questa sala.',
    stile: 'Manierismo',
    licenza: 'CC-BY-SA', prezzo: 0,
    immagine: null,
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'È il modo di dipingere che viene dopo Raffaello: figure allungate, colori strani e pose difficili, fatte apposta per stupire.' },
      { durata: '1min', livello: 'medio', testo: 'Manierismo è il nome che si dà alla pittura italiana del Cinquecento dopo la generazione di Raffaello e Michelangelo. Il problema di quei pittori è che i modelli erano già perfetti: invece di ripeterli, hanno cominciato a forzarli. Le figure si allungano, le pose diventano difficili, i colori si fanno acidi e cangianti, e lo spazio smette di essere misurabile. Per secoli è stato giudicato un periodo di decadenza, proprio perché si allontanava dall\'equilibrio classico; oggi si legge al contrario, come una ricerca consapevole di eleganza e artificio. La parola viene da "maniera", che nel Cinquecento non significava affettazione ma stile personale riconoscibile.' },
      { durata: '4min', livello: 'specialistico', testo: 'Il termine nasce da Vasari, che usa "maniera" come categoria di qualità stilistica, e viene trasformato in etichetta storiografica solo nell\'Ottocento, con una connotazione negativa che il Novecento ha progressivamente smontato. Il fenomeno si colloca fra il terzo decennio del Cinquecento e la fine del secolo, e non è unitario: la linea fiorentina di Pontormo e Rosso lavora sulla dissonanza cromatica e sulla compressione spaziale; quella emiliana, che interessa direttamente questa raccolta, passa attraverso Parmigianino e la sua discendenza, con l\'allungamento delle proporzioni, la levigatezza degli incarnati e un\'eleganza che diventa fine a se stessa. Bedoli, cugino acquisito e collaboratore di Parmigianino, ne rappresenta la versione più misurata e ritrattistica. Sul piano dei contenuti il Manierismo coincide con la crisi religiosa del secolo: la Riforma e poi il Concilio di Trento cambiano la committenza e le regole dell\'immagine sacra, e la ricerca formale si intreccia con la richiesta di decoro. Il superamento arriverà proprio da Bologna, con la riforma naturalistica dei Carracci.' }
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
      { durata: '15s', livello: 'medio', testo: 'Bolognese, 1575-1642. Formato nell\'Accademia dei Carracci, lavora fra Bologna e Roma e diventa il pittore più pagato d\'Europa. La sua cifra è la luce chiara e le figure composte anche nelle scene tragiche.' },
      { durata: '1min', livello: 'medio', testo: 'Guido Reni nasce a Bologna nel 1575 e si forma nell\'Accademia dei Carracci, dove impara a disegnare dal vero prima che dai modelli antichi. A Roma incontra la pittura di Caravaggio e la rifiuta consapevolmente: prende il naturalismo dei corpi ma lo porta verso una luce alta e chiarissima, l\'opposto dei fondi neri. Torna a Bologna e diventa il pittore più richiesto e più pagato del suo tempo, con una bottega numerosa. La sua fama ottocentesca lo trasforma nel campione della grazia, la reazione novecentesca lo condanna come sdolcinato, e solo in tempi recenti se ne è riletta la costruzione intellettuale. Muore nel 1642, pieno di debiti di gioco.' }
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
      { durata: '1min', livello: 'medio', testo: 'Verso il 1582 Ludovico Carracci e i cugini Agostino e Annibale aprono a Bologna una bottega-scuola che chiamano degli Incamminati, cioè di quelli che si sono messi in cammino. L\'idea è semplice e per l\'epoca radicale: si impara disegnando dal vero, dal modello vivo e dalla natura, invece di ripetere le formule dei manieristi. Da quella scuola escono Guido Reni, Domenichino, Guercino e l\'Albani, cioè quasi tutti i pittori che riempiono le sale del Seicento di questo museo. È anche il primo caso in Italia di una didattica organizzata dell\'arte, con lezioni di anatomia e di prospettiva: il modello delle accademie che si diffonderanno in tutta Europa nei due secoli successivi.' }
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
      { opera: 'Q3907499', indicazione: 'Dall\'ingresso sali la scala principale ed entra nella Sala 1: la tavola dorata è sulla parete di fronte.' },
      // stessa opera, un altro autore: chi vuole sapere com'è fatta resta qui davanti
      { opera: 'polittico-materiali', indicazione: 'Resta davanti alla stessa tavola.', opzionale: true },
      { opera: 'Q27345212', indicazione: 'Stessa sala, sulla parete a sinistra.' },
      { opera: 'Q3889219', indicazione: 'Sempre in Sala 1, ultima parete a destra prima del passaggio.' },
      { opera: 'Q16038421', indicazione: 'Attraversa il passaggio ed entra in Sala 2: la pala è subito a sinistra.' },
      { opera: 'Q3213771', indicazione: 'Prosegui lungo la stessa parete.' },
      { opera: 'Q1103801', indicazione: 'Al centro della Sala 2, nella nicchia dedicata.' },
      { opera: 'Q3842737', indicazione: 'Sulla parete di destra della Sala 2.' },
      { opera: 'Q3208041', indicazione: 'Scendi in Sala 3 e gira a sinistra: è una tavola piccola, cercala ad altezza occhi.', opzionale: true },
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
      { opera: 'Q27345212', indicazione: 'Sali la scala ed entra in Sala 1: il cavaliere col drago è sulla parete a sinistra.' },
      { opera: 'Q3907499', indicazione: 'Girati verso la parete di fronte: è il quadro tutto dorato.' },
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

// Il secondo museo: Palazzo Pepoli Campogrande, la sede della Pinacoteca che ospita la
// collezione Zambeccari. Le sale portano il nome degli affreschi delle volte, e ogni volta
// l'ha fatta dipingere un Pepoli diverso, uno dopo l'altro: per questo qui le opere
// principali sono i soffitti. Le sale e i fatti vengono dalle pagine del museo
// (pinacotecabologna.cultura.gov.it), i codici e le immagini da Wikidata e Commons.
// I codici sono le chiavi di `posizioni` in navigator/public/config/palazzo-pepoli.json.
const OPERE_PEPOLI = [
  {
    operaId: 'Q123685640', autore: 'autore1',
    titolo: 'La vita di Taddeo Pepoli',
    descrizione: 'Domenico Maria Canuti, 1665. Affreschi nei due ovali dello scalone.',
    autoreOpera: 'Domenico Maria Canuti', stile: 'Barocco',
    immagine: img('2017-03%20Bologna%20Mattes%20Pana%20%28156%29%20%28Taddeo%20becoming%20the%20ruler%20of%20Bologna%20in%201337%29.JPG'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Due storie di un antenato famoso della famiglia.' },
      { durata: '15s', livello: 'elementare', testo: 'Salendo le scale si incontrano due ovali dipinti. Raccontano Taddeo Pepoli, l\'antenato più illustre della famiglia: nel 1337 diventa signore di Bologna, e pochi anni dopo il papa gli riconosce quel potere.' },
      { durata: '1min', livello: 'medio', testo: 'Prima ancora del Salone d\'onore, Domenico Maria Canuti dipinge per Odoardo Pepoli i due ovali dello scalone. La scelta del soggetto è un biglietto da visita: chi sale incontra per prima cosa Taddeo Pepoli, che nel 1337 si fa signore di Bologna e nel 1340 ottiene da papa Benedetto XII il titolo di vicario apostolico, cioè il riconoscimento del suo governo da parte della Chiesa. Trecento anni dopo i Pepoli non sono più signori della città, ma ci tengono a ricordare a ogni ospite da dove viene il loro nome. Il resto del palazzo continua questo racconto.' }
    ]
  },
  {
    operaId: 'Q131543603', autore: 'autore1',
    titolo: 'Apoteosi di Ercole',
    descrizione: 'Domenico Maria Canuti, con le quadrature di Antonio Santi detto il Mengazzino, 1669-1671. Affresco sulla volta del Salone d\'onore.',
    autoreOpera: 'Domenico Maria Canuti', stile: 'Barocco',
    immagine: img('Palazzo%20Pepoli%20Campogrande%20-%20il%20soffitto%20del%20Salone%20d%27onore.jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Alza la testa: il soffitto è un cielo pieno di dei.' },
      { durata: '15s', livello: 'elementare', testo: 'Ercole, l\'eroe fortissimo, viene accolto sull\'Olimpo da Giove, seduto su un\'aquila. Sotto di lui cadono due donne, la Superbia e l\'Invidia. E le colonne e i cornicioni tutto intorno? Sono dipinti.' },
      { durata: '1min', livello: 'medio', testo: 'Tra il 1669 e il 1671 Domenico Maria Canuti dipinge per Odoardo Pepoli la volta di questa sala. Al centro Ercole viene accolto nell\'Olimpo da Giove, a cavalcioni dell\'aquila, con accanto Giunone, Amore ed Ebe, la dea dell\'eterna giovinezza che diventa sua sposa. Sotto l\'eroe la Ragione tiene a bada la Forza, e la Superbia e l\'Invidia precipitano verso il basso. Il nome non è scelto a caso: Ercole si chiamavano il padre di Odoardo e il nipote destinato a ereditare la casata. Celebrare l\'eroe era un modo di celebrare la famiglia.' },
      { durata: '4min', livello: 'specialistico', testo: 'La volta nasce dalla collaborazione, tipica della decorazione bolognese del Seicento, fra un figurista, Canuti, e un quadraturista, Antonio Santi detto il Mengazzino. È quest\'ultimo a costruire l\'impianto: amplia l\'architettura reale della sala con cornicioni, balaustre, archi, nicchie, colonne e bassorilievi dipinti, fino a far credere che lo spazio si apra all\'infinito sul cielo in cui si svolge la scena. L\'architettura finta è abitata da telamoni che reggono i cornicioni e da putti con festoni di frutta; ai quattro angoli, giganti in pose forzate rimandano agli ignudi michelangioleschi della Sistina. Al centro di ogni lato quattro medaglioni a monocromo dorato raccontano altre imprese dell\'eroe: la liberazione di Alcesti dall\'Ade, la contesa del tripode di Delfi, Ercole e i Cercopi, i pomi delle Esperidi. Il soggetto è dinastico prima che mitologico: Ercole era il nome del padre di Odoardo e del nipote erede della casata, e la sua apoteosi è un\'apoteosi dei Pepoli.' }
    ]
  },
  {
    operaId: 'Q131628822', autore: 'autore2',
    titolo: 'Trionfo di Felsina',
    descrizione: 'Giuseppe e Antonio Rolli, 1690. Affresco sulla volta della Sala di Felsina.',
    autoreOpera: 'Giuseppe e Antonio Rolli', stile: 'Barocco',
    immagine: img('Giuseppe%20e%20Antonio%20Rolli%2C%20Trionfo%20di%20Felsina%2C%20affresco%2C%20%281690%29%2C%20soffitto%2C%20palazzo%20Pepoli%20Campogrande%20Bologna.jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Una ragazza su un carro tirato da leoni con le ali.' },
      { durata: '15s', livello: 'elementare', testo: 'Felsina è il nome antico di Bologna. La ragazza bionda sul carro, tirato dai leoni alati di Venezia, rappresenta i nobili bolognesi. In un angolo un bambino spezza delle catene: è la libertà che volevano dal papa.' },
      { durata: '1min', livello: 'medio', testo: 'Nel 1680 Odoardo Pepoli muore e i lavori passano al nipote Ercole, che nel 1686 entra a far parte della nobiltà veneziana. Questa volta lo racconta: nel 1690 i fratelli Rolli, allievi di Canuti, dipingono il Trionfo di Felsina, cioè di Bologna. La giovane sul cocchio è l\'Aristocrazia bolognese, e i leoni alati che la trainano sono quelli di Venezia; un putto la incorona con il corno ducale, il berretto rosso dei dogi. Le ancelle intorno portano i simboli del potere e di Bologna, compreso il vessillo con la scritta Libertas, e un putto spezza le catene: la libertà dal governo del papa, a cui la nobiltà della città aspirava.' },
      { durata: '4min', livello: 'specialistico', testo: 'La sala è decorata nel 1690 dai fratelli Rolli secondo la divisione dei compiti consueta a Bologna: Giuseppe come figurista, Antonio come quadraturista. Il programma allude all\'aggregazione di Ercole Pepoli, senatore dal 1683, alla nobiltà veneziana nel 1686, e va letto sullo sfondo del governo misto della città, retta dal Legato pontificio e da un Senato ereditario di famiglie aristocratiche. L\'Aristocrazia bolognese avanza su un cocchio trainato dai leoni marciani, incoronata col corno ducale; le ancelle recano il fascio littorio, la clava che rimanda a Ercole, lo stendardo crociato e il vessillo con la scritta Libertas, mentre un putto spezza le catene della soggezione papale. Sotto il carro la Felicità pubblica, con cornucopia e caduceo, addita a Felsina una fanciulla letta ora come Amore, per la rosa, ora come la Casata dei Pepoli, per il cigno araldico sul calzare. Completano il programma la Giustizia che sottomette la Forza, con la scritta IUS sul libro, la Generosità e la Scienza.' }
    ]
  },
  {
    operaId: 'Q131628823', autore: 'autore1',
    titolo: 'Trionfo di Ercole e le Stagioni',
    descrizione: 'Giuseppe Maria Crespi, 1699-1700 circa. Affresco sulla volta della Sala delle Stagioni.',
    autoreOpera: 'Giuseppe Maria Crespi', stile: 'Barocco',
    immagine: img('Giuseppe%20maria%20crespi%2C%20trionfo%20di%20ercole%2C%201691-1702%20ca.%2C%20sala%20delle%20stagioni%20di%20pal.%20pepoli%2001.jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Quattro personaggi si sporgono per guardarti.' },
      { durata: '15s', livello: 'elementare', testo: 'Dal bordo del soffitto si affacciano le quattro Stagioni, ma sembrano contadini travestiti. L\'Estate ha uno specchio per abbagliarti, l\'Inverno è un vecchio che ha freddo. In mezzo, quasi nascosto, passa Ercole sul suo carro.' },
      { durata: '1min', livello: 'medio', testo: 'Questa volta la dipinge un solo pittore, Giuseppe Maria Crespi, intorno al 1699-1700, e si vede. L\'architettura finta si riduce a un parapetto, e da lì si sporgono quattro figure che per gli attributi sono le Stagioni, ma che somigliano piuttosto a contadini travestiti in fretta. La Primavera, coronata di mirto, ride del proprio costume; l\'Estate, coronata di spighe, gioca ad abbagliare i visitatori con uno specchio ustorio; l\'Autunno si tira su la veste per pigiare l\'uva; l\'Inverno è un vecchio infreddolito, e i bambini lasciano spegnere il fuoco per un gioco poco educato. Al centro ci sarebbe il protagonista, Ercole in trionfo: ma resta in secondo piano.' },
      { durata: '4min', livello: 'specialistico', testo: 'Rispetto alle sale precedenti, dove figurista e quadraturista lavorano in coppia, qui Giuseppe Maria Crespi fa tutto da solo, attorno al 1699-1700, e la differenza è di sostanza. La quadratura perde il ruolo di protagonista e si riduce a una balaustra impostata sul cornicione reale. Da questa si affacciano le Stagioni, riconoscibili dagli attributi ma dipinte con un carattere popolaresco che le allontana dalla personificazione allegorica: sono contadini travestiti, che si sporgono per attirare l\'attenzione di chi guarda. Il tema celebrativo resta al centro della volta: Ercole attraversa il cielo sul carro scortato dalle Ore, fanciulle con ali di libellula, mentre il Tempo, vecchio alato con falce e clessidra, precipita sconfitto dall\'eroe divenuto immortale. Ma la gerarchia si rovescia: la vitalità delle Stagioni supera il trionfo, e il naturalismo di Crespi comincia a incrinare la tradizione della grande decorazione bolognese.' }
    ]
  },
  {
    operaId: 'Q123685655', autore: 'autore2',
    titolo: 'Ester davanti ad Assuero; Adamo ed Eva',
    descrizione: 'Pittore manierista di Anversa, 1510 circa.',
    autoreOpera: 'Pittore manierista di Anversa', stile: 'Manierismo',
    immagine: img('2017-03%20Bologna%20Mattes%20Pana%20%28178%29.JPG'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Una regina davanti a un re.' },
      { durata: '15s', livello: 'elementare', testo: 'La regina Ester si presenta al re Assuero senza essere chiamata, e per questo rischia la vita: lo fa per salvare il suo popolo. L\'opera ha anche un secondo soggetto, Adamo ed Eva.' },
      { durata: '1min', livello: 'medio', testo: 'Il pittore non ha un nome: è uno dei cosiddetti manieristi di Anversa, artisti attivi in quella città nei primi decenni del Cinquecento, che si riconoscono dalle figure allungate, dalle vesti sontuose e dalle architetture fantastiche. La scena principale viene dalla Bibbia: la regina Ester si presenta al re persiano Assuero senza essere stata convocata, cosa che poteva costarle la vita, per chiedergli di salvare il suo popolo. L\'opera ha anche un secondo soggetto, Adamo ed Eva. Il nome del gruppo inganna: con il Manierismo italiano questi pittori non hanno niente a che fare.' }
    ]
  },
  {
    operaId: 'Q123685682', autore: 'autore1',
    titolo: 'L\'Olimpo',
    descrizione: 'Giuseppe Maria Crespi, 1700 circa. Affresco sulla volta della Sala dell\'Olimpo.',
    autoreOpera: 'Giuseppe Maria Crespi', stile: 'Barocco',
    immagine: img('2017-03%20Bologna%20Mattes%20Pana%20%28188%29.JPG'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Il cielo degli dei, pieno di colori.' },
      { durata: '15s', livello: 'elementare', testo: 'Qui non ci sono colonne dipinte: il soffitto si apre su un paesaggio con il mare e un cielo infuocato. Ci sono tutti gli dei dell\'Olimpo, e Venere tiene in grembo un cigno: è il cigno dei Pepoli.' },
      { durata: '1min', livello: 'medio', testo: 'Nello stesso periodo della Sala delle Stagioni, Crespi affresca anche questa volta, e qui si stacca del tutto dalla tradizione bolognese: niente più architettura dipinta, il soffitto diventa un\'unica grande apertura su un paesaggio di bosco e di mare, in toni grigio-azzurri, sotto un cielo che si accende. In alto passa il carro del Sole, poi Mercurio in volo, al centro Giove e Giunone. Marte si toglie l\'elmo, Minerva è in armatura, Amore porta una fiaccola accesa, e Venere tiene in grembo il cigno araldico dei Pepoli. Visti i temi, si pensa che fosse una camera nuziale.' },
      { durata: '4min', livello: 'specialistico', testo: 'Con questa volta Crespi porta a compimento l\'allontanamento dalla quadratura, il genere che nella Bologna del Seicento aveva servito le esigenze celebrative delle famiglie aristocratiche combinando illusionismo architettonico e trionfi sacri o mitologici. L\'architettura prospettica scompare, e il soffitto è occupato da un\'apertura paesaggistica che sale dall\'imposta della volta. Nella fascia sopra il cornicione si leggono Nettuno e Anfitrite sul carro, Diana con le ninfe e i cani dopo la caccia, Plutone che rapisce Proserpina. A destra le Parche, Cloto, Lachesi e Atropo: tradizionalmente vecchie e deformi, qui sono floride fanciulle, e accanto a loro un bambino soffia bolle di sapone. Il senso è esplicito: le favole mitologiche, come la gloria terrena, sono belle e inconsistenti, e la vita è appesa al filo che Atropo, con sguardo beffardo, è pronta a recidere.' }
    ]
  },
  {
    operaId: 'Q131472696', autore: 'autore2',
    titolo: 'Lucrezia',
    descrizione: 'Bartolomeo Passerotti, XVI secolo.',
    autoreOpera: 'Bartolomeo Passerotti', stile: 'Manierismo',
    immagine: img('Bartolomeo%20passerotti%2C%20lucrezia%2002.jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Una donna romana di tanto tempo fa.' },
      { durata: '15s', livello: 'elementare', testo: 'Lucrezia è una donna dell\'antica Roma. Dopo una grave offesa ricevuta dal figlio del re sceglie di morire, e il suo gesto fa ribellare la città: così, racconta la leggenda, i re vengono cacciati da Roma.' },
      { durata: '1min', livello: 'medio', testo: 'Bartolomeo Passerotti è uno dei pittori più richiesti della Bologna del Cinquecento, prima che arrivassero i Carracci: famoso per i ritratti e per le scene di vita quotidiana, come i suoi banchi di macellai e di pescivendoli. Qui affronta un soggetto classico. Secondo lo storico Tito Livio, Lucrezia, nobildonna romana, viene violentata da Sesto Tarquinio, figlio del re; racconta tutto al padre e al marito e si toglie la vita. Lo sdegno che ne segue porta alla cacciata dei re e alla nascita della Repubblica romana. Per secoli Lucrezia è stata dipinta come modello di virtù, ed è così che la vedevano i collezionisti del tempo.' }
    ]
  },
  {
    operaId: 'Q114073475', autore: 'autore1',
    titolo: 'Abramo visitato dagli angeli',
    descrizione: 'Ludovico Carracci, 1610 circa.',
    autoreOpera: 'Ludovico Carracci', stile: 'Barocco',
    immagine: img('Carracci%2C%20Lodovico%E2%80%94Abraham%20And%20The%20Three%20Angels%E2%80%94Q114073475.jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Tre angeli vengono a trovare un vecchio.' },
      { durata: '15s', livello: 'elementare', testo: 'Abramo accoglie tre visitatori sconosciuti e offre loro da mangiare. Sono angeli, e portano una notizia incredibile: sua moglie Sara, anche se è anziana, avrà un figlio.' },
      { durata: '1min', livello: 'medio', testo: 'Il racconto è nel libro della Genesi. Presso le querce di Mamre Abramo vede arrivare tre sconosciuti, corre loro incontro e li accoglie con tutti gli onori. Sono messaggeri di Dio, e annunciano che Sara, sua moglie ormai anziana, avrà un figlio: sarà Isacco. Ludovico era il più anziano dei tre Carracci, e con i cugini Annibale e Agostino aveva fondato a Bologna l\'Accademia degli Incamminati, la scuola che riportò la pittura allo studio del vero dopo le raffinatezze del tardo Manierismo.' }
    ]
  },
  {
    operaId: 'Q131449654', autore: 'autore2',
    titolo: 'Alessandro taglia il nodo gordiano',
    descrizione: 'Donato Creti, con le quadrature di Marc\'Antonio Chiarini, 1710. Affresco sulla volta della Sala di Alessandro.',
    autoreOpera: 'Donato Creti', stile: 'Barocco',
    immagine: img('Creti%2C%20Donato%20%E2%80%94%20Alessandro%20taglia%20il%20nodo%20gordiano.jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Un re taglia una corda con la spada.' },
      { durata: '15s', livello: 'elementare', testo: 'C\'era un nodo che nessuno riusciva a sciogliere, e chi ci fosse riuscito avrebbe conquistato tutta l\'Asia. Alessandro Magno non perde tempo: lo taglia con un colpo di spada. Guarda il suo mantello rosso.' },
      { durata: '1min', livello: 'medio', testo: 'Alla morte di Ercole Pepoli, nel 1707, i lavori passano ad Alessandro, che nel 1710 chiama Donato Creti. E come Ercole prima di lui sceglie un eroe col proprio nome: Alessandro Magno. Durante la guerra contro il re persiano Dario, il condottiero entra a Gordio, dove è conservato il carro degli antenati di re Mida, legato con un nodo che nessuno riesce a sciogliere. Una profezia dice che chi lo scioglie conquisterà l\'Asia. Alessandro non ci prova nemmeno: lo taglia con la spada. Creti lo dipinge al centro, col mantello rosso, un attimo prima del colpo.' },
      { durata: '4min', livello: 'specialistico', testo: 'Con la Sala di Alessandro, dopo il naturalismo di Crespi, torna l\'ordine. Riappare la quadratura, affidata a Marc\'Antonio Chiarini, che con una vertiginosa successione di spazi illusori amplia a dismisura un soffitto in realtà non grande e diventa la vera protagonista della decorazione. Al centro dello sfondato Creti colloca il condottiero eretto davanti al carro, sormontato da una statua di Giove, nel momento che precede il colpo; il rosso vivo del mantello isola la figura. Nei due medaglioni dorati alla base della volta sono raffigurati Alessandro con il maestro Aristotele e la vittoria su Dario a Isso. Il classicismo di Creti, fatto di fermezza costruttiva e di un disegno impeccabile, si contrappone alla vitalità degli affreschi di Crespi, e chiude la sequenza con cui tre Pepoli, uno dopo l\'altro, hanno scritto la storia della famiglia sulle volte del palazzo.' }
    ]
  },
  {
    operaId: 'Q123685671', autore: 'autore1',
    titolo: 'Abramo sacrifica Isacco',
    descrizione: 'Mattia Preti, intorno al 1652.',
    autoreOpera: 'Mattia Preti', stile: 'Barocco',
    immagine: img('2017-03%20Bologna%20Mattes%20Pana%20%28197%29.JPG'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Un angelo ferma la mano di un padre.' },
      { durata: '15s', livello: 'elementare', testo: 'Dio mette alla prova Abramo chiedendogli di sacrificare il figlio Isacco. All\'ultimo istante arriva un angelo e gli ferma la mano. Guarda come la luce illumina solo alcune parti, e il resto resta al buio.' },
      { durata: '1min', livello: 'medio', testo: 'È uno degli episodi più drammatici della Genesi. Dio mette alla prova Abramo chiedendogli di sacrificare il figlio Isacco; Abramo obbedisce, ma quando alza il coltello un angelo lo ferma, e al posto del ragazzo viene sacrificato un montone. Mattia Preti, calabrese, detto il Cavalier Calabrese, è uno dei pittori che più hanno raccolto l\'eredità di Caravaggio: figure a grandezza naturale, luce violenta che le strappa al buio, gesti colti nell\'istante decisivo. Lavorerà poi a Napoli e a Malta, per i Cavalieri dell\'Ordine.' }
    ]
  },

  // Secondi item sulle stesse opere: un altro autore, un altro taglio
  {
    chiave: 'salone-stemma', operaId: 'Q131543603', autore: 'autore2',
    titolo: 'Lo scacchiere dei Pepoli',
    descrizione: 'Salone d\'onore: lo stemma alla base della volta e il pavimento.',
    autoreOpera: 'Domenico Maria Canuti', stile: 'Barocco',
    immagine: img('Palazzo%20Pepoli%20Campogrande%20-%20il%20soffitto%20del%20Salone%20d%27onore.jpg'),
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Il pavimento è a scacchi, come lo stemma.' },
      { durata: '15s', livello: 'elementare', testo: 'Guarda il pavimento: è a scacchi bianchi e neri, come lo stemma dei Pepoli dipinto in alto. Viene dalla scacchiera che usavano i cambiavalute per fare i conti: è da lì che la famiglia era partita.' },
      { durata: '1min', livello: 'medio', testo: 'Alla base della volta c\'è lo stemma dei Pepoli, uno scaccato bianco e nero. Lo stesso disegno torna nel pavimento del salone, e non è un caso: allude alla scacchiera, lo strumento di lavoro dei cambiavalute, il mestiere da cui era cominciata la ricchezza della famiglia. Accanto allo stemma ci sono le insegne delle mogli dei Pepoli, e sopra il cigno, l\'altro simbolo della casata, che ritroverai in tutte le sale del piano nobile. Guarda anche le corone sopra i cigni: sono di metallo, non dipinte, e ricordano il titolo di conte ottenuto dal ramo di Odoardo. Il vero e il dipinto si mescolano apposta.' }
    ]
  },
  {
    chiave: 'olimpo-colori', operaId: 'Q123685682', autore: 'autore2',
    titolo: 'Il bianco e il nero nell\'Olimpo',
    descrizione: 'Sala dell\'Olimpo: i colori della casata dentro il mito.',
    autoreOpera: 'Giuseppe Maria Crespi', stile: 'Barocco',
    immagine: img('2017-03%20Bologna%20Mattes%20Pana%20%28188%29.JPG'),
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'Cerca i colori dei Pepoli in questo cielo: la conchiglia che viene offerta a Giove è a scacchi bianchi e neri, come lo stemma. E i cavalli di Nettuno? Uno bianco e uno nero.' },
      { durata: '1min', livello: 'medio', testo: 'Lo scaccato bianco e nero dello stemma, quello che hai visto nel Salone d\'onore, qui entra nel mito. Sotto Giove e Giunone una coppia di divinità marine, forse Teti e Oceano, porge al re degli dei una conchiglia scaccata. Venere tiene in grembo il cigno, l\'altro simbolo della famiglia. E se guardi la fascia sopra il cornicione, i cavalli del carro di Nettuno sono uno bianco e uno nero, e bianchi e neri sono anche i cani di Diana: in un palazzo dove quei due colori tornano dappertutto, è difficile che sia un caso.' }
    ]
  },

  // Approfondimenti: non sono oggetti esposti, quindi non stanno sulla mappa
  {
    chiave: 'casato-pepoli', operaId: 'Q2268224', tipo: 'approfondimento', autore: 'autore1',
    titolo: 'Il casato dei Pepoli',
    descrizione: 'La famiglia che ha costruito e affrescato il palazzo.',
    stile: 'Barocco',
    licenza: 'CC-BY-SA', prezzo: 0,
    immagine: null,
    testi: [
      { durata: '15s', livello: 'elementare', testo: 'I Pepoli sono una famiglia bolognese che si arricchì facendo i cambiavalute. Nel Trecento uno di loro, Taddeo, diventò signore di Bologna. I loro simboli sono lo scaccato bianco e nero e il cigno: li troverai in ogni sala.' },
      { durata: '1min', livello: 'medio', testo: 'La ricchezza dei Pepoli nasce dal cambio del denaro: lo scaccato bianco e nero dello stemma ricorda la scacchiera su cui i cambiavalute facevano i conti. Nel 1337 Taddeo Pepoli si fa signore di Bologna e la governa per dieci anni. Nei secoli successivi, con la città sotto il governo del papa, la famiglia resta fra le più potenti e siede nel Senato cittadino. Nel Seicento un ramo della famiglia costruisce questo palazzo, e tre suoi esponenti, Odoardo, Ercole e Alessandro, lo fanno affrescare uno dopo l\'altro. Scelgono eroi che portano i nomi di casa: Ercole, come il padre di Odoardo e il nipote, e Alessandro Magno, come Alessandro.' }
    ]
  },
  {
    chiave: 'quadratura', operaId: 'Q2121876', tipo: 'approfondimento', autore: 'autore2',
    titolo: 'La quadratura: architetture dipinte',
    descrizione: 'Il genere pittorico delle volte di questo palazzo.',
    stile: 'Barocco',
    licenza: 'CC-BY-SA', prezzo: 0,
    immagine: null,
    testi: [
      { durata: '3s', livello: 'infantile', testo: 'Colonne dipinte che sembrano vere.' },
      { durata: '15s', livello: 'elementare', testo: 'Quadratura vuol dire dipingere architetture finte: colonne, archi e cornicioni che sembrano veri e fanno sembrare il soffitto più alto. Di solito lo facevano due pittori insieme, uno per le architetture e uno per le figure.' },
      { durata: '1min', livello: 'medio', testo: 'La quadratura è la pittura di architetture illusorie: cornicioni, balaustre, colonne e archi dipinti in prospettiva che prolungano quelli veri, fino a far credere che la stanza si apra sul cielo. A Bologna nel Seicento diventa una specialità al servizio delle famiglie nobili che volevano celebrarsi, e il lavoro si divide in due: il quadraturista costruisce l\'architettura, il figurista dipinge le storie. In questo palazzo la vedi in tutte le sue fasi: piena nel Salone d\'onore, con Canuti e il Mengazzino; ridotta a un parapetto nella Sala delle Stagioni e sparita del tutto nell\'Olimpo, con Crespi; di nuovo vertiginosa nella Sala di Alessandro, con Creti e Chiarini.' }
    ]
  }
];

// Due visite: il giro completo delle sale, e uno breve solo sulle volte.
const VISITE_PEPOLI = [
  {
    nome: 'Palazzo Pepoli, sala per sala',
    autore: 'autore1',
    pubblica: true,
    prezzo: 0,
    infoLogistiche: 'Ingresso da via Castiglione. Le sale sono al piano nobile e si raggiungono dallo scalone. Il percorso segue le cinque sale nell\'ordine del museo e dura circa un\'ora.',
    tappe: [
      { opera: 'casato-pepoli', indicazione: 'Nell\'atrio, prima di salire: chi erano i Pepoli.' },
      { opera: 'Q123685640', indicazione: 'Sullo scalone: i due ovali dipinti.' },
      { opera: 'Q131543603', indicazione: 'In cima allo scalone gira a destra ed entra nel Salone d\'onore. Alza la testa.' },
      { opera: 'salone-stemma', indicazione: 'Resta nel salone e guarda la base della volta, poi il pavimento.', opzionale: true },
      { opera: 'Q131628822', indicazione: 'Passa nella sala accanto al salone, la Sala di Felsina: la scena è sulla volta.' },
      { opera: 'Q131628823', indicazione: 'Prosegui nella Sala delle Stagioni: guarda prima i bordi del soffitto, poi il centro.' },
      { opera: 'Q123685655', indicazione: 'Stessa sala, sulle pareti.' },
      { opera: 'Q123685682', indicazione: 'Entra nella Sala dell\'Olimpo: tutto il soffitto è un unico paesaggio.' },
      { opera: 'Q114073475', indicazione: 'Stessa sala, sulle pareti.' },
      { opera: 'Q131472696', indicazione: 'Sempre nella Sala dell\'Olimpo.', opzionale: true },
      { opera: 'Q131449654', indicazione: 'Ultima sala, la Sala di Alessandro: il condottiero è al centro della volta.' },
      { opera: 'Q123685671', indicazione: 'Stessa sala, sulle pareti. Da qui si torna allo scalone.' }
    ]
  },
  {
    nome: 'Le volte dei Pepoli',
    autore: 'autore2',
    pubblica: true,
    prezzo: 3,
    infoLogistiche: 'Un percorso breve, tutto col naso all\'insù: le cinque volte affrescate, da Canuti a Creti. Circa mezz\'ora.',
    tappe: [
      { opera: 'quadratura', indicazione: 'Nell\'atrio, prima di salire: che cos\'è la quadratura.' },
      { opera: 'Q131543603', indicazione: 'Sali lo scalone e gira a destra, nel Salone d\'onore.' },
      { opera: 'Q131628822', indicazione: 'Nella sala accanto, la Sala di Felsina.' },
      { opera: 'Q131628823', indicazione: 'Prosegui nella Sala delle Stagioni.' },
      { opera: 'Q123685682', indicazione: 'Poi la Sala dell\'Olimpo.' },
      { opera: 'olimpo-colori', indicazione: 'Resta sotto la stessa volta e cerca il bianco e il nero.', opzionale: true },
      { opera: 'Q131449654', indicazione: 'Ultima, la Sala di Alessandro.' }
    ]
  }
];

// I musei del seed, ciascuno con le sue opere, le sue visite e il suo file di configurazione.
const MUSEI = [
  { nome: 'Pinacoteca Nazionale di Bologna', citta: 'Bologna', configFile: 'pinacoteca-bologna.json', opere: OPERE, visite: VISITE },
  { nome: 'Palazzo Pepoli Campogrande', citta: 'Bologna', configFile: 'palazzo-pepoli.json', opere: OPERE_PEPOLI, visite: VISITE_PEPOLI }
];

// Svuota il database e lo riempie. Non apre e non chiude la connessione: usa quella che
// trova, così la può chiamare anche il server acceso, che una connessione ce l'ha già e
// non deve perderla (vedi routes/admin.js).
async function popola() {
  await Promise.all([Utente.deleteMany({}), Museo.deleteMany({}), Item.deleteMany({}), Visita.deleteMany({})]);
  console.log('Collezioni svuotate.');

  // password uguale per tutti, come chiede la specifica. L'hash lo fa il pre-save di Utente.
  const utenti = {};
  for (const [username, ruolo] of [['autore1', 'autore'], ['autore2', 'autore'], ['visitatore1', 'visitatore'], ['visitatore2', 'visitatore']]) {
    utenti[username] = await new Utente({ username, password: '12345678', ruolo }).save();
  }
  console.log('Creati 4 utenti (password 12345678).');

  const visiteCreate = [];
  for (const m of MUSEI) {
    const museo = await new Museo({ nome: m.nome, citta: m.citta, configFile: m.configFile }).save();

    // gli id assegnati da Mongo: servono a montare le visite. La chiave è il codice
    // dell'opera, tranne dove due item parlano della stessa opera e serve distinguerli.
    // Vale dentro un museo solo, per questo si riparte da capo a ogni museo.
    const idPerItem = {};
    for (const o of m.opere) {
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

    for (const v of m.visite) {
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
    console.log(`${m.nome}: ${m.opere.length} item, ${m.visite.length} visite.`);
  }

  // visitatore1 ha già comprato le visite pubbliche di tutti e due i musei, visitatore2 non
  // ha niente: così nel Navigator si vedono sia la lista piena sia il messaggio "non hai
  // ancora sbloccato", e nel percorso su misura la tendina dei musei ha davvero da scegliere.
  utenti.visitatore1.acquisti = visiteCreate.filter(v => v.pubblica).map(v => v._id);
  await utenti.visitatore1.save();
}

module.exports = { popola };

// require.main === module vuol dire "questo file è stato lanciato con node seed.js, non
// importato da un altro file". Solo in quel caso apre la connessione e poi la chiude.
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(popola)
    .then(() => mongoose.connection.close())
    .then(() => console.log('Fatto.'));
}
