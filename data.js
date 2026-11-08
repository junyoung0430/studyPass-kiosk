// =====================================================
// data.js - 스터디카페 기본 데이터 (모두 가상 데이터)
// 실제 서비스라면 서버(DB)에서 받아 오는 부분입니다.
// =====================================================

// 이용권 종류
const TICKETS = [
  { id: "T2", name: "2시간권", hours: 2, price: 3000 },
  { id: "T4", name: "4시간권", hours: 4, price: 5000 },
  { id: "T6", name: "6시간권", hours: 6, price: 7000 },
  { id: "T12", name: "종일권 (12시간)", hours: 12, price: 10000 },
];

// 좌석 구역
const ZONES = [
  { id: "open", name: "오픈석", from: 1, to: 12 },
  { id: "booth", name: "칸막이석", from: 13, to: 20 },
  { id: "laptop", name: "노트북석", from: 21, to: 24 },
];

// 좌석 번호로 구역 이름 찾기
function getZoneName(seatNo) {
  const zone = ZONES.find(function (z) {
    return seatNo >= z.from && seatNo <= z.to;
  });
  return zone ? zone.name : "";
}

// 지금 시각에서 minutes분 뒤의 시각 만들기
function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

// 이미 이용 중인 사람들 (처음 화면에 '사용 중' 좌석으로 보입니다)
// phone: 휴대폰 번호, seat: 좌석 번호, ticketId: 이용권, endTime: 이용 종료 시각
const activeSessions = [
  { phone: "01012345678", seat: 2, ticketId: "T4", startTime: minutesFromNow(-90), endTime: minutesFromNow(150) },
  { phone: "01023456789", seat: 5, ticketId: "T12", startTime: minutesFromNow(-200), endTime: minutesFromNow(520) },
  { phone: "01034567890", seat: 9, ticketId: "T2", startTime: minutesFromNow(-100), endTime: minutesFromNow(20) },
  { phone: "01045678901", seat: 14, ticketId: "T6", startTime: minutesFromNow(-60), endTime: minutesFromNow(300) },
  { phone: "01056789012", seat: 15, ticketId: "T4", startTime: minutesFromNow(-30), endTime: minutesFromNow(210) },
  { phone: "01067890123", seat: 18, ticketId: "T12", startTime: minutesFromNow(-240), endTime: minutesFromNow(480) },
  { phone: "01078901234", seat: 22, ticketId: "T6", startTime: minutesFromNow(-150), endTime: minutesFromNow(210) },
];

// 오늘의 이용 기록 (관리자 화면에 보입니다)
// type: "입실" 또는 "퇴실", price: 결제 금액 (퇴실은 0)
const usageLogs = [
  { time: minutesFromNow(-240), phone: "01067890123", seat: 18, ticketId: "T12", type: "입실", price: 10000 },
  { time: minutesFromNow(-200), phone: "01023456789", seat: 5, ticketId: "T12", type: "입실", price: 10000 },
  { time: minutesFromNow(-180), phone: "01090123456", seat: 7, ticketId: "T2", type: "입실", price: 3000 },
  { time: minutesFromNow(-150), phone: "01078901234", seat: 22, ticketId: "T6", type: "입실", price: 7000 },
  { time: minutesFromNow(-100), phone: "01034567890", seat: 9, ticketId: "T2", type: "입실", price: 3000 },
  { time: minutesFromNow(-90), phone: "01012345678", seat: 2, ticketId: "T4", type: "입실", price: 5000 },
  { time: minutesFromNow(-70), phone: "01090123456", seat: 7, ticketId: "T2", type: "퇴실", price: 0 },
  { time: minutesFromNow(-60), phone: "01045678901", seat: 14, ticketId: "T6", type: "입실", price: 7000 },
  { time: minutesFromNow(-30), phone: "01056789012", seat: 15, ticketId: "T4", type: "입실", price: 5000 },
];
