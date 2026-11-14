# piano-practice

**Piano Stars**: a piano practice tracker for an iPad home screen. The player enters the week's practice list from the teacher's note, checks items off on each practice day, and opens a gift box with a sticker after each finished practice. Everything is stored on the device; there are no accounts and nothing is sent anywhere. Built with plain HTML, CSS, and JavaScript, with no build step.

**Live:** https://glee-builds.github.io/piano-practice/

## Put it on an iPad

1. Open the live address in Safari on the iPad.
2. Tap the Share button, then "Add to Home Screen".
3. Open the app from its home-screen icon once while on Wi-Fi. After that it works without internet.

Use the home-screen icon every time. The icon and the Safari tab keep separate data, so a checklist made in one does not show in the other.

## Preview locally

From this folder, run:

```bash
python3 -m http.server 8002
```

Then open http://localhost:8002 in a browser. Press `Ctrl+C` in the terminal to stop the server.

To preview on an iPad, connect it to the same Wi-Fi as your Mac and open `http://[your-mac-name].local:8002`.

## Change the icon

The drawing is `assets/icon.svg`. After editing it, remake the three PNG copies on a Mac (nothing to install):

```bash
qlmanage -t -s 512 -o /tmp assets/icon.svg && cp /tmp/icon.svg.png assets/icon-512.png
```

```bash
sips -z 192 192 assets/icon-512.png --out assets/icon-192.png
```

```bash
sips -z 180 180 assets/icon-512.png --out assets/apple-touch-icon.png
```

## Run the tests

```bash
node --test
```
