// ====================================
// 메인 앱 진입점 - 백엔드 연동 완전판
// ====================================

import { 
  initAuthHandlers, 
  autoLoginCheck, 
  setFetchUserDataFunction,
  checkAuthStatus,
  logout 
} from './auth.js';

import { 
  initUI, 
  fetchRecentRoutines, 
  fetchTodaySchedule,
  showToast
} from './ui.js';

import { 
  initRoutineHandlers
} from './routine.js';

// 앱 초기화 여부 플래그
let appInitialized = false;

// ✅ 메인 앱 초기화
async function initApp() {
  if (appInitialized) {
    console.log('⚠️ 앱이 이미 초기화되었습니다');
    return;
  }
  
  console.log('🚀 AI 학습 루틴 플래너 앱 초기화 시작...');
  
  try {
    // 1. UI 기본 설정
    console.log('1️⃣ UI 초기화 중...');
    initUI();
    
    // 2. 인증 핸들러 설정
    console.log('2️⃣ 인증 핸들러 설정 중...');
    initAuthHandlers();
    
    // 3. 루틴 핸들러 설정
    console.log('3️⃣ 루틴 핸들러 설정 중...');
    initRoutineHandlers();
    
    // 4. 사용자 데이터 함수 설정
    console.log('4️⃣ 사용자 데이터 함수 설정 중...');
    setFetchUserDataFunction(fetchUserData);
    
    // 5. 추가 이벤트 리스너 설정
    console.log('5️⃣ 추가 이벤트 리스너 설정 중...');
    setupAdditionalEventListeners();
    
    // 6. 자동 로그인 확인
    console.log('6️⃣ 자동 로그인 확인 중...');
    const isAuthenticated = await autoLoginCheck();
    
    if (isAuthenticated) {
      console.log('✅ 자동 로그인 성공 - 메인 앱 표시');
      
      // 사용자 데이터 로드
      try {
        await fetchUserData();
      } catch (error) {
        console.warn('⚠️ 초기 사용자 데이터 로드 실패:', error);
      }
    } else {
      console.log('❌ 자동 로그인 실패 - 로그인 화면 표시');
    }
    
    // 7. 캘린더 모듈 로드 (지연 로드)
    setTimeout(() => {
      loadCalendarModule();
    }, 1000);
    
    appInitialized = true;
    console.log('✅ 앱 초기화 완료');
    
  } catch (error) {
    console.error('❌ 앱 초기화 오류:', error);
    showToast('오류', '앱 초기화 중 오류가 발생했습니다.', 'error');
  }
}

// ✅ 사용자 데이터 가져오기
async function fetchUserData() {
  console.log('📊 사용자 데이터 로딩 시작...');
  
  try {
    // 병렬로 데이터 로드
    const promises = [
      fetchRecentRoutines(),
      fetchTodaySchedule()
    ];
    
    const results = await Promise.allSettled(promises);
    
    // 결과 확인
    results.forEach((result, index) => {
      const names = ['최근 루틴', '오늘 일정'];
      if (result.status === 'fulfilled') {
        console.log(`✅ ${names[index]} 로드 성공`);
      } else {
        console.warn(`⚠️ ${names[index]} 로드 실패:`, result.reason);
      }
    });
    
    console.log('✅ 사용자 데이터 로딩 완료');
    
  } catch (error) {
    console.error('❌ 사용자 데이터 로딩 오류:', error);
    // 개별 함수에서 이미 오류 처리를 하므로 여기서는 로그만
  }
}

// ✅ 추가 이벤트 리스너 설정
function setupAdditionalEventListeners() {
  // 전역 키보드 이벤트
  document.addEventListener('keydown', handleGlobalKeydown);
  
  // 전역 클릭 이벤트 (모달 외부 클릭 등)
  document.addEventListener('click', handleGlobalClick);
  
  // 윈도우 리사이즈 이벤트
  window.addEventListener('resize', handleWindowResize);
  
  // 페이지 언로드 이벤트 (세션 정리)
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // 온라인/오프라인 상태 감지
  window.addEventListener('online', () => {
    showToast('알림', '인터넷 연결이 복구되었습니다.', 'success');
  });
  
  window.addEventListener('offline', () => {
    showToast('경고', '인터넷 연결이 끊어졌습니다.', 'warning');
  });
  
  console.log('✅ 추가 이벤트 리스너 설정 완료');
}

// ✅ 전역 키보드 이벤트 핸들러
function handleGlobalKeydown(e) {
  // ESC 키로 모달 닫기
  if (e.key === 'Escape') {
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
      activeModal.classList.remove('active');
      activeModal.style.display = 'none';
    }
  }
  
  // Ctrl+/ 키로 도움말 표시
  if (e.ctrlKey && e.key === '/') {
    e.preventDefault();
    showHelpModal();
  }
  
  // F5 키 새로고침 확인 (개발용)
  if (e.key === 'F5' && !e.ctrlKey) {
    if (confirm('페이지를 새로고침하시겠습니까?')) {
      location.reload();
    } else {
      e.preventDefault();
    }
  }
}

// ✅ 전역 클릭 이벤트 핸들러
function handleGlobalClick(e) {
  // 드롭다운 메뉴 외부 클릭 시 닫기
  const dropdowns = document.querySelectorAll('.dropdown.active');
  dropdowns.forEach(dropdown => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
  
  // 토스트 메시지 클릭 시 닫기
  if (e.target.closest('.toast')) {
    e.target.closest('.toast').remove();
  }
}

// ✅ 윈도우 리사이즈 핸들러
function handleWindowResize() {
  // 모바일 반응형 처리
  const isMobile = window.innerWidth <= 768;
  document.body.classList.toggle('mobile', isMobile);
  
  // 캘린더 리사이즈 (캘린더가 로드된 경우)
  if (window.calendar && typeof window.calendar.updateSize === 'function') {
    setTimeout(() => {
      window.calendar.updateSize();
    }, 100);
  }
}

// ✅ 페이지 언로드 핸들러
function handleBeforeUnload(e) {
  // 진행 중인 작업이 있는지 확인
  const hasUnsavedData = checkUnsavedData();
  
  if (hasUnsavedData) {
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
}

// ✅ 저장되지 않은 데이터 확인
function checkUnsavedData() {
  // 루틴 생성 모달이 열려있고 데이터가 있는지 확인
  const routineModal = document.getElementById('routine-modal');
  if (routineModal && routineModal.classList.contains('active')) {
    const hasItems = document.querySelector('#routine-items-container .routine-item');
    return !!hasItems;
  }
  
  // 프로필 편집 폼에 수정사항이 있는지 확인
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    const formData = new FormData(profileForm);
    const hasChanges = Array.from(formData.entries()).some(([key, value]) => {
      const input = profileForm.querySelector(`[name="${key}"]`);
      return input && input.defaultValue !== value;
    });
    return hasChanges;
  }
  
  return false;
}

// ✅ 도움말 모달 표시
function showHelpModal() {
  const helpContent = `
    <div class="help-modal">
      <h3>📖 사용 가이드</h3>
      <div class="help-section">
        <h4>🎯 루틴 생성</h4>
        <ul>
          <li>홈 화면에서 "새 루틴 생성" 버튼 클릭</li>
          <li>과목별로 학습 시간과 선호 시간대 설정</li>
          <li>"AI 루틴 생성"으로 맞춤형 스케줄 생성</li>
          <li>생성된 루틴을 캘린더에 저장</li>
        </ul>
      </div>
      <div class="help-section">
        <h4>📅 일정 관리</h4>
        <ul>
          <li>캘린더에서 일정 확인 및 수정</li>
          <li>오늘의 일정에서 완료 체크</li>
          <li>진행률로 학습 현황 파악</li>
        </ul>
      </div>
      <div class="help-section">
        <h4>⌨️ 키보드 단축키</h4>
        <ul>
          <li><kbd>ESC</kbd>: 모달 닫기</li>
          <li><kbd>Ctrl</kbd> + <kbd>/</kbd>: 도움말 표시</li>
          <li><kbd>Enter</kbd>: 폼 제출</li>
        </ul>
      </div>
    </div>
  `;
  
  showToast('도움말', helpContent, 'info');
}

// ✅ 캘린더 모듈 지연 로드
async function loadCalendarModule() {
  try {
    if (typeof window.initCalendar === 'function') {
      console.log('✅ 캘린더 모듈이 이미 로드됨');
      return;
    }
    
    console.log('📅 캘린더 모듈 로딩 중...');
    
    // calendar.js 동적 로드
    const script = document.createElement('script');
    script.src = '/js/calendar.js';
    script.type = 'module';
    
    return new Promise((resolve, reject) => {
      script.onload = () => {
        console.log('✅ 캘린더 모듈 로드 완료');
        resolve();
      };
      
      script.onerror = () => {
        console.warn('⚠️ 캘린더 모듈 로드 실패');
        reject(new Error('캘린더 모듈 로드 실패'));
      };
      
      document.head.appendChild(script);
    });
    
  } catch (error) {
    console.warn('⚠️ 캘린더 모듈 로드 오류:', error);
  }
}

// ✅ 페이지 가시성 변경 감지 (백그라운드/포그라운드)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && appInitialized) {
    // 페이지가 다시 보이게 되면 세션 상태 확인
    setTimeout(async () => {
      try {
        const authStatus = await checkAuthStatus();
        if (!authStatus) {
          console.log('⚠️ 세션 만료 감지됨');
          await logout(false);
          showToast('알림', '세션이 만료되어 로그아웃되었습니다.', 'warning');
        }
      } catch (error) {
        console.warn('⚠️ 세션 상태 확인 실패:', error);
      }
    }, 1000);
  }
});

// ✅ 서비스 워커 등록 (향후 PWA 지원용)
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker 등록 성공:', registration);
    } catch (error) {
      console.log('⚠️ Service Worker 등록 실패:', error);
    }
  }
}

// ✅ 앱 성능 모니터링
function initPerformanceMonitoring() {
  // 페이지 로드 시간 측정
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`📊 페이지 로드 시간: ${Math.round(loadTime)}ms`);
    
    // 느린 로딩 경고
    if (loadTime > 3000) {
      console.warn('⚠️ 페이지 로딩이 느립니다');
    }
  });
  
  // 메모리 사용량 모니터링 (개발용)
  if (performance.memory) {
    setInterval(() => {
      const memory = performance.memory;
      console.log(`💾 메모리 사용량: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
    }, 60000); // 1분마다
  }
}

// ✅ 오류 보고 시스템
window.addEventListener('error', (e) => {
  console.error('❌ 전역 오류:', e.error);
  
  // 중요한 오류인 경우 사용자에게 알림
  if (e.error && e.error.name !== 'ChunkLoadError') {
    showToast('오류', '예상치 못한 오류가 발생했습니다. 페이지를 새로고침해주세요.', 'error');
  }
  
  // 개발 환경에서는 상세 정보 표시
  if (location.hostname === 'localhost') {
    console.log('🐛 오류 상세 정보:', {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error?.stack
    });
  }
});

// ✅ Promise rejection 처리
window.addEventListener('unhandledrejection', (e) => {
  console.error('❌ 처리되지 않은 Promise 거부:', e.reason);
  
  // 네트워크 오류가 아닌 경우만 사용자에게 알림
  if (!e.reason?.message?.includes('fetch')) {
    showToast('오류', '작업 처리 중 오류가 발생했습니다.', 'error');
  }
  
  // 오류 로그 (개발 환경)
  if (location.hostname === 'localhost') {
    console.log('🐛 Promise 거부 상세:', e.reason);
  }
});

// ✅ 앱 시작점
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 DOM 로드 완료 - 앱 시작');
  
  try {
    // 성능 모니터링 시작
    initPerformanceMonitoring();
    
    // 서비스 워커 등록 (선택사항)
    // await registerServiceWorker();
    
    // 메인 앱 초기화
    await initApp();
    
  } catch (error) {
    console.error('❌ 앱 시작 실패:', error);
    
    // 기본 오류 UI 표시
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      ">
        <h1 style="color: #e74c3c; margin-bottom: 1rem;">앱 로딩 실패</h1>
        <p style="color: #666; margin-bottom: 2rem;">
          앱을 시작하는 중 오류가 발생했습니다.<br>
          페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
        </p>
        <button onclick="location.reload()" style="
          background: #4361ee;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        ">
          페이지 새로고침
        </button>
      </div>
    `;
  }
});

// ✅ 개발 도구 (개발 환경에서만)
if (location.hostname === 'localhost') {
  // 전역 디버그 함수
  window.debugApp = {
    fetchUserData,
    checkAuthStatus,
    getCurrentUser: () => {
      const { getCurrentUser } = require('./auth.js');
      return getCurrentUser();
    },
    clearStorage: () => {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ 로컬 스토리지 정리 완료');
    },
    forceLogout: () => logout(true),
    showAppInfo: () => {
      console.log('📱 앱 정보:', {
        initialized: appInitialized,
        url: location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine
      });
    }
  };
  
  console.log('🛠️ 개발 도구 로드됨. window.debugApp 사용 가능');
}

// ✅ 전역 함수 노출 (호환성 유지)
window.fetchUserData = fetchUserData;
window.fetchRecentRoutines = fetchRecentRoutines;
window.fetchTodaySchedule = fetchTodaySchedule;

console.log('✅ app.js 모듈 로드 완료');