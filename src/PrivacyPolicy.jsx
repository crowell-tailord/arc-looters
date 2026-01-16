import React from 'react';

export default function PrivacyPolicy({ onBack }) {
	return (
		<div className="page privacy-policy">
			<header className="hero">
				<h1>Privacy Policy</h1>
				<p>Last updated: January 2026</p>
			</header>

			<div className="content-container">
				<section>
					<h2>1. Introduction</h2>
					<p>
						Arc Looter ("we", "us", or "our") operates as a fan-made catalog for the game <em>Arc Raiders</em>. 
						This Privacy Policy explains how we handle any information when you visit our website.
					</p>
				</section>

				<section>
					<h2>2. Data Collection & Usage</h2>
					
					<h3>Local Storage</h3>
					<p>
						We use your browser's Local Storage to save your preferences, specifically the list of items you have "Pinned". 
						This data is stored locally on your device and is not transmitted to our servers.
					</p>

					<h3>Analytics</h3>
					<p>
						We use Vercel Analytics to understand general usage patterns (e.g., number of visitors, page views). 
						This service is privacy-friendly and does not track individual users across the web.
					</p>

					<h3>Advertising</h3>
					<p>
						We may display advertisements provided by third-party vendors (such as Ezoic or Tailord). 
						These vendors may use cookies to serve ads based on your prior visits to this or other websites.
					</p>
				</section>

				<section>
					<h2>3. Third-Party Links</h2>
					<p>
						Our site contains links to external websites (e.g., Buy Me a Coffee, PayPal, X/Twitter). 
						We are not responsible for the content or privacy practices of these third-party sites.
					</p>
				</section>

				<section>
					<h2>4. Contact</h2>
					<p>
						If you have any questions about this policy, you can reach out to the developer on X (Twitter) 
						at <a href="https://x.com/iam_cro" target="_blank" rel="noreferrer">@iam_cro</a>.
					</p>
				</section>

				<div className="actions">
					<button type="button" className="primary-button" onClick={onBack}>
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
