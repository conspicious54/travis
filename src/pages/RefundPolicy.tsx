import React, { useEffect } from 'react';
import { HeaderLight } from '../components/HeaderLight';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

/* ───── /refundpolicy ────────────────────────────────────────────
   Standalone refund policy page. Extracted verbatim from the
   Refund Policy sections of /termsofservice so the same terms
   can be linked directly (e.g. from payment pages, support
   emails, or receipts) without sending users to the full ToS.

   Sections included:
     1. Passion Product Refund Policy (Accelerator + Formula course)
     2. Installment Plans Are Not Subscriptions
     3. No Pause or Early Termination After Refund Period
     4. Collection Rights and Enforcement
     5. No Chargebacks or Payment Disputes
     6. Acknowledgment
     Passion Product 365 Guarantee

   If any of these are updated in TermsOfService.tsx, update here
   too to keep both pages in sync.
──────────────────────────────────────────────────────────────────── */

export function RefundPolicy() {
  useEffect(() => {
    document.title = 'Refund Policy - Passion Product';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <HeaderLight />

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Refund Policy</h1>
        <p className="text-gray-500 mb-10">Passion Product LLC</p>

        <p className="text-gray-700 leading-relaxed mb-10 italic">
          This Refund Policy is part of our{' '}
          <a href="/termsofservice" className="text-orange-600 underline">
            Terms of Service
          </a>
          . Please read carefully — by purchasing this product you (herein referred to as
          "Client") agree to the terms stated below.
        </p>

        <Section title="1. Passion Product Refund Policy">
          <P className="font-semibold">
            For purchasers of the Passion Product Accelerator Program (the "Accelerator Program"):
          </P>
          <UL>
            <li>
              You are entitled to a risk-free period beginning on the date of your scheduled
              onboarding call.
            </li>
            <li>
              You may request a full refund within forty-eight (48) hours following your
              onboarding call. Refund requests must be submitted in writing to{' '}
              <a href="mailto:travis@passionproduct.com" className="text-orange-600 underline">
                travis@passionproduct.com
              </a>{' '}
              (or designated support email).
            </li>
            <li>
              If a refund request is not received within forty-eight (48) hours following your
              onboarding call, the purchase becomes final, binding, and non-refundable.
            </li>
            <li>
              Failure to attend your scheduled onboarding call does not extend or delay the
              refund window. The refund period begins on the date the onboarding call is
              scheduled to occur.
            </li>
          </UL>

          <h3 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">
            Additional Terms Based on Payment Method
          </h3>
          <P>
            The following terms apply in addition to the general refund policy above. Where a
            payment-method-specific deadline is earlier than the 48-hour window, the earlier
            deadline controls.
          </P>
          <P>
            <span className="font-semibold">Elective.</span> If you enrolled using Elective as
            your payment method, your refund request must be received by the Company within the
            same calendar week - Monday through Sunday - in which your payment was received. For
            example, if a payment is received on a Tuesday, the refund request must reach us no
            later than the following Sunday. This deadline applies even if your first scheduled
            Program call has not yet occurred.
          </P>
          <P>
            <span className="font-semibold">SFC.</span> If you enrolled using SFC, your enrollment
            is financed through a separate third-party loan between you and SFC. Because issuing
            a refund would require the Company to buy out that loan, all refund requests involving
            SFC financing will be reviewed on a case-by-case basis at the Company's sole
            discretion. Any refund granted may be subject to additional terms required to settle
            the third-party loan.
          </P>

          <h3 className="text-lg md:text-xl font-bold text-gray-900 mt-8 mb-3">
            Passion Product Formula Course
          </h3>
          <P>
            Any Client can get a full refund if asked before 14 days have passed since the
            purchase of the Passion Product Formula. Do this by sending an email to{' '}
            <a href="mailto:travis@passionproduct.com" className="text-orange-600 underline">
              travis@passionproduct.com
            </a>
            .
          </P>
        </Section>

        <Section title="2. Installment Plans Are Not Subscriptions">
          <P>If you elect to pay via:</P>
          <UL>
            <li>An in-house payment plan, or</li>
            <li>
              A third-party financing provider (including but not limited to Whop, Klarna, SplitIt,
              Stripe installment plans, or any similar provider),
            </li>
          </UL>
          <P>you expressly acknowledge and agree that:</P>
          <UL>
            <li>You are entering into a fixed-term installment obligation.</li>
            <li>This is not a month-to-month subscription.</li>
            <li>Payments are part of a binding installment agreement for the full purchase price.</li>
            <li>
              Payments cannot be paused, deferred, reduced, or canceled after the refund period
              expires.
            </li>
            <li>
              Once the forty-eight (48) hour refund window has passed, the full balance of the program is
              contractually owed, regardless of participation level, usage, or completion status.
            </li>
          </UL>
        </Section>

        <Section title="3. No Pause or Early Termination After Refund Period">
          <P>After expiration of the refund window:</P>
          <UL>
            <li>The agreement may not be canceled.</li>
            <li>The payment obligation may not be paused.</li>
            <li>Non-participation does not relieve payment responsibility.</li>
            <li>Voluntary withdrawal from the program does not eliminate or reduce the outstanding balance.</li>
            <li>
              Access to program materials or coaching may be suspended in the event of non-payment,
              but suspension of access does not eliminate the financial obligation.
            </li>
          </UL>
        </Section>

        <Section title="4. Collection Rights and Enforcement">
          <P>
            You agree that failure to complete installment payments after the refund period
            constitutes a breach of contract.
          </P>
          <P>In the event of non-payment, we reserve the right to:</P>
          <UL>
            <li>Charge the payment method on file</li>
            <li>Report delinquency to the applicable payment provider</li>
            <li>Engage third-party collections agencies</li>
            <li>Pursue legal remedies available under applicable law</li>
            <li>
              Recover reasonable collection costs, administrative fees, and legal expenses to the
              fullest extent permitted by law
            </li>
          </UL>
          <P>You acknowledge that unpaid balances may be treated as a debt obligation and enforced accordingly.</P>
        </Section>

        <Section title="5. No Chargebacks or Payment Disputes">
          <P>
            By purchasing the Accelerator Program, you agree not to initiate a chargeback or payment
            dispute after the expiration of the refund window.
          </P>
          <P>
            Initiating a chargeback or dispute after the binding period begins constitutes a
            material breach of this Agreement and may result in:
          </P>
          <UL>
            <li>Immediate removal from the program</li>
            <li>Collection actions</li>
            <li>Recovery of dispute fees and associated administrative costs</li>
          </UL>
        </Section>

        <Section title="6. Acknowledgment">
          <P>By purchasing the Accelerator Program, you acknowledge that:</P>
          <UL>
            <li>You have read and understood these terms.</li>
            <li>You understand the limited refund window.</li>
            <li>You understand that installment plans are binding financial obligations.</li>
            <li>You understand that after the refund period, the agreement is final and enforceable.</li>
          </UL>
        </Section>

        <Section title="Passion Product 365 Guarantee">
          <P>
            We back our program with the Passion Product 365 Guarantee. If you go through all the
            steps of launching your product in accordance with our advice, and after at least one
            (1) year of continuous selling you have not generated back in revenue the amount you
            paid into the program, we will refund the program cost.
          </P>
          <P className="font-semibold">To be eligible for a refund under the 365 Guarantee:</P>
          <UL>
            <li>
              You must have followed each step of the launch process in accordance with the
              guidance provided in the program.
            </li>
            <li>
              You must maintain continuous selling of your launched product for at least one (1)
              year from its launch date.
            </li>
            <li>
              You must be able to demonstrate that, over that period of continuous selling, your
              product has not generated revenue at least equal to the amount you paid into the
              program.
            </li>
          </UL>
          <P>
            You will not be eligible for a refund if you did not attempt to launch or did not
            follow the program's guidance. Refund eligibility is at our discretion. Any refund
            issued will be net of processing fees incurred by Passion Product LLC and returned via
            the original payment method.
          </P>
          <P>
            To request a refund under the 365 Guarantee, email{' '}
            <a href="mailto:travis@passionproduct.com" className="text-orange-600 underline">
              travis@passionproduct.com
            </a>{' '}
            with the subject{' '}
            <span className="font-semibold">Passion Product 365 Guarantee Refund Request</span>
            . Include a description of your launch, documentation showing you followed the
            program's guidance, and a record of the revenue your product has generated.
          </P>
        </Section>

        <p className="text-sm text-gray-500 mt-10">
          For the complete Terms of Service, see the{' '}
          <a href="/termsofservice" className="text-orange-600 underline">
            Terms of Service page
          </a>
          .
        </p>

        <p className="text-center text-gray-400 text-sm mt-16">
          &copy; {new Date().getFullYear()} Passion Product LLC. All Rights Reserved.
        </p>
      </div>
      <LegalDisclaimer />
    </div>
  );
}

/* ───── small typography helpers ─────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">{title}</h2>
      <div className="space-y-4 text-gray-700 leading-relaxed text-[15px] md:text-base">
        {children}
      </div>
    </section>
  );
}

function P({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 space-y-2">{children}</ul>;
}
