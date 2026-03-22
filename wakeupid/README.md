# ⏰ WakeUpIdiot

> **The alarm app that refuses to let you sleep in.**
> Solve math problems to turn it off. No cheating. No snooze.

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-green?style=for-the-badge)

</div>

---

## 🤔 What Is This?

WakeUpIdiot is a **punishment-based alarm app**. When your alarm rings, you **cannot dismiss it** by just tapping a button.

You must:
1. Wake up properly 🧠
2. Solve **3–10 math questions** (you choose the count)
3. Answer them correctly *before* the alarm stops

If you sit idle for **30 seconds** without answering — the alarm **rings again**. Every. Single. Time.

---

## ✨ Features

### ⏰ Smart Alarm Setting
- **Arrow-based time picker** — tap ▲/▼ to change hours & minutes
- **Long-press** for fast scrolling
- **1–12 AM/PM** format (no military time confusion)
- **Quick preset buttons** — 6 AM, 7 AM, 7:30 AM, 8 AM, etc.

### 🧠 Math Challenge (The Evil Part)
| Difficulty | Type | Example |
|------------|------|---------|
| ⭐ Easy | Simple addition/subtraction | `47 + 28 = ?` |
| ⭐⭐ Medium | Mixed operations | `84 ÷ 4 + 13 = ?` |
| ⭐⭐⭐ Hard | Multiply & divide | `17 × 8 = ?` |
| 💀 Insane | Big multiply / squares | `23² + 144 = ?` |

- Choose **3 to 10 questions** per alarm
- Difficulty **auto-escalates** if you keep getting it wrong
- Get 3 wrong on one question → get a harder one
- Progress tracked with visual dots: `●●○○○`

### ⏱ 30-Second Inactivity Bell
- A **countdown timer** shows on screen
- Last 10 seconds → ⏱ warning appears
- Last 5 seconds → turns red/urgent
- 30s of no input → 🔔 **bell rings again** + red pulsing banner
- Start typing → bell stops, timer resets

### 🔔 13 Built-In Ringtones (No Internet!)
All sounds are **bundled locally**, they work offline:

| Category | Sounds |
|----------|--------|
| 🔊 **Loud** | Classic Alarm, Digital Beep, Urgent Alert, Deep Buzz |
| 🌙 **Gentle** | Soft Tone, Wind Chime, Calm Wave |
| 😂 **Funny** | Mouse Squeak!, Dumb Buzz 😂, Boing! |
| 🔔 **Normal** | Classic Bell, Notify Beep, Simple Tone |

- Preview any ring tone before saving
- Category tab UI for easy browsing

### 🎭 Meme-Style Wake Up
- Choose a meme category for your alarm screen:  
  `Mixed · Dank · Bollywood · Wholesome · Savage`
- Roast messages when you get math wrong

### 🃏 Alarm Card
Each saved alarm shows:
- Time + AM/PM
- Label (optional)
- Difficulty badge with color
- Ringtone name
- Question count (e.g. `5Q`)
- Enable/disable toggle
- Delete button

---

## 📱 Screens

```
index.tsx         → Home — list of saved alarms
create-alarm.tsx  → New alarm — time, settings, ringtone
alarm.tsx         → Alarm ringing screen — meme + dismiss button
challenge.tsx     → Math challenge — solve to silence alarm
```

---

## 🏗️ Project Structure

```
WakeUpIdiot/
├── app/
│   ├── _layout.tsx          # Root layout + alarm polling (every 5s)
│   ├── index.tsx            # Home screen
│   ├── create-alarm.tsx     # Create/edit alarm screen
│   ├── alarm.tsx            # Alarm ringing screen
│   └── challenge.tsx        # Math challenge screen
│
├── src/
│   ├── components/
│   │   ├── AlarmCard.tsx    # Alarm list item card
│   │   ├── WheelPicker.tsx  # Scroll wheel (legacy)
│   │   └── MemeText.tsx     # Meme display component
│   │
│   ├── store/
│   │   └── alarmStore.ts    # Zustand global state + AsyncStorage
│   │
│   └── utils/
│       ├── alarmSound.ts    # Audio playback + 13 ringtone registry
│       ├── mathGenerator.ts # Random math question generator
│       ├── memeGenerator.ts # Meme text/category generator
│       └── alarmScheduler.ts# (Legacy — notifications removed)
│
├── assets/
│   └── sounds/              # 13 bundled WAV ringtone files
│
├── app.json                 # Expo config
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/go) app on your phone

### Install & Run

```bash
# 1. Clone the repo
git clone https://github.com/your-username/wakeupidiot.git
cd wakeupidiot/WakeUpIdiot

# 2. Install dependencies
npm install

# 3. Start the dev server
npx expo start

# 4. Scan the QR code with Expo Go (Android) or Camera (iOS)
```

### Build for Production
```bash
# Android APK
npx expo run:android

# iOS (requires Mac + Xcode)
npx expo run:ios
```

---

## 🔧 Tech Stack

| Library | Purpose |
|---------|---------|
| **Expo SDK 54** | App framework + native APIs |
| **React Native 0.81** | UI framework |
| **Expo Router 6** | File-based navigation |
| **Zustand 5** | Global state management |
| **AsyncStorage** | Alarm persistence |
| **expo-av** | Audio playback for ringtones |
| **expo-haptics** | Vibration feedback |
| **TypeScript 5.9** | Type safety |

---

## 🎮 How It Works

### Alarm Triggering
- No push notifications (removed to avoid permission errors)  
- App polls every **5 seconds** while open
- When `alarm.hour:minute === current time` → navigates to `/alarm`
- Works perfectly when app is in **foreground**

### Math Engine
```
Easy:   single-digit addition/subtraction
Medium: two-step operations with all operators
Hard:   multiplication/division up to 20×20
Insane: squares, large multiplications (up to 50×50)
```

### Inactivity System
```
User opens challenge screen
        ↓
30s countdown starts
        ↓
No input for 30s → ALARM RINGS AGAIN 🔔
        ↓
User types anything → Bell stops, timer resets
        ↓
Repeat until all N questions solved
        ↓
🎉 "Alarm OFF!" + navigate home
```

---

## 📦 Sound Files

All 13 ringtones are **programmatically generated WAV files** bundled with the app.  
They are pure sine-wave tones at different frequencies — no internet needed, no copyright issues.

```
assets/sounds/
├── alarm_classic.wav   (880 Hz, 2.0s)
├── alarm_digital.wav   (1200 Hz, 1.5s)
├── alarm_urgent.wav    (1500 Hz, 1.0s)
├── alarm_deep.wav      (130 Hz, 2.5s)
├── gentle_soft.wav     (330 Hz, 3.0s)
├── gentle_chime.wav    (523 Hz, 2.5s)
├── gentle_wave.wav     (261 Hz, 3.5s)
├── funny_squeak.wav    (1760 Hz, 0.6s)
├── funny_low.wav       (55 Hz, 1.5s)
├── funny_bounce.wav    (880 Hz, 0.4s)
├── normal_bell.wav     (440 Hz, 2.0s)
├── normal_notify.wav   (660 Hz, 1.0s)
└── normal_tone.wav     (550 Hz, 1.5s)
```

---

## ⚠️ Known Limitations

| Issue | Reason | Workaround |
|-------|--------|------------|
| Alarm only rings when app is open | No background notifications | Keep app open / foreground |
| expo-av deprecation warning | Will be replaced in SDK 54+ | Migrate to `expo-audio` in next version |
| WAV sounds are simple sine waves | Generated locally for reliability | Will replace with real recordings later |

---

## 🗓️ Changelog

### v1.0.0 (March 2026)
- ✅ Arrow-based time picker (▲/▼ with long-press fast-change)
- ✅ 13 locally bundled ringtones (4 categories)
- ✅ Math challenge with 3–10 configurable questions
- ✅ 30-second inactivity re-ring system
- ✅ Difficulty escalation system
- ✅ Meme style selector
- ✅ Zustand + AsyncStorage persistence
- ✅ Zero TypeScript errors
- ✅ Removed notification dependency (no more permission errors)

---

## 🙏 Made By

**Deepanshu** — because he couldn't wake up on time and needed to suffer for it.

> *"The best alarm app is one that makes you angry enough to stay awake."*

---

<div align="center">

**If this app helped you wake up — give it a ⭐**  
**If it didn't — you need a stronger version of yourself, not a different app.**

</div>
