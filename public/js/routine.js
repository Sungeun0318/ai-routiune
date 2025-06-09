// ====================================
// 루틴 관련 기능들 - 기존 구조 유지하며 오류 수정
// ====================================

import { authenticatedFetch } from './auth.js';
import { showToast, showModal, hideModal, renderTodaySchedule, showLoading, hideLoading, showConfirm } from './ui.js';

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

// ✅ 루틴 핸들러 초기화
export function initRoutineHandlers() {
  console.log('🎯 루틴 핸들러 초기화 중...');
  
  // 새 루틴 생성 버튼
  const createRoutineBtn = document.getElementById('create-routine-btn');
  if (createRoutineBtn) {
    createRoutineBtn.addEventListener('click', () => {
      console.log('🎯 새 루틴 생성 버튼 클릭');
      initRoutineCreation();
      showModal('routine');
    });
  }
  
  // 루틴 항목 추가 버튼
  const addRoutineItemBtn = document.getElementById('add-routine-item');
  if (addRoutineItemBtn) {
    addRoutineItemBtn.addEventListener('click', () => {
      if (currentRoutineItems.length >= 10) {
        showToast('오류', '최대 10개의 항목만 추가할 수 있습니다.', 'error');
        return;
      }
      
      currentEditingItemIndex = null;
      const itemNumber = document.getElementById('routine-item-number');
      if (itemNumber) {
        itemNumber.textContent = currentRoutineItems.length + 1;
      }
      
      resetRoutineItemForm();
      showModal('routineItem');
    });
  }
  
  // 루틴 항목 저장 버튼
  const saveRoutineItemBtn = document.getElementById('save-routine-item');
  if (saveRoutineItemBtn) {
    saveRoutineItemBtn.addEventListener('click', () => {
      saveRoutineItem();
    });
  }
  
  // 루틴 항목 취소 버튼
  const cancelRoutineItemBtn = document.getElementById('cancel-routine-item');
  if (cancelRoutineItemBtn) {
    cancelRoutineItemBtn.addEventListener('click', () => {
      hideModal('routineItem');
    });
  }
  
  // 루틴 항목 삭제 버튼 (편집 중일 때만 표시)
  const deleteRoutineItemBtn = document.getElementById('delete-routine-item');
  if (deleteRoutineItemBtn) {
    deleteRoutineItemBtn.addEventListener('click', () => {
      if (currentEditingItemIndex !== null) {
        showConfirm(
          '항목 삭제',
          '이 루틴 항목을 삭제하시겠습니까?',
          () => {
            currentRoutineItems.splice(currentEditingItemIndex, 1);
            renderRoutineItems();
            hideModal('routineItem');
            showToast('성공', '루틴 항목이 삭제되었습니다.', 'success');
          }
        );
      }
    });
  }
  
  // 루틴 생성 취소 버튼
  const cancelRoutineBtn = document.getElementById('cancel-routine');
  if (cancelRoutineBtn) {
    cancelRoutineBtn.addEventListener('click', () => {
      showConfirm(
        '루틴 생성 취소',
        '루틴 생성을 취소하시겠습니까? 입력한 내용이 모두 사라집니다.',
        () => {
          hideModal('routine');
          initRoutineCreation();
        }
      );
    });
  }
  
  // 루틴 생성 버튼
  const generateRoutineBtn = document.getElementById('generate-routine');
  if (generateRoutineBtn) {
    generateRoutineBtn.addEventListener('click', async () => {
      await generateRoutine();
    });
  }

  // DOM 이벤트 설정
  setupDOMEventListeners();
  
  console.log('✅ 루틴 핸들러 초기화 완료');
}

// ✅ DOM 이벤트 리스너 설정
function setupDOMEventListeners() {
  // 슬라이더 및 직접 입력 동기화
  const hoursSlider = document.getElementById('hours-slider');
  const hoursInput = document.getElementById('daily-hours');
  
  if (hoursSlider) {
    hoursSlider.addEventListener('input', function() {
      updateSliderDisplay();
      if (hoursInput) {
        hoursInput.value = this.value;
      }
    });
  }

  if (hoursInput) {
    hoursInput.addEventListener('input', function() {
      if (hoursSlider) {
        hoursSlider.value = this.value;
        updateSliderDisplay();
      }
    });
  }

  // 과목 선택 라디오 버튼 이벤트
  const subjectTypeRadios = document.querySelectorAll('input[name="subject-type"]');
  subjectTypeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      const presetSelect = document.getElementById('subject-preset-list');
      const customInput = document.getElementById('subject-custom-input');
      
      if (this.value === 'preset') {
        if (presetSelect) presetSelect.style.display = 'block';
        if (customInput) customInput.style.display = 'none';
      } else {
        if (presetSelect) presetSelect.style.display = 'none';
        if (customInput) customInput.style.display = 'block';
      }
    });
  });

  // 요일 선택 변경 이벤트
  const dayCheckboxes = document.querySelectorAll('.day-checkbox input[type="checkbox"]');
  dayCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateTimeSettings);
  });

  // 전체 선택 버튼 이벤트
  const selectAllDaysBtn = document.getElementById('select-all-days');
  const selectWeekdaysBtn = document.getElementById('select-weekdays');  
  const selectWeekendsBtn = document.getElementById('select-weekends');

  if (selectAllDaysBtn) {
    selectAllDaysBtn.addEventListener('click', () => {
      dayCheckboxes.forEach(cb => cb.checked = true);
      updateTimeSettings();
    });
  }

  if (selectWeekdaysBtn) {
    selectWeekdaysBtn.addEventListener('click', () => {
      dayCheckboxes.forEach(cb => {
        cb.checked = ['mon', 'tue', 'wed', 'thu', 'fri'].includes(cb.value);
      });
      updateTimeSettings();
    });
  }

  if (selectWeekendsBtn) {
    selectWeekendsBtn.addEventListener('click', () => {
      dayCheckboxes.forEach(cb => {
        cb.checked = ['sat', 'sun'].includes(cb.value);
      });
      updateTimeSettings();
    });
  }
}

// ✅ 과목명 가져오기 함수
function getSubjectName() {
  const subjectType = document.querySelector('input[name="subject-type"]:checked')?.value;
  
  if (subjectType === 'preset') {
    const presetSelect = document.getElementById('subject-preset-list');
    return presetSelect?.value || '';
  } else {
    const customInput = document.getElementById('subject-custom-input');
    return customInput?.value?.trim() || '';
  }
}

// ✅ 과목명 설정 함수
function setSubjectName(subject) {
  const presetSelect = document.getElementById('subject-preset-list');
  const customInput = document.getElementById('subject-custom-input');
  const presetRadio = document.getElementById('subject-preset');
  const customRadio = document.getElementById('subject-custom');
  
  // 기본 과목 목록에 있는지 확인
  const presetOptions = Array.from(presetSelect?.options || []).map(opt => opt.value);
  
  if (presetOptions.includes(subject)) {
    // 기본 과목인 경우
    if (presetRadio) presetRadio.checked = true;
    if (customRadio) customRadio.checked = false;
    if (presetSelect) {
      presetSelect.value = subject;
      presetSelect.style.display = 'block';
    }
    if (customInput) customInput.style.display = 'none';
  } else {
    // 사용자 정의 과목인 경우
    if (customRadio) customRadio.checked = true;
    if (presetRadio) presetRadio.checked = false;
    if (customInput) {
      customInput.value = subject;
      customInput.style.display = 'block';
    }
    if (presetSelect) presetSelect.style.display = 'none';
  }
}

// ✅ 슬라이더 값 표시 업데이트
function updateSliderDisplay() {
  const slider = document.getElementById('hours-slider');
  const display = document.getElementById('slider-value');
  if (slider && display) {
    display.textContent = slider.value;
  }
}

// ✅ 시간대 설정 업데이트 (집중시간대 + 불가능시간대)
function updateTimeSettings() {
  const selectedDays = Array.from(document.querySelectorAll('.day-checkbox input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.value);
  
  updateFocusTimeSettings(selectedDays);
  updateUnavailableTimeSettings(selectedDays);
}

// ✅ 집중 시간대 설정 업데이트
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
      <div class="day-focus-setting">
        <div class="day-label">${dayNames[day]}</div>
        <div class="focus-time-options">
          ${focusTimeOptions.map(option => `
            <div class="focus-time-option">
              <input type="checkbox" id="focus-${day}-${option.value}" 
                     name="focus-time-${day}" value="${option.value}" 
                     data-day="${day}">
              <label for="focus-${day}-${option.value}">${option.text}</label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ✅ 학습 불가 시간대 설정 업데이트
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

// ✅ 루틴 생성 초기화
function initRoutineCreation() {
  currentRoutineItems = [];
  currentEditingItemIndex = null;
  generatedRoutine = null;
  dailyRoutines = [];
  currentDayIndex = 0;
  
  // 폼 초기화
  const routineItemsContainer = document.getElementById('routine-items-container');
  if (routineItemsContainer) {
    routineItemsContainer.innerHTML = '';
  }
  
  const routineStartDate = document.getElementById('routine-start-date');
  if (routineStartDate) {
    routineStartDate.valueAsDate = new Date();
  }
  
  renderRoutineItems();
  console.log('✅ 루틴 생성 초기화 완료');
}

// ✅ 루틴 항목 저장
function saveRoutineItem() {
  try {
    // 폼 데이터 수집
    const subject = getSubjectName();
    const dailyHours = parseFloat(document.getElementById('daily-hours')?.value) || 0;
    const selectedDays = Array.from(document.querySelectorAll('.day-checkbox input[type="checkbox"]:checked'))
      .map(cb => cb.value);
    const notes = document.getElementById('notes')?.value?.trim() || '';

    console.log('📝 폼 데이터 수집:', {
      subject,
      dailyHours,
      selectedDays,
      notes
    });

    // 유효성 검사
    if (!subject) {
      showToast('오류', '과목명을 입력해주세요.', 'error');
      return;
    }

    if (dailyHours <= 0 || dailyHours > 12) {
      showToast('오류', '일일 학습시간은 0.5시간에서 12시간 사이로 입력해주세요.', 'error');
      return;
    }

    if (selectedDays.length === 0) {
      showToast('오류', '학습 요일을 최소 1개 이상 선택해주세요.', 'error');
      return;
    }

    // 집중 시간대 수집
    const focusTimeSlots = {};
    selectedDays.forEach(day => {
      const dayFocusTimes = Array.from(document.querySelectorAll(`input[name="focus-time-${day}"]:checked`))
        .map(input => input.value);
      if (dayFocusTimes.length > 0) {
        focusTimeSlots[day] = dayFocusTimes;
      }
    });

    // 집중 시간대 유효성 검사
    const hasAnyFocusTime = Object.keys(focusTimeSlots).length > 0;
    if (!hasAnyFocusTime) {
      showToast('오류', '최소 한 요일에 집중 시간대를 설정해주세요.', 'error');
      return;
    }

    // 중복 과목 검사 (편집 중이 아닌 경우만)
    if (currentEditingItemIndex === null) {
      const isDuplicate = currentRoutineItems.some(item => 
        item.subject.toLowerCase() === subject.toLowerCase()
      );
      
      if (isDuplicate) {
        showToast('오류', '이미 존재하는 과목입니다. 다른 과목명을 사용해주세요.', 'error');
        return;
      }
    }

    // 학습 불가 시간대 수집
    const unavailableTimes = [];
    selectedDays.forEach(day => {
      const startInput = document.querySelector(`.unavailable-start[data-day="${day}"]`);
      const endInput = document.querySelector(`.unavailable-end[data-day="${day}"]`);
      
      if (startInput && endInput && startInput.value && endInput.value) {
        // 시간 유효성 검사
        if (startInput.value >= endInput.value) {
          showToast('오류', `${dayNames[day]} 시작 시간이 종료 시간보다 늦습니다.`, 'error');
          return;
        }
        
        unavailableTimes.push({
          day: day,
          startTime: startInput.value,
          endTime: endInput.value
        });
      }
    });

    // 루틴 항목 데이터 생성
    const routineItem = {
      subject,
      dailyHours,
      focusTimeSlots,
      selectedDays,
      unavailableTimes,
      notes,
      createdAt: new Date().toISOString()
    };

    // 항목 추가/수정
    if (currentEditingItemIndex !== null) {
      currentRoutineItems[currentEditingItemIndex] = routineItem;
      showToast('성공', '루틴 항목이 수정되었습니다.', 'success');
    } else {
      currentRoutineItems.push(routineItem);
      showToast('성공', '루틴 항목이 추가되었습니다.', 'success');
    }

    // UI 업데이트
    renderRoutineItems();
    hideModal('routineItem');
    
    console.log('✅ 루틴 항목 저장 완료:', routineItem);

  } catch (error) {
    console.error('❌ 루틴 항목 저장 오류:', error);
    showToast('오류', '루틴 항목을 저장하는 중 오류가 발생했습니다.', 'error');
  }
}

// ✅ 루틴 항목 목록 렌더링
function renderRoutineItems() {
  const container = document.getElementById('routine-items-container');
  if (!container) return;
  
  if (currentRoutineItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>추가된 루틴 항목이 없습니다.</p>
        <p>아래 버튼으로 추가해주세요.</p>
      </div>
    `;
    
    // 루틴 생성 버튼 비활성화
    const generateBtn = document.getElementById('generate-routine');
    if (generateBtn) {
      generateBtn.disabled = true;
    }
    
    return;
  }
  
  let html = '';
  currentRoutineItems.forEach((item, index) => {
    const daysText = item.selectedDays.map(day => dayNames[day]).join(', ');
    
    // 집중 시간대 표시
    let focusText = '';
    if (typeof item.focusTimeSlots === 'object') {
      const focusTexts = [];
      Object.entries(item.focusTimeSlots).forEach(([day, times]) => {
        const dayName = dayNames[day];
        const timeTexts = times.map(time => {
          const option = focusTimeOptions.find(opt => opt.value === time);
          return option ? option.text : time;
        });
        focusTexts.push(`${dayName}: ${timeTexts.join(', ')}`);
      });
      focusText = focusTexts.join(' / ');
    }
    
    html += `
      <div class="routine-item" onclick="editRoutineItem(${index})">
        <div class="routine-item-content">
          <h3>${item.subject}</h3>
          <p><strong>일일 학습시간:</strong> ${item.dailyHours}시간</p>
          <p><strong>학습 요일:</strong> ${daysText}</p>
          ${focusText ? `<p><strong>집중 시간대:</strong> ${focusText}</p>` : ''}
          ${item.notes ? `<p><strong>메모:</strong> ${item.notes}</p>` : ''}
          ${item.unavailableTimes && item.unavailableTimes.length > 0 ? 
            `<p><strong>학습 불가:</strong> ${item.unavailableTimes.length}개 시간대</p>` : ''}
        </div>
        <div class="routine-item-actions">
          <button onclick="event.stopPropagation(); deleteRoutineItem(${index})" class="btn-delete" title="삭제">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;

  // 루틴 생성 버튼 활성화
  const generateBtn = document.getElementById('generate-routine');
  if (generateBtn) {
    generateBtn.disabled = false;
  }

  console.log(`✅ 루틴 항목 ${currentRoutineItems.length}개 렌더링 완료`);
}

// ✅ 루틴 항목 편집
window.editRoutineItem = function(index) {
  if (index < 0 || index >= currentRoutineItems.length) return;
  
  const item = currentRoutineItems[index];
  currentEditingItemIndex = index;
  
  console.log('✅ 루틴 항목 편집 시작:', item);
  
  // 폼에 기존 값 채우기
  setSubjectName(item.subject);
  
  const hoursInput = document.getElementById('daily-hours');
  const hoursSlider = document.getElementById('hours-slider');
  const notesTextarea = document.getElementById('notes');
  
  if (hoursInput) hoursInput.value = item.dailyHours;
  if (hoursSlider) hoursSlider.value = item.dailyHours;
  if (notesTextarea) notesTextarea.value = item.notes || '';
  
  updateSliderDisplay();
  
  // 요일 체크박스 설정
  document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = item.selectedDays.includes(checkbox.value);
  });
  
  // 시간대 UI 업데이트
  updateTimeSettings();
  
  // 데이터 설정 (DOM 업데이트 후)
  setTimeout(() => {
    // 집중 시간대 설정
    if (item.focusTimeSlots && typeof item.focusTimeSlots === 'object') {
      Object.entries(item.focusTimeSlots).forEach(([day, times]) => {
        times.forEach(time => {
          const checkbox = document.querySelector(`input[name="focus-time-${day}"][value="${time}"]`);
          if (checkbox) checkbox.checked = true;
        });
      });
    }
    
    // 학습 불가 시간대 설정
    if (item.unavailableTimes) {
      item.unavailableTimes.forEach(timeSlot => {
        const startInput = document.querySelector(`.unavailable-start[data-day="${timeSlot.day}"]`);
        const endInput = document.querySelector(`.unavailable-end[data-day="${timeSlot.day}"]`);
        
        if (startInput) startInput.value = timeSlot.startTime;
        if (endInput) endInput.value = timeSlot.endTime;
      });
    }
  }, 100);
  
  // 모달 제목 변경 및 삭제 버튼 표시
  const itemNumber = document.getElementById('routine-item-number');
  const deleteBtn = document.getElementById('delete-routine-item');
  
  if (itemNumber) {
    itemNumber.textContent = `${index + 1} 수정`;
  }
  if (deleteBtn) {
    deleteBtn.style.display = 'inline-block';
  }
  
  showModal('routineItem');
  console.log('✅ 루틴 항목 편집 모달 표시');
};

// ✅ 루틴 항목 삭제
window.deleteRoutineItem = function(index) {
  if (index < 0 || index >= currentRoutineItems.length) return;
  
  const item = currentRoutineItems[index];
  
  showConfirm(
    '항목 삭제',
    `"${item.subject}" 항목을 삭제하시겠습니까?`,
    () => {
      currentRoutineItems.splice(index, 1);
      renderRoutineItems();
      showToast('성공', '루틴 항목이 삭제되었습니다.', 'success');
      console.log('✅ 루틴 항목 삭제 완료:', index);
    }
  );
};

// ✅ 루틴 항목 폼 초기화
function resetRoutineItemForm() {
  // 과목 입력 초기화
  const presetRadio = document.getElementById('subject-preset');
  const customRadio = document.getElementById('subject-custom');
  const presetSelect = document.getElementById('subject-preset-list');
  const customInput = document.getElementById('subject-custom-input');
  
  if (presetRadio) presetRadio.checked = true;
  if (customRadio) customRadio.checked = false;
  if (presetSelect) {
    presetSelect.selectedIndex = 0;
    presetSelect.style.display = 'block';
  }
  if (customInput) {
    customInput.value = '';
    customInput.style.display = 'none';
  }
  
  // 다른 폼 요소들 초기화
  const hoursInput = document.getElementById('daily-hours');
  const hoursSlider = document.getElementById('hours-slider');
  const notesTextarea = document.getElementById('notes');
  
  if (hoursInput) hoursInput.value = '2';
  if (hoursSlider) hoursSlider.value = '2';
  if (notesTextarea) notesTextarea.value = '';
  
  updateSliderDisplay();
  
  // 모든 체크박스 해제
  document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(cb => cb.checked = false);
  
  // 시간대 설정 초기화
  updateTimeSettings();
  
  // 모달 제목 초기화 및 삭제 버튼 숨기기
  const itemNumber = document.getElementById('routine-item-number');
  const deleteBtn = document.getElementById('delete-routine-item');
  
  if (itemNumber) {
    itemNumber.textContent = currentRoutineItems.length + 1;
  }
  if (deleteBtn) {
    deleteBtn.style.display = 'none';
  }
  
  currentEditingItemIndex = null;
  
  console.log('✅ 루틴 항목 폼 초기화 완료');
}

// ✅ 루틴 생성
async function generateRoutine() {
  try {
    if (currentRoutineItems.length === 0) {
      showToast('오류', '최소 1개 이상의 항목을 추가해주세요.', 'error');
      return;
    }

    console.log('🤖 AI 루틴 생성 시작...');
    showLoading('AI가 맞춤형 루틴을 생성하고 있습니다...');
    
    // 폼 데이터 수집
    const startDate = document.getElementById('routine-start-date')?.value;
    const duration = parseInt(document.getElementById('routine-duration')?.value) || 7;

    if (!startDate) {
      showToast('오류', '시작 날짜를 선택해주세요.', 'error');
      hideLoading();
      return;
    }

    // 루틴 생성 버튼 비활성화
    const generateBtn = document.getElementById('generate-routine');
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.textContent = '생성 중...';
    }

    // 서버에 루틴 생성 요청
    const requestData = {
      routineItems: currentRoutineItems,
      startDate,
      duration,
      preferences: {
        studyStyle: 'balanced',
        breakDuration: 15,
        maxDailyHours: Math.max(...currentRoutineItems.map(item => item.dailyHours))
      }
    };

    console.log('🤖 루틴 생성 요청:', requestData);

    const response = await authenticatedFetch('/api/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ 루틴 생성 응답:', result);

    if (result.success !== false) {
      generatedRoutine = result.recommendation;
      dailyRoutines = result.dailyRoutines || [];
      
      // 결과 모달에 데이터 표시
      displayRoutineResult();
      
      // 모달 전환
      hideModal('routine');
      showModal('routineResult');
      
      showToast('성공', '맞춤형 루틴이 생성되었습니다!', 'success');
    } else {
      throw new Error(result.error || '루틴 생성에 실패했습니다');
    }

  } catch (error) {
    console.error('❌ 루틴 생성 오류:', error);
    showToast('오류', `루틴 생성 실패: ${error.message}`, 'error');
  } finally {
    hideLoading();
    
    // 버튼 상태 복원
    const generateBtn = document.getElementById('generate-routine');
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = '루틴 생성';
    }
  }
}

// ✅ 루틴 결과 표시
function displayRoutineResult() {
  const fullRoutineContent = document.getElementById('full-routine-content');
  const dailyRoutineContent = document.getElementById('daily-routine-content');
  
  if (fullRoutineContent && generatedRoutine) {
    fullRoutineContent.textContent = generatedRoutine;
  }
  
  if (dailyRoutineContent && dailyRoutines.length > 0) {
    displayDailyRoutine(0);
  }
  
  // 탭 이벤트 설정
  setupRoutineResultTabs();
  
  console.log('✅ 루틴 결과 표시 완료');
}

// ✅ 일별 루틴 표시
function displayDailyRoutine(dayIndex) {
  const dailyRoutineContent = document.getElementById('daily-routine-content');
  const currentDayDisplay = document.getElementById('current-day-display');
  
  if (dailyRoutines && dailyRoutines[dayIndex]) {
    if (dailyRoutineContent) {
      dailyRoutineContent.textContent = dailyRoutines[dayIndex];
    }
    if (currentDayDisplay) {
      currentDayDisplay.textContent = `${dayIndex + 1}일차`;
    }
  }
  
  currentDayIndex = dayIndex;
}

// ✅ 루틴 결과 탭 설정
function setupRoutineResultTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 모든 탭 비활성화
      tabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // 선택된 탭 활성화
      tab.classList.add('active');
      const targetTab = tab.dataset.tab;
      const targetPane = document.getElementById(targetTab);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });
  
  // 이전/다음 일차 버튼
  const prevDayBtn = document.getElementById('prev-day');
  const nextDayBtn = document.getElementById('next-day');
  
  if (prevDayBtn) {
    prevDayBtn.addEventListener('click', () => {
      if (currentDayIndex > 0) {
        displayDailyRoutine(currentDayIndex - 1);
      }
    });
  }
  
  if (nextDayBtn) {
    nextDayBtn.addEventListener('click', () => {
      if (currentDayIndex < dailyRoutines.length - 1) {
        displayDailyRoutine(currentDayIndex + 1);
      }
    });
  }
}

// ✅ 캘린더에 루틴 저장
async function saveRoutineToCalendar() {
  try {
    if (!generatedRoutine) {
      showToast('오류', '저장할 루틴이 없습니다.', 'error');
      return;
    }

    showLoading('캘린더에 루틴을 저장하고 있습니다...');

    const routineData = {
      title: `AI 생성 루틴 - ${new Date().toLocaleDateString()}`,
      content: generatedRoutine,
      dailyRoutines: dailyRoutines,
      routineItems: currentRoutineItems,
      startDate: document.getElementById('routine-start-date')?.value,
      duration: parseInt(document.getElementById('routine-duration')?.value) || 7
    };

    const response = await authenticatedFetch('/api/routines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(routineData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success !== false) {
      showToast('성공', '루틴이 캘린더에 저장되었습니다!', 'success');
      
      // 모달 닫기
      hideModal('routineResult');
      
      // 홈 페이지 데이터 새로고침
      setTimeout(() => {
        if (window.fetchRecentRoutines) window.fetchRecentRoutines();
        if (window.fetchTodaySchedule) window.fetchTodaySchedule();
      }, 500);
      
      // 루틴 생성 폼 초기화
      initRoutineCreation();
      
      return result.routine || routineData;
    } else {
      throw new Error(result.error || '루틴 저장에 실패했습니다');
    }

  } catch (error) {
    console.error('❌ 루틴 저장 실패:', error);
    showToast('오류', `루틴 저장 실패: ${error.message}`, 'error');
    throw error;
  } finally {
    hideLoading();
  }
}

// ✅ 최근 루틴 렌더링 (ui.js에서 호출)
export function renderRecentRoutines(routines) {
  const container = document.getElementById('recent-routines-list');
  if (!container) {
    console.error('❌ Recent routines container not found');
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
  
  console.log(`✅ 최근 루틴 ${routines.length}개 렌더링 완료`);
}

// ✅ 루틴 결과 모달 이벤트 설정
export function initRoutineResultHandlers() {
  // 캘린더에 저장 버튼
  const saveToCalendarBtn = document.getElementById('save-to-calendar');
  if (saveToCalendarBtn) {
    saveToCalendarBtn.addEventListener('click', async () => {
      await saveRoutineToCalendar();
    });
  }

  // 다시 생성 버튼
  const regenerateBtn = document.getElementById('regenerate-routine');
  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', () => {
      hideModal('routineResult');
      showModal('routine');
    });
  }

  // 루틴 편집 버튼
  const editRoutineBtn = document.getElementById('edit-routine-btn');
  if (editRoutineBtn) {
    editRoutineBtn.addEventListener('click', () => {
      toggleRoutineEdit();
    });
  }

  // 일정 수정 버튼
  const editDailyRoutineBtn = document.getElementById('edit-daily-routine');
  if (editDailyRoutineBtn) {
    editDailyRoutineBtn.addEventListener('click', () => {
      showModal('editSchedule');
    });
  }
}

// ✅ 루틴 편집 토글
function toggleRoutineEdit() {
  const routineText = document.getElementById('full-routine-content');
  const routineEditor = document.getElementById('routine-editor');
  const editBtn = document.getElementById('edit-routine-btn');
  
  if (!isEditingRoutine) {
    // 편집 모드 시작
    if (routineText && routineEditor) {
      originalRoutineContent = routineText.textContent;
      routineEditor.value = originalRoutineContent;
      routineText.style.display = 'none';
      routineEditor.style.display = 'block';
      editBtn.textContent = '저장';
      isEditingRoutine = true;
    }
  } else {
    // 편집 저장
    if (routineText && routineEditor) {
      generatedRoutine = routineEditor.value;
      routineText.textContent = generatedRoutine;
      routineText.style.display = 'block';
      routineEditor.style.display = 'none';
      editBtn.textContent = '편집';
      isEditingRoutine = false;
      showToast('성공', '루틴이 수정되었습니다.', 'success');
    }
  }
}

// ✅ 전역 함수로 노출
window.editRoutineItem = window.editRoutineItem;
window.deleteRoutineItem = window.deleteRoutineItem;
window.currentRoutineId = null;

console.log('✅ routine.js 모듈 로드 완료');