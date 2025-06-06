// ❌ import 하지 말고
// ✅ 이렇게 사용
const Calendar = FullCalendar.Calendar;
const dayGridPlugin = FullCalendar.dayGridPlugin;
const timeGridPlugin = FullCalendar.timeGridPlugin;
const interactionPlugin = FullCalendar.interactionPlugin;
const listPlugin = FullCalendar.listPlugin;




// 전역 변수
let calendar;
let currentEvent = null;

// 캘린더 초기화
export function initCalendar() {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) {
    console.error('Calendar element not found');
    return null;
  }
  
  // 기존 캘린더가 있으면 제거
  if (calendar) {
    calendar.destroy();
  }
  
  // FullCalendar v6 문법으로 초기화
const calendarInstance = new Calendar(calendarEl, {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
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
      console.log('Event Clicked:', info.event); // ← 확인용
  if (info.event) {
    showEventDetails(info.event);
  } else {
    console.warn('클릭한 이벤트 정보가 없습니다.');
  }
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
      showToast('성공', '일정이 변경되었습니다.', 'success');
      updateEventOnServer(info.event);
    },
    
    // 이벤트 크기 조정 처리
    eventResize: function(info) {
      showToast('성공', '일정이 변경되었습니다.', 'success');
      updateEventOnServer(info.event);
    },
    
    // 날짜 클릭 처리 (새 이벤트 추가)
    dateClick: function(info) {
      // 새 이벤트 추가 로직 (향후 구현)
      console.log('Date clicked:', info.dateStr);
    },
    
    // 이벤트 렌더링 후 처리
eventDidMount: function(info) {
  try {
    const name = info.event.title; // ✅ 그냥 title만 써
    console.log('✅ 이벤트 이름:', name);
  } catch (e) {
    console.error('❌ eventDidMount 오류:', e);
  }

  if (info.event.extendedProps?.completed) {
    info.el.style.opacity = '0.6';
    info.el.style.textDecoration = 'line-through';
  }
}

  });
  
  try {
    calendarInstance.render(); // ✅ 이 줄 바로 아래에 넣는다!

  calendar = calendarInstance; // 전역 변수 calendar에 할당
  window.calendar = calendarInstance; // 다른 JS에서 접근 가능하게
    console.log('Calendar rendered successfully');
    
    // 캘린더 이벤트 로드
    loadCalendarEvents();
    
    // 이벤트 핸들러 초기화
    initEventHandlers();
    
    // 캘린더 객체를 전역으로 노출
    
    
    return calendar;
  } catch (error) {
    console.error('Calendar initialization error:', error);
    showToast('오류', '캘린더 초기화 중 오류가 발생했습니다.', 'error');
    return null;
  }
}

async function loadCalendarEvents() {
  try {
    console.log('📥 loadCalendarEvents 호출됨');

    const events = generateMockCalendarEvents();

    console.log('📦 Generated mock events:', events);

    events.forEach(event => {
      if (!event.extendedProps) event.extendedProps = {};
      calendar.addEvent(event);
    });

    console.log(`✅ Loaded ${events.length} calendar events`);
  } catch (error) {
    console.error('❗ Failed to load calendar events:', error);
  }
}



// 이벤트 상세 정보 표시
function showEventDetails(event) {
  if (!event || !event.title) {
    console.error('이벤트 정보가 유효하지 않습니다:', event);
    return;
  }

  const titleEl = document.getElementById('event-title');
  if (titleEl) {
    titleEl.textContent = event.title;
  }

  currentEvent = event;
  
  document.getElementById('event-title').textContent = event.title;
  
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
  
  document.getElementById('event-time').textContent = `시간: ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
  document.getElementById('event-date').textContent = `날짜: ${dateFormatter.format(start)}`;
  
  const subject = event.extendedProps?.subject || '';
  document.getElementById('event-subject').textContent = `과목: ${subject || event.title}`;
  
  const notes = event.extendedProps?.notes || '';
  document.getElementById('event-notes').textContent = notes || '메모 없음';
  
  // 완료 상태에 따라 버튼 상태 변경
  const completeBtn = document.getElementById('complete-event');
  if (event.extendedProps?.completed) {
    completeBtn.textContent = '완료 취소';
    completeBtn.classList.remove('btn-primary');
    completeBtn.classList.add('btn-secondary');
  } else {
    completeBtn.textContent = '완료';
    completeBtn.classList.remove('btn-secondary');
    completeBtn.classList.add('btn-primary');
  }
  
  showModal('eventDetail');
}

// 이벤트 핸들러 초기화
function initEventHandlers() {
  // 이벤트 삭제 버튼
  const deleteBtn = document.getElementById('delete-event');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (currentEvent) {
        if (confirm('이 일정을 삭제하시겠습니까?')) {
          currentEvent.remove();
          hideModal('eventDetail');
          showToast('성공', '일정이 삭제되었습니다.', 'success');
          deleteEventOnServer(currentEvent.id);
        }
      }
    });
  }
  
  // 이벤트 편집 버튼
  const editBtn = document.getElementById('edit-event');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      if (currentEvent) {
        hideModal('eventDetail');
        showToast('준비 중', '일정 편집 기능은 준비 중입니다.', 'info');
      }
    });
  }
  
  // 이벤트 완료 버튼
  const completeBtn = document.getElementById('complete-event');
  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      if (currentEvent) {
        const isCompleted = !!currentEvent.extendedProps?.completed;
        
        // 상태 변경
        currentEvent.setExtendedProp('completed', !isCompleted);
        
        // 색상 변경
        if (!isCompleted) {
          currentEvent.setProp('backgroundColor', '#10b981');
          currentEvent.setProp('borderColor', '#10b981');
          showToast('성공', '일정이 완료되었습니다.', 'success');
        } else {
          // 원래 색상으로 되돌리기
          const originalColor = getSubjectColor(currentEvent.extendedProps?.subject || '');
          currentEvent.setProp('backgroundColor', originalColor);
          currentEvent.setProp('borderColor', originalColor);
          showToast('정보', '일정 완료가 취소되었습니다.', 'info');
        }
        
        hideModal('eventDetail');
        updateEventOnServer(currentEvent);
      }
    });
  }
}

function generateMockCalendarEvents() {
  const events = [
    {
      id: 'test-1',
      title: '테스트 이벤트',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      backgroundColor: '#f00',
      borderColor: '#f00',
      extendedProps: {
        subject: '과목 없음',
        notes: '설명 없음',
        completed: false
      }
    }
  ];

  console.log('📦 [DEBUG] 이벤트 객체:', events[0]); // ✅ 이제 이거 실행됨
  return events;
}


// 과목별 색상 가져오기
function getSubjectColor(subject) {
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
  
  return subjectColors[subject] || '#4361ee';
}

// 새 이벤트 추가 함수
export function addEvent(eventData) {
  if (!calendar) {
    console.warn('Calendar not initialized, initializing now...');
    initCalendar();
  }
  
  const newEvent = {
    id: eventData.id || `event-${Date.now()}`,
    title: eventData.title,
    start: eventData.start,
    end: eventData.end,
    backgroundColor: eventData.color || getSubjectColor(eventData.subject || ''),
    borderColor: eventData.color || getSubjectColor(eventData.subject || ''),
    extendedProps: {
      name: eventData.title, // ✅ 여기도 넣기!
      subject: eventData.subject || '',
      notes: eventData.notes || '',
      completed: false
    }
  };
  
  // 🔽 여기 고쳐야 함!
  const calendarEvent = calendar.addEvent(newEvent);

  
  // 서버에 저장 요청
  saveEventToServer(newEvent);
  
  return calendarEvent;
}

// 일정 데이터 가져오기
export function getEvents(startDate, endDate) {
  if (!calendar) {
    console.warn('Calendar not initialized');
    return [];
  }
  
  // 날짜 범위가 지정되지 않은 경우 모든 일정 반환
  if (!startDate || !endDate) {
    return calendar.getEvents();
  }
  
  // 날짜 범위에 해당하는 일정만 필터링
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

// 이벤트를 서버에 저장
async function saveEventToServer(event) {
  try {
    const response = await fetch('/api/calendar-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(event)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save event');
    }
    
    const result = await response.json();
    console.log('Event saved successfully:', result);
    return result;
  } catch (error) {
    console.error('Error saving event to server:', error);
    // showToast('오류', '일정을 저장하는 중 오류가 발생했습니다.', 'error');
  }
}

// 이벤트를 서버에서 업데이트
async function updateEventOnServer(event) {
  try {
    const response = await fetch(`/api/calendar-events/${event.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        extendedProps: event.extendedProps
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update event');
    }
    
    const result = await response.json();
    console.log('Event updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Error updating event on server:', error);
    // showToast('오류', '일정을 업데이트하는 중 오류가 발생했습니다.', 'error');
  }
}

// 이벤트를 서버에서 삭제
async function deleteEventOnServer(eventId) {
  try {
    const response = await fetch(`/api/calendar-events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete event');
    }
    
    console.log('Event deleted successfully');
  } catch (error) {
    console.error('Error deleting event on server:', error);
    // showToast('오류', '일정을 삭제하는 중 오류가 발생했습니다.', 'error');
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

// 모듈을 전역 객체에 할당 (다른 스크립트에서 접근 가능하도록)
window.calendarModule = {
  initCalendar,
  addEvent,
  getEvents,
  getEventsForDate,
  refreshCalendar,
  destroyCalendar
};


