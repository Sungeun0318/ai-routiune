// 유틸리티 함수들

// 날짜 포맷팅
export function formatDate(date, format = 'YYYY-MM-DD') {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    format = format.replace('YYYY', year);
    format = format.replace('MM', month);
    format = format.replace('DD', day);
    format = format.replace('HH', hours);
    format = format.replace('mm', minutes);
    format = format.replace('ss', seconds);
    
    return format;
  }
  
  // 한국어 날짜 포맷
  export function formatKoreanDate(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekDay = weekDays[date.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${weekDay})`;
  }
  
  // 시간 포맷팅
  export function formatTime(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  }
  
  // 시간 간격 계산 (분 단위)
  export function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) {
      return 0;
    }
    
    // "HH:MM" 형식의 시간을 분으로 변환
    function timeToMinutes(time) {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    }
    
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    
    return end - start;
  }
  
  // 시간 충돌 확인
  export function isTimeConflict(startTime1, endTime1, startTime2, endTime2) {
    const start1 = timeToMinutes(startTime1);
    const end1 = timeToMinutes(endTime1);
    const start2 = timeToMinutes(startTime2);
    const end2 = timeToMinutes(endTime2);
    
    return (start1 < end2 && end1 > start2);
  }
  
  // 문자열을 분 단위로 변환
  function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  // 분을 시간:분 형식으로 변환
  export function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  
  // 랜덤 ID 생성
  export function generateId(prefix = '') {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 객체 깊은 복사
  export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  
  // 쿠키 관리
  export function setCookie(name, value, days = 7) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  }
  
  export function getCookie(name) {
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(name + '=') === 0) {
        return cookie.substring(name.length + 1);
      }
    }
    
    return '';
  }
  
  export function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
  
  // 로컬 스토리지 관리
  export function saveToStorage(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }
  
  export function getFromStorage(key, defaultValue = null) {
    try {
      const serializedValue = localStorage.getItem(key);
      if (serializedValue === null) {
        return defaultValue;
      }
      return JSON.parse(serializedValue);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }
  
  export function removeFromStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }
  
  // 폼 유효성 검사
  export function validateForm(formData, rules) {
    const errors = {};
    
    for (const field in rules) {
      if (!rules.hasOwnProperty(field)) continue;
      
      const value = formData[field];
      const fieldRules = rules[field];
      
      // 필수 입력 검사
      if (fieldRules.required && (!value || value.trim() === '')) {
        errors[field] = `${fieldRules.label || field}은(는) 필수 입력 항목입니다.`;
        continue;
      }
      
      // 값이 없고 필수도 아니면 다음 필드로
      if (!value && !fieldRules.required) continue;
      
      // 최소 길이 검사
      if (fieldRules.minLength && value.length < fieldRules.minLength) {
        errors[field] = `${fieldRules.label || field}은(는) 최소 ${fieldRules.minLength}자 이상이어야 합니다.`;
        continue;
      }
      
      // 최대 길이 검사
      if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
        errors[field] = `${fieldRules.label || field}은(는) 최대 ${fieldRules.maxLength}자 이하여야 합니다.`;
        continue;
      }
      
      // 패턴 검사
      if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
        errors[field] = fieldRules.message || `${fieldRules.label || field} 형식이 올바르지 않습니다.`;
        continue;
      }
      
      // 일치 검사 (비밀번호 확인 등)
      if (fieldRules.match && value !== formData[fieldRules.match]) {
        errors[field] = `${fieldRules.label || field}이(가) 일치하지 않습니다.`;
        continue;
      }
      
      // 커스텀 검증 함수
      if (fieldRules.validate && typeof fieldRules.validate === 'function') {
        const validateResult = fieldRules.validate(value, formData);
        if (validateResult !== true) {
          errors[field] = validateResult;
          continue;
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
  
  // 모듈 테스트를 위한 더미 데이터 생성 함수들
  export function generateMockRoutine() {
    // 현재 날짜 가져오기
    const now = new Date();
    const startDateStr = formatDate(now, 'YYYY-MM-DD');
    const duration = 7; // 일주일
    
    return `AI가 생성한 학습 루틴:
  
  이 학습 계획은 ${duration}일 동안의 일정입니다.
  시작일: ${startDateStr}
  
  ## 과목별 시간 배분
  - 수학: 일 2시간, 우선순위 높음
  - 영어: 일 1.5시간, 우선순위 중간
  - 프로그래밍: 일 3시간, 우선순위 높음
  
  ## 전체 루틴 요약
  1. 아침 시간대 (05:00-09:00): 집중력이 필요한 과목
  2. 오전 시간대 (09:00-12:00): 기초 개념 학습
  3. 오후 시간대 (12:00-18:00): 실습 및 응용
  4. 저녁 시간대 (18:00-22:00): 복습 및 문제 풀이
  5. 밤 시간대 (22:00-02:00): 가벼운 학습 및 정리
  
  자세한 일정은 일별 보기에서 확인하실 수 있습니다.`;
  }
  
  export function generateMockDailyRoutines() {
    const startDate = new Date();
    const duration = 7; // 일주일
    const dailyRoutines = [];
    
    for (let day = 0; day < duration; day++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + day);
      
      const formattedDate = formatKoreanDate(date);
      
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
  
  export function generateDaySchedules(day) {
    const schedules = [];
    const subjects = ['수학', '영어', '프로그래밍'];
    
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
      
      // 과목 선택
      const subjectIndex = (index + day) % subjects.length;
      const subject = subjects[subjectIndex];
      
      // 과목별 서로 다른 활동 생성
      const activities = {
        '수학': ['개념 학습', '기본 문제 풀이', '심화 문제 풀이', '오답 노트 정리', '모의고사 풀이'],
        '영어': ['단어 암기', '문법 학습', '독해 연습', '듣기 연습', '말하기 연습'],
        '프로그래밍': ['기본 문법 학습', '알고리즘 문제 풀이', '프로젝트 작업', '코드 리뷰', '디버깅 연습']
      };
      
      // 기본 활동
      let activity = '학습';
      
      // 과목별 활동이 있는 경우
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