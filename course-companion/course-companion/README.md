# Course Companion

A Chrome extension (Manifest V3) that makes online video courses easier to get through, without faking the work.

## Features
- Playback speed 0.25x to 3x, skip buttons, keyboard shortcuts (Alt+. / Alt+, / Alt+Left / Alt+Right)
- Resumes videos where you left off
- Progress tracker across any site with an HTML5 video
- Optional: go to the next lesson after a video finishes
- AI study tools (summary, notes, flashcards, practice quiz) from captions or a pasted transcript, using your own Anthropic API key

## Install (development)
1. Clone or download this repo.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Open the extension's **Settings** tab and add your Anthropic API key.

## Privacy
Your API key and progress data are stored locally in your browser (`chrome.storage.local`). Transcript text is sent only to the Anthropic API when you click Generate.

## License
MIT
