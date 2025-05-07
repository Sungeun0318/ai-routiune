import { showToast, showApp, hideApp } from './ui.js';
import { fetchUserData } from './app.js';

// 자동 로그인 확인
export function checkAutoLogin() {
  const token = localStorage.getItem('authToken');
  const username = localStorage.getItem('username');
  
  if (token && username) {
    showApp(username);
    fetchUserData();
  }
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
export async function logout() {
  try {
    const response = await fetch('/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    // 로컬 스토리지 데이터 삭제
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('username');
    
    hideApp();
    showToast('성공', '로그아웃되었습니다.', 'success');
  } catch (error) {
    console.error('Logout error:', error);
    showToast('오류', '로그아웃 중 오류가 발생했습니다.', 'error');
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