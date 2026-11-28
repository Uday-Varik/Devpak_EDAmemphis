# DevPack FAQ and Troubleshooting

**Status:** Draft. Needs owner review. Troubleshooting steps reflect the app as of branch `docs/phase2-documentation`; re-check after UI changes.

---

## Account and sign-in

**Do I need to verify my email?**
Yes. After sign-up, DevPack says "Please check your email to verify your account." Open the link in that email. If you do not see it, check spam.

**I forgot my password. What do I do?**
1. On the sign-in form, choose forgot-password and enter your email.
2. Select **Send Reset Link**. DevPack always shows "Check your email," even if the address has no account.
3. Open the link in the email. It opens **Set a new password**.
4. Enter a password of at least 6 characters, confirm it, and submit. You are signed in with the new password.

If the reset link does not arrive, wait a few minutes, check spam, and try once more. If it still fails, contact the owner.

**The reset page says "Password too short" or "Passwords don't match."**
The password must be at least 6 characters, and both fields must be identical.

**Why was I sent back to the home page?**
DevPack returns you to the home page when you are not signed in. Sign in again.

**I see "Couldn't load your profile" or "Couldn't load your projects" on the Dashboard.**
Refresh the page. If it keeps happening, sign out and sign back in. If that fails, see "Something is broken" below.

---

## Developer profile

**Why does DevPack keep sending me to onboarding?**
The Dashboard needs a developer profile. Finish the four onboarding steps. Step 1 requires your full name and email.

**The pre-export review says "Developer name is missing."**
Open **Profile** and enter your full name. The export checks the developer profile, not the project.

---

## Projects and the builder

**I opened a project and got "We couldn't open that project."**
The project may have been deleted, or it belongs to another account. Go back to the Dashboard and open it from your list.

**Can I undo deleting a project?**
No. Deleting a project from the Dashboard permanently removes it. Export your package before deleting a project you may need.

**How do I hide the Learning Guide?**
Use the close button on the panel. To hide it for all sections and turn off the section intro pop-ups, turn off **Teaching Mode** on the **Profile** page. Field tooltips stay on.

**The Learning Guide disappeared. How do I bring it back?**
If you closed it, use the **Tips** tab on the right edge (wide screens). If Teaching Mode is off, turn it back on in **Profile**.

**How do I see my progress?**
The bar at the top of the builder shows the package percentage. It counts 9 sections. Executive Summary is the review step and is not counted.

---

## Autosave

**How does autosave work?**
- DevPack waits **1.5 seconds** after your last change, then saves the section.
- While it saves, the indicator reads **Saving...**. When it finishes, it reads **Saved at** followed by the time.
- If you leave the page with unsaved changes, the browser asks you to confirm. DevPack also tries to save in the background when you leave a section or close the tab.
- Some sections, such as Executive Summary, also have a **Save Draft** button that saves on demand.

**What does "Save failed. Try again." mean?**
The last save did not reach the server. Your entries are still on the screen, but they are not stored yet. Check your internet connection and wait for the indicator to show **Saved at** again. If it keeps failing, copy any long text somewhere safe, refresh the page, and check the entries.

**I closed the tab right after typing. Is my data lost?**
DevPack tries to send the last change when the page closes. If the browser warned you about unsaved changes, reopen the project and check the last section you edited. Re-enter anything that is missing.

**Does autosave mark a section complete?**
No. Autosave saves what you entered. Only **Mark Complete** sets a section as complete. Marking complete also moves you to the next section.

---

## Numbers and the "Cash not invested" display

**What does "Cash not invested" mean?**
It means no developer cash is entered in the Budget section (**Developer Equity**). ROI and cash-on-cash need a cash figure to divide by, so DevPack shows the words **Cash not invested** instead of a percentage. It is a display, not an error.

**How do I fix it?**
If you are putting your own cash into the deal, enter that amount in **Budget & Sources/Uses**, in the Developer Equity field. In the Executive Summary and Feasibility views, the note **Enter your cash in Budget** links to that field.

**Should I leave it blank if I have no cash in the deal?**
Yes, if you truly have no developer cash in the deal. ROI and cash-on-cash are then not shown, and other figures still calculate. The note is based on cash only, so it still appears if you have land equity but no cash.

**Why is my ROI different from my spreadsheet?**
DevPack uses the inputs in your package. Check the purchase or land value, closing and title costs, construction costs, sales costs, and the hold period. Net profit, ROI, and profit margin use net of grants. Other metrics use gross total development cost.

**Why does the pre-export review say there is a funding gap?**
Uses are larger than sources. Add a funding source (cash, loan, grant, subsidy) or reduce uses. If you chose **Internal Planning** as the package purpose, the funding gap is not flagged as critical.

---

## Square footage fields

- **Square Footage: Existing** is the existing building's square footage (for renovations or additions).
- **Total Square Footage (all units)** is the total for the whole project, across all units. It is not the size of one unit.

Example: a 4-unit project with 1,200 SF per unit has a total of **4,800**.

Per-square-foot cost estimates multiply the cost per square foot by this total. If the total is wrong, every per-SF budget figure is wrong too.

---

## Exports

**The export button is grayed out.**
It is disabled only while an export is running. Wait for the current export to finish.

**The pre-export review shows issues. Can I still export?**
Yes. The review is advisory. The button then reads **Export Anyway**. Fix critical items first where you can, because a lender will see them.

**An export failed and I see "Export failed."**
Try again. Make sure you have a working connection. If it fails again, check the Executive Summary numbers and the developer profile, then contact the owner.

**Why does a PDF page or Excel sheet look different from the screen?**
The export is generated from the saved project data. Save the section first, then export again. If a value on screen is not what you expect, check the section it comes from.

---

## AI-generated text

**Can DevPack write my project narrative for me?**
DevPack can generate draft text for some fields (the AI button). Review and edit all AI text before you use it. DevPack will not add market statistics you did not provide. Placeholders such as `[MISSING: …]` mark where information is still needed.

**The AI button says "Rate limit exceeded."**
You can make up to 10 AI requests per minute. Wait a minute and try again.

---

## Something is broken

1. Refresh the page. Check that your last change shows **Saved at**.
2. Check your internet connection.
3. Sign out and sign back in.
4. Note what you were doing, the section name, and the exact message on the screen.
5. Contact the owner of your DevPack account. *(Owner: add the support contact here.)*

Do not share your password with anyone, including support.
