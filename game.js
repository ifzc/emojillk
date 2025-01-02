class EmojiGame {
    constructor() {
        this.board = [];
        this.size = 8; // 8x8 网格
        this.selectedCells = [];
        this.score = 0;
        this.timeLeft = 60;
        this.isPlaying = false;
        this.timer = null;
        
        // Emoji 集合
        this.emojis = ['😀', '😎', '🥳', '😍', '🤪', '😇', '🤓', '🤠', 
                      '🐶', '🐱', '🐼', '🐨', '🦊', '🦁', '🐯', '🐸'];
        
        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        this.board = [];

        // 创建游戏板
        for (let i = 0; i < this.size; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'emoji-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                const randomEmoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
                cell.textContent = randomEmoji;
                this.board[i][j] = randomEmoji;
                
                gameBoard.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.addEventListener('click', (e) => {
            if (!this.isPlaying) return;
            
            const cell = e.target.closest('.emoji-cell');
            if (!cell) return;
            
            this.handleCellClick(cell);
        });

        document.getElementById('startGame').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('pauseGame').addEventListener('click', () => {
            this.pauseGame();
        });

        // 添加点击模态框外部关闭的功能
        window.onclick = (event) => {
            const modal = document.getElementById('gameOverModal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    handleCellClick(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // 检查是否点击空格子
        if (!this.board[row][col]) {
            return;
        }

        if (this.selectedCells.length === 0) {
            this.selectedCells.push({row, col, element: cell});
            cell.style.background = '#ffeb3b';
        } else {
            const firstCell = this.selectedCells[0];
            
            if (firstCell.row === row && firstCell.col === col) {
                // 取消选择
                cell.style.background = 'white';
                this.selectedCells = [];
                return;
            }

            if (this.canConnect(firstCell.row, firstCell.col, row, col)) {
                // 绘制连接线
                this.drawConnectionLine(firstCell, {row, col, element: cell});
                
                // 延迟消除，让玩家能看到连接线
                setTimeout(() => {
                    this.matchCells(firstCell, {row, col, element: cell});
                    this.removeConnectionLine();
                }, 200);
            } else {
                // 如果不能连接，显示提示效果
                this.showInvalidMatchEffect(cell);
            }

            // 重置选择
            firstCell.element.style.background = 'white';
            this.selectedCells = [];
        }
    }

    canConnect(row1, col1, row2, col2) {
        // 检查是否为空格子
        if (!this.board[row1][col1] || !this.board[row2][col2]) {
            return false;
        }

        // 检查是否为相同的 emoji
        if (this.board[row1][col1] !== this.board[row2][col2]) {
            return false;
        }

        // 检查直线路径
        if (this.hasDirectPath(row1, col1, row2, col2)) {
            return true;
        }

        // 检查一个转角的路径
        if (this.hasOneCornerPath(row1, col1, row2, col2)) {
            return true;
        }

        // 检查两个转角的路径
        if (this.hasTwoCornerPath(row1, col1, row2, col2)) {
            return true;
        }

        return false;
    }

    // 添加直线路径检查
    hasDirectPath(row1, col1, row2, col2) {
        // 水平直线
        if (row1 === row2) {
            const minCol = Math.min(col1, col2);
            const maxCol = Math.max(col1, col2);
            for (let col = minCol + 1; col < maxCol; col++) {
                if (this.board[row1][col] !== null) {
                    return false;
                }
            }
            return true;
        }
        
        // 垂直直线
        if (col1 === col2) {
            const minRow = Math.min(row1, row2);
            const maxRow = Math.max(row1, row2);
            for (let row = minRow + 1; row < maxRow; row++) {
                if (this.board[row][col1] !== null) {
                    return false;
                }
            }
            return true;
        }
        
        return false;
    }

    // 添加一个转角路径检查
    hasOneCornerPath(row1, col1, row2, col2) {
        // 检查两个可能的转角点
        const corners = [
            { row: row1, col: col2 },
            { row: row2, col: col1 }
        ];

        for (const corner of corners) {
            // 如果转角点有方块，跳过这个路径
            if (this.board[corner.row][corner.col] !== null) {
                continue;
            }

            // 检查从起点到转角点的路径
            if (this.hasDirectPath(row1, col1, corner.row, corner.col) &&
                this.hasDirectPath(corner.row, corner.col, row2, col2)) {
                this.cornerPoint = corner; // 保存转角点用于绘制
                return true;
            }
        }

        return false;
    }

    // 修改两个转角路径检查方法
    hasTwoCornerPath(row1, col1, row2, col2) {
        // 检查所有可能的第一个转角点
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                // 跳过非空格子
                if (this.board[row][col] !== null) {
                    continue;
                }

                // 检查第一个转角点是否可达
                const corner1 = { row, col };
                if (!this.hasDirectPath(row1, col1, corner1.row, corner1.col)) {
                    continue;
                }

                // 检查所有可能的第二个转角点
                for (let row2nd = 0; row2nd < this.size; row2nd++) {
                    for (let col2nd = 0; col2nd < this.size; col2nd++) {
                        // 跳过非空格子和第一个转角点
                        if (this.board[row2nd][col2nd] !== null || 
                            (row2nd === row && col2nd === col)) {
                            continue;
                        }

                        const corner2 = { row: row2nd, col: col2nd };

                        // 检查第一个转角点到第二个转角点的路径
                        if (!this.hasDirectPath(corner1.row, corner1.col, corner2.row, corner2.col)) {
                            continue;
                        }

                        // 检查第二个转角点到目标点的路径
                        if (this.hasDirectPath(corner2.row, corner2.col, row2, col2)) {
                            this.cornerPoints = [corner1, corner2];
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    matchCells(cell1, cell2) {
        // 消除配对的 Emoji
        this.board[cell1.row][cell1.col] = null;
        this.board[cell2.row][cell2.col] = null;
        
        cell1.element.textContent = '';
        cell2.element.textContent = '';
        
        // 添加消除动画
        this.addMatchAnimation(cell1.element);
        this.addMatchAnimation(cell2.element);
        
        // 更新分数
        this.updateScore(10);
    }

    addMatchAnimation(element) {
        element.style.animation = 'match-animation 0.5s';
        element.addEventListener('animationend', () => {
            element.style.animation = '';
        });
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
    }

    startGame() {
        this.isPlaying = true;
        this.score = 0;
        this.timeLeft = 60;
        this.initializeGame();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('timer').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    endGame() {
        this.isPlaying = false;
        clearInterval(this.timer);
        
        // 更新最终分数
        document.getElementById('finalScore').textContent = this.score;
        
        // 根据分数设置不同的表情
        const scoreEmoji = document.getElementById('scoreEmoji');
        if (this.score >= 200) {
            scoreEmoji.textContent = '🏆';
        } else if (this.score >= 150) {
            scoreEmoji.textContent = '🌟';
        } else if (this.score >= 100) {
            scoreEmoji.textContent = '😎';
        } else if (this.score >= 50) {
            scoreEmoji.textContent = '🙂';
        } else {
            scoreEmoji.textContent = '😢';
        }
        
        // 显示模态框
        const modal = document.getElementById('gameOverModal');
        modal.style.display = 'block';
        
        // 添加重新开始游戏的事件监听
        document.getElementById('restartGame').onclick = () => {
            modal.style.display = 'none';
            this.startGame();
        };
    }

    drawConnectionLine(cell1, cell2) {
        const canvas = document.createElement('canvas');
        canvas.id = 'connectionCanvas';
        canvas.style.position = 'absolute';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1000';
        
        const gameBoard = document.getElementById('gameBoard');
        const rect = gameBoard.getBoundingClientRect();
        
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvas.style.left = rect.left + 'px';
        canvas.style.top = rect.top + 'px';
        
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 3;
        
        const cell1Rect = cell1.element.getBoundingClientRect();
        const cell2Rect = cell2.element.getBoundingClientRect();
        
        const startX = cell1Rect.left - rect.left + cell1Rect.width / 2;
        const startY = cell1Rect.top - rect.top + cell1Rect.height / 2;
        const endX = cell2Rect.left - rect.left + cell2Rect.width / 2;
        const endY = cell2Rect.top - rect.top + cell2Rect.height / 2;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);

        // 绘制转角路径
        if (this.cornerPoints && this.cornerPoints.length === 2) {
            // 两个转角点
            const corner1X = this.cornerPoints[0].col * (cell1Rect.width + 5) + cell1Rect.width / 2 + 10;
            const corner1Y = this.cornerPoints[0].row * (cell1Rect.height + 5) + cell1Rect.height / 2 + 10;
            const corner2X = this.cornerPoints[1].col * (cell1Rect.width + 5) + cell1Rect.width / 2 + 10;
            const corner2Y = this.cornerPoints[1].row * (cell1Rect.height + 5) + cell1Rect.height / 2 + 10;
            
            ctx.lineTo(corner1X, corner1Y);
            ctx.lineTo(corner2X, corner2Y);
            ctx.lineTo(endX, endY);
        } else if (this.cornerPoints && this.cornerPoints.length === 1) {
            // 一个转角点
            const corner1X = this.cornerPoints[0].col * (cell1Rect.width + 5) + cell1Rect.width / 2 + 10;
            const corner1Y = this.cornerPoints[0].row * (cell1Rect.height + 5) + cell1Rect.height / 2 + 10;
            
            ctx.lineTo(corner1X, corner1Y);
            ctx.lineTo(endX, endY);
        } else if (this.cornerPoint) {
            // 一个转角点
            const cornerX = this.cornerPoint.col * (cell1Rect.width + 5) + cell1Rect.width / 2 + 10;
            const cornerY = this.cornerPoint.row * (cell1Rect.height + 5) + cell1Rect.height / 2 + 10;
            
            ctx.lineTo(cornerX, cornerY);
            ctx.lineTo(endX, endY);
        } else {
            // 直线
            ctx.lineTo(endX, endY);
        }
        
        ctx.stroke();

        // 重置转角点
        this.cornerPoint = null;
        this.cornerPoints = null;
    }

    removeConnectionLine() {
        const canvas = document.getElementById('connectionCanvas');
        if (canvas) {
            canvas.remove();
        }
    }

    // 添加无效匹配的视觉反馈
    showInvalidMatchEffect(cell) {
        cell.style.background = '#ff6b6b';
        setTimeout(() => {
            cell.style.background = 'white';
        }, 200);
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new EmojiGame();
}); 