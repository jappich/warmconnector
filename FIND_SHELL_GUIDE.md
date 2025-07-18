# 🔍 How to Find the Shell Tab in Replit

## Location of Shell Tab

The Shell tab is located in the **bottom panel** of your Replit interface:

### Visual Guide:
```
┌─────────────────────────────────────────┐
│  File Explorer  │  Code Editor          │
│                 │                       │
│                 │                       │
├─────────────────┼───────────────────────┤
│ Console  │ Shell  │ Tests  │ Secrets    │  ← Bottom Panel
└─────────────────────────────────────────┘
```

## Step-by-Step Instructions:

1. **Look at the bottom of your screen** in Replit
2. You should see tabs like: `Console`, `Shell`, `Tests`, `Secrets`
3. **Click on the "Shell" tab**
4. A command prompt will appear where you can type Git commands

## Alternative Ways to Access Shell:

### Option 1: If bottom panel is collapsed
- Look for a small upward arrow `^` at the very bottom of the screen
- Click it to expand the bottom panel

### Option 2: Using keyboard shortcut
- Press `Ctrl + Shift + S` (or `Cmd + Shift + S` on Mac)

### Option 3: From the top menu
- Click the three dots menu `...` in the top bar
- Look for "Shell" or "Terminal" option

## What the Shell Looks Like:

When you open Shell, you'll see something like:
```bash
~/workspace$ 
```

This is where you'll type the Git commands to push to GitHub.

## Commands to Run in Shell:

Once you find the Shell tab, copy and paste these commands one by one:

```bash
git remote add origin https://github.com/jappich/warmconnector.git
git branch -M main
git add .
git commit -m "Complete WarmConnector platform"
git push -u origin main
```

---

**Can't find it?** The Shell tab should be visible at the bottom of your Replit interface alongside other tabs like Console and Tests.