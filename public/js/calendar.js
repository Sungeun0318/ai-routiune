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
calendar = new Calendar(calendarEl, {
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
      // 완료된 이벤트 스타일 변경
      if (info.event.extendedProps.completed) {
        info.el.style.opacity = '0.6';
        info.el.style.textDecoration = 'line-through';
      }
    }
  });
  
  try {
    calendar.render();
    console.log('Calendar rendered successfully');
    
    // 캘린더 이벤트 로드
    loadCalendarEvents();
    
    // 이벤트 핸들러 초기화
    initEventHandlers();
    
    // 캘린더 객체를 전역으로 노출
    window.calendar = calendar;
    
    return calendar;
  } catch (error) {
    console.error('Calendar initialization error:', error);
    showToast('오류', '캘린더 초기화 중 오류가 발생했습니다.', 'error');
    return null;
  }
}

// 캘린더 이벤트 로드
async function loadCalendarEvents() {
  try {
    // 서버에서 이벤트 로드 (실제 구현 시 추가)
    // const response = await fetch('/api/calendar-events', {
    //   headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    // });
    // const events = await response.json();
    
    // 테스트용 더미 데이터
    const events = generateMockCalendarEvents();
    
    // 이벤트 추가
    events.forEach(event => {
      calendar.addEvent(event);
    });
    
    console.log(`Loaded ${events.length} calendar events`);
  } catch (error) {
    console.error('Failed to load calendar events:', error);
    showToast('오류', '캘린더 일정을 불러오는 중 오류가 발생했습니다.', 'error');
  }
}

// 이벤트 상세 정보 표시
function showEventDetails(event) {
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

// 모의 캘린더 이벤트 생성
function generateMockCalendarEvents() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const events = [];
  const subjects = ['수학', '영어', '프로그래밍', '과학', '국어', '사회'];
  const activities = ['학습', '문제 풀이', '복습', '테스트', '프로젝트'];
  
  // 과목별 색상
  const subjectColors = {
    '수학': '#4361ee',
    '영어': '#3a0ca3',
    '국어': '#7209b7',
    '과학': '#4cc9f0',
    '사회': '#f72585',
    '프로그래밍': '#4f772d'
  };
  
  // 15개의 이벤트 생성 (더 많은 데이터로 테스트)
  for (let i = 0; i < 15; i++) {
    const eventDate = new Date(
      startOfMonth.getTime() + 
      Math.random() * (endOfMonth.getTime() - startOfMonth.getTime())
    );
    
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const activity = activities[Math.floor(Math.random() * activities.length)];
    
    const startHour = 9 + Math.floor(Math.random() * 10); // 9AM - 7PM
    eventDate.setHours(startHour, 0, 0, 0);
    
    const durationHours = 1 + Math.floor(Math.random() * 3); // 1-3 hours
    const endDate = new Date(eventDate);
    endDate.setHours(startHour + durationHours, 0, 0, 0);
    
    const color = subjectColors[subject] || '#4361ee';
    
    events.push({
      id: `mock-event-${i}`,
      title: `${subject} - ${activity}`,
      start: eventDate.toISOString(),
      end: endDate.toISOString(),
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        subject: subject,
        notes: `${subject} ${activity} 일정입니다.`,
        completed: Math.random() > 0.7 // 약 30% 확률로 완료 상태
      }
    });
  }
  
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