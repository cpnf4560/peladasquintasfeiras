const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'futsal.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 ADICIONANDO FILIPE E LEONARDO À CONVOCATÓRIA\n');

// Executar em série
db.serialize(() => {
  // 1. Verificar jogadores
  console.log('1️⃣ Verificando jogadores...\n');
  db.all(`SELECT id, nome FROM jogadores WHERE nome IN ('Filipe Garcês', 'Leonardo Sousa') ORDER BY nome`, [], (err, jogadores) => {
    if (err) {
      console.error('❌ Erro:', err);
      db.close();
      return;
    }
    
    console.log(`✅ Encontrados ${jogadores.length} jogadores:`);
    jogadores.forEach(j => console.log(`   - ${j.nome} (ID: ${j.id})`));
    
    if (jogadores.length === 0) {
      console.log('\n❌ Jogadores não encontrados!');
      db.close();
      return;
    }
    
    // 2. Verificar quem já está na convocatória
    console.log('\n2️⃣ Verificando convocatória atual...\n');
    
    const ids = jogadores.map(j => j.id);
    db.all(`SELECT jogador_id FROM convocatoria WHERE jogador_id IN (?, ?)`, ids, (err, existing) => {
      if (err) {
        console.error('❌ Erro:', err);
        db.close();
        return;
      }
      
      const existingIds = existing.map(e => e.jogador_id);
      const faltantes = jogadores.filter(j => !existingIds.includes(j.id));
      
      if (faltantes.length === 0) {
        console.log('✅ Todos os jogadores já estão na convocatória!');
        mostrarResumo();
        return;
      }
      
      console.log(`⚠️  ${faltantes.length} jogador(es) faltando na convocatória:`);
      faltantes.forEach(f => console.log(`   - ${f.nome}`));
      
      // 3. Buscar próxima posição de reserva
      console.log('\n3️⃣ Adicionando à convocatória...\n');
      
      db.get(`SELECT COALESCE(MAX(posicao), 0) as max_pos FROM convocatoria WHERE tipo = 'reserva'`, [], (err, result) => {
        if (err) {
          console.error('❌ Erro:', err);
          db.close();
          return;
        }
        
        let posicao = result.max_pos + 1;
        let adicionados = 0;
        
        // Adicionar cada jogador faltante
        faltantes.forEach((jogador, index) => {
          db.run(
            `INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado) VALUES (?, 'reserva', ?, 0)`,
            [jogador.id, posicao + index],
            function(err) {
              if (err) {
                console.error(`❌ Erro ao adicionar ${jogador.nome}:`, err);
              } else {
                console.log(`✅ ${jogador.nome} adicionado como RESERVA (posição ${posicao + index})`);
                adicionados++;
              }
              
              // Se adicionou todos, mostrar resumo
              if (adicionados === faltantes.length) {
                setTimeout(mostrarResumo, 500);
              }
            }
          );
        });
      });
    });
  });
});

function mostrarResumo() {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMO FINAL');
  console.log('═'.repeat(60));
  
  // Total por tipo
  db.all(`SELECT tipo, COUNT(*) as total FROM convocatoria GROUP BY tipo`, [], (err, resumo) => {
    if (err) {
      console.error('❌ Erro:', err);
      db.close();
      return;
    }
    
    console.log('\nTotal por tipo:');
    resumo.forEach(r => console.log(`   ${r.tipo}: ${r.total}`));
    
    // Total geral
    db.get(`SELECT COUNT(*) as total FROM convocatoria`, [], (err, result) => {
      if (err) {
        console.error('❌ Erro:', err);
        db.close();
        return;
      }
      
      console.log(`\n✅ Total na convocatória: ${result.total}`);
      console.log('\n' + '═'.repeat(60));
      console.log('✅ PROCESSO CONCLUÍDO!');
      console.log('═'.repeat(60) + '\n');
      
      db.close();
    });
  });
}
