// app.js - 메인 애플리케이션 진입점 (완전 복구 버전)
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
window.login = login;
window.register = register;
window.logout = logout;

// hideToast 함수 추가
window.hideToast = function(id) {
  const toast = document.getElementById(id);
  if (toast) {
    toast.remove();
  }
};

// ✅ saveScheduleEdit 함수 정의
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

// 현재 편집 중인 루틴 ID
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
      
      // 루틴 관련 기능 초기화
      try {
        initRoutineHandlers();
        await Promise.all([
          fetchRecentRoutines(),
          fetchTodaySchedule()
        ]);
      } catch (error) {
        console.warn('⚠️ 루틴 기능 초기화 실패:', error);
      }
      
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
  if (mainContainer) mainContainer.style.display = 'flex';
  
  // 홈 페이지를 기본으로 표시
  showPage('home');
}

// 로그인 화면 표시
function showAuthPage() {
  const mainContainer = document.getElementById('main-container') || document.getElementById('app-container');
  const authContainer = document.getElementById('auth-container') || document.getElementById('login-container');
  
  if (mainContainer) mainContainer.style.display = 'none';
  if (authContainer) authContainer.style.display = 'flex';
}

// 페이지 전환 (수정된 버전)
function showPage(pageId) {
  console.log('🔄 페이지 전환:', pageId);
  
  // 모든 페이지 숨기기
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
    page.style.display = 'none';
  });
  
  // 모든 네비게이션 아이템 비활성화
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // 대상 페이지 표시
  const targetPage = document.getElementById(`${pageId}-page`);
  if (targetPage) {
    targetPage.classList.add('active');
    targetPage.style.display = 'block';
    console.log('✅ 페이지 표시됨:', pageId);
  } else {
    console.error('❌ 페이지를 찾을 수 없음:', `${pageId}-page`);
  }
  
  // 대상 네비게이션 활성화
  const targetNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (targetNav) {
    targetNav.classList.add('active');
  }
  
  // 특별한 페이지별 처리
  if (pageId === 'calendar') {
    console.log('📅 캘린더 페이지 활성화');
    setTimeout(() => {
      try {
        if (window.calendarModule?.initCalendar) {
          window.calendarModule.initCalendar();
        } else if (typeof initCalendar === 'function') {
          initCalendar();
        }
      } catch (error) {
        console.error('❌ 캘린더 초기화 실패:', error);
      }
    }, 100);
  } else if (pageId === 'profile') {
    // 프로필 페이지일 때 프로필 데이터 로드
    setTimeout(() => {
      if (typeof loadProfileData === 'function') {
        loadProfileData();
      }
    }, 100);
  } else if (pageId === 'home') {
    // 홈 페이지일 때 최신 데이터 로드
    setTimeout(() => {
      try {
        fetchRecentRoutines();
        fetchTodaySchedule();
      } catch (error) {
        console.warn('⚠️ 홈 데이터 로드 실패:', error);
      }
    }, 100);
  }
}

// 네비게이션 설정
function setupNavigation() {
  console.log('🧭 네비게이션 설정');
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      console.log('🖱️ 네비게이션 클릭:', page);
      if (page) {
        showPage(page);
      }
    });
  });
}

// 사용자 데이터 가져오기
async function fetchUserData() {
  console.log('📊 사용자 데이터 로드');
  try {
    // 프로필 데이터 로드
    if (typeof loadProfileData === 'function') {
      await loadProfileData();
    }
    
    // 루틴 데이터 로드
    await fetchRecentRoutines();
    await fetchTodaySchedule();
    
    console.log('✅ 사용자 데이터 로드 완료');
  } catch (error) {
    console.error('❌ 사용자 데이터 로드 실패:', error);
  }
}

// ✅ UI 이벤트 연결 (확장된 버전)
function setupEventListeners() {
  console.log('🎯 이벤트 리스너 설정');
  
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
  setupAuthTabs();

  // 로그아웃 버튼
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
    });
  }

  // 새 루틴 생성 버튼
  const createRoutineBtn = document.getElementById('create-routine-btn');
  if (createRoutineBtn) {
    createRoutineBtn.addEventListener('click', () => {
      console.log('🎯 새 루틴 생성 버튼 클릭');
      showModal('routine');
    });
  }

  // 모달 닫기 버튼들
  document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
      }
    });
  });

  // 모달 배경 클릭 시 닫기
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  console.log('✅ 이벤트 리스너 설정 완료');
}

// 로그인/회원가입 탭 설정
function setupAuthTabs() {
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
}

// Auth.js의 showApp 함수 재정의 (UI 연동 강화)
function enhanceShowApp() {
  const originalShowApp = showApp;
  
  window.showApp = function(userInfo) {
    console.log('🎭 앱 표시 (강화 버전):', userInfo);
    
    // 원본 showApp 실행
    originalShowApp(userInfo);
    
    // 추가 UI 설정
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    
    if (loginContainer) loginContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
    
    // 사용자 정보 표시
    let username, nickname;
    if (typeof userInfo === 'string') {
      username = userInfo;
      nickname = userInfo;
    } else if (userInfo && typeof userInfo === 'object') {
      username = userInfo.username || 'User';
      nickname = userInfo.nickname || userInfo.username || 'User';
    } else {
      username = 'User';
      nickname = 'User';
    }

    // 사용자 이름 표시 (여러 위치)
    const usernameDisplay = document.getElementById('username-display');
    const nicknameDisplay = document.getElementById('nickname-display');
    
    if (usernameDisplay) {
      usernameDisplay.textContent = nickname;
    }
    
    if (nicknameDisplay) {
      nicknameDisplay.textContent = `${nickname}님`;
    }

    // 홈 페이지로 이동
    setTimeout(() => {
      showPage('home');
    }, 100);

    console.log('✅ 앱 UI 표시 완료:', username);
  };
}

// DOMContentLoaded 시 실행
document.addEventListener('DOMContentLoaded', function initAppOnce() {
  console.log('🎯 DOM 로드 완료, 앱 초기화 시작');
  document.removeEventListener('DOMContentLoaded', initAppOnce);
  
  // showApp 함수 강화
  enhanceShowApp();
  
  // 앱 초기화
  initApp();
});

// 전역 함수 등록
window.showPage = showPage;
window.fetchUserData = fetchUserData;
window.initApp = initApp;

console.log('🔧 앱 모듈 로드됨 (완전 복구 버전)');