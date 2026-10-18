/* =========================================================================
   story-act3.js — ACT III (part 1): HUSHWELL SANCTUARY
   Steps: 19 sailing for Hushwell · 20 on the island, with Maribel
          21 Neve spared, the Quiet Heron is yours (Aurelith unlocked)
   ========================================================================= */
(function () {
  'use strict';
  const story = (G.story = G.story || {});
  const J = G.data.story.journal;

  J.push(
    { step: 20, title: 'Hushwell', text: 'Hushwell is the first place in weeks where the Current does not feel thin. The pools are still, and the stones hum. Hollis walked through the gate like a boy who was afraid of being scolded. Elder Maribel is blind, and she says she heard me coming.' },
    { step: 21, title: 'The Quiet Heron', text: 'Neve came to drain the sanctuary, and Hunger was all that was left of her. I did not hurt her. She told me the thing I most needed to hear and least wanted to: Aldrith needs my key. Everything he has done has been to open something, and I am the only one who can. Maribel gave us the Quiet Heron, and she hums when I touch her.' },
  );

  /* ------------- arrival ------------- */
  story.hushwellArrive = async (S) => {
    S.flag('hushArrived');
    S.setStep(20);
    await S.wait(500);
    await S.narrate('Hushwell Sanctuary climbs the hill in terraces of green and gold. Still pools reflect the sky, and somewhere in the gardens, a hundred stones hum a hundred different notes.');
    await S.say('pip', 'It is *beautiful*. Cog has stopped beeping. He is listening. I have never seen him listen.');
    await S.say('vesper', 'I did not know places like this still existed. It makes me want to check my pockets.');
    await S.say('wren', 'My pendant is quiet. It is not warm or restless. It feels as if it is... resting.');
    await S.say('hollis', 'This is the last place where the Current is strong enough to rest.');
    await S.narrate('Hollis walks more slowly with every step, like someone who has been away so long that he is afraid the house will not know him.');
    await S.say({ name: 'Sister', look: 'sister' }, 'Hollis? Brother Hollis! The elder said you would come, and nobody believed her!');
    await S.say('hollis', 'Sister Wyn. Hello. I am sorry I did not write more often.');
    await S.say({ name: 'Sister', look: 'sister' }, 'You did not write at all. She is waiting in the Elder\'s Hall, at the top of the terraces. She is expecting your friends, too.');
    S.objective('Speak with Elder Maribel Thorne in the Elder\'s Hall, at the top of the terraces.');
    G.ui.toast('Hushwell: the Quiet Hands never charge for a bed. Garden Stores sell gear and honey.');
  };

  /* ------------- Maribel ------------- */
  story.maribel = async (S) => {
    const st = S.st;
    if (st.flags.heron) {
      await S.say('maribel', 'The Heron is humming. I can hear her from here. Go carefully, and listen first.');
      return;
    }
    if (st.flags.maribelMet) {
      await S.say('maribel', 'The Heron waits at the south dock. Speak to her, and she will answer.');
      return;
    }
    S.flag('maribelMet');
    await S.say('maribel', 'Come closer, children. I have been listening to your boat since it touched the water.');
    await S.say('wren', 'Elder Maribel? I am Wren Ashgrove.');
    await S.say('maribel', 'You carry a bright sound, Wren. May I?');
    await S.narrate('The old woman lifts a hand. Her eyes are pale and still, but her fingers find the pendant without the slightest hesitation.');
    await S.say('maribel', 'Ah. I hoped never to hear that again. And I hoped very much to hear it once more.');
    await S.say('maribel', 'Hollis, my boy. You are still holding your breath.');
    await S.say('hollis', 'Elder.');
    await S.say('maribel', 'The sisters tell me you went to the fringe to tend the Hollowed, because you could not bear to sit in a garden while people forgot their own names. That was well done.');
    await S.say('wren', 'Elder, we are looking for Odalys Fenwick\'s workshop. She wrote that the Quiet Heron will know the way.');
    await S.say('maribel', 'Odalys. Yes. She visited me once, in the last summer. She said, "When the girl comes, give her the Heron." I thought she was frightened. She was never mad, but she was frightened.');
    await S.say('maribel', 'The Heron is moored at our south dock. She is old, and she has been waiting a very long time. She does not obey. She *listens*. And I think, Wren, that she will listen to you.');
    await S.say('pip', 'A ship that listens. Cog says that is either wonderful or terrifying. He cannot decide.');
    await S.say('maribel', 'And now, Hollis. A word. You may all stay, but this is for him.');
    await S.say('maribel', 'You hear it, don\'t you? The Current. You always have.');
    await S.emote('hollis', '...', 1600);
    await S.say('hollis', 'Yes. I do.');
    await S.say('wren', 'Hear it? Like...?');
    await S.say('hollis', 'Like a bell under water. A very patient one. It speaks, Wren, not in words. In... meaning. I have heard it since I was a boy, and I have told no one.');
    await S.say('hollis', 'I was afraid. If the Conservatory knew that someone could hear it, they would make me a tool. A listening-post. A weapon to point at the Current and ask it to bend.');
    await S.say('maribel', 'The Quiet Hands swore never to harm. We did not swear to hide, my child.');
    await S.say('maribel', 'A gift is not a weapon until someone chooses to make it one. You may choose. And when it counts, I am asking you to use it.');
    await S.say('hollis', '...When it counts.');
    await S.say('maribel', 'You will know the moment. You always have.');
    S.flag('resolve');
    G.ui.toast('Hollis can now use Resonant Palm. He only needs to decide when.');
    await S.say('hollis', 'Thank you, Elder. I will try.');
    // the stones fall quiet
    S.sfx('fizzle');
    await S.narrate('Outside the hall, the humming stops. One stone, then ten, then every stone in the garden, in a long, descending line, as if somebody were putting out lamps.');
    await S.say('maribel', '...Oh. Something is drinking the garden.');
    await S.say('hollis', 'Elder, stay here.');
    await story.neveScene(S);
  };

  /* ------------- Neve ------------- */
  story.neveScene = async (S) => {
    S.flag('neveHere');
    S.refreshEnv();
    S.music(null);
    S.addNpc({ id: 'neve', look: 'neve', x: 20, y: 12, dir: 'down' });
    await S.move('player', 'DDDD', 120);
    S.sfx('rumble');
    await S.narrate('The grass has gone grey in a long line across the terrace, as though something was dragging its hand through the garden. At the end of that line stands a slight figure in a Conservatory cloak.');
    await S.move('neve', 'DD', 160);
    await S.say('wren', 'Neve?');
    await S.say('neve', 'Hello, Wren. You always did walk toward trouble.');
    await S.say('neve', 'I am sorry. I really am. The Archmage told me Hushwell is the last place the Current is still strong. He asked me to draw from it, for the great work. I said yes. I always say yes.');
    await S.say('hollis', 'That is not drawing. That is drinking.');
    await S.say('neve', 'I know. It is all I know how to do now. I am so *hungry*, Wren. It does not stop. The more I take, the less it fills me, and the less it fills me, the more I...');
    await S.emote('neve', '...', 1200);
    await S.say('wren', 'Neve, you told me to be careful what I asked him. In the Conservatory, in the daylight. You *knew*.');
    await S.say('neve', 'I knew something. I did not know what. I thought if I did what he asked, I could stop it. I thought I could be the one who fixed it.');
    await S.say('hollis', 'Neve, I am going to ask you to stop. Please.');
    await S.say('neve', 'I cannot. It does not... it will not...');
    S.shake(4, 800);
    S.flash('#8888aa', 300);
    await S.narrate('Neve doubles over. The grey rolls outward from her feet in a ring, and the terrace flowers curl, one by one.');
    await S.say('maribel', 'Hollis. Now.');
    await S.emote('hollis', '!', 1000);
    await S.narrate('Hollis closes his eyes. For a long moment, he does not breathe. Then he does something he has not done in his whole life: he speaks to the Current, in words.');
    await S.say('hollis', '*Please. She is not your enemy. Listen.*');
    S.sfx('bright');
    S.flash('#ffffff', 500);
    S.flag('voice');
    await S.narrate('A ripple of pale light moves through the garden. Somewhere in the stones, a single note returns.');
    G.ui.toast('Hollis learns The Current\'s Voice. But Neve drinks any Flow the party spends. Try fighting without using it.');
    await S.say('wren', 'Neve, I do not want to fight you!');
    await S.say('neve', 'I do not want to fight you either. It does not seem to care.');
    await S.battle({ mobs: ['neveAlder'], bg: 'hushwell', music: 'boss', noFlee: true });
    S.flag('neveDown');
    S.refreshEnv();
    S.music('hushwell');
    S.sfx('heal');
    await S.narrate('Neve drops to her knees. The grey fades out of the ground in a slow wave, and the first flowers begin, very carefully, to open again.');
    await S.say('neve', '...It is quiet. It is so quiet inside.');
    await S.say('wren', 'Neve.');
    await S.say('neve', 'Please do not be kind to me. I do not think I could stand it.');
    await S.say('wren', 'Too bad. I am being kind to you anyway. It is a bad habit.');
    await S.emote('neve', '...', 1600);
    await S.say('neve', 'He needs you, Wren. Your key. Only your key opens the Core. That is why he adopted you. That is why he gave you the pendant. That is why he let you run. Every step, every single step, is his.');
    await S.say('wren', 'I am beginning to understand that.');
    await S.say('neve', 'Then you should know where he is going. The Core lies under the Foundry. The way down is the Crown\'s old sluice, behind the throne hall at Aurelith. It leads to the upper docks.');
    await S.say('neve', 'Cassian is there. He is... not himself. Everything he says comes back twice. Please, if you can... bring him back to us.');
    await S.say('wren', 'I will try. I promise I will try.');
    await S.say('neve', 'I know. You always do.');
    await S.narrate('Two sisters help Neve to her feet and lead her gently toward the Pilgrims\' Hall.');
    S.removeNpc('neve');
    S.addNpc({ id: 'neveRest', look: 'neve', x: 9, y: 27, dir: 'down', talk: async (S2) => {
      await S2.say('neve', 'The sisters feed me soup. It is the first time in months it has tasted like anything.');
      await S2.say('neve', 'Be careful, Wren. Be careful, but go.');
    } });
    // the Heron
    S.sfx('ferry');
    await S.wait(500);
    await S.narrate('From the south cliff, a long shape rises out of the mist. Pale wood, brass trim, a prow carved like a heron\'s neck. The whole ship hums.');
    await S.say('pip', 'It is the most beautiful thing I have ever seen. Cog says it is "adequate." Cog is lying.');
    await S.say('maribel', 'She heard you. She does not do that for anyone.');
    S.flag('heron');
    S.st.flags.heronAt = 'hushwell';
    S.give('heronKey');
    for (const d of ['hullhaven', 'tallow', 'dimmerrow', 'hushwell']) G.travel.unlock(d);
    G.travel.unlock('aurelith');
    S.setStep(21);
    G.ui.toast('The Quiet Heron is yours. Board her at any dock, then set a course at the helm.');
    S.objective('Board the Quiet Heron at the south dock and set a course for Aurelith, the Sunken Crown.');
    S.respawnNpcs();
  };

  /* ------------- the garden folk ------------- */
  story.gardener = async (S) => {
    const st = S.st;
    const nm = { name: 'Gardener Tove', look: 'gardener' };
    if (st.flags.neveDown) return S.say(nm, 'Look at them. They came back! The flowers came *back*. I am going to cry on the roses. They will not mind.');
    await S.say(nm, 'Everything in this garden hums if you stand still long enough. Even the weeds. Especially the weeds.');
  };

  story.sisterPart = async (S) => {
    const st = S.st;
    const nm = { name: 'Sister Wyn', look: 'sister' };
    if (st.flags.wynDone) return S.say(nm, 'The stones are humming in tune again. I did not know a garden could sound so pleased with itself.');
    if (!st.flags.wynAsked) {
      S.flag('wynAsked');
      await S.say(nm, 'The garden pump has lost its coupling sleeve. The Garden Warden took it into the north terrace, I think, and has been guarding it since. Warden machines can be very stubborn.');
      await S.say(nm, 'If you find a brass sleeve, I would be glad to have it back. The stones sound wrong without the pump.');
      S.objective('Side quest: find the pump\'s brass coupling sleeve on Hushwell\'s upper terraces.');
      return;
    }
    if (G.game.hasKey('stationPart')) {
      await S.say(nm, 'That is it! That is the sleeve!');
      S.take('stationPart');
      S.gold(300);
      S.give('moonDew', 3);
      S.flag('wynDone');
      await S.say(nm, 'Take these. We have more gratitude than gold, and more gold than we need.');
      return;
    }
    await S.say(nm, 'Still no sleeve? It is somewhere on the upper terraces. Do not be rude to the Warden. It does not take it well.');
  };
})();
