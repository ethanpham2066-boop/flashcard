// ===== Khởi tạo kết nối Supabase =====
const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG;
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (id) => document.getElementById(id);

const state = {
  user: null,
  currentDeck: null,
  cards: [],
  studyQueue: [],
  studyIndex: 0,
  flipped: false,
};

// ===== Đăng nhập / đăng ký =====
$("signup-btn").onclick = async () => {
  const { error } = await sb.auth.signUp({
    email: $("email").value.trim(),
    password: $("password").value,
  });
  $("auth-msg").textContent = error
    ? error.message
    : "Đăng ký thành công. Nếu được yêu cầu, hãy xác nhận email rồi đăng nhập.";
};

$("login-btn").onclick = async () => {
  const { error } = await sb.auth.signInWithPassword({
    email: $("email").value.trim(),
    password: $("password").value,
  });
  if (error) $("auth-msg").textContent = error.message;
};

$("logout-btn").onclick = () => sb.auth.signOut();

sb.auth.onAuthStateChange((_event, session) => {
  state.user = session?.user ?? null;
  const loggedIn = !!state.user;
  $("auth-section").hidden = loggedIn;
  $("app-section").hidden = !loggedIn;
  $("logout-btn").hidden = !loggedIn;
  $("deck-view").hidden = true;
  $("study-section").hidden = true;
  if (loggedIn) loadDecks();
});

// ===== Bộ thẻ (decks) =====
async function loadDecks() {
  const { data, error } = await sb
    .from("decks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return alert(error.message);
  renderDecks(data);
}

function renderDecks(decks) {
  const ul = $("deck-list");
  ul.innerHTML = "";
  if (!decks.length) {
    const li = document.createElement("li");
    li.textContent = "Chưa có bộ thẻ nào. Tạo bộ đầu tiên nhé!";
    ul.appendChild(li);
    return;
  }
  decks.forEach((deck) => {
    const li = document.createElement("li");
    li.textContent = deck.name;
    const del = document.createElement("button");
    del.textContent = "Xóa";
    del.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm(`Xóa bộ "${deck.name}" và toàn bộ thẻ bên trong?`)) return;
      await sb.from("decks").delete().eq("id", deck.id);
      $("deck-view").hidden = true;
      loadDecks();
    };
    li.appendChild(del);
    li.onclick = () => openDeck(deck);
    ul.appendChild(li);
  });
}

$("add-deck-btn").onclick = async () => {
  const name = $("deck-name").value.trim();
  if (!name) return;
  const { error } = await sb.from("decks").insert({ name, user_id: state.user.id });
  if (error) return alert(error.message);
  $("deck-name").value = "";
  loadDecks();
};

// ===== Chi tiết bộ thẻ =====
async function openDeck(deck) {
  state.currentDeck = deck;
  $("deck-title").textContent = deck.name;
  $("deck-view").hidden = false;
  $("study-section").hidden = true;
  await loadCards();
  $("deck-view").scrollIntoView({ behavior: "smooth" });
}

async function loadCards() {
  const { data, error } = await sb
    .from("cards")
    .select("*")
    .eq("deck_id", state.currentDeck.id)
    .order("created_at", { ascending: true });
  if (error) return alert(error.message);
  state.cards = data;
  renderCards();
  renderStats();
}

function renderCards() {
  const ul = $("card-list");
  ul.innerHTML = "";
  state.cards.forEach((card) => {
    const li = document.createElement("li");
    li.textContent = `${card.front} → ${card.back}${card.known ? "  ✓" : ""}`;
    const del = document.createElement("button");
    del.textContent = "Xóa";
    del.onclick = async () => {
      await sb.from("cards").delete().eq("id", card.id);
      loadCards();
    };
    li.appendChild(del);
    ul.appendChild(li);
  });
}

function renderStats() {
  const known = state.cards.filter((c) => c.known).length;
  $("stats").textContent =
    `Tổng: ${state.cards.length} | Đã thuộc: ${known} | Chưa thuộc: ${state.cards.length - known}`;
}

// ===== Thêm thẻ =====
$("add-card-btn").onclick = async () => {
  const front = $("card-front").value.trim();
  const back = $("card-back").value.trim();
  if (!front || !back) return;
  const { error } = await sb.from("cards").insert({
    deck_id: state.currentDeck.id,
    user_id: state.user.id,
    front,
    back,
  });
  if (error) return alert(error.message);
  $("card-front").value = "";
  $("card-back").value = "";
  loadCards();
};

// Thêm nhiều thẻ: mỗi dòng "câu hỏi | đáp án"
$("bulk-btn").onclick = async () => {
  const rows = $("bulk-text").value
    .split("\n")
    .map((line) => line.split("|"))
    .filter((parts) => parts.length === 2 && parts[0].trim() && parts[1].trim())
    .map(([front, back]) => ({
      deck_id: state.currentDeck.id,
      user_id: state.user.id,
      front: front.trim(),
      back: back.trim(),
    }));

  if (!rows.length) {
    alert("Không có dòng hợp lệ. Mỗi dòng cần dạng: câu hỏi | đáp án");
    return;
  }
  const { error } = await sb.from("cards").insert(rows);
  if (error) return alert(error.message);
  $("bulk-text").value = "";
  alert(`Đã thêm ${rows.length} thẻ.`);
  loadCards();
};

// ===== Chế độ ôn tập =====
// Thẻ "chưa thuộc" được đưa lên đầu hàng đợi, sau đó trộn ngẫu nhiên.
$("study-btn").onclick = () => {
  if (!state.cards.length) {
    alert("Bộ thẻ đang trống. Hãy thêm thẻ trước.");
    return;
  }
  const unknown = state.cards.filter((c) => !c.known);
  const known = state.cards.filter((c) => c.known);
  state.studyQueue = [...shuffle(unknown), ...shuffle(known)];
  state.studyIndex = 0;
  $("study-section").hidden = false;
  $("study-section").scrollIntoView({ behavior: "smooth" });
  showCard();
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showCard() {
  if (state.studyIndex >= state.studyQueue.length) {
    $("study-card").textContent = "🎉 Đã ôn hết bộ thẻ!";
    $("study-progress").textContent = "Hoàn thành";
    $("know-btn").hidden = true;
    $("dontknow-btn").hidden = true;
    $("next-btn").hidden = true;
    renderCards();
    renderStats();
    return;
  }
  const card = state.studyQueue[state.studyIndex];
  state.flipped = false;
  $("study-card").textContent = card.front;
  $("study-progress").textContent = `${state.studyIndex + 1} / ${state.studyQueue.length}`;
  $("know-btn").hidden = false;
  $("dontknow-btn").hidden = false;
  $("next-btn").hidden = true;
}

function nextCard() {
  state.studyIndex++;
  showCard();
}

$("study-card").onclick = () => {
  const card = state.studyQueue[state.studyIndex];
  if (!card) return;
  state.flipped = !state.flipped;
  $("study-card").textContent = state.flipped ? card.back : card.front;
};

async function mark(known) {
  const card = state.studyQueue[state.studyIndex];
  if (!card) return;
  const { error } = await sb.from("cards").update({ known }).eq("id", card.id);
  if (error) return alert(error.message);
  card.known = known; // state.cards dùng chung object này nên thống kê tự cập nhật

  if (known) {
    nextCard();
    return;
  }

  // Chưa nhớ: hiện đáp án và chờ người dùng bấm Tiếp theo
  state.flipped = true;
  $("study-card").textContent = card.back;
  $("know-btn").hidden = true;
  $("dontknow-btn").hidden = true;
  $("next-btn").hidden = false;
  renderStats();
}

$("know-btn").onclick = () => mark(true);
$("dontknow-btn").onclick = () => mark(false);
$("next-btn").onclick = nextCard;
