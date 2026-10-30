// Lightweight, offline reading of journal text: a mood guess from feeling words and
// activity tags from keywords. Rules, not AI — good enough to pre-fill the form.

export type Emotion =
  | 'joy' | 'calm' | 'gratitude' | 'confidence' | 'love' | 'excitement'
  | 'sadness' | 'anger' | 'anxiety' | 'fatigue' | 'boredom' | 'loneliness' | 'stress' | 'shame'

export const EMOTIONS: Record<Emotion, { emoji: string; label: string }> = {
  joy: { emoji: '😊', label: 'Joy' },
  calm: { emoji: '😌', label: 'Calm' },
  gratitude: { emoji: '🙏', label: 'Gratitude' },
  confidence: { emoji: '💪', label: 'Confidence' },
  love: { emoji: '🥰', label: 'Love' },
  excitement: { emoji: '🤩', label: 'Excitement' },
  sadness: { emoji: '😢', label: 'Sadness' },
  anger: { emoji: '😠', label: 'Anger' },
  anxiety: { emoji: '😰', label: 'Anxiety' },
  fatigue: { emoji: '😴', label: 'Tiredness' },
  boredom: { emoji: '😑', label: 'Boredom' },
  loneliness: { emoji: '🫂', label: 'Loneliness' },
  stress: { emoji: '😣', label: 'Stress' },
  shame: { emoji: '😔', label: 'Guilt' },
}

type Lex = [weight: number, emotion: Emotion]

// Single words. Weight is how strongly the word pushes mood (+ happier, − sadder).
const WORDS: Record<string, Lex> = {
  // joy & excitement
  good: [1, 'joy'], great: [1.5, 'joy'], amazing: [2, 'joy'], awesome: [2, 'joy'], fantastic: [2, 'joy'],
  wonderful: [2, 'joy'], best: [2, 'joy'], happy: [1.5, 'joy'], happier: [1.5, 'joy'], glad: [1, 'joy'],
  fun: [1, 'joy'], laughed: [1.5, 'joy'], laughing: [1.5, 'joy'], enjoyed: [1, 'joy'], nice: [1, 'joy'],
  cheerful: [1.5, 'joy'], joyful: [2, 'joy'], delighted: [2, 'joy'], lovely: [1.5, 'joy'], better: [1, 'joy'],
  fine: [0.3, 'calm'], okay: [0.2, 'calm'], ok: [0.2, 'calm'], alright: [0.3, 'calm'], decent: [0.5, 'joy'],
  excited: [1.5, 'excitement'], thrilled: [2, 'excitement'], ecstatic: [2.5, 'excitement'], pumped: [1.5, 'excitement'],
  // calm & gratitude & love
  calm: [1, 'calm'], relaxed: [1, 'calm'], peaceful: [1, 'calm'], content: [1, 'calm'], cozy: [1, 'calm'],
  grounded: [1, 'calm'], relieved: [1, 'calm'], rested: [1, 'calm'], refreshed: [1, 'calm'], lighter: [1, 'calm'],
  grateful: [1.5, 'gratitude'], thankful: [1.5, 'gratitude'], blessed: [1.5, 'gratitude'], appreciated: [1, 'gratitude'],
  love: [1.5, 'love'], loved: [1.5, 'love'], connected: [1, 'love'], supported: [1, 'love'],
  // confidence & energy
  proud: [1.5, 'confidence'], confident: [1, 'confidence'], competent: [1, 'confidence'], accomplished: [1.5, 'confidence'],
  productive: [1, 'confidence'], motivated: [1, 'confidence'], energized: [1.5, 'confidence'], inspired: [1.5, 'confidence'],
  strong: [1, 'confidence'], capable: [1, 'confidence'],
  // sadness
  sad: [1.5, 'sadness'], unhappy: [1.5, 'sadness'], gloomy: [1.5, 'sadness'], depressed: [2.5, 'sadness'], hopeless: [2.5, 'sadness'], miserable: [2, 'sadness'],
  empty: [1.5, 'sadness'], numb: [1.5, 'sadness'], heartbroken: [2.5, 'sadness'], hurt: [1.5, 'sadness'],
  cry: [1.5, 'sadness'], cried: [1.5, 'sadness'], crying: [1.5, 'sadness'], disappointed: [1.5, 'sadness'],
  worthless: [2.5, 'sadness'], helpless: [2, 'sadness'], awful: [2, 'sadness'], terrible: [2, 'sadness'],
  horrible: [2, 'sadness'], bad: [1, 'sadness'], worse: [1.5, 'sadness'], worst: [2, 'sadness'], sick: [1.5, 'sadness'],
  rejected: [2, 'sadness'], rejection: [2, 'sadness'], meh: [0.8, 'boredom'],
  // anger
  angry: [1.5, 'anger'], mad: [1.5, 'anger'], furious: [2.5, 'anger'], annoyed: [1, 'anger'], irritated: [1, 'anger'],
  frustrated: [1.5, 'anger'], pissed: [2, 'anger'], rage: [2.5, 'anger'], raging: [2.5, 'anger'], hate: [2, 'anger'],
  hated: [2, 'anger'], resentful: [1.5, 'anger'], scream: [1.5, 'anger'], screaming: [1.5, 'anger'],
  kill: [2.5, 'anger'], killing: [2.5, 'anger'], killed: [2.5, 'anger'], murder: [3, 'anger'], murdering: [3, 'anger'],
  stab: [3, 'anger'], stabbing: [3, 'anger'], strangle: [3, 'anger'], punch: [2, 'anger'], punching: [2, 'anger'],
  smash: [1.5, 'anger'], violent: [2.5, 'anger'],
  // anxiety & stress
  anxious: [1.5, 'anxiety'], anxiety: [1.5, 'anxiety'], worried: [1, 'anxiety'], nervous: [1, 'anxiety'],
  scared: [1.5, 'anxiety'], afraid: [1.5, 'anxiety'], panicked: [2, 'anxiety'], panic: [2, 'anxiety'],
  dread: [1.5, 'anxiety'], dreading: [1.5, 'anxiety'], scaries: [1, 'anxiety'], uneasy: [1, 'anxiety'],
  stressed: [1.5, 'stress'], stress: [1, 'stress'], stressful: [1.5, 'stress'], overwhelmed: [1.5, 'stress'],
  pressure: [1, 'stress'], unprepared: [1, 'stress'], behind: [1, 'stress'], stuck: [1, 'stress'], swamped: [1.5, 'stress'],
  // fatigue & boredom
  tired: [1, 'fatigue'], exhausted: [1.5, 'fatigue'], drained: [1.5, 'fatigue'], sleepy: [1, 'fatigue'],
  sluggish: [1, 'fatigue'], weary: [1, 'fatigue'], fatigued: [1.5, 'fatigue'],
  dull: [1, 'boredom'], bored: [1, 'boredom'], boring: [1, 'boredom'], blah: [1, 'boredom'],
  unmotivated: [1.2, 'boredom'], lazy: [0.8, 'boredom'], pointless: [1.5, 'boredom'],
  // loneliness & shame
  lonely: [1.5, 'loneliness'], alone: [1, 'loneliness'], isolated: [1.5, 'loneliness'], ignored: [1.5, 'loneliness'],
  guilty: [1, 'shame'], ashamed: [1.5, 'shame'], embarrassed: [1, 'shame'], stupid: [1, 'shame'],
}
// More everyday feeling words, grouped by emotion and strength. Existing entries win.
const MORE: [Emotion, number, string][] = [
  ['joy', 1, 'pleased satisfied upbeat positive smiling smiled grinning amused playful sunny yay good-mood'],
  ['joy', 1.5, 'cheery giddy brilliant superb incredible perfect beautiful fulfilled overjoyed'],
  ['joy', 2, 'elated blissful bliss euphoric'],
  ['excitement', 1.5, 'stoked hyped eager enthusiastic keen psyched'],
  ['calm', 1, 'chill serene safe comfortable recharged rejuvenated restful settled balanced mellow'],
  ['calm', 0.5, 'well rested'],
  ['gratitude', 1, 'valued appreciative lucky fortunate'],
  ['love', 1, 'cared hugged included understood seen heard'],
  ['confidence', 1, 'optimistic hopeful determined focused energetic alive empowered unstoppable'],
  ['sadness', 1, 'rough lousy crappy sucks sucked gross unwell sore teary tearful regret regretful sorry homesick'],
  ['sadness', 1.5, 'gutted devastated grief grieving mourning sobbing weeping unloved unwanted abandoned betrayed misunderstood defeated discouraged hollow'],
  ['sadness', 2, 'crushed heartbroken shattered'],
  ['anger', 1, 'grumpy cranky moody irritable touchy bitter jealous envious'],
  ['anger', 2, 'livid enraged outraged disgusted'],
  ['anxiety', 1, 'tense jittery shaky restless overthinking insecure paranoid'],
  ['anxiety', 1.5, 'frightened terrified panicky'],
  ['stress', 1, 'hectic chaotic frantic rushed overworked overloaded busy'],
  ['fatigue', 1, 'groggy foggy sleepless insomnia burned yawning'],
  ['boredom', 1, 'apathetic indifferent uninspired stagnant aimless'],
  ['shame', 1, 'useless inadequate failure failed'],
  ['loneliness', 1, 'excluded unseen'],
]
for (const [emotion, weight, list] of MORE) {
  for (const w of list.split(' ')) WORDS[w] ??= [weight, emotion]
}
WORDS.busy = [0.4, 'stress'] // mild: busy isn't always bad

for (const [w, [weight, emo]] of Object.entries(WORDS)) {
  if (['sadness', 'anger', 'anxiety', 'fatigue', 'boredom', 'loneliness', 'stress', 'shame'].includes(emo)) WORDS[w] = [-weight, emo]
}

// Multi-word phrases are matched first so their words aren't counted twice.
const PHRASES: [RegExp, number, Emotion][] = [
  [/\b(killed|killing|crushed|nailed) it\b/, 1.5, 'confidence'],
  [/\b(over the moon|on top of the world|on cloud nine)\b/, 2.5, 'joy'],
  [/\bnot (too |that |so )?bad\b/, 0.8, 'calm'],
  [/\b(can't complain|pretty good)\b/, 1, 'joy'],
  [/\b(burn(ed|t) out|burnout)\b/, -2, 'fatigue'],
  [/\b(fed up|had enough|sick of)\b/, -1.5, 'anger'],
  [/\b(no energy|wiped out|dead tired|running on empty)\b/, -1.5, 'fatigue'],
  [/\b(falling apart|breaking down|can't cope|can't take it)\b/, -2.5, 'stress'],
  [/\b(left out|no one cares|nobody cares)\b/, -1.5, 'loneliness'],
  [/\b(never (been|felt)|couldn'?t be|can'?t be) (so |any )?(happier|better)\b/, 2.5, 'joy'],
  [/\b(can'?t wait|looking forward)\b/, 1.5, 'excitement'],
  [/\b(good|great|amazing|lovely|productive|fun) (day|night|time|morning|weekend)\b/, 1.5, 'joy'],
  [/\b(bad|rough|long|hard|tough|awful|terrible|horrible|exhausting) (day|night|week|morning)\b/, -1.5, 'stress'],
  [/\b(on edge|freaking out|stressed out|losing it|at my limit)\b/, -1.5, 'anxiety'],
  [/\b(dead inside|feel nothing|don'?t care anymore)\b/, -2, 'sadness'],
  // Sleep quality
  [/\b(slept|sleeping|went to (bed|sleep)|stayed up|was up|up) (really |so |very |too )?(late|till \d+|until \d+)\b/, -1, 'fatigue'],
  [/\b(couldn'?t (fall )?asleep|couldn'?t sleep|tossed and turned|restless night|bad sleep|poor sleep|barely slept|hardly slept|woke up (tired|exhausted|multiple times)|overslept)\b/, -1.2, 'fatigue'],
  [/\b(slept (well|great|so well|really well|like a baby)|good (night'?s )?sleep|great sleep|well[- ]rested|woke up (refreshed|rested|early and happy))\b/, 1.2, 'calm'],
  [/\b(feel|feeling|felt|been)( so| really| very| quite| a bit| a little| kinda| kind of| sort of| pretty| super| extremely| rather| slightly| somewhat| totally)? (down|low|blue|flat|lost|off|meh|not myself)\b/, -1.2, 'sadness'],
  // "I'm down" / "I'm off" are often neutral ("I'm down to hang", "I'm off to class"), so require a qualifier.
  [/\b(am|i'?m|im) (so|really|very|quite|a bit|a little|kinda|pretty|super|extremely|totally) (down|low|blue|meh)\b/, -1.2, 'sadness'],
  [/\b(cheered me up|made my day|lifted my (mood|spirits)|feel(ing)? (much |a lot |so )?better|felt (much |a lot |so )?better)\b/, 1.5, 'joy'],
  [/\b(could kill for|kill for)\b/, 0, 'joy'],
  [/\bkill(ing|ed)? (some )?time\b/, 0, 'calm'],
  [/\b(joke|meme|video|show|movie|that|this) (killed|is killing|was killing) me\b/, 1, 'joy'],
]

const NEGATORS = new Set(['not', 'no', 'never', "didn't", "don't", "doesn't", "wasn't", "isn't", "aren't", "couldn't", "can't", 'cannot', "won't", 'hardly', 'barely', 'nothing', "ain't", 'dont', 'didnt', 'isnt', 'wasnt', 'cant'])
const INTENSIFIERS = new Set(['very', 'so', 'really', 'super', 'extremely', 'incredibly', 'totally', 'too', 'completely', 'absolutely', 'deeply', 'utterly', 'quite', 'pretty', 'way', 'hella', 'mega', 'insanely', 'seriously', 'truly', 'genuinely'])
const SOFTENERS = new Set(['bit', 'slightly', 'kinda', 'kind', 'somewhat', 'little', 'sorta', 'mildly'])
const CLAUSE_BREAKS = new Set(['but', 'though', 'however', 'although', 'yet'])

export type Concern = 'self-harm' | 'harm-others'

export interface Sentiment {
  /** Sum of word weights; positive is happier. */
  score: number
  /** Mood guess on the 1–10 scale. */
  mood: number
  label: 'Very negative' | 'Negative' | 'Mixed' | 'Positive' | 'Very positive'
  words: { word: string; weight: number; emotion: Emotion; note?: string }[]
  /** Emotions found, strongest first, with their share of the total signal (0–1). */
  emotions: { emotion: Emotion; strength: number }[]
  concern: Concern | null
  /** "critical" when the text mentions harming yourself or someone else. */
  severity: 'calm' | 'mild' | 'strong' | 'critical'
}

const SELF_HARM = /\b(kill(ing)? myself|end (it all|my life)|want(ed)? to die|wanna die|suicid\w*|hurt(ing)? myself|self[- ]?harm|no reason to live|better off dead|don'?t want to (live|be here|exist))\b/
// A violent verb, then up to three filler words, then a person ("kill the person next to me",
// "feel like punching my roommate"). Objects like "it" or "time" don't count, so "killing it" is fine.
const VIOLENT_VERB = String.raw`(kill(?:ing|ed)?|stab(?:bing|bed)?|shoot(?:ing)?|shot|murder(?:ing|ed)?|strangl(?:e|ing)|beat(?:ing)? up|punch(?:ing)?|choke|choking|hurt(?:ing)?|harm(?:ing)?)`
const PERSON = String.raw`(someone|somebody|him|her|them|people|everyone|everybody|(?:the|this|that|a|my|our|his|her) (?:person|people|guy|girl|man|woman|kid|dude|boss|roommates?|friends?|brother|sister|mom|dad|partner|teammates?|professor|teacher|manager|coworkers?|colleagues?|neighbou?rs?|ex|classmates?|driver|stranger)s?)`
const HARM_OTHERS = new RegExp(String.raw`\b${VIOLENT_VERB}\s+(?:\w+\s+){0,3}?${PERSON}\b`)

const round1 = (n: number) => Math.round(n * 10) / 10

export function analyseSentiment(text: string, sleepHours: number | null = guessSleep(text)): Sentiment | null {
  let lower = text.toLowerCase().replace(/[’‘]/g, "'")
  const words: Sentiment['words'] = []
  let score = 0

  for (const [re, base, emotion] of PHRASES) {
    const m = lower.match(re)
    if (!m) continue
    // Like single words, a phrase after "but" in the same sentence counts more.
    const afterBut = /\b(but|though|however|although|yet)\b[^.!?;\n]*$/.test(lower.slice(0, m.index))
    lower = lower.replace(re, ' ')
    if (base === 0) continue
    const weight = afterBut ? round1(base * 1.3) : base
    score += weight
    words.push({ word: m[0], weight, emotion, note: afterBut ? 'after “but”, counts more' : undefined })
  }

  // Split into clauses at punctuation so negation doesn't leak across sentences.
  const clauses = lower.split(/[.!?;,\n]+/)
  for (const clause of clauses) {
    const tokens = clause.match(/[a-z']+/g) ?? []
    let afterBut = false
    let negatedUntil = -1
    tokens.forEach((tok, i) => {
      if (CLAUSE_BREAKS.has(tok)) {
        afterBut = true
        negatedUntil = -1
        return
      }
      if (NEGATORS.has(tok)) {
        negatedUntil = i + 3
        return
      }
      const lex = WORDS[tok]
      if (!lex || lex[0] === 0) return
      let [weight] = lex
      const emotion = lex[1]
      const notes: string[] = []
      if (INTENSIFIERS.has(tokens[i - 1])) {
        weight *= 1.5
        notes.push(`stronger with “${tokens[i - 1]}”`)
      } else if (SOFTENERS.has(tokens[i - 1]) || SOFTENERS.has(tokens[i - 2])) {
        weight *= 0.6
        notes.push('softened')
      }
      let label = tok
      let emo: Emotion = emotion
      if (i <= negatedUntil) {
        // "not fine" is clearly negative; "not sad" is only mildly positive.
        weight = weight > 0 ? -Math.max(1, weight * 0.9) : Math.abs(weight) * 0.5
        emo = weight < 0 ? 'sadness' : 'calm'
        label = `not ${tok}`
        notes.push('negated')
      }
      if (afterBut) {
        weight *= 1.3
        notes.push('after “but”, counts more')
      }
      score += weight
      words.push({ word: label, weight: round1(weight), emotion: emo, note: notes.join(', ') || undefined })
    })
  }

  // Very little sleep weighs on mood even if the words don't say so.
  if (sleepHours !== null && sleepHours < 5) {
    const weight = sleepHours < 3 ? -1.5 : -1
    score += weight
    words.push({ word: `${sleepHours}h sleep`, weight, emotion: 'fatigue', note: 'very little sleep' })
  }

  const concern: Concern | null = SELF_HARM.test(lower) ? 'self-harm' : HARM_OTHERS.test(lower) ? 'harm-others' : null
  if (concern && !words.length) score -= 3
  if (!words.length && !concern) return null

  const totals = new Map<Emotion, number>()
  for (const w of words) totals.set(w.emotion, (totals.get(w.emotion) ?? 0) + Math.abs(w.weight))
  const sum = [...totals.values()].reduce((a, b) => a + b, 0) || 1
  const emotions = [...totals]
    .map(([emotion, v]) => ({ emotion, strength: round1(v / sum) }))
    .sort((a, b) => b.strength - a.strength)

  score = round1(score)
  const label: Sentiment['label'] =
    concern || score <= -3 ? 'Very negative' : score < -0.5 ? 'Negative' : score <= 0.5 ? 'Mixed' : score < 3 ? 'Positive' : 'Very positive'
  // Keep the face consistent with the label: negative never shows "okay", positive never below "good".
  let mood = Math.min(10, Math.max(1, Math.round(5.5 + score * 0.9)))
  if (label === 'Negative') mood = Math.min(mood, 4)
  if (label === 'Positive') mood = Math.max(mood, 7)
  if (concern) mood = 1
  if (concern === 'harm-others' && !emotions.some((e) => e.emotion === 'anger')) emotions.unshift({ emotion: 'anger', strength: 1 })
  const severity: Sentiment['severity'] = concern ? 'critical' : Math.abs(score) >= 3 ? 'strong' : Math.abs(score) > 0.5 ? 'mild' : 'calm'
  return { score, mood, label, words, emotions, concern, severity }
}

const NEGATIVE_EMOTIONS = new Set<Emotion>(['sadness', 'anger', 'anxiety', 'fatigue', 'boredom', 'loneliness', 'stress', 'shame'])

/** The strongest emotion that agrees with the overall direction of the text. */
export function mainEmotion(s: Sentiment): Emotion | null {
  const wantNegative = s.score < 0
  return s.emotions.find((e) => NEGATIVE_EMOTIONS.has(e.emotion) === wantNegative)?.emotion ?? s.emotions[0]?.emotion ?? null
}

/** Energy guess (1–10) from words about tiredness or energy. */
export function guessEnergy(text: string): number | null {
  const t = text.toLowerCase()
  if (/\b(exhausted|drained|no energy|wiped out|dead tired|burn(ed|t) out|(super|so|really|very|extremely) (tired|sleepy))\b/.test(t)) return 2
  if (/\b(tired|sleepy|sluggish|dragg\w*|dull|low energy|groggy|foggy|slept late|stayed up late|barely slept|hardly slept)\b/.test(t)) return 4
  if (/\b(buzzing|pumped|full of energy|on fire|hyped|stoked|unstoppable)\b/.test(t)) return 10
  if (/\b(energi[sz]ed|energetic|motivated|sharp|refreshed|recharged|well[- ]rested|slept (well|great))\b/.test(t)) return 8
  return null
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, an: 1, a: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12,
}
const NUM = `(\\d+(?:\\.\\d)?|${Object.keys(NUMBER_WORDS).join('|')})`

/** Sleep hours from phrases like "slept only for 1 hour", "got 7.5h of sleep" or "didn't sleep". */
export function guessSleep(text: string): number | null {
  const t = text.toLowerCase()
  if (/\b(didn'?t sleep|no sleep|couldn'?t sleep at all|pulled an all[- ]nighter)\b/.test(t)) return 0
  const m =
    t.match(new RegExp(`\\bslept(?: (?:for|about|around|only|just|like|maybe|barely|roughly|almost|nearly))* ${NUM}(?: and a half)? ?(?:h|hrs?|hours?)\\b`)) ??
    t.match(new RegExp(`\\b(?:got|had|only|just)?\\s?${NUM} ?(?:h|hrs?|hours?) (?:of )?sleep\\b`))
  if (!m) return null
  const raw = m[1]
  let h = NUMBER_WORDS[raw] ?? Number(raw)
  if (/and a half/.test(m[0])) h += 0.5
  return h >= 0 && h <= 14 ? Math.round(h * 2) / 2 : null
}

const TAG_PATTERNS: [string, RegExp][] = [
  ['exercise', /\b(gym|work ?out|workout|exercis\w*|ran|run|running|jog\w*|yoga|swim\w*|lift\w*|cycling)\b/],
  ['walk', /\b(walk\w*|stroll\w*)\b/],
  ['nature', /\b(hik\w*|park|outdoors?|nature|river|beach|trail|mountains?)\b/],
  ['friends', /\b(friends?|roommates?|hung out|hangout)\b/],
  ['family', /\b(mom|mum|dad|parents?|family|sister|brother|grandma|grandpa)\b/],
  ['cooking', /\b(cook\w*|meal[- ]?prep\w*|baked|recipe)\b/],
  ['phone', /\b(scroll\w*|instagram|tiktok|reels|youtube|doomscroll\w*|phone|social media)\b/],
  ['procrastination', /\b(procrastinat\w*|put (it )?off|avoid\w*|didn't start)\b/],
  ['caffeine', /\b((\d+|two|three|four|five|several|lots of|too much|so much|so many) (cups of )?coffees?|caffeine|energy drinks?|espresso shots?)\b/],
  ['skipped-meal', /\b(skipped (lunch|dinner|breakfast|a meal)|forgot to eat|didn't eat)\b/],
  ['anxiety', /\b(anxious|anxiety|worried|panic\w*|scaries)\b/],
  ['rejection', /\b(reject\w*|turned down)\b/],
  ['interview', /\b(interview\w*)\b/],
  ['job-search', /\b(applications?|applied|job hunt\w*|linkedin|recruiters?|resume|offers?)\b/],
  ['deadline', /\b(deadlines?|due (today|tomorrow|tonight)|last minute)\b/],
  ['productivity', /\b(deep work|productive|focused|got (a lot|so much) done)\b/],
  ['planning', /\b(plann\w*|to-?do list|schedul\w*)\b/],
  ['flow', /\b(in flow|in the zone|lost track of time|hours flew)\b/],
  ['tired', /\b(tired|exhausted|sleepy|drained|no energy)\b/],
  ['comparison', /\b(compar\w*|everyone else|falling behind)\b/],
  ['hackathon', /\b(hackathon)\b/],
  ['work', /\b(class(es)?|lectures?|study\w*|assignments?|homework|exam|midterms?|lab)\b/],
  ['overcommit', /\b(overcommit\w*|said yes to|too many things|spread too thin)\b/],
]

export function guessTags(text: string): string[] {
  const t = text.toLowerCase()
  return TAG_PATTERNS.filter(([, re]) => re.test(t)).map(([tag]) => tag)
}
