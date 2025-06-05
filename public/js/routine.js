// 루틴 관련 기능들
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

// 모달 렌더링 후 resetRoutineItemForm() 실행
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
    // 중복 클릭 방지
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
  
  // 모든 요일 선택 버튼
  document.addEventListener('click', function(e) {
    if (e.target.id === 'select-all-days-btn') {
      e.preventDefault();
      selectAllDays();
    }
    if (e.target.id === 'select-weekdays-btn') {
      e.preventDefault();
      selectWeekdays();
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

// 모든 요일 선택
function selectAllDays() {
  document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = true;
  });
  updateDaySpecificSettings();
}

// 평일만 선택
function selectWeekdays() {
  document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(checkbox => {
    const day = checkbox.value;
    checkbox.checked = ['mon', 'tue', 'wed', 'thu', 'fri'].includes(day);
  });
  updateDaySpecificSettings();
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

// 최근 루틴 가져오기 함수
export function fetchRecentRoutines() {
  return new Promise((resolve) => {
    fetch('/api/routines/recent', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    })
    .then(response => {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      throw new Error('Invalid response format');
    })
    .then(data => {
  const routines = data.routines || [];
  console.log('🔥 받아온 루틴 목록:', routines);
  renderRecentRoutines(routines);
  resolve(routines);
})

    .catch(error => {
      console.error('Fetch recent routines error:', error);
      // 개발 모드에서는 빈 배열 반환
      renderRecentRoutines([]);
      resolve([]);
    });
  });
}

// 오늘의 일정 가져오기 함수
export async function fetchTodaySchedule() {
  try {
    const response = await fetch('/api/schedule/today', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });

    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      renderTodaySchedule(data.schedule || []);
      return data.schedule || [];
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Fetch today schedule error:', error);
    // 개발 모드에서는 빈 배열 반환
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
  const subject = subjectInput ? subjectInput.value.trim() : ''; // ✅ null 검사 추가

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
    
    // 새로운 데이터 구조에 맞게 표시 텍스트 생성
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
  
  // 새로운 데이터 구조에 맞게 설정
  setRoutineItemData(item);
  
  showModal('routineItem');
}

// 루틴 항목 데이터 설정 (편집 시)
function setRoutineItemData(data) {
  // 기본 정보 설정
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
  
  // 요일 선택 설정
  if (data.selectedDays) {
    document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = data.selectedDays.includes(checkbox.value);
    });
    updateDaySpecificSettings();
    
    // 집중 시간대 설정 (약간의 지연 후)
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
    
    // 불가능 시간대 설정 (약간의 지연 후)
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

// 집중 시간대 텍스트 가져오기
function getFocusTimeText(focusTime) {
  const focusTimeMap = {
    'morning': '아침 (6-9시)',
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
  hideModal('routine');
  
  try {
    // 서버에 요청 데이터 준비
const durationElement = document.getElementById('routine-duration');
const duration = durationElement ? durationElement.value : '7';

const startDateElement = document.getElementById('routine-start-date');
const startDate = startDateElement ? startDateElement.value : new Date().toISOString().slice(0, 10);

const requestData = {
  routineItems: currentRoutineItems,
  startDate,
  duration
};

    
    // 실제 구현에서는 서버 API 호출
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(requestData)
    });
    
    // 응답 처리
    if (!response.ok) {
      throw new Error('루틴 생성 실패');
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      
      // 루틴 데이터 설정
      generatedRoutine = responseData.recommendation || generateMockRoutine();
      dailyRoutines = responseData.dailyRoutines || generateMockDailyRoutines();
      
      // 결과 표시
      document.getElementById('full-routine-content').textContent = generatedRoutine;
      updateDailyRoutineView();
      
      showModal('routineResult');
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Generate routine error:', error);
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

// 캘린더에 루틴 저장
function saveRoutineToCalendar() {
  if (!dailyRoutines.length) {
    showToast('오류', '저장할 루틴이 없습니다.', 'error');
    return;
  }

  // ✅ 캘린더 탭으로 먼저 이동 (DOM 준비용)
  document.querySelector('.nav-item[data-page="calendar"]')?.click();

  if (!window.calendar) {
    if (window.calendarModule?.initCalendar) {
      console.warn('calendar가 없어 강제 초기화 시도');
      window.calendarModule.initCalendar();
    }
  }

  setTimeout(() => {
    if (!window.calendar && window.calendarModule?.initCalendar) {
      console.warn('calendar가 없어 강제 초기화 시도');
      window.calendarModule.initCalendar();
    }

    const calendar = window.calendar;
    if (!calendar || typeof calendar.getEvents !== 'function') {
      showToast('오류', '캘린더를 초기화할 수 없습니다.', 'error');
      return;
    }

    calendar.getEvents().forEach(event => event.remove());

    const startDate = new Date(document.getElementById('routine-start-date').value);

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

    hideModal('routineResult');
    showToast('성공', '루틴이 캘린더에 저장되었습니다.', 'success');
    saveToDatabaseIfNeeded();
  }, 300);
}



// 선택적 데이터베이스 저장
async function saveToDatabaseIfNeeded() {
  try {
    // 필요한 경우 루틴을 데이터베이스에 저장
    const saveData = {
      routineItems: currentRoutineItems,
      startDate: document.getElementById('routine-start-date').value,
      duration: document.getElementById('routine-duration').value,
      fullRoutine: generatedRoutine,
      dailyRoutines: dailyRoutines
    };
    
    const response = await fetch('/api/save-routine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(saveData)
    });
    
    // 응답 처리 로직
  } catch (error) {
    console.error('Error saving routine to database:', error);
  }
}

// 모의 데이터 생성 함수들
export function generateMockRoutine() {
  return `AI가 생성한 ${currentRoutineItems.length}개 과목 학습 루틴:

이 학습 계획은 ${document.getElementById('routine-duration').value}일 동안의 일정입니다.
시작일: ${document.getElementById('routine-start-date').value}

## 과목별 시간 배분
${currentRoutineItems.map(item => `- ${item.subject}: 일 ${item.dailyHours}시간, 우선순위 ${item.priority || 'medium'}`).join('\n')}

## 전체 루틴 요약
1. 아침 시간대 (06:00-09:00): 집중력이 필요한 과목
2. 오전 시간대 (09:00-12:00): 기초 개념 학습
3. 오후 시간대 (12:00-18:00): 실습 및 응용
4. 저녁 시간대 (18:00-22:00): 복습 및 문제 풀이
5. 밤 시간대 (22:00-02:00): 가벼운 학습 및 정리

자세한 일정은 일별 보기에서 확인하실 수 있습니다.`;
}

export function generateMockDailyRoutines() {
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
    
    // 과목 선택 (과목이 없는 경우 기본값 설정)
    const subject = subjects.length > 0
      ? subjects[(index + day) % subjects.length]
      : ['수학', '영어', '프로그래밍'][(index + day) % 3];
    
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
      '체육': ['기초 체력 훈련', '기술 연습', '전술 학습', '경기 분석', '회복 트레이닝'],
      '독서': ['책 읽기', '독후감 작성', '토론 준비', '책 선정', '독서 노트 정리'],
      '운동': ['기초 체력', '유산소 운동', '근력 운동', '스트레칭', '휴식'],
      '외국어': ['단어 암기', '회화 연습', '문법 학습', '듣기 연습', '쓰기 연습']
    };
    
    // 활동 선택
    let activity = '학습';
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