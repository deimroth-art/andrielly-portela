/* ==========================================================================
   1. NAVEGAÇÃO ENTRE PÁGINAS DO SITE PÚBLICO
   ========================================================================== */

// Alterna entre as seções públicas (currículo, blog/posts e contato) e atualiza o botão ativo
function switchPage(pageId) {
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(sec => sec.classList.add('hidden'));

    const target = document.getElementById('page-' + pageId);
    if (target) {
        target.classList.remove('hidden');
    }

    // Carrega os posts públicos ao abrir a aba de conteúdos
    if (pageId === 'blog' && typeof loadPublicPosts === 'function') {
        loadPublicPosts();
    }

    // Reseta o estilo de todos os botões de navegação antes de destacar o selecionado
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('bg-oliveSageBtn', 'text-white', 'shadow-sm', 'border-oliveSageBtn');
        btn.classList.add('text-oliveDark/90', 'bg-cardLight/45', 'border-transparent', 'hover:bg-blush/85', 'hover:text-oliveDeep', 'hover:border-petal/80', 'hover:shadow-sm', 'hover:-translate-y-0.5');
    });

    const activeBtn = document.getElementById('nav-' + pageId);
    if (activeBtn) {
        activeBtn.classList.remove('text-oliveDark/90', 'bg-cardLight/45', 'border-transparent', 'hover:bg-blush/85', 'hover:text-oliveDeep', 'hover:border-petal/80', 'hover:shadow-sm', 'hover:-translate-y-0.5');
        activeBtn.classList.add('bg-oliveSageBtn', 'text-white', 'shadow-sm', 'border-oliveSageBtn');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}


/* ==========================================================================
   2. FORMULÁRIO DE CONTATO E MÁSCARA DE TELEFONE
   ========================================================================== */

// Formata números de telefone brasileiros (fixo ou celular com DDD) enquanto o usuário digita
function formatBrazilPhone(value) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Configura máscara do telefone e contador de caracteres da mensagem no formulário de contato
document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('contact-phone');
    const messageInput = document.getElementById('contact-message');
    const messageCount = document.getElementById('contact-message-count');

    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = formatBrazilPhone(e.target.value);
        });
    }

    if (messageInput && messageCount) {
        const updateCounter = () => {
            messageCount.textContent = `${messageInput.value.length} / 2000 caracteres`;
        };
        messageInput.addEventListener('input', updateCounter);
        updateCounter();
    }
});

// Valida e envia os dados do formulário de contato via FormSubmit AJAX
async function submitContactForm(event) {
    event.preventDefault();
    const btn = document.getElementById('contact-submit-btn');
    const feedback = document.getElementById('contact-feedback');
    const form = document.getElementById('contact-form');
    const messageCount = document.getElementById('contact-message-count');

    const name = document.getElementById('contact-name').value.trim().slice(0, 80);
    const email = document.getElementById('contact-email').value.trim();
    const phoneDigits = document.getElementById('contact-phone').value.replace(/\D/g, '').slice(0, 11);
    const phone = formatBrazilPhone(phoneDigits);
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value.trim().slice(0, 2000);

    document.getElementById('contact-phone').value = phone;

    if (phoneDigits.length < 10) {
        feedback.className = 'p-4 rounded-2xl bg-blush/80 border border-petal text-oliveDark text-xs sm:text-sm font-medium';
        feedback.innerHTML = '<i class="fa-solid fa-circle-info mr-1.5 text-olive"></i> Por favor, informe um telefone válido com DDD (10 ou 11 dígitos).';
        feedback.classList.remove('hidden');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Enviando mensagem...</span>';
    feedback.classList.add('hidden');

    try {
        const response = await fetch('https://formsubmit.co/ajax/andre.imroth@hotmail.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                _subject: `Novo Contato pelo Site — ${subject}`,
                _template: 'table',
                Nome: name,
                Email: email,
                Telefone: phone,
                Assunto: subject,
                Mensagem: message
            })
        });

        if (response.ok) {
            feedback.className = 'p-4 rounded-2xl bg-olive/15 border border-olive/30 text-oliveDark text-xs sm:text-sm font-medium';
            feedback.innerHTML = '<i class="fa-solid fa-circle-check mr-1.5 text-olive"></i> Mensagem enviada com sucesso! Em breve retornaremos o seu contato.';
            feedback.classList.remove('hidden');
            form.reset();
            if (messageCount) messageCount.textContent = '0 / 2000 caracteres';
        } else {
            throw new Error('Falha na resposta do serviço');
        }
    } catch (error) {
        feedback.className = 'p-4 rounded-2xl bg-blush/80 border border-petal text-oliveDark text-xs sm:text-sm font-medium';
        feedback.innerHTML = '<i class="fa-solid fa-circle-info mr-1.5 text-olive"></i> Solicitação registrada! Caso esteja visualizando localmente, o envio direto por e-mail funcionará automaticamente assim que o site estiver publicado na web.';
        feedback.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i><span>Enviar Mensagem</span>';
    }
}


/* ==========================================================================
   3. AUTENTICAÇÃO, SESSÃO E TRANSIÇÃO PÚBLICO / SISTEMA (SUPABASE)
   ========================================================================== */

// Cliente Supabase inicializado com URL e chave pública do projeto
const SUPABASE_URL = 'https://idwtcmdpnolkcnwfrmqp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WiIwRGkoNfXJfKOHfSTfwg_kPwbkJLW';
const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Declarado no topo da seção para evitar ReferenceError antes da inicialização
let currentUserProfile = null;

// Abre o modal de login/conta e atualiza o estado da sessão atual
function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    refreshAuthState();
}

// Fecha o modal de autenticação
function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Fecha o modal apenas quando o clique ocorre fora da caixa interna
function handleModalBackdropClick(event) {
    if (event.target.id === 'login-modal') {
        closeLoginModal();
    }
}

// Alterna entre as telas internas do modal ('login', 'recovery' e 'account')
function toggleAuthView(view) {
    ['login', 'recovery', 'account'].forEach((name) => {
        const el = document.getElementById(`auth-view-${name}`);
        if (el) el.classList.toggle('hidden', name !== view);
    });
}

// Consulta a sessão ativa, carrega o perfil em `profiles` e ajusta textos/permissões do modal
async function refreshAuthState() {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    const navLabel = document.getElementById('nav-login-label');

    if (!session) {
        currentUserProfile = null;
        if (navLabel) navLabel.textContent = 'Área Restrita';
        toggleAuthView('login');
        return;
    }

    const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('nome, tipo_perfil, is_adm, is_master, clinica_id')
        .eq('id', session.user.id)
        .single();

    console.log('Perfil carregado:', profile, 'Erro:', profileError);

    currentUserProfile = profile || null;

    // Garante vínculo com a clínica padrão caso `clinica_id` venha vazio no perfil
    if (currentUserProfile && !currentUserProfile.clinica_id) {
        const { data: fallbackClinica } = await supabaseClient
            .from('clinicas')
            .select('id')
            .eq('slug', 'andrielly-portela')
            .single();

        if (fallbackClinica) {
            currentUserProfile.clinica_id = fallbackClinica.id;
        }
    }

    const isMaster = currentUserProfile?.is_master === true;
    const isAdm = currentUserProfile?.is_adm === true || currentUserProfile?.tipo_perfil === 'super_adm';

    let badgeTexto = 'Cliente';
    if (currentUserProfile?.tipo_perfil === 'super_adm') badgeTexto = 'Super ADM / Master';
    else if (isAdm) badgeTexto = isMaster ? 'ADM Master' : 'Terapeuta ADM';
    else if (currentUserProfile?.tipo_perfil === 'terapeuta') badgeTexto = 'Terapeuta';

    if (navLabel) navLabel.textContent = isAdm ? 'Painel ADM' : 'Minha Conta';
    document.getElementById('logged-user-email').textContent = currentUserProfile?.nome
        ? `${currentUserProfile.nome} (${session.user.email})`
        : session.user.email;
    document.getElementById('logged-user-role').textContent = badgeTexto;

    const masterPanel = document.getElementById('master-reset-panel');
    if (masterPanel) masterPanel.classList.toggle('hidden', !isMaster);

    toggleAuthView('account');
}

// Abre o painel interno quando o botão de acesso ao painel é clicado
async function handleAccessPanelClick() {
    if (!currentUserProfile && supabaseClient) {
        await refreshAuthState();
    }
    openSystemPanel();
}

// Mostra ou esconde elementos visuais exclusivos da vitrine pública (cabeçalho e marca d'água)
function setPublicChromeVisible(isVisible) {
    document.querySelectorAll('.public-site-chrome').forEach((el) => {
        el.classList.toggle('hidden', !isVisible);
    });

    const watermark = document.getElementById('fixed-bg-watermark');
    if (watermark) {
        watermark.classList.toggle('hidden', !isVisible);
    }
}

// Esconde as páginas públicas, exibe a área interna do sistema e abre o dashboard
async function openSystemPanel() {
    closeLoginModal();
    setPublicChromeVisible(false);

    document.querySelectorAll('.page-section').forEach((sec) => {
        sec.classList.add('hidden');
    });

    const systemSection = document.getElementById('app-system-section');
    if (systemSection) {
        systemSection.classList.remove('hidden');
    }

    if (!currentUserProfile && supabaseClient) {
        await refreshAuthState();
    }

    if (typeof renderDashboardForRole === 'function') {
        await renderDashboardForRole();
    }

    if (typeof switchSystemTab === 'function') {
        switchSystemTab('dashboard');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Encerra a sessão no Supabase e recarrega a página para voltar limpo à área pública
async function handleSystemLogout() {
    try {
        if (supabaseClient?.auth) {
            await supabaseClient.auth.signOut();
        }
    } catch (err) {
        console.warn('Erro ao encerrar sessão:', err);
    }

    currentUserProfile = null;
    setPublicChromeVisible(true);
    window.location.reload();
}

// Autentica o usuário com e-mail e senha no Supabase Auth
async function handleSupabaseLogin(event) {
    event.preventDefault();
    if (!supabaseClient) return;

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-submit-btn');
    const feedback = document.getElementById('login-feedback');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Verificando...</span>';
    feedback.classList.add('hidden');

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Entrar</span>';

    if (error) {
        feedback.textContent = 'Login ou senha inválidos. Verifique os dados e tente novamente.';
        feedback.className = 'p-3.5 rounded-2xl bg-blush/80 border border-petal text-oliveDark text-xs font-medium';
        feedback.classList.remove('hidden');
        return;
    }

    document.getElementById('login-form').reset();
    await refreshAuthState();
}

// Invoca a Edge Function `master-reset-password` para redefinir senha de outro usuário (apenas Master)
async function handleMasterPasswordReset(event) {
    event.preventDefault();
    if (!supabaseClient) return;

    const targetEmail = document.getElementById('target-user-email').value.trim();
    const newPassword = document.getElementById('target-new-password').value;
    const btn = document.getElementById('master-reset-btn');
    const feedback = document.getElementById('master-feedback');

    btn.disabled = true;
    btn.textContent = 'Atualizando...';
    feedback.classList.add('hidden');

    const { data, error } = await supabaseClient.functions.invoke('master-reset-password', {
        body: { targetEmail, newPassword }
    });

    btn.disabled = false;
    btn.textContent = 'Salvar Nova Senha';

    if (error || data?.error) {
        feedback.textContent = data?.error || 'Não foi possível redefinir a senha. Verifique o e-mail informado.';
        feedback.className = 'p-3 rounded-xl bg-blush/80 border border-petal text-oliveDark text-xs font-medium';
    } else {
        feedback.textContent = 'Senha atualizada com sucesso!';
        feedback.className = 'p-3 rounded-xl bg-olive/15 border border-olive/30 text-oliveDark text-xs font-medium';
        document.getElementById('master-reset-form').reset();
    }
    feedback.classList.remove('hidden');
}

// Faz logout simples a partir do modal de conta
async function handleSupabaseLogout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    await refreshAuthState();
}


/* ==========================================================================
   4. INICIALIZAÇÃO GLOBAL DA APLICAÇÃO
   ========================================================================== */

// Preenche o ano no rodapé, verifica sessão ativa e carrega os posts públicos
document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    refreshAuthState();
    if (typeof loadPublicPosts === 'function') {
        loadPublicPosts();
    }
});


/* ==========================================================================
   5. DASHBOARD INTERNO, PERMISSÕES E NAVEGAÇÃO DE SUBTELAS
   ========================================================================== */

// Sai da área interna para a página pública de currículo
function exitSystemToPublicSite() {
    document.getElementById('app-system-section')?.classList.add('hidden');
    if (typeof switchPage === 'function') {
        switchPage('curriculo');
    } else {
        document.getElementById('page-curriculo')?.classList.remove('hidden');
    }
}

// Alterna entre as subtelas internas do sistema e carrega os dados da respectiva tela
function switchSystemTab(tabName) {
    ['dashboard', 'posts', 'cadastros', 'agenda', 'placeholder'].forEach((view) => {
        document.getElementById(`sys-view-${view}`)?.classList.add('hidden');
    });

    if (tabName === 'dashboard') {
        document.getElementById('sys-view-dashboard')?.classList.remove('hidden');
    } else if (tabName === 'posts') {
        document.getElementById('sys-view-posts')?.classList.remove('hidden');
        loadAdminPosts();
    } else if (tabName === 'cadastros') {
        document.getElementById('sys-view-cadastros')?.classList.remove('hidden');
        switchCadastroSubTab('clientes');
        loadCadastrosData();
    } else if (tabName === 'agenda') {
        document.getElementById('sys-view-agenda')?.classList.remove('hidden');
        loadAgendaData();
    } else {
        const titles = {
            evolucao: 'Atendimento & Evolução Clínica',
            financeiro: 'Controle Financeiro',
            clinicas: 'Gestão de Clínicas Assinantes (SaaS)'
        };
        document.getElementById('placeholder-title').textContent = titles[tabName] || 'Módulo';
        document.getElementById('sys-view-placeholder')?.classList.remove('hidden');
    }
}

// Monta o cabeçalho do painel e os atalhos de módulos conforme o perfil do usuário
async function renderDashboardForRole() {
    if (!currentUserProfile || !supabaseClient) return;

    const isSuperAdm = currentUserProfile.tipo_perfil === 'super_adm';
    const isAdm = currentUserProfile.is_adm === true || isSuperAdm;
    const isTerapeuta = currentUserProfile.tipo_perfil === 'terapeuta';
    const isCliente = currentUserProfile.tipo_perfil === 'cliente';

    const welcomeEl = document.getElementById('sys-welcome-title');
    if (welcomeEl && currentUserProfile.nome) {
        welcomeEl.textContent = `Olá, ${currentUserProfile.nome}`;
    }

    const roleBadgeEl = document.getElementById('sys-role-badge');
    if (roleBadgeEl) {
        roleBadgeEl.textContent = isSuperAdm
            ? 'Super ADM / Master'
            : isAdm
            ? 'Terapeuta ADM'
            : isTerapeuta
            ? 'Terapeuta'
            : 'Portal do Cliente';
    }

    if (currentUserProfile.clinica_id) {
        const { data: clinica } = await supabaseClient
            .from('clinicas')
            .select('nome, logo_url')
            .eq('id', currentUserProfile.clinica_id)
            .single();

        if (clinica) {
            const clinicNameEl = document.getElementById('sys-clinic-name');
            if (clinicNameEl) clinicNameEl.textContent = clinica.nome;
            const bgLogoEl = document.getElementById('dashboard-bg-logo');
            if (clinica.logo_url && bgLogoEl) {
                bgLogoEl.src = clinica.logo_url;
            }
        }
    }

    const clientCards = document.getElementById('client-dashboard-cards');
    if (clientCards) clientCards.classList.toggle('hidden', !isCliente);
    if (isCliente) loadClientSummary();

    const modules = [];
    if (isSuperAdm) {
        modules.push({ id: 'clinicas', icon: 'fa-building', title: 'Clínicas SaaS', desc: 'Gerenciar clínicas assinantes e planos.' });
    }
    if (isAdm) {
        modules.push({ id: 'cadastros', icon: 'fa-users-gear', title: 'Cadastros', desc: 'Clientes, terapeutas/ADM e planos.' });
        modules.push({ id: 'posts', icon: 'fa-share-nodes', title: 'Posts & Conteúdos', desc: 'Publicar links sociais (expira em 90 dias).' });
    }
    if (isAdm || isTerapeuta || isCliente) {
        modules.push({ id: 'agenda', icon: 'fa-calendar-days', title: 'Agenda de Horários', desc: 'Pilates, Homecare e Atendimento Clínico.' });
    }
    if (isAdm || isTerapeuta) {
        modules.push({ id: 'evolucao', icon: 'fa-notes-medical', title: 'Atendimento / Evolução', desc: 'Avaliações, evoluções e orientações.' });
    }
    if (isAdm || isCliente) {
        modules.push({ id: 'financeiro', icon: 'fa-wallet', title: 'Financeiro', desc: 'Mensalidades, vencimentos e comprovantes.' });
    }

    const grid = document.getElementById('dashboard-modules-grid');
    if (grid) {
        grid.innerHTML = modules.map((m) => `
            <button type="button" onclick="switchSystemTab('${m.id}')"
                class="cursor-pointer text-left p-5 rounded-2xl bg-paper/80 hover:bg-cardLight border border-borderWarm hover:border-olive/40 shadow-sm transition group">
                <div class="w-10 h-10 rounded-xl bg-olive/15 text-oliveDark flex items-center justify-center mb-3 group-hover:bg-oliveSageBtn group-hover:text-white transition">
                    <i class="fa-solid ${m.icon}"></i>
                </div>
                <h4 class="font-bold text-oliveDark text-sm sm:text-base">${m.title}</h4>
                <p class="text-xs text-inkMain/80 mt-1">${m.desc}</p>
            </button>
        `).join('');
    }
}

// Carrega os cartões de resumo do cliente (dados pessoais, plano/sessões e próximo pagamento)
async function loadClientSummary() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data: client } = await supabaseClient
        .from('clients')
        .select('id, nome, telefone, email, endereco, sessoes_restantes, creditos_reposicao, plans(nome, modalidade)')
        .eq('profile_id', session.user.id)
        .single();

    if (!client) return;

    document.getElementById('cli-dash-nome').textContent = client.nome;
    document.getElementById('cli-dash-contato').textContent = `${client.telefone || ''} • ${client.email}`;
    document.getElementById('cli-dash-endereco').textContent = client.endereco || 'Endereço não informado';

    document.getElementById('cli-dash-plano').textContent = client.plans?.nome || 'Plano avulso / não vinculado';
    document.getElementById('cli-dash-sessoes').textContent = `Sessões restantes: ${client.sessoes_restantes}`;
    document.getElementById('cli-dash-reposicao').textContent = `Créditos de reposição: ${client.creditos_reposicao}`;

    const { data: nextPay } = await supabaseClient
        .from('payments')
        .select('valor, data_vencimento, status')
        .eq('client_id', client.id)
        .in('status', ['pendente', 'atrasado'])
        .order('data_vencimento', { ascending: true })
        .limit(1)
        .single();

    if (nextPay) {
        const dataFormatada = new Date(nextPay.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR');
        document.getElementById('cli-dash-vencimento').textContent = `Vence em ${dataFormatada}`;
        document.getElementById('cli-dash-valor').textContent = `Valor: R$ ${Number(nextPay.valor).toFixed(2).replace('.', ',')}`;
        document.getElementById('cli-dash-status-pag').textContent = `Status: ${nextPay.status.toUpperCase()}`;
    }
}


/* ==========================================================================
   6. MÓDULO DE CADASTROS (CLIENTES, TERAPEUTAS E PLANOS)
   ========================================================================== */

// Alterna entre as sub-abas de Clientes, Terapeutas e Planos
function switchCadastroSubTab(subTab) {
    ['clientes', 'terapeutas', 'planos'].forEach((name) => {
        document.getElementById(`cad-sub-${name}`)?.classList.toggle('hidden', name !== subTab);
        const btn = document.getElementById(`cad-tab-btn-${name}`);
        if (btn) {
            if (name === subTab) {
                btn.className = 'cursor-pointer px-4 py-2 rounded-xl text-xs font-bold bg-oliveSageBtn text-white transition';
            } else {
                btn.className = 'cursor-pointer px-4 py-2 rounded-xl text-xs font-bold bg-paper/80 text-oliveDark border border-borderWarm hover:bg-blush/70 transition';
            }
        }
    });
}

// Exibe mensagens de sucesso ou erro nos formulários de cadastro
function showCadastroFeedback(elId, msg, isError = false) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = msg;
    el.className = isError
        ? 'p-3 rounded-xl bg-blush/80 border border-petal text-oliveDark text-xs font-medium'
        : 'p-3 rounded-xl bg-olive/15 border border-olive/30 text-oliveDark text-xs font-medium';
    el.classList.remove('hidden');
}

// Vincula ou renova um plano em um cliente já cadastrado, somando as sessões sem duplicar o paciente
async function applyPlanToExistingClient(clientId, selectId) {
    if (!supabaseClient || !clientId) return;
    const sel = document.getElementById(selectId);
    const planId = sel?.value;
    if (!planId) {
        alert('Selecione um plano para vincular ou renovar.');
        return;
    }

    const [{ data: plan, error: errPlan }, { data: client, error: errCli }] = await Promise.all([
        supabaseClient.from('plans').select('id, nome, qtd_sessoes, valor').eq('id', planId).single(),
        supabaseClient.from('clients').select('id, nome, sessoes_restantes').eq('id', clientId).single()
    ]);

    if (errPlan || !plan || errCli || !client) {
        alert('Não foi possível carregar os dados do plano ou do cliente.');
        return;
    }

    const novasSessoes = Number(client.sessoes_restantes ?? 0) + Number(plan.qtd_sessoes ?? 0);

    const { error: errUpdate } = await supabaseClient
        .from('clients')
        .update({
            plano_id: plan.id,
            sessoes_restantes: novasSessoes
        })
        .eq('id', clientId);

    if (errUpdate) {
        alert('Erro ao atualizar plano do cliente: ' + errUpdate.message);
        return;
    }

    alert(`Plano "${plan.nome}" aplicado a ${client.nome}! Saldo atual: ${novasSessoes} sessões.`);
    await loadCadastrosData();
}

// Carrega planos, terapeutas e clientes da clínica e atualiza as listas e selects
async function loadCadastrosData() {
    if (!supabaseClient || !currentUserProfile?.clinica_id) return;
    const cid = currentUserProfile.clinica_id;

    // 1. Planos
    const { data: planos, error: errPlanos } = await supabaseClient
        .from('plans')
        .select('*')
        .eq('clinica_id', cid)
        .order('nome');

    if (errPlanos) console.error('Erro ao carregar planos:', errPlanos);

    const listaPlanos = document.getElementById('lista-planos');
    const selectPlano = document.getElementById('cli-plano-id');

    if (selectPlano) {
        selectPlano.innerHTML = '<option value="">Sem plano / Avulso</option>' +
            (planos || []).map((p) => `<option value="${p.id}">${p.nome} (${p.modalidade.toUpperCase()} - R$ ${Number(p.valor).toFixed(2)})</option>`).join('');
    }

    if (listaPlanos) {
        listaPlanos.innerHTML = (!planos || planos.length === 0)
            ? '<p class="text-xs text-inkMuted">Nenhum plano cadastrado.</p>'
            : planos.map((p) => `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-cardLight/80 border border-borderWarm">
                    <div>
                        <span class="text-[11px] font-bold uppercase text-olive">${p.modalidade} • ${p.periodicidade}</span>
                        <p class="font-bold text-oliveDark">${p.nome}</p>
                        <p class="text-xs text-inkMuted">${p.qtd_sessoes} sessões • R$ ${Number(p.valor).toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button type="button" onclick="deleteCadastroItem('plans', '${p.id}')" class="cursor-pointer px-3 py-1.5 rounded-xl bg-blush/70 text-oliveDark text-xs font-semibold hover:bg-petal self-start sm:self-center">
                        Excluir
                    </button>
                </div>
            `).join('');
    }

    // 2. Terapeutas
    const { data: terapeutas, error: errTer } = await supabaseClient
        .from('therapists')
        .select('*')
        .eq('clinica_id', cid)
        .order('nome');

    if (errTer) console.error('Erro ao carregar terapeutas:', errTer);

    const listaTerapeutas = document.getElementById('lista-terapeutas');
    const selectTerapeuta = document.getElementById('cli-terapeuta-id');

    if (selectTerapeuta) {
        selectTerapeuta.innerHTML = '<option value="">Selecionar terapeuta...</option>' +
            (terapeutas || []).map((t) => `<option value="${t.id}">${t.nome}${t.crefito ? ' (' + t.crefito + ')' : ''}</option>`).join('');
    }

    if (listaTerapeutas) {
        listaTerapeutas.innerHTML = (!terapeutas || terapeutas.length === 0)
            ? '<p class="text-xs text-inkMuted">Nenhum terapeuta cadastrado.</p>'
            : terapeutas.map((t) => `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-cardLight/80 border border-borderWarm">
                    <div>
                        <div class="flex items-center gap-2">
                            <p class="font-bold text-oliveDark">${t.nome}</p>
                            ${t.is_adm ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-olive/15 text-oliveDark">ADM</span>' : ''}
                        </div>
                        <p class="text-xs text-inkMuted">${t.email} ${t.crefito ? '• CREFITO: ' + t.crefito : ''} ${t.especialidades ? '• ' + t.especialidades : ''}</p>
                    </div>
                    <button type="button" onclick="deleteCadastroItem('therapists', '${t.id}')" class="cursor-pointer px-3 py-1.5 rounded-xl bg-blush/70 text-oliveDark text-xs font-semibold hover:bg-petal self-start sm:self-center">
                        Excluir
                    </button>
                </div>
            `).join('');
    }

    // 3. Clientes (com ação direta para trocar/renovar plano sem criar novo cadastro)
    const { data: clientes, error: errCli } = await supabaseClient
        .from('clients')
        .select('*, plans(nome), therapists(nome)')
        .eq('clinica_id', cid)
        .order('nome');

    if (errCli) console.error('Erro ao carregar clientes:', errCli);

    const listaClientes = document.getElementById('lista-clientes');
    if (listaClientes) {
        listaClientes.innerHTML = (!clientes || clientes.length === 0)
            ? '<p class="text-xs text-inkMuted">Nenhum cliente cadastrado.</p>'
            : clientes.map((c) => {
                const planOptionsHtml = '<option value="">Trocar / Renovar plano...</option>' +
                    (planos || []).map((p) => `<option value="${p.id}">${p.nome} (+${p.qtd_sessoes} sessões)</option>`).join('');

                return `
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-cardLight/80 border border-borderWarm">
                        <div>
                            <p class="font-bold text-oliveDark">${c.nome}</p>
                            <p class="text-xs text-inkMuted">${c.email} ${c.telefone ? '• ' + c.telefone : ''}</p>
                            <p class="text-xs text-olive font-medium mt-0.5">
                                Plano: ${c.plans?.nome || 'Avulso'} • Terapeuta: ${c.therapists?.nome || 'Não definido'} • Sessões: ${c.sessoes_restantes}
                            </p>
                        </div>
                        <div class="flex flex-wrap items-center gap-2 self-start sm:self-center">
                            <select id="cli-renew-plan-${c.id}" class="px-2.5 py-1.5 rounded-xl bg-paper border border-borderWarm text-xs font-semibold text-oliveDark">
                                ${planOptionsHtml}
                            </select>
                            <button type="button" onclick="applyPlanToExistingClient('${c.id}', 'cli-renew-plan-${c.id}')" class="cursor-pointer px-3 py-1.5 rounded-xl bg-oliveSageBtn hover:bg-oliveDark text-white text-xs font-semibold transition">
                                Aplicar Plano
                            </button>
                            <button type="button" onclick="deleteCadastroItem('clients', '${c.id}')" class="cursor-pointer px-3 py-1.5 rounded-xl bg-blush/70 text-oliveDark text-xs font-semibold hover:bg-petal">
                                Excluir
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
    }
}

// Insere um novo plano/pacote na tabela `plans`
async function handleSavePlan(event) {
    event.preventDefault();
    if (!supabaseClient || !currentUserProfile?.clinica_id) return;

    const { error } = await supabaseClient.from('plans').insert({
        clinica_id: currentUserProfile.clinica_id,
        nome: document.getElementById('pla-nome').value.trim(),
        modalidade: document.getElementById('pla-modalidade').value,
        qtd_sessoes: Number(document.getElementById('pla-sessoes').value) || 1,
        valor: Number(document.getElementById('pla-valor').value) || 0,
        periodicidade: document.getElementById('pla-periodicidade').value
    });

    if (error) {
        showCadastroFeedback('pla-feedback', 'Erro ao salvar plano: ' + error.message, true);
        return;
    }

    document.getElementById('form-cad-plano').reset();
    showCadastroFeedback('pla-feedback', 'Plano cadastrado com sucesso!');
    loadCadastrosData();
}

// Insere um novo terapeuta e sincroniza permissão ADM no perfil correspondente
async function handleSaveTherapist(event) {
    event.preventDefault();
    if (!supabaseClient || !currentUserProfile?.clinica_id) return;

    const email = document.getElementById('ter-email').value.trim().toLowerCase();
    const isAdm = document.getElementById('ter-is-adm').checked;

    const { error } = await supabaseClient.from('therapists').insert({
        clinica_id: currentUserProfile.clinica_id,
        nome: document.getElementById('ter-nome').value.trim(),
        email,
        telefone: document.getElementById('ter-telefone').value.trim() || null,
        crefito: document.getElementById('ter-crefito').value.trim() || null,
        especialidades: document.getElementById('ter-especialidades').value.trim() || null,
        is_adm: isAdm
    });

    if (error) {
        showCadastroFeedback('ter-feedback', 'Erro ao salvar terapeuta: ' + error.message, true);
        return;
    }

    await supabaseClient
        .from('profiles')
        .update({ is_adm: isAdm, tipo_perfil: 'terapeuta' })
        .eq('email', email)
        .neq('tipo_perfil', 'super_adm');

    document.getElementById('form-cad-terapeuta').reset();
    showCadastroFeedback('ter-feedback', 'Terapeuta cadastrado com sucesso!');
    loadCadastrosData();
}

// Insere um novo cliente na tabela `clients`
async function handleSaveClient(event) {
    event.preventDefault();
    if (!supabaseClient || !currentUserProfile?.clinica_id) return;

    const planoId = document.getElementById('cli-plano-id').value || null;
    const terapeutaId = document.getElementById('cli-terapeuta-id').value || null;

    const { error } = await supabaseClient.from('clients').insert({
        clinica_id: currentUserProfile.clinica_id,
        nome: document.getElementById('cli-nome').value.trim(),
        email: document.getElementById('cli-email').value.trim().toLowerCase(),
        telefone: document.getElementById('cli-telefone').value.trim() || null,
        plano_id: planoId,
        terapeuta_id: terapeutaId,
        sessoes_restantes: Number(document.getElementById('cli-sessoes').value) || 0,
        endereco: document.getElementById('cli-endereco').value.trim() || null,
        observacoes_clinicas: document.getElementById('cli-obs').value.trim() || null
    });

    if (error) {
        showCadastroFeedback('cli-feedback', 'Erro ao salvar cliente: ' + error.message, true);
        return;
    }

    document.getElementById('form-cad-cliente').reset();
    showCadastroFeedback('cli-feedback', 'Cliente cadastrado com sucesso!');
    loadCadastrosData();
}

// Remove um item de cadastro (`plans`, `therapists` ou `clients`) pelo ID
async function deleteCadastroItem(table, id) {
    if (!supabaseClient) return;
    await supabaseClient.from(table).delete().eq('id', id);
    loadCadastrosData();
}


/* ==========================================================================
   7. GESTÃO DE POSTS E CONTEÚDOS (VITRINE PÚBLICA E VALIDADE DE 90 DIAS)
   ========================================================================== */

// Valida e publica um novo link de rede social na tabela `posts`
async function handleCreatePost(event) {
    event.preventDefault();
    if (!supabaseClient || !currentUserProfile?.clinica_id) return;

    const rede = document.getElementById('post-network').value;
    const titulo = document.getElementById('post-title').value.trim();
    const url = document.getElementById('post-url').value.trim();
    const btn = document.getElementById('post-submit-btn');
    const feedback = document.getElementById('post-feedback');

    if (url.includes('lnkd.in/')) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-plus mr-1"></i> Publicar na Vitrine (90 dias)';
        feedback.textContent = 'Este é um link encurtado (lnkd.in). Abra-o no navegador e copie o endereço completo (linkedin.com/posts/...) da barra superior para que a publicação apareça incorporada na página.';
        feedback.className = 'p-3 rounded-xl bg-blush/80 border border-petal text-oliveDark text-xs font-medium';
        feedback.classList.remove('hidden');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Publicando...';
    feedback.classList.add('hidden');

    const { error } = await supabaseClient.from('posts').insert({
        clinica_id: currentUserProfile.clinica_id,
        rede_social: rede,
        titulo: titulo || null,
        url_post: url
    });

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-plus mr-1"></i> Publicar na Vitrine (90 dias)';

    if (error) {
        feedback.textContent = 'Erro ao publicar conteúdo: ' + error.message;
        feedback.className = 'p-3 rounded-xl bg-blush/80 border border-petal text-oliveDark text-xs font-medium';
    } else {
        feedback.textContent = 'Post publicado com sucesso! Ele ficará disponível na vitrine por 90 dias.';
        feedback.className = 'p-3 rounded-xl bg-olive/15 border border-olive/30 text-oliveDark text-xs font-medium';
        document.getElementById('new-post-form').reset();
        loadAdminPosts();
        loadPublicPosts();
    }
    feedback.classList.remove('hidden');
}

// Lista no painel administrativo os posts ativos e quantos dias restam para expirar
async function loadAdminPosts() {
    const listEl = document.getElementById('admin-posts-list');
    if (!listEl || !supabaseClient) return;

    let query = supabaseClient
        .from('posts')
        .select('id, clinica_id, rede_social, titulo, url_post, created_at, expires_at')
        .order('created_at', { ascending: false });

    if (currentUserProfile?.clinica_id && currentUserProfile?.tipo_perfil !== 'super_adm') {
        query = query.eq('clinica_id', currentUserProfile.clinica_id);
    }

    const { data: posts, error } = await query;

    if (error) {
        console.error('Erro ao carregar posts no admin:', error);
        listEl.innerHTML = `<p class="text-xs text-oliveDark">Erro ao carregar posts: ${error.message}</p>`;
        return;
    }

    const activePosts = (posts || []).filter(
        (p) => !p.expires_at || new Date(p.expires_at).getTime() > Date.now()
    );

    if (activePosts.length === 0) {
        listEl.innerHTML = '<p class="text-xs text-inkMuted">Nenhum post ativo no momento.</p>';
        return;
    }

    listEl.innerHTML = activePosts.map((p) => {
        const diasRestantes = p.expires_at
            ? Math.max(1, Math.ceil((new Date(p.expires_at) - new Date()) / (1000 * 60 * 60 * 24)))
            : 90;

        return `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-cardLight/80 border border-borderWarm">
                <div class="space-y-0.5">
                    <span class="text-[11px] font-bold uppercase text-olive">${p.rede_social} • Expira em ${diasRestantes} dias</span>
                    <p class="font-bold text-oliveDark">${p.titulo || p.url_post}</p>
                    <a href="${p.url_post}" target="_blank" rel="noopener noreferrer" class="text-xs text-olive underline break-all">${p.url_post}</a>
                </div>
                <button type="button" onclick="deletePost('${p.id}')" class="cursor-pointer px-3 py-1.5 rounded-xl bg-blush/70 text-oliveDark text-xs font-semibold hover:bg-petal transition self-start sm:self-center">
                    <i class="fa-solid fa-trash mr-1"></i> Excluir
                </button>
            </div>
        `;
    }).join('');
}

// Exclui um post pelo ID e atualiza tanto a área administrativa quanto a vitrine pública
async function deletePost(postId) {
    if (!supabaseClient) return;
    await supabaseClient.from('posts').delete().eq('id', postId);
    loadAdminPosts();
    loadPublicPosts();
}

// Converte URLs comuns de LinkedIn, Instagram ou Facebook em URL de incorporação (`iframe`), quando possível
function buildSocialEmbedUrl(rede, rawUrl) {
    try {
        const cleanUrl = rawUrl.split('?')[0].replace(/\/+$/, '');

        if (rede === 'linkedin') {
            if (cleanUrl.includes('/embed/feed/update/')) return rawUrl;
            const urnMatch = rawUrl.match(/urn:li:(activity|ugcPost|share):\d+/i);
            if (urnMatch) {
                return `https://www.linkedin.com/embed/feed/update/${urnMatch[0]}`;
            }
            const activityIdMatch = cleanUrl.match(/activity-(\d+)/i) || cleanUrl.match(/(\d{15,25})/);
            if (activityIdMatch) {
                return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityIdMatch[1]}`;
            }
        }

        if (rede === 'instagram') {
            const igMatch = cleanUrl.match(/instagram\.com\/(p|reel|tv)\/([^/]+)/i);
            if (igMatch) {
                return `https://www.instagram.com/${igMatch[1]}/${igMatch[2]}/embed`;
            }
        }

        if (rede === 'facebook') {
            return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(rawUrl)}&show_text=true&width=500`;
        }
    } catch (e) {
        console.warn('Não foi possível converter URL para embed:', e);
    }
    return null;
}

// Renderiza na página pública de conteúdos os posts ativos (ainda dentro do prazo de 90 dias)
async function loadPublicPosts() {
    const container = document.getElementById('blog-posts-container');
    if (!container || !supabaseClient) return;

    const { data: posts, error } = await supabaseClient
        .from('posts')
        .select('id, clinica_id, rede_social, titulo, url_post, created_at, expires_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar posts públicos:', error);
        return;
    }

    const activePosts = (posts || []).filter(
        (p) => !p.expires_at || new Date(p.expires_at).getTime() > Date.now()
    );

    if (activePosts.length === 0) {
        container.innerHTML = '';
        return;
    }

    const heights = {
        linkedin: 'h-[540px]',
        instagram: 'h-[580px]',
        facebook: 'h-[520px]'
    };

    const icons = {
        instagram: 'fa-brands fa-instagram',
        linkedin: 'fa-brands fa-linkedin',
        facebook: 'fa-brands fa-facebook'
    };

    container.innerHTML = activePosts.map((p) => {
        const embedUrl = typeof buildSocialEmbedUrl === 'function'
            ? buildSocialEmbedUrl(p.rede_social, p.url_post)
            : null;

        if (embedUrl) {
            return `
                <article class="break-inside-avoid bg-cardLight/85 rounded-3xl border border-borderWarm shadow-card-soft overflow-hidden">
                    <div class="px-5 py-3 flex items-center justify-between gap-2 border-b border-borderWarm/60 bg-paper/50">
                        <span class="text-xs font-bold uppercase text-olive">
                            <i class="${icons[p.rede_social] || 'fa-solid fa-share-nodes'} mr-1"></i> ${p.rede_social}
                        </span>
                        <a href="${p.url_post}" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-olive hover:text-oliveDark inline-flex items-center gap-1">
                            <span>Abrir original</span>
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    </div>
                    ${p.titulo ? `<p class="px-5 pt-3 font-bold text-oliveDark text-xs sm:text-sm">${p.titulo}</p>` : ''}
                    <iframe
                        src="${embedUrl}"
                        class="w-full ${heights[p.rede_social] || 'h-[540px]'} border-0 bg-white"
                        loading="lazy"
                        allowfullscreen
                        title="${p.titulo || 'Publicação incorporada'}">
                    </iframe>
                </article>
            `;
        }

        return `
            <article class="break-inside-avoid p-5 rounded-3xl bg-cardLight/85 border border-borderWarm shadow-card-soft space-y-2">
                <div class="flex items-center justify-between text-xs text-olive font-bold uppercase">
                    <span><i class="${icons[p.rede_social] || 'fa-solid fa-share-nodes'} mr-1"></i> ${p.rede_social}</span>
                    <span>${new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <p class="font-bold text-oliveDark text-sm">${p.titulo || 'Publicação compartilhada'}</p>
                <a href="${p.url_post}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-semibold text-olive hover:text-oliveDark underline break-all">
                    <span>Acessar postagem</span>
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            </article>
        `;
    }).join('');
}


/* ==========================================================================
   8. MÓDULO DE AGENDA E CONTROLE DE SESSÕES / REPOSIÇÕES
   ========================================================================== */

// Cache em memória do status anterior de cada agendamento para evitar descontos ou estornos duplicados
let agendaStatusCache = {};

// Carrega clientes, terapeutas e horários agendados (com filtro por modalidade)
async function loadAgendaData() {
    if (!supabaseClient || !currentUserProfile?.clinica_id) return;
    const cid = currentUserProfile.clinica_id;

    const [{ data: clientes }, { data: terapeutas }] = await Promise.all([
        supabaseClient
            .from('clients')
            .select('id, nome, sessoes_restantes, creditos_reposicao')
            .eq('clinica_id', cid)
            .order('nome'),
        supabaseClient
            .from('therapists')
            .select('id, nome')
            .eq('clinica_id', cid)
            .order('nome')
    ]);

    const selCli = document.getElementById('ag-cliente-id');
    if (selCli) {
        selCli.innerHTML = '<option value="">Selecione um cliente...</option>' +
            (clientes || []).map((c) => {
                const rep = Number(c.creditos_reposicao ?? 0);
                const repLabel = rep > 0 ? ` • ${rep} reposição` : '';
                return `<option value="${c.id}">${c.nome} (${c.sessoes_restantes ?? 0} sessões${repLabel})</option>`;
            }).join('');
    }

    const selTer = document.getElementById('ag-terapeuta-id');
    if (selTer) {
        selTer.innerHTML = '<option value="">Selecionar terapeuta...</option>' +
            (terapeutas || []).map((t) => `<option value="${t.id}">${t.nome}</option>`).join('');
    }

    let query = supabaseClient
        .from('appointments')
        .select('*, clients(id, nome, sessoes_restantes, creditos_reposicao), therapists(nome)')
        .eq('clinica_id', cid)
        .order('data_hora', { ascending: true });

    const filtroMod = document.getElementById('ag-filtro-modalidade')?.value;
    if (filtroMod && filtroMod !== 'todas') {
        query = query.eq('modalidade', filtroMod);
    }

    const { data: items, error } = await query;
    const listaEl = document.getElementById('lista-agenda');
    if (!listaEl) return;

    if (error) {
        listaEl.innerHTML = `<p class="text-xs text-oliveDark">Erro ao carregar agenda: ${error.message}</p>`;
        return;
    }

    if (!items || items.length === 0) {
        listaEl.innerHTML = '<p class="text-xs text-inkMuted">Nenhum horário agendado para este filtro.</p>';
        return;
    }

    agendaStatusCache = {};
    items.forEach((item) => {
        agendaStatusCache[item.id] = {
            status: item.status,
            clientId: item.client_id
        };
    });

    listaEl.innerHTML = items.map((item) => {
        const dt = new Date(item.data_hora).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
        const sessoes = item.clients?.sessoes_restantes ?? 0;
        const reposicoes = item.clients?.creditos_reposicao ?? 0;

        return `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-cardLight/80 border border-borderWarm">
                <div>
                    <span class="text-[11px] font-bold uppercase text-olive">${item.modalidade} • ${item.status}</span>
                    <p class="font-bold text-oliveDark">${dt} — ${item.clients?.nome || 'Cliente'}</p>
                    <p class="text-xs text-inkMuted">
                        Terapeuta: ${item.therapists?.nome || 'A definir'} • Saldo atual: ${sessoes} sessões / ${reposicoes} reposições
                        ${item.observacoes ? ' • ' + item.observacoes : ''}
                    </p>
                </div>
                <div class="flex items-center gap-2 self-start sm:self-center">
                    <select onchange="updateAppointmentStatus('${item.id}', '${item.client_id || ''}', this.value)" class="px-2.5 py-1.5 rounded-xl bg-paper border border-borderWarm text-xs font-semibold text-oliveDark">
                        <option value="agendado" ${item.status === 'agendado' ? 'selected' : ''}>Agendado</option>
                        <option value="realizado" ${item.status === 'realizado' ? 'selected' : ''}>Realizado</option>
                        <option value="falta_sem_aviso" ${item.status === 'falta_sem_aviso' ? 'selected' : ''}>Falta sem aviso</option>
                        <option value="remarcado" ${item.status === 'remarcado' ? 'selected' : ''}>Remarcado</option>
                    </select>
                    <button type="button" onclick="deleteAppointment('${item.id}')" class="cursor-pointer px-3 py-1.5 rounded-xl bg-blush/70 text-oliveDark text-xs font-semibold hover:bg-petal">
                        Excluir
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Calcula estorno/desconto em `sessoes_restantes` e `creditos_reposicao` conforme transição de status
async function adjustClientSessionBalance(clientId, oldStatus, newStatus) {
    if (!clientId || oldStatus === newStatus) return;

    const { data: client, error } = await supabaseClient
        .from('clients')
        .select('id, sessoes_restantes, creditos_reposicao')
        .eq('id', clientId)
        .single();

    if (error || !client) {
        console.error('Erro ao buscar cliente para ajustar saldo:', error);
        alert('Erro ao buscar saldo do cliente: ' + (error?.message || 'Cliente não encontrado'));
        return;
    }

    let sessoes = Number(client.sessoes_restantes ?? 0);
    let reposicoes = Number(client.creditos_reposicao ?? 0);

    // 1. Devolve 1 sessão caso o status anterior já tenha consumido saldo
    if (oldStatus === 'realizado' || oldStatus === 'falta_sem_aviso') {
        sessoes += 1;
    }

    // 2. Desconta 1 sessão ou crédito de reposição conforme o novo status
    if (newStatus === 'realizado') {
        if (sessoes > 0) {
            sessoes -= 1;
        } else if (reposicoes > 0) {
            reposicoes -= 1;
        } else {
            sessoes = 0;
        }
    } else if (newStatus === 'falta_sem_aviso') {
        if (reposicoes > 0) {
            reposicoes -= 1;
        } else if (sessoes > 0) {
            sessoes -= 1;
        } else {
            sessoes = 0;
        }
    }

    const { data: updatedClient, error: errUpdate } = await supabaseClient
        .from('clients')
        .update({
            sessoes_restantes: sessoes,
            creditos_reposicao: reposicoes
        })
        .eq('id', clientId)
        .select('id, sessoes_restantes, creditos_reposicao');

    if (errUpdate) {
        console.error('Erro ao atualizar saldo do cliente:', errUpdate);
        alert('Erro ao atualizar saldo de sessões: ' + errUpdate.message);
        return;
    }

    if (!updatedClient || updatedClient.length === 0) {
        alert('O status foi salvo, mas a tabela clients bloqueou o UPDATE do saldo (verifique a política RLS de UPDATE em clients).');
    }
}

// Salva um novo agendamento na tabela `appointments` e aplica baixa inicial se já nascer realizado/falta
async function handleSaveAppointment(event) {
    event.preventDefault();
    if (!supabaseClient || !currentUserProfile?.clinica_id) return;

    const feedback = document.getElementById('ag-feedback');
    const inicioRaw = document.getElementById('ag-inicio').value;
    const inicioIso = new Date(inicioRaw).toISOString();
    const clientId = document.getElementById('ag-cliente-id').value;
    const status = document.getElementById('ag-status').value;

    const { error } = await supabaseClient.from('appointments').insert({
        clinica_id: currentUserProfile.clinica_id,
        client_id: clientId,
        therapist_id: document.getElementById('ag-terapeuta-id').value || null,
        modalidade: document.getElementById('ag-modalidade').value,
        data_hora: inicioIso,
        duracao_minutos: 60,
        status,
        observacoes: document.getElementById('ag-obs').value.trim() || null
    });

    if (error) {
        if (feedback) {
            feedback.textContent = 'Erro ao agendar: ' + error.message;
            feedback.className = 'p-3 rounded-xl bg-blush/80 border border-petal text-oliveDark text-xs font-medium';
            feedback.classList.remove('hidden');
        }
        return;
    }

    if (status === 'realizado' || status === 'falta_sem_aviso') {
        await adjustClientSessionBalance(clientId, 'agendado', status);
    }

    document.getElementById('form-cad-agenda').reset();
    if (feedback) {
        feedback.textContent = 'Horário agendado com sucesso!';
        feedback.className = 'p-3 rounded-xl bg-olive/15 border border-olive/30 text-oliveDark text-xs font-medium';
        feedback.classList.remove('hidden');
    }
    await loadAgendaData();
}

// Atualiza o status de um agendamento existente e sincroniza o saldo de sessões do cliente
async function updateAppointmentStatus(id, clientId, newStatus) {
    if (!supabaseClient) return;
    const prevStatus = agendaStatusCache[id]?.status || 'agendado';

    const { data: updated, error } = await supabaseClient
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id)
        .select('id, status, client_id');

    if (error) {
        console.error('Erro ao atualizar status do agendamento:', error);
        alert('Erro ao alterar status: ' + error.message);
        await loadAgendaData();
        return;
    }

    if (!updated || updated.length === 0) {
        alert('Não foi possível salvar a alteração de status no banco.');
        await loadAgendaData();
        return;
    }

    const effectiveClientId = clientId || updated[0].client_id;

    agendaStatusCache[id] = {
        status: newStatus,
        clientId: effectiveClientId
    };

    await adjustClientSessionBalance(effectiveClientId, prevStatus, newStatus);
    await loadAgendaData();
}

// Exclui um agendamento da tabela `appointments` e recarrega a lista
async function deleteAppointment(id) {
    if (!supabaseClient || !id) return;

    const { error } = await supabaseClient
        .from('appointments')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir agendamento:', error);
        alert('Erro ao excluir agendamento: ' + error.message);
        return;
    }

    await loadAgendaData();
}
