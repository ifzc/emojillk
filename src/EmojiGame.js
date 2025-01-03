export default class EmojiGame {
  constructor(callbacks) {
    if (!callbacks || typeof callbacks !== 'object') {
      throw new Error('Callbacks must be provided as an object');
    }

    this.board = [];
    this.size = 8;
    this.selectedCells = [];
    this.score = 0;
    this.timeLeft = 60;
    this.isPlaying = false;
    this.timer = null;
    this.callbacks = callbacks;

    this.emojis = EmojiGame.EMOJIS;

    this.initializeGame();
  }

  static EMOJIS = ['😀', '😎', '🥳', '😍', '🤪', '😇', '🤓', '🤠',
                   '🐶', '🐱', '🐼', '🐨', '🦊', '🦁', '🐯', '🐸'];

  cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  initializeGame() {
    this.board = Array(this.size).fill(null).map(() =>
      Array(this.size).fill(null).map(() =>
        this.emojis[Math.floor(Math.random() * this.emojis.length)]
      )
    );
  }

  checkGameState() {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (!this.board[i][j]) continue;
        
        for (let m = 0; m < this.size; m++) {
          for (let n = 0; n < this.size; n++) {
            if (i === m && j === n) continue;
            if (!this.board[m][n]) continue;
            
            if (this.board[i][j] === this.board[m][n] &&
                this.canConnect(i, j, m, n)) {
              return true;
            }
          }
        }
      }
    }
    
    this.endGame();
    return false;
  }

  handleCellPress(row, col) {
    if (!this.isPlaying || 
        !this.isValidPosition(row, col) || 
        this.board[row][col] === null) {
      this.selectedCells = [];
      if (this.callbacks.onHideConnection) {
        this.callbacks.onHideConnection();
      }
      return;
    }

    if (this.callbacks.onHideConnection) {
      this.callbacks.onHideConnection();
    }

    if (this.selectedCells.length === 0) {
      this.selectedCells.push({ row, col });
      if (this.callbacks.onCellSelect) {
        this.callbacks.onCellSelect(row, col);
      }
    } else {
      const firstCell = this.selectedCells[0];
      
      if (firstCell.row === row && firstCell.col === col) {
        this.selectedCells = [];
        if (this.callbacks.onCellDeselect) {
          this.callbacks.onCellDeselect();
        }
        return;
      }

      if (this.canConnect(firstCell.row, firstCell.col, row, col)) {
        const secondCell = { row, col };
        
        if (this.board[firstCell.row][firstCell.col] !== null && 
            this.board[secondCell.row][secondCell.col] !== null) {
          
          if (this.callbacks.onShowConnection) {
            this.callbacks.onShowConnection(
              firstCell,
              secondCell,
              this.cornerPoint,
              this.cornerPoints
            );
          }

          setTimeout(() => {
            if (this.board[firstCell.row][firstCell.col] !== null && 
                this.board[secondCell.row][secondCell.col] !== null) {
              this.matchCells(firstCell, secondCell);
            } else {
              if (this.callbacks.onHideConnection) {
                this.callbacks.onHideConnection();
              }
            }
          }, 200);
        }
      }
      
      this.selectedCells = [];
    }
  }

  startGame() {
    this.isPlaying = true;
    this.score = 0;
    this.timeLeft = 60;
    this.initializeGame();
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.callbacks.onTimeUpdate(this.timeLeft);
      
      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  endGame() {
    this.isPlaying = false;
    clearInterval(this.timer);
    this.callbacks.onGameOver();
  }

  updateScore(points) {
    this.score += points;
    this.callbacks.onScoreUpdate(this.score);
  }

  canConnect(row1, col1, row2, col2) {
    if (!this.board[row1][col1] || !this.board[row2][col2]) {
      return false;
    }

    if (this.board[row1][col1] !== this.board[row2][col2]) {
      return false;
    }

    if (this.hasDirectPath(row1, col1, row2, col2)) {
      return true;
    }

    if (this.hasOneCornerPath(row1, col1, row2, col2)) {
      return true;
    }

    if (this.hasTwoCornerPath(row1, col1, row2, col2)) {
      return true;
    }

    return false;
  }

  hasDirectPath(row1, col1, row2, col2) {
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

  hasOneCornerPath(row1, col1, row2, col2) {
    this.cornerPoint = null;
    
    const corners = [
      { row: row1, col: col2 },
      { row: row2, col: col1 }
    ].filter(corner => {
      return corner.row >= 0 && corner.row < this.size &&
             corner.col >= 0 && corner.col < this.size &&
             this.board[corner.row][corner.col] === null;
    });

    for (const corner of corners) {
      const path1Clear = this.hasDirectPath(row1, col1, corner.row, corner.col);
      const path2Clear = this.hasDirectPath(corner.row, corner.col, row2, col2);

      if (path1Clear && path2Clear) {
        const isValidPath = this.validatePath([
          { row: row1, col: col1 },
          corner,
          { row: row2, col: col2 }
        ]);

        if (isValidPath) {
          this.cornerPoint = { ...corner };
          return true;
        }
      }
    }

    return false;
  }

  hasTwoCornerPath(row1, col1, row2, col2) {
    this.cornerPoints = null;

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.board[row][col] !== null) {
          continue;
        }

        const corner1 = { row, col };
        
        const path1Clear = this.hasDirectPath(row1, col1, corner1.row, corner1.col);
        if (!path1Clear) continue;

        for (let row2nd = 0; row2nd < this.size; row2nd++) {
          for (let col2nd = 0; col2nd < this.size; col2nd++) {
            if (this.board[row2nd][col2nd] !== null || 
                (row2nd === row && col2nd === col)) {
              continue;
            }

            const corner2 = { row: row2nd, col: col2nd };

            const path2Clear = this.hasDirectPath(corner1.row, corner1.col, corner2.row, corner2.col);
            const path3Clear = this.hasDirectPath(corner2.row, corner2.col, row2, col2);

            if (path2Clear && path3Clear) {
              const isValidPath = this.validatePath([
                { row: row1, col: col1 },
                corner1,
                corner2,
                { row: row2, col: col2 }
              ]);

              if (isValidPath) {
                this.cornerPoints = [{ ...corner1 }, { ...corner2 }];
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  validatePath(points) {
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      if (current.row === next.row) {
        const minCol = Math.min(current.col, next.col);
        const maxCol = Math.max(current.col, next.col);
        for (let col = minCol + 1; col < maxCol; col++) {
          if ((col === current.col && current.row === next.row) ||
              (col === next.col && current.row === next.row)) {
            continue;
          }
          if (this.board[current.row][col] !== null) {
            return false;
          }
        }
      } else if (current.col === next.col) {
        const minRow = Math.min(current.row, next.row);
        const maxRow = Math.max(current.row, next.row);
        for (let row = minRow + 1; row < maxRow; row++) {
          if ((row === current.row && current.col === next.col) ||
              (row === next.row && current.col === next.col)) {
            continue;
          }
          if (this.board[row][current.col] !== null) {
            return false;
          }
        }
      } else {
        return false;
      }
    }
    return true;
  }

  matchCells(cell1, cell2) {
    if (this.callbacks.onHideConnection) {
      this.callbacks.onHideConnection();
    }

    this.selectedCells = [];
    
    this.board[cell1.row][cell1.col] = null;
    this.board[cell2.row][cell2.col] = null;
    
    if (this.callbacks.onCellsMatch) {
      this.callbacks.onCellsMatch(cell1, cell2);
    }
    
    this.updateScore(10);

    setTimeout(() => {
      this.checkGameState();
    }, 300);
  }

  isValidPosition(row, col) {
    return row >= 0 && row < this.size &&
           col >= 0 && col < this.size;
  }
} 