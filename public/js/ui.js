// UI 관련 조작 함수들
import { fetchUserData } from './app.js';

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
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(navItem => navItem.classList.remove('active'));
      item.classList.add('active');
      
      const pageName = item.getAttribute('data-page');
      pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === `${pageName}-page`) {
          page.classList.add('active');
          
          // 캘린더 페이지인 경우 캘린더 초기화
          if (pageName === 'calendar' && window.initCalendar) {
            window.initCalendar();
          }
        }
      });
    });
  });
}

// 앱 화면 표시
export function showApp(username) {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('app-container').style.display = 'flex';
  
  document.getElementById('username-display').textContent = username;
  document.getElementById('profile-username').textContent = username;
}

// 앱 화면 숨기기
export function hideApp() {
  document.getElementById('app-container').style.display = 'none';
  document.getElementById('login-container').style.display = 'flex';
  document.getElementById('login-tab').click();
}

// 모달 제어 함수들
export function showModal(modalName) {
  if (modals[modalName]) {
    modals[modalName]().classList.add('active');
  }
}

export function hideModal(modalName) {
  if (modals[modalName]) {
    modals[modalName]().classList.remove('active');
  }
}

export function closeAllModals() {
  Object.keys(modals).forEach(key => {
    if (modals[key]()) {
      modals[key]().classList.remove('active');
    }
  });
}

// 토스트 알림 표시
export function showToast(title, message, type = 'info') {
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
  toastContainer.appendChild(toast);
  
  // 애니메이션 추가
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// 탭 전환 기능
export function initTabs(containerSelector, tabSelector, contentSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  const tabs = container.querySelectorAll(tabSelector);
  const contents = container.querySelectorAll(contentSelector);
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 탭 활성화
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // 컨텐츠 활성화
      const targetId = tab.getAttribute('data-tab');
      contents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetId) {
          content.classList.add('active');
        }
      });
    });
  });
}

// DOM 요소 렌더링 함수들

// 최근 루틴 렌더링
export function renderRecentRoutines(routines, containerId = 'recent-routines-list') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
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
  
  routines.forEach(routine => {
    const el = document.createElement('div');
    el.className = 'routine-item';
    el.innerHTML = `
      <div class="routine-item-content">
        <h3>${routine.title || '제목 없음'}</h3>
        <p>${routine.subjects ? routine.subjects.join(', ') : routine.createdAt}</p>
      </div>
      <i class="ri-arrow-right-s-line"></i>
    `;
    
    el.addEventListener('click', () => {
      // 루틴 상세 보기 로직
      if (routine.id) {
        window.location.hash = `routine/${routine.id}`;
      }
    });
    
    container.appendChild(el);
  });
}

// 오늘의 일정 렌더링
export function renderTodaySchedule(schedule, containerId = 'today-schedule-list') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!schedule || schedule.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ri-calendar-check-line"></i>
        <p>오늘의 일정이 없습니다.</p>
      </div>
    `;
    return;
  }
  
  schedule.forEach(item => {
    const el = document.createElement('div');
    el.className = 'schedule-item';
    el.innerHTML = `
      <div class="schedule-item-content">
        <h3>${item.title}</h3>
        <p>${item.time}</p>
      </div>
      <div class="schedule-item-status">
        ${item.completed 
          ? '<i class="ri-checkbox-circle-fill" style="color: var(--success);"></i>' 
          : '<i class="ri-time-line" style="color: var(--primary);"></i>'}
      </div>
    `;
    
    container.appendChild(el);
  });
}

// 프로필 데이터 업데이트
export function updateProfileData(userData) {
  if (!userData) return;
  
  // 프로필 기본 정보
  if (userData.username) {
    document.getElementById('profile-username').textContent = userData.username;
    document.getElementById('username-display').textContent = userData.username;
  }
  
  // 가입일
  if (userData.joinDate) {
    document.getElementById('profile-join-date').textContent = `가입일: ${userData.joinDate}`;
  }
  
  // 통계
  if (userData.routineCount !== undefined) {
    document.getElementById('profile-routine-count').textContent = userData.routineCount;
  }
  
  if (userData.completedCount !== undefined) {
    document.getElementById('profile-completed-count').textContent = userData.completedCount;
  }
  
  // 폼 데이터
  if (userData.username) {
    document.getElementById('profile-display-name').value = userData.username;
  }
  
  if (userData.email) {
    document.getElementById('profile-email').value = userData.email;
  }
}
export function handleProfileUpdate(formData, onSuccess) {
  // 프로필 업데이트 로직
  // 성공 시 콜백 실행
  if (onSuccess && typeof onSuccess === 'function') {
    onSuccess();
  }
}