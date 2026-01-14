/* CCIE Security Quiz (single question bank)
   - Supports multi-answer questions via `choose` and `answer` arrays.
   - Shows optional domain label (question.domain) if provided.
*/
const STATE = {
  questions: [],
  idx: 0,
  score: 0,
  answered: false,
  selections: new Set(),
  showInstantFeedback: true,
  history: [] // {id, selected:[...], correct:[...], isCorrect}
};

const el = (id) => document.getElementById(id);

function normaliseAnswers(arr) {
  return (arr || []).map(String).map(s => s.trim().toUpperCase()).filter(Boolean).sort();
}

function setMetaLine() {
  const total = STATE.questions.length;
  el('metaLine').textContent = total ? `${total} questions • Single bank` : 'Loading…';
}

function showScreen(name) {
  el('startScreen').classList.toggle('hidden', name !== 'start');
  el('quizScreen').classList.toggle('hidden', name !== 'quiz');
  el('resultScreen').classList.toggle('hidden', name !== 'result');
}

function renderQuestion() {
  STATE.answered = false;
  STATE.selections.clear();

  const q = STATE.questions[STATE.idx];
  const total = STATE.questions.length;

  el('qnum').textContent = `Question ${STATE.idx + 1} of ${total}`;
  el('qtext').textContent = q.question || '';
  el('domainPill').textContent = q.domain ? `Domain: ${q.domain}` : 'Domain: —';

  const choose = Number(q.choose || 1);
  el('chooseHint').textContent = choose > 1 ? `Choose ${choose}.` : 'Choose one.';

  el('feedback').classList.add('hidden');
  el('feedback').classList.remove('good','bad');
  el('feedback').textContent = '';

  el('submitBtn').disabled = false;
  el('submitBtn').classList.remove('hidden');
  el('nextBtn').classList.add('hidden');

  const form = el('optionsForm');
  form.innerHTML = '';

  const inputType = choose > 1 ? 'checkbox' : 'radio';
  const name = `q_${q.id}`;

  const letters = Object.keys(q.options || {}).sort();
  for (const letter of letters) {
    const text = q.options[letter];

    const wrap = document.createElement('div');
    wrap.className = 'opt';

    const input = document.createElement('input');
    input.type = inputType;
    input.name = name;
    input.id = `${name}_${letter}`;
    input.value = letter;

    input.addEventListener('change', () => {
      if (STATE.answered) return;

      if (choose > 1) {
        if (input.checked) {
          STATE.selections.add(letter);
          // prevent selecting more than allowed
          if (STATE.selections.size > choose) {
            // undo the last check
            input.checked = false;
            STATE.selections.delete(letter);
          }
        } else {
          STATE.selections.delete(letter);
        }
      } else {
        STATE.selections.clear();
        if (input.checked) STATE.selections.add(letter);
      }
    });

    const label = document.createElement('label');
    label.setAttribute('for', input.id);
    label.textContent = `${letter}) ${text}`;

    wrap.appendChild(input);
    wrap.appendChild(label);
    form.appendChild(wrap);
  }
}

function isSelectionCorrect(selected, correct) {
  const a = normaliseAnswers(selected);
  const b = normaliseAnswers(correct);
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function submitAnswer() {
  if (STATE.answered) return;

  const q = STATE.questions[STATE.idx];
  const choose = Number(q.choose || 1);
  const selected = Array.from(STATE.selections);

  // basic validation: must pick required count
  if (selected.length !== choose) {
    const msg = choose > 1 ? `Please select exactly ${choose} options.` : 'Please select one option.';
    showFeedback(msg, false, true);
    return;
  }

  const correct = normaliseAnswers(q.answer);
  const ok = isSelectionCorrect(selected, correct);

  STATE.answered = true;
  if (ok) STATE.score += 1;

  STATE.history.push({
    id: q.id,
    domain: q.domain || '',
    question: q.question || '',
    selected: normaliseAnswers(selected),
    correct,
    isCorrect: ok
  });

  if (STATE.showInstantFeedback) {
    const msg = ok
      ? `Correct ✅`
      : `Incorrect ❌  Correct answer: ${correct.join(', ')}`;
    showFeedback(msg, ok);
  }

  el('submitBtn').classList.add('hidden');
  el('nextBtn').classList.remove('hidden');
}

function showFeedback(text, ok, neutral=false) {
  const fb = el('feedback');
  fb.classList.remove('hidden');
  fb.classList.remove('good','bad');
  if (!neutral) fb.classList.add(ok ? 'good' : 'bad');
  fb.textContent = text;
}

function nextQuestion() {
  if (!STATE.answered && STATE.showInstantFeedback) {
    // If they turned off instant feedback, we still allow moving on only after submit.
    return;
  }
  STATE.idx += 1;
  if (STATE.idx >= STATE.questions.length) {
    showResults();
    return;
  }
  renderQuestion();
}

function restart() {
  STATE.idx = 0;
  STATE.score = 0;
  STATE.answered = false;
  STATE.selections.clear();
  STATE.history = [];
  showScreen('start');
}

function showResults() {
  showScreen('result');
  const total = STATE.questions.length;
  el('resultLine').textContent = `Score: ${STATE.score} / ${total}`;
  el('reviewArea').classList.add('hidden');
  el('reviewArea').innerHTML = '';
}

function renderReview() {
  const area = el('reviewArea');
  area.innerHTML = '';
  area.classList.remove('hidden');

  for (const item of STATE.history) {
    const div = document.createElement('div');
    div.className = 'reviewItem';

    const head = document.createElement('div');
    head.className = 'rhead';
    head.textContent = `Q${item.id}${item.domain ? ` • ${item.domain}` : ''}`;

    const rq = document.createElement('div');
    rq.className = 'rq';
    rq.textContent = item.question;

    const ra = document.createElement('div');
    ra.className = 'ra';
    ra.textContent = `Your answer: ${item.selected.join(', ') || '—'} • Correct: ${item.correct.join(', ') || '—'} • ${item.isCorrect ? '✅' : '❌'}`;

    div.appendChild(head);
    div.appendChild(rq);
    div.appendChild(ra);
    area.appendChild(div);
  }
}

// PWA: register service worker (optional)
async function setupSW() {
  if (!('serviceWorker' in navigator)) return;
  try { await navigator.serviceWorker.register('sw.js'); } catch {}
}

async function init() {
  el('versionLine').textContent = `Build: ${new Date().toISOString().slice(0,10)} • One-bank quiz`;

  el('startBtn').addEventListener('click', () => {
    STATE.showInstantFeedback = el('showInstantFeedback').checked;
    showScreen('quiz');
    renderQuestion();
  });

  el('restartBtn').addEventListener('click', restart);
  el('restartBtn2').addEventListener('click', restart);
  el('submitBtn').addEventListener('click', submitAnswer);
  el('nextBtn').addEventListener('click', nextQuestion);
  el('reviewBtn').addEventListener('click', renderReview);

  const res = await fetch('questions.json', { cache: 'no-store' });
  const data = await res.json();

  // Keep bank in given order (no domain splitting / no shuffle)
  STATE.questions = Array.isArray(data) ? data : [];
  setMetaLine();

  showScreen('start');
  setupSW();
}

init();
