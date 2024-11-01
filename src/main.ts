import { Karbitculator } from './karbitculator'
import { encodeToBase64 } from './utils'

interface Stop {
  id: number
  stopName: string
  line: string
  popularity: number
}

const MAX_CHECKED_COUNT = 3

function getRandomInRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const stops: Stop[] = []
const stopListElement = document.querySelector<HTMLUListElement>('#stop-list')
const stopListInputTemplate = document.querySelector<HTMLTemplateElement>('#stop-list-item')

function handleStopOnChecked() {
  stopListElement!.classList.add('border-transparent')
  stopListElement!.classList.remove('border-red-500')
  stopListElement!.nextElementSibling?.classList.add('hidden')
  stopListElement!.nextElementSibling?.classList.remove('block')

  const checkedLength = stopListElement!.querySelectorAll('input:checked').length
  if (checkedLength >= MAX_CHECKED_COUNT) {
    for (const unchecked of stopListElement!.querySelectorAll<HTMLInputElement>('input:not(:checked)')) {
      unchecked.disabled = true
    }
  } else {
    for (const unchecked of stopListElement!.querySelectorAll<HTMLInputElement>('input:not(:checked)')) {
      unchecked.disabled = false
    }
  }
}

async function setup() {
  const csvRequest = await fetch('/data/stops.csv')
  if (!csvRequest.ok || csvRequest.status !== 200) {
    alert('Tidak dapat memuat data, silakan refresh untuk mencoba lagi')
    return
  }

  const csvContent = await csvRequest.text()
  const rows = csvContent.split(/[\n\r]/g)

  // 0 is csv header, skip it
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue

    const [id, stopName, line, popularity] = row.split(/,/g)
    stops.push({
      id: Number.parseInt(id),
      stopName,
      line,
      popularity: Number.parseInt(popularity)
    })
  }
}

function loadStops(count = 10) {
  const usedIndex: Number[] = []

  for (let i = 0; i < count; i++) {
    let index = getRandomInRange(0, stops.length - 1)
    while (usedIndex.includes(index)) {
      index = getRandomInRange(0, stops.length - 1)
    }

    const stop = stops[index]

    const cloned = stopListInputTemplate!.content.cloneNode(true) as HTMLElement
    const checkbox = cloned.querySelector<HTMLInputElement>('.stop-list-checkbox')
    const label = cloned.querySelector<HTMLInputElement>('.stop-list-label')
    checkbox!.value = stop.id.toString()
    checkbox!.addEventListener('change', handleStopOnChecked)
    label!.textContent = stop.stopName

    stopListElement?.appendChild(cloned)
    usedIndex.push(index)
  }
}

function calculateKarbitScore(name: string, stopIds: number[]) {
  const selectedStops = stops.filter((stop) => stopIds.includes(stop.id))
  const totalStopPopularity = selectedStops.reduce((acc, item) => acc += item.popularity, 0)
  const { score, title } = new Karbitculator().calculateScoreFromPopularity(totalStopPopularity)
  const hashData = [name, stopIds.join(','), score, title, new Date().getTime()]
  const hash = encodeToBase64(hashData.join(';'))
  return {
    name: encodeURI(name),
    score,
    title,
    hash
  }
}

await setup()
loadStops()

document.querySelector('form')?.addEventListener('submit', (e) => {
  e.preventDefault()
  const formData = new FormData(e.currentTarget as HTMLFormElement)
  const name = formData.get('name')
  const selectedStopIDs = formData.getAll('selectedStops')

  if (!selectedStopIDs || selectedStopIDs.length === 0 || selectedStopIDs.length !== MAX_CHECKED_COUNT) {
    stopListElement?.classList.remove('border-transparent')
    stopListElement?.classList.add('border-red-500')
    stopListElement?.nextElementSibling?.classList.remove('hidden')
    stopListElement?.nextElementSibling?.classList.add('block')

    return
  } else {
    stopListElement?.classList.add('border-transparent')
    stopListElement?.classList.remove('border-red-500')
    stopListElement?.nextElementSibling?.classList.add('hidden')
    stopListElement?.nextElementSibling?.classList.remove('block')
  }

  const { hash } = calculateKarbitScore(name?.toString() ?? '', selectedStopIDs.map(selectedStopID => Number.parseInt(selectedStopID.toString())))

  window.location.href = `/result?hash=${hash}`
})
