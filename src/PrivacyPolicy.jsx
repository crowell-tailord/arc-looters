import React from 'react';

export default function PrivacyPolicy({ onBack }) {
	return (
		<div className='page privacy-policy'>
			<header className='hero'>
				<h1>Privacy Policy</h1>
				<p>Last updated: January 2026</p>
			</header>

			<div className='content-container'>
				<section>
					<h2>1. Introduction</h2>
					<p>
						Arc Looter ("we", "us", or "our") operates as a fan-made catalog for
						the game <em>Arc Raiders</em>. This Privacy Policy explains how we
						handle any information when you visit our website.
					</p>
				</section>

				<section>
					<h2>2. Data Collection & Usage</h2>

					<h3>Local Storage</h3>
					<p>
						We use your browser's Local Storage to save your preferences,
						specifically the list of items you have "Pinned". This data is
						stored locally on your device and is not transmitted to our servers.
					</p>

					<h3>Analytics</h3>
					<p>
						We use Vercel Analytics to understand general usage patterns (e.g.,
						number of visitors, page views). This service is privacy-friendly
						and does not track individual users across the web.
					</p>

					<h3>Advertising</h3>
					<p>
						We may display advertisements provided by third-party vendors (such
						as Ezoic or Tailord). These vendors may use cookies to serve ads
						based on your prior visits to this or other websites. (See section
						5)
					</p>
				</section>

				<section>
					<h2>3. Third-Party Links</h2>
					<p>
						Our site contains links to external websites (e.g., Buy Me a Coffee,
						PayPal, X/Twitter). We are not responsible for the content or
						privacy practices of these third-party sites.
					</p>
				</section>

				<section>
					<h2>4. Contact</h2>
					<p>
						If you have any questions about this policy, you can reach out to
						the developer on X (Twitter) at{' '}
						<a href='https://x.com/iam_cro' target='_blank' rel='noreferrer'>
							@iam_cro
						</a>
						.
					</p>
				</section>

				<section>
					<h2>5. Ezoic Services</h2>
					<p>
						This website uses the services of Ezoic Inc. ("Ezoic"), including to
						manage third-party interest-based advertising. Ezoic may employ a
						variety of technologies on this website, including tools to serve
						content, display advertisements and enable advertising to visitors
						of this website, which may utilize first and third-party cookies.
					</p>
					<p>
						A cookie is a small text file sent to your device by a web server
						that enables the website to remember information about your browsing
						activity. First-party cookies are created by the site you are
						visiting, while third-party cookies are set by domains other than
						the one you're visiting. Ezoic and our partners may place
						third-party cookies, tags, beacons, pixels, and similar technologies
						to monitor interactions with advertisements and optimize ad
						targeting. Please note that disabling cookies may limit access to
						certain content and features on the website, and rejecting cookies
						does not eliminate advertisements but will result in
						non-personalized advertising. You can find more information about
						cookies and how to manage them here.
					</p>
					<p>
						The following information may be collected, used, and stored in a
						cookie when serving personalized ads:
					</p>
					<ul>
						<li>IP address</li>
						<li>Operating system type and version</li>
						<li>Device type</li>
						<li>Language preferences</li>
						<li>Web browser type</li>
						<li>Email (in a hashed or encrypted form)</li>
					</ul>
					<p>
						Ezoic and its partners may use this data in combination with
						information that has been independently collected to deliver
						targeted advertisements across various platforms and websites.
						Ezoic's partners may also gather additional data, such as unique
						IDs, advertising IDs, geolocation data, usage data, device
						information, traffic data, referral sources, and interactions
						between users and websites or advertisements, to create audience
						segments for targeted advertising across different devices,
						browsers, and apps. You can find more information about
						interest-based advertising and how to manage them{' '}
						<a href='https://youradchoices.com/' target='_blank'>
							here
						</a>
						.
					</p>
					<p>
						You can view Ezoic's privacy policy here, or for additional
						information about Ezoic's advertising and other partners, you can
						view Ezoic's advertising partners{' '}
						<a
							href='https://www.ezoic.com/privacy-policy/advertising-partners/'
							target='_blank'
						>
							here
						</a>
						.
					</p>
				</section>

				<div className='actions'>
					<button type='button' className='primary-button' onClick={onBack}>
						&larr; Back to Loot
					</button>
				</div>
			</div>

			<style>{`
				.privacy-policy .content-container {
					max-width: 800px;
					margin: 0 auto;
					padding: 0 1.5rem 2rem;
					color: rgba(245, 245, 245, 0.9);
					line-height: 1.6;
				}
				.privacy-policy section {
					margin-bottom: 2rem;
					background: rgba(12, 17, 24, 0.6);
					padding: 1.5rem;
					border-radius: 1rem;
					border: 1px solid rgba(255, 255, 255, 0.05);
				}
				.privacy-policy h2 {
					font-size: 1.4rem;
					margin-bottom: 1rem;
					color: #fff;
				}
				.privacy-policy h3 {
					font-size: 1.1rem;
					margin: 1rem 0 0.5rem;
					color: #74c1ff;
				}
				.privacy-policy p {
					margin-bottom: 0.8rem;
				}
				.privacy-policy a {
					color: #7a5bff;
					text-decoration: underline;
				}
				.privacy-policy .actions {
					margin-top: 2rem;
					text-align: center;
				}
			`}</style>
		</div>
	);
}
