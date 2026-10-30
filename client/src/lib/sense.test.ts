import { describe, expect, it } from 'vitest'
import { analyseSentiment, guessEnergy, guessSleep, guessTags, mainEmotion } from './sense'

const mood = (t: string) => analyseSentiment(t)!

describe('analyseSentiment', () => {
  it('treats negated positives as negative', () => {
    const s = mood("I'm not feeling fine")
    expect(s.score).toBeLessThan(-0.5)
    expect(s.words[0]).toMatchObject({ word: 'not fine', emotion: 'sadness' })
  })

  it('recognises dull, bored and down-type feelings', () => {
    expect(mood('i feel dull').emotions[0].emotion).toBe('boredom')
    expect(mood('feeling a bit down today').score).toBeLessThan(0)
    expect(analyseSentiment('sat down and calmed down')?.score ?? 0).toBeGreaterThanOrEqual(0)
  })

  it('flags harm to others with a concern and the lowest mood', () => {
    const s = mood('i want to kill someone')
    expect(s.concern).toBe('harm-others')
    expect(s.mood).toBe(1)
    expect(s.emotions[0].emotion).toBe('anger')
  })

  it('flags violent wording about a nearby person as critical anger', () => {
    for (const t of [
      'im feeling killing the person next to me',
      'I feel like punching my roommate',
      'I could strangle that guy',
      'want to hurt someone today',
    ]) {
      const s = mood(t)
      expect(s.concern, t).toBe('harm-others')
      expect(s.severity, t).toBe('critical')
      expect(s.mood, t).toBe(1)
      expect(mainEmotion(s), t).toBe('anger')
    }
  })

  it('does not flag everyday uses of violent verbs', () => {
    expect(mood('killing it at work today, so happy').concern).toBeNull()
    expect(analyseSentiment('just trying to kill time before class')?.concern ?? null).toBeNull()
    expect(analyseSentiment('that joke killed me')?.concern ?? null).toBeNull()
    expect(analyseSentiment('that joke killed me')!.score).toBeGreaterThan(0)
    expect(analyseSentiment('just trying to kill time before class')).toBeNull()
  })

  it('flags self-harm', () => {
    expect(mood("I don't want to be here anymore").concern).toBe('self-harm')
    expect(mood('sometimes I want to die').concern).toBe('self-harm')
  })

  it('does not flag idioms or everyday phrases', () => {
    expect(mood('I killed it in my interview, so proud').concern).toBeNull()
    expect(mood('I killed it in my interview, so proud').score).toBeGreaterThan(0)
    expect(analyseSentiment('hurt my back at the gym')?.concern ?? null).toBeNull()
    expect(analyseSentiment('I could kill for a pizza')?.concern ?? null).toBeNull()
  })

  it('handles intensity, softeners, "not bad" and "but"', () => {
    expect(mood('so happy').words[0].weight).toBeGreaterThan(mood('happy').words[0].weight)
    expect(mood('a bit sad').words[0].weight).toBeGreaterThan(mood('sad').words[0].weight)
    expect(mood('not bad at all').score).toBeGreaterThan(0)
    expect(mood('The morning was good but the evening was awful').score).toBeLessThan(0)
  })

  it('keeps the face and main emotion consistent with mixed-but-negative text', () => {
    const s = mood("I'm not feeling fine. I feel dull and kinda lonely, but I'm grateful for my friends.")
    expect(s.label).toBe('Negative')
    expect(s.mood).toBeLessThanOrEqual(4)
    expect(['sadness', 'boredom', 'loneliness']).toContain(mainEmotion(s))
  })

  it('lowers mood for very little sleep', () => {
    const s = mood('i slept only for 1 hour today, feeling super tired')
    expect(s.words.map((w) => w.word)).toContain('1h sleep')
    expect(s.label).toMatch(/negative/i)
  })
})

describe('everyday feelings vocabulary', () => {
  it.each([
    ['im feeling quite low', 'Negative'],
    ['i slept late', 'Negative'],
    ['im not feeling fine', 'Negative'],
    ['i feeling dull', 'Negative'],
    ['feeling groggy and grumpy', 'Negative'],
    ['homesick and lonely tonight', 'Negative'],
    ['feeling meh and unmotivated', 'Negative'],
    ['im so down today', 'Negative'],
    ['im very happy, excited', 'Very positive'],
    ['stoked and hyped for the weekend', 'Very positive'],
    ['never been happier', 'Positive'],
    ['slept well and woke up refreshed', 'Positive'],
    ['crushed it at the gym', 'Positive'],
  ])('%s → %s', (text, label) => {
    expect(mood(text).label).toBe(label)
  })

  it.each(["i'm off to class", "i'm down to hang later", 'I am pretty sure', 'feel like going down the street'])(
    'stays neutral for "%s"',
    (text) => {
      expect(analyseSentiment(text)).toBeNull()
    },
  )

  it('lets "but" turn a rough day around', () => {
    expect(mood('had a rough day but my friends cheered me up').score).toBeGreaterThan(0)
  })
})

describe('guessSleep and guessEnergy', () => {
  it('reads sleep with filler words and number words', () => {
    expect(guessSleep('i slept only for 1 hour today')).toBe(1)
    expect(guessSleep('slept about six and a half hours')).toBe(6.5)
    expect(guessSleep('got 7h of sleep')).toBe(7)
    expect(guessSleep("didn't sleep at all")).toBe(0)
  })

  it('treats "super tired" as drained', () => {
    expect(guessEnergy('feeling super tired')).toBe(2)
    expect(guessEnergy('a little tired')).toBe(4)
  })

  it('reads energy from sleep quality and excitement', () => {
    expect(guessEnergy('i slept late')).toBe(4)
    expect(guessEnergy('so hyped')).toBe(10)
    expect(guessEnergy('slept well')).toBe(8)
  })
})

describe('guessTags', () => {
  it('does not count one coffee as lots of coffee', () => {
    expect(guessTags('grabbed coffee with a friend')).toEqual(['friends'])
  })
})
