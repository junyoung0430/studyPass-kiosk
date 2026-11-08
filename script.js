// =====================================================
// script.js - 키오스크 동작과 관리자 화면
// =====================================================

const TOTAL_SEATS = 24;
const IDLE_LIMIT = 60; // 아무 입력이 없으면 60초 뒤 처음 화면으로

// 지금 진행 중인 주문(손님 한 명의 입력 내용)
let order = {
  mode: "enter", // "enter" 입실 / "exit" 퇴실
  phone: "",     // 010 뒤 8자리
  ticketId: null,
  seat: null,
};

let idleTimer = null;      // 자동 처음 화면 타이머
let countdownTimer = null; // 완료 화면 카운트다운 타이머

// -----------------------------------------------------
// 공통 도우미 함수
// -----------------------------------------------------
function $(id) {
  return document.getElementById(id);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// 시각을 "14:05" 형태로
function formatTime(date) {
  return pad(date.getHours()) + ":" + pad(date.getMinutes());
}

// 종료 시각이 다음 날이면 앞에 "내일"을 붙이기 (예: 밤 10시에 4시간권 → 내일 02:00)
function formatEndTime(end) {
  const today = new Date();
  const isTomorrow = end.getDate() !== today.getDate();
  return (isTomorrow ? "내일 " : "") + formatTime(end);
}

// 금액을 "5,000원" 형태로
function formatPrice(price) {
  return price.toLocaleString("ko-KR") + "원";
}

// 휴대폰 번호 가운데를 가려서 "010-****-5678" 형태로 (개인정보 보호)
function maskPhone(phone) {
  return "010-****-" + phone.slice(7);
}

// 분을 "2시간 10분" 형태로
function minutesToText(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return m + "분";
  if (m === 0) return h + "시간";
  return h + "시간 " + m + "분";
}

function findTicket(ticketId) {
  return TICKETS.find(function (t) {
    return t.id === ticketId;
  });
}

// 전화번호로 이용 중인 기록 찾기
function findSessionByPhone(phone) {
  return activeSessions.find(function (s) {
    return s.phone === phone;
  });
}

// 좌석 번호로 이용 중인 기록 찾기
function findSessionBySeat(seatNo) {
  return activeSessions.find(function (s) {
    return s.seat === seatNo;
  });
}

// 4자리 출입 인증번호 만들기
function makePin() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

// summary(dl) 목록 만들기: [["좌석", "3번"], ...]
function fillSummary(element, rows) {
  element.innerHTML = rows
    .map(function (row) {
      const cls = row[2] ? ' class="' + row[2] + '"' : "";
      return "<dt>" + row[0] + "</dt><dd" + cls + ">" + row[1] + "</dd>";
    })
    .join("");
}

// -----------------------------------------------------
// 화면 전환
// -----------------------------------------------------
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(function (screen) {
    screen.classList.toggle("active", screen.id === "screen-" + name);
  });

  clearInterval(countdownTimer);

  if (name === "home") {
    resetOrder();
    renderHome();
  }
  resetIdleTimer(name);
}

function resetOrder() {
  order = { mode: "enter", phone: "", ticketId: null, seat: null };
}

// 일정 시간 아무것도 누르지 않으면 처음 화면으로 돌아가기
// (다음 손님이 앞사람의 정보를 보지 못하게 하기 위함)
function resetIdleTimer(currentScreen) {
  clearTimeout(idleTimer);
  if (currentScreen === "home") return;
  idleTimer = setTimeout(function () {
    showScreen("home");
  }, IDLE_LIMIT * 1000);
}

// 몇 초 뒤 처음 화면으로 돌아가는 카운트다운
function startCountdown(elementId, seconds) {
  let left = seconds;
  $(elementId).textContent = left;
  countdownTimer = setInterval(function () {
    left--;
    $(elementId).textContent = left;
    if (left <= 0) {
      showScreen("home");
    }
  }, 1000);
}

// -----------------------------------------------------
// 1. 처음 화면
// -----------------------------------------------------
function renderHome() {
  $("home-seat-left").textContent = TOTAL_SEATS - activeSessions.length;
  $("home-seat-total").textContent = TOTAL_SEATS;
}

function updateClock() {
  const now = new Date();
  $("clock").textContent =
    now.getMonth() + 1 + "월 " + now.getDate() + "일 " + formatTime(now);
}

// -----------------------------------------------------
// 2. 휴대폰 번호 입력
// -----------------------------------------------------
function startPhone(mode) {
  order.mode = mode;
  order.phone = "";
  $("phone-title").textContent =
    mode === "enter" ? "휴대폰 번호를 입력해 주세요" : "입실할 때 입력한 번호를 눌러 주세요";
  $("phone-error").textContent = "";
  renderPhone();
  showScreen("phone");
}

function renderPhone() {
  const digits = order.phone.padEnd(8, "_");
  $("phone-display").textContent = "010-" + digits.slice(0, 4) + "-" + digits.slice(4);
  $("btn-phone-next").disabled = order.phone.length !== 8;
}

function pressKey(key) {
  $("phone-error").textContent = "";
  if (key === "clear") {
    order.phone = "";
  } else if (key === "back") {
    order.phone = order.phone.slice(0, -1);
  } else if (order.phone.length < 8) {
    order.phone += key;
  }
  renderPhone();
}

function phoneNext() {
  const fullPhone = "010" + order.phone;
  const session = findSessionByPhone(fullPhone);

  if (order.mode === "enter") {
    // 이미 입실 중인 번호는 다시 입실할 수 없게 막기
    if (session) {
      $("phone-error").textContent =
        "이미 " + session.seat + "번 좌석을 이용 중인 번호입니다. 퇴실 후 이용해 주세요.";
      return;
    }
    if (activeSessions.length >= TOTAL_SEATS) {
      $("phone-error").textContent = "죄송합니다. 지금은 남은 좌석이 없습니다.";
      return;
    }
    order.phone = fullPhone;
    renderTickets();
    showScreen("ticket");
  } else {
    // 퇴실: 입실 기록이 있어야 함
    if (!session) {
      $("phone-error").textContent = "입실 기록이 없는 번호입니다. 번호를 다시 확인해 주세요.";
      return;
    }
    order.phone = fullPhone;
    renderExit(session);
    showScreen("exit");
  }
}

// -----------------------------------------------------
// 3. 이용권 선택
// -----------------------------------------------------
function renderTickets() {
  const now = new Date();
  $("ticket-list").innerHTML = TICKETS.map(function (ticket) {
    const end = new Date(now.getTime() + ticket.hours * 60 * 60 * 1000);
    const selected = ticket.id === order.ticketId ? " selected" : "";
    return (
      '<button class="ticket' + selected + '" data-ticket="' + ticket.id + '">' +
        '<span class="t-name">' + ticket.name + "</span>" +
        '<span class="t-price">' + formatPrice(ticket.price) + "</span>" +
        '<span class="t-end">지금 입실하면 ' + formatEndTime(end) + "까지</span>" +
      "</button>"
    );
  }).join("");

  $("btn-ticket-next").disabled = !order.ticketId;

  document.querySelectorAll(".ticket").forEach(function (button) {
    button.addEventListener("click", function () {
      order.ticketId = button.dataset.ticket;
      renderTickets();
      resetIdleTimer("ticket");
    });
  });
}

// -----------------------------------------------------
// 4. 좌석 선택 (키오스크·관리자 화면에서 같이 사용)
// -----------------------------------------------------
function renderSeatMap(containerId, forAdmin) {
  const now = Date.now();
  let html = "";

  ZONES.forEach(function (zone) {
    html += '<div class="zone"><p class="zone-name">' + zone.name + " (" + zone.from + "~" + zone.to + "번)</p>";
    html += '<div class="seat-grid' + (forAdmin ? " admin-seat-grid" : "") + '">';

    for (let no = zone.from; no <= zone.to; no++) {
      const session = findSessionBySeat(no);

      if (forAdmin) {
        // 관리자: 남은 시간 표시
        if (session) {
          const leftMin = Math.max(0, Math.round((session.endTime - now) / 60000));
          const soon = leftMin <= 30 ? " soon" : "";
          html += '<div class="admin-seat used' + soon + '"><b>' + no + "</b>" + minutesToText(leftMin) + " 남음</div>";
        } else {
          html += '<div class="admin-seat"><b>' + no + '</b><span class="free-label">빈 좌석</span></div>';
        }
      } else {
        // 키오스크: 선택 버튼
        let cls = "seat";
        if (session) cls += " used";
        if (order.seat === no) cls += " picked";
        html += '<button class="' + cls + '" data-seat="' + no + '"' + (session ? " disabled" : "") + ">" + no + "</button>";
      }
    }
    html += "</div></div>";
  });

  $(containerId).innerHTML = html;

  if (!forAdmin) {
    $("btn-seat-next").disabled = !order.seat;
    document.querySelectorAll("#seat-map .seat:not(.used)").forEach(function (button) {
      button.addEventListener("click", function () {
        order.seat = Number(button.dataset.seat);
        renderSeatMap("seat-map", false);
        resetIdleTimer("seat");
      });
    });
  }
}

// -----------------------------------------------------
// 5~7. 결제와 입실 완료
// -----------------------------------------------------
function renderPay() {
  const ticket = findTicket(order.ticketId);
  fillSummary($("pay-summary"), [
    ["휴대폰", maskPhone(order.phone)],
    ["이용권", ticket.name],
    ["좌석", order.seat + "번 (" + getZoneName(order.seat) + ")"],
    ["결제 금액", formatPrice(ticket.price), "total"],
  ]);
}

function pay(method) {
  // 결제하는 사이에 다른 사람이 같은 좌석을 잡았는지 한 번 더 확인
  if (findSessionBySeat(order.seat)) {
    alertSeatTaken();
    return;
  }

  $("paying-method").textContent = method + "로 결제하고 있습니다. 잠시만 기다려 주세요.";
  showScreen("paying");

  // 실제 결제 대신 1.5초 기다렸다가 성공했다고 가정
  setTimeout(function () {
    completeEnter();
  }, 1500);
}

function alertSeatTaken() {
  order.seat = null;
  renderSeatMap("seat-map", false);
  showScreen("seat");
}

function completeEnter() {
  const ticket = findTicket(order.ticketId);
  const now = new Date();
  const end = new Date(now.getTime() + ticket.hours * 60 * 60 * 1000);

  // 이용 중 목록과 이용 기록에 추가
  activeSessions.push({ phone: order.phone, seat: order.seat, ticketId: ticket.id, startTime: now, endTime: end });
  usageLogs.push({ time: now, phone: order.phone, seat: order.seat, ticketId: ticket.id, type: "입실", price: ticket.price });

  fillSummary($("done-summary"), [
    ["좌석", order.seat + "번 (" + getZoneName(order.seat) + ")"],
    ["이용 시간", formatTime(now) + " ~ " + formatEndTime(end)],
  ]);
  $("done-pin").textContent = makePin();

  showScreen("done");
  startCountdown("done-count", 10);
  renderAdmin();
}

// -----------------------------------------------------
// 8~9. 퇴실
// -----------------------------------------------------
function renderExit(session) {
  const usedMin = Math.round((Date.now() - session.startTime) / 60000);
  fillSummary($("exit-summary"), [
    ["휴대폰", maskPhone(session.phone)],
    ["좌석", session.seat + "번 (" + getZoneName(session.seat) + ")"],
    ["입실 시각", formatTime(session.startTime)],
    ["이용한 시간", minutesToText(usedMin)],
  ]);
}

function confirmExit() {
  const session = findSessionByPhone(order.phone);
  if (!session) {
    showScreen("home");
    return;
  }

  removeSession(session, "퇴실");
  $("exit-done-msg").textContent = session.seat + "번 좌석 퇴실 처리되었습니다. 이용해 주셔서 감사합니다.";
  showScreen("exit-done");
  startCountdown("exit-count", 5);
  renderAdmin();
}

// 이용 중 목록에서 빼고, 이용 기록에 남기기
function removeSession(session, type) {
  const index = activeSessions.indexOf(session);
  activeSessions.splice(index, 1);
  usageLogs.push({ time: new Date(), phone: session.phone, seat: session.seat, ticketId: session.ticketId, type: type, price: 0 });
}

// 이용 시간이 끝난 좌석은 자동으로 퇴실 처리 (무인 매장이라 직원이 없어도 좌석이 정리되도록)
function autoCheckout() {
  const now = Date.now();
  // 배열을 돌면서 지우면 순서가 꼬이므로, 지울 대상을 먼저 골라 둡니다
  const expired = activeSessions.filter(function (s) {
    return s.endTime <= now;
  });
  expired.forEach(function (session) {
    removeSession(session, "자동퇴실");
  });
  if (expired.length > 0) {
    renderHome();
    renderAdmin();
  }
}

// -----------------------------------------------------
// 관리자 화면
// -----------------------------------------------------
function renderAdmin() {
  const used = activeSessions.length;
  const rate = Math.round((used / TOTAL_SEATS) * 100);
  const sales = usageLogs.reduce(function (sum, log) {
    return sum + log.price;
  }, 0);
  const enterCount = usageLogs.filter(function (log) {
    return log.type === "입실";
  }).length;

  $("admin-stats").innerHTML =
    '<div class="stat"><p>사용 중 좌석</p><strong>' + used + " / " + TOTAL_SEATS + "</strong></div>" +
    '<div class="stat"><p>좌석 이용률</p><strong>' + rate + "%</strong></div>" +
    '<div class="stat"><p>오늘 입실</p><strong>' + enterCount + "명</strong></div>" +
    '<div class="stat"><p>오늘 매출</p><strong>' + formatPrice(sales) + "</strong></div>";

  renderSeatMap("admin-seat-map", true);

  // 이용 기록: 최근 것이 위로 오도록
  const logs = usageLogs.slice().sort(function (a, b) {
    return b.time - a.time;
  });

  $("admin-log-body").innerHTML = logs
    .map(function (log) {
      const tagClass = log.type === "입실" ? "in" : "out";
      return (
        "<tr>" +
          "<td>" + formatTime(log.time) + "</td>" +
          '<td><span class="tag ' + tagClass + '">' + log.type + "</span></td>" +
          "<td>" + maskPhone(log.phone) + "</td>" +
          "<td>" + log.seat + "번</td>" +
          "<td>" + findTicket(log.ticketId).name + "</td>" +
          "<td>" + (log.price ? formatPrice(log.price) : "-") + "</td>" +
        "</tr>"
      );
    })
    .join("");
}

// -----------------------------------------------------
// 버튼 연결
// -----------------------------------------------------
function setupEvents() {
  $("btn-start-enter").addEventListener("click", function () {
    startPhone("enter");
  });
  $("btn-start-exit").addEventListener("click", function () {
    startPhone("exit");
  });

  document.querySelectorAll("#keypad button").forEach(function (button) {
    button.addEventListener("click", function () {
      pressKey(button.dataset.key);
      resetIdleTimer("phone");
    });
  });

  $("btn-phone-next").addEventListener("click", phoneNext);

  $("btn-ticket-next").addEventListener("click", function () {
    renderSeatMap("seat-map", false);
    showScreen("seat");
  });

  $("btn-seat-next").addEventListener("click", function () {
    renderPay();
    showScreen("pay");
  });

  document.querySelectorAll(".pay-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      pay(button.dataset.method);
    });
  });

  $("btn-exit-confirm").addEventListener("click", confirmExit);

  // "이전", "처음으로" 버튼 (data-go에 적힌 화면으로 이동)
  document.querySelectorAll("[data-go]").forEach(function (button) {
    button.addEventListener("click", function () {
      const target = button.dataset.go;
      if (target === "phone") {
        // 이용권 화면에서 이전: 번호를 다시 입력할 수 있게 010을 떼고 돌려놓기
        order.phone = order.phone.slice(3);
        renderPhone();
      }
      if (target === "ticket") renderTickets();
      if (target === "seat") renderSeatMap("seat-map", false);
      showScreen(target);
    });
  });

  // 키오스크 / 관리자 화면 전환 탭
  document.querySelectorAll(".view-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".view-tab").forEach(function (t) {
        t.classList.toggle("active", t === tab);
      });
      $("view-kiosk").classList.toggle("hidden", tab.dataset.view !== "kiosk");
      $("view-admin").classList.toggle("hidden", tab.dataset.view !== "admin");
      renderAdmin();
    });
  });
}

// -----------------------------------------------------
// 시작
// -----------------------------------------------------
setupEvents();
updateClock();
renderHome();
renderAdmin();

setInterval(updateClock, 1000 * 10);
setInterval(function () {
  autoCheckout();
  // 관리자 화면의 남은 시간도 30초마다 새로 계산
  if (!$("view-admin").classList.contains("hidden")) renderAdmin();
}, 1000 * 30);
