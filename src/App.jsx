import { memo, useMemo, useState, useCallback } from 'react';
import lootData from './data/loot.json';
import './App.css';

const rarityPalette = {
  legendary: { background: '#fbc700' },
  epic: { background: '#d8299b' },
  rare: { background: '#1ecbfc' },
  uncommon: { background: '#41eb6a' },
  common: { background: '#717471' },
};
const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

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

function RarityLabel({ rarity }) {
  const key = (rarity || 'common').toLowerCase();
  const palette = rarityPalette[key] || rarityPalette.common;

  return (
    <span
      className='rarity-label'
      style={{
        backgroundColor: palette.background,
      }}
    >
      {rarity || 'Unknown'}
    </span>
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
      <ProgressiveImage src={item.image} alt={item.name} loading='lazy' />
      <div className='tile-content flex flex-col'>
        <RarityLabel rarity={item.rarity} />
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

function DetailModal({ item, onClose }) {
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
        <ProgressiveImage src={item.image} alt={item.name} loading='lazy' />
        <hr />
        <RarityLabel rarity={item.rarity} />
        <h3>{item.name}</h3>
        <div className='tile-recycles flex flex-col'>
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
        {item.keepForQuestsWorkshop.length && (
          <p className='flex flex-col keepfor'>
            Should Keep For:
            {item.keepForQuestsWorkshop.map((keep, i) => (
              <span key={`${item.name}-keepfor-${i}`}>{keep}</span>
            ))}
          </p>
        )}
        <p className='coin-price value-tag'>{formatCurrency(item.value)}</p>
        <button className='close' onClick={onClose} aria-label='Close'>
          ×
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [activeRarity, setActiveRarity] = useState('');
  const sortedLoot = useMemo(
    () => [...lootData].sort((a, b) => b.name - a.name),
    []
  );
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

  return (
    <div className='page'>
      <header className='hero'>
        <h1>ARC LOOTERS</h1>
        <p>
          Raider's looting handguide. Browse loot, peek at recycle parts, and
          compare sell value.
        </p>
      </header>
      <section className='search-bar'>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className='search-field'
          type='search'
          placeholder='Search by name, rarity, or parts…'
          aria-label='Filter loot items'
        />
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
        <span>&copy; 2025 crøwexx</span>
        <a href='https://www.paypal.com/donate/?hosted_button_id=75NRXSYSWHT9N'>
          Donate
        </a>
      </footer>
      {selected && (
        <DetailModal item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
