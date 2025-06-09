// ====================================
// 루틴 관련 기능들 - 기존 구조 유지 수정 버전
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
  
  // 루틴 항목 삭제 버튼
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

  // 요일 선택 변경 이벤트
  const dayCheckboxes = document.querySelectorAll('.day-checkbox input[type="checkbox"]');
  dayCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateUnavailableTimeSettings);
  });

  // 집중 시간대 체크박스 이벤트
  const focusTimeCheckboxes = document.querySelectorAll('input[name="focus-time"]');
  focusTimeCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      console.log('집중 시간대 선택:', this.value, this.checked);
    });
  });
}

// ✅ 슬라이더 값 표시 업데이트
function updateSliderDisplay() {
  const slider = document.getElementById('hours-slider');
  const display = document.getElementById('slider-value');
  if (slider && display) {
    display.textContent = slider.value;
  }
}

// ✅ 학습 불가 시간대 설정 업데이트
function updateUnavailableTimeSettings() {
  const selectedDays = Array.from(document.querySelectorAll('.day-checkbox input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.value);
  
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
    // 폼 데이터 수집 (기존 ID 사용)
    const subject = document.getElementById('subject')?.value?.trim();
    const dailyHours = parseFloat(document.getElementById('daily-hours')?.value) || 0;
    const focusTimeSlots = Array.from(document.querySelectorAll('input[name="focus-time"]:checked')).map(cb => cb.value);
    const selectedDays = Array.from(document.querySelectorAll('.day-checkbox input[type="checkbox"]:checked')).map(cb => cb.value);
    const notes = document.getElementById('notes')?.value?.trim() || '';

    console.log('📝 폼 데이터 수집:', {
      subject,
      dailyHours,
      focusTimeSlots,
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

    if (focusTimeSlots.length === 0) {
      showToast('오류', '집중 시간대를 최소 1개 이상 선택해주세요.', 'error');
      return;
    }

    if (selectedDays.length === 0) {
      showToast('오류', '학습 요일을 최소 1개 이상 선택해주세요.', 'error');
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
    const focusText = item.focusTimeSlots.map(slot => {
      const option = focusTimeOptions.find(opt => opt.value === slot);
      return option ? option.text : slot;
    }).join(', ');
    
    html += `
      <div class="routine-item" onclick="editRoutineItem(${index})">
        <div class="routine-item-content">
          <h3>${item.subject}</h3>
          <p><strong>시간:</strong> ${item.dailyHours}시간/일</p>
          <p><strong>요일:</strong> ${daysText}</p>
          <p><strong>집중 시간대:</strong> ${focusText}</p>
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
  const subjectInput = document.getElementById('subject');
  const hoursInput = document.getElementById('daily-hours');
  const hoursSlider = document.getElementById('hours-slider');
  const notesTextarea = document.getElementById('notes');
  
  if (subjectInput) subjectInput.value = item.subject;
  if (hoursInput) hoursInput.value = item.dailyHours;
  if (hoursSlider) hoursSlider.value = item.dailyHours;
  if (notesTextarea) notesTextarea.value = item.notes || '';
  
  updateSliderDisplay();
  
  // 요일 체크박스 설정
  document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = item.selectedDays.includes(checkbox.value);
  });
  
  // 집중 시간대 설정
  document.querySelectorAll('input[name="focus-time"]').forEach(radio => {
    radio.checked = item.focusTimeSlots.includes(radio.value);
  });
  
  // 학습 불가 시간대 UI 업데이트
  updateUnavailableTimeSettings();
  
  // 학습 불가 시간대 데이터 설정 (DOM 업데이트 후)
  setTimeout(() => {
    if (item.unavailableTimes) {
      item.unavailableTimes.forEach(timeSlot => {
        const startInput = document.querySelector(`.unavailable-start[data-day="${timeSlot.day}"]`);
        const endInput = document.querySelector(`.unavailable-end[data-day="${timeSlot.day}"]`);
        
        if (startInput) startInput.value = timeSlot.startTime;
        if (endInput) endInput.value = timeSlot.endTime;
      });
    }
  }, 100);
  
  // 모달 제목 변경
  const itemNumber = document.getElementById('routine-item-number');
  if (itemNumber) {
    itemNumber.textContent = index + 1;
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
  const subjectInput = document.getElementById('subject');
  const hoursInput = document.getElementById('daily-hours');
  const hoursSlider = document.getElementById('hours-slider');
  const notesTextarea = document.getElementById('notes');
  
  if (subjectInput) subjectInput.value = '';
  if (hoursInput) hoursInput.value = '2';
  if (hoursSlider) hoursSlider.value = '2';
  if (notesTextarea) notesTextarea.value = '';
  
  updateSliderDisplay();
  
  // 모든 체크박스 해제
  document.querySelectorAll('input[name="focus-time"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('.day-checkbox input[type="checkbox"]').forEach(cb => cb.checked = false);
  
  // 학습 불가 시간대 초기화
  updateUnavailableTimeSettings();
  
  // 모달 제목 초기화
  const itemNumber = document.getElementById('routine-item-number');
  if (itemNumber) {
    itemNumber.textContent = currentRoutineItems.length + 1;
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
    
    // 루틴 생성 버튼 다시 활성화
    const generateBtn = document.getElementById('generate-routine');
    if (generateBtn) {
      generateBtn.disabled = currentRoutineItems.length === 0;
      generateBtn.textContent = 'AI 루틴 생성';
    }
  }
}

// ✅ 루틴 결과 표시
function displayRoutineResult() {
  // 전체 루틴 설명 표시
  const routineOverview = document.getElementById('full-routine-content');
  if (routineOverview && generatedRoutine) {
    routineOverview.innerHTML = `<pre>${generatedRoutine}</pre>`;
  }

  // 일일 루틴 표시 (필요한 경우)
  setupRoutineNavigation();
  
  console.log('✅ 루틴 결과 표시 완료');
}

// ✅ 루틴 네비게이션 설정
function setupRoutineNavigation() {
  // 루틴 저장 버튼
  const saveRoutineBtn = document.getElementById('save-routine');
  if (saveRoutineBtn) {
    saveRoutineBtn.onclick = async () => {
      await saveRoutineToBackend();
    };
  }
  
  // 루틴 편집 버튼
  const editRoutineBtn = document.getElementById('edit-routine');
  if (editRoutineBtn) {
    editRoutineBtn.onclick = () => {
      hideModal('routineResult');
      showModal('routine');
    };
  }
}

// ✅ 루틴 백엔드 저장
async function saveRoutineToBackend() {
  try {
    if (!generatedRoutine || !dailyRoutines) {
      showToast('오류', '저장할 루틴 데이터가 없습니다.', 'error');
      return;
    }

    showLoading('루틴을 저장하고 있습니다...');

    const routineData = {
      routineItems: currentRoutineItems,
      fullRoutine: generatedRoutine,
      dailyRoutines: dailyRoutines,
      startDate: document.getElementById('routine-start-date')?.value || new Date().toISOString().split('T')[0],
      duration: parseInt(document.getElementById('routine-duration')?.value) || 7
    };

    console.log('💾 루틴 저장 요청:', routineData);

    const response = await authenticatedFetch('/api/routines/save', {
      method: 'POST',
      body: JSON.stringify(routineData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ 루틴 저장 성공:', result);

    if (result.success || result.ok) {
      showToast('성공', '루틴이 성공적으로 저장되었습니다!', 'success');
      
      // 모달 닫기
      hideModal('routineResult');
      
      // 홈 페이지 데이터 새로고침
      setTimeout(() => {
        window.fetchRecentRoutines?.();
        window.fetchTodaySchedule?.();
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

// ✅ 전역 함수로 노출
window.editRoutineItem = window.editRoutineItem;
window.deleteRoutineItem = window.deleteRoutineItem;
window.currentRoutineId = null;

console.log('✅ routine.js 모듈 로드 완료');