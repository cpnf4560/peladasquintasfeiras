const { db } = require('./db');

console.log('🔍 Verificando ordem dos coletes...\n');

// Verificar convocatória
db.query(`
  SELECT c.posicao, c.tipo, j.nome
  FROM convocatoria c
  JOIN jogadores j ON c.jogador_id = j.id
  ORDER BY c.posicao ASC
`, [], (err, convocados) => {
  if (err) {
    console.error('❌ Erro:', err);
    return;
  }

  console.log('📋 ORDEM DA CONVOCATÓRIA:\n');
  convocados.forEach(c => {
    console.log(`${c.posicao}º - ${c.nome} (${c.tipo})`);
  });

  // Verificar histórico de coletes
  db.query(`
    SELECT c.*, j.nome
    FROM coletes c
    JOIN jogadores j ON c.jogador_id = j.id
    ORDER BY c.data_levou ASC
  `, [], (err, historico) => {
    if (err) {
      console.error('❌ Erro:', err);
      return;
    }

    console.log('\n\n📊 HISTÓRICO DE COLETES:\n');
    historico.forEach(h => {
      const devolveu = h.data_devolveu ? new Date(h.data_devolveu).toLocaleDateString('pt-PT') : 'TEM ATUALMENTE';
      console.log(`${h.nome} - Levou: ${new Date(h.data_levou).toLocaleDateString('pt-PT')} | Devolveu: ${devolveu}`);
    });

    console.log('\n✅ Verificação concluída!\n');
    db.close();
  });
});
