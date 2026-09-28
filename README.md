# Course Companion

A Chrome extension (Manifest V3) that helps you get through online video courses faster and remember more of them. It works on any site with an HTML5 video player, including Coursera, Udemy, edX, and YouTube.

It speeds up and organizes your learning. It does not skip lessons, fake watch time, or answer graded work for you.

## Features

- **Speed control:** 0.25x to 3x playback, with preset buttons
- **Skip buttons:** jump back or forward by a set number of seconds
- **Keyboard shortcuts:** control the video without leaving the page
- **Resume:** picks up where you left off, based on your real watch position
- **Progress tracker:** see every video you've watched and how far you got
- **Next lesson (optional):** after a video finishes, clicks the site's "Next" button
- **AI study tools:** turn captions or a pasted transcript into a summary, study notes, flashcards, or a practice quiz

## Install (development)

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.
5. Pin the extension, open it, and go to **Settings**.
6. Paste your Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com)) and click **Save settings**.

## Usage

**Player tab:** open a page with a video, then use the speed and skip buttons.

**Study tab:**
1. Turn captions on in the video player.
2. Click **Grab captions**, or paste a transcript manually.
3. Choose Summary, Study notes, Flashcards, or Practice quiz.
4. Click **Generate**.

**Progress tab:** lists your recent videos with a progress bar. Click a title to reopen it.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| Alt + . | Faster (+0.25x) |
| Alt + , | Slower (-0.25x) |
| Alt + Right arrow | Skip forward |
| Alt + Left arrow | Skip back |

## Privacy

- Your API key, settings, and progress are stored locally in your browser with `chrome.storage.local`.
- Transcript text is sent to the Anthropic API only when you click **Generate**.
- The extension has no server, analytics, or tracking.

## Limitations

- Some platforms don't expose captions to the page. In that case, paste the transcript manually.
- The next-lesson button looks for buttons labeled "Next" or "Continue", so it may not work on every site.
- Videos inside some embedded players may track progress under the player's own URL.

## Project structure

```
manifest.json     Extension configuration
content.js        Runs on pages: finds the video, controls, resume, progress
background.js     Calls the Anthropic API for study tools
popup.html/css/js Extension popup UI
icons/            Extension icons
```

## Roadmap

- Side panel view
- Export notes and flashcards
- Per-platform improvements

## Responsible use

This tool is meant to support learning. Please follow the terms of service and academic integrity rules of the platforms and courses you use.

## License

MIT
