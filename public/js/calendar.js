// calendar.js - 캘린더 모듈 (직접 편집 기능 포함)

// 전역 변수
let calendar;
let currentEvent = null;

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
      
      // ✅ 이벤트 드래그 처리 (자동 저장)
      eventDrop: async function(info) {
        try {
          const response = await fetch(`/api/calendar/events/${info.event.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
              title: info.event.title,
              start: info.event.start.toISOString(),
              end: info.event.end ? info.event.end.toISOString() : null,
              extendedProps: info.event.extendedProps
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to update event');
          }
          
          if (window.showToast) {
            window.showToast('성공', '일정이 변경되었습니다.', 'success');
          }
          console.log('✅ 이벤트 드래그 변경 저장됨');
          
        } catch (error) {
          console.error('❌ 이벤트 업데이트 오류:', error);
          if (window.showToast) {
            window.showToast('오류', '일정 변경 저장 중 오류가 발생했습니다.', 'error');
          }
          
          // 실패 시 원래 위치로 복원
          info.revert();
        }
      },
      
      // ✅ 이벤트 크기 조정 처리 (자동 저장)
      eventResize: async function(info) {
        try {
          const response = await fetch(`/api/calendar/events/${info.event.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
              title: info.event.title,
              start: info.event.start.toISOString(),
              end: info.event.end ? info.event.end.toISOString() : null,
              extendedProps: info.event.extendedProps
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to update event');
          }
          
          if (window.showToast) {
            window.showToast('성공', '일정 시간이 변경되었습니다.', 'success');
          }
          console.log('✅ 이벤트 크기 변경 저장됨');
          
        } catch (error) {
          console.error('❌ 이벤트 업데이트 오류:', error);
          if (window.showToast) {
            window.showToast('오류', '일정 변경 저장 중 오류가 발생했습니다.', 'error');
          }
          
          // 실패 시 원래 크기로 복원
          info.revert();
        }
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
    
    // ✅ 저장 버튼 핸들러 설정
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
  
  // 이벤트 편집 버튼
  const editBtn = document.getElementById('edit-event');
  if (editBtn) {
    editBtn.onclick = () => {
      if (currentEvent) {
        if (window.hideModal) window.hideModal('eventDetail');
        // 편집 기능은 드래그 앤 드롭으로 대체
        if (window.showToast) window.showToast('정보', '이벤트를 드래그해서 시간을 변경하거나 모서리를 드래그해서 지속시간을 조정하세요.', 'info');
      }
    };
  }
  
  // ✅ 이벤트 완료 버튼 (서버에 저장)
  const completeBtn = document.getElementById('complete-event');
  if (completeBtn) {
    completeBtn.onclick = async () => {
      if (currentEvent) {
        const isCompleted = !!currentEvent.extendedProps?.completed;
        
        try {
          // 서버에 완료 상태 변경 요청
          const response = await fetch(`/api/calendar/events/${currentEvent.id}/complete`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAuthToken()}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to toggle completion');
          }
          
          const result = await response.json();
          
          // 상태 변경
          currentEvent.setExtendedProp('completed', result.completed);
          
          // 색상 변경
          if (result.completed) {
            currentEvent.setProp('backgroundColor', '#10b981');
            currentEvent.setProp('borderColor', '#10b981');
            if (window.showToast) window.showToast('성공', '일정이 완료되었습니다.', 'success');
          } else {
            currentEvent.setProp('backgroundColor', '#4361ee');
            currentEvent.setProp('borderColor', '#4361ee');
            if (window.showToast) window.showToast('정보', '일정 완료가 취소되었습니다.', 'info');
          }
          
          if (window.hideModal) window.hideModal('eventDetail');
          
        } catch (error) {
          console.error('❌ 완료 상태 변경 오류:', error);
          if (window.showToast) {
            window.showToast('오류', '완료 상태 변경 중 오류가 발생했습니다.', 'error');
          }
        }
      }
    };
  }
  
  console.log('✅ 이벤트 핸들러 초기화 완료');
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

// ✅ 저장 버튼 핸들러 설정
function setupSaveButtonHandler() {
  const saveButton = document.getElementById('save-calendar-events');
  if (!saveButton) {
    console.warn('⚠️ 캘린더 저장 버튼을 찾을 수 없습니다');
    return;
  }

  saveButton.addEventListener('click', async () => {
    try {
      if (!window.calendar) {
        if (window.showToast) {
          window.showToast('오류', '캘린더가 초기화되지 않았습니다', 'error');
        }
        return;
      }

      const events = window.calendar.getEvents();
      let savedCount = 0;
      
      for (const event of events) {
        try {
          const payload = {
            id: event.id,
            title: event.title,
            start: event.start?.toISOString(),
            end: event.end?.toISOString(),
            extendedProps: event.extendedProps || {}
          };

          const response = await fetch(`/api/calendar/events/${event.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            savedCount++;
          }
        } catch (error) {
          console.error('❌ 개별 이벤트 저장 실패:', event.id, error);
        }
      }

      if (window.showToast) {
        if (savedCount > 0) {
          window.showToast('성공', `${savedCount}개의 일정이 저장되었습니다`, 'success');
        } else {
          window.showToast('정보', '저장할 일정이 없습니다', 'info');
        }
      }
      
    } catch (error) {
      console.error('❌ 전체 저장 실패:', error);
      if (window.showToast) {
        window.showToast('오류', '일정 저장 중 오류가 발생했습니다', 'error');
      }
    }
  });
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

// ✅ auth 토큰 가져오기 함수 (없을 경우 대비)
function getAuthToken() {
  if (typeof window.getAuthToken === 'function') {
    return window.getAuthToken();
  }
  // 세션 기반이므로 토큰이 없어도 됨
  return '';
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

console.log('📅 Calendar module loaded with direct editing features');
console.log('✅ 캘린더 직접 편집 기능:');
console.log('   - 드래그 앤 드롭으로 시간 변경');
console.log('   - 모서리 드래그로 지속시간 조정');
console.log('   - 완료 버튼으로 상태 토글');
console.log('   - 모든 변경사항 자동 저장');