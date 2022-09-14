import { html, css, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import * as Tone from 'tone'

@customElement('synth-control')

export class SynthControl extends LitElement {
    static get properties() {
        return {
            name: { type: String },
            value: { type: Number },
            array: {type: Array },
            field: {type: String },
            setting: {type: String},
            min:{ type: Number },
            max:{ type: Number },
            step:{ type: Number },
            adjusted:{ type: Number | String}
        }
    }

    constructor() {
        super()
    }

    render() {
        if(this.array!==undefined) {
            this.min = 0
            this.max = this.array.length - 1
            this.step = 1
            this.value = this.array.indexOf(this.attributes.value.value)
        }
      return html`

<div class="synth-control">
  <h3><label for="${this.name}">${this.name} ${this.field}</label></h3>
    <input type="range"
       id="${this.name}"
       class="slider"
       min=${this.min}
       max=${this.max}
       step=${this.step}
       value=${this.value}
       @change=${e=>this._change(e)}
       @input=${e=>this._change(e)}>
<div class="value">${this.adjusted ? this.adjusted : this._adjust()}</div>
</div>
`
  }

    private _change(e: Event) {
        this.value = e.target.value
        this._adjust()
    }

    private _adjust() {
        if (this.array !== undefined) {
            this.adjusted = this.array[this.value]
        }
        else {
            this.adjusted = this.value
        }
        this.dispatchEvent(new CustomEvent('settings-change',
                                           {
                                               detail: {
                                                   name:this.name,
                                                   value:this.value
                                               },
                                               bubbles: true,
                                               composed: true
        }))

        return this.adjusted;
    }

    static styles = css`
     .synth-control {
           padding:0.5em 0.25em 0.25em 0.25em;
     }
     .slider {
           display:inline;
           width:100%;
           padding:0;
           margin:0;
     }
     .value, h3 {
        font-size:1em;
        padding:0;
        vertical-align:top;
        margin:0;
     }
     .value {
        color:darkgray;
     }
     h3 {
text-transform:uppercase;
font-weight:normal;
}`

}

declare global {
  interface HTMLElementTagNameMap {
    'synth-control': SynthControl
  }
}
