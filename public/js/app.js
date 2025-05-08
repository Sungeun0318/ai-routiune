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

// ✅ 앱 초기화 여부 플래그
let appInitialized = false;

// ✅ 앱 전체 초기화 함수
export function initApp() {
  if (appInitialized) return; // 중복 실행 방지
  appInitialized = true;

  // 1. 내비게이션 UI 초기화
  initNavigation();

  // 2. 루틴 관련 버튼/입력 초기화
  initRoutineHandlers();

  // 3. 이벤트 리스너 등록 (탭/모달/ESC/버튼 등)
  setupEventListeners();

  // 4. 사용자 데이터 불러오기 함수 연결
  setFetchUserDataFunction(fetchUserData);

  // 5. 자동 로그인 시도
  checkAutoLogin()
    .then(isLoggedIn => {
      if (isLoggedIn) {
        return fetchUserData();
      }
    })
    .catch(error => {
      console.error('Auto-login error:', error);
    });
}

// ✅ DOMContentLoaded 시 단 1번 실행
setFetchUserDataFunction(fetchUserData);
document.addEventListener('DOMContentLoaded', function initAppOnce() {
  document.removeEventListener('DOMContentLoaded', initAppOnce); // 재등록 방지
  initApp();
});

// ✅ 각종 UI 이벤트 연결 함수
function setupEventListeners() {
  // 로그인 폼 제출
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    login();
  });

  // 회원가입 폼 제출
  document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    register();
  });

  // 탭 전환: 로그인 → 회원가입
  document.getElementById('register-tab').addEventListener('click', () => {
    document.getElementById('register-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
  });

  // 탭 전환: 회원가입 → 로그인
  document.getElementById('login-tab').addEventListener('click', () => {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
  });

  // 회원가입 화면에서 뒤로가기
  document.getElementById('back-to-login').addEventListener('click', () => {
    document.getElementById('login-tab').click();
  });

  // 로그아웃 버튼
  document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
  });

  // 모든 모달 닫기 버튼
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });

  // ESC 키 눌러도 모달 닫힘
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

// ✅ 사용자 정보 불러오기 및 UI 반영
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
        // 1. 프로필 내 루틴/완료 수 표시
        const profileRoutineCount = document.getElementById('profile-routine-count');
        if (profileRoutineCount) {
          profileRoutineCount.textContent = userData.routineCount || 0;
        }

        const profileCompletedCount = document.getElementById('profile-completed-count');
        if (profileCompletedCount) {
          profileCompletedCount.textContent = userData.completedCount || 0;
        }

        // 2. 루틴 목록 + 오늘 일정 불러오기
        Promise.all([
          fetchRecentRoutines().catch(err => console.error('Fetch routines error:', err)),
          fetchTodaySchedule().catch(err => console.error('Fetch schedule error:', err))
        ])
        .then(() => resolve(true))
        .catch(err => {
          console.error('Fetch data error:', err);
          resolve(false);
        });
      })
      .catch(error => {
        console.error('Fetch user data error:', error);
        resolve(false);
      });
    } catch (error) {
      console.error('Fetch user data error:', error);
      reject(error);
    }
  });
}

// ✅ 외부에서 호출 가능한 함수 등록 (캘린더 초기화 등)
window.initCalendar = initCalendar;
window.showToast = showToast;
window.fetchUserData = fetchUserData;
