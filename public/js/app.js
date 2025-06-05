// ✅ 외부 모듈 import
import { checkAutoLogin, login, register, logout, getAuthToken, showApp } from './auth.js';
import { setFetchUserDataFunction } from './auth.js';
import { 
  initNavigation, 
  showToast,
  hideApp,
  closeAllModals
} from './ui.js';
import { 
  initRoutineHandlers, 
  fetchRecentRoutines, 
  fetchTodaySchedule 
} from './routine.js';
import { initCalendar } from './calendar.js';
import { quotes } from './quotes.js'; // ✅ 명언 import

// ✅ 앱 초기화 여부 플래그
let appInitialized = false;

// ✅ 앱 전체 초기화 함수
export function initApp() {
  if (appInitialized) return;
  appInitialized = true;

  initNavigation();
  initRoutineHandlers();
  setupEventListeners();
  setFetchUserDataFunction(fetchUserData);
  checkAutoLogin()
    .then(isLoggedIn => {
      if (isLoggedIn) return fetchUserData();
    })
    .catch(error => console.error('Auto-login error:', error));

  // ✅ 명언 출력
  showRandomQuote();
}

// ✅ DOMContentLoaded 시 단 1회만 실행
document.addEventListener('DOMContentLoaded', function initAppOnce() {
  document.removeEventListener('DOMContentLoaded', initAppOnce);
  setFetchUserDataFunction(fetchUserData);
  initApp();
});

// ✅ UI 이벤트 연결
function setupEventListeners() {
  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    login();
  });

  document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    register();
  });

  document.getElementById('register-tab')?.addEventListener('click', () => {
    document.getElementById('register-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
  });

  document.getElementById('login-tab')?.addEventListener('click', () => {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
  });

  document.getElementById('back-to-login')?.addEventListener('click', () => {
    document.getElementById('login-tab').click();
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    logout();
  });

  // ✅ 캘린더 탭 클릭 시 캘린더 초기화 (중복 호출 방지)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById(`${page}-page`)?.classList.add('active');

      if (page === 'calendar') {
        if (!window.calendar) {
          window.initCalendar(); // 전역에 등록된 initCalendar 사용
        }
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
}

// ✅ 명언 랜덤 출력
function showRandomQuote() {
  const quoteText = document.getElementById('quote-text');
  if (!quoteText) return;
  const randomIndex = Math.floor(Math.random() * quotes.length);
  quoteText.textContent = quotes[randomIndex];
}

// ✅ 사용자 데이터 불러오기
export function fetchUserData() {
  return new Promise((resolve, reject) => {
    try {
      fetch('/api/user-stats', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
        .then(response => {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return response.json();
          }
          throw new Error('Invalid response format');
        })
        .then(userData => {
          const profileRoutineCount = document.getElementById('profile-routine-count');
          const profileCompletedCount = document.getElementById('profile-completed-count');
          if (profileRoutineCount) profileRoutineCount.textContent = userData.routineCount || 0;
          if (profileCompletedCount) profileCompletedCount.textContent = userData.completedCount || 0;

          return Promise.all([
            fetchRecentRoutines(),
            fetchTodaySchedule()
          ]);
        })
        .then(() => resolve(true))
        .catch(error => {
          console.error('User data fetch error:', error);
          resolve(false);
        });
    } catch (error) {
      console.error('User data fetch exception:', error);
      reject(error);
    }
  });
}

// ✅ AI 루틴 생성 요청 함수
export async function generateAIRoutine(profileData) {
  try {
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error('루틴 생성 실패');
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('generateAIRoutine error:', error);
    throw error;
  }
}

// ✅ 글로벌 함수 등록
window.initCalendar = initCalendar;
window.showToast = showToast;
window.fetchUserData = fetchUserData;
window.generateAIRoutine = generateAIRoutine;
