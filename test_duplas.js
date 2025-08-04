const sqlite3 = require('sqlite3').verbose();

console.log('=== TESTE SIMPLES DA ANÁLISE DE DUPLAS ===');

const db = new sqlite3.Database('./futsal.db', (err) => {
  if (err) {
    console.error('Erro ao conectar:', err);
    return;
  }
  
  // Simular a query da função analisarDuplas
  db.all(`
    SELECT 
      j.id as jogo_id,
      j.data,
      j.equipa1_golos,
      j.equipa2_golos,
      GROUP_CONCAT(CASE WHEN p.equipa = 1 THEN jog.nome END) as equipa1_jogadores,
      GROUP_CONCAT(CASE WHEN p.equipa = 2 THEN jog.nome END) as equipa2_jogadores
    FROM jogos j
    JOIN presencas p ON j.id = p.jogo_id
    JOIN jogadores jog ON p.jogador_id = jog.id
    WHERE jog.suspenso = 0 AND strftime('%Y', j.data) = '2025'
    GROUP BY j.id, j.data, j.equipa1_golos, j.equipa2_golos
    ORDER BY j.data DESC
  `, [], (err, jogos) => {
    if (err) {
      console.error('Erro:', err);
      return;
    }
    
    console.log(`Jogos encontrados: ${jogos.length}`);
    
    const duplas = {};
    
    // Processar cada jogo
    jogos.forEach(jogo => {
      const equipa1Nomes = jogo.equipa1_jogadores ? jogo.equipa1_jogadores.split(',') : [];
      const equipa2Nomes = jogo.equipa2_jogadores ? jogo.equipa2_jogadores.split(',') : [];
      
      // Resultado
      let resultado;
      if (jogo.equipa1_golos > jogo.equipa2_golos) resultado = 1;
      else if (jogo.equipa1_golos < jogo.equipa2_golos) resultado = -1;
      else resultado = 0;
      
      // Processar duplas da equipa 2 (onde estão Césaro e Ismael na maioria)
      for (let i = 0; i < equipa2Nomes.length; i++) {
        for (let j = i + 1; j < equipa2Nomes.length; j++) {
          const jogador1 = equipa2Nomes[i];
          const jogador2 = equipa2Nomes[j];
          const chave = [jogador1, jogador2].sort().join(' & ');
          
          if (chave === 'Césaro Cruz & Ismael Campos') {
            console.log(`\nJogo ${jogo.jogo_id}: Encontrada dupla Césaro & Ismael na Equipa 2`);
            console.log(`Resultado: ${jogo.equipa1_golos}-${jogo.equipa2_golos}`);
            console.log(`Equipa 2: ${jogo.equipa2_jogadores}`);
            
            if (!duplas[chave]) {
              duplas[chave] = {
                jogos: 0, vitorias: 0, empates: 0, derrotas: 0, pontos: 0,
                golos_marcados: 0, golos_sofridos: 0
              };
            }
            
            duplas[chave].jogos++;
            duplas[chave].golos_marcados += jogo.equipa2_golos;
            duplas[chave].golos_sofridos += jogo.equipa1_golos;
            
            if (resultado === -1) {
              duplas[chave].vitorias++;
              duplas[chave].pontos += 3;
              console.log(`>>> VITÓRIA para a dupla`);
            } else if (resultado === 0) {
              duplas[chave].empates++;
              duplas[chave].pontos += 1;
              console.log(`>>> EMPATE para a dupla`);
            } else {
              duplas[chave].derrotas++;
              console.log(`>>> DERROTA para a dupla`);
            }
          }
        }
      }
      
      // Processar duplas da equipa 1
      for (let i = 0; i < equipa1Nomes.length; i++) {
        for (let j = i + 1; j < equipa1Nomes.length; j++) {
          const jogador1 = equipa1Nomes[i];
          const jogador2 = equipa1Nomes[j];
          const chave = [jogador1, jogador2].sort().join(' & ');
          
          if (chave === 'Césaro Cruz & Ismael Campos') {
            console.log(`\nJogo ${jogo.jogo_id}: Encontrada dupla Césaro & Ismael na Equipa 1`);
            console.log(`Resultado: ${jogo.equipa1_golos}-${jogo.equipa2_golos}`);
            console.log(`Equipa 1: ${jogo.equipa1_jogadores}`);
            
            if (!duplas[chave]) {
              duplas[chave] = {
                jogos: 0, vitorias: 0, empates: 0, derrotas: 0, pontos: 0,
                golos_marcados: 0, golos_sofridos: 0
              };
            }
            
            duplas[chave].jogos++;
            duplas[chave].golos_marcados += jogo.equipa1_golos;
            duplas[chave].golos_sofridos += jogo.equipa2_golos;
            
            if (resultado === 1) {
              duplas[chave].vitorias++;
              duplas[chave].pontos += 3;
              console.log(`>>> VITÓRIA para a dupla`);
            } else if (resultado === 0) {
              duplas[chave].empates++;
              duplas[chave].pontos += 1;
              console.log(`>>> EMPATE para a dupla`);
            } else {
              duplas[chave].derrotas++;
              console.log(`>>> DERROTA para a dupla`);
            }
          }
        }
      }
    });
    
    console.log(`\n=== RESULTADO FINAL ===`);
    const cesaroIsmael = duplas['Césaro Cruz & Ismael Campos'];
    if (cesaroIsmael) {
      const percentagem = Math.round((cesaroIsmael.vitorias / cesaroIsmael.jogos) * 100);
      console.log(`Césaro Cruz & Ismael Campos:`);
      console.log(`  Jogos: ${cesaroIsmael.jogos}`);
      console.log(`  Vitórias: ${cesaroIsmael.vitorias}`);
      console.log(`  Empates: ${cesaroIsmael.empates}`);
      console.log(`  Derrotas: ${cesaroIsmael.derrotas}`);
      console.log(`  % Vitórias: ${percentagem}%`);
      console.log(`  Qualifica-se: ${cesaroIsmael.jogos >= 3 ? 'SIM' : 'NÃO'}`);
    } else {
      console.log('❌ Dupla Césaro Cruz & Ismael Campos NÃO encontrada!');
    }
    
    db.close();
  });
});
