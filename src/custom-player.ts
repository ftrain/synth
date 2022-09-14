import { html, css, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import * as Tone from 'tone'
import * as Tonal from "@tonaljs/tonal"
import './synth-control'
import { TEMPOS } from './tempos'

@customElement('custom-player')

export class PlayerSynth extends LitElement {

    static get properties() {
        return {
            url: {type: String },
            grainSize: {type: Tone.NormalRange},
            overlap: {type: Tone.NormalRange},
            delayTime: {type: Tone.Time},
            playbackRate: {type: Tone.NormalRange},
            feedback: {type: Tone.NormalRange},
            pitch: {type: Tone.Interval},
            windowSize: {type: Tone.Time},
            wet: {type: Tone.NormalRange},
        }
    }

    // https://archive.org/details/pacifica_radio_archives-IZ0449.01
    constructor() {
        super()
        this.urls = [
            "https://ia902806.us.archive.org/31/items/podcast_brick-bookss-posts_anne-carson-reads-short-talk-o_1000327021616/podcast_brick-bookss-posts_anne-carson-reads-short-talk-o_1000327021616.mp3",
            "https://ia802809.us.archive.org/3/items/podcast_brick-bookss-posts_anne-carson-reads-short-talk-o_1000327021582/podcast_brick-bookss-posts_anne-carson-reads-short-talk-o_1000327021582.mp3",
            "/plath.mp3",
            "https://ia802805.us.archive.org/23/items/podcast_brick-bookss-posts_anne-carson-reads-short-talk-o_1000327011498/podcast_brick-bookss-posts_anne-carson-reads-short-talk-o_1000327011498.mp3",
            "http://archive.org/download/pacifica_radio_archives-IZ1231A/PRA_NHPRC1_IZ1231_0A_000_00_FULL.mp3"
        ]
        // https://ia802804.us.archive.org/3/items/podcast_brick-bookss-posts_anne-carson-reads-short-talk-o_1000327021614/podcast_brick-bookss-posts_anne-carson-reads-short-talk-o_1000327021614.mp3
        const defaults = {
            url: this.urls[0],
            frequency: 4,
            depth: 0.5,
            delayTime: 0.1,
            grainSize: 0.1,
            overlap: 0.1,
            feedback: 0.2,
            playbackRate:1,
            pitch: 0,
            windowSize: '12n',
            wet: 0.15
        }
        const mergedOptions = Object.assign(defaults, {})
        Object.assign(this, mergedOptions)
        this.pitchShift = new Tone.PitchShift(defaults)
        this.chorus = new Tone.Chorus(4, 2.5, 0.5).start("+1");
        this.player = undefined
        this._updatePlayer()
    }

    private _updatePlayer() {
        let restart = false
        if (this.player) {
            restart = true
            this.player.dispose()
        }
        this.player = new Tone.GrainPlayer({url:this.url})
        Tone.loaded().then(()=>{
            console.log(this.url)
            this.volumeNode = new Tone.Volume(this.volume)
            this.player.chain(this.pitchShift, this.chorus, this.volumeNode)
            this.player.loop = true
            this.volumeNode.toDestination()
            if (restart) {
                this.player.start()
            }
        })
    }

    private _change(e: Event) {
        if (e.target !== e.currentTarget) {
            const [k,v] = [e.target.name, e.target.adjusted]
            this[k] = v
            if (k==='volume') {
                this._setVolume()
            }
            else if (k==='grainSize' || k==='overlap' || k==='playbackRate') {
                this.player.set({[k]:v})
            }
            else if (k==='url') {
                this._updatePlayer()
            }
            else {
                this.chorus.set({[k]:v})
                this.pitchShift.set({[k]:v})
            }
        }
    }


    private _setVolume(): void {
        this.volumeNode.set({volume: this.volume})
    }



  render() {
    return html`
<div class="controls"
  @change="${this._change}"
  @input="${this._change}">

  <button class="delete"
    @click="${()=>this.player.stop() && this.remove()}">✖</button>

  <h2>Player</h2>
  <div>${this.url}</div>

  <synth-control
    type="Player"
    position="${this.position}"
    name="volume"
    value=${this.volume}
    min=-50.0
    max=50.0
    step=0.1></synth-control>

<synth-control name="pandur" value=${this.pandur} .array=${TEMPOS}></synth-control>

<synth-control name="url" value=${this.url} .array=${this.urls}></synth-control>
<synth-control name="frequency" value=${this.frequency} min=0.01 max=100 step=1></synth-control>
<synth-control name="depth" value=${this.depth} min=0.00 max=1.00 step=0.001></synth-control>
<synth-control name="grainSize" value=${this.grainSize} min=0.001 max=0.50 step=0.001></synth-control>
<synth-control name="overlap" value=${this.overlap} min=0.001 max=1 step=0.001></synth-control>
<synth-control name="playbackRate" value=${this.playbackRate} min=0 max=4 step=0.01></synth-control>
<synth-control name="pitch" value=${this.pitch} min=-12 max=12></synth-control>
<synth-control name="delayTime" value=${this.delayTime} min=0 max=1 step=0.01></synth-control>
<synth-control name="feedback" value=${this.feedback} min=0 max=1 step=0.01></synth-control>
<synth-control name="windowSize" value=${this.windowSize} .array=${TEMPOS}></synth-control>
<synth-control name="wet" value=${this.wet} min=0 max=1 step=0.01></synth-control>


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
