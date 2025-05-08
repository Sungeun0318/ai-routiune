// ui.js에서는 showApp을 가져오지 않고 다른 함수만 가져옵니다
import { showToast, hideApp } from './ui.js';
import { fetchUserData } from './app.js';

// 자동 로그인 확인
export function checkAutoLogin() {
  return new Promise((resolve) => {
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    
    if (!token || !username) {
      resolve(false);
      return;
    }
    
    // 토큰 유효성 검사 자체를 건너뛰고 로컬 정보만 사용해 로그인
    showApp(username);
    resolve(true);
    
  // 서버 API가 준비되면 아래 코드를 사용할 수 있습니다
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
      // 서버 검증 실패 시 로컬 정보로 로그인
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
  
  try {
    const response = await fetch('/login', {
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
      fetchUserData();
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
  
  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.ok) {
      // 회원가입 후 자동 로그인
      localStorage.setItem('authToken', data.token || 'session-token');
      localStorage.setItem('username', username);
      
      showApp(username);
      fetchUserData();
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
  // 로그아웃 API 호출
  fetch('/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  })
  .catch(error => {
    console.error('Logout API error:', error);
  })
  .finally(() => {
    // 로컬 스토리지 데이터 삭제
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('username');
    
    hideApp();
    
    // 로그인 탭으로 전환
    const loginTab = document.getElementById('login-tab');
    if (loginTab) {
      loginTab.click();
    }
    
    if (showNotification) {
      showToast('성공', '로그아웃되었습니다.', 'success');
    }
  });
}

// 앱 UI 표시 (ui.js에서 import하지 않고 여기서 정의)
export function showApp(username) {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('app-container').style.display = 'flex';
  
  // 사용자 이름 표시
  const usernameDisplay = document.getElementById('username-display');
  if (usernameDisplay) {
    usernameDisplay.textContent = username;
  }
  
  const profileUsername = document.getElementById('profile-username');
  if (profileUsername) {
    profileUsername.textContent = username;
  }
}

// 프로필 업데이트
export async function updateProfile(formData) {
  try {
    const response = await fetch('/api/update-profile', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.ok) {
      showToast('성공', '프로필이 업데이트되었습니다.', 'success');
      return true;
    } else {
      showToast('오류', data.message || '프로필 업데이트 중 오류가 발생했습니다.', 'error');
      return false;
    }
  } catch (error) {
    console.error('Update profile error:', error);
    showToast('오류', '프로필 업데이트 중 오류가 발생했습니다.', 'error');
    return false;
  }
}

// 인증 토큰 가져오기
export function getAuthToken() {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}