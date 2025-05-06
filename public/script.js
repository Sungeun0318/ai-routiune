const authDiv      = document.getElementById('auth');
const loginBtn     = document.getElementById('btn-login');
const registerBtn  = document.getElementById('btn-register');
const logoutBtn    = document.getElementById('btn-logout');
const form         = document.getElementById('profile-form');
const result       = document.getElementById('result');
const resultBox    = document.getElementById('result-box');
const calendarEl   = document.getElementById('calendar');
const feedbackInput= document.getElementById('feedback');
const feedbackBtn  = document.getElementById('submit-feedback');

// 로그인 성공 시 화면 전환
function showLoggedIn() {
  authDiv.style.display   = 'none';
  form.style.display      = 'block';
  logoutBtn.style.display = 'inline';
}

// 자동 로그인 확인
async function checkAutoLogin() {
  const res = await fetch('/api/me', { credentials: 'include' });
  if (res.ok) {
    showLoggedIn();
  } else {
    authDiv.style.display   = 'block';
    form.style.display      = 'none';
    logoutBtn.style.display = 'none';
  }
}

// 자동 로그인 시도
window.onload = checkAutoLogin;

// 로그인 요청
loginBtn.onclick = async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  if (res.ok) {
    showLoggedIn();
  } else {
    alert('로그인 실패');
  }
};

// 회원가입 페이지 이동
registerBtn.onclick = () => {
  window.location.href = '/register.html';
};

// 로그아웃 요청
logoutBtn.onclick = async () => {
  const res = await fetch('/logout', {
    method: 'POST',
    credentials: 'include'
  });
  if (res.ok) {
    window.location.href = '/';
  } else {
    alert('로그아웃 실패');
  }
};

// 루틴 추천 요청
form.addEventListener('submit', async e => {
  e.preventDefault();
  const profile = {
    name: form.name.value,
    goal: form.goal.value,
    hours: form.hours.value,
    method: form.method?.value,
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

// 캘린더 표시
function renderCalendarFromText(text) {
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridWeek',
    height: 400,
    events: parseEvents(text)
  });
  calendar.render();
}

// 캘린더 데이터 파싱
function parseEvents(text) {
  const lines = text.split('\n');
  const events = [];
  for (let line of lines) {
    const parts = line.split(':');
    if (parts.length === 2) {
      const title = parts[0].trim();
      const start = new Date().toISOString().split('T')[0];
      events.push({ title, start });
    }
  }
  return events;
}
