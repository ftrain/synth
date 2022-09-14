import { html, css, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import * as Tone from 'tone'
import * as Tonal from "@tonaljs/tonal"
import { TEMPOS } from './tempos'
import './synth-control'


@customElement('custom-plucksynth')

export class PluckSynth extends LitElement {

    @property({ type: String })
    chord = "maj13"

    @property({ type: String })
    note = "E"

    @property({ type: Number })
    octave = 2

    @property({ type: Number })
    tempo = 10

    @property({ type: Number })
    tempoAdjusted = TEMPOS[this.tempo]

    @property({ type: Number })
    volume = -5

    @state({ type: Tone.Volume })
    volumeNode = new Tone.Volume().toDestination()

    @state({type: Tone.FeedbackDelay})
    delayNode = new Tone.FeedbackDelay(this.tempo, 0.5).toDestination()

    @property({ type: Number })
    delay = 12

    @property({ type: Number })
    delayAdjusted = TEMPOS[this.delay]

    @property({ type: Number })
    synthNumber = 1

    @property({ type: Number })
    attackNoise = 1

    @property({ type: Number })
    resonance = 0.7

    @property({ type: Number })
    dampening = 4000

    @property({type: Tone.PluckSynth})
    synth = new Tone.PluckSynth({
        attackNoise: this.attackNoise,
        dampening: this.dampening,
        resonance: this.resonance
    })

    @property({type: Tone.Sequence})
    sequencer = this._getSequencer()

    render() {
        return html`

<div class="controls"
@change="${this._change}"
@input="${this._change}">
   <button class="delete" @click="${()=>this.sequencer.dispose() && this.remove()}">✖</button>
<h2>${this.synth} ${this.synthNumber}</h2>
<synth-control name="Tempo" value=${this.tempo} adjust="tempo"></synth-control>
<synth-control name="Octave" value=${this.octave} min="0" max="8" step="1"></synth-control>
<synth-control name="Volume" value=${this.volume} min="-50.0" max="5.0" step="0.1"></synth-control>
<synth-control name="Delay" value=${this.delay} adjust="tempo"></synth-control>
<synth-control name="Attack" value=${this.attackNoise} min="0" max="1" step="0.01"></synth-control>
<synth-control name="Resonance" value=${this.resonance} min="0" max="1" step="0.01"></synth-control>
<synth-control name="Dampening" value=${this.dampening} min="0" max="8000" step="10"></synth-control>

</div>
`
    }

    // ${this._makeControl("Tempo", this.tempo, 1, 14, 1, this._setTempo, this._convertTempo)}
    private _getChord(chord="maj13", note="C", octave=3) {
        const notes = Tonal.Chord.getChord(chord, `${note}${octave}`).notes
        return notes
    }

    private _change(e: Event) {
        if (e.target !== e.currentTarget) {
            const control = e.target
            this['_set' + control.name](control.adjusted)
        }
    }

    private _setAttack(amt: Number): void {
        this.synth.attack = amt
        this.attack = amt;
    }

    private _setDampening(amt: Number): void {
        this.synth.dampening = amt
        this.dampening = amt;
    }

    private _setResonance(amt: Number): void {
        this.synth.resonance = amt
        this.resonance = amt;
    }

    private _setVolume(amt: Number): void {
        this.volumeNode.volume.value = amt
        this.volume = amt;
    }

    private _setDelay(amt: String): void {
        this.delayNode.set({delayTime:amt});
        this.delay = amt;
    }

    private _setTempo(s: String) {
        this.tempo = s
        this.sequencer.dispose()
        this.sequencer = this._getSequencer();
    }

    private _setOctave(n: Number) {
        this.octave = n
        const notes = this._getChord(this.chord, this.note, this.octave)
        this.sequencer.set({events:notes})
    }

    private _getSequencer(release=0.1, start=0) {
        this.synth.chain(this.delayNode).chain(this.volumeNode)
        this._setVolume(this.volume)
        const seq = new Tone.Sequence((time, note) => {
	        this.synth.triggerAttackRelease(
                note,
                this.tempo,
                time)
        }, this._getChord(this.chord,
                          this.note,
                          this.octave),
           this.tempo).start(0)
        return seq
    }

  static styles = css`
div.controls {
   border:1px solid black;
   padding:1em;
   margin:1em 0 1em 0;
}
.delete {float:right;}
h2 {font-size:12pt;}
  `

}
declare global {
  interface HTMLElementTagNameMap {
    'custom-synth': Synth
  }
}
