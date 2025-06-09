// auth.js - 인증 관련 기능
import { showToast } from './utils.js';  // ui.js → utils.js로 변경

// 개발 모드 설정
const DEV_MODE = false; // 백엔드 연결을 위해 false로 설정

// 전역 변수
let fetchUserDataFunction = null;

// 사용자 데이터 로드 함수 설정
export function setFetchUserDataFunction(fn) {
  fetchUserDataFunction = fn;
}

// 인증 토큰 가져오기 함수
export function getAuthToken() {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
}

// 앱 UI 표시
export function showApp(userInfo) {
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');
  
  if (loginContainer) loginContainer.style.display = 'none';
  if (appContainer) appContainer.style.display = 'flex';
  
  // 사용자 정보 처리
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

  // 사용자 이름 표시
  const usernameDisplay = document.getElementById('username-display');
  if (usernameDisplay) {
    usernameDisplay.textContent = nickname;
  }

  console.log('✅ 앱 UI 표시 완료:', username);
}

// 앱 UI 숨기기
export function hideApp() {
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');
  
  if (appContainer) appContainer.style.display = 'none';
  if (loginContainer) loginContainer.style.display = 'flex';
  
  console.log('✅ 앱 UI 숨김 완료');
}

// 자동 로그인 확인
export async function checkAutoLogin() {
  console.log('🔐 자동 로그인 확인 중...');
  
  if (DEV_MODE) {
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    
    if (authToken && username) {
      console.log('✅ 개발 모드: 자동 로그인 성공');
      showApp({ username });
      
      if (fetchUserDataFunction) {
        try {
          await fetchUserDataFunction();
        } catch (error) {
          console.error('사용자 데이터 로드 오류:', error);
        }
      }
      return true;
    }
    return false;
  }
  
  // 프로덕션 모드: 서버 세션 확인
  try {
    const response = await fetch('/api/me', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.ok && data.user) {
        console.log('✅ 서버 세션 확인: 자동 로그인 성공');
        showApp(data.user);
        
        if (fetchUserDataFunction) {
          try {
            await fetchUserDataFunction();
          } catch (error) {
            console.error('사용자 데이터 로드 오류:', error);
          }
        }
        return true;
      }
    }
    
    console.log('❌ 서버 세션 없음');
    return false;
  } catch (error) {
    console.error('❌ 세션 확인 오류:', error);
    return false;
  }
}

// checkAuthStatus는 checkAutoLogin과 동일
export function checkAuthStatus() {
  return checkAutoLogin();
}

// 로그인
export async function login() {
  const username = document.getElementById('login-username')?.value?.trim();
  const password = document.getElementById('login-password')?.value;
  const rememberMe = document.getElementById('remember-me')?.checked || false;
  
  if (!username || !password) {
    showToast('오류', '아이디와 비밀번호를 입력해주세요.', 'error');
    return;
  }
  
  console.log('🔑 로그인 시도:', { username, rememberMe });
  
  if (DEV_MODE) {
    console.log('🔧 개발 모드: 로컬 로그인 처리');
    const authToken = 'dev-token-' + Date.now();
    
    if (rememberMe) {
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('username', username);
    } else {
      sessionStorage.setItem('authToken', authToken);
      sessionStorage.setItem('username', username);
    }
    
    showApp({ username });
    
    if (fetchUserDataFunction) {
      try {
        await fetchUserDataFunction();
      } catch (error) {
        console.error('사용자 데이터 로드 오류:', error);
      }
    }
    
    showToast('성공', '로그인되었습니다.', 'success');
    return;
  }
  
  // 프로덕션 모드: 서버 API 호출
  try {
    console.log('🌐 서버에 로그인 요청...');
    const response = await fetch('/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    console.log('🔍 로그인 응답:', response.status);
    const data = await response.json();
    console.log('📄 로그인 응답 데이터:', data);
    
    if (response.ok && (data.ok || data.success)) {
      console.log('✅ 로그인 성공');

      showApp({
        username: data.user?.username || username,
        nickname: data.user?.nickname || data.user?.username || username
      });

      if (fetchUserDataFunction) {
        await fetchUserDataFunction();
      }

      showToast('성공', '로그인되었습니다.', 'success');
    } else {
      console.log('❌ 로그인 실패:', data.message || data.error);
      showToast('오류', data.message || data.error || '아이디 또는 비밀번호가 일치하지 않습니다.', 'error');
    }
  } catch (error) {
    console.error('❌ 로그인 오류:', error);
    showToast('오류', '로그인 중 오류가 발생했습니다.', 'error');
  }
}

// 회원가입
export async function register() {
  const username = document.getElementById('register-username')?.value?.trim();
  const password = document.getElementById('register-password')?.value;
  const confirmPassword = document.getElementById('register-confirm-password')?.value;
  
  if (!username || !password) {
    showToast('오류', '아이디와 비밀번호를 입력해주세요.', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showToast('오류', '비밀번호가 일치하지 않습니다.', 'error');
    return;
  }
  
  if (password.length < 4) {
    showToast('오류', '비밀번호는 최소 4자리 이상이어야 합니다.', 'error');
    return;
  }
  
  console.log('📝 회원가입 시도:', { username });
  
  if (DEV_MODE) {
    console.log('🔧 개발 모드: 로컬 회원가입 처리');
    const authToken = 'dev-token-' + Date.now();
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('username', username);
    
    showApp({ username });
    
    if (fetchUserDataFunction) {
      try {
        await fetchUserDataFunction();
      } catch (error) {
        console.error('사용자 데이터 로드 오류:', error);
      }
    }
    
    showToast('성공', '회원가입이 완료되었습니다.', 'success');
    return;
  }
  
  // 프로덕션 모드: 서버 API 호출
  try {
    console.log('🌐 서버에 회원가입 요청...');
    const response = await fetch('/api/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    console.log('🔍 회원가입 응답:', response.status);
    const data = await response.json();
    console.log('📄 회원가입 응답 데이터:', data);
    
    if (response.ok && (data.ok || data.success)) {
      console.log('✅ 회원가입 성공');
      
      showApp({
        username: data.user?.username || username,
        nickname: data.user?.nickname || data.user?.username || username
      });

      if (fetchUserDataFunction) {
        await fetchUserDataFunction();
      }
      
      showToast('성공', '회원가입이 완료되었습니다.', 'success');
    } else {
      console.log('❌ 회원가입 실패:', data.message || data.error);
      showToast('오류', data.message || data.error || '회원가입 중 오류가 발생했습니다.', 'error');
    }
  } catch (error) {
    console.error('❌ 회원가입 오류:', error);
    showToast('오류', '회원가입 중 오류가 발생했습니다.', 'error');
  }
}

// 로그아웃
export function logout(showNotification = true) {
  console.log('🚪 로그아웃 처리...');
  
  if (DEV_MODE) {
    console.log('🔧 개발 모드: 로컬 로그아웃 처리');
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('username');
    
    hideApp();
    
    const loginTab = document.getElementById('login-tab');
    if (loginTab) {
      loginTab.click();
    }
    
    if (showNotification) {
      showToast('성공', '로그아웃되었습니다.', 'success');
    }
    return;
  }
  
  // 프로덕션 모드: 서버 API 호출
  fetch('/api/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => {
    console.log('🔍 로그아웃 응답:', response.status);
    return response.json().catch(() => ({}));
  })
  .catch(error => {
    console.error('❌ 로그아웃 API 오류:', error);
  })
  .finally(() => {
    console.log('🗑️ 세션 정리');
    
    hideApp();
    
    const loginTab = document.getElementById('login-tab');
    if (loginTab) {
      loginTab.click();
    }
    
    if (showNotification) {
      showToast('성공', '로그아웃되었습니다.', 'success');
    }
  });
}

// 전역 함수로 등록 (window 객체에)
window.login = login;
window.register = register;
window.logout = logout;
window.getAuthToken = getAuthToken;