# piano-practice

A piano practice tracker for an iPad home screen. The player enters the week's practice list from the teacher's note, checks items off on each practice day, and opens a gift box with a sticker after each finished practice. Everything is stored on the device; there are no accounts and nothing is sent anywhere. Built with plain HTML, CSS, and JavaScript, with no build step.

**Live:** not deployed

## Preview locally

From this folder, run:

```bash
python3 -m http.server 8002
```

Then open http://localhost:8002 in a browser. Press `Ctrl+C` in the terminal to stop the server.

To preview on an iPad, connect it to the same Wi-Fi as your Mac and open `http://[your-mac-name].local:8002`.

## Run the tests

```bash
node --test
```
