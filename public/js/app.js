// 로그인
async function login() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    
    if (!username || !password) {
      showToast('오류', '아이디와 비밀번호를 입력해주세요.', 'error');
      return;
    }
    
    try {
      // 실제 구현에서는 서버 API 호출
      // const response = await fetch('/api/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, password })
      // });
      
      // 테스트용 임시 코드
      const mockResponse = { ok: true, token: 'mock-token' };
      
      if (mockResponse.ok) {
        if (rememberMe.checked) {
          localStorage.setItem('authToken', mockResponse.token);
          localStorage.setItem('username', username);
        } else {
          sessionStorage.setItem('authToken', mockResponse.token);
          sessionStorage.setItem('username', username);
        }
        
        showApp(username);
        showToast('성공', '로그인되었습니다.', 'success');
      } else {
        showToast('오류', '아이디 또는 비밀번호가 일치하지 않습니다.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('오류', '로그인 중 오류가 발생했습니다.', 'error');
    }
  }
  
  // 회원가입
  async function register() {
    const username = registerUsername.value.trim();
    const password = registerPassword.value;
    const confirmPassword = registerConfirmPassword.value;
    
    if (!username || !password) {
      showToast('오류', '아이디와 비밀번호를 입력해주세요.', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showToast('오류', '비밀번호가 일치하지 않습니다.', 'error');
      return;
    }
    
    try {
      // 실제 구현에서는 서버 API 호출
      // const response = await fetch('/api/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, password })
      // });
      
      // 테스트용 임시 코드
      const mockResponse = { ok: true, token: 'mock-token' };
      
      if (mockResponse.ok) {
        localStorage.setItem('authToken', mockResponse.token);
        localStorage.setItem('username', username);
        
        showApp(username);
        showToast('성공', '회원가입이 완료되었습니다.', 'success');
      } else {
        showToast('오류', '회원가입 중 오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      showToast('오류', '회원가입 중 오류가 발생했습니다.', 'error');
    }
  }
  
  // 로그아웃
  function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('username');
    
    hideApp();
    showToast('성공', '로그아웃되었습니다.', 'success');
  }
  
  // 사용자 데이터 가져오기
  async function fetchUserData() {
    try {
      // 실제 구현에서는 서버 API 호출
      // const response = await fetch('/api/user', {
      //   headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      // });
      
      // 테스트용 임시 코드
      const mockUserData = {
        username: localStorage.getItem('username') || sessionStorage.getItem('username'),
        joinDate: '2023년 5월 1일',
        routineCount: 3,
        completedCount: 12
      };
      
      updateProfileData(mockUserData);
      fetchRecentRoutines();
      fetchTodaySchedule();
    } catch (error) {
      console.error('Fetch user data error:', error);
    }
  }
  
  // 프로필 데이터 업데이트
  function updateProfileData(userData) {
    document.getElementById('profile-username').textContent = userData.username;
    document.getElementById('profile-join-date').textContent = `가입일: ${userData.joinDate}`;
    document.getElementById('profile-routine-count').textContent = userData.routineCount;
    document.getElementById('profile-completed-count').textContent = userData.completedCount;
    document.getElementById('profile-display-name').value = userData.username;
    document.getElementById('profile-email').value = userData.email || '';
  }
  
  // 최근 루틴 가져오기
  async function fetchRecentRoutines() {
    try {
      // 실제 구현에서는 서버 API 호출
      // const response = await fetch('/api/routines/recent', {
      //   headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      // });
      
      // 테스트용 임시 코드
      const mockRoutines = [
        { id: 1, title: '수능 대비 학습 루틴', createdAt: '2023-05-01', subjects: ['국어', '수학', '영어'] },
        { id: 2, title: '자격증 준비 루틴', createdAt: '2023-04-15', subjects: ['정보처리기사', '데이터베이스'] }
      ];
      
      renderRecentRoutines(mockRoutines);
    } catch (error) {
      console.error('Fetch recent routines error:', error);
    }
  }
  
  // 오늘의 일정 가져오기
  async function fetchTodaySchedule() {
    try {
      // 실제 구현에서는 서버 API 호출
      // const response = await fetch('/api/schedule/today', {
      //   headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      // });
      
      // 테스트용 임시 코드
      const mockSchedule = [
        { id: 1, title: '수학 문제풀이', time: '09:00-11:00', completed: false },
        { id: 2, title: '영어 회화 연습', time: '13:00-14:30', completed: false },
        { id: 3, title: '프로그래밍 공부', time: '16:00-18:00', completed: true }
      ];
      
      renderTodaySchedule(mockSchedule);
    } catch (error) {
      console.error('Fetch today schedule error:', error);
    }
  }
  
  // 최근 루틴 렌더링
  function renderRecentRoutines(routines) {
    const container = document.getElementById('recent-routines-list');
    container.innerHTML = '';
    
    if (routines.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="ri-calendar-todo-line"></i>
          <p>생성된 루틴이 없습니다.<br>새 루틴을 생성해보세요!</p>
        </div>
      `;
      return;
    }
    
    routines.forEach(routine => {
      const el = document.createElement('div');
      el.className = 'routine-item';
      el.innerHTML = `
        <div class="routine-item-content">
          <h3>${routine.title}</h3>
          <p>${routine.subjects.join(', ')}</p>
        </div>
        <i class="ri-arrow-right-s-line"></i>
      `;
      
      el.addEventListener('click', () => {
        // 루틴 상세 보기 로직
      });
      
      container.appendChild(el);
    });
  }
  
  // 오늘의 일정 렌더링
  function renderTodaySchedule(schedule) {
    const container = document.getElementById('today-schedule-list');
    container.innerHTML = '';
    
    if (schedule.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="ri-calendar-check-line"></i>
          <p>오늘의 일정이 없습니다.</p>
        </div>
      `;
      return;
    }
    
    schedule.forEach(item => {
      const el = document.createElement('div');
      el.className = 'schedule-item';
      el.innerHTML = `
        <div class="schedule-item-content">
          <h3>${item.title}</h3>
          <p>${item.time}</p>
        </div>
        <div class="schedule-item-status">
          ${item.completed 
            ? '<i class="ri-checkbox-circle-fill" style="color: var(--success);"></i>' 
            : '<i class="ri-time-line" style="color: var(--primary);"></i>'}
        </div>
      `;
      
      container.appendChild(el);
    });
  }
  
  // ==== 루틴 관련 함수 ====
  
  // 루틴 모달 표시
  function showRoutineModal() {
    currentRoutineItems = [];
    routineItemsContainer.innerHTML = '';
    document.getElementById('routine-start-date').valueAsDate = new Date();
    
    routineModal.classList.add('active');
  }
  
  // 루틴 모달 숨기기
  function hideRoutineModal() {
    routineModal.classList.remove('active');
  }
  
  // 루틴 항목 모달 표시
  function showRoutineItemModal() {
    routineItemModal.classList.add('active');
  }
  
  // 루틴 항목 모달 숨기기
  function hideRoutineItemModal() {
    routineItemModal.classList.remove('active');
  }
  
  // 루틴 결과 모달 표시
  function showRoutineResultModal() {
    routineResultModal.classList.add('active');
  }
  
  // 루틴 결과 모달 숨기기
  function hideRoutineResultModal() {
    routineResultModal.classList.remove('active');
  }
  
  // 일정 편집 모달 표시
  function showEditScheduleModal() {
    const currentDayRoutine = dailyRoutines[currentDayIndex];
    
    if (!currentDayRoutine || !currentDayRoutine.schedules) {
      showToast('오류', '편집할 일정이 없습니다.', 'error');
      return;
    }
    
    renderScheduleItems(currentDayRoutine.schedules);
    editScheduleModal.classList.add('active');
  }
  
  // 일정 편집 모달 숨기기
  function hideEditScheduleModal() {
    editScheduleModal.classList.remove('active');
  }
  
  // 이벤트 상세 모달 표시
  function showEventDetailModal() {
    eventDetailModal.classList.add('active');
  }
  
  // 이벤트 상세 모달 숨기기
  function hideEventDetailModal() {
    eventDetailModal.classList.remove('active');
    currentEvent = null;
  }
  
  // 모든 모달 닫기
  function closeAllModals() {
    routineModal.classList.remove('active');
    routineItemModal.classList.remove('active');
    routineResultModal.classList.remove('active');
    editScheduleModal.classList.remove('active');
    eventDetailModal.classList.remove('active');
  }
  
  // 루틴 항목 저장
  function saveRoutineItem() {
    const subject = document.getElementById('subject').value.trim();
    const dailyHours = parseFloat(document.getElementById('daily-hours').value);
    const focusTime = document.getElementById('focus-time').value;
    const unavailableTimes = document.getElementById('unavailable-times').value.trim();
    const priority = document.getElementById('priority').value;
    const notes = document.getElementById('notes').value.trim();
    
    // 요일 선택 확인
    const selectedDays = [];
    document.querySelectorAll('.day-checkbox input:checked').forEach(checkbox => {
      selectedDays.push(checkbox.value);
    });
    
    if (!subject || isNaN(dailyHours) || !focusTime) {
      showToast('오류', '필수 항목을 모두 입력해주세요.', 'error');
      return;
    }
    
    const routineItem = {
      subject,
      dailyHours,
      focusTime,
      unavailableTimes,
      priority,
      selectedDays,
      notes
    };
    
    if (currentEditingItemIndex !== null) {
      currentRoutineItems[currentEditingItemIndex] = routineItem;
    } else {
      currentRoutineItems.push(routineItem);
    }
    
    renderRoutineItems();
    hideRoutineItemModal();
  }
  
  // 루틴 항목 렌더링
  function renderRoutineItems() {
    routineItemsContainer.innerHTML = '';
    
    currentRoutineItems.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'routine-item';
      el.innerHTML = `
        <div class="routine-item-content">
          <h3>${item.subject}</h3>
          <p>${item.dailyHours}시간/일, ${getFocusTimeText(item.focusTime)}</p>
        </div>
        <i class="ri-edit-line"></i>
      `;
      
      el.addEventListener('click', () => {
        editRoutineItem(index);
      });
      
      routineItemsContainer.appendChild(el);
    });
  }
  
  // 루틴 항목 폼 초기화
  function resetRoutineItemForm() {
    document.getElementById('subject').value = '';
    document.getElementById('daily-hours').value = '2';
    document.getElementById('focus-time').value = '';
    document.getElementById('unavailable-times').value = '';
    document.getElementById('priority').value = 'medium';
    document.getElementById('notes').value = '';
    
    document.querySelectorAll('.day-checkbox input').forEach(checkbox => {
      checkbox.checked = false;
    });
  }
  
  // 루틴 항목 편집
  function editRoutineItem(index) {
    currentEditingItemIndex = index;
    const item = currentRoutineItems[index];
    
    document.getElementById('routine-item-number').textContent = index + 1;
    document.getElementById('subject').value = item.subject;
    document.getElementById('daily-hours').value = item.dailyHours;
    document.getElementById('focus-time').value = item.focusTime;
    document.getElementById('unavailable-times').value = item.unavailableTimes || '';
    document.getElementById('priority').value = item.priority;
    document.getElementById('notes').value = item.notes || '';
    
    document.querySelectorAll('.day-checkbox input').forEach(checkbox => {
      checkbox.checked = item.selectedDays && item.selectedDays.includes(checkbox.value);
    });
    
    showRoutineItemModal();
  }
  
  // 집중 시간대 텍스트 가져오기
  function getFocusTimeText(focusTime) {
    const focusTimeMap = {
      'morning': '아침 (5-9시)',
      'forenoon': '오전 (9-12시)',
      'afternoon': '오후 (12-18시)',
      'evening': '저녁 (18-22시)',
      'night': '밤 (22-2시)'
    };
    
    return focusTimeMap[focusTime] || focusTime;
  }
  
  // 루틴 생성 (AI 호출)
  async function generateRoutine() {
    showToast('정보', 'AI가 루틴을 생성 중입니다...', 'info');
    hideRoutineModal();
    
    try {
      // 실제 구현에서는 서버 API 호출
      // const response = await fetch('/api/generate-routine', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${getAuthToken()}`
      //   },
      //   body: JSON.stringify({
      //     routineItems: currentRoutineItems,
      //     startDate: document.getElementById('routine-start-date').value,
      //     duration: document.getElementById('routine-duration').value
      //   })
      // });
      
      // 테스트용 임시 응답
      await new Promise(resolve => setTimeout(resolve, 1500)); // 로딩 시간 시뮬레이션
      
      const mockResponse = {
        fullRoutine: generateMockRoutine(),
        dailyRoutines: generateMockDailyRoutines()
      };
      
      generatedRoutine = mockResponse.fullRoutine;
      dailyRoutines = mockResponse.dailyRoutines;
      currentDayIndex = 0;
      
      fullRoutineContent.textContent = generatedRoutine;
      updateDailyRoutineView();
      
      showRoutineResultModal();
    } catch (error) {
      console.error('Generate routine error:', error);
      showToast('오류', '루틴 생성 중 오류가 발생했습니다.', 'error');
    }
  }
  
  // 일별 루틴 뷰 업데이트
  function updateDailyRoutineView() {
    if (dailyRoutines.length === 0) {
      return;
    }
    
    const currentDayRoutine = dailyRoutines[currentDayIndex];
    currentDayDisplay.textContent = `${currentDayIndex + 1}일차 (${currentDayRoutine.date})`;
    dailyRoutineContent.textContent = currentDayRoutine.content;
    
    // 이전/다음 버튼 활성화 상태 조정
    prevDayBtn.disabled = currentDayIndex === 0;
    nextDayBtn.disabled = currentDayIndex === dailyRoutines.length - 1;
  }
  
  // 일정 항목 렌더링
  function renderScheduleItems(schedules) {
    scheduleItemsContainer.innerHTML = '';
    
    schedules.forEach((schedule, index) => {
      const el = document.createElement('div');
      el.className = 'schedule-item';
      el.draggable = true;
      el.innerHTML = `
        <div class="schedule-item-drag">
          <i class="ri-drag-move-line"></i>
        </div>
        <div class="schedule-item-content">
          <input type="time" value="${schedule.startTime}" data-index="${index}" class="schedule-start-time">
          - 
          <input type="time" value="${schedule.endTime}" data-index="${index}" class="schedule-end-time">
          <input type="text" value="${schedule.title}" data-index="${index}" class="schedule-title">
        </div>
        <div class="schedule-item-actions">
          <button class="btn btn-icon delete-schedule" data-index="${index}">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      `;
      
      // 삭제 버튼 이벤트
      el.querySelector('.delete-schedule').addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'));
        schedules.splice(idx, 1);
        renderScheduleItems(schedules);
      });
      
      // 드래그 앤 드롭 구현 (여기에 추가)
      
      scheduleItemsContainer.appendChild(el);
    });
  }
  
  // 일정 편집 저장
  function saveScheduleEdit() {
    if (!dailyRoutines[currentDayIndex] || !dailyRoutines[currentDayIndex].schedules) {
      return;
    }
    
    const schedules = dailyRoutines[currentDayIndex].schedules;
    
    // 수정된 스케줄 정보 가져오기
    document.querySelectorAll('.schedule-start-time').forEach(input => {
      const index = parseInt(input.getAttribute('data-index'));
      schedules[index].startTime = input.value;
    });
    
    document.querySelectorAll('.schedule-end-time').forEach(input => {
      const index = parseInt(input.getAttribute('data-index'));
      schedules[index].endTime = input.value;
    });
    
    document.querySelectorAll('.schedule-title').forEach(input => {
      const index = parseInt(input.getAttribute('data-index'));
      schedules[index].title = input.value;
    });
    
    // 일별 루틴 컨텐츠 업데이트
    updateDailyRoutineContent();
    
    hideEditScheduleModal();
    showToast('성공', '일정이 수정되었습니다.', 'success');
  }
  
  // 일별 루틴 컨텐츠 업데이트
  function updateDailyRoutineContent() {
    const currentDayRoutine = dailyRoutines[currentDayIndex];
    
    if (!currentDayRoutine || !currentDayRoutine.schedules) {
      return;
    }
    
    // 스케줄을 시간 순으로 정렬
    currentDayRoutine.schedules.sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });
    
    // 새로운 컨텐츠 생성
    let content = `${currentDayRoutine.date} 일정:\n\n`;
    
    currentDayRoutine.schedules.forEach(schedule => {
      content += `${schedule.startTime}-${schedule.endTime}: ${schedule.title}\n`;
    });
    
    currentDayRoutine.content = content;
    dailyRoutineContent.textContent = content;
  }
  
  // 캘린더에 루틴 저장
  function saveRoutineToCalendar() {
    if (!dailyRoutines.length) {
      showToast('오류', '저장할 루틴이 없습니다.', 'error');
      return;
    }
    
    // 캘린더 페이지로 이동
    document.querySelector('.nav-item[data-page="calendar"]').click();
    
    // 저장 전 캘린더 준비
    if (!calendar) {
      initCalendar();
    }
    
    // 기존 이벤트 모두 제거
    calendar.getEvents().forEach(event => event.remove());
    
    // 시작 날짜 가져오기
    const startDate = new Date(document.getElementById('routine-start-date').value);
    
    // 모든 일별 루틴을 캘린더에 추가
    dailyRoutines.forEach((dayRoutine, dayIndex) => {
      const eventDate = new Date(startDate);
      eventDate.setDate(startDate.getDate() + dayIndex);
      
      const dateString = eventDate.toISOString().split('T')[0];
      
      if (dayRoutine.schedules) {
        dayRoutine.schedules.forEach(schedule => {
          const startDateTime = `${dateString}T${schedule.startTime}:00`;
          const endDateTime = `${dateString}T${schedule.endTime}:00`;
          
          // 색상 결정
          const subjectColors = {
            '수학': '#4361ee',
            '영어': '#3a0ca3',
            '국어': '#7209b7',
            '과학': '#4cc9f0',
            '사회': '#f72585',
            '프로그래밍': '#4f772d',
            '음악': '#ff7b00',
            '미술': '#ff9e00',
            '체육': '#ff4d6d'
          };
          
          let color = '#4361ee'; // 기본 색상
          
          for (const subject in subjectColors) {
            if (schedule.title.includes(subject)) {
              color = subjectColors[subject];
              break;
            }
          }
          
          calendar.addEvent({
            id: `routine-${dayIndex}-${Math.random().toString(36).substr(2, 9)}`,
            title: schedule.title,
            start: startDateTime,
            end: endDateTime,
            backgroundColor: color,
            borderColor: color,
            extendedProps: {
              subject: schedule.subject,
              notes: schedule.notes || '',
              completed: false
            }
          });
        });
      }
    });
    
    hideRoutineResultModal();
    showToast('성공', '루틴이 캘린더에 저장되었습니다.', 'success');
    
    // 루틴 저장 API 호출 (실제 구현시 추가)
  }
  
  // 이벤트 상세 정보 표시
  function showEventDetails(event) {
    currentEvent = event;
    
    eventTitle.textContent = event.title;
    
    const start = event.start;
    const end = event.end || new Date(start.getTime() + 60 * 60 * 1000);
    
    const timeFormatter = new Intl.DateTimeFormat('ko', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const dateFormatter = new Intl.DateTimeFormat('ko', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    eventTime.textContent = `시간: ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
    eventDate.textContent = `날짜: ${dateFormatter.format(start)}`;
    
    const subject = event.extendedProps?.subject || '';
    eventSubject.textContent = `과목: ${subject || event.title}`;
    
    const notes = event.extendedProps?.notes || '';
    eventNotes.textContent = notes || '메모 없음';
    
    // 완료 상태에 따라 버튼 상태 변경
    if (event.extendedProps?.completed) {
      completeEventBtn.textContent = '완료 취소';
      completeEventBtn.classList.remove('btn-primary');
      completeEventBtn.classList.add('btn-secondary');
    } else {
      completeEventBtn.textContent = '완료';
      completeEventBtn.classList.remove('btn-secondary');
      completeEventBtn.classList.add('btn-primary');
    }
    
    showEventDetailModal();
  }
  
  // ==== 유틸리티 함수 ====
  
  // 앱 화면 표시
  function showApp(username) {
    loginContainer.style.display = 'none';
    appContainer.style.display = 'flex';
    
    document.getElementById('username-display').textContent = username;
  }
  
  // 앱 화면 숨기기
  function hideApp() {
    appContainer.style.display = 'none';
    loginContainer.style.display = 'flex';
    loginTab.click();
  }
  
  // 인증 토큰 가져오기
  function getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }
  
  // 토스트 알림 표시
  function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon;
    switch (type) {
      case 'success':
        icon = 'ri-checkbox-circle-line';
        break;
      case 'error':
        icon = 'ri-error-warning-line';
        break;
      case 'warning':
        icon = 'ri-alert-line';
        break;
      default:
        icon = 'ri-information-line';
    }
    
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="${icon}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;
    
    const toastContainer = document.getElementById('toast-container');
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }
  
  // ==== 테스트용 더미 데이터 생성 함수 ====
  
  // 전체 루틴 더미 데이터 생성
  function generateMockRoutine() {
    return `AI가 생성한 ${currentRoutineItems.length}개 과목 학습 루틴:

이 학습 계획은 ${document.getElementById('routine-duration').value}일 동안의 일정입니다.
시작일: ${document.getElementById('routine-start-date').value}

## 과목별 시간 배분
${currentRoutineItems.map(item => `- ${item.subject}: 일 ${item.dailyHours}시간, 우선순위 ${item.priority}`).join('\n')}

## 전체 루틴 요약
1. 아침 시간대 (05:00-09:00): 집중력이 필요한 과목
2. 오전 시간대 (09:00-12:00): 기초 개념 학습
3. 오후 시간대 (12:00-18:00): 실습 및 응용
4. 저녁 시간대 (18:00-22:00): 복습 및 문제 풀이
5. 밤 시간대 (22:00-02:00): 가벼운 학습 및 정리

자세한 일정은 일별 보기에서 확인하실 수 있습니다.`;
  }
  
  // 일별 루틴 더미 데이터 생성
  function generateMockDailyRoutines() {
    const startDate = new Date(document.getElementById('routine-start-date').value);
    const duration = parseInt(document.getElementById('routine-duration').value);
    const dailyRoutines = [];
    
    for (let day = 0; day < duration; day++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + day);
      
      const dateFormatter = new Intl.DateTimeFormat('ko', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      
      const formattedDate = dateFormatter.format(date);
      
      // 일별 스케줄 생성
      const schedules = generateDaySchedules(day);
      
      // 일별 컨텐츠 생성
      let content = `${formattedDate} 일정:\n\n`;
      
      schedules.forEach(schedule => {
        content += `${schedule.startTime}-${schedule.endTime}: ${schedule.title}\n`;
      });
      
      dailyRoutines.push({
        day: day + 1,
        date: formattedDate,
        content: content,
        schedules: schedules
      });
    }
    
    return dailyRoutines;
  }
  
  // 일별 스케줄 생성
  function generateDaySchedules(day) {
    const schedules = [];
    const subjects = currentRoutineItems.map(item => item.subject);
    
    // 요일에 따라 스케줄 생성 로직 변경
    const dayOfWeek = (day % 7);
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // 토/일
    
    // 시간대별 스케줄 추가
    const timeSlots = isWeekend 
      ? ['08:00', '10:00', '13:00', '15:00', '17:00'] 
      : ['07:00', '09:00', '13:00', '16:00', '19:00'];
    
    timeSlots.forEach((startTime, index) => {
      // 끝 시간 계산
      const endTimeHour = parseInt(startTime.split(':')[0]) + 2;
      const endTime = `${String(endTimeHour).padStart(2, '0')}:00`;
      
      // 과목 선택
      const subjectIndex = (index + day) % subjects.length;
      const subject = subjects[subjectIndex];
      
      // 과목별 서로 다른 활동 생성
      const activities = {
        '수학': ['개념 학습', '기본 문제 풀이', '심화 문제 풀이', '오답 노트 정리', '모의고사 풀이'],
        '영어': ['단어 암기', '문법 학습', '독해 연습', '듣기 연습', '말하기 연습'],
        '국어': ['문학 작품 읽기', '문법 개념 정리', '비문학 독해', '작문 연습', '기출 문제 분석'],
        '과학': ['이론 학습', '개념 정리', '실험 리포트', '문제 풀이', '심화 개념 학습'],
        '사회': ['역사 연표 정리', '개념 요약', '기출 문제 풀이', '논술 연습', '시사 이슈 정리'],
        '프로그래밍': ['기본 문법 학습', '알고리즘 문제 풀이', '프로젝트 작업', '코드 리뷰', '디버깅 연습'],
        '음악': ['이론 학습', '감상 및 분석', '연주 연습', '창작 활동', '리듬 연습'],
        '미술': ['스케치 연습', '색채 이론 학습', '작품 분석', '창작 활동', '미술사 학습'],
        '체육': ['기초 체력 훈련', '기술 연습', '전술 학습', '경기 분석', '회복 트레이닝']
      };
      
      // 기본 활동
      let activity = '학습';
      
      // 과목별 활동이 있는 경우
      if (activities[subject]) {
        const activityIndex = (day + index) % activities[subject].length;
        activity = activities[subject][activityIndex];
      }
      
      // 스케줄 추가
      schedules.push({
        startTime: startTime,
        endTime: endTime,
        title: `${subject} - ${activity}`,
        subject: subject,
        notes: `${subject} ${activity}에 집중하세요. ${isWeekend ? '주말에는 여유있게 학습하세요.' : ''}`
      });
    });
    
    return schedules;
  }
  
  // 앱 초기화 및 실행
  function init() {
    checkAutoLogin();
    initTabSwitching();
    initEventListeners();
  };
  
document.addEventListener('DOMContentLoaded', () => {
  // DOM 요소
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');
  
  // 로그인/회원가입 관련 요소
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginUsername = document.getElementById('login-username');
  const loginPassword = document.getElementById('login-password');
  const rememberMe = document.getElementById('remember-me');
  const backToLoginBtn = document.getElementById('back-to-login');
  const logoutBtn = document.getElementById('logout-btn');
  
  // 네비게이션 관련 요소
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  
  // 루틴 생성 관련 요소
  const createRoutineBtn = document.getElementById('create-routine-btn');
  const routineModal = document.getElementById('routine-modal');
  const routineItemModal = document.getElementById('routine-item-modal');
  const routineResultModal = document.getElementById('routine-result-modal');
  const editScheduleModal = document.getElementById('edit-schedule-modal');
  const eventDetailModal = document.getElementById('event-detail-modal');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  const addRoutineItemBtn = document.getElementById('add-routine-item');
  const routineItemsContainer = document.getElementById('routine-items-container');
  const routineItemForm = document.getElementById('routine-item-form');
  const routineItemNumber = document.getElementById('routine-item-number');
  const saveRoutineItemBtn = document.getElementById('save-routine-item');
  const cancelRoutineItemBtn = document.getElementById('cancel-routine-item');
  const deleteRoutineItemBtn = document.getElementById('delete-routine-item');
  const generateRoutineBtn = document.getElementById('generate-routine');
  const cancelRoutineBtn = document.getElementById('cancel-routine');
  
  // 루틴 결과 관련 요소
  const resultTabs = document.querySelectorAll('.tab[data-tab]');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const prevDayBtn = document.getElementById('prev-day');
  const nextDayBtn = document.getElementById('next-day');
  const currentDayDisplay = document.getElementById('current-day-display');
  const fullRoutineContent = document.getElementById('full-routine-content');
  const dailyRoutineContent = document.getElementById('daily-routine-content');
  const editDailyRoutineBtn = document.getElementById('edit-daily-routine');
  const regenerateRoutineBtn = document.getElementById('regenerate-routine');
  const saveToCalendarBtn = document.getElementById('save-to-calendar');
  
  // 일정 편집 관련 요소
  const scheduleItemsContainer = document.getElementById('schedule-items-container');
  const saveScheduleEditBtn = document.getElementById('save-schedule-edit');
  const cancelScheduleEditBtn = document.getElementById('cancel-schedule-edit');
  
  // 캘린더 관련 요소
  const calendarEl = document.getElementById('calendar');
  let calendar;
  
  // 이벤트 상세 관련 요소
  const eventTitle = document.getElementById('event-title');
  const eventTime = document.getElementById('event-time');
  const eventDate = document.getElementById('event-date');
  const eventSubject = document.getElementById('event-subject');
  const eventNotes = document.getElementById('event-notes');
  const deleteEventBtn = document.getElementById('delete-event');
  const editEventBtn = document.getElementById('edit-event');
  const completeEventBtn = document.getElementById('complete-event');
  
  // 전역 상태 변수
  let currentRoutineItems = [];
  let currentRoutineId = null;
  let currentEditingItemIndex = null;
  let generatedRoutine = null;
  let currentDayIndex = 0;
  let dailyRoutines = [];
  let currentEvent = null;
  
  // ==== 초기화 함수 ====
  
  // 자동 로그인 확인
  function checkAutoLogin() {
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    
    if (token) {
      showApp(username);
      fetchUserData();
    }
  }
  
  // 캘린더 초기화
  function initCalendar() {
    if (calendar) {
      calendar.destroy();
    }
    
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      height: 'auto',
      eventClick: function(info) {
        showEventDetails(info.event);
      },
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      locale: 'ko',
      buttonText: {
        today: '오늘',
        month: '월',
        week: '주',
        day: '일'
      }
    });
    
    calendar.render();
  }
  
  // 앱 초기화
  function init() {
    checkAutoLogin();
    initTabSwitching();
    initEventListeners();
  }
  
  // ==== 이벤트 리스너 ====
  
  // 탭 전환 초기화
  function initTabSwitching() {
    // 로그인/회원가입 탭
    loginTab.addEventListener('click', () => {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
    });
    
    registerTab.addEventListener('click', () => {
      registerTab.classList.add('active');
      loginTab.classList.remove('active');
      registerForm.style.display = 'block';
      loginForm.style.display = 'none';
    });
    
    backToLoginBtn.addEventListener('click', () => {
      loginTab.click();
    });
    
    // 결과 모달 탭
    resultTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        resultTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabName = tab.getAttribute('data-tab');
        tabPanes.forEach(pane => {
          pane.classList.remove('active');
          if (pane.id === tabName) {
            pane.classList.add('active');
          }
        });
      });
    });
  }
  
  // 모든 이벤트 리스너 초기화
  function initEventListeners() {
    // 로그인 폼 제출
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      login();
    });
    
    // 회원가입 폼 제출
    
    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
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
        // 실제 구현에서는 서버 API 호출
        const response = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.ok) {
            localStorage.setItem('authToken', data.token || 'mock-token');
            localStorage.setItem('username', username);
            
            showApp(username);
            showToast('성공', '회원가입이 완료되었습니다.', 'success');
          } else {
            showToast('오류', data.message || '회원가입 중 오류가 발생했습니다.', 'error');
          }
        } else {
          const data = await response.json();
          showToast('오류', data.message || '회원가입 중 오류가 발생했습니다.', 'error');
        }
      } catch (error) {
        console.error('Register error:', error);
        showToast('오류', '회원가입 중 오류가 발생했습니다.', 'error');
      }
    });
    // 로그아웃 버튼
    logoutBtn.addEventListener('click', () => {
      logout();
    });
    
    // 사이드바 네비게이션
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(navItem => navItem.classList.remove('active'));
        item.classList.add('active');
        
        const pageName = item.getAttribute('data-page');
        pages.forEach(page => {
          page.classList.remove('active');
          if (page.id === `${pageName}-page`) {
            page.classList.add('active');
            
            // 캘린더 페이지인 경우 캘린더 초기화
            if (pageName === 'calendar') {
              initCalendar();
            }
          }
        });
      });
    });
    
    // 모달 닫기 버튼들
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        closeAllModals();
      });
    });
    
    // 루틴 생성 버튼
    createRoutineBtn.addEventListener('click', () => {
      showRoutineModal();
    });
    
    // 루틴 항목 추가 버튼
    addRoutineItemBtn.addEventListener('click', () => {
      if (currentRoutineItems.length >= 10) {
        showToast('오류', '최대 10개의 항목만 추가할 수 있습니다.', 'error');
        return;
      }
      
      currentEditingItemIndex = null;
      resetRoutineItemForm();
      routineItemNumber.textContent = currentRoutineItems.length + 1;
      showRoutineItemModal();
    });
    
    // 루틴 항목 저장 버튼
    saveRoutineItemBtn.addEventListener('click', () => {
      saveRoutineItem();
    });
    
    // 루틴 항목 취소 버튼
    cancelRoutineItemBtn.addEventListener('click', () => {
      hideRoutineItemModal();
    });
    
    // 루틴 항목 삭제 버튼
    deleteRoutineItemBtn.addEventListener('click', () => {
      if (currentEditingItemIndex !== null) {
        currentRoutineItems.splice(currentEditingItemIndex, 1);
        renderRoutineItems();
        hideRoutineItemModal();
      }
    });
    
    // 루틴 생성 취소 버튼
    cancelRoutineBtn.addEventListener('click', () => {
      hideRoutineModal();
    });
    
    // 루틴 생성 버튼
    generateRoutineBtn.addEventListener('click', () => {
      if (currentRoutineItems.length === 0) {
        showToast('오류', '최소 1개 이상의 항목을 추가해주세요.', 'error');
        return;
      }
      
      generateRoutine();
    });
    
    // 이전 날 버튼
    prevDayBtn.addEventListener('click', () => {
      if (currentDayIndex > 0) {
        currentDayIndex--;
        updateDailyRoutineView();
      }
    });
    
    // 다음 날 버튼
    nextDayBtn.addEventListener('click', () => {
      if (currentDayIndex < dailyRoutines.length - 1) {
        currentDayIndex++;
        updateDailyRoutineView();
      }
    });
    
    // 일일 루틴 편집 버튼
    editDailyRoutineBtn.addEventListener('click', () => {
      showEditScheduleModal();
    });
    
    // 일정 편집 저장 버튼
    saveScheduleEditBtn.addEventListener('click', () => {
      saveScheduleEdit();
    });
    
    // 일정 편집 취소 버튼
    cancelScheduleEditBtn.addEventListener('click', () => {
      hideEditScheduleModal();
    });
    
    // 루틴 다시 생성 버튼
    regenerateRoutineBtn.addEventListener('click', () => {
      generateRoutine();
    });
    
    // 캘린더에 저장 버튼
    saveToCalendarBtn.addEventListener('click', () => {
      saveRoutineToCalendar();
    });
    
    // 이벤트 삭제 버튼
    deleteEventBtn.addEventListener('click', () => {
      if (currentEvent) {
        if (confirm('이 일정을 삭제하시겠습니까?')) {
          calendar.getEventById(currentEvent.id).remove();
          hideEventDetailModal();
          showToast('성공', '일정이 삭제되었습니다.', 'success');
        }
      }
    });
    
    // 이벤트 편집 버튼
    editEventBtn.addEventListener('click', () => {
      if (currentEvent) {
        // 여기에 이벤트 편집 로직 추가
        hideEventDetailModal();
      }
    });
    
    // 이벤트 완료 버튼
    completeEventBtn.addEventListener('click', () => {
      if (currentEvent) {
        const event = calendar.getEventById(currentEvent.id);
        event.setProp('backgroundColor', '#10b981');
        hideEventDetailModal();
        showToast('성공', '일정이 완료되었습니다.', 'success');
      }
    });
  }
  
  // ==== 인증 관련 함수 ====
  
  // 로그인
  async function login() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    
    if (!username || !password) {
      showToast('오류', '아이디와 비밀번호를 입력해주세요.', 'error');
      return;
    }
    
    try {
      // 실제 구현에서는 서버 API 호출
      // const response = await fetch('/api/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, password })
      // });
      
      // 테스트용 임시 코드
      const mockResponse = { ok: true, token: 'mock-token' };
      
      if (mockResponse.ok) {
        if (rememberMe.checked) {
          localStorage.setItem('authToken', mockResponse.token);
          localStorage.setItem('username', username);
        } else {
          sessionStorage.setItem('authToken', mockResponse.token);
          sessionStorage.setItem('username', username);
        }
        
        showApp(username);
        showToast('성공', '로그인되었습니다.', 'success');
      } else {
        showToast('오류', '아이디 또는 비밀번호가 일치하지 않습니다.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('오류', '로그인 중 오류가 발생했습니다.', 'error');
    }
  }
})