// 루틴 관련 기능들 - 백엔드 연동 버전
import { getAuthToken } from './auth.js';
import { showToast, showModal, hideModal, renderRecentRoutines, renderTodaySchedule } from './ui.js';

// 전역 상태 변수
let currentRoutineItems = [];
let currentEditingItemIndex = null;
let generatedRoutine = null;
let dailyRoutines = [];
let currentDayIndex = 0;

// 요일 한국어 매핑
const dayNames = {
  'mon': '월요일',
  'tue': '화요일', 
  'wed': '수요일',
  'thu': '목요일',
  'fri': '금요일',
  'sat': '토요일',
  'sun': '일요일'
};

// 집중 시간대 옵션
const focusTimeOptions = [
  { value: 'morning', text: '아침 (6-9시)' },
  { value: 'forenoon', text: '오전 (9-12시)' },
  { value: 'afternoon', text: '오후 (12-18시)' },
  { value: 'evening', text: '저녁 (18-22시)' },
  { value: 'night', text: '밤 (22-2시)' }
];

// 루틴 핸들러 초기화
export function initRoutineHandlers() {
  // 새 루틴 생성 버튼
  document.getElementById('create-routine-btn').addEventListener('click', () => {
    initRoutineCreation();
    showModal('routine');
  });
  
  // 루틴 항목 추가 버튼
  document.getElementById('add-routine-item').addEventListener('click', () => {
    if (currentRoutineItems.length >= 10) {
      showToast('오류', '최대 10개의 항목만 추가할 수 있습니다.', 'error');
      return;
    }
    
    currentEditingItemIndex = null;
    document.getElementById('routine-item-number').textContent = currentRoutineItems.length + 1;
    showModal('routineItem');
    
    setTimeout(() => {
      resetRoutineItemForm();
    }, 0);
  });
  
  // 루틴 항목 저장 버튼
  document.getElementById('save-routine-item').addEventListener('click', () => {
    saveRoutineItem();
  });
  
  // 루틴 항목 취소 버튼
  document.getElementById('cancel-routine-item').addEventListener('click', () => {
    hideModal('routineItem');
  });
  
  // 루틴 항목 삭제 버튼
  document.getElementById('delete-routine-item').addEventListener('click', () => {
    if (currentEditingItemIndex !== null) {
      currentRoutineItems.splice(currentEditingItemIndex, 1);
      renderRoutineItems();
      hideModal('routineItem');
    }
  });
  
  // 루틴 생성 취소 버튼
  document.getElementById('cancel-routine').addEventListener('click', () => {
    hideModal('routine');
  });
  
  // 루틴 생성 버튼
  document.getElementById('generate-routine').addEventListener('click', () => {
    const generateButton = document.getElementById('generate-routine');
    generateButton.disabled = true;
    
    if (currentRoutineItems.length === 0) {
      showToast('오류', '최소 1개 이상의 항목을 추가해주세요.', 'error');
      generateButton.disabled = false;
      return;
    }
    generatedRoutine = null;
    dailyRoutines = [];
    currentDayIndex = 0;

    generateRoutine();
  });
  
  // 이전 날 버튼
  document.getElementById('prev-day').addEventListener('click', () => {
    if (currentDayIndex > 0) {
      currentDayIndex--;
      updateDailyRoutineView();
    }
  });
  
  // 다음 날 버튼
  document.getElementById('next-day').addEventListener('click', () => {
    if (currentDayIndex < dailyRoutines.length - 1) {
      currentDayIndex++;
      updateDailyRoutineView();
    }
  });
  
  // 일일 루틴 편집 버튼
  document.getElementById('edit-daily-routine').addEventListener('click', () => {
    showEditScheduleModal();
  });
  
  // 일정 편집 저장 버튼
  document.getElementById('save-schedule-edit').addEventListener('click', () => {
    saveScheduleEdit();
  });
  
  // 일정 편집 취소 버튼
  document.getElementById('cancel-schedule-edit').addEventListener('click', () => {
    hideModal('editSchedule');
  });
  
  // 루틴 다시 생성 버튼
  document.getElementById('regenerate-routine').addEventListener('click', () => {
    generateRoutine();
  });
  
  // 캘린더에 저장 버튼
  document.getElementById('save-to-calendar').addEventListener('click', () => {
    saveRoutineToCalendar();
  });

  // 루틴 항목 모달 초기화
  initRoutineItemModal();
}

// 루틴 항목 모달 초기화
function initRoutineItemModal() {
  // 시간 입력 방식 변경 이벤트
  document.addEventListener('change', function(e) {
    if (e.target.name === 'time-input-type') {
      toggleTimeInputMethod();
    }
  });
  
  // 슬라이더 값 변경 이벤트
  document.addEventListener('input', function(e) {
    if (e.target.id === 'hours-slider') {
      updateSliderDisplay();
    }
    if (e.target.id === 'daily-hours') {
      syncInputWithSlider();
    }
  });
  
  document.addEventListener('change', function(e) {
    if (e.target.id === 'hours-slider') {
      syncSliderWithInput();
    }
  });
  
  // 요일 선택 변경 이벤트
  document.addEventListener('change', function(e) {
    if (e.target.matches('.day-checkbox input[type="checkbox"]')) {
      updateDaySpecificSettings();
    }
  });
}

// 시간 입력 방식 토글
function toggleTimeInputMethod() {
  const selectedType = document.querySelector('input[name="time-input-type"]:checked')?.value;
  const directInput = document.getElementById('time-direct-input');
  const sliderInput = document.getElementById('time-slider-input');
  
  if (!directInput || !sliderInput) return;
  
  if (selectedType === 'direct') {
    directInput.style.display = 'flex';
    sliderInput.style.display = 'none';
  } else {
    directInput.style.display = 'none';
    sliderInput.style.display = 'flex';
    syncInputWithSlider();
  }
}

// 슬라이더 표시값 업데이트
function updateSliderDisplay() {
  const slider = document.getElementById('hours-slider');
  const display = document.getElementById('slider-hours-display');
  if (slider && display) {
    display.textContent = slider.value;
  }
}

// 슬라이더 값을 입력 필드와 동기화
function syncSliderWithInput() {
  const slider = document.getElementById('hours-slider');
  const input = document.getElementById('daily-hours');
  if (slider && input) {
    input.value = slider.value;
  }
}

// 입력 필드 값을 슬라이더와 동기화
function syncInputWithSlider() {
  const input = document.getElementById('daily-hours');
  const slider = document.getElementById('hours-slider');
  const display = document.getElementById('slider-hours-display');
  
  if (input && slider && display) {
    const value = Math.max(0.5, Math.min(12, parseFloat(input.value) || 2));
    slider.value = value;
    display.textContent = value;
  }
}

// 선택된 요일에 따른 시간대 설정 업데이트
function updateDaySpecificSettings() {
  const selectedDays = getSelectedDays();
  updateFocusTimeSettings(selectedDays);
  updateUnavailableTimeSettings(selectedDays);
}

// 선택된 요일 가져오기
function getSelectedDays() {
  const selectedDays = [];
  document.querySelectorAll('.day-checkbox input[type="checkbox"]:checked').forEach(checkbox => {
    selectedDays.push(checkbox.value);
  });
  return selectedDays;
}

// 집중 시간대 설정 업데이트
function updateFocusTimeSettings(selectedDays) {
  const container = document.getElementById('focus-time-container');
  if (!container) return;
  
  if (selectedDays.length === 0) {
    container.innerHTML = `
      <div class="focus-time-note">
        위에서 요일을 선택하면 각 요일별로 집중 시간대를 설정할 수 있습니다.
      </div>
    `;
    return;
  }
  
  let html = '';
  selectedDays.forEach(day => {
    html += `
      <div class="day-time-setting">
        <div class="day-label">${dayNames[day]}</div>
        <select class="focus-time-select" data-day="${day}">
          <option value="">선택하세요</option>
          ${focusTimeOptions.map(option => 
            `<option value="${option.value}">${option.text}</option>`
          ).join('')}
        </select>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// 학습 불가 시간대 설정 업데이트
function updateUnavailableTimeSettings(selectedDays) {
  const container = document.getElementById('unavailable-time-container');
  if (!container) return;
  
  if (selectedDays.length === 0) {
    container.innerHTML = `
      <div class="unavailable-time-note">
        위에서 요일을 선택하면 각 요일별로 학습 불가 시간대를 설정할 수 있습니다.
      </div>
    `;
    return;
  }
  
  let html = '';
  selectedDays.forEach(day => {
    html += `
      <div class="day-time-setting">
        <div class="day-label">${dayNames[day]}</div>
        <div class="time-range-input">
          <input type="time" class="unavailable-start" data-day="${day}" placeholder="시작 시간">
          <span class="time-separator">~</span>
          <input type="time" class="unavailable-end" data-day="${day}" placeholder="종료 시간">
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// 최근 루틴 가져오기 함수 (백엔드 연동)
export function fetchRecentRoutines() {
  return new Promise((resolve) => {
    fetch('/api/routines/recent', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      throw new Error('Invalid response format');
    })
    .then(data => {
      const routines = data.routines || [];
      console.log('✅ 받아온 루틴 목록:', routines);
      renderRecentRoutines(routines);
      resolve(routines);
    })
    .catch(error => {
      console.error('❌ Fetch recent routines error:', error);
      renderRecentRoutines([]);
      resolve([]);
    });
  });
}

// 오늘의 일정 가져오기 함수 (백엔드 연동)
export async function fetchTodaySchedule() {
  try {
    const response = await fetch('/api/calendar/today', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      const schedule = data.schedule || [];
      console.log('✅ 오늘의 일정:', schedule);
      renderTodaySchedule(schedule);
      return schedule;
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('❌ Fetch today schedule error:', error);
    renderTodaySchedule([]);
    return [];
  }
}

// 루틴 생성 초기화
function initRoutineCreation() {
  currentRoutineItems = [];
  document.getElementById('routine-items-container').innerHTML = '';
  document.getElementById('routine-start-date').valueAsDate = new Date();
}

// 루틴 항목 저장
function saveRoutineItem() {
  const validation = validateRoutineItemForm();
  if (!validation.valid) {
    showToast('오류', validation.message, 'error');
    return;
  }
  
  const routineItemData = collectRoutineItemData();
  
  if (currentEditingItemIndex !== null) { 
    currentRoutineItems[currentEditingItemIndex] = routineItemData;
  } else {
    currentRoutineItems.push(routineItemData);
  }
  
  renderRoutineItems();
  hideModal('routineItem');
  showToast('성공', '루틴 항목이 저장되었습니다.', 'success');
}

function collectRoutineItemData() {
  const subjectType = document.querySelector('input[name="subject-type"]:checked')?.value || 'subject';
  const subjectInput = document.getElementById('subject');
  const subject = subjectInput ? subjectInput.value.trim() : '';
  const dailyHoursInput = document.getElementById('daily-hours');
  const dailyHours = dailyHoursInput ? parseFloat(dailyHoursInput.value) : 0;
  const selectedDays = getSelectedDays();

  // 집중 시간대 수집
  const focusTimeByDay = {};
  document.querySelectorAll('.focus-time-select').forEach(select => {
    const day = select.getAttribute('data-day');
    if (select.value) {
      focusTimeByDay[day] = select.value;
    }
  });

  // 불가능 시간대 수집
  const unavailableTimeByDay = {};
  selectedDays.forEach(day => {
    const startInput = document.querySelector(`.unavailable-start[data-day="${day}"]`);
    const endInput = document.querySelector(`.unavailable-end[data-day="${day}"]`);
    
    if (startInput && endInput && startInput.value && endInput.value) {
      unavailableTimeByDay[day] = {
        start: startInput.value,
        end: endInput.value
      };
    }
  });

  const notesInput = document.getElementById('notes');
  const notes = notesInput ? notesInput.value.trim() : '';

  return {
    subjectType,
    subject,
    dailyHours,
    selectedDays,
    focusTimeByDay,
    unavailableTimeByDay,
    notes
  };
}

// 폼 유효성 검사
function validateRoutineItemForm() {
  const subjectInput = document.getElementById('subject');
  const subject = subjectInput ? subjectInput.value.trim() : '';
  const dailyHoursInput = document.getElementById('daily-hours');
  const dailyHours = dailyHoursInput ? parseFloat(dailyHoursInput.value) : 0;
  const selectedDays = getSelectedDays();

  if (!subject) {
    return { valid: false, message: '과목/활동명을 입력해주세요.' };
  }

  if (!dailyHours || dailyHours < 0.5 || dailyHours > 12) {
    return { valid: false, message: '학습 시간은 0.5시간 이상 12시간 이하로 설정해주세요.' };
  }

  if (selectedDays.length === 0) {
    return { valid: false, message: '최소 1개 이상의 요일을 선택해주세요.' };
  }

  return { valid: true };
}

// 루틴 항목 렌더링
function renderRoutineItems() {
  const container = document.getElementById('routine-items-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  currentRoutineItems.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = 'routine-item';
    
    const typeText = item.subjectType === 'activity' ? '활동' : '과목';
    const daysText = item.selectedDays ? 
      item.selectedDays.map(day => dayNames[day].charAt(0)).join(', ') : 
      '매일';
    
    el.innerHTML = `
      <div class="routine-item-content">
        <h3>${item.subject} (${typeText})</h3>
        <p>${item.dailyHours}시간/일, ${daysText}</p>
      </div>
      <i class="ri-edit-line"></i>
    `;
    
    el.addEventListener('click', () => {
      editRoutineItem(index);
    });
    
    container.appendChild(el);
  });
}

function resetRoutineItemForm() {
  const subjectInput = document.getElementById('subject');
  if (subjectInput) subjectInput.value = '';

  const dailyHoursInput = document.getElementById('daily-hours');
  const slider = document.getElementById('hours-slider');
  const display = document.getElementById('slider-hours-display');

  if (dailyHoursInput) dailyHoursInput.value = '2';
  if (slider) slider.value = '2';
  if (display) display.textContent = '2';

  const notesInput = document.getElementById('notes');
  if (notesInput) notesInput.value = '';
}

// 루틴 항목 편집
function editRoutineItem(index) {
  currentEditingItemIndex = index;
  const item = currentRoutineItems[index];
  
  document.getElementById('routine-item-number').textContent = index + 1;
  setRoutineItemData(item);
  showModal('routineItem');
}

// 루틴 항목 데이터 설정 (편집 시)
function setRoutineItemData(data) {
  if (data.subjectType) {
    const radio = document.querySelector(`input[name="subject-type"][value="${data.subjectType}"]`);
    if (radio) radio.checked = true;
  }
  
  if (data.subject) {
    document.getElementById('subject').value = data.subject;
  }
  
  if (data.dailyHours) {
    document.getElementById('daily-hours').value = data.dailyHours;
    const slider = document.getElementById('hours-slider');
    const display = document.getElementById('slider-hours-display');
    if (slider) slider.value = data.dailyHours;
    if (display) display.textContent = data.dailyHours;
  }
  
  if (data.selectedDays) {
    document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = data.selectedDays.includes(checkbox.value);
    });
    updateDaySpecificSettings();
    
    if (data.focusTimeByDay) {
      setTimeout(() => {
        Object.entries(data.focusTimeByDay).forEach(([day, time]) => {
          const select = document.querySelector(`.focus-time-select[data-day="${day}"]`);
          if (select) {
            select.value = time;
          }
        });
      }, 100);
    }
    
    if (data.unavailableTimeByDay) {
      setTimeout(() => {
        Object.entries(data.unavailableTimeByDay).forEach(([day, timeRange]) => {
          const startInput = document.querySelector(`.unavailable-start[data-day="${day}"]`);
          const endInput = document.querySelector(`.unavailable-end[data-day="${day}"]`);
          
          if (startInput && endInput) {
            startInput.value = timeRange.start;
            endInput.value = timeRange.end;
          }
        });
      }, 100);
    }
  }
  
  if (data.notes) {
    document.getElementById('notes').value = data.notes;
  }
}

// 루틴 생성 (AI 호출 - 백엔드 연동)
async function generateRoutine() {
  showToast('정보', 'AI가 루틴을 생성 중입니다...', 'info');
  hideModal('routine');
  
  try {
    const durationElement = document.getElementById('routine-duration');
    const duration = durationElement ? durationElement.value : '7';

    const startDateElement = document.getElementById('routine-start-date');
    const startDate = startDateElement ? startDateElement.value : new Date().toISOString().slice(0, 10);

    const requestData = {
      routineItems: currentRoutineItems,
      startDate,
      duration
    };
    
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error('루틴 생성 실패');
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      
      // 루틴 데이터 설정
      generatedRoutine = responseData.recommendation;
      dailyRoutines = responseData.dailyRoutines;
      
      // 결과 표시
      document.getElementById('full-routine-content').textContent = generatedRoutine;
      updateDailyRoutineView();
      
      showModal('routineResult');
      showToast('성공', 'AI 루틴이 생성되었습니다!', 'success');
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('❌ Generate routine error:', error);
    showToast('오류', '루틴 생성 중 오류가 발생했습니다.', 'error');
  } finally {
    // 버튼 활성화
    if (document.getElementById('generate-routine')) {
      document.getElementById('generate-routine').disabled = false;
    }
  }
}

// 일별 루틴 뷰 업데이트
function updateDailyRoutineView() {
  if (dailyRoutines.length === 0) {
    return;
  }
  
  const currentDayRoutine = dailyRoutines[currentDayIndex];
  document.getElementById('current-day-display').textContent = `${currentDayIndex + 1}일차 (${currentDayRoutine.date})`;
  document.getElementById('daily-routine-content').textContent = currentDayRoutine.content;
  
  // 이전/다음 버튼 활성화 상태 조정
  document.getElementById('prev-day').disabled = currentDayIndex === 0;
  document.getElementById('next-day').disabled = currentDayIndex === dailyRoutines.length - 1;
}

// 일정 편집 모달 표시
function showEditScheduleModal() {
  const currentDayRoutine = dailyRoutines[currentDayIndex];
  
  if (!currentDayRoutine || !currentDayRoutine.schedules) {
    showToast('오류', '편집할 일정이 없습니다.', 'error');
    return;
  }
  
  renderScheduleItems(currentDayRoutine.schedules);
  showModal('editSchedule');
}

// 일정 항목 렌더링
function renderScheduleItems(schedules) {
  const container = document.getElementById('schedule-items-container');
  if (!container) return;
  
  container.innerHTML = '';
  
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
    
    container.appendChild(el);
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
    if (index < schedules.length) {
      schedules[index].startTime = input.value;
    }
  });
  
  document.querySelectorAll('.schedule-end-time').forEach(input => {
    const index = parseInt(input.getAttribute('data-index'));
    if (index < schedules.length) {
      schedules[index].endTime = input.value;
    }
  });
  
  document.querySelectorAll('.schedule-title').forEach(input => {
    const index = parseInt(input.getAttribute('data-index'));
    if (index < schedules.length) {
      schedules[index].title = input.value;
    }
  });
  
  // 일별 루틴 컨텐츠 업데이트
  updateDailyRoutineContent();
  
  hideModal('editSchedule');
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
  document.getElementById('daily-routine-content').textContent = content;
}

// 캘린더에 루틴 저장 (백엔드 연동)
function saveRoutineToCalendar() {
  if (!dailyRoutines.length) {
    showToast('오류', '저장할 루틴이 없습니다.', 'error');
    return;
  }

  // 캘린더 탭으로 먼저 이동
  document.querySelector('.nav-item[data-page="calendar"]')?.click();

  if (!window.calendar) {
    if (window.calendarModule?.initCalendar) {
      console.warn('calendar가 없어 강제 초기화 시도');
      window.calendarModule.initCalendar();
    }
  }

  setTimeout(async () => {
    if (!window.calendar && window.calendarModule?.initCalendar) {
      console.warn('calendar가 없어 강제 초기화 시도');
      window.calendarModule.initCalendar();
    }

    const calendar = window.calendar;
    if (!calendar || typeof calendar.getEvents !== 'function') {
      showToast('오류', '캘린더를 초기화할 수 없습니다.', 'error');
      return;
    }

    // 기존 이벤트 제거 (선택사항)
    // calendar.getEvents().forEach(event => event.remove());

    const startDate = new Date(document.getElementById('routine-start-date').value);
    const eventsToSave = [];

    dailyRoutines.forEach((dayRoutine, dayIndex) => {
      const eventDate = new Date(startDate);
      eventDate.setDate(startDate.getDate() + dayIndex);
      const dateString = eventDate.toISOString().split('T')[0];

      if (dayRoutine.schedules) {
        dayRoutine.schedules.forEach(schedule => {
          const startDateTime = `${dateString}T${schedule.startTime}:00`;
          const endDateTime = `${dateString}T${schedule.endTime}:00`;

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

          let color = '#4361ee';
          for (const subject in subjectColors) {
            if (schedule.title.includes(subject)) {
              color = subjectColors[subject];
              break;
            }
          }

          const eventData = {
            id: `routine-${dayIndex}-${Math.random().toString(36).substr(2, 9)}`,
            title: schedule.title,
            start: startDateTime,
            end: endDateTime,
            backgroundColor: color,
            borderColor: color,
            extendedProps: {
              subject: schedule.subject || '',
              notes: schedule.notes || '',
              completed: false
            }
          };

          // 캘린더에 이벤트 추가
          calendar.addEvent(eventData);
          eventsToSave.push(eventData);
        });
      }
    });

    // 서버에 이벤트들 저장
    try {
      for (const eventData of eventsToSave) {
        await fetch('/api/calendar/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify(eventData)
        });
      }

      // 루틴 자체도 저장
      await saveRoutineToDatabase();

      hideModal('routineResult');
      showToast('성공', '루틴이 캘린더에 저장되었습니다.', 'success');
      
      // 오늘의 일정 새로고침
      fetchTodaySchedule();
      
    } catch (error) {
      console.error('❌ Error saving to server:', error);
      showToast('경고', '캘린더에 표시되었지만 서버 저장 중 오류가 발생했습니다.', 'warning');
    }
  }, 300);
}

// 루틴을 데이터베이스에 저장
async function saveRoutineToDatabase() {
  try {
    const saveData = {
      routineItems: currentRoutineItems,
      startDate: document.getElementById('routine-start-date').value,
      duration: document.getElementById('routine-duration').value,
      fullRoutine: generatedRoutine,
      dailyRoutines: dailyRoutines
    };
    
    const response = await fetch('/api/routines/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(saveData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save routine');
    }
    
    const result = await response.json();
    console.log('✅ Routine saved to database:', result);
    
    // 최근 루틴 목록 새로고침
    fetchRecentRoutines();
    
    return result;
  } catch (error) {
    console.error('❌ Error saving routine to database:', error);
    throw error;
  }
}