/* =========================================================================
   story-act3b.js — ACT III (part 2): AURELITH, THE SUNKEN CROWN
   Steps: 21 sailing for Aurelith · 22 in the drowned city · 23 the final
          log has been heard · 24 the Regent is down; the sluice is open
   ========================================================================= */
(function () {
  'use strict';
  const story = (G.story = G.story || {});
  const J = G.data.story.journal;
  const TOLLY = { name: 'Tolly', look: 'tolly' };

  J.push(
    { step: 22, title: 'The Sunken Crown', text: 'Aurelith rises out of the mist: green spires, gold trim, and everything below the waterline. An old archivist named Tolly has been waiting fifty-one years for a visitor. He says Odalys\'s workshop has a green door.' },
    { step: 23, title: 'The Final Log', text: 'Odalys designed a limiter, a coupling that never lets a tap draw more than the Current can give back. Aldrith built its opposite from her own drawings. Cog carried those drawings to him, and knew, and never said. Vesper sold the crystal that made it work. We forgave them both. I do not think either of them has forgiven themselves.' },
    { step: 24, title: 'Every Step', text: 'The Founders told me the key is not a blade; it is a question. Then the Regent woke, and I answered it. Afterwards I understood: the blade waking is exactly what Aldrith wanted. The pendant, the escape, Cassian looking the other way, the alarm that sent me running. He has steered every step. We go on anyway, because the Current is dying faster than he can be stopped by anyone who stays still.' },
  );

  /* ------------- arrival ------------- */
  story.aurelithArrive = async (S) => {
    S.flag('aurelithArrived');
    S.setStep(22);
    await S.wait(500);
    await S.narrate('The Quiet Heron glides down through the mist. Below, a city rises slowly out of the Drift: green spires, gold domes, and every street below the waterline.');
    await S.say('pip', 'It is a whole *city*. It was the capital, and it just... sank.');
    await S.say('hollis', 'Fifty years ago, before I was born. The old Crown lost its tap in the night, and the island went down with the sun.');
    await S.say('vesper', 'A drowned capital. Probably full of treasure. Probably full of ghosts. I will have the treasure, and the ghosts can keep the rest.');
    await S.say('wren', 'The Heron has been humming since we saw it. Listen. It is humming *louder*.');
    await S.say('cog', 'Bleep.');
    await S.say('pip', 'Cog says he does not like the water. He says it looks at him.');
    G.ui.toast('Aurelith: fights here are tougher. Talk to Tolly near the dock.');
    S.objective('Find Odalys Fenwick\'s workshop, the one with the green door. Tolly, near the dock, may know the way.');
    S.respawnNpcs();
  };

  /* ------------- Tolly ------------- */
  story.tolly = async (S) => {
    const st = S.st;
    if (!st.flags.tollyMet) {
      S.flag('tollyMet');
      await S.say(TOLLY, 'Visitors. Visitors! Oh, how splendid. Welcome, welcome. I am Tolly, Archivist, Third Class, last functioning unit of the Royal Archive.');
      await S.say(TOLLY, 'Visitors have not been recorded in fifty-one years. I am delighted. I am also slightly alarmed. Please do not touch anything that is wet. Almost everything is wet.');
      await S.say('pip', 'Hello, Tolly! We are looking for a workshop with a green door. It belonged to an engineer named Odalys Fenwick.');
      await S.say(TOLLY, 'Odalys Fenwick. Yes! Item: one engineer, quiet, always paid in exact change. She asked for the key to the old workshop, and I gave it to her. Nobody else has asked me for anything in fifty-one years. It was the highlight of my decade.');
      await S.say('wren', 'Can you show us?');
      await S.say(TOLLY, 'I would be honored. This way, if you please. Mind the shallows. Some of them are deeper than they look. Some of them are *shallower*. The Crown has a sense of humor.');
      S.objective('Follow Tolly to the workshop with the green door, on the east side of the city.');
      await S.move('tolly', 'UUUUU', 150);
      await S.move('tolly', 'RRRRRRRRRRRRRR', 130);
      await S.say(TOLLY, 'The green door. She paid for the paint herself. It was the only thing she ever asked for that I could not find in the archive.');
      S.flag('tollyLed');
      return;
    }
    if (st.step >= 23 && !st.flags.regentDown) {
      await S.say(TOLLY, 'The memory wall is in the Crown Hall, at the north end. It holds three slots, and three tablets: one in the old archive on the west side, one in the east ruin, and one in the south-west guardhouse. I have catalogued them as "missing." I am very pleased to be corrected.');
      return S.shop('aurelithTolly');
    }
    if (st.flags.regentDown) {
      await S.say(TOLLY, 'The Regent has stopped. I have not heard that room so quiet in fifty-one years. Thank you. It is a very good quiet.');
      return S.shop('aurelithTolly');
    }
    await S.say(TOLLY, 'The workshop is at the east end, past the shallows. Ask me anything. Questions are the only thing I have ever been paid in.');
    return S.shop('aurelithTolly');
  };

  /* ------------- the workshop ------------- */
  story.workshopEnter = async (S) => {
    await S.wait(400);
    await S.narrate('The green door opens on a room frozen in the middle of a thought. Half a lantern. A cup that was never finished. A pencil, lying across a drawing.');
    await S.say('pip', 'She was here. She was *just* here.');
    await S.say('cog', 'bzzt...');
    await S.say('pip', 'Cog says nothing has moved. He says it is exactly the way she left it. He says it quietly. I have never heard him quiet.');
    await S.say('wren', 'There is a log terminal in the far corner. It is still lit.');
    S.objective('Play Odalys\'s final log, on the terminal at the north-east corner of the workshop.');
  };

  const OD = (S, text) => S.say('odalys', text);

  story.workshopLog = async (S) => {
    const st = S.st;
    if (st.flags.workshopDone) return S.narrate('The log terminal. Its screen holds one line, in a slanted, patient hand: "Keep Cog."');
    await S.narrate('The terminal wakes at Pip\'s touch. A voice fills the room, warm and tired and exact. It is not a recording. It is her.');
    S.music('farewell');
    await OD(S, '"Log, first entry. I have finished the Fenwick Limiter. It is a coupling that never lets a tap-station draw more than the Current can give back. The Archmage commissioned it himself. He called it a work of conscience."');
    await OD(S, '"Second entry. I have sent the drawings. Cog took them to the Conservatory, because I was not well that day. I trust him with everything."');
    await S.say('pip', '...');
    await OD(S, '"Third entry. I have seen the Archmage\'s copy. He did not build my limiter. He built its *opposite*. Same coupling. Same star-rivets. Where mine closes, his opens. Where mine holds back, his pulls. It is not a limiter any longer. It is a straw."');
    await OD(S, '"Fourth entry. I have been through the station logs. He is draining the taps one at a time to build something he calls the great work. I have written to the Board. I have written to the Queen\'s Harbor. I am told, kindly, that I am overworked."');
    await OD(S, '"Fifth entry. They have come for my notes. I have hidden the originals in the Crown, where nobody looks. Tolly has promised not to tell. Tolly is very good at not being asked."');
    await S.wait(500);
    await OD(S, '"Final entry. If you are hearing this, then the girl came."');
    await S.say('wren', '...');
    await OD(S, '"Wren. I never met you, but the pendant tells the whole story. You are not a weapon, and you are not a key to be turned. You are the lock *and* the key. Ask Hollis what that means, if you can find him. He will pretend not to know."');
    await S.say('hollis', 'I was never very good at pretending.');
    await OD(S, '"The Core is under the Foundry. I am going down to try and jam the draw by hand. If I do not come back, take my workshop. Take my tools."');
    await OD(S, '"And Pip. I am so sorry I left without saying goodbye. You were the best apprentice I could have hoped for. Keep Cog. He is more honest than I am. Be kind to him."');
    await OD(S, '"He carried my drawings, and he does not know what they became. I did not have the heart to tell him. I am sorry, little one."');
    await S.narrate('The recording clicks off. The room is very quiet. A single drop of water runs down the window and taps the sill.');
    S.give('odalysLog');
    S.flag('cogDim');
    await S.say('cog', '...bzt.');
    await S.say('pip', 'Cog? Cog, what is it? You are flickering.');
    await S.say('cog', 'bloop. bzzzt. bleep. bleeeep.');
    await S.say('pip', '...');
    await S.say('wren', 'Pip, what is he saying?');
    await S.say('pip', 'He says he knew. Not all of it. He says he carried the drawings, and he saw the Archmage open the case and smile and say "perfect." And he thought, a limiter is not supposed to be *perfect*. It is supposed to be *careful*.');
    await S.say('pip', 'He did not tell me, because he thought he might be wrong. Then the station failed, and he knew he was not. He has known since the harbor.');
    await S.say('cog', '...bleep.');
    await S.say('pip', 'He says he is sorry. He says it nine times.');
    await S.emote('pip', '...', 1800);
    await S.say('pip', 'Cog. Look at me. You carried those drawings because *she asked you to*. You were a lantern. You were a loyal one. Do not you dare apologize for being loyal.');
    await S.say('wren', 'Cog, I carried the crate. I sat on it, and I delivered it to Isolde with my own hands. Nobody here is allowed to be the only one at fault. That is a rule.');
    await S.say('pip', 'It is the rule. We just made it.');
    S.flag('cogDim', false);
    await S.say('cog', 'Bleep.');
    await S.say('pip', 'He says "thank you." He says it quietly, which is unlike him, so I am counting it as ten.');
    await S.wait(400);
    await S.say('vesper', '...Well. While everyone is being honest.');
    await S.emote('vesper', '...', 1400);
    await S.say('wren', 'Vesper?');
    await S.say('vesper', 'I sold the crystal. The green one, tap-grade. Two years ago a man came to me with a chit stamped with the Conservatory\'s star and asked for exactly that crystal, no questions, triple the usual price.');
    await S.say('vesper', 'I did not ask. I never ask. I looked at the number on the chit and I forgot to wonder what it was for. Then I saw the casing in your satchel in Tallow Cay, and I knew exactly where it had gone.');
    await S.say('vesper', 'That is the thing I did not want to say. That is why I joined. I wanted to know what I had sold, and I wanted to help fix it, and I did not want any of you to look at me like this.');
    await S.say('wren', 'Like what?');
    await S.say('vesper', 'Like you are about to forgive me.');
    await S.say('wren', 'We are about to forgive you.');
    await S.say('pip', 'You hauled us out of a fight in Tallow, remember? And you have been *terrible* company ever since, which is how I know you care.');
    await S.say('hollis', 'Penance is not a debt to be paid back in suffering, Vesper. It is a direction to keep walking.');
    await S.say('vesper', '...You people are very hard to disappoint.');
    await S.say('wren', 'We are not trying to be.');
    await S.say('vesper', 'I know. That is the problem.');
    S.flag('workshopDone');
    S.setStep(23);
    S.music('aurelith');
    S.objective('Find the three archive tablets: west archive hall, east ruin, south-west guardhouse. Then place them at the memory wall in the Crown Hall.');
    G.ui.toast('The Crown Hall is open. The memory wall needs three tablets.');
  };

  /* ------------- the memory wall ------------- */
  story.memoryWall = async (S) => {
    const st = S.st;
    if (st.flags.regentDown) return S.narrate('The memory wall is quiet. The three tablets sit in their slots, and a faint hum runs through them like a held breath.');
    const have = ['tabletA', 'tabletB', 'tabletC'].filter((k) => G.game.hasKey(k)).length;
    if (have < 3) return S.narrate(`Three slots in the wall, each stamped with a Founder's mark: a wave, an arch, a lantern. The wall needs all three tablets. (${have}/3 found.)`);
    S.music(null);
    for (const k of ['tabletA', 'tabletB', 'tabletC']) { S.take(k); S.sfx('chest'); await S.wait(500); }
    await S.narrate('One by one, the tablets slide into their slots. The wall hums. Pale light climbs it from the bottom to the top.');
    S.flash('#a0fff0', 600);
    await S.narrate('And then, one by one, figures stand in the hall. Translucent builders in long coats, with goggles pushed up on their foreheads and their hands on a great glowing pillar.');
    const F = (t) => S.say({ name: 'A Founder' }, t);
    await F('"We built the taps to listen. Not to take. The Current is not a river. It is a conversation."');
    await F('"But we knew that, in time, someone would try to take all of it. So we put the key where no one could take it alone: in the blood, in the line, in a child who would *choose*."');
    await F('"Child of ours, whoever you are: the key is not a blade. It is a question. When you are asked, you may answer yes. Or you may answer no."');
    await S.say('wren', 'Who is asking?');
    await F('"Everyone who has ever drawn on it. Everyone who ever will."');
    S.sfx('pendant');
    S.flash('#ffffff', 700);
    S.flag('blade3');
    await S.narrate('The pendant lifts from Wren\'s collar. It lengthens, edge by edge, until a true blade of gold-white light stands in her hand, as long as her arm and as steady as a heartbeat.');
    G.ui.toast('The key-blade has awakened its third form! Wren learns Unlock, and can open weak points.');
    await S.say('pip', 'Cog says it is "an extremely good sword." He is crying. Do not tell him I told you.');
    S.music('boss');
    S.shake(5, 900);
    S.sfx('rumble');
    await S.narrate('The hall shakes. Behind the throne, the water of the sluice rises, and something very old climbs out of it, armored in layers of gold and stone.');
    S.addNpc({ id: 'regentNpc', look: 'regentLook', x: 11, y: 6, dir: 'down' });
    await S.say({ name: 'Drowned Regent' }, 'KEYBEARER. UNVERIFIED. THE CROWN MUST NOT... OPEN... ITSELF AGAIN.');
    await S.say('wren', 'It is a guardian. Its armor comes in layers. We have to take them off, one by one.');
    await S.say('hollis', 'The key in your hand, Wren. Unlock. It opens the seams.');
    await S.battle({ mobs: ['drownedRegent'], bg: 'aurelith', music: 'boss', noFlee: true });
    S.removeNpc('regentNpc');
    S.flag('regentDown');
    S.music('farewell');
    await S.narrate('The Regent kneels. The water in the sluice runs clear, and the gate behind the throne swings open, onto a long dark stair.');
    await S.say({ name: 'Drowned Regent' }, '...KEYBEARER. VERIFIED. THE... WAY... IS... OPEN.');
    await S.wait(500);
    await S.say('wren', '...Pip. The blade woke because I was ready for it.');
    await S.say('pip', 'Yes?');
    await S.say('wren', 'No. It woke because someone *wanted* it to. The pendant warming at the station. Cassian looking the other way. The alarm that sent me running. Neve said every step is his, and I did not want to believe her.');
    await S.say('vesper', 'The escape. The skiff. The empty docks at the Cay. The Choir that "happened" to find us one at a time.');
    await S.say('hollis', 'He let you run, Wren. So that you would open every door on the way.');
    await S.say('wren', 'I was never running away from him. I was running toward the Core.');
    await S.emote('pip', '...', 1400);
    await S.say('pip', 'So do we stop? If it is exactly what he wants...');
    await S.say('wren', 'No. If we stop, the Current keeps dying. He built a trap, and the trap is also the only road. Whatever he wants, he cannot have it unless I let him.');
    await S.say('wren', 'So we go on. And this time, we choose how.');
    S.setStep(24);
    S.objective('Take the stair behind the throne in the Crown Hall, down to the Foundry\'s upper docks.');
    S.music('aurelith');
  };

  G.register('looks', 'regentLook', {
    custom: () => { const c = G.sprites.mob(G.data.mobs.drownedRegent); const a = [c, c, c, c]; return { down: a, up: a, left: a, right: a }; },
  });
})();
