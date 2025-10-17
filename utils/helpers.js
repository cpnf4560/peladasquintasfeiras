// Utility helpers for normalizing DB results and simple conversions
function normalizeRows(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.rows)) return result.rows;
  if (result && result[0]) return result;
  return [];
}

function dedupePresencas(rows) {
  const seen = new Set();
  const clean = [];
  for (const r of rows) {
    const pid = r.id || r.ID || r.Id || r.jogador_id || r.JOGADOR_ID;
    const nome = r.nome || r.NOME || r.Nome || '';
    const equipa = Number(r.equipa);
    if (!pid) continue;
    const key = `${pid}-${equipa}`;
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push({ id: Number(pid), nome, equipa });
  }
  return clean;
}

function toISO(dateStr) {
  if (!dateStr) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
}

module.exports = { normalizeRows, dedupePresencas, toISO };