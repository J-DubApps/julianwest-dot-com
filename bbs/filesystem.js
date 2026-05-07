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
    .  ----------         a thing i am building. ask me about it.
    .  ----------         another thing, smaller, weirder.

  [ shelved ]
    .  ----------         was good. ran out of weekend.
    .  ----------         pivoted into a hobby.

  [ wishlist ]
    .  a small synth made entirely of doorbells
    .  a journaling app that yells at you in latin
    .  a homebrew BBS that this page secretly is

(fill in the dashes when you are ready. or do not. the page works
either way.)
`,

    "links.txt": `\
-- LINKS ----------------------------------------------------------

  github       ............ https://github.com/your-handle
  mastodon     ............ https://mastodon.social/@your-handle
  rss          ............ /feed.xml
  pgp          ............ /keys/jdub.asc

  the long-form blog ...... https://your-blog.example
  the short-form posts .... https://your-microblog.example
  the photo dump .......... https://your-photos.example

(replace these with the real ones. they are stored as plain text
in this file. that is the whole CMS.)
`,

    "contact.txt": `\
-- CONTACT --------------------------------------------------------

  email        ........  you [at] yourdomain [dot] com
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
