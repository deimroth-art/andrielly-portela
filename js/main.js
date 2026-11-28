/* ==========================================================================
   SCRIPTS DE NAVEGAÇÃO, RENDERIZAÇÃO DE POSTS E FORMULÁRIO DE CONTATO
   ========================================================================== */

// --- 1. NAVEGAÇÃO ENTRE PÁGINAS ---
function switchPage(pageId) {
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(sec => sec.classList.add('hidden'));

    const target = document.getElementById('page-' + pageId);
    if (target) {
        target.classList.remove('hidden');
    }
   if (pageId === 'blog' && typeof loadPublicPosts === 'function') {
        loadPublicPosts();
    }

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



// --- 3. ENVIO DO FORMULÁRIO DE CONTATO POR E-MAIL ---
function formatBrazilPhone(value) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

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




// --- 4. AUTENTICAÇÃO E GESTÃO DE USUÁRIOS (SUPABASE) ---
const SUPABASE_URL = 'https://idwtcmdpnolkcnwfrmqp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WiIwRGkoNfXJfKOHfSTfwg_kPwbkJLW';
const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    refreshAuthState();
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function handleModalBackdropClick(event) {
    if (event.target.id === 'login-modal') {
        closeLoginModal();
    }
}

function toggleAuthView(view) {
    ['login', 'recovery', 'account'].forEach((name) => {
        const el = document.getElementById(`auth-view-${name}`);
        if (el) el.classList.toggle('hidden', name !== view);
    });
}







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

    // Busca os dados e permissões do perfil logado na tabela profiles
    const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('nome, tipo_perfil, is_adm, is_master, clinica_id')
        .eq('id', session.user.id)
        .single();

    console.log('Perfil carregado:', profile, 'Erro:', profileError);

    currentUserProfile = profile || null;

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




function handleAccessPanelClick() {
    if (!currentUserProfile) return;
    openSystemPanel();
}

function setPublicChromeVisible(isVisible) {
    document.querySelectorAll('.public-site-chrome').forEach((el) => {
        el.classList.toggle('hidden', !isVisible);
    });

    const watermark = document.getElementById('fixed-bg-watermark');
    if (watermark) {
        watermark.classList.toggle('hidden', !isVisible);
    }
}

function openSystemPanel() {
    setPublicChromeVisible(false);

    document.querySelectorAll('.page-section').forEach((sec) => {
        sec.classList.add('hidden');
    });

    const systemSection = document.getElementById('app-system-section');
    if (systemSection) {
        systemSection.classList.remove('hidden');
    }

    if (typeof switchSystemTab === 'function') {
        switchSystemTab('dashboard');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function enterSystemDashboard(loadedProfile = null) {
    if (loadedProfile) currentUserProfile = loadedProfile;
    closeLoginModal();
    openSystemPanel();
}




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

    // Chama a Edge Function protegida que valida se quem chamou é 'master'
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







async function handleSupabaseLogout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    await refreshAuthState();
}


// --- 4. INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    refreshAuthState();
    if (typeof loadPublicPosts === 'function') {
        loadPublicPosts();
    }
});
// --- 5. DASHBOARD INTERNO, PERMISSÕES E POSTS (90 DIAS) ---
let currentUserProfile = null;

function enterSystemDashboard(loadedProfile = null) {
    if (loadedProfile) currentUserProfile = loadedProfile;
    closeLoginModal();
    setPublicChromeVisible(false);

    ['page-curriculo', 'page-blog', 'page-contato'].forEach((id) => {
        document.getElementById(id)?.classList.add('hidden');
    });

    document.getElementById('app-system-section')?.classList.remove('hidden');
    renderDashboardForRole();
    switchSystemTab('dashboard');
}

function exitSystemToPublicSite() {
    document.getElementById('app-system-section')?.classList.add('hidden');
    if (typeof switchPage === 'function') {
        switchPage('curriculo');
    } else {
        document.getElementById('page-curriculo')?.classList.remove('hidden');
    }
}

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
    }else {
        const titles = {
            evolucao: 'Atendimento & Evolução Clínica',
            financeiro: 'Controle Financeiro',
            clinicas: 'Gestão de Clínicas Assinantes (SaaS)'
        };
        document.getElementById('placeholder-title').textContent = titles[tabName] || 'Módulo';
        document.getElementById('sys-view-placeholder')?.classList.remove('hidden');
    }
}

// --- 6. MÓDULO DE CADASTROS (CLIENTES, TERAPEUTAS E PLANOS) ---
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

function showCadastroFeedback(elId, msg, isError = false) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = msg;
    el.className = isError
        ? 'p-3 rounded-xl bg-blush/80 border border-petal text-oliveDark text-xs font-medium'
        : 'p-3 rounded-xl bg-olive/15 border border-olive/30 text-oliveDark text-xs font-medium';
    el.classList.remove('hidden');
}

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
    // 3. Clientes
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
            : clientes.map((c) => `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-cardLight/80 border border-borderWarm">
                    <div>
                        <p class="font-bold text-oliveDark">${c.nome}</p>
                        <p class="text-xs text-inkMuted">${c.email} ${c.telefone ? '• ' + c.telefone : ''}</p>
                        <p class="text-xs text-olive font-medium mt-0.5">
                            Plano: ${c.plans?.nome || 'Avulso'} • Terapeuta: ${c.therapists?.nome || 'Não definido'} • Sessões: ${c.sessoes_restantes}
                        </p>
                    </div>
                    <button type="button" onclick="deleteCadastroItem('clients', '${c.id}')" class="cursor-pointer px-3 py-1.5 rounded-xl bg-blush/70 text-oliveDark text-xs font-semibold hover:bg-petal self-start sm:self-center">
                        Excluir
                    </button>
                </div>
            `).join('');
    }
}

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

async function deleteCadastroItem(table, id) {
    if (!supabaseClient) return;
    await supabaseClient.from(table).delete().eq('id', id);
    loadCadastrosData();
}





async function renderDashboardForRole() {
    if (!currentUserProfile || !supabaseClient) return;

    const isSuperAdm = currentUserProfile.tipo_perfil === 'super_adm';
    const isAdm = currentUserProfile.is_adm === true || isSuperAdm;
    const isTerapeuta = currentUserProfile.tipo_perfil === 'terapeuta';
    const isCliente = currentUserProfile.tipo_perfil === 'cliente';

    document.getElementById('sys-welcome-title').textContent = `Olá, ${currentUserProfile.nome}`;
    document.getElementById('sys-role-badge').textContent = isSuperAdm
        ? 'Super ADM / Master'
        : isAdm
        ? 'Terapeuta ADM'
        : isTerapeuta
        ? 'Terapeuta'
        : 'Portal do Cliente';

    if (currentUserProfile.clinica_id) {
        const { data: clinica } = await supabaseClient
            .from('clinicas')
            .select('nome, logo_url')
            .eq('id', currentUserProfile.clinica_id)
            .single();

        if (clinica) {
            document.getElementById('sys-clinic-name').textContent = clinica.nome;
            if (clinica.logo_url) {
                document.getElementById('dashboard-bg-logo').src = clinica.logo_url;
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











async function handleCreatePost(event) {
    event.preventDefault();
    if (!supabaseClient || !currentUserProfile?.clinica_id) return;

    const rede = document.getElementById('post-network').value;
    const titulo = document.getElementById('post-title').value.trim();
    const url = document.getElementById('post-url').value.trim();
   
   if (url.includes('lnkd.in/')) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-plus mr-1"></i> Publicar na Vitrine (90 dias)';
    feedback.textContent = 'Este é um link encurtado (lnkd.in). Abra-o no navegador e copie o endereço completo (linkedin.com/posts/...) da barra superior para que a publicação apareça incorporada na página.';
    feedback.className = 'p-3 rounded-xl bg-blush/80 border border-petal text-oliveDark text-xs font-medium';
    feedback.classList.remove('hidden');
    return;
}
    
    const btn = document.getElementById('post-submit-btn');
    const feedback = document.getElementById('post-feedback');

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











async function deletePost(postId) {
    if (!supabaseClient) return;
    await supabaseClient.from('posts').delete().eq('id', postId);
    loadAdminPosts();
    loadPublicPosts();
}

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

// --- 7. MÓDULO DE AGENDA DE HORÁRIOS ---
let agendaStatusCache = {};

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
                const rep = Number(c.creditos_reposicao || 0);
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
                    <select onchange="updateAppointmentStatus('${item.id}', '${item.client_id}', this.value)" class="px-2.5 py-1.5 rounded-xl bg-paper border border-borderWarm text-xs font-semibold text-oliveDark">
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

async function adjustClientSessionBalance(clientId, oldStatus, newStatus) {
    if (!clientId) {
        console.warn('Agendamento sem client_id vinculado; saldo não ajustado.');
        return;
    }
    if (oldStatus === newStatus) return;

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

    // 1. Se estava em status que já consumiu saldo, devolve 1 antes de aplicar o novo
    if (oldStatus === 'realizado' || oldStatus === 'falta_sem_aviso') {
        sessoes += 1;
    }

    // 2. Aplica baixa conforme o novo status
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
        console.warn('Nenhuma linha atualizada em clients — verifique política RLS de UPDATE em clients.');
        alert('O status foi salvo, mas a tabela clients bloqueou a atualização do saldo (verifique a política RLS de UPDATE em clients).');
    }
}

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
    loadAgendaData();
}





async function adjustClientSessionBalance(clientId, oldStatus, newStatus) {
    if (!clientId || oldStatus === newStatus) return;

    const { data: client, error } = await supabaseClient
        .from('clients')
        .select('id, sessoes_restantes, creditos_reposicao')
        .eq('id', clientId)
        .single();

    if (error || !client) {
        console.error('Erro ao buscar saldo do cliente:', error);
        return;
    }

    let sessoes = Number(client.sessoes_restantes ?? 0);
    let reposicoes = Number(client.creditos_reposicao ?? 0);

    if (oldStatus === 'concluido' || oldStatus === 'falta') {
        sessoes += 1;
    }

    if (newStatus === 'concluido') {
        if (sessoes > 0) {
            sessoes -= 1;
        } else if (reposicoes > 0) {
            reposicoes -= 1;
        } else {
            sessoes = 0;
        }
    } else if (newStatus === 'falta') {
        if (reposicoes > 0) {
            reposicoes -= 1;
        } else if (sessoes > 0) {
            sessoes -= 1;
        } else {
            sessoes = 0;
        }
    }

    const { error: errUpdate } = await supabaseClient
        .from('clients')
        .update({
            sessoes_restantes: sessoes,
            creditos_reposicao: reposicoes
        })
        .eq('id', clientId);

    if (errUpdate) {
        console.error('Erro ao atualizar sessões do cliente:', errUpdate);
        alert('Erro ao atualizar saldo de sessões: ' + errUpdate.message);
    }
}

async function updateAppointmentStatus(id, clientId, newStatus) {
    if (!supabaseClient) return;
    const prevStatus = agendaStatusCache[id]?.status || 'agendado';

    const { data: updated, error } = await supabaseClient
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id)
        .select('id, status');

    if (error) {
        console.error('Erro ao atualizar status do agendamento:', error);
        alert('Erro ao alterar status: ' + error.message);
        await loadAgendaData();
        return;
    }

    if (!updated || updated.length === 0) {
        console.warn('Nenhuma linha atualizada em appointments (verifique RLS de UPDATE).');
        alert('Não foi possível salvar a alteração de status no banco.');
        await loadAgendaData();
        return;
    }

    agendaStatusCache[id] = {
        status: newStatus,
        clientId
    };

    await adjustClientSessionBalance(clientId, prevStatus, newStatus);
    await loadAgendaData();
}


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

    if (status === 'concluido' || status === 'falta') {
        await adjustClientSessionBalance(clientId, 'agendado', status);
    }

    document.getElementById('form-cad-agenda').reset();
    if (feedback) {
        feedback.textContent = 'Horário agendado com sucesso!';
        feedback.className = 'p-3 rounded-xl bg-olive/15 border border-olive/30 text-oliveDark text-xs font-medium';
        feedback.classList.remove('hidden');
    }
    loadAgendaData();
}
