const LAYOUTS = [
  { id: 'full-image', name: 'Фото', icon: 'image' },
  { id: 'text-image', name: 'Текст+Фото', icon: 'layout' },
  { id: 'image-text', name: 'Фото+Текст', icon: 'layout' },
  { id: 'full-text', name: 'Текст', icon: 'text' },
  { id: 'two-column', name: '2 колонки', icon: 'grid' },
  { id: 'image-grid', name: 'Сетка', icon: 'grid' }
];

const COVER_COLORS = ['#1a1a2e', '#2c1810', '#1a3a2a', '#3d1a1a', '#1a2a3d', '#2a1a3d', '#3d3d1a', '#0d0d0d'];

let _uploadTarget = null;

const appData = {
  magazines: [
    {
      id: 'm1',
      name: 'Urban Stories',
      theme: 'modern',
      cover: {
        title: 'URBAN STORIES',
        subtitle: 'Городские истории',
        bgColor: '#1a1a2e',
        bgImage: 'images/5a765e34787361.58c1ed20c4e5b.jpg',
        date: 'Июнь 2026'
      },
      pages: [
        { id: 'p1', layout: 'text-image', title: 'Новый ритм города', content: 'Мегаполисы меняются каждый день. Улицы дышат историей, а небоскрёбы устремляются в будущее. Мы исследуем, как живут современные города и какие тренды определяют их развитие.\n\nОткрытые пространства, умные технологии и устойчивое развитие — вот три кита, на которых строится город будущего. Архитекторы и урбанисты всего мира ищут баланс между сохранением наследия и инновациями.', image: 'images/2e039588f51d6c9bcae4e61b5fa35eb2.jpg' },
        { id: 'p2', layout: 'full-image', title: '', content: '', image: 'images/8597aea01430d8b324603eab7f15967a.jpg' },
        { id: 'p3', layout: 'two-column', title: 'Архитектура света', content: 'Свет меняет восприятие пространства. Современные архитекторы используют естественное и искусственное освещение как инструмент для создания настроения и зонирования.\n\nНочью город превращается в световой оркестр. Неоновые вывески, подсветка зданий, уличные фонари — всё это создаёт неповторимую атмосферу.', image: 'images/8a95098caf3879c8b60f0058ca7657b6.jpg' },
        { id: 'p4', layout: 'full-text', title: 'Город и природа', content: 'Парки, скверы и набережные становятся новыми центрами притяжения. Зелёные зоны не только улучшают экологию, но и формируют новый образ жизни горожан.\n\nВертикальное озеленение, сады на крышах, эко-тропы — тренды, которые меняют облик современных мегаполисов.', image: '' },
        { id: 'p5', layout: 'image-grid', title: '', content: '', image: '', images: [
          'images/17fa9b4faa41d2f894cc40cbd565d8b7.jpg',
          'images/6286a8e6-f39b-4f6f-bcb7-8bb96467bc03+copy.jpg',
          'images/ab0a3011c27fb581eccc3d041967e57f.jpg',
          'images/gorodskie-ulichnye-portrety-avtor-jens-krauer-45_large.jpg'
        ] }
      ]
    }
  ]
};

let currentMode = 'editor';
let currentPage = 'projects';
let history = ['projects'];
let currentMagazine = null;
let currentMagIdx = 0;
let editorTab = 'cover';
let previewPage = 0;
let exportFormat = 'print';
let exportDone = false;

/* ─── Utility ─── */
function getMagazine() { return appData.magazines[currentMagIdx]; }

function genId() {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function rgbFromHex(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r + ',' + g + ',' + b;
}

/* ─── Image Upload ─── */
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/*';
  inp.id = 'fileInput';
  inp.style.display = 'none';
  inp.addEventListener('change', handleFileSelected);
  document.body.appendChild(inp);
});

function handleFileSelected(e) {
  const file = e.target.files[0];
  if (!file || !_uploadTarget) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const [type, idx] = _uploadTarget.split(':');
    if (type === 'cover') {
      currentMagazine.cover.bgImage = ev.target.result;
    } else if (type === 'page') {
      const page = currentMagazine.pages[parseInt(idx)];
      if (page) page.image = ev.target.result;
    }
    _uploadTarget = null;
    if (editorTab === 'cover' || currentPage === 'editor') renderEditor();
    else if (currentPage === 'preview') renderPreview();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function triggerUpload(target) {
  _uploadTarget = target;
  document.getElementById('fileInput').click();
}

function hasImage(src) {
  return src && (src.startsWith('data:') || src.startsWith('images/'));
}

function imgUrl(src) {
  if (!src) return '';
  if (src.startsWith('data:')) return src;
  if (src.startsWith('images/')) return src;
  return src;
}

/* ─── Theme ─── */
function toggleTheme() {
  const html = document.documentElement;
  const theme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', theme);
  localStorage.setItem('qbik-theme', theme);
}

function loadTheme() {
  const saved = localStorage.getItem('qbik-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
}

/* ─── Navigation ─── */
function openApp() {
  document.getElementById('landing').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  localStorage.setItem('qbik-appOpen', 'true');
  currentMagazine = getMagazine();
  showPage('projects');
}

function closeApp() {
  document.getElementById('landing').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  history = ['projects'];
  localStorage.setItem('qbik-appOpen', 'false');
}

function showPage(pageName, btnElement) {
  history.push(pageName);
  currentPage = pageName;
  updateHeader(pageName);
  renderContent(pageName);
  if (btnElement) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
  }
  document.getElementById('content').scrollTop = 0;
}

function updateHeader(pageName) {
  const titles = {
    projects: 'Мои журналы',
    editor: 'Редактор',
    preview: 'Превью',
    export: 'Экспорт'
  };
  document.getElementById('appTitle').textContent = titles[pageName] || pageName;
}

function goBack() {
  if (history.length > 1) {
    history.pop();
    const prev = history[history.length - 1];
    currentPage = prev;
    updateHeader(prev);
    renderContent(prev);
  }
}

function renderContent(pageName) {
  if (pageName === 'projects') renderProjects();
  else if (pageName === 'editor') renderEditor();
  else if (pageName === 'preview') renderPreview();
  else if (pageName === 'export') renderExport();
}

/* ─── PROJECTS ─── */
function renderProjects() {
  const content = document.getElementById('content');
  let html = '<div class="page-content">';

  appData.magazines.forEach((m, i) => {
    const rgb = rgbFromHex(m.cover.bgColor);
    html += `
      <div class="project-card" onclick="openMagazine(${i})">
        <div class="project-cover" style="background:${m.cover.bgImage ? `url(${imgUrl(m.cover.bgImage)}) center/cover` : m.cover.bgColor}">
          <div class="project-cover-overlay"></div>
          <div class="project-cover-title">${m.cover.title}</div>
          <div class="project-cover-sub">${m.cover.date}</div>
        </div>
        <div class="project-info">
          <div>
            <div class="project-name">${m.name}</div>
            <div class="project-meta">${m.pages.length} страниц</div>
          </div>
          <svg class="icon" style="width:20px;height:20px;color:var(--accent)"><use href="#icon-arrow"/></svg>
        </div>
      </div>
    `;
  });

  html += '</div>';
  content.innerHTML = html;
}

function openMagazine(idx) {
  currentMagIdx = idx;
  currentMagazine = appData.magazines[idx];
  previewPage = 0;
  exportDone = false;
  editorTab = 'cover';
  showPage('editor', document.querySelector('.nav-item:nth-child(2)'));
}

/* ─── EDITOR ─── */
function renderEditor() {
  const mag = currentMagazine;
  if (!mag) { renderProjects(); return; }
  const content = document.getElementById('content');

  let html = '<div class="page-content">';
  html += `
    <div class="editor-tabs">
      <button class="editor-tab ${editorTab === 'cover' ? 'active' : ''}" onclick="switchEditorTab('cover')">Обложка</button>
      <button class="editor-tab ${editorTab === 'pages' ? 'active' : ''}" onclick="switchEditorTab('pages')">Страницы</button>
    </div>
    <div class="editor-panel">
  `;

  if (editorTab === 'cover') {
    html += renderCoverEditor(mag);
  } else {
    html += renderPagesEditor(mag);
  }

  html += '</div></div>';
  content.innerHTML = html;
}

function switchEditorTab(tab) {
  editorTab = tab;
  renderEditor();
}

/* ─── Cover Editor ─── */
function renderCoverEditor(mag) {
  const coverBg = mag.cover.bgImage
    ? `url(${imgUrl(mag.cover.bgImage)}) center/cover`
    : mag.cover.bgColor;
  return `
    <div class="form-group">
      <label class="form-label">Название журнала</label>
      <input class="form-input" value="${mag.cover.title}" oninput="updateCover('title', this.value)" placeholder="URBAN STORIES">
    </div>
    <div class="form-group">
      <label class="form-label">Подзаголовок</label>
      <input class="form-input" value="${mag.cover.subtitle}" oninput="updateCover('subtitle', this.value)" placeholder="Городские истории">
    </div>
    <div class="form-group">
      <label class="form-label">Дата выпуска</label>
      <input class="form-input" value="${mag.cover.date}" oninput="updateCover('date', this.value)" placeholder="Июнь 2026">
    </div>
    <div class="form-group">
      <label class="form-label">Фон обложки</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
        <div class="color-grid" style="display:inline-flex">
          ${COVER_COLORS.map(c => `
            <div class="color-swatch ${mag.cover.bgColor === c ? 'selected' : ''}"
                 style="background:${c}"
                 onclick="updateCoverColor('${c}')"></div>
          `).join('')}
        </div>
      </div>
      <button class="add-page-btn" style="padding:8px;font-size:12px" onclick="triggerUpload('cover')">
        <svg class="icon" style="width:16px;height:16px;vertical-align:middle;margin-right:4px"><use href="#icon-image"/></svg>
        ${mag.cover.bgImage ? 'Заменить фото' : 'Загрузить фото'}
      </button>
      ${mag.cover.bgImage ? `<button class="add-page-btn" style="padding:8px;font-size:12px;margin-top:4px" onclick="removeCoverImage()">Убрать фото</button>` : ''}
    </div>
    <div style="margin-top:16px">
      <div class="form-label">Предпросмотр обложки</div>
      <div style="width:100%;aspect-ratio:210/297;max-height:300px;border-radius:4px;overflow:hidden;margin-top:8px">
        ${renderCoverPreview(mag)}
      </div>
    </div>
  `;
}

function renderCoverPreview(mag) {
  const bgStyle = mag.cover.bgImage
    ? `background:url(${imgUrl(mag.cover.bgImage)}) center/cover`
    : `background:${mag.cover.bgColor}`;
  return `
    <div class="mag-cover" style="${bgStyle};width:100%;height:100%;min-height:250px">
      <div class="mag-cover-header">
        <div class="mag-line"></div>
        <div class="mag-title">${mag.cover.title || 'НАЗВАНИЕ'}</div>
        <div class="mag-subtitle">${mag.cover.subtitle || 'Подзаголовок'}</div>
        <div class="mag-date">${mag.cover.date || 'Дата'}</div>
      </div>
    </div>
  `;
}

function updateCover(field, val) {
  const mag = currentMagazine;
  mag.cover[field] = val;
  if (editorTab === 'cover') renderEditor();
}

function updateCoverColor(color) {
  const mag = currentMagazine;
  mag.cover.bgColor = color;
  mag.cover.bgImage = null;
  if (editorTab === 'cover') renderEditor();
}

function removeCoverImage() {
  currentMagazine.cover.bgImage = null;
  if (editorTab === 'cover') renderEditor();
}

/* ─── Pages Editor ─── */
function renderPagesEditor(mag) {
  let html = '<div class="page-list">';

  mag.pages.forEach((page, i) => {
    html += `
      <div class="page-editor-card">
        <div class="page-editor-header">
          <div class="page-num">${i + 2}</div>
          <div class="page-layout-label">${LAYOUTS.find(l => l.id === page.layout)?.name || page.layout}</div>
          <div class="page-actions">
            ${mag.pages.length > 1 ? `<button class="btn-icon danger" onclick="removePage(${i})"><svg class="icon"><use href="#icon-trash"/></svg></button>` : ''}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Макет</label>
          <div class="layout-grid">
            ${LAYOUTS.map(l => `
              <div class="layout-option ${page.layout === l.id ? 'selected' : ''}" onclick="setPageLayout(${i}, '${l.id}')">${l.name}</div>
            `).join('')}
          </div>
        </div>
        ${page.layout !== 'full-image' && page.layout !== 'image-grid' ? `
          <div class="form-group">
            <label class="form-label">Заголовок</label>
            <input class="form-input" value="${page.title}" oninput="setPageField(${i}, 'title', this.value)" placeholder="Заголовок страницы">
          </div>
          <div class="form-group">
            <label class="form-label">Текст</label>
            <textarea class="form-input" oninput="setPageField(${i}, 'content', this.value)" placeholder="Текст страницы..." rows="3">${page.content}</textarea>
          </div>
        ` : ''}
        ${page.layout !== 'full-text' ? `
          <div class="form-group">
            <label class="form-label">Фото</label>
            ${hasImage(page.image) ? `<div style="width:100%;height:80px;border-radius:6px;overflow:hidden;margin-bottom:6px;background:#2a2a2a;display:flex;align-items:center;justify-content:center">
              <img src="${imgUrl(page.image)}" style="max-width:100%;max-height:100%;object-fit:cover">
            </div>` : ''}
            <button class="add-page-btn" style="padding:8px;font-size:12px" onclick="triggerUpload('page:${i}')">
              <svg class="icon" style="width:16px;height:16px;vertical-align:middle;margin-right:4px"><use href="#icon-image"/></svg>
              ${hasImage(page.image) ? 'Заменить фото' : 'Загрузить фото'}
            </button>
            ${hasImage(page.image) ? `<button class="add-page-btn" style="padding:8px;font-size:12px;margin-top:4px" onclick="removePageImage(${i})">Убрать фото</button>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  });

  html += `
    </div>
    <button class="add-page-btn" onclick="addPage()">
      <svg class="icon" style="width:18px;height:18px;vertical-align:middle;margin-right:6px"><use href="#icon-plus"/></svg>
      Добавить страницу
    </button>
  `;

  return html;
}

function setPageLayout(idx, layoutId) {
  currentMagazine.pages[idx].layout = layoutId;
  if (layoutId === 'full-image' || layoutId === 'image-grid') {
    currentMagazine.pages[idx].title = '';
    currentMagazine.pages[idx].content = '';
  }
  renderEditor();
}

function setPageField(idx, field, val) {
  currentMagazine.pages[idx][field] = val;
}

function addPage() {
  currentMagazine.pages.push({ id: genId(), layout: 'text-image', title: 'Новая страница', content: 'Текст страницы...', image: '' });
  renderEditor();
}

function removePage(idx) {
  if (currentMagazine.pages.length <= 1) return;
  currentMagazine.pages.splice(idx, 1);
  renderEditor();
}

function removePageImage(idx) {
  currentMagazine.pages[idx].image = '';
  renderEditor();
}

/* ─── PREVIEW ─── */
function renderPreview() {
  const mag = currentMagazine;
  if (!mag) { renderProjects(); return; }
  const content = document.getElementById('content');
  const totalPages = mag.pages.length + 1;

  let html = '<div class="page-content">';
  html += `<h3 style="margin-bottom:8px;font-family:-apple-system,sans-serif">${mag.name}</h3>`;

  html += '<div class="preview-container">';

  if (previewPage === 0) {
    html += renderPagePreview('cover', mag);
  } else {
    html += renderPagePreview('content', mag, mag.pages[previewPage - 1]);
  }

  html += `
    <div class="preview-nav">
      <button class="preview-nav-btn" onclick="previewPrev()" ${previewPage === 0 ? 'disabled' : ''}>
        <svg class="icon"><use href="#icon-arrow-left"/></svg>
      </button>
      <span class="preview-page-num">${previewPage + 1} / ${totalPages}</span>
      <button class="preview-nav-btn" onclick="previewNext()" ${previewPage >= totalPages - 1 ? 'disabled' : ''}>
        <svg class="icon"><use href="#icon-arrow"/></svg>
      </button>
    </div>
  `;

  html += '</div></div>';
  content.innerHTML = html;
}

function renderPagePreview(type, mag, page) {
  if (type === 'cover') {
    const bgStyle = mag.cover.bgImage
      ? `background:url(${imgUrl(mag.cover.bgImage)}) center/cover`
      : `background:${mag.cover.bgColor}`;
    return `<div class="preview-page"><div class="mag-cover" style="${bgStyle}">
      <div class="mag-cover-header">
        <div class="mag-line"></div>
        <div class="mag-title">${mag.cover.title || 'НАЗВАНИЕ'}</div>
        <div class="mag-subtitle">${mag.cover.subtitle || ''}</div>
        <div class="mag-date">${mag.cover.date || ''}</div>
      </div>
    </div></div>`;
  }

  if (!page) return '';

  const imgStyles = (src, bg) => hasImage(src)
    ? `background:url(${imgUrl(src)}) center/cover`
    : `background:${bg}`;

  switch (page.layout) {
    case 'full-image': {
      const bg = imgStyles(page.image, '#2c3e50');
      return `<div class="preview-page"><div class="mag-page" style="padding:0;display:flex;align-items:center;justify-content:center;${bg}">
        ${!hasImage(page.image) ? '<div style="color:rgba(255,255,255,0.2);font-size:60px"><svg style="width:80px;height:80px" viewBox="0 0 24 24"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>' : ''}
      </div></div>`;
    }

    case 'text-image':
      return `<div class="preview-page"><div class="mag-page">
        <div class="mag-page-header"><span>FEATURE</span><span>${mag.cover.date || ''}</span></div>
        <div class="mag-title-block"><h2>${page.title || ''}</h2><div class="mag-divider"></div></div>
        <div class="mag-split" style="margin-top:8px;min-height:140px">
          <div class="mag-text-col">${page.content ? page.content.split('\n').map(p => `<p>${p}</p>`).join('') : ''}</div>
          <div class="mag-img-col" style="${imgStyles(page.image, '#bdc3c7')}">
            ${!hasImage(page.image) ? '<div class="mag-img-placeholder" style="font-size:40px;color:rgba(255,255,255,0.3)"><svg style="width:50px;height:50px" viewBox="0 0 24 24"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>' : ''}
          </div>
        </div>
      </div></div>`;

    case 'image-text':
      return `<div class="preview-page"><div class="mag-page">
        <div class="mag-page-header"><span>FEATURE</span><span>${mag.cover.date || ''}</span></div>
        <div class="mag-split" style="min-height:160px">
          <div class="mag-img-col" style="${imgStyles(page.image, '#bdc3c7')}">
            ${!hasImage(page.image) ? '<div class="mag-img-placeholder" style="font-size:40px;color:rgba(255,255,255,0.3)"><svg style="width:50px;height:50px" viewBox="0 0 24 24"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>' : ''}
          </div>
          <div class="mag-text-col">
            <div class="mag-title-block"><h2 style="font-size:16px">${page.title || ''}</h2><div class="mag-divider"></div></div>
            ${page.content ? page.content.split('\n').map(p => `<p style="margin-top:6px">${p}</p>`).join('') : ''}
          </div>
        </div>
      </div></div>`;

    case 'full-text':
      return `<div class="preview-page"><div class="mag-page">
        <div class="mag-page-header"><span>ESSAY</span><span>${mag.cover.date || ''}</span></div>
        <div class="mag-title-block"><h2>${page.title || ''}</h2><div class="mag-divider"></div></div>
        <div class="mag-full-text" style="margin-top:8px">
          ${page.content ? page.content.split('\n').map(p => `<p>${p}</p>`).join('') : ''}
        </div>
      </div></div>`;

    case 'two-column':
      return `<div class="preview-page"><div class="mag-page">
        <div class="mag-page-header"><span>TRENDS</span><span>${mag.cover.date || ''}</span></div>
        <div class="mag-title-block"><h2>${page.title || ''}</h2><div class="mag-divider"></div></div>
        <div class="mag-split" style="margin-top:8px">
          <div class="mag-text-col">${page.content ? page.content.split('\n')[0] || '' : ''}</div>
          <div class="mag-text-col">${page.content ? page.content.split('\n')[1] || page.content.split('\n')[0] || '' : ''}</div>
        </div>
      </div></div>`;

    case 'image-grid':
      return `<div class="preview-page"><div class="mag-page" style="display:flex;flex-direction:column;gap:6px">
        <div class="mag-page-header"><span>GALLERY</span><span>${mag.cover.date || ''}</span></div>
        <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:6px">
          ${(page.images && page.images.length ? page.images : ['#2c3e50','#34495e','#c0392b','#8e44ad']).map(src =>
            hasImage(src)
              ? `<div style="border-radius:4px;overflow:hidden;background-size:cover;background-position:center;background-image:url(${imgUrl(src)})"></div>`
              : `<div style="background:${src};border-radius:4px;display:flex;align-items:center;justify-content:center">
                  <svg style="width:30px;height:30px;color:rgba(255,255,255,0.2)" viewBox="0 0 24 24"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                </div>`
          ).join('')}
        </div>
      </div></div>`;

    default:
      return `<div class="preview-page"><div class="mag-page">${page.title || ''}</div></div>`;
  }
}

function previewNext() {
  const total = currentMagazine.pages.length + 1;
  if (previewPage < total - 1) { previewPage++; renderPreview(); }
}

function previewPrev() {
  if (previewPage > 0) { previewPage--; renderPreview(); }
}

/* ─── EXPORT ─── */
function renderExport() {
  const mag = currentMagazine;
  if (!mag) { renderProjects(); return; }
  const content = document.getElementById('content');
  const totalPages = mag.pages.length + 1;

  let html = '<div class="page-content">';

  html += `
    <div class="export-card">
      <svg class="export-icon"><use href="#icon-download"/></svg>
      <h3>${mag.name}</h3>
      <p>${totalPages} страниц • Готово к печати</p>
    </div>

    <div class="form-label" style="margin-bottom:8px">Формат экспорта</div>
    <div class="export-format-grid">
      <div class="export-format ${exportFormat === 'print' ? 'selected' : ''}" onclick="setExportFormat('print')">
        <svg class="icon"><use href="#icon-book"/></svg>
        <div>PDF для печати</div>
        <span>A4, высокое качество</span>
      </div>
      <div class="export-format ${exportFormat === 'digital' ? 'selected' : ''}" onclick="setExportFormat('digital')">
        <svg class="icon"><use href="#icon-eye"/></svg>
        <div>PDF для экрана</div>
        <span>Меньший размер файла</span>
      </div>
    </div>
  `;

  html += `
    <div id="exportProgress" style="display:none;text-align:center;padding:20px">
      <div style="color:var(--accent);font-size:14px;font-weight:600;margin-bottom:8px;font-family:-apple-system,sans-serif">Генерируем PDF...</div>
      <div style="height:4px;background:var(--bg-light);border-radius:4px;overflow:hidden">
        <div id="progressBar" style="width:0%;height:100%;background:var(--gradient-btn);border-radius:4px;transition:width 0.3s"></div>
      </div>
    </div>
    <div id="exportResult"></div>
  `;

  if (!exportDone) {
    html += `
      <button class="export-btn" onclick="doExport()">
        <svg class="icon" style="width:18px;height:18px;vertical-align:middle;margin-right:6px"><use href="#icon-magic"/></svg>
        Собрать макет
      </button>
    `;
  }

  html += '</div>';
  content.innerHTML = html;
}

function setExportFormat(f) {
  exportFormat = f;
  renderExport();
}

async function doExport() {
  const mag = currentMagazine;
  const totalPages = mag.pages.length + 1;
  const scale = exportFormat === 'print' ? 2.5 : 1.5;
  const pageW = 595; // A4 at 72 DPI in pt = 210mm
  const pageH = 842; // 297mm

  document.getElementById('exportProgress').style.display = 'block';
  document.getElementById('exportResult').innerHTML = '';

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'pt', 'a4');
  const renderBox = document.createElement('div');
  renderBox.style.cssText = 'position:fixed;left:-9999px;top:0;width:595px;background:white;z-index:-1';
  document.body.appendChild(renderBox);

  try {
    for (let idx = 0; idx < totalPages; idx++) {
      const prog = ((idx) / totalPages) * 100;
      document.getElementById('progressBar').style.width = prog + '%';

      let pageHtml;
      if (idx === 0) {
        const bgStyle = mag.cover.bgImage
          ? `background:url(${imgUrl(mag.cover.bgImage)}) center/cover`
          : `background:${mag.cover.bgColor}`;
        pageHtml = `<div class="mag-cover" style="${bgStyle};width:595px;height:842px;position:relative">
          <div style="position:absolute;top:60px;left:0;right:0;padding:20px 36px;background:rgba(0,0,0,0.65)">
            <div style="width:60px;height:2px;background:#D4A843;margin-bottom:12px"></div>
            <div style="font-size:48px;font-weight:700;text-transform:uppercase;letter-spacing:4px;line-height:1.2">${mag.cover.title || 'НАЗВАНИЕ'}</div>
            <div style="font-size:16px;opacity:0.8;letter-spacing:3px;margin-top:6px;font-family:Helvetica,sans-serif">${mag.cover.subtitle || ''}</div>
            <div style="font-size:12px;opacity:0.5;margin-top:10px;font-family:Helvetica,sans-serif;letter-spacing:1px">${mag.cover.date || ''}</div>
          </div>
        </div>`;
      } else {
        const page = mag.pages[idx - 1];
        pageHtml = renderPageHTML(page, mag, idx === totalPages - 1);
      }

      renderBox.innerHTML = pageHtml;
      await sleep(100);

      const canvas = await html2canvas(renderBox, {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 595,
        height: pageH
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      if (idx > 0) doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, 0, pageW, pageH);
      doc.setFillColor(240, 240, 240);
      doc.rect(0, pageH - 24, pageW, 24, 'F');
      doc.setFontSize(8);
      doc.setTextColor(80);
      doc.text('All rights belong to the photographers. Demo version for PDF generation. Axiiom Qbik Magazine', pageW / 2, pageH - 12, { align: 'center' });
    }

    document.getElementById('progressBar').style.width = '100%';
    await sleep(200);

    const filename = (mag.name || 'magazine').replace(/\s+/g, '_') + '.pdf';
    doc.save(filename);

    document.getElementById('exportProgress').style.display = 'none';
    document.getElementById('exportResult').innerHTML = `
      <div class="export-success">
        <svg class="icon" style="width:24px;height:24px;vertical-align:middle;margin-right:6px"><use href="#icon-check"/></svg>
        PDF сохранён: ${filename}
      </div>
      <button class="export-btn" style="background:var(--success)" onclick="resetExport()">
        Создать другой
      </button>
    `;
    exportDone = true;
  } catch (err) {
    document.getElementById('exportProgress').style.display = 'none';
    document.getElementById('exportResult').innerHTML = `
      <div style="color:var(--error);text-align:center;padding:16px;font-family:-apple-system,sans-serif">
        Ошибка генерации PDF: ${err.message}
      </div>
    `;
  }

  document.body.removeChild(renderBox);
}

function renderPageHTML(page, mag, isLast) {
  const imgTag = (src) => hasImage(src)
    ? `<img src="${imgUrl(src)}" style="width:100%;height:100%;object-fit:cover">`
    : '';

  switch (page.layout) {
    case 'full-image': {
      const bg = hasImage(page.image) ? '' : 'background:#2c3e50';
      return `<div style="width:595px;height:842px;${bg}">
        ${hasImage(page.image) ? `          <img src="${imgUrl(page.image)}" style="width:100%;height:100%;object-fit:cover">` : ''}
      </div>`;
    }
    case 'text-image':
      return `<div style="width:595px;height:842px;padding:36px;background:white;color:#1a1a1a;font-family:Georgia,serif">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999;border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px;font-family:Helvetica,sans-serif">
          <span>FEATURE</span><span style="float:right">${mag.cover.date || ''}</span>
        </div>
        <h2 style="font-size:26px;font-weight:700;line-height:1.15;color:#000;text-transform:uppercase;letter-spacing:0.5px">${page.title || ''}</h2>
        <div style="width:40px;height:2px;background:#c0392b;margin:8px 0 12px"></div>
        <div style="display:flex;gap:16px">
          <div style="flex:1;font-size:12px;line-height:1.7;color:#333">${page.content ? page.content.split('\n').map(p => `<p style="margin-bottom:6px">${p}</p>`).join('') : ''}</div>
          <div style="flex:1;border-radius:4px;overflow:hidden;background:#eee;display:flex;align-items:center;justify-content:center;min-height:200px">
            ${imgTag(page.image)}
          </div>
        </div>
      </div>`;
    case 'image-text':
      return `<div style="width:595px;height:842px;padding:36px;background:white;color:#1a1a1a;font-family:Georgia,serif">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999;border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px;font-family:Helvetica,sans-serif">
          <span>FEATURE</span><span style="float:right">${mag.cover.date || ''}</span>
        </div>
        <div style="display:flex;gap:16px;min-height:300px">
          <div style="flex:1;border-radius:4px;overflow:hidden;background:#eee;display:flex;align-items:center;justify-content:center">
            ${imgTag(page.image)}
          </div>
          <div style="flex:1">
            <h2 style="font-size:22px;font-weight:700;line-height:1.15;color:#000;text-transform:uppercase">${page.title || ''}</h2>
            <div style="width:40px;height:2px;background:#c0392b;margin:8px 0 12px"></div>
            <div style="font-size:12px;line-height:1.7;color:#333">${page.content ? page.content.split('\n').map(p => `<p style="margin-bottom:6px">${p}</p>`).join('') : ''}</div>
          </div>
        </div>
      </div>`;
    case 'full-text':
      return `<div style="width:595px;height:842px;padding:36px;background:white;color:#1a1a1a;font-family:Georgia,serif">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999;border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px;font-family:Helvetica,sans-serif">
          <span>ESSAY</span><span style="float:right">${mag.cover.date || ''}</span>
        </div>
        <h2 style="font-size:26px;font-weight:700;line-height:1.15;color:#000;text-transform:uppercase;letter-spacing:0.5px">${page.title || ''}</h2>
        <div style="width:40px;height:2px;background:#c0392b;margin:8px 0 12px"></div>
        <div style="font-size:12px;line-height:1.8;color:#333">${page.content ? page.content.split('\n').map(p => `<p style="margin-bottom:8px">${p}</p>`).join('') : ''}</div>
      </div>`;
    case 'two-column':
      const cols = page.content ? page.content.split('\n') : [];
      return `<div style="width:595px;height:842px;padding:36px;background:white;color:#1a1a1a;font-family:Georgia,serif">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999;border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px;font-family:Helvetica,sans-serif">
          <span>TRENDS</span><span style="float:right">${mag.cover.date || ''}</span>
        </div>
        <h2 style="font-size:26px;font-weight:700;line-height:1.15;color:#000;text-transform:uppercase;letter-spacing:0.5px">${page.title || ''}</h2>
        <div style="width:40px;height:2px;background:#c0392b;margin:8px 0 12px"></div>
        <div style="display:flex;gap:20px">
          <div style="flex:1;font-size:12px;line-height:1.7;color:#333">${cols[0] || ''}</div>
          <div style="flex:1;font-size:12px;line-height:1.7;color:#333">${cols[1] || cols[0] || ''}</div>
        </div>
      </div>`;
    case 'image-grid':
      return `<div style="width:595px;height:842px;padding:36px;background:white;color:#1a1a1a;font-family:Georgia,serif">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999;border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px;font-family:Helvetica,sans-serif">
          <span>GALLERY</span><span style="float:right">${mag.cover.date || ''}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;height:500px">
          ${(page.images && page.images.length ? page.images : ['#2c3e50','#34495e','#c0392b','#8e44ad']).map(src =>
            hasImage(src)
              ? `<div style="background-size:cover;background-position:center;background-image:url(${imgUrl(src)});border-radius:4px"></div>`
              : `<div style="background:${src};border-radius:4px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-size:40px">&#128247;</div>`
          ).join('')}
        </div>
      </div>`;
    default:
      return `<div style="width:595px;height:842px;padding:36px;background:white"><p>${page.title || ''}</p></div>`;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function resetExport() {
  exportDone = false;
  renderExport();
}

/* ─── Init ─── */
document.getElementById('splash').classList.add('hidden');
loadTheme();
