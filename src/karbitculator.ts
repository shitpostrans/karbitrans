type ScoreTableEntry = [number, number, string]

export class Karbitculator {
  maxStopPopularityScore = 5
  maxStopCount = 3
  private scoreTable: ScoreTableEntry[] = [
    [0, 50, 'Timje-ers Sejati'],
    [50, 60, 'Sobat Kepotong Dobel Lodek'],
    [60, 90, 'Pengguna Harian'],
    [90, 95, 'Karbit'],
    [95, 100, '100% Karbit']
  ]

  constructor (maxStopPopularityScore = 5, maxStopCount = 3) {
    this.maxStopPopularityScore = maxStopPopularityScore
    this.maxStopCount = maxStopCount
  }

  calculateScoreFromPopularity(totalStopPopularity: number) {
    const maxPossibleScore = this.maxStopPopularityScore * this.maxStopCount
    const scoreInPercentage = Math.floor((totalStopPopularity / maxPossibleScore) * 100)
    const title = this.scoreTable.find(([min, max]) => scoreInPercentage >= min && scoreInPercentage < max)

    return {
      score: scoreInPercentage,
      title: title?.[2] ?? ""
    }
  }
}
