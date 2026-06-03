import React, { useEffect } from 'react';
import { HeaderLight } from '../components/HeaderLight';

/* ───── /privacypolicy ────────────────────────────────────────────
   Full Privacy Policy page. Separate from /terms (SMS-specific).
──────────────────────────────────────────────────────────────────── */

export function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy - Passion Product';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <HeaderLight />

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-black mb-10 tracking-tight">Privacy Policy</h1>

        <div className="space-y-4 text-gray-700 leading-relaxed text-[15px] md:text-base mb-10">
          <p>
            Passion Product LLC understands that your privacy is important to you. We are
            committed to protecting the privacy of your personally-identifiable information as you
            use any of our websites. This Privacy Policy applies to every website operated by
            Passion Product LLC - including but not limited to travisfba.com, travismarziani.com,
            start.travismarziani.com, passionproductformula.com, and any other domain we own or
            operate from time to time - and tells you how we protect and use information that we
            gather from you. By using any of our websites, you consent to the terms described in
            the most recent version of this Privacy Policy. You should also read our{' '}
            <a href="/termsofservice" className="text-orange-600 underline">
              Terms of Use
            </a>{' '}
            to understand the general rules about your use of these websites, and any additional
            terms that may apply when you access particular services or materials. "We," "our"
            means Passion Product LLC and its affiliates. "You," "your," "visitor," or "user"
            means the individual accessing these sites.
          </p>
        </div>

        <Section title="Personal and Non-Personal Information">
          <P>
            Our Privacy Policy identifies how we treat your personal and non-personal information.
          </P>
        </Section>

        <Section title="What Is Non-Personal Information and How Is It Collected and Used?">
          <P>
            Non personal information is information that cannot identify you. If you visit this web
            site to read information, such as information about one of our services, we may collect
            certain non-personal information about you from your computer's web browser. Because
            non-personal information cannot identify you or be tied to you in any way, there are no
            restrictions on the ways that we can use or share non-personal information. What is
            personal information and how is it collected? Personal information is information that
            identifies you as an individual, such as your name, mailing address, e-mail address,
            telephone number, and fax number. We may collect personal information from you in a
            variety of ways:
          </P>
          <UL>
            <li>When you send us an application or other form</li>
            <li>When you conduct a transaction with us, our affiliates, or others</li>
            <li>When we collect information about you in support of a transaction, such as credit card information</li>
            <li>
              In some places on this web site you have the opportunity to send us personal
              information about yourself, to elect to receive particular information, to purchase
              access to one of our products or services, or to participate in an activity.
            </li>
          </UL>
          <P className="font-semibold">
            We do not share your data with third parties for marketing purposes.
          </P>
        </Section>

        <Section title="Are Cookies or Other Technologies Used to Collect Personal Information?">
          <P>
            Yes, we may use cookies and related technologies, such as web beacons, to collect
            information on our web site. A cookie is a text file that is placed on your hard disk
            by a web page server. Cookies cannot be used to run programs or deliver viruses to your
            computer. Cookies are uniquely assigned to you, and can only be read by a web server in
            the domain that issued the cookie to you. One of the primary purposes of cookies is to
            provide a convenience feature to save you time. The purpose of a cookie is to tell the
            Web server that you have returned to a specific page. For example, if you register with
            us, a cookie helps Passion Product LLC to recall your specific information on
            subsequent visits. This simplifies the process of recording your personal information,
            such as billing addresses, shipping addresses, and so on. When you return to the same
            Passion Product LLC website, the information you previously provided can be
            retrieved, so you can easily use the features that you customized.
          </P>
          <P>
            A web beacon is a small graphic image that allows the party that set the web beacon to
            monitor and collect certain information about the viewer of the web page, web-based
            document or e-mail message, such as the type of browser requesting the web beacon, the
            IP address of the computer that the web beacon is sent to and the time the web beacon
            was viewed. Web beacons can be very small and invisible to the user, but, in general,
            any electronic image viewed as part of a web page or e-mail, including HTML based
            content, can act as a web beacon. We may use web beacons to count visitors to the web
            pages on the web site or to monitor how our users navigate the web site, and we may
            include web beacons in e-mail messages in order to count how many messages sent were
            actually opened, acted upon or forwarded.
          </P>
          <P>
            Third party vendors also may use cookies on our web site. For instance, we may contract
            with third parties who will use cookies on our web site to track and analyze anonymous
            usage and volume statistical information from our visitors and members. Such
            information is shared externally only on an anonymous, aggregated basis.
          </P>
          <P>
            We use third-party services such as Cloudflare, Google Tag Manager, Google Fonts,
            Google Analytics, Sentry, Stripe, PayPal, Braze, Font Awesome, Wistia Widget, and
            Google Ads Conversion Tracking.
          </P>
          <P>
            These third parties use persistent cookies to help us to improve the visitor
            experience, to manage our site content, and to track visitor behaviour. We may also
            contract with a third party to send e-mail to our registered users/members.
          </P>
          <P>
            To help measure and improve the effectiveness of our e-mail communications, the third
            party sets cookies. All data collected by this third party on behalf of
            Passion Product LLC is used solely by or on behalf of Passion Product LLC
            and is shared externally only on an anonymous, aggregated basis. From time to time we
            may allow third parties to post advertisements on our web site, and those third-party
            advertisements may include a cookie or web beacon served by the third party. This
            Privacy Policy does not cover the use of information collected from you by third party
            ad servers. We do not control cookies in such third party ads, and you should check the
            privacy policies of those advertisers and/or ad services to learn about their use of
            cookies and other technology before linking to an ad. We will not share your personal
            information with these companies, but these companies may use information about your
            visits to this and other web sites in order to provide advertisements on this site and
            other sites about goods and services that may be of interest to you, and they may share
            your personal information that you provide to them with others.
          </P>
          <P>
            You have the ability to accept or decline cookies. Most Web browsers automatically
            accept cookies, but you can usually modify your browser setting to decline cookies if
            you prefer. If you choose to decline cookies, you may not be able to fully experience
            the interactive features of the Passion Product LLC websites you visit.
          </P>
        </Section>

        <Section title="Cookies">
          <P>
            Cookies are files with small amount of data, which may include an anonymous unique
            identifier. Cookies are sent to your browser from a web site and stored on your
            computer's hard drive.
          </P>
          <P>
            We use "cookies" to collect information. You can instruct your browser to refuse all
            cookies or to indicate when a cookie is being sent. However, if you do not accept
            cookies, you may not be able to use some portions of our Service.
          </P>
          <P>
            We send a session cookie to your computer when you log in to your User account. This
            type of cookie helps if you visit multiple pages on the Service during the same
            session, so that you don't need to enter your password on each page. Once you log out
            or close your browser, this cookie expires.
          </P>
          <P>
            We also use longer-lasting cookies for other purposes such as to display your Content
            and account information. We encode our cookie so that only we can interpret the
            information stored in them. Users always have the option of disabling cookies via their
            browser preferences. If you disable cookies on your browser, please note that some
            parts of our Service may not function as effectively or may be considerably slower.
          </P>
        </Section>

        <Section title="Behavioral Remarketing">
          <P>
            Passion Product uses remarketing services to advertise on third party web sites to you
            after you visited our Service. We, and our third party vendors, use cookies to inform,
            optimize and serve ads based on your past visits to our Service.
          </P>

          <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">Google</h3>
          <P>Google AdWords remarketing service is provided by Google Inc.</P>
          <P>
            You can opt-out of Google Analytics for Display Advertising and customize the Google
            Display Network ads by visiting the Google Ads Settings page:{' '}
            <a
              href="http://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline break-all"
            >
              http://www.google.com/settings/ads
            </a>
          </P>
          <P>
            Google also recommends installing the Google Analytics Opt-out Browser Add-on -{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline break-all"
            >
              https://tools.google.com/dlpage/gaoptout
            </a>{' '}
            - for your web browser. Google Analytics Opt-out Browser Add-on provides visitors with
            the ability to prevent their data from being collected and used by Google Analytics.
          </P>
          <P>
            You can also opt-out of receiving remarketing ads by going to{' '}
            <a
              href="https://optout.networkadvertising.org/?c=1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline break-all"
            >
              https://optout.networkadvertising.org/?c=1
            </a>{' '}
            or by changing your device's settings,{' '}
            <a
              href="https://support.google.com/ads/answer/1660762#mob"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline break-all"
            >
              learn more here
            </a>
            .
          </P>
          <P>
            For more information on the privacy practices of Google, please visit:{' '}
            <a
              href="http://www.google.com/intl/en/policies/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline break-all"
            >
              http://www.google.com/intl/en/policies/privacy/
            </a>
          </P>

          <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">Facebook</h3>
          <P>Facebook remarketing service is provided by Facebook Inc.</P>
          <P>
            You can learn more about interest-based advertising from Facebook by visiting this
            page:{' '}
            <a
              href="https://www.facebook.com/help/164968693837950"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline break-all"
            >
              https://www.facebook.com/help/164968693837950
            </a>
          </P>
          <P>
            To opt-out from Facebook's interest-based ads follow these instructions from Facebook:{' '}
            <a
              href="https://www.facebook.com/about/ads/#568137493302217"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline break-all"
            >
              https://www.facebook.com/about/ads/
            </a>
          </P>
          <P>
            Facebook adheres to the Self-Regulatory Principles for Online Behavioral Advertising
            established by the Digital Advertising Alliance. You can also opt-out from Facebook and
            other participating companies through the Digital Advertising Alliance in the USA{' '}
            <a
              href="http://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline break-all"
            >
              http://www.aboutads.info/choices/
            </a>
            , the Digital Advertising Alliance of Canada in Canada{' '}
            <a
              href="http://youradchoices.ca/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline break-all"
            >
              http://youradchoices.ca/
            </a>
            , or the European Interactive Digital Advertising Alliance in Europe{' '}
            <a
              href="http://www.youronlinechoices.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline break-all"
            >
              http://www.youronlinechoices.eu/
            </a>
            , or opt-out using your mobile device settings.
          </P>
          <P>
            For more information on the privacy practices of Facebook, please visit Facebook's
            Data Policy:{' '}
            <a
              href="https://www.facebook.com/privacy/explanation"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline break-all"
            >
              https://www.facebook.com/privacy/explanation
            </a>
          </P>
        </Section>

        <Section title="How Does Passion Product LLC Use Personal Information?">
          <P>
            Passion Product LLC may keep and use personal information we collect from or
            about you to provide you with access to this web site or other products or services, to
            respond to your requests, to bill you for products/services you purchased, and to
            provide ongoing service and support, to contact you with information that might be of
            interest to you, including information about products and services of ours and of
            others, or ask for your opinion about our products or the products of others, for
            record keeping and analytical purposes and to research, develop and improve programs,
            products, services and content.
          </P>
          <P>
            Personal information collected online may be combined with information you provide to
            us through other sources. We may also remove your personal identifiers (your name,
            email address, social security number, etc). In this case, you would no longer be
            identified as a single unique individual. Once we have de-identified information, it is
            non-personal information and we may treat it like other non-personal information.
            Finally, we may use your personal information to protect our rights or property, or to
            protect someone's health, safety or welfare, and to comply with a law or regulation,
            court order or other legal process.
          </P>
        </Section>

        <Section title="Does Passion Product LLC Share Personal Information With Others?">
          <P>
            We will not share your personal information collected from this web site with an
            unrelated third party without your permission, except as otherwise provided in this
            Privacy Policy. In the ordinary course of business, we may share some personal
            information with companies that we hire to perform services or functions on our behalf.
            In all cases in which we share your personal information with a third party for the
            purpose of providing a service to us, we will not authorize them to keep, disclose or
            use your information with others except for the purpose of providing the services we
            asked them to provide.
          </P>
          <P>
            We will not sell, exchange or publish your personal information, except in conjunction
            with a corporate sale, merger, dissolution, or acquisition. For some sorts of
            transactions, in addition to our direct collection of information, our third party
            service vendors (such as credit card companies, clearinghouses and banks) who may
            provide such services as credit, insurance, and escrow services may collect personal
            information directly from you to assist you with your transaction. We do not control
            how these third parties use such information, but we do ask them to disclose how they
            use your personal information before they collect it. If you submit a review for a
            third party (person or business) using our Facebook Fan Review Application, during the
            submission process we ask your permission to gather your basic information (such as
            name and email address) which we then share with the third party for whom you are
            submitting the review. We may be legally compelled to release your personal
            information in response to a court order, subpoena, search warrant, law or regulation.
          </P>
        </Section>

        <Section title="Contact">
          <P>
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:travis@passionproduct.com" className="text-orange-600 underline">
              travis@passionproduct.com
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
