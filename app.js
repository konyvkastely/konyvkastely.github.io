const state = { query: "", category: "Mind" };
const grid = document.querySelector("#book-grid");
const search = document.querySelector("#search");
const clearSearch = document.querySelector("#clear-search");
const filterWrap = document.querySelector("#category-filters");
const visibleCount = document.querySelector("#visible-count");
const emptyState = document.querySelector("#empty-state");
const dialog = document.querySelector("#reader-dialog");
const frame = document.querySelector("#reader-frame");
const readerTitle = document.querySelector("#reader-title");
const archiveReader = document.querySelector("#archive-reader");
const castleReader = document.querySelector("#castle-reader");
const bookPage = document.querySelector("#book-page");
const readerProgress = document.querySelector("#reader-progress");
const readerNote = document.querySelector("#reader-note");
const previousPage = document.querySelector("#previous-page");
const nextPage = document.querySelector("#next-page");
const readerSource = document.querySelector("#reader-source");
let readerPages = [];
let currentPage = 0;
let currentBook = null;
let readerFontSize = Number(localStorage.getItem("konyvkastely-font-size")) || 20;

const normalize = value => value
  .toLocaleLowerCase("hu-HU")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

function getCategories() {
  return ["Mind", ...new Set(books.flatMap(book => book.categories))];
}

function createFilters() {
  filterWrap.innerHTML = getCategories().map(category => `
    <button class="filter-button" type="button" data-category="${category}" aria-pressed="${category === state.category}">
      ${category === "Mind" ? "Minden könyv" : category}
    </button>
  `).join("");
}

function filteredBooks() {
  const query = normalize(state.query.trim());
  return books.filter(book => {
    const matchesCategory = state.category === "Mind" || book.categories.includes(state.category);
    const searchable = normalize([book.title, book.author, ...book.categories].join(" "));
    return matchesCategory && (!query || searchable.includes(query));
  });
}

function bookCard(book) {
  const initial = book.author.charAt(0);
  return `
    <article class="book-card">
      <div class="book-spine" aria-hidden="true">${initial}</div>
      <h3>${book.title}</h3>
      <p class="author">${book.author}</p>
      <p class="book-description">${book.description}</p>
      <div class="tag-list" aria-label="Kategóriák">
        ${book.categories.map(category => `<span class="tag">${category}</span>`).join("")}
      </div>
      <div class="book-actions">
        <button class="book-action read-button" type="button" data-book-id="${book.id}">Online olvasás</button>
        <a class="book-action secondary-action" href="${book.detailsUrl}" target="_blank" rel="noopener noreferrer">Letöltés</a>
      </div>
    </article>
  `;
}

function renderBooks() {
  const results = filteredBooks();
  grid.innerHTML = results.map(bookCard).join("");
  visibleCount.textContent = results.length;
  emptyState.hidden = results.length !== 0;
  clearSearch.hidden = state.query.length === 0;
}

function cleanGutenbergText(text) {
  const startMarker = /\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;
  const endMarker = /\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;
  const start = text.search(startMarker);
  const end = text.search(endMarker);
  const body = text.slice(start >= 0 ? start + text.slice(start).match(startMarker)[0].length : 0, end >= 0 ? end : text.length);
  return body.replace(/\r/g, "").trim();
}

function paginateText(text, targetLength = 2800) {
  const paragraphs = text.split(/\n{2,}/).map(part => part.replace(/\n+/g, " ").trim()).filter(Boolean);
  const pages = [];
  let page = [];
  let length = 0;

  paragraphs.forEach(paragraph => {
    if (length && length + paragraph.length > targetLength) {
      pages.push(page);
      page = [];
      length = 0;
    }
    page.push(paragraph);
    length += paragraph.length;
  });
  if (page.length) pages.push(page);
  return pages;
}

function renderReaderPage({ focus = false } = {}) {
  bookPage.replaceChildren();
  bookPage.style.fontSize = `${readerFontSize}px`;
  (readerPages[currentPage] || []).forEach(paragraph => {
    const element = document.createElement("p");
    element.textContent = paragraph;
    bookPage.appendChild(element);
  });
  readerProgress.textContent = readerPages.length ? `${currentPage + 1}. oldal / ${readerPages.length}` : "Betöltés…";
  previousPage.disabled = currentPage === 0;
  nextPage.disabled = currentPage >= readerPages.length - 1;
  if (currentBook && readerPages.length) {
    localStorage.setItem(`konyvkastely-page-${currentBook.id}`, String(currentPage));
  }
  bookPage.scrollTop = 0;
  if (focus) bookPage.focus();
}

async function openCastleReader(book) {
  archiveReader.hidden = true;
  castleReader.hidden = false;
  readerNote.textContent = "A Könyvkastély saját olvasója. Az olvasási helyet ez a böngésző megjegyzi.";
  readerSource.onclick = () => window.open(book.detailsUrl, "_blank", "noopener");
  readerPages = [];
  currentPage = 0;
  bookPage.innerHTML = '<p class="loading-message">A könyv lapjainak előkészítése…</p>';
  readerProgress.textContent = "Betöltés…";
  previousPage.disabled = true;
  nextPage.disabled = true;

  try {
    const response = await fetch(book.textUrl);
    if (!response.ok) throw new Error("A szöveg nem tölthető le.");
    readerPages = paginateText(cleanGutenbergText(await response.text()));
    const savedPage = Number(localStorage.getItem(`konyvkastely-page-${book.id}`));
    currentPage = Number.isFinite(savedPage) ? Math.min(savedPage, readerPages.length - 1) : 0;
    renderReaderPage();
  } catch (error) {
    bookPage.replaceChildren();
    const message = document.createElement("p");
    message.className = "reader-error";
    message.textContent = "A könyv szövege most nem érhető el. Az Eredeti forrás gombbal a Gutenberg olvasója továbbra is megnyitható.";
    bookPage.appendChild(message);
    readerProgress.textContent = "Átmeneti betöltési hiba";
  }
}

function openReader(book) {
  currentBook = book;
  readerTitle.textContent = `${book.author}: ${book.title}`;
  if (book.readerType === "gutenberg") {
    openCastleReader(book);
  } else {
    castleReader.hidden = true;
    archiveReader.hidden = false;
    readerNote.textContent = "A lapozható kötetet az Internet Archive biztosítja.";
    frame.src = book.readerUrl;
  }
  dialog.showModal();
}

function closeReader() {
  dialog.close();
  frame.src = "about:blank";
  currentBook = null;
}

previousPage.addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage -= 1;
    renderReaderPage({ focus: true });
  }
});

nextPage.addEventListener("click", () => {
  if (currentPage < readerPages.length - 1) {
    currentPage += 1;
    renderReaderPage({ focus: true });
  }
});

document.querySelector("#font-smaller").addEventListener("click", () => {
  readerFontSize = Math.max(16, readerFontSize - 2);
  localStorage.setItem("konyvkastely-font-size", String(readerFontSize));
  renderReaderPage();
});

document.querySelector("#font-larger").addEventListener("click", () => {
  readerFontSize = Math.min(30, readerFontSize + 2);
  localStorage.setItem("konyvkastely-font-size", String(readerFontSize));
  renderReaderPage();
});

document.addEventListener("keydown", event => {
  if (!dialog.open || castleReader.hidden) return;
  if (event.key === "ArrowLeft") previousPage.click();
  if (event.key === "ArrowRight") nextPage.click();
});

search.addEventListener("input", event => {
  state.query = event.target.value;
  renderBooks();
});

clearSearch.addEventListener("click", () => {
  state.query = "";
  search.value = "";
  search.focus();
  renderBooks();
});

filterWrap.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  createFilters();
  renderBooks();
});

grid.addEventListener("click", event => {
  const button = event.target.closest("[data-book-id]");
  if (!button) return;
  const book = books.find(item => item.id === button.dataset.bookId);
  if (book) openReader(book);
});

document.querySelector(".close-dialog").addEventListener("click", closeReader);
dialog.addEventListener("click", event => {
  if (event.target === dialog) closeReader();
});
dialog.addEventListener("cancel", event => {
  event.preventDefault();
  closeReader();
});

document.querySelector("#year").textContent = new Date().getFullYear();
createFilters();
renderBooks();
