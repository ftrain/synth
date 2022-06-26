const trans = Tone.Transport;
trans.bpm.value = 120;

const stuff = document.querySelector('div#stuff');

const _ = null;
const makeArr = function(base, mult, len) {
  let arr = [];
  for (var i=1; i < len; i++) {
    let m = base + (base * mult * i);
    if (i > len/2) {
      m = base + (base * mult * (len - i));
    }
    arr[i - 1] = m + (Math.random() * 0);
  }
  return arr;
}

const feedbackDelay = new Tone.FeedbackDelay("8n", 0.5);
const dist = new Tone.Distortion(0.5);
const reverb = new Tone.Reverb();
const autoFilter = new Tone.AutoFilter(0.125).start();

let base = 110;

function getChord(chord, octave) {
  const notes = Tonal.Chord.get(chord).notes;
  const tones = notes.map(x=>`${x}${octave}`);
  return tones;
}

function getBeat(n, x=1) {
  let a = [_, _, _, _];
  a[x - 1] = n;
  return a;
}

let seqs = [];
function getSeq(synth, chord, octave, release, tempo, start=0, hold) {
  const seq = new Tone.Sequence((time, note) => {
    synth.triggerAttackRelease(note, release, time);
  }, getChord(chord, octave), tempo).start(start + "m");
  seq['octave'] = octave;

  seqs.push(seq);
  return seq;
}

function getSeqNoise(synth, chord, octave, release, tempo, start=0, hold) {
  const seq = new Tone.Sequence((time, note) => {
    synth.triggerAttackRelease(release, time);
  }, getChord(chord, octave), tempo).start(start + "m");
  seq['octave'] = octave;
  seq.humanize = true;
  seqs.push(seq);
  return seq;
}

 function gainLFO(dur, from, to) {
  const g = new Tone.Gain().toDestination();
  const lfox = new Tone.LFO(dur, from, to);
  lfox.shape="sawtooth";
  lfox.chain(g.gain);
  lfox.start();
  return g;
}

const start = function(chord) {

  const g32 = gainLFO("32m", 0.2, 0.3);
  const g16 = gainLFO("1m", 0.2, 0.3);

  const ps2 = new Tone.PluckSynth({
    attackNoise : 2.5,
    dampening : 50,
    attack : 5.5,
    release : 5.5,
    resonance : 0.999,
    volume : -15
  });

  const chorus = new Tone.Chorus(4, 2.5, 0.5).toDestination().start();

  ps2.chain(g16, chorus);

  const ps3 = new Tone.PluckSynth({
    attackNoise : 2.5,
    dampening : 50,
    attack : 2,
    release : 2,
    resonance : 0.99,
    volume : -15
  });

  ps3.chain(g32, dist);

  const drumsDelay = new Tone.FeedbackDelay("8n", 0.5).toDestination();
  const reverb2 = new Tone.Reverb(3).toDestination();
  const drums = new Tone.MembraneSynth({volume:-15, detune:60, octaves:4})
                        .chain(drumsDelay, reverb2)
                        .toDestination();

  const drums2Delay = new Tone.FeedbackDelay("6n", 0.8).toDestination();

  const drums2Delay2 = new Tone.FeedbackDelay("12n", 0.6).toDestination();


  const g8ad = gainLFO("8m", 0.01, 0.025);
  const drums2 = new Tone.NoiseSynth({volume:-45, noise:"brown"})
                         .fan(drums2Delay, drums2Delay2)
                         .chain(reverb2)
                         .chain(g8ad);

  const ms = new Tone.PolySynth({volume:-15}).toDestination();

  const msUpper = new Tone.PolySynth({volume:-30}).toDestination();

  const g8a = gainLFO("16m", 0.001, 0.22);
  const props = {
    detune:1,
    portamento:0.1,
    oscillator: {type:"square"},
	envelope: {
	  attack: 3,
	  decay: 3,
	  release: 1
	}};
  const msUpper1 = new Tone.MonoSynth(props).chain(dist, feedbackDelay, reverb, g8a);
  const msUpper2 = new Tone.MonoSynth(props).chain(dist, feedbackDelay, reverb, g8a);
  const msUpper2a = new Tone.MonoSynth(props).chain(dist, feedbackDelay, reverb, g8a);


  const g24 = gainLFO("32m", 0.01, 0.1);
  const msUpper3 = new Tone.MonoSynth().connect(g24);

const sw = new Tone.StereoWidener();
  const g32b = gainLFO("32m", 0.1, 0.17);
  const msUpper4 = new Tone.MonoSynth()
                           .chain(g32b, dist, sw, feedbackDelay);

 const seqDrums = getSeq(drums, chord, 1, 0.1, "2m", 0);
 const seqDrums2 = getSeqNoise(drums2, chord, 1, 0.1, "3m", 0);

 const seqLeadPluck = getSeq(ps2, chord, 4, 12, "1m", 0);
 const seqLeadPluck2 = getSeq(ps3, chord, 2, 12, "2n", 0);


const seqLeadMonoHigh1 = getSeq(msUpper1, chord, 6, 12, "12n", "16m");
const seqLeadMonoHigh2 = getSeq(msUpper2, chord, 3, 12, "3n", "16m");
const seqLeadMonoHigh2a = getSeq(msUpper2a, chord, 5, 12, "6n", "16m");

 const seqLeadMonoHigh3 = getSeq(msUpper3, chord, 5, 0.1, "16n", "8m");
const seqLeadMonoHigh4 = getSeq(msUpper4, chord, 4, 8, "8n", "8m");

const seqLeadMonoHigh = getSeq(msUpper, chord, 4, 5, "2m", 0);
const seqLeadMono = getSeq(ms, chord, 2, 3, "1m", 0);
}

let playing = false;
document.querySelector('button')?.addEventListener("click", () => {
  if (!playing) {

    const chords = ["Em7", "Am13", "D7", "G7", "C7", "F#dim", "B7", "Em13"];

    start(chords[0]);

    let i = 0;
    const loop = new Tone.Loop((time) => {
      seqs.forEach((seq)=>{
        const chord = chords[i % chords.length];
        stuff.innerHTML = `${chord}`;

        seq.set({events:getChord(chord, seq.octave)});
      })
      i++;

    }, "32m").start(0);


    trans.start();
    playing = true;
  }
  else {
    trans.stop();
    playing = false;
  }
});


  document.querySelector('input#a')?.addEventListener("change", (e) => {
    const n = e.target.value * 5;
    // seqB.events = getBeat(n, 0);
  });

  document.querySelector('input#b')?.addEventListener("change", (e) => {
    const n = e.target.value * 5;
    // seqC.events = getBeat(n);
  });
