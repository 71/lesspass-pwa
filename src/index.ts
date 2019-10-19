import { MDCChipSet }   from '@material/chips'
import { MDCRipple }    from '@material/ripple'
import { MDCSnackbar }  from '@material/snackbar'
import { MDCTextField } from '@material/textfield'

import { generatePassword } from 'lesspass'
import { createHmac }       from 'lesspass-fingerprint'

import '@material/chips/dist/mdc.chips.min.css'
import '@material/ripple/dist/mdc.ripple.min.css'
import '@material/snackbar/dist/mdc.snackbar.min.css'
import '@material/textfield/dist/mdc.textfield.min.css'

import './index.styl'


// Load service worker

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.info('Service Worker registered: ', registration)
    }).catch(registrationError => {
      console.warn('Service Worker registration failed: ', registrationError)
    });
  });
}


// Set up colors (we'll need them later!)

const palettes = [
  // From https://colorhunt.co
  ['#fff1e9', '#ffd5d5', '#fc7fb2', '#45454d'],
  ['#293462', '#00818a', '#ec9b3b', '#f7be16'],
  ['#dfddc7', '#f58b54', '#a34a28', '#211717'],
  ['#003f5c', '#58508d', '#bc5090', '#ff6361'],
  ['#364f6b', '#3fc1c9', '#f5f5f5', '#fc5185'],
  ['#11cbd7', '#c6f1e7', '#f0fff3', '#fa4659'],
  ['#eb586f', '#d8e9f0', '#4aa0d5', '#454553'],
  ['#f0134d', '#ff6f5e', '#f5f0e3', '#40bfc1'],

  // From https://coolors.co
  //  document.querySelectorAll('.browser-palette-colors').forEach(el => {
  //    el.parentElement.querySelector('.name').innerText = "['" + [...el.children].map(x => x.textContent).join("', '") + "']"
  //    el.parentElement.querySelector('.name').style.maxWidth = 'none'
  //  })
  ['#011627', '#fafafa', '#2ec4b6', '#e71d36', '#ff9f1c'],
  ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557'],
  ['#1a535c', '#4ecdc4', '#f7fff7', '#ff6b6b', '#ffe66d'],
  ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#073b4c'],
  ['#114b5f', '#028090', '#e4fde1', '#456990', '#f45b69'],
  ['#3d5a80', '#98c1d9', '#e0fbfc', '#ee6c4d', '#293241'],
  ['#114b5f', '#1a936f', '#88d498', '#c6dabf', '#f3e9d2'],
  ['#dcdcdd', '#c5c3c6', '#46494c', '#4c5c68', '#1985a1'],
  ['#003049', '#d62828', '#f77f00', '#fcbf49', '#eae2b7'],
  ['#0b132b', '#1c2541', '#3a506b', '#5bc0be', '#6fffe9'],
]


// Find all needed elements

const websiteElement  = document.getElementById('website')    as HTMLInputElement,
      usernameElement = document.getElementById('username')   as HTMLInputElement,
      passwordElement = document.getElementById('password')   as HTMLInputElement,
      charsetsElement = document.getElementById('charsets')   as HTMLDivElement,
      lengthElement   = document.getElementById('length')     as HTMLInputElement,
      counterElement  = document.getElementById('counter')    as HTMLInputElement,
      algoElement     = document.getElementById('algorithm')  as HTMLDivElement,
      iterElement     = document.getElementById('iterations') as HTMLInputElement

const part1Element = document.getElementById('part-1') as HTMLElement,
      part2Element = document.getElementById('part-2') as HTMLElement,
      part3Element = document.getElementById('part-3') as HTMLElement,
      letter1Element = document.getElementById('letter-1') as HTMLSpanElement,
      letter2Element = document.getElementById('letter-2') as HTMLSpanElement,
      letter3Element = document.getElementById('letter-3') as HTMLSpanElement,
      letter4Element = document.getElementById('letter-4') as HTMLSpanElement,
      resultElement = document.getElementById('generated-password') as HTMLSpanElement

const letterElements = [letter1Element, letter2Element, letter3Element, letter4Element]

// Set up chips

const charsetsChipSet  = new MDCChipSet(charsetsElement),
      algorithmChipSet = new MDCChipSet(algoElement)


// Restore options

enum Charset {
  Upper = 1,
  Lower = 2,
  Numeric = 4,
  Symbols = 8,

  Letters = Upper | Lower,
  Alphanum = Letters | Numeric,
  All = Alphanum | Symbols,
}

interface Options {
  charsets: Charset
  length: number
  counter: number
  aes: 256 | 384 | 512
  iterations: number 
}

function saveOptions() {
  localStorage.setItem('opts', JSON.stringify(options))
}

function getDefaultOptions(): Options {
  return {
    charsets: Charset.All,
    length: 16,
    counter: 1,
    aes: 256,
    iterations: 100_000,
  }
}

const optionsString = localStorage.getItem('opts')
const options = optionsString === null
  ? getDefaultOptions()
  : JSON.parse(optionsString) as Options

if (options.charsets & Charset.Lower)
  charsetsChipSet.chips[0].selected = true
if (options.charsets & Charset.Upper)
  charsetsChipSet.chips[1].selected = true
if (options.charsets & Charset.Numeric)
  charsetsChipSet.chips[2].selected = true
if (options.charsets & Charset.Symbols)
  charsetsChipSet.chips[3].selected = true

if (options.aes === 256)
  algorithmChipSet.chips[0].selected = true
else if (options.aes === 384)
  algorithmChipSet.chips[1].selected = true
else
  algorithmChipSet.chips[2].selected = true

lengthElement.valueAsNumber = options.length
counterElement.valueAsNumber = options.counter
iterElement.valueAsNumber = options.iterations


// Set up text inputs

for (const input of [websiteElement, usernameElement, passwordElement, lengthElement, counterElement, iterElement])
  MDCTextField.attachTo(input.parentElement!)

let generatedPasswordRaceToken = 0,
    generatedPassword = ''

function renderPassword() {
  if (websiteElement.value.length === 0
    || usernameElement.value.length === 0
    || passwordElement.value.length === 0)
    return resultElement.textContent = ''

  const token = ++generatedPasswordRaceToken

  generatePassword(
    websiteElement.value,
    usernameElement.value,
    passwordElement.value,
    {
      counter: options.counter,
      length: options.length,
      lowercase: (options.charsets & Charset.Lower) !== 0,
      uppercase: (options.charsets & Charset.Upper) !== 0,
      numbers: (options.charsets & Charset.Numeric) !== 0,
      symbols: (options.charsets & Charset.Symbols) !== 0,
    }
  ).then(password => {
    if (token !== generatedPasswordRaceToken)
      return

    generatedPassword = password
    resultElement.textContent = password

    part1Element.parentElement!.style.setProperty('--box-width', `${resultElement.clientWidth + 16}px`)
  })
}

websiteElement.addEventListener('input', function() {
  renderPassword()

  if (this.value.length === 0)
    return part1Element.classList.add('out')
 
  part1Element.classList.remove('out')
})

usernameElement.addEventListener('input', function() {
  renderPassword()

  if (this.value.length === 0)
    return part3Element.classList.add('out')

  part3Element.classList.remove('out')
})

let masterPasswordRaceToken = 0

passwordElement.addEventListener('input', function() {
  renderPassword()

  if (this.value.length === 0) {
    part1Element.style.setProperty('--color', '')
    part2Element.style.setProperty('--color', '')
    part3Element.style.setProperty('--color', '')
    letter1Element.style.setProperty('--color', '')
    letter2Element.style.setProperty('--color', '')
    letter3Element.style.setProperty('--color', '')
    letter4Element.style.setProperty('--color', '')

    return part2Element.classList.add('out')
  }

  part2Element.classList.remove('out')

  const token = ++masterPasswordRaceToken

  createHmac('sha256', this.value)
    .then(fingerprint => {
      if (token !== masterPasswordRaceToken)
        return

      const paletteString = fingerprint.substr(0, 6),
            paletteHash = parseInt(paletteString, 16),
            palette = palettes[paletteHash % palettes.length]

      function getColor(i: number) {
        const string = fingerprint.substr(i * 8, 6),
              stringHash = parseInt(string, 16)

        return palette[stringHash % palette.length]
      }

      part1Element.style.setProperty('--color', getColor(1))
      part2Element.style.setProperty('--color', getColor(2))
      part3Element.style.setProperty('--color', getColor(3))
      letter1Element.style.setProperty('--color', getColor(4))
      letter2Element.style.setProperty('--color', getColor(5))
      letter3Element.style.setProperty('--color', getColor(6))
      letter4Element.style.setProperty('--color', getColor(7))
    })
})

function getRandomLetter(str: string) {
  return str[Math.floor(Math.random() * str.length)]
}

function onCharsetUpdated(charset: Charset) {
  let characters = '',
      possibleChars = ''

  if (charset & Charset.Lower) {
    possibleChars += 'abcdefghijklmnopqrstuvwxyz'
    characters += getRandomLetter('abcdefghijklmnopqrstuvwxyz')
  }

  if (charset & Charset.Upper) {
    possibleChars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    characters += getRandomLetter('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  }

  if (charset & Charset.Numeric) {
    possibleChars += '0123456789'
    characters += getRandomLetter('0123456789')
  }

  if (charset & Charset.Symbols) {
    possibleChars += '$&?@#'
    characters += getRandomLetter('$&?@#')
  }

  while (characters.length < 4)
    characters += getRandomLetter(possibleChars)

  for (const letterElement of letterElements)
    letterElement.classList.add('out')

  setTimeout(() => {
    let i = 0

    for (const letterElement of letterElements) {
      letterElement.textContent = characters[i++]
      letterElement.classList.remove('out')
    }
  }, 300)
}

function onCounterUpdated(counter: number) {
  part1Element.parentElement!.style.setProperty(
    '--box-radius', `${6 + counter / 6}px`)
}

function setUpDefaultBlurListener(el: HTMLInputElement, def: number) {
  el.addEventListener('blur', function() {
    if (this.value.length === 0) {
      this.valueAsNumber = def
      this.dispatchEvent(new CustomEvent('input'))
    }
  })
}

setUpDefaultBlurListener(lengthElement, 16)

lengthElement.addEventListener('input', function() {
  if (!this.validity.valid)
    return

  options.length = this.valueAsNumber
  saveOptions()
  renderPassword()
})

setUpDefaultBlurListener(counterElement, 1)

counterElement.addEventListener('input', function() {
  if (!this.validity.valid)
    return

  onCounterUpdated(options.counter = this.valueAsNumber)
  saveOptions()
  renderPassword()
})

setUpDefaultBlurListener(iterElement, 100_000)

iterElement.addEventListener('input', function() {
  if (!this.validity.valid)
    return

  options.iterations = this.valueAsNumber
  saveOptions()
  renderPassword()
})

charsetsChipSet.listen('MDCChip:selection', function() {
  let charset: Charset = 0

  if (charsetsChipSet.chips[0].selected)
    charset |= Charset.Lower
  if (charsetsChipSet.chips[1].selected)
    charset |= Charset.Upper
  if (charsetsChipSet.chips[2].selected)
    charset |= Charset.Numeric
  if (charsetsChipSet.chips[3].selected)
    charset |= Charset.Symbols

  if (options.charsets === charset)
    return

  if (charsetsChipSet.selectedChipIds.length === 1) {
    charsetsChipSet.chips.find(x => x.selected)!.root_.classList.add('locked')
  } else {
    charsetsChipSet.chips.forEach(x => x.root_.classList.remove('locked'))
  }

  onCharsetUpdated(options.charsets = charset)
  saveOptions()
  renderPassword()
})

algorithmChipSet.listen('MDCChip:selection', function() {
  options.aes = algorithmChipSet.chips[0].selected ? 256
              : algorithmChipSet.chips[1].selected ? 384 : 512

  saveOptions()
  renderPassword()
})

onCharsetUpdated(options.charsets)


// Set up number drag
// ============================================================================

for (const element of document.getElementsByClassName('drag-number') as any as HTMLElement[]) {
  element.addEventListener('mousedown', function(e) {
    const input = element.nextElementSibling as HTMLInputElement,
          initialValue = input.valueAsNumber,
          initialY = e.screenY

    function onMouseMove(e: MouseEvent) {
      let multiplier = (+input.max - +input.min) / 200
      let newValue = initialValue + (initialY - e.screenY) * multiplier

      if (newValue < +input.min)
        newValue = +input.min
      else if (newValue > +input.max)
        newValue = +input.max

      input.valueAsNumber = Math.floor(newValue)
      input.dispatchEvent(new CustomEvent('input'))
    }

    document.addEventListener('mousemove', onMouseMove)
    
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', onMouseMove)
    }, { once: true })
  })

  element.addEventListener('touchstart', function(e) {
    const input = this.nextElementSibling as HTMLInputElement,
          initialValue = input.valueAsNumber,
          initialY = e.targetTouches[0].screenY

    function onTouchMove(e: TouchEvent) {
      let multiplier = (+input.max - +input.min) / 200
      let newValue = initialValue + (initialY - e.targetTouches[0].screenY) * multiplier

      if (newValue < +input.min)
        newValue = +input.min
      else if (newValue > +input.max)
        newValue = +input.max

      input.valueAsNumber = Math.floor(newValue)
      input.dispatchEvent(new CustomEvent('input'))
    }

    document.addEventListener('touchmove', onTouchMove)
    
    document.addEventListener('touchend', () => {
      document.removeEventListener('touchmove', onTouchMove)
    }, { once: true })
  })
}


// Set up password show / hide
// ============================================================================

for (const button of document.getElementsByClassName('toggle-password') as any as HTMLElement[]) {
  MDCRipple.attachTo(button).unbounded = true

  button.addEventListener('click', function() {
    const input = this.nextElementSibling as HTMLInputElement

    if (input.type === 'password') {
      input.type = 'text'
      this.classList.add('is-clear')
    } else {
      input.type = 'password'
      this.classList.remove('is-clear')
    }
  })
}


// Set up expansion panel openers
// ============================================================================

for (const opener of document.getElementsByClassName('opener') as any as HTMLDivElement[]) {
  MDCRipple.attachTo(opener)

  opener.addEventListener('click', function() {
    this.parentElement!.classList.toggle('active')
  })
}


// Set up result view click handlers
// ============================================================================

const textCopiedSnackbar = new MDCSnackbar(document.getElementById('copy-snackbar')!)

textCopiedSnackbar.closeOnEscape = true

resultElement.addEventListener('click', function() {
  document.execCommand('copy')
  textCopiedSnackbar.open()
})

resultElement.addEventListener('copy', function(e) {
  e.preventDefault()

  if (e.clipboardData !== null)
    e.clipboardData.setData('text/plain', generatedPassword)
})


// Set up forwarded focus
// ============================================================================

function forwardVisualFocus(input: HTMLInputElement, target: HTMLElement) {
  input.addEventListener('focus', () => target.classList.add('focused'))
  input.addEventListener('blur', () => target.classList.remove('focused'))
}

forwardVisualFocus(websiteElement, part1Element)
forwardVisualFocus(usernameElement, part3Element)
forwardVisualFocus(passwordElement, part2Element)
