// 루틴 관련 기능들
import { getAuthToken } from './auth.js';
import { showToast, showModal, hideModal, renderRecentRoutines, renderTodaySchedule } from './ui.js';

// 전역 상태 변수
let currentRoutineItems = [];
let currentEditingItemIndex = null;
let generatedRoutine = null;
let dailyRoutines = [];
let currentDayIndex = 0;

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
    resetRoutineItemForm();
    document.getElementById('routine-item-number').textContent = currentRoutineItems.length + 1;
    showModal('routineItem');
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
    if (currentRoutineItems.length === 0) {
      showToast('오류', '최소 1개 이상의 항목을 추가해주세요.', 'error');
      return;
    }
    
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
}

// 최근 루틴 가져오기 함수 추가
export async function fetchRecentRoutines() {
  try {
    // 실제 구현에서는 서버 API 호출
    const response = await fetch('/api/routines/recent', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    
    // 서버 응답 처리
    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }
    
    // 응답 타입 확인
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('올바르지 않은 응답 형식');
    }
    
    const data = await response.json();
    renderRecentRoutines(data.routines || []);
    return data.routines || [];
    
  } catch (error) {
    console.error('Fetch recent routines error:', error);
    showToast('오류', error.message || '루틴 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    
    // 빈 배열 반환 및 UI 업데이트
    renderRecentRoutines([]);
    return [];
  }
}

// 오늘의 일정 가져오기 함수 추가
export async function fetchTodaySchedule() {
  try {
    // 실제 구현에서는 서버 API 호출
    const response = await fetch('/api/schedule/today', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    
    // 서버 응답 처리
    if (response.ok) {
      const data = await response.json();
      renderTodaySchedule(data.schedule);
      return data.schedule;
    } else {
      // 오류 응답 처리
      const error = await response.json();
      console.error('Failed to fetch schedule:', error);
      
      // 대체 데이터로 UI 업데이트
      const mockSchedule = [
        { id: 1, title: '수학 문제풀이', time: '09:00-11:00', completed: false },
        { id: 2, title: '영어 회화 연습', time: '13:00-14:30', completed: false },
        { id: 3, title: '프로그래밍 공부', time: '16:00-18:00', completed: true }
      ];
      
      renderTodaySchedule(mockSchedule);
      return mockSchedule;
    }
  } catch (error) {
    console.error('Fetch today schedule error:', error);
    
    // 오류 발생 시 UI 업데이트를 위한 더미 데이터
    const mockSchedule = [
      { id: 1, title: '수학 문제풀이', time: '09:00-11:00', completed: false },
      { id: 2, title: '영어 회화 연습', time: '13:00-14:30', completed: false },
      { id: 3, title: '프로그래밍 공부', time: '16:00-18:00', completed: true }
    ];
    
    renderTodaySchedule(mockSchedule);
    return mockSchedule;
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
  hideModal('routineItem');
}

// 루틴 항목 렌더링
function renderRoutineItems() {
  const container = document.getElementById('routine-items-container');
  if (!container) return;
  
  container.innerHTML = '';
  
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
    
    container.appendChild(el);
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
  
  showModal('routineItem');
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
  hideModal('routine');
  
  try {
    // 서버에 요청 데이터 준비
    const requestData = {
      routineItems: currentRoutineItems,
      startDate: document.getElementById('routine-start-date').value,
      duration: document.getElementById('routine-duration').value
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
    
    // 테스트 환경에서는 아래 코드로 실행
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '루틴 생성 실패');
    }
    
    const responseData = await response.json();
    
    // 샘플 데이터 생성 (실제는 API 응답 사용)
    const mockResponse = {
      fullRoutine: responseData.recommendation || generateMockRoutine(),
      dailyRoutines: generateMockDailyRoutines()
    };
    
    generatedRoutine = mockResponse.fullRoutine;
    dailyRoutines = mockResponse.dailyRoutines;
    currentDayIndex = 0;
    
    // 결과 표시
    document.getElementById('full-routine-content').textContent = generatedRoutine;
    updateDailyRoutineView();
    
    showModal('routineResult');
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
    
    // 드래그 앤 드롭 구현을 위한 이벤트 리스너 등록
    el.addEventListener('dragstart', handleDragStart);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('dragleave', handleDragLeave);
    el.addEventListener('drop', handleDrop);
    el.addEventListener('dragend', handleDragEnd);
    
    container.appendChild(el);
  });
}

// 드래그 앤 드롭 관련 변수와 함수들
let dragSrcEl = null;

function handleDragStart(e) {
  this.style.opacity = '0.4';
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('over');
  return false;
}

function handleDragLeave(e) {
  this.classList.remove('over');
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (dragSrcEl != this) {
    // 요소 위치 교환 로직 (실제로는 데이터 배열도 함께 조작해야 함)
    const parent = this.parentNode;
    const srcIndex = Array.from(parent.children).indexOf(dragSrcEl);
    const destIndex = Array.from(parent.children).indexOf(this);
    
    // 데이터 배열에서 해당 요소들의 위치 교환
    const currentDayRoutine = dailyRoutines[currentDayIndex];
    if (currentDayRoutine && currentDayRoutine.schedules) {
      const temp = currentDayRoutine.schedules[srcIndex];
      currentDayRoutine.schedules[srcIndex] = currentDayRoutine.schedules[destIndex];
      currentDayRoutine.schedules[destIndex] = temp;
      
      // UI 다시 렌더링
      renderScheduleItems(currentDayRoutine.schedules);
    }
  }
  
  return false;
}

function handleDragEnd(e) {
  this.style.opacity = '1';
  
  document.querySelectorAll('.schedule-item').forEach(item => {
    item.classList.remove('over');
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
  
  // 캘린더 페이지로 이동
  document.querySelector('.nav-item[data-page="calendar"]').click();
  
  // 캘린더 초기화 함수가 있는지 확인
  if (typeof window.initCalendar !== 'function') {
    showToast('오류', '캘린더를 초기화할 수 없습니다.', 'error');
    return;
  }
  
  // 캘린더 객체 가져오기
  const calendar = window.calendar;
  if (!calendar) {
    showToast('오류', '캘린더를 찾을 수 없습니다.', 'error');
    return;
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
  
  hideModal('routineResult');
  showToast('성공', '루틴이 캘린더에 저장되었습니다.', 'success');
  
  // 루틴 저장 API 호출 (실제 구현시 추가)
  saveToDatabaseIfNeeded();
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
${currentRoutineItems.map(item => `- ${item.subject}: 일 ${item.dailyHours}시간, 우선순위 ${item.priority}`).join('\n')}

## 전체 루틴 요약
1. 아침 시간대 (05:00-09:00): 집중력이 필요한 과목
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
      '체육': ['기초 체력 훈련', '기술 연습', '전술 학습', '경기 분석', '회복 트레이닝']
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