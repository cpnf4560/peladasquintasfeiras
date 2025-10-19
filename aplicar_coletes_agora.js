const sqlite3 = require('better-sqlite3');
const db = sqlite3('futsal.db');

console.log('🔄 APLICANDO CONFIGURAÇÃO DE COLETES...\n');

try {
  // 1. Limpar convocatória
  const deleteConv = db.prepare('DELETE FROM convocatoria').run();
  console.log(`✅ Convocatória limpa (${deleteConv.changes} registos removidos)`);

  // 2. Limpar coletes
  const deleteCol = db.prepare('DELETE FROM coletes').run();
  console.log(`✅ Coletes limpos (${deleteCol.changes} registos removidos)\n`);

  // 3. Buscar jogadores
  const jogadores = db.prepare('SELECT id, nome FROM jogadores ORDER BY nome').all();
  console.log(`📋 ${jogadores.length} jogadores encontrados\n`);

  // 4. Ordem dos coletes
  const ordem = [
    'Rogério', 'Cesaro', 'Carlos Silva', 'Nuno', 'Joel', 
    'Carlos Cruz', 'Joaquim', 'Ismael', 'João', 'Rui',
    'Ricardo', 'Valter', 'Serafim', 'Hugo', 'Paulo', 
    'Flávio', 'Manuel', 'Pedro'
  ];

  const insertConv = db.prepare('INSERT INTO convocatoria (jogador_id, posicao, tipo) VALUES (?, ?, ?)');

  console.log('📝 INSERINDO ORDEM:\n');
  
  ordem.forEach((nomeBusca, idx) => {
    const posicao = idx + 1;
    const tipo = posicao <= 10 ? 'convocado' : 'reserva';
    
    const jogador = jogadores.find(j => {
      const nome = j.nome.toLowerCase();
      const busca = nomeBusca.toLowerCase();
      const partes = busca.split(' ');
      return partes.every(parte => nome.includes(parte));
    });

    if (jogador) {
      insertConv.run(jogador.id, posicao, tipo);
      const emoji = tipo === 'convocado' ? '🟢' : '⚪';
      console.log(`${emoji} ${posicao}º - ${jogador.nome} (${tipo})`);
    } else {
      console.log(`❌ ${posicao}º - "${nomeBusca}" NÃO ENCONTRADO`);
    }
  });

  // 5. Inserir histórico de coletes
  console.log('\n📊 INSERINDO HISTÓRICO:\n');
  
  const insertColetes = db.prepare('INSERT INTO coletes (jogador_id, data_levou, data_devolveu) VALUES (?, ?, ?)');
  
  // Rogério
  const rogerio = jogadores.find(j => j.nome.toLowerCase().includes('rogério'));
  if (rogerio) {
    insertColetes.run(rogerio.id, '2024-10-02', '2024-10-09');
    console.log(`✅ ${rogerio.nome} - 02/10/2024 → 09/10/2024`);
  }

  // Cesaro
  const cesaro = jogadores.find(j => j.nome.toLowerCase().includes('cesar'));
  if (cesaro) {
    insertColetes.run(cesaro.id, '2024-10-09', '2024-10-16');
    console.log(`✅ ${cesaro.nome} - 09/10/2024 → 16/10/2024`);
  }

  // Carlos Silva - tem atualmente
  const carlosSilva = jogadores.find(j => {
    const n = j.nome.toLowerCase();
    return n.includes('carlos') && n.includes('silva');
  });
  if (carlosSilva) {
    insertColetes.run(carlosSilva.id, '2024-10-16', null);
    console.log(`✅ ${carlosSilva.nome} - 16/10/2024 → TEM ATUALMENTE`);
  }

  // 6. Verificar resultado
  console.log('\n🔍 VERIFICAÇÃO FINAL:\n');
  
  const resultado = db.prepare(`
    SELECT c.posicao, c.tipo, j.nome
    FROM convocatoria c
    JOIN jogadores j ON c.jogador_id = j.id
    ORDER BY c.posicao
  `).all();

  console.log('CONVOCATÓRIA CONFIGURADA:');
  resultado.forEach(r => {
    const emoji = r.tipo === 'convocado' ? '🟢' : '⚪';
    console.log(`  ${emoji} ${r.posicao}º - ${r.nome}`);
  });

  const historico = db.prepare(`
    SELECT j.nome, c.data_levou, c.data_devolveu
    FROM coletes c
    JOIN jogadores j ON c.jogador_id = j.id
    ORDER BY c.data_levou
  `).all();

  console.log('\nHISTÓRICO DE COLETES:');
  historico.forEach(h => {
    const status = h.data_devolveu ? 
      `Devolveu: ${new Date(h.data_devolveu).toLocaleDateString('pt-PT')}` :
      '✅ TEM ATUALMENTE';
    console.log(`  ${h.nome} - ${new Date(h.data_levou).toLocaleDateString('pt-PT')} | ${status}`);
  });

  console.log('\n🎉 CONFIGURAÇÃO APLICADA COM SUCESSO!\n');

} catch (error) {
  console.error('❌ ERRO:', error.message);
  console.error(error);
} finally {
  db.close();
}
