let allTasks = []; // すべてのタスクデータを保持

// 進捗をタスクの開始日と終了日から計算する関数.
const calculateProgress = (task) => {
  const now = new Date();
  const start = new Date(task.start);
  const end = new Date(task.end);
  const totalDuration = end - start;
  const elapsedTime = now - start;

  if (elapsedTime < 0) return 0; // タスクがまだ開始されていない場合
  if (elapsedTime > totalDuration) return 100; // タスクが完了した場合
  return (elapsedTime / totalDuration) * 100;
};

// ガントチャートを更新する関数
const updateGantt = (showCompleted, nameFilter = '') => {
  const now = new Date();
  const filteredTasks = allTasks.filter(task => {
    const end = new Date(task.end);
    const matchesName = task.name.toLowerCase().includes(nameFilter.toLowerCase());
  
    // 日付部分を比較するため、時刻を無視して YYYY-MM-DD の形式に変換
    const startDate = new Date(task.start.split(' ')[0]); // 時刻を削除して日付だけにする
    const endDate = new Date(task.end.split(' ')[0]); // 時刻を削除して日付だけにする
  
    return (showCompleted || endDate >= now) && matchesName;
  });
  
  const gantt = new Gantt("#gantt", filteredTasks, {
    view_mode: "Day",
    date_format: "YYYY-MM-DD", // 日付の表示形式
    editable: false
  });
};

// 複数のJSONファイルを読み込む関数
const loadTasks = async () => {
  const taskFiles = [
        // 終了イベント
        '../tasks/tasks_old.json',
        // 
        '../tasks/tasks_turi.json',
        // 超得イベント
        '../tasks/tasks_setugenboueki.json',
        // 通常イベント
        '../tasks/tasks_hyougennsihaisya.json',
        '../tasks/tasks_gunbi.json',
        '../tasks/tasks_doumeisoudouin.json',
        '../tasks/tasks_heiki.json',
        '../tasks/tasks_doumeisouha.json',
        '../tasks/tasks_kyoukoku.json',
        '../tasks/tasks_toride.json',
        '../tasks/tasks_sikannkeikaku.json',
        '../tasks/tasks_jina.json',
        '../tasks/tasks_kuma1.json'
        //'../tasks/tasks_kuma2.json'  //未設置
      ];

  try {
    const tasks = await Promise.all(taskFiles.map(file =>
      fetch(file).then(response => response.json())
    ));
    allTasks = tasks.flat(); // タスクを1つの配列にまとめる
    updateGantt(false); // 初期表示
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
};

loadTasks(); // ファイルの読み込みを開始

// チェックボックスのイベントリスナー
document.getElementById("showCompleted").addEventListener("change", (event) => {
  const nameFilter = document.getElementById("taskNameFilter").value;
  updateGantt(event.target.checked, nameFilter);
});

// タスク名でフィルタするイベントリスナー
document.getElementById("taskNameFilter").addEventListener("input", (event) => {
  const nameFilter = event.target.value;
  const showCompleted = document.getElementById("showCompleted").checked;
  updateGantt(showCompleted, nameFilter);
});

// コピー機能の実装
document.getElementById("copyButton").addEventListener("click", () => {
  const selectedDate = document.getElementById("datePicker").value;
  if (!selectedDate) {
    alert("日付を選択してください");
    return;
  }

  const targetDate = new Date(selectedDate);
  const formattedDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

  // 経過日数を各タスクの開始日から計算
  const today = new Date();
  const targetStartDate = new Date(targetDate);  // 日付選択の開始日
  const targetStartFormattedDate = `${targetStartDate.getFullYear()}-${String(targetStartDate.getMonth() + 1).padStart(2, '0')}-${String(targetStartDate.getDate()).padStart(2, '0')}`;

  const targetTasks = allTasks.filter(task => {
    const start = new Date(task.start);
    const end = new Date(task.end);
    
    // ターゲット日付を基準に、開始時間や終了時間が短い場合でも重なっていればコピー対象にする
    const targetStartDate = new Date(targetDate.setHours(0, 0, 0, 0)); // ターゲット日の開始時間（00:00）
    const targetEndDate = new Date(targetDate.setHours(23, 59, 59, 999)); // ターゲット日の終了時間（23:59）
  
    return (start < targetEndDate && end > targetStartDate); // 開始日または終了日がターゲット日と重なる場合
  });

  if (targetTasks.length === 0) {
    alert(`${formattedDate}にはイベントがありません`);
    return;
  }

  // 開始時刻で昇順にソート
  const sortedTasks = targetTasks.sort((a, b) => new Date(a.start) - new Date(b.start));

  // コピー用テキストを作成
  const tasksToCopy = targetTasks.map(task => {
    const taskStartDate = new Date(task.start);
    const taskStartFormattedTime = `${String(taskStartDate.getHours()).padStart(2, '0')}:${String(taskStartDate.getMinutes()).padStart(2, '0')}`; // 開始時刻の取得
    const diffTime = targetDate - taskStartDate;
    const diffDays = Math.floor((diffTime / (1000 * 60 * 60 * 24)) + 1); // 開始日からの経過日数
    return `${taskStartFormattedTime}~ ${task.name} (${diffDays}日目)`;  // 時刻 + イベント名 + 開始日からの日数
  }).join('\n');

  const textArea = document.createElement("textarea");
  textArea.value = `${formattedDate}のイベント:\n${tasksToCopy}`;
  document.body.appendChild(textArea);
  textArea.select();
  const successful = document.execCommand('copy');
  document.body.removeChild(textArea);

  alert(successful ? `${formattedDate}のイベントをコピーしました！` : "コピーに失敗しました。手動でコピーしてください。");
});
