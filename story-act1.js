/* =========================================================================
   story-act1.js — ACT I: THE LANTERN FALLS
   Every cutscene for Act I, plus the journal. Story progress is a single
   number, state.step:
     0 ferry opening · 1 harbor errand · 3 after the failure · 4 Pip joined
     5 Conservatory (evening) · 6 night · 7 found the maps · 8 found the file
     9 escaping · 10 Act I complete
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util;
  const story = (G.story = G.story || {});

  /* ---------------- Journal (shown in the pause menu) ---------------- */
  G.data.story.journal = [
    { step: 0, title: 'A Routine Errand', text: 'Aldrith asked me to ferry a sealed crate to the tap-station at Pennywhistle Harbor. He called it a "maintenance part." Fennick says the lanterns used to burn brighter.' },
    { step: 3, title: 'The Lantern Falls', text: 'The station failed the moment Captain Isolde opened the crate. Every lantern went dark, and the whole island dropped. Isolde told me not to trust the one who sent me. I kept a shard of the casing, and I haven\'t told anyone.' },
    { step: 4, title: 'Pip and Cog', text: 'I met a tinkerer named Pip and a very rude lantern named Cog. Pip says the shard bears the mark of Odalys Fenwick, Pip\'s vanished mentor, but her work has been twisted into something else.' },
    { step: 6, title: 'A Perfect Lie', text: 'Aldrith said it was a cracked casing from an old supplier, just bad luck. He was so kind about it. Then why can\'t I stop thinking about the circles on his map?' },
    { step: 7, title: 'The Circles', text: 'Every failing station is circled on his map. Pennywhistle was circled three days before he handed me the crate.' },
    { step: 8, title: "Odalys's File", text: '"O.F. has seen the taps\' true draw. She cannot be allowed to publish." It was written in his handwriting, the same handwriting I learned to copy.' },
    { step: 10, title: 'The Escape', text: 'We ran, and Cassian helped us. Aldrith watched from his tower and let us go. Why would he let us go?' },
  ];

  /* ================= 0. The ferry ================= */
  story.ferryOpening = async (S) => {
    await S.wait(500);
    await S.say('fennick', 'Pennywhistle Harbor, dead ahead! Mind the rail, Miss Wren — it\'s a long way down to the Drift.');
    await S.say('wren', 'Fennick, you say that every single trip.');
    await S.say('fennick', 'And every single trip you lean over it anyway. What\'s in the crate? Heavy as a sermon.');
    await S.say('wren', 'A "maintenance part" for the harbor\'s tap-station, from Aldrith. He packed it himself and said it was urgent.');
    await S.say('fennick', 'The Archmage himself! Well. If anyone can keep our lanterns lit, it\'s him.');
    S.face('fennick', 'right');
    await S.emote('fennick', '...');
    await S.say('fennick', 'Funny. The lanterns used to burn brighter when I was a lad. Or maybe my eyes are just getting old.');
    S.sfx('ferry');
    await S.card('The Lantern Falls', 'Act I');
    S.setStep(1);
    S.objective('Deliver Aldrith\'s crate to the tap-station at the top of the island.');
    await S.warp('harbor', 16, 31, 'up');
  };

  /* ================= 1. Pennywhistle Harbor ================= */
  story.tildaFirst = async (S) => {
    await S.say('tilda', 'Wren Ashgrove! Look at you, looking so official with your big, important crate.');
    await S.say('wren', 'Tilda! It IS a very important crate. I\'ve been told not to drop it, open it, or sit on it.');
    await S.say('tilda', 'You sat on it.');
    await S.say('wren', '...Once. Briefly. On the ferry.');
    await S.say('tilda', 'Here, take two loaves, straight from the oven. One is for you, and one is for anyone you meet who looks hungry. That\'s the rule.');
    S.give('bread', 2);
    await S.say('tilda', 'The ovens have been running cold lately, so everything takes twice as long to bake. Strange times. Come back whenever you need more!');
    S.flag('tildaBread');
  };

  story.deliverCrate = async (S) => {
    const st = S.st;
    if (st.step !== 1) return;
    await S.say('isolde', 'You\'re the Archmage\'s girl, are you? Isolde Brack, station keeper. Thirty years flying airships, and now I\'m babysitting a teapot.');
    await S.say('isolde', 'A crate from the Conservatory. Let\'s see what the great man sent us.');
    S.take('crate');
    S.sfx('door');
    await S.wait(500);
    await S.emote('isolde', '...', 1600);
    await S.say('isolde', '...This isn\'t a maintenance part.');
    await S.say('wren', 'What do you mean? Aldrith packed it himself.');
    await S.say('isolde', 'It\'s a coupling. It\'s old, older than the station. And it\'s *pulling*. Do you feel that? It\'s drawing the Current straight out of the—');
    // ---- THE FAILURE ----
    S.music(null);
    S.sfx('surge');
    S.shake(6, 1600);
    S.flash('#c060ff', 700);
    st.flags.stationBroken = true;
    await S.wait(900);
    S.setStep(2);
    const lamps = S.lightsByDistance(16, 4);
    for (const L of lamps) { S.light(L.key, false); S.sfx('fizzle'); await S.wait(L.tile === 'window' ? 60 : 140); }
    S.env({ ambient: 0.66, ambientColor: '#08102a', sky: 'dark', weather: 'ash' });
    S.sfx('rumble');
    S.shake(4, 2000);
    await S.tween((k) => { G.world.envOverride.sink = -k * 160; G.world.env.sink = -k * 160; }, 2000);
    await S.say('wren', 'The lanterns... the whole harbor is going dark!');
    await S.narrate('The island lurches. Somewhere far below, the mist of the Drift is suddenly, horribly closer.');
    S.music('boss');
    S.addNpc({ id: 'guardian', look: 'tapguard', x: 13, y: 4, dir: 'down' });
    S.sfx('thud'); S.shake(3, 400);
    await S.emote('player', '!');
    await S.say({ name: 'Tap Guardian' }, 'TAP... OVERDRAW... PROTECT... PROTECT... PROTECT...');
    await S.say('isolde', 'The station\'s guardian has gone haywire! Wren — don\'t let it reach the town!');
    await S.say('wren', 'Right. Sure. Fight the giant, angry teapot. Totally what I trained for.');
    await S.battle({ mobs: ['tapGuardian'], bg: 'harborDark', tutorial: true, noFlee: true });
    S.removeNpc('guardian');
    // ---- aftermath ----
    G.world.envOverride.music = 'harborDark';
    S.refreshEnv();
    await S.narrate('The guardian collapses in a hiss of steam. In the sudden quiet, something against Wren\'s chest grows warm.');
    S.flag('pendantWarm');
    S.sfx('pendant');
    await S.wait(600);
    await S.say('wren', 'My pendant? It\'s humming. It has never done that, not once in nine years.');
    await S.emote('isolde', '...');
    await S.say('isolde', 'Ngh. Girl. Come here.');
    await S.say('isolde', 'That coupling slid into the socket as if it were made for it. Because it was. Nobody makes a part like that by accident.');
    await S.say('isolde', 'Listen to me. *Don\'t trust the one who sent you.*');
    await S.say('wren', 'Aldrith? No. No, he would never. It was an accident. A bad part. That\'s all.');
    await S.say('isolde', 'Then I hope you\'re right. I\'ve been wrong before. Not often.');
    await S.narrate('The townsfolk come running with candles and help Isolde down the hill toward the Bobbing Lantern.');
    S.removeNpc('isolde');
    await S.wait(400);
    await S.narrate('Among the wreckage, a sliver of the crate\'s casing glints, still warm and stamped with tiny star-shaped rivets.');
    const c = await S.choose(null, null, ['Keep the shard', 'Leave it']);
    if (c === 1) await S.narrate('Wren tells herself she will leave it. She picks it up anyway.');
    S.give('crateShard');
    await S.narrate('She slips it into her satchel. She doesn\'t tell anyone. She isn\'t sure why.');
    // reset temporary lighting; the harbor's env now handles the dark state
    G.world.lightOverride = {};
    G.world.envOverride = {};
    S.setStep(3);
    S.refreshEnv();
    S.respawnNpcs();
    G.ui.toast('Your pendant glows faintly now. Rift spawn roam the dark lanes.');
    S.objective('Find Fennick at the docks so he can take you home to Aldrith.');
  };

  /* ================= 3. Pip and Cog ================= */
  story.pipMeets = async (S) => {
    if (S.st.step !== 3) return;
    const p = S.actor('player');
    // Pip runs in from wherever there's room: below, above, then the sides
    const w = G.world;
    const tries = [[0, 3, 'UU', 'down'], [0, -3, 'DD', 'up'], [3, 0, 'LL', 'right'], [-3, 0, 'RR', 'left'], [0, 2, 'U', 'down'], [0, -2, 'D', 'up']];
    let spot = null;
    for (const [dx, dy, path, face] of tries) {
      const sx = p.x + dx, sy = p.y + dy;
      const stepX = Math.sign(dx), stepY = Math.sign(dy);
      let ok = w.passable(sx, sy);
      for (let i = 1; ok && i < Math.max(Math.abs(dx), Math.abs(dy)); i++) ok = w.passable(p.x + stepX * i, p.y + stepY * i);
      if (ok) { spot = { sx, sy, path, face }; break; }
    }
    if (!spot) spot = { sx: p.x, sy: p.y + 1, path: '', face: 'down' };
    S.face('player', spot.face);
    S.addNpc({ id: 'pip', look: 'pip', x: spot.sx, y: spot.sy, dir: 'up', solid: true });
    S.sfx('cog');
    await S.emote('player', '!');
    await S.move('pip', spot.path, 120);
    await S.say('cog', 'BZZT-WHIRR-BLEEP!!');
    await S.say('pip', 'COG! Cog, you can\'t just *tackle* strangers! Sorry! Sorry! He doesn\'t usually... well, he does. Just not usually strangers.');
    await S.say('wren', 'Is your lantern... yelling at me?');
    await S.say('pip', 'He says you\'ve got something in your bag that "smells like home and also like a crime." His words. He\'s very dramatic.');
    await S.say('cog', 'Bleep. Bzt.');
    await S.say('pip', 'Okay, the "very dramatic" part was mine. Can we see it?');
    const c = await S.choose(null, null, ['Show the shard', 'Absolutely not']);
    if (c === 1) {
      await S.say('pip', 'Totally fair. Stranger danger. But, um... Cog will follow you forever. Literally. He doesn\'t sleep.');
      await S.say('cog', 'BLEEEEP.');
      await S.say('wren', '...Fine. One look.');
    }
    await S.narrate('Wren holds up the warm sliver of casing.');
    S.flag('cogDim');
    S.sfx('fizzle');
    await S.wait(700);
    await S.emote('pip', '?');
    await S.say('pip', 'Cog? ...Cog, you\'re dimming. You *never* dim.');
    await S.say('cog', '...bzt. bloop.');
    await S.say('pip', 'He says it\'s "just a boring old bracket" and he "didn\'t want to look at it anyway." That\'s a lie. He LOVES brackets.');
    S.flag('cogDim', false);
    await S.say('pip', 'But wait, look at these rivets. Little stars, pressed in by hand. I know this work. This is *Odalys Fenwick\'s*.');
    await S.say('wren', 'Odalys? The engineer? She vanished from the Conservatory two years ago.');
    await S.say('pip', 'She was my mentor. She built Cog. She taught me everything, and she would never build something like this. Someone took her design and... twisted it.');
    await S.say('pip', 'Where are you headed?');
    await S.say('wren', 'Home. The Conservatory. Aldrith will know what to do.');
    await S.say('pip', 'Then I\'m coming with you. If Odalys\'s work is tangled up in this, I need to know how. I\'m Pip, by the way. Pip Quillfeather. Tinkerer. Genius. Unpaid.');
    await S.say('cog', 'BLEEP!');
    await S.say('pip', 'And this is Cog. He says he\'s the brains of the operation.');
    await S.say('wren', 'Wren Ashgrove. Ward of the Archmage. Professional crate-deliverer. Currently having a very strange night.');
    S.join('pip');
    S.setStep(4);
    G.ui.toast('Pip joins the party, and Cog lights the way. Patch Kit heals allies, and Cog\'s Lantern weakens foes.');
    S.objective('Talk to Fennick at the end of the dock to sail for the Conservatory.');
  };

  story.fennickDepart = async (S) => {
    const c = await S.choose('fennick', 'The Conservatory, is it? Mine is the only ferry still running tonight, and only because I\'m stubborn. Ready?', ['Set sail', 'Not yet'], { cancel: 1 });
    if (c !== 0) return S.say('fennick', 'I\'ll be here. It\'s not as if there\'s anywhere else to be.');
    S.sfx('ferry');
    await S.warp('ferry', 6, 6, 'up', { skipEnter: true });
    await S.wait(400);
    await S.say('pip', 'So. The Archmage\'s ward. What\'s he like?');
    await S.say('wren', 'Kind. Patient. He taught me to read by starlight. He gave me this pendant on my tenth birthday. He said it was found with me when I was a baby.');
    await S.say('pip', 'It\'s glowing.');
    await S.say('wren', 'Yes. It\'s been doing that since the station.');
    await S.say('cog', 'Bzzt.');
    await S.say('pip', 'Cog says, "Great, a glowing mystery rock. Just what we needed."');
    await S.narrate('Behind them, Pennywhistle Harbor is a dark shape in the mist, lower, Wren thinks, than it was this morning.');
    S.setStep(5);
    await S.warp('conservatory', 20, 37, 'up');
  };

  /* ================= 5. The Conservatory ================= */
  story.cassianDay = async (S) => {
    await S.say('cassian', 'Wren! I heard about Pennywhistle. Are you all right?');
    await S.say('wren', 'I\'m fine. Mostly. Who told you?');
    await S.say('cassian', 'Everyone. The whole Conservatory\'s whispering. Idris says it\'s "statistically insignificant." Neve hasn\'t said anything at all, which is somehow worse.');
    await S.say('cassian', 'Here, let me cheer you up. Knock knock.');
    await S.say('wren', 'Not now, Cass.');
    await S.say('cassian', 'Knock knock knock knock knock—');
    await S.say('wren', 'WHO\'S THERE?');
    await S.say('cassian', 'Lantern.');
    await S.say('wren', '...Lantern who?');
    await S.say('cassian', 'Lantern you a hand, if you need one. I mean it.');
  };

  story.aldrithLie = async (S) => {
    S.flag('metAldrith');
    await S.move('player', 'UULLUURR');
    S.face('player', 'up');
    await S.wait(200);
    await S.say('aldrith', 'Wren. My dear girl. I felt it the moment it happened. Are you hurt?');
    await S.say('wren', 'I\'m fine. Aldrith, the station... the moment Captain Brack opened the crate, everything went dark. The whole island *dropped*.');
    await S.say('aldrith', 'I know. I know.');
    await S.emote('aldrith', '...', 1400);
    await S.say('aldrith', 'A flaw in the casing. My fault entirely. I trusted an old supplier, and the coupling cracked under the draw. I\'ve already sent engineers, and the harbor will be lit again within the week.');
    await S.say('wren', 'Captain Brack said... She told me not to trust the one who sent me.');
    await S.say('aldrith', 'Isolde Brack has lived a hard life, and fear makes us hunt for villains. Sometimes, Wren, there is only bad luck, and an old man who should have checked his parts more carefully.');
    await S.say('aldrith', 'And who is this?');
    await S.say('pip', 'Pip Quillfeather! Tinkerer. Big fan. Of... stars.');
    await S.say('aldrith', 'Any friend of Wren\'s is welcome here.');
    await S.say('aldrith', 'Still wearing it, I see.');
    await S.say('wren', 'The pendant? Always. It—it got warm at the station. It hummed.');
    await S.emote('aldrith', '...', 1600);
    await S.say('aldrith', 'Did it, now? How curious.');
    await S.say('aldrith', 'Keep it close. It suits you. Now go and rest. Tomorrow will look kinder. It always does.');
    await S.say('wren', '...Yes, Aldrith. Good night.');
    await S.narrate('As they turn to leave, Wren glances back. On the map table, a chart of the tap-stations lies half-unrolled. Several of them are circled in red ink.');
    await S.warp('conservatory', 20, 5, 'down', { skipEnter: true });
    await S.say('pip', 'He\'s nice. Like, *suspiciously* nice. Also, Cog didn\'t make a single sound in there. Cog ALWAYS makes a sound.');
    await S.fadeOut(800);
    S.setStep(6);
    S.respawnNpcs();
    await S.card('Later that night', '', 2200);
    await S.warp('conservatory', 3, 19, 'down', { skipEnter: true });
    await S.say('wren', 'I can\'t sleep. Those circles on his map... I need to see it again.');
    await S.say('pip', 'Sneaking into the Archmage\'s study at midnight? I love it. Terrible idea. Let\'s go.');
    G.ui.toast('Brass sentries patrol at night. Rest in your dorm (west tower door) for free.');
    S.objective('Sneak back into Aldrith\'s study in the north tower.');
  };

  /* ================= 6-7. The maps ================= */
  story.mapTable = async (S, st) => {
    if (st.step <= 5) return S.narrate('Charts of the tap-stations. As Wren leans in, Aldrith rolls one closed with a little smile.');
    if (st.step > 6) return S.narrate('The map. Seven red circles. Wren doesn\'t need to look again. She will be seeing them in her sleep.');
    await S.narrate('A map of every tap-station in Orrenth, pinned flat with brass weights.');
    await S.narrate('Seven are circled in red. Pennywhistle Harbor is one of them. Beside it, in Aldrith\'s neat hand, a date.');
    await S.say('wren', 'That date... it\'s three days *before* he gave me the crate.');
    await S.say('pip', 'So he knew it would fail before it failed.');
    await S.say('wren', 'Or he knew it was weak, and he was trying to fix it. That\'s possible. Right?');
    await S.emote('pip', '...');
    await S.say('pip', 'Wren. There\'s a note in the corner.');
    await S.narrate('"Vault — O.F. records sealed."');
    await S.say('pip', 'O.F. Odalys Fenwick. Her records are in the Records Vault. Wren, I have to see them.');
    await S.say('wren', 'The vault is on the northwest island, across the little bridge. It\'s sealed, but I know someone who knows the sentries\' tricks.');
    S.give('stationMap');
    S.setStep(7);
    S.objective('Get into the Records Vault on the northwest island.');
  };

  story.cassianVault = async (S) => {
    S.addNpc({ id: 'cassian', look: 'cassian', x: 11, y: 7, dir: 'right' });
    await S.emote('player', '!');
    S.face('player', 'left');
    await S.say('cassian', 'Wren? It\'s two hours past curfew—oh no. You\'ve got your "I\'m about to do something stupid" face.');
    await S.say('wren', 'I don\'t have a face like that.');
    await S.say('cassian', 'You have exactly one face like that, and I\'ve seen it every week since we were nine. Where are you going?');
    await S.say('wren', 'The Records Vault.');
    await S.emote('cassian', '...');
    await S.say('cassian', 'Of course you are.');
    await S.say('cassian', 'The door is sealed, but the sentries use a maintenance panel on the left. Third rivet from the top. I\'ll just... look the other way.');
    S.sfx('door');
    S.flag('vaultOpen');
    await S.say('wren', 'Cassian—');
    await S.say('cassian', 'Knock knock.');
    await S.say('wren', '...Who\'s there?');
    await S.say('cassian', 'Current.');
    await S.say('wren', 'Current who?');
    await S.say('cassian', 'Currently worried about you. Be careful in there.');
    await S.move('cassian', 'LLD');
    S.removeNpc('cassian');
    S.objective('Search the Records Vault for Odalys Fenwick\'s file.');
  };

  /* ================= 7-8. The vault ================= */
  story.records = async (S) => {
    await S.narrate('A drawer marked F. Inside, a single thin file.');
    await S.narrate('"ODALYS FENWICK — Engineer, Third Circle. Status: DEPARTED."');
    await S.narrate('Clipped to it, a note in Aldrith\'s handwriting: "O.F. has seen the taps\' true draw. She cannot be allowed to publish. Arrange her retirement."');
    await S.emote('pip', '...', 1600);
    await S.say('pip', '...Retirement.');
    await S.say('pip', 'She didn\'t retire. She *vanished*. She left her tools on the bench, Wren. She left *Cog*.');
    S.flag('cogDim');
    await S.say('cog', '...');
    await S.say('wren', 'This is his handwriting. I learned to write by copying it.');
    S.flag('cogDim', false);
    S.give('odalysNote');
    S.sfx('alarm');
    S.shake(2, 700);
    await S.narrate('Somewhere above, a bell begins to ring. Brass feet clatter on stone.');
    await S.say('pip', 'That\'s the vault alarm! The way we came in will be crawling with sentries. Is there another way out?');
    await S.say('wren', 'The back stair! It\'s in the northeast corner, and it comes out by the old skiff dock.');
    S.setStep(8);
    S.objective('Escape up the back stair in the vault\'s northeast corner!');
    await S.say({ name: 'Brass Sentry' }, 'INTRUDERS. INTRUDERS IN THE STACKS.');
    await S.battle({ mobs: ['brassSentry', 'brassSentry'], bg: 'vault' });
  };

  story.golem = async (S) => {
    S.face('player', 'up');
    S.sfx('thud'); S.shake(5, 900);
    S.addNpc({ id: 'golem', look: 'golemNpc', x: 20, y: 2, dir: 'down' });
    await S.narrate('The shelves groan. Pages lift into the air and fold together into a shape — tall, heavy, with eyes like reading lamps.');
    await S.say({ name: 'Archive Golem' }, 'UNAUTHORIZED... BORROWERS. ALL VOLUMES... MUST BE RETURNED.');
    await S.say('pip', 'Is it... is it trying to *fine* us?');
    await S.say('wren', 'Fines later! Fight now!');
    await S.battle({ mobs: ['archiveGolem'], bg: 'vault', noFlee: true });
    S.removeNpc('golem');
    return story.escape(S);
  };

  /* ================= 9. Escape ================= */
  story.escape = async (S) => {
    await S.narrate('The golem crumbles into a drift of loose pages. Above, the stair opens onto cold night air.');
    S.setStep(9);
    S.sfx('door');
    await S.warp('conservatory', 20, 37, 'down', { skipEnter: true });
    S.addNpc({ id: 'cassian', look: 'cassian', x: 21, y: 38, dir: 'up' });
    S.face('player', 'down');
    await S.say('cassian', 'There you are! Every alarm in the tower is going off. Take the night skiff. It\'s old, but it flies.');
    await S.say('wren', 'Come with us.');
    await S.say('cassian', 'Somebody has to tell the sentries you went *east*. Go. I\'ll be fine. I\'m always fine.');
    await S.say('cassian', 'Knock knock.');
    await S.say('wren', 'Cassian, we don\'t have time for this—');
    await S.say('cassian', '...Fine. Currently out of jokes. Go!');
    S.sfx('ferry');
    await S.warp('ferry', 6, 6, 'up', { skipEnter: true });
    await S.wait(500);
    await S.narrate('The skiff slips off the dock and drops into the dark. Behind them, the Conservatory\'s woven bridges flicker like failing stars.');
    await S.narrate('High in the north tower, a single window stays lit. A tall figure stands there, watching the little skiff go.');
    await S.narrate('He does not raise the alarm.');
    await S.say('pip', 'So... where do we even go now?');
    await S.say('wren', 'Down. Into the Drift. If Odalys left a trail, that\'s where it starts.');
    await S.say('wren', 'And Pip... thank you. For coming.');
    await S.say('pip', 'Are you kidding? Best worst night ever.');
    await S.say('cog', 'Bleep.');
    await S.say('pip', 'Cog agrees. Grudgingly.');
    S.setStep(10);
    G.game.save();
    return G.story.hullArrive(S);
  };
})();
