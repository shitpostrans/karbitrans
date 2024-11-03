import { Karbitculator } from './karbitculator'
import { encodeToBase64 } from './utils'

interface Stop {
  id: number
  stopName: string
  line: string
  popularity: number
}

let currentStep = 1
const usedIndex: Number[] = []

function getRandomInRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const stops: Stop[] = []
const stopListInputTemplate = document.querySelector<HTMLTemplateElement>('#stop-list-item')

function handleStopOnChecked(e: Event) {
  const stopListElement = (e.currentTarget as HTMLElement).closest('.stop-list')

  stopListElement!.classList.add('border-transparent')
  stopListElement!.classList.remove('border-red-500')
  stopListElement!.nextElementSibling?.classList.add('hidden')
  stopListElement!.nextElementSibling?.classList.remove('block')
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

function getStops(count = 10) {
  const returningStops: Stop[] = []

  for (let i = 0; i < count; i++) {
    let index = getRandomInRange(0, stops.length - 1)
    while (usedIndex.includes(index)) {
      index = getRandomInRange(0, stops.length - 1)
    }

    const stop = stops[index]

    returningStops.push(stop)
    usedIndex.push(index)
  }

  return returningStops
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

async function bootstrap() {
  await setup()

  // Load stops for step 2-4
  for (let i = 2; i < 5; i++) {
    const stops = getStops(4)
    const stopListElement = document.querySelector(`.step-${i} .stop-list`)

    for (const stop of stops) {
      const cloned = stopListInputTemplate!.content.cloneNode(true) as HTMLElement
      const checkbox = cloned.querySelector<HTMLInputElement>('.stop-list-checkbox')
      const label = cloned.querySelector<HTMLInputElement>('.stop-list-label')
      checkbox!.value = stop.id.toString()
      checkbox!.addEventListener('change', handleStopOnChecked)
      checkbox!.name = `${checkbox!.name}-step-${i}`
      label!.textContent = stop.stopName

      stopListElement?.appendChild(cloned)
    }
  }
}

bootstrap()

document.querySelector('form')?.addEventListener('submit', (e) => {
  e.preventDefault()
  const formData = new FormData(e.currentTarget as HTMLFormElement)
  const name = formData.get('name')
  const selectedStopIDs = Array.from(formData.entries()).filter(([key]) => key.startsWith('selectedStops')).map(([, value]) => Number.parseInt(value.toString()))
  console.log(selectedStopIDs)
  const { hash } = calculateKarbitScore(name?.toString() ?? '', selectedStopIDs)

  window.location.href = `/result?hash=${hash}`
})

function validateCurrentStep(value: FormDataEntryValue | null) {
  const selectedStopValue = value
  const stopListElement = document.querySelector(`.step-${currentStep} .stop-list`)
  if (!selectedStopValue || !selectedStopValue.toString()) {
    stopListElement?.classList.remove('border-transparent')
    stopListElement?.classList.add('border-red-500')
    stopListElement?.nextElementSibling?.classList.remove('hidden')
    stopListElement?.nextElementSibling?.classList.add('block')
    return false
  }

  stopListElement?.classList.add('border-transparent')
  stopListElement?.classList.remove('border-red-500')
  stopListElement?.nextElementSibling?.classList.add('hidden')
  stopListElement?.nextElementSibling?.classList.remove('block')

  return true
}

document.querySelector('#next-button')?.addEventListener('click', (e) => {
  const nextButton = e.currentTarget as HTMLButtonElement
  const formData = new FormData(document.querySelector('form') as HTMLFormElement)
  const name = formData.get('name')

  if (currentStep === 1) {
    if (!name) {
      document.querySelector('#name')?.classList.add('border-red-500')
      document.querySelector('#name')?.classList.remove('border-orange-950')
      const nameErrorElement = document.querySelector('#name')?.nextElementSibling
      if (nameErrorElement) {
        nameErrorElement.textContent = 'Isi nama dulu, bit'
      }
    } else {
      document.querySelector('#name')?.classList.remove('border-red-500')
      document.querySelector('#name')?.classList.add('border-orange-950')
      const nameErrorElement = document.querySelector('#name')?.nextElementSibling
      if (nameErrorElement) {
        nameErrorElement.textContent = ''
      }

      nextButton.querySelector('span')!.textContent = 'Lanjut'
      nextButton.classList.remove('w-full')
      nextButton.classList.add('flex-1')
      document.querySelector('#prev-button')!.classList.remove('hidden')
      document.querySelector('#prev-button')!.classList.add('flex')

      document.querySelector('#disclaimer')?.classList.add('hidden')
      document.querySelector('.socials')?.classList.add('hidden')
      document.querySelector('.socials')?.classList.remove('flex')
      document.querySelector('.step-1')?.classList.add('hidden')
      document.querySelector('.step-2')?.classList.remove('hidden')


      currentStep += 1
    }

    return
  }

  if (currentStep >= 2 && currentStep < 3) {
    const selectedStop = formData.get(`selectedStops-step-${currentStep}`)
    const isStepValid = validateCurrentStep(selectedStop)

    if (isStepValid) {
      document.querySelector(`.step-${currentStep}`)?.classList.add('hidden')
      document.querySelector(`.step-${currentStep + 1}`)?.classList.remove('hidden')
      currentStep += 1
    }

    return
  }

  if (currentStep === 3) {
    const selectedStop = formData.get(`selectedStops-step-${currentStep}`)
    const isStepValid = validateCurrentStep(selectedStop)

    if (isStepValid) {
      document.querySelector(`.step-${currentStep}`)?.classList.add('hidden')
      document.querySelector(`.step-${currentStep + 1}`)?.classList.remove('hidden')
      nextButton.querySelector('span')!.textContent = 'Cek'
      currentStep += 1
    }

    return
  }

  if (currentStep === 4) {
    nextButton.type = 'submit'
  }
})

document.querySelector('#prev-button')?.addEventListener('click', (e) => {
  const prevButton = e.currentTarget as HTMLButtonElement
  const nextButton = document.querySelector<HTMLButtonElement>('#next-button')!

  if (currentStep === 2) {
    nextButton.querySelector('span')!.textContent = 'Mulai Cek Kekarbitan'
    nextButton.classList.add('w-full')
    nextButton.classList.remove('flex-1')
    prevButton.classList.add('hidden')
    prevButton.classList.remove('flex')

    document.querySelector('#disclaimer')?.classList.remove('hidden')
    document.querySelector('.socials')?.classList.remove('hidden')
    document.querySelector('.socials')?.classList.add('flex')
    document.querySelector('.step-1')?.classList.remove('hidden')
    document.querySelector('.step-2')?.classList.add('hidden')

    currentStep -= 1
    return
  }

  if (currentStep >= 3 && currentStep < 4) {
    document.querySelector(`.step-${currentStep - 1}`)?.classList.remove('hidden')
    document.querySelector(`.step-${currentStep}`)?.classList.add('hidden')

    currentStep -= 1
    return
  }

  if (currentStep === 4) {
    document.querySelector(`.step-${currentStep - 1}`)?.classList.remove('hidden')
    document.querySelector(`.step-${currentStep}`)?.classList.add('hidden')
    nextButton.querySelector('span')!.textContent = 'Lanjut'
    nextButton.type = 'button'

    currentStep -= 1
    return
  }
})

document.querySelector<HTMLInputElement>('#name')?.addEventListener('change', (e) => {
  (e.currentTarget as HTMLInputElement)?.classList.remove('border-red-500');
  (e.currentTarget as HTMLInputElement | null)?.classList.add('border-orange-950')
  const nameErrorElement = document.querySelector('#name')?.nextElementSibling
  if (nameErrorElement) {
    nameErrorElement.textContent = ''
  }
})
