const authDiv      = document.getElementById('auth');
const loginBtn     = document.getElementById('btn-login');
const registerBtn  = document.getElementById('btn-register');
const tempLoginBtn = document.getElementById('btn-temp-login');
const logoutBtn    = document.getElementById('btn-logout');
const form         = document.getElementById('profile-form');
const result       = document.getElementById('result');
const resultBox    = document.getElementById('result-box');
const calendarEl   = document.getElementById('calendar');
const feedbackInput= document.getElementById('feedback');
const feedbackBtn  = document.getElementById('submit-feedback');

function showLoggedIn() {
  authDiv.style.display   = 'none';
  form.style.display      = 'block';
  logoutBtn.style.display = 'inline';
}

// 로그인
loginBtn.onclick = async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  if (res.ok) showLoggedIn();
  else alert('로그인 실패');
};

// 회원가입
registerBtn.onclick = async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  if (res.ok) showLoggedIn();
  else alert('회원가입 실패');
};

// 임시 로그인
tempLoginBtn.onclick = () => {
  showLoggedIn();
};

// 로그아웃
logoutBtn.onclick = async () => {
  await fetch('/logout', {
    method: 'POST',
    credentials: 'include'
  });
  window.location.reload();
};

// 추천 요청
form.addEventListener('submit', async e => {
  e.preventDefault();
  const profile = {
    name:      form.name.value,
    goal:      form.goal.value,
    hours:     form.hours.value,
    method:    form.method?.value,
    focusTime: form.focusTime?.value,
    interests: form.interests?.value
  };
  const res = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(profile)
  });
  const data = await res.json();
  if (data.recommendation) {
    resultBox.style.display = 'block';
    result.textContent = data.recommendation;
    renderCalendarFromText(data.recommendation);
  } else {
    alert('추천 실패: ' + (data.error || ''));
  }
});

// 피드백 제출
feedbackBtn.onclick = async () => {
  const feedback = feedbackInput.value;
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ feedback })
  });
  if (res.ok) {
    alert('피드백 제출 완료');
    feedbackInput.value = '';
  } else {
    alert('피드백 제출 실패');
  }
};

// 추천 결과를 캘린더 형태로 렌더링
function renderCalendarFromText(text) {
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridWeek',
    height: 400,
    events: parseEvents(text)
  });
  calendar.render();
}

// 간단한 텍스트 → 이벤트 변환기
function parseEvents(text) {
  const lines = text.split('\n');
  const events = [];

  for (let line of lines) {
    const parts = line.split(':');
    if (parts.length === 2) {
      const title = parts[0].trim();
      const timeStr = parts[1].trim();
      if (timeStr.match(/\d/)) {
        const start = new Date();  // 오늘 날짜
        events.push({
          title,
          start: start.toISOString().split('T')[0]
        });
      }
    }
  }
  return events;
}
