// ====================================
// 루틴 관련 기능들 - 백엔드 연동 완전판
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
      document.getElementById('routine-item-number').textContent = currentRoutineItems.length + 1;
      showModal('routineItem');
      
      setTimeout(() => {
        resetRoutineItemForm();
      }, 0);
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

  // 집중 시간대 드롭다운 초기화
  initFocusTimeDropdowns();
  
  // 요일 선택 체크박스 초기화
  initDaySelectors();
  
  console.log('✅ 루틴 핸들러 초기화 완료');
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
    const subject = document.getElementById('routine-subject')?.value?.trim();
    const dailyHours = parseFloat(document.getElementById('routine-hours')?.value) || 0;
    const focusTimeSlots = Array.from(document.querySelectorAll('input[name="focus-time"]:checked')).map(cb => cb.value);
    const selectedDays = Array.from(document.querySelectorAll('input[name="study-days"]:checked')).map(cb => cb.value);
    const notes = document.getElementById('routine-notes')?.value?.trim() || '';

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

    // 루틴 항목 데이터 생성
    const routineItem = {
      subject,
      dailyHours,
      focusTimeSlots,
      selectedDays,
      notes,
      unavailableTimes: [], // 향후 확장용
      priority: 'medium', // 기본 우선순위
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

// ✅ 루틴 항목 렌더링
function renderRoutineItems() {
  const container = document.getElementById('routine-items-container');
  if (!container) return;

  container.innerHTML = '';

  if (currentRoutineItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ri-book-line"></i>
        <p>추가된 루틴 항목이 없습니다.<br>새 항목을 추가해보세요!</p>
      </div>
    `;
    return;
  }

  currentRoutineItems.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'routine-item';
    itemDiv.innerHTML = `
      <div class="routine-item-header">
        <h4>${item.subject}</h4>
        <div class="routine-item-actions">
          <button onclick="editRoutineItem(${index})" class="btn-edit" title="수정">
            <i class="ri-edit-line"></i>
          </button>
          <button onclick="deleteRoutineItem(${index})" class="btn-delete" title="삭제">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>
      <div class="routine-item-content">
        <p><strong>일일 학습시간:</strong> ${item.dailyHours}시간</p>
        <p><strong>집중 시간대:</strong> ${item.focusTimeSlots.map(slot => 
          focusTimeOptions.find(opt => opt.value === slot)?.text || slot
        ).join(', ')}</p>
        <p><strong>학습 요일:</strong> ${item.selectedDays.map(day => dayNames[day] || day).join(', ')}</p>
        ${item.notes ? `<p><strong>메모:</strong> ${item.notes}</p>` : ''}
      </div>
    `;
    
    container.appendChild(itemDiv);
  });

  // 루틴 생성 버튼 활성화/비활성화
  const generateBtn = document.getElementById('generate-routine');
  if (generateBtn) {
    generateBtn.disabled = currentRoutineItems.length === 0;
  }

  console.log(`✅ 루틴 항목 ${currentRoutineItems.length}개 렌더링 완료`);
}

// ✅ 루틴 항목 편집
window.editRoutineItem = function(index) {
  if (index < 0 || index >= currentRoutineItems.length) return;
  
  const item = currentRoutineItems[index];
  currentEditingItemIndex = index;
  
  // 폼에 기존 데이터 채우기
  document.getElementById('routine-subject').value = item.subject;
  document.getElementById('routine-hours').value = item.dailyHours;
  document.getElementById('routine-notes').value = item.notes || '';
  
  // 집중 시간대 체크박스 설정
  document.querySelectorAll('input[name="focus-time"]').forEach(cb => {
    cb.checked = item.focusTimeSlots.includes(cb.value);
  });
  
  // 요일 체크박스 설정
  document.querySelectorAll('input[name="study-days"]').forEach(cb => {
    cb.checked = item.selectedDays.includes(cb.value);
  });
  
  // 모달 제목 변경
  document.getElementById('routine-item-number').textContent = `항목 ${index + 1} 수정`;
  
  showModal('routineItem');
  console.log('✅ 루틴 항목 편집 시작:', index);
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

// ✅ 루틴 생성
async function generateRoutine() {
  try {
    if (currentRoutineItems.length === 0) {
      showToast('오류', '최소 1개 이상의 항목을 추가해주세요.', 'error');
      return;
    }

    // 폼 데이터 수집
    const startDate = document.getElementById('routine-start-date')?.value;
    const duration = parseInt(document.getElementById('routine-duration')?.value) || 7;
    const excludeHolidays = document.getElementById('exclude-holidays')?.checked || false;

    if (!startDate) {
      showToast('오류', '시작 날짜를 선택해주세요.', 'error');
      return;
    }

    if (duration < 1 || duration > 365) {
      showToast('오류', '기간은 1일에서 365일 사이로 설정해주세요.', 'error');
      return;
    }

    // 로딩 표시
    showLoading('AI가 맞춤형 루틴을 생성하고 있습니다...');
    
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
      excludeHolidays,
      preferences: {
        studyStyle: 'balanced', // 기본값
        breakDuration: 15, // 15분 휴식
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
      generateBtn.disabled = false;
      generateBtn.textContent = 'AI 루틴 생성';
    }
  }
}

// ✅ 루틴 결과 표시
function displayRoutineResult() {
  // 전체 루틴 설명 표시
  const routineOverview = document.getElementById('routine-overview');
  if (routineOverview && generatedRoutine) {
    routineOverview.innerHTML = `<pre>${generatedRoutine}</pre>`;
  }

  // 일일 루틴 표시
  const dailyRoutinesList = document.getElementById('daily-routines-list');
  if (dailyRoutinesList && dailyRoutines) {
    dailyRoutinesList.innerHTML = '';
    
    dailyRoutines.forEach((day, index) => {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'daily-routine-item';
      dayDiv.innerHTML = `
        <div class="daily-routine-header">
          <h4>Day ${day.day}: ${day.date}</h4>
          <button onclick="toggleDayDetails(${index})" class="btn-toggle">
            <i class="ri-arrow-down-s-line"></i>
          </button>
        </div>
        <div class="daily-routine-content" id="day-content-${index}" style="display: none;">
          <div class="daily-routine-text">
            <pre>${day.content}</pre>
          </div>
          ${day.schedules && day.schedules.length > 0 ? `
            <div class="daily-schedule">
              <h5>상세 일정:</h5>
              ${day.schedules.map(schedule => `
                <div class="schedule-item">
                  <span class="schedule-time">${schedule.startTime}-${schedule.endTime}</span>
                  <span class="schedule-title">${schedule.title}</span>
                  ${schedule.notes ? `<span class="schedule-notes">${schedule.notes}</span>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
      
      dailyRoutinesList.appendChild(dayDiv);
    });
  }

  // 루틴 네비게이션 설정
  setupRoutineNavigation();
  
  console.log('✅ 루틴 결과 표시 완료');
}

// ✅ 일일 루틴 상세 토글
window.toggleDayDetails = function(index) {
  const content = document.getElementById(`day-content-${index}`);
  const button = content?.previousElementSibling?.querySelector('.btn-toggle i');
  
  if (content) {
    if (content.style.display === 'none') {
      content.style.display = 'block';
      if (button) button.style.transform = 'rotate(180deg)';
    } else {
      content.style.display = 'none';
      if (button) button.style.transform = 'rotate(0deg)';
    }
  }
};

// ✅ 루틴 네비게이션 설정
function setupRoutineNavigation() {
  // 이전/다음 버튼 이벤트
  const prevBtn = document.getElementById('prev-day');
  const nextBtn = document.getElementById('next-day');
  
  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentDayIndex > 0) {
        currentDayIndex--;
        updateDayDisplay();
      }
    };
  }
  
  if (nextBtn) {
    nextBtn.onclick = () => {
      if (currentDayIndex < dailyRoutines.length - 1) {
        currentDayIndex++;
        updateDayDisplay();
      }
    };
  }
  
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
  
  updateDayDisplay();
}

// ✅ 현재 날짜 표시 업데이트
function updateDayDisplay() {
  const prevBtn = document.getElementById('prev-day');
  const nextBtn = document.getElementById('next-day');
  const dayCounter = document.getElementById('current-day');
  
  if (prevBtn) {
    prevBtn.disabled = currentDayIndex === 0;
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentDayIndex === dailyRoutines.length - 1;
  }
  
  if (dayCounter && dailyRoutines[currentDayIndex]) {
    dayCounter.textContent = `${currentDayIndex + 1} / ${dailyRoutines.length}`;
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
      
      // 캘린더에 이벤트 추가
      await addRoutineToCalendar(result.routine || routineData);
      
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

// ✅ 루틴을 캘린더에 추가
async function addRoutineToCalendar(routineData) {
  try {
    console.log('📅 루틴을 캘린더에 추가 중...');
    
    if (!routineData.dailyRoutines || !Array.isArray(routineData.dailyRoutines)) {
      console.warn('⚠️ 일일 루틴 데이터가 없어 캘린더 추가를 건너뜁니다');
      return;
    }

    let addedCount = 0;
    
    for (const dayRoutine of routineData.dailyRoutines) {
      if (dayRoutine.schedules && Array.isArray(dayRoutine.schedules)) {
        for (const schedule of dayRoutine.schedules) {
          try {
            const eventData = {
              title: schedule.title,
              start: `${routineData.startDate}T${schedule.startTime}:00`,
              end: `${routineData.startDate}T${schedule.endTime}:00`,
              extendedProps: {
                subject: schedule.subject || '',
                notes: schedule.notes || '',
                completed: false
              },
              backgroundColor: getSubjectColor(schedule.subject),
              borderColor: getSubjectColor(schedule.subject)
            };

            const response = await authenticatedFetch('/api/calendar/events', {
              method: 'POST',
              body: JSON.stringify(eventData)
            });

            if (response.ok) {
              addedCount++;
            }
          } catch (eventError) {
            console.warn('⚠️ 개별 이벤트 추가 실패:', eventError);
          }
        }
      }
    }

    if (addedCount > 0) {
      console.log(`✅ ${addedCount}개 일정이 캘린더에 추가됨`);
      showToast('성공', `${addedCount}개 일정이 캘린더에 추가되었습니다.`, 'success');
    }

  } catch (error) {
    console.error('❌ 캘린더 추가 오류:', error);
    console.warn('⚠️ 캘린더 추가는 실패했지만 루틴 저장은 완료됨');
  }
}

// ✅ 과목별 색상 반환
function getSubjectColor(subject) {
  const colors = {
    '수학': '#e74c3c',
    '영어': '#3498db', 
    '국어': '#2ecc71',
    '과학': '#f39c12',
    '사회': '#9b59b6',
    '프로그래밍': '#34495e',
    '디자인': '#e67e22',
    '음악': '#1abc9c',
    '체육': '#95a5a6'
  };
  
  return colors[subject] || '#4361ee';
}

// ✅ 루틴 항목 폼 초기화
function resetRoutineItemForm() {
  document.getElementById('routine-subject').value = '';
  document.getElementById('routine-hours').value = '2';
  document.getElementById('routine-notes').value = '';
  
  // 모든 체크박스 해제
  document.querySelectorAll('input[name="focus-time"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('input[name="study-days"]').forEach(cb => cb.checked = false);
  
  // 기본값 설정
  document.querySelector('input[name="focus-time"][value="forenoon"]').checked = true;
  document.querySelector('input[name="study-days"][value="mon"]').checked = true;
  
  currentEditingItemIndex = null;
  
  console.log('✅ 루틴 항목 폼 초기화 완료');
}

// ✅ 집중 시간대 드롭다운 초기화
function initFocusTimeDropdowns() {
  const containers = document.querySelectorAll('.focus-time-options');
  
  containers.forEach(container => {
    focusTimeOptions.forEach(option => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.innerHTML = `
        <input type="checkbox" name="focus-time" value="${option.value}">
        <span class="checkmark"></span>
        ${option.text}
      `;
      container.appendChild(label);
    });
  });
  
  console.log('✅ 집중 시간대 옵션 초기화 완료');
}

// ✅ 요일 선택 체크박스 초기화
function initDaySelectors() {
  const containers = document.querySelectorAll('.study-days-options');
  
  containers.forEach(container => {
    Object.entries(dayNames).forEach(([key, value]) => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.innerHTML = `
        <input type="checkbox" name="study-days" value="${key}">
        <span class="checkmark"></span>
        ${value}
      `;
      container.appendChild(label);
    });
  });
  
  console.log('✅ 요일 선택 옵션 초기화 완료');
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
window.toggleDayDetails = window.toggleDayDetails;
window.currentRoutineId = null;

console.log('✅ routine.js 모듈 로드 완료');