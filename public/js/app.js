// ✅ 외부 모듈 import
import { checkAutoLogin, login, register, logout, getAuthToken, showApp } from './auth.js';
import { setFetchUserDataFunction } from './auth.js';
import { initThemeSettings } from './theme-switcher.js';
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
import { quotes } from './quotes.js';
import { saveScheduleEdit } from './routine.js';

// ✅ 앱 초기화 여부 플래그
let appInitialized = false;

// ✅ 모달 닫기 핸들러 추가
function initModalHandlers() {
  // 모든 모달의 X 버튼에 이벤트 리스너 추가
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('close-modal')) {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
        console.log('Modal closed via X button');
      }
    }
  });

  // 모달 배경 클릭 시 닫기
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
      console.log('Modal closed via background click');
    }
  });

  // ESC 키로 모달 닫기
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const activeModals = document.querySelectorAll('.modal.active');
      activeModals.forEach(modal => {
        modal.classList.remove('active');
      });
      console.log('Modal closed via ESC key');
    }
  });
}

// ✅ 앱 전체 초기화 함수
export function initApp() {
  if (appInitialized) return;
  appInitialized = true;

  console.log('🚀 앱 초기화 시작...');
  
  initNavigation();
  initRoutineHandlers();
  initModalHandlers(); // ✅ 모달 핸들러 추가
  initThemeSettings();
  setupEventListeners();
  setFetchUserDataFunction(fetchUserData);
  
  checkAutoLogin()
    .then(isLoggedIn => {
      if (isLoggedIn) {
        console.log('✅ 자동 로그인 성공');
        return Promise.all([
        fetchUserData(),
        fetchAndDisplayNickname()  // ✅ 닉네임 표시 호출
      ]);
    }
    })
    .catch(error => console.error('❌ Auto-login error:', error));

  // ✅ 명언 출력
  showRandomQuote();
  
  console.log('✅ 앱 초기화 완료');


}

function fetchAndDisplayNickname() {
  return fetch('/api/profile/me', {
    credentials: 'include'
  })
    .then(res => {
      if (!res.ok) throw new Error('닉네임 API 응답 실패');
      return res.json();
    })
    .then(data => {
      if (data.nickname) {
        const target = document.getElementById('nickname-display');
        if (target) {
          const name = data.nickname.endsWith('님') ? data.nickname : `${data.nickname}님`;
          target.textContent = `${name}, 환영합니다!`;
          console.log('✅ 닉네임 표시 완료:', name);
        }
      }
    })
    .catch(err => {
      console.error('❌ 닉네임 로딩 실패:', err);
    });
}

// ✅ DOMContentLoaded 시 단 1회만 실행
document.addEventListener('DOMContentLoaded', function initAppOnce() {
  document.removeEventListener('DOMContentLoaded', initAppOnce);
  setFetchUserDataFunction(fetchUserData);
  initApp();

  const deleteAccountBtn = document.getElementById('delete-account-btn');
  if (deleteAccountBtn) {
  // 기존 이벤트 리스너 제거 후 새로 등록
  deleteAccountBtn.removeEventListener('click', deleteAccount);
  deleteAccountBtn.addEventListener('click', deleteAccount);
  }
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

  // ✅ 캘린더 탭 클릭 시 캘린더 초기화
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page');
      
      if (page === 'calendar') {
        console.log('📅 캘린더 탭 클릭됨');
        setTimeout(() => {
          try {
            if (window.calendarModule?.initCalendar) {
              console.log('🔄 캘린더 초기화 시도 (모듈)...');
              window.calendarModule.initCalendar();
            } else if (typeof initCalendar === 'function') {
              console.log('🔄 캘린더 초기화 시도 (함수)...');
              initCalendar();
            } else {
              console.error('❌ 캘린더 초기화 함수를 찾을 수 없습니다');
            }
          } catch (error) {
            console.error('❌ 캘린더 초기화 오류:', error);
          }
        }, 200);
      }
    });
  });
}

// ✅ 명언 랜덤 출력
function showRandomQuote() {
  const quoteText = document.getElementById('quote-text');
  if (!quoteText) return;
  const randomIndex = Math.floor(Math.random() * quotes.length);
  quoteText.textContent = quotes[randomIndex];
}

// ✅ 사용자 데이터 불러오기 (세션 기반으로 수정)
export function fetchUserData() {
  return new Promise((resolve, reject) => {
    try {
      console.log('📊 사용자 데이터 로드 중...');
      
      fetch('/api/user-stats', {
        method: 'GET',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          console.log('📊 사용자 통계 응답:', response.status);
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return response.json();
          }
          throw new Error('Invalid response format');
        })
        .then(userData => {
          console.log('✅ 사용자 통계 데이터:', userData);
          const profileRoutineCount = document.getElementById('profile-routine-count');
          const profileCompletedCount = document.getElementById('profile-completed-count');
          if (profileRoutineCount) profileRoutineCount.textContent = userData.routineCount || 0;
          if (profileCompletedCount) profileCompletedCount.textContent = userData.completedCount || 0;

          return Promise.all([
            fetchRecentRoutines(),
            fetchTodaySchedule()
          ]);
        })
        .then(() => {
          console.log('✅ 모든 사용자 데이터 로드 완료');
          resolve(true);
        })
        .catch(error => {
          console.error('❌ User data fetch error:', error);
          resolve(false);
        });
    } catch (error) {
      console.error('❌ User data fetch exception:', error);
      reject(error);
    }
  });
}

// ✅ AI 루틴 생성 요청 함수 (세션 기반으로 수정)
export async function generateAIRoutine(profileData) {
  try {
    const response = await fetch('/api/recommend', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
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

// 계정 삭제 함수
async function deleteAccount() {
  // 확인 대화상자
  const confirmDelete = confirm(
    '정말로 계정을 삭제하시겠습니까?\n\n' +
    '⚠️ 주의: 이 작업은 되돌릴 수 없습니다.\n' +
    '- 모든 루틴과 일정이 삭제됩니다\n' +
    '- 계정 복구가 불가능합니다\n\n' +
    '계속 진행하시려면 확인을 클릭하세요.'
  );

  if (!confirmDelete) {
    return;
  }

  // 한 번 더 확인
  const finalConfirm = confirm(
    '마지막 확인입니다.\n정말로 계정을 삭제하시겠습니까?'
  );

  if (!finalConfirm) {
    return;
  }

  try {
    const response = await fetch('/api/auth/delete-account', {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('계정이 성공적으로 삭제되었습니다.\n메인 페이지로 이동합니다.');
      
      // 로컬 스토리지 정리
      localStorage.clear();
      sessionStorage.clear();
      
      // 메인 페이지로 리다이렉트
      window.location.href = '/';
      
    } else {
      throw new Error(data.error || '계정 삭제에 실패했습니다');
    }

  } catch (error) {
    console.error('❌ 계정 삭제 오류:', error);
    alert('계정 삭제 중 오류가 발생했습니다: ' + error.message);
  }
}

// 전역 함수로 등록
window.deleteAccount = deleteAccount;

// ✅ 글로벌 함수 등록
window.initCalendar = initCalendar;
window.showToast = showToast;
window.fetchUserData = fetchUserData;
window.generateAIRoutine = generateAIRoutine;
window.saveScheduleEdit = saveScheduleEdit; // ✅ 이 줄 추가하세요!