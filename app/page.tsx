"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Clock, Trophy, Play, Square, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

type GameState = "lobby" | "playing" | "scoring" | "results"
type Player = {
  id: string
  name: string
  score: number
  answers: Record<string, string>
  isReady: boolean
}

const CATEGORIES = ["Nombre", "Animal", "Cosa", "País", "Comida", "Profesión"]

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export default function TuttiFruttiGame() {
  const [gameState, setGameState] = useState<GameState>("lobby")
  const [currentLetter, setCurrentLetter] = useState("")
  const [timeLeft, setTimeLeft] = useState(60)
  const [round, setRound] = useState(1)
  const [players, setPlayers] = useState<Player[]>([
    {
      id: "1",
      name: "Tú",
      score: 0,
      answers: {},
      isReady: false,
    },
    {
      id: "2",
      name: "Ana",
      score: 0,
      answers: {},
      isReady: false,
    },
    {
      id: "3",
      name: "Carlos",
      score: 0,
      answers: {},
      isReady: false,
    },
  ])
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({})
  const [playerName, setPlayerName] = useState("")
  const [hasJoined, setHasJoined] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!hasJoined) {
      router.push("/auth")
    }
  }, [hasJoined, router])

  // Timer effect
  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (gameState === "playing" && timeLeft === 0) {
      handleTimeUp()
    }
  }, [gameState, timeLeft])

  const joinGame = () => {
    if (playerName.trim()) {
      setPlayers((prev) => prev.map((p) => (p.id === "1" ? { ...p, name: playerName } : p)))
      setHasJoined(true)
    }
  }

  const startGame = () => {
    const randomLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)]
    setCurrentLetter(randomLetter)
    setTimeLeft(60)
    setGameState("playing")
    setCurrentAnswers({})

    // Simulate other players getting ready
    setPlayers((prev) => prev.map((p) => ({ ...p, isReady: true, answers: {} })))
  }

  const handleAnswerChange = (category: string, value: string) => {
    setCurrentAnswers((prev) => ({
      ...prev,
      [category]: value,
    }))
  }

  const handleTimeUp = () => {
    // Save current player's answers
    setPlayers((prev) => prev.map((p) => (p.id === "1" ? { ...p, answers: currentAnswers } : p)))

    // Simulate other players' answers
    simulateOtherPlayersAnswers()
    setGameState("scoring")
  }

  const simulateOtherPlayersAnswers = () => {
    const sampleAnswers = {
      Ana: {
        Nombre: currentLetter === "A" ? "Ana" : currentLetter === "C" ? "Carlos" : "María",
        Animal: currentLetter === "A" ? "Águila" : currentLetter === "C" ? "Caballo" : "Perro",
        Cosa: currentLetter === "A" ? "Auto" : currentLetter === "C" ? "Casa" : "Mesa",
        País: currentLetter === "A" ? "Argentina" : currentLetter === "C" ? "Colombia" : "México",
        Comida: currentLetter === "A" ? "Arroz" : currentLetter === "C" ? "Carne" : "Pizza",
        Profesión: currentLetter === "A" ? "Abogado" : currentLetter === "C" ? "Chef" : "Doctor",
      },
      Carlos: {
        Nombre: currentLetter === "A" ? "Alberto" : currentLetter === "C" ? "Carmen" : "Luis",
        Animal: currentLetter === "A" ? "Araña" : currentLetter === "C" ? "Conejo" : "Gato",
        Cosa: currentLetter === "A" ? "Avión" : currentLetter === "C" ? "Computadora" : "Libro",
        País: currentLetter === "A" ? "Australia" : currentLetter === "C" ? "Chile" : "Brasil",
        Comida: currentLetter === "A" ? "Arepas" : currentLetter === "C" ? "Chocolate" : "Tacos",
        Profesión: currentLetter === "A" ? "Arquitecto" : currentLetter === "C" ? "Contador" : "Enfermero",
      },
    }

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === "2") return { ...p, answers: sampleAnswers["Ana"] }
        if (p.id === "3") return { ...p, answers: sampleAnswers["Carlos"] }
        return p
      }),
    )
  }

  const calculateScores = () => {
    const newPlayers = players.map((player) => {
      let roundScore = 0

      CATEGORIES.forEach((category) => {
        const answer = player.answers[category]
        if (answer && answer.toLowerCase().startsWith(currentLetter.toLowerCase())) {
          // Check if answer is unique
          const otherAnswers = players.filter((p) => p.id !== player.id).map((p) => p.answers[category]?.toLowerCase())

          if (!otherAnswers.includes(answer.toLowerCase())) {
            roundScore += 10 // Unique answer
          } else {
            roundScore += 5 // Repeated answer
          }
        }
      })

      return { ...player, score: player.score + roundScore }
    })

    setPlayers(newPlayers)
    setGameState("results")
  }

  const nextRound = () => {
    setRound((prev) => prev + 1)
    startGame()
  }

  const resetGame = () => {
    setGameState("lobby")
    setRound(1)
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0, answers: {}, isReady: false })))
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-cyan-900/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <Card className="w-full max-w-md bg-black/80 border-cyan-500/50 shadow-2xl shadow-cyan-500/25 backdrop-blur-sm relative z-10">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50 animate-pulse">
              <Zap className="h-10 w-10 text-black" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              TUTTI FRUTTI
            </CardTitle>
            <div className="text-cyan-300 font-mono text-lg tracking-wider">⚡ NEON EDITION ⚡</div>
            <p className="text-gray-300">Ingresa tu nombre para comenzar</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <Input
                placeholder="Tu nombre"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && joinGame()}
                className="bg-gray-900/50 border-cyan-500/50 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/50 focus:shadow-lg focus:shadow-cyan-500/25 transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 rounded-md blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
            <Button
              onClick={joinGame}
              className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-black font-bold py-3 shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/75 transition-all duration-300 transform hover:scale-105"
              disabled={!playerName.trim()}
            >
              <Play className="mr-2 h-5 w-5" />
              ENTRAR AL JUEGO
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-pink-900/10 to-cyan-900/10"></div>
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-black/80 border border-cyan-500/50 rounded-lg shadow-2xl shadow-cyan-500/25 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                ⚡ TUTTI FRUTTI
              </h1>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg shadow-purple-500/50">
                RONDA {round}
              </Badge>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-cyan-300">
                <Users className="h-5 w-5" />
                <span className="font-mono">{players.length} PLAYERS</span>
              </div>
              {gameState === "playing" && (
                <div className="flex items-center gap-2 text-pink-300">
                  <Clock className="h-5 w-5 animate-pulse" />
                  <span className="font-mono text-2xl font-bold">{timeLeft}s</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Players Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-black/80 border-purple-500/50 shadow-2xl shadow-purple-500/25 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-300">
                  <Trophy className="h-5 w-5" />
                  JUGADORES
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className="p-4 bg-gray-900/50 border border-cyan-500/30 rounded-lg hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/25">
                          <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-pink-500 text-black font-bold">
                            {player.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-white">{player.name}</p>
                          <p className="text-cyan-300 font-mono">{player.score} PTS</p>
                        </div>
                      </div>
                      {gameState === "playing" && player.isReady && (
                        <Badge className="bg-gradient-to-r from-green-400 to-cyan-400 text-black border-0 animate-pulse">
                          LIVE
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Game Area */}
          <div className="lg:col-span-3">
            {gameState === "lobby" && (
              <Card className="bg-black/80 border-pink-500/50 shadow-2xl shadow-pink-500/25 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4">
                  <CardTitle className="text-3xl bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                    ¡LISTOS PARA LA BATALLA!
                  </CardTitle>
                  <p className="text-gray-300 text-lg">
                    Completa las categorías con palabras que empiecen con la letra indicada
                  </p>
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    onClick={startGame}
                    size="lg"
                    className="bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 text-black font-bold text-xl px-8 py-4 shadow-2xl shadow-pink-500/50 hover:shadow-cyan-500/75 transition-all duration-300 transform hover:scale-110"
                  >
                    <Play className="h-6 w-6 mr-2" />
                    INICIAR PARTIDA
                  </Button>
                </CardContent>
              </Card>
            )}

            {gameState === "playing" && (
              <Card className="bg-black/80 border-cyan-500/50 shadow-2xl shadow-cyan-500/25 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-cyan-300 text-xl font-bold">LETRA:</span>
                      <div className="relative">
                        <span className="text-8xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                          {currentLetter}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-pink-400 blur-xl opacity-30 animate-pulse"></div>
                      </div>
                    </div>
                    <Button
                      onClick={handleTimeUp}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-bold px-6 py-3 shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/75 transition-all duration-300 transform hover:scale-105"
                    >
                      <Square className="h-5 w-5 mr-2" />
                      ¡STOP!
                    </Button>
                  </div>
                  <div className="relative">
                    <Progress value={((60 - timeLeft) / 60) * 100} className="w-full h-3 bg-gray-800" />
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full blur opacity-50"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {CATEGORIES.map((category, index) => (
                      <div key={category} className="space-y-3">
                        <label className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                          {category}
                        </label>
                        <div className="relative">
                          <Input
                            placeholder={`${category} con ${currentLetter}...`}
                            value={currentAnswers[category] || ""}
                            onChange={(e) => handleAnswerChange(category, e.target.value)}
                            className="bg-gray-900/50 border-purple-500/50 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/50 focus:shadow-lg focus:shadow-cyan-500/25 transition-all duration-300 text-lg py-3"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-md blur opacity-0 focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {gameState === "scoring" && (
              <Card className="bg-black/80 border-yellow-500/50 shadow-2xl shadow-yellow-500/25 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    ANALIZANDO RESPUESTAS...
                  </CardTitle>
                  <p className="text-gray-300">
                    Letra: <span className="text-yellow-400 font-bold text-xl">{currentLetter}</span>
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {CATEGORIES.map((category) => (
                      <div key={category} className="space-y-3">
                        <h3 className="text-xl font-bold text-purple-300">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {players.map((player) => (
                            <div
                              key={player.id}
                              className="p-4 bg-gray-900/50 border border-cyan-500/30 rounded-lg hover:border-cyan-400/50 transition-all duration-300"
                            >
                              <p className="text-sm font-bold text-cyan-300">{player.name}</p>
                              <p className="text-lg text-white font-mono">{player.answers[category] || "—"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 text-center">
                    <Button
                      onClick={calculateScores}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-xl px-8 py-4 shadow-2xl shadow-yellow-500/50 hover:shadow-orange-500/75 transition-all duration-300 transform hover:scale-110"
                    >
                      <Zap className="h-6 w-6 mr-2" />
                      CALCULAR PUNTOS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {gameState === "results" && (
              <Card className="bg-black/80 border-green-500/50 shadow-2xl shadow-green-500/25 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-3xl bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent text-center">
                    🏆 RESULTADOS RONDA {round} 🏆
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {players
                      .sort((a, b) => b.score - a.score)
                      .map((player, index) => (
                        <div
                          key={player.id}
                          className={`p-6 rounded-lg border-2 transition-all duration-300 ${
                            index === 0
                              ? "bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-400/50 shadow-lg shadow-yellow-500/25"
                              : "bg-gray-900/50 border-cyan-500/30 hover:border-cyan-400/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-4xl">
                                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅"}
                              </div>
                              <div>
                                <p className="text-xl font-bold text-white">{player.name}</p>
                                <p className="text-cyan-300 font-mono">Posición #{index + 1}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                                {player.score}
                              </p>
                              <p className="text-gray-300 font-mono">PUNTOS</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-8 flex gap-4 justify-center">
                    <Button
                      onClick={nextRound}
                      className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-black font-bold text-lg px-6 py-3 shadow-lg shadow-green-500/50 hover:shadow-cyan-500/75 transition-all duration-300 transform hover:scale-105"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      SIGUIENTE RONDA
                    </Button>
                    <Button
                      onClick={resetGame}
                      className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-gray-500 font-bold text-lg px-6 py-3 transition-all duration-300"
                    >
                      NUEVO JUEGO
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
