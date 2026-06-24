// ── SPLASH SCREEN ────────────────────────────

function iniciarSplash() {
    const splash = document.createElement('div');
    splash.id = 'splash';
    splash.innerHTML = `
        <div class="splash-conteudo">
            <div class="splash-logo">ISEPAM</div>
            <p class="splash-sub">Sistema de Gestão Patrimonial</p>
            <div class="splash-barra"><div class="splash-progresso"></div></div>
        </div>
    `;
    document.body.prepend(splash);

    // Fecha após a barra completar
    setTimeout(() => {
        splash.classList.add('splash-saindo');
        setTimeout(() => splash.remove(), 500);
    }, 1400);
}

// ── TRANSIÇÕES DE PÁGINA ──────────────────────

function setupTransicoes() {
    // A animação de entrada (paginaEntrar) já roda via CSS em cada carregamento.
    // Aqui só garantimos que links inativos redirecionam direto, sem delay.
    document.querySelectorAll('.nav-item[href]').forEach(link => {
        link.addEventListener('click', e => {
            const destino = link.getAttribute('href');
            if (!destino || link.classList.contains('active')) return;
            // Redireciona imediatamente — a entrada da nova página cuida da animação
            window.location.href = destino;
        });
    });
}

// ── MODO ESCURO ───────────────────────────────

function aplicarTema() {
    const tema = localStorage.getItem('tema') || 'light';
    document.documentElement.setAttribute('data-theme', tema);
    document.querySelectorAll('.theme-toggle, .theme-toggle-auth').forEach(btn => {
        btn.textContent = tema === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro';
    });
}

function alternarTema() {
    const novo = (localStorage.getItem('tema') || 'light') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('tema', novo);
    aplicarTema();
}

// ── TOAST NOTIFICATIONS ───────────────────────

function mostrarToast(mensagem, tipo = 'sucesso') {
    // Remove toast anterior se existir
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const icones = { sucesso: '✅', erro: '❌', aviso: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `
        <span class="toast-icon">${icones[tipo] || '✅'}</span>
        <span class="toast-msg">${mensagem}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(toast);

    // Anima entrada
    requestAnimationFrame(() => toast.classList.add('show'));

    // Remove automaticamente após 4s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ── VALIDAÇÕES ────────────────────────────────

function validarEmail(email) {
    // Exige @ e domínio com ponto
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validarSenha(senha) {
    const erros = [];
    if (senha.length < 8)               erros.push('mínimo de 8 caracteres');
    if (!/[A-Z]/.test(senha))           erros.push('uma letra maiúscula');
    if (!/[a-z]/.test(senha))           erros.push('uma letra minúscula');
    if (!/[0-9]/.test(senha))           erros.push('um número');
    if (!/[!@#$%^&*()\-_,.?":{}|<>]/.test(senha)) erros.push('um caractere especial (!@#$...)');
    return erros; // Array vazio = senha válida
}

// ── MÁSCARA E VALIDAÇÃO DE CPF ───────────────

function mascaraCPF(valor) {
    valor = valor.replace(/\D/g, '');             // Remove tudo que não é dígito
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    valor = valor.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    return valor.substring(0, 14);                // Limita ao tamanho do CPF formatado
}

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false; // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)

    // Validação do 1º dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;

    // Validação do 2º dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf[10]);
}

function setupMascaras() {
    const campoCPF = document.getElementById('cpf');
    if (!campoCPF) return;

    campoCPF.placeholder = '000.000.000-00';
    campoCPF.maxLength = 14;

    campoCPF.addEventListener('input', function () {
        // Extrai só os dígitos e reformata — cursor vai pro fim naturalmente
        const soDigitos = this.value.replace(/\D/g, '').substring(0, 11);
        this.value = mascaraCPF(soDigitos);
    });
}

function mostrarErroCampo(id, mensagem) {
    const campo = document.getElementById(id);
    if (!campo) return;

    campo.classList.add('campo-invalido');

    // Remove erro anterior neste campo
    const pai = campo.closest('.form-group') || campo.parentElement;
    pai.querySelectorAll('.campo-erro-inline').forEach(e => e.remove());

    if (mensagem) {
        const span = document.createElement('span');
        span.className = 'campo-erro-inline';
        span.textContent = mensagem;
        pai.appendChild(span);
    }

    // Limpa o erro quando o usuário começa a digitar
    campo.addEventListener('input', () => limparErroCampo(id), { once: true });
    campo.addEventListener('change', () => limparErroCampo(id), { once: true });
}

function limparErroCampo(id) {
    const campo = document.getElementById(id);
    if (!campo) return;
    campo.classList.remove('campo-invalido');
    const pai = campo.closest('.form-group') || campo.parentElement;
    pai.querySelectorAll('.campo-erro-inline').forEach(e => e.remove());
}

function limparTodosErros() {
    document.querySelectorAll('.campo-invalido').forEach(c => c.classList.remove('campo-invalido'));
    document.querySelectorAll('.campo-erro-inline').forEach(e => e.remove());
}

// ── NAVEGAÇÃO COM ENTER ───────────────────────

function setupEnterNavigation() {
    const seletor = 'input:not([type="file"]), select, textarea';
    const campos = Array.from(document.querySelectorAll(seletor));

    campos.forEach((campo, i) => {
        campo.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();

            const proximo = campos[i + 1];
            if (proximo) {
                proximo.focus();
            } else {
                // Último campo: dispara o botão principal
                const btn = document.querySelector('.btn-primary, .btn-save');
                if (btn) btn.click();
            }
        });
    });
}

// ── FORÇA DA SENHA (indicador visual) ─────────

function setupIndicadorSenha() {
    const campo = document.getElementById('senha');
    if (!campo) return;

    // Só roda na página de cadastro (tem campo CPF)
    if (!document.getElementById('cpf')) return;

    const indicador = document.createElement('div');
    indicador.id = 'indicador-senha';
    indicador.className = 'indicador-senha';
    indicador.style.display = 'none'; // Esconde até o usuário começar a digitar
    indicador.innerHTML = `
        <div class="forca-wrap">
            <div class="barra-forca">
                <div class="barra-segmento" id="seg1"></div>
                <div class="barra-segmento" id="seg2"></div>
                <div class="barra-segmento" id="seg3"></div>
                <div class="barra-segmento" id="seg4"></div>
            </div>
            <span class="forca-texto" id="forca-texto"></span>
        </div>
        <ul class="requisitos-senha" id="requisitos-lista"></ul>
    `;

    // Insere logo depois do input de senha (dentro do card)
    campo.insertAdjacentElement('afterend', indicador);

    campo.addEventListener('input', () => {
        const val = campo.value;

        if (!val) {
            indicador.style.display = 'none';
            return;
        }

        indicador.style.display = 'block';

        const erros = validarSenha(val);
        const forca = 5 - erros.length; // 0 a 5

        const cores  = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
        const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];
        const cor    = cores[Math.min(forca - 1, 3)] || '#ef4444';

        ['seg1','seg2','seg3','seg4'].forEach((id, i) => {
            document.getElementById(id).style.background =
                i < Math.ceil(forca * 4 / 5) ? cor : 'var(--border)';
        });

        document.getElementById('forca-texto').textContent  = labels[Math.min(forca, 4)] || '';
        document.getElementById('forca-texto').style.color  = forca >= 4 ? '#22c55e' : forca >= 3 ? '#eab308' : '#ef4444';

        const requisitos = [
            { ok: val.length >= 8,                                      texto: 'Mínimo 8 caracteres' },
            { ok: /[A-Z]/.test(val),                                    texto: 'Letra maiúscula' },
            { ok: /[a-z]/.test(val),                                    texto: 'Letra minúscula' },
            { ok: /[0-9]/.test(val),                                    texto: 'Número' },
            { ok: /[!@#$%^&*()\-_,.?":{}|<>]/.test(val),              texto: 'Caractere especial' },
        ];

        document.getElementById('requisitos-lista').innerHTML =
            requisitos.map(r => `<li class="${r.ok ? 'req-ok' : 'req-falta'}">${r.ok ? '✓' : '○'} ${r.texto}</li>`).join('');
    });
}

// ── AUTENTICAÇÃO ─────────────────────────────

function login() {
    limparTodosErros();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    let valido = true;

    if (!email) {
        mostrarErroCampo('email', 'O e-mail é obrigatório.');
        valido = false;
    } else if (!validarEmail(email)) {
        mostrarErroCampo('email', 'Insira um e-mail válido (ex: nome@dominio.com).');
        valido = false;
    }

    if (!senha) {
        mostrarErroCampo('senha', 'A senha é obrigatória.');
        valido = false;
    }

    if (!valido) return;

    fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            iniciarSplash();
            setTimeout(() => window.location.href = 'dashboard.html', 1400);
        } else {
            document.getElementById('erro').textContent = data.mensagem;
        }
    })
    .catch(() => {
        document.getElementById('erro').textContent = 'Erro ao conectar com o servidor.';
    });
}

function cadastrar() {
    limparTodosErros();
    const campos = {
        nome:            document.getElementById('nome').value.trim(),
        email:           document.getElementById('email').value.trim(),
        senha:           document.getElementById('senha').value,
        cpf:             document.getElementById('cpf').value.replace(/\D/g, ''), // Envia só os dígitos
        telefone:        document.getElementById('telefone').value.trim(),
        data_nascimento: document.getElementById('data_nascimento').value || null
    };

    let valido = true;

    if (!campos.nome) {
        mostrarErroCampo('nome', 'O nome é obrigatório.');
        valido = false;
    }

    if (!campos.email) {
        mostrarErroCampo('email', 'O e-mail é obrigatório.');
        valido = false;
    } else if (!validarEmail(campos.email)) {
        mostrarErroCampo('email', 'Insira um e-mail válido (ex: nome@dominio.com).');
        valido = false;
    }

    if (!campos.senha) {
        mostrarErroCampo('senha', 'A senha é obrigatória.');
        valido = false;
    } else {
        const errosSenha = validarSenha(campos.senha);
        if (errosSenha.length > 0) {
            mostrarErroCampo('senha', `A senha precisa ter: ${errosSenha.join(', ')}.`);
            valido = false;
        }
    }

    if (!campos.cpf) {
        mostrarErroCampo('cpf', 'O CPF é obrigatório.');
        valido = false;
    } else if (!validarCPF(campos.cpf)) {
        mostrarErroCampo('cpf', 'CPF inválido. Verifique os dígitos informados.');
        valido = false;
    }

    if (!campos.data_nascimento) {
        mostrarErroCampo('data_nascimento', 'A data de nascimento é obrigatória.');
        valido = false;
    }

    if (!valido) return;

    fetch('http://127.0.0.1:5000/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campos)
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            mostrarToast('Cadastro realizado com sucesso!', 'sucesso');
            setTimeout(() => window.location.href = 'index.html', 1200);
        } else {
            document.getElementById('erro').textContent = data.mensagem;
        }
    })
    .catch(() => {
        document.getElementById('erro').textContent = 'Erro ao conectar com o servidor.';
    });
}

function sair() {
    iniciarSplash();
    setTimeout(() => {
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    }, 1400);
}

// ── USUÁRIO LOGADO ────────────────────────────

function carregarUsuario() {
    const el = document.getElementById('usuario-nome');
    if (!el) return;
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (usuario) el.textContent = 'Olá, ' + usuario.nome;
}

// ── HELPERS ──────────────────────────────────

function formatarStatus(status) {
    const mapa = {
        aberto: 'Aberto', em_analise: 'Em Análise', em_execucao: 'Em Execução',
        concluido: 'Concluído', cancelado: 'Cancelado',
        disponivel: 'Disponível', em_uso: 'Em Uso',
        em_manutencao: 'Em Manutenção', inativo: 'Inativo',
        otimo: 'Ótimo', bom: 'Bom', regular: 'Regular',
        ruim: 'Ruim', inutilizavel: 'Inutilizável'
    };
    return mapa[status] || status;
}

function formatarPrioridade(p) {
    return { baixa:'Baixa', media:'Média', alta:'Alta', critica:'Crítica' }[p] || p;
}

function formatarData(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
}

// ── DASHBOARD ─────────────────────────────────

function carregarDashboard() {
    fetch('http://127.0.0.1:5000/equipamentos')
    .then(res => res.json())
    .then(data => {
        const total     = document.getElementById('total-itens');
        const manutencao = document.getElementById('em-manutencao');
        if (total)      total.textContent = data.length;
        if (manutencao) manutencao.textContent = data.filter(e => e.status === 'em_manutencao').length;
    }).catch(() => {});

    fetch('http://127.0.0.1:5000/chamados')
    .then(res => res.json())
    .then(data => {
        const totalChamados = document.getElementById('total-chamados');
        if (totalChamados) totalChamados.textContent = data.length;

        const recenteContainer = document.querySelector('.recent-empty');
        if (recenteContainer && data.length > 0) {
            const ultimos = data.slice(-5).reverse();
            recenteContainer.outerHTML = ultimos.map(c => `
                <div class="recent-item">
                    <span class="badge status-${c.status}">${formatarStatus(c.status)}</span>
                    <span class="recent-descricao">${c.descricao_problema}</span>
                    <span class="recent-data">${formatarData(c.data_abertura)}</span>
                </div>
            `).join('');
        }
    }).catch(() => {});
}

// ── EQUIPAMENTOS ──────────────────────────────

let todosEquipamentos = [];

function carregarEquipamentos() {
    fetch('http://127.0.0.1:5000/equipamentos')
    .then(res => res.json())
    .then(data => { todosEquipamentos = data; renderizarTabela(data); });
}

function renderizarTabela(lista) {
    const corpo = document.getElementById('corpo-tabela');
    if (!corpo) return;
    if (lista.length === 0) {
        corpo.innerHTML = '<tr class="empty-row"><td colspan="7">Nenhum bem encontrado.</td></tr>';
        return;
    }
    corpo.innerHTML = lista.map(eq => `
        <tr>
            <td>${eq.numero_patrimonio || '—'}</td>
            <td>${eq.nome}</td>
            <td>${eq.categoria || '—'}</td>
            <td>${eq.localizacao || '—'}</td>
            <td>${formatarStatus(eq.estado_conservacao)}</td>
            <td><span class="badge status-${eq.status}">${formatarStatus(eq.status)}</span></td>
            <td><button class="btn-danger" onclick="deletarEquipamento(${eq.id_equipamento})">Remover</button></td>
        </tr>
    `).join('');
}

function filtrarTabela() {
    const pat  = document.getElementById('filtro-patrimonio')?.value.toLowerCase() || '';
    const nome = document.getElementById('filtro-nome')?.value.toLowerCase() || '';
    renderizarTabela(todosEquipamentos.filter(eq =>
        (eq.numero_patrimonio || '').toLowerCase().includes(pat) &&
        (eq.nome || '').toLowerCase().includes(nome)
    ));
}

function deletarEquipamento(id) {
    if (!confirm('Tem certeza que deseja remover este equipamento?')) return;
    fetch(`http://127.0.0.1:5000/equipamentos/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            mostrarToast('Equipamento removido com sucesso.', 'sucesso');
            carregarEquipamentos();
        }
    });
}

// ── CHAMADOS ──────────────────────────────────

let todosChamados = [];

function carregarChamados() {
    fetch('http://127.0.0.1:5000/chamados')
    .then(res => res.json())
    .then(data => { todosChamados = data; renderizarChamados(data); })
    .catch(() => {
        const el = document.getElementById('lista-chamados');
        if (el) el.innerHTML = '<p class="recent-empty">Erro ao carregar chamados.</p>';
    });
}

function renderizarChamados(lista) {
    const el = document.getElementById('lista-chamados');
    if (!el) return;
    if (lista.length === 0) {
        el.innerHTML = '<p class="recent-empty">Nenhum chamado encontrado.</p>';
        return;
    }
    el.innerHTML = lista.map(c => `
        <div class="chamado-item">
            <div class="chamado-header">
                <span class="chamado-id">#${c.id_chamado}</span>
                <span class="badge status-${c.status}">${formatarStatus(c.status)}</span>
                <span class="badge prioridade-${c.prioridade}">${formatarPrioridade(c.prioridade)}</span>
                <span class="recent-data">${formatarData(c.data_abertura)}</span>
            </div>
            <div class="chamado-descricao">${c.descricao_problema}</div>
            <div class="chamado-meta">
                ${c.id_equipamento ? `<span>🔧 Equipamento #${c.id_equipamento}</span>` : '<span>Sem equipamento vinculado</span>'}
            </div>
        </div>
    `).join('');
}

function abrirChamado() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) { mostrarToast('Você precisa estar logado.', 'erro'); return; }

    limparTodosErros();
    const patrimonio = document.getElementById('patrimonio-chamado').value.trim();
    const descricao  = document.getElementById('descricao-chamado').value.trim();
    const prioridade = document.getElementById('prioridade-chamado').value;

    if (!descricao) {
        mostrarErroCampo('descricao-chamado', 'A descrição do problema é obrigatória.');
        return;
    }

    const busca = patrimonio
        ? fetch('http://127.0.0.1:5000/equipamentos').then(r => r.json())
        : Promise.resolve([]);

    busca.then(equipamentos => {
        let id_equipamento = null;
        if (patrimonio) {
            const eq = equipamentos.find(e => e.numero_patrimonio === patrimonio);
            if (!eq) {
                mostrarErroCampo('patrimonio-chamado', 'Patrimônio não encontrado no inventário.');
                return Promise.reject('not_found');
            }
            id_equipamento = eq.id_equipamento;
        }
        return fetch('http://127.0.0.1:5000/chamados', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: usuario.id_usuario, id_equipamento, prioridade, descricao_problema: descricao })
        });
    })
    .then(res => res && res.json())
    .then(data => {
        if (!data) return;
        if (data.sucesso) {
            mostrarToast('Chamado aberto com sucesso!', 'sucesso');
            document.getElementById('patrimonio-chamado').value = '';
            document.getElementById('descricao-chamado').value  = '';
            carregarChamados();
        } else {
            mostrarToast(data.mensagem, 'erro');
        }
    })
    .catch(err => { if (err !== 'not_found') mostrarToast('Erro ao conectar com o servidor.', 'erro'); });
}

function filtrarChamados(status, btn) {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderizarChamados(status === 'todos' ? todosChamados : todosChamados.filter(c => c.status === status));
}

// ── RELATÓRIOS ────────────────────────────────

window._abaAtiva = 'patrimonio';

function trocarAba(nome, btn) {
    document.querySelectorAll('.aba').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window._abaAtiva = nome;
    const filtroStatus = document.getElementById('filtro-status-chamados');
    if (filtroStatus) filtroStatus.style.display = nome === 'chamados' ? 'block' : 'none';
    const resultado = document.getElementById('resultado-relatorio');
    if (resultado) resultado.innerHTML = '';
}

function visualizarRelatorio() {
    const aba      = window._abaAtiva || 'patrimonio';
    const resultado = document.getElementById('resultado-relatorio');
    if (resultado) resultado.innerHTML = '<p style="color:var(--text-mid);padding:16px 0;">Carregando...</p>';

    let url = '';
    if (aba === 'patrimonio') {
        const cat = document.getElementById('categoria-relatorio').value;
        url = 'http://127.0.0.1:5000/relatorio/equipamentos';
        if (cat && cat !== 'todas') url += '?categoria=' + encodeURIComponent(cat);
    } else if (aba === 'chamados') {
        const status = document.getElementById('status-relatorio')?.value;
        url = 'http://127.0.0.1:5000/relatorio/chamados';
        if (status && status !== 'todos') url += '?status=' + status;
    } else if (aba === 'atividades') {
        url = 'http://127.0.0.1:5000/relatorio/usuarios';
    } else {
        url = 'http://127.0.0.1:5000/relatorio';
    }

    fetch(url)
    .then(r => r.json())
    .then(data => {
        if (!resultado) return;
        if (!data || (Array.isArray(data) && data.length === 0)) {
            resultado.innerHTML = '<p class="recent-empty">Nenhum dado encontrado.</p>';
            return;
        }
        if (aba === 'patrimonio') {
            resultado.innerHTML = `<table>
                <thead><tr><th>Equipamento</th><th>Categoria</th><th>Localização</th><th>Conservação</th><th>Disponibilidade</th><th>Chamados</th><th>Custo Total</th></tr></thead>
                <tbody>${data.map(e => `<tr>
                    <td>${e.nome_equipamento}</td><td>${e.categoria||'—'}</td><td>${e.localizacao||'—'}</td>
                    <td>${formatarStatus(e.conservacao)}</td><td>${e.disponibilidade||'—'}</td>
                    <td>${e.total_chamados}</td><td>R$ ${Number(e.custo_total_manutencao||0).toFixed(2)}</td>
                </tr>`).join('')}</tbody></table>`;
        } else if (aba === 'chamados') {
            resultado.innerHTML = `<table>
                <thead><tr><th>ID</th><th>Status</th><th>Prioridade</th><th>Usuário</th><th>Equipamento</th><th>Dias</th><th>Manutenções</th></tr></thead>
                <tbody>${data.map(c => `<tr>
                    <td>#${c.id_chamado}</td>
                    <td><span class="badge status-${c.status}">${formatarStatus(c.status)}</span></td>
                    <td>${formatarPrioridade(c.prioridade)}</td><td>${c.nome_usuario}</td>
                    <td>${c.nome_equipamento||'—'}</td><td>${c.dias_resolucao}</td><td>${c.total_manutencoes}</td>
                </tr>`).join('')}</tbody></table>`;
        } else if (aba === 'atividades') {
            resultado.innerHTML = `<table>
                <thead><tr><th>Usuário</th><th>Tipo</th><th>Chamados Criados</th><th>Em Aberto</th><th>Interações</th><th>Último Chamado</th></tr></thead>
                <tbody>${data.map(u => `<tr>
                    <td>${u.nome_usuario}</td><td>${u.tipo}</td><td>${u.total_chamados_criados}</td>
                    <td>${u.chamados_ainda_abertos}</td><td>${u.total_interacoes_status}</td>
                    <td>${formatarData(u.ultimo_chamado_criado)}</td>
                </tr>`).join('')}</tbody></table>`;
        } else {
            resultado.innerHTML = `
                <div class="cards-grid" style="margin:0 0 24px">
                    <div class="card"><div class="card-number">${data.total_equipamentos}</div><div class="card-label">Equipamentos</div></div>
                    <div class="card"><div class="card-number">R$ ${Number(data.custo_total_manutencoes||0).toFixed(2)}</div><div class="card-label">Custo Total Manutenções</div></div>
                </div>
                <h4 style="margin-bottom:12px;color:var(--text-dark)">Chamados por Status</h4>
                ${(data.chamados_por_status||[]).map(s => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
                        <span class="badge status-${s.status}">${formatarStatus(s.status)}</span>
                        <strong>${s.total}</strong>
                    </div>`).join('')}`;
        }
    })
    .catch(() => {
        if (resultado) resultado.innerHTML = '<p style="color:var(--danger);padding:16px 0;">Erro ao carregar relatório.</p>';
    });
}

function baixarPDF() {
    mostrarToast('Funcionalidade de exportação em desenvolvimento.', 'aviso');
}

// ── SALVAMENTO DE BEM (com validação) ─────────

function salvarBem() {
    limparTodosErros();
    const dados = {
        numero_patrimonio:  document.getElementById('numero_patrimonio').value.trim(),
        nome:               document.getElementById('nome').value.trim(),
        descricao:          document.getElementById('descricao').value.trim(),
        localizacao:        document.getElementById('localizacao').value.trim(),
        estado_conservacao: document.getElementById('estado_conservacao').value,
        categoria:          document.getElementById('categoria').value,
        status:             document.getElementById('status').value,
        data_aquisicao:     document.getElementById('data_aquisicao').value || null
    };

    let valido = true;

    if (!dados.numero_patrimonio) {
        mostrarErroCampo('numero_patrimonio', 'O número do patrimônio é obrigatório.');
        valido = false;
    }
    if (!dados.nome) {
        mostrarErroCampo('nome', 'O nome do item é obrigatório.');
        valido = false;
    }
    if (!dados.data_aquisicao) {
        mostrarErroCampo('data_aquisicao', 'A data de aquisição é obrigatória.');
        valido = false;
    }

    if (!valido) return;

    fetch('http://127.0.0.1:5000/equipamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            mostrarToast('Bem cadastrado com sucesso!', 'sucesso');
            setTimeout(() => window.location.href = 'inventario.html', 1200);
        } else {
            mostrarToast(data.mensagem, 'erro');
        }
    })
    .catch(() => mostrarToast('Erro ao conectar com o servidor.', 'erro'));
}

// ── INICIALIZAÇÃO ─────────────────────────────

window.onload = function () {
    aplicarTema();
    carregarUsuario();
    setupEnterNavigation();
    setupIndicadorSenha();
    setupMascaras();
    setupTransicoes();

    if (document.getElementById('corpo-tabela'))   carregarEquipamentos();
    if (document.getElementById('total-itens'))    carregarDashboard();
    if (document.getElementById('lista-chamados')) carregarChamados();
};
