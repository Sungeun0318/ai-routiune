import { showToast, showApp, hideApp } from './ui.js';
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
    
    // 토큰 유효성 검사 (선택 사항)
    fetch('/api/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Invalid token');
    })
    .then(data => {
      if (data.ok && data.user) {
        // 서버 검증 성공
        showApp(data.user.username || username);
        resolve(true);
      } else {
        // 서버에서 유효한 응답을 받았지만 인증 실패
        logout(false);
        resolve(false);
      }
    })
    .catch(error => {
      console.error('Token validation error:', error);
      
      // 서버 검증 실패 시, 로컬 정보만으로 로그인 시도 (대체 방법)
      showApp(username);
      resolve(true);
      
      // 또는 서버 오류 시 로그아웃 처리 (더 안전한 방법)
      /*
      logout(false);
      resolve(false);
      */
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
    
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'flex';
    
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