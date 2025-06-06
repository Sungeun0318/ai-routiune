import { showToast, hideApp } from './ui.js';

// 🔥 개발 모드 비활성화 - 실제 백엔드 사용
const DEV_MODE = false;

// 사용자 데이터 가져오기 함수를 위한 변수 선언
let fetchUserDataFunction = null;

// fetchUserData 함수 설정
export function setFetchUserDataFunction(fn) {
  fetchUserDataFunction = fn;
}

// 자동 로그인 확인
export function checkAutoLogin() {
  return new Promise((resolve) => {
    console.log('🔍 자동 로그인 확인 중...');
    
    if (DEV_MODE) {
      const token = localStorage.getItem('authToken');
      const username = localStorage.getItem('username');
      
      if (!token || !username) {
        console.log('❌ 저장된 인증 정보 없음');
        resolve(false);
        return;
      }
      
      console.log('🔧 개발 모드: 로컬 정보로 자동 로그인');
      showApp(username);
      resolve(true);
      return;
    }
    
    // 프로덕션 모드: 세션 기반 인증 확인
    console.log('🌐 서버에 세션 검증 요청...');
    fetch('/api/me', {
      method: 'GET',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('🔍 세션 검증 응답:', response.status);
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      throw new Error('Invalid response format');
    })
    .then(data => {
      console.log('✅ 세션 검증 결과:', data);
      if (data.ok && data.user) {
        const displayName = data.user.displayName || data.user.nickname || data.user.username;
        showApp(displayName); //류찬형
        resolve(true);
      } else {
        console.log('❌ 세션 무효, 로그아웃 처리');
        logout(false);
        resolve(false);
      }
    })
    .catch(error => {
      console.error('❌ 세션 검증 오류:', error);
      logout(false);
      resolve(false);
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
  
  console.log('🔐 로그인 시도:', { username, rememberMe });
  
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
    
    showApp(username);
    
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
    
    if (response.ok && data.ok) {
  console.log('✅ 로그인 성공');

  // 🔐 토큰 저장 추가
  const token = data.token;
  if (token) {
    if (rememberMe) {
      localStorage.setItem('authToken', token);
    } else {
      sessionStorage.setItem('authToken', token);
    }
  }

  showApp({
  username: data.user?.username || username,
  nickname: data.user?.nickname || data.user?.username || username
}); //류찬형


  if (fetchUserDataFunction) {
    await fetchUserDataFunction();
  }

  showToast('성공', '로그인되었습니다.', 'success');
}else {
      console.log('❌ 로그인 실패:', data.message);
      showToast('오류', data.message || '아이디 또는 비밀번호가 일치하지 않습니다.', 'error');
    }
  } catch (error) {
    console.error('❌ 로그인 오류:', error);
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
  
  console.log('📝 회원가입 시도:', { username });
  
  if (DEV_MODE) {
    console.log('🔧 개발 모드: 로컬 회원가입 처리');
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
    
    if (response.ok && data.ok) {
      console.log('✅ 회원가입 성공');
      
      showApp({
  username: data.user.username,
  nickname: data.user.nickname
});
 //류찬형

      if (fetchUserDataFunction) {
        await fetchUserDataFunction();
      }
      showToast('성공', '회원가입이 완료되었습니다.', 'success');
    } else {
      console.log('❌ 회원가입 실패:', data.message);
      showToast('오류', data.message || '회원가입 중 오류가 발생했습니다.', 'error');
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
    return response.json();
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

// 앱 UI 표시
export function showApp(username, nickname) {
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');
  
  if (loginContainer) loginContainer.style.display = 'none';
  if (appContainer) appContainer.style.display = 'flex';
  
  // 사용자 이름 표시
  const displayName = nickname || username;

const usernameDisplay = document.getElementById('username-display');
if (usernameDisplay) {
  usernameDisplay.textContent = displayName;
}

const profileUsername = document.getElementById('profile-username');
if (profileUsername) {
  profileUsername.textContent = displayName;
}

  console.log('✅ 앱 UI 표시 완료:', username);
}

// 인증 토큰 가져오기 (세션 기반에서는 사용하지 않음)
export function getAuthToken() {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}