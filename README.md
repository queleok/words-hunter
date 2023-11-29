# Words Hunter
This is a TS implementation of a simple word game in which a player is ought to compose
as much different words as he can from the given set of letters. The goal of the project
is to help people learning English to practice words memoization and thus to extend the
vocabulary (eventually).

## Rules
- The player is given 16 letters and 2 minutes to compose as many English words as he or
she can;
- Only a-z symbols are allowed in the input;
- The player gets 1 point for the first 3 letters of every word, and 1 more point for every
consecutive letter, so e.g. the word ```set``` gives 1 point, while the word ```scores```
gives 4 points;
- Different forms of the same word (e.g. nouns in singular and plural forms, or verbs in
present and past tenses) are considered as different words;
- The game relies on the free unofficial API for the google dictionaries, which has some
limits on the pace of requests, so when those limits are hit, network errors might occur
preventing the input word from being validated. In such a situation there is an arrow
button that allows the player to repeat the request manually at any time (even after the
timer runs out); should this manual request succeed, the results will be updated
accordingly.

## Contribution
I have some experience with C, C++ & Python, but this is my very first project on JS, and
unfortunately I am also the one coding HTML & CSS for it, so most likely the code is full
of bad practices. If you know how to do things better and are willing to share this sacred
knowledge with me, please don't hesitate to file new issues, open PRs, or just contact me
directly :)
