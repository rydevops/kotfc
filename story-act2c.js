/* =========================================================================
   story-act2c.js — ACT II (part 3): DIMMERROW
   Steps: 15 sailing for Dimmerrow · 16 on the island · 17 Hollis has told
          his part · 18 the Maw is down · 19 fugitives; sail for Hushwell
   ========================================================================= */
(function () {
  'use strict';
  const story = (G.story = G.story || {});
  const J = G.data.story.journal;

  J.push(
    { step: 16, title: 'Dimmerrow', text: 'The island is grey from edge to edge. The villagers are still here, but they stopped talking last winter. They hum, and walk their old routes, and do not know why. My pendant is warm the whole time.' },
    { step: 17, title: 'Brother Hollis', text: 'Hollis keeps Odalys\'s humming stones on his belt. When I stepped off the dock, they sang for the first time in two years. She left him a letter: "If the Current ever answers a girl, bring her to Maribel. My truth is under the Crown. The Quiet Heron will know the way."' },
    { step: 18, title: 'The Short Blade', text: 'A hole in the grey tried to eat a little girl called Marn. My pendant became a short, bright blade, just long enough to stand between them. Hollis stood beside me. He swore never to harm anyone, and he stood there anyway.' },
    { step: 19, title: 'Wanted', text: 'There is a notice on the dock: every ferry and sky-rail is closed until I come home, and anyone who shelters me is "an offence against the Conservatory." Hollis says there is one ship that does not need rails. She is called the Quiet Heron, and she is at Hushwell.' },
  );

  /* ------------- arrival ------------- */
  story.dimmerrowArrive = async (S) => {
    S.flag('dimmerrowArrived');
    S.setStep(16);
    await S.wait(500);
    await S.narrate('Dimmerrow is grey from the shore to the windmills. The grass, the sky and the roofs have all faded to the same colour, like a drawing left in the rain.');
    await S.say('pip', 'It is so quiet.');
    await S.say('vesper', 'I know quiet. This is not quiet. Quiet is when people are being polite. This is when they have forgotten how to speak.');
    await S.say('wren', 'My pendant is warm. It has not stopped since the skiff.');
    await S.say('cog', 'Bleep.');
    await S.say('pip', 'Cog says the lamps here do not hum. He can hear lamps, usually. He says the silence is making his gears itch.');
    S.objective('Find Brother Hollis, who tends the villagers. His Tending House is at the north end of the village.');
    G.ui.toast('Dimmerrow: the Hollowed are not enemies. Fights with them end with a calm, and they wake up unharmed.');
  };

  /* ------------- Hollis ------------- */
  story.hollisMeet = async (S) => {
    const st = S.st;
    if (!st.flags.hollisMet) {
      S.flag('hollisMet');
      await S.say('hollis', 'Please, speak softly. They do not mind noise, but they remember it as pain.');
      await S.say('wren', 'I am sorry. I am Wren. This is Pip, Vesper, and a lantern called Cog.');
      await S.say('hollis', 'Brother Hollis, of the Quiet Hands. You are the girl in the patched blue cloak.');
      await S.say('wren', 'You have heard.');
      await S.say('hollis', 'The whole fringe has heard. A bounty, a proclamation, a worried and loving Archmage. I do not hold with bounties.');
      await S.say('pip', 'Brother Hollis, we are looking for Odalys Fenwick. Old Wick says she sent you a crate of stones.');
      await S.say('hollis', 'She did. Eleven grey stones that hum.');
      await S.narrate('He opens a little cloth bag at his belt. Eleven small stones lie inside, pale as bone.');
      await S.say('hollis', 'I use them to listen. The Current is very faint on Dimmerrow. Sometimes I can hear it in the stones, the way you can hear the sea in a shell.');
      await S.say('hollis', 'They have not sounded in two years. And when you stepped off the dock this morning...');
      await S.narrate('The stones hum. A low, steady note rises from the bag, and the pendant at Wren\'s collar answers it.');
      await S.say('wren', 'It is singing back.');
      await S.say('hollis', 'It is answering you. I have not heard anything answer in a very long time.');
      await S.emote('hollis', '...', 1400);
      await S.say('hollis', 'Odalys left me a letter, in case this ever happened. I did not think it would.');
      S.give('odalysNote2');
      await S.narrate('Hollis unfolds a sheet of tidy, slanted handwriting.');
      await S.narrate('"Brother Hollis. If the Current ever answers a girl, bring her to Maribel, and tell her this: my truth is under the Crown, in the workshop with the green door. The Quiet Heron will know the way. Forgive the secrecy. — O.F."');
      await S.say('pip', 'That is her handwriting. That is *exactly* her handwriting.');
      await S.say('wren', 'Under the Crown? What crown?');
      await S.say('hollis', 'Aurelith. The Sunken Crown, the old royal capital. It dropped into the Drift years ago. Her workshop is under it, if the letter is right.');
      await S.say('vesper', 'A workshop under a drowned city. Always a cheerful sort of person.');
      await S.say('hollis', 'I cannot leave these people. They forget to eat. They walk off the cliff paths. But I will help you as I can.');
      await S.say('hollis', 'There is a little girl who hums on the green every evening. Listen to her, if you have a moment. She does it without knowing why.');
      S.setStep(17);
      S.objective('Visit the village green and listen to Little Marn. Pell\'s Shelves sells supplies.');
      return;
    }
    await S.say('hollis', 'Take your time. The grey will not mind, and neither will I.');
  };

  story.pell = async (S) => {
    const st = S.st;
    if (!st.flags.pellMet) {
      S.flag('pellMet');
      await S.say('pell', 'You are the first customers I have had since the winter. I do not know whether to be glad or very worried.');
      await S.say('pell', 'Every morning I open the shutters. Every morning they come and stand outside, and hum, and go away again. Nobody buys. Nobody asks for the price.');
    } else await S.say('pell', st.step >= 18 ? 'The shelves are not much. But they are mine again, because you gave me a reason to open the shutters.' : 'Take whatever helps. Pay what you can.');
    return S.shop('dimmerrowStore');
  };

  story.marn = async (S) => {
    const st = S.st;
    const nm = { name: 'Marn', look: 'marn' };
    if (st.step >= 18 && G.game.hasKey('lullabyBox') && !st.flags.marnBox) {
      S.flag('marnBox');
      await S.narrate('Wren winds the little tin music box and sets it down in Marn\'s hands. It plays three notes. Then it forgets the rest.');
      await S.wait(400);
      await S.narrate('And Marn hums the fourth note. Then the fifth. The tune finally finishes, and her face changes the way a window changes when the light behind it comes on.');
      S.music('lullaby');
      await S.say(nm, '...Mama used to sing this.');
      await S.say('hollis', 'Marn. You said a word.');
      await S.say(nm, '...Home?');
      await S.say('wren', 'Soon. We are working on it.');
      S.take('lullabyBox');
      S.give('emberFeather');
      await S.wait(600);
      S.music('dimmerrow');
      return;
    }
    S.music('lullaby');
    await S.narrate(st.step >= 18 ? 'Marn hums three notes, then a fourth she has never hummed before, then stops, surprised.' : 'A little girl hums three notes of a lullaby, then starts again from the beginning.');
    S.music('dimmerrow');
  };

  story.wanderer = async (S) => {
    await S.narrate('A hollowed scholar stands knee-deep in the grey grass, far from the village. He murmurs the same line of a lecture, over and over, to an audience of weeds.');
    const c = await S.choose(null, 'Lead him back to the Tending House?', ['Lead him home', 'Leave him'], { cancel: 1 });
    if (c !== 0) return;
    await S.fadeOut(500);
    S.removeNpc('hWander');
    S.flag('wandererHome');
    await S.wait(600);
    await S.fadeIn(500);
    await S.narrate('Wren walks him back along the path, one slow step at a time. At the Tending House, a sister meets them and takes his arm.');
    await S.say({ name: 'Sister Anselm', look: 'sister' }, 'Thank you. He wanders off most nights, looking for a classroom that is not there. Please, take this. Hollis will want you to have it.');
    S.give('tideCrystal');
  };

  /* ------------- the Rift Maw ------------- */
  story.mawScene = async (S) => {
    S.music('lullaby');
    S.actor('marn') && (S.actor('marn').wander = 0);
    await S.move('player', 'DD', 130);
    await S.narrate('Marn hums on the green, three notes and then a fourth, as the grey light thins toward evening.');
    await S.say('wren', 'It sounds like something I should know.');
    await S.say('hollis', 'She has hummed it every evening since the winter. I have never found the end of it.');
    S.music(null);
    await S.wait(300);
    S.sfx('rumble');
    S.shake(4, 1400);
    await S.narrate('The hum stops. Every villager on the green stops with it. All together, they turn toward the north end of the island.');
    await S.say('pip', 'Okay. Cog says that is a very bad sign. He says it in four different beeps.');
    S.flash('#dcdcff', 400);
    S.shake(6, 900);
    S.sfx('surge');
    S.addNpc({ id: 'maw', look: 'mawNpc', x: 20, y: 15, dir: 'down' });
    await S.narrate('The grey seam in the sky bursts open. Something enormous begins to pour through it, a hole that has learned to hunger.');
    await S.say('hollis', 'The Maw. It eats what is lost. And on this island, everyone is lost.');
    S.face('marn', 'up');
    await S.say('vesper', 'The little one is not moving!');
    await S.move('player', 'DD', 90);
    await S.say('wren', 'Marn, behind me!');
    S.sfx('thud');
    S.shake(5, 700);
    S.flash('#ffffff', 700);
    S.sfx('pendant');
    S.flag('blade2');
    await S.narrate('The pendant at Wren\'s collar blazes. It lengthens, edge by edge, from a brass trinket into a short, bright blade of pure light, barely longer than her forearm.');
    await S.say('wren', 'It is a *sword*?');
    await S.say('cog', 'BLEEP!');
    await S.say('pip', 'Cog says "that is a key, you absolute genius." He says the blade is the key, and the key is the blade, and also he told you so.');
    await S.narrate('The Maw recoils from the light. The hum of the villagers trembles, and for a moment their faces almost wake.');
    G.ui.toast('The key-blade has awakened! Wren learns Tap Slash.');
    await S.say('hollis', 'Wren. I can hear it. Through the blade, through the stones. The Current is *singing*.');
    await S.say('wren', 'Hollis, I need help!');
    await S.say('hollis', 'I swore never to harm anyone.');
    await S.say('hollis', 'But I did not swear to stand by. I will stand beside you. That, at least, I can do.');
    S.flag('hollisJoined');
    S.join('hollis');
    G.ui.toast('Hollis joins the party. He heals and shields. He will not strike first.');
    await S.say('vesper', 'Welcome to the dangerous side of being good.');
    await S.battle({ mobs: ['riftMaw'], bg: 'dimmerrow', music: 'boss', noFlee: true });
    S.removeNpc('maw');
    S.flag('mawDown');
    S.setStep(18);
    S.refreshEnv();
    S.sfx('heal');
    await S.narrate('The Maw folds in on itself and shrinks into a thin seam of grey light, and then the seam closes like a mouth.');
    await S.narrate('For the first time in two years, the wind moves through the village, and the braziers burn a little warmer.');
    await S.say('wren', 'Everyone is blinking. They are *blinking*.');
    await S.say('hollis', 'The pull is gone. They are still hollow, but they are lighter. It will take years, and the Current, to bring them all the way back.');
    S.music('lullaby');
    await S.say({ name: 'Marn', look: 'marn' }, '...pretty.');
    await S.say('wren', 'The blade? Yes. It is. I think it is also a very sharp friend.');
    await S.narrate('The blade folds itself back into the pendant, as if it were shy.');
    await story.fugitives(S);
  };

  /* ------------- fugitives ------------- */
  story.fugitives = async (S) => {
    S.music('dimmerrow');
    S.addNpc({ id: 'pellNotice', look: 'pell', x: 20, y: 25, dir: 'up' });
    await S.move('pellNotice', 'UUU', 130);
    await S.say('pell', 'Brother Hollis! I found this nailed to the dock post. It was not there this morning.');
    await S.narrate('He passes a printed notice to Wren. The Conservatory\'s star seal sits at the bottom, over a neat signature.');
    await S.narrate('"BY ORDER OF THE GRAND ARCHMAGE. The ward Wren Ashgrove is sought for questioning concerning the failure at Pennywhistle Harbor. For her safety and the safety of the public, all ferry and sky-rail routes are closed until her return. Harborage of the girl is an offence against the Conservatory."');
    await S.say('vesper', '"Harborage of the girl." He is very polite about it.');
    await S.say('pip', 'How can he close the sky-rails? That is every route in Orrenth!');
    await S.say('hollis', 'The rails run on the Current from the tap-stations. He holds the keys to most of them. He cannot close the sky, though. Only the roads in it.');
    await S.say('wren', 'Then how do we leave?');
    await S.say('hollis', 'There is one ship that never needed rails. The Quiet Heron. She is moored at Hushwell Sanctuary, my home. The first Quiet Hands built her to carry those who listen to the Current.');
    await S.say('vesper', 'A ship that does not need ferries. I am already in love.');
    await S.say('hollis', 'Elder Maribel will not give her away lightly. But she might give her to you. Odalys wrote that the Heron will know the way.');
    await S.say('pip', 'Can the skiff reach Hushwell?');
    await S.say('hollis', 'The skiff runs on wind and spite. It can reach Hushwell, but no farther.');
    await S.say('hollis', 'And I will come with you. The sisters will tend the village, and I will send word.');
    await S.say('wren', 'Hollis, you do not have to. You have people here.');
    await S.say('hollis', 'I heard it, Wren. In the blade. I will tell you what it said when I am ready. Not yet.');
    await S.say('wren', 'Whenever you are ready.');
    S.removeNpc('pellNotice');
    G.travel.unlock('hushwell');
    S.setStep(19);
    G.ui.toast('Hushwell Sanctuary added to the skiff\'s destinations.');
    S.objective('Sail the skiff to Hushwell Sanctuary with Hollis. Use the skiff at the south dock.');
    S.respawnNpcs();
  };

  // overworld art for the Maw (the battle art, shown as a big still sprite)
  G.register('looks', 'mawNpc', {
    custom: () => { const c = G.sprites.mob(G.data.mobs.riftMaw); const a = [c, c, c, c]; return { down: a, up: a, left: a, right: a }; },
  });
  G.register('items', 'odalysNote2', { name: "Odalys's Letter", type: 'key', desc: '"My truth is under the Crown, in the workshop with the green door. The Quiet Heron will know the way."' });
})();
