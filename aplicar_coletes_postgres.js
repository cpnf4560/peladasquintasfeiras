// Script para configurar coletes DIRETAMENTE no PostgreSQL (Render)
const { db } = require('./db');

console.log('🔄 Configurando coletes no PostgreSQL (Render)...\n');

// Ordem completa dos 18 jogadores conforme WhatsApp
const jogadoresOrdem = [
  { nome: 'Rogério Silva', posicao: 1, tipo: 'convocado' },
  { nome: 'Cesaro', posicao: 2, tipo: 'convocado' },
  { nome: 'Carlos Silva', posicao: 3, tipo: 'convocado' },
  { nome: 'Nuno Ferreira', posicao: 4, tipo: 'convocado' },
  { nome: 'Joel Almeida', posicao: 5, tipo: 'convocado' },
  { nome: 'Carlos Cruz', posicao: 6, tipo: 'convocado' },
  { nome: 'Joaquim Rocha', posicao: 7, tipo: 'convocado' },
  { nome: 'Ismael Campos', posicao: 8, tipo: 'convocado' },
  { nome: 'João Couto', posicao: 9, tipo: 'convocado' },
  { nome: 'Rui Lopes', posicao: 10, tipo: 'convocado' },
  { nome: 'Ricardo Sousa', posicao: 11, tipo: 'reserva' },
  { nome: 'Valter Pinho', posicao: 12, tipo: 'reserva' },
  { nome: 'Serafim Sousa', posicao: 13, tipo: 'reserva' },
  { nome: 'Hugo Belga', posicao: 14, tipo: 'reserva' },
  { nome: 'Paulo Pinto', posicao: 15, tipo: 'reserva' },
  { nome: 'Flávio Silva', posicao: 16, tipo: 'reserva' },
  { nome: 'Manuel Rocha', posicao: 17, tipo: 'reserva' },
  { nome: 'Pedro Lopes', posicao: 18, tipo: 'reserva' }
];

async function configurarColetes() {
  try {
    // Passo 1: Limpar convocatória
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM convocatoria', [], (err) => {
        if (err) reject(err);
        else {
          console.log('✅ Convocatória limpa');
          resolve();
        }
      });
    });

    // Passo 2: Limpar histórico de coletes
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM coletes', [], (err) => {
        if (err) reject(err);
        else {
          console.log('✅ Histórico de coletes limpo\n');
          resolve();
        }
      });
    });

    // Passo 3: Buscar todos os jogadores
    const jogadores = await new Promise((resolve, reject) => {
      db.query('SELECT id, nome FROM jogadores ORDER BY nome', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('📋 Jogadores encontrados na base de dados:');
    jogadores.forEach(j => console.log(`   - ${j.nome} (ID: ${j.id})`));
    console.log('');

    // Passo 4: Inserir convocatória na ordem correta
    console.log('📝 Configurando convocatória:\n');

    for (const item of jogadoresOrdem) {
      // Buscar jogador - match flexível
      const jogador = jogadores.find(j => {
        const nomeDB = j.nome.toLowerCase().trim();
        const nomeBusca = item.nome.toLowerCase().trim();
        
        // Match exato
        if (nomeDB === nomeBusca) return true;
        
        // Match por todas as palavras
        const palavras = nomeBusca.split(' ');
        return palavras.every(p => nomeDB.includes(p));
      });

      if (!jogador) {
        console.log(`⚠️  ${item.posicao}º - "${item.nome}" NÃO ENCONTRADO`);
        continue;
      }

      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO convocatoria (jogador_id, posicao, tipo) VALUES ($1, $2, $3)',
          [jogador.id, item.posicao, item.tipo],
          (err) => {
            if (err) {
              console.error(`❌ Erro ao inserir ${jogador.nome}:`, err.message);
              reject(err);
            } else {
              console.log(`✅ ${item.posicao}º - ${jogador.nome} (${item.tipo})`);
              resolve();
            }
          }
        );
      });
    }

    // Passo 5: Configurar histórico de coletes
    console.log('\n📊 Configurando histórico de coletes:\n');

    const rogerio = jogadores.find(j => j.nome.toLowerCase().includes('rogério'));
    const cesaro = jogadores.find(j => j.nome.toLowerCase().includes('cesaro'));
    const carlosSilva = jogadores.find(j => 
      j.nome.toLowerCase().includes('carlos') && j.nome.toLowerCase().includes('silva')
    );

    if (rogerio) {
      // Rogério - levou 02/10/2024, devolveu 09/10/2024
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO coletes (jogador_id, data_levou, data_devolveu) VALUES ($1, $2, $3)',
          [rogerio.id, '2024-10-02', '2024-10-09'],
          (err) => {
            if (err) reject(err);
            else {
              console.log(`✅ Rogério: levou 02/10/2024, devolveu 09/10/2024`);
              resolve();
            }
          }
        );
      });
    }

    if (cesaro) {
      // Cesaro - levou 09/10/2024, devolveu 16/10/2024
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO coletes (jogador_id, data_levou, data_devolveu) VALUES ($1, $2, $3)',
          [cesaro.id, '2024-10-09', '2024-10-16'],
          (err) => {
            if (err) reject(err);
            else {
              console.log(`✅ Cesaro: levou 09/10/2024, devolveu 16/10/2024`);
              resolve();
            }
          }
        );
      });
    }

    if (carlosSilva) {
      // Carlos Silva - TEM ATUALMENTE desde 16/10/2024
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO coletes (jogador_id, data_levou, data_devolveu) VALUES ($1, $2, $3)',
          [carlosSilva.id, '2024-10-16', null],
          (err) => {
            if (err) reject(err);
            else {
              console.log(`✅ Carlos Silva: TEM ATUALMENTE desde 16/10/2024`);
              resolve();
            }
          }
        );
      });
    }

    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!\n');
    console.log('🚀 Podes fazer deploy e a página de coletes estará com a ordem correta.');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRO:', error);
    process.exit(1);
  }
}

configurarColetes();
