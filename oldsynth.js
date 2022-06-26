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
  seqs.push(seq);
  return seq;
}

const start = function(chord) {

  const lfox = new Tone.LFO({min:0,
                             max:150,
                             amplitude:1,
                             type:"sine",
                             frequency:"4m"})
                       .sync()
                       .start();


  let x = new Tone.Synth().toDestination();
  //var volx = new Tone.Volume(-25);
  // lfox.connect(x.detune);

  x.triggerAttack("C3");
  // getSeq(x, "E", 5, 12, "1m", 0);


  const ps1 = new Tone.PluckSynth({volume:-35}).toDestination();

  const ps1Delay = new Tone.FeedbackDelay("8n", 0.8);
  ps1.connect(ps1Delay);

  const ps2 = new Tone.PluckSynth({
    attackNoise : 2.5,
    dampening : 50,
    attack : 5.5,
    release : 5.5,
    resonance : 0.999,
    volume : -18
  }).toDestination();

  const chorus = new Tone.Chorus(4, 2.5, 0.5).toDestination().start();

  const vib = new Tone.Vibrato(1).toDestination();

  ps2.connect(chorus, vib);

  const drumsDelay = new Tone.FeedbackDelay("8n", 0.5).toDestination();

  const drums = new Tone.MembraneSynth({volume:-15, detune:80, octaves:4})
                        .chain(dist, reverb, drumsDelay)
                        .toDestination();

  const drums2Delay = new Tone.FeedbackDelay("8n", 0.5).toDestination();

  const drums2filter = new Tone.AutoFilter(
    {frequency:"1m",
     wet:0.5,
     type:"sawtooth32",
     depth:0.5}).toDestination();

  const drums2 = new Tone.NoiseSynth({volume:-30, noise:"brown"})
                         .chain(chorus, drums2Delay, drums2filter)
                         .toDestination()
                         ;

  const pano = new Tone.PanVol({pan:-0.5, volume:-30}).toDestination();

  const lfo = new Tone.LFO({min:-1, max:1, amplitude:0.5, frequency:"2m"}).start();
  lfo.connect(pano.pan);
  pano.toDestination();
//  ms.connect(pano);

  const ms = new Tone.PolySynth({volume:-25}).toDestination();

  const msUpper = new Tone.PolySynth({volume:-30}).connect(pano).toDestination();
  const msUpper2 = new Tone.MonoSynth({volume:-30}).toDestination();

/*  const vol = new Tone.Volume(-55);



*/

  const lfo2 = new Tone.LFO(0.01, -100, -30).start();
  const vol = new Tone.Volume(-50).toDestination();

  //lfo2.connect(vol.volume);
  const msUpper3 = new Tone.MonoSynth().connect(vol);




  const msUpper4 = new Tone.MonoSynth({volume:-30, attack:"4n"})
                           .connect(feedbackDelay)
                           .toDestination();


  // lfo.connect(ps1.set.attackNoise);

/*
  const seqDrums = getSeq(drums, chord, 0, 0.1, "2m", 0);

  const seqDrums2 = getSeqNoise(drums2, chord, 0, 0.1, "4m", 0);

  const seqArpeggiator8 = getSeq(ps1, chord, 1, 0.1, "2n", 0);
  const seqLeadPluck = getSeq(ps2, chord, 4, 12, "1m", 0);

  const seqLeadMonoHigh2 = getSeq(msUpper2, chord, 5, 12, "1m", 0);
  const seqLeadMonoHigh3 = getSeq(msUpper3, chord, 5, 0.1, "16n", 0);
  const seqLeadMonoHigh4 = getSeq(msUpper4, chord, 4, 8, "8n", 0);

  const seqLeadMonoHigh = getSeq(msUpper, chord, 4, 20, "4m", 0);
  const seqLeadMono = getSeq(ms, chord, 2, 3, "1m", 0);

*/
}

let playing = false;
document.querySelector('button')?.addEventListener("click", () => {
  if (!playing) {

    const chords = ["Dm7", "Em7", "A7", "Em7", "Db7b9", "C6", "F", "Em7", "A7b9"];

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
