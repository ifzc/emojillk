import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import EmojiGame from './EmojiGame';

export default function App() {
  const [game, setGame] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [connection, setConnection] = useState(null);

  const handleGameOver = useCallback(() => setGameOver(true), []);
  const handleShowConnection = useCallback((cell1, cell2, cornerPoint, cornerPoints) => {
    setConnection({ cell1, cell2, cornerPoint, cornerPoints });
  }, []);
  const handleHideConnection = useCallback(() => setConnection(null), []);

  useEffect(() => {
    const gameInstance = new EmojiGame({
      onScoreUpdate: setScore,
      onTimeUpdate: setTimeLeft,
      onGameOver: handleGameOver,
      onShowConnection: handleShowConnection,
      onHideConnection: handleHideConnection,
    });
    setGame(gameInstance);

    // 添加清理函数
    return () => {
      gameInstance.cleanup();
      setConnection(null);
    };
  }, [handleGameOver, handleShowConnection, handleHideConnection]);

  const startGame = () => {
    if (game) {
      game.startGame();
      setIsPlaying(true);
      setGameOver(false);
      setScore(0);
      setTimeLeft(60);
    }
  };

  const restartGame = () => {
    setGameOver(false);
    startGame();
  };

  const renderConnection = useMemo(() => {
    if (!connection || !game) return null;

    const { cell1, cell2, cornerPoint, cornerPoints } = connection;
    const CELL_CONFIG = {
      size: 40,
      margin: 2,
      padding: 10,
    };

    const getPosition = (row, col) => {
      if (row < 0 || row >= game.size || col < 0 || col >= game.size) {
        return null;
      }

      const cellTotalSize = CELL_CONFIG.size + CELL_CONFIG.margin * 2;
      
      const x = CELL_CONFIG.padding + col * cellTotalSize + CELL_CONFIG.size / 2 + CELL_CONFIG.margin;
      const y = CELL_CONFIG.padding + row * cellTotalSize + CELL_CONFIG.size / 2 + CELL_CONFIG.margin;

      return { x, y };
    };

    const renderLine = (from, to) => {
      if (!from || !to || 
          typeof from.x !== 'number' || typeof from.y !== 'number' ||
          typeof to.x !== 'number' || typeof to.y !== 'number') {
        return null;
      }
      
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length === 0 || !isFinite(length)) {
        return null;
      }
      
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      return (
        <View
          key={`${from.x},${from.y}-${to.x},${to.y}`}
          style={[
            styles.connectionLine,
            {
              width: length,
              left: from.x,
              top: from.y,
              transform: [
                { translateX: -1.5 },
                { translateY: -1.5 },
                { rotate: `${angle}deg` },
              ],
              transformOrigin: 'left center',
            },
          ]}
        />
      );
    };

    const start = getPosition(cell1.row, cell1.col);
    const end = getPosition(cell2.row, cell2.col);

    return (
      <>
        {cornerPoints ? (
          // 两个转角的情况
          <>
            {renderLine(start, getPosition(cornerPoints[0].row, cornerPoints[0].col))}
            {renderLine(
              getPosition(cornerPoints[0].row, cornerPoints[0].col),
              getPosition(cornerPoints[1].row, cornerPoints[1].col)
            )}
            {renderLine(getPosition(cornerPoints[1].row, cornerPoints[1].col), end)}
          </>
        ) : cornerPoint ? (
          // 一个转角的情况
          <>
            {renderLine(start, getPosition(cornerPoint.row, cornerPoint.col))}
            {renderLine(getPosition(cornerPoint.row, cornerPoint.col), end)}
          </>
        ) : (
          // 直线的情况
          renderLine(start, end)
        )}
      </>
    );
  }, [connection, game]);

  const renderGameBoard = useMemo(() => (
    <View style={styles.gameBoard}>
      {game?.board.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((emoji, j) => {
            const isSelected = game.selectedCells.some(
              cell => cell.row === i && cell.col === j
            );
            return (
              <TouchableOpacity
                key={`${i}-${j}`}
                style={[
                  styles.cell,
                  isSelected && styles.selectedCell,
                ]}
                onPress={() => game.handleCellPress(i, j)}
                disabled={!isPlaying}
              >
                <Text style={styles.emoji}>{emoji || ''}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      {renderConnection}
    </View>
  ), [game, isPlaying, renderConnection]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>分数: {score}</Text>
        <Text style={styles.headerText}>时间: {timeLeft}</Text>
      </View>

      {renderGameBoard}

      <TouchableOpacity
        style={styles.button}
        onPress={isPlaying ? null : startGame}
      >
        <Text style={styles.buttonText}>
          {isPlaying ? '游戏进行中' : '开始游戏'}
        </Text>
      </TouchableOpacity>

      {gameOver && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>游戏结束 😈</Text>
            <Text style={styles.modalText}>最终得分：{score}</Text>
            <Text style={styles.scoreEmoji}>
              {score >= 200 ? '🏆' : score >= 150 ? '🌟' : score >= 100 ? '😎' : score >= 50 ? '🙂' : '😢'}
            </Text>
            <TouchableOpacity style={styles.button} onPress={restartGame}>
              <Text style={styles.buttonText}>再来一局 🎮</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    backgroundImage: 'linear-gradient(135deg, #1e90ff, #ff69b4)',
    minHeight: '100vh',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameBoard: {
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'center',
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 2,
    borderRadius: 5,
  },
  emoji: {
    fontSize: 24,
  },
  button: {
    backgroundColor: '#1e90ff',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
  scoreEmoji: {
    fontSize: 48,
    marginVertical: 20,
  },
  selectedCell: {
    backgroundColor: '#ffeb3b',
    transform: [{ scale: 1.1 }],
  },
  connectionLine: {
    position: 'absolute',
    backgroundColor: '#ffeb3b',
    height: 3,
    zIndex: 100,
    opacity: 0.8,
    borderRadius: 1.5,
    pointerEvents: 'none',
  },
}); 