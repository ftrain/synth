import { html, css, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { MonoSynth } from './custom-monosynth'
import { PluckSynth } from './custom-plucksynth'
import { MembraneSynth } from './custom-membranesynth'
import { PlayerSynth } from './custom-player'
import { ReflectSynth } from './custom-reflectsynth'
import './synth-control'
import * as Tone from 'tone';
import * as Tonal from "@tonaljs/tonal"


@customElement('custom-synths')
export class Synths extends LitElement {

  static get properties() {
    return {
      playing: { type: Boolean, reflect: true }, // boolean = false;
      urlState:{ type: Object }, // {}
      count:{ type: Number }, // 0
      clock:{type: Number }, // 0
      reverb: { type: Number}, // 0.5
      reverbNode: {type: Tone.Freeverb}, // new Tone.Reverb({preDelay:0.01, wet:1, decay:1.5}).toDestination()
      monosynths: { type: Array}, // [new MonoSynth()]
      plucksynths: { type: Array}, // Array = []
      membranesynths: { type: Array}, // Array = []
      playersynths: { type: Array}, // Array = []
      chord:{ type: String }, // chord = 'maj7'
      note:{ type: String } // chord = 'C'
    }
  }

  constructor() {
    super()
    this.playing = false
    this.urlState = {}
    this.count = 0
    this.clock = 0
    this.reverb = 0.5
    this.reverbNode = new Tone.Freeverb({
      roomSize:this.reverb,
      wet:0.25,
      dampening:1500})
    this.monosynths = [] // new MonoSynth()
    this.plucksynths = []
    this.membranesynths = [new ReflectSynth()]
    this.playersynths = []
    this.chord = 'maj7'
    this.note = 'C'

    // this.addEventListener('settings-change', (e) => this.toUrl(e))
    // const p = new URLSearchParams(window.location.search)

    // let settings: Object = {};

    // for (const [key, value] of p.entries()) {
    //   const [synth, pos, field] = key.split("-")
    //   const posInt = parseInt(pos)
    //   if (!settings[synth]) {
    //     settings[synth] = new Array()
    //   }
    //   if (!settings[synth][posInt]) {
    //     settings[synth][posInt] = {}
    //   }
    //   settings[synth][posInt][field]=value;
    // }
  }

  toUrl(e) {
    const key = e.originalTarget.attributes.type.value
      + '-'
      + e.originalTarget.attributes.position.value
      + '-'
      + e.detail.name
    this.urlState[key] = e.detail.value
    const url = '?' + new URLSearchParams(this.urlState).toString();
    history.pushState({}, null, url);
  }

  render() {
    return html`
<div class="controls"
@change="${this._change}"
@input="${this._change}">

<button class="play" @click="${this._playStop}">
${this.playing ? "STOP" : "PLAY"}
</button> <b>${this.clock}</b>

<synth-control
  type="Master"
  position=0
  name="Reverb"
  value=${this.reverb}
  min=0
  max=1
  step=0.01></synth-control>

<div class="synthset">

<div class="synth">
<button @click=${this._addMonoSynth}>
Mono+
</button>

${this.monosynths}

</div>

<div class="synth">
<button @click=${this._addPlayerSynth}>
Player+
</button>

${this.playersynths}

</div>

<div class="synth">

<button @click=${this._addPluckSynth}>
Pluck+
</button>

${this.plucksynths}

</div>

<div class="synth">
<button @click=${this._addMembraneSynth}>
Membrane+
</button>
${this.membranesynths}
</div>
</div>
</div>
`
  }

  private _change(e) {
    if (e.target.name=='Reverb') {
      return this['_set'+e.target.name](e.target.value)
    }
  }

  private _getChords() {
    const chords: String[] = Tonal.ChordType.names()
    const buttons = chords.map((x)=>{
      // return html`<button @click="${e=>this._changeChord(e)}">${x}</button>`
      return html`<nobr><input type="radio" name="chord" value=${x} @click="${e=>this._changeChord(e)}">${x}</nobr> `
    })
    return buttons
  }

  private _setReverb(r: Number) {
    this.reverb = r
    this.reverbNode.set({roomSize:r})
  }

  private _getNotes() {
    const notes: String[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const buttons = notes.map((x)=>{
      return html`<nobr><input type="radio" name="note" value=${x} @click="${e=>this._changeNote(e)}">${x}</nobr>`
    })
    return buttons
  }

  private _changeChord(e) {
    this.chord = e.target.value;
    this.monosynths.forEach((ms:MonoSynth)=>ms.setAttribute('chord', this.chord))
  }

  private _changeNote(e) {
    this.note = e.target.value;
    this.monosynths.forEach((ms:MonoSynth)=>ms.setAttribute('note', this.note))
  }

  private _addMonoSynth(): void {
    this.monosynths.push(new MonoSynth())
    this.requestUpdate();
  }

  private _addPluckSynth(): void {
    this.plucksynths.push(new PluckSynth())
    this.requestUpdate();
  }

  private _addPlayerSynth(): void {
    this.playersynths.push(new PlayerSynth())
    this.requestUpdate();
  }

  private _addMembraneSynth(): void {
    this.membranesynths.push(new MembraneSynth())
    this.requestUpdate();
  }

  private _playStop(): void {
    if (this.playing) {
      this.playersynths.map(e=>e.player.stop())
      Tone.Transport.stop()
    }
    else {
      const loop: Tone.Loop = new Tone.Loop((time) => {
        this.monosynths.forEach((s: Synth) =>{
          this.clock++;
        })
      }, "1m").start(0);
      Tone.Transport.start("+1")
      this.playersynths.map(e=>e.player.start("+1"))
      // Tone.setContext(new Tone.Context({ latencyHint : "balanced" }))
      // route all audio through a filter and compressor
      Tone.Destination.chain(this.reverbNode);




      // this.reverbNode.receive("reverb").toMaster()

    }
    this.playing = !this.playing
  }

  static styles = css`
:host {
  margin: 0 auto;
  text-align:center;
}

div.synth {
  margin:auto;
}
`
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-synths': Synths
  }
}
