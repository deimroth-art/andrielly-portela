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

// --- 2. RENDERIZAÇÃO DOS POSTS DO ARQUIVO js/posts.js ---
function renderBlogPosts() {
    const container = document.getElementById('blog-posts-container');
    if (!container) return;

    const postsList = typeof LINKEDIN_EMBEDS !== 'undefined' ? LINKEDIN_EMBEDS : [];

    if (postsList.length === 0) {
        container.className = 'w-full';
        container.innerHTML = `
            <div class="bg-cardLight/60 backdrop-blur-md rounded-3xl border border-borderWarm/80 p-8 text-center text-sm text-inkMuted">
                Nenhuma publicação incorporada no momento.
            </div>
        `;
        return;
    }

    if (postsList.length === 1) {
        container.className = 'flex justify-center';
    } else {
        container.className = 'columns-1 lg:columns-2 gap-6 space-y-6 max-w-[1110px] mx-auto';
    }

    container.innerHTML = postsList.map((post, index) => `
        <article class="break-inside-avoid max-w-[540px] w-full mx-auto bg-cardLight/45 backdrop-blur-[2px] rounded-3xl border border-borderWarm/80 p-2.5 sm:p-3 shadow-card-soft overflow-hidden">
            <div class="w-full overflow-hidden rounded-2xl bg-white">
                <iframe
                    src="${post.embedUrl}"
                    height="${post.height || 750}"
                    width="100%"
                    frameborder="0"
                    allowfullscreen=""
                    loading="lazy"
                    title="Publicação incorporada do LinkedIn ${index + 1}"
                    class="w-full max-w-[504px] block mx-auto">
                </iframe>
            </div>
        </article>
    `).join('');
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
        if (navLabel) navLabel.textContent = 'Área Restrita';
        toggleAuthView('login');
        return;
    }

    // Busca os dados e permissões do perfil logado na tabela profiles
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('nome, tipo_perfil, is_adm, is_master, clinica_id')
        .eq('id', session.user.id)
        .single();

    const isMaster = profile?.is_master === true;
    const isAdm = profile?.is_adm === true || profile?.tipo_perfil === 'super_adm';

    let badgeTexto = 'Cliente';
    if (profile?.tipo_perfil === 'super_adm') badgeTexto = 'Super ADM / Master';
    else if (isAdm) badgeTexto = isMaster ? 'ADM Master' : 'Terapeuta ADM';
    else if (profile?.tipo_perfil === 'terapeuta') badgeTexto = 'Terapeuta';

    if (navLabel) navLabel.textContent = isAdm ? 'Painel ADM' : 'Minha Conta';
    document.getElementById('logged-user-email').textContent = profile?.nome
        ? `${profile.nome} (${session.user.email})`
        : session.user.email;
    document.getElementById('logged-user-role').textContent = badgeTexto;

    const masterPanel = document.getElementById('master-reset-panel');
    if (masterPanel) masterPanel.classList.toggle('hidden', !isMaster);

    toggleAuthView('account');
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

document.addEventListener('DOMContentLoaded', refreshAuthState);

// --- 4. INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    renderBlogPosts();
});
