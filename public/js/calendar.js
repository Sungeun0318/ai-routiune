// calendar.js - 간단한 버전

// 전역 변수
let calendar;
let currentEvent = null;

// showModal, hideModal, showToast는 전역에서 사용 가능하도록 설정
// (app.js에서 window에 등록됨)

// 캘린더 초기화
export function initCalendar() {
  console.log('🔄 캘린더 초기화 시작...');
  
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) {
    console.error('❌ Calendar element not found');
    return null;
  }

  // FullCalendar가 로드되었는지 확인
  if (typeof FullCalendar === 'undefined') {
    console.error('❌ FullCalendar is not loaded');
    if (window.showToast) {
      window.showToast('오류', 'FullCalendar 라이브러리를 로드할 수 없습니다.', 'error');
    }
    return null;
  }

  // 기존 캘린더가 있으면 제거
  if (calendar) {
    console.log('🗑️ 기존 캘린더 제거');
    calendar.destroy();
  }

  try {
    console.log('📅 새 캘린더 인스턴스 생성...');
    
    // FullCalendar 초기화
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'ko',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      },
      height: 'auto',
      
      // 이벤트 클릭 처리
      eventClick: function(info) {
        console.log('📅 Event clicked:', info.event.title);
        showEventDetails(info.event);
      },
      
      // 시간 포맷
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      
      // 편집 가능 설정
      editable: true,
      droppable: true,
      
      // 이벤트 드래그 처리
      eventDrop: function(info) {
        if (window.showToast) {
          window.showToast('성공', '일정이 변경되었습니다.', 'success');
        }
        updateEventOnServer(info.event);
      },
      
      // 이벤트 크기 조정 처리
      eventResize: function(info) {
        if (window.showToast) {
          window.showToast('성공', '일정이 변경되었습니다.', 'success');
        }
        updateEventOnServer(info.event);
      },
      
      // 날짜 클릭 처리
      dateClick: function(info) {
        console.log('📅 Date clicked:', info.dateStr);
      },
      
      // 이벤트 렌더링 후 처리
      eventDidMount: function(info) {
        if (info.event.extendedProps?.completed) {
          info.el.style.opacity = '0.6';
          info.el.style.textDecoration = 'line-through';
        }
      }
    });

    console.log('🎨 캘린더 렌더링...');
    calendar.render();
    
    // 전역 변수에 할당
    window.calendar = calendar;
    
    console.log('✅ 캘린더 초기화 완료');
    
    // 이벤트 핸들러 초기화
    initEventHandlers();
    
    // 캘린더 이벤트 로드
    loadCalendarEvents();
    // ✅ 여기 추가
    setupSaveButtonHandler();
    return calendar;
    
  } catch (error) {
    console.error('❌ Calendar initialization error:', error);
    if (window.showToast) {
      window.showToast('오류', '캘린더 초기화 중 오류가 발생했습니다.', 'error');
    }
    return null;
  }
}

// 캘린더 이벤트 로드
async function loadCalendarEvents() {
  try {
    console.log('📥 캘린더 이벤트 로드 중...');

    // 서버에서 실제 이벤트 가져오기 시도
    const response = await fetch('/api/calendar/events', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      const events = data.events || [];
      
      console.log('📦 서버에서 가져온 이벤트:', events.length, '개');

      events.forEach(event => {
        calendar.addEvent({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          backgroundColor: event.backgroundColor || '#4361ee',
          borderColor: event.borderColor || '#4361ee',
          extendedProps: {
            subject: event.subject || '',
            notes: event.notes || '',
            completed: event.completed || false
          }
        });
      });

      console.log(`✅ ${events.length}개의 이벤트 로드 완료`);
    } else {
      console.log('⚠️ 서버에서 이벤트 로드 실패, 테스트 이벤트 생성');
      addTestEvent();
    }
  } catch (error) {
    console.error('❌ 이벤트 로드 오류:', error);
    addTestEvent();
  }
}

// 테스트 이벤트 추가
function addTestEvent() {
  if (!calendar) return;
  
  const today = new Date();
  const testEvent = {
    id: 'test-event-1',
    title: '📚 테스트 학습 일정',
    start: today.toISOString(),
    end: new Date(today.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2시간 후
    backgroundColor: '#4361ee',
    borderColor: '#4361ee',
    extendedProps: {
      subject: '테스트',
      notes: '이것은 테스트 이벤트입니다.',
      completed: false
    }
  };
  
  calendar.addEvent(testEvent);
  console.log('✅ 테스트 이벤트 추가됨');
}

// 이벤트 상세 정보 표시
function showEventDetails(event) {
  if (!event || !event.title) {
    console.error('❌ 유효하지 않은 이벤트:', event);
    return;
  }

  console.log('📋 이벤트 상세 정보 표시:', event.title);
  
  currentEvent = event;
  
  // 이벤트 정보 설정
  const titleEl = document.getElementById('event-title');
  const timeEl = document.getElementById('event-time');
  const dateEl = document.getElementById('event-date');
  const subjectEl = document.getElementById('event-subject');
  const notesEl = document.getElementById('event-notes');
  
  if (titleEl) titleEl.textContent = event.title;
  
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
  
  if (timeEl) timeEl.textContent = `시간: ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
  if (dateEl) dateEl.textContent = `날짜: ${dateFormatter.format(start)}`;
  
  const subject = event.extendedProps?.subject || event.title;
  if (subjectEl) subjectEl.textContent = `과목: ${subject}`;
  
  const notes = event.extendedProps?.notes || '';
  if (notesEl) notesEl.textContent = notes || '메모 없음';
  
  // 완료 상태에 따라 버튼 상태 변경
  const completeBtn = document.getElementById('complete-event');
  if (completeBtn) {
    if (event.extendedProps?.completed) {
      completeBtn.textContent = '완료 취소';
      completeBtn.classList.remove('btn-primary');
      completeBtn.classList.add('btn-secondary');
    } else {
      completeBtn.textContent = '완료';
      completeBtn.classList.remove('btn-secondary');
      completeBtn.classList.add('btn-primary');
    }
  }
  
  // 모달 표시
  if (window.showModal) {
    window.showModal('eventDetail');
  }
}

// 이벤트 핸들러 초기화
function initEventHandlers() {
  console.log('🔧 이벤트 핸들러 초기화...');
  
  // 이벤트 삭제 버튼
  const deleteBtn = document.getElementById('delete-event');
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      if (currentEvent && confirm('이 일정을 삭제하시겠습니까?')) {
        currentEvent.remove();
        if (window.hideModal) window.hideModal('eventDetail');
        if (window.showToast) window.showToast('성공', '일정이 삭제되었습니다.', 'success');
        deleteEventOnServer(currentEvent.id);
      }
    };
  }

  // ✅ 편집 저장 버튼 핸들러 (기존 리스너 완전히 제거 후 새로 등록)
const saveEditBtn = document.getElementById('save-schedule-edit');
if (saveEditBtn) {
  // 기존 모든 이벤트 리스너 제거
  const newSaveBtn = saveEditBtn.cloneNode(true);
  saveEditBtn.parentNode.replaceChild(newSaveBtn, saveEditBtn);
  
  // 새로운 이벤트 리스너만 등록
  newSaveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentEvent) {
      await saveEventEdit();
    } else {
      console.log('❌ currentEvent가 없습니다');
    }
  });
}

  
  
  // 이벤트 편집 버튼
  const editBtn = document.getElementById('edit-event');
   if (editBtn) {
    editBtn.onclick = () => {
     if (currentEvent) {
      // 상세 모달 닫기
      if (window.hideModal) window.hideModal('eventDetail');
      
      // ✅ 편집 모달의 필드들을 현재 이벤트 데이터로 채우기
      fillEditModal(currentEvent);
      
      // ✅ 편집 모달 표시
      if (window.showModal) window.showModal('editSchedule');
    }
  };
}
  
  // 이벤트 완료 버튼
  const completeBtn = document.getElementById('complete-event');
  if (completeBtn) {
    completeBtn.onclick = () => {
      if (currentEvent) {
        const isCompleted = !!currentEvent.extendedProps?.completed;
        
        // 상태 변경
        currentEvent.setExtendedProp('completed', !isCompleted);
        
        // 색상 변경
        if (!isCompleted) {
          currentEvent.setProp('backgroundColor', '#10b981');
          currentEvent.setProp('borderColor', '#10b981');
          if (window.showToast) window.showToast('성공', '일정이 완료되었습니다.', 'success');
        } else {
          currentEvent.setProp('backgroundColor', '#4361ee');
          currentEvent.setProp('borderColor', '#4361ee');
          if (window.showToast) window.showToast('정보', '일정 완료가 취소되었습니다.', 'info');
        }
        
        if (window.hideModal) window.hideModal('eventDetail');
        updateEventOnServer(currentEvent);
      }
    };
  }
  
  console.log('✅ 이벤트 핸들러 초기화 완료');
}

// ✅ 편집 모달 필드 채우기 함수 (새로 추가)
function fillEditModal(event) {
  const titleInput = document.getElementById('edit-title');
  const timeInput = document.getElementById('edit-time');
  const memoInput = document.getElementById('edit-memo');
  
  if (titleInput) titleInput.value = event.title || '';
  
  if (timeInput) {
    const start = event.start;
    const end = event.end || new Date(start.getTime() + 60 * 60 * 1000);
    
    const timeFormatter = new Intl.DateTimeFormat('ko', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const startTime = timeFormatter.format(start);
    const endTime = timeFormatter.format(end);
    timeInput.value = `${startTime} - ${endTime}`;
  }
  
  if (memoInput) {
    memoInput.value = event.extendedProps?.notes || '';
  }
}

// ✅ 이벤트 편집 저장 함수 (새로 추가)
async function saveEventEdit() {
  const titleInput = document.getElementById('edit-title');
  const timeInput = document.getElementById('edit-time');
  const memoInput = document.getElementById('edit-memo');
  
  const newTitle = titleInput?.value || currentEvent.title;
  const timeValue = timeInput?.value || '';
  const newMemo = memoInput?.value || '';
  
  // 시간 파싱 (예: "10:00 - 12:00" 형식)
  let newStart = currentEvent.start;
  let newEnd = currentEvent.end;
  
  if (timeValue.includes(' - ')) {
    const [startTimeStr, endTimeStr] = timeValue.split(' - ');
    const eventDate = new Date(currentEvent.start);
    
    // 시작 시간 설정
    const [startHour, startMinute] = startTimeStr.split(':').map(Number);
    newStart = new Date(eventDate);
    newStart.setHours(startHour, startMinute, 0, 0);
    
    // 종료 시간 설정
    const [endHour, endMinute] = endTimeStr.split(':').map(Number);
    newEnd = new Date(eventDate);
    newEnd.setHours(endHour, endMinute, 0, 0);
  }
  
  try {
    // ✅ 캘린더 이벤트 업데이트
    currentEvent.setProp('title', newTitle);
    currentEvent.setStart(newStart);
    currentEvent.setEnd(newEnd);
    currentEvent.setExtendedProp('notes', newMemo);
    
    // ✅ 서버에 업데이트 전송
    await updateEventOnServer(currentEvent);
    
    // ✅ 모달 닫기 및 성공 메시지
    if (window.hideModal) window.hideModal('editSchedule');
    if (window.showToast) window.showToast('성공', '일정이 수정되었습니다!', 'success');
    
  } catch (error) {
    console.error('❌ 이벤트 수정 오류:', error);
    if (window.showToast) window.showToast('오류', '일정 수정 중 오류가 발생했습니다.', 'error');
  }
}

// 새 이벤트 추가 함수
export function addEvent(eventData) {
  if (!calendar) {
    console.warn('⚠️ 캘린더가 초기화되지 않음, 초기화 시도...');
    initCalendar();
    if (!calendar) return null;
  }
  
  const newEvent = {
    id: eventData.id || `event-${Date.now()}`,
    title: eventData.title,
    start: eventData.start,
    end: eventData.end,
    backgroundColor: eventData.color || '#4361ee',
    borderColor: eventData.color || '#4361ee',
    extendedProps: {
      subject: eventData.subject || '',
      notes: eventData.notes || '',
      completed: false
    }
  };
  
  const calendarEvent = calendar.addEvent(newEvent);
  
  // 서버에 저장 요청
  saveEventToServer(newEvent);
  
  return calendarEvent;
}

// 서버 API 함수들
async function saveEventToServer(event) {
  try {
    const response = await fetch('/api/calendar/events', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    
    if (!response.ok) throw new Error('Failed to save event');
    
    const result = await response.json();
    console.log('✅ 이벤트 저장 완료:', result);
    return result;
  } catch (error) {
    console.error('❌ 이벤트 저장 오류:', error);
  }
}

async function updateEventOnServer(event) {
  try {
    const response = await fetch(`/api/calendar/events/${event.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        extendedProps: event.extendedProps
      })
    });
    
    if (!response.ok) throw new Error('Failed to update event');
    
    const result = await response.json();
    console.log('✅ 이벤트 업데이트 완료:', result);
    return result;
  } catch (error) {
    console.error('❌ 이벤트 업데이트 오류:', error);
  }
}

async function deleteEventOnServer(eventId) {
  try {
    const response = await fetch(`/api/calendar/events/${eventId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to delete event');
    
    console.log('✅ 이벤트 삭제 완료');
  } catch (error) {
    console.error('❌ 이벤트 삭제 오류:', error);
  }
}

// 캘린더 새로고침
export function refreshCalendar() {
  if (calendar) {
    loadCalendarEvents();
  }
}

// 캘린더 파괴
export function destroyCalendar() {
  if (calendar) {
    calendar.destroy();
    calendar = null;
  }
}

// 일정 데이터 가져오기
export function getEvents(startDate, endDate) {
  if (!calendar) return [];
  
  if (!startDate || !endDate) {
    return calendar.getEvents();
  }
  
  return calendar.getEvents().filter(event => {
    const eventStart = event.start;
    const eventEnd = event.end || eventStart;
    
    return (
      (eventStart >= startDate && eventStart <= endDate) ||
      (eventEnd >= startDate && eventEnd <= endDate) ||
      (eventStart <= startDate && eventEnd >= endDate)
    );
  });
}

// 날짜에 해당하는 이벤트 가져오기
export function getEventsForDate(date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  return getEvents(targetDate, nextDay);
}

// 모듈을 전역 객체에 할당
window.calendarModule = {
  initCalendar,
  addEvent,
  getEvents,
  getEventsForDate,
  refreshCalendar,
  destroyCalendar
};

console.log('📅 Calendar module loaded');

// 저장 버튼 핸들러
// 저장 버튼 핸들러
// 기존 setupSaveButtonHandler 함수를 찾아서 이렇게 수정
function setupSaveButtonHandler() {
  const saveButton = document.getElementById('save-calendar-events');
  if (!saveButton) {
    console.warn('⛔ 저장 버튼을 찾을 수 없습니다.');
    return;
  }

  // 기존 이벤트 리스너 제거
  saveButton.removeEventListener('click', saveButton._clickHandler);
  
  saveButton._clickHandler = async () => {
    try {
      const events = calendar.getEvents();
      let savedCount = 0;
      
      for (const event of events) {
        const payload = {
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          extendedProps: event.extendedProps
        };

        const res = await fetch(`/api/calendar/events/${event.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) savedCount++;
      }

      // 한 번만 토스트 표시
      if (savedCount > 0) {
        showToast('성공', `${savedCount}개의 일정이 저장되었습니다.`, 'success');
      }
      
    } catch (error) {
      console.error('❌ 저장 실패:', error);
      showToast('오류', '저장 중 오류가 발생했습니다.', 'error');
    }
  };
  
  saveButton.addEventListener('click', saveButton._clickHandler);
}

