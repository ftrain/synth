import { html, css, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import * as Tone from 'tone'
import * as Tonal from "@tonaljs/tonal"
import './synth-control'
import { TEMPOS } from './tempos'

@customElement('custom-membranesynth')

export class MembraneSynth extends LitElement {

  static get properties() {
    return {
      chord: { type: String, value:"min7" }, // = "min7"
      note: { type: String, value:"A" },  // = "A"
      octave: { type: Tone.Unit, value:1 }, // = 1
      detune: {type: Tone.Unit.Cents, value:0.5},
      octaves: {type: Tone.Unit.Positive, value:1},
      pitchDecay: {type: Tone.Unit.Time },
      portamento: {type: Tone.Unit.Seconds },
      tempo: { type: Tone.Unit.Time }, // = 13
      delayTime: { type: Tone.Unit.Time }, // = 15
      feedback: { type: Tone.Unit.NormalRange, min:0, max:1, step:0.1, value:0.5 }, // = 15
      volume: { type: Number }, // -20.0
      volumeNode: { type: Tone.Volume }, // new Tone.Volume().toDestination()
      delayNode: {type: Tone.FeedbackDelay}, // new Tone.FeedbackDelay(this.tempo, 0.5).toDestination()
      synthNumber: { type: Number }, // 1
      props: { type: Object }, // {}
      synth: {type: Tone.MembraneSynth}, // new Tone.MembraneSynth(this.props)
      sequencer: {type: Tone.Sequence} // this._getSequencer()
    }
  }

  constructor() {
    super()
    this.constructor.elementProperties.forEach((el, name) => {
      this[name] = el.value
    })
    console.log(Object.keys(Tone))
    this.chord = "min7"
    this.note = "A"
    this.octave = 1
    this.octaves = 2
    this.pitchDecay = "4n"
    this.tempo = "4n"
    this.delay = 15
    this.volume = -20.0
    this.volumeNode = new Tone.Volume(this.volume)
    this.pingPongDelay = "4n"
    this.pingPongFeedback = 0.2
    this.pingPongNode = new Tone.PingPongDelay(this.pingPongDelay, this.pingPongFeedback)

    this.delayTime = "4n"
    this.feedback = 0.5
    this.delayNode = new Tone.FeedbackDelay(this.delayTime, this.feedback)
    this.synthNumber = 1
    this.props = {}
    this.synth = new Tone.MembraneSynth({
      pitchDecay: 0.008,
			octaves: 2,
			envelope: {
				attack: 0.0006,
				decay: 0.5,
				sustain: 0
			}})
    this.sequencer = this._getSequencer()
  }

  private _change(e: Event) {
    if (e.target !== e.currentTarget) {
      const [k,v] = [e.target.name, e.target.adjusted]
      this[k] = v
      if (k==='volume') {
        this._setVolume()
      }
      if (k==='delayTime' || k==='feedback') {
        this.delayNode.set({delayTime:this.delayTime, feedback:this.feedback})
      }
      if (k==='pingPongDelay' || k==='pingPongFeedback') {
        this.pingPongNode.set({delayTime:this.pingPongDelay, feedback:this.pingPongFeedback})
      }
      if (k==='tempo') {
        // console.log(this.tempo)
        // console.log(this.sequencer)
        this.sequencer.dispose()
        this.sequencer = this._getSequencer()
      }
      if (k==='octave') {
        this.sequencer.dispose()
        this.sequencer = this._getSequencer()
      }
      if (k==='octaves') {
        this.synth.set({[k]:v})
      }
    }
  }


  private _setVolume(): void {
    this.volumeNode.set({volume: this.volume})
  }


  private _getSequencer() {
    // const g32 = this._gainLFO("8m", 0.0, 0.2).toDestination()
    this.synth.chain(this.pingPongNode, this.delayNode, this.volumeNode)
    this._setVolume(this.volume)
    const seq = new Tone.Sequence((time, note) => {
	    this.synth.triggerAttackRelease(note, this.tempo, time)
    }, ["C" + this.octave],
       this.tempo).start()
    this.volumeNode.toDestination()
    return seq
  }

  private _hmm() {
    let x = []
    this.constructor.elementProperties.forEach((el, name) => {
      // console.log(name, el)
      x.push(html`<synth-control name=${name}
value=${el.value ? el.value : 50}
min=${el.min ? el.min : 0}
max=${el.max ? el.max: 100}
step=${el.step ? el.step: 1}

></synth-control>`)})
    return(x)
  }
  render() {
    return html`

  <div class="controls"
    @change="${this._change}"
    @input="${this._change}">
   <button class="delete" @click="${()=>this.sequencer.dispose() && this.remove()}">✖</button>

   <h2>${this.synth} ${this.synthNumber}</h2>

${this._hmm()}

   <synth-control name="pingPongDelay" value=${this.pingPongDelay} .array=${TEMPOS}></synth-control>
   <synth-control name="pingPongFeedback" value=${this.pingPongFeedback} min=0 max=1 step=0.01></synth-control>

   <synth-control name="tempo" value=${this.tempo} .array=${TEMPOS}></synth-control>
   <synth-control name="octave" value=${this.octave} min=0 max=8 step=1></synth-control>
   <synth-control name="octaves" value=${this.octaves} min=0 max=8 step=1></synth-control>
   <synth-control name="volume" value=${this.volume} min=-50.0 max=50.0 step=0.1></synth-control>
   <synth-control name="delayTime" value=${this.delayTime} .array=${TEMPOS}></synth-control>
   <synth-control name="feedback" value=${this.feedback} min=0 max=1 step=0.01></synth-control>
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
    'custom-synth': Synth
  }
}
