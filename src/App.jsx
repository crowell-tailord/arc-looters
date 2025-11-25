import { memo, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import lootData from './data/loot.json';
import packageInfo from '../package.json';
import './App.css';

const rarityPalette = {
	legendary: { background: '#fbc700' },
	epic: { background: '#d8299b' },
	rare: { background: '#1ecbfc' },
	uncommon: { background: '#41eb6a' },
	common: { background: '#717471' },
};
const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
const sortOptions = [
	{ value: 'nameAZ', label: 'Name ⬇' },
	{ value: 'nameZA', label: 'Name ⬆' },
	{ value: 'price01', label: 'Price $-$$' },
	{ value: 'price10', label: 'Price $$-$' },
	{ value: 'rarity', label: 'Rarity' },
];

function LogoWordmark() {
	return (
		<svg
			className='specialtext'
			xmlns='http://www.w3.org/2000/svg'
			version='1.1'
			viewBox='0 0 750 200'
			preserveAspectRatio='xMidYMid meet'
			style={{ height: '70%', width: '70%' }}
		>
			<defs>
				<filter id='texteffect'>
					{/* <feGaussianBlur in='SourceGraphic' stdDeviation='4' /> */}
					<feComponentTransfer>
						<feFuncA type='linear' slope='1.5' intercept='0' />
					</feComponentTransfer>
					<feComposite result='outer' in2='SourceGraphic' operator='out' />
					{/* <feGaussianBlur
            result='pre-inner'
            in='SourceGraphic'
            stdDeviation='2'
          /> */}
					<feComposite in='SourceGraphic' in2='pre-inner' operator='out' />
					<feComponentTransfer result='inner'>
						<feFuncA type='linear' slope='7.5' intercept='0' />
					</feComponentTransfer>
					<feMerge>
						<feMergeNode in='outer' />
						<feMergeNode in='inner' />
					</feMerge>
					{/* <feGaussianBlur stdDeviation='1' /> */}
				</filter>
				<linearGradient
					id='gradient'
					colorInterpolation='sRGB'
					spreadMethod='repeat'
					x1='0'
					x2='0.5'
					y1='0.02'
					y2='0'
				>
					<stop stopColor='#ef50d5' offset='0%' />
					<stop stopColor='#15f0f2' offset='33%' />
					<stop stopColor='#f2a415' offset='66%' />
					<stop stopColor='#ef50d5' offset='100%' />
				</linearGradient>
				<mask id='textMask'>
					<g filter='url(#texteffect)'>
						{/* <rect x='10' y='20' width='730' height='10' fill='#fff' /> */}
						{/* <rect x='10' y='170' width='730' height='10' fill='#fff' /> */}
						<text id='text' x='375' y='150' textAnchor='middle' fill='#fff'>
							ARC LOOTER
						</text>
					</g>
				</mask>
			</defs>
			<rect
				id='fill'
				mask='url(#textMask)'
				fill='url(#gradient)'
				x='0'
				y='0'
				width='4000'
				height='200'
			/>
		</svg>
	);
}

function formatTitleCase(value) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-US');

function ProgressiveImage({
	src,
	alt,
	loading = 'lazy',
	onLoad,
	className = '',
	wrapperClassName = '',
	...rest
}) {
	const [isLoaded, setIsLoaded] = useState(false);
	const handleLoad = useCallback(
		(event) => {
			setIsLoaded(true);
			if (onLoad) {
				onLoad(event);
			}
		},
		[onLoad]
	);

	const wrapperClasses = [
		'progressive-image',
		wrapperClassName,
		isLoaded ? 'is-loaded' : 'is-loading',
	]
		.filter(Boolean)
		.join(' ');
	const imageClasses = ['progressive-image__content', className]
		.filter(Boolean)
		.join(' ');

	return (
		<div className={wrapperClasses}>
			<div className='progressive-image__placeholder' aria-hidden='true' />
			<img
				{...rest}
				src={src}
				alt={alt}
				loading={loading}
				onLoad={handleLoad}
				className={imageClasses}
			/>
		</div>
	);
}

function RarityLabel({ rarity, category }) {
	const key = (rarity || 'common').toLowerCase();
	const palette = rarityPalette[key] || rarityPalette.common;

	return (
		<div className='flex rarity-labels' style={{ gap: '0.1rem' }}>
			<span
				className='rarity-label'
				style={{
					backgroundColor: palette.background,
				}}
			>
				{rarity || 'Unknown'}
			</span>
			<span
				className='rarity-label'
				style={{
					backgroundColor: palette.background,
				}}
			>
				{category || 'Unknown'}
			</span>
		</div>
	);
}

const LootTile = memo(function LootTile({ item, onClick }) {
	return (
		<div
			type='button'
			className='tile'
			onClick={onClick}
			aria-label={`${item.name} details`}
		>
			<ProgressiveImage
				src={`/assets/loot/${item.localImage}`}
				alt={`${item.name} - ${item.rarity || 'Unknown'} ${item.category || 'item'}`}
				loading='lazy'
			/>
			<div className='tile-content flex flex-col'>
				<RarityLabel rarity={item.rarity} category={item.category} />
				<h2>{item.name}</h2>
				<div className='tile-recycles flex flex-col'>
					{item.parts.map((p, i) => {
						const pre_mark =
							p.name === 'Cannot be recycled' ? '☒' : `${p.quantity}x`;
						return (
							<span
								key={`${item.name}-part-${p.name}-${i}`}
								className='recycle-name'
							>
								{pre_mark} {p.name}
							</span>
						);
					})}
				</div>
				<span className='coin-price'>{formatCurrency(item.value)}</span>
			</div>
		</div>
	);
});

function DetailModal({ item, onClose, onReport }) {
	const handleBackdropClick = useCallback(
		(event) => {
			if (event.target === event.currentTarget) {
				onClose();
			}
		},
		[onClose]
	);

	return (
		<div
			className='modal-backdrop'
			role='dialog'
			aria-modal='true'
			onClick={handleBackdropClick}
		>
			<div className='modal flex flex-col' role='document'>
				<ProgressiveImage
					src={`/assets/loot/${item.localImage}`}
					alt={`${item.name} detail image - ${item.rarity || 'Unknown'} ${item.category || 'item'}`}
					loading='lazy'
				/>
				<hr />
				<RarityLabel rarity={item.rarity} category={item.category} />
				<h3>{item.name}</h3>
				<div className='flex flex-col info-row'>
					Can Be Found:
					{item.canBeFoundIn?.map((l, i) => {
						return (
							<span
								key={`${item.name}-foundin-${l}-${i}`}
								className={`foundin location-${l.replace(' ', '_')}`}
							>
								{l}
							</span>
						);
					})}
				</div>
				<div className='tile-recycles flex flex-col info-row'>
					Recycles Into:
					{item.parts.map((p, i) => {
						const pre_mark =
							p.name === 'Cannot be recycled' ? '☒' : `${p.quantity}x`;
						return (
							<span
								key={`${item.name}-part-${p.name}-${i}`}
								className='recycle-name'
							>
								{pre_mark} {p.name}
							</span>
						);
					})}
				</div>
				{item.keepForQuestsWorkshop[0] && (
					<p className='flex flex-col keepfor info-row'>
						Should Keep For:
						{item.keepForQuestsWorkshop.map((keep, i) => (
							<span key={`${item.name}-keepfor-${i}`}>{keep}</span>
						))}
					</p>
				)}
				<div className='flex flex-apart'>
					<span className='weight'>{}</span>
					<p className='coin-price'>{formatCurrency(item.value)}</p>
				</div>
				<div className='modal-actions'>
					<button
						type='button'
						className='ghost-button'
						onClick={() => onReport?.(item)}
					>
						Info incorrect?
					</button>
				</div>
				<button className='close' onClick={onClose} aria-label='Close'>
					×
				</button>
			</div>
		</div>
	);
}

function FeedbackModal({ item, onClose, apiBaseUrl }) {
	const [message, setMessage] = useState('');
	const [status, setStatus] = useState('idle'); // idle | sending | sent | error
	const [error, setError] = useState('');
	const endpoint = `${apiBaseUrl ? `${apiBaseUrl}` : ''}/api/report-issue`;

	const handleSubmit = useCallback(
		async (event) => {
			event.preventDefault();
			const trimmed = message.trim();
			if (!trimmed) {
				setError('Please describe what needs to be fixed.');
				return;
			}

			setStatus('sending');
			setError('');

			try {
				const response = await fetch(endpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Requested-With': 'arc-loot-feedback',
					},
					body: JSON.stringify({
						itemName: item.name,
						message: trimmed,
					}),
				});

				if (!response.ok) {
					const data = await response.json().catch(() => ({}));
					throw new Error(data.error || 'Failed to send feedback.');
				}

				setStatus('sent');
				setMessage('');
			} catch (submitError) {
				setStatus('error');
				setError(submitError.message || 'Could not send feedback.');
			}
		},
		[endpoint, item.name, message]
	);

	const handleBackdropClick = useCallback(
		(event) => {
			if (event.target === event.currentTarget) {
				onClose();
			}
		},
		[onClose]
	);

	return (
		<div
			className='modal-backdrop'
			role='dialog'
			aria-modal='true'
			onClick={handleBackdropClick}
		>
			<form
				className='modal feedback-modal flex flex-col'
				onSubmit={handleSubmit}
			>
				<h3>Flag an issue</h3>
				<p className='helper-text'>
					Tell me what looks off about <strong>{item.name}</strong> and
					I&apos;ll correct it.
				</p>

				<label className='flex flex-col feedback-label'>
					<textarea
						value={message}
						onChange={(event) => setMessage(event.target.value)}
						className='text-input'
						rows='4'
						placeholder='Example: value is wrong, recycled parts should be..., missing keep-for quest...'
						required
						disabled={status !== 'idle'}
					/>
				</label>

				{error && <p className='feedback-error'>{error}</p>}
				{status === 'sent' && (
					<p className='feedback-success'>Thanks! I got the report.</p>
				)}

				<div className='modal-actions'>
					<button
						type='button'
						className='ghost-button'
						onClick={onClose}
						disabled={status === 'sending'}
					>
						{status === 'sent' ? 'Close' : 'Cancel'}
					</button>
					<button
						type='submit'
						className='primary-button'
						disabled={status !== 'idle'}
					>
						{status === 'sending'
							? 'Sending…'
							: status === 'sent'
							? 'Sent!'
							: 'Send Report'}
					</button>
				</div>
			</form>
		</div>
	);
}

export default function App() {
	const [selected, setSelected] = useState(null);
	const [feedbackItem, setFeedbackItem] = useState(null);
	const [query, setQuery] = useState('');
	const [activeRarity, setActiveRarity] = useState('');
	const [sortBy, setSortBy] = useState('nameAZ');
	const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
	const sortMenuRef = useRef(null);
	const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(
		/\/$/,
		''
	);
	const currentSortLabel =
		sortOptions.find((option) => option.value === sortBy)?.label ?? 'Name';
	const handleSortSelection = useCallback((option) => {
		setSortBy(option);
		setIsSortMenuOpen(false);
	}, []);

	useEffect(() => {
		if (!isSortMenuOpen) return undefined;

		const handleDocumentClick = (event) => {
			if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
				setIsSortMenuOpen(false);
			}
		};

		document.addEventListener('mousedown', handleDocumentClick);
		return () => {
			document.removeEventListener('mousedown', handleDocumentClick);
		};
	}, [isSortMenuOpen]);
	const sortedLoot = useMemo(() => {
		const items = [...lootData];
		items.sort((a, b) => {
			if (sortBy === 'price01') {
				return Number(a.value || 0) - Number(b.value || 0);
			}
			if (sortBy === 'price10') {
				return Number(b.value || 0) - Number(a.value || 0);
			}

			if (sortBy === 'rarity') {
				const aRank = rarityOrder.indexOf((a.rarity || '').toLowerCase()) ?? -1;
				const bRank = rarityOrder.indexOf((b.rarity || '').toLowerCase()) ?? -1;
				return (
					(aRank === -1 ? rarityOrder.length : aRank) -
					(bRank === -1 ? rarityOrder.length : bRank)
				);
			}

			if (sortBy === 'nameZA') {
				return b.name.localeCompare(a.name);
			}

			return a.name.localeCompare(b.name);
		});

		return items;
	}, [sortBy]);
	const filteredLoot = useMemo(() => {
		let items = sortedLoot;
		const trimmed = query.trim();

		if (trimmed) {
			const lowered = trimmed.toLowerCase();
			items = items.filter((item) => {
				const nameMatch = item.name.toLowerCase().includes(lowered);
				const rarityMatch = item.rarity?.toLowerCase().includes(lowered);
				const partMatch = item.parts.some((piece) =>
					piece.name.toLowerCase().includes(lowered)
				);
				return nameMatch || rarityMatch || partMatch;
			});
		}

		if (activeRarity) {
			items = items.filter(
				(item) => item.rarity?.toLowerCase() === activeRarity
			);
		}

		return items;
	}, [query, sortedLoot, activeRarity]);
	const handleSelect = useCallback((item) => setSelected(item), []);
	const handleRarityClick = useCallback((rarity) => {
		setActiveRarity((current) => (current === rarity ? '' : rarity));
	}, []);

	const handleReportClick = useCallback((item) => {
		setSelected(null);
		setFeedbackItem(item);
	}, []);

	return (
		<div className='page'>
			<header className='hero'>
				<h1>ARC LOOTER</h1>
				{/* <LogoWordmark /> */}
				<p>
					Raider's looting handguide. Browse loot, peek at recycle parts, and
					compare sell value.
				</p>
			</header>
			<section className='search-bar flex flex-col'>
				<div className='search-row'>
					<input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						className='search-field'
						type='search'
						placeholder='Search by name, rarity, or parts…'
						aria-label='Filter loot items'
					/>
					<div className='sort-menu-wrapper' ref={sortMenuRef}>
						<button
							type='button'
							className='sort-button'
							onClick={() => setIsSortMenuOpen((current) => !current)}
							aria-haspopup='menu'
							aria-expanded={isSortMenuOpen}
						>
							{currentSortLabel}
						</button>
						{isSortMenuOpen && (
							<div className='sort-options' role='menu'>
								{sortOptions.map((option) => (
									<button
										key={option.value}
										type='button'
										className={`sort-option-button ${
											sortBy === option.value ? 'active' : ''
										}`}
										onClick={() => handleSortSelection(option.value)}
										aria-pressed={sortBy === option.value}
									>
										{option.label}
									</button>
								))}
							</div>
						)}
					</div>
				</div>
				<div className='rarity-filters' aria-label='Filter loot by rarity'>
					<button
						type='button'
						className={`rarity-filter-button ${
							!activeRarity ? 'active' : ''
						} rarity-label`}
						onClick={() => handleRarityClick('')}
						aria-pressed={!activeRarity}
					>
						All
					</button>
					{rarityOrder.map((rarity) => {
						const palette = rarityPalette[rarity];
						return (
							<button
								key={rarity}
								type='button'
								className={`rarity-filter-button ${
									activeRarity === rarity ? 'active' : ''
								} rarity-label`}
								style={{ backgroundColor: palette.background }}
								onClick={() => handleRarityClick(rarity)}
								aria-pressed={activeRarity === rarity}
							>
								{formatTitleCase(rarity)}
							</button>
						);
					})}
				</div>
			</section>
			<main>
				<div className='grid' aria-live='polite'>
					{filteredLoot.map((item) => (
						<LootTile
							key={item.name}
							item={item}
							onClick={() => handleSelect(item)}
						/>
					))}
				</div>
			</main>
			<footer className='flex flex-col'>
				<span>Enjoy!</span>
				<span>
					&copy; 2025 <a href='https://www.x.com/iam_cro'>crøwexx</a>. v
					{packageInfo.version}
				</span>
				<a href='https://www.paypal.com/donate/?hosted_button_id=75NRXSYSWHT9N'>
					Donate to help cover server costs ♥
				</a>
			</footer>
			{selected && (
				<DetailModal
					item={selected}
					onClose={() => setSelected(null)}
					onReport={handleReportClick}
				/>
			)}
			{feedbackItem && (
				<FeedbackModal
					item={feedbackItem}
					onClose={() => setFeedbackItem(null)}
					apiBaseUrl={apiBaseUrl}
				/>
			)}
		</div>
	);
}
