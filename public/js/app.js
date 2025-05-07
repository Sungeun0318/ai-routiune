// 각 모듈 불러오기
import { checkAutoLogin, login, register, logout } from './auth.js';
import { 
  initNavigation, 
  showToast,
  showApp, 
  hideApp,
  closeAllModals
} from './ui.js';
import { 
  initRoutineHandlers, 
  fetchRecentRoutines, 
  fetchTodaySchedule 
} from './routine.js';
import { initCalendar } from './calendar.js';

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', () => {
  // 페이지 초기화
  initApp();
});

// 앱 초기화 함수
function initApp() {
  // 자동 로그인 확인
  checkAutoLogin();
  
  // UI 초기화
  initNavigation();
  
  // 루틴 관련 핸들러 초기화
  initRoutineHandlers();
  
  // 이벤트 리스너 설정
  setupEventListeners();
}

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
export async function fetchUserData() {
  try {
    // 프로필 데이터 가져오기
    const response = await fetch('/api/user-stats', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    
    if (response.ok) {
      const userData = await response.json();
      
      // 사용자 통계 정보 업데이트
      document.getElementById('profile-routine-count').textContent = userData.routineCount;
      document.getElementById('profile-completed-count').textContent = userData.completedCount;
      
      // 개인 정보 업데이트
      const username = localStorage.getItem('username') || sessionStorage.getItem('username');
      document.getElementById('profile-username').textContent = username;
      document.getElementById('profile-display-name').value = username;
    }
    
    // 최근 루틴 및 오늘의 일정 가져오기
    fetchRecentRoutines();
    fetchTodaySchedule();
  } catch (error) {
    console.error('Fetch user data error:', error);
    showToast('오류', '사용자 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
  }
}

// 인증 토큰 가져오기
export function getAuthToken() {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// 글로벌로 필요한 함수들 내보내기
window.initCalendar = initCalendar;
window.showToast = showToast;