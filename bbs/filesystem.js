// =====================================================================
// Virtual filesystem.
// To add a "file": add a key here. Content is a plain string.
// To add a "directory": nest an object. Use { __dir: true, children: {...} }
// =====================================================================

window.VFS = {
  __dir: true,
  children: {
    "about.txt": `\
-- ABOUT ----------------------------------------------------------

  who:       jdub
  what:      tinkerer, generalist, occasional shipper of things
  where:     somewhere with decent coffee and bad weather
  why:       because i can

this is a small corner of the internet for friends. it does not
exist on the public map. you found it because someone told you
where to look, or you went looking, which is its own kind of
credential.

there is no analytics here. there is no tracking. there is no
newsletter. there is barely a server. you are reading a static
file and pretending it is a unix host. so am i.

  -- jdub
`,

    "projects.txt": `\
-- PROJECTS -------------------------------------------------------

  [ active ]
    .  EndPointPilot      a thing i am building. ask me about it.
    .  AgentCrew          another thing, smaller, weirder.

  [ shelved ]
    .  WF2OneDrive       was good. ran out of weekend.
    .  HamRadioFinder    pivoted into a hobby.

  [ wishlist ]
    .  a small synth made entirely of doorbells
    .  a journaling app that yells at you in latin
    .  a homebrew BBS that this page secretly is (I miss 1995)

(computers are overrated.  but I have no other skills)
`,

    "links.txt": `\
-- LINKS ----------------------------------------------------------

  github       .... https://github.com/J-DubApps
  linkedin    ..... https://www.linkedin.com/in/julianwest/
  blog        ..... https://blog.julianwest.me
  bluesky     ..... https://bsky.app/profile/julianwest.me
  rss          .... https://blog.julianwest.me/index.xml
  pgp          .... /keys/jdub.asc

(I should probably put more links here but this isn't going to be seen by more than 5 people)
`,

    "contact.txt": `\
-- CONTACT --------------------------------------------------------

  email        ........  iam [at] julianwest [dot] com
  signal       ........  ask in person
  pgp          ........  see links.txt
  carrier pigeon  .....  accepted, do not love it

if you are reading this, you probably already have a way to reach
me. use that.

if you do not, and you want to: send a friendly note. tell me how
you found this page. that is the password.
`,

    "tips.txt": `\
-- TIPS -----------------------------------------------------------

  1.  type 'help' to see what works.
  2.  'ls' shows files. 'cat <file>' opens them.
  3.  'grep <pattern> <file>' searches inside a file.
  4.  up/down arrow walks command history.
  5.  tab completes file names.
  6.  'clear' wipes the screen. 'reboot' replays the boot show.
  7.  there are a few hidden commands. you will find them.
`,

    ".secrets": `\
you found the dotfile. nice.

try: sudo make me a sandwich
try: fortune
try: matrix
try: theme amber
`,
  },
};
