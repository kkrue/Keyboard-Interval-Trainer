# Keyboard-Interval-Trainer

## Purpose
This software is useful for practicing notes and intervals on a MIDI keyboard.

I started this project when I wanted my son to practice reading music, but I found that there were no good programs for practicing intervals on a MIDI music keyboard.  I found note trainers, but they taught recognition of individual notes, which isn't too helpful.

Thus I started this project and have been at it for some time.  The program is much more comprehensive than other others I've seen.  You can practice individual notes, intervals, chords, chord inversions, bass and treble clef, all the key signatures, and you can customize the system to produce notes over a range and set characteristics of the intervals (number of notes and spread).  It's not completely finished, so check back for updates.

I'm mostly a backend developer, so the JavaScript code isn't too elegant.  It doesn't use a fancy framework, I don't have a lot of tests, and it doesn't use webpack.  It does work pretty well, however, and is reasonably clean.

It's pretty easy to intall and run: install node.js, copy a certificate into your local store (this is not strictly speaking required, but it keeps the browser from nagging), and run.  Node.js serves the webpage, and all the magic is done in the browser.  Unfortunately a constraint of the browser's MIDI interface is that the page must be served via HTTPS, so I use Node for that.

## THE DETAILS

You may freely distribute this work and modify it, but you can't profit from it directly. I'm not looking to make any money, so if you want to use it in your music school or with students, you may use this version freely.  I just do not want someone taking this code, putting it up on a website and charging for it or even asking for donations...unless I do it. :)  I always intend for the code to be completely free. Read LICENSE for the legalese.

## TO USE:

1. Install node.js on your computer (https://nodejs.org/) and ensure it's in your PATH.
2. From a command prompt, inside the directory in which you installed the software, type: npm install
3. You should install the included certificate localhost.crt in your certificate store so that the browser won't complain about an invalid certificate (see below).
4. Plug in your MIDI keyboard to the computer and turn it on.
5. From the command prompt you already opened, type: node index.js
6. You must use a browser that fully supports MIDI.  Firefox doesn't.  Chrome and Edge do.  Others?  Try your luck.  Point your browser to https://localhost:5000.
7. Enjoy.  The next time you run it, all you need to do is execute node index.js.

## KNOWN ISSUES

First of all, I publish fixes now and then.  Download the trunk if you want the very latest fixes.

- Notes played out of range don't show.
- Due to their large span of chords, set the upper bound lower than the maximum, or the chord will be clipped.
- Chords are a little tricky, and it helps if you know a little music theory to constrain the chords that can appear.  For example, it would be really strange to have a C major appear in the key signature of C# major, but the software does allow it.  The solution is to use the "Allowed notes for root" option.  There is an option to restrict to diatonic notes, but that doesn't work for chords yet.
- "Allowed notes for root" doesn't show the notes unless you open the popup, which is confusing.
- Tests are broken.  I made so many changes and didn't get around to fixing the tests.

INSTALLING THE CERTIFICATE ON WINDOWS 11:

Other OSes have a means of doing this.  Consult your favorite AI tool to see how to do it.
1. Start button, type "cert" in the search and pick Manage Computer Certificates.
2. Choose Trusted Root Certification Authorities
3. Right click on Certificates, then All Tasks->Import...
4. Next
5. Choose localhost.crt in the application's directory and hit Next.
6. Hit Next again to place the certificate.
7. Hit Finish, then OK.
8. Close the Certificates window.

If you want to create your own certificate, for some reason, you can install openssl and run this to make a 10-year cert. I tested it on Linux.

openssl req -x509 -out localhost.crt -keyout localhost.key -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -extensions EXT -config <(printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth") -days 3650

This software will also run on a webserver if you want one installation with multiple clients.
