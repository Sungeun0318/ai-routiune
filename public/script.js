const authDiv     = document.getElementById('auth');
const loginBtn    = document.getElementById('btn-login');
const registerBtn = document.getElementById('btn-register');
const tempLoginBtn= document.getElementById('btn-temp-login');
const logoutBtn   = document.getElementById('btn-logout');
const form        = document.getElementById('profile-form');
const result      = document.getElementById('result');

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
    credentials: 'include',          // ← 추가
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
    credentials: 'include',          // ← 추가
    body: JSON.stringify({ username, password })
  });
  if (res.ok) showLoggedIn();
  else alert('회원가입 실패');
};

// 임시 로그인 (스킵)
tempLoginBtn.onclick = () => {
  showLoggedIn();
};

// 로그아웃
logoutBtn.onclick = async () => {
  await fetch('/logout', {
    method: 'POST',
    credentials: 'include'           // ← 추가
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
    credentials: 'include',          // ← 추가
    body: JSON.stringify(profile)
  });
  const data = await res.json();
  result.textContent = data.recommendation || data.error;
});
