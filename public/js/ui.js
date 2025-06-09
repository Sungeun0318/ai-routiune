// ====================================
// UI 관련 조작 함수들 - 백엔드 연동 완전판
// ====================================

import { getAuthToken, getCurrentUser, authenticatedFetch } from './auth.js';

// 모달 요소 참조
const modals = {
  routine: () => document.getElementById('routine-modal'),
  routineItem: () => document.getElementById('routine-item-modal'),
  routineResult: () => document.getElementById('routine-result-modal'),
  editSchedule: () => document.getElementById('edit-schedule-modal'),
  eventDetail: () => document.getElementById('event-detail-modal')
};

// ✅ 토스트 메시지 표시
export function showToast(title, message, type = 'info') {
  console.log(`🔔 Toast [${type}]: ${title} - ${message}`);
  
  // 기존 토스트 제거
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // 토스트 생성
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-header">
        <strong>${title}</strong>
        <button class="toast-close">&times;</button>
      </div>
      <div class="toast-body">${message}</div>
    </div>
  `;

  // 스타일 적용
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    min-width: 300px;
    background: ${getToastColor(type)};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideInRight 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  // 내부 스타일
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .toast-content { padding: 12px 16px; }
    .toast-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .toast-header strong { font-size: 14px; }
    .toast-close { 
      background: none; border: none; color: white; font-size: 18px; 
      cursor: pointer; padding: 0; width: 20px; height: 20px;
      display: flex; align-items: center; justify-content: center;
    }
    .toast-body { font-size: 13px; opacity: 0.9; line-height: 1.4; }
  `;

  document.head.appendChild(style);
  document.body.appendChild(toast);

  // 닫기 버튼 이벤트
  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      toast.remove();
      style.remove();
    });
  }

  // 자동 제거 (5초)
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
      style.remove();
    }
  }, 5000);
}

// ✅ 토스트 색상 반환
function getToastColor(type) {
  const colors = {
    success: '#28a745',
    error: '#dc3545', 
    warning: '#ffc107',
    info: '#17a2b8'
  };
  return colors[type] || colors.info;
}

// ✅ 모달 표시
export function showModal(modalName) {
  console.log(`🔲 모달 열기: ${modalName}`);
  
  const modal = modals[modalName]?.();
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
    
    // 포커스 설정
    const firstInput = modal.querySelector('input, textarea, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
    
    // ESC 키로 닫기
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        hideModal(modalName);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
  } else {
    console.error(`❌ 모달을 찾을 수 없음: ${modalName}`);
  }
}

// ✅ 모달 숨김
export function hideModal(modalName) {
  console.log(`🔲 모달 닫기: ${modalName}`);
  
  const modal = modals[modalName]?.();
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

// ✅ 네비게이션 초기화
export function initNavigation() {
  console.log('🧭 네비게이션 초기화 중...');
  
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  
  console.log(`📋 네비게이션 항목: ${navItems.length}개`);
  console.log(`📋 페이지: ${pages.length}개`);
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 모든 네비게이션 아이템에서 active 클래스 제거
      navItems.forEach(navItem => navItem.classList.remove('active'));
      
      // 클릭된 아이템에 active 클래스 추가
      item.classList.add('active');
      
      // 페이지 전환
      const pageName = item.getAttribute('data-page');
      console.log(`🔄 페이지 전환: ${pageName}`);
      
      // 모든 페이지 숨기기
      pages.forEach(page => {
        page.classList.remove('active');
      });
      
      // 해당 페이지 표시
      const targetPage = document.getElementById(`${pageName}-page`);
      if (targetPage) {
        targetPage.classList.add('active');
        console.log(`✅ 페이지 표시됨: ${pageName}`);
        
        // 페이지별 초기화 작업
        handlePageSpecificInit(pageName);
        
      } else {
        console.error(`❌ 페이지를 찾을 수 없음: ${pageName}-page`);
      }
    });
  });
  
  console.log('✅ 네비게이션 초기화 완료');
}

// ✅ 페이지별 초기화 작업
function handlePageSpecificInit(pageName) {
  switch (pageName) {
    case 'calendar':
      console.log('📅 캘린더 페이지 초기화');
      setTimeout(() => {
        try {
          if (window.calendarModule?.initCalendar) {
            window.calendarModule.initCalendar();
          } else if (window.initCalendar) {
            window.initCalendar();
          }
        } catch (error) {
          console.error('❌ 캘린더 초기화 실패:', error);
        }
      }, 100);
      break;
      
    case 'profile':
      console.log('👤 프로필 페이지 초기화');
      setTimeout(() => {
        loadProfileData();
      }, 100);
      break;
      
    case 'home':
      console.log('🏠 홈 페이지 초기화');
      setTimeout(() => {
        try {
          fetchRecentRoutines();
          fetchTodaySchedule();
        } catch (error) {
          console.warn('⚠️ 홈 데이터 로드 실패:', error);
        }
      }, 100);
      break;
  }
}

// ✅ 프로필 데이터 로드
async function loadProfileData() {
  try {
    console.log('📄 프로필 데이터 로딩 시작...');
    
    const response = await authenticatedFetch('/api/profile');
    
    console.log('🔍 프로필 응답 상태:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📄 프로필 데이터:', result);
    
    if (result.success && result.user) {
      updateProfileDisplay(result.user);
    } else {
      throw new Error(result.error || '프로필 데이터 로딩 실패');
    }
    
  } catch (error) {
    console.error('❌ 프로필 로딩 오류:', error);
    showToast('오류', '프로필 정보를 불러오는 중 오류가 발생했습니다.', 'error');
  }
}

// ✅ 프로필 정보 업데이트
async function updateProfile() {
  try {
    console.log('✏️ 프로필 업데이트 시작...');
    
    const formData = {
      displayName: document.getElementById('profile-display-name')?.value?.trim() || '',
      email: document.getElementById('profile-email')?.value?.trim() || '',
      currentPassword: document.getElementById('profile-password')?.value || '',
      newPassword: document.getElementById('profile-confirm-password')?.value || ''
    };
    
    console.log('📝 프로필 폼 데이터:', {
      displayName: formData.displayName,
      email: formData.email,
      hasCurrentPassword: !!formData.currentPassword,
      hasNewPassword: !!formData.newPassword
    });
    
    // 비밀번호 변경 유효성 검사
    if (formData.newPassword && !formData.currentPassword) {
      showToast('오류', '비밀번호를 변경하려면 현재 비밀번호를 입력해주세요.', 'error');
      return;
    }
    
    if (formData.newPassword && formData.newPassword.length < 4) {
      showToast('오류', '새 비밀번호는 최소 4자리 이상이어야 합니다.', 'error');
      return;
    }
    
    const response = await authenticatedFetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(formData)
    });
    
    console.log('🔍 프로필 업데이트 응답:', response.status);
    const result = await response.json();
    console.log('📄 프로필 업데이트 결과:', result);
    
    if (!response.ok) {
      throw new Error(result.error || '프로필 업데이트 실패');
    }
    
    if (result.success) {
      showToast('성공', result.message || '프로필이 성공적으로 수정되었습니다.', 'success');
      
      // 폼 리셋 (비밀번호 필드만)
      const passwordField = document.getElementById('profile-password');
      const confirmPasswordField = document.getElementById('profile-confirm-password');
      if (passwordField) passwordField.value = '';
      if (confirmPasswordField) confirmPasswordField.value = '';
      
      // 프로필 데이터 새로고침
      setTimeout(() => {
        loadProfileData();
      }, 500);
    } else {
      throw new Error(result.error || '프로필 업데이트 실패');
    }
    
  } catch (error) {
    console.error('❌ 프로필 업데이트 오류:', error);
    showToast('오류', error.message, 'error');
  }
}

// ✅ 프로필 디스플레이 업데이트
function updateProfileDisplay(profileData) {
  console.log('🖼️ 프로필 디스플레이 업데이트:', profileData);
  
  try {
    // 기본 정보 표시
    const usernameDisplay = document.getElementById('username-display');
    const nicknameDisplay = document.getElementById('nickname-display');
    const profileUsername = document.getElementById('profile-username');
    const profileJoinDate = document.getElementById('profile-join-date');
    const profileRoutineCount = document.getElementById('profile-routine-count');
    const profileCompletedCount = document.getElementById('profile-completed-count');
    
    const displayName = profileData.nickname || profileData.displayName || profileData.username;
    
    if (usernameDisplay) {
      usernameDisplay.textContent = displayName;
    }
    if (nicknameDisplay) {
      nicknameDisplay.textContent = `${displayName}님`;
    }
    if (profileUsername) {
      profileUsername.textContent = displayName;
    }
    if (profileJoinDate) {
      profileJoinDate.textContent = `가입일: ${profileData.joinDate || '알 수 없음'}`;
    }
    if (profileRoutineCount) {
      profileRoutineCount.textContent = profileData.routineCount || 0;
    }
    if (profileCompletedCount) {
      profileCompletedCount.textContent = profileData.completedCount || 0;
    }
    
    // 폼 필드 채우기
    const displayNameInput = document.getElementById('profile-display-name');
    const emailInput = document.getElementById('profile-email');
    
    if (displayNameInput) {
      displayNameInput.value = displayName || '';
    }
    if (emailInput) {
      emailInput.value = profileData.email || '';
    }
    
    console.log('✅ 프로필 디스플레이 업데이트 완료');
    
  } catch (error) {
    console.error('❌ 프로필 디스플레이 업데이트 오류:', error);
  }
}

// ✅ 최근 루틴 가져오기
export async function fetchRecentRoutines() {
  try {
    console.log('📋 최근 루틴 가져오는 중...');
    
    const response = await authenticatedFetch('/api/routines/recent');

    console.log('🔍 루틴 응답 상태:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📋 받아온 루틴 데이터:', result);

    // 다양한 응답 형태 처리
    const routines = result.routines || result.data || result || [];
    
    if (Array.isArray(routines)) {
      renderRecentRoutines(routines);
      return routines;
    } else {
      console.warn('⚠️ 예상하지 못한 루틴 데이터 형태:', result);
      renderRecentRoutines([]);
      return [];
    }

  } catch (error) {
    console.error('❌ 최근 루틴 가져오기 실패:', error);
    renderRecentRoutines([]);
    showToast('오류', '최근 루틴을 불러오는 중 문제가 발생했습니다.', 'error');
    return [];
  }
}

// ✅ 오늘 일정 가져오기
export async function fetchTodaySchedule() {
  try {
    console.log('📅 오늘 일정 가져오는 중...');
    
    const response = await authenticatedFetch('/api/schedule/today');

    console.log('🔍 일정 응답 상태:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📅 받아온 일정 데이터:', result);

    // 다양한 응답 형태 처리
    const schedule = result.schedule || result.data || result || [];
    
    if (Array.isArray(schedule)) {
      renderTodaySchedule(schedule);
      updateProgressBar(schedule);
      return schedule;
    } else {
      console.warn('⚠️ 예상하지 못한 일정 데이터 형태:', result);
      renderTodaySchedule([]);
      return [];
    }

  } catch (error) {
    console.error('❌ 오늘 일정 가져오기 실패:', error);
    renderTodaySchedule([]);
    showToast('오류', '오늘 일정을 불러오는 중 문제가 발생했습니다.', 'error');
    return [];
  }
}

// ✅ 최근 루틴 렌더링
export function renderRecentRoutines(routines) {
  const container = document.getElementById('recent-routines-list');
  if (!container) {
    console.error('❌ Recent routines container not found');
    return;
  }

  container.innerHTML = '';

  if (!routines || routines.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ri-calendar-todo-line"></i>
        <p>생성된 루틴이 없습니다.<br>새 루틴을 생성해보세요!</p>
      </div>
    `;
    return;
  }

  routines.slice(0, 3).forEach(routine => {
    const title = routine.title || '제목 없음';
    const subjects = (routine.subjects || []).join(', ') || '미지정';
    const date = routine.createdAt || '날짜 미지정';
    
    const routineCard = document.createElement('div');
    routineCard.className = 'routine-card';
    routineCard.innerHTML = `
      <div class="routine-card-header">
        <h4>${title}</h4>
        <span class="routine-date">${date}</span>
      </div>
      <div class="routine-card-body">
        <p><strong>과목:</strong> ${subjects}</p>
      </div>
    `;
    
    // 클릭 이벤트 추가 (루틴 상세보기)
    routineCard.addEventListener('click', () => {
      console.log('📋 루틴 카드 클릭:', routine.id);
      // 루틴 상세보기 모달 또는 페이지로 이동
    });
    
    container.appendChild(routineCard);
  });

  console.log(`✅ 최근 루틴 ${routines.length}개 렌더링 완료`);
}

// ✅ 오늘 일정 렌더링
export function renderTodaySchedule(schedule) {
  const container = document.getElementById('today-schedule-list');
  if (!container) {
    console.error('❌ Today schedule container not found');
    return;
  }

  container.innerHTML = '';

  if (!schedule || schedule.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ri-calendar-line"></i>
        <p>오늘 예정된 일정이 없습니다.<br>새로운 일정을 추가해보세요!</p>
      </div>
    `;
    return;
  }

  schedule.forEach(item => {
    const scheduleItem = document.createElement('div');
    scheduleItem.className = `schedule-item ${item.completed ? 'completed' : ''}`;
    scheduleItem.innerHTML = `
      <div class="schedule-time">${item.time}</div>
      <div class="schedule-content">
        <h4>${item.title}</h4>
        ${item.subject ? `<span class="schedule-subject">${item.subject}</span>` : ''}
        ${item.notes ? `<p class="schedule-notes">${item.notes}</p>` : ''}
      </div>
      <div class="schedule-actions">
        <button class="btn-complete ${item.completed ? 'completed' : ''}" 
                onclick="toggleScheduleComplete('${item.id}')">
          ${item.completed ? '✓' : '○'}
        </button>
      </div>
    `;
    
    container.appendChild(scheduleItem);
  });

  console.log(`✅ 오늘 일정 ${schedule.length}개 렌더링 완료`);
}

// ✅ 일정 완료 상태 토글
window.toggleScheduleComplete = async function(eventId) {
  try {
    console.log('✅ 일정 완료 토글:', eventId);
    
    const response = await authenticatedFetch(`/api/schedule/complete/${eventId}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      showToast('성공', result.message, 'success');
      
      // 오늘 일정 새로고침
      await fetchTodaySchedule();
    } else {
      throw new Error(result.error || '완료 상태 변경 실패');
    }

  } catch (error) {
    console.error('❌ 일정 완료 토글 실패:', error);
    showToast('오류', '완료 상태를 변경하는 중 오류가 발생했습니다.', 'error');
  }
};

// ✅ 진행률 바 업데이트
function updateProgressBar(schedule) {
  const bar = document.getElementById('overall-progress');
  const text = document.getElementById('overall-progress-text');
  
  if (!bar || !text || !schedule || schedule.length === 0) {
    if (bar) bar.value = 0;
    if (text) text.textContent = '0%';
    return;
  }

  const completedCount = schedule.filter(item => item.completed).length;
  const percent = Math.round((completedCount / schedule.length) * 100);

  bar.value = percent;
  text.textContent = `${percent}%`;
  
  console.log(`📊 진행률 업데이트: ${completedCount}/${schedule.length} (${percent}%)`);
}

// ✅ 앱 화면 표시
export function showApp(userData) {
  console.log('🎯 앱 화면 표시:', userData);
  
  const loginContainer = document.getElementById('login-container') || document.getElementById('auth-container');
  const appContainer = document.getElementById('app-container') || document.getElementById('main-container');
  
  if (loginContainer) {
    loginContainer.style.display = 'none';
    console.log('✅ 로그인 컨테이너 숨김');
  }
  
  if (appContainer) {
    appContainer.style.display = 'flex';
    console.log('✅ 앱 컨테이너 표시');
  }

  // 사용자 정보 표시
  const nicknameSpan = document.getElementById('nickname-display');
  const usernameDisplay = document.getElementById('username-display');
  const displayName = userData.nickname || userData.displayName || userData.username;

  if (nicknameSpan) {
    nicknameSpan.textContent = `${displayName}님`;
  }
  
  if (usernameDisplay) {
    usernameDisplay.textContent = displayName;
  }

  // 프로필 정보 업데이트
  const profileUsername = document.getElementById('profile-username');
  if (profileUsername) {
    profileUsername.textContent = displayName;
  }
  
  // 홈 페이지가 기본으로 표시되도록 확인
  showHomePage();
}

// ✅ 앱 화면 숨김
export function hideApp() {
  console.log('🎯 앱 화면 숨김');
  
  const appContainer = document.getElementById('app-container') || document.getElementById('main-container');
  const loginContainer = document.getElementById('login-container') || document.getElementById('auth-container');
  
  if (appContainer) {
    appContainer.style.display = 'none';
  }
  
  if (loginContainer) {
    loginContainer.style.display = 'flex';
  }
  
  // 로그인 탭 활성화
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  if (loginTab && registerTab && loginForm && registerForm) {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  }
}

// ✅ 홈 페이지 표시
function showHomePage() {
  // 모든 네비게이션 아이템에서 active 제거
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // 모든 페이지에서 active 제거
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // 홈 네비게이션과 홈 페이지 활성화
  const homeNavItem = document.querySelector('.nav-item[data-page="home"]');
  const homePage = document.getElementById('home-page');
  
  if (homeNavItem) {
    homeNavItem.classList.add('active');
  }
  
  if (homePage) {
    homePage.classList.add('active');
  }
  
  console.log('✅ 홈 페이지 표시됨');
  
  // 홈 데이터 로드
  setTimeout(() => {
    try {
      fetchRecentRoutines();
      fetchTodaySchedule();
    } catch (error) {
      console.warn('⚠️ 홈 데이터 로드 실패:', error);
    }
  }, 100);
}

// ✅ 프로필 폼 핸들러 초기화
function initProfileHandlers() {
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateProfile();
    });
    console.log('✅ 프로필 폼 핸들러 연결됨');
  }
}

// ✅ 탭 초기화 (로그인/회원가입 탭)
function initTabs(tabsSelector, tabSelector, paneSelector) {
  const tabsContainer = document.querySelector(tabsSelector);
  if (!tabsContainer) return;

  const tabs = tabsContainer.querySelectorAll(tabSelector);
  const panes = document.querySelectorAll(paneSelector);

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 모든 탭에서 active 제거
      tabs.forEach(t => t.classList.remove('active'));
      
      // 클릭된 탭에 active 추가
      tab.classList.add('active');
      
      // 해당하는 패널 표시
      const target = tab.getAttribute('data-target') || tab.getAttribute('href')?.replace('#', '');
      if (target) {
        panes.forEach(pane => {
          if (pane.id === target || pane.classList.contains(target)) {
            pane.style.display = 'block';
          } else {
            pane.style.display = 'none';
          }
        });
      }
    });
  });
}

// ✅ 모든 UI 초기화
export function initUI() {
  console.log('🎨 UI 초기화 시작...');
  
  // 네비게이션 초기화
  initNavigation();
  
  // 프로필 핸들러 초기화
  initProfileHandlers();
  
  // 탭 초기화
  initTabs('.auth-tabs', '.tab', '.auth-form');
  initTabs('.tabs', '.tab', '.tab-pane');
  
  // 모달 이벤트 연결
  setupModalEvents();
  
  console.log('✅ UI 초기화 완료');
}

// ✅ 모달 이벤트 설정
function setupModalEvents() {
  // 모달 닫기 버튼들
  document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    });
  });

  // 모달 배경 클릭 시 닫기
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    });
  });
  
  console.log('✅ 모달 이벤트 설정 완료');
}

// ✅ 로딩 스피너 표시/숨김
export function showLoading(message = '로딩 중...') {
  const existingLoader = document.querySelector('.loading-overlay');
  if (existingLoader) {
    existingLoader.remove();
  }

  const loader = document.createElement('div');
  loader.className = 'loading-overlay';
  loader.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p>${message}</p>
    </div>
  `;
  
  loader.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    .loading-content {
      background: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #4361ee;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(loader);
}

export function hideLoading() {
  const loader = document.querySelector('.loading-overlay');
  if (loader) {
    loader.remove();
  }
}

// ✅ 컨펌 다이얼로그
export function showConfirm(title, message, onConfirm, onCancel) {
  const existingConfirm = document.querySelector('.confirm-overlay');
  if (existingConfirm) {
    existingConfirm.remove();
  }

  const confirm = document.createElement('div');
  confirm.className = 'confirm-overlay';
  confirm.innerHTML = `
    <div class="confirm-content">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="confirm-buttons">
        <button class="btn-cancel">취소</button>
        <button class="btn-confirm">확인</button>
      </div>
    </div>
  `;
  
  confirm.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    .confirm-content {
      background: white;
      padding: 25px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      min-width: 300px;
    }
    .confirm-content h3 {
      margin: 0 0 15px 0;
      color: #333;
    }
    .confirm-content p {
      margin: 0 0 20px 0;
      color: #666;
      line-height: 1.5;
    }
    .confirm-buttons {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    .confirm-buttons button {
      padding: 8px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-cancel {
      background: #6c757d;
      color: white;
    }
    .btn-confirm {
      background: #dc3545;
      color: white;
    }
    .btn-cancel:hover {
      background: #5a6268;
    }
    .btn-confirm:hover {
      background: #c82333;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(confirm);
  
  // 이벤트 연결
  const cancelBtn = confirm.querySelector('.btn-cancel');
  const confirmBtn = confirm.querySelector('.btn-confirm');
  
  const cleanup = () => {
    confirm.remove();
    style.remove();
  };
  
  cancelBtn.addEventListener('click', () => {
    cleanup();
    if (onCancel) onCancel();
  });
  
  confirmBtn.addEventListener('click', () => {
    cleanup();
    if (onConfirm) onConfirm();
  });
  
  // ESC 키로 취소
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      cleanup();
      if (onCancel) onCancel();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

// ✅ 전역 함수로 노출 (HTML에서 직접 호출 가능)
window.showModal = showModal;
window.hideModal = hideModal;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showConfirm = showConfirm;

// ✅ 레거시 호환성 함수들
export function updateProfileData(userData) {
  if (!userData) return;
  console.log('🔄 프로필 데이터 업데이트 (레거시):', userData);
  updateProfileDisplay(userData);
}

export function handleProfileUpdate(formData, onSuccess) {
  console.log('🔄 프로필 업데이트 핸들링 (레거시):', formData);
  
  updateProfile().then(() => {
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess();
    }
  }).catch(error => {
    console.error('❌ 프로필 업데이트 실패:', error);
  });
}

console.log('✅ ui.js 모듈 로드 완료');