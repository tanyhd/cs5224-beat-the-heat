import Button from '@/common/components/Button';
import SubDetails from '@/common/components/SubDetails';
import Clock from '@/common/icons/Clock';
import DollarSign from '@/common/icons/DollarSign';
import Info from '@/common/icons/Info';
import ShoppingCart from '@/common/icons/ShoppingCart';
import styles from './ChallengeHub.module.css'
import TableRow from '@/common/components/TableRow';
import AvatarPlus from '@/common/icons/AvatarPlus';
import Avatar from '@/common/icons/Avatar';

export interface Challenge {
  _id?: MongoId;
  title?: string;
  description?: string;
  dateTime?: string; // keep as plain string
  imgUrl?: string;
  href?: string;
  fee?: string; // default to 'Free' if empty
  source?: string; // e.g. 'nparks' | 'healthhub'
}

type MongoId = string | { $oid: string };

function keyFromId(id: MongoId | undefined, fallback: string) {
  if (!id) return fallback;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && '$oid' in id && typeof id.$oid === 'string') return id.$oid;
  return fallback;
}

function firstNonEmpty<T = string>(...vals: (T | undefined | null)[]) {
  for (const v of vals) {
    if (typeof v === 'string') {
      if ((v as string).trim()) return (v as unknown) as T;
    } else if (v != null) {
      return v as T;
    }
  }
  return undefined;
}

export default function Challenges({ challenges }: { challenges: Challenge[] }) {
  if (!Array.isArray(challenges) || challenges.length === 0) {
    return <div style={{ padding: 16 }}>No items found.</div>;
  }

  return (
    <div className={styles?.grid ?? ''} style={{ display: 'grid', gap: 24 }}>
      {challenges.map((item, index) => {
        const key = keyFromId(item._id, String(index));

        const title = firstNonEmpty(item.title, 'Untitled') as string;
        const href = firstNonEmpty(item.href, '#') as string;
        const img = firstNonEmpty(item.imgUrl) as string | undefined;
        const desc = firstNonEmpty(item.description) as string | undefined;
        const dateTime = firstNonEmpty(item.dateTime) as string | undefined;
        const fee = (firstNonEmpty(item.fee) as string | undefined)?.trim() || 'Free';
        const source = (firstNonEmpty(item.source) as string | undefined) || '';

        return (
          <article
            key={key}
            className={styles?.card ?? ''}
            style={{
              border: '4px solid #D1EEF8',
              borderRadius: 12,
              background: '#fff',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Top row badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {source ? (
                <span
                  className={styles?.badge ?? ''}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#f5f5f5',
                    textTransform: 'uppercase',
                  }}
                >
                  {source}
                </span>
              ) : (
                <span />
              )}

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#FFF3E8',
                  color: '#C84A07',
                }}
                aria-label="Fee"
              >
                {fee}
              </span>
            </div>

            <h3 className={styles?.title ?? ''} style={{ margin: '4px 0 0' }}>
              {href && href !== '#' ? (
                <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  {title}
                </a>
              ) : (
                title
              )}
            </h3>

            {img && (
              <img
                src={img}
                alt={item.title || 'event image'}
                style={{ width: '100%', maxWidth: 520, borderRadius: 10, display: 'block' }}
                loading="lazy"
              />
            )}

            {dateTime && (
              <p style={{ margin: 0, color: '#444', fontWeight: 600 }}>{dateTime}</p>
            )}

            {desc && <p style={{ margin: 0, lineHeight: 1.5 }}>{desc}</p>}

            {href && href !== '#' && (
              <div style={{ marginTop: 8 }} className={styles.buttonGroup}>
                <Button
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  variant="primary"
                  classNameProps={styles?.button}
                >
                  Open details
                </Button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}