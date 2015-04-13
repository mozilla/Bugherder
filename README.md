Bugherder is a tool for marking bugs post-merge.

NOTES ON TESTING
----------------
Adding "?debug=1" shows how all changesets were identified, and shows what changesets Bugherder decided were affected by a backout.

Adding "?remap=1" allows you to divert output to the bzapi sandbox bugzilla at [landfill.bugzilla.org](https://://landfill.bugzilla.org/bzapi_sandbox/).
If you use this option, you will be presented with a table of all the bugs associated with changesets. You can then enter a bug number from bzapi that output will be sent to. You don't need to enter a new bug number for every single bug shown, but only those you do enter will be transmitted, other bugs will be ignored.

Bugherder will not check the existence of any bugs you enter - be careful! Each bug number entered must be unique - that **will** be checked, as apparently I can't follow my own instructions. You will probably want to review the pushlog - if the push for the only bug you entered was backed out, then nothing will be sent.

When testing target milestone setting, the equivalent bug in landfill must be filed in the *mcMerge Test Product* product, or the submission will fail.

There are various checkbox options at the bottom of the screen:
* an option to add [inbound] to some random bug whiteboards, to allow you to test it's removal on submission
* an option to add checkin-needed to some random bug whiteboards, to allow you to test it's removal on submission. Be careful of bugs with additional keywords - if they are not defined on landfill (and they probably won't be), the submission will fail
* an option to throw up an alert - hacky, I know - partway through the submission process, to allow you to jump over to the landfill bug, and mid-air Bugherder
* a useful option to ignore the real bug status, and set it to NEW, as you will likely be working with historic pushlogs when testing

If you do not enter any diversion bugs on the remap page, you will return to live mode, with changes going to [bugzilla.mozilla.org](https://bugzilla.mozilla.org/).


STANDING ON THE SHOULDERS OF GIANTS
-----------------------------------
Bugherder uses the following third-party projects:

* bz.js by Heather Arthur - [https://github.com/harthur/bz.js](https://github.com/harthur/bz.js)
* jQuery - [http://jquery.com/](http://jquery.com)
* Toast CSS framework by Dan Eden - [http://www.daneden.me/toast](http://www.daneden.me/toast)
