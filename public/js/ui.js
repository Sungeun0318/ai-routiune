// UI 관련 조작 함수들 - 백엔드 연동 버전
import { getAuthToken } from './auth.js';

// 모달 요소 참조
const modals = {
  routine: () => document.getElementById('routine-modal'),
  routineItem: () => document.getElementById('routine-item-modal'),
  routineResult: () => document.getElementById('routine-result-modal'),
  editSchedule: () => document.getElementById('edit-schedule-modal'),
  eventDetail: () => document.getElementById('event-detail-modal')
};

// 네비게이션 초기화
export function initNavigation() {
  console.log('Initializing navigation...');
  
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  
  console.log('Found nav items:', navItems.length);
  console.log('Found pages:', pages.length);
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 모든 네비게이션 아이템에서 active 클래스 제거
      navItems.forEach(navItem => navItem.classList.remove('active'));
      
      // 클릭된 아이템에 active 클래스 추가
      item.classList.add('active');
      
      // 페이지 전환
      const pageName = item.getAttribute('data-page');
      console.log('Switching to page:', pageName);
      
      // 모든 페이지 숨기기
      pages.forEach(page => {
        page.classList.remove('active');
      });
      
      // 해당 페이지 표시
      const targetPage = document.getElementById(`${pageName}-page`);
      if (targetPage) {
        targetPage.classList.add('active');
        console.log('Page switched to:', pageName);
        
        // 캘린더 페이지인 경우 캘린더 초기화
        if (pageName === 'calendar') {
          setTimeout(() => {
            if (window.calendarModule && window.calendarModule.initCalendar) {
              console.log('Initializing calendar...');
              window.calendarModule.initCalendar();
            } else if (window.initCalendar) {
              console.log('Initializing calendar (legacy)...');
              window.initCalendar();
            } else {
              console.error('Calendar initialization function not found');
            }
          }, 100);
        }
        
        // 프로필 페이지인 경우 프로필 데이터 로드
        if (pageName === 'profile') {
          loadProfileData();
        }
      } else {
        console.error('Target page not found:', `${pageName}-page`);
      }
    });
  });
  
  // 탭 초기화
  initTabs('.auth-tabs', '.tab', '.auth-form');
  initTabs('.tabs', '.tab', '.tab-pane');
  
  // 프로필 폼 핸들러 초기화
  initProfileHandlers();
}

// 프로필 관련 핸들러 초기화
function initProfileHandlers() {
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateProfile();
    });
  }
}

// 프로필 데이터 로드
async function loadProfileData() {
  try {
    const response = await fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const profileData = await response.json();
    updateProfileDisplay(profileData);
    
  } catch (error) {
    console.error('❌ Error loading profile:', error);
    showToast('오류', '프로필 정보를 불러오는 중 오류가 발생했습니다.', 'error');
  }
}

// 프로필 정보 업데이트
async function updateProfile() {
  try {
    const formData = {
      displayName: document.getElementById('profile-display-name').value.trim(),
      email: document.getElementById('profile-email').value.trim(),
      currentPassword: document.getElementById('profile-password').value,
      newPassword: document.getElementById('profile-confirm-password').value
    };
    
    // 비밀번호 변경 유효성 검사
    if (formData.newPassword && !formData.currentPassword) {
      showToast('오류', '비밀번호를 변경하려면 현재 비밀번호를 입력해주세요.', 'error');
      return;
    }
    
    if (formData.newPassword && formData.newPassword.length < 4) {
      showToast('오류', '새 비밀번호는 최소 4자리 이상이어야 합니다.', 'error');
      return;
    }
    
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '프로필 업데이트 실패');
    }
    
    showToast('성공', result.message, 'success');
    
    // 폼 리셋 (비밀번호 필드만)
    document.getElementById('profile-password').value = '';
    document.getElementById('profile-confirm-password').value = '';
    
    // 프로필 데이터 새로고침
    loadProfileData();
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    showToast('오류', error.message, 'error');
  }
}

// 프로필 디스플레이 업데이트
function updateProfileDisplay(profileData) {
  // 기본 정보 표시
  const usernameDisplay = document.getElementById('username-display');
  const profileUsername = document.getElementById('profile-username');
  const profileJoinDate = document.getElementById('profile-join-date');
  const profileRoutineCount = document.getElementById('profile-routine-count');
  const profileCompletedCount = document.getElementById('profile-completed-count');
  
  if (usernameDisplay) usernameDisplay.textContent = profileData.username;
  if (profileUsername) profileUsername.textContent = profileData.displayName || profileData.username;
  if (profileJoinDate) profileJoinDate.textContent = `가입일: ${profileData.joinDate}`;
  if (profileRoutineCount) profileRoutineCount.textContent = profileData.routineCount || 0;
  if (profileCompletedCount) profileCompletedCount.textContent = profileData.completedCount || 0;
  
  // 폼 필드 채우기
  const displayNameInput = document.getElementById('profile-display-name');
  const emailInput = document.getElementById('profile-email');
  
  if (displayNameInput) displayNameInput.value = profileData.displayName || profileData.username;
  if (emailInput) emailInput.value = profileData.email || '';
}

// 앱 화면 표시
export function showApp({username, nickname}) {
  console.log('Showing app for user:', username, nickname);
  
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');
  

  const nicknameSpan = document.getElementById('nickname-display');
const displayName = nickname || username;
console.log('💬 표시될 사용자 이름:', displayName); // 디버깅 로그

if (nicknameSpan) {
  nicknameSpan.textContent = `${displayName}님`;  
}

  
  if (loginContainer) {
    loginContainer.style.display = 'none';
    console.log('Login container hidden');
  }
  
  if (appContainer) {
    appContainer.style.display = 'flex';
    console.log('App container shown');
  }

  const profileUsername = document.getElementById('profile-username');
  if (profileUsername) {
    profileUsername.textContent = nickname || username;
  }
  
  // 홈 페이지가 기본으로 표시되도록 확인
  const homeNavItem = document.querySelector('.nav-item[data-page="home"]');
  const homePage = document.getElementById('home-page');
  
  if (homeNavItem && homePage) {
    // 모든 네비게이션 아이템에서 active 제거
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // 모든 페이지에서 active 제거
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });
    
    // 홈 네비게이션과 홈 페이지 활성화
    homeNavItem.classList.add('active');
    homePage.classList.add('active');
    
    console.log('Home page set as default');
    fetchRecentRoutines(); // 홈 진입 시 루틴 목록 최신화
  }
}

// 앱 화면 숨기기
export function hideApp() {
  console.log('Hiding app');
  
  const appContainer = document.getElementById('app-container');
  const loginContainer = document.getElementById('login-container');
  
  if (appContainer) {
    appContainer.style.display = 'none';
  }
  
  if (loginContainer) {
    loginContainer.style.display = 'flex';
  }
  
  // 로그인 탭 활성화
  const loginTab = document.getElementById('login-tab');
  if (loginTab) {
    loginTab.click();
  }
}

// 모달 제어 함수들
export function showModal(modalName) {
  console.log('Showing modal:', modalName);
  
  if (modals[modalName]) {
    const modal = modals[modalName]();
    if (modal) {
      modal.classList.add('active');
    } else {
      console.error('Modal element not found:', modalName);
    }
  } else {
    console.error('Modal not defined:', modalName);
  }
}

export function hideModal(modalName) {
  console.log('Hiding modal:', modalName);
  
  if (modals[modalName]) {
    const modal = modals[modalName]();
    if (modal) {
      modal.classList.remove('active');
    }
  }
}

export function closeAllModals() {
  console.log('Closing all modals');
  
  Object.keys(modals).forEach(key => {
    const modal = modals[key]();
    if (modal) {
      modal.classList.remove('active');
    }
  });
}

// 토스트 알림 표시
export function showToast(title, message, type = 'info') {
  console.log('Showing toast:', title, message, type);
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon;
  switch (type) {
    case 'success':
      icon = 'ri-checkbox-circle-line';
      break;
    case 'error':
      icon = 'ri-error-warning-line';
      break;
    case 'warning':
      icon = 'ri-alert-line';
      break;
    default:
      icon = 'ri-information-line';
  }
  
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="${icon}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  const toastContainer = document.getElementById('toast-container');
  if (toastContainer) {
    toastContainer.appendChild(toast);
    
    // 애니메이션 추가
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  } else {
    console.error('Toast container not found');
  }
}

// 탭 전환 기능
export function initTabs(containerSelector, tabSelector, contentSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.log('Tab container not found:', containerSelector);
    return;
  }
  
  const tabs = container.querySelectorAll(tabSelector);
  const contents = container.querySelectorAll(contentSelector);
  
  console.log('Initializing tabs:', tabs.length, 'contents:', contents.length);
  
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 탭 활성화
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // 컨텐츠 활성화
      const targetId = tab.getAttribute('data-tab');
      if (targetId) {
        contents.forEach(content => {
          content.classList.remove('active');
          if (content.id === targetId) {
            content.classList.add('active');
          }
        });
      } else {
        // data-tab이 없는 경우 (로그인/회원가입 탭)
        if (tab.id === 'login-tab') {
          document.getElementById('login-form').style.display = 'block';
          document.getElementById('register-form').style.display = 'none';
        } else if (tab.id === 'register-tab') {
          document.getElementById('login-form').style.display = 'none';
          document.getElementById('register-form').style.display = 'block';
        }
      }
    });
  });
}

// DOM 요소 렌더링 함수들
export function renderRecentRoutines(routines, mode = 'card') {
  const container = document.getElementById('recent-routines-list');
  if (!container) {
    console.error('Recent routines container not found');
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
    const date = routine.createdAt 
      ? new Date(routine.createdAt).toISOString().split('T')[0] 
      : '날짜 없음';

    const el = document.createElement('div');
    el.className = 'routine-card';

    el.innerHTML = `
      <h3>${title}</h3>
      <p>과목: ${subjects}</p>
      <p>생성일: ${date}</p>
    `;

    container.appendChild(el);
  });
}


export function renderTodaySchedule(schedule, containerId = 'today-schedule-list') {
  console.log('Rendering today schedule:', schedule.length);

  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Today schedule container not found:', containerId);
    return;
  }

  container.innerHTML = '';

  if (!schedule || schedule.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ri-calendar-line"></i>
        <p>오늘 예정된 일정이 없습니다.</p>
      </div>
    `;
    updateOverallProgress([]);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'schedule-list';

  schedule.forEach(item => {
    const li = document.createElement('li');
    li.className = 'schedule-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.completed;
    checkbox.setAttribute('data-event-id', item.id);

    // 체크 상태가 바뀌면 서버에 업데이트 요청
    checkbox.addEventListener('change', async () => {
      item.completed = checkbox.checked;
      updateOverallProgress(schedule);
      
      // 서버에 완료 상태 업데이트
      try {
        await fetch(`/api/calendar/events/${item.id}/complete`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        });
        
        // 캘린더도 새로고침 (있는 경우)
        if (window.calendarModule?.refreshCalendar) {
          window.calendarModule.refreshCalendar();
        }
        
      } catch (error) {
        console.error('❌ Error updating completion status:', error);
        // 에러 시 체크박스 원래 상태로 되돌리기
        checkbox.checked = !checkbox.checked;
        item.completed = checkbox.checked;
        updateOverallProgress(schedule);
      }
    });

    const timeDiv = document.createElement('div');
    timeDiv.className = 'schedule-time';
    timeDiv.textContent = item.time;

    const taskDiv = document.createElement('div');
    taskDiv.className = 'schedule-task';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    titleDiv.textContent = item.title;

    // 과목 정보가 있으면 표시
    if (item.subject) {
      const subjectDiv = document.createElement('div');
      subjectDiv.className = 'subject';
      subjectDiv.textContent = item.subject;
      subjectDiv.style.fontSize = '0.8rem';
      subjectDiv.style.color = 'var(--text-light)';
      taskDiv.appendChild(subjectDiv);
    }

    taskDiv.appendChild(titleDiv);
    li.appendChild(checkbox);
    li.appendChild(timeDiv);
    li.appendChild(taskDiv);

    ul.appendChild(li);
  });

  container.appendChild(ul);

  // 초기 렌더링 시 전체 progress 업데이트
  updateOverallProgress(schedule);
}

// 오늘의 전체 완료율 계산 및 반영
export function updateOverallProgress(schedule) {
  const bar = document.getElementById('overall-progress-bar');
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
  
  console.log(`📊 Progress updated: ${completedCount}/${schedule.length} (${percent}%)`);
}

// 프로필 데이터 업데이트 (레거시 호환)
export function updateProfileData(userData) {
  if (!userData) return;
  
  console.log('Updating profile data:', userData);
  updateProfileDisplay(userData);
}

export function handleProfileUpdate(formData, onSuccess) {
  console.log('Handling profile update:', formData);
  
  // 프로필 업데이트 로직
  if (onSuccess && typeof onSuccess === 'function') {
    onSuccess();
  }
}

// 전역 함수로 노출 (다른 모듈에서 접근 가능하도록)
window.showModal = showModal;
window.hideModal = hideModal;

// ... 위의 코드들 (window.hideModal 까지 끝난 후)

export async function fetchRecentRoutines() {
  try {
    const response = await fetch('/api/routines/recent', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`루틴 목록 가져오기 실패: ${response.status}`);
    }

    const routines = await response.json();
    console.log('✅ 받아온 루틴 목록:', routines);

    renderRecentRoutines(routines);
  } catch (error) {
    console.error('❌ 최근 루틴 불러오기 실패:', error);
    showToast('오류', '최근 루틴을 불러오는 중 문제가 발생했습니다.', 'error');
  }
}
