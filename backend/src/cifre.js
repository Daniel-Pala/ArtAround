// Il modello a volte scrive gli anni in lettere ("milleseicentosessantacinque"): in italiano
// è corretto, ma a schermo non si legge. Qui li riportiamo in cifre. Si toccano solo le
// parole che cominciano con "mille" o "duemila" e hanno qualcosa dopo, cioè gli anni dal
// 1001 al 2999: "il Seicento" e "il Trecento" (i secoli) e "mille anni" restano come sono.

const unita = { uno: 1, un: 1, due: 2, tré: 3, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9 }
const dieci = { dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15, sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19 }
// "vent", "trent"...: davanti a uno e otto la decina perde la vocale (ventuno, trentotto)
const decine = { venti: 20, vent: 20, trenta: 30, trent: 30, quaranta: 40, quarant: 40, cinquanta: 50, cinquant: 50, sessanta: 60, sessant: 60, settanta: 70, settant: 70, ottanta: 80, ottant: 80, novanta: 90, novant: 90 }

// la parola più lunga che combacia, così "diciassette" non diventa "dieci" + qualcosa
const togli = (resto, tabella) => {
  const nome = Object.keys(tabella).sort((a, b) => b.length - a.length).find(n => resto.startsWith(n))
  return nome ? [tabella[nome], resto.slice(nome.length)] : [0, resto]
}

function annoInCifre(parola) {
  let resto = parola.toLowerCase()
  let totale
  if (resto.startsWith('duemila')) { totale = 2000; resto = resto.slice(7) }
  else if (resto.startsWith('mille')) { totale = 1000; resto = resto.slice(5) }
  else return null
  if (!resto) return null

  const centinaia = Object.keys(unita).find(n => n !== 'un' && n !== 'uno' && resto.startsWith(n + 'cento'))
  if (centinaia) { totale += unita[centinaia] * 100; resto = resto.slice(centinaia.length + 5) }
  else if (resto.startsWith('cento')) { totale += 100; resto = resto.slice(5) }
  // "centottanta", "centotto": davanti a otto e ottanta cento perde la o
  if (resto.startsWith('tt') && totale % 1000 !== 0) resto = 'o' + resto

  let valore
  ;[valore, resto] = togli(resto, dieci)
  if (!valore) {
    ;[valore, resto] = togli(resto, decine)
    totale += valore
    ;[valore, resto] = togli(resto, unita)
  }
  totale += valore
  return resto === '' ? totale : null
}

function cifre(testo) {
  return testo.replace(/(?<![a-zàèéìòù])(mille|duemila)[a-zàèéìòù]+/gi, parola => {
    const n = annoInCifre(parola)
    return n === null ? parola : String(n)
  })
}

// I testi già salvati prima di questa correzione: si sistemano una volta all'avvio del
// server. Rifarlo non cambia niente, perché dopo la prima volta non resta nulla da convertire.
async function sistemaTestiSalvati(Item) {
  const items = await Item.find({ 'testi.testo': /(mille|duemila)[a-zàèéìòù]/i }).lean()
  let cambiati = 0
  for (const item of items) {
    let qui = 0
    const testi = item.testi.map(t => {
      if ((t.lingua || 'it') !== 'it') return t
      const nuovo = cifre(t.testo)
      if (nuovo === t.testo) return t
      qui++
      return { ...t, testo: nuovo }
    })
    if (!qui) continue
    await Item.updateOne({ _id: item._id }, { $set: { testi } })
    cambiati += qui
  }
  return cambiati
}

module.exports = { cifre, annoInCifre, sistemaTestiSalvati }
