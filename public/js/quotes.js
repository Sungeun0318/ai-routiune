// quotes.js
export const quotes = [
  "지금 하지 않으면 나중도 없다.",
  "천 리 길도 한 걸음부터.",
  "시작이 반이다.",
  "노력은 배신하지 않는다.",
  "작은 성취가 큰 성공을 만든다.",
];


export function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
