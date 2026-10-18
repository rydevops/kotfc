/* =========================================================================
   story-act2.js — ACT II (part 1): HULLHAVEN
   Steps: 10 arrive in the Drift · 11 asking around · 12 Leviathan down,
          skiff and lead in hand (Tallow Cay unlocked)
   ========================================================================= */
(function () {
  'use strict';
  const story = (G.story = G.story || {});
  const J = G.data.story.journal;

  J.push(
    { step: 10, title: 'The Drift', text: 'We sailed down through the fog into Hullhaven, a town made of crashed airships. The islands up above looked so small from down here. Pip says this is home. It does not look like anyone\'s home.' },
    { step: 12, title: 'Bilge\'s Lead', text: 'We cleared the Breakers, and Salvage-Mother Bilge paid up: a skiff, and a brass dock tag stamped O. FENWICK, left at Tallow Cay. Isolde says the crate was built to break the station. Nobody builds a thing like that by mistake.' },
  );

  /* ------------- arrival ------------- */
  story.hullArrive = async (S) => {
    await S.fadeOut(600);
    S.music('hullhaven');
    await S.card('Hullhaven', 'Act II · The Hunt', 2600);
    S.setStep(11);
    S.st.chapter = 'Act II';
    await S.warp('hullhaven', 20, 32, 'up', { skipEnter: true });
    await S.say('pip', 'Hullhaven! Oh, I missed this smell. Rust, fish, and wet rope.');
    await S.say('wren', 'It smells like a shipwreck.');
    await S.say('pip', 'It is a shipwreck. Forty of them, lashed together. Home sweet home.');
    await S.say('cog', 'Bleep.');
    await S.say('pip', 'Cog says I always say that about places that smell. He is wrong. Mostly.');
    await S.say('wren', 'Where do we start? Odalys was your mentor. Did she ever come down here?');
    await S.say('pip', 'Twice that I know of, both times for parts. The woman who runs this town sold them to her: Salvage-Mother Bilge. If anyone knows where Odalys went, it is Bilge.');
    await S.say('wren', 'And if she does not?');
    await S.say('pip', 'Then she will charge us for the answer anyway. Come on.');
    G.ui.toast('Hullhaven: salvaged gear at the Salvage Heap, rest at the Rusty Gull.');
    S.objective('Find Salvage-Mother Bilge at the Salvage Heap in the middle of town.');
    S.respawnNpcs();
  };

  /* ------------- Salvage-Mother Bilge ------------- */
  story.bilge = async (S) => {
    const st = S.st;
    if (!st.flags.metBilge) {
      S.flag('metBilge');
      await S.say('bilge', 'Pip Quillfeather. Eleven months, no word, and you come back with a Conservatory cloak on your arm.');
      await S.say('pip', 'Hello, Bilge. This is Wren. Wren, this is Bilge. She runs everything.');
      await S.say('bilge', 'I run the *salvage*. Everything else runs itself, mostly downhill. What do you want?');
      await S.say('wren', 'We are looking for an engineer named Odalys Fenwick. She vanished two years ago.');
      await S.emote('bilge', '...', 1400);
      await S.say('bilge', 'Odalys. Quiet woman. Always paid in exact change. I do not give away what I know, child. I sell it.');
      await S.say('pip', 'Bilge, please. She was my teacher.');
      await S.say('bilge', 'Then you know I am not a charity. But I will make you a trade.');
      await S.say('bilge', 'There is something living in the Breakers, in the wreck-forest below my north hatch. It ate three of my nets this week, and one of my fishermen is now sleeping in a tree. Kill it, and I will give you a skiff, because the public ferries are dead. Then I will give you what I know about Odalys.');
      await S.say('wren', 'A skiff? Ferries stopped running?');
      await S.say('bilge', 'Yesterday. Every route. Go and ask anyone on the docks. Something is eating the Current from underneath all of us, and nobody will say what.');
      await S.say('pip', 'We will take the deal.');
      await S.say('bilge', 'Good. Rest at the Gull first. Eat something. You both look like you have been dragged behind a ferry.');
      S.objective('Clear the Breakers beneath the north hatch, and speak with Isolde in the east wreck.');
      await S.shop('hullhavenSalvage');
      return;
    }
    if (st.flags.leviathanDown && !st.flags.skiff) {
      await S.say('bilge', 'Well. You are alive, and the nets are quiet. I can hear it from here.');
      await S.say('pip', 'It was really big.');
      await S.say('bilge', 'They always are. A deal is a deal.');
      S.give('skiff');
      S.flag('skiff');
      G.travel.unlock('hullhaven');
      await S.say('bilge', 'The skiff is yours. She is patched in nine places and rattles in ten, but she has never once sunk. Tie up at any dock and she will take you where the tide lets her.');
      await S.say('bilge', 'Now. Odalys.');
      await S.say('bilge', 'She used to take the Tallow Cay run on the last tide of every month. The month before she vanished, she did not come back from it.');
      S.give('odalysTag');
      await S.say('bilge', 'Her dock tag. The tide-clerk found it hanging off a post in the Cay and sold it to me for six coins. I will give it to you for nothing, because you did my town a kindness.');
      await S.say('pip', '...Thank you, Bilge.');
      await S.say('bilge', 'Do not thank me. Be careful. Tallow Cay is Vesper Nyx\'s turf, and she has a long memory and a short temper. If you need a name to drop, drop mine, and then run.');
      G.travel.unlock('tallow');
      S.setStep(12);
      G.ui.toast('Bilge\'s Skiff acquired. Talk to the skiff at a dock to sail.');
      S.objective('Sail to Tallow Cay in the skiff at the south dock, and ask about Odalys\'s tag.');
      return;
    }
    if (st.step >= 12) {
      await S.say('bilge', st.step >= 20 ? 'The Drift is quieter than it has been in a year. Either you did something very good or something very bad. Buy something.' : 'The tide waits for no one, and I do not wait for anyone who is not buying. Browse.');
      return S.shop('hullhavenSalvage');
    }
    await S.say('bilge', 'The Breakers are through the north hatch. Come back when it stops eating my nets.');
    return S.shop('hullhavenSalvage');
  };

  /* ------------- Isolde, recovering ------------- */
  story.isoldeHullhaven = async (S) => {
    const st = S.st;
    if (!st.flags.metIsoldeH) {
      S.flag('metIsoldeH');
      await S.say('isolde', 'Wren. And the little tinkerer. I had a feeling I would be seeing you.');
      await S.say('wren', 'Captain Brack! You are all right!');
      await S.say('isolde', 'I am an old airship pilot. Ribs are only structural. Sit down. Both of you.');
      await S.say('isolde', 'I spent two days taking that coupling apart in my head, and then on paper when the pain let me. It was a Founder\'s coupling. Very old, very fine work. And it is not a part that *fits* a tap-station.');
      await S.say('wren', 'What does that mean?');
      await S.say('isolde', 'It means it was built to do exactly what it did. To pull the Current out of the station until the station broke. Nobody builds a thing like that by accident, and nobody sends it to a harbor by accident.');
      await S.emote('wren', '...', 1400);
      await S.say('wren', 'Aldrith told me it was a cracked casing.');
      await S.say('isolde', 'I know what he told you. Pip, you have been quiet.');
      await S.say('pip', 'The rivets. The tiny star-shaped ones. That is Odalys Fenwick\'s hand. Somebody took her work and made it into... that.');
      await S.say('isolde', 'Then she is the thread to pull. Whoever finds her finds the truth. Go to Bilge. She is rude, but she is honest.');
      await S.say('isolde', 'And Wren? The ferries are failing. All of them. When a thing like that happens, somebody wants everyone to stay put. Keep moving.');
      S.objective('Speak with Bilge, then clear the Breakers beneath the north hatch.');
      return;
    }
    await S.say('isolde', st.step >= 14 ? 'Whatever you are doing, it is working. The mist has not come any closer this week. Barely.' : 'Rest when you can. Move when you must. Those are the only two rules I trust anymore.');
  };

  /* ------------- the Leviathan ------------- */
  story.leviathan = async (S) => {
    const st = S.st;
    if (st.flags.leviathanDown) return;
    S.music(null);
    S.shake(3, 700);
    S.sfx('rumble');
    await S.narrate('Something vast moves beneath the hull plates. The water is greener here, and brighter.');
    await S.say('pip', 'Okay. Okay. Cog says that is not a normal fish.');
    await S.say('wren', 'It is a sky-eel. A *huge* one. Look at the glow. It has been feeding on the Current the wrecks leak.');
    await S.say('pip', 'It sweeps its whole tail across the fight every few turns. If I can snare it first, it will lose the swing. Trap it, then hit it.');
    await S.say('cog', 'Bleep.');
    await S.say('pip', 'Cog says that is the first sensible plan I have ever had. He sounds worried.');
    S.sfx('thud'); S.shake(6, 900);
    await S.say({ name: 'Drift Leviathan' }, 'HHHRRRROOOOOOOOOOOO.');
    const r = await S.battle({ mobs: ['driftLeviathan'], bg: 'hullhaven', music: 'boss', noFlee: true });
    S.removeNpc('leviathan');
    S.flag('leviathanDown');
    await S.narrate('The eel slides back into the dark, humming a lower, gentler note. The greenish glow fades from the water.');
    await S.say('wren', 'It was not angry. It was hungry.');
    await S.say('pip', 'Everything down here is hungry. Come on. Bilge owes us a skiff.');
    S.objective('Return to Salvage-Mother Bilge in the Salvage Heap.');
    S.respawnNpcs();
  };

  /* ------------- town folk and side quests ------------- */
  story.fishwife = async (S) => {
    const st = S.st;
    if (st.flags.tamDone) return S.say({ name: 'Tam', look: 'fishwife' }, 'I have worn my brass sleeve every day since. My nets haven\'t snagged once. You two are welcome at my table.');
    if (!st.flags.tamAsked) {
      S.flag('tamAsked');
      await S.say({ name: 'Tam', look: 'fishwife' }, 'My net winch is down to its last good sleeve, and my old brass one rolled off the Breakers hull last week. I went after it, and something big came after *me*.');
      await S.say({ name: 'Tam', look: 'fishwife' }, 'If you go down there, keep an eye out for a brass coupling sleeve. It is about as long as a loaf. I will pay.');
      S.objective('Side quest: find Tam\'s brass sleeve somewhere in the Breakers.');
      return;
    }
    if (G.game.hasKey('stationPart')) {
      await S.say({ name: 'Tam', look: 'fishwife' }, 'That is it! That is my sleeve!');
      S.take('stationPart');
      S.gold(220);
      S.give('hearthStew', 2);
      S.flag('tamDone');
      await S.say({ name: 'Tam', look: 'fishwife' }, 'Take it all. The gold, and the stew. It is an honest wage.');
      return;
    }
    await S.say({ name: 'Tam', look: 'fishwife' }, 'Still looking for my brass sleeve? Somewhere in the Breakers, I am sure. Mind the eel.');
  };

  story.hullLantern = async (S) => {
    const st = S.st;
    const nm = { name: 'Little Nox', look: 'kid' };
    if (st.flags.noxDone) return S.say(nm, 'It is still burning! Look! Everybody keeps stopping to look at it!');
    if (!st.flags.noxAsked) {
      S.flag('noxAsked');
      await S.say(nm, 'This is my lantern. It has not been lit since the ferries stopped. Mom says the Current is too thin for the wick.');
      await S.say(nm, 'But she says a drop of lantern oil might do it, because oil does not need the Current. Do you have any? I can pay you in... a button.');
      return;
    }
    if (G.game.count('lanternOil') > 0) {
      await S.say(nm, 'Oil! Real oil! Oh please, please.');
      S.take('lanternOil');
      S.sfx('pendant');
      await S.wait(500);
      await S.narrate('The wick takes. A small, warm flame stands up in the glass, and the boy stares at it with his whole face.');
      S.give('luckyButton');
      S.gold(60);
      S.flag('noxDone');
      await S.say(nm, 'It is working! It is the first light I have made all week! Here, take my button. It is lucky.');
      return;
    }
    await S.say(nm, 'Still no oil? I will wait. I am good at waiting. It is the only thing I am good at.');
  };

  story.pipKin = async (S) => {
    const st = S.st;
    const nm = { name: 'Nib', look: 'pipKin' };
    if (!st.flags.nibMet) {
      S.flag('nibMet');
      await S.say(nm, 'PIP?! Pip Quillfeather! I thought you had gone up to the Isles to become a rich and respectable person!');
      await S.say('pip', 'I did go up. I am neither, Nib. Wren, this is Nib. We used to share a bunk and three spanners.');
      await S.say(nm, 'Two spanners. You *borrowed* one, and then you moved to the Conservatory.');
      await S.say('pip', 'Nib, has anyone been asking about Odalys? Anyone coming through, anyone leaving?');
      await S.say(nm, 'Nobody, but... she left her old toolbag with Bilge before she vanished. Bilge keeps it behind the counter and will not sell it. Ask her about the Cay. That is all I know.');
      await S.say('pip', 'Thank you, Nib.');
      await S.say(nm, 'Look after yourself, Pip. It is getting strange down here.');
      return;
    }
    await S.say(nm, st.step >= 12 ? 'Heard you cleared the Breakers! The whole town is saying it was a Conservatory girl in a patched cloak. I am telling everyone I knew you first.' : 'Ask Bilge about the Cay. She never gives anything away, but she does give hints.');
  };
})();
