/* =========================================================================
   story-act4.js — ACT III finale + ACT IV: THE FOUNDRY
   Steps: 24 sluice open · 25 Cassian freed · 26 furnace halls · 27 the vaults
          28 Founder's Key · 29 at the Core · 30 Aldrith down · 31 the choice
          32 epilogue (the game is complete)
   ========================================================================= */
(function () {
  'use strict';
  const story = (G.story = G.story || {});
  const J = G.data.story.journal;

  J.push(
    { step: 25, title: 'Echo Who?', text: 'Cassian held the door at the Foundry\'s upper docks, split into three, and he told me the joke one last time. There is no answer to it. It just keeps coming back until someone is listening. I was listening.' },
    { step: 26, title: 'The Foundry', text: 'Black stone, molten light, and pale blue Current running through the walls like blood. The oldest machines in the world are still running. Pip says it is the most beautiful and horrifying thing he has ever heard. Cog agrees, in four beeps.' },
    { step: 28, title: 'The Founder\'s Key', text: 'The vaults opened for the blade like a lock for its key. At the last one, the Current asked me what I would do with it. I said I would keep it safe. I think I meant it. Hollis says it said yes.' },
    { step: 30, title: 'The Great Work', text: 'Aldrith told me everything, kindly, the way he tells everything. The crate. The harbor. Odalys. What I am. He asked me to stand beside him and be a lamp that never goes out. I said no. He is the kindest person who ever broke my heart.' },
    { step: 32, title: 'Home', text: 'The Current flows again, slowly. The lanterns are coming back. I do not have the pendant any more, and I cannot light a lantern by myself. But somebody did it for me, and I think that is how it was always supposed to work.' },
  );

  const CASS = 'cassian';

  /* ------------- Cassian ------------- */
  story.cassianScene = async (S) => {
    const st = S.st;
    if (st.flags.cassianDown) return;
    S.setStep(Math.max(st.step, 24));
    await S.move('player', 'U', 120);
    S.face('player', 'up');
    S.music('farewell');
    await S.say(CASS, 'Wren! You made it. I *knew* you would. Knock knock.');
    await S.say('wren', 'Cass? What is wrong with your voice?');
    await S.say(CASS, 'Knock knock. Knock knock.');
    await S.narrate('A second voice repeats every word he says, a half-beat late, from somewhere behind him. Then a third, farther off.');
    await S.say('wren', 'Who is there?');
    await S.say(CASS, 'Who is there? Who is...');
    await S.narrate('He presses a fist against his forehead.');
    await S.say(CASS, 'Sorry. It is loud in here. Everything I say, it says again. Twice. Three times. I am in three places, Wren. I cannot tell which one is me.');
    await S.say('hollis', 'Echo. He has been split, and every piece of him repeats.');
    await S.say(CASS, 'The Archmage asked me to hold the door. He said it was a short job. "Do not let anyone through who is not Wren. And when it *is* Wren, open it." But the echo will not stop saying "Do not let her through," and I cannot make it say the other thing.');
    await S.say('wren', 'Cass, we are going to fix this.');
    await S.say(CASS, 'You cannot fix it by talking. The echoes have to be hit, and I do not know which of us is real. Find me. I will tell the joke. You always know when it is me.');
    await S.say('pip', 'Cog says to listen for the joke. Whoever tells all of it is him. The echoes only get the first half.');
    await S.say('vesper', 'I hate this plan. Everyone hates this plan. Let us do it anyway.');
    S.music(null);
    await S.battle({ mobs: ['cassianLorne', 'cassianEcho', 'cassianEcho'], bg: 'foundryDocks', music: 'boss', noFlee: true, noBossSlot: true });
    S.removeNpc('cassianStand');
    S.music('farewell');
    S.flash('#ffffff', 600);
    await S.narrate('The last echo does not vanish. It stays. It is Cassian, whole, standing alone in the middle of the dock for the first time in a long time. And very quiet.');
    await S.say(CASS, 'Wren.');
    await S.say('wren', 'Cass!');
    await S.say(CASS, 'It is quiet. Oh, it is so quiet. I can hear myself. Is that what I sound like?');
    await S.say('wren', 'That is what you sound like. It is good. It is you.');
    await S.say(CASS, 'I think I am not going to stay. The echo was holding me together, and when it stops, I think I stop. I wanted to tell you before it did.');
    await S.say('wren', 'No. No, Cass, you are not.');
    await S.say(CASS, 'Knock knock.');
    await S.emote('wren', '...', 1600);
    await S.say('wren', '...Who is there?');
    await S.say(CASS, 'Echo.');
    await S.say('wren', 'Echo who?');
    await S.say(CASS, 'Echo who. Echo who? ...');
    await S.narrate('He smiles. It is his real smile: crooked, a little embarrassed.');
    await S.say(CASS, 'That is the joke. There is no answer. It keeps coming back, until someone is listening.');
    await S.say('wren', '...I am listening.');
    await S.say(CASS, 'I know. You always did.');
    await S.say(CASS, 'Tell Neve I am sorry I never finished the limerick. Tell Idris he is a very good tutor and should try being more annoying. Tell Tilda I never tried her bread, and she is going to be so offended.');
    await S.say(CASS, 'Wren. The gate will open for you. Not for the Archmage, not ever for him, unless you open it. Do not give it to him. Do not let him have the key.');
    await S.say('wren', 'I will not. I promise.');
    await S.say(CASS, 'Good. Goodbye, Wren. Be careful. Be... currently out of jokes.');
    await S.say(CASS, 'Go on.');
    await S.narrate('Cassian laughs, a small, surprised laugh, and then he is only light: a handful of pale motes that rise and drift away over the edge of the dock, into the dark.');
    await S.wait(900);
    S.flag('cassianDown');
    S.setStep(25);
    S.setTile(14, 7, '+'); S.setTile(15, 7, '+');
    S.sfx('rumble');
    await S.narrate('Behind Wren, the vault gate shudders and swings slowly open.');
    await S.say('pip', '...Cog says he was braver than any of us. He says it very quietly.');
    await S.say('vesper', 'He told a joke at the end. Of course he did.');
    await S.say('hollis', 'Rest in the light. We will carry the rest.');
    S.music('foundry');
    S.refreshEnv();
    S.objective('Go through the opened vault gate and down into the Foundry.');
  };

  /* ------------- the vaults ------------- */
  story.keyhole = async (S, which, side) => {
    const st = S.st;
    if (!st.flags.blade3) return S.narrate('A lantern-shaped keyhole. Wren\'s pendant tugs toward it, but it is not yet strong enough to answer.');
    if (which === 'vaultI') {
      if (st.flags.vaultI) return S.narrate('The keyhole glows, satisfied.');
      S.sfx('pendant'); S.flash('#ffd060', 300);
      await S.narrate('Wren raises the key-blade. It slides into the lantern-shaped slot as if it had always lived there, and the whole chamber hums.');
      S.sfx('rumble'); S.shake(3, 700);
      for (let x = 16; x <= 19; x++) S.setTile(x, 29, '+');
      S.flag('vaultI');
      await S.say('pip', 'It is a *key*. It is a literal, actual key. Cog told us in Pennywhistle.');
      S.objective('The next vault has two keyholes. Open both with the key-blade.');
      return;
    }
    // vault II: two keyholes
    const k = 'key' + side;
    if (st.flags.vaultII || st.flags[k]) return S.narrate(st.flags.vaultII ? 'The keyholes glow, satisfied.' : 'This keyhole is already open. Its twin waits across the chamber.');
    S.sfx('pendant'); S.flash('#ffd060', 300);
    S.flag(k);
    await S.narrate('Wren turns the key-blade. This keyhole opens with a click like a held breath let go.');
    if (st.flags.keyW && st.flags.keyE) {
      S.sfx('rumble'); S.shake(3, 700);
      for (let x = 16; x <= 19; x++) S.setTile(x, 13, '+');
      S.flag('vaultII');
      S.setStep(27);
      await S.narrate('Both keyholes glow. Across the chamber, the second vault door slides open, revealing a bright, still room beyond.');
      S.objective('Enter the last vault, the Founder\'s Cradle.');
    } else {
      G.ui.toast('One keyhole open. Find its twin across the chamber.');
    }
  };

  story.cradle = async (S) => {
    const st = S.st;
    if (st.flags.blade4) return S.narrate('The Founder\'s Cradle. The empty socket where the key once rested. The blade in Wren\'s hand feels lighter than it has ever been, and much, much older.');
    S.music('core');
    await S.narrate('A pedestal stands at the heart of the last vault, with a lantern-shaped socket and a smooth bowl worn by many hands.');
    await S.say('wren', 'It is the Founder\'s Cradle. Odalys wrote about it in the margins of her log. The key goes here.');
    await S.say('hollis', 'Wren. Before you do. I can hear it.');
    await S.say('wren', 'What does it say?');
    await S.say('hollis', 'It asks: "What will you do with me?" It asks it quietly, over and over, like someone who has asked a long time.');
    await S.say('wren', 'Then I should answer it.');
    const c = await S.choose('wren', 'What will I do with it?', ['Keep it safe', 'Use it well', 'I do not know yet'], { cancel: 2 });
    if (c === 2) await S.say('hollis', 'That is a good answer too. The Current likes honesty.');
    else await S.say('hollis', 'It heard you.');
    S.sfx('pendant'); S.flash('#ffffff', 900);
    S.shake(3, 900);
    S.flag('blade4');
    for (const [x, y] of [[17, 1], [18, 1]]) S.setTile(x, y, '+');
    await S.narrate('Wren sets the blade in the socket. For a long moment, nothing moves. Then the light runs outward through the whole vault, up the walls and across the ceiling, as if the room had drawn its first breath in a thousand years.');
    await S.narrate('When she draws the blade out again, it has changed. It is longer, and wider, and gold-white from tip to hilt, and a slow ring of lantern-light turns around its guard.');
    G.ui.toast('The Founder\'s Key! Wren learns Founder\'s Light, her ultimate.');
    await S.say('pip', 'Cog says that is the one. That is the last form. He says, and I quote, "Finally."');
    await S.say('vesper', 'Is it too late to ask whether it can also cut locks?');
    await S.say('wren', 'It *is* a lock. And a key.');
    S.setStep(28);
    S.music('foundry');
    S.objective('The vault gate is open. Go north, to the Core.');
  };

  /* ------------- Aldrith at the Core ------------- */
  story.aldrithMeet = async (S) => {
    const st = S.st;
    if (st.flags.aldrithDown) return;
    S.setStep(29);
    S.music('core');
    await S.move('player', 'UU', 120);
    await S.narrate('At the top of the platform, a tall figure stands at the edge of the Core\'s light, hands folded behind him. He does not turn at once. He lets them look.');
    S.face('aldrith', 'down');
    await S.say('aldrith', 'Wren. My dear girl. You came by the long road. I am so glad. The short road would have been so much less interesting.');
    await S.say('wren', 'Aldrith.');
    await S.say('aldrith', 'You look tired. Sit, if you like. You have earned it, and there is no hurry. The Core will wait for us.');
    await S.say('pip', 'He is being *nice*. Cog says this is the scariest he has ever been.');
    await S.say('wren', 'Tell me. All of it.');
    await S.say('aldrith', 'Yes. All of it. You deserve that much.');
    await S.say('aldrith', 'Yes, I sent the crate. Pennywhistle was the seventh station. I needed all seven to fail, so I could feel what was left. And yes, I wrote the note about Odalys. I did not mean it the way you think, but I did not stop it either.');
    await S.say('wren', 'Where is she?');
    await S.say('aldrith', 'I never saw her again. Whatever she tried to do down here, she did at the bottom of something. I did not ask where she went.');
    await S.say('wren', 'And me?');
    await S.say('aldrith', 'Ah.');
    await S.emote('aldrith', '...', 1600);
    await S.say('aldrith', 'You are the last of the Founders\' line, Wren. Every key in every lock they built bends to your blood. I found you in a blanket of Current on a doorstep in Pennywhistle Harbor, and I knew in a heartbeat. You were the answer to a question I had been asking for thirty years.');
    await S.say('aldrith', 'The pendant was always yours. I kept it for ten years so that, when I gave it to you, it would wake in *your* hands. It would not have woken in mine.');
    await S.say('wren', 'The escape. The skiff. The Choir. Every step.');
    await S.say('aldrith', 'Every step. I am sorry. I am. You were never a tool to me, Wren. You were a daughter who happened to be a key.');
    await S.say('hollis', 'You cannot be both.');
    await S.say('aldrith', 'Brother Hollis. I am told you hear the Current. Then you know I am not wrong about one thing: it is dying. It was dying before I ever touched a tap. Thirty years ago I saw it fading, and nobody would listen.');
    await S.say('aldrith', 'So I took what I could, and I built something that will not fade. A mind that does not die. A will that does not tire. I will hold the Current in myself, and I will give it out, slowly, forever. I will *be* the Current, for everyone. Every lantern. Every bridge. Every ferry. The world will never be dark again.');
    await S.say('hollis', 'And it will never be free again.');
    await S.say('aldrith', 'Free to sink?');
    await S.say('vesper', 'You drained seven stations and a sanctuary. People went hollow. A little girl forgot her own mother\'s name.');
    await S.say('aldrith', 'Costs. I never pretended there were none. I carried each of them. I carry them still.');
    await S.say('aldrith', 'Wren. Open the Core. Place the key. Stand with me. Together we could be a lamp that never goes out. You would not have to be a girl with a pendant any more. You would be... everything.');
    await S.emote('wren', '...', 2000);
    await S.say('wren', 'You taught me to read by starlight.');
    await S.say('aldrith', 'I did.');
    await S.say('wren', 'You taught me to be kind. You were the kindest person I ever knew. I have been trying, ever since Pennywhistle, to understand how that person built the crate.');
    await S.say('aldrith', 'Wren...');
    await S.say('wren', 'I do not think there is an answer. I think they are both you. And I think I loved the first one, and I am going to stop the second.');
    await S.say('wren', 'No, Aldrith.');
    await S.narrate('Aldrith closes his eyes. When he opens them, the warmth in them has not gone anywhere, and that is the worst part.');
    await S.say('aldrith', 'Then I will have to take it from you. I am so sorry, child. I really am.');
    S.music(null);
    S.shake(4, 900);
    S.flash('#aaccff', 400);
    await S.battle({ mobs: ['aldrithVenmoor'], bg: 'core', music: 'finale', noFlee: true, noBossSlot: true });
    await story.rupture(S);
  };

  /* ------------- the rupture and the choice ------------- */
  story.rupture = async (S) => {
    S.flag('aldrithDown');
    S.flag('coreRupture');
    S.setStep(30);
    S.removeNpc('aldrith');
    S.refreshEnv();
    S.music(null);
    S.flash('#ffffff', 900);
    S.shake(8, 2400);
    S.sfx('surge');
    await S.narrate('Aldrith falls. And the Current he has hoarded in himself, thirty years of stolen light, goes out of him all at once.');
    await S.say('aldrith', 'No... no, no, it is meant to *hold*...');
    S.addNpc({ id: 'aldrithOld', look: 'aldrith', x: 17, y: 16, dir: 'down' });
    await S.narrate('It does not go quietly. It rushes into the Core, and the Core, which has been drawn and drained and fed for far too long, begins to shake apart.');
    S.music('finale');
    await S.say('pip', 'The Core is overloading! Cog says every tap in Orrenth is going to feel it!');
    await S.say('hollis', 'Wren. It is breaking. If it breaks, every island goes down at once.');
    await S.say('wren', 'The Founder\'s Key can seal it. That is what Odalys wrote. Seal it, and the Current goes back to where it belongs.');
    await S.say('hollis', 'And it will burn the key, Wren. And your power with it. All of it.');
    await S.emote('wren', '...', 1800);
    await S.say('wren', 'I know. I have known since the vault.');
    await S.say('pip', 'Wren. No. There has to be another way.');
    await S.say('wren', 'There might be. I do not have time to look for it. The only thing I have is this.');
    // the rift pours out: Pip and Vesper hold the line
    S.shake(6, 1200);
    S.sfx('rumble');
    await S.narrate('The seams of the Core tear wider. Rift spawn pour out of them, a grey, hungry tide that surges toward the platform.');
    await S.say('vesper', 'Go. I will hold them.');
    await S.say('wren', 'Vesper, there are hundreds of them!');
    await S.say('vesper', 'Then I will be *very* busy. Go!');
    await S.say('pip', 'Cog says he is already running the numbers. He says the numbers are bad. I say the numbers can be rude and I will do it anyway.');
    await S.say('pip', 'Wren. I will hold the gates shut for as long as the tools hold. Do what you came to do.');
    await S.narrate('Pip slams a brass wrench into the gearwork of the lower gate, and the great doors groan shut against the tide. Vesper vanishes into the grey, a flash of blade and smoke, and the rift spawn scatter away from her like startled birds.');
    await S.say('hollis', 'And I will speak to it. Quickly. Wren, come.');
    S.sfx('bright');
    await S.narrate('Hollis steps up beside the Core. He does not shout, or chant, or spread his hands. He says the simplest thing he has ever said.');
    await S.say('hollis', '*I am here. We are all here. Please, be calm. She is going to help.*');
    await S.narrate('For a moment, the roar of the Core drops to a hush. A single, huge, patient note answers him, from everywhere at once.');
    await S.say('hollis', 'It says yes. It is saying yes, Wren.');
    // the choice
    for (;;) {
      const c = await S.choose(null, 'Wren raises the Founder\'s Key.', ['Seal the Core', 'Say goodbye first'], { cancel: 1 });
      if (c === 0) break;
      await S.say('wren', 'Pip. Thank you for being my first friend out of the harbor. Thank you for Cog, who is a terrible lantern and a wonderful one.');
      await S.say('pip', 'Do not say it like it is the end. It is not the end. It is a very *long middle*.');
      await S.say('wren', 'Vesper, I hope you keep your tab.');
      await S.say('vesper', '(from the dark) I am keeping it. You owe me forever.');
      await S.say('wren', 'Hollis, keep listening.');
      await S.say('hollis', 'I will. And when it sings, I will tell you what it says.');
    }
    S.music('farewell');
    await S.narrate('Wren walks to the heart of the Core. The light of it is so bright, she can hardly see. She does not let go of the blade.');
    await S.say('wren', 'I am not giving it to you. I am giving it *back*.');
    S.sfx('pendant');
    S.flash('#ffffff', 2000);
    S.shake(2, 2500);
    await S.narrate('She sets the Founder\'s Key into the Core. The ring of lantern-light around its guard spins faster, and faster, and the blade begins to dissolve into motes of gold and white, and then the motes are in her hands, and then they are in the air, and then they are everywhere.');
    await S.narrate('The Current moves through her like a long, deep breath, and she feels something enormous and gentle let go. It is not pain. It is the opposite of pain, and it is gone.');
    await S.wait(1600);
    S.flash('#ffffff', 2500);
    await S.fadeOut(1500);
    await story.epilogue(S);
  };

  /* ------------- the epilogue ------------- */
  story.epilogue = async (S) => {
    const st = S.st;
    S.setStep(31);
    G.audio.music('epilogue');
    const slide = async (title, lines) => {
      await S.card(title, '', 1800);
      for (const l of lines) await S.narrate(l);
    };
    await S.card('Epilogue', 'Some months later', 2800);
    await S.narrate('The Core sealed. The Current did not return all at once. It returned the way a tide returns: slowly, patiently, and then everywhere.');
    await S.narrate('The lanterns relit one by one, and the bridges steadied. The islands began to rise out of the mist, an inch at a time, so slowly that only the cloud-fishers noticed. The storms and the rifts faded. The Hollowed began, one at a time, to wake.');
    await slide('Pip and Cog', [
      'Pip rebuilt Odalys Fenwick\'s workshop in the Sunken Crown. Fenwick lanterns, hand-cranked and magic-free, are sold in every market in the Drift for nine coppers. Tolly keeps the ledger.',
      'No one ever found Odalys. Pip keeps her pencil on the bench, and a light in the green door\'s window every night.',
      'On the morning Wren left for the harbor, Cog hovered in the doorway for a long time. "Bleep." Pip translated, because someone had to: "Cog says, \'Do try not to save the world again. The paperwork is unbearable.\'"',
    ]);
    await slide('Vesper', [
      'Vesper Nyx pays back what she owes. She runs supplies to the fringe islands, flour, lamp oil and tinned stew, on a skiff she swears she borrowed. Her tab at the Gilded Hook is nine years long and shrinking.',
      'Every month she turns up at Pennywhistle Harbor with a loaf of bread she says she stole. Tilda says nobody steals her bread. Vesper says that is why it tastes so good.',
    ]);
    await slide('Hollis', [
      'Brother Hollis took Elder Maribel\'s place at Hushwell. The sisters say he walks the terraces every dawn with his head tilted, like a man listening to music through a wall.',
      'One morning, in front of everyone, he stopped by the pools and said it out loud. "I can hear it singing." Nobody laughed. Maribel, who could not see his face, smiled for a week.',
    ]);
    await slide('Everyone else', [
      'Archmage Aldrith Venmoor survives. Stripped of the Current he stole, he is a frail, quiet, white-haired old man with nothing left to hide behind. The world that loved him has to decide what to do with him. It is taking its time.',
      'Idris Vane is recovering, and has finally been told the truth. He asked for the Conservatory\'s library, and a very long list of questions. Neve Alder helped rebuild the Conservatory and its bridges, and the bridges no longer flicker. The Hunger is gone. She sleeps through the night.',
      'Cassian Lorne is remembered. There is a chalk message by the Conservatory gate that nobody has washed off in all these months. "Knock knock."',
      'Captain Isolde Brack, Tilda Moss and Fennick the ferryman rebuilt Pennywhistle Harbor, one lantern at a time.',
    ]);
    S.flag('restored');
    S.flag('gameComplete');
    S.st.flags.stationBroken = false;
    // the last scene
    st.party = st.party.filter((m) => m.id === 'wren');
    st.chapter = 'Epilogue';
    st.objective = '';
    await S.card('Pennywhistle Harbor', 'Dusk', 2600);
    await S.warp('harbor', 16, 28, 'up', { skipEnter: true });
    S.addNpc({ id: 'tildaEnd', look: 'tilda', x: 16, y: 26, dir: 'down' });
    S.music('epilogue');
    S.refreshEnv();
    await S.say('tilda', 'Wren! You are late. The bread is still warm, so you are *barely* forgiven.');
    await S.say('wren', 'I took the long way.');
    await S.say('tilda', 'You always do.');
    await S.say('tilda', 'I have something for you. Well, it is for everyone, but I decided it was mostly for you.');
    await S.narrate('Tilda holds out a paper lantern, plain and unpainted, with a small unlit candle inside.');
    await S.say('wren', 'Tilda, I cannot. I have not been able to light one since...');
    await S.say('tilda', 'I know. Try anyway.');
    await S.narrate('Wren holds the lantern in both hands. She closes her eyes, and reaches for something that is no longer there.');
    await S.wait(900);
    await S.narrate('Nothing happens. The candle stays dark.');
    await S.say('wren', '...Well. It was worth trying.');
    await S.wait(500);
    S.sfx('cog');
    S.addNpc({ id: 'pipEnd', look: 'pip', x: 16, y: 31, dir: 'up' });
    await S.move('pipEnd', 'UUU', 130);
    await S.say('pip', 'Are you trying to light that with your *mind*? Wren. Wren. Hand-cranked. It is the entire point.');
    await S.narrate('Pip holds up a brass lantern, a Fenwick, with a small crank on its side. Pip turns it twice, and a warm yellow flame climbs up the wick.');
    await S.narrate('Pip reaches over, tips the flame against Wren\'s candle, and it catches.');
    S.sfx('pendant');
    await S.say('wren', 'It is lit.');
    await S.say('pip', 'You did not light it. I lit it. Somebody always does. That is how it works.');
    await S.say('wren', 'Somebody always does.');
    await S.narrate('Wren stands in the harbor at dusk, in a patched blue cloak, with no pendant. Behind her, a hundred paper lanterns are coming alight, one by one, each lit by someone else.');
    await S.wait(1500);
    await S.fadeOut(2200);
    await S.card('One lantern', 'in the dark', 3600);
    st.step = 32;
    G.game.save();
    await G.scenes.go('actEnd', { final: true }, { fadeMs: 1500 });
  };
})();
