/* =========================================================================
   story-act2b.js — ACT II (part 2): TALLOW CAY
   Steps: 12 sailing for the Cay · 13 Wick has named Vesper · 14 Vesper has
          joined · 15 Idris beaten, Dimmerrow lead in hand
   ========================================================================= */
(function () {
  'use strict';
  const story = (G.story = G.story || {});
  const J = G.data.story.journal;

  J.push(
    { step: 13, title: 'The Seller', text: 'Old Wick looked at the shard and read the name out of his ledger without even blinking: V. Nyx. Vesper Nyx sold the crystal that went into the part that broke our station. Cog went dim again. I do not know what Cog knows.' },
    { step: 14, title: 'Vesper', text: 'Vesper Nyx has joined us for a hundred gold and a share of whatever we find. She flinches whenever somebody says the word "crystal." I think she knows more than she is saying. I think I do too.' },
    { step: 15, title: 'Stillness', text: 'Aldrith\'s crier told the whole market that I am missing and that the Hollow Choir has been sent to "bring me home safely." Then Idris came. He believes every word. He is still waiting for Aldrith to fix everything. Wick says Odalys once shipped a crate of "listening stones" to a monk on the fringe island of Dimmerrow.' },
  );

  const OLD = { name: 'Old Wick', look: 'wick' };

  /* ------------- Old Wick ------------- */
  story.wick = async (S) => {
    const st = S.st;
    if (!st.flags.wickMet) {
      S.flag('wickMet');
      await S.say('wick', 'Customers! Or soldiers. Or soldiers pretending to be customers. None of you are pretending well. What do you want?');
      await S.say('wren', 'Information. Somebody sold a crystal that ended up inside this.');
      await S.narrate('Wren sets the shard on the counter. The star-shaped rivets catch the green light.');
      await S.emote('wick', '...', 1500);
      await S.say('wick', 'Where did you get that?');
      await S.say('pip', 'Pennywhistle Harbor. It came out of a crate that broke the station.');
      await S.say('wick', 'Hm. Hm, hm. Tap-grade, green. I have not seen stock like that in two years. Only a handful ever came through the Cay, and I log every one. I am a liar, but I am a *tidy* liar.');
      S.flag('cogDim');
      await S.wait(500);
      await S.say('wick', 'Here. Page forty. "Green crystal, tap-grade, one piece. Sold: V. Nyx."');
      await S.say('pip', 'Nyx?');
      await S.say('wick', 'Vesper Nyx. The best thief on the Cay, and the worst at keeping a secret about herself. She sells crystals to anybody who does not ask where they came from. She will be at the Gilded Hook, over on the west side, pretending she is not waiting for someone to hire her.');
      S.flag('cogDim', false);
      await S.say('pip', 'Cog says your ledger is "probably wrong." Cog never says that about ledgers. I am worried.');
      await S.say('wick', 'Cogs cannot read, little one. Do not argue with the book.');
      await S.say('wren', 'We are also looking for Odalys Fenwick. This is her dock tag.');
      await S.say('wick', 'Odalys! Quiet. Exact change. I remember. Two years ago she boxed up a crate of grey stones that hummed. "Listening stones," she called them. Nobody on the Cay would touch them, so she shipped them off to a monk on Dimmerrow, that dead little island out on the fringe. That was her last crate.');
      await S.say('wren', 'Dimmerrow. Thank you, Wick.');
      await S.say('wick', 'It was a lie, but I will not charge for it. Buy something on your way out. Everything is legal. Everything is legal *enough*.');
      S.setStep(13);
      G.travel.unlock('dimmerrow');
      S.objective('Find Vesper Nyx at the Gilded Hook, on the west side of the Cay.');
      await S.shop('tallowMarket');
      return;
    }
    await S.say('wick', st.step >= 15 ? 'I heard what happened in the plaza. Do not worry, I did not see anything. I never see anything. It is why I am still alive.' : 'Back again. Ask me about the Gilded Hook if you have forgotten the way.');
    await S.shop('tallowMarket');
  };

  /* ------------- Vesper ------------- */
  story.vesperMeet = async (S) => {
    const st = S.st;
    if (st.step < 13) return S.say('vesper', 'Sorry. I am in the middle of a very important nap.');
    await S.say('vesper', 'Depends who is asking. And who is paying.');
    await S.say('wren', 'Vesper Nyx? Wick says you sold a green crystal two years ago.');
    await S.emote('vesper', '...', 1200);
    await S.say('vesper', 'I sell a lot of crystals. Hundreds.');
    await S.say('wren', 'This one went into a tap-station part. It broke our harbor.');
    await S.say('vesper', 'Stations break. It is practically their whole personality.');
    await S.say('pip', 'Cog says you are doing the thing people do when they pretend they do not care. He knows the look.');
    await S.say('vesper', 'Does he, now?');
    await S.say('vesper', 'You are the Archmage\'s ward. Wren Ashgrove. There is a crier on the east side of the plaza who will be reading out your name in about an hour, with a reward attached. I counted the coins in the wanted bill. Five thousand gold.');
    await S.say('pip', 'You would not.');
    await S.say('vesper', 'I would. I will not. Three reasons. One, it is a bad price for a girl who carries a station-killer in her satchel. Two, I want to know what I sold. Three, you two clearly have no idea where you are going, and the Cay is the *friendly* part.');
    await S.say('wren', 'What do you want?');
    await S.say('vesper', 'A hundred gold now. A third of anything shiny we find, my pick. And no questions about the crystal. That last one is not negotiable.');
    const pay = Math.min(100, st.gold);
    const c = await S.choose('wren', pay >= 100 ? 'A hundred gold, a share, and no questions. Do we take it?' : 'We do not have a hundred gold. She might take what we have.', ['Agree', 'Think about it'], { cancel: 1 });
    if (c !== 0) return S.say('vesper', 'The offer expires when I get bored. I get bored fast.');
    if (pay > 0) S.gold(-pay);
    await S.say('vesper', pay >= 100 ? 'Pleasure doing business.' : 'It is not a hundred. I will put the rest on your tab. I keep a very long tab.');
    S.flag('vesperJoined');
    S.join('vesper');
    S.setStep(14);
    await S.say('vesper', 'Vesper Nyx. Rogue. Genius. Also, apparently, unemployed, right up until a minute ago. Try to keep me interesting.');
    await S.say('pip', 'Pip Quillfeather. Tinkerer. Genius. Unpaid.');
    await S.say('vesper', 'We are going to get along terribly.');
    G.ui.toast('Vesper joins the party. Her Pickpocket steals from foes, and Smoke Trick dims their aim.');
    S.objective('Head out through the plaza with Vesper. Something is stirring in the market.');
    S.respawnNpcs();
  };

  /* ------------- the crier, then Idris ------------- */
  story.crierScene = async (S) => {
    S.music('tallow');
    S.addNpc({ id: 'crier', look: 'crier', x: 22, y: 23, dir: 'up' });
    S.addNpc({ id: 'guardC', look: 'syndicate', x: 20, y: 23, dir: 'left' });
    await S.move('player', 'D');
    S.face('player', 'down');
    await S.say('crier', 'Hear ye! Hear ye, people of the Drift! A message from the Grand Archmage Aldrith Venmoor of the Astral Conservatory!');
    await S.say('crier', '"My beloved ward, Wren Ashgrove, has gone missing after a terrible tragedy at Pennywhistle Harbor. She is frightened. She is grieving. She may be in the company of thieves and tinkerers who mean her no good."');
    await S.say('vesper', 'Thieves *and* tinkerers. He could have just said "company."');
    await S.say('pip', 'Cog says that is the nicest thing anyone has called us this week.');
    await S.say('crier', '"I have sent my finest students, the Hollow Choir, to bring her home safely. Anyone who helps will be rewarded. Anyone who harms her will answer to me."');
    await S.narrate('The crowd murmurs. A woman presses her hand to her heart. "That poor child," someone says. "The Archmage loves her so."');
    await S.say('wren', 'He is not lying.');
    await S.say('pip', 'Wren, he is *absolutely* lying. He broke your harbor!');
    await S.say('wren', 'I know. But "safely" is what scares me. He said safely. He did not say freely.');
    S.sfx('rumble');
    await S.narrate('A hush spreads through the plaza. A juggler\'s ball hangs in the air, and does not fall. The crier\'s mouth stays open on a word. Even the lamp flames stand still.');
    S.flash('#d0e8ff', 500);
    S.addNpc({ id: 'idris', look: 'idris', x: 22, y: 19, dir: 'down' });
    await S.emote('player', '!');
    await S.say('idris', 'Ashgrove. You are a difficult person to find.');
    await S.say('wren', 'Idris?');
    await S.say('idris', 'Fortunately, you are also a very loud person to follow. The Archmage is worried sick. He has not slept. Come home, Wren.');
    await S.say('wren', 'What happened to you? You are... still. All of you is still.');
    await S.say('idris', 'Nothing *happened* to me. Something was *given*. Stillness, from the Archmage himself. He showed me how to hold a moment so firmly that it cannot get away. You would understand it, if you would stop running.');
    await S.say('wren', 'He built the part that broke Pennywhistle, Idris.');
    await S.say('idris', 'A regrettable cost. He told me so himself, with tears in his eyes. The great work requires sacrifice, and I am honored to carry my share.');
    await S.say('vesper', 'Oh, he is one of *those*.');
    await S.say('pip', 'Cog says to freeze him in place with a pie. I think Cog is confused.');
    await S.say('idris', 'Please. Do not make this unpleasant. I am very good at holding still. You will find it is quite impossible to move.');
    await story.idrisFight(S);
  };

  story.idrisFight = async (S) => {
    S.music(null);
    const r = await S.battle({ mobs: ['idrisVane'], bg: 'tallow', music: 'boss', noFlee: true });
    S.removeNpc('idrisGuard');
    S.flash('#ffffff', 300);
    await S.narrate('The plaza breathes again. The juggler\'s ball drops. Somewhere a lamp flame gutters back to life.');
    await S.say('idris', 'This... is not possible. It should have held.');
    await S.say('wren', 'Idris. Stop. It is over.');
    await S.say('idris', 'The stillness is... I cannot hold it. It slips. It *hurts*. He did not say it would hurt.');
    await S.say('wren', 'He did not tell you many things.');
    await S.say('idris', 'He will fix it. He always does. He is the Archmage. He has never once been wrong.');
    await S.emote('wren', '...');
    await S.say('wren', 'Idris, look at me. He sent you to find me with something that hurts you. Is that what a teacher does?');
    await S.say('idris', '...');
    await S.narrate('Idris stares at nothing, as if he has lost his place in a book he has read a hundred times. Slowly, he sits down on the edge of the plaza, hands open on his knees.');
    await S.say('idris', 'Go. Please. I do not... I am not able to stop you. He will understand. He understands everything.');
    S.removeNpc('idris');
    S.addNpc({ id: 'idrisSeat', look: 'idris', x: 22, y: 19, dir: 'down', talk: async (S2) => { await S2.say('idris', 'I am resting. The Archmage will send someone. He always does.'); } });
    S.flag('idrisDown');
    S.setStep(15);
    S.removeNpc('crier'); S.removeNpc('guardC');
    await S.say('vesper', 'Well. That was grim.');
    await S.say('wren', 'He believes every word.');
    await S.say('vesper', 'People who believe like that usually go on believing, right up until the day they cannot. Then it is worse.');
    await S.say('pip', 'Where to now? Wick said Odalys sent the stones to Dimmerrow.');
    await S.say('vesper', 'Dimmerrow. The island nobody visits. It is a dead grey rock at the end of the fringe, and the people there stopped talking last winter.');
    await S.say('wren', 'Then that is where we are going.');
    G.travel.unlock('dimmerrow');
    G.ui.toast('Dimmerrow added to the skiff\'s destinations.');
    S.objective('Sail for Dimmerrow, a dead island at the end of the fringe. Use the skiff at the south dock.');
    S.respawnNpcs();
    S.music('tallow');
  };

  /* ------------- the Cay's folk ------------- */
  story.gambler = async (S) => {
    const nm = { name: 'Dice-Dame', look: 'gambler' };
    await S.say(nm, 'Three bones, one lucky guess. Thirty gold a throw, double if you call it right.');
    const c = await S.choose(nm, 'Odd or even?', ['Odd (30g)', 'Even (30g)', 'Walk away'], { cancel: 2 });
    if (c === 2) return S.say(nm, 'Smart. Or scared. Both are fine.');
    if (S.st.gold < 30) return S.say(nm, 'Come back when you have thirty. I do not take promises. I tried once. It was a mistake.');
    S.gold(-30);
    const roll = 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6);
    S.sfx('chest');
    await S.say(nm, `The bones say ${roll}.`);
    const win = (roll % 2 === 1) === (c === 0);
    if (win) { S.gold(60); await S.say(nm, 'Beginner\'s luck. Come back when you have less of it.'); }
    else await S.say(nm, 'The house is very grateful.');
  };

  story.rook = async (S) => {
    const st = S.st;
    const nm = { name: 'Rook', look: 'salvager' };
    if (st.flags.rookDone) return S.say(nm, 'That crystal is still lit. People walk by just to look at it. Best thing I have ever sold, and I did not even sell it.');
    if (!st.flags.rookAsked) {
      S.flag('rookAsked');
      await S.say(nm, 'My lamp keeps going dark. The whole row\'s on stolen light and mine\'s the only one that is not lit.');
      await S.say(nm, 'A Flow Shard would do it. A sliver of crystal Current, sold at Wick\'s counter. I would buy one, but I have already spent my money on... unrelated mistakes. If you bring me one, I will give you something better.');
      S.objective('Side quest: bring Rook a Flow Shard (sold at Wick\'s Counter).');
      return;
    }
    if (G.game.count('flowShard') > 0) {
      await S.say(nm, 'Is that... a *Flow Shard*? For me?');
      S.take('flowShard');
      S.sfx('pendant');
      await S.wait(500);
      await S.narrate('The crystal in the lamp wakes up. A soft green light spills across the stall, and the stall-keepers on either side turn to stare.');
      S.give('moonCrystal');
      S.flag('rookDone');
      await S.say(nm, 'Take this, then. It is a moon crystal. I was saving it for an emergency, and this, I think, is the closest I will ever come.');
      return;
    }
    await S.say(nm, 'No shard yet? Wick sells them. Do not tell him I sent you.');
  };
})();
