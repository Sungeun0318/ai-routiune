// 루틴 관련 기능들 - 백엔드 연동 버전
import { getAuthToken } from './auth.js';
import { showToast, showModal, hideModal, renderTodaySchedule } from './ui.js';

// 전역 상태 변수
let currentRoutineItems = [];
let currentEditingItemIndex = null;
let generatedRoutine = null;
let dailyRoutines = [];
let currentDayIndex = 0;

// 루틴 편집 관련 변수
let isEditingRoutine = false;
let originalRoutineContent = '';

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
  
  // ✅ 루틴 편집 핸들러 추가
  addRoutineEditHandlers();
}

// ✅ 루틴 편집 핸들러 추가
function addRoutineEditHandlers() {
  // 루틴 편집 버튼
  document.getElementById('edit-routine-btn')?.addEventListener('click', () => {
    toggleRoutineEdit();
  });
  
  // 편집 완료/취소 버튼 (동적 생성)
  document.addEventListener('click', (e) => {
    if (e.target.id === 'save-routine-edit') {
      saveRoutineEdit();
    }
    if (e.target.id === 'cancel-routine-edit') {
      cancelRoutineEdit();
    }
  });
}

// ✅ 루틴 편집 모드 토글
function toggleRoutineEdit() {
  const content = document.getElementById('full-routine-content');
  const editor = document.getElementById('routine-editor');
  const editBtn = document.getElementById('edit-routine-btn');
  
  if (!content || !editor || !editBtn) {
    console.error('❌ 루틴 편집 요소를 찾을 수 없습니다');
    return;
  }
  
  if (!isEditingRoutine) {
    // 편집 모드 시작
    originalRoutineContent = content.textContent;
    editor.value = originalRoutineContent;
    
    content.style.display = 'none';
    editor.style.display = 'block';
    
    // 버튼 변경
    editBtn.style.display = 'none';
    
    // 편집 완료/취소 버튼 추가
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'edit-buttons-container';
    buttonContainer.style.marginTop = '10px';
    buttonContainer.innerHTML = `
      <button id="save-routine-edit" class="btn btn-primary" style="margin-right: 10px;">편집 완료</button>
      <button id="cancel-routine-edit" class="btn btn-secondary">취소</button>
    `;
    editBtn.parentNode.appendChild(buttonContainer);
    
    isEditingRoutine = true;
    console.log('✅ 루틴 편집 모드 활성화');
    
  } else {
    // 편집 모드 종료 (취소)
    cancelRoutineEdit();
  }
}

// ✅ 루틴 편집 저장
async function saveRoutineEdit() {
  const editor = document.getElementById('routine-editor');
  const content = document.getElementById('full-routine-content');
  const editBtn = document.getElementById('edit-routine-btn');
  const buttonContainer = document.getElementById('edit-buttons-container');
  
  if (!editor || !content) {
    showToast('오류', '편집 요소를 찾을 수 없습니다.', 'error');
    return;
  }
  
  const newContent = editor.value.trim();
  if (!newContent) {
    showToast('오류', '루틴 내용을 입력해주세요.', 'error');
    return;
  }
  
  try {
    // 전역 변수 업데이트
    generatedRoutine = newContent;
    
    // 백엔드에 저장 (현재 루틴 ID가 있는 경우)
    if (window.currentRoutineId) {
      const response = await fetch(`/api/routines/${window.currentRoutineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          fullRoutine: newContent,
          dailyRoutines: dailyRoutines
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save routine');
      }
      
      console.log('✅ 루틴 편집 내용 서버에 저장됨');
    }
    
    // UI 업데이트
    content.textContent = newContent;
    content.style.display = 'block';
    editor.style.display = 'none';
    
    if (editBtn) editBtn.style.display = 'block';
    if (buttonContainer) buttonContainer.remove();
    
    isEditingRoutine = false;
    originalRoutineContent = '';
    
    showToast('성공', '루틴이 성공적으로 수정되었습니다.', 'success');
    
  } catch (error) {
    console.error('❌ 루틴 편집 저장 오류:', error);
    showToast('오류', '루틴 저장 중 오류가 발생했습니다.', 'error');
  }
}

// ✅ 루틴 편집 취소
function cancelRoutineEdit() {
  const content = document.getElementById('full-routine-content');
  const editor = document.getElementById('routine-editor');
  const editBtn = document.getElementById('edit-routine-btn');
  const buttonContainer = document.getElementById('edit-buttons-container');
  
  if (content) content.style.display = 'block';
  if (editor) {
    editor.style.display = 'none';
    editor.value = '';
  }
  if (editBtn) editBtn.style.display = 'block';
  if (buttonContainer) buttonContainer.remove();
  
  isEditingRoutine = false;
  originalRoutineContent = '';
  
  console.log('✅ 루틴 편집 취소됨');
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

// 직접 입력과 슬라이더 동기화
function syncInputWithSlider() {
  const slider = document.getElementById('hours-slider');
  const input = document.getElementById('daily-hours');
  if (slider && input) {
    input.value = slider.value;
    updateSliderDisplay();
  }
}

function syncSliderWithInput() {
  const slider = document.getElementById('hours-slider');
  const input = document.getElementById('daily-hours');
  if (slider && input) {
    slider.value = input.value;
    updateSliderDisplay();
  }
}

// 요일별 설정 업데이트
function updateDaySpecificSettings() {
  const selectedDays = Array.from(document.querySelectorAll('.day-checkbox input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.value);
  
  updateUnavailableTimeSettings(selectedDays);
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

// 루틴 항목 폼 리셋
function resetRoutineItemForm() {
  document.getElementById('subject').value = '';
  document.getElementById('daily-hours').value = '2';
  document.getElementById('hours-slider').value = '2';
  updateSliderDisplay();
  
  // 요일 체크박스 초기화
  document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // 집중 시간대 초기화
  document.querySelectorAll('input[name="focus-time"]').forEach(radio => {
    radio.checked = false;
  });
  
  // 시간 입력 방식 초기화
  document.getElementById('time-direct').checked = true;
  toggleTimeInputMethod();
  
  // 메모 초기화
  document.getElementById('notes').value = '';
  
  // 학습 불가 시간대 초기화
  updateUnavailableTimeSettings([]);
}

// 루틴 항목 저장
function saveRoutineItem() {
  const subject = document.getElementById('subject').value.trim();
  const dailyHours = parseFloat(document.getElementById('daily-hours').value);
  const selectedDays = Array.from(document.querySelectorAll('.day-checkbox input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.value);
  const focusTimeSlots = Array.from(document.querySelectorAll('input[name="focus-time"]:checked'))
    .map(radio => radio.value);
  const notes = document.getElementById('notes').value.trim();
  
  // 유효성 검사
  if (!subject) {
    showToast('오류', '과목명을 입력해주세요.', 'error');
    return;
  }
  
  if (selectedDays.length === 0) {
    showToast('오류', '최소 1개 이상의 요일을 선택해주세요.', 'error');
    return;
  }
  
  if (focusTimeSlots.length === 0) {
    showToast('오류', '집중 시간대를 선택해주세요.', 'error');
    return;
  }
  
  // 학습 불가 시간대 수집
  const unavailableTimes = [];
  selectedDays.forEach(day => {
    const startInput = document.querySelector(`.unavailable-start[data-day="${day}"]`);
    const endInput = document.querySelector(`.unavailable-end[data-day="${day}"]`);
    
    if (startInput && endInput && startInput.value && endInput.value) {
      unavailableTimes.push({
        day: day,
        startTime: startInput.value,
        endTime: endInput.value
      });
    }
  });
  
  const routineItem = {
    subject,
    dailyHours,
    selectedDays,
    focusTimeSlots,
    unavailableTimes,
    notes
  };
  
  if (currentEditingItemIndex !== null) {
    // 기존 항목 수정
    currentRoutineItems[currentEditingItemIndex] = routineItem;
  } else {
    // 새 항목 추가
    currentRoutineItems.push(routineItem);
  }
  
  renderRoutineItems();
  hideModal('routineItem');
  showToast('성공', '루틴 항목이 저장되었습니다.', 'success');
}

// 루틴 항목 목록 렌더링
function renderRoutineItems() {
  const container = document.getElementById('routine-items-container');
  if (!container) return;
  
  if (currentRoutineItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>추가된 루틴 항목이 없습니다.</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  currentRoutineItems.forEach((item, index) => {
    const daysText = item.selectedDays.map(day => dayNames[day]).join(', ');
    const focusText = item.focusTimeSlots.map(slot => {
      const option = focusTimeOptions.find(opt => opt.value === slot);
      return option ? option.text : slot;
    }).join(', ');
    
    html += `
      <div class="routine-item" onclick="editRoutineItem(${index})">
        <div class="routine-item-header">
          <h4>${item.subject}</h4>
          <span class="routine-item-hours">${item.dailyHours}시간/일</span>
        </div>
        <div class="routine-item-details">
          <p><strong>요일:</strong> ${daysText}</p>
          <p><strong>집중 시간대:</strong> ${focusText}</p>
          ${item.notes ? `<p><strong>메모:</strong> ${item.notes}</p>` : ''}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// 루틴 항목 편집
window.editRoutineItem = function(index) {
  const item = currentRoutineItems[index];
  currentEditingItemIndex = index;
  
  // 폼에 기존 값 채우기
  document.getElementById('subject').value = item.subject;
  document.getElementById('daily-hours').value = item.dailyHours;
  document.getElementById('hours-slider').value = item.dailyHours;
  updateSliderDisplay();
  
  // 요일 체크박스 설정
  document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = item.selectedDays.includes(checkbox.value);
  });
  
  // 집중 시간대 설정
  document.querySelectorAll('input[name="focus-time"]').forEach(radio => {
    radio.checked = item.focusTimeSlots.includes(radio.value);
  });
  
  // 메모 설정
  document.getElementById('notes').value = item.notes || '';
  
  // 학습 불가 시간대 설정
  updateUnavailableTimeSettings(item.selectedDays);
  
  setTimeout(() => {
    item.unavailableTimes.forEach(timeSlot => {
      const startInput = document.querySelector(`.unavailable-start[data-day="${timeSlot.day}"]`);
      const endInput = document.querySelector(`.unavailable-end[data-day="${timeSlot.day}"]`);
      
      if (startInput) startInput.value = timeSlot.startTime;
      if (endInput) endInput.value = timeSlot.endTime;
    });
  }, 100);
  
  document.getElementById('routine-item-number').textContent = index + 1;
  showModal('routineItem');
};

// 루틴 생성
async function generateRoutine() {
  try {
    console.log('🤖 AI 루틴 생성 시작...');
    showToast('정보', 'AI가 맞춤형 루틴을 생성 중입니다...', 'info');
    
    const startDate = document.getElementById('routine-start-date').value;
    const duration = parseInt(document.getElementById('routine-duration').value);
    
    const requestData = {
      routineItems: currentRoutineItems,
      startDate: startDate,
      duration: duration
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.routine && data.dailyRoutines) {
      generatedRoutine = data.routine;
      dailyRoutines = data.dailyRoutines;
      currentDayIndex = 0;
      
      // 결과 표시
      document.getElementById('full-routine-content').textContent = generatedRoutine;
      updateDailyRoutineView();
      
      hideModal('routine');
      showModal('routineResult');
      showToast('성공', 'AI 루틴이 성공적으로 생성되었습니다!', 'success');
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

  const schedule = currentDayRoutine.schedules[0];
  if (!schedule) {
    showToast('오류', '편집할 일정이 없습니다.', 'error');
    return;
  }

  // 폼에 기존 값 설정
  document.getElementById('edit-title').value = schedule.title || '';
  document.getElementById('edit-time').value = `${schedule.startTime} - ${schedule.endTime}` || '';
  document.getElementById('edit-memo').value = schedule.notes || '';
  
  showModal('editSchedule');
}

// ✅ 일정 편집 저장 함수 개선
async function saveScheduleEdit() {
  const title = document.getElementById('edit-title')?.value?.trim();
  const time = document.getElementById('edit-time')?.value?.trim();
  const notes = document.getElementById('edit-memo')?.value?.trim();
  
  if (!title) {
    showToast('오류', '제목을 입력해주세요.', 'error');
    return;
  }
  
  if (!time) {
    showToast('오류', '시간을 입력해주세요.', 'error');
    return;
  }
  
  const [startTime, endTime] = time.split('-').map(t => t.trim());
  
  if (!startTime || !endTime) {
    showToast('오류', '시간 형식이 올바르지 않습니다. (예: 09:00-10:00)', 'error');
    return;
  }
  
  try {
    // 현재 일정 수정
    const currentDay = dailyRoutines[currentDayIndex];
    if (!currentDay || !Array.isArray(currentDay.schedules)) {
      showToast('오류', '수정할 일정이 없습니다.', 'error');
      return;
    }
    
    // 첫 번째 일정 수정 (다중 일정 지원 시 확장 가능)
    const schedule = currentDay.schedules[0];
    if (!schedule) {
      showToast('오류', '수정할 일정이 없습니다.', 'error');
      return;
    }
    
    // 일정 업데이트
    schedule.title = title;
    schedule.startTime = startTime;
    schedule.endTime = endTime;
    schedule.notes = notes;
    
    // 백엔드에 저장 (현재 루틴 ID가 있는 경우)
    if (window.currentRoutineId) {
      const response = await fetch(`/api/routines/${window.currentRoutineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          dailyRoutines: dailyRoutines
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }
      
      console.log('✅ 일정 편집 내용 서버에 저장됨');
    }
    
    // UI 업데이트
    updateDailyRoutineContent();
    updateDailyRoutineView();
    hideModal('editSchedule');
    
    showToast('성공', '일정이 성공적으로 수정되었습니다.', 'success');
    
    // 오늘의 일정 새로고침
    fetchTodaySchedule();
    
  } catch (error) {
    console.error('❌ 일정 편집 저장 오류:', error);
    showToast('오류', '일정 저장 중 오류가 발생했습니다.', 'error');
  }
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

// ✅ 루틴을 데이터베이스에 저장 (ID 저장 추가)
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
    
    // ✅ 현재 루틴 ID 저장
    if (result.routine && result.routine.id) {
      window.currentRoutineId = result.routine.id;
    }
    
    // 최근 루틴 목록 새로고침
    fetchRecentRoutines();
    
    return result;
  } catch (error) {
    console.error('❌ Error saving routine to database:', error);
    throw error;
  }
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
  renderRoutineItems();
}

// ✅ 최근 생성된 루틴 렌더링 함수
export function renderRecentRoutines(routines) {
  const container = document.getElementById('recent-routines-list');
  if (!container) {
    console.error('Recent routines container not found');
    return;
  }

  container.innerHTML = '';

  if (!routines || routines.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ri-calendar-todo-line"></i>
        <p>생성된 루틴이 없습니다.<br>새 루틴을 생성해보세요!</p>
      </div>
    `;
    return;
  }

  routines.slice(0, 3).forEach(routine => {
    const title = routine.title || '제목 없음';
    const subjects = (routine.subjects || []).join(', ') || '미지정';
    const date = routine.createdAt || '날짜 미지정';
    
    const routineCard = document.createElement('div');
    routineCard.className = 'routine-card';
    routineCard.innerHTML = `
      <div class="routine-card-header">
        <h4>${title}</h4>
        <span class="routine-date">${date}</span>
      </div>
      <div class="routine-card-body">
        <p><strong>과목:</strong> ${subjects}</p>
      </div>
    `;
    
    container.appendChild(routineCard);
  });
}

// 전역 함수로 노출
window.toggleRoutineEdit = toggleRoutineEdit;
window.saveRoutineEdit = saveRoutineEdit;
window.cancelRoutineEdit = cancelRoutineEdit;
window.saveScheduleEdit = saveScheduleEdit;
window.currentRoutineId = null;