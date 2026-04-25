// 水果图标数组
const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍉', '🍓', '🍒', '🍑', '🍍', '🍌', '🥝', '🍈'];
const BOARD_SIZE = 8;
const TOTAL_LEVELS = 5;
const TIME_PER_LEVEL = 60;

// 游戏状态
let gameBoard = [];
let selectedCell = null;
let currentLevel = 1;
let timeLeft = TIME_PER_LEVEL;
let timerInterval = null;
let remainingPairs = 0;
let isGameRunning = false;

// DOM元素
const gameBoardElement = document.getElementById('gameBoard');
const levelElement = document.getElementById('level');
const timerElement = document.getElementById('timer');
const remainingElement = document.getElementById('remaining');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const hintBtn = document.getElementById('hintBtn');
const gameMessage = document.getElementById('gameMessage');
const messageText = document.getElementById('messageText');
const messageBtn = document.getElementById('messageBtn');

// 初始化游戏
function initGame() {
    gameBoardElement.innerHTML = '';
    gameBoard = [];
    selectedCell = null;
    remainingPairs = 0;
    
    // 创建8x8的游戏面板
    for (let i = 0; i < BOARD_SIZE; i++) {
        gameBoard[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            gameBoard[i][j] = {
                row: i,
                col: j,
                fruit: null,
                element: null
            };
            
            const cellElement = document.createElement('div');
            cellElement.className = 'cell';
            cellElement.dataset.row = i;
            cellElement.dataset.col = j;
            cellElement.addEventListener('click', () => handleCellClick(i, j));
            gameBoardElement.appendChild(cellElement);
            gameBoard[i][j].element = cellElement;
        }
    }
    
    updateUI();
}

// 生成游戏面板
function generateBoard() {
    const totalCells = BOARD_SIZE * BOARD_SIZE;
    const pairsNeeded = totalCells / 2;
    
    // 确保有足够的水果类型，根据关卡增加难度
    const fruitsToUse = FRUITS.slice(0, Math.min(4 + currentLevel, FRUITS.length));
    const pairsPerFruit = Math.floor(pairsNeeded / fruitsToUse.length);
    const remainingPairsToDistribute = pairsNeeded % fruitsToUse.length;
    
    let allFruits = [];
    
    // 分配水果
    for (let i = 0; i < fruitsToUse.length; i++) {
        let count = pairsPerFruit * 2;
        if (i < remainingPairsToDistribute) {
            count += 2;
        }
        for (let j = 0; j < count; j++) {
            allFruits.push(fruitsToUse[i]);
        }
    }
    
    // 打乱水果顺序
    for (let i = allFruits.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allFruits[i], allFruits[j]] = [allFruits[j], allFruits[i]];
    }
    
    // 分配到游戏面板
    let fruitIndex = 0;
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            gameBoard[i][j].fruit = allFruits[fruitIndex];
            gameBoard[i][j].element.textContent = allFruits[fruitIndex];
            gameBoard[i][j].element.style.display = 'flex';
            gameBoard[i][j].element.style.opacity = '1';
            gameBoard[i][j].element.style.transform = 'scale(1)';
            gameBoard[i][j].element.classList.remove('selected', 'matched', 'hint');
            fruitIndex++;
        }
    }
    
    remainingPairs = pairsNeeded;
    updateUI();
}

// 处理单元格点击
function handleCellClick(row, col) {
    if (!isGameRunning) return;
    
    const cell = gameBoard[row][col];
    
    // 忽略已经消除的单元格或已选中的单元格
    if (!cell.fruit || cell.element.style.display === 'none') return;
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) return;
    
    // 移除之前的选中状态
    if (selectedCell) {
        gameBoard[selectedCell.row][selectedCell.col].element.classList.remove('selected');
    }
    
    // 如果没有选中的单元格，选中当前单元格
    if (!selectedCell) {
        selectedCell = { row, col };
        cell.element.classList.add('selected');
        return;
    }
    
    // 如果有选中的单元格，检查是否匹配
    const firstCell = gameBoard[selectedCell.row][selectedCell.col];
    const secondCell = cell;
    
    // 检查水果类型是否相同
    if (firstCell.fruit === secondCell.fruit) {
        // 检查是否可以连接
        if (canConnect(selectedCell.row, selectedCell.col, row, col)) {
            // 消除这两个单元格
            removeCells(selectedCell.row, selectedCell.col, row, col);
            selectedCell = null;
            
            // 检查游戏是否结束
            if (remainingPairs === 0) {
                levelComplete();
            }
            return;
        }
    }
    
    // 不匹配，选中当前单元格
    selectedCell = { row, col };
    cell.element.classList.add('selected');
}

// 检查单元格是否为空（已消除的单元格）
function isEmpty(row, col) {
    // 边界检查
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
        return false;
    }
    // 检查单元格是否有水果且未被消除
    const cell = gameBoard[row][col];
    return !cell.fruit || cell.element.style.display === 'none';
}

// 检查两个单元格是否相邻
function isAdjacent(row1, col1, row2, col2) {
    // 左右相邻
    if (row1 === row2 && Math.abs(col1 - col2) === 1) {
        return true;
    }
    // 上下相邻
    if (col1 === col2 && Math.abs(row1 - row2) === 1) {
        return true;
    }
    return false;
}

// 检查两个单元格是否可以连接
function canConnect(row1, col1, row2, col2) {
    // 首先检查是否是同一个单元格
    if (row1 === row2 && col1 === col2) {
        return false;
    }
    
    // 【关键】首先检查是否相邻，如果相邻直接返回true
    // 这确保了上下挨着、左右挨着的相同水果一定能消除
    if (isAdjacent(row1, col1, row2, col2)) {
        return true;
    }
    
    // 直线连接（中间没有障碍物）
    if (canConnectLine(row1, col1, row2, col2)) {
        return true;
    }
    
    // 一个拐角连接
    if (canConnectOneCorner(row1, col1, row2, col2)) {
        return true;
    }
    
    // 两个拐角连接
    if (canConnectTwoCorners(row1, col1, row2, col2)) {
        return true;
    }
    
    return false;
}

// 直线连接检查（同一行或同一列，中间没有障碍物）
function canConnectLine(row1, col1, row2, col2) {
    // 同一行
    if (row1 === row2) {
        const minCol = Math.min(col1, col2);
        const maxCol = Math.max(col1, col2);
        
        // 检查中间的单元格是否都为空
        for (let col = minCol + 1; col < maxCol; col++) {
            if (!isEmpty(row1, col)) {
                return false;
            }
        }
        return true;
    }
    
    // 同一列
    if (col1 === col2) {
        const minRow = Math.min(row1, row2);
        const maxRow = Math.max(row1, row2);
        
        // 检查中间的单元格是否都为空
        for (let row = minRow + 1; row < maxRow; row++) {
            if (!isEmpty(row, col1)) {
                return false;
            }
        }
        return true;
    }
    
    return false;
}

// 一个拐角连接检查
function canConnectOneCorner(row1, col1, row2, col2) {
    // 检查拐角点1：(row1, col2)
    // 这个点必须为空（或在边界外）
    let corner1Valid = false;
    if (row1 >= 0 && row1 < BOARD_SIZE && col2 >= 0 && col2 < BOARD_SIZE) {
        // 如果拐角点在网格内，必须为空
        corner1Valid = isEmpty(row1, col2);
    } else {
        // 如果拐角点在网格外，认为是有效的
        corner1Valid = true;
    }
    
    if (corner1Valid) {
        // 检查 (row1, col1) -> (row1, col2) -> (row2, col2)
        // 第一段：(row1, col1) 到 (row1, col2)
        let line1Valid = false;
        if (row1 >= 0 && row1 < BOARD_SIZE && col2 >= 0 && col2 < BOARD_SIZE) {
            // 如果拐角点在网格内，检查直线连接
            line1Valid = canConnectLine(row1, col1, row1, col2);
        } else {
            // 如果拐角点在网格外，检查从 (row1, col1) 到边界是否畅通
            line1Valid = canConnectToBorder(row1, col1, 'horizontal');
        }
        
        // 第二段：(row1, col2) 到 (row2, col2)
        let line2Valid = false;
        if (row1 >= 0 && row1 < BOARD_SIZE && col2 >= 0 && col2 < BOARD_SIZE) {
            // 如果拐角点在网格内，检查直线连接
            line2Valid = canConnectLine(row1, col2, row2, col2);
        } else {
            // 如果拐角点在网格外，检查从边界到 (row2, col2) 是否畅通
            line2Valid = canConnectToBorder(row2, col2, 'vertical');
        }
        
        if (line1Valid && line2Valid) {
            return true;
        }
    }
    
    // 检查拐角点2：(row2, col1)
    // 这个点必须为空（或在边界外）
    let corner2Valid = false;
    if (row2 >= 0 && row2 < BOARD_SIZE && col1 >= 0 && col1 < BOARD_SIZE) {
        // 如果拐角点在网格内，必须为空
        corner2Valid = isEmpty(row2, col1);
    } else {
        // 如果拐角点在网格外，认为是有效的
        corner2Valid = true;
    }
    
    if (corner2Valid) {
        // 检查 (row1, col1) -> (row2, col1) -> (row2, col2)
        // 第一段：(row1, col1) 到 (row2, col1)
        let line1Valid = false;
        if (row2 >= 0 && row2 < BOARD_SIZE && col1 >= 0 && col1 < BOARD_SIZE) {
            // 如果拐角点在网格内，检查直线连接
            line1Valid = canConnectLine(row1, col1, row2, col1);
        } else {
            // 如果拐角点在网格外，检查从 (row1, col1) 到边界是否畅通
            line1Valid = canConnectToBorder(row1, col1, 'vertical');
        }
        
        // 第二段：(row2, col1) 到 (row2, col2)
        let line2Valid = false;
        if (row2 >= 0 && row2 < BOARD_SIZE && col1 >= 0 && col1 < BOARD_SIZE) {
            // 如果拐角点在网格内，检查直线连接
            line2Valid = canConnectLine(row2, col1, row2, col2);
        } else {
            // 如果拐角点在网格外，检查从边界到 (row2, col2) 是否畅通
            line2Valid = canConnectToBorder(row2, col2, 'horizontal');
        }
        
        if (line1Valid && line2Valid) {
            return true;
        }
    }
    
    return false;
}

// 两个拐角连接检查
function canConnectTwoCorners(row1, col1, row2, col2) {
    // 水平方向扫描（扫描每一列）
    for (let col = 0; col < BOARD_SIZE; col++) {
        // 跳过起点和终点所在的列
        if (col === col1 || col === col2) continue;
        
        // 检查两个拐点位置是否为空
        if (isEmpty(row1, col) && isEmpty(row2, col)) {
            // 检查路径：(row1, col1) -> (row1, col) -> (row2, col) -> (row2, col2)
            if (canConnectLine(row1, col1, row1, col) && 
                canConnectLine(row1, col, row2, col) && 
                canConnectLine(row2, col, row2, col2)) {
                return true;
            }
        }
    }
    
    // 垂直方向扫描（扫描每一行）
    for (let row = 0; row < BOARD_SIZE; row++) {
        // 跳过起点和终点所在的行
        if (row === row1 || row === row2) continue;
        
        // 检查两个拐点位置是否为空
        if (isEmpty(row, col1) && isEmpty(row, col2)) {
            // 检查路径：(row1, col1) -> (row, col1) -> (row, col2) -> (row2, col2)
            if (canConnectLine(row1, col1, row, col1) && 
                canConnectLine(row, col1, row, col2) && 
                canConnectLine(row, col2, row2, col2)) {
                return true;
            }
        }
    }
    
    // 检查通过边界外的连接（两个拐点都在边界外）
    // 检查是否可以通过左边界或右边界连接
    if (canConnectToBorder(row1, col1, 'horizontal') && 
        canConnectToBorder(row2, col2, 'horizontal')) {
        return true;
    }
    
    // 检查是否可以通过上边界或下边界连接
    if (canConnectToBorder(row1, col1, 'vertical') && 
        canConnectToBorder(row2, col2, 'vertical')) {
        return true;
    }
    
    return false;
}

// 检查单元格到边界是否畅通
function canConnectToBorder(row, col, direction) {
    if (direction === 'horizontal') {
        // 检查到左边界是否畅通
        let leftClear = true;
        for (let c = col - 1; c >= 0; c--) {
            if (!isEmpty(row, c)) {
                leftClear = false;
                break;
            }
        }
        if (leftClear) return true;
        
        // 检查到右边界是否畅通
        let rightClear = true;
        for (let c = col + 1; c < BOARD_SIZE; c++) {
            if (!isEmpty(row, c)) {
                rightClear = false;
                break;
            }
        }
        return rightClear;
    } else {
        // 检查到上边界是否畅通
        let topClear = true;
        for (let r = row - 1; r >= 0; r--) {
            if (!isEmpty(r, col)) {
                topClear = false;
                break;
            }
        }
        if (topClear) return true;
        
        // 检查到下边界是否畅通
        let bottomClear = true;
        for (let r = row + 1; r < BOARD_SIZE; r++) {
            if (!isEmpty(r, col)) {
                bottomClear = false;
                break;
            }
        }
        return bottomClear;
    }
}

// 消除两个单元格
function removeCells(row1, col1, row2, col2) {
    const cell1 = gameBoard[row1][col1];
    const cell2 = gameBoard[row2][col2];
    
    cell1.element.classList.add('matched');
    cell2.element.classList.add('matched');
    
    // 动画结束后隐藏
    setTimeout(() => {
        cell1.fruit = null;
        cell2.fruit = null;
        cell1.element.style.display = 'none';
        cell2.element.style.display = 'none';
        cell1.element.classList.remove('selected', 'matched');
        cell2.element.classList.remove('selected', 'matched');
    }, 500);
    
    remainingPairs--;
    updateUI();
}

// 更新UI
function updateUI() {
    levelElement.textContent = currentLevel;
    timerElement.textContent = timeLeft;
    remainingElement.textContent = remainingPairs * 2;
}

// 开始游戏
function startGame() {
    if (isGameRunning) return;
    
    isGameRunning = true;
    currentLevel = 1;
    timeLeft = TIME_PER_LEVEL;
    
    initGame();
    generateBoard();
    startTimer();
    
    startBtn.disabled = true;
    startBtn.style.opacity = '0.6';
}

// 重新开始游戏
function restartGame() {
    stopTimer();
    isGameRunning = false;
    
    currentLevel = 1;
    timeLeft = TIME_PER_LEVEL;
    selectedCell = null;
    
    initGame();
    startGame();
}

// 开始计时器
function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateUI();
        
        if (timeLeft <= 0) {
            timeUp();
        }
    }, 1000);
}

// 停止计时器
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// 关卡完成
function levelComplete() {
    stopTimer();
    
    if (currentLevel < TOTAL_LEVELS) {
        showMessage(`恭喜！第 ${currentLevel} 关完成！`, '下一关', () => {
            currentLevel++;
            timeLeft = TIME_PER_LEVEL;
            selectedCell = null;
            initGame();
            generateBoard();
            startTimer();
            hideMessage();
        });
    } else {
        showMessage('恭喜你通关了所有关卡！', '重新开始', () => {
            hideMessage();
            restartGame();
        });
        isGameRunning = false;
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
    }
}

// 时间到
function timeUp() {
    stopTimer();
    isGameRunning = false;
    
    showMessage('时间到！游戏结束', '重新开始', () => {
        hideMessage();
        restartGame();
    });
    
    startBtn.disabled = false;
    startBtn.style.opacity = '1';
}

// 显示消息
function showMessage(text, btnText, callback) {
    messageText.textContent = text;
    messageBtn.textContent = btnText;
    
    // 移除旧的事件监听器
    const newBtn = messageBtn.cloneNode(true);
    messageBtn.parentNode.replaceChild(newBtn, messageBtn);
    
    // 添加新的事件监听器
    newBtn.addEventListener('click', callback);
    
    gameMessage.classList.remove('hidden');
}

// 隐藏消息
function hideMessage() {
    gameMessage.classList.add('hidden');
}

// 提示功能
function showHint() {
    if (!isGameRunning) return;
    
    // 清除之前的提示
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            gameBoard[i][j].element.classList.remove('hint');
        }
    }
    
    // 寻找可以连接的一对
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const cell1 = gameBoard[i][j];
            if (!cell1.fruit || cell1.element.style.display === 'none') continue;
            
            for (let x = 0; x < BOARD_SIZE; x++) {
                for (let y = 0; y < BOARD_SIZE; y++) {
                    if (i === x && j === y) continue;
                    
                    const cell2 = gameBoard[x][y];
                    if (!cell2.fruit || cell2.element.style.display === 'none') continue;
                    
                    if (cell1.fruit === cell2.fruit && canConnect(i, j, x, y)) {
                        // 找到一对，显示提示
                        cell1.element.classList.add('hint');
                        cell2.element.classList.add('hint');
                        
                        // 3秒后移除提示
                        setTimeout(() => {
                            cell1.element.classList.remove('hint');
                            cell2.element.classList.remove('hint');
                        }, 3000);
                        
                        return;
                    }
                }
            }
        }
    }
}

// 事件监听器
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
hintBtn.addEventListener('click', showHint);

// 初始化游戏
initGame();