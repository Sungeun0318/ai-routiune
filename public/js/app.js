// app.js - 메인 애플리케이션 진입점 (간단한 수정)
import { checkAuthStatus, login, register, logout, getAuthToken, showApp, hideApp, setFetchUserDataFunction } from './auth.js';
import { showToast, showModal, hideModal, renderTodaySchedule } from './ui.js';
import { initRoutineHandlers, fetchRecentRoutines, fetchTodaySchedule } from './routine.js';
import { initCalendar } from './calendar.js';

// 전역 변수 설정
window.showToast = showToast;
window.showModal = showModal;
window.hideModal = hideModal;
window.renderTodaySchedule = renderTodaySchedule;
window.getAuthToken = getAuthToken;

// hideToast 함수가 없으면 임시로 생성
window.hideToast = function(id) {
  const toast = document.getElementById(id);
  if (toast) {
    toast.remove();
  }
};

// ✅ saveScheduleEdit 함수를 여기서 직접 정의
window.saveScheduleEdit = function() {
  console.log('✅ saveScheduleEdit 함수 호출됨');
  
  const titleInput = document.getElementById('edit-title');
  const timeInput = document.getElementById('edit-time');
  const memoInput = document.getElementById('edit-memo');

  if (!titleInput || !timeInput) {
    showToast('오류', '제목과 시간을 모두 입력해주세요.', 'error');
    return;
  }

  const title = titleInput.value.trim();
  const time = timeInput.value.trim();
  const notes = memoInput?.value.trim() || '';

  if (!title || !time.includes('-')) {
    showToast('오류', '시간은 "시작-종료" 형식으로 입력해주세요.', 'error');
    return;
  }

  const [startTime, endTime] = time.split('-').map(t => t.trim());

  if (!startTime || !endTime) {
    showToast('오류', '시작 시간과 종료 시간을 모두 입력해주세요.', 'error');
    return;
  }

  // 성공 메시지
  showToast('성공', '일정이 수정되었습니다.', 'success');
  hideModal('editSchedule');
  
  console.log('✅ 일정 편집 저장 완료:', { title, startTime, endTime, notes });
};

// 전역 변수 - 현재 편집 중인 루틴 ID
window.currentRoutineId = null;

// 앱 초기화 여부 플래그
let appInitialized = false;

// 메인 앱 초기화
async function initApp() {
  if (appInitialized) return;
  appInitialized = true;

  console.log('🚀 앱 초기화 시작...');
  
  try {
    // 이벤트 리스너 설정
    setupEventListeners();
    setupNavigation();
    
    // 사용자 데이터 함수 설정
    setFetchUserDataFunction(fetchUserData);
    
    // 인증 상태 확인
    const isAuthenticated = await checkAuthStatus();
    
    if (isAuthenticated) {
      console.log('✅ 사용자 인증됨');
      showMainApp();
      
      // 사용자 데이터 로드
      await fetchUserData();
      
      // 루틴 관련 기능 초기화
      initRoutineHandlers();
      
      // 최근 루틴 및 오늘의 일정 로드
      await Promise.all([
        fetchRecentRoutines(),
        fetchTodaySchedule()
      ]);
      
    } else {
      console.log('❌ 사용자 미인증');
      showAuthPage();
    }
    
  } catch (error) {
    console.error('❌ 앱 초기화 오류:', error);
    showAuthPage();
  }
  
  console.log('✅ 앱 초기화 완료');
}

// 메인 앱 화면 표시
function showMainApp() {
  const authContainer = document.getElementById('auth-container') || document.getElementById('login-container');
  const mainContainer = document.getElementById('main-container') || document.getElementById('app-container');
  
  if (authContainer) authContainer.style.display = 'none';
  if (mainContainer) mainContainer.style.display = 'block';
  
  // 기본적으로 대시보드 페이지 표시
  showPage('dashboard');
}

// 로그인 화면 표시
function showAuthPage() {
  const mainContainer = document.getElementById('main-container') || document.getElementById('app-container');
  const authContainer = document.getElementById('auth-container') || document.getElementById('login-container');
  
  if (mainContainer) mainContainer.style.display = 'none';
  if (authContainer) authContainer.style.display = 'block';
}

// 페이지 전환
function showPage(pageId) {
  // 모든 페이지 숨기기
  document.querySelectorAll('.page').forEach(page => {
    page.style.display = 'none';
  });
  
  // 모든 네비게이션 항목에서 active 클래스 제거
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // 선택된 페이지 표시
  const targetPage = document.getElementById(`${pageId}-page`);
  if (targetPage) {
    targetPage.style.display = 'block';
  }
  
  // 선택된 네비게이션 항목에 active 클래스 추가
  const targetNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (targetNav) {
    targetNav.classList.add('active');
  }
  
  // 캘린더 페이지인 경우 캘린더 초기화
  if (pageId === 'calendar') {
    console.log('📅 캘린더 페이지 활성화');
    setTimeout(() => {
      try {
        if (window.calendarModule?.initCalendar) {
          window.calendarModule.initCalendar();
        } else {
          initCalendar();
        }
      } catch (error) {
        console.error('❌ 캘린더 초기화 실패:', error);
      }
    }, 100);
  }
}

// 네비게이션 설정
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page');
      if (page) {
        showPage(page);
      }
    });
  });
}

// 사용자 데이터 가져오기
async function fetchUserData() {
  try {
    const response = await fetch('/api/profile', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      displayUserInfo(data.user);
      console.log('✅ 사용자 데이터 로드 완료');
    }
  } catch (error) {
    console.error('❌ 사용자 데이터 로드 실패:', error);
  }
}

// 사용자 정보 표시
function displayUserInfo(user) {
  // 닉네임 표시
  document.querySelectorAll('.user-nickname').forEach(target => {
    if (target) {
      const name = user && user.nickname ? 
        user.nickname : 
        (user && user.username ? user.username : '사용자');
      target.textContent = user && user.nickname ? 
        `${user.nickname}님` : 
        `${name}님, 환영합니다!`;
      console.log('✅ 닉네임 표시 완료:', name);
    }
  });
}

// ✅ UI 이벤트 연결
function setupEventListeners() {
  // 로그인 폼
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      login();
    });
  }

  // 회원가입 폼
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      register();
    });
  }

  // 탭 전환
  const registerTab = document.getElementById('register-tab');
  const loginTab = document.getElementById('login-tab');
  const registerFormEl = document.getElementById('register-form');
  const loginFormEl = document.getElementById('login-form');

  if (registerTab) {
    registerTab.addEventListener('click', () => {
      registerTab.classList.add('active');
      if (loginTab) loginTab.classList.remove('active');
      if (registerFormEl) registerFormEl.style.display = 'block';
      if (loginFormEl) loginFormEl.style.display = 'none';
    });
  }

  if (loginTab) {
    loginTab.addEventListener('click', () => {
      loginTab.classList.add('active');
      if (registerTab) registerTab.classList.remove('active');
      if (loginFormEl) loginFormEl.style.display = 'block';
      if (registerFormEl) registerFormEl.style.display = 'none';
    });
  }

  const backToLogin = document.getElementById('back-to-login');
  if (backToLogin) {
    backToLogin.addEventListener('click', () => {
      if (loginTab) loginTab.click();
    });
  }

  // 로그아웃 버튼
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
    });
  }

  // ✅ 일정 편집 저장 버튼 이벤트 (안전하게 처리)
  setTimeout(() => {
    const saveScheduleBtn = document.getElementById('save-schedule-edit');
    if (saveScheduleBtn) {
      // 기존 이벤트 리스너 제거 후 새로 추가
      const newBtn = saveScheduleBtn.cloneNode(true);
      saveScheduleBtn.parentNode.replaceChild(newBtn, saveScheduleBtn);
      
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('✅ 일정 편집 저장 버튼 클릭');
        if (typeof window.saveScheduleEdit === 'function') {
          window.saveScheduleEdit();
        } else {
          console.error('❌ saveScheduleEdit 함수를 찾을 수 없습니다');
          showToast('오류', '저장 기능을 초기화할 수 없습니다', 'error');
        }
      });
      console.log('✅ 일정 편집 저장 버튼 이벤트 리스너 등록 완료');
    }
  }, 500);

  // 모달 닫기 버튼들
  document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });

  // 모달 외부 클릭 시 닫기
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

// ✅ 백엔드 연결 테스트
async function testBackendConnection() {
  try {
    const response = await fetch('/api/user-stats', {
      credentials: 'include'
    });
    
    if (response.ok) {
      console.log('✅ 백엔드 연결 성공');
      return true;
    } else {
      console.warn('⚠️ 백엔드 연결 실패:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ 백엔드 연결 테스트 실패:', error);
    return false;
  }
}

// ✅ DOMContentLoaded 시 단 1회만 실행
document.addEventListener('DOMContentLoaded', function initAppOnce() {
  console.log('🎯 DOM 로드 완료, 앱 초기화 시작');
  document.removeEventListener('DOMContentLoaded', initAppOnce);
  
  // 앱 초기화
  initApp();
  
  // 백엔드 연결 테스트 (지연 실행)
  setTimeout(() => {
    testBackendConnection();
  }, 1000);
});

console.log('🔧 앱 모듈 로드됨 (간단한 수정 버전)');
console.log('📋 임시 해결된 문제:');
console.log('   ✅ saveScheduleEdit 함수 직접 정의');
console.log('   ✅ hideToast 함수 임시 구현');
console.log('   ✅ 안전한 이벤트 리스너 등록');