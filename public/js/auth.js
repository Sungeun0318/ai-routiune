// ====================================
// 인증 관련 함수들 - 백엔드 연동 완전판
// ====================================

import { showToast, showApp, hideApp } from './ui.js';

// 전역 사용자 데이터 저장
let currentUser = null;
let fetchUserDataFunction = null;

// ✅ 사용자 데이터 가져오기 함수 설정 (app.js에서 호출)
export function setFetchUserDataFunction(fn) {
  fetchUserDataFunction = fn;
}

// ✅ 회원가입 함수
export async function register() {
  try {
    console.log('📝 회원가입 시도...');
    
    const username = document.getElementById('register-username')?.value?.trim();
    const password = document.getElementById('register-password')?.value?.trim();
    const confirmPassword = document.getElementById('register-confirm-password')?.value?.trim();
    const nickname = document.getElementById('register-nickname')?.value?.trim();
    const email = document.getElementById('register-email')?.value?.trim();

    // 입력값 검증
    if (!username || !password) {
      showToast('오류', '아이디와 비밀번호를 입력해주세요.', 'error');
      return false;
    }

    if (username.length < 3 || username.length > 20) {
      showToast('오류', '아이디는 3-20자 사이여야 합니다.', 'error');
      return false;
    }

    if (password.length < 4) {
      showToast('오류', '비밀번호는 최소 4자리 이상이어야 합니다.', 'error');
      return false;
    }

    if (password !== confirmPassword) {
      showToast('오류', '비밀번호가 일치하지 않습니다.', 'error');
      return false;
    }

    // 서버에 회원가입 요청
    const response = await fetch('/api/register', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password,
        nickname: nickname || username,
        email: email || ''
      })
    });

    console.log('🔍 회원가입 응답 상태:', response.status);
    const result = await response.json();
    console.log('📄 회원가입 응답:', result);

    if (response.ok && result.ok) {
      showToast('성공', '회원가입이 완료되었습니다! 로그인해주세요.', 'success');
      
      // 폼 초기화
      const registerForm = document.getElementById('register-form');
      if (registerForm) registerForm.reset();
      
      // 로그인 탭으로 전환
      switchToLoginTab();
      
      return true;
    } else {
      showToast('오류', result.message || '회원가입에 실패했습니다.', 'error');
      return false;
    }

  } catch (error) {
    console.error('❌ 회원가입 오류:', error);
    showToast('오류', '회원가입 중 오류가 발생했습니다.', 'error');
    return false;
  }
}

// ✅ 로그인 함수
export async function login() {
  try {
    console.log('🔐 로그인 시도...');
    
    const username = document.getElementById('login-username')?.value?.trim();
    const password = document.getElementById('login-password')?.value?.trim();

    // 입력값 검증
    if (!username || !password) {
      showToast('오류', '아이디와 비밀번호를 입력해주세요.', 'error');
      return false;
    }

    // 로그인 버튼 비활성화
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = '로그인 중...';
    }

    // 서버에 로그인 요청
    const response = await fetch('/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    console.log('🔍 로그인 응답 상태:', response.status);
    const result = await response.json();
    console.log('📄 로그인 응답:', result);

    if (response.ok && result.ok) {
      console.log('✅ 로그인 성공:', result.user);
      
      // 현재 사용자 정보 저장
      currentUser = result.user;
      
      showToast('성공', `환영합니다, ${result.user.nickname || result.user.username}님!`, 'success');
      
      // 메인 앱 화면으로 전환
      showApp(result.user);
      
      // 사용자 데이터 로드
      if (fetchUserDataFunction) {
        try {
          await fetchUserDataFunction();
        } catch (error) {
          console.warn('⚠️ 사용자 데이터 로드 실패:', error);
        }
      }
      
      return true;
    } else {
      showToast('오류', result.message || '로그인에 실패했습니다.', 'error');
      return false;
    }

  } catch (error) {
    console.error('❌ 로그인 오류:', error);
    showToast('오류', '로그인 중 오류가 발생했습니다.', 'error');
    return false;
  } finally {
    // 로그인 버튼 다시 활성화
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = '로그인';
    }
  }
}

// ✅ 로그아웃 함수
export async function logout(showMessage = true) {
  try {
    console.log('🚪 로그아웃 시도...');
    
    // 서버에 로그아웃 요청
    const response = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('🔍 로그아웃 응답 상태:', response.status);
    const result = await response.json();

    if (response.ok && result.ok) {
      console.log('✅ 로그아웃 성공');
      
      // 현재 사용자 정보 초기화
      currentUser = null;
      
      if (showMessage) {
        showToast('성공', '로그아웃되었습니다.', 'success');
      }
      
      // 로그인 화면으로 전환
      hideApp();
      
      // 폼 초기화
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      if (loginForm) loginForm.reset();
      if (registerForm) registerForm.reset();
      
      return true;
    } else {
      console.warn('⚠️ 로그아웃 응답 이상:', result);
      
      // 서버 응답이 이상해도 클라이언트는 로그아웃 처리
      currentUser = null;
      hideApp();
      
      if (showMessage) {
        showToast('알림', '로그아웃되었습니다.', 'info');
      }
      
      return true;
    }

  } catch (error) {
    console.error('❌ 로그아웃 오류:', error);
    
    // 오류가 발생해도 클라이언트는 로그아웃 처리
    currentUser = null;
    hideApp();
    
    if (showMessage) {
      showToast('알림', '로그아웃되었습니다.', 'info');
    }
    
    return true;
  }
}

// ✅ 인증 상태 확인 함수
export async function checkAuthStatus() {
  try {
    console.log('🔍 인증 상태 확인 중...');
    
    const response = await fetch('/api/auth/check', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('🔍 인증 확인 응답 상태:', response.status);

    if (!response.ok) {
      console.log('❌ 인증 확인 실패 - 응답 오류');
      return false;
    }

    const result = await response.json();
    console.log('📄 인증 확인 응답:', result);

    if (result.authenticated && result.user) {
      console.log('✅ 인증 상태 확인됨:', result.user);
      
      // 현재 사용자 정보 저장
      currentUser = result.user;
      
      return result.user;
    } else {
      console.log('❌ 인증 상태 아님');
      currentUser = null;
      return false;
    }

  } catch (error) {
    console.error('❌ 인증 상태 확인 오류:', error);
    currentUser = null;
    return false;
  }
}

// ✅ 현재 사용자 정보 반환
export function getCurrentUser() {
  return currentUser;
}

// ✅ 인증 토큰 반환 (호환성 유지)
export function getAuthToken() {
  // 세션 기반이므로 별도 토큰 없음, 쿠키로 자동 처리
  return 'session-based';
}

// ✅ 로그인 탭으로 전환
function switchToLoginTab() {
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginTab && registerTab && loginForm && registerForm) {
    // 탭 활성화 상태 변경
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    
    // 폼 표시/숨김
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    
    console.log('✅ 로그인 탭으로 전환됨');
  }
}

// ✅ 인증 관련 이벤트 리스너 설정
export function initAuthHandlers() {
  console.log('🎯 인증 핸들러 초기화 중...');
  
  // 로그인 폼 이벤트
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await login();
    });
    console.log('✅ 로그인 폼 이벤트 연결됨');
  }

  // 회원가입 폼 이벤트
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await register();
    });
    console.log('✅ 회원가입 폼 이벤트 연결됨');
  }

  // 로그아웃 버튼 이벤트
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await logout();
    });
    console.log('✅ 로그아웃 버튼 이벤트 연결됨');
  }

  // 탭 전환 이벤트
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  
  if (loginTab) {
    loginTab.addEventListener('click', (e) => {
      e.preventDefault();
      switchToLoginTab();
    });
  }
  
  if (registerTab) {
    registerTab.addEventListener('click', (e) => {
      e.preventDefault();
      switchToRegisterTab();
    });
  }

  // Enter 키로 로그인/회원가입
  document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const activeForm = document.querySelector('.auth-form:not([style*="display: none"])');
      if (activeForm) {
        const submitBtn = activeForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.click();
        }
      }
    }
  });

  console.log('✅ 인증 핸들러 초기화 완료');
}

// ✅ 회원가입 탭으로 전환
function switchToRegisterTab() {
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginTab && registerTab && loginForm && registerForm) {
    // 탭 활성화 상태 변경
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    
    // 폼 표시/숨김
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
    
    console.log('✅ 회원가입 탭으로 전환됨');
  }
}

// ✅ 비밀번호 확인 검증 (실시간)
export function validatePasswordConfirm() {
  const password = document.getElementById('register-password')?.value;
  const confirmPassword = document.getElementById('register-confirm-password')?.value;
  const confirmInput = document.getElementById('register-confirm-password');
  
  if (!confirmInput) return;
  
  if (confirmPassword && password !== confirmPassword) {
    confirmInput.style.borderColor = '#e74c3c';
    confirmInput.setCustomValidity('비밀번호가 일치하지 않습니다');
  } else {
    confirmInput.style.borderColor = '';
    confirmInput.setCustomValidity('');
  }
}

// ✅ 사용자명 유효성 검사 (실시간)
export function validateUsername() {
  const usernameInput = document.getElementById('register-username');
  if (!usernameInput) return;
  
  const username = usernameInput.value.trim();
  
  if (username.length > 0 && (username.length < 3 || username.length > 20)) {
    usernameInput.style.borderColor = '#e74c3c';
    usernameInput.setCustomValidity('아이디는 3-20자 사이여야 합니다');
  } else {
    usernameInput.style.borderColor = '';
    usernameInput.setCustomValidity('');
  }
}

// ✅ 실시간 유효성 검사 이벤트 연결
export function setupValidation() {
  // 비밀번호 확인 실시간 검증
  const confirmPasswordInput = document.getElementById('register-confirm-password');
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', validatePasswordConfirm);
  }
  
  // 사용자명 실시간 검증
  const usernameInput = document.getElementById('register-username');
  if (usernameInput) {
    usernameInput.addEventListener('input', validateUsername);
  }
}

// ✅ 자동 로그인 확인 (페이지 로드 시)
export async function autoLoginCheck() {
  console.log('🔄 자동 로그인 확인 중...');
  
  try {
    const user = await checkAuthStatus();
    if (user) {
      console.log('✅ 자동 로그인 성공:', user);
      currentUser = user;
      showApp(user);
      
      // 사용자 데이터 로드
      if (fetchUserDataFunction) {
        try {
          await fetchUserDataFunction();
        } catch (error) {
          console.warn('⚠️ 사용자 데이터 로드 실패:', error);
        }
      }
      
      return true;
    } else {
      console.log('❌ 자동 로그인 실패 - 로그인 필요');
      hideApp();
      return false;
    }
  } catch (error) {
    console.error('❌ 자동 로그인 확인 오류:', error);
    hideApp();
    return false;
  }
}

// ✅ 세션 만료 확인
export async function checkSessionExpiry() {
  try {
    const response = await fetch('/api/auth/check', {
      method: 'GET',
      credentials: 'include'
    });

    if (response.status === 401) {
      console.log('⚠️ 세션 만료됨');
      showToast('알림', '세션이 만료되었습니다. 다시 로그인해주세요.', 'warning');
      await logout(false);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ 세션 확인 오류:', error);
    return false;
  }
}

// ✅ API 요청 시 인증 헤더 추가 (유틸리티)
export async function authenticatedFetch(url, options = {}) {
  // 세션 만료 확인
  const sessionValid = await checkSessionExpiry();
  if (!sessionValid) {
    throw new Error('세션이 만료되었습니다');
  }

  // 기본 옵션 설정
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    // 401 오류 시 자동 로그아웃
    if (response.status === 401) {
      console.log('⚠️ 인증 실패 - 자동 로그아웃');
      await logout(false);
      throw new Error('인증이 필요합니다');
    }
    
    return response;
  } catch (error) {
    console.error('❌ 인증된 요청 실패:', error);
    throw error;
  }
}

// ✅ 사용자 정보 업데이트 (프로필 변경 시)
export function updateCurrentUser(userData) {
  if (currentUser) {
    currentUser = { ...currentUser, ...userData };
    console.log('✅ 사용자 정보 업데이트됨:', currentUser);
  }
}

// ✅ 로그인 상태 확인 (빠른 체크)
export function isLoggedIn() {
  return currentUser !== null;
}

// ✅ 전역 함수로 노출 (HTML에서 직접 호출 가능)
window.login = login;
window.register = register;
window.logout = logout;
window.checkAuthStatus = checkAuthStatus;

// ✅ 주기적 세션 확인 (30분마다)
setInterval(async () => {
  if (currentUser) {
    await checkSessionExpiry();
  }
}, 30 * 60 * 1000); // 30분

console.log('✅ auth.js 모듈 로드 완료');