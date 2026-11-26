import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
import { ChessGame, Profile } from '../types';
import { api } from '../api';
import { ChessPiece } from './ChessPieces';
import { playChessMoveSound, playChessCheckSound, playVictorySound } from '../utils/chessAudio';
import {
  X,
  RotateCcw,
  Flag,
  Swords,
  Crown,
  ChevronLeft,
  MessageCircle,
  Sparkles,
  Trophy,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface ChessModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  profiles: Profile[];
  initialGameId?: string | null;
  targetOpponentId?: string | null;
  onOpenMessagesWithUser?: (userId: string) => void;
  onToast: (msg: string) => void;
}

export const ChessModal: React.FC<ChessModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  profiles,
  initialGameId,
  targetOpponentId,
  onOpenMessagesWithUser,
  onToast,
}) => {
  const [games, setGames] = useState<ChessGame[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(initialGameId || null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New challenge state
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>(
    targetOpponentId || profiles.find((p) => p.id !== currentUserId)?.id || 'u_maya'
  );
  const [colorPref, setColorPref] = useState<'w' | 'b' | 'random'>('random');

  // Load games
  const loadGames = useCallback(async () => {
    try {
      setIsLoading(true);
      const userGames = await api.getChessGames(currentUserId);
      setGames(userGames);
      if (!activeGameId && userGames.length > 0) {
        // If an initialGameId was provided, pick it; otherwise pick most recent in_progress
        const target = initialGameId
          ? userGames.find((g) => g.id === initialGameId)
          : userGames.find((g) => g.status === 'in_progress') || userGames[0];
        if (target) setActiveGameId(target.id);
      }
    } catch {
      onToast('Failed to load chess games');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, activeGameId, initialGameId, onToast]);

  useEffect(() => {
    if (isOpen) {
      loadGames();
    }
  }, [isOpen, loadGames]);

  useEffect(() => {
    if (initialGameId) {
      setActiveGameId(initialGameId);
    }
  }, [initialGameId]);

  useEffect(() => {
    if (targetOpponentId) {
      setSelectedOpponentId(targetOpponentId);
    }
  }, [targetOpponentId]);

  const activeGame = useMemo(() => {
    return games.find((g) => g.id === activeGameId) || null;
  }, [games, activeGameId]);

  // Chess.js instance for the active game
  const chessInstance = useMemo(() => {
    if (!activeGame) return new Chess();
    try {
      return new Chess(activeGame.fen);
    } catch {
      return new Chess();
    }
  }, [activeGame?.fen]);

  const isUserWhite = activeGame ? activeGame.whiteId === currentUserId : true;
  const isUserBlack = activeGame ? activeGame.blackId === currentUserId : false;
  const isSpectator = !isUserWhite && !isUserBlack;
  const isMyTurn =
    activeGame &&
    activeGame.status === 'in_progress' &&
    ((activeGame.turn === 'w' && isUserWhite) || (activeGame.turn === 'b' && isUserBlack));

  // Determine legal destination squares for the currently selected square
  const legalDestinations = useMemo(() => {
    if (!selectedSquare || !isMyTurn) return [];
    try {
      const moves = chessInstance.moves({ square: selectedSquare as any, verbose: true });
      return moves.map((m) => m.to);
    } catch {
      return [];
    }
  }, [chessInstance, selectedSquare, isMyTurn]);

  // Captured pieces calculation
  const capturedPieces = useMemo(() => {
    if (!activeGame) return { white: [], black: [] };
    const startingPieceCounts = { p: 8, r: 2, n: 2, b: 2, q: 1 };
    const currentCounts = {
      w: { p: 0, r: 0, n: 0, b: 0, q: 0 },
      b: { p: 0, r: 0, n: 0, b: 0, q: 0 },
    };

    const board = chessInstance.board();
    for (const row of board) {
      for (const piece of row) {
        if (piece && piece.type !== 'k') {
          currentCounts[piece.color][piece.type]++;
        }
      }
    }

    const whiteCaptured: string[] = []; // pieces lost by white (captured by black)
    const blackCaptured: string[] = []; // pieces lost by black (captured by white)

    (['q', 'r', 'b', 'n', 'p'] as const).forEach((t) => {
      const diffW = startingPieceCounts[t] - currentCounts.w[t];
      for (let i = 0; i < diffW; i++) whiteCaptured.push(t);

      const diffB = startingPieceCounts[t] - currentCounts.b[t];
      for (let i = 0; i < diffB; i++) blackCaptured.push(t);
    });

    return { white: whiteCaptured, black: blackCaptured };
  }, [chessInstance, activeGame]);

  if (!isOpen) return null;

  // Handle Square Click
  const handleSquareClick = async (squareKey: string) => {
    if (!activeGame || !isMyTurn || isSubmittingMove) return;

    const piece = chessInstance.get(squareKey as any);

    // If tapping another piece of the player's own color, switch selection
    const myColor = isUserWhite ? 'w' : 'b';
    if (piece && piece.color === myColor) {
      setSelectedSquare(squareKey === selectedSquare ? null : squareKey);
      return;
    }

    // If a piece was already selected and this square is a legal destination
    if (selectedSquare && legalDestinations.includes(squareKey)) {
      const movingPiece = chessInstance.get(selectedSquare as any);

      // Check for pawn promotion
      const isPromotion =
        movingPiece?.type === 'p' &&
        ((movingPiece.color === 'w' && squareKey.endsWith('8')) ||
          (movingPiece.color === 'b' && squareKey.endsWith('1')));

      if (isPromotion) {
        setPromotionMove({ from: selectedSquare, to: squareKey });
        return;
      }

      await executeMove(selectedSquare, squareKey);
    } else {
      setSelectedSquare(null);
    }
  };

  // Execute Move API
  const executeMove = async (from: string, to: string, promotion = 'q') => {
    if (!activeGame) return;
    setIsSubmittingMove(true);
    try {
      const destPiece = chessInstance.get(to as any);
      const isCapture = Boolean(destPiece);

      playChessMoveSound(isCapture);

      const updatedGame = await api.makeChessMove(activeGame.id, {
        from,
        to,
        promotion,
        userId: currentUserId,
      });

      setSelectedSquare(null);
      setPromotionMove(null);

      // Check audio cues
      const newChess = new Chess(updatedGame.fen);
      if (newChess.isCheckmate() || updatedGame.status === 'checkmate') {
        playVictorySound();
        onToast(updatedGame.winnerId === currentUserId ? 'Checkmate! You win! 🏆' : 'Checkmate!');
      } else if (newChess.inCheck()) {
        playChessCheckSound();
        onToast('Check!');
      }

      setGames((prev) => prev.map((g) => (g.id === updatedGame.id ? updatedGame : g)));
    } catch (err: any) {
      onToast(err.message || 'Illegal move');
      setSelectedSquare(null);
    } finally {
      setIsSubmittingMove(false);
    }
  };

  // Create Challenge
  const handleCreateChallenge = async () => {
    try {
      setIsLoading(true);
      const newGame = await api.createChessGame({
        challengerId: currentUserId,
        opponentId: selectedOpponentId,
        colorPreference: colorPref,
      });
      setGames((prev) => [newGame, ...prev]);
      setActiveGameId(newGame.id);
      onToast('Chess challenge sent! ♟️');
    } catch {
      onToast('Failed to create chess challenge');
    } finally {
      setIsLoading(false);
    }
  };

  // Resign
  const handleResign = async () => {
    if (!activeGame) return;
    try {
      const updated = await api.resignChessGame(activeGame.id, currentUserId);
      setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      onToast('You resigned the game');
    } catch {
      onToast('Failed to resign game');
    }
  };

  // Board orientation: White is on bottom if user is White; Black on bottom if user is Black
  const ranks = isUserBlack ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];
  const files = isUserBlack ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const opponent = activeGame
    ? profiles.find((p) => p.id === (isUserWhite ? activeGame.blackId : activeGame.whiteId)) || {
        id: isUserWhite ? activeGame.blackId : activeGame.whiteId,
        name: isUserWhite ? activeGame.blackName : activeGame.whiteName,
        pic: isUserWhite ? activeGame.blackPic : activeGame.whitePic,
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-[var(--bg)] border border-[var(--ln)] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10 transition-colors">
        {/* Modal Header */}
        <div className="p-3.5 border-b border-[var(--ln)] flex items-center justify-between bg-[var(--card)]/50">
          <div className="flex items-center gap-2">
            {activeGame ? (
              <button
                onClick={() => setActiveGameId(null)}
                className="p-1 rounded-lg text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)] transition-colors cursor-pointer"
                title="Back to game lobby"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : null}

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-xs">
              <Swords className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[var(--tx)]">
                  {activeGame ? 'Chess Arena' : 'Chess Lobby'}
                </h2>
                {activeGame && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      activeGame.status === 'in_progress'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {activeGame.status === 'in_progress'
                      ? isMyTurn
                        ? 'Your Turn'
                        : "Opponent's Turn"
                      : activeGame.status.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--mu)]">
                {activeGame ? `vs ${opponent?.name || 'Opponent'}` : 'Challenge creators & play in real time'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeGame && opponent && onOpenMessagesWithUser && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMessagesWithUser(opponent.id);
                }}
                className="p-2 rounded-xl text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)] transition-colors cursor-pointer"
                title="Message opponent"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)] transition-colors cursor-pointer"
              aria-label="Close chess arena"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {activeGame ? (
            <div className="flex flex-col items-center max-w-sm mx-auto">
              {/* Opponent Banner */}
              <div className="w-full flex items-center justify-between p-2 rounded-2xl bg-[var(--card)] border border-[var(--ln)] mb-2 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <img
                    src={
                      opponent?.pic ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={opponent?.name}
                    className="w-9 h-9 rounded-full object-cover border border-[var(--ln)]"
                  />
                  <div>
                    <div className="text-xs font-bold text-[var(--tx)] flex items-center gap-1.5">
                      <span>{opponent?.name}</span>
                      <span className="text-[10px] text-[var(--mu)]">
                        ({isUserWhite ? 'Black' : 'White'})
                      </span>
                    </div>
                    {/* Captured pieces by opponent */}
                    <div className="flex items-center gap-0.5 mt-0.5 h-4">
                      {(isUserWhite ? capturedPieces.white : capturedPieces.black).map((p, idx) => (
                        <ChessPiece
                          key={idx}
                          type={p as any}
                          color={isUserWhite ? 'w' : 'b'}
                          className="w-3.5 h-3.5 opacity-80"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {!isMyTurn && activeGame.status === 'in_progress' && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    <span>Thinking...</span>
                  </div>
                )}
              </div>

              {/* 8x8 Chessboard */}
              <div className="w-full aspect-square border-2 border-[#80502a] dark:border-amber-950/60 rounded-xl overflow-hidden shadow-xl relative select-none">
                <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
                  {ranks.map((rank, rankIdx) =>
                    files.map((file, fileIdx) => {
                      const squareKey = `${file}${rank}`;
                      const isLight = (rankIdx + fileIdx) % 2 === 0;
                      const piece = chessInstance.get(squareKey as any);
                      const isSelected = selectedSquare === squareKey;
                      const isLegalTarget = legalDestinations.includes(squareKey);
                      const isLastMove =
                        activeGame.lastMove &&
                        (activeGame.lastMove.from === squareKey || activeGame.lastMove.to === squareKey);
                      const isKingInCheck =
                        piece?.type === 'k' &&
                        piece.color === chessInstance.turn() &&
                        chessInstance.inCheck();

                      return (
                        <div
                          key={squareKey}
                          onClick={() => handleSquareClick(squareKey)}
                          className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                            isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
                          } ${isSelected ? 'ring-3 ring-amber-400 inset-0 z-10' : ''} ${
                            isLastMove ? 'bg-amber-300/40' : ''
                          } ${isKingInCheck ? 'bg-red-500/50 animate-pulse' : ''}`}
                        >
                          {/* Coordinate label */}
                          {fileIdx === 0 && (
                            <span className="absolute top-0.5 left-1 text-[9px] font-bold opacity-40 select-none">
                              {rank}
                            </span>
                          )}
                          {rankIdx === 7 && (
                            <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-40 select-none">
                              {file}
                            </span>
                          )}

                          {/* Piece */}
                          {piece && (
                            <div
                              className={`transition-transform duration-100 ${
                                isSelected ? 'scale-110 drop-shadow-md' : 'hover:scale-105'
                              }`}
                            >
                              <ChessPiece
                                type={piece.type as any}
                                color={piece.color}
                                className="w-7 h-7 sm:w-9 sm:h-9"
                              />
                            </div>
                          )}

                          {/* Legal move destination indicator */}
                          {isLegalTarget && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              {piece ? (
                                <div className="w-full h-full border-4 border-red-500/60 rounded-sm" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full bg-emerald-700/60 shadow-xs" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pawn Promotion Dialog */}
                {promotionMove && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-20 animate-in fade-in">
                    <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--ln)] shadow-xl text-center">
                      <div className="text-xs font-bold text-[var(--tx)] mb-3">
                        Promote Your Pawn:
                      </div>
                      <div className="flex gap-2">
                        {(['q', 'r', 'b', 'n'] as const).map((pieceType) => (
                          <button
                            key={pieceType}
                            onClick={() => executeMove(promotionMove.from, promotionMove.to, pieceType)}
                            className="p-2.5 rounded-xl border border-[var(--ln)] bg-[var(--bg)] hover:bg-[var(--ac)]/10 transition-colors cursor-pointer"
                          >
                            <ChessPiece
                              type={pieceType}
                              color={isUserWhite ? 'w' : 'b'}
                              className="w-8 h-8"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Player Banner */}
              <div className="w-full flex items-center justify-between p-2 rounded-2xl bg-[var(--card)] border border-[var(--ln)] mt-2 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[var(--ac)] text-white font-bold flex items-center justify-center text-xs">
                    You
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--tx)] flex items-center gap-1.5">
                      <span>You</span>
                      <span className="text-[10px] text-[var(--mu)]">
                        ({isUserWhite ? 'White' : 'Black'})
                      </span>
                    </div>
                    {/* Captured pieces by user */}
                    <div className="flex items-center gap-0.5 mt-0.5 h-4">
                      {(isUserWhite ? capturedPieces.black : capturedPieces.white).map((p, idx) => (
                        <ChessPiece
                          key={idx}
                          type={p as any}
                          color={isUserWhite ? 'b' : 'w'}
                          className="w-3.5 h-3.5 opacity-80"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {isMyTurn && activeGame.status === 'in_progress' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <span>Your Turn</span>
                  </div>
                )}
              </div>

              {/* Move History Ticker */}
              {activeGame.history.length > 0 && (
                <div className="w-full mt-2.5 p-2 rounded-xl bg-[var(--card)]/40 border border-[var(--ln)] flex items-center gap-2 overflow-x-auto text-[11px] text-[var(--mu)] scrollbar-none">
                  <span className="font-semibold shrink-0 text-[var(--tx)]">Moves:</span>
                  <div className="flex items-center gap-1.5">
                    {activeGame.history.map((move, i) => (
                      <span
                        key={i}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          i === activeGame.history.length - 1
                            ? 'bg-[var(--ac)] text-white font-bold'
                            : 'bg-[var(--ln)]/40 text-[var(--tx)]'
                        }`}
                      >
                        {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}
                        {move}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Game End Banner */}
              {activeGame.status !== 'in_progress' && (
                <div className="w-full mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="text-xs font-bold text-[var(--tx)]">
                        {activeGame.status === 'checkmate'
                          ? activeGame.winnerId === currentUserId
                            ? 'Victory by Checkmate! 🎉'
                            : `${opponent?.name} won by Checkmate`
                          : activeGame.status === 'resigned'
                          ? `${activeGame.winnerId === currentUserId ? 'You' : opponent?.name} won by resignation`
                          : 'Game Draw'}
                      </div>
                      <div className="text-[11px] text-[var(--mu)]">
                        Match completed · Good game!
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateChallenge}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--ac)] text-white hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    Rematch
                  </button>
                </div>
              )}

              {/* Actions Footer */}
              {activeGame.status === 'in_progress' && !isSpectator && (
                <div className="w-full mt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={handleResign}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-500 border border-rose-500/20 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Resign</span>
                  </button>

                  <button
                    onClick={() => setActiveGameId(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-[var(--tx)] border border-[var(--ln)] hover:bg-[var(--card)] transition-colors cursor-pointer"
                  >
                    Game Lobby
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Lobby & Challenge Creation Screen */
            <div className="space-y-4 max-w-md mx-auto">
              {/* Challenge a Creator Card */}
              <div className="p-4 rounded-2xl border border-[var(--ln)] bg-[var(--card)] shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--tx)]">
                    New Chess Challenge
                  </h3>
                </div>

                <div className="space-y-3">
                  {/* Select Opponent */}
                  <div>
                    <label className="text-xs text-[var(--mu)] font-medium block mb-1.5">
                      Select Opponent:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {profiles
                        .filter((p) => p.id !== currentUserId)
                        .map((p) => {
                          const isSelected = selectedOpponentId === p.id;
                          return (
                            <button
                              key={p.id}
                              onClick={() => setSelectedOpponentId(p.id)}
                              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer text-left ${
                                isSelected
                                  ? 'border-[var(--ac)] bg-[var(--ac)]/10 ring-1 ring-[var(--ac)]'
                                  : 'border-[var(--ln)] bg-[var(--bg)] hover:bg-[var(--card)]'
                              }`}
                            >
                              <img
                                src={
                                  p.pic ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                                }
                                alt={p.name}
                                className="w-7 h-7 rounded-full object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-[var(--tx)] truncate">
                                  {p.name}
                                </div>
                                <div className="text-[10px] text-[var(--mu)] truncate">
                                  @{p.username || 'creator'}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Color Preference */}
                  <div>
                    <label className="text-xs text-[var(--mu)] font-medium block mb-1.5">
                      Play As:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setColorPref('w')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          colorPref === 'w'
                            ? 'border-[var(--ac)] bg-[var(--ac)] text-white shadow-xs'
                            : 'border-[var(--ln)] bg-[var(--bg)] text-[var(--tx)] hover:bg-[var(--card)]'
                        }`}
                      >
                        <ChessPiece type="k" color="w" className="w-4 h-4" />
                        <span>White</span>
                      </button>

                      <button
                        onClick={() => setColorPref('b')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          colorPref === 'b'
                            ? 'border-[var(--ac)] bg-[var(--ac)] text-white shadow-xs'
                            : 'border-[var(--ln)] bg-[var(--bg)] text-[var(--tx)] hover:bg-[var(--card)]'
                        }`}
                      >
                        <ChessPiece type="k" color="b" className="w-4 h-4" />
                        <span>Black</span>
                      </button>

                      <button
                        onClick={() => setColorPref('random')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          colorPref === 'random'
                            ? 'border-[var(--ac)] bg-[var(--ac)] text-white shadow-xs'
                            : 'border-[var(--ln)] bg-[var(--bg)] text-[var(--tx)] hover:bg-[var(--card)]'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Random</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateChallenge}
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[var(--ac)] text-white hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Swords className="w-4 h-4" />
                    <span>Send Chess Challenge</span>
                  </button>
                </div>
              </div>

              {/* Active & Recent Matches */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2 px-1">
                  Your Matches ({games.length})
                </h4>

                {games.length > 0 ? (
                  <div className="space-y-2">
                    {games.map((g) => {
                      const isWhite = g.whiteId === currentUserId;
                      const opponentName = isWhite ? g.blackName : g.whiteName;
                      const opponentPic = isWhite ? g.blackPic : g.whitePic;
                      const isTurn =
                        g.status === 'in_progress' &&
                        ((g.turn === 'w' && isWhite) || (g.turn === 'b' && !isWhite));

                      return (
                        <div
                          key={g.id}
                          onClick={() => setActiveGameId(g.id)}
                          className="p-3 rounded-2xl border border-[var(--ln)] bg-[var(--card)] hover:border-[var(--ac)] transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                opponentPic ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                              }
                              alt={opponentName}
                              className="w-10 h-10 rounded-full object-cover border border-[var(--ln)]"
                            />
                            <div>
                              <div className="text-xs font-bold text-[var(--tx)] flex items-center gap-1.5">
                                <span>vs {opponentName}</span>
                                <span className="text-[10px] text-[var(--mu)]">
                                  ({isWhite ? 'White' : 'Black'})
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--mu)] mt-0.5">
                                {g.status === 'in_progress' ? (
                                  isTurn ? (
                                    <span className="text-emerald-500 font-semibold">Your turn to move!</span>
                                  ) : (
                                    <span>Waiting for opponent...</span>
                                  )
                                ) : (
                                  <span>Game {g.status.replace('_', ' ')}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveGameId(g.id);
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--ac)] text-white group-hover:opacity-90 transition-opacity flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <span>Play</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-[var(--ln)] text-[var(--mu)]">
                    <Swords className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                    <p className="text-xs font-semibold text-[var(--tx)]">No chess matches yet</p>
                    <p className="text-[11px] mt-0.5">
                      Select a creator above and send your first challenge!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
