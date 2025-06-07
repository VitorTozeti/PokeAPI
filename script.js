const API_BASE = "https://pokeapi.co/api/v2";

async function buscarPokemon() {
    const nome = document.getElementById('pokemonName').value.toLowerCase();
    if (!nome) return alert("Digite um nome!");

    try {
        const res = await fetch(`${API_BASE}/pokemon/${nome}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        const pokemonFormatado = {
            nome: data.name,
            altura: data.height,
            peso: data.weight,
            tipos: data.types.map(t => t.type.name),
            imagem: data.sprites.other['official-artwork'].front_default,
            habilidades: data.abilities.map(h => ({
                nome: h.ability.name,
                escondida: h.is_hidden
            })),
            status: data.stats.map(s => ({
                nome: s.stat.name,
                base: s.base_stat
            })),
            baseStatsTotal: data.stats.reduce((soma, s) => soma + s.base_stat, 0),
            movimentos: data.moves.map(m => m.move.name)
        };

        const { fraquezas, resistencias, imunidades } = await buscarFraquezasEResistencias(pokemonFormatado.tipos);
        mostrarPokemon(pokemonFormatado, fraquezas, resistencias, imunidades);
    } catch (e) {
        alert("Pokémon não encontrado.");
    }
}

async function pokemonAleatorio() {
    try {
        const randomId = Math.floor(Math.random() * 898) + 1;
        const res = await fetch(`${API_BASE}/pokemon/${randomId}`);
        const data = await res.json();

        const pokemonFormatado = {
            nome: data.name,
            altura: data.height,
            peso: data.weight,
            tipos: data.types.map(t => t.type.name),
            imagem: data.sprites.other['official-artwork'].front_default,
            habilidades: data.abilities.map(h => ({
                nome: h.ability.name,
                escondida: h.is_hidden
            })),
            status: data.stats.map(s => ({
                nome: s.stat.name,
                base: s.base_stat
            })),
            baseStatsTotal: data.stats.reduce((soma, s) => soma + s.base_stat, 0),
            movimentos: data.moves.map(m => m.move.name)
        };

        const { fraquezas, resistencias, imunidades } = await buscarFraquezasEResistencias(pokemonFormatado.tipos);
        mostrarPokemon(pokemonFormatado, fraquezas, resistencias, imunidades);
    } catch (e) {
        alert("Erro ao buscar Pokémon aleatório.");
    }
}

async function buscarFraquezasEResistencias(tipos) {
    const damageRelations = {
        double_damage_from: new Set(),
        half_damage_from: new Set(),
        no_damage_from: new Set()
    };

    for (let tipo of tipos) {
        const res = await fetch(`${API_BASE}/type/${tipo}`);
        const data = await res.json();
        data.damage_relations.double_damage_from.forEach(t => damageRelations.double_damage_from.add(t.name));
        data.damage_relations.half_damage_from.forEach(t => damageRelations.half_damage_from.add(t.name));
        data.damage_relations.no_damage_from.forEach(t => damageRelations.no_damage_from.add(t.name));
    }

    const fraquezas = [...damageRelations.double_damage_from].filter(
        t => !damageRelations.half_damage_from.has(t) && !damageRelations.no_damage_from.has(t)
    );
    const resistencias = [...damageRelations.half_damage_from].filter(
        t => !damageRelations.double_damage_from.has(t) && !damageRelations.no_damage_from.has(t)
    );
    const imunidades = [...damageRelations.no_damage_from];

    return { fraquezas, resistencias, imunidades };
}

function mostrarPokemon(p, fraquezas, resistencias, imunidades) {
    const card = document.getElementById('resultado');

    const habilidadesNormais = p.habilidades.filter(h => !h.escondida).map(h => h.nome).join(', ');
    const habilidadeEscondida = p.habilidades.find(h => h.escondida)?.nome || 'Nenhuma';

    const statusHTML = p.status.map(s => {
        const cor = '#4caf50';
        const largura = (s.base / 255) * 100;
        const nomeFormatado = s.nome.toUpperCase();

        return `
      <tr>
        <td style="text-align:left; width: 80px; padding: 6px 8px;">${nomeFormatado}</td>
        <td style="width: 40px; padding: 6px 8px; text-align:center;">${s.base}</td>
        <td style="width:100%; padding: 6px 8px;">
          <div style="background:#ddd; width:100%; height:16px; border-radius:8px; overflow:hidden;">
            <div style="width:${largura}%; background:${cor}; height:100%; border-radius:8px 0 0 8px; transition: width 0.5s;"></div>
          </div>
        </td>
      </tr>
    `;
    }).join('');

    function criarTabelaMoves(movimentos) {
        const metade = Math.ceil(movimentos.length / 2);
        const coluna1 = movimentos.slice(0, metade);
        const coluna2 = movimentos.slice(metade);

        let rows = '';
        for (let i = 0; i < metade; i++) {
            const move1 = coluna1[i] || '';
            const move2 = coluna2[i] || '';
            rows += `
        <tr style="transition: background-color 0.3s;">
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; border-radius: 6px 0 0 6px;">${move1}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; border-radius: 0 6px 6px 0;">${move2}</td>
        </tr>
      `;
        }

        return `
      <table style="
        width: 100%; 
        border-collapse: separate; 
        border-spacing: 0 4px; 
        font-family: monospace; 
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        background: #fafafa;
        border-radius: 8px;
      ">
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
    }

    const movesHTML = criarTabelaMoves(p.movimentos);

    card.innerHTML = `
    <h2 style="text-transform: capitalize; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${p.nome}</h2>
    <img src="${p.imagem}" alt="${p.nome}" style="max-width: 200px; display: block; margin: 0 auto 16px auto;"/>
    <p><strong>Tipo:</strong> ${p.tipos.join(", ")}</p>
    <p><strong>Habilidades:</strong> ${habilidadesNormais}</p>
    <p><strong>Habilidade Escondida:</strong> ${habilidadeEscondida}</p>
    <p><strong>Peso:</strong> ${p.peso}</p>
    <p><strong>Altura:</strong> ${p.altura}</p>
    <p><strong>Fraquezas:</strong> ${fraquezas.join(", ") || 'Nenhuma'}</p>
    <p><strong>Resistências:</strong> ${resistencias.join(", ") || 'Nenhuma'}</p>
    <p><strong>Imunidades:</strong> ${imunidades.join(", ") || 'Nenhuma'}</p>
    <p><strong>Status Base:</strong></p>
    <table style="
      margin: 0 auto 16px auto;
      margin-top: 16px;
      width: 80%; 
      text-align: left; 
      font-family: monospace; 
      font-size: 14px;
      border-collapse: separate;
      border-spacing: 0 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      background: #fff;
      border-radius: 8px;
      padding: 12px;
    ">
      ${statusHTML}
    </table>
    <p><strong>Total de Base Stats:</strong> ${p.baseStatsTotal}</p>
    <details style="margin-top: 16px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <summary style="cursor: pointer; font-weight: bold; font-size: 16px; padding: 8px 0;">Moveset (${p.movimentos.length} movimentos)</summary>
      ${movesHTML}
    </details>
  `;
    card.style.display = "block";
}
