const sqlite3 = require('better-sqlite3');
const db = sqlite3('futsal.db');

console.log('=== ESTADO ATUAL DA BASE DE DADOS ===\n');

// Verificar convocatória
const conv = db.prepare(`
  SELECT c.posicao, c.tipo, j.nome
  FROM convocatoria c
  JOIN jogadores j ON c.jogador_id = j.id
  ORDER BY c.posicao
`).all();

console.log(`CONVOCATÓRIA (${conv.length} registos):`);
if (conv.length === 0) {
  console.log('  ⚠️  VAZIA - Precisa executar aplicar_coletes_agora.js\n');
} else {
  conv.forEach(c => {
    const emoji = c.tipo === 'convocado' ? '🟢' : '⚪';
    console.log(`  ${emoji} ${c.posicao}º - ${c.nome} (${c.tipo})`);
  });
  console.log('');
}

// Verificar coletes
const coletes = db.prepare(`
  SELECT j.nome, c.data_levou, c.data_devolveu
  FROM coletes c
  JOIN jogadores j ON c.jogador_id = j.id
  ORDER BY c.data_levou
`).all();

console.log(`HISTÓRICO DE COLETES (${coletes.length} registos):`);
if (coletes.length === 0) {
  console.log('  ⚠️  VAZIO - Precisa executar aplicar_coletes_agora.js\n');
} else {
  coletes.forEach(h => {
    const levou = new Date(h.data_levou).toLocaleDateString('pt-PT');
    const status = h.data_devolveu ? 
      new Date(h.data_devolveu).toLocaleDateString('pt-PT') :
      'TEM ATUALMENTE ✅';
    console.log(`  ${h.nome}: ${levou} → ${status}`);
  });
  console.log('');
}

db.close();
