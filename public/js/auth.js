import { showToast, hideApp } from './ui.js';

// 개발 모드 설정 - 서버 API가 준비되면 false로 변경
const DEV_MODE = true; // true로 변경하여 개발 모드 활성화

// 사용자 데이터 가져오기 함수를 위한 변수 선언
let fetchUserDataFunction = null;

// fetchUserData 함수 설정
export function setFetchUserDataFunction(fn) {
  fetchUserDataFunction = fn;
}

// 자동 로그인 확인
export function checkAutoLogin() {
  return new Promise((resolve) => {
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    
    if (!token || !username) {
      console.log('No stored credentials found');
      resolve(false);
      return;
    }
    
    if (DEV_MODE) {
      // 개발 모드: 로컬 정보만 사용
      console.log('Development mode: auto-login with stored credentials');
      showApp(username);
      resolve(true);
      return;
    }
    
    // 프로덕션 모드: 서버 API 호출
    fetch('/api/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      throw new Error('Invalid response format');
    })
    .then(data => {
      if (data.ok && data.user) {
        showApp(data.user.username || username);
        resolve(true);
      } else {
        logout(false);
        resolve(false);
      }
    })
    .catch(error => {
      console.error('Token validation error:', error);
      // 개발 모드처럼 로컬 정보로 로그인 처리
      showApp(username);
      resolve(true);
    });
  });
}

// 로그인
export async function login() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const rememberMe = document.getElementById('remember-me').checked;
  
  if (!username || !password) {
    showToast('오류', '아이디와 비밀번호를 입력해주세요.', 'error');
    return;
  }
  
  if (DEV_MODE) {
    // 개발 모드: 로컬에서 처리
    console.log('Development mode: login attempt for', username);
    const authToken = 'dev-token-' + Date.now();
    
    if (rememberMe) {
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('username', username);
    } else {
      sessionStorage.setItem('authToken', authToken);
      sessionStorage.setItem('username', username);
    }
    
    showApp(username);
    
    // 사용자 데이터 로드
    if (fetchUserDataFunction) {
      try {
        await fetchUserDataFunction();
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
    
    showToast('성공', '로그인되었습니다.', 'success');
    return;
  }
  
  // 프로덕션 모드: 서버 API 호출
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.ok) {
      const authToken = data.token || 'session-token';
      
      if (rememberMe) {
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('username', username);
      } else {
        sessionStorage.setItem('authToken', authToken);
        sessionStorage.setItem('username', username);
      }
      
      showApp(username);
      if (fetchUserDataFunction) {
        await fetchUserDataFunction();
      }
      showToast('성공', '로그인되었습니다.', 'success');
    } else {
      showToast('오류', data.message || '아이디 또는 비밀번호가 일치하지 않습니다.', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('오류', '로그인 중 오류가 발생했습니다.', 'error');
  }
}

// 회원가입
export async function register() {
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  
  if (!username || !password) {
    showToast('오류', '아이디와 비밀번호를 입력해주세요.', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showToast('오류', '비밀번호가 일치하지 않습니다.', 'error');
    return;
  }
  
  if (DEV_MODE) {
    // 개발 모드: 로컬에서 처리
    console.log('Development mode: registration for', username);
    const authToken = 'dev-token-' + Date.now();
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('username', username);
    
    showApp(username);
    
    if (fetchUserDataFunction) {
      try {
        await fetchUserDataFunction();
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
    
    showToast('성공', '회원가입이 완료되었습니다.', 'success');
    return;
  }
  
  // 프로덕션 모드: 서버 API 호출
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.ok) {
      localStorage.setItem('authToken', data.token || 'session-token');
      localStorage.setItem('username', username);
      
      showApp(username);
      if (fetchUserDataFunction) {
        await fetchUserDataFunction();
      }
      showToast('성공', '회원가입이 완료되었습니다.', 'success');
    } else {
      showToast('오류', data.message || '회원가입 중 오류가 발생했습니다.', 'error');
    }
  } catch (error) {
    console.error('Register error:', error);
    showToast('오류', '회원가입 중 오류가 발생했습니다.', 'error');
  }
}

// 로그아웃
export function logout(showNotification = true) {
  if (DEV_MODE) {
    // 개발 모드: 로컬에서 처리
    console.log('Development mode: logout');
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
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  })
  .catch(error => {
    console.error('Logout API error:', error);
  })
  .finally(() => {
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
  });
}

// 앱 UI 표시
export function showApp(username) {
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');
  
  if (loginContainer) loginContainer.style.display = 'none';
  if (appContainer) appContainer.style.display = 'flex';
  
  // 사용자 이름 표시
  const usernameDisplay = document.getElementById('username-display');
  if (usernameDisplay) {
    usernameDisplay.textContent = username;
  }
  
  const profileUsername = document.getElementById('profile-username');
  if (profileUsername) {
    profileUsername.textContent = username;
  }
  
  console.log('App shown for user:', username);
}

// 인증 토큰 가져오기
export function getAuthToken() {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}