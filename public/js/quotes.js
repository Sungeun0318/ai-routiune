// quotes.js
export const quotes = [
  "성공은 준비된 자에게 기회가 왔을 때 만들어진다.",
  "꿈을 이루는 것은 어렵지 않다. 꿈을 꾸는 것이 어려울 뿐이다.",
  "배움에는 끝이 없다.",
  "오늘 하지 않으면 내일은 더 바쁘다.",
  "작은 진전이라도 진전은 진전이다.",
  "실패는 성공의 어머니다.",
  "노력은 결코 배신하지 않는다."
];


export function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
