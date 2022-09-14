import { html, css, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import * as Tone from 'tone'
import * as Tonal from "@tonaljs/tonal"
import './synth-control'
import { TEMPOS } from './tempos'

@customElement('custom-monosynth')

export class MonoSynth extends LitElement {

  static get properties() {
    return {
      position: { type: Number },
      chord: { type: String },
      note: { type: String },
      arp: { type: String },
      octave: { type: Number },
      tempo: { type: String },
      pandur: { type: String },
      volume: { type: Number },
      volumeNode: { type: Tone.Volume },
      oscillator: { type: String },
      wave: { type: String },
      partial: { type:Number },
      sequencer: { type: Tone.Sequence },
      currentNote: { type: String },
      attack: {type: Tone.NormalRange },
      decay: {type: Tone.NormalRange },
      release: {type: Tone.NormalRange },
      sustain: {type: Tone.NormalRange }
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name=='chord' || name=='note' || name=='arp') {
      this._updateNotes()
    }
    console.log('attribute change: ', name, newVal);
    super.attributeChangedCallback(name, oldVal, newVal);
  }

  constructor(options: Object) {
    super()

    const defaults = {
      position: 0,
      tempo: '4m',
      pandur: '8m',
      arp: 'up',
      octave: 2,
      volume: 10.0,
      chord: 'minor',
      note: 'G',
      oscillator: 'fat',
      wave: 'sine',
      partial: 4,
      attack: 0.1,
      decay: 0.1,
      release: 0.8,
      sustain: 0.8
    }

    const mergedOptions = Object.assign(defaults, options)

    this.position = mergedOptions.position
    this.tempo = mergedOptions.tempo
    this.pandur = mergedOptions.pandur
    this.octave = mergedOptions.octave
    this.volume = mergedOptions.volume
    this.chord = mergedOptions.chord
    this.note = mergedOptions.note
    this.arp = mergedOptions.arp
    this.oscillator = mergedOptions.oscillator
    this.wave = mergedOptions.wave
    this.partial = mergedOptions.partial
    this.attack = mergedOptions.attack
    this.decay = mergedOptions.decay
    this.release = mergedOptions.release
    this.sustain = mergedOptions.sustain

    this.arps = ['up', 'down', 'shuffle', 'repeat']
    this.oscillators = ['[]', 'fm', 'am', 'fat']
    this.waves = ['sine', 'square', 'sawtooth', 'triangle']
    this.chords = Tonal.ChordType.names()
    this.notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    this.partials = 0
    this.synthString = this._makeSynthString()
    this.volumeNode = new Tone.Volume(this.volume)
    this.synth = this._makeSynth()
    this.sequencer = this._getSequencer()
  }

  private _makeSynth() {
    const synth = new Tone.MonoSynth({
      oscillator: {
        type: this.synthString,
      },
      envelope:{
        attack:this.attack,
        sustain:this.sustain,
        decay:this.decay,
        release:this.release
      }})
    return synth
  }

  private _makeSynthString() {
    return `${(this.oscillator==='[]') ? '' : this.oscillator}${this.wave}${this.partial == 0 ? '' : this.partial}`
  }


  private _change(e: Event) {
    if (e.target !== e.currentTarget) {
      const [k,v] = [e.target.name, e.target.adjusted]
      this[k] = v
      if (k==='volume') {
        this._setVolume()
      }
      if (k==='arp' || k==='octave' || k==='note' || k==='chord') {
        this.sequencer.set({events:this._getChord()})
      }
      if (k==='tempo' || k==='pandur') {
        this.sequencer = this._getSequencer()
      }
      if (k==='oscillator' || k==='wave' || k==='partial') {
        const osc = this._makeSynthString();
        this.synth.set({oscillator:{type:osc}})
      }
      if (k==='attack' || k==='sustain' || k==='decay' || k==='release') {
        this.synth.set({envelope:{[k]:v}})
      }
    }
  }

  private _getChord() {
    const notes = Tonal.Chord.getChord(this.chord, `${this.note}${this.octave}`).notes
    if (this.arp==='down') {
      return notes.reverse()
    }
    if (this.arp==='shuffle') {
      return this._shuffle(notes)
    }
    if (this.arp==='repeat') {
      return this._repeat(notes, 3)
    }
    if (this.arp==='up') {
      return notes
    }
  }

  /*  Using Durstenfeld shuffle algorithm */
  private _shuffle(inArray: Array) {
    let array = Array.prototype.concat(inArray, inArray, inArray)
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array
  }

  private _repeat(inArray: Array, repeats: Number = 4) {
    let array: Number[] = []
    for (var i = 0; i < inArray.length; i++) {
      const x = (i > 0) ? i - 1 : inArray.length - 1
      for (var j = 0; j<repeats; j++) {
        array.push(inArray[i], inArray[x])
      }
    }
    return array
  }

  private _gainLFO(dur, from, to) {
    const g = new Tone.Gain()
    g.set({units:'normalRange'})
    const lfox = new Tone.LFO(dur, from, to)
    lfox.chain(g.gain)
    lfox.start()
    return g;
  }

  private _setVolume(): void {
    this.volumeNode.set({volume: this.volume})
  }

  private _getSequencer(release=0.1, start=0, hold="32m") {
    const gain = this._gainLFO("32m", 0.0, 0.1)

    const panner = new Tone.AutoPanner(this.pandur).start()
    panner.set({depth:0.8})

    this._setVolume(this.volume)

    this.synth.chain(panner, gain, this.volumeNode)
    this.volumeNode.toDestination()

    const seq = new Tone.Sequence((time, note) => {
      this.synth.triggerAttackRelease(note, this.tempo)
      this.currentNote = note
    }, this._getChord(), this.tempo).start(0)

    if (this.sequencer) {
      this.sequencer.dispose()
    }
    return seq
  }


  render() {
    return html`
<div class="controls"
  @change="${this._change}"
  @input="${this._change}">

  <button class="delete"
    @click="${()=>this.sequencer.dispose() && this.remove()}">✖</button>

  <h2>${this.synth} ${this.position}</h2>
  <div>${this.note} ${this.chord} [${this.currentNote}]</div>

  <synth-control type="MonoSynth"
   position=${this.position}
   name="note"
   value="${this.note}"
   .array="${this.notes}"></synth-control>

  <synth-control type="MonoSynth"
   position=${this.position}
   name="chord"
   value="${this.chord}"
   .array="${this.chords}"></synth-control>

  <synth-control type="MonoSynth"
   position=${this.position}
   name="arp"
   value="${this.arp}"
   .array="${this.arps}"></synth-control>

  <synth-control type="MonoSynth"
   position=${this.position}
   name="oscillator"
   value="${this.oscillator}"
   .array="${this.oscillators}"></synth-control>

  <synth-control type="MonoSynth"
   position=${this.position}
   name="wave"
   value="${this.wave}"
   .array="${this.waves}"></synth-control>

  <synth-control type="MonoSynth"
   position=${this.position}
   name="partial"
   value="${this.partial}"
   min="0" max="32" step="1"></synth-control>


  <synth-control type="MonoSynth"
   position=${this.position}
   name="tempo"
   value=${this.tempo}
   .array=${TEMPOS}></synth-control>

  <synth-control
    type="MonoSynth"
    position="${this.position}"
    name="octave"
    value="${this.octave}"
    min=0
    max=8
    step=1></synth-control>

  <synth-control
    type="MonoSynth"
    position="${this.position}"
    name="volume"
    value=${this.volume}
    min=-50.0
    max=50.0
    step=0.1></synth-control>

<synth-control type="MonoSynth" position="${this.position}" name="pandur" value=${this.pandur} .array=${TEMPOS}></synth-control>


  <synth-control type="MonoSynth"
   position=${this.position}
   name="attack"
   value="${this.attack}"
   min=0 max=1 step=0.01></synth-control>
  <synth-control type="MonoSynth"
   position=${this.position}
   name="decay"
   value="${this.decay}"
   min=0 max=1 step=0.01></synth-control>
  <synth-control type="MonoSynth"
   position=${this.position}
   name="release"
   value="${this.release}"
   min=0 max=3 step=0.01></synth-control>
  <synth-control type="MonoSynth"
   position=${this.position}
   name="sustain"
   value="${this.sustain}"
   min=0 max=1 step=0.01></synth-control>


</div>`
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
