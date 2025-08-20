export function isAnswerCorrect(correctAnswer, userAnswer) {
  if (correctAnswer == null) return false
  const correct = String(correctAnswer).trim()
  const user = String(userAnswer ?? '').trim()

  // Try numeric compare with small tolerance
  const correctNum = Number(correct)
  const userNum = Number(user)
  if (Number.isFinite(correctNum) && Number.isFinite(userNum)) {
    const tolerance = 1e-6
    return Math.abs(correctNum - userNum) <= tolerance
  }

  // Fallback to case-insensitive string compare
  return correct.toLowerCase() === user.toLowerCase()
}