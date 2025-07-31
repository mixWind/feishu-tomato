// 与多维表格 SDK 交互
var __f = window.FeishuSheetAPI;

// 当前任务记录
var recordId = null;
var timer = null;
var startTime = null;
var durationMin = 25;

// 读取当前选中的记录
function fetchSelection() {
  __f.getSelection().then(function (sel) {
    if (sel && sel.recordId) {
      recordId = sel.recordId;
      document.getElementById('startBtn').disabled = false;
    } else {
      recordId = null;
      document.getElementById('startBtn').disabled = true;
    }
  });
}
fetchSelection();
setInterval(fetchSelection, 3000);

// 开始番茄
document.getElementById('startBtn').onclick = function () {
  var input = prompt('番茄时长（分钟）', 25);
  if (input === null) return;
  durationMin = parseInt(input, 10) || 25;
  startTime = Date.now();
  timer = setInterval(updateTimer, 1000);
  document.getElementById('timer').style.display = 'block';
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  __f.updateRecord(recordId, {状态: '进行中'});
};

// 中断
document.getElementById('stopBtn').onclick = function () {
  finish(true);
};

function updateTimer() {
  var left = durationMin * 60 - Math.floor((Date.now() - startTime) / 1000);
  if (left <= 0) {
    finish(false);
    return;
  }
  var m = Math.floor(left / 60);
  var s = left % 60;
  document.getElementById('timer').textContent =
    (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

// 结束番茄
function finish(interrupted) {
  clearInterval(timer);
  var used = interrupted
    ? Math.round((Date.now() - startTime) / 1000 / 60)
    : durationMin;

  // 累加耗时
  __f.getRecord(recordId).then(function (rec) {
    var old = rec.fields['任务耗时'] || 0;
    var newVal = old + used;
    __f.updateRecord(recordId, {
      '任务耗时': newVal,
      状态: interrupted ? '待处理' : '已完成'
    });

    // 发飞书消息
    var title = interrupted ? '番茄已中断' : '番茄完成';
    var content = '任务：' + rec.fields['任务名称'] + '，本次耗时 ' + used + ' 分钟';
    __f.sendMessage({ type: 'text', content: title + '\n' + content });

    // 重置 UI
    document.getElementById('timer').style.display = 'none';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
  });
}