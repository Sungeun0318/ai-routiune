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

// 초기화 상태 관리 변수
let appInitialized = false;

// 앱 초기화 함수
export function initApp() {
  // 중복 초기화 방지
  if (appInitialized) return;
  appInitialized = true;
  
  // UI 초기화
  initNavigation();
  
  // 루틴 관련 핸들러 초기화
  initRoutineHandlers();
  
  // 이벤트 리스너 설정
  setupEventListeners();

  setFetchUserDataFunction(fetchUserData);

  // 자동 로그인 확인
  checkAutoLogin()
    .then(isLoggedIn => {
      if (isLoggedIn) {
        // 로그인 성공 시 사용자 데이터 가져오기
        return fetchUserData();
      }
    })
    .catch(error => {
      console.error('Auto-login error:', error);
    });
}

setFetchUserDataFunction(fetchUserData);
// DOM 로드 이벤트 - 단 한 번만 실행되도록 리스너를 직접 정의
document.addEventListener('DOMContentLoaded', function initAppOnce() {
  // 리스너를 한 번 실행 후 제거하여 중복 실행 방지
  document.removeEventListener('DOMContentLoaded', initAppOnce);
  initApp();
});

// 이벤트 리스너 설정
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
  
  // 로그인/회원가입 탭 전환
  document.getElementById('login-tab').addEventListener('click', () => {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
  });
  
  document.getElementById('register-tab').addEventListener('click', () => {
    document.getElementById('register-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
  });
  
  document.getElementById('back-to-login').addEventListener('click', () => {
    document.getElementById('login-tab').click();
  });
  
  // 로그아웃 버튼
  document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
  });
  
  // 모달 닫기 버튼들
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });
  
  // ESC 키로 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

// 사용자 데이터 가져오기
export function fetchUserData() {
  return new Promise((resolve, reject) => {
    try {
      // 프로필 데이터 가져오기
      fetch('/api/user-stats', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      .then(response => {
        // 응답이 JSON인지 확인
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return response.json();
        }
        throw new Error('Invalid response format');
      })
      .then(userData => {
        // 사용자 통계 정보 업데이트
        const profileRoutineCount = document.getElementById('profile-routine-count');
        if (profileRoutineCount) {
          profileRoutineCount.textContent = userData.routineCount || 0;
        }
        
        const profileCompletedCount = document.getElementById('profile-completed-count');
        if (profileCompletedCount) {
          profileCompletedCount.textContent = userData.completedCount || 0;
        }
        
        // 최근 루틴 및 오늘의 일정 가져오기
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

// 글로벌로 필요한 함수들 노출
window.initCalendar = initCalendar;
window.showToast = showToast;
window.fetchUserData = fetchUserData;