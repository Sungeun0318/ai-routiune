// UI 관련 조작 함수들
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
      } else {
        console.error('Target page not found:', `${pageName}-page`);
      }
    });
  });
  
  // 탭 초기화
  initTabs('.auth-tabs', '.tab', '.auth-form');
  initTabs('.tabs', '.tab', '.tab-pane');
}

// 앱 화면 표시
export function showApp(username) {
  console.log('Showing app for user:', username);
  
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');
  
  if (loginContainer) {
    loginContainer.style.display = 'none';
    console.log('Login container hidden');
  }
  
  if (appContainer) {
    appContainer.style.display = 'flex';
    console.log('App container shown');
  }
  
  // 사용자 이름 표시
  const usernameDisplay = document.getElementById('username-display');
  if (usernameDisplay) {
    usernameDisplay.textContent = username;
  }
  
  const profileUsername = document.getElementById('profile-username');
  if (profileUsername) {
    profileUsername.textContent = username;
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

  routines.forEach(routine => {
    const el = document.createElement('div');
    el.className = mode === 'item' ? 'routine-item' : 'routine-card';

    if (mode === 'item') {
      el.innerHTML = `
        <div class="routine-item-content">
          <h3>${routine.title || '제목 없음'}</h3>
          <p>${routine.subjects ? routine.subjects.join(', ') : routine.createdAt}</p>
        </div>
        <i class="ri-arrow-right-s-line"></i>
      `;

      el.addEventListener('click', () => {
        if (routine.id) {
          window.location.hash = `routine/${routine.id}`;
        }
      });
    } else {
      el.innerHTML = `
        <h3>${routine.title}</h3>
        <p>과목: ${routine.subjects.join(', ')}</p>
        <p>생성일: ${routine.createdAt}</p>
      `;
    }

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

  const ul = document.createElement('ul');
  ul.className = 'schedule-list';

  schedule.forEach(item => {
    const li = document.createElement('li');
    li.className = 'schedule-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.completed;

    // ✅ 체크 상태가 바뀌면 item.completed 상태 변경 + 완료율 업데이트
    checkbox.addEventListener('change', () => {
      item.completed = checkbox.checked;
      updateOverallProgress(schedule);
    });

    const timeDiv = document.createElement('div');
    timeDiv.className = 'schedule-time';
    timeDiv.textContent = item.time;

    const taskDiv = document.createElement('div');
    taskDiv.className = 'schedule-task';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    titleDiv.textContent = item.title;

    taskDiv.appendChild(titleDiv);
    li.appendChild(checkbox);
    li.appendChild(timeDiv);
    li.appendChild(taskDiv);

    ul.appendChild(li);
  });

  container.appendChild(ul);

  // ✅ 초기 렌더링 시 전체 progress 업데이트
  updateOverallProgress(schedule);
}



// ✅ 오늘의 전체 완료율 계산 및 반영
export function updateOverallProgress(schedule) {
  const bar = document.getElementById('overall-progress-bar');
  const text = document.getElementById('overall-progress-text');
  if (!bar || !text || !schedule || schedule.length === 0) return;

  const completedCount = schedule.filter(item => item.completed).length;
  const percent = Math.round((completedCount / schedule.length) * 100);

  bar.value = percent;
  text.textContent = `${percent}%`;
}


// 프로필 데이터 업데이트
export function updateProfileData(userData) {
  if (!userData) return;
  
  console.log('Updating profile data:', userData);
  
  // 프로필 기본 정보
  if (userData.username) {
    const profileUsername = document.getElementById('profile-username');
    const usernameDisplay = document.getElementById('username-display');
    
    if (profileUsername) profileUsername.textContent = userData.username;
    if (usernameDisplay) usernameDisplay.textContent = userData.username;
  }
  
  // 가입일
  if (userData.joinDate) {
    const joinDateEl = document.getElementById('profile-join-date');
    if (joinDateEl) {
      joinDateEl.textContent = `가입일: ${userData.joinDate}`;
    }
  }
  
  // 통계
  if (userData.routineCount !== undefined) {
    const routineCountEl = document.getElementById('profile-routine-count');
    if (routineCountEl) {
      routineCountEl.textContent = userData.routineCount;
    }
  }
  
  if (userData.completedCount !== undefined) {
    const completedCountEl = document.getElementById('profile-completed-count');
    if (completedCountEl) {
      completedCountEl.textContent = userData.completedCount;
    }
  }
  
  // 폼 데이터
  if (userData.username) {
    const displayNameInput = document.getElementById('profile-display-name');
    if (displayNameInput) {
      displayNameInput.value = userData.username;
    }
  }
  
  if (userData.email) {
    const emailInput = document.getElementById('profile-email');
    if (emailInput) {
      emailInput.value = userData.email;
    }
  }
}

export function handleProfileUpdate(formData, onSuccess) {
  console.log('Handling profile update:', formData);
  
  // 프로필 업데이트 로직
  // 성공 시 콜백 실행
  if (onSuccess && typeof onSuccess === 'function') {
    onSuccess();
  }
}