# Words Hunter
This is a TS implementation of a simple word game in which a player is supposed
to compose as many different words as he can from the given set of letters. The
goal of the project is to help people learning languages to practice words
memoization and thus to extend the lexicon (eventually).

## Rules
- The player is given 16 letters and 2 minutes to compose as many words in the
  chosen language as he or she can;
- Only symbols representing letters from respective alphabet are allowed in the
  input;
- The player gets a base of 1 point for the first three letters, plus one
  additional point for each subsequent letter (e.g., 'set' is 3 points total;
  'scores' is 6 points).
- Different forms of the same word (e.g. nouns in singular and plural forms, or
  verbs in present and past tenses) are considered different words;
- The game relies on external APIs for word validation, which may have some
  limits on the pace of requests. When those limits are hit, network errors
  might occur preventing the input word from being validated. In such a
  situation the word is formatted accordingly and, after the time runs out, a
  disclaimer with a button appears. Hitting the button triggers another attempt
  to validate all the previously failed words. In case of successful
  re-validation the results are updated accordingly;
- Validation backend and language can be chosen in the settings panel.

## Contribution
This is my very first project in TS, and unfortunately I am also the one coding
HTML & CSS for it, so most likely the code is full of bad practices. If you
know how to do things better and are willing to share this sacred knowledge
with me, please don't hesitate to file new issues, open PRs, or just contact me
directly.
