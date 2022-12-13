const html = String.raw
const css = String.raw
const sliderInputStyles = new CSSStyleSheet()
sliderInputStyles.replaceSync(css`
  :host {
    cursor: ew-resize;
  }
  input {
    cursor: inherit;
    background-image: linear-gradient(to right, rgba(0, 0, 0, 0.25) 0% var(--value-filled, 0%), transparent var(--value-filled, 0%) 100%);
  }
  input::-webkit-inner-spin-button {
    display: none;
  }
`)
/**
 * An example Custom Element. This documentation ends up in the
 * README so describe how this elements works here.
 *
 * You can event add examples on the element is used with Markdown.
 *
 * ```
 * <slider-input></slider-input>
 * ```
 */
class SliderInputElement extends HTMLElement {
  static observedAttributes = ['value', 'min', 'max']

  #renderRoot!: ShadowRoot
  #initialX = 0
  #initialValue = 0
  #valueChanged = false
  #sliderAbortController: AbortController | null
  #stylesheet = new CSSStyleSheet()

  get value() {
    return Number(this.#input.value) || 0
  }

  set value(value: number) {
    this.#stylesheet.replaceSync(`:host {
      --value-filled: ${100 * value / (this.max - this.min)}%
    }`)
    this.#input.value = `${value}`
  }

  get max() {
    return Number(this.#input.max) || 0
  }

  set max(value: number) {
    this.#input.max = `${value}`
  }

  get min() {
    return Number(this.#input.min) || 0
  }

  set min(value: number) {
    this.#input.min = `${value}`
  }

  get #input() {
    return this.#renderRoot?.querySelector('input')!
  }

  attributeChangedCallback(name: 'value', oldValue: string | null, newValue: string | null) {
    if (!this.#renderRoot) return
    if (name === 'value') {
      console.log(name, newValue)
      this.#input.value = newValue
    } else if (name === 'min') {
      this.#input.min = newValue
    } else if (name === 'max') {
      this.#input.max = newValue
    }
  }

  connectedCallback(): void {
    this.#renderRoot = this.attachShadow({mode: 'open'})
    this.#renderRoot.adoptedStyleSheets = [sliderInputStyles, this.#stylesheet]
    this.#renderRoot.innerHTML = html`<input type="number" />`
    this.addEventListener('mousedown', this)
    this.#input.addEventListener('input', this)
    this.#input.value = this.getAttribute('value')
    this.#input.min = this.getAttribute('min')
    this.#input.max = this.getAttribute('max')
  }

  handleEvent(event: Event) {
    if (event.type === 'mousedown' && event.which === 1) {
      this.#activateSlider(event)
    } else if (event.type === 'mouseup') {
      this.#sliderAbortController?.abort()
      if (!this.#valueChanged) {
        this.#input.focus()
        this.#input.select()
      }
      this.#valueChanged = false
    } else if (event.type === 'mousemove') {
      const delta = event.screenX - this.#initialX
      const newValue = this.#initialValue + delta
      this.value = Math.max(this.min, Math.min(this.max, newValue))
      this.#valueChanged = true
    } else if (event.type === 'input') {
      this.value = this.#input.value
    } else {
      console.log(event.screenX, event.clientX, event.pageX)
    }
  }

  #activateSlider(event: Event) {
    this.#initialX = event.screenX
    this.#initialValue = this.value
    console.log(this.#initialX)
    this.#sliderAbortController?.abort()
    const {signal} = (this.#sliderAbortController = new AbortController())
    this.ownerDocument.addEventListener('mousemove', this, {signal})
    this.ownerDocument.addEventListener('mouseup', this, {signal})
  }

  trackCusorPosition() {}
}

declare global {
  interface Window {
    SliderInputElement: typeof SliderInputElement
  }
}

export default SliderInputElement

if (!window.customElements.get('slider-input')) {
  window.SliderInputElement = SliderInputElement
  window.customElements.define('slider-input', SliderInputElement)
}
