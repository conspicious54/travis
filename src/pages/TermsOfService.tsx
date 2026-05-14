import React, { useEffect } from 'react';
import { HeaderLight } from '../components/HeaderLight';

/* ───── /termsofservice ───────────────────────────────────────────
   Standalone full Terms of Service page. Separate from /terms,
   which covers SMS specifically.
──────────────────────────────────────────────────────────────────── */

export function TermsOfService() {
  useEffect(() => {
    document.title = 'Terms of Service — Passion Product';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <HeaderLight />

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Terms of Service</h1>
        <p className="text-gray-500 mb-10">Terms of Participation</p>

        <p className="text-gray-700 leading-relaxed mb-10 italic">
          Please read carefully: by purchasing this product you (herein referred to as "Client")
          agree to the following terms stated herein.
        </p>

        <Section title="1. Passion Product Refund Policy">
          <P>
            Any Client can get a full refund if asked before 14 days have passed since the
            purchase of the Passion Product Formula. Do this by sending an email to:{' '}
            <a href="mailto:Travis@passionproduct.com" className="text-orange-600 underline">
              Travis@passionproduct.com
            </a>
            .
          </P>
          <P className="font-semibold">
            For purchasers of the Passion Product Accelerator Program (the "Accelerator Program"):
          </P>
          <UL>
            <li>
              You are entitled to a risk-free period beginning on the date of your first scheduled
              coaching call.
            </li>
            <li>
              You may request a full refund within seven (7) calendar days following your first
              coaching call. Refund requests must be submitted in writing to{' '}
              <a href="mailto:travis@passionproduct.com" className="text-orange-600 underline">
                travis@passionproduct.com
              </a>{' '}
              (or designated support email).
            </li>
            <li>
              If a refund request is not received within seven (7) calendar days following your
              first coaching call, the purchase becomes final, binding, and non-refundable.
            </li>
            <li>
              Failure to attend your scheduled first call does not extend or delay the refund
              window. The refund period begins on the date the first call is scheduled to occur.
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
            same calendar week — Monday through Sunday — in which your payment was received. For
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
              Once the seven (7) day refund window has passed, the full balance of the program is
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

        <Section title="Passion Product Formula Course Completion Refund Policy">
          <P>
            By purchasing the Passion Product Formula Course ($1997), you will be eligible for a
            refund as long as you have taken action, put in full effort, and actually launched a
            product and tried to reach success, being able to prove that this product hasn't
            generated $1997 in profit during the first year since launching the product.
          </P>
          <P>You will not receive a refund if you did not even attempt to take any action.</P>
          <P>
            Refund eligibility is entirely at our discretion, but since we have our students' best
            interests in mind, and we completely stand by our programs, we want YOU to succeed, and
            we stand by our Zero Risk Guarantee which offers a refund of the course.
          </P>
          <P>
            Please note that the amount refunded back to you will be net of any processing fees
            that Passion Product LLC incurs, and can only be refunded back via the original
            payment method (i.e. original credit card).
          </P>
          <P className="font-semibold">To be eligible for a refund:</P>
          <UL>
            <li>You must have viewed 100% of the course lessons</li>
            <li>You must have launched a product on Amazon FBA</li>
            <li>
              You must have been active in the student Facebook community, and have a solid history
              of interaction and asking questions.
            </li>
            <li>You must have completed all the "Take Action" activities on all modules and be able to prove it</li>
            <li>You must prove that your product has not generated at least $1997 since its launch</li>
            <li>One full year must have passed since launching the product</li>
          </UL>
          <P>
            To get a refund, you can submit your request to{' '}
            <a href="mailto:travis@effectiveecommerce.com" className="text-orange-600 underline">
              travis@effectiveecommerce.com
            </a>{' '}
            with the following subject:{' '}
            <span className="font-semibold">Passion Product Formula Refund Request</span>
          </P>
          <P>
            In your request, please describe your situation, experience with the program, and
            attach proof that you have actually put in effort into the course and launched a
            product on Amazon or Shopify.
          </P>
        </Section>

        <Section title="General">
          <P>
            These Terms of Service apply to every website operated by Passion Product LLC
            (collectively, the "Site"; Passion Product LLC, "we," "our," or "us"), including but
            not limited to travisfba.com, travismarziani.com, start.travismarziani.com,
            passionproductformula.com, and any other domain we own or operate from time to time. By
            using the Site, you agree to be bound by these Terms of Service and to use the Site in
            accordance with these Terms of Service, our Privacy Policy and any additional terms
            and conditions that may apply to specific sections of the Site or to products and
            services available through the Site or from Passion Product LLC. Accessing the Site,
            in any manner, whether automated or otherwise, constitutes use of the Site and your
            agreement to be bound by these Terms of Service.
          </P>
          <P>
            We reserve the right to change these Terms of Service or to impose new conditions on
            use of the Site, from time to time, in which case we will post the revised Terms of
            Service on this website. By continuing to use the Site after we post any such changes,
            you accept the Terms of Service, as modified.
          </P>
        </Section>

        <Section title="Our Payment Processors">
          <P>
            We accept payments via Credit Card (VISA, Mastercard, American Express, Discover),
            Apple Pay, Paypal, and Klarna. Other payment methods may not be accepted.
          </P>
        </Section>

        <Section title="Our Limited License to You">
          <P>
            This Site and all the materials available on the Site are the property of us and/or our
            affiliates or licensors, and are protected by copyright, trademark, and other
            intellectual property laws. The Site is provided solely for your personal non-commercial
            use. You may not use the Site or the materials available on the Site in a manner that
            constitutes an infringement of our rights or that has not been authorized by us. More
            specifically, unless explicitly authorized in these Terms of Service or by the owner of
            the materials, you may not modify, copy, reproduce, republish, upload, post, transmit,
            translate, sell, create derivative works, exploit, or distribute in any manner or
            medium (including by email or other electronic means) any material from the Site. If
            you enroll in the training, you may from time to time, download and/or print one copy
            of individual pages of the Site for your personal, non-commercial use, provided that
            you keep intact all copyright and other proprietary notices.
          </P>
        </Section>

        <Section title="Your License to Us">
          <P>
            By posting or submitting any material (including, without limitation, comments, blog
            entries, Facebook posts, photos and videos, testimonials in video, audio, photo or text
            format) to us via the Site, internet groups, social media venues, or to any of our
            staff via email, text or otherwise, you are representing: (i) that you are the owner of
            the material, or are making your posting or submission with the express consent of the
            owner of the material; and (ii) that you are thirteen years of age or older. In
            addition, when you submit, email, text or deliver or post any material, you are
            granting us, and anyone authorized by us, a royalty-free, perpetual, irrevocable,
            non-exclusive, unrestricted, worldwide license to use, copy, modify, transmit, sell,
            exploit, create derivative works from, distribute, and/or publicly perform or display
            such material, in whole or in part, in any manner or medium, now known or hereafter
            developed, for any purpose. The foregoing grant shall include the right to exploit any
            proprietary rights in such posting or submission, including, but not limited to, rights
            under copyright, trademark, service mark or patent laws under any relevant
            jurisdiction. Also, in connection with the exercise of such rights, you grant us, and
            anyone authorized by us, the right to identify you as the author of any of your
            postings or submissions by name, email address or screen name, as we deem appropriate.
          </P>
          <P>
            You acknowledge and agree that any contributions originally created by you for us shall
            be deemed a "work made for hire" when the work performed is within the scope of the
            definition of a work made for hire in Section 101 of the United States Copyright Law,
            as amended. As such, the copyrights in those works shall belong to
            Passion Product LLC from their creation. Thus, Passion Product LLC shall be
            deemed the author and exclusive owner thereof and shall have the right to exploit any
            or all of the results and proceeds in any and all media, now known or hereafter
            devised, throughout the universe, in perpetuity, in all languages, as
            Passion Product LLC determines. In the event that any of the results and
            proceeds of your submissions hereunder are not deemed a "work made for hire" under
            Section 101 of the Copyright Act, as amended, you hereby, without additional
            compensation, irrevocably assign, convey and transfer to Passion Product LLC all
            proprietary rights, including without limitation, all copyrights and trademarks
            throughout the universe, in perpetuity in every medium, whether now known or hereafter
            devised, to such material and any and all right, title and interest in and to all such
            proprietary rights in every medium, whether now known or hereafter devised, throughout
            the universe, in perpetuity. Any posted material which are reproductions of prior works
            by you shall be co-owned by us.
          </P>
          <P>
            You acknowledge that Passion Product LLC has the right but not the obligation to
            use and display any postings or contributions of any kind and that
            Passion Product LLC may elect to cease the use and display of any such materials
            (or any portion thereof), at any time for any reason whatsoever.
          </P>
          <P className="italic text-gray-600">
            <span className="font-semibold not-italic text-gray-900">
              Limitations on Linking and Framing:
            </span>{' '}
            You may establish a hypertext link to the Site so long as the link does not state or
            imply any sponsorship of your site by us or by the Site. However, you may not, without
            our prior written permission, frame or inline link any of the content of the Site, or
            incorporate into another website or other service any of our material, content or
            intellectual property.
          </P>
        </Section>

        <Section title="Program/Service">
          <P>
            Passion Product LLC agrees to provide educational training (herein referred to as
            "Program") in the fields of online business, eCommerce and marketing. The Client agrees
            to abide by all policies and procedures as outlined in this agreement as a condition of
            their participation in the Program.
          </P>
          <P>
            By using the Website, you signify your agreement to everything in these Terms of Use
            and our Terms of Purchase and Refund Policy. If you do not agree to these Terms of Use,
            you may not use the Website.
          </P>
          <P>
            In addition, when you use any of our current or future services, you will also be
            subject to our guidelines, terms, conditions and agreements applicable to those
            services. If these Terms of Use are inconsistent with the guidelines, terms and
            agreements applicable to those services, these Terms of Use will control. When we say
            Travis Marziani, we mean any and all companies affiliated with Travis Marziani,
            including but not limited to Passion Product LLC and any of the domains it operates.
          </P>
          <P>
            Passion Product LLC, and all affiliated companies currently provides users with
            access to sales training resources (training videos, training books, educational
            software, etc.), various reference and communication tools (newsletters, blogs,
            articles, etc.), forums, shopping services, advertising and marketing services, social
            media services, and personalized content (collectively referred to as the "Services").
            You also understand and agree that the Service may include sponsorships or
            advertisements.
          </P>
          <P>
            Any and all Passion Product LLC services shall be subject to the Terms of Use.
            You understand and agree that any and all Service is provided "AS-IS" and that
            Passion Product LLC assumes no responsibility for the timeliness, deletion,
            delivery problems or failure to store any user communications or personalization
            settings.
          </P>
          <P>
            Passion Product LLC is an online educational course for learning how to start an
            online business. You will be charged for any materials that you wish to purchase from
            us. Prices may vary. You are responsible for obtaining access to the Service and that
            access may involve third party fees (such as Internet service provider or airtime
            charges). You are responsible for those fees, including those fees associated with the
            display of delivery of advertisements. In addition, you must provide and are
            responsible for all equipment necessary to access the Service.
          </P>
        </Section>

        <Section title="Disclaimers">
          <P>
            Throughout the Site, we may provide links and pointers to Internet sites maintained by
            third parties. Our linking to such third-party sites does not imply an endorsement or
            sponsorship of such sites, or the information, products or services offered on or
            through the sites. In addition, neither we nor affiliates operate or control in any
            respect any information, products or services that third parties may provide on or
            through the Site or on websites linked to by us on the Site.
          </P>
          <P>
            If applicable, any opinions, advice, statements, services, offers, or other information
            or content expressed or made available by third parties, including information
            providers, are those of the respective authors or distributors, and not
            Passion Product LLC. Neither Passion Product LLC nor any third-party
            provider of information guarantees the accuracy, completeness, or usefulness of any
            content. Furthermore, Passion Product LLC neither endorses nor is responsible for
            the accuracy and reliability of any opinion, advice, or statement made on any of the
            Sites by anyone other than an authorized Passion Product LLC representative while
            acting in his/her official capacity.
          </P>
          <P className="text-xs uppercase tracking-wide">
            THE INFORMATION, PRODUCTS AND SERVICES OFFERED ON OR THROUGH THE SITE AND BY
            PASSION PRODUCT LLC AND ANY THIRD-PARTY SITES ARE PROVIDED "AS IS" AND WITHOUT
            WARRANTIES OF ANY KIND EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE
            PURSUANT TO APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING,
            BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
            PURPOSE. WE DO NOT WARRANT THAT THE SITE OR ANY OF ITS FUNCTIONS WILL BE UNINTERRUPTED
            OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT ANY PART OF THIS SITE, INCLUDING
            BULLETIN BOARDS, OR THE SERVERS THAT MAKE IT AVAILABLE, ARE FREE OF VIRUSES OR OTHER
            HARMFUL COMPONENTS.
          </P>
          <P className="text-xs uppercase tracking-wide">
            WE DO NOT WARRANT OR MAKE ANY REPRESENTATIONS REGARDING THE USE OR THE RESULTS OF THE
            USE OF THE SITE OR MATERIALS ON THIS SITE OR ON THIRD-PARTY SITES IN TERMS OF THEIR
            CORRECTNESS, ACCURACY, TIMELINESS, RELIABILITY OR OTHERWISE.
          </P>
          <P>
            You agree at all times to defend, indemnify and hold harmless Passion Product LLC
            its affiliates, their successors, transferees, assignees and licensees and their
            respective parent and subsidiary companies, agents, associates, officers, directors,
            shareholders and employees of each from and against any and all claims, causes of
            action, damages, liabilities, costs and expenses, including legal fees and expenses,
            arising out of or related to your breach of any obligation, warranty, representation
            or covenant set forth herein.
          </P>
        </Section>

        <Section title="Online Commerce">
          <P>
            Certain sections of the Site may allow you to purchase many different types of products
            and services online that are provided by third parties. We are not responsible for the
            quality, accuracy, timeliness, reliability or any other aspect of these products and
            services. If you make a purchase from a merchant on the Site or on a site linked to by
            the Site, the information obtained during your visit to that merchant's online store or
            site, and the information that you give as part of the transaction, such as your credit
            card number and contact information, may be collected by both the merchant and us. A
            merchant may have privacy and data collection practices that are different from ours.
            We have no responsibility or liability for these independent policies. In addition, when
            you purchase products or services on or through the Site, you may be subject to
            additional terms and conditions that specifically apply to your purchase or use of such
            products or services. For more information regarding a merchant, its online store, its
            privacy policies, and/or any additional terms and conditions that may apply, visit that
            merchant's website and click on its information links or contact the merchant directly.
            You release us and our affiliates from any damages that you incur, and agree not to
            assert any claims against us or them, arising from your purchase or use of any products
            or services made available by third parties through the Site.
          </P>
          <P>
            Your participation, correspondence or business dealings with any third party found on
            or through our Site, regarding payment and delivery of specific goods and services, and
            any other terms, conditions, representations or warranties associated with such
            dealings, are solely between you and such third party. You agree that
            Passion Product LLC shall not be responsible or liable for any loss, damage, or
            other matters of any sort incurred as the result of such dealings.
          </P>
          <P>
            You agree to be financially responsible for all purchases made by you or someone acting
            on your behalf through the Site. You agree to use the Site and to purchase services or
            products through the Site for legitimate, non-commercial purposes only. You also agree
            not to make any purchases for speculative, false or fraudulent purposes or for the
            purpose of anticipating demand for a particular product or service. You agree to only
            purchase goods or services for yourself or for another person for whom you are legally
            permitted to do so. When making a purchase for a third party that requires you to
            submit the third party's personal information to us or a merchant, you represent that
            you have obtained the express consent of such third party to provide such third party's
            personal information.
          </P>
          <P>
            Your purchase is for personal use only. Sharing of purchases is not permitted and will
            be considered unauthorized, an infringing use of our copyrighted material, and may
            subject violators to liability. If payment for a course is declined, our system will
            automatically disable access to our premium materials. (We understand. This usually
            happens because a credit card expires.) We want to help restore your access, so we'll
            make every attempt to contact you to help resolve this issue. Once the billing issue is
            resolved, we'll restore access.
          </P>
        </Section>

        <Section title="Privacy Policy">
          <P>
            Please review our{' '}
            <a href="/privacypolicy" className="text-orange-600 underline">
              Privacy Policy
            </a>
            , which also governs your visit to our website and any purchases made on our website.
          </P>
        </Section>

        <Section title="Restrictions On Use Of Our Content">
          <P>
            The content contained on this Website (collectively, "Content"), such as logos, artwork,
            text and graphics, widgets, icons, images, audio and video clips, digital downloads,
            data compilations, and software, is the property of Passion Product LLC, or the
            property of our licensors or licensees, and the compilation of the Content on the
            Website is the exclusive property of Passion Product LLC, and protected by United
            States and international copyright laws, treaties and conventions. All software used on
            the Website is also the property of Passion Product LLC, or the property of our
            software suppliers and protected by United States and international copyright laws,
            treaties and conventions.
          </P>
          <P>
            Any and all logos, service marks, page headers, graphics, trademarks, service marks,
            widgets, icons, scripts and trade names (each, a "Mark") contained on the Website are
            proprietary to Passion Product LLC, or our licensors or licensees. Permission is
            NOT granted to use any of the Marks in connection with any product or service that is
            not ours or, in any manner that is likely to cause confusion among users or that
            disparages or discredits us or anyone else. If you see any other Marks not owned by
            Passion Product LLC, that appear on the Website are the property of their
            respective owners, who may or may not be affiliated with, connected to, or sponsored
            by us.
          </P>
          <P>
            We grant you a limited license to access and make personal use of the Website. No
            Content of the Website or any other Internet site owned, operated, licensed, or
            controlled by us may be copied, reproduced, republished, downloaded (other than page
            caching), uploaded, posted, transmitted or distributed in any way, or sold, resold,
            visited, or otherwise exploited for any commercial purpose, except that you may
            download one (1) copy of the Content that we make available to you for such purposes on
            a single computer for your personal, noncommercial, home use only, provided that you:
            (a) keep intact all copyright, trademark and other proprietary rights notices; (b) do
            not modify any of the Content; (c) do not use any Content in a manner that suggests an
            association with any of our products, services or brands; and (d) do not download
            Content so as to avoid future downloads from the Website. Your use of Content on any
            other website or computer environment is strictly prohibited.
          </P>
          <P>
            The license granted to you does not include, and specifically excludes, any rights to:
            resell or make any commercial use of the Website or any Content; collect and use any
            product listings, descriptions, or prices; make any derivative use of the Website or
            Content; download or copy account information for the benefit of anyone else; or use
            any form of data mining, robots, or similar data gathering and extraction tools. You
            may not frame, or utilize framing techniques to enclose, any Mark, Content or other
            proprietary information, or use any meta tags or any other "hidden text" utilizing any
            such intellectual property, without our and each applicable owner's express written
            consent. Any unauthorized use automatically terminates the license granted to you and
            will result in immediate removal from the course as well as complete license
            termination. You are granted a limited, revocable, and non-exclusive right to create a
            hyperlink only to our home page provided that the link does not portray us or our
            licensors or licensees, or their respective products or services, in a false,
            misleading, derogatory, or otherwise offensive matter. You may not use any of our or
            any such party's intellectual property as part of the link without our and each such
            party's express written consent.
          </P>
        </Section>

        <Section title="Changes to Terms">
          <P>
            These Terms, or any part thereof, may be modified by us, including the addition or
            removal of terms at any time, and such modifications, additions or deletions will be
            effective immediately upon posting. Your use of the Websites after such posting shall
            be deemed to constitute acceptance by you of such modifications, additions or
            deletions.
          </P>
        </Section>

        <Section title="Interactive Features">
          <P>
            This Site may include a variety of features, such as bulletin boards, web logs, chat
            rooms, and email services, which allow feedback to us and real-time interaction between
            users, and other features which allow users to communicate with others. Responsibility
            for what is posted on bulletin boards, web logs, chat rooms, and other public posting
            areas on the Site, or sent via any email services on the Site, lies with each user –
            you alone are responsible for the material you post or send. We do not control the
            messages, information or files that you or others may provide through the Site. It is a
            condition of your use of the Site that you do not:
          </P>
          <UL>
            <li>Restrict or inhibit any other user from using and enjoying the Site.</li>
            <li>
              Use the Site to impersonate any person or entity, or falsely state or otherwise
              misrepresent your affiliation with a person or entity.
            </li>
            <li>
              Interfere with or disrupt any servers or networks used to provide the Site or its
              features, or disobey any requirements, procedures, policies or regulations of the
              networks we use to provide the Site.
            </li>
            <li>Use the Site to instigate or encourage others to commit illegal activities or cause injury or property damage to any person.</li>
            <li>
              Gain unauthorized access to the Site, or any account, computer system, or network
              connected to this Site, by means such as hacking, password mining or other illicit
              means.
            </li>
            <li>Obtain or attempt to obtain any materials or information through any means not intentionally made available through this Site.</li>
            <li>
              Use the Site to post or transmit any unlawful, threatening, abusive, libelous,
              defamatory, obscene, vulgar, pornographic, profane or indecent information of any
              kind, including without limitation any transmissions constituting or encouraging
              conduct that would constitute a criminal offense, give rise to civil liability or
              otherwise violate any local, state, national or international law.
            </li>
            <li>
              Use the Site to post or transmit any information, software or other material that
              violates or infringes upon the rights of others, including material that is an
              invasion of privacy or publicity rights or that is protected by copyright, trademark
              or other proprietary right, or derivative works with respect thereto, without first
              obtaining permission from the owner or rights holder.
            </li>
            <li>Use the Site to post or transmit any information, software or other material that contains a virus or other harmful component.</li>
            <li>Use the Site to post, transmit or in any way exploit any information, software or other material for commercial purposes, or that contains advertising.</li>
            <li>Use the Site to advertise or solicit to anyone to buy or sell products or services, or to make donations of any kind, without our express written approval.</li>
            <li>Gather for marketing purposes any email addresses or other personal information that has been posted by other users of the Site.</li>
          </UL>
          <P>
            Passion Product LLC may host message boards, chats and other public forums on its
            Sites. Any user failing to comply with the terms and conditions of this Agreement may
            be expelled from and refused continued access to, the message boards, chats or other
            public forums in the future. Passion Product LLC or its designated agents may
            remove or alter any user-created content at any time for any reason. Message boards,
            chats and other public forums are intended to serve as discussion centers for users and
            subscribers. Information and content posted within these public forums may be provided
            by Passion Product LLC staff, Passion Product LLC's outside contributors,
            or by users not connected with Passion Product LLC, some of whom may employ
            anonymous user names. Passion Product LLC expressly disclaims all responsibility
            and endorsement and makes no representation as to the validity of any opinion, advice,
            information or statement made or displayed in these forums by third parties, nor are we
            responsible for any errors or omissions in such postings, or for hyperlinks embedded in
            any messages. Under no circumstances will we, our affiliates, suppliers or agents be
            liable for any loss or damage caused by your reliance on information obtained through
            these forums. The opinions expressed in these forums are solely the opinions of the
            participants, and do not reflect the opinions of Passion Product LLC or any of
            its subsidiaries or affiliates.
          </P>
          <P>
            Passion Product LLC has no obligation whatsoever to monitor any of the content or
            postings on the message boards, chat rooms or other public forums on the Sites.
            However, you acknowledge and agree that we have the absolute right to monitor the same
            at our sole discretion. In addition, we reserve the right to alter, edit, refuse to
            post or remove any postings or content, in whole or in part, for any reason and to
            disclose such materials and the circumstances surrounding their transmission to any
            third party in order to satisfy any applicable law, regulation, legal process or
            governmental request and to protect ourselves, our clients, sponsors, users and
            visitors.
          </P>
          <P>
            We occasionally include access to an online community as part of our programs. We want
            every single member to add value to the group. Our goal is to make your community the
            most valuable community you're a member of. Therefore, we reserve the right to remove
            anyone at any time. We rarely do this, but we want to let you know how seriously we
            take our communities.
          </P>
        </Section>

        <Section title="Registration">
          <P>
            To access certain features of the Site, we may ask you to provide certain demographic
            information including your gender, year of birth, zip code and country. In addition, if
            you elect to sign-up for a particular feature of the Site, such as chat rooms, web
            logs, or bulletin boards, you may also be asked to register with us on the form
            provided and such registration may require you to provide personally identifiable
            information such as your name and email address. You agree to provide true, accurate,
            current and complete information about yourself as prompted by the Site's registration
            form. If we have reasonable grounds to suspect that such information is untrue,
            inaccurate, or incomplete, we have the right to suspend or terminate your account and
            refuse any and all current or future use of the Site (or any portion thereof). Our use
            of any personally identifiable information you provide to us as part of the
            registration process is governed by the terms of our Privacy Policy.
          </P>
        </Section>

        <Section title="Passwords">
          <P>
            To use certain features of the Site, you will need a username and password, which you
            will receive through the Site's registration process. You are responsible for
            maintaining the confidentiality of the password and account, and are responsible for
            all activities (whether by you or by others) that occur under your password or account.
            You agree to notify us immediately of any unauthorized use of your password or account
            or any other breach of security, and to ensure that you exit from your account at the
            end of each session. We cannot and will not be liable for any loss or damage arising
            from your failure to protect your password or account information.
          </P>
        </Section>

        <Section title="Limitation of Liability">
          <P className="text-xs uppercase tracking-wide">
            UNDER NO CIRCUMSTANCES, INCLUDING, BUT NOT LIMITED TO, NEGLIGENCE, SHALL WE, OUR
            SUBSIDIARY AND PARENT COMPANIES OR AFFILIATES BE LIABLE FOR ANY DIRECT, INDIRECT,
            INCIDENTAL, SPECIAL OR CONSEQUENTIAL DAMAGES THAT RESULT FROM THE USE OF, OR THE
            INABILITY TO USE, THE SITE, INCLUDING OUR MESSAGING, BLOGS, COMMENTS OF OTHERS, BOOKS,
            EMAILS, PRODUCTS, OR SERVICES, OR THIRD-PARTY MATERIALS, PRODUCTS, OR SERVICES MADE
            AVAILABLE THROUGH THE SITE OR BY US IN ANY WAY, EVEN IF WE ARE ADVISED BEFOREHAND OF
            THE POSSIBILITY OF SUCH DAMAGES. (BECAUSE SOME STATES DO NOT ALLOW THE EXCLUSION OR
            LIMITATION OF CERTAIN CATEGORIES OF DAMAGES, THE ABOVE LIMITATION MAY NOT APPLY TO YOU.
            IN SUCH STATES, OUR LIABILITY AND THE LIABILITY OF OUR SUBSIDIARY AND PARENT COMPANIES
            OR AFFILIATES IS LIMITED TO THE FULLEST EXTENT PERMITTED BY SUCH STATE LAW.) YOU
            SPECIFICALLY ACKNOWLEDGE AND AGREE THAT WE ARE NOT LIABLE FOR ANY DEFAMATORY, OFFENSIVE
            OR ILLEGAL CONDUCT OF ANY USER. IF YOU ARE DISSATISFIED WITH THE SITE, ANY MATERIALS,
            PRODUCTS, OR SERVICES ON THE SITE, OR WITH ANY OF THE SITE'S TERMS AND CONDITIONS, YOUR
            SOLE AND EXCLUSIVE REMEDY IS TO DISCONTINUE USING THE SITE AND THE PRODUCTS, SERVICES
            AND/OR MATERIALS. PASSION PRODUCT LLC IS NOT AN INVESTMENT ADVISORY SERVICE, IS
            NOT AN INVESTMENT ADVISER, AND DOES NOT PROVIDE PERSONALIZED FINANCIAL ADVICE OR ACT AS
            A FINANCIAL ADVISOR.
          </P>
          <P className="text-xs uppercase tracking-wide">
            WE EXIST FOR EDUCATIONAL PURPOSES ONLY, AND THE MATERIALS AND INFORMATION CONTAINED
            HEREIN AND IN OUR PRODUCTS AND SERVICES ARE FOR GENERAL INFORMATIONAL PURPOSES ONLY.
            NONE OF THE INFORMATION PROVIDED BY US IS INTENDED AS INVESTMENT, TAX, ACCOUNTING OR
            LEGAL ADVICE, AS AN OFFER OR SOLICITATION OF AN OFFER TO BUY OR SELL, OR AS AN
            ENDORSEMENT, RECOMMENDATION OR SPONSORSHIP OF ANY PASSION PRODUCT LLC, SECURITY,
            OR FUND. OUR INFORMATION SHOULD NOT BE RELIED UPON FOR PURPOSES OF TRANSACTING IN
            SECURITIES OR OTHER INVESTMENTS.
          </P>
          <P className="text-xs uppercase tracking-wide">
            WE DO NOT OFFER OR PROVIDE TAX, LEGAL OR INVESTMENT ADVICE AND YOU ARE RESPONSIBLE FOR
            CONSULTING TAX, LEGAL, OR FINANCIAL PROFESSIONALS BEFORE ACTING ON ANY INFORMATION
            PROVIDED BY US. THIS SITE IS CONTINUALLY UNDER DEVELOPMENT AND
            PASSION PRODUCT LLC MAKES NO WARRANTY OF ANY KIND, IMPLIED OR EXPRESS, AS TO ITS
            ACCURACY, COMPLETENESS OR APPROPRIATENESS FOR ANY PURPOSE. YOU acknowledge and agree
            that no representation has been made by Passion Product LLC OR ITS AFFILIATES and
            relied upon as to the future income, expenses, sales volume or potential profitability
            that may be derived from the participation in THIS PROGRAM.
          </P>
        </Section>

        <Section title="Termination">
          <P>
            We may cancel or terminate your right to use the Site or any part of the Site at any
            time without notice, without any refund or money back. In the event of cancellation or
            termination, you are no longer authorized to access the part of the Site affected by
            such cancellation or termination. The restrictions imposed on you with respect to
            material downloaded from the Site, and the disclaimers and limitations of liabilities
            set forth in these Terms of Service, shall survive.
          </P>
          <P>
            We may explicitly cancel or terminate your right to use the Site for any and all
            reasons, not limited to but including:
          </P>
          <UL>
            <li>Negativity, complaining, failing to adhere by the rules of the community</li>
            <li>Threatening to file an illegitimate dispute with your financial institution/credit card company</li>
            <li>Threatening any kind of defamation/libel</li>
            <li>Attempting to defraud the Site, its Owners, or any of its members for personal gain</li>
          </UL>
        </Section>

        <Section title="Other">
          <P>
            The Digital Millennium Copyright Act of 1998 (the "DMCA") provides recourse for
            copyright owners who believe that material appearing on the Internet infringes their
            rights under the U.S. copyright law. If you believe in good faith that materials hosted
            by Passion Product LLC infringe your copyright, you, or your agent may send to
            Passion Product LLC a notice requesting that the material be removed or access to
            it be blocked. Any notification by a copyright owner or a person authorized to act on
            its behalf that fails to comply with requirements of the DMCA shall not be considered
            sufficient notice and shall not be deemed to confer upon Passion Product LLC
            actual knowledge of facts or circumstances from which infringing material or acts are
            evident. If you believe in good faith that a notice of copyright infringement has been
            wrongly filed against you, the DMCA permits you to send to Passion Product LLC a
            counter-notice. All notices and counter notices must meet the then current statutory
            requirements imposed by the DMCA; see{' '}
            <a
              href="http://www.loc.gov/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline"
            >
              http://www.loc.gov/copyright
            </a>{' '}
            for details. Passion Product LLC's Copyright Agent for notice of claims of
            copyright infringement or counter notices can be reached at:{' '}
            <a href="mailto:travis@effectiveecommerce.com" className="text-orange-600 underline">
              travis@effectiveecommerce.com
            </a>
            .
          </P>
          <P>
            This Agreement shall be binding upon and inure to the benefit of
            Passion Product LLC and our respective assigns, successors, heirs, and legal
            representatives. Neither this Agreement nor any rights hereunder may be assigned
            without the prior written consent of Passion Product LLC. Notwithstanding the
            foregoing, all rights and obligations under this Agreement may be freely assigned by
            Passion Product LLC to any affiliated entity or any of its wholly owned
            subsidiaries. If any provision of this agreement shall be unlawful, void or for any
            reason unenforceable, then that provision shall be deemed severable from this agreement
            and shall not affect the validity and enforceability of any remaining provisions.
          </P>
        </Section>

        <Section title="Disclaimer">
          <P>
            Although it is highly unlikely, this policy may be changed at any time at our
            discretion. If we should update this policy, we will post the updates to this page on
            our Website. If you have any questions or concerns regarding our privacy policy please
            direct them to:{' '}
            <a href="mailto:travis@effectiveecommerce.com" className="text-orange-600 underline">
              travis@effectiveecommerce.com
            </a>
            .
          </P>
        </Section>

        <p className="text-center text-gray-400 text-sm mt-16">
          &copy; {new Date().getFullYear()} Passion Product LLC. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}

/* ───── small typography helpers used only inside this page ─────── */

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
