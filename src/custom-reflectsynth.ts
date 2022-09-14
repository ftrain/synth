import { html, css, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import * as Tone from 'tone'
import * as Tonal from "@tonaljs/tonal"
import { TEMPOS, ARPS, OSCILLATORS, WAVES, CHORDS, NOTES } from './tempos'
import './synth-control'

@customElement('custom-reflectsynth')
export class ReflectSynth extends LitElement {


  static get properties() {
    const ranges = {
      detune: { type: Number, min:0, max:100,step:1, value:0.5},
      octaves: { type: Number, min:0,max:10, step:1, value:2},
      octave: { type: Number, min:0,max:8, step:1, value:2},
      arp: { type: String, value:"up", array:ARPS},
      note: { type: String, value:"C", array:NOTES},
      chord: { type: String, value:"minor", array:CHORDS},
      frequency: { type: Number, min:0,max:900, step:1, value:40 },
      pitchDecay: { type: Number, min:0, max:1, step:0.01, value:0.2 },
      portamento: { type: Number, min:0, max:2, step:0.01, value:0.1 },
      volume: { type:Number, min:-100, max:100, step:1, value:-25 },
      tempo: { type: Tone.Time, value:'2m', array:TEMPOS },
      envelope: { type: Tone.Envelope },
      oscillator: { type: Tone.OmniOscillator },
      fmOscillator: { type: Tone.Oscillator },
      amOscillator: { type: Tone.Oscillator }
    }

    function prefixReducer(prefix: String, arr: Array) {
      return arr.reduce((acc, k)=>{
        if (ranges[k]) {
          acc[prefix + '_' + k] = {...ranges[k], name:prefix, field:k}
        }
        return acc;}, {})
    }

    function _toKeys(o: Object) {
      return Object.keys(o).filter(z=>(z.substr(0,1)!=='_'
        && !z.match(/debug|context|output|onstop|input|onsilence/)))
    }

    const synthFields = prefixReducer('synth',
                                      ['tempo',
                                       'arp',
                                       'octave',
                                       'note',
                                       'chord',
                                       'frequency',
                                       ..._toKeys(Tone.MonoSynth.getDefaults())])

    const calculatedFields = {_oscillator_string: {type: String}}
    return {...synthFields, ...calculatedFields}
  }

  _addOscillator(prefix: String, oscillator: Tone.Oscillator) {
    this[prefix] = {prefix:prefix, oscillator: oscillator,  type:"fat", wave: "sine", partial:5}
  }

  constructor() {
    super()
    this.eps = this.constructor.elementProperties
    this.eps.forEach((el, name) => {
      this[name] = el.value
    })
    this.synth = new Tone.MonoSynth().toDestination()
    this._addOscillator('mainosc', this.synth.oscillator)
  }

  private _getBaseSynth() {
    return Tone.MonoSynth
  }

  private _makeOscString(prefix) {
    return `${(this[prefix].type === '[]' ? '' : this[prefix].type)}${this[prefix].wave}${this[prefix].partial}`
  }

  private _change(e: Event) {
    const [key, obj, field, val] = [e.target.setting, e.target.name, e.target.field, e.target.value]
    this[key] = e.target.adjusted
    if (e.target.name==='oscillator') {
      this._oscillator_string = this._makeOscString(e.target.prefix)
      this.oscillator.oscillator.set({type:this._oscillator_string})

    }
    else {
      this[obj].set({[field]:e.target.adjusted})
      if (field==='tempo'
        || field === 'arp'
        || field === 'octave'
        || field === 'note'
        || field === 'chord') {
        this.sequencer.dispose()
        this.sequencer = this._getSequencer(this.synth_tempo)
      }
    }
  }



  private _getChord() {
    const notes = Tonal.Chord.getChord(this.synth_chord, `${this.synth_note}${this.synth_octave}`).notes

    if (this.synth_arp==='down') {
      return notes.reverse()
    }
    if (this.synth_arp==='shuffle') {
      return this._shuffle(notes)
    }
    if (this.synth_arp==='repeat') {
      return this._repeat(notes, 3)
    }
    if (this.synth_arp==='up') {
      return notes
    }
  }

  private _getSequencer(tempo: Tone.Time) {
    const seq = new Tone.Sequence((time, note) => {
	    this.synth.triggerAttackRelease(note, tempo, time)
    }, this._getChord(), tempo).start(0)
    return seq
  }



  private _getControls() {
    let sliders:Array = []
    this.eps.forEach((el, name) => {
      if (el.field === 'oscillator') {
        console.log(el)
        sliders.push(html`
<synth-control prefix=${el.field} setting="oscillator" name="oscillator" field="oscillator" value="fat" .array=${OSCILLATORS}></synth-control>
<synth-control setting="wave" name="oscillator" field="wave" value="sine" .array=${WAVES}></synth-control>
<synth-control setting="partial" name="oscillator" field="partial" value=5 min=0 max=32></synth-control>
`)
      }
      else if (name.substr(0,1)!=='_'){
        sliders.push(html`<synth-control
setting=${name}
field=${el.field}
name=${el.name}
value=${el.value ? el.value : 50}
min=${el.min ? el.min : 0}
max=${el.max ? el.max: 100}
step=${el.step ? el.step: 1}
.array=${el.array}
></synth-control>`)}})
    return(sliders)
  }

  render() {
    return html`

  <div class="controls"
    @change="${this._change}"
    @input="${this._change}">
   <button class="delete" @click="${()=>this.sequencer.dispose() && this.remove()}">✖</button>

   <h2>REFLECTSYNTH ${this._oscillator_string}</h2>
   ${this._getControls()}

  </div>
`
  }

  static styles = css`
div.controls {
   border:1px solid black;
   padding:1em;
   margin:1em 0 1em 0;
}
.delete {
  float:right;
}
h2 {
  font-size:12pt;
}
`

}
declare global {
  interface HTMLElementTagNameMap {
    'custom-reflectsynth': ReflectSynth
  }
}
