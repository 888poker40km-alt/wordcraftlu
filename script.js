// ====== 1. ДАННЫЕ ======

let sentencesData = []; // сюда загрузим sentences.json
let wordsPool = [];     // сюда загрузим words.json

let currentItem = null;

let currentLang = localStorage.getItem("lang") || "ru";

let isAnimating = false;


// ====== 2. ЗАГРУЗКА JSON ======


async function loadData() {

  // загружаем предложения
  let sentencesRes = await fetch("./sentences.json");
  sentencesData = await sentencesRes.json();

  // запускаем игру
  initGame();
  
  // ===== язык =====
  const btn = document.getElementById("langBtn");
  
  if (btn) {
    btn.textContent = currentLang === "ru" ? "🌐 RU" : "🌐 UA";

    btn.onclick = () => {

      currentLang = currentLang === "ru" ? "ua" : "ru";
      localStorage.setItem("lang", currentLang);

      btn.textContent = currentLang === "ru" ? "🌐 RU" : "🌐 UA";

      initGame();
    };
  }
  function setButtonsDisabled(state) {
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(btn => {
    btn.disabled = state;
  });
}

 const helpBtn = document.getElementById("helpBtn");

if (helpBtn) {
  const helpBtn = document.getElementById("helpBtn");

helpBtn.onclick = () => {

  const emptySlot = document.querySelector(".word:not(.filled)");
  if (!emptySlot) return;

  const correctEn = emptySlot.dataset.answer;

  let correctWord = null;

  sentencesData.forEach(item => {
    item.answers.forEach(a => {
      if (a.correct === correctEn) {
        correctWord = a.word[currentLang];
      }
    });
  });

  if (!correctWord) {
    console.log("Не найден перевод для:", correctEn);
    return;
  }

  const buttons = document.querySelectorAll(".option-btn");

  const targetBtn = Array.from(buttons).find(btn =>
    btn.textContent.trim().toLowerCase() ===
    correctWord.trim().toLowerCase()
  );

  if (!targetBtn) {
    console.log("Кнопка не найдена:", correctWord);
    return;
  }

  targetBtn.click();
};
}
}


// ====== 3. ПЕРЕМЕШИВАНИЕ ======

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}


// ====== 4. СОЗДАНИЕ MAP (русское слово → английское) ======

function createAnswersMap(answers) {

  let map = {};

  answers.forEach(item => {
    map[item.word[currentLang]] = item.correct;
  });

  return map;
}


// ====== 5. РЕНДЕР ПРЕДЛОЖЕНИЯ ======

function renderSentence(sentence, answersMap) {

  let formatted = sentence.replace(/\$(.*?)\$/g, (match, p1) => {

    let english = answersMap[p1];

    // ВАЖНО: теперь показываем английское слово сразу
    return `<span class="word" data-answer="${english}">${english}</span>`;
  });

  document.getElementById("sentence").innerHTML = formatted;
  addSlotEvents();   // 👈 добавили
  setActiveWord(); // 👈 ДОБАВИТЬ
}


// ====== 6. ГЕНЕРАЦИЯ ВАРИАНТОВ КНОПОК ======

function getRandomRussianWords(excludeWords, count) {

  let allWords = [];

  sentencesData.forEach(item => {
    item.answers.forEach(a => {

      let word = a.word[currentLang];

      if (word) { // 👈 защита от undefined
        allWords.push(word);
      }

    });
  });

  allWords = [...new Set(allWords)];

  let filtered = allWords.filter(word => !excludeWords.includes(word));

  return shuffle(filtered).slice(0, count);
}


// генерация вариантов
function generateOptions(correctWords) {

  let totalButtons = correctWords.length * 3;

  let extraCount = totalButtons - correctWords.length;

  let randomWords = getRandomRussianWords(correctWords, extraCount);

  let all = [...correctWords, ...randomWords];

  // защита от undefined
  all = all.filter(word => word);

  return shuffle(all);
}


// ====== 7. РЕНДЕР КНОПОК ======

function renderButtons(options) {

  let container = document.getElementById("options");

  container.innerHTML = "";

  options.forEach(word => {

    let btn = document.createElement("button");

    btn.classList.add("option-btn");
    btn.textContent = word;
    if (word.length > 8) {
  btn.style.fontSize = "14px"; // было 16px например → уменьшаем
}

if (word.length > 12) {
  btn.style.fontSize = "12px"; // ещё меньше если очень длинное
}

btn.onclick = () => {

  let emptySlot = document.querySelector(".word:not(.filled)");
  if (!emptySlot || isAnimating) return;

  flyToSlot(btn, emptySlot, () => {

    emptySlot.textContent = word;
    emptySlot.classList.add("filled");
    emptySlot.dataset.user = word;

    btn.disabled = true;
    btn.style.visibility = "hidden";

    setActiveWord();
    checkIfAllFilled();
  });
};

    container.appendChild(btn);
  });
}


// ====== 8. ИНИЦИАЛИЗАЦИЯ ИГРЫ ======

function initGame() {

  // случайное предложение
  let item = sentencesData[Math.floor(Math.random() * sentencesData.length)];
  
    currentItem = item; // 👈 ВОТ ЭТО ДОБАВИТЬ

  // map переводов
  let answersMap = createAnswersMap(item.answers);

  // рендер текста
  renderSentence(item.sentence[currentLang], answersMap);

  // правильные слова (русские)
  let correctWords = item.answers.map(a => a.word[currentLang]);

  // генерируем кнопки
  let options = generateOptions(correctWords);

  // рендер кнопок
  renderButtons(options);
}

function setActiveWord() {

  let slots = document.querySelectorAll(".word");

  // убираем активность со всех
  slots.forEach(slot => slot.classList.remove("active"));

  // ищем первый незаполненный
  let activeSlot = Array.from(slots).find(slot => !slot.classList.contains("filled"));

  if (activeSlot) {
    activeSlot.classList.add("active");
  }
}

function flyToSlot(button, slot, callback) {

  if (isAnimating) return;
  isAnimating = true;

  const clone = button.cloneNode(true);
  clone.classList.add("flying");

  document.body.appendChild(clone);

  const btnRect = button.getBoundingClientRect();
  const slotRect = slot.getBoundingClientRect();

  clone.style.left = btnRect.left + "px";
  clone.style.top = btnRect.top + "px";

  const deltaX = slotRect.left - btnRect.left;
  const deltaY = slotRect.top - btnRect.top;

  clone.style.transform = "translate(0px, 0px)";

  requestAnimationFrame(() => {
    clone.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  });

  clone.addEventListener("transitionend", () => {
    clone.remove();
    isAnimating = false; // ✅ разблокировка

    if (callback) callback();
  });
}

function addSlotEvents() {
  const slots = document.querySelectorAll(".word");

  slots.forEach(slot => {
    slot.onclick = () => {

      // если слот пустой — ничего не делаем
      if (!slot.classList.contains("filled")) return;

      const userWord = slot.dataset.user;

      if (!userWord) return;

      // возвращаем кнопку
      const buttons = document.querySelectorAll(".option-btn");

      buttons.forEach(btn => {
        if (btn.textContent === userWord) {
          btn.disabled = false;
          btn.style.visibility = "visible";
        }
      });

      // очищаем слот
      slot.textContent = slot.dataset.answer;
      slot.classList.remove("filled");
      delete slot.dataset.user;

      setActiveWord();
    };
  });
}

function checkAnswer() {

  const message = document.getElementById("message");

  const correctWords = currentItem.answers.map(a =>
    a.word[currentLang].toLowerCase().trim()
  );

  const userWords = Array.from(document.querySelectorAll(".word"))
    .map(slot => slot.dataset.user)
    .filter(Boolean)
    .map(w => w.toLowerCase().trim());

  const isCorrect =
    correctWords.length === userWords.length &&
    correctWords.every((word, i) => word === userWords[i]);

  if (isCorrect) {
    message.textContent = "✔ Верно";

    confetti({
      particleCount: 200,
      spread: 120,
      origin: { x: 0.5, y: 0.5 }
    });

    setTimeout(() => {
      initGame();
      message.textContent = "";
    }, 1000);

  } else {
    message.textContent = "❌ Ошибка";
  }
}


const infoTexts = {
  ru: `📘 Как играть:

1. Нажимай на слова снизу  
2. Слова будут вставляться в слоты  
3. Когда все слоты заполнены — происходит проверка  
4. ✔ Если правильно — переход к следующему заданию  
5. ❌ Если ошибка — попробуй ещё раз  

💡 Есть кнопка Help — она подскажет слово  
🎯 Цель — собрать правильное предложение`,

  ua: `📘 Як грати:

1. Натискай на слова знизу  
2. Слова будуть вставлятися у слоти  
3. Коли всі слоти заповнені — відбувається перевірка  
4. ✔ Якщо правильно — перехід до наступного завдання  
5. ❌ Якщо помилка — спробуй ще раз  

💡 Є кнопка Help — вона підкаже слово  
🎯 Мета — скласти правильне речення`
};

document.addEventListener("DOMContentLoaded", () => {

  const infoBtn = document.getElementById("infoBtn");

  if (!infoBtn) {
    console.log("❌ infoBtn not found");
    return;
  }

  infoBtn.onclick = () => {
    const text = infoTexts[currentLang] || infoTexts.ru;
    alert(text);
  };

});

function checkIfAllFilled() {
  const slots = document.querySelectorAll(".word");
  const filled = document.querySelectorAll(".word.filled");

  if (slots.length === filled.length) {
    checkAnswer();
  }
}


// ====== 9. СТАРТ ======

loadData();
