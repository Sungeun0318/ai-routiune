// theme-switcher.js
// 테마 관련 기능을 모듈로 export

// 테마 초기화 함수
export function initThemeSettings() {
  const themeSelect = document.getElementById('theme-select');
  if (!themeSelect) return;

  // 저장된 테마 불러오기
  const savedTheme = localStorage.getItem('theme') || 'light';
  themeSelect.value = savedTheme;
  applyTheme(savedTheme);

  // 테마 변경 이벤트 리스너
  themeSelect.addEventListener('change', (e) => {
    const selectedTheme = e.target.value;
    applyTheme(selectedTheme);
    saveThemePreference(selectedTheme);
  });

  // 시스템 테마 변경 감지 (시스템 설정 따름 옵션용)
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (themeSelect.value === 'system') {
        applyTheme('system');
      }
    });
  }
}

// 테마 적용 함수
function applyTheme(theme) {
  const root = document.documentElement;
  
  if (theme === 'system') {
    // 시스템 설정 확인
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }

  if (theme === 'dark') {
    // 다크 테마 색상
    root.style.setProperty('--background', '#121212');
    root.style.setProperty('--surface', '#1e1e1e');
    root.style.setProperty('--card', '#252525');
    root.style.setProperty('--text', '#e0e0e0');
    root.style.setProperty('--text-light', '#b0b0b0');
    root.style.setProperty('--border', '#333333');
    root.style.setProperty('--primary', '#5c7cfa');
    root.style.setProperty('--primary-light', 'rgba(92, 124, 250, 0.1)');
    root.style.setProperty('--primary-dark', '#4263eb');
    root.style.setProperty('--success', '#51cf66');
    root.style.setProperty('--danger', '#ff6b6b');
    root.style.setProperty('--warning', '#ffd43b');
    root.style.setProperty('--shadow', '0 2px 8px rgba(0, 0, 0, 0.3)');
    root.style.setProperty('--shadow-md', '0 4px 16px rgba(0, 0, 0, 0.4)');
    root.style.setProperty('--shadow-lg', '0 8px 32px rgba(0, 0, 0, 0.5)');
    
    // body에 dark 클래스 추가
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  } else {
    // 라이트 테마 색상 (기본값)
    root.style.setProperty('--background', '#f8f9fa');
    root.style.setProperty('--surface', '#ffffff');
    root.style.setProperty('--card', '#ffffff');
    root.style.setProperty('--text', '#212529');
    root.style.setProperty('--text-light', '#6c757d');
    root.style.setProperty('--border', '#e9ecef');
    root.style.setProperty('--primary', '#4361ee');
    root.style.setProperty('--primary-light', '#e7f5ff');
    root.style.setProperty('--primary-dark', '#3730a3');
    root.style.setProperty('--success', '#2d9a3e');
    root.style.setProperty('--danger', '#e63946');
    root.style.setProperty('--warning', '#f77f00');
    root.style.setProperty('--shadow', '0 2px 8px rgba(0, 0, 0, 0.08)');
    root.style.setProperty('--shadow-md', '0 4px 16px rgba(0, 0, 0, 0.12)');
    root.style.setProperty('--shadow-lg', '0 8px 32px rgba(0, 0, 0, 0.16)');
    
    // body에 light 클래스 추가
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  }

  // 캘린더가 있다면 테마 변경 시 재렌더링
  if (window.calendar && typeof window.calendar.render === 'function') {
    try {
      window.calendar.render();
    } catch (e) {
      console.log('캘린더 재렌더링 스킵');
    }
  }

  console.log(`✨ 테마가 ${theme}로 변경되었습니다.`);
}

// 테마 설정 저장 (로컬 스토리지 + 서버)
async function saveThemePreference(theme) {
  // 로컬 스토리지에 저장
  localStorage.setItem('theme', theme);

  // 서버에도 저장 (로그인된 경우)
  try {
    const response = await fetch('/api/profile/preferences', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ theme })
    });

    if (response.ok) {
      console.log('✅ 테마 설정이 서버에 저장되었습니다.');
    }
  } catch (error) {
    console.error('❌ 테마 설정 저장 중 오류:', error);
  }
}