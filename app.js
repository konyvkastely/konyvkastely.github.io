const books = [
  {
    id: "petofi-osszes-koltemenyei",
    title: "Összes költeményei",
    author: "Petőfi Sándor",
    categories: ["Költészet", "Magyar irodalom", "Összegyűjtött művek"],
    description: "Petőfi Sándor verseinek régi, digitalizált gyűjteménye. A kötet közvetlenül, lapozható formában olvasható.",
    readerUrl: "https://archive.org/embed/PetofiSandor-osszes-koltemenyei",
    detailsUrl: "https://archive.org/details/PetofiSandor-osszes-koltemenyei"
  }
];

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

function openReader(book) {
  readerTitle.textContent = `${book.author}: ${book.title}`;
  frame.src = book.readerUrl;
  dialog.showModal();
}

function closeReader() {
  dialog.close();
  frame.src = "about:blank";
}

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
