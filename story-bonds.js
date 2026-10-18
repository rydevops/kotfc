/* =========================================================================
   story-bonds.js — short companion scenes that play after a good night's
   rest (inns, the Heron's bunks, rest alcoves). Each plays once.
   ========================================================================= */
(function () {
  'use strict';
  const B = (def) => G.bonds.add(def);

  B({
    id: 'pipOdalys', step: 12, who: 'pip',
    run: async (S) => {
      await S.narrate('Night. Somewhere below, water taps against a hull. Pip is awake, turning a small brass gear over and over in the lamplight.');
      await S.say('wren', 'Is that one of hers?');
      await S.say('pip', 'It is a spare from Cog\'s left hinge. Odalys always made two of everything. "One to use and one to lose," she said, "and the one you lose is always the one you need."');
      await S.say('wren', 'That sounds like good advice.');
      await S.say('pip', 'It is terrible advice. I lost both. But I keep thinking, if I find her, I will not know what to say first.');
      await S.say('wren', 'You could start with "hello."');
      await S.say('pip', 'Hello. Hello. Hello, Odalys, I fixed the thing you said I would break. Hello. It works. Does that sound all right?');
      await S.say('wren', 'It sounds like the best thing anyone has ever said.');
      await S.narrate('Cog drifts down and settles on Pip\'s shoulder. His light dims to a small, warm glow.');
      await S.say('cog', 'Bleep.');
      await S.say('pip', 'He says to go to sleep. He says it is rude to hold a conversation with a gear.');
    },
    reward: 'Bond scene unlocked.',
  });

  B({
    id: 'vesperLedger', step: 14, who: 'vesper',
    run: async (S) => {
      await S.narrate('Vesper is sitting up, a small ledger open on her knee. She snaps it shut when Wren walks over, then sighs and opens it again.');
      await S.say('vesper', 'I was adding up what you owe me.');
      await S.say('wren', 'You do not owe me anything, and I do not think I owe you. We are just walking in the same direction.');
      await S.say('vesper', 'I know. That is what is bothering me. I have never travelled with anyone who did not owe me, or who I did not owe. It is a clean arrangement. Nobody gets hurt.');
      await S.say('wren', 'Is that why you took the job on the ferry, then?');
      await S.say('vesper', 'No. I took the job because you paid me, and I stayed after you stopped asking whether I would. Nobody has ever done that.');
      await S.say('wren', 'I did not think of it as a plan. I was scared, and I talk when I am scared.');
      await S.say('vesper', 'Then it was a very good accident. Do not tell anyone I said that.');
      await S.narrate('She tears a page from the ledger, folds it, and tucks it in Wren\'s pocket.');
      await S.say('vesper', 'That is the last page of that account. It says "paid in full." Keep it somewhere safe, or throw it in the sea. I do not mind which.');
    },
    reward: 'Bond scene unlocked.',
  });

  B({
    id: 'hollisHum', step: 17, who: 'hollis',
    run: async (S) => {
      await S.narrate('The lamp has burned low. Hollis sits cross-legged on the floor with his eleven grey stones laid out in a ring, his eyes closed.');
      await S.say('wren', 'Can I sit with you?');
      await S.say('hollis', 'Of course. Please, be as loud as you like. The stones are not shy tonight.');
      await S.say('wren', 'What do they sound like to you?');
      await S.say('hollis', 'Like someone humming in the next room. Not a song, exactly. More like a person who is content and does not know anyone can hear.');
      await S.say('wren', 'Does it ever frighten you? Hearing it?');
      await S.say('hollis', 'Before Dimmerrow, no. Afterward, every day. I hear how quiet it has become, and I think: did I do that? Did I listen too late?');
      await S.say('wren', 'You stayed with the villagers when everyone else left. That is not too late.');
      await S.say('hollis', 'Thank you. That was kind of you, and I think it was also true. I will try to believe it, slowly.');
      await S.narrate('The stones hum together for a moment, a low chord, then settle.');
    },
    reward: 'Bond scene unlocked.',
  });

  B({
    id: 'cogBleep', step: 20, who: 'pip',
    run: async (S) => {
      await S.narrate('Wren wakes to a faint clicking. Cog is hovering by the window, his lens turned toward the stars. Pip is already beside him, wrapped in a blanket.');
      await S.say('wren', 'What is he looking at?');
      await S.say('pip', 'The Drift lights. He says they are the lanterns of other people\'s towns. He asks every night if one of them is Odalys\'s.');
      await S.say('cog', 'Bleep.');
      await S.say('pip', 'He says I should tell you he has been very rude to you, and he is sorry. He says you are an acceptable key-holder.');
      await S.say('wren', 'Acceptable! From Cog, that is practically a medal.');
      await S.say('cog', 'Bleep. Bleep.');
      await S.say('pip', 'He says do not let it go to your head.');
    },
    reward: 'Bond scene unlocked.',
  });

  B({
    id: 'vesperHollis', step: 22, who: 'hollis',
    cond: (st) => st.party.some((m) => m.id === 'vesper'),
    run: async (S) => {
      await S.narrate('Two figures sit on the deck rail, a hand-width apart: a monk with folded hands, and a thief picking at a loose thread on her glove.');
      await S.say('vesper', 'You are staring.');
      await S.say('hollis', 'I am listening. It is different. Vesper, do you always sit with your back to the nearest exit?');
      await S.say('vesper', 'Always. Do you always sit as if nobody will ever hurt you?');
      await S.say('hollis', 'No. I sit as if I have promised not to hurt anyone, and that is the same shape from the outside.');
      await S.say('vesper', '...That is unnervingly good. Have you ever broken a promise?');
      await S.say('hollis', 'Every day I want to. That is what a promise is for.');
      await S.say('vesper', 'I think I would have liked a monk when I was a child. I only ever had a pawnbroker.');
      await S.say('hollis', 'Then I will happily be late.');
      await S.say('vesper', 'Do not tell the others I laughed.');
    },
    reward: 'Bond scene unlocked.',
  });

  B({
    id: 'wrenPendant', step: 26,
    run: async (S) => {
      await S.narrate('The alcove glows a faint, pale gold. Wren cannot sleep. She turns the pendant over in her fingers until Pip, from the next bedroll, sits up.');
      await S.say('pip', 'You are doing the thing.');
      await S.say('wren', 'What thing?');
      await S.say('pip', 'The "I am fine" thing, only silently.');
      await S.say('wren', 'I keep thinking about the Archmage. He raised me. He taught me to read, and tie my boots, and what a closed door sounds like when someone is working behind it. And he is the one at the end of all this.');
      await S.say('pip', 'You do not have to decide what he is tonight.');
      await S.say('wren', 'No. But I think I have to decide who I am when I meet him. That part is mine.');
      await S.say('pip', 'You are the girl who ran toward the Maw. I have it in writing. I wrote it down.');
      await S.say('wren', 'You wrote it down?');
      await S.say('pip', 'Obviously. In my own notebook. With a diagram.');
      await S.narrate('Wren laughs, quietly, and the pendant stops feeling so heavy.');
    },
    reward: 'Bond scene unlocked.',
  });
})();
