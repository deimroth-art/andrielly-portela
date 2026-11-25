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
async function submitContactForm(event) {
    event.preventDefault();
    const btn = document.getElementById('contact-submit-btn');
    const feedback = document.getElementById('contact-feedback');
    const form = document.getElementById('contact-form');

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value.trim();

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

// --- 4. INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    renderBlogPosts();
});