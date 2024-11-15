import { decodeFromBase64 } from './utils'
import QRCode from 'qrcode'

type DecodedHash = `${string};${string};${string};${string};${string}`

const hash = new URLSearchParams(window.location.search).get('hash') as DecodedHash | null

async function setup() {
  if (!hash) {
    document.querySelector('.loading')?.classList.add('hidden')
    document.querySelector('.not-found')?.classList.remove('hidden')
    document.querySelector('.not-found')?.classList.add('flex')
    return
  }

  const decoded = decodeFromBase64(hash)
  const [name,, score, title, date] = decoded.split(';')
  const parsedDate = new Date(Number.parseInt(date))
  const qrCodeDataURL = await QRCode.toDataURL(window.location.href, { margin: 0, color: { light: '#00000000' } })

  document.querySelector('#name')!.textContent = decodeURI(name)
  document.querySelector('#score')!.textContent = `${score}%`
  document.querySelector('#title')!.textContent = `${title}`
  document.querySelector('#date')!.textContent = parsedDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  document.querySelector<HTMLImageElement>('#qr-code')!.src = qrCodeDataURL

  document.querySelector('.loading')?.classList.add('hidden')
  document.querySelector('.result')?.classList.remove('hidden')
  document.querySelector('.result')?.classList.add('flex')
  document.querySelector('.buttons')?.classList.remove('hidden')
  document.querySelector('.buttons')?.classList.add('flex')

}

setup()

document.querySelector('#share')?.addEventListener('click', () => {
  navigator.share({
    title: 'Sertifikat Karbit - Karbitrans',
    url: window.location.href,
    text: 'Ini sertifikat kekarbitan gue, mana punya lo?'
  })
})
