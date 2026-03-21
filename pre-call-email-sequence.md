# Pre-Call Email Drip Sequence (6 Emails)

**Platform:** ActiveCampaign
**Trigger:** Call booked (Calendly webhook → ActiveCampaign)
**Goal:** Maximize show rate by driving prospects back to /training, handling objections, and building excitement.

---

## Email 1: Immediately After Booking

**Subject:** You're in — here's how to prepare
**Preview text:** Watch this 2-min video before your call

---

Hey {{first_name}},

Your Amazon strategy call is booked. Nice work — most people think about this for months and never take action. You just did.

**Here's one thing I want you to do before your call:**

Go to your confirmation page and watch the short video at the top. It's 2 minutes and it'll tell you exactly what to expect so there are no surprises.

**[Watch the video + prep for your call →](https://travisfba.com/training)**

While you're there, you'll also find a resource page with free tools and calculators our students use. Feel free to explore — think of it as a head start.

Talk soon,
Travis

P.S. — Add your call to your calendar now so you don't forget. There's a button on the page.

---

## Email 2: 24 Hours After Booking

**Subject:** She started exactly where you are
**Preview text:** Julianna had zero experience. Here's what happened.

---

Hey {{first_name}},

I wanted to share something with you before your call.

When Julianna first reached out to us, she had no Amazon experience, no product idea, and wasn't sure she could actually do this. Sound familiar?

Fast forward — she's now done over $112K in Amazon sales.

She didn't have some unfair advantage. She didn't have a business degree. She just showed up to her call, got a plan, and followed the steps.

**I put together a short video on the confirmation page that addresses the #1 concern people have: "I don't know if I'm ready yet."**

**[Watch it here →](https://travisfba.com/training)**

Spoiler: you don't need to be ready. That's what the call is for.

Talk soon,
Travis

---

## Email 3: 48 Hours After Booking

**Subject:** Is Amazon FBA still worth it in 2025?
**Preview text:** The numbers might surprise you

---

Hey {{first_name}},

I get this question a lot: "Is it too late to start on Amazon?"

Here's the short answer: Amazon is a $600B+ marketplace that grew again last year. There are more customers buying online now than ever before.

The people who struggle on Amazon aren't late — they're using the wrong strategy. They're picking random products, competing on price, and wondering why it doesn't work.

The Passion Product method is different. We help you find underserved niches where you can build a real brand — not just another commodity listing that gets buried on page 5.

**I put together a resource section on your confirmation page with free tools you can start exploring right now** — product research calculators, our scorecard tool, and a beginner checklist.

**[Check out the tools our students use →](https://travisfba.com/training)**

No homework required. Just explore at your own pace and come to your call with whatever questions come up.

See you soon,
Travis

---

## Email 4: 24 Hours Before Call

**Subject:** What makes us different (and why it matters for your call)
**Preview text:** This isn't arbitrage or dropshipping

---

Hey {{first_name}},

Your call is tomorrow. Quick thought before we talk:

If you've looked into Amazon FBA before — maybe tried another course, watched some YouTube videos, or talked to someone who tried it — you might be wondering how Passion Product is different.

Three things:

1. **We start with passion.** Not "what's trending on AliExpress." We help you find a product you actually care about and build a brand around it. That's why our students' businesses last.

2. **You get real mentorship.** Not just pre-recorded videos and a Facebook group. 1-on-1 coaching with people who've actually built Amazon businesses.

3. **Our results are verifiable.** Mina — $1.83M. Troy — $521K. Darryl — $348K. These aren't anonymous screenshots. These are real people you can watch tell their stories.

**There's a video on your confirmation page that breaks this down in detail:**

**[Watch it here →](https://travisfba.com/training)**

Your call advisor will walk you through exactly how the program works and whether it's a fit for your situation. No pressure either way.

See you tomorrow,
Travis

---

## Email 5: Morning of Call

**Subject:** Your call is today
**Preview text:** Here's everything you need

---

Hey {{first_name}},

Quick reminder — your Amazon strategy call is today.

**Here's what to have ready:**

- A quiet place where you can talk for 30–45 minutes
- Any questions about Amazon FBA or the Passion Product program
- An open mind — we're going to map out a realistic plan for YOUR situation

**Your call join link is in your original confirmation email from Calendly.** If you can't find it, check your spam folder or reply to this email and we'll get you sorted.

This is a personalized planning session, not a presentation. Come as you are.

Talk soon,
Travis

---

## Email 6: 1 Hour Before Call

**Subject:** We're ready for you, {{first_name}}
**Preview text:** Your advisor is prepped — see you in 60 min

---

Hey {{first_name}},

Just a heads up — your strategy call is in about an hour.

Your advisor has reviewed your information and is prepped to help you build a plan based on your goals, your budget, and your timeline.

**Quick checklist:**
- Find your Calendly join link (check your confirmation email)
- Have your questions ready
- Show up and be honest about where you are — that's all we ask

People who show up to this call prepared are the ones who walk away with a real, actionable plan. You've already done the hard part by booking. Now just show up.

See you in an hour,
Travis & the Passion Product Team

---

## ACTIVECAMPAIGN SETUP NOTES

**Automation trigger:** Calendly "invitee created" webhook → tag contact with "call-booked"

**Timing logic:**
| Email | Delay | Condition |
|-------|-------|-----------|
| 1 | Immediate | On tag "call-booked" |
| 2 | +24 hours | If call is > 24 hours away |
| 3 | +48 hours | If call is > 48 hours away |
| 4 | 24 hours before call | Based on Calendly event time |
| 5 | Morning of call (9am local) | Based on Calendly event time |
| 6 | 1 hour before call | Based on Calendly event time |

**If call is < 24 hours from booking:** Skip emails 2 & 3, send only 1 → 4 → 5 → 6

**Exit conditions:**
- Contact cancels call → exit automation, trigger re-engagement sequence
- Contact no-shows → exit automation, trigger no-show follow-up
- Contact attends call → exit automation, tag "call-completed"

**Personalization fields needed:**
- `{{first_name}}` — from Calendly booking form
- Call date/time — from Calendly event data

**Design notes:**
- Plain text style (no heavy HTML templates). Personal feel, like an email from a friend.
- Single CTA per email (always links back to /training page)
- Mobile-optimized (short paragraphs, big tap targets for links)
- Sender: Travis Marziani / travis@passionproduct.com
