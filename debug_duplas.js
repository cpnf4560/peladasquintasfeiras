const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./futsal.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err);
    return;
  }
  console.log('Conectado ao banco de dados SQLite.');
});

console.log('=== ANALISANDO DUPLA CÉSARO CRUZ & ISMAEL CAMPOS ===');

// Buscar todos os jogos com os jogadores
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
  WHERE jog.suspenso = 0
  GROUP BY j.id, j.data, j.equipa1_golos, j.equipa2_golos
  ORDER BY j.data DESC
`, [], (err, jogos) => {
  if (err) {
    console.error('Erro:', err);
    return;
  }
  
  console.log(`Total de jogos: ${jogos.length}`);
  
  const dupla = {
    jogadores: ['Césaro Cruz', 'Ismael Campos'],
    jogos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    pontos: 0,
    golos_marcados: 0,
    golos_sofridos: 0
  };
  
  console.log(`\n=== JOGOS COM CÉSARO CRUZ E ISMAEL CAMPOS JUNTOS ===`);
  
  jogos.forEach(jogo => {
    const equipa1Jogadores = (jogo.equipa1_jogadores || '').split(',');
    const equipa2Jogadores = (jogo.equipa2_jogadores || '').split(',');
    
    const cesaroNaEquipa1 = equipa1Jogadores.includes('Césaro Cruz');
    const ismaelNaEquipa1 = equipa1Jogadores.includes('Ismael Campos');
    
    const cesaroNaEquipa2 = equipa2Jogadores.includes('Césaro Cruz');
    const ismaelNaEquipa2 = equipa2Jogadores.includes('Ismael Campos');
    
    // Verificar se estão na mesma equipa
    if ((cesaroNaEquipa1 && ismaelNaEquipa1) || (cesaroNaEquipa2 && ismaelNaEquipa2)) {
      dupla.jogos++;
      
      console.log(`\nJogo ${jogo.jogo_id} (${jogo.data}): ${jogo.equipa1_golos}-${jogo.equipa2_golos}`);
      console.log(`  Equipa 1: ${jogo.equipa1_jogadores}`);
      console.log(`  Equipa 2: ${jogo.equipa2_jogadores}`);
      
      let resultado;
      if (cesaroNaEquipa1 && ismaelNaEquipa1) {
        // Estão na equipa 1
        dupla.golos_marcados += jogo.equipa1_golos;
        dupla.golos_sofridos += jogo.equipa2_golos;
        
        if (jogo.equipa1_golos > jogo.equipa2_golos) {
          resultado = 'VITÓRIA';
          dupla.vitorias++;
          dupla.pontos += 3;
        } else if (jogo.equipa1_golos < jogo.equipa2_golos) {
          resultado = 'DERROTA';
          dupla.derrotas++;
        } else {
          resultado = 'EMPATE';
          dupla.empates++;
          dupla.pontos += 1;
        }
        console.log(`  >>> DUPLA na Equipa 1 - RESULTADO: ${resultado} <<<`);
      } else {
        // Estão na equipa 2
        dupla.golos_marcados += jogo.equipa2_golos;
        dupla.golos_sofridos += jogo.equipa1_golos;
        
        if (jogo.equipa2_golos > jogo.equipa1_golos) {
          resultado = 'VITÓRIA';
          dupla.vitorias++;
          dupla.pontos += 3;
        } else if (jogo.equipa2_golos < jogo.equipa1_golos) {
          resultado = 'DERROTA';
          dupla.derrotas++;
        } else {
          resultado = 'EMPATE';
          dupla.empates++;
          dupla.pontos += 1;
        }
        console.log(`  >>> DUPLA na Equipa 2 - RESULTADO: ${resultado} <<<`);
      }
    }
  });
  
  if (dupla.jogos > 0) {
    dupla.percentagem_vitorias = Math.round((dupla.vitorias / dupla.jogos) * 100);
    dupla.diferenca_golos = dupla.golos_marcados - dupla.golos_sofridos;
    dupla.nome = dupla.jogadores.join(' & ');
    
    console.log(`\n=== ESTATÍSTICAS FINAIS DA DUPLA ===`);
    console.log(`Nome: ${dupla.nome}`);
    console.log(`Jogos: ${dupla.jogos} (${dupla.jogos >= 3 ? 'QUALIFICA-SE' : 'NÃO QUALIFICA (mín. 3)'})`);
    console.log(`Vitórias: ${dupla.vitorias}`);
    console.log(`Empates: ${dupla.empates}`);
    console.log(`Derrotas: ${dupla.derrotas}`);
    console.log(`% Vitórias: ${dupla.percentagem_vitorias}%`);
    console.log(`Pontos: ${dupla.pontos}`);
    console.log(`Golos Marcados: ${dupla.golos_marcados}`);
    console.log(`Golos Sofridos: ${dupla.golos_sofridos}`);
    console.log(`Diferença de Golos: ${dupla.diferenca_golos >= 0 ? '+' : ''}${dupla.diferenca_golos}`);
  } else {
    console.log('❌ Nenhum jogo encontrado com esta dupla na mesma equipa!');
  }
  
  db.close();
});
